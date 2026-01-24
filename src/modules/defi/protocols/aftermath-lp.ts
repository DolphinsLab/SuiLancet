import { SuiClient } from "@mysten/sui/client"
import { LPPosition, LPToken } from "../types"
import { AFTERMATH } from "../constants"

/**
 * Aftermath Finance LP position adapter.
 * Aftermath uses multi-asset weighted pools (similar to Balancer).
 * LP tokens are AfLpCoin objects that represent pool shares.
 */
export async function fetchAftermathPositions(
  client: SuiClient,
  walletAddress: string
): Promise<LPPosition[]> {
  const positions: LPPosition[] = []

  // Check balances for AfLpCoin tokens
  const allBalances = await client.getAllBalances({ owner: walletAddress })

  for (const balance of allBalances) {
    const coinType = balance.coinType
    if (
      coinType.includes(AFTERMATH.PACKAGE) &&
      coinType.includes(AFTERMATH.LP_COIN_PATTERN)
    ) {
      const amount = Number(balance.totalBalance)
      if (amount > 0) {
        // Extract pool type params from the LP coin type
        const typeParams = extractTypeParams(coinType)
        positions.push({
          protocol: AFTERMATH.NAME,
          category: "lp",
          poolId: extractPoolId(coinType),
          tokenA: {
            coinType: typeParams[0] || coinType,
            symbol: extractSymbol(typeParams[0] || coinType),
            amount,
            decimals: 9,
          },
          tokenB: {
            coinType: typeParams[1] || "",
            symbol: typeParams[1] ? extractSymbol(typeParams[1]) : "Multi",
            amount: 0,
            decimals: 9,
          },
          liquidity: amount.toString(),
        })
      }
    }
  }

  // Also scan owned objects for Aftermath LP position NFTs
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
        typeStr.includes(AFTERMATH.PACKAGE) &&
        typeStr.includes(AFTERMATH.POOL_TYPE_PATTERN)
      ) {
        const position = parseAftermathPool(obj.data)
        if (position) positions.push(position)
      }
    }

    hasNext = ownedObjects.hasNextPage
    cursor = ownedObjects.nextCursor
  }

  return positions
}

function parseAftermathPool(objectData: any): LPPosition | null {
  const content = objectData.content
  if (!content || content.dataType !== "moveObject") return null

  const fields = content.fields as any
  if (!fields) return null

  const typeParams = extractTypeParams(objectData.type)
  const liquidity = fields.lp_supply?.toString() || fields.liquidity?.toString() || "0"

  if (liquidity === "0") return null

  return {
    protocol: AFTERMATH.NAME,
    category: "lp",
    objectId: objectData.objectId,
    objectType: objectData.type,
    poolId: objectData.objectId,
    tokenA: {
      coinType: typeParams[0] || "",
      symbol: extractSymbol(typeParams[0] || ""),
      amount: Number(fields.balance_a || fields.coin_a || 0),
      decimals: 9,
    },
    tokenB: {
      coinType: typeParams[1] || "",
      symbol: extractSymbol(typeParams[1] || ""),
      amount: Number(fields.balance_b || fields.coin_b || 0),
      decimals: 9,
    },
    liquidity,
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

function extractPoolId(coinType: string): string {
  // Try to extract a meaningful pool identifier from the type
  const parts = coinType.split("::")
  return parts.length > 1 ? parts[parts.length - 1] : coinType.slice(0, 20)
}

function extractSymbol(coinType: string): string {
  if (!coinType) return "Unknown"
  return coinType.split("::").pop() || "Unknown"
}
