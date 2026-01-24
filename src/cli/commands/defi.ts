import { Command } from "commander"
import { SuiScriptClient } from "../../core"
import {
  getDefiPositions,
  PortfolioSummary,
  LendingPosition,
  LPPosition,
  StakingPosition,
} from "../../modules/defi"

export function registerDefiCommands(
  program: Command,
  getClient: () => SuiScriptClient
) {
  const defiCmd = program
    .command("defi")
    .description("DeFi position tracker")

  defiCmd
    .command("positions")
    .description("Show all DeFi positions across protocols")
    .option("--no-price", "Skip USD price fetching")
    .option(
      "-c, --category <category>",
      "Filter by category (lending, lp, staking)"
    )
    .action(async (options) => {
      const client = getClient()

      const categories = options.category
        ? [options.category]
        : ["lending", "lp", "staking"]

      console.log("Scanning DeFi positions...")
      console.log("")

      const result = await getDefiPositions(
        client.client,
        client.walletAddress,
        {
          categories,
          withPricing: options.price !== false,
        }
      )

      if (!result.success) {
        console.error(result.message)
        return
      }

      const portfolio = result.data as PortfolioSummary
      printPortfolio(portfolio)
    })

  defiCmd
    .command("lending")
    .description("Show lending positions (NAVI, Suilend, Scallop)")
    .action(async () => {
      const client = getClient()
      console.log("Scanning lending positions...")
      console.log("")

      const result = await getDefiPositions(
        client.client,
        client.walletAddress,
        { categories: ["lending"] }
      )

      if (!result.success) {
        console.error(result.message)
        return
      }

      const portfolio = result.data as PortfolioSummary
      printLendingPositions(portfolio.lending.positions)
      console.log("")
      console.log(
        `  Net Lending Value: $${portfolio.lending.netValueUsd.toFixed(2)}`
      )
    })

  defiCmd
    .command("lp")
    .description("Show LP positions (Cetus, Turbos)")
    .action(async () => {
      const client = getClient()
      console.log("Scanning LP positions...")
      console.log("")

      const result = await getDefiPositions(
        client.client,
        client.walletAddress,
        { categories: ["lp"] }
      )

      if (!result.success) {
        console.error(result.message)
        return
      }

      const portfolio = result.data as PortfolioSummary
      printLPPositions(portfolio.lp.positions)
      console.log("")
      console.log(
        `  Total LP Value: $${portfolio.lp.totalValueUsd.toFixed(2)}`
      )
    })

  defiCmd
    .command("staking")
    .description("Show staking positions (haSUI, afSUI, vSUI, native)")
    .action(async () => {
      const client = getClient()
      console.log("Scanning staking positions...")
      console.log("")

      const result = await getDefiPositions(
        client.client,
        client.walletAddress,
        { categories: ["staking"] }
      )

      if (!result.success) {
        console.error(result.message)
        return
      }

      const portfolio = result.data as PortfolioSummary
      printStakingPositions(portfolio.staking.positions)
      console.log("")
      console.log(
        `  Total Staking Value: $${portfolio.staking.totalValueUsd.toFixed(2)}`
      )
    })
}

function printPortfolio(portfolio: PortfolioSummary) {
  console.log("=" .repeat(60))
  console.log("  DeFi Portfolio Summary")
  console.log("=" .repeat(60))
  console.log("")
  console.log(
    `  Total Portfolio Value: $${portfolio.totalValueUsd.toFixed(2)}`
  )
  console.log("")

  // Lending
  if (portfolio.lending.positions.length > 0) {
    console.log("-".repeat(60))
    console.log("  LENDING")
    console.log("-".repeat(60))
    printLendingPositions(portfolio.lending.positions)
    console.log(
      `  Deposits: $${portfolio.lending.totalDepositsUsd.toFixed(2)} | Borrows: $${portfolio.lending.totalBorrowsUsd.toFixed(2)} | Net: $${portfolio.lending.netValueUsd.toFixed(2)}`
    )
    console.log("")
  }

  // LP
  if (portfolio.lp.positions.length > 0) {
    console.log("-".repeat(60))
    console.log("  LIQUIDITY POOLS")
    console.log("-".repeat(60))
    printLPPositions(portfolio.lp.positions)
    console.log(
      `  Total LP Value: $${portfolio.lp.totalValueUsd.toFixed(2)}`
    )
    console.log("")
  }

  // Staking
  if (portfolio.staking.positions.length > 0) {
    console.log("-".repeat(60))
    console.log("  STAKING")
    console.log("-".repeat(60))
    printStakingPositions(portfolio.staking.positions)
    console.log(
      `  Total Staking Value: $${portfolio.staking.totalValueUsd.toFixed(2)}`
    )
    console.log("")
  }

  if (
    portfolio.lending.positions.length === 0 &&
    portfolio.lp.positions.length === 0 &&
    portfolio.staking.positions.length === 0
  ) {
    console.log("  No DeFi positions found in this wallet.")
  }

  console.log("=".repeat(60))
}

function printLendingPositions(positions: LendingPosition[]) {
  for (const pos of positions) {
    console.log(`  [${pos.protocol}] ${pos.objectId ? shortenId(pos.objectId) : ""}`)

    if (pos.deposits.length > 0) {
      console.log("    Deposits:")
      for (const dep of pos.deposits) {
        const amountStr = formatAmount(dep.amount, dep.decimals)
        const usdStr = dep.valueUsd ? ` ($${dep.valueUsd.toFixed(2)})` : ""
        console.log(`      ${dep.symbol}: ${amountStr}${usdStr}`)
      }
    }

    if (pos.borrows.length > 0) {
      console.log("    Borrows:")
      for (const bor of pos.borrows) {
        const amountStr = formatAmount(bor.amount, bor.decimals)
        const usdStr = bor.valueUsd ? ` ($${bor.valueUsd.toFixed(2)})` : ""
        console.log(`      ${bor.symbol}: ${amountStr}${usdStr}`)
      }
    }
    console.log("")
  }
}

function printLPPositions(positions: LPPosition[]) {
  for (const pos of positions) {
    const pair = `${pos.tokenA.symbol}/${pos.tokenB.symbol}`
    const usdStr = pos.valueUsd ? ` ($${pos.valueUsd.toFixed(2)})` : ""
    console.log(
      `  [${pos.protocol}] ${pair} ${shortenId(pos.objectId || "")}${usdStr}`
    )
    console.log(`    Liquidity: ${pos.liquidity}`)
    if (pos.tickLower !== undefined && pos.tickUpper !== undefined) {
      console.log(`    Range: [${pos.tickLower}, ${pos.tickUpper}]`)
    }
    if (pos.tokenA.amount > 0 || pos.tokenB.amount > 0) {
      console.log(
        `    ${pos.tokenA.symbol}: ${formatAmount(pos.tokenA.amount, pos.tokenA.decimals)} | ${pos.tokenB.symbol}: ${formatAmount(pos.tokenB.amount, pos.tokenB.decimals)}`
      )
    }
    console.log("")
  }
}

function printStakingPositions(positions: StakingPosition[]) {
  for (const pos of positions) {
    const amountStr = formatAmount(pos.amount, pos.decimals)
    const usdStr = pos.valueUsd ? ` ($${pos.valueUsd.toFixed(2)})` : ""
    console.log(`  [${pos.protocol}] ${pos.symbol}: ${amountStr}${usdStr}`)
  }
}

function formatAmount(amount: number, decimals: number): string {
  const value = amount / Math.pow(10, decimals)
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`
  return value.toFixed(4)
}

function shortenId(id: string): string {
  if (!id || id.length < 10) return id
  return `${id.slice(0, 6)}...${id.slice(-4)}`
}
