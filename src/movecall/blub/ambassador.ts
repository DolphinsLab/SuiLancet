import { Transaction } from "@mysten/sui/dist/cjs/transactions"
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils"

export async function query_ambassador_by_owner_movecall(
  txb: Transaction,
  owner: string,
  env: string
) {
  const blub_abmassador_published_at =
    env === "mainnet"
      ? "0x2"
      : "0x07ffb5831daef6824740bac6ffcf87103a283b9ff68115528ca482d9cd008fef"
  const config =
    env === "mainnet"
      ? "0x1"
      : "0xb49da03a8db72a76a9d1030b4fbe16466c0dacb347ea543ac4ecf88aa9001e36"
  const args = [txb.object(config), txb.pure.address(owner)]

  txb.moveCall({
    target: `${blub_abmassador_published_at}::query::query_ambassador_by_owner`,
    arguments: args,
  })
}

export async function create_ambassador_movecall(
  txb: Transaction,
  env: string
) {
  const blub_abmassador_published_at =
    env === "mainnet"
      ? "0x2"
      : "0x07ffb5831daef6824740bac6ffcf87103a283b9ff68115528ca482d9cd008fef"
  const config =
    env === "mainnet"
      ? "0x1"
      : "0xb49da03a8db72a76a9d1030b4fbe16466c0dacb347ea543ac4ecf88aa9001e36"
  const args = [
    txb.object(config),
    txb.pure.vector("string", ["x", "y"]),
    txb.pure.vector("string", ["coolboy", "coolgirl"]),
  ]

  txb.moveCall({
    target: `${blub_abmassador_published_at}::blub_ambassador::create_ambassador`,
    arguments: args,
  })
}

export async function query_ambassador_wait_claimed_rewards_movecall(
  txb: Transaction,
  ambassador_id: string,
  env: string
) {
  const blub_abmassador_published_at =
    env === "mainnet"
      ? "0x2"
      : "0x07ffb5831daef6824740bac6ffcf87103a283b9ff68115528ca482d9cd008fef"
  const config =
    env === "mainnet"
      ? "0x1"
      : "0xb49da03a8db72a76a9d1030b4fbe16466c0dacb347ea543ac4ecf88aa9001e36"
  const args = [
    txb.object(config),
    txb.object(ambassador_id),
    txb.object(SUI_CLOCK_OBJECT_ID),
  ]

  txb.moveCall({
    target: `${blub_abmassador_published_at}::blub_ambassador::query_ambassador_wait_claimed_rewards`,
    arguments: args,
  })
}
