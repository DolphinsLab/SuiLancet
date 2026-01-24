/**
 * DeFi Position Tracker Types
 */

export type PositionCategory = "lending" | "lp" | "staking"

export interface DeFiPosition {
  protocol: string
  category: PositionCategory
  objectId?: string
  objectType?: string
}

export interface LendingPosition extends DeFiPosition {
  category: "lending"
  deposits: LendingAsset[]
  borrows: LendingAsset[]
  healthFactor?: number
}

export interface LendingAsset {
  coinType: string
  symbol: string
  amount: number
  decimals: number
  valueUsd?: number
}

export interface LPPosition extends DeFiPosition {
  category: "lp"
  poolId: string
  tokenA: LPToken
  tokenB: LPToken
  liquidity: string
  tickLower?: number
  tickUpper?: number
  feesEarned?: { tokenA: number; tokenB: number }
  valueUsd?: number
}

export interface LPToken {
  coinType: string
  symbol: string
  amount: number
  decimals: number
}

export interface StakingPosition extends DeFiPosition {
  category: "staking"
  stakedToken: string
  receivedToken: string
  symbol: string
  amount: number
  decimals: number
  exchangeRate?: number
  valueUsd?: number
}

export interface PortfolioSummary {
  walletAddress: string
  totalValueUsd: number
  lending: {
    totalDepositsUsd: number
    totalBorrowsUsd: number
    netValueUsd: number
    positions: LendingPosition[]
  }
  lp: {
    totalValueUsd: number
    positions: LPPosition[]
  }
  staking: {
    totalValueUsd: number
    positions: StakingPosition[]
  }
  lastUpdated: number
}

export interface ProtocolAdapter {
  name: string
  category: PositionCategory
  fetchPositions(
    client: any,
    walletAddress: string
  ): Promise<DeFiPosition[]>
}
