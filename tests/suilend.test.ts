import { SuiScriptClient } from "../src"
import { get_steammfe_test_coin } from "../src/methods/suilend/steammfe_test_coin"

describe("blub ambassador module", () => {
  const env = "mainnet"
  const client = new SuiScriptClient(env)

  it("get test coin", async () => {
    const amount = 999000000000

    const addresses = [
      "0x91146573f34bae3dc0cd7eb5f4c33ec1e179106cc3cb648e33cd4891e519800b",
      "0x3992ecfe4eca00d482210cddfceb063608f45f3ca41ce7eedea33f27870eb55a",
    ]

    const coin_types = [
      "0x2e868e44010e06c0fc925d29f35029b6ef75a50e03d997585980fb2acea45ec6::sui::SUI",
      "0x2e868e44010e06c0fc925d29f35029b6ef75a50e03d997585980fb2acea45ec6::usdc::USDC",
    ]

    for (const address of addresses) {
      for (const coin_type of coin_types) {
        await get_steammfe_test_coin(client, coin_type, amount, address)
      }
    }
  })
})
