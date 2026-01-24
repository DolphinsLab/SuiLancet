import { SuiClient } from "@mysten/sui/client"
import { LPPosition, LPToken } from "../types"
import { TURBOS } from "../constants"

/**
 * Turbos Finance LP position adapter.
 * Scans wallet for TurbosPositionNFT objects.
 */
export async function fetchTurbosPositions(
  client: SuiClient,
  walletAddress: string
): Promise<LPPosition[]> {
  const positions: LPPosition[] = []

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
        typeStr.includes(TURBOS.PACKAGE) &&
        typeStr.includes(TURBOS.POSITION_TYPE_PATTERN)
      ) {
        const position = parseTurbosPosition(obj.data)
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

function parseTurbosPosition(objectData: any): LPPosition | null {
  const content = objectData.content
  if (!content || content.dataType !== "moveObject") return null

  const fields = content.fields as any
  if (!fields) return null

  // Extract type parameters
  const typeParams = extractTypeParams(objectData.type)
  const coinTypeA = typeParams[0] || ""
  const coinTypeB = typeParams[1] || ""

  const poolId = fields.pool_id || ""
  const liquidity = fields.liquidity?.toString() || "0"
  const tickLower = Number(fields.tick_lower_index ?? 0)
  const tickUpper = Number(fields.tick_upper_index ?? 0)

  if (liquidity === "0") return null

  const tokenA: LPToken = {
    coinType: coinTypeA,
    symbol: extractSymbol(coinTypeA),
    amount: 0, // Turbos doesn't store coin amounts directly in position
    decimals: 9,
  }

  const tokenB: LPToken = {
    coinType: coinTypeB,
    symbol: extractSymbol(coinTypeB),
    amount: 0,
    decimals: 9,
  }

  return {
    protocol: TURBOS.NAME,
    category: "lp",
    objectId: objectData.objectId,
    objectType: objectData.type,
    poolId,
    tokenA,
    tokenB,
    liquidity,
    tickLower,
    tickUpper,
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
  if (current.trim()) {
    params.push(current.trim())
  }

  return params
}

function extractSymbol(coinType: string): string {
  if (!coinType) return "Unknown"
  const parts = coinType.split("::")
  return parts[parts.length - 1] || "Unknown"
}
