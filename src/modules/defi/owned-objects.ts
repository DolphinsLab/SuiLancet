import type { ClientWithCoreApi, SuiClientTypes } from "@mysten/sui/client"

export interface OwnedMoveObject {
  objectId: string
  type: string
  fields: Record<string, unknown>
}

export async function listOwnedMoveObjects(
  client: ClientWithCoreApi,
  owner: string,
  type?: string
): Promise<OwnedMoveObject[]> {
  const objects: OwnedMoveObject[] = []
  let cursor: string | null = null

  do {
    const page: SuiClientTypes.ListOwnedObjectsResponse<{ json: true }> =
      await client.core.listOwnedObjects({
        owner,
        type,
        cursor,
        limit: 50,
        include: { json: true },
      })

    for (const object of page.objects) {
      if (object.json) {
        objects.push({
          objectId: object.objectId,
          type: object.type,
          fields: object.json,
        })
      }
    }

    if (!page.hasNextPage) return objects
    if (!page.cursor) {
      throw new Error("gRPC object pagination returned no cursor")
    }
    cursor = page.cursor
  } while (cursor)

  return objects
}
