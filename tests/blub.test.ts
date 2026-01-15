import { Transaction } from "@mysten/sui/transactions"
import { printTransaction, SuiScriptClient } from "../src"
import {
  create_ambassador,
  get_medias,
  get_payment_info,
  query_ambassador_by_owner,
} from "../src/methods/blub/ambassador"

describe("blub ambassador module", () => {
  const env = "testnet"
  const client = new SuiScriptClient(env)

  it("create ambassador", async () => {
    await create_ambassador(client, env)
  })

  it("query ambassador by owner", async () => {
    const owner =
      "0xa6c8f6e7058442e5a05778d46b721c12b5b930e0859717e05eed1b275bbafc2e"
    const ambassador_id = await query_ambassador_by_owner(client, owner, env)
    console.log(ambassador_id)
  }, 5000)

  it("query medias by ambassador id", async () => {
    const owner =
      "0xa6c8f6e7058442e5a05778d46b721c12b5b930e0859717e05eed1b275bbafc2e"
    const ambassador_id = await query_ambassador_by_owner(client, owner, env)
    await get_medias(client, ambassador_id)
  }, 10000)

  it("query payment info by ambassador id", async () => {
    const ambassador_id =
      "0x1e840a74d937dd55b06d7609c31edc300ba9c3a94d02c1f82926807403b7506a"
    await get_payment_info(client, ambassador_id, env)
  }, 10000)
})
