import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../core"
import {
  deposit_movecall,
  first_aid_packet_movecall,
  withdraw_movecall,
} from "../../movecall/vault"
import { getObjectRef } from "../../common/object"
import { CommandResult } from "../../core/types"

export async function depositIntoVault(
  client: SuiScriptClient,
  coinObjectId: string,
  coinType: string,
  amount: number
): Promise<CommandResult> {
  const txb = new Transaction()
  deposit_movecall(txb, coinObjectId, coinType, amount)
  const txRes = await client.sendTransaction(txb)
  return {
    success: true,
    message: `Deposited ${amount} into vault`,
    data: { digest: txRes?.digest },
  }
}

export async function withdrawFromVault(
  client: SuiScriptClient,
  coinType: string,
  amount: number,
  targetAddress: string,
  options: { gasObject?: string } = {}
): Promise<CommandResult> {
  const txb = new Transaction()

  if (options.gasObject) {
    const gasObjectRef = await getObjectRef(client, options.gasObject)
    txb.setGasPayment([gasObjectRef])
  }

  const coin = withdraw_movecall(txb, coinType, amount)
  txb.transferObjects([coin], targetAddress)
  const txRes = await client.sendTransaction(txb)
  return {
    success: true,
    message: `Withdrew ${amount} from vault to ${targetAddress}`,
    data: { digest: txRes?.digest },
  }
}

export async function firstAidPacket(
  client: SuiScriptClient,
  coins: string[],
  options: { gasObject?: string } = {}
): Promise<CommandResult> {
  const txb = new Transaction()

  if (options.gasObject) {
    const gasObjectRef = await getObjectRef(client, options.gasObject)
    txb.setGasPayment([gasObjectRef])
  }

  first_aid_packet_movecall(txb, coins)
  const txRes = await client.sendTransaction(txb)
  return {
    success: true,
    message: `First aid packet executed for ${coins.length} coins`,
    data: { digest: txRes?.digest },
  }
}
