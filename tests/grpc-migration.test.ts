import { readFileSync, readdirSync } from "node:fs"
import { extname, dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE_ROOTS = [join(ROOT, "src"), join(ROOT, "web", "src")]
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"])

function readJson(path: string): Record<string, any> {
  return JSON.parse(readFileSync(path, "utf8"))
}

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectSourceFiles(path)
    }

    return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [path] : []
  })
}

function findMatches(pattern: RegExp): string[] {
  return SOURCE_ROOTS.flatMap(collectSourceFiles).flatMap((path) => {
    const source = readFileSync(path, "utf8")
    return pattern.test(source) ? [relative(ROOT, path)] : []
  })
}

describe("gRPC migration guard", () => {
  it("uses Sui SDK 2.x in both packages", () => {
    const rootPackage = readJson(join(ROOT, "package.json"))
    const webPackage = readJson(join(ROOT, "web", "package.json"))

    expect(rootPackage.dependencies["@mysten/sui"]).toMatch(/^[~^]?2\./)
    expect(webPackage.dependencies["@mysten/sui"]).toMatch(/^[~^]?2\./)
  })

  it("uses the gRPC-capable dApp Kit instead of the JSON-RPC-only legacy package", () => {
    const webPackage = readJson(join(ROOT, "web", "package.json"))

    expect(webPackage.dependencies["@mysten/dapp-kit"]).toBeUndefined()
    expect(webPackage.dependencies["@mysten/dapp-kit-react"]).toBeDefined()
  })

  it("contains no deprecated Sui JSON-RPC client or legacy dApp Kit imports", () => {
    const legacyImports =
      /from\s+["']@mysten\/sui\/jsonRpc["']|import\s*\([^)]*["']@mysten\/sui\/jsonRpc["']|from\s+["']@mysten\/dapp-kit["']/

    expect(findMatches(legacyImports)).toEqual([])
  })

  it("contains no legacy Sui client class, provider, or hooks", () => {
    const legacySymbols =
      /\bSuiClient\b|\bSuiClientProvider\b|\buseSuiClient(?:Query|Context)?\b|\bgetFullnodeUrl\b/

    expect(findMatches(legacySymbols)).toEqual([])
  })

  it("constructs an explicit gRPC client", () => {
    const grpcClientFiles = findMatches(/\bnew\s+SuiGrpcClient\s*\(/)

    expect(grpcClientFiles.length).toBeGreaterThan(0)
  })
})
