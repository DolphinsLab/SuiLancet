import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../client"
import {
  create_ambassador_movecall,
  query_ambassador_by_owner_movecall,
  query_ambassador_wait_claimed_rewards_movecall,
} from "../../movecall/blub/ambassador"

export async function query_ambassador_by_owner(
  client: SuiScriptClient,
  owner: string,
  env: string
): Promise<string> {
  const txb = new Transaction()

  query_ambassador_by_owner_movecall(txb, owner, env)

  const devInspectRes = await client.devInspectTransactionBlock(txb)
  if (devInspectRes.effects.status.status !== "success") {
    console.log(devInspectRes)
    console.log("transaction failed")
  }

  let eventData = devInspectRes?.events[0]?.parsedJson as any

  let ambassador_id = eventData.ambassador_id
  console.log(ambassador_id)
  return ambassador_id
}

export async function create_ambassador(client: SuiScriptClient, env: string) {
  const txb = new Transaction()

  create_ambassador_movecall(txb, env)

  const devInspectRes = await client.devInspectTransactionBlock(txb)
  if (devInspectRes.effects.status.status !== "success") {
    console.log(devInspectRes)
    console.log("transaction failed")
  }

  const txRes = await client.signAndExecuteTransaction(txb)
  console.log(txRes)
}

// export async function get_medias(
//   client: SuiScriptClient,
//   ambassador_id: string
// ) {
//   const objectData = await client.client.getObject({
//     id: ambassador_id,
//     options: {
//       showContent: true,
//     },
//   })
//   if (objectData == null) {
//     console.log("object data is null")
//     return
//   }
//   console.log(objectData)
//   const fields = (objectData.data.content as any).fields
//   console.log(JSON.stringify(fields, null, 2))

//   const medias_table_id = fields.medias.fields.id.id
//   //   console.log(medias_table_id)

//   const medias_table_object = await client.client.getDynamicFields({
//     parentId: medias_table_id,
//   })

//   const field_ids = medias_table_object.data.map((item: any) => item.objectId)
//   console.log(field_ids)

//   const media_objects = await client.client.multiGetObjects({
//     ids: field_ids,
//     options: {
//       showContent: true,
//     },
//   })
//   const media_contents = media_objects.map((item: any) => item.data.content)
//   const medias = new Map<string, string>()

//   for (const media of media_contents) {
//     const fields = (media as any).fields
//     const media_key = fields.name
//     const media_value = fields.value
//     medias.set(media_key, media_value)
//   }
//   console.log(medias)
// }

type PaymentHistory = {
  timestamp: number
  amount: number
  coin_type: string
  usd_amount: number
  calculated_pool_id: string
}

export async function get_payment_info(
  client: SuiScriptClient,
  ambassador_id: string,
  env: string
) {
  const objectData = await client.client.getObject({
    id: ambassador_id,
    options: {
      showContent: true,
    },
  })

  if (objectData == null) {
    console.log("object data is null")
    return
  }
  const fields = (objectData.data.content as any).fields
  console.log(JSON.stringify(fields, null, 2))

  const payment_every_week = fields.payment_every_week
  console.log("payment_every_week", payment_every_week)

  const payment_history_table_id = fields.payment_history.fields.id.id
  //   console.log(medias_table_id)

  const payment_history_object = await client.client.getDynamicFields({
    parentId: payment_history_table_id,
  })

  const payment_history_field_ids = payment_history_object.data.map(
    (item: any) => item.objectId
  )
  console.log(payment_history_field_ids)

  const payment_history_objects = await client.client.multiGetObjects({
    ids: payment_history_field_ids,
    options: {
      showContent: true,
    },
  })
  const payment_history_contents = payment_history_objects.map(
    (item: any) => item.data.content
  )

  const payment_history = new Map<number, PaymentHistory>()
  console.log(payment_history_contents)
  for (const payment_history_content of payment_history_contents) {
    const fields = (payment_history_content as any).fields
    const timestamp = fields.timestamp
    const amount = fields.amount
    const coin_type = fields.coin_type.name
    const usd_amount = fields.usd_amount
    const calculated_pool_id = fields.calculated_pool_id.id
    payment_history.set(timestamp, {
      timestamp,
      amount,
      coin_type,
      usd_amount,
      calculated_pool_id,
    })
  }

  const wait_claimed_rewards = await query_ambassador_wait_claimed_rewards(
    client,
    ambassador_id,
    env
  )
  console.log("wait_claimed_rewards", wait_claimed_rewards)

  return {
    payment_every_week,
    wait_claimed_rewards,
    payment_history,
  }
}

export async function query_ambassador_wait_claimed_rewards(
  client: SuiScriptClient,
  ambassador_id: string,
  env: string
) {
  const txb = new Transaction()
  query_ambassador_wait_claimed_rewards_movecall(txb, ambassador_id, env)

  const devInspectRes = await client.devInspectTransactionBlock(txb)
  if (devInspectRes.effects.status.status !== "success") {
    console.log(devInspectRes)
    console.log("transaction failed")
  }

  let eventData = devInspectRes?.events[0]?.parsedJson as any

  let wait_claimed_rewards = eventData.wait_claimed_rewards
  console.log(wait_claimed_rewards)
  return wait_claimed_rewards
}
