import type { ClientWithCoreApi } from "@mysten/sui/client"
import { LPPosition, LPToken } from "../types"
import { CETUS } from "../constants"
import { listOwnedMoveObjects } from "../owned-objects"

/**
 * Cetus CLMM LP position adapter.
 * Scans wallet for Position NFT objects that represent concentrated liquidity positions.
 */
export async function fetchCetusPositions(
  client: ClientWithCoreApi,
  walletAddress: string
): Promise<LPPosition[]> {
  const positions: LPPosition[] = []

  for (const object of await listOwnedMoveObjects(client, walletAddress)) {
      // Match Cetus position NFTs
      const typeStr = object.type
      if (
        (typeStr.includes(CETUS.PACKAGE) ||
          typeStr.includes(CETUS.CLMM_PACKAGE)) &&
        typeStr.includes(CETUS.POSITION_TYPE_PATTERN)
      ) {
        const position = parseCetusPosition(object)
        if (position) {
          positions.push(position)
        }
      }
  }

  return positions
}

function parseCetusPosition(objectData: any): LPPosition | null {
  const fields = objectData.fields as any
  if (!fields) return null

  // Extract type parameters from the Position type
  // Format: ...::position::Position<CoinTypeA, CoinTypeB>
  const typeParams = extractTypeParams(objectData.type)
  const coinTypeA = typeParams[0] || ""
  const coinTypeB = typeParams[1] || ""

  const poolId = fields.pool || fields.pool_id || ""
  const liquidity = fields.liquidity?.toString() || "0"
  const tickLower = Number(fields.tick_lower_index?.fields?.bits ?? fields.tick_lower ?? 0)
  const tickUpper = Number(fields.tick_upper_index?.fields?.bits ?? fields.tick_upper ?? 0)

  // Parse coin amounts if available
  const coinAmountA = Number(fields.coin_a || 0)
  const coinAmountB = Number(fields.coin_b || 0)

  if (liquidity === "0") return null

  const tokenA: LPToken = {
    coinType: coinTypeA,
    symbol: extractSymbol(coinTypeA),
    amount: coinAmountA,
    decimals: 9,
  }

  const tokenB: LPToken = {
    coinType: coinTypeB,
    symbol: extractSymbol(coinTypeB),
    amount: coinAmountB,
    decimals: 9,
  }

  return {
    protocol: CETUS.NAME,
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

/**
 * Extract generic type parameters from a Move type string.
 * e.g., "0x...::position::Position<0x...::sui::SUI, 0x...::usdc::USDC>"
 * returns ["0x...::sui::SUI", "0x...::usdc::USDC"]
 */
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
