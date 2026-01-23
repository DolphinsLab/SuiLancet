import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../core"
import { getObjectRef } from "../../common/object"
import { CommandResult } from "../../core/types"

const SUI_TYPE =
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"

export async function mergeCoins(
  client: SuiScriptClient,
  coinType: string,
  options: {
    gasObject?: string
    dryRun?: boolean
  } = {}
): Promise<CommandResult> {
  const coins = await client.getCoinsByType(coinType)
  const isSUI = coinType === SUI_TYPE

  if (coins.length <= 1) {
    return { success: true, message: "No coins to merge (need at least 2)" }
  }

  const maxCount = Math.min(coins.length, 1200)
  console.log(`Merging ${maxCount} ${coinType} coins`)

  if (options.dryRun) {
    return {
      success: true,
      message: `[Dry Run] Would merge ${maxCount} coins of type ${coinType}`,
      data: { count: maxCount, coinType },
    }
  }

  const batchSize = 50
  const txb = new Transaction()

  if (options.gasObject) {
    const gasObjectRef = await getObjectRef(client, options.gasObject)
    txb.setGasPayment([gasObjectRef])
  }

  const remainCoins = coins.slice(1, maxCount)
  const resultCoins: TransactionObjectArgument[] = []

  for (let i = 0; i < remainCoins.length; i += batchSize) {
    const batchCoins = remainCoins.slice(i + 1, i + batchSize)
    if (batchCoins.length === 0) continue

    const waitMergeCoins = batchCoins.map((coin) => txb.object(coin.objectId))
    const mergedCoin = txb.object(remainCoins[i].objectId)
    txb.mergeCoins(mergedCoin, waitMergeCoins)
    resultCoins.push(mergedCoin)
  }

  if (resultCoins.length === 0) {
    return { success: true, message: "No coins to merge after batching" }
  }

  if (isSUI) {
    txb.mergeCoins(txb.gas, resultCoins)
  } else {
    txb.mergeCoins(txb.object(coins[0].objectId), resultCoins)
  }

  const txRes = await client.sendTransaction(txb)
  return {
    success: true,
    message: `Merged ${maxCount} coins into 1`,
    data: { digest: txRes?.digest, merged: maxCount },
  }
}
