import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../core"
import { CoinObject, CommandResult } from "../../core/types"
import { getCoinDecimals } from "../../common/price"
import { destoryZeroCoin } from "../../movecall"
import { sleep } from "../../common"

export type RiskLevel = "high" | "medium" | "low"

export interface SuspiciousToken {
  coinType: string
  objectId: string
  balance: number
  riskLevel: RiskLevel
  reasons: string[]
}

export interface AirdropScanResult {
  scanned: number
  suspicious: SuspiciousToken[]
  byRisk: { high: number; medium: number; low: number }
}

/** Known suspicious patterns in coin type names */
const SUSPICIOUS_PATTERNS = [
  /claim/i,
  /airdrop.*reward/i,
  /free.*token/i,
  /bonus.*coin/i,
  /\.com\//i,
  /\.io\//i,
  /\.xyz\//i,
  /https?:/i,
]

/** Known legitimate Sui ecosystem token prefixes */
const KNOWN_SAFE_PREFIXES = [
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN", // wUSDC
  "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d9c23bacac0::coin::COIN", // wUSDT
  "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
  "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX",
  "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
  "0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS",
]

/**
 * Assess risk level of a coin type based on heuristic rules.
 */
function assessRisk(
  coinType: string,
  balance: number,
  hasMetadata: boolean
): { level: RiskLevel; reasons: string[] } {
  const reasons: string[] = []
  let score = 0

  // Check against known safe tokens
  if (KNOWN_SAFE_PREFIXES.some((prefix) => coinType === prefix)) {
    return { level: "low", reasons: ["Known safe token"] }
  }

  // Check suspicious patterns in type name
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(coinType)) {
      reasons.push(`Type name matches suspicious pattern: ${pattern}`)
      score += 30
    }
  }

  // No on-chain metadata is suspicious
  if (!hasMetadata) {
    reasons.push("No on-chain coin metadata found")
    score += 20
  }

  // Very large unexpected balance (potential bait)
  if (balance > 1e15) {
    reasons.push("Unusually large balance (potential bait token)")
    score += 25
  }

  // Short package ID (less than standard 64 hex chars) could indicate testnet token
  const packageId = coinType.split("::")[0]
  if (packageId && packageId.length < 66) {
    reasons.push("Non-standard package ID length")
    score += 10
  }

  if (score >= 50) return { level: "high", reasons }
  if (score >= 20) return { level: "medium", reasons }
  if (reasons.length > 0) return { level: "low", reasons }

  return { level: "low", reasons: ["No risk indicators found"] }
}

/**
 * Scan wallet for suspicious airdrop tokens.
 *
 * Risk detection rules:
 * - Name matches known phishing patterns (URLs, "claim", "reward", etc.)
 * - No on-chain metadata registered
 * - Unusually large balance (bait tokens)
 * - Unknown token type not in safe list
 */
export async function scanAirdrops(
  client: SuiScriptClient
): Promise<CommandResult> {
  const allCoins = await client.getAllCoins()
  if (allCoins.length === 0) {
    return {
      success: true,
      message: "Wallet has no coins to scan",
      data: { scanned: 0, suspicious: [], byRisk: { high: 0, medium: 0, low: 0 } } as AirdropScanResult,
    }
  }

  console.log(`Scanning ${allCoins.length} coins for suspicious tokens...`)

  // Check metadata for each unique coin type
  const coinTypes = [...new Set(allCoins.map((c) => c.coinType))]
  const metadataMap = new Map<string, boolean>()

  for (const coinType of coinTypes) {
    try {
      const metadata = await client.client.getCoinMetadata({ coinType })
      metadataMap.set(coinType, metadata !== null)
    } catch {
      metadataMap.set(coinType, false)
    }
  }

  // Assess each coin
  const suspicious: SuspiciousToken[] = []

  for (const coin of allCoins) {
    const hasMetadata = metadataMap.get(coin.coinType) ?? false
    const { level, reasons } = assessRisk(coin.coinType, coin.balance, hasMetadata)

    if (level === "high" || level === "medium") {
      suspicious.push({
        coinType: coin.coinType,
        objectId: coin.objectId,
        balance: coin.balance,
        riskLevel: level,
        reasons,
      })
    }
  }

  const byRisk = {
    high: suspicious.filter((s) => s.riskLevel === "high").length,
    medium: suspicious.filter((s) => s.riskLevel === "medium").length,
    low: 0,
  }

  // Print results
  if (suspicious.length === 0) {
    console.log("No suspicious tokens found")
  } else {
    console.log(`\nFound ${suspicious.length} suspicious tokens:`)
    for (const token of suspicious) {
      const shortType = token.coinType.length > 60
        ? `...${token.coinType.slice(-40)}`
        : token.coinType
      const riskColor = token.riskLevel === "high" ? "[HIGH]" : "[MEDIUM]"
      console.log(`\n  ${riskColor} ${shortType}`)
      console.log(`    Object: ${token.objectId}`)
      console.log(`    Balance: ${token.balance}`)
      for (const reason of token.reasons) {
        console.log(`    - ${reason}`)
      }
    }
  }

  return {
    success: true,
    message: `Scan complete: ${suspicious.length} suspicious tokens found (${byRisk.high} high, ${byRisk.medium} medium)`,
    data: { scanned: allCoins.length, suspicious, byRisk } as AirdropScanResult,
  }
}

/**
 * Destroy suspicious airdrop tokens.
 * Only destroys zero-balance tokens by default for safety.
 * Non-zero tokens require explicit confirmation.
 */
export async function destroyAirdrops(
  client: SuiScriptClient,
  options: {
    riskLevel?: RiskLevel
    dryRun?: boolean
  } = {}
): Promise<CommandResult> {
  const minRisk = options.riskLevel ?? "high"

  // First scan
  const scanResult = await scanAirdrops(client)
  const data = scanResult.data as AirdropScanResult

  // Filter by risk level
  const riskOrder: RiskLevel[] = ["high", "medium", "low"]
  const minRiskIndex = riskOrder.indexOf(minRisk)
  const toDestroy = data.suspicious.filter((s) => {
    const idx = riskOrder.indexOf(s.riskLevel)
    return idx <= minRiskIndex
  })

  if (toDestroy.length === 0) {
    return {
      success: true,
      message: `No tokens at risk level '${minRisk}' or higher to destroy`,
    }
  }

  // Only auto-destroy zero-balance suspicious coins
  const zeroBalance = toDestroy.filter((t) => t.balance === 0)
  const nonZeroBalance = toDestroy.filter((t) => t.balance > 0)

  console.log(`\n${zeroBalance.length} zero-balance suspicious coins will be destroyed`)
  if (nonZeroBalance.length > 0) {
    console.log(`${nonZeroBalance.length} non-zero suspicious coins skipped (manual review recommended)`)
  }

  if (options.dryRun) {
    return {
      success: true,
      message: `[Dry Run] Would destroy ${zeroBalance.length} zero-balance suspicious coins`,
      data: { toDestroy: zeroBalance },
    }
  }

  if (zeroBalance.length === 0) {
    return {
      success: true,
      message: "No zero-balance suspicious coins to destroy safely",
    }
  }

  // Batch destroy zero-balance coins
  const batchSize = 400
  let destroyed = 0

  for (let i = 0; i < zeroBalance.length; i += batchSize) {
    const batch = zeroBalance.slice(i, i + batchSize)
    const tx = new Transaction()

    for (const token of batch) {
      destoryZeroCoin(tx, token.objectId, token.coinType)
    }

    try {
      const devInspectRes = await client.devInspectTransactionBlock(tx)
      if (devInspectRes.effects.status.status !== "success") {
        console.log(`Batch ${Math.floor(i / batchSize) + 1} simulation failed, skipping`)
        continue
      }

      const txRes = await client.signAndExecuteTransaction(tx)
      destroyed += batch.length
      console.log(`Destroyed ${destroyed}/${zeroBalance.length} suspicious coins (tx: ${txRes.digest})`)
    } catch (e) {
      console.log(`Batch failed:`, e)
    }

    if (i + batchSize < zeroBalance.length) {
      await sleep(500)
    }
  }

  return {
    success: true,
    message: `Destroyed ${destroyed} suspicious zero-balance coins`,
    data: { destroyed, skippedNonZero: nonZeroBalance.length },
  }
}
