import {
  init_aggregator_deepbookv3_whitelist,
  SuiScriptClient,
  update_package_version,
  withdraw_deep_fee_from_aggregator_vault,
} from "../src"

describe("aggregator deepbook vault module", () => {
  const env = "pre-mainnet"
  const client = new SuiScriptClient(env)

  it("init aggregator deepbookv3 whitelist", async () => {
    // // testnet
    // const pools = [
    //   "0x0d1b1746d220bd5ebac5231c7685480a16f1c707a46306095a4c67dc7ce4dcae", // DEEP_SUI
    //   "0x520c89c6c78c566eed0ebf24f854a8c22d8fdd06a6f16ad01f108dad7f1baaea", // SUI_DBUSDC
    //   "0xee4bb0db95dc571b960354713388449f0158317e278ee8cda59ccf3dcd4b5288", // DEEP_DBUSDC
    //   "0x69cbb39a3821d681648469ff2a32b4872739d2294d30253ab958f85ace9e0491", // DBUSDT_DBUSDC
    // ]

    // mainnet
    const pools = [
      // "0xa0b9ebefb38c963fd115f52d71fa64501b79d1adcb5270563f92ce0442376545",
      // "0x0c0fdd4008740d81a8a7d4281322aee71a1b62c449eb5b142656753d89ebc060",
      // "0xe8e56f377ab5a261449b92ac42c8ddaacd5671e9fec2179d7933dd1a91200eec",
      // "0xb663828d6217467c8a1838a03793da896cbe745b150ebd57d82f814ca579fc22", // DEEP_SUI
      // "0x1109352b9112717bd2a7c3eb9a416fff1ba6951760f5bdd5424cf5e4e5b3e65c", // DBUSDT_DBUSDC
      // "0xe05dafb5133bcffb8d59f4e12465dc0e9faeaa05e3e342a08fe135800e3e4407", // DEEP_DBUSDC
      // "0xf948981b806057580f91622417534f491da5f61aeaf33d0ed8e69fd5691c95ce", // SUI_DBUSDC
      // "0x4e2ca3988246e1d50b9bf209abb9c1cbfec65bd95afdacc620a36c67bdb8452f",
      // "0x27c4fdb3b846aa3ae4a65ef5127a309aa3c1f466671471a806d8912a18b253e8",
      // "0x183df694ebc852a5f90a959f0f563b82ac9691e42357e9a9fe961d71a1b809c8",
      // "0x5661fc7f88fbeb8cb881150a810758cf13700bb4e1f31274a244581b37c303c3",
      // "0xc69f7755fec146583e276a104bcf91e0c9f0cab91dcdb1c202e8d76a5a5a1101",
      // "0x52f9bf16d9e7eff79da73d5e3dea39fe1ef8c77684bf4ec2c6566b41396404d0",
      // "0xde096bb2c59538a25c89229127fe0bc8b63ecdbe52a3693099cc40a1d8a2cfd4",
      // "0xe9aecf5859310f8b596fbe8488222a7fb15a55003455c9f42d1b60fab9cca9ba",
      "0x126865a0197d6ab44bfd15fd052da6db92fd2eb831ff9663451bbfa1219e2af2",
    ]

    await init_aggregator_deepbookv3_whitelist(client, pools, env)
  }, 20000)

  it("withdraw deep fee from aggregator", async () => {
    await withdraw_deep_fee_from_aggregator_vault(client, "119996893", env)
  }, 60000)

  it("update package version", async () => {
    await update_package_version(client, 1, env)
  }, 10000)
})
