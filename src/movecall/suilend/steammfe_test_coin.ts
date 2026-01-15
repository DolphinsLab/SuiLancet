import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions"

export function get_test_coin_movecall(
  txb: Transaction,
  coin_type: string,
  amount: number
): TransactionObjectArgument {
  const test_steammfe_published_at =
    "0x2e868e44010e06c0fc925d29f35029b6ef75a50e03d997585980fb2acea45ec6"

  let object
  if (
    coin_type ===
    "0x2e868e44010e06c0fc925d29f35029b6ef75a50e03d997585980fb2acea45ec6::sui::SUI"
  ) {
    object =
      "0xab20e561f4a3a77361ff13298dd111b38f4c44457785ec7cec15c48903d272fb"
  }
  if (
    coin_type ===
    "0x2e868e44010e06c0fc925d29f35029b6ef75a50e03d997585980fb2acea45ec6::usdc::USDC"
  ) {
    object =
      "0xc259c0212f5b5e7dd409324163ac557bda8b63a1bc86e667cd76ecb7d67bc9f7"
  }

  const args = [txb.object(object), txb.pure.u64(amount)]

  const coin = txb.moveCall({
    target: `${test_steammfe_published_at}::faucets::get_coins`,
    arguments: args,
    typeArguments: [coin_type],
  })
  return coin as TransactionObjectArgument
}
