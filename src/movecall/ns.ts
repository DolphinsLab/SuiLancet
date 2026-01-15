import { CLOCK_ADDRESS } from "@cetusprotocol/aggregator-sdk"
import { Transaction } from "@mysten/sui/transactions"

export async function ns_swap_movecall(
  txb: Transaction,
  coin_object_id: string,
  amount: number,
  address: string
) {
  const input_coin = txb.splitCoins(coin_object_id, [txb.pure.u64(amount)])
  // turbos swap
  const return_coin = txb.moveCall({
    target: `0xf98ed029af555e4a103febf26243dc33ac09a7ea1b2da7e414c728b25b729086::turbos::swap_b2a`,
    arguments: [
      txb.object(
        "0x1900a9839297771b27dc4a3784e3cc8ec33f5f699668190654d3286782b75382"
      ),
      input_coin,
      txb.object(CLOCK_ADDRESS),
      txb.object(
        "0xf1cf0e81048df168ebeb1b8030fad24b3e0b53ae827c25053fff0779c1445b6f"
      ),
    ],
    typeArguments: [
      "0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS",
      "0x2::sui::SUI",
      "0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1::fee10000bps::FEE10000BPS",
    ],
  })

  const result_coin = txb.moveCall({
    target: `0xf98ed029af555e4a103febf26243dc33ac09a7ea1b2da7e414c728b25b729086::flowx_clmm::swap_b2a`,
    arguments: [
      txb.object(
        "0x27565d24a4cd51127ac90e4074a841bbe356cca7bf5759ddc14a975be1632abc"
      ),
      txb.pure.u64("10000"),
      return_coin,
      txb.object(
        "0x67624a1533b5aff5d0dfcf5e598684350efd38134d2d245f475524c03a64e656"
      ),
      txb.object(CLOCK_ADDRESS),
    ],
    typeArguments: [
      "0x2::sui::SUI",
      "0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS",
    ],
  })

  txb.moveCall({
    target: `0xf98ed029af555e4a103febf26243dc33ac09a7ea1b2da7e414c728b25b729086::utils::check_coin_threshold`,
    arguments: [result_coin, txb.pure.u64(amount)],
    typeArguments: [],
  })

  txb.transferObjects([result_coin], address)
}
