import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../client"
import {
  add_sponsor_whitelist_address_movecall,
  deposit_deep_fee_to_aggregator_vault_movecall,
  remove_sponsor_whitelist_address_movecall,
  swap_b2a_movecall,
  update_sponsor_fee_limit_movecall,
} from "../../movecall/deepbookv3/aggregator"

export async function deposit_deep_fee_by_object_id(
  client: SuiScriptClient,
  deep_coin_object_id: string,
  env: string
) {
  const txb = new Transaction()
  const deep_coin = txb.object(deep_coin_object_id)
  deposit_deep_fee_to_aggregator_vault_movecall(txb, deep_coin, env)

  await client.sendTransaction(txb)
}

export async function deposit_deep_fee_by_amount(
  client: SuiScriptClient,
  amount: bigint,
  env: string
) {
  const txb = new Transaction()

  const deep_coins = await client.getCoinsByType(
    "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP"
  )

  if (deep_coins.length === 0) {
    throw new Error("No deep coin found")
  }

  const deep_coin = await client.buildInputCoin(deep_coins, amount, txb)

  deposit_deep_fee_to_aggregator_vault_movecall(txb, deep_coin, env)

  await client.sendTransaction(txb)
}

export async function swap_b2a_(
  client: SuiScriptClient,
  env: string,
  pool_id: string,
  amount: bigint,
  base_coin_type: string,
  quote_coin_type: string,
  address: string
) {
  const txb = new Transaction()
  const sui_coin = txb.splitCoins(txb.gas, [txb.pure.u64(amount)])

  swap_b2a_movecall(
    txb,
    env,
    pool_id,
    sui_coin,
    base_coin_type,
    quote_coin_type,
    address
  )

  await client.sendTransaction(txb)
}

export async function update_sponsor_fee_limit(
  client: SuiScriptClient,
  env: string,
  sponsor_fee_limit: number
) {
  const txb = new Transaction()
  update_sponsor_fee_limit_movecall(txb, env, sponsor_fee_limit)

  await client.sendTransaction(txb)
}

export async function add_sponsor_whitelist_address(
  client: SuiScriptClient,
  env: string,
  address: string
) {
  const txb = new Transaction()
  add_sponsor_whitelist_address_movecall(txb, env, address)

  await client.sendTransaction(txb)
}

export async function remove_sponsor_whitelist_address(
  client: SuiScriptClient,
  env: string,
  address: string
) {
  const txb = new Transaction()
  remove_sponsor_whitelist_address_movecall(txb, env, address)

  await client.sendTransaction(txb)
}
