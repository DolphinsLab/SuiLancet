import {
  createMarket,
  transferAdminCap,
  transferObject,
  updateMarketMaxLeverage,
  updateMarketOpenFeeRate,
} from "~/methods/margin_trading/config"
import { SuiScriptClient } from "../src"
import {
  CreateMarketParams,
  UpdateMarketMaxLeverageParams,
  UpdateMarketOpenFeeRateParams,
} from "~/movecall/margin-trading/market"

describe("nave lending module", () => {
  const env = "mainnet"
  const client = new SuiScriptClient(env)

  it("create market", async () => {
    const params: CreateMarketParams = {
      baseCoinType:
        "0x3e8e9423d80e1774a7ca128fccd8bf5f1f7753be658c5e645929037f7c819040::lbtc::LBTC",
      quoteCoinType:
        "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
      maxLongLeverage: 2400000,
      maxShortLeverage: 2400000,
      openFeeRate: 0,
      closeFeeRate: 0,
    }
    await createMarket(client, "mainnet", params)
  })

  it("update market max leverage", async () => {
    const params: UpdateMarketMaxLeverageParams = {
      marketId:
        "0xc4983cc602b417328e346b59f0f5bb24f6a9ca33961b3657d852670ba20f2bbb",
      maxLongLeverage: 4000000,
      maxShortLeverage: 4340000,
    }
    await updateMarketMaxLeverage(client, "pre-mainnet", params)
  })

  it("update market open fee rate", async () => {
    const params: UpdateMarketOpenFeeRateParams = {
      marketId:
        "0xc4983cc602b417328e346b59f0f5bb24f6a9ca33961b3657d852670ba20f2bbb",
      openFeeRate: 500,
      closeFeeRate: 500,
    }
    await updateMarketOpenFeeRate(client, "pre-mainnet", params)
  })

  it("transfer admin cap", async () => {
    await transferAdminCap(
      client,
      "mainnet",
      "0x52bfafe1e1022f2ba070f638128f34e8a948eafe5ce778c0702507652cc3f033"
    )
  })

  it("transfer object", async () => {
    await transferObject(
      client,
      "mainnet",
      "0xcedac501a6af23e33d3ce2803fb381a70a42e2596d53d44d8b8686fc01a09ba4",
      "0xaabf2fedcb36146db164bec930b74a47969c4df98216e049342a3c49b6d11580"
    )
  })
})
