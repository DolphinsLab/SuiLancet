import { Command } from "commander"
import { SuiScriptClient } from "../../core"
import {
  getAssetOverview,
  getSpecialAmountCoins,
  CoinSummary,
  getTransactionHistory,
  parseTransaction,
  inspectObject,
  listDynamicFields,
} from "../../modules/query"

export function registerQueryCommands(
  program: Command,
  getClient: () => SuiScriptClient
) {
  const queryCmd = program
    .command("query")
    .description("Chain query tools")

  queryCmd
    .command("wallet-info")
    .description("Show wallet information")
    .action(async () => {
      const client = getClient()
      console.log("Address:", client.walletAddress)
      console.log("RPC:", client.endpoint)
    })

  queryCmd
    .command("balance")
    .description("Query coin balances")
    .option("-t, --coin-type <type>", "Filter by coin type")
    .action(async (options) => {
      const client = getClient()

      if (options.coinType) {
        const coins = await client.getCoinsByType(options.coinType)
        const total = coins.reduce((sum, coin) => sum + coin.balance, 0)
        console.log(`${options.coinType}`)
        console.log(`  Balance: ${total}`)
        console.log(`  Coins: ${coins.length}`)
      } else {
        const result = await getAssetOverview(client)
        const data = result.data as { summary: CoinSummary[] }
        console.log(result.message)
        console.log("")
        for (const item of data.summary) {
          console.log(`  ${item.coinType}`)
          console.log(`    Balance: ${item.totalBalance} (${item.count} coins)`)
        }
      }
    })

  queryCmd
    .command("find-coins")
    .description("Find coins in specified amount range")
    .requiredOption("--min <amount>", "Minimum amount", parseInt)
    .requiredOption("--max <amount>", "Maximum amount", parseInt)
    .requiredOption("-t, --coin-type <type>", "Coin type")
    .action(async (options) => {
      const client = getClient()
      const result = await getSpecialAmountCoins(
        client,
        options.min,
        options.max,
        options.coinType
      )
      console.log(result.message)
      const ids = result.data as string[]
      for (const id of ids) {
        console.log(`  ${id}`)
      }
    })

  queryCmd
    .command("history")
    .description("Show recent transaction history")
    .option("-l, --limit <count>", "Number of transactions to show", parseInt)
    .option("--tx <digest>", "Parse a specific transaction by digest")
    .action(async (options) => {
      const client = getClient()
      if (options.tx) {
        const result = await parseTransaction(client, options.tx)
        console.log(result.message)
      } else {
        const result = await getTransactionHistory(client, {
          limit: options.limit,
        })
        console.log(result.message)
      }
    })

  queryCmd
    .command("object")
    .description("Inspect an object by ID")
    .argument("<objectId>", "Object ID to inspect")
    .option("--dynamic-fields", "List dynamic fields")
    .option("-l, --limit <count>", "Limit dynamic fields shown", parseInt)
    .action(async (objectId, options) => {
      const client = getClient()
      if (options.dynamicFields) {
        const result = await listDynamicFields(client, objectId, {
          limit: options.limit,
        })
        console.log(result.message)
      } else {
        const result = await inspectObject(client, objectId)
        console.log(result.message)
      }
    })
}
