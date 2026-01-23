import { SuiScriptClient } from "../../core"
import { CommandResult } from "../../core/types"

export interface ParsedTransaction {
  digest: string
  timestamp: number | null
  type: string
  description: string
  gasUsed: number
  success: boolean
}

/**
 * Classify a transaction based on its Move calls and effects.
 */
function classifyTransaction(tx: Record<string, unknown>): {
  type: string
  description: string
} {
  const transaction = tx.transaction as Record<string, unknown> | undefined
  const data = transaction?.data as Record<string, unknown> | undefined
  const txData = data?.transaction as Record<string, unknown> | undefined

  if (!txData) {
    return { type: "Unknown", description: "Unable to parse transaction" }
  }

  const kind = txData.kind as string | undefined

  if (kind === "ProgrammableTransaction") {
    const transactions = (txData as Record<string, unknown>).transactions as Array<Record<string, unknown>> | undefined
    if (!transactions || transactions.length === 0) {
      return { type: "Empty", description: "Empty transaction block" }
    }

    // Analyze commands to determine type
    const moveCallTargets: string[] = []
    let hasTransfer = false
    let hasMerge = false
    let hasSplit = false

    for (const cmd of transactions) {
      if ("MoveCall" in cmd) {
        const moveCall = cmd.MoveCall as Record<string, unknown>
        const target = `${moveCall.package}::${moveCall.module}::${moveCall.function}`
        moveCallTargets.push(target)
      }
      if ("TransferObjects" in cmd) hasTransfer = true
      if ("MergeCoins" in cmd) hasMerge = true
      if ("SplitCoins" in cmd) hasSplit = true
    }

    // Classify based on patterns
    if (moveCallTargets.length === 0) {
      if (hasTransfer && !hasSplit && !hasMerge) {
        return { type: "Transfer", description: "Token/object transfer" }
      }
      if (hasMerge) {
        return { type: "Merge", description: "Coin merge operation" }
      }
      if (hasSplit && hasTransfer) {
        return { type: "Split & Transfer", description: "Split and transfer coins" }
      }
      if (hasSplit) {
        return { type: "Split", description: "Coin split operation" }
      }
    }

    // Check for known protocol patterns
    for (const target of moveCallTargets) {
      if (target.includes("::swap") || target.includes("::router")) {
        return { type: "Swap", description: `DEX swap via ${extractModule(target)}` }
      }
      if (target.includes("::mint") || target.includes("::create")) {
        return { type: "Mint", description: `Mint/Create via ${extractModule(target)}` }
      }
      if (target.includes("::stake") || target.includes("::add_stake")) {
        return { type: "Stake", description: `Staking via ${extractModule(target)}` }
      }
      if (target.includes("::kiosk")) {
        return { type: "Kiosk", description: `Kiosk operation via ${extractModule(target)}` }
      }
      if (target.includes("::claim")) {
        return { type: "Claim", description: `Claim rewards via ${extractModule(target)}` }
      }
    }

    if (moveCallTargets.length > 0) {
      const module = extractModule(moveCallTargets[0])
      return {
        type: "Contract Call",
        description: `${transactions.length} commands via ${module}`,
      }
    }
  }

  return { type: "Other", description: kind ?? "Unknown transaction kind" }
}

function extractModule(target: string): string {
  const parts = target.split("::")
  if (parts.length >= 2) {
    return parts[1]
  }
  return target.length > 20 ? `...${target.slice(-15)}` : target
}

/**
 * Query and parse transaction history for the current wallet.
 */
export async function getTransactionHistory(
  client: SuiScriptClient,
  options: { limit?: number } = {}
): Promise<CommandResult> {
  const limit = options.limit ?? 20
  const address = client.walletAddress

  const txBlocks = await client.client.queryTransactionBlocks({
    filter: { FromAddress: address },
    options: {
      showEffects: true,
      showInput: true,
    },
    limit,
    order: "descending",
  })

  const parsed: ParsedTransaction[] = []

  for (const tx of txBlocks.data) {
    const effects = tx.effects
    const isSuccess = effects?.status?.status === "success"
    const gasUsed =
      Number(effects?.gasUsed?.computationCost ?? 0) +
      Number(effects?.gasUsed?.storageCost ?? 0) -
      Number(effects?.gasUsed?.storageRebate ?? 0)

    const { type, description } = classifyTransaction(tx as unknown as Record<string, unknown>)

    parsed.push({
      digest: tx.digest,
      timestamp: tx.timestampMs ? Number(tx.timestampMs) : null,
      type,
      description,
      gasUsed,
      success: isSuccess,
    })
  }

  // Format output
  console.log(`\nRecent Transactions (${parsed.length}):\n`)

  for (const tx of parsed) {
    const timeStr = tx.timestamp
      ? formatTimeAgo(tx.timestamp)
      : "unknown time"
    const statusIcon = tx.success ? "+" : "x"
    const gasSui = (tx.gasUsed / 1_000_000_000).toFixed(4)

    console.log(`  [${statusIcon}] ${tx.digest.slice(0, 12)}...  ${timeStr}`)
    console.log(`      ${tx.type}: ${tx.description}`)
    console.log(`      Gas: ${gasSui} SUI`)
    console.log("")
  }

  return {
    success: true,
    message: `Showing ${parsed.length} recent transactions`,
    data: parsed,
  }
}

/**
 * Parse a single transaction by digest.
 */
export async function parseTransaction(
  client: SuiScriptClient,
  digest: string
): Promise<CommandResult> {
  try {
    const tx = await client.client.getTransactionBlock({
      digest,
      options: {
        showEffects: true,
        showInput: true,
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      },
    })

    const effects = tx.effects
    const isSuccess = effects?.status?.status === "success"

    console.log(`\nTransaction: ${digest}`)
    console.log(`Status: ${isSuccess ? "SUCCESS" : "FAILED"}`)

    if (tx.timestampMs) {
      console.log(`Time: ${new Date(Number(tx.timestampMs)).toLocaleString()}`)
    }

    // Gas
    if (effects?.gasUsed) {
      const net =
        Number(effects.gasUsed.computationCost) +
        Number(effects.gasUsed.storageCost) -
        Number(effects.gasUsed.storageRebate)
      console.log(`Gas: ${(net / 1_000_000_000).toFixed(6)} SUI`)
    }

    // Balance changes
    if (tx.balanceChanges && tx.balanceChanges.length > 0) {
      console.log(`\nBalance Changes:`)
      for (const change of tx.balanceChanges) {
        const sign = BigInt(change.amount) >= 0 ? "+" : ""
        const sui = Number(BigInt(change.amount)) / 1_000_000_000
        const shortType = change.coinType.split("::").pop() ?? change.coinType
        console.log(`  ${shortType}: ${sign}${sui.toFixed(4)}`)
      }
    }

    // Object changes
    if (tx.objectChanges && tx.objectChanges.length > 0) {
      const created = tx.objectChanges.filter((o) => o.type === "created")
      const deleted = tx.objectChanges.filter((o) => o.type === "deleted")
      const mutated = tx.objectChanges.filter((o) => o.type === "mutated")

      console.log(`\nObject Changes:`)
      if (created.length > 0) console.log(`  Created: ${created.length}`)
      if (mutated.length > 0) console.log(`  Mutated: ${mutated.length}`)
      if (deleted.length > 0) console.log(`  Deleted: ${deleted.length}`)
    }

    // Events
    if (tx.events && tx.events.length > 0) {
      console.log(`\nEvents (${tx.events.length}):`)
      for (const event of tx.events.slice(0, 5)) {
        const shortType = event.type.split("::").slice(-2).join("::")
        console.log(`  ${shortType}`)
      }
      if (tx.events.length > 5) {
        console.log(`  ... and ${tx.events.length - 5} more`)
      }
    }

    return {
      success: true,
      message: `Transaction ${digest}: ${isSuccess ? "SUCCESS" : "FAILED"}`,
      data: tx,
    }
  } catch (e) {
    return {
      success: false,
      message: `Failed to fetch transaction: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

function formatTimeAgo(timestampMs: number): string {
  const diff = Date.now() - timestampMs
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
