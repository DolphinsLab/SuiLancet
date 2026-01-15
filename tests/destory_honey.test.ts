import { SuiScriptClient } from "../src"
import { destory_honny } from "../src/methods/destory_honny"

describe("aggregator module", () => {
  const env = "mainnet"
  const client = new SuiScriptClient(env)

  it("destory honny", async () => {
    // const apu =
    //   "0xfd928945811f470f08ffa40ffaf3e659c9981f0adb1a16d25b6c803a18557546::APU::APU"
    // const frogs =
    //   "0x9bca5934444076d8ce0feda4f2674985ee52666c15f39ff4484bdd4f5e5d910b::FROGS::FROGS"
    // const pac =
    //   "0x1882fd80015028f1a2457e0cf4a065d9ae0fbd4e9c4dd719ebe34ceb4945bcb8::PAC::PAC"
    // const numogram =
    //   "0xd0c0d0c6fc947b86bfaa5d97867c25a63c06000eda5a62f22930ec5b284a20f9::NUMOGRAM::NUMOGRAM"
    const bobo =
      "0x94727b59a9b767e41c3551146adce437f72d24272597b73ca9a1ebf59d20d08f::BOBO::BOBO"

    await destory_honny(client, bobo)
  }, 6000000)
})
