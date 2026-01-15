import { sleep, SuiScriptClient } from "../src"
import { getObjectRef } from "../src/common/object"
import {
  circle_swap,
  swap_then_place_market_order,
  transfer_coin,
} from "../src/methods/make_money"
import {
  batchDestoryZeroCoin,
  batchSplitSpecialCoins,
  batchSplitSuiCoins,
  batchTransferZeroCoin,
  getSpecialAmountCoins,
  mergeCoins,
  refuel_specifal_coin,
  transfer_all_sui_coins,
} from "../src/methods/process_coin"

describe("coin module", () => {
  const env = "mainnet"
  const client = new SuiScriptClient(env)

  it("get object ref", async () => {
    const gasObjectId =
      "0x46b7ef93eb6db2437e1f8ce1eac0e3b9d58b6a088e2f3b951176d155c4ccb6ba"
    const objectRef = await getObjectRef(client, gasObjectId)
    console.log(objectRef)
  })

  it("destory all zero coin", async () => {
    const gasObjectId =
      "0x81cbe30fdcf8b83e50b06b9226d7853ec7398d8e665bcf9a4f16a265afc08f41"
    while (true) {
      await batchDestoryZeroCoin(client, 96383568, gasObjectId)
    }
  }, 6000000)

  it("batch split sui coins", async () => {
    // const amountVec = Array.from({ length: 50 }, () => 10000000000)
    const amountVec = Array.from({ length: 400 }, () => 1100000000)
    await batchSplitSuiCoins(
      client,
      amountVec,
      "0x94a65e3adf7b5a61428d991fab7467dd544d0f829943962a98ed8a8de1422429"
    )
  }, 60000)

  it("batch split special coins(not sui)", async () => {
    const amountVec = Array.from({ length: 400 }, () => 1000000000)
    await batchSplitSpecialCoins(
      client,
      "0x324467d374a2497abe2607d5d6b92dec2dfec94c9ba39ed3a1aab3714df64351",
      amountVec,
      "0x00c98fab8f0cbf3c7d222a5806763f891e6dc92ca9b40712ca24d59c7888f87f"
    )
  }, 60000)

  it("batch transfer empty coins", async () => {
    await batchTransferZeroCoin(
      client,
      "0x02e39bddb06f617112595378fef741f523fbf22ea188cca99ecb61a9904dda2a"
    )
  }, 6000000)

  it("make money", async () => {
    const amount = 200000000000
    const cetus_pool =
      "0xe01243f37f712ef87e556afb9b1d03d0fae13f96d324ec912daffc339dfdcbd2"
    const deep_pool =
      "0xb663828d6217467c8a1838a03793da896cbe745b150ebd57d82f814ca579fc22"
    const coin_a_type =
      "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP"
    const coin_b_type =
      "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"

    await swap_then_place_market_order(
      client,
      amount,
      cetus_pool,
      deep_pool,
      coin_a_type,
      coin_b_type,
      false,
      env
    )
  }, 6000000)

  it("circle swap", async () => {
    await circle_swap(client, 100000000000, env)
  }, 6000000)

  it("merge coins", async () => {
    await mergeCoins(
      client,
      "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
      "0x94a65e3adf7b5a61428d991fab7467dd544d0f829943962a98ed8a8de1422429"
    )
  }, 6000000)

  // it("merge coins and transfer", async () => {
  //   await mergeCoinsAndTransfer(
  //     client,
  //     "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  //     "0x0c7f8c3654e17e85c5b36686395a5ec859b56a0fcec748441da4fc18cbd8ed01",
  //     "0x81cbe30fdcf8b83e50b06b9226d7853ec7398d8e665bcf9a4f16a265afc08f41"
  //   )
  // }, 6000000)

  it("transfer coin", async () => {
    const coin_object_id =
      "0xb6feecf9ccc7d155f342184a8f583101d82addccf4fdc7aeb655f1c4b5c48534"
    await transfer_coin(
      client,
      coin_object_id,
      "0x0c7f8c3654e17e85c5b36686395a5ec859b56a0fcec748441da4fc18cbd8ed01"
    )
  })

  it("transfer all sui coins", async () => {
    await transfer_all_sui_coins(
      client,
      "0xf7b8d77dd06a6bb51c37ad3ce69e0a44c6f1064f52ac54606ef47763c8a71be6"
    )
  }, 6000000)

  it("get special amount coins", async () => {
    const min_amount = 1100000000
    const max_amount = 1100000000
    const coinType =
      "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
    const coins = await getSpecialAmountCoins(
      client,
      min_amount,
      max_amount,
      coinType
    )

    console.log(coins.length)

    // Print in groups of 100
    const groupSize = 100
    for (let i = 0; i < coins.length; i += groupSize) {
      const group = coins.slice(i, i + groupSize)
      console.log(JSON.stringify(group, null, 2))
      await sleep(3000)
    }
  }, 6000000)

  it("get test coins", async () => {
    const amount = 1999999998
    const coinType =
      "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
    const coins = await getSpecialAmountCoins(client, amount, amount, coinType)

    // Print in groups of 100
    const groupSize = 100
    for (let i = 0; i < coins.length; i += groupSize) {
      const group = coins.slice(i, i + groupSize)
      console.log(JSON.stringify(group, null, 2))
    }
  }, 6000000)

  it("refuel specifal coin", async () => {
    const amount = 4079876
    const pure_coin_object_id =
      "0x2533011764d848dd68725a88b39103537fccbc73a9e5cfb0a5d85f5fc347df5f"
    const refuel_coin_object_id =
      "0x049ab7831461e497e7203d8ed9af4c515674a18e12b7ed38209f6eb6f1e51545"
    const gas =
      "0x81cbe30fdcf8b83e50b06b9226d7853ec7398d8e665bcf9a4f16a265afc08f41"
    await refuel_specifal_coin(
      client,
      pure_coin_object_id,
      refuel_coin_object_id,
      amount,
      gas
    )
  }, 6000000)
})
// [
//   ({
//     kind: "Input",
//     type: "object",
//     index: 0,
//     value: "0x96cd6a72501f583098ab7969b6c3181c7fcd9ee0461e9f07507e2e6503aa5322",
//   },
//   {
//     kind: "Input",
//     type: "object",
//     index: 1,
//     value: "0xbd3e723f7bbdec0e270f4c185d8d4a067c2c8041576805e1563cfa1e30c73f53",
//   },
//   {
//     kind: "Input",
//     index: 2,
//     value: {
//       Pure: [184, 11, 0, 0, 0, 0, 0, 0],
//     },
//     type: "pure",
//   },
//   {
//     kind: "Input",
//     index: 3,
//     value: {
//       Pure: [
//         14, 32, 27, 242, 167, 100, 51, 242, 189, 1, 83, 175, 63, 17, 243, 211,
//         98, 128, 168, 53, 244, 212, 161, 145, 71, 29, 195, 88, 77, 196, 73, 146,
//         15, 186, 32, 199, 130, 23, 219, 67, 224, 110, 49, 75, 188, 78, 189, 194,
//         187, 178, 207, 51, 58, 179, 131, 205, 63, 48, 40, 222, 151, 143, 71,
//         179, 147, 122, 79, 32, 173, 48, 128, 128, 64, 231, 227, 250, 164, 188,
//         160, 108, 235, 39, 222, 95, 242, 106, 122, 27, 86, 69, 93, 86, 218, 176,
//         64, 160, 89, 111, 249, 229, 32, 132, 99, 115, 237, 1, 167, 76, 38, 138,
//         105, 170, 192, 176, 230, 160, 116, 110, 60, 161, 22, 126, 148, 79, 35,
//         108, 171, 49, 124, 187, 243, 242, 109, 32, 212, 199, 48, 236, 231, 142,
//         29, 90, 86, 118, 20, 127, 219, 194, 65, 62, 199, 0, 212, 47, 167, 3, 20,
//         41, 72, 255, 11, 252, 79, 15, 203, 6, 32, 251, 219, 101, 102, 126, 72,
//         153, 67, 99, 26, 198, 123, 215, 84, 225, 89, 61, 158, 133, 105, 109,
//         238, 29, 215, 130, 4, 58, 205, 201, 164, 140, 186, 32, 77, 6, 86, 219,
//         130, 127, 148, 191, 120, 115, 116, 35, 54, 240, 102, 96, 93, 3, 84, 244,
//         112, 192, 6, 119, 254, 6, 251, 246, 20, 162, 102, 130, 32, 203, 147,
//         187, 189, 44, 11, 112, 239, 107, 202, 15, 245, 114, 94, 180, 245, 37,
//         211, 254, 50, 30, 152, 77, 74, 186, 11, 222, 184, 235, 88, 13, 103, 32,
//         118, 161, 138, 74, 203, 209, 33, 253, 225, 76, 23, 98, 241, 44, 151,
//         174, 130, 117, 114, 208, 173, 149, 67, 115, 180, 233, 145, 130, 249,
//         245, 141, 166, 32, 131, 139, 146, 221, 159, 65, 204, 238, 65, 94, 73,
//         188, 167, 92, 145, 198, 40, 15, 133, 156, 16, 156, 10, 100, 203, 223,
//         78, 231, 188, 25, 253, 242, 32, 58, 198, 178, 29, 172, 47, 23, 206, 225,
//         170, 165, 94, 39, 126, 164, 120, 22, 220, 195, 99, 68, 71, 50, 13, 197,
//         177, 47, 219, 178, 104, 25, 5, 32, 179, 163, 90, 102, 36, 195, 193, 114,
//         63, 81, 119, 120, 180, 144, 213, 253, 47, 138, 96, 170, 84, 33, 31, 150,
//         132, 63, 192, 109, 124, 91, 209, 28, 32, 198, 177, 32, 6, 13, 94, 190,
//         245, 97, 40, 175, 183, 51, 159, 237, 144, 16, 12, 51, 50, 33, 32, 146,
//         60, 29, 147, 220, 79, 154, 217, 234, 225, 32, 232, 221, 163, 159, 142,
//         102, 150, 247, 107, 195, 206, 24, 21, 110, 203, 123, 12, 118, 220, 240,
//         97, 144, 253, 241, 15, 155, 143, 86, 81, 128, 159, 40,
//       ],
//     },
//     type: "pure",
//   },
//   {
//     kind: "Input",
//     index: 4,
//     value: {
//       Pure: [0, 232, 118, 72, 23, 0, 0, 0],
//     },
//     type: "pure",
//   },
//   {
//     kind: "Input",
//     index: 5,
//     value: {
//       Pure: [0, 0, 0, 0, 0, 0, 0, 0],
//     },
//     type: "pure",
//   },
//   {
//     kind: "Input",
//     index: 6,
//     value: {
//       Pure: [
//         16, 224, 206, 220, 215, 141, 199, 208, 117, 245, 151, 68, 210, 225, 97,
//         226, 47, 18, 2, 214, 63, 115, 61, 111, 99, 246, 50, 92, 186, 47, 253,
//         183,
//       ],
//     },
//     type: "pure",
//   },
//   {
//     kind: "Input",
//     type: "object",
//     index: 7,
//     value: "0x0000000000000000000000000000000000000000000000000000000000000006",
//   })
// ]
