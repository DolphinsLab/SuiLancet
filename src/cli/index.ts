import { program } from "commander"
import { SuiScriptClient, NetworkEnv } from "../core"
import { registerCleanCommands } from "./commands/clean"
import { registerManageCommands } from "./commands/manage"
import { registerSecureCommands } from "./commands/secure"
import { registerQueryCommands } from "./commands/query"
import { registerDefiCommands } from "./commands/defi"

program
  .name("sui-lancet")
  .description("SuiLancet - Sui on-chain utility toolkit")
  .version("2.0.0")

program
  .option(
    "-e, --env <env>",
    "Network environment (testnet, pre-mainnet, mainnet)",
    "mainnet"
  )
  .option("-d, --debug", "Enable debug mode")

function getClient(): SuiScriptClient {
  const env = program.opts().env as NetworkEnv
  try {
    return new SuiScriptClient(env)
  } catch (error) {
    console.error("Failed to initialize client:", error)
    process.exit(1)
  }
}

registerCleanCommands(program, getClient)
registerManageCommands(program, getClient)
registerSecureCommands(program, getClient)
registerQueryCommands(program, getClient)
registerDefiCommands(program, getClient)

program.configureOutput({
  writeErr: (str) => process.stderr.write(`[Error] ${str}`),
})

program.parse()
