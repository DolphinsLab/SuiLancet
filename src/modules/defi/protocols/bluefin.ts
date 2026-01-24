import { SuiClient } from "@mysten/sui/client"
import { PerpsPosition } from "../types"
import { BLUEFIN } from "../constants"

/**
 * Bluefin perpetual futures position adapter.
 * Scans wallet for TraderAccount and Position objects.
 * Bluefin supports up to 50x leverage on BTC/ETH/SUI perps.
 */
export async function fetchBluefinPositions(
  client: SuiClient,
  walletAddress: string
): Promise<PerpsPosition[]> {
  const positions: PerpsPosition[] = []

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

      // Match Bluefin position objects
      if (
        typeStr.includes(BLUEFIN.PACKAGE) &&
        (typeStr.includes(BLUEFIN.POSITION_TYPE_PATTERN) ||
          typeStr.includes(BLUEFIN.ACCOUNT_TYPE_PATTERN))
      ) {
        const position = parseBluefinPosition(obj.data)
        if (position) positions.push(position)
      }
    }

    hasNext = ownedObjects.hasNextPage
    cursor = ownedObjects.nextCursor
  }

  return positions
}

function parseBluefinPosition(objectData: any): PerpsPosition | null {
  const content = objectData.content
  if (!content || content.dataType !== "moveObject") return null

  const fields = content.fields as any
  if (!fields) return null

  // Parse position fields
  const size = Number(fields.q_pos || fields.size || fields.quantity || 0)
  if (size === 0 && !fields.margin) return null

  const margin = Number(fields.margin || fields.collateral || 0)
  const entryPrice = Number(fields.entry_price || fields.avg_entry_price || 0)
  const markPrice = Number(fields.mark_price || 0)
  const isLong = fields.is_long != null ? Boolean(fields.is_long) : (fields.side != null ? fields.side === "long" : size > 0)

  // Extract market name from type params or fields
  const market = fields.market_name || fields.perpetual || extractMarket(objectData.type)

  // Calculate unrealized PnL if we have enough data
  let unrealizedPnl: number | undefined
  if (entryPrice > 0 && markPrice > 0 && size !== 0) {
    const priceDiff = isLong
      ? markPrice - entryPrice
      : entryPrice - markPrice
    unrealizedPnl = (Math.abs(size) / 1e9) * (priceDiff / 1e9)
  }

  // Determine leverage
  const leverage = fields.leverage
    ? Number(fields.leverage) / 1e9
    : margin > 0
      ? Math.abs(size) / margin
      : undefined

  return {
    protocol: BLUEFIN.NAME,
    category: "perps",
    objectId: objectData.objectId,
    objectType: objectData.type,
    market,
    side: isLong ? "long" : "short",
    size: Math.abs(size),
    entryPrice: entryPrice > 0 ? entryPrice : undefined,
    markPrice: markPrice > 0 ? markPrice : undefined,
    margin,
    leverage,
    unrealizedPnl,
    marginToken: "USDC",
    decimals: 6, // Bluefin uses USDC (6 decimals) for margin
  }
}

function extractMarket(typeStr: string): string {
  // Try to extract market from type parameters
  const typeParams = extractTypeParams(typeStr)
  if (typeParams.length > 0) {
    const lastPart = typeParams[0].split("::").pop() || ""
    // Common market identifiers
    if (lastPart.includes("BTC")) return "BTC-PERP"
    if (lastPart.includes("ETH")) return "ETH-PERP"
    if (lastPart.includes("SUI")) return "SUI-PERP"
    if (lastPart.includes("SOL")) return "SOL-PERP"
    return lastPart || "Unknown"
  }
  return "Unknown"
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
