import { Command } from "commander"
import { SuiScriptClient } from "../../core"
import {
  simulateTransaction,
  scanWalletSecurity,
  getGasInfo,
  estimateGas,
} from "../../modules/secure"

export function registerSecureCommands(
  program: Command,
  getClient: () => SuiScriptClient
) {
  const secureCmd = program
    .command("secure")
    .description("Security and safety tools")

  secureCmd
    .command("simulate")
    .description("Simulate a transaction and preview effects")
    .requiredOption("--tx <base64>", "Transaction bytes in base64")
    .action(async (options) => {
      const client = getClient()
      const result = await simulateTransaction(client, options.tx)
      console.log(result.message)
    })

  secureCmd
    .command("scan")
    .description("Perform wallet security scan")
    .action(async () => {
      const client = getClient()
      const result = await scanWalletSecurity(client)
      console.log(result.message)
    })

  secureCmd
    .command("gas-info")
    .description("Show current network gas info and recommendations")
    .action(async () => {
      const client = getClient()
      const result = await getGasInfo(client)
      console.log(result.message)
    })

  secureCmd
    .command("gas-estimate")
    .description("Estimate gas for a specific transaction")
    .requiredOption("--tx <base64>", "Transaction bytes in base64")
    .action(async (options) => {
      const client = getClient()
      const result = await estimateGas(client, options.tx)
      console.log(result.message)
    })
}
