/**
 * Well-known protocol addresses and type patterns on Sui Mainnet.
 * These are used to identify DeFi positions in a wallet.
 */

// --- NAVI Protocol ---
export const NAVI = {
  PACKAGE: "0xd899cf7d2b5db716bd2cf55599fb0d5ee38a3061e7b013b9ca1571f3e3b0c44",
  LENDING_STORAGE:
    "0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe",
  OBLIGATION_TYPE_PATTERN: "::lending::Obligation",
  NAME: "NAVI Protocol",
} as const

// --- Suilend ---
export const SUILEND = {
  PACKAGE: "0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf",
  OBLIGATION_TYPE_PATTERN: "::obligation::Obligation",
  NAME: "Suilend",
} as const

// --- Scallop ---
export const SCALLOP = {
  PACKAGE: "0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf",
  OBLIGATION_TYPE_PATTERN: "::obligation::Obligation",
  MARKET_COIN_PATTERN: "::reserve::MarketCoin",
  NAME: "Scallop",
} as const

// --- Cetus ---
export const CETUS = {
  PACKAGE: "0x1eabed72c53feb467b37d9c2d1a2d8be8a3cc0e63db0b3f7ee8af0c2b5e9e3a0",
  CLMM_PACKAGE: "0x996c4d9480708fb8b92aa7acf819571f420e5c4e58c31e3ab1cddff15f252832",
  POSITION_TYPE_PATTERN: "::position::Position",
  NAME: "Cetus",
} as const

// --- Turbos ---
export const TURBOS = {
  PACKAGE: "0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1",
  POSITION_TYPE_PATTERN: "::position_nft::TurbosPositionNFT",
  NAME: "Turbos Finance",
} as const

// --- Liquid Staking Tokens ---
export const LIQUID_STAKING = {
  haSUI: {
    coinType:
      "0xbde4ba4c2e274a60ce15c1cfff9e5c42e136785241d58ef4c4343ab52e063455::hasui::HASUI",
    name: "Haedal Staked SUI",
    symbol: "haSUI",
    protocol: "Haedal",
  },
  afSUI: {
    coinType:
      "0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI",
    name: "Aftermath Staked SUI",
    symbol: "afSUI",
    protocol: "Aftermath",
  },
  vSUI: {
    coinType:
      "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT",
    name: "Volo Staked SUI",
    symbol: "vSUI",
    protocol: "Volo",
  },
  mSUI: {
    coinType:
      "0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::msui::MSUI",
    name: "Momentum Staked SUI",
    symbol: "mSUI",
    protocol: "Momentum",
  },
} as const

export const SUI_TYPE =
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"

// Common stablecoin types for reference
export const STABLECOINS = {
  USDC: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  USDT: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
} as const
