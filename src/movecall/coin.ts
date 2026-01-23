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

