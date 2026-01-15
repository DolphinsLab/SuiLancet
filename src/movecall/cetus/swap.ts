import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils"
import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions"

export function cetus_swap_b2a_movecall(
  txb: Transaction,
  pool: string,
  coin_b: TransactionObjectArgument,
  coin_a_type: string,
  coin_b_type: string,
  env: string
): TransactionObjectArgument {
  const config =
    env === "testnet"
      ? "0x0"
      : "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f"
  const partner =
    env === "testnet"
      ? "0x0"
      : "0x639b5e433da31739e800cd085f356e64cae222966d0f1b11bd9dc76b322ff58b"

  const aggregator_published_at =
    env === "testnet"
      ? "0x0"
      : "0x868a192f542e819de99f8f289d7d6b47126e5da3103108fbc01d16cfd6be569a"
  const args = [
    txb.object(config),
    txb.object(pool),
    txb.object(partner),
    coin_b,
    txb.object(SUI_CLOCK_OBJECT_ID),
  ]

  return txb.moveCall({
    target: `${aggregator_published_at}::cetus::swap_b2a`,
    arguments: args,
    typeArguments: [coin_a_type, coin_b_type],
  })
}

export function cetus_swap_a2b_movecall(
  txb: Transaction,
  pool: string,
  coin_a: TransactionObjectArgument,
  coin_a_type: string,
  coin_b_type: string,
  env: string
): TransactionObjectArgument {
  const config =
    env === "testnet"
      ? "0x0"
      : "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f"
  const partner =
    env === "testnet"
      ? "0x0"
      : "0x639b5e433da31739e800cd085f356e64cae222966d0f1b11bd9dc76b322ff58b"

  const aggregator_published_at =
    env === "testnet"
      ? "0x0"
      : "0x868a192f542e819de99f8f289d7d6b47126e5da3103108fbc01d16cfd6be569a"
  const args = [
    txb.object(config),
    txb.object(pool),
    txb.object(partner),
    coin_a,
    txb.object(SUI_CLOCK_OBJECT_ID),
  ]

  return txb.moveCall({
    target: `${aggregator_published_at}::cetus::swap_a2b`,
    arguments: args,
    typeArguments: [coin_a_type, coin_b_type],
  })
}
