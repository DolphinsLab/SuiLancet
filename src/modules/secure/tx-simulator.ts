import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../core"
import { CommandResult } from "../../core/types"
import { getCoinDecimals } from "../../common/price"

export interface BalanceChange {
  coinType: string
  amount: string
  owner: string
}

export interface ObjectChange {
  type: "created" | "mutated" | "deleted" | "wrapped" | "published"
  objectType: string
  objectId: string
}

export interface SimulationResult {
  success: boolean
  gasUsed: {
    computationCost: string
    storageCost: string
    storageRebate: string
    total: string
  }
  balanceChanges: BalanceChange[]
  objectChanges: ObjectChange[]
  events: unknown[]
  error?: string
}

/**
 * Simulate a transaction and return human-readable results.
 * Uses devInspectTransactionBlock for safe dry-run execution.
 */
export async function simulateTransaction(
  client: SuiScriptClient,
  txBytes: string
): Promise<CommandResult> {
  try {
    const tx = Transaction.from(txBytes)
    const result = await client.devInspectTransactionBlock(tx)

    const effects = result.effects
    const isSuccess = effects.status.status === "success"

    // Parse gas costs
    const gasUsed = {
      computationCost: effects.gasUsed?.computationCost ?? "0",
      storageCost: effects.gasUsed?.storageCost ?? "0",
      storageRebate: effects.gasUsed?.storageRebate ?? "0",
      total: String(
        BigInt(effects.gasUsed?.computationCost ?? 0) +
        BigInt(effects.gasUsed?.storageCost ?? 0) -
        BigInt(effects.gasUsed?.storageRebate ?? 0)
      ),
    }

    // Parse balance changes (field may exist at runtime on newer SDK versions)
    const balanceChanges: BalanceChange[] = []
    const resultAny = result as unknown as Record<string, unknown>
    if (Array.isArray(resultAny.balanceChanges)) {
      for (const change of resultAny.balanceChanges as Array<{ coinType: string; amount: string; owner: unknown }>) {
        balanceChanges.push({
          coinType: change.coinType,
          amount: change.amount,
          owner: typeof change.owner === "object" && change.owner !== null && "AddressOwner" in change.owner
            ? (change.owner as { AddressOwner: string }).AddressOwner
            : "unknown",
        })
      }
    }

    // Parse object changes
    const objectChanges: ObjectChange[] = []
    if (effects.created) {
      for (const obj of effects.created) {
        objectChanges.push({
          type: "created",
          objectType: "unknown",
          objectId: obj.reference?.objectId ?? "unknown",
        })
      }
    }
    if (effects.mutated) {
      for (const obj of effects.mutated) {
        objectChanges.push({
          type: "mutated",
          objectType: "unknown",
          objectId: obj.reference?.objectId ?? "unknown",
        })
      }
    }
    if (effects.deleted) {
      for (const obj of effects.deleted) {
        objectChanges.push({
          type: "deleted",
          objectType: "unknown",
          objectId: obj.objectId ?? "unknown",
        })
      }
    }

    // Format output
    console.log("\n┌─────────────────────────────────────────┐")
    console.log("│       Transaction Simulation Result       │")
    console.log("├─────────────────────────────────────────┤")
    console.log(`│ Status: ${isSuccess ? "SUCCESS" : "FAILED"}`)

    if (!isSuccess) {
      console.log(`│ Error: ${effects.status.error ?? "unknown"}`)
    }

    console.log("│")
    console.log("│ Gas Cost:")
    console.log(`│   Computation: ${formatMist(gasUsed.computationCost)}`)
    console.log(`│   Storage:     ${formatMist(gasUsed.storageCost)}`)
    console.log(`│   Rebate:      ${formatMist(gasUsed.storageRebate)}`)
    console.log(`│   Net Cost:    ${formatMist(gasUsed.total)}`)

    if (balanceChanges.length > 0) {
      console.log("│")
      console.log("│ Balance Changes:")
      for (const change of balanceChanges) {
        const sign = BigInt(change.amount) >= 0 ? "+" : ""
        const shortType = shortenType(change.coinType)
        console.log(`│   ${shortType}: ${sign}${formatMist(change.amount)}`)
      }
    }

    if (objectChanges.length > 0) {
      console.log("│")
      console.log("│ Object Changes:")
      const created = objectChanges.filter((o) => o.type === "created").length
      const mutated = objectChanges.filter((o) => o.type === "mutated").length
      const deleted = objectChanges.filter((o) => o.type === "deleted").length
      if (created > 0) console.log(`│   Created: ${created}`)
      if (mutated > 0) console.log(`│   Mutated: ${mutated}`)
      if (deleted > 0) console.log(`│   Deleted: ${deleted}`)
    }

    console.log("└─────────────────────────────────────────┘")

    const simResult: SimulationResult = {
      success: isSuccess,
      gasUsed,
      balanceChanges,
      objectChanges,
      events: result.events ?? [],
      error: isSuccess ? undefined : effects.status.error,
    }

    return {
      success: isSuccess,
      message: isSuccess
        ? `Simulation successful. Net gas: ${formatMist(gasUsed.total)} SUI`
        : `Simulation failed: ${effects.status.error}`,
      data: simResult,
    }
  } catch (e) {
    return {
      success: false,
      message: `Simulation error: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

/**
 * Simulate a transaction built programmatically.
 */
export async function simulateTransactionBlock(
  client: SuiScriptClient,
  tx: Transaction
): Promise<CommandResult> {
  const bytes = await tx.build({ client: client.client })
  const b64 = Buffer.from(bytes).toString("base64")
  return simulateTransaction(client, b64)
}

function formatMist(mist: string): string {
  const value = BigInt(mist)
  const sui = Number(value) / 1_000_000_000
  if (Math.abs(sui) < 0.0001) return `${mist} MIST`
  return `${sui.toFixed(6)} SUI`
}

function shortenType(type: string): string {
  const parts = type.split("::")
  if (parts.length >= 3) {
    return parts[parts.length - 1]
  }
  return type.length > 30 ? `...${type.slice(-25)}` : type
}
