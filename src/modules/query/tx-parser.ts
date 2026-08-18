import type { SuiClientTypes } from "@mysten/sui/client"
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

async function loadTransactionTimestamps(
  client: SuiScriptClient,
  digests: string[]
): Promise<Map<string, number>> {
  const timestamps = new Map<string, number>()

  for (let index = 0; index < digests.length; index += 50) {
    const batch = digests.slice(index, index + 50)
    const { response } =
      await client.client.ledgerService.batchGetTransactions({
        digests: batch,
        readMask: { paths: ["digest", "timestamp"] },
      })

    for (const result of response.transactions) {
      if (result.result.oneofKind !== "transaction") continue

      const transaction = result.result.transaction
      const timestamp = transaction.timestamp
      if (!transaction.digest || !timestamp) continue

      timestamps.set(
        transaction.digest,
        Number(timestamp.seconds) * 1_000 +
          Math.floor(timestamp.nanos / 1_000_000)
      )
    }
  }

  return timestamps
}

/**
 * Classify a transaction based on its Move calls and effects.
 */
function classifyTransaction(tx: SuiClientTypes.TransactionData | undefined): {
  type: string
  description: string
} {
  if (!tx) {
    return { type: "Unknown", description: "Unable to parse transaction" }
  }

  const commands = tx.commands
  if (commands.length === 0) {
    return { type: "Empty", description: "Empty transaction" }
  }

  const moveCallTargets: string[] = []
  let hasTransfer = false
  let hasMerge = false
  let hasSplit = false

  for (const command of commands) {
    if ("MoveCall" in command) {
      const moveCall = command.MoveCall
      moveCallTargets.push(
        `${moveCall.package}::${moveCall.module}::${moveCall.function}`
      )
    }
    if ("TransferObjects" in command) hasTransfer = true
    if ("MergeCoins" in command) hasMerge = true
    if ("SplitCoins" in command) hasSplit = true
  }

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
    return {
      type: "Contract Call",
      description: `${commands.length} commands via ${extractModule(moveCallTargets[0])}`,
    }
  }

  return { type: "Other", description: "Programmable transaction" }
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

  const parsed: ParsedTransaction[] = []
  let before: string | null = null

  while (parsed.length < limit) {
    const page: SuiClientTypes.ListTransactionsResponse<{
      effects: true
      transaction: true
    }> = await client.client.core.listTransactions({
      filter: { sender: address },
      include: {
        effects: true,
        transaction: true,
      },
      limit: limit - parsed.length,
      before,
      order: "descending",
    })

    for (const result of page.transactions) {
      const tx =
        result.$kind === "Transaction"
          ? result.Transaction
          : result.FailedTransaction
      const effects = tx.effects
      const gasUsed =
        Number(effects.gasUsed.computationCost) +
        Number(effects.gasUsed.storageCost) -
        Number(effects.gasUsed.storageRebate)
      const { type, description } = classifyTransaction(tx.transaction)

      parsed.push({
        digest: tx.digest,
        timestamp: null,
        type,
        description,
        gasUsed,
        success: tx.status.success,
      })
    }

    if (!page.hasNextPage) break
    if (!page.endCursor) {
      throw new Error("gRPC transaction pagination returned no cursor")
    }
    before = page.endCursor
  }

  const timestamps = await loadTransactionTimestamps(
    client,
    parsed.map((transaction) => transaction.digest)
  )
  for (const transaction of parsed) {
    transaction.timestamp = timestamps.get(transaction.digest) ?? null
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
    const result = await client.client.core.getTransaction({
      digest,
      include: {
        effects: true,
        transaction: true,
        events: true,
        balanceChanges: true,
        objectTypes: true,
      },
    })
    const tx =
      result.$kind === "Transaction"
        ? result.Transaction
        : result.FailedTransaction

    const effects = tx.effects
    const isSuccess = tx.status.success

    console.log(`\nTransaction: ${digest}`)
    console.log(`Status: ${isSuccess ? "SUCCESS" : "FAILED"}`)

    // Gas
    const net =
      Number(effects.gasUsed.computationCost) +
      Number(effects.gasUsed.storageCost) -
      Number(effects.gasUsed.storageRebate)
    console.log(`Gas: ${(net / 1_000_000_000).toFixed(6)} SUI`)

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
    if (effects.changedObjects.length > 0) {
      const created = effects.changedObjects.filter(
        (object) => object.idOperation === "Created"
      )
      const deleted = effects.changedObjects.filter(
        (object) => object.idOperation === "Deleted"
      )
      const mutated = effects.changedObjects.filter(
        (object) =>
          object.idOperation === "None" &&
          object.outputState !== "DoesNotExist"
      )

      console.log(`\nObject Changes:`)
      if (created.length > 0) console.log(`  Created: ${created.length}`)
      if (mutated.length > 0) console.log(`  Mutated: ${mutated.length}`)
      if (deleted.length > 0) console.log(`  Deleted: ${deleted.length}`)
    }

    // Events
    if (tx.events && tx.events.length > 0) {
      console.log(`\nEvents (${tx.events.length}):`)
      for (const event of tx.events.slice(0, 5)) {
        const shortType = event.eventType.split("::").slice(-2).join("::")
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
