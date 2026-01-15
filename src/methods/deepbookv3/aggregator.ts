import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../client"
import {
  add_into_whitelist_movecall,
  init_sponsor_fee_record_movecall,
  remove_from_whitelist_movecall,
  set_alternative_payment_movecall,
  update_package_version_movecall,
  withdraw_deep_fee_from_aggregator_movecall,
} from "../../movecall/deepbookv3/aggregator"

export async function init_aggregator_deepbookv3_whitelist(
  client: SuiScriptClient,
  pools: string[],
  env: string
) {
  const txb = new Transaction()

  for (const pool of pools) {
    add_into_whitelist_movecall(txb, pool, env)
  }

  const txRes = await client.sendTransaction(txb)
  console.log(txRes)
}

export async function remove_aggregator_deepbookv3_whitelist(
  client: SuiScriptClient,
  pools: string[],
  env: string
) {
  const txb = new Transaction()

  for (const pool of pools) {
    remove_from_whitelist_movecall(txb, pool, env)
  }
  const txRes = await client.sendTransaction(txb)
  console.log(txRes)
}

export async function update_package_version(
  client: SuiScriptClient,
  new_version: number,
  env: string
) {
  const txb = new Transaction()
  update_package_version_movecall(txb, new_version, env)
  const txRes = await client.sendTransaction(txb)
  console.log(txRes)
}

export async function set_alternative_payment(
  client: SuiScriptClient,
  is_open: boolean,
  env: string
) {
  const txb = new Transaction()
  set_alternative_payment_movecall(txb, env, is_open)

  const txRes = await client.sendTransaction(txb)
  console.log(txRes)
}

export async function withdraw_deep_fee_from_aggregator_vault(
  client: SuiScriptClient,
  amount: string,
  env: string
) {
  const txb = new Transaction()
  withdraw_deep_fee_from_aggregator_movecall(
    txb,
    amount,
    client.walletAddress,
    env
  )
  const txRes = await client.sendTransaction(txb)
  console.log(txRes)
}

export async function init_sponsor_record(
  client: SuiScriptClient,
  env: string
) {
  const txb = new Transaction()
  init_sponsor_fee_record_movecall(txb, env)
  const txRes = await client.sendTransaction(txb)
  console.log(txRes)
}
