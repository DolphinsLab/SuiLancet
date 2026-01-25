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
  getDynamicFieldObject,
  listDynamicFieldContents,
  queryTableEntries,
  getTableEntry,
  queryLinkedTableEntries,
  exploreDynamicObject,
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

  // Dynamic object query commands
  queryCmd
    .command("df")
    .description("Get a dynamic field by name")
    .argument("<parentId>", "Parent object ID")
    .requiredOption("-t, --type <type>", "Key type (e.g., address, u64, 0x2::object::ID)")
    .requiredOption("-v, --value <value>", "Key value")
    .action(async (parentId, options) => {
      const client = getClient()
      const keyValue = parseKeyValue(options.type, options.value)
      const result = await getDynamicFieldObject(client, parentId, {
        type: options.type,
        value: keyValue,
      })
      if (!result.success) {
        console.error(result.message)
      }
    })

  queryCmd
    .command("df-list")
    .description("List dynamic fields with content")
    .argument("<parentId>", "Parent object ID")
    .option("-l, --limit <count>", "Limit entries shown", parseInt)
    .option("--cursor <cursor>", "Pagination cursor")
    .action(async (parentId, options) => {
      const client = getClient()
      const result = await listDynamicFieldContents(client, parentId, {
        limit: options.limit,
        cursor: options.cursor,
      })
      if (!result.success) {
        console.error(result.message)
      }
    })

  queryCmd
    .command("table")
    .description("Query Table/ObjectTable/Bag/ObjectBag entries")
    .argument("<tableId>", "Table or Bag object ID")
    .option("-l, --limit <count>", "Limit entries shown", parseInt)
    .option("--cursor <cursor>", "Pagination cursor")
    .option("-k, --key <value>", "Get specific entry by key value")
    .option("-t, --key-type <type>", "Key type for specific lookup")
    .action(async (tableId, options) => {
      const client = getClient()
      if (options.key && options.keyType) {
        const keyValue = parseKeyValue(options.keyType, options.key)
        const result = await getTableEntry(client, tableId, options.keyType, keyValue)
        if (!result.success) {
          console.error(result.message)
        }
      } else {
        const result = await queryTableEntries(client, tableId, {
          limit: options.limit,
          cursor: options.cursor,
        })
        if (!result.success) {
          console.error(result.message)
        }
      }
    })

  queryCmd
    .command("linked-table")
    .description("Query LinkedTable entries in order")
    .argument("<tableId>", "LinkedTable object ID")
    .option("-l, --limit <count>", "Limit entries shown", parseInt)
    .action(async (tableId, options) => {
      const client = getClient()
      const result = await queryLinkedTableEntries(client, tableId, {
        limit: options.limit,
      })
      if (!result.success) {
        console.error(result.message)
      }
    })

  queryCmd
    .command("explore")
    .description("Recursively explore nested dynamic objects")
    .argument("<objectId>", "Root object ID")
    .option("-d, --depth <depth>", "Max exploration depth", parseInt)
    .option("-l, --limit <count>", "Limit fields per level", parseInt)
    .action(async (objectId, options) => {
      const client = getClient()
      const result = await exploreDynamicObject(client, objectId, {
        depth: options.depth,
        limit: options.limit,
      })
      if (!result.success) {
        console.error(result.message)
      }
    })
}

/**
 * Parse key value based on type.
 */
function parseKeyValue(type: string, value: string): unknown {
  // Handle common Sui types
  if (type === "u64" || type === "u128" || type === "u256") {
    return value // Keep as string for big numbers
  }
  if (type === "u8" || type === "u16" || type === "u32") {
    return parseInt(value, 10)
  }
  if (type === "bool") {
    return value === "true"
  }
  if (type === "address" || type.includes("::ID") || type.includes("::UID")) {
    return value // Address as string
  }
  // Try parsing as JSON for complex types
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
