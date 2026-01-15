import { SuiScriptClient } from "../src"
import { createAccountCap } from "../src/methods/nave/lending"

describe("nave lending module", () => {
  const env = "mainnet"
  const client = new SuiScriptClient(env)

  it("create account cap", async () => {
    await createAccountCap(client)
  })
})
