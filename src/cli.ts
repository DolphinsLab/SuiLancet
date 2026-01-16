import { program } from "commander"
import { SuiScriptClient } from "./client"
import * as methods from "./methods"
import * as movecall from "./movecall"

import {
  batchDestoryZeroCoin,
  batchSplitSuiCoins,
  batchSplitSpecialCoins,
  mergeCoins,
  transfer_all_sui_coins,
  batchTransferCoin,
  getSpecialAmountCoins,
} from "./methods/process_coin"

import { withdraw_from_vault, first_aid_packet } from "./methods/vault"

import {
  transfer_coin,
  transfer_coin_by_coin_type,
  transfer_objects,
} from "./methods/make_money"

program
  .name("cetus-cli")
  .description("Cetus Scripts CLI Tool - Blockchain interaction command line tool")
  .version("0.0.8")

program
  .option(
    "-e, --env <env>",
    "Network environment (testnet, pre-mainnet, mainnet)",
    "mainnet"
  )
  .option("-d, --debug", "Enable debug mode")

function initClient(
  env: "testnet" | "pre-mainnet" | "mainnet"
): SuiScriptClient {
  try {
    return new SuiScriptClient(env)
  } catch (error) {
    console.error("Failed to initialize client:", error)
    process.exit(1)
  }
}

const coinCmd = program.command("coin").description("Coin related operations")

coinCmd
  .command("destroy-zero")
  .description("Batch destroy zero-balance coins")
  .option("-g, --gas-budget <amount>", "Set gas budget")
  .option("--gas-object <id>", "Specify gas object ID")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await batchDestoryZeroCoin(
      client,
      options.gasBudget ? parseInt(options.gasBudget) : undefined,
      options.gasObject
    )
  })

coinCmd
  .command("split-sui")
  .description("Batch split SUI coins")
  .requiredOption(
    "-a, --amounts <amounts>",
    "Amount list, comma separated",
    (value) => value.split(",").map(Number)
  )
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await batchSplitSuiCoins(client, options.amounts)
  })

coinCmd
  .command("split-coin")
  .description("Split specified coin")
  .requiredOption("-i, --coin-id <id>", "Coin object ID")
  .requiredOption(
    "-a, --amounts <amounts>",
    "Amount list, comma separated",
    (value) => value.split(",").map(Number)
  )
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await batchSplitSpecialCoins(client, options.coinId, options.amounts)
  })

coinCmd
  .command("merge")
  .description("Merge coins of same type")
  .requiredOption("-t, --coin-type <type>", "Coin type")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await mergeCoins(client, options.coinType)
  })

coinCmd
  .command("transfer")
  .description("Transfer coin")
  .requiredOption("-i, --coin-id <id>", "Coin object ID")
  .requiredOption("-r, --recipient <address>", "Recipient address")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await transfer_coin(client, options.coinId, options.recipient)
  })

coinCmd
  .command("transfer-by-type")
  .description("Transfer specified amount by coin type")
  .requiredOption("-t, --coin-type <type>", "Coin type")
  .requiredOption("-r, --recipient <address>", "Recipient address")
  .requiredOption("-a, --amount <amount>", "Transfer amount", parseInt)
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await transfer_coin_by_coin_type(
      client,
      options.coinType,
      options.recipient,
      options.amount
    )
  })

coinCmd
  .command("transfer-all-sui")
  .description("Transfer all SUI")
  .requiredOption("-r, --recipient <address>", "Recipient address")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await transfer_all_sui_coins(client, options.recipient)
  })

coinCmd
  .command("batch-transfer")
  .description("Batch transfer coins")
  .requiredOption("-r, --recipient <address>", "Recipient address")
  .requiredOption("-t, --coin-type <type>", "Coin type")
  .requiredOption("-a, --amount <amount>", "Transfer amount", parseInt)
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await batchTransferCoin(
      client,
      options.recipient,
      options.coinType,
      options.amount
    )
  })

coinCmd
  .command("get-special-amount")
  .description("Get coins in specified amount range")
  .requiredOption("--min <amount>", "Minimum amount", parseInt)
  .requiredOption("--max <amount>", "Maximum amount", parseInt)
  .requiredOption("-t, --coin-type <type>", "Coin type")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    const coinIds = await getSpecialAmountCoins(
      client,
      options.min,
      options.max,
      options.coinType
    )
    console.log("Matching coin IDs:", coinIds)
  })

const vaultCmd = program.command("vault").description("Vault related operations")

vaultCmd
  .command("withdraw")
  .description("Withdraw coins from vault")
  .requiredOption("-t, --coin-type <type>", "Coin type")
  .requiredOption("-a, --amount <amount>", "Withdraw amount", parseInt)
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await withdraw_from_vault(client, options.coinType, options.amount)
  })

vaultCmd
  .command("first-aid")
  .description("First aid packet operation")
  .requiredOption("-c, --coins <coins>", "Coin ID list, comma separated", (value) =>
    value.split(",")
  )
  .option("--gas-object <id>", "Specify gas object ID")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await first_aid_packet(client, options.coins, options.gasObject)
  })

const objectCmd = program.command("object").description("Object related operations")

objectCmd
  .command("transfer")
  .description("Transfer multiple objects")
  .requiredOption("-o, --objects <objects>", "Object ID list, comma separated", (value) =>
    value.split(",")
  )
  .requiredOption("-r, --recipient <address>", "Recipient address")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await transfer_objects(client, options.objects, options.recipient)
  })

const queryCmd = program.command("query").description("Query related operations")

queryCmd
  .command("wallet-info")
  .description("Show wallet information")
  .action(async () => {
    const client = initClient(program.opts().env)
    console.log("Wallet address:", client.walletAddress)
    console.log("RPC endpoint:", client.endpoint)
  })

queryCmd
  .command("balance")
  .description("Query coin balance")
  .option("-t, --coin-type <type>", "Coin type")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    if (options.coinType) {
      const coins = await client.getCoinsByType(options.coinType)
      const total = coins.reduce((sum, coin) => sum + coin.balance, 0)
      console.log(`${options.coinType} total balance: ${total}`)
      console.log(`Coin count: ${coins.length}`)
    } else {
      const allCoins = await client.getAllCoins()
      const groupedByType = allCoins.reduce((acc, coin) => {
        if (!acc[coin.coinType]) {
          acc[coin.coinType] = { count: 0, total: 0 }
        }
        acc[coin.coinType].count++
        acc[coin.coinType].total += coin.balance
        return acc
      }, {} as Record<string, { count: number; total: number }>)

      console.log("All coin balances:")
      Object.entries(groupedByType).forEach(([type, info]) => {
        console.log(`${type}: ${info.total} (${info.count} coins)`)
      })
    }
  })

program.configureOutput({
  writeErr: (str) => process.stderr.write(`[Error] ${str}`),
})

program.parse()
