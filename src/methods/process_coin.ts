import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions"
import { SuiScriptClient } from "../client"
import { destoryZeroCoin } from "../movecall"
import { getObjectRef } from "../common/object"
import { sleep } from "../common"

export async function batchDestoryZeroCoin(
  client: SuiScriptClient,
  gasBudget?: number,
  gas?: string
) {
  const coins = await client.getAllCoins()
  console.log(`total coins: ${coins.length}`)

  const batch = 500 // batch 20 coins

  let coins_num = 0
  for (let i = 0; i < coins.length; i += batch) {
    const batchCoins = coins.slice(i, i + batch)
    const tx = new Transaction()
    for (const coin of batchCoins) {
      if (coin.balance !== 0) {
        continue
      }
      coins_num++
      destoryZeroCoin(tx, coin.objectId, coin.coinType)
    }

    if (coins_num === 0) {
      console.log("no coins to destroy")
      break
    }

    const devInspectRes = await client.devInspectTransactionBlock(tx)
    console.log(devInspectRes)
    if (devInspectRes.effects.status.status !== "success") {
      console.log("transaction failed")
      continue
    }
    if (gasBudget) {
      tx.setGasBudget(gasBudget)
    }
    if (gas) {
      const gasObjectRef = await getObjectRef(client, gas)
      tx.setGasPayment([gasObjectRef])
    }

    const txRes = await client.signAndExecuteTransaction(tx)
    console.log(txRes)

    await sleep(10)
  }
}

export async function getSpecialAmountCoins(
  client: SuiScriptClient,
  min_amount: number,
  max_amount: number,
  coinType: string
) {
  const coins = await client.getCoinsByTypeV2(coinType)
  const filteredCoins = coins.filter(
    (coin) => coin.balance >= min_amount && coin.balance <= max_amount
  )
  return filteredCoins.map((coin) => coin.objectId)
}

export async function batchSplitSuiCoins(
  client: SuiScriptClient,
  amounts: number[],
  gas?: string
) {
  const txb = new Transaction()
  if (gas) {
    const gasObjectRef = await getObjectRef(client, gas)
    txb.setGasPayment([gasObjectRef])
  }
  const amountArgs = amounts.map((amount) => amount.toString())
  const splitCoins = txb.splitCoins(txb.gas, amountArgs)
  const coins: TransactionObjectArgument[] = []
  for (let i = 0; i < amounts.length; i++) {
    const coin = splitCoins[i] as TransactionObjectArgument
    coins.push(coin)
  }
  txb.transferObjects(coins, client.walletAddress)
  await client.sendTransaction(txb)
}

export async function batchSplitSpecialCoins(
  client: SuiScriptClient,
  coin_object_id: string,
  amounts: number[],
  gas?: string
) {
  const txb = new Transaction()
  if (gas) {
    const gasObjectRef = await getObjectRef(client, gas)
    txb.setGasPayment([gasObjectRef])
  }
  const amountArgs = amounts.map((amount) => amount.toString())
  let splitCoins
  if (coin_object_id === gas) {
    splitCoins = txb.splitCoins(txb.gas, amountArgs)
  } else {
    splitCoins = txb.splitCoins(txb.object(coin_object_id), amountArgs)
  }
  // const splitCoins = txb.splitCoins(txb.object(coin_object_id), amountArgs)
  const coins: TransactionObjectArgument[] = []
  for (let i = 0; i < amounts.length; i++) {
    const coin = splitCoins[i] as TransactionObjectArgument
    coins.push(coin)
  }
  txb.transferObjects(coins, client.walletAddress)
  await client.sendTransaction(txb)
}

export async function batchTransferZeroCoin(
  client: SuiScriptClient,
  acceptAddress: string
) {
  const txb = new Transaction()

  const coins = await client.getAllCoins()

  const emptyCoins: string[] = []
  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i]
    if (coin.balance == 2000000000) {
      continue
    }
    emptyCoins.push(coin.objectId)
  }

  // batch 500 coins
  const batch = 500
  for (let i = 0; i < emptyCoins.length; i += batch) {
    const batchCoins = emptyCoins.slice(i, i + batch)
    txb.transferObjects(batchCoins, acceptAddress)
  }
  await client.sendTransaction(txb)

  await sleep(1000)
}

export async function batchTransferCoin(
  client: SuiScriptClient,
  acceptAddress: string,
  coinType: string,
  amount: number
) {
  const txb = new Transaction()

  const coins = await client.getCoinsByType(coinType)

  const transferCoins: TransactionObjectArgument[] = []
  for (let i = 0; i < amount; i++) {
    transferCoins.push(txb.object(coins[i].objectId))
  }

  txb.transferObjects(transferCoins, acceptAddress)

  const txRes = await client.sendTransaction(txb)
  console.log(txRes)
}

export async function mergeCoins(
  client: SuiScriptClient,
  coinType: string,
  gas?: string
) {
  let coins = await client.getCoinsByType(coinType)
  const isSUI =
    coinType ===
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"

  // 每批处理50个代币
  const batchSize = 50
  const txb = new Transaction()
  if (gas) {
    const gasObjectRef = await getObjectRef(client, gas)
    txb.setGasPayment([gasObjectRef])
  }
  const maxCount = Math.min(coins.length, 1200)
  console.log(`merge ${maxCount} ${coinType} coins`)

  // filter gas object
  let resultCoin
  if (isSUI) {
    resultCoin = gas ? gas : coins[0].objectId
  } else {
    resultCoin = coins[0].objectId
  }

  const filteredBatchCoins = coins.filter(
    (coin) =>
      coin.objectId !==
        "0x1ada33245e95fd7298865f2126719a3182f9e5331766db57e9a720ec2788c14b" &&
      coin.objectId !==
        "0x2533011764d848dd68725a88b39103537fccbc73a9e5cfb0a5d85f5fc347df5f" &&
      coin.objectId !==
        "0x34ad0888b588d34f97cc41987e0d99875f10fd6111563b6532860a13ec7e824d" &&
      coin.objectId !==
        "0x382775c2a89ac57e034ef5366a77467d07033f4574095dbaf2d63b05842705ce" &&
      coin.objectId !==
        "0xa45c683257e320abe7bf5f80a838c4b3f7b9fff2ca2f559a39aaafd0c26c060a"
  )

  let remainCoins = filteredBatchCoins.slice(1, maxCount)

  let resultCoins: TransactionObjectArgument[] = []
  for (let i = 0; i < remainCoins.length; i += batchSize) {
    const batchCoins = remainCoins.slice(i + 1, i + batchSize)
    // filter id = 0x1ada33245e95fd7298865f2126719a3182f9e5331766db57e9a720ec2788c14b

    let waitMergeCoins = batchCoins.map((coin) => txb.object(coin.objectId))
    let mergedCoin = txb.object(remainCoins[i].objectId)
    txb.mergeCoins(mergedCoin, waitMergeCoins)
    resultCoins.push(mergedCoin)
  }

  if (isSUI) {
    txb.mergeCoins(txb.gas, resultCoins)
  } else {
    txb.mergeCoins(txb.object(resultCoin), resultCoins)
  }

  await client.sendTransaction(txb)
}

export async function mergeCoinsAndTransfer(
  client: SuiScriptClient,
  coinType: string,
  acceptAddress: string,
  gas?: string
) {
  let coins = await client.getCoinsByTypeV2(coinType)
  const isSUI =
    coinType ===
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"

  console.log(`merge ${coins.length} ${coinType} coins`)
  // 每批处理50个代币
  const txb = new Transaction()
  if (gas) {
    const gasObjectRef = await getObjectRef(client, gas)
    txb.setGasPayment([gasObjectRef])
  }
  const maxMergeCount = 2000

  const maxCount = Math.min(maxMergeCount, coins.length)
  const batchSize = 100 // 每批处理 50 个（可以根据链的限制调整）
  let waitMergeCoins: TransactionObjectArgument[] = []

  // 外层循环应该以 batchSize 为步长
  for (let i = 0; i < maxCount; i += batchSize) {
    // const txb = new TransactionBlock() // 每批需要新的事务

    // 计算这一批要处理的 coins
    const endIndex = Math.min(i + batchSize, maxCount)
    const batchCoins = coins.slice(i, endIndex)

    if (batchCoins.length <= 1) continue

    waitMergeCoins = batchCoins.map((coin) => txb.object(coin.objectId))

    if (i === 0) {
      // 第一批：合并到 coins[0]
      if (isSUI) {
        txb.mergeCoins(txb.gas, waitMergeCoins.slice(1))
      } else {
      }
    } else {
      // 后续批次：都合并到 coins[0]
      const firstCoin = txb.object(coins[0].objectId)
      if (isSUI) {
        txb.mergeCoins(txb.gas, waitMergeCoins)
      } else {
        txb.mergeCoins(firstCoin, waitMergeCoins)
      }
    }
  }
  txb.transferObjects([waitMergeCoins[0]], acceptAddress)
  await client.sendTransaction(txb)
  await sleep(100) // 添加延时，防止请求过于频繁
}

export async function refuel_specifal_coin(
  client: SuiScriptClient,
  pure_coin_object_id: string,
  refuel_coin_object_id: string,
  amount: number,
  gas?: string
) {
  const txb = new Transaction()
  if (gas) {
    const gasObjectRef = await getObjectRef(client, gas)
    txb.setGasPayment([gasObjectRef])
  }

  //   const coin = txb.splitCoins(txb.object(pure_coin_object_id), [amount])
  const coin = txb.splitCoins(txb.gas, [amount])
  txb.mergeCoins(txb.object(refuel_coin_object_id), [coin])
  await client.sendTransaction(txb)
}

export async function transfer_all_sui_coins(
  client: SuiScriptClient,
  recipient: string
) {
  const txb = new Transaction()
  txb.transferObjects([txb.gas], recipient)
  await client.sendTransaction(txb)
}

export async function mergeSpecialCoins(
  client: SuiScriptClient,
  targetCoin: string,
  amount: number,
  gas?: string
) {}
