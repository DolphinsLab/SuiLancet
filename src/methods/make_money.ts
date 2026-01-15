import {
  coinWithBalance,
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions"
import {
  cetus_swap_a2b_movecall,
  cetus_swap_b2a_movecall,
} from "../movecall/cetus/swap"
import {
  swap_exact_base_for_quote_movecall,
  swap_exact_quote_for_base_movecall,
} from "../movecall/deepbookv3/deepbookv3"
import {
  checkCoinThreshold,
  destoryZeroCoin,
  destoryZeroCoinArg,
} from "../movecall"
import { printTransaction, SuiScriptClient } from "../client"
import { sleep } from "../common"

export async function swap_then_place_market_order(
  client: SuiScriptClient,
  amount: number,
  cetus_pool: string,
  deep_pool: string,
  coin_a_type: string,
  coin_b_type: string,
  swap_first: boolean,
  env: string
) {
  while (true) {
    swap_first = !swap_first

    const txb = new Transaction()
    // const cetus_pool =
    //   "0xe01243f37f712ef87e556afb9b1d03d0fae13f96d324ec912daffc339dfdcbd2" 0.0025

    if (swap_first) {
      const sui_coin = txb.splitCoins(txb.gas, [amount])
      const deep_coin = cetus_swap_a2b_movecall(
        txb,
        cetus_pool,
        sui_coin,
        coin_a_type,
        coin_b_type,
        env
      )

      const [deep_coin2, sui_coin2] = swap_exact_base_for_quote_movecall(
        txb,
        env,
        deep_pool,
        deep_coin,
        coin_a_type,
        coin_b_type,
        amount
      )

      checkCoinThreshold(txb, sui_coin2, coin_b_type, amount * 0.95, env)

      txb.transferObjects([deep_coin2], client.walletAddress)
      txb.mergeCoins(txb.gas, [sui_coin2])
    } else {
      const deep_coin_object_id =
        "0xe407918188c87d819662500ac4e33c0239dc9b7c0d9d1e45da666969dd4f5627"
      const deep_coin = txb.splitCoins(txb.object(deep_coin_object_id), [
        amount,
      ])

      const [deep_coin2, sui_coin2] = swap_exact_base_for_quote_movecall(
        txb,
        env,
        deep_pool,
        deep_coin,
        coin_a_type,
        coin_b_type,
        amount
      )

      const deep_coin3 = cetus_swap_b2a_movecall(
        txb,
        cetus_pool,
        sui_coin2,
        coin_a_type,
        coin_b_type,
        env
      )

      checkCoinThreshold(txb, deep_coin3, coin_a_type, amount * 0.95, env)

      txb.transferObjects([deep_coin2], client.walletAddress)
    }

    // printTransaction(txb)
    try {
      const devInspectRes = await client.devInspectTransactionBlock(txb)
      if (devInspectRes.effects.status.status !== "success") {
        // console.log(devInspectRes)
        console.log("simulate transaction failed")
      } else {
        const txRes = await client.signAndExecuteTransaction(txb)
        console.log(txRes)
      }
    } catch (e) {
      console.log(e)
    }

    await sleep(200)
  }
}

export async function circle_swap(
  client: SuiScriptClient,
  amount: number,
  //   usdc_sui: boolean,
  env: string
) {
  const sui_type =
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
  const deep_type =
    "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP"
  const usdc_type =
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC"

  let x = 0

  while (true) {
    // usdc_sui = !usdc_sui

    const txb = new Transaction()
    // const cetus_pool =
    //   "0xe01243f37f712ef87e556afb9b1d03d0fae13f96d324ec912daffc339dfdcbd2" 0.0025
    // sui -> deep -> usdc -> sui
    const [sui_coin]: TransactionObjectArgument[] = txb.splitCoins(txb.gas, [
      amount,
    ])

    const res = swap_exact_quote_for_base_movecall(
      txb,
      env,
      "0xb663828d6217467c8a1838a03793da896cbe745b150ebd57d82f814ca579fc22",
      sui_coin,
      deep_type,
      sui_type,
      1
    ) // sui0 is 0

    const deep0 = res[0]
    const sui0 = res[1]
    const deep00 = res[2]

    destoryZeroCoinArg(txb, deep00, deep_type)

    const res2 = swap_exact_base_for_quote_movecall(
      txb,
      env,
      "0xf948981b806057580f91622417534f491da5f61aeaf33d0ed8e69fd5691c95ce",
      deep0,
      deep_type,
      usdc_type,
      0
    )

    const deep1 = res2[0]
    const usdc1 = res2[1]
    const deep11 = res2[2]

    destoryZeroCoinArg(txb, deep1, deep_type)
    destoryZeroCoinArg(txb, deep11, deep_type)

    const sui2 = cetus_swap_a2b_movecall(
      txb,
      "0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105",
      usdc1,
      usdc_type,
      sui_type,
      env
    )

    txb.mergeCoins(sui0, [sui2])

    checkCoinThreshold(txb, sui0, sui_type, amount, env)
    txb.mergeCoins(txb.gas, [sui0])

    // printTransaction(txb)
    try {
      const devInspectRes = await client.devInspectTransactionBlock(txb)
      if (devInspectRes.effects.status.status !== "success") {
        // console.log(devInspectRes)
        console.log(
          "simulate transaction failed" +
            Date.now().toLocaleString() +
            "  x: " +
            x.toString()
        )
      } else {
        x++
        const txRes = await client.signAndExecuteTransaction(txb)
        console.log(txRes)
      }
    } catch (e) {
      console.log(e)
    }
    // break

    await sleep(200)
  }
}

export async function transfer_coin(
  client: SuiScriptClient,
  coin_object_id: string,
  address: string
) {
  const txb = new Transaction()
  txb.transferObjects([txb.object(coin_object_id)], address)
  await client.sendTransaction(txb)
}

export async function transfer_coin_by_coin_type(
  client: SuiScriptClient,
  coin_type: string,
  address: string,
  amount: number
) {
  const txb = new Transaction()

  const coins = await client.getCoinsByType(coin_type)
  const coin = await client.buildInputCoin(coins, BigInt(amount), txb)

  txb.transferObjects([coin], address)
  await client.sendTransaction(txb)
}

export async function transfer_objects(
  client: SuiScriptClient,
  objects: string[],
  address: string
) {
  const txb = new Transaction()
  const object_refs = objects.map((object) => txb.object(object))
  txb.transferObjects(object_refs, address)
  await client.sendTransaction(txb)
}
