import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../client"
import {
  deposit_movecall,
  first_aid_packet_movecall,
  withdraw_movecall,
} from "../movecall/vault"
import { getObjectRef } from "../common/object"

export async function deposit_into_vault(
  client: SuiScriptClient,
  coin_object_id: string,
  coin_type: string,
  amount: number
) {
  const txb = new Transaction()
  deposit_movecall(txb, coin_object_id, coin_type, amount)
  const txRes = await client.sendTransaction(txb)
  console.log(txRes)
}

export async function withdraw_from_vault(
  client: SuiScriptClient,
  coin_type: string,
  amount: number,
  target_address: string,
  gas?: string
) {
  const txb = new Transaction()
  if (gas) {
    const gasObjectRef = await getObjectRef(client, gas)
    txb.setGasPayment([gasObjectRef])
  }
  const coin = withdraw_movecall(txb, coin_type, amount)
  txb.transferObjects([coin], target_address)
  const txRes = await client.sendTransaction(txb)
  console.log(txRes)
}

export async function first_aid_packet(
  client: SuiScriptClient,
  coins: string[],
  gas?: string
) {
  const txb = new Transaction()
  if (gas) {
    const gasObjectRef = await getObjectRef(client, gas)
    txb.setGasPayment([gasObjectRef])
  }
  first_aid_packet_movecall(txb, coins)

  const txRes = await client.sendTransaction(txb)
  console.log(txRes)
}
