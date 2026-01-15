import { getTicksByRpc } from "~/methods/cetus/tick"
import { SuiScriptClient } from "../src"
import { getObjectRef } from "../src/common/object"
import {
  circle_swap,
  swap_then_place_market_order,
  transfer_coin,
  transfer_coin_by_coin_type,
  transfer_objects,
} from "../src/methods/make_money"
import {
  batchDestoryZeroCoin,
  batchSplitSpecialCoins,
  batchSplitSuiCoins,
  batchTransferZeroCoin,
  getSpecialAmountCoins,
  mergeCoins,
  refuel_specifal_coin,
  transfer_all_sui_coins,
} from "../src/methods/process_coin"

describe("coin module", () => {
  const env = "mainnet"
  const client = new SuiScriptClient(env)

  it("transfer test coin", async () => {
    const test_coin_types = [
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::usdc::USDC",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::usdt::USDT",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::deep::DEEP",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::cetus::CETUS",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::sui::SUI",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::hasui::HASUI",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::hawal::HAWAL",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::wal::WAL",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::eth::ETH",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::btc::BTC",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::weth::WETH",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::wbtc::WBTC",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::wusdc::WUSDC",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::buck::BUCK",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::usdy::USDY",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::fdusd::FDUSD",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::musd::MUSD",
      "0x471accdc88eb965674277074b3f4197ee18b8b052db7d2723eabec70e2d7e8f3::wwal::WWAL",
    ]

    const test_address = [
      "0xc5cea39da987d8fe16bf0c6db51bfbf4897aef0edf9588e035ae175ac416fdd1",
      "0x2a6174f94a2c1d648de290297be27867527a6aaa263a4e0a567c9cd7656d3651",
      "0xb0aeb3bf127c3f658e24d64db923d9374b172636bbd496c9710f1ecb33bbdd64",
    ]

    const amount = 100000000000000
    for (let i = 0; i < test_coin_types.length; i++) {
      for (let j = 0; j < test_address.length; j++) {
        const coin_type = test_coin_types[i]
        const address = test_address[j]
        await transfer_coin_by_coin_type(client, coin_type, address, amount)
      }
    }
  })

  it("transfer position objects", async () => {
    const position_objects1 = [
      "0x50b8982543d05dd302e3101b90d9aedd7d5ae33e10e0303e68a51be3516b4520",
      "0x95755badede75d67a4ead1217798a8e969787e03a9cce3f96afae538e60134cb",
      "0x90e1b9b94a4a86fca58a75bd3b63654083f3580b60f80726e8303305946b423d",
    ]
    const position_objects2 = [
      "0xa401e12c7d52d1cb43a39a0ef7aedba1bd92488d1da4232b6ba8dbcbf78625d9",
      "0xfd0a1f56bc3a3ee483170887f1733d6d410e885b5d34d549a925a1c1b2279c0d",
      "0xaa9525af2228ef42ceb3c52bcccda32d1feba4fd278209a87c9a94ce53865972",
    ]
    const position_objects3 = [
      "0xdc9c2b0e5dcfdefe29efb724a24a472fb47ba6eebb112467de4946518e247952",
      "0xe6cd7642d874318a8abe244f128707c06f0e26c8dc3a98bd871e7c3e69a0742a",
      "0x6ac6f1a1d2d8102695640750ea7bdc90de5feccf998c84bb427b60e0b75a9252",
    ]

    const wallet_address = [
      "0xc5cea39da987d8fe16bf0c6db51bfbf4897aef0edf9588e035ae175ac416fdd1",
      "0x2a6174f94a2c1d648de290297be27867527a6aaa263a4e0a567c9cd7656d3651",
      "0xb0aeb3bf127c3f658e24d64db923d9374b172636bbd496c9710f1ecb33bbdd64",
    ]

    const position_objects = [
      position_objects1,
      position_objects2,
      position_objects3,
    ]

    for (let i = 0; i < wallet_address.length; i++) {
      for (let j = 0; j < position_objects.length; j++) {
        const wallet_address_id = wallet_address[i]
        await transfer_objects(client, position_objects[j], wallet_address_id)
      }
    }
  })

  it("get ticks", async () => {
    const poolId =
      "0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105"
    const ticks = await getTicksByRpc(poolId)
    console.log(ticks)
  })

  it("transfer upgrade cetus coin", async () => {
    const upgrade_cap_ids = [
      "0x492d465fe3e4cedee73fb98685e68df11578084edfa66aac2c6bd295ba4a396e", // aggregator v3
      "0x44236317904aaa70fa003897fdc1f87e593f528d2014a52cfd62d098cc4bdef3", // afsui
      "0x83ec4f62ff79dd7cd287067bbd780675656c6777f7f154b42abeb39254736c56", // aftermath
      "0x795db69baba0c0434bf12a47568a0920b28f038d15d92043aed33f723c957c7e", // alphafi
      "0xd996136255477385447a3e04f82b0820d80f1b7a8e287355db1f4024d5f8c471", // bluefin
      "0x9258091b9185994cd9290129b11f544289b134eed437151c851ade00b7967c75", // bluemove
      "0x082ff68df2108e4bd3e1ed4e63cb2cda52fa337e048047c19a9290ebaf564c4f", // cetus
      "0x125357d032fdbc2e32f8bf73d663267edb626b81525dab4e140851e301ded3dc", // deepbookv3
      "0x656c32c6877d24f917ed338e7b7b3e3c7ea1055ee22e93ecef14daf400c63d2a", // flowx
      "0x01f212d67fd78a889da75a0699567416b5393fb8438e066a82d4e07e9d443970", // haedal
      "0xec52d9cf23570a3846f9978f0d9cb2d13a3da17e79a09a52b0e196f7a6dbec2e", // kriya
      "0x3a3d43a91084afb7b6b243158606d723ea3170edc982afb35268d9b84dd19f33", // metastable
      "0x1fce268d012fd3f3a06c59d5d600788d89716017fe5dfe86ef2935d4d00ef5a6", // momentum
      "0xf0642afb8f7f9821a6453a4de44f99c85191e0bc56bda2d1a0c01cc96f636276", // obric
      "0xbf77cd0e0efab6bd0f3fa09d94ec0c02323890df9e29f580f4996c96f051787d", // scallop
      "0xb175b347bb797a93851a30b943ce0a94580ba71dc8cc16ba001f2b6b4046acdd", // steamm
      "0xe87dee1a9283c2e1c1b14bcc70c0ca85f9d287a3841c48b1274aa70c4bd65806", // springsui
      "0xf36c4cedb772555e13398b56682a44df5c49fca994b1459ddab52e288636681d", // turbos
      "0x137d6f8e95223ac4156430915d4ee0ad5bab8d6fe12c139930662942c461d319", // volo
      "0xe095d61288a6356269cbac78b541adcbe9832d9c1b58a09e23088d3dd5acd030", // magma
      "0x84cfd857536ae2cbee2c8d82ef6ff6e71aa5c330e54ef21ccc38b033a43a0d16", // fullsail
      "0x2be49d710161751f664c13ac3228cf2b2c271ef31295eb6499cc65483f7032f0", // sevenk
      "0xde019f9ac1d397b969e3dfcf41fb10df30a44ee02b6ea0b720e79e8b1e5d8665", // cetus dlmm
      // "0x2449960f9625a0fa686546370262a4bb1c1abd6797709660deafff466806158d", // cetus dlmm pre
    ]

    await transfer_objects(
      client,
      upgrade_cap_ids,
      "0x2891c6b8dca29a075d263c1bb21c7b88adf3ff6baddae1b8743cc00b66bd2c47"
    )
  })
})
