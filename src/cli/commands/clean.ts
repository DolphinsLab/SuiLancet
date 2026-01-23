import { Command } from "commander"
import { SuiScriptClient } from "../../core"
import { batchDestroyZeroCoin } from "../../modules/clean"
import { mergeCoins } from "../../modules/clean"

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
}
