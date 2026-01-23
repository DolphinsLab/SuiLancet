import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../core"
import { destoryZeroCoin } from "../../movecall"
import { getObjectRef } from "../../common/object"
import { sleep } from "../../common"
import { CommandResult } from "../../core/types"

export async function batchDestroyZeroCoin(
  client: SuiScriptClient,
  options: {
    gasBudget?: number
    gasObject?: string
    dryRun?: boolean
  } = {}
): Promise<CommandResult> {
  const coins = await client.getAllCoins()
  const zeroCoins = coins.filter((coin) => coin.balance === 0)

  if (zeroCoins.length === 0) {
    return { success: true, message: "No zero-balance coins found" }
  }

  console.log(`Found ${zeroCoins.length} zero-balance coins`)

  if (options.dryRun) {
    return {
      success: true,
      message: `[Dry Run] Would destroy ${zeroCoins.length} zero-balance coins`,
      data: zeroCoins,
    }
  }

  const batchSize = 500
  let destroyed = 0

  for (let i = 0; i < zeroCoins.length; i += batchSize) {
    const batch = zeroCoins.slice(i, i + batchSize)
    const tx = new Transaction()

    for (const coin of batch) {
      destoryZeroCoin(tx, coin.objectId, coin.coinType)
    }

    if (options.gasBudget) {
      tx.setGasBudget(options.gasBudget)
    }
    if (options.gasObject) {
      const gasObjectRef = await getObjectRef(client, options.gasObject)
      tx.setGasPayment([gasObjectRef])
    }

    const devInspectRes = await client.devInspectTransactionBlock(tx)
    if (devInspectRes.effects.status.status !== "success") {
      console.log(`Batch ${Math.floor(i / batchSize) + 1} simulation failed, skipping`)
      continue
    }

    const txRes = await client.signAndExecuteTransaction(tx)
    destroyed += batch.length
    console.log(`Destroyed ${destroyed}/${zeroCoins.length} coins (tx: ${txRes.digest})`)

    if (i + batchSize < zeroCoins.length) {
      await sleep(500)
    }
  }

  return {
    success: true,
    message: `Destroyed ${destroyed} zero-balance coins`,
    data: { destroyed, total: zeroCoins.length },
  }
}
