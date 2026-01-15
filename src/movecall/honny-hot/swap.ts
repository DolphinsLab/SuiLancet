import { Transaction, TransactionArgument } from "@mysten/sui/transactions"
import { HoneyConfig } from "../../methods"

const fbi_published_at =
  "0xdb300f4728c2aa92e487bb1e1a402121bda201bfb6a528d8389e40dba8b3b9e1"

const vault =
  "0x6da385b68b5e27a3cfc12322fcd8aca99749ce7a0d7e5a7b5777e808fa5c0c49"

const cetus_global_config =
  "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f"

export function buy_honey_pot(
  txb: Transaction,
  honey_config: HoneyConfig,
  amount: number
) {
  const sui_coin =
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"

  const sui = txb.splitCoins(txb.gas, [amount])

  const args = [
    txb.object(vault),
    txb.object(cetus_global_config),
    txb.object(honey_config.pool),
    sui,
    txb.pure.u64(amount),
    txb.pure.u64("0"),
    txb.object("0x6"),
  ]

  const deep = txb.moveCall({
    target: `${fbi_published_at}::fbi::a`,
    typeArguments: [honey_config.coin_type, sui_coin],
    arguments: args,
  })
  return deep
}

export function sell_honey_pot(
  txb: Transaction,
  amount_limit: number,
  honey_config: HoneyConfig
) {
  const sui_coin =
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"

  const args = [
    txb.object(vault),
    txb.object(cetus_global_config),
    txb.object(honey_config.pool),
    txb.pure.bool(true),
    txb.pure.u64(amount_limit),
    txb.object("0x6"),
  ]

  const deep = txb.moveCall({
    target: `${fbi_published_at}::fbi::b`,
    typeArguments: [honey_config.coin_type, sui_coin],
    arguments: args,
  })
  return deep
}
