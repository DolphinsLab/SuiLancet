import { SuiClient } from "@mysten/sui/client"
import { LPPosition } from "../types"
import { KRIYA } from "../constants"

/**
 * Kriya DEX LP position adapter.
 * Kriya uses both AMM pools and CLMM positions.
 * LP tokens are KriyaLPToken objects.
 */
export async function fetchKriyaPositions(
  client: SuiClient,
  walletAddress: string
): Promise<LPPosition[]> {
  const positions: LPPosition[] = []

  // Scan owned objects for Kriya LP tokens and positions
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

      // Kriya LP tokens
      if (
        typeStr.includes(KRIYA.PACKAGE) &&
        typeStr.includes(KRIYA.LP_TOKEN_PATTERN)
      ) {
        const position = parseKriyaLPToken(obj.data)
        if (position) positions.push(position)
      }
      // Kriya CLMM positions
      else if (
        typeStr.includes(KRIYA.PACKAGE) &&
        typeStr.includes(KRIYA.POSITION_TYPE_PATTERN)
      ) {
        const position = parseKriyaPosition(obj.data)
        if (position) positions.push(position)
      }
    }

    hasNext = ownedObjects.hasNextPage
    cursor = ownedObjects.nextCursor
  }

  // Also check balances for Kriya LP coins
  const allBalances = await client.getAllBalances({ owner: walletAddress })
  for (const balance of allBalances) {
    if (
      balance.coinType.includes(KRIYA.PACKAGE) &&
      balance.coinType.toLowerCase().includes("lp")
    ) {
      const amount = Number(balance.totalBalance)
      if (amount > 0) {
        const typeParams = extractTypeParams(balance.coinType)
        positions.push({
          protocol: KRIYA.NAME,
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

  return positions
}

function parseKriyaLPToken(objectData: any): LPPosition | null {
  const content = objectData.content
  if (!content || content.dataType !== "moveObject") return null

  const fields = content.fields as any
  if (!fields) return null

  const typeParams = extractTypeParams(objectData.type)
  const liquidity =
    fields.lp_amount?.toString() || fields.balance?.toString() || "0"

  if (liquidity === "0") return null

  return {
    protocol: KRIYA.NAME,
    category: "lp",
    objectId: objectData.objectId,
    objectType: objectData.type,
    poolId: fields.pool_id || "",
    tokenA: {
      coinType: typeParams[0] || "",
      symbol: extractSymbol(typeParams[0] || ""),
      amount: Number(fields.coin_a_amount || 0),
      decimals: 9,
    },
    tokenB: {
      coinType: typeParams[1] || "",
      symbol: extractSymbol(typeParams[1] || ""),
      amount: Number(fields.coin_b_amount || 0),
      decimals: 9,
    },
    liquidity,
  }
}

function parseKriyaPosition(objectData: any): LPPosition | null {
  const content = objectData.content
  if (!content || content.dataType !== "moveObject") return null

  const fields = content.fields as any
  if (!fields) return null

  const typeParams = extractTypeParams(objectData.type)
  const liquidity = fields.liquidity?.toString() || "0"

  if (liquidity === "0") return null

  return {
    protocol: KRIYA.NAME,
    category: "lp",
    objectId: objectData.objectId,
    objectType: objectData.type,
    poolId: fields.pool_id || "",
    tokenA: {
      coinType: typeParams[0] || "",
      symbol: extractSymbol(typeParams[0] || ""),
      amount: Number(fields.coin_a || 0),
      decimals: 9,
    },
    tokenB: {
      coinType: typeParams[1] || "",
      symbol: extractSymbol(typeParams[1] || ""),
      amount: Number(fields.coin_b || 0),
      decimals: 9,
    },
    liquidity,
    tickLower: fields.tick_lower != null ? Number(fields.tick_lower) : undefined,
    tickUpper: fields.tick_upper != null ? Number(fields.tick_upper) : undefined,
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
