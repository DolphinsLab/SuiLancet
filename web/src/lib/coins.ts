import type { ClientWithCoreApi, SuiClientTypes } from '@mysten/sui/client'
import { normalizeStructTag } from '@mysten/sui/utils'

export interface OwnedCoin {
  coinType: string
  coinObjectId: string
  balance: string
  version: string
  digest: string
}

export function coinTypeFromObjectType(objectType: string): string | null {
  const match = objectType.match(/::coin::Coin<(.+)>$/)
  return match ? normalizeStructTag(match[1]) : null
}

/**
 * List every coin type by scanning owned objects.
 *
 * The Core API's `listCoins` method defaults to SUI when no coin type is
 * provided, so it cannot replace the legacy all-coin query by itself.
 */
export async function listAllOwnedCoins(
  client: ClientWithCoreApi,
  owner: string,
  maxCoins = Number.POSITIVE_INFINITY,
): Promise<OwnedCoin[]> {
  const coins: OwnedCoin[] = []
  let cursor: string | null = null

  while (true) {
    const page: SuiClientTypes.ListOwnedObjectsResponse<{ json: true }> =
      await client.core.listOwnedObjects({
        owner,
        cursor,
        limit: 50,
        include: { json: true },
      })

    for (const object of page.objects) {
      const coinType = coinTypeFromObjectType(object.type)
      const balance = object.json?.balance
      if (
        !coinType ||
        (typeof balance !== 'string' && typeof balance !== 'number')
      ) {
        continue
      }

      coins.push({
        coinType,
        coinObjectId: object.objectId,
        balance: String(balance),
        version: object.version,
        digest: object.digest,
      })
      if (coins.length >= maxCoins) return coins
    }

    if (!page.hasNextPage) return coins
    if (!page.cursor) {
      throw new Error('gRPC owned-object pagination returned no cursor')
    }
    cursor = page.cursor
  }
}
