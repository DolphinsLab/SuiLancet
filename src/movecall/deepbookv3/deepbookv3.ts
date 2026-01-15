import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions"
import { mintZeroCoin } from "../coin"
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils"

export function withdraw_deep_fee_from_deepbookv3utils_movecall(
  txb: Transaction,
  amount: number,
  env: string
): TransactionObjectArgument {
  const global_config = txb.object(
    env === "testnet"
      ? "0xc3fe35540f9635bd96d6a49762d0c7305d0372aef9d884c931f7f07d52b3c1b5"
      : "0xff1141ef80e7baf206c7930c274b465600e64884d8167f90d4cdb60197925163"
  )
  const admin_cap = txb.object(
    env === "testnet"
      ? "0xf4c32735cbbc771b33a6807b427b23b7b1e7991e3cce79c910131cbd4868fbea"
      : "0xd34f0e19c5ad8c28bc1c462c195114bb79558142eb53bc3a417ad1a9158d5a90"
  )
  const amount_arg = txb.pure.u64(amount)
  const deepbookv3_utils_published_at =
    env === "testnet"
      ? "0xf689dded26840b8e79cb08f642276ac5aa0cd380cb4b2650ad1df4394d0f168d"
      : "0x624a80998bfca8118a794c71cccca771c351158eecd425661e07056f4ed94683"

  const deep = txb.moveCall({
    target: `${deepbookv3_utils_published_at}::global_config::withdraw_deep_fee`,
    typeArguments: [],
    arguments: [admin_cap, global_config, amount_arg],
  })
  return deep
}

export function deposit_deep_fee_to_deepbookv3_utils(
  txb: Transaction,
  deep_coin_object_id: string,
  env: string
): TransactionObjectArgument {
  const global_config = txb.object(
    env === "testnet"
      ? "0xc3fe35540f9635bd96d6a49762d0c7305d0372aef9d884c931f7f07d52b3c1b5"
      : "0xff1141ef80e7baf206c7930c274b465600e64884d8167f90d4cdb60197925163"
  )
  const deepbookv3_utils_published_at =
    env === "testnet"
      ? "0xf689dded26840b8e79cb08f642276ac5aa0cd380cb4b2650ad1df4394d0f168d"
      : "0x624a80998bfca8118a794c71cccca771c351158eecd425661e07056f4ed94683"

  const args = [txb.object(global_config), txb.object(deep_coin_object_id)]
  const deep = txb.moveCall({
    target: `${deepbookv3_utils_published_at}::global_config::deposit_deep_fee`,
    typeArguments: [],
    arguments: args,
  })
  return deep
}

export function deposit_place_market_order_movecall(
  txb: Transaction,
  env: string,
  base_coin: TransactionObjectArgument,
  base_coin_type: string,
  quote_coin_type: string,
  amount: number,
  is_buy: boolean
) {
  const deepbookv3_self_utils_published_at = env === "testnet" ? "0x0" : "0x0"

  const global_config = txb.object(
    env === "testnet"
      ? "0x0"
      : "0xf7038af0f0176dc2e59e0563133546749eee5c2d37f385e18dd8db5376e76c59"
  )

  const cetus_balance_manager_indexer = txb.object(
    env === "testnet"
      ? "0x0"
      : "0xfa1e94715339e4311963a230f2b3b8f587535902443f9de31c6d45b35152ebca"
  )

  const deep_coin_type =
    env === "testnet"
      ? "0x0"
      : "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP"

  const deep_pool_id = txb.object(env === "testnet" ? "0x0" : "0x0")

  const quote_coin = mintZeroCoin(txb, quote_coin_type)
  const deep_coin = mintZeroCoin(txb, deep_coin_type)

  const args = [
    txb.object(global_config),
    txb.object(cetus_balance_manager_indexer),
    txb.object(deep_pool_id),
    base_coin,
    quote_coin,
    deep_coin,
    txb.pure.u8(0),
    txb.pure.u64(amount),
    txb.pure.bool(is_buy),
    txb.pure.bool(true),
    txb.object(SUI_CLOCK_OBJECT_ID),
  ]

  const deep = txb.moveCall({
    target: `${deepbookv3_self_utils_published_at}::deepbookv3_utils::deposit_then_place_market_order_by_owner`,
    arguments: args,
    typeArguments: [base_coin_type, quote_coin_type],
  })
  return deep
}

export function swap_exact_base_for_quote_movecall(
  txb: Transaction,
  env: string,
  pool_id: string,
  base_coin: TransactionObjectArgument,
  base_coin_type: string,
  quote_coin_type: string,
  min_quote_out: number
) {
  const deepbookv3_self_utils_published_at =
    env === "testnet"
      ? "0x0"
      : "0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809"

  const deep_coin_type =
    env === "testnet"
      ? "0x0"
      : "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP"

  const deep_coin = mintZeroCoin(txb, deep_coin_type)

  const args = [
    txb.object(pool_id),
    txb.object(base_coin),
    txb.object(deep_coin),
    txb.pure.u64(min_quote_out),
    txb.object(SUI_CLOCK_OBJECT_ID),
  ]

  const res = txb.moveCall({
    target: `${deepbookv3_self_utils_published_at}::pool::swap_exact_base_for_quote`,
    arguments: args,
    typeArguments: [base_coin_type, quote_coin_type],
  }) as TransactionObjectArgument[]
  return res
}

export function swap_exact_quote_for_base_movecall(
  txb: Transaction,
  env: string,
  pool_id: string,
  quote_coin: TransactionObjectArgument,
  base_coin_type: string,
  quote_coin_type: string,
  min_quote_out: number
) {
  const deepbookv3_self_utils_published_at =
    env === "testnet"
      ? "0x0"
      : "0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809"

  const deep_coin_type =
    env === "testnet"
      ? "0x0"
      : "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP"

  const deep_coin = mintZeroCoin(txb, deep_coin_type)

  const args = [
    txb.object(pool_id),
    txb.object(quote_coin),
    txb.object(deep_coin),
    txb.pure.u64(0),
    txb.object(SUI_CLOCK_OBJECT_ID),
  ]

  const res = txb.moveCall({
    target: `${deepbookv3_self_utils_published_at}::pool::swap_exact_quote_for_base`,
    arguments: args,
    typeArguments: [base_coin_type, quote_coin_type],
  }) as TransactionObjectArgument[]
  return res
}
