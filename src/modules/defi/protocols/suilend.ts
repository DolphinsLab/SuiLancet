import { SuiClient } from "@mysten/sui/client"
import { LendingPosition, LendingAsset } from "../types"
import { SUILEND } from "../constants"

/**
 * Suilend position adapter.
 * Scans wallet for Obligation objects and parses deposit/borrow positions.
 */
export async function fetchSuilendPositions(
  client: SuiClient,
  walletAddress: string
): Promise<LendingPosition[]> {
  const positions: LendingPosition[] = []

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

      if (
        obj.data.type.includes(SUILEND.PACKAGE) &&
        obj.data.type.includes(SUILEND.OBLIGATION_TYPE_PATTERN)
      ) {
        const position = parseSuilendObligation(obj.data)
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

function parseSuilendObligation(objectData: any): LendingPosition | null {
  const content = objectData.content
  if (!content || content.dataType !== "moveObject") return null

  const fields = content.fields as any
  if (!fields) return null

  const deposits: LendingAsset[] = []
  const borrows: LendingAsset[] = []

  // Suilend stores deposits/borrows in vector fields
  if (fields.deposits) {
    const depList = Array.isArray(fields.deposits)
      ? fields.deposits
      : fields.deposits?.fields?.contents || []
    for (const dep of depList) {
      const asset = parseSuilendAsset(dep, "deposit")
      if (asset) deposits.push(asset)
    }
  }

  if (fields.borrows) {
    const borList = Array.isArray(fields.borrows)
      ? fields.borrows
      : fields.borrows?.fields?.contents || []
    for (const bor of borList) {
      const asset = parseSuilendAsset(bor, "borrow")
      if (asset) borrows.push(asset)
    }
  }

  if (deposits.length === 0 && borrows.length === 0) return null

  return {
    protocol: SUILEND.NAME,
    category: "lending",
    objectId: objectData.objectId,
    objectType: objectData.type,
    deposits,
    borrows,
  }
}

function parseSuilendAsset(
  data: any,
  _type: "deposit" | "borrow"
): LendingAsset | null {
  if (!data) return null

  const fields = data.fields || data
  const coinType =
    fields.coin_type?.fields?.name ||
    fields.reserve_array_index?.toString() ||
    ""
  const amount = Number(
    fields.deposited_ctoken_amount ||
      fields.borrowed_amount ||
      fields.market_value ||
      0
  )

  if (amount === 0) return null

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
