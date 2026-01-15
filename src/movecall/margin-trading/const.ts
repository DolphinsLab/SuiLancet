export const MARGIN_TRADING_PUBLISHED_AT =
  "0xc41dca0f7de9e155862521e4d73386e2a45049c5c3c3fa6033525473fa6c634d"

export type MarginTradingConfig = {
  adminCap: string
  globalConfig: string
  markets: string
  versioned: string
}

// set pre and mainnet

export const marginTradingConfig = new Map<string, MarginTradingConfig>()

// 设置 pre-mainnet 配置
marginTradingConfig.set("pre-mainnet", {
  adminCap:
    "0xdd80fba8dec1260df452ad85d5aed4d44c1abf12b53c70b3b0f1962cb03f34f3",
  globalConfig:
    "0x92c8af0cd456fcbb7ad98a40dd5c1df63b2b232e9f0ed2f5ea9fba7485479423",
  markets: "0xae542eac695954d201bffe8b5f578c8efd3d985cf42f5941b3a705fe8cb4c9af",
  versioned: "",
})

// 设置 mainnet 配置
marginTradingConfig.set("mainnet", {
  adminCap:
    "0x5056062528bfac02d34f25b623ed6e34b4cd36fdaf6608e4bd593a13207f9b59",
  globalConfig:
    "0xeb7d17f241a94c8f9c7f6f363926d63a0bc608616adb409ab1e3abbc3e4d8ea0",
  markets: "0x2ed42decf1d64d0eb4af233e827a09c8d653d7fb1a40295cf818022abbc26914",
  versioned:
    "0x16e25bbbb9b06db1ae9c3ebcb381f670ee3ca3b2647981e9cc0afbbfadb0e9e5",
})
