import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../core"
import { CommandResult } from "../../core/types"

export async function transferCoin(
  client: SuiScriptClient,
  coinObjectId: string,
  recipient: string
): Promise<CommandResult> {
  const txb = new Transaction()
  txb.transferObjects([txb.object(coinObjectId)], recipient)
  const txRes = await client.sendTransaction(txb)
  return {
    success: true,
    message: `Transferred coin ${coinObjectId} to ${recipient}`,
    data: { digest: txRes?.digest },
  }
}

export async function transferCoinByType(
  client: SuiScriptClient,
  coinType: string,
  recipient: string,
  amount: number
): Promise<CommandResult> {
  const txb = new Transaction()
  const coins = await client.getCoinsByType(coinType)
  const coin = await client.buildInputCoin(coins, BigInt(amount), txb)
  txb.transferObjects([coin], recipient)
  const txRes = await client.sendTransaction(txb)
  return {
    success: true,
    message: `Transferred ${amount} of ${coinType} to ${recipient}`,
    data: { digest: txRes?.digest },
  }
}

export async function transferAllSui(
  client: SuiScriptClient,
  recipient: string
): Promise<CommandResult> {
  const txb = new Transaction()
  txb.transferObjects([txb.gas], recipient)
  const txRes = await client.sendTransaction(txb)
  return {
    success: true,
    message: `Transferred all SUI to ${recipient}`,
    data: { digest: txRes?.digest },
  }
}

export async function batchTransferCoin(
  client: SuiScriptClient,
  recipient: string,
  coinType: string,
  count: number
): Promise<CommandResult> {
  const txb = new Transaction()
  const coins = await client.getCoinsByType(coinType)

  if (coins.length < count) {
    return {
      success: false,
      message: `Not enough coins: have ${coins.length}, need ${count}`,
    }
  }

  const transferCoins: TransactionObjectArgument[] = []
  for (let i = 0; i < count; i++) {
    transferCoins.push(txb.object(coins[i].objectId))
  }

  txb.transferObjects(transferCoins, recipient)
  const txRes = await client.sendTransaction(txb)
  return {
    success: true,
    message: `Transferred ${count} coins to ${recipient}`,
    data: { digest: txRes?.digest },
  }
}

export async function transferObjects(
  client: SuiScriptClient,
  objectIds: string[],
  recipient: string
): Promise<CommandResult> {
  const txb = new Transaction()
  const objectRefs = objectIds.map((id) => txb.object(id))
  txb.transferObjects(objectRefs, recipient)
  const txRes = await client.sendTransaction(txb)
  return {
    success: true,
    message: `Transferred ${objectIds.length} objects to ${recipient}`,
    data: { digest: txRes?.digest },
  }
}
