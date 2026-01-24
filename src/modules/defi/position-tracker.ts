import { SuiClient } from "@mysten/sui/client"
import {
  PortfolioSummary,
  LendingPosition,
  LPPosition,
  StakingPosition,
} from "./types"
import { fetchNaviPositions } from "./protocols/navi"
import { fetchSuilendPositions } from "./protocols/suilend"
import { fetchScallopPositions } from "./protocols/scallop"
import { fetchCetusPositions } from "./protocols/cetus-lp"
import { fetchTurbosPositions } from "./protocols/turbos-lp"
import { fetchLiquidStakingPositions } from "./protocols/liquid-staking"
import { fetchTokenPrices } from "../../common/price"
import { CommandResult } from "../../core/types"

export interface FetchOptions {
  /** Which categories to fetch. Defaults to all. */
  categories?: ("lending" | "lp" | "staking")[]
  /** Whether to fetch USD prices for positions. Defaults to true. */
  withPricing?: boolean
}

/**
 * Fetch all DeFi positions for a wallet across supported protocols.
 * Returns a unified PortfolioSummary.
 */
export async function fetchAllPositions(
  client: SuiClient,
  walletAddress: string,
  options: FetchOptions = {}
): Promise<PortfolioSummary> {
  const categories = options.categories || ["lending", "lp", "staking"]
  const withPricing = options.withPricing !== false

  const lendingPositions: LendingPosition[] = []
  const lpPositions: LPPosition[] = []
  const stakingPositions: StakingPosition[] = []

  // Fetch positions in parallel by category
  const promises: Promise<void>[] = []

  if (categories.includes("lending")) {
    promises.push(
      fetchLendingPositions(client, walletAddress).then((positions) => {
        lendingPositions.push(...positions)
      })
    )
  }

  if (categories.includes("lp")) {
    promises.push(
      fetchLPPositions(client, walletAddress).then((positions) => {
        lpPositions.push(...positions)
      })
    )
  }

  if (categories.includes("staking")) {
    promises.push(
      fetchLiquidStakingPositions(client, walletAddress).then((positions) => {
        stakingPositions.push(...positions)
      })
    )
  }

  await Promise.allSettled(promises)

  // Optionally enrich with USD pricing
  if (withPricing) {
    await enrichWithPricing(lendingPositions, lpPositions, stakingPositions)
  }

  // Calculate totals
  const totalDepositsUsd = lendingPositions.reduce(
    (sum, p) => sum + p.deposits.reduce((s, d) => s + (d.valueUsd || 0), 0),
    0
  )
  const totalBorrowsUsd = lendingPositions.reduce(
    (sum, p) => sum + p.borrows.reduce((s, b) => s + (b.valueUsd || 0), 0),
    0
  )
  const totalLPUsd = lpPositions.reduce((sum, p) => sum + (p.valueUsd || 0), 0)
  const totalStakingUsd = stakingPositions.reduce(
    (sum, p) => sum + (p.valueUsd || 0),
    0
  )

  const totalValueUsd =
    totalDepositsUsd - totalBorrowsUsd + totalLPUsd + totalStakingUsd

  return {
    walletAddress,
    totalValueUsd,
    lending: {
      totalDepositsUsd,
      totalBorrowsUsd,
      netValueUsd: totalDepositsUsd - totalBorrowsUsd,
      positions: lendingPositions,
    },
    lp: {
      totalValueUsd: totalLPUsd,
      positions: lpPositions,
    },
    staking: {
      totalValueUsd: totalStakingUsd,
      positions: stakingPositions,
    },
    lastUpdated: Date.now(),
  }
}

/**
 * Fetch lending positions from all supported protocols.
 */
async function fetchLendingPositions(
  client: SuiClient,
  walletAddress: string
): Promise<LendingPosition[]> {
  const results = await Promise.allSettled([
    fetchNaviPositions(client, walletAddress),
    fetchSuilendPositions(client, walletAddress),
    fetchScallopPositions(client, walletAddress),
  ])

  const positions: LendingPosition[] = []
  for (const result of results) {
    if (result.status === "fulfilled") {
      positions.push(...result.value)
    }
  }
  return positions
}

/**
 * Fetch LP positions from all supported protocols.
 */
async function fetchLPPositions(
  client: SuiClient,
  walletAddress: string
): Promise<LPPosition[]> {
  const results = await Promise.allSettled([
    fetchCetusPositions(client, walletAddress),
    fetchTurbosPositions(client, walletAddress),
  ])

  const positions: LPPosition[] = []
  for (const result of results) {
    if (result.status === "fulfilled") {
      positions.push(...result.value)
    }
  }
  return positions
}

/**
 * Enrich positions with USD pricing from DexScreener.
 */
async function enrichWithPricing(
  lendingPositions: LendingPosition[],
  lpPositions: LPPosition[],
  stakingPositions: StakingPosition[]
): Promise<void> {
  // Collect all unique coin types
  const coinTypes = new Set<string>()

  for (const pos of lendingPositions) {
    for (const dep of pos.deposits) {
      if (dep.coinType) coinTypes.add(dep.coinType)
    }
    for (const bor of pos.borrows) {
      if (bor.coinType) coinTypes.add(bor.coinType)
    }
  }

  for (const pos of lpPositions) {
    if (pos.tokenA.coinType) coinTypes.add(pos.tokenA.coinType)
    if (pos.tokenB.coinType) coinTypes.add(pos.tokenB.coinType)
  }

  for (const pos of stakingPositions) {
    if (pos.stakedToken) coinTypes.add(pos.stakedToken)
    if (pos.receivedToken) coinTypes.add(pos.receivedToken)
  }

  if (coinTypes.size === 0) return

  // Fetch prices (limit to avoid rate limiting)
  const typesToPrice = Array.from(coinTypes).slice(0, 20)
  const prices = await fetchTokenPrices(typesToPrice)

  // Apply prices to lending positions
  for (const pos of lendingPositions) {
    for (const dep of pos.deposits) {
      const price = prices.get(dep.coinType)
      if (price) {
        dep.valueUsd = (dep.amount / Math.pow(10, dep.decimals)) * price
      }
    }
    for (const bor of pos.borrows) {
      const price = prices.get(bor.coinType)
      if (price) {
        bor.valueUsd = (bor.amount / Math.pow(10, bor.decimals)) * price
      }
    }
  }

  // Apply prices to LP positions
  for (const pos of lpPositions) {
    const priceA = prices.get(pos.tokenA.coinType)
    const priceB = prices.get(pos.tokenB.coinType)
    const valueA = priceA
      ? (pos.tokenA.amount / Math.pow(10, pos.tokenA.decimals)) * priceA
      : 0
    const valueB = priceB
      ? (pos.tokenB.amount / Math.pow(10, pos.tokenB.decimals)) * priceB
      : 0
    pos.valueUsd = valueA + valueB
  }

  // Apply prices to staking positions
  for (const pos of stakingPositions) {
    const price = prices.get(pos.receivedToken) || prices.get(pos.stakedToken)
    if (price) {
      pos.valueUsd = (pos.amount / Math.pow(10, pos.decimals)) * price
    }
  }
}

/**
 * CLI-friendly wrapper that returns a CommandResult.
 */
export async function getDefiPositions(
  client: SuiClient,
  walletAddress: string,
  options: FetchOptions = {}
): Promise<CommandResult> {
  try {
    const portfolio = await fetchAllPositions(client, walletAddress, options)

    const lendingCount = portfolio.lending.positions.length
    const lpCount = portfolio.lp.positions.length
    const stakingCount = portfolio.staking.positions.length
    const totalPositions = lendingCount + lpCount + stakingCount

    return {
      success: true,
      message: `Found ${totalPositions} DeFi position(s): ${lendingCount} lending, ${lpCount} LP, ${stakingCount} staking`,
      data: portfolio,
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to fetch DeFi positions: ${error.message}`,
    }
  }
}
