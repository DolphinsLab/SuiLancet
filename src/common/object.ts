import { ObjectRef } from "@mysten/sui/transactions"
import { normalizeStructTag } from "@mysten/sui/utils"
import { SuiScriptClient } from "../core/client"

const SUI_COIN_TYPE =
  "0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>"

export async function getObjectRef(
  client: SuiScriptClient,
  objectId: string
): Promise<ObjectRef> {
  const { object } = await client.client.core.getObject({
    objectId,
  })

  return {
    objectId: object.objectId,
    version: object.version,
    digest: object.digest,
  }
}

/**
 * Validate that the specified object is a SUI coin suitable for gas payment.
 * Returns the ObjectRef if valid, throws a descriptive error otherwise.
 */
export async function validateGasCoin(
  client: SuiScriptClient,
  gasObjectId: string,
  operationObjectIds: string[] = []
): Promise<ObjectRef> {
  // Check for conflicts: gas object must not overlap with objects being operated on
  const conflict = operationObjectIds.find((id) => id === gasObjectId)
  if (conflict) {
    throw new Error(
      `Gas object ${gasObjectId} conflicts with operation object. ` +
        `The same object cannot be used as both gas payment and transaction input.`
    )
  }

  const { object } = await client.client.core.getObject({
    objectId: gasObjectId,
  })

  if (normalizeStructTag(object.type) !== SUI_COIN_TYPE) {
    throw new Error(
      `Object ${gasObjectId} is not a SUI coin (type: ${object.type}). ` +
        `Only SUI coins can be used as gas payment.`
    )
  }

  return {
    objectId: object.objectId,
    version: object.version,
    digest: object.digest,
  }
}
