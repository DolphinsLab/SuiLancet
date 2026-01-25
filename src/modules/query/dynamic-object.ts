import { SuiScriptClient } from "../../core"
import { CommandResult } from "../../core/types"

export interface DynamicFieldContent {
  name: { type: string; value: unknown }
  objectId: string
  objectType: string
  content: Record<string, unknown> | null
}

export interface TableInfo {
  id: string
  size: number
  keyType: string
  valueType: string
}

/**
 * Get a dynamic field object by name.
 */
export async function getDynamicFieldObject(
  client: SuiScriptClient,
  parentId: string,
  name: { type: string; value: unknown }
): Promise<CommandResult> {
  try {
    const result = await client.client.getDynamicFieldObject({
      parentId,
      name,
    })

    if (!result.data) {
      return {
        success: false,
        message: `Dynamic field not found for name: ${JSON.stringify(name)}`,
      }
    }

    const data = result.data
    let content: Record<string, unknown> | null = null
    if (data.content && data.content.dataType === "moveObject") {
      content = data.content.fields as Record<string, unknown>
    }

    const fieldContent: DynamicFieldContent = {
      name,
      objectId: data.objectId,
      objectType: data.type ?? "unknown",
      content,
    }

    console.log(`\nDynamic Field Content:`)
    console.log(`  Name: [${name.type}] ${formatValue(name.value)}`)
    console.log(`  Object ID: ${data.objectId}`)
    console.log(`  Type: ${shortenType(data.type ?? "unknown")}`)
    if (content) {
      console.log(`  Content:`)
      printContent(content, "    ")
    }

    return {
      success: true,
      message: `Retrieved dynamic field`,
      data: fieldContent,
    }
  } catch (e) {
    return {
      success: false,
      message: `Failed to get dynamic field: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

/**
 * List dynamic fields with their full content.
 */
export async function listDynamicFieldContents(
  client: SuiScriptClient,
  parentId: string,
  options: { limit?: number; cursor?: string } = {}
): Promise<CommandResult> {
  const limit = options.limit ?? 20
  const fields: DynamicFieldContent[] = []

  let cursor: string | null | undefined = options.cursor
  let hasNext = true
  let fetched = 0

  while (hasNext && fetched < limit) {
    const result = await client.client.getDynamicFields({
      parentId,
      cursor: cursor ?? undefined,
      limit: Math.min(50, limit - fetched),
    })

    for (const field of result.data) {
      // Fetch actual content for each field
      const contentResult = await client.client.getDynamicFieldObject({
        parentId,
        name: field.name,
      })

      let content: Record<string, unknown> | null = null
      if (
        contentResult.data?.content &&
        contentResult.data.content.dataType === "moveObject"
      ) {
        content = contentResult.data.content.fields as Record<string, unknown>
      }

      fields.push({
        name: field.name,
        objectId: field.objectId,
        objectType: field.objectType ?? "unknown",
        content,
      })
      fetched++
    }

    hasNext = result.hasNextPage
    cursor = result.nextCursor
  }

  console.log(`\nDynamic Fields with Content (${parentId}):`)
  console.log(`Total: ${fields.length}\n`)

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    console.log(`[${i + 1}] ${formatValue(field.name.value)}`)
    console.log(`    Key Type: ${shortenType(field.name.type)}`)
    console.log(`    Object ID: ${field.objectId}`)
    console.log(`    Value Type: ${shortenType(field.objectType)}`)
    if (field.content) {
      console.log(`    Content:`)
      printContent(field.content, "      ")
    }
    console.log("")
  }

  return {
    success: true,
    message: `Found ${fields.length} dynamic fields with content`,
    data: {
      fields,
      hasMore: hasNext,
      nextCursor: cursor,
    },
  }
}

/**
 * Query Table entries (0x2::table::Table).
 * Tables store key-value pairs as dynamic fields.
 */
export async function queryTableEntries(
  client: SuiScriptClient,
  tableId: string,
  options: { limit?: number; cursor?: string } = {}
): Promise<CommandResult> {
  try {
    // First, get table info
    const tableObj = await client.client.getObject({
      id: tableId,
      options: { showContent: true, showType: true },
    })

    if (!tableObj.data) {
      return { success: false, message: `Table ${tableId} not found` }
    }

    const type = tableObj.data.type ?? ""
    const isTable = type.includes("::table::Table") || type.includes("::object_table::ObjectTable")
    const isBag = type.includes("::bag::Bag") || type.includes("::object_bag::ObjectBag")

    if (!isTable && !isBag) {
      console.log(`Warning: Object type is ${shortenType(type)}, not a standard Table/Bag`)
    }

    // Extract table size from content
    let size = 0
    if (
      tableObj.data.content &&
      tableObj.data.content.dataType === "moveObject"
    ) {
      const fields = tableObj.data.content.fields as Record<string, unknown>
      size = Number(fields.size ?? 0)
    }

    // Parse type parameters for Table<K, V>
    let keyType = "unknown"
    let valueType = "unknown"
    const typeMatch = type.match(/<(.+),\s*(.+)>/)
    if (typeMatch) {
      keyType = typeMatch[1]
      valueType = typeMatch[2]
    }

    const tableInfo: TableInfo = { id: tableId, size, keyType, valueType }

    console.log(`\n┌─────────────────────────────────────────┐`)
    console.log(`│           Table/Bag Inspector            │`)
    console.log(`├─────────────────────────────────────────┤`)
    console.log(`│ ID: ${tableId}`)
    console.log(`│ Type: ${shortenType(type)}`)
    console.log(`│ Size: ${size} entries`)
    console.log(`│ Key Type: ${shortenType(keyType)}`)
    console.log(`│ Value Type: ${shortenType(valueType)}`)
    console.log(`└─────────────────────────────────────────┘`)

    // List entries
    const result = await listDynamicFieldContents(client, tableId, options)

    return {
      success: true,
      message: `Table has ${size} entries`,
      data: {
        tableInfo,
        entries: (result.data as { fields: DynamicFieldContent[] }).fields,
      },
    }
  } catch (e) {
    return {
      success: false,
      message: `Failed to query table: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

/**
 * Get a specific entry from a Table by key.
 */
export async function getTableEntry(
  client: SuiScriptClient,
  tableId: string,
  keyType: string,
  keyValue: unknown
): Promise<CommandResult> {
  return getDynamicFieldObject(client, tableId, {
    type: keyType,
    value: keyValue,
  })
}

/**
 * Query LinkedTable entries (0x2::linked_table::LinkedTable).
 * LinkedTables maintain insertion order via head/tail pointers.
 */
export async function queryLinkedTableEntries(
  client: SuiScriptClient,
  tableId: string,
  options: { limit?: number } = {}
): Promise<CommandResult> {
  try {
    const tableObj = await client.client.getObject({
      id: tableId,
      options: { showContent: true, showType: true },
    })

    if (!tableObj.data) {
      return { success: false, message: `LinkedTable ${tableId} not found` }
    }

    let size = 0
    let head: unknown = null
    let tail: unknown = null

    if (
      tableObj.data.content &&
      tableObj.data.content.dataType === "moveObject"
    ) {
      const fields = tableObj.data.content.fields as Record<string, unknown>
      size = Number(fields.size ?? 0)
      head = extractOptionValue(fields.head)
      tail = extractOptionValue(fields.tail)
    }

    const type = tableObj.data.type ?? ""
    console.log(`\n┌─────────────────────────────────────────┐`)
    console.log(`│        LinkedTable Inspector             │`)
    console.log(`├─────────────────────────────────────────┤`)
    console.log(`│ ID: ${tableId}`)
    console.log(`│ Type: ${shortenType(type)}`)
    console.log(`│ Size: ${size} entries`)
    console.log(`│ Head: ${formatValue(head)}`)
    console.log(`│ Tail: ${formatValue(tail)}`)
    console.log(`└─────────────────────────────────────────┘`)

    // Traverse linked list from head
    const entries: DynamicFieldContent[] = []
    const limit = options.limit ?? 20
    let currentKey = head

    while (currentKey !== null && entries.length < limit) {
      const keyType = extractKeyType(type)
      const result = await client.client.getDynamicFieldObject({
        parentId: tableId,
        name: { type: keyType, value: currentKey },
      })

      if (!result.data) break

      let content: Record<string, unknown> | null = null
      let nextKey: unknown = null

      if (result.data.content && result.data.content.dataType === "moveObject") {
        content = result.data.content.fields as Record<string, unknown>
        // LinkedTable nodes have { prev, next, value } structure
        nextKey = extractOptionValue(content.next)
      }

      entries.push({
        name: { type: keyType, value: currentKey },
        objectId: result.data.objectId,
        objectType: result.data.type ?? "unknown",
        content,
      })

      currentKey = nextKey
    }

    console.log(`\nEntries (${entries.length}):`)
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      console.log(`\n[${i + 1}] Key: ${formatValue(entry.name.value)}`)
      if (entry.content) {
        const value = entry.content.value
        console.log(`    Value: ${formatValue(value)}`)
      }
    }

    return {
      success: true,
      message: `LinkedTable has ${size} entries, showing ${entries.length}`,
      data: { size, head, tail, entries },
    }
  } catch (e) {
    return {
      success: false,
      message: `Failed to query linked table: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

/**
 * Query VecMap entries stored as dynamic fields.
 */
export async function queryVecSetEntries(
  client: SuiScriptClient,
  objectId: string,
  fieldName: string = "contents"
): Promise<CommandResult> {
  try {
    const obj = await client.client.getObject({
      id: objectId,
      options: { showContent: true, showType: true },
    })

    if (!obj.data) {
      return { success: false, message: `Object ${objectId} not found` }
    }

    if (obj.data.content && obj.data.content.dataType === "moveObject") {
      const fields = obj.data.content.fields as Record<string, unknown>
      const contents = fields[fieldName]

      if (Array.isArray(contents)) {
        console.log(`\nVecSet/VecMap Contents (${contents.length} items):`)
        for (let i = 0; i < contents.length; i++) {
          console.log(`  [${i}] ${formatValue(contents[i])}`)
        }
        return {
          success: true,
          message: `Found ${contents.length} items`,
          data: contents,
        }
      }
    }

    return {
      success: false,
      message: `Field "${fieldName}" not found or not an array`,
    }
  } catch (e) {
    return {
      success: false,
      message: `Failed to query vec contents: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

/**
 * Recursively explore nested dynamic objects.
 */
export async function exploreDynamicObject(
  client: SuiScriptClient,
  objectId: string,
  options: { depth?: number; limit?: number } = {}
): Promise<CommandResult> {
  const maxDepth = options.depth ?? 2
  const limit = options.limit ?? 10

  async function explore(
    id: string,
    currentDepth: number,
    prefix: string
  ): Promise<Record<string, unknown>> {
    const obj = await client.client.getObject({
      id,
      options: { showContent: true, showType: true },
    })

    if (!obj.data) return { error: "not found" }

    const result: Record<string, unknown> = {
      objectId: id,
      type: obj.data.type,
    }

    if (obj.data.content && obj.data.content.dataType === "moveObject") {
      result.fields = obj.data.content.fields
    }

    // Check for dynamic fields
    if (currentDepth < maxDepth) {
      const dfResult = await client.client.getDynamicFields({
        parentId: id,
        limit,
      })

      if (dfResult.data.length > 0) {
        const dynamicFields: Record<string, unknown>[] = []

        for (const df of dfResult.data) {
          const dfContent = await client.client.getDynamicFieldObject({
            parentId: id,
            name: df.name,
          })

          if (dfContent.data) {
            const nested = await explore(
              dfContent.data.objectId,
              currentDepth + 1,
              prefix + "  "
            )
            dynamicFields.push({
              key: df.name,
              ...nested,
            })
          }
        }

        if (dynamicFields.length > 0) {
          result.dynamicFields = dynamicFields
        }
      }
    }

    return result
  }

  try {
    console.log(`\nExploring dynamic object tree (depth=${maxDepth})...`)
    const tree = await explore(objectId, 0, "")

    console.log(`\nObject Tree:`)
    console.log(JSON.stringify(tree, null, 2))

    return {
      success: true,
      message: `Explored object with depth ${maxDepth}`,
      data: tree,
    }
  } catch (e) {
    return {
      success: false,
      message: `Failed to explore: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

// Helper functions

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "null"
  if (typeof value === "string") {
    return value.length > 50 ? `${value.slice(0, 47)}...` : value
  }
  if (typeof value === "object") {
    const str = JSON.stringify(value)
    return str.length > 50 ? `${str.slice(0, 47)}...` : str
  }
  return String(value)
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

function printContent(
  content: Record<string, unknown>,
  prefix: string,
  depth = 0
) {
  if (depth > 2) {
    console.log(`${prefix}...`)
    return
  }

  for (const [key, value] of Object.entries(content)) {
    if (key === "id") continue // Skip id field for cleaner output

    if (value === null || value === undefined) {
      console.log(`${prefix}${key}: null`)
    } else if (typeof value === "object" && !Array.isArray(value)) {
      const inner = value as Record<string, unknown>
      if ("fields" in inner && typeof inner.fields === "object") {
        console.log(`${prefix}${key}:`)
        printContent(inner.fields as Record<string, unknown>, prefix + "  ", depth + 1)
      } else {
        console.log(`${prefix}${key}: ${formatValue(value)}`)
      }
    } else if (Array.isArray(value)) {
      if (value.length <= 3) {
        console.log(`${prefix}${key}: [${value.map(formatValue).join(", ")}]`)
      } else {
        console.log(`${prefix}${key}: [${value.length} items]`)
      }
    } else {
      console.log(`${prefix}${key}: ${formatValue(value)}`)
    }
  }
}

function extractOptionValue(opt: unknown): unknown {
  if (!opt || typeof opt !== "object") return null
  const o = opt as Record<string, unknown>
  if ("vec" in o && Array.isArray(o.vec)) {
    return o.vec.length > 0 ? o.vec[0] : null
  }
  if ("Some" in o) return o.Some
  if ("none" in o) return null
  return null
}

function extractKeyType(tableType: string): string {
  // Extract K from LinkedTable<K, V>
  const match = tableType.match(/<([^,>]+)/)
  return match ? match[1].trim() : "address"
}
