import { SuiScriptClient } from "../../core"
import { CommandResult } from "../../core/types"

export interface GasInfo {
  referenceGasPrice: number
  currentEpoch: string
  recommendedBudget: {
    simple: number
    moderate: number
    complex: number
  }
}

/**
 * Get current network gas info and recommendations.
 */
export async function getGasInfo(
  client: SuiScriptClient
): Promise<CommandResult> {
  const suiClient = client.client

  // Get reference gas price for current epoch
  const refGasPrice = await suiClient.getReferenceGasPrice()
  const refGasPriceNum = Number(refGasPrice)

  // Get latest checkpoint for epoch info
  const checkpoint = await suiClient.getLatestCheckpointSequenceNumber()

  // Calculate recommended budgets based on reference price
  // Simple: transfer, merge (< 5 commands)
  // Moderate: split, multi-transfer (5-20 commands)
  // Complex: batch operations (20+ commands)
  const recommended = {
    simple: Math.ceil(refGasPriceNum * 2000),
    moderate: Math.ceil(refGasPriceNum * 10000),
    complex: Math.ceil(refGasPriceNum * 50000),
  }

  const gasInfo: GasInfo = {
    referenceGasPrice: refGasPriceNum,
    currentEpoch: checkpoint,
    recommendedBudget: recommended,
  }

  // Format output
  console.log("\n┌─────────────────────────────────────────┐")
  console.log("│           Gas Information                │")
  console.log("├─────────────────────────────────────────┤")
  console.log(`│ Reference Gas Price: ${refGasPriceNum} MIST`)
  console.log(`│ Latest Checkpoint: ${checkpoint}`)
  console.log("│")
  console.log("│ Recommended Gas Budget:")
  console.log(`│   Simple tx (transfer):     ${formatGas(recommended.simple)}`)
  console.log(`│   Moderate tx (multi-op):   ${formatGas(recommended.moderate)}`)
  console.log(`│   Complex tx (batch):       ${formatGas(recommended.complex)}`)
  console.log("└─────────────────────────────────────────┘")

  return {
    success: true,
    message: `Reference gas price: ${refGasPriceNum} MIST`,
    data: gasInfo,
  }
}

/**
 * Estimate gas for a specific transaction (by bytes).
 */
export async function estimateGas(
  client: SuiScriptClient,
  txBytes: string
): Promise<CommandResult> {
  try {
    const { Transaction } = await import("@mysten/sui/transactions")
    const tx = Transaction.from(txBytes)

    const result = await client.devInspectTransactionBlock(tx)
    const effects = result.effects

    const computationCost = BigInt(effects.gasUsed?.computationCost ?? 0)
    const storageCost = BigInt(effects.gasUsed?.storageCost ?? 0)
    const storageRebate = BigInt(effects.gasUsed?.storageRebate ?? 0)
    const netCost = computationCost + storageCost - storageRebate

    // Add 20% buffer for safety
    const recommendedBudget = Number(netCost) + Math.ceil(Number(netCost) * 0.2)

    console.log("\n┌─────────────────────────────────────────┐")
    console.log("│         Gas Estimate for Transaction     │")
    console.log("├─────────────────────────────────────────┤")
    console.log(`│ Computation: ${formatGas(Number(computationCost))}`)
    console.log(`│ Storage:     ${formatGas(Number(storageCost))}`)
    console.log(`│ Rebate:      ${formatGas(Number(storageRebate))}`)
    console.log(`│ Net Cost:    ${formatGas(Number(netCost))}`)
    console.log("│")
    console.log(`│ Recommended Budget (net +20%): ${formatGas(recommendedBudget)}`)
    console.log("└─────────────────────────────────────────┘")

    return {
      success: true,
      message: `Estimated gas: ${formatGas(Number(netCost))}, recommended budget: ${formatGas(recommendedBudget)}`,
      data: {
        computationCost: Number(computationCost),
        storageCost: Number(storageCost),
        storageRebate: Number(storageRebate),
        netCost: Number(netCost),
        recommendedBudget,
      },
    }
  } catch (e) {
    return {
      success: false,
      message: `Gas estimation failed: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

function formatGas(mist: number): string {
  if (mist < 1_000_000) return `${mist} MIST`
  const sui = mist / 1_000_000_000
  return `${sui.toFixed(6)} SUI (${mist} MIST)`
}
