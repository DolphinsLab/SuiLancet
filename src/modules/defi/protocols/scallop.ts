import type { ClientWithCoreApi } from "@mysten/sui/client"
import { listAllBalances } from "../../../common/balance"
import { LendingPosition, LendingAsset } from "../types"
import { SCALLOP } from "../constants"
import { listOwnedMoveObjects } from "../owned-objects"

/**
 * Scallop position adapter.
 * Scans wallet for Obligation objects and MarketCoin (sCoin) holdings.
 */
export async function fetchScallopPositions(
  client: ClientWithCoreApi,
  walletAddress: string
): Promise<LendingPosition[]> {
  const positions: LendingPosition[] = []

  for (const object of await listOwnedMoveObjects(client, walletAddress)) {
      // Match Scallop obligation objects
      if (
        object.type.includes(SCALLOP.PACKAGE) &&
        object.type.includes(SCALLOP.OBLIGATION_TYPE_PATTERN)
      ) {
        const position = parseScallopObligation(object)
        if (position) {
          positions.push(position)
        }
      }
  }

  // Also check for sCoin (MarketCoin) balances as deposit receipts
  const sCoinPositions = await fetchScallopMarketCoins(client, walletAddress)
  if (sCoinPositions) {
    positions.push(sCoinPositions)
  }

  return positions
}

function parseScallopObligation(objectData: any): LendingPosition | null {
  const fields = objectData.fields as any
  if (!fields) return null

  const deposits: LendingAsset[] = []
  const borrows: LendingAsset[] = []

  // Parse collaterals
  if (fields.collaterals) {
    const collList = Array.isArray(fields.collaterals)
      ? fields.collaterals
      : fields.collaterals?.fields?.contents || []
    for (const col of collList) {
      const asset = parseScallopAsset(col)
      if (asset) deposits.push(asset)
    }
  }

  // Parse debts
  if (fields.debts) {
    const debtList = Array.isArray(fields.debts)
      ? fields.debts
      : fields.debts?.fields?.contents || []
    for (const debt of debtList) {
      const asset = parseScallopAsset(debt)
      if (asset) borrows.push(asset)
    }
  }

  if (deposits.length === 0 && borrows.length === 0) return null

  return {
    protocol: SCALLOP.NAME,
    category: "lending",
    objectId: objectData.objectId,
    objectType: objectData.type,
    deposits,
    borrows,
  }
}

/**
 * Fetch sCoin (MarketCoin) balances - these represent lending deposits.
 * sCoins are fungible tokens that represent deposited assets.
 */
async function fetchScallopMarketCoins(
  client: ClientWithCoreApi,
  walletAddress: string
): Promise<LendingPosition | null> {
  const deposits: LendingAsset[] = []

  // Get all coin balances and filter for sCoin patterns
  const allBalances = await listAllBalances(client, walletAddress)

  for (const balance of allBalances) {
    // sCoin types typically contain "scoin" or "market_coin" in the type
    const coinType = balance.coinType.toLowerCase()
    if (
      coinType.includes("scallop") ||
      coinType.includes("scoin") ||
      coinType.includes("market_coin")
    ) {
      const amount = Number(balance.balance)
      if (amount > 0) {
        deposits.push({
          coinType: balance.coinType,
          symbol: extractSymbol(balance.coinType),
          amount,
          decimals: 9,
        })
      }
    }
  }

  if (deposits.length === 0) return null

  return {
    protocol: SCALLOP.NAME,
    category: "lending",
    deposits,
    borrows: [],
  }
}

function parseScallopAsset(data: any): LendingAsset | null {
  if (!data) return null

  const fields = data.fields || data
  const coinType = fields.type?.fields?.name || fields.coin_type || ""
  const amount = Number(fields.amount || fields.value || 0)

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
