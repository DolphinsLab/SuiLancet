import { SuiScriptClient } from "../../core"
import { CoinObject, CommandResult } from "../../core/types"

export interface CoinSummary {
  coinType: string
  count: number
  totalBalance: number
}

export async function getAssetOverview(
  client: SuiScriptClient
): Promise<CommandResult> {
  const allCoins = await client.getAllCoins()

  const grouped = allCoins.reduce(
    (acc, coin) => {
      if (!acc[coin.coinType]) {
        acc[coin.coinType] = { coinType: coin.coinType, count: 0, totalBalance: 0 }
      }
      acc[coin.coinType].count++
      acc[coin.coinType].totalBalance += coin.balance
      return acc
    },
    {} as Record<string, CoinSummary>
  )

  const summary = Object.values(grouped).sort(
    (a, b) => b.totalBalance - a.totalBalance
  )

  return {
    success: true,
    message: `Found ${allCoins.length} coins across ${summary.length} types`,
    data: { coins: allCoins, summary },
  }
}

export async function getSpecialAmountCoins(
  client: SuiScriptClient,
  minAmount: number,
  maxAmount: number,
  coinType: string
): Promise<CommandResult> {
  const coins = await client.getCoinsByTypeV2(coinType)
  const filtered = coins.filter(
    (coin) => coin.balance >= minAmount && coin.balance <= maxAmount
  )

  return {
    success: true,
    message: `Found ${filtered.length} coins in range [${minAmount}, ${maxAmount}]`,
    data: filtered.map((coin) => coin.objectId),
  }
}
