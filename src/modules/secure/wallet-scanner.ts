import { SuiScriptClient } from "../../core"
import { CommandResult } from "../../core/types"

export type FindingSeverity = "high" | "medium" | "info"

export interface SecurityFinding {
  severity: FindingSeverity
  category: string
  description: string
  objectId?: string
  objectType?: string
}

export interface ScanResult {
  address: string
  totalObjects: number
  findings: SecurityFinding[]
  score: number
  riskLevel: "low" | "medium" | "high"
}

/** Object types that represent high-privilege capabilities */
const HIGH_PRIVILEGE_TYPES = [
  "AdminCap",
  "OwnerCap",
  "TreasuryCap",
  "UpgradeCap",
  "Publisher",
  "PolicyCap",
]

/**
 * Perform a security scan of the wallet.
 *
 * Checks:
 * - High-privilege objects (AdminCap, TreasuryCap, etc.)
 * - Suspicious/unverified token types
 * - Large number of coin types (potential spam)
 * - Zero-balance coin clutter
 */
export async function scanWalletSecurity(
  client: SuiScriptClient
): Promise<CommandResult> {
  const address = client.walletAddress
  const findings: SecurityFinding[] = []

  console.log(`Scanning wallet: ${address}\n`)

  // 1. Get all owned objects
  const allObjects: { objectId: string; type: string }[] = []
  let cursor: string | null | undefined = undefined
  let hasNext = true

  while (hasNext) {
    const result = await client.client.getOwnedObjects({
      owner: address,
      options: { showType: true },
      cursor: cursor ?? undefined,
      limit: 50,
    })

    for (const obj of result.data) {
      if (obj.data?.type) {
        allObjects.push({ objectId: obj.data.objectId, type: obj.data.type })
      }
    }

    hasNext = result.hasNextPage
    cursor = result.nextCursor
  }

  console.log(`  Total objects: ${allObjects.length}`)

  // 2. Check for high-privilege objects
  for (const obj of allObjects) {
    for (const privType of HIGH_PRIVILEGE_TYPES) {
      if (obj.type.includes(privType)) {
        findings.push({
          severity: "info",
          category: "privilege",
          description: `High-privilege object found: ${privType}`,
          objectId: obj.objectId,
          objectType: obj.type,
        })
      }
    }
  }

  // 3. Check coin types
  const coins = await client.getAllCoins()
  const coinTypes = [...new Set(coins.map((c) => c.coinType))]
  const zeroBalanceCoins = coins.filter((c) => c.balance === 0)

  if (coinTypes.length > 20) {
    findings.push({
      severity: "medium",
      category: "spam",
      description: `Large number of coin types (${coinTypes.length}) - possible spam tokens`,
    })
  }

  if (zeroBalanceCoins.length > 10) {
    findings.push({
      severity: "info",
      category: "cleanup",
      description: `${zeroBalanceCoins.length} zero-balance coins detected (use 'clean destroy-zero' to remove)`,
    })
  }

  // 4. Check for unverified tokens (no metadata)
  let unverifiedCount = 0
  for (const coinType of coinTypes) {
    try {
      const metadata = await client.client.getCoinMetadata({ coinType })
      if (!metadata) {
        unverifiedCount++
      }
    } catch {
      unverifiedCount++
    }
  }

  if (unverifiedCount > 0) {
    findings.push({
      severity: unverifiedCount > 5 ? "medium" : "info",
      category: "unverified",
      description: `${unverifiedCount} coin type(s) without on-chain metadata`,
    })
  }

  // 5. Check for suspicious object patterns
  const unknownTypes = allObjects.filter((o) => {
    const type = o.type
    return (
      !type.startsWith("0x2::") &&
      !type.startsWith("0x1::") &&
      !type.includes("::coin::Coin<")
    )
  })

  if (unknownTypes.length > 50) {
    findings.push({
      severity: "info",
      category: "objects",
      description: `${unknownTypes.length} third-party objects in wallet`,
    })
  }

  // Calculate risk score (0-100, lower is safer)
  let score = 100
  for (const finding of findings) {
    if (finding.severity === "high") score -= 30
    if (finding.severity === "medium") score -= 15
    if (finding.severity === "info") score -= 5
  }
  score = Math.max(0, Math.min(100, score))

  const riskLevel = score >= 80 ? "low" : score >= 50 ? "medium" : "high"

  // Print report
  console.log("\n┌─────────────────────────────────────────┐")
  console.log("│         Wallet Security Report           │")
  console.log("├─────────────────────────────────────────┤")
  console.log(`│ Address: ${address.slice(0, 10)}...${address.slice(-8)}`)
  console.log(`│ Score: ${score}/100 (${riskLevel.toUpperCase()})`)
  console.log("│")

  if (findings.length === 0) {
    console.log("│ No security issues found")
  } else {
    console.log(`│ Findings (${findings.length}):`)
    for (const finding of findings) {
      const icon =
        finding.severity === "high" ? "[!]" :
        finding.severity === "medium" ? "[~]" : "[i]"
      console.log(`│   ${icon} ${finding.description}`)
      if (finding.objectId) {
        console.log(`│       Object: ${finding.objectId}`)
      }
    }
  }

  console.log("└─────────────────────────────────────────┘")

  const scanResult: ScanResult = {
    address,
    totalObjects: allObjects.length,
    findings,
    score,
    riskLevel,
  }

  return {
    success: true,
    message: `Security scan complete. Score: ${score}/100 (${riskLevel})`,
    data: scanResult,
  }
}
