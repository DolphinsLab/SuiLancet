import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../core"
import { getObjectRef } from "../../common/object"
import { CommandResult } from "../../core/types"

export async function splitSuiCoins(
  client: SuiScriptClient,
  amounts: number[],
  options: { gasObject?: string } = {}
): Promise<CommandResult> {
  const txb = new Transaction()

  if (options.gasObject) {
    const gasObjectRef = await getObjectRef(client, options.gasObject)
    txb.setGasPayment([gasObjectRef])
  }

  const amountArgs = amounts.map((amount) => amount.toString())
  const splitCoins = txb.splitCoins(txb.gas, amountArgs)
  const coins: TransactionObjectArgument[] = []

  for (let i = 0; i < amounts.length; i++) {
    coins.push(splitCoins[i] as TransactionObjectArgument)
  }

  txb.transferObjects(coins, client.walletAddress)
  const txRes = await client.sendTransaction(txb)
  return {
    success: true,
    message: `Split SUI into ${amounts.length} coins`,
    data: { digest: txRes?.digest, amounts },
  }
}

export async function splitSpecialCoin(
  client: SuiScriptClient,
  coinObjectId: string,
  amounts: number[],
  options: { gasObject?: string } = {}
): Promise<CommandResult> {
  const txb = new Transaction()

  if (options.gasObject) {
    const gasObjectRef = await getObjectRef(client, options.gasObject)
    txb.setGasPayment([gasObjectRef])
  }

  const amountArgs = amounts.map((amount) => amount.toString())
  const splitCoins =
    coinObjectId === options.gasObject
      ? txb.splitCoins(txb.gas, amountArgs)
      : txb.splitCoins(txb.object(coinObjectId), amountArgs)

  const coins: TransactionObjectArgument[] = []
  for (let i = 0; i < amounts.length; i++) {
    coins.push(splitCoins[i] as TransactionObjectArgument)
  }

  txb.transferObjects(coins, client.walletAddress)
  const txRes = await client.sendTransaction(txb)
  return {
    success: true,
    message: `Split coin into ${amounts.length} parts`,
    data: { digest: txRes?.digest, amounts },
  }
}
