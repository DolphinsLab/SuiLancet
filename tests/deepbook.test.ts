import {
  init_aggregator_deepbookv3_whitelist,
  init_sponsor_record,
  remove_aggregator_deepbookv3_whitelist,
  set_alternative_payment,
  SuiScriptClient,
} from "../src"
import {
  deposit_deep_fee_into_deepbookv3_utils,
  withdraw_deep_fee_from_deepbookv3_vaults,
} from "../src/methods/deepbookv3/deepbookv3_utils"
import {
  add_sponsor_whitelist_address,
  deposit_deep_fee_by_amount,
  deposit_deep_fee_by_object_id,
  remove_sponsor_whitelist_address,
  swap_b2a_,
  update_sponsor_fee_limit,
} from "../src/methods/deepbookv3/deepbookv3_vault"

describe("deepbook in deepbookv3 vaults module", () => {
  const env = "mainnet"
  const client = new SuiScriptClient(env)

  it("init whitelist", async () => {
    const pools = [
      // "0xde096bb2c59538a25c89229127fe0bc8b63ecdbe52a3693099cc40a1d8a2cfd4",
      // "0xe9aecf5859310f8b596fbe8488222a7fb15a55003455c9f42d1b60fab9cca9ba",
      // "0xb663828d6217467c8a1838a03793da896cbe745b150ebd57d82f814ca579fc22",
      // "0xf948981b806057580f91622417534f491da5f61aeaf33d0ed8e69fd5691c95ce",
      // "0xe05dafb5133bcffb8d59f4e12465dc0e9faeaa05e3e342a08fe135800e3e4407",
      // "0x52f9bf16d9e7eff79da73d5e3dea39fe1ef8c77684bf4ec2c6566b41396404d0",
      // "0x1109352b9112717bd2a7c3eb9a416fff1ba6951760f5bdd5424cf5e4e5b3e65c",
      // "0xc69f7755fec146583e276a104bcf91e0c9f0cab91dcdb1c202e8d76a5a5a1101",
      // "0xa0b9ebefb38c963fd115f52d71fa64501b79d1adcb5270563f92ce0442376545",
      // "0x4e2ca3988246e1d50b9bf209abb9c1cbfec65bd95afdacc620a36c67bdb8452f",
      // "0x0c0fdd4008740d81a8a7d4281322aee71a1b62c449eb5b142656753d89ebc060",
      // "0x27c4fdb3b846aa3ae4a65ef5127a309aa3c1f466671471a806d8912a18b253e8",
      // "0xe8e56f377ab5a261449b92ac42c8ddaacd5671e9fec2179d7933dd1a91200eec",
      // "0x183df694ebc852a5f90a959f0f563b82ac9691e42357e9a9fe961d71a1b809c8",
      // "0x5661fc7f88fbeb8cb881150a810758cf13700bb4e1f31274a244581b37c303c3",
      // "0x126865a0197d6ab44bfd15fd052da6db92fd2eb831ff9663451bbfa1219e2af2",
      // "0x2646dee5c4ad2d1ea9ce94a3c862dfd843a94753088c2507fea9223fd7e32a8f",
      // "0x1fe7b99c28ded39774f37327b509d58e2be7fff94899c06d22b407496a6fa990",
      // "0x56a1c985c1f1123181d6b881714793689321ba24301b3585eec427436eb1c76d",
      // "0x81f5339934c83ea19dd6bcc75c52e83509629a5f71d3257428c2ce47cc94d08b",
      "",
    ]
    await init_aggregator_deepbookv3_whitelist(client, pools, env)
  }, 600000)

  it("remove whitelist", async () => {
    // testnet
    const pools = [
      // "0x0d1b1746d220bd5ebac5231c7685480a16f1c707a46306095a4c67dc7ce4dcae", // DEEP_SUI
      // "0x520c89c6c78c566eed0ebf24f854a8c22d8fdd06a6f16ad01f108dad7f1baaea", // SUI_DBUSDC
      // "0xee4bb0db95dc571b960354713388449f0158317e278ee8cda59ccf3dcd4b5288", // DEEP_DBUSDC
      // "0x69cbb39a3821d681648469ff2a32b4872739d2294d30253ab958f85ace9e0491", // DBUSDT_DBUSDC
      // "0x0c0fdd4008740d81a8a7d4281322aee71a1b62c449eb5b142656753d89ebc060",
      // "0x27c4fdb3b846aa3ae4a65ef5127a309aa3c1f466671471a806d8912a18b253e8",
      // "0x5661fc7f88fbeb8cb881150a810758cf13700bb4e1f31274a244581b37c303c3",
      // "0x5661fc7f88fbeb8cb881150a810758cf13700bb4e1f31274a244581b37c303c3",
      // "0x183df694ebc852a5f90a959f0f563b82ac9691e42357e9a9fe961d71a1b809c8",
      // "0xc69f7755fec146583e276a104bcf91e0c9f0cab91dcdb1c202e8d76a5a5a1101",
      // "0x52f9bf16d9e7eff79da73d5e3dea39fe1ef8c77684bf4ec2c6566b41396404d0",
      // "0xde096bb2c59538a25c89229127fe0bc8b63ecdbe52a3693099cc40a1d8a2cfd4",
      // "0xe9aecf5859310f8b596fbe8488222a7fb15a55003455c9f42d1b60fab9cca9ba",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ]
    await remove_aggregator_deepbookv3_whitelist(client, pools, env)
  })

  it("deposit deep fee by object id", async () => {
    const deep_coin_object_id =
      "0xcffd15d6a7f3257d706588218caa98949fc246264514a5fb4e26751ce19e5ab6"
    await deposit_deep_fee_by_object_id(client, deep_coin_object_id, env)
  }, 60000)

  it("deposit deep fee by amount", async () => {
    await deposit_deep_fee_by_amount(client, 150000000000n, env)
  }, 60000)

  it("set if open deepbookv3 alternative payment", async () => {
    await set_alternative_payment(client, true, env)
  }, 600000)
})

describe("deepbook in deepbookv3_utils module", () => {
  const env = "pre-mainnet"
  const client = new SuiScriptClient(env)

  // it("deposit deep fee to deepbookv3_utils", async () => {
  //   const deep_coin_object_id =
  //     "0x44292006f0b17af1ca39ae6e34b2eb87995053fa52e680d0c5a973e3c90b9323"
  //   await deposit_deep_fee_into_deepbookv3_utils(
  //     client,
  //     deep_coin_object_id,
  //     env
  //   )
  // })

  it("withdraw deep fee from deepbookv3_utils", async () => {
    await withdraw_deep_fee_from_deepbookv3_vaults(client, "6370189663", env)
  }, 5000)

  it("init sponsor record", async () => {
    await init_sponsor_record(client, env)
  }, 500000)

  it("swap b2a", async () => {
    await swap_b2a_(
      client,
      env,
      "0x81f5339934c83ea19dd6bcc75c52e83509629a5f71d3257428c2ce47cc94d08b",
      500000000n,
      "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
      "0x2::sui::SUI",
      client.walletAddress
    )
  }, 500000)

  it("update sponsor fee limit", async () => {
    await update_sponsor_fee_limit(client, env, 300000)
  }, 500000)

  it("add sponsor whitelist address", async () => {
    await add_sponsor_whitelist_address(
      client,
      env,
      "0xf7b8d77dd06a6bb51c37ad3ce69e0a44c6f1064f52ac54606ef47763c8a71be6"
    )
  }, 500000)

  it("remove sponsor whitelist address", async () => {
    await remove_sponsor_whitelist_address(
      client,
      env,
      "0xf7b8d77dd06a6bb51c37ad3ce69e0a44c6f1064f52ac54606ef47763c8a71be6"
    )
  }, 500000)
})
