import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions"

export function destoryZeroCoin(
  txb: Transaction,
  objectId: string,
  coinType: string
) {
  txb.moveCall({
    target: `0x2::coin::destroy_zero`,
    arguments: [txb.object(objectId)],
    typeArguments: [coinType],
  })
}

export function destoryZeroCoinArg(
  txb: Transaction,
  object: TransactionObjectArgument,
  coinType: string
) {
  txb.moveCall({
    target: `0x2::coin::destroy_zero`,
    arguments: [txb.object(object)],
    typeArguments: [coinType],
  })
}

export function transferOrDestoryCoin(
  txb: Transaction,
  coin: TransactionObjectArgument,
  coinType: string
) {
  txb.moveCall({
    target: `0x764b8132a94d35abc9dfd91b23a0757b2a717d5ecb04c03098794aa2a508db91::utils::transfer_or_destroy_coin`,
    typeArguments: [coinType],
    arguments: [coin],
  })
}

export function mintZeroCoin(
  txb: Transaction,
  coinType: string
): TransactionObjectArgument {
  return txb.moveCall({
    target: "0x2::coin::zero",
    typeArguments: [coinType],
  })
}

export function checkCoinThreshold(
  txb: Transaction,
  coin: TransactionObjectArgument,
  coinType: string,
  amountLimit: number,
  env: string
) {
  const aggregator_published_at =
    env === "testnet"
      ? "0x0"
      : "0x868a192f542e819de99f8f289d7d6b47126e5da3103108fbc01d16cfd6be569a"

  txb.moveCall({
    target: `${aggregator_published_at}::utils::check_coin_threshold`,
    typeArguments: [coinType],
    arguments: [coin, txb.pure.u64(amountLimit.toString())],
  })
}
