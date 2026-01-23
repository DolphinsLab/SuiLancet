import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../core"
import { CommandResult } from "../../core/types"

const KIOSK_TYPE = "0x0000000000000000000000000000000000000000000000000000000000000002::kiosk::Kiosk"
const KIOSK_OWNER_CAP_TYPE = "0x0000000000000000000000000000000000000000000000000000000000000002::kiosk::KioskOwnerCap"

export interface KioskInfo {
  kioskId: string
  ownerCapId: string | null
  itemCount: number
  profits: number
}

export interface KioskItem {
  objectId: string
  type: string
  isListed: boolean
}

/**
 * List all Kiosks owned by the wallet address.
 * Finds both Kiosk objects and their corresponding KioskOwnerCaps.
 */
export async function listKiosks(
  client: SuiScriptClient
): Promise<CommandResult> {
  const address = client.walletAddress

  // Find KioskOwnerCaps owned by user
  const caps: { objectId: string; kioskId: string }[] = []
  let cursor: string | null | undefined = undefined
  let hasNext = true

  while (hasNext) {
    const result = await client.client.getOwnedObjects({
      owner: address,
      filter: { StructType: KIOSK_OWNER_CAP_TYPE },
      options: { showContent: true },
      cursor: cursor ?? undefined,
      limit: 50,
    })

    for (const obj of result.data) {
      if (!obj.data?.content || obj.data.content.dataType !== "moveObject") continue
      const fields = obj.data.content.fields as Record<string, unknown>
      const forField = fields["for"] as string | undefined
      if (forField) {
        caps.push({ objectId: obj.data.objectId, kioskId: forField })
      }
    }

    hasNext = result.hasNextPage
    cursor = result.nextCursor
  }

  if (caps.length === 0) {
    return { success: true, message: "No Kiosks found for this wallet", data: [] }
  }

  // Get details for each Kiosk
  const kiosks: KioskInfo[] = []
  for (const cap of caps) {
    try {
      const kioskObj = await client.client.getObject({
        id: cap.kioskId,
        options: { showContent: true },
      })

      if (kioskObj.data?.content && kioskObj.data.content.dataType === "moveObject") {
        const fields = kioskObj.data.content.fields as Record<string, unknown>
        kiosks.push({
          kioskId: cap.kioskId,
          ownerCapId: cap.objectId,
          itemCount: Number(fields["item_count"] ?? 0),
          profits: Number(fields["profits"] ?? 0),
        })
      }
    } catch {
      kiosks.push({
        kioskId: cap.kioskId,
        ownerCapId: cap.objectId,
        itemCount: -1,
        profits: 0,
      })
    }
  }

  // Print results
  console.log(`Found ${kiosks.length} Kiosk(s):\n`)
  for (const kiosk of kiosks) {
    console.log(`  Kiosk: ${kiosk.kioskId}`)
    console.log(`    OwnerCap: ${kiosk.ownerCapId}`)
    console.log(`    Items: ${kiosk.itemCount}`)
    console.log(`    Profits: ${kiosk.profits}`)
    console.log("")
  }

  return {
    success: true,
    message: `Found ${kiosks.length} Kiosk(s)`,
    data: kiosks,
  }
}

/**
 * Show contents of a specific Kiosk by listing its dynamic fields.
 */
export async function showKiosk(
  client: SuiScriptClient,
  kioskId: string
): Promise<CommandResult> {
  const items: KioskItem[] = []
  let cursor: string | null | undefined = undefined
  let hasNext = true

  while (hasNext) {
    const result = await client.client.getDynamicFields({
      parentId: kioskId,
      cursor: cursor ?? undefined,
      limit: 50,
    })

    for (const field of result.data) {
      // Kiosk items are stored as dynamic fields with Item type
      if (field.name.type?.includes("kiosk::Item")) {
        items.push({
          objectId: field.objectId,
          type: field.objectType ?? "unknown",
          isListed: false, // Would need to check Listing dynamic fields
        })
      }
    }

    hasNext = result.hasNextPage
    cursor = result.nextCursor
  }

  console.log(`Kiosk ${kioskId} contents:`)
  console.log(`  Total items: ${items.length}\n`)

  for (const item of items) {
    const shortType = item.type.length > 50 ? `...${item.type.slice(-35)}` : item.type
    console.log(`  ${item.objectId}`)
    console.log(`    Type: ${shortType}`)
  }

  return {
    success: true,
    message: `Kiosk has ${items.length} items`,
    data: items,
  }
}

/**
 * Take (extract) an item from a Kiosk to the owner's wallet.
 * Requires KioskOwnerCap and the item must not be listed.
 */
export async function takeFromKiosk(
  client: SuiScriptClient,
  kioskId: string,
  kioskCapId: string,
  itemId: string,
  itemType: string
): Promise<CommandResult> {
  const tx = new Transaction()

  const [item] = tx.moveCall({
    target: "0x2::kiosk::take",
    typeArguments: [itemType],
    arguments: [tx.object(kioskId), tx.object(kioskCapId), tx.pure.id(itemId)],
  })

  tx.transferObjects([item], client.walletAddress)

  const txRes = await client.sendTransaction(tx)
  return {
    success: true,
    message: `Extracted item ${itemId} from Kiosk`,
    data: { digest: txRes?.digest },
  }
}

/**
 * Withdraw profits (SUI) from a Kiosk.
 */
export async function withdrawKioskProfits(
  client: SuiScriptClient,
  kioskId: string,
  kioskCapId: string
): Promise<CommandResult> {
  const tx = new Transaction()

  const [coin] = tx.moveCall({
    target: "0x2::kiosk::withdraw",
    arguments: [
      tx.object(kioskId),
      tx.object(kioskCapId),
      tx.moveCall({ target: "0x1::option::none", typeArguments: ["u64"] }),
    ],
  })

  tx.transferObjects([coin], client.walletAddress)

  const txRes = await client.sendTransaction(tx)
  return {
    success: true,
    message: `Withdrew profits from Kiosk ${kioskId}`,
    data: { digest: txRes?.digest },
  }
}
