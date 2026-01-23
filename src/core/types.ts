export type CoinObject = {
  objectId: string
  coinType: string
  balance: number
}

export interface CommandResult {
  success: boolean
  message: string
  data?: unknown
}

export type NetworkEnv = "testnet" | "pre-mainnet" | "mainnet"
