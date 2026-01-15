import { ObjectRef } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../client"

export async function getObjectRef(
  client: SuiScriptClient,
  objectId: string
): Promise<ObjectRef> {
  const object = await client.client.getObject({
    id: objectId,
    options: {
      showContent: true,
    },
  })

  if (!object.data) {
    throw new Error(`Object not found, objectId: ${objectId}`)
  }

  return {
    objectId: object.data?.objectId,
    version: object.data?.version,
    digest: object.data?.digest,
  }
}
