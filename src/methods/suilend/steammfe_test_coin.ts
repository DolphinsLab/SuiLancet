import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../client"
import { get_test_coin_movecall } from "../../movecall/suilend/steammfe_test_coin"

export async function get_steammfe_test_coin(
  client: SuiScriptClient,
  coin_type: string,
  amount: number,
  address?: string
) {
  const txb = new Transaction()

  const test_coin = get_test_coin_movecall(txb, coin_type, amount)
  if (address) {
    txb.transferObjects([test_coin], address)
  } else {
    txb.transferObjects([test_coin], client.walletAddress)
  }

  const txRes = await client.sendTransaction(txb)
  console.log(txRes)
}
