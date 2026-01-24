import { SuiClient } from "@mysten/sui/client"
import { LPPosition } from "../types"
import { FLOWX } from "../constants"

/**
 * FlowX DEX LP position adapter.
 * FlowX uses standard AMM pairs with LPCoin tokens.
 */
export async function fetchFlowXPositions(
  client: SuiClient,
  walletAddress: string
): Promise<LPPosition[]> {
  const positions: LPPosition[] = []

  // Check balances for FlowX LP tokens
  const allBalances = await client.getAllBalances({ owner: walletAddress })

  for (const balance of allBalances) {
    const coinType = balance.coinType
    if (
      coinType.includes(FLOWX.PACKAGE) &&
      coinType.includes(FLOWX.LP_TOKEN_PATTERN)
    ) {
      const amount = Number(balance.totalBalance)
      if (amount > 0) {
        const typeParams = extractTypeParams(coinType)
        positions.push({
          protocol: FLOWX.NAME,
          category: "lp",
          poolId: "",
          tokenA: {
            coinType: typeParams[0] || "",
            symbol: extractSymbol(typeParams[0] || ""),
            amount,
            decimals: 9,
          },
          tokenB: {
            coinType: typeParams[1] || "",
            symbol: extractSymbol(typeParams[1] || ""),
            amount: 0,
            decimals: 9,
          },
          liquidity: amount.toString(),
        })
      }
    }
  }

  // Also scan for FlowX position objects
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
        typeStr.includes(FLOWX.PACKAGE) &&
        (typeStr.includes("::position::") || typeStr.includes("::pair::"))
      ) {
        const position = parseFlowXPosition(obj.data)
        if (position) positions.push(position)
      }
    }

    hasNext = ownedObjects.hasNextPage
    cursor = ownedObjects.nextCursor
  }

  return positions
}

function parseFlowXPosition(objectData: any): LPPosition | null {
  const content = objectData.content
  if (!content || content.dataType !== "moveObject") return null

  const fields = content.fields as any
  if (!fields) return null

  const typeParams = extractTypeParams(objectData.type)
  const liquidity = fields.liquidity?.toString() || fields.lp_amount?.toString() || "0"

  if (liquidity === "0") return null

  return {
    protocol: FLOWX.NAME,
    category: "lp",
    objectId: objectData.objectId,
    objectType: objectData.type,
    poolId: fields.pool_id || "",
    tokenA: {
      coinType: typeParams[0] || "",
      symbol: extractSymbol(typeParams[0] || ""),
      amount: Number(fields.coin_a || fields.balance_a || 0),
      decimals: 9,
    },
    tokenB: {
      coinType: typeParams[1] || "",
      symbol: extractSymbol(typeParams[1] || ""),
      amount: Number(fields.coin_b || fields.balance_b || 0),
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

function extractSymbol(coinType: string): string {
  if (!coinType) return "Unknown"
  return coinType.split("::").pop() || "Unknown"
}
