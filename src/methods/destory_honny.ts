import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../client"
import { buy_honey_pot, sell_honey_pot } from "../movecall/honny-hot/swap"

export type HoneyConfig = {
  coin_type: string
  pool: string
}

const apu_config: HoneyConfig = {
  coin_type:
    "0xfd928945811f470f08ffa40ffaf3e659c9981f0adb1a16d25b6c803a18557546::APU::APU",
  pool: "0x6da385b68b5e27a3cfc12322fcd8aca99749ce7a0d7e5a7b5777e808fa5c0c49",
}

const frogs_config: HoneyConfig = {
  coin_type:
    "0x9bca5934444076d8ce0feda4f2674985ee52666c15f39ff4484bdd4f5e5d910b::FROGS::FROGS",
  pool: "0xb2066f98a3f5046103be161cc3dc5f0a8e5472379fc18054eddbc20582d34fc1",
}

const pac_config: HoneyConfig = {
  coin_type:
    "0x1882fd80015028f1a2457e0cf4a065d9ae0fbd4e9c4dd719ebe34ceb4945bcb8::PAC::PAC",
  pool: "0x1a4e69abd9ee0b5e7b905d515f77d15c2d93903598f3d28e4fb506e8b8137ca7",
}

const bobo_config: HoneyConfig = {
  coin_type:
    "0x94727b59a9b767e41c3551146adce437f72d24272597b73ca9a1ebf59d20d08f::BOBO::BOBO",
  pool: "0x580fcb64ab276508f2f4060c12256f06025ba5153e1a454c0fc4c96aee2fc377",
}

const numogram_config: HoneyConfig = {
  coin_type:
    "0xd0c0d0c6fc947b86bfaa5d97867c25a63c06000eda5a62f22930ec5b284a20f9::NUMOGRAM::NUMOGRAM",
  pool: "0xb41365820ce7d8f60cc3de017dcb8b3e116a71ac8a094935d807e84c2cf3cc0c",
}

const hash_config: Map<string, HoneyConfig> = new Map([
  [
    "0xfd928945811f470f08ffa40ffaf3e659c9981f0adb1a16d25b6c803a18557546::APU::APU",
    apu_config,
  ],
  [
    "0x9bca5934444076d8ce0feda4f2674985ee52666c15f39ff4484bdd4f5e5d910b::FROGS::FROGS",
    frogs_config,
  ],
  [
    "0xd0c0d0c6fc947b86bfaa5d97867c25a63c06000eda5a62f22930ec5b284a20f9::NUMOGRAM::NUMOGRAM",
    numogram_config,
  ],
  [
    "0x94727b59a9b767e41c3551146adce437f72d24272597b73ca9a1ebf59d20d08f::BOBO::BOBO",
    bobo_config,
  ],
])

export async function destory_honny(
  client: SuiScriptClient,
  coin_type: string
) {
  console.log("coin_type", coin_type)
  const config = hash_config.get(coin_type)!

  const aaa = 3000000000
  while (true) {
    // buy
    // let buy_success = false
    // while (!buy_success) {
    //   const buy_txb = new Transaction()
    //   buy_honey_pot(buy_txb, config, aaa)

    //   const buy_txRes = await client.signAndExecuteTransaction(buy_txb)
    //   if (buy_txRes.effects.status.status !== "success") {
    //     buy_success = false
    //   } else {
    //     console.log("buy success")
    //     buy_success = true
    //   }
    // }

    let sell_success = false

    while (!sell_success) {
      const sell_txb = new Transaction()
      // let amount = get_amount(sell_txb, env)

      sell_honey_pot(sell_txb, 0, config)

      const devInspectRes = await client.devInspectTransactionBlock(sell_txb)
      // console.log(devInspectRes)
      if (devInspectRes.effects.status.status !== "success") {
        // sleep 1s
        await new Promise((resolve) => setTimeout(resolve, 300))
        // console.log("transaction failed")
        sell_success = false
      } else {
        const txRes = await client.signAndExecuteTransaction(sell_txb)
        if (txRes.effects?.status.status !== "success") {
          sell_success = false
        } else {
          console.log("sell success")
          sell_success = true
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 10000))
  }
}
