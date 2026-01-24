import { SuiClient } from "@mysten/sui/client"
import { LendingPosition, LendingAsset } from "../types"
import { BUCKET, SUI_TYPE } from "../constants"

/**
 * Bucket Protocol CDP adapter.
 * Bucket is a CDP protocol where users deposit SUI as collateral
 * and mint BUCK stablecoin. Positions are called "Bottles".
 */
export async function fetchBucketPositions(
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

      const typeStr = obj.data.type
      if (
        typeStr.includes(BUCKET.PACKAGE) &&
        typeStr.includes(BUCKET.BOTTLE_TYPE_PATTERN)
      ) {
        const position = parseBucketBottle(obj.data)
        if (position) positions.push(position)
      }
    }

    hasNext = ownedObjects.hasNextPage
    cursor = ownedObjects.nextCursor
  }

  return positions
}

function parseBucketBottle(objectData: any): LendingPosition | null {
  const content = objectData.content
  if (!content || content.dataType !== "moveObject") return null

  const fields = content.fields as any
  if (!fields) return null

  const deposits: LendingAsset[] = []
  const borrows: LendingAsset[] = []

  // Collateral (usually SUI)
  const collateralAmount = Number(
    fields.collateral_amount || fields.collateral || fields.sui_amount || 0
  )
  if (collateralAmount > 0) {
    // Extract collateral type from generic params if available
    const typeParams = extractTypeParams(objectData.type)
    const collateralType = typeParams[0] || SUI_TYPE

    deposits.push({
      coinType: collateralType,
      symbol: extractSymbol(collateralType),
      amount: collateralAmount,
      decimals: 9,
    })
  }

  // Debt (BUCK stablecoin)
  const debtAmount = Number(
    fields.buck_amount || fields.debt || fields.debt_amount || 0
  )
  if (debtAmount > 0) {
    borrows.push({
      coinType: BUCKET.BUCK_COIN_TYPE,
      symbol: "BUCK",
      amount: debtAmount,
      decimals: 9,
    })
  }

  if (deposits.length === 0 && borrows.length === 0) return null

  return {
    protocol: BUCKET.NAME,
    category: "lending",
    objectId: objectData.objectId,
    objectType: objectData.type,
    deposits,
    borrows,
  }
}

function extractTypeParams(typeStr: string): string[] {
  const match = typeStr.match(/<(.+)>/)
  if (!match) return []
  const inner = match[1]
  const params: string[] = []
  let depth = 0
  let current = ""
  for (const char of inner) {
    if (char === "<") depth++
    if (char === ">") depth--
    if (char === "," && depth === 0) {
      params.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  if (current.trim()) params.push(current.trim())
  return params
}

function extractSymbol(coinType: string): string {
  if (!coinType) return "Unknown"
  return coinType.split("::").pop() || "Unknown"
}
