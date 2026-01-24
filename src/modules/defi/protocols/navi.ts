import { SuiClient } from "@mysten/sui/client"
import { LendingPosition, LendingAsset } from "../types"
import { NAVI } from "../constants"

/**
 * NAVI Protocol position adapter.
 * Scans wallet for Obligation objects and parses deposit/borrow positions.
 */
export async function fetchNaviPositions(
  client: SuiClient,
  walletAddress: string
): Promise<LendingPosition[]> {
  const positions: LendingPosition[] = []

  // Find all obligation objects owned by this wallet
  let cursor: string | null | undefined = null
  let hasNext = true

  while (hasNext) {
    const ownedObjects = await client.getOwnedObjects({
      owner: walletAddress,
      cursor: cursor ?? undefined,
      options: { showType: true, showContent: true },
      limit: 50,
    })

    for (const obj of ownedObjects.data) {
      if (!obj.data?.type) continue

      // Match NAVI obligation objects
      if (
        obj.data.type.includes(NAVI.PACKAGE) &&
        obj.data.type.includes(NAVI.OBLIGATION_TYPE_PATTERN)
      ) {
        const position = parseNaviObligation(obj.data)
        if (position) {
          positions.push(position)
        }
      }
    }

    hasNext = ownedObjects.hasNextPage
    cursor = ownedObjects.nextCursor
  }

  return positions
}

function parseNaviObligation(objectData: any): LendingPosition | null {
  const content = objectData.content
  if (!content || content.dataType !== "moveObject") return null

  const fields = content.fields as any
  if (!fields) return null

  const deposits: LendingAsset[] = []
  const borrows: LendingAsset[] = []

  // Parse deposit positions from dynamic fields
  if (fields.deposits || fields.collaterals) {
    const depositData = fields.deposits || fields.collaterals
    if (Array.isArray(depositData)) {
      for (const dep of depositData) {
        const asset = parseLendingAsset(dep)
        if (asset) deposits.push(asset)
      }
    } else if (depositData?.fields?.contents) {
      for (const dep of depositData.fields.contents) {
        const asset = parseLendingAsset(dep)
        if (asset) deposits.push(asset)
      }
    }
  }

  // Parse borrow positions
  if (fields.borrows || fields.debts) {
    const borrowData = fields.borrows || fields.debts
    if (Array.isArray(borrowData)) {
      for (const bor of borrowData) {
        const asset = parseLendingAsset(bor)
        if (asset) borrows.push(asset)
      }
    } else if (borrowData?.fields?.contents) {
      for (const bor of borrowData.fields.contents) {
        const asset = parseLendingAsset(bor)
        if (asset) borrows.push(asset)
      }
    }
  }

  // Only return if there are actual positions
  if (deposits.length === 0 && borrows.length === 0) return null

  return {
    protocol: NAVI.NAME,
    category: "lending",
    objectId: objectData.objectId,
    objectType: objectData.type,
    deposits,
    borrows,
  }
}

function parseLendingAsset(data: any): LendingAsset | null {
  if (!data) return null

  const fields = data.fields || data
  const coinType = fields.coin_type || fields.type?.fields?.name || ""
  const amount = Number(fields.amount || fields.value || fields.balance || 0)

  if (amount === 0 && !coinType) return null

  return {
    coinType,
    symbol: extractSymbol(coinType),
    amount,
    decimals: 9,
  }
}

function extractSymbol(coinType: string): string {
  if (!coinType) return "Unknown"
  const parts = coinType.split("::")
  return parts[parts.length - 1] || "Unknown"
}
