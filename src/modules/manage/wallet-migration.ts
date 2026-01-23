import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../core"
import { CoinObject, CommandResult } from "../../core/types"
import { sleep } from "../../common"

const SUI_TYPE =
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"

export interface OwnedObject {
  objectId: string
  type: string
  version: string
}

export interface MigrationPlan {
  recipient: string
  coins: CoinObject[]
  objects: OwnedObject[]
  totalBatches: number
  estimatedGas: number
}

export interface MigrationResult {
  totalMigrated: number
  totalFailed: number
  batches: { digest: string; count: number }[]
  failedObjects: string[]
}

export interface MigrateOptions {
  /** Target address (required) */
  recipient: string
  /** Only migrate specific asset type: "coin" | "object" | "all" */
  type?: "coin" | "object" | "all"
  /** Objects per batch, default 50 */
  batchSize?: number
  /** Preview only */
  dryRun?: boolean
  /** Coin types to exclude from migration */
  excludeTypes?: string[]
}

/**
 * Scan all assets owned by the wallet.
 */
async function scanAssets(client: SuiScriptClient): Promise<{
  coins: CoinObject[]
  objects: OwnedObject[]
}> {
  const address = client.walletAddress

  // Get all coins
  const coins = await client.getAllCoins()

  // Get all owned objects (non-coin)
  const objects: OwnedObject[] = []
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
      if (!obj.data) continue
      const type = obj.data.type ?? ""
      // Skip coin objects (already covered above)
      if (type.startsWith("0x2::coin::Coin<")) continue
      objects.push({
        objectId: obj.data.objectId,
        type,
        version: obj.data.version,
      })
    }

    hasNext = result.hasNextPage
    cursor = result.nextCursor
  }

  return { coins, objects }
}

/**
 * Generate a migration plan showing what will be transferred.
 */
export async function previewMigration(
  client: SuiScriptClient,
  options: MigrateOptions
): Promise<CommandResult> {
  console.log("Scanning wallet assets...")
  const { coins, objects } = await scanAssets(client)

  const migrateType = options.type ?? "all"
  const batchSize = options.batchSize ?? 50

  let migrationCoins = coins
  let migrationObjects = objects

  if (migrateType === "coin") {
    migrationObjects = []
  } else if (migrateType === "object") {
    migrationCoins = []
  }

  // Exclude specified types
  if (options.excludeTypes?.length) {
    migrationCoins = migrationCoins.filter(
      (c) => !options.excludeTypes!.includes(c.coinType)
    )
  }

  // Separate SUI coins (migrated last to preserve gas)
  const suiCoins = migrationCoins.filter((c) => c.coinType === SUI_TYPE)
  const nonSuiCoins = migrationCoins.filter((c) => c.coinType !== SUI_TYPE)

  const totalItems = nonSuiCoins.length + migrationObjects.length + (suiCoins.length > 0 ? 1 : 0)
  const totalBatches = Math.ceil(
    (nonSuiCoins.length + migrationObjects.length) / batchSize
  ) + (suiCoins.length > 0 ? 1 : 0)

  // Print summary
  console.log(`\nMigration Plan:`)
  console.log(`  Target: ${options.recipient}`)
  console.log(`  Non-SUI Coins: ${nonSuiCoins.length}`)
  console.log(`  SUI Coins: ${suiCoins.length}`)
  console.log(`  Other Objects: ${migrationObjects.length}`)
  console.log(`  Total Batches: ${totalBatches}`)
  console.log(`  Batch Size: ${batchSize}`)

  // Group coins by type for readability
  const coinsByType = new Map<string, { count: number; totalBalance: number }>()
  for (const coin of migrationCoins) {
    const entry = coinsByType.get(coin.coinType) ?? { count: 0, totalBalance: 0 }
    entry.count++
    entry.totalBalance += coin.balance
    coinsByType.set(coin.coinType, entry)
  }

  if (coinsByType.size > 0) {
    console.log(`\n  Coins by type:`)
    for (const [type, info] of coinsByType) {
      const shortType = type.length > 50 ? `...${type.slice(-35)}` : type
      console.log(`    ${shortType}: ${info.count} coins (total: ${info.totalBalance})`)
    }
  }

  if (migrationObjects.length > 0) {
    console.log(`\n  Objects (first 10):`)
    for (const obj of migrationObjects.slice(0, 10)) {
      const shortType = obj.type.length > 50 ? `...${obj.type.slice(-35)}` : obj.type
      console.log(`    ${obj.objectId} (${shortType})`)
    }
    if (migrationObjects.length > 10) {
      console.log(`    ... and ${migrationObjects.length - 10} more`)
    }
  }

  const plan: MigrationPlan = {
    recipient: options.recipient,
    coins: migrationCoins,
    objects: migrationObjects,
    totalBatches,
    estimatedGas: totalBatches * 5_000_000, // rough estimate
  }

  return {
    success: true,
    message: `Migration plan: ${totalItems} items in ${totalBatches} batches`,
    data: plan,
  }
}

/**
 * Execute wallet migration: transfer all assets to target address.
 *
 * Order of operations:
 * 1. Transfer non-SUI coins (batch)
 * 2. Transfer other objects (batch)
 * 3. Transfer remaining SUI (last, to preserve gas payment)
 */
export async function executeMigration(
  client: SuiScriptClient,
  options: MigrateOptions
): Promise<CommandResult> {
  if (options.dryRun) {
    return previewMigration(client, options)
  }

  const { coins, objects } = await scanAssets(client)
  const migrateType = options.type ?? "all"
  const batchSize = options.batchSize ?? 50
  const recipient = options.recipient

  let migrationCoins = coins
  let migrationObjects = objects

  if (migrateType === "coin") {
    migrationObjects = []
  } else if (migrateType === "object") {
    migrationCoins = []
  }

  if (options.excludeTypes?.length) {
    migrationCoins = migrationCoins.filter(
      (c) => !options.excludeTypes!.includes(c.coinType)
    )
  }

  const suiCoins = migrationCoins.filter((c) => c.coinType === SUI_TYPE)
  const nonSuiCoins = migrationCoins.filter((c) => c.coinType !== SUI_TYPE)

  const result: MigrationResult = {
    totalMigrated: 0,
    totalFailed: 0,
    batches: [],
    failedObjects: [],
  }

  // Phase 1: Transfer non-SUI coins
  if (nonSuiCoins.length > 0) {
    console.log(`\nPhase 1: Migrating ${nonSuiCoins.length} non-SUI coins...`)
    for (let i = 0; i < nonSuiCoins.length; i += batchSize) {
      const batch = nonSuiCoins.slice(i, i + batchSize)
      const tx = new Transaction()
      const refs = batch.map((c) => tx.object(c.objectId))
      tx.transferObjects(refs, recipient)

      try {
        const txRes = await client.sendTransaction(tx)
        result.totalMigrated += batch.length
        if (txRes) result.batches.push({ digest: txRes.digest, count: batch.length })
        console.log(`  Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} coins transferred`)
      } catch (e) {
        result.totalFailed += batch.length
        result.failedObjects.push(...batch.map((c) => c.objectId))
        console.log(`  Batch ${Math.floor(i / batchSize) + 1} failed:`, e)
      }

      await sleep(500)
    }
  }

  // Phase 2: Transfer other objects
  if (migrationObjects.length > 0) {
    console.log(`\nPhase 2: Migrating ${migrationObjects.length} objects...`)
    for (let i = 0; i < migrationObjects.length; i += batchSize) {
      const batch = migrationObjects.slice(i, i + batchSize)
      const tx = new Transaction()
      const refs = batch.map((o) => tx.object(o.objectId))
      tx.transferObjects(refs, recipient)

      try {
        const txRes = await client.sendTransaction(tx)
        result.totalMigrated += batch.length
        if (txRes) result.batches.push({ digest: txRes.digest, count: batch.length })
        console.log(`  Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} objects transferred`)
      } catch (e) {
        result.totalFailed += batch.length
        result.failedObjects.push(...batch.map((o) => o.objectId))
        console.log(`  Batch ${Math.floor(i / batchSize) + 1} failed:`, e)
      }

      await sleep(500)
    }
  }

  // Phase 3: Transfer SUI (last)
  if (suiCoins.length > 0) {
    console.log(`\nPhase 3: Migrating SUI...`)
    const tx = new Transaction()
    // Merge all SUI coins into gas, then transfer gas
    if (suiCoins.length > 1) {
      const otherSui = suiCoins.slice(1).map((c) => tx.object(c.objectId))
      tx.mergeCoins(tx.gas, otherSui)
    }
    tx.transferObjects([tx.gas], recipient)

    try {
      const txRes = await client.sendTransaction(tx)
      result.totalMigrated += suiCoins.length
      if (txRes) result.batches.push({ digest: txRes.digest, count: suiCoins.length })
      console.log(`  All SUI transferred`)
    } catch (e) {
      result.totalFailed += suiCoins.length
      console.log(`  SUI transfer failed:`, e)
    }
  }

  // Print report
  console.log(`\n--- Migration Report ---`)
  console.log(`  Total Migrated: ${result.totalMigrated}`)
  console.log(`  Total Failed: ${result.totalFailed}`)
  console.log(`  Batches Executed: ${result.batches.length}`)
  if (result.failedObjects.length > 0) {
    console.log(`  Failed Objects:`)
    for (const id of result.failedObjects.slice(0, 5)) {
      console.log(`    ${id}`)
    }
  }

  return {
    success: result.totalFailed === 0,
    message: `Migration complete: ${result.totalMigrated} migrated, ${result.totalFailed} failed`,
    data: result,
  }
}
