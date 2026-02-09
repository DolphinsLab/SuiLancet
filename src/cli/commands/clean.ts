import { Command } from "commander"
import { SuiScriptClient } from "../../core"
import {
  batchDestroyZeroCoin,
  mergeCoins,
  cleanDust,
  scanAirdrops,
  destroyAirdrops,
  RiskLevel,
} from "../../modules/clean"

export function registerCleanCommands(
  program: Command,
  getClient: () => SuiScriptClient
) {
  const cleanCmd = program
    .command("clean")
    .description("Wallet cleanup tools")

  cleanCmd
    .command("destroy-zero")
    .description("Batch destroy zero-balance coins")
    .option("-g, --gas-budget <amount>", "Set gas budget", parseInt)
    .option("--gas-object <id>", "Specify gas object ID")
    .option("--dry-run", "Preview only, do not execute")
    .action(async (options) => {
      const client = getClient()
      const result = await batchDestroyZeroCoin(client, {
        gasBudget: options.gasBudget,
        gasObject: options.gasObject,
        dryRun: options.dryRun,
      })
      console.log(result.message)
    })

  cleanCmd
    .command("merge")
    .description("Merge coins of same type")
    .requiredOption("-t, --coin-type <type>", "Coin type")
    .option("--gas-object <id>", "Specify gas object ID")
    .option("--dry-run", "Preview only, do not execute")
    .action(async (options) => {
      const client = getClient()
      const result = await mergeCoins(client, options.coinType, {
        gasObject: options.gasObject,
        dryRun: options.dryRun,
      })
      console.log(result.message)
    })

  cleanCmd
    .command("dust")
    .description("Clean low-value dust coins from wallet")
    .option("--threshold <usd>", "USD value threshold (default: 0.01)", parseFloat)
    .option("--include-unknown", "Include coins without price data")
    .option("-g, --gas-budget <amount>", "Set gas budget", parseInt)
    .option("--gas-object <id>", "Specify gas object ID")
    .option("--dry-run", "Preview only, do not execute")
    .action(async (options) => {
      const client = getClient()
      const result = await cleanDust(client, {
        threshold: options.threshold,
        includeUnknown: options.includeUnknown,
        gasBudget: options.gasBudget,
        gasObject: options.gasObject,
        dryRun: options.dryRun,
      })
      console.log(result.message)
    })

  cleanCmd
    .command("airdrop-scan")
    .description("Scan wallet for suspicious airdrop tokens")
    .action(async () => {
      const client = getClient()
      const result = await scanAirdrops(client)
      console.log(result.message)
    })

  cleanCmd
    .command("airdrop-destroy")
    .description("Destroy suspicious airdrop tokens")
    .option("--risk <level>", "Minimum risk level to destroy (high, medium)", "high")
    .option("--gas-object <id>", "Specify gas object ID")
    .option("--dry-run", "Preview only, do not execute")
    .action(async (options) => {
      const client = getClient()
      const result = await destroyAirdrops(client, {
        riskLevel: options.risk as RiskLevel,
        gasObject: options.gasObject,
        dryRun: options.dryRun,
      })
      console.log(result.message)
    })
}
