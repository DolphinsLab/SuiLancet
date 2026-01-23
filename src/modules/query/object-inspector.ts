import { SuiScriptClient } from "../../core"
import { CommandResult } from "../../core/types"

export interface ObjectInfo {
  objectId: string
  version: string
  digest: string
  type: string
  owner: string
  content: Record<string, unknown> | null
}

export interface DynamicFieldInfo {
  name: { type: string; value: unknown }
  objectId: string
  type: string
}

/**
 * Inspect an object and display its details.
 */
export async function inspectObject(
  client: SuiScriptClient,
  objectId: string
): Promise<CommandResult> {
  try {
    const obj = await client.client.getObject({
      id: objectId,
      options: {
        showType: true,
        showOwner: true,
        showContent: true,
        showDisplay: true,
      },
    })

    if (!obj.data) {
      return { success: false, message: `Object ${objectId} not found` }
    }

    const data = obj.data
    const ownerStr = formatOwner(data.owner)
    const type = data.type ?? "unknown"

    console.log(`\n┌─────────────────────────────────────────┐`)
    console.log(`│           Object Inspector               │`)
    console.log(`├─────────────────────────────────────────┤`)
    console.log(`│ ID:      ${data.objectId}`)
    console.log(`│ Version: ${data.version}`)
    console.log(`│ Digest:  ${data.digest}`)
    console.log(`│ Type:    ${shortenType(type)}`)
    console.log(`│ Owner:   ${ownerStr}`)

    // Show display data if available
    if (data.display?.data && Object.keys(data.display.data).length > 0) {
      console.log(`│`)
      console.log(`│ Display:`)
      for (const [key, value] of Object.entries(data.display.data)) {
        if (value) {
          const valStr = String(value).length > 50
            ? `${String(value).slice(0, 47)}...`
            : String(value)
          console.log(`│   ${key}: ${valStr}`)
        }
      }
    }

    // Show content fields
    let content: Record<string, unknown> | null = null
    if (data.content && data.content.dataType === "moveObject") {
      content = data.content.fields as Record<string, unknown>
      console.log(`│`)
      console.log(`│ Fields:`)
      printFields(content, "│   ")
    }

    console.log(`└─────────────────────────────────────────┘`)

    const info: ObjectInfo = {
      objectId: data.objectId,
      version: data.version,
      digest: data.digest,
      type,
      owner: ownerStr,
      content,
    }

    return {
      success: true,
      message: `Object: ${shortenType(type)}`,
      data: info,
    }
  } catch (e) {
    return {
      success: false,
      message: `Failed to fetch object: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

/**
 * List dynamic fields of an object.
 */
export async function listDynamicFields(
  client: SuiScriptClient,
  objectId: string,
  options: { limit?: number } = {}
): Promise<CommandResult> {
  const limit = options.limit ?? 20
  const fields: DynamicFieldInfo[] = []

  let cursor: string | null | undefined = undefined
  let hasNext = true
  let fetched = 0

  while (hasNext && fetched < limit) {
    const result = await client.client.getDynamicFields({
      parentId: objectId,
      cursor: cursor ?? undefined,
      limit: Math.min(50, limit - fetched),
    })

    for (const field of result.data) {
      fields.push({
        name: field.name,
        objectId: field.objectId,
        type: field.objectType ?? "unknown",
      })
      fetched++
    }

    hasNext = result.hasNextPage
    cursor = result.nextCursor
  }

  console.log(`\nDynamic Fields of ${objectId}:`)
  console.log(`Total shown: ${fields.length}\n`)

  for (const field of fields) {
    const nameStr = typeof field.name.value === "string"
      ? field.name.value
      : JSON.stringify(field.name.value)
    const shortName = nameStr.length > 30 ? `${nameStr.slice(0, 27)}...` : nameStr
    console.log(`  [${shortenType(field.name.type)}] ${shortName}`)
    console.log(`    ID: ${field.objectId}`)
    console.log(`    Type: ${shortenType(field.type)}`)
    console.log("")
  }

  return {
    success: true,
    message: `Found ${fields.length} dynamic fields`,
    data: fields,
  }
}

function formatOwner(owner: unknown): string {
  if (!owner) return "unknown"
  if (typeof owner === "string") return owner
  if (typeof owner === "object") {
    if ("AddressOwner" in owner) return (owner as { AddressOwner: string }).AddressOwner
    if ("ObjectOwner" in owner) return `Object(${(owner as { ObjectOwner: string }).ObjectOwner})`
    if ("Shared" in owner) return "Shared"
    if ("Immutable" in owner) return "Immutable"
  }
  return JSON.stringify(owner)
}

function shortenType(type: string): string {
  if (type.length <= 60) return type
  const parts = type.split("::")
  if (parts.length >= 3) {
    const pkg = parts[0].slice(0, 8) + "..."
    return `${pkg}::${parts.slice(1).join("::")}`
  }
  return `...${type.slice(-50)}`
}

function printFields(fields: Record<string, unknown>, prefix: string, depth = 0) {
  if (depth > 3) {
    console.log(`${prefix}...`)
    return
  }

  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) {
      console.log(`${prefix}${key}: null`)
    } else if (typeof value === "object" && !Array.isArray(value)) {
      const inner = value as Record<string, unknown>
      // Check for Sui struct wrapper { type, fields }
      if ("fields" in inner && typeof inner.fields === "object") {
        console.log(`${prefix}${key}:`)
        printFields(inner.fields as Record<string, unknown>, prefix + "  ", depth + 1)
      } else {
        const str = JSON.stringify(value)
        if (str.length > 60) {
          console.log(`${prefix}${key}: ${str.slice(0, 57)}...`)
        } else {
          console.log(`${prefix}${key}: ${str}`)
        }
      }
    } else if (Array.isArray(value)) {
      console.log(`${prefix}${key}: [${value.length} items]`)
    } else {
      const str = String(value)
      console.log(`${prefix}${key}: ${str.length > 50 ? str.slice(0, 47) + "..." : str}`)
    }
  }
}
