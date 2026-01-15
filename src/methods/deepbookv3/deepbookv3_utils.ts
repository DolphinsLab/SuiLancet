import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../client"
import {
  deposit_deep_fee_to_deepbookv3_utils,
  withdraw_deep_fee_from_deepbookv3utils_movecall,
} from "../../movecall/deepbookv3/deepbookv3"
import { transferOrDestoryCoin } from "../../movecall"
import { withdraw_deep_fee_from_deepbookv3_vaults_movecall } from "../../movecall/deepbookv3/deepbookv3_vaults"

export async function deposit_deep_fee_into_deepbookv3_utils(
  client: SuiScriptClient,
  deep_coin_object_id: string,
  env: string
) {
  const txb = new Transaction()
  deposit_deep_fee_to_deepbookv3_utils(txb, deep_coin_object_id, env)
  await client.sendTransaction(txb)
}

export async function withdraw_deep_fee_from_deepbookv3_utils(
  client: SuiScriptClient,
  amount: number,
  env: string
) {
  const txb = new Transaction()
  const deep = withdraw_deep_fee_from_deepbookv3utils_movecall(txb, amount, env)
  txb.transferObjects([deep], client.walletAddress)

  const devInspectRes = await client.devInspectTransactionBlock(txb)
  if (devInspectRes.effects.status.status !== "success") {
    console.log("transaction failed")
    console.log(devInspectRes)
  }

  const txRes = await client.signAndExecuteTransaction(txb)
  console.log(txRes)
}

export async function withdraw_deep_fee_from_deepbookv3_vaults(
  client: SuiScriptClient,
  amount: string,
  env: string
) {
  const txb = new Transaction()
  withdraw_deep_fee_from_deepbookv3_vaults_movecall(
    txb,
    amount,
    client.walletAddress,
    env
  )

  const devInspectRes = await client.devInspectTransactionBlock(txb)
  if (devInspectRes.effects.status.status !== "success") {
    console.log("transaction failed")
    console.log(devInspectRes)
  }

  const txRes = await client.signAndExecuteTransaction(txb)
  console.log(txRes)
}
