import { SuiClient } from "@mysten/sui/client"
import { LendingPosition, LendingAsset } from "../types"
import { SCALLOP } from "../constants"

/**
 * Scallop position adapter.
 * Scans wallet for Obligation objects and MarketCoin (sCoin) holdings.
 */
export async function fetchScallopPositions(
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

      // Match Scallop obligation objects
      if (
        obj.data.type.includes(SCALLOP.PACKAGE) &&
        obj.data.type.includes(SCALLOP.OBLIGATION_TYPE_PATTERN)
      ) {
        const position = parseScallopObligation(obj.data)
        if (position) {
          positions.push(position)
        }
      }
    }

    hasNext = ownedObjects.hasNextPage
    cursor = ownedObjects.nextCursor
  }

  // Also check for sCoin (MarketCoin) balances as deposit receipts
  const sCoinPositions = await fetchScallopMarketCoins(client, walletAddress)
  if (sCoinPositions) {
    positions.push(sCoinPositions)
  }

  return positions
}

function parseScallopObligation(objectData: any): LendingPosition | null {
  const content = objectData.content
  if (!content || content.dataType !== "moveObject") return null

  const fields = content.fields as any
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
  client: SuiClient,
  walletAddress: string
): Promise<LendingPosition | null> {
  const deposits: LendingAsset[] = []

  // Get all coin balances and filter for sCoin patterns
  const allBalances = await client.getAllBalances({ owner: walletAddress })

  for (const balance of allBalances) {
    // sCoin types typically contain "scoin" or "market_coin" in the type
    const coinType = balance.coinType.toLowerCase()
    if (
      coinType.includes("scallop") ||
      coinType.includes("scoin") ||
      coinType.includes("market_coin")
    ) {
      const amount = Number(balance.totalBalance)
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
