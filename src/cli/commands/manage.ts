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
  executeMigration,
  previewMigration,
  listKiosks,
  showKiosk,
  takeFromKiosk,
  withdrawKioskProfits,
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

  // Migration commands
  manageCmd
    .command("migrate")
    .description("Migrate all wallet assets to a new address")
    .requiredOption("-r, --recipient <address>", "Target address")
    .option("--type <type>", "Asset type to migrate: coin, object, all", "all")
    .option("--batch-size <size>", "Objects per batch", parseInt)
    .option("--exclude <types>", "Coin types to exclude, comma separated",
      (value: string) => value.split(","))
    .option("--dry-run", "Preview migration plan only")
    .action(async (options) => {
      const client = getClient()
      const result = options.dryRun
        ? await previewMigration(client, {
            recipient: options.recipient,
            type: options.type,
            batchSize: options.batchSize,
            excludeTypes: options.exclude,
            dryRun: true,
          })
        : await executeMigration(client, {
            recipient: options.recipient,
            type: options.type,
            batchSize: options.batchSize,
            excludeTypes: options.exclude,
          })
      console.log(result.message)
    })

  // Kiosk commands
  manageCmd
    .command("kiosk-list")
    .description("List all Kiosks owned by wallet")
    .action(async () => {
      const client = getClient()
      const result = await listKiosks(client)
      console.log(result.message)
    })

  manageCmd
    .command("kiosk-show")
    .description("Show contents of a specific Kiosk")
    .requiredOption("-k, --kiosk-id <id>", "Kiosk object ID")
    .action(async (options) => {
      const client = getClient()
      const result = await showKiosk(client, options.kioskId)
      console.log(result.message)
    })

  manageCmd
    .command("kiosk-take")
    .description("Extract an item from Kiosk to wallet")
    .requiredOption("-k, --kiosk-id <id>", "Kiosk object ID")
    .requiredOption("-c, --cap-id <id>", "KioskOwnerCap object ID")
    .requiredOption("-i, --item-id <id>", "Item object ID to extract")
    .requiredOption("-t, --item-type <type>", "Item type (full Move type)")
    .action(async (options) => {
      const client = getClient()
      const result = await takeFromKiosk(
        client,
        options.kioskId,
        options.capId,
        options.itemId,
        options.itemType
      )
      console.log(result.message)
    })

  manageCmd
    .command("kiosk-withdraw")
    .description("Withdraw SUI profits from Kiosk")
    .requiredOption("-k, --kiosk-id <id>", "Kiosk object ID")
    .requiredOption("-c, --cap-id <id>", "KioskOwnerCap object ID")
    .action(async (options) => {
      const client = getClient()
      const result = await withdrawKioskProfits(
        client,
        options.kioskId,
        options.capId
      )
      console.log(result.message)
    })
}
