import { Command } from "commander"
import { SuiScriptClient } from "../../core"
import {
  transferCoin,
  transferCoinByType,
  transferAllSui,
  batchTransferCoin,
  transferObjects,
  splitSuiCoins,
  splitSpecialCoin,
  withdrawFromVault,
  firstAidPacket,
} from "../../modules/manage"

export function registerManageCommands(
  program: Command,
  getClient: () => SuiScriptClient
) {
  const manageCmd = program
    .command("manage")
    .description("Asset management tools")

  // Transfer sub-commands
  manageCmd
    .command("transfer")
    .description("Transfer a coin by object ID")
    .requiredOption("-i, --coin-id <id>", "Coin object ID")
    .requiredOption("-r, --recipient <address>", "Recipient address")
    .action(async (options) => {
      const client = getClient()
      const result = await transferCoin(client, options.coinId, options.recipient)
      console.log(result.message)
    })

  manageCmd
    .command("transfer-by-type")
    .description("Transfer specified amount by coin type")
    .requiredOption("-t, --coin-type <type>", "Coin type")
    .requiredOption("-r, --recipient <address>", "Recipient address")
    .requiredOption("-a, --amount <amount>", "Transfer amount", parseInt)
    .action(async (options) => {
      const client = getClient()
      const result = await transferCoinByType(
        client,
        options.coinType,
        options.recipient,
        options.amount
      )
      console.log(result.message)
    })

  manageCmd
    .command("transfer-all-sui")
    .description("Transfer all SUI to recipient")
    .requiredOption("-r, --recipient <address>", "Recipient address")
    .action(async (options) => {
      const client = getClient()
      const result = await transferAllSui(client, options.recipient)
      console.log(result.message)
    })

  manageCmd
    .command("batch-transfer")
    .description("Batch transfer coins")
    .requiredOption("-r, --recipient <address>", "Recipient address")
    .requiredOption("-t, --coin-type <type>", "Coin type")
    .requiredOption("-a, --amount <amount>", "Number of coins to transfer", parseInt)
    .action(async (options) => {
      const client = getClient()
      const result = await batchTransferCoin(
        client,
        options.recipient,
        options.coinType,
        options.amount
      )
      console.log(result.message)
    })

  manageCmd
    .command("transfer-objects")
    .description("Transfer multiple objects")
    .requiredOption(
      "-o, --objects <objects>",
      "Object ID list, comma separated",
      (value: string) => value.split(",")
    )
    .requiredOption("-r, --recipient <address>", "Recipient address")
    .action(async (options) => {
      const client = getClient()
      const result = await transferObjects(client, options.objects, options.recipient)
      console.log(result.message)
    })

  // Split sub-commands
  manageCmd
    .command("split-sui")
    .description("Split SUI into multiple coins")
    .requiredOption(
      "-a, --amounts <amounts>",
      "Amount list, comma separated",
      (value: string) => value.split(",").map(Number)
    )
    .option("--gas-object <id>", "Specify gas object ID")
    .action(async (options) => {
      const client = getClient()
      const result = await splitSuiCoins(client, options.amounts, {
        gasObject: options.gasObject,
      })
      console.log(result.message)
    })

  manageCmd
    .command("split-coin")
    .description("Split specified coin into parts")
    .requiredOption("-i, --coin-id <id>", "Coin object ID")
    .requiredOption(
      "-a, --amounts <amounts>",
      "Amount list, comma separated",
      (value: string) => value.split(",").map(Number)
    )
    .option("--gas-object <id>", "Specify gas object ID")
    .action(async (options) => {
      const client = getClient()
      const result = await splitSpecialCoin(client, options.coinId, options.amounts, {
        gasObject: options.gasObject,
      })
      console.log(result.message)
    })

  // Vault sub-commands
  manageCmd
    .command("vault-withdraw")
    .description("Withdraw coins from vault")
    .requiredOption("-t, --coin-type <type>", "Coin type")
    .requiredOption("-a, --amount <amount>", "Withdraw amount", parseInt)
    .requiredOption("-r, --recipient <address>", "Target address")
    .option("--gas-object <id>", "Specify gas object ID")
    .action(async (options) => {
      const client = getClient()
      const result = await withdrawFromVault(
        client,
        options.coinType,
        options.amount,
        options.recipient,
        { gasObject: options.gasObject }
      )
      console.log(result.message)
    })

  manageCmd
    .command("vault-first-aid")
    .description("First aid packet operation")
    .requiredOption(
      "-c, --coins <coins>",
      "Coin ID list, comma separated",
      (value: string) => value.split(",")
    )
    .option("--gas-object <id>", "Specify gas object ID")
    .action(async (options) => {
      const client = getClient()
      const result = await firstAidPacket(client, options.coins, {
        gasObject: options.gasObject,
      })
      console.log(result.message)
    })
}
