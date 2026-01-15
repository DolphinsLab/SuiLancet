import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../client"
import { createAccountCapMoveCall } from "../../movecall/nave/lending"

export async function createAccountCap(client: SuiScriptClient) {
  const txb = new Transaction()
  const accountCap = createAccountCapMoveCall(txb)
  txb.transferObjects([accountCap], client.walletAddress)
  await client.sendTransaction(txb)
}
