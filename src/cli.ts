import { program } from "commander"
import { SuiScriptClient } from "./client"
import * as methods from "./methods"
import * as movecall from "./movecall"

// 导入各种方法
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

// 设置程序版本和描述
program
  .name("cetus-cli")
  .description("Cetus Scripts CLI Tool - 区块链交互命令行工具")
  .version("0.0.8")

// 全局选项
program
  .option(
    "-e, --env <env>",
    "网络环境 (testnet, pre-mainnet, mainnet)",
    "mainnet"
  )
  .option("-d, --debug", "启用调试模式")

// 初始化客户端
function initClient(
  env: "testnet" | "pre-mainnet" | "mainnet"
): SuiScriptClient {
  try {
    return new SuiScriptClient(env)
  } catch (error) {
    console.error("初始化客户端失败:", error)
    process.exit(1)
  }
}

// 代币相关命令
const coinCmd = program.command("coin").description("代币相关操作")

coinCmd
  .command("destroy-zero")
  .description("批量销毁余额为0的代币")
  .option("-g, --gas-budget <amount>", "设置gas预算")
  .option("--gas-object <id>", "指定gas对象ID")
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
  .description("批量分割SUI代币")
  .requiredOption(
    "-a, --amounts <amounts>",
    "分割金额列表，逗号分隔",
    (value) => value.split(",").map(Number)
  )
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await batchSplitSuiCoins(client, options.amounts)
  })

coinCmd
  .command("split-coin")
  .description("分割指定代币")
  .requiredOption("-i, --coin-id <id>", "代币对象ID")
  .requiredOption(
    "-a, --amounts <amounts>",
    "分割金额列表，逗号分隔",
    (value) => value.split(",").map(Number)
  )
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await batchSplitSpecialCoins(client, options.coinId, options.amounts)
  })

coinCmd
  .command("merge")
  .description("合并同类型代币")
  .requiredOption("-t, --coin-type <type>", "代币类型")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await mergeCoins(client, options.coinType)
  })

coinCmd
  .command("transfer")
  .description("转移代币")
  .requiredOption("-i, --coin-id <id>", "代币对象ID")
  .requiredOption("-r, --recipient <address>", "接收地址")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await transfer_coin(client, options.coinId, options.recipient)
  })

coinCmd
  .command("transfer-by-type")
  .description("按代币类型转移指定数量")
  .requiredOption("-t, --coin-type <type>", "代币类型")
  .requiredOption("-r, --recipient <address>", "接收地址")
  .requiredOption("-a, --amount <amount>", "转移数量", parseInt)
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
  .description("转移所有SUI")
  .requiredOption("-r, --recipient <address>", "接收地址")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await transfer_all_sui_coins(client, options.recipient)
  })

coinCmd
  .command("batch-transfer")
  .description("批量转移代币")
  .requiredOption("-r, --recipient <address>", "接收地址")
  .requiredOption("-t, --coin-type <type>", "代币类型")
  .requiredOption("-a, --amount <amount>", "转移数量", parseInt)
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
  .description("获取指定金额范围的代币")
  .requiredOption("--min <amount>", "最小金额", parseInt)
  .requiredOption("--max <amount>", "最大金额", parseInt)
  .requiredOption("-t, --coin-type <type>", "代币类型")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    const coinIds = await getSpecialAmountCoins(
      client,
      options.min,
      options.max,
      options.coinType
    )
    console.log("符合条件的代币ID:", coinIds)
  })

// Vault相关命令
const vaultCmd = program.command("vault").description("金库相关操作")

vaultCmd
  .command("withdraw")
  .description("从金库提取代币")
  .requiredOption("-t, --coin-type <type>", "代币类型")
  .requiredOption("-a, --amount <amount>", "提取数量", parseInt)
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await withdraw_from_vault(client, options.coinType, options.amount)
  })

vaultCmd
  .command("first-aid")
  .description("急救包操作")
  .requiredOption("-c, --coins <coins>", "代币ID列表，逗号分隔", (value) =>
    value.split(",")
  )
  .option("--gas-object <id>", "指定gas对象ID")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await first_aid_packet(client, options.coins, options.gasObject)
  })

// 对象相关命令
const objectCmd = program.command("object").description("对象相关操作")

objectCmd
  .command("transfer")
  .description("转移多个对象")
  .requiredOption("-o, --objects <objects>", "对象ID列表，逗号分隔", (value) =>
    value.split(",")
  )
  .requiredOption("-r, --recipient <address>", "接收地址")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    await transfer_objects(client, options.objects, options.recipient)
  })

// 查询相关命令
const queryCmd = program.command("query").description("查询相关操作")

queryCmd
  .command("wallet-info")
  .description("显示钱包信息")
  .action(async () => {
    const client = initClient(program.opts().env)
    console.log("钱包地址:", client.walletAddress)
    console.log("RPC端点:", client.endpoint)
  })

queryCmd
  .command("balance")
  .description("查询代币余额")
  .option("-t, --coin-type <type>", "代币类型")
  .action(async (options) => {
    const client = initClient(program.opts().env)
    if (options.coinType) {
      const coins = await client.getCoinsByType(options.coinType)
      const total = coins.reduce((sum, coin) => sum + coin.balance, 0)
      console.log(`${options.coinType} 总余额: ${total}`)
      console.log(`代币数量: ${coins.length}`)
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

      console.log("所有代币余额:")
      Object.entries(groupedByType).forEach(([type, info]) => {
        console.log(`${type}: ${info.total} (${info.count} 个代币)`)
      })
    }
  })

// 错误处理
program.configureOutput({
  writeErr: (str) => process.stderr.write(`[错误] ${str}`),
})

// 解析命令行参数
program.parse()
