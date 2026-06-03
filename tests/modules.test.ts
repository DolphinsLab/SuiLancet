import * as root from "../src"
import * as clean from "../src/modules/clean"
import * as manage from "../src/modules/manage"
import * as query from "../src/modules/query"
import * as secure from "../src/modules/secure"

describe("module exports", () => {
  it("exports the v2 toolkit namespaces from the root entrypoint", () => {
    expect(root.clean).toBeDefined()
    expect(root.manage).toBeDefined()
    expect(root.query).toBeDefined()
    expect(root.secure).toBeDefined()
    expect(root.defi).toBeDefined()
  })

  it("keeps clean module APIs exported", () => {
    expect(clean.batchDestroyZeroCoin).toBeDefined()
    expect(clean.mergeCoins).toBeDefined()
    expect(clean.cleanDust).toBeDefined()
    expect(clean.scanAirdrops).toBeDefined()
    expect(clean.destroyAirdrops).toBeDefined()
  })

  it("keeps manage module APIs exported", () => {
    expect(manage.transferCoin).toBeDefined()
    expect(manage.splitSuiCoins).toBeDefined()
    expect(manage.depositIntoVault).toBeDefined()
    expect(manage.previewMigration).toBeDefined()
    expect(manage.listKiosks).toBeDefined()
  })

  it("keeps secure and query module APIs exported", () => {
    expect(secure.simulateTransaction).toBeDefined()
    expect(secure.scanWalletSecurity).toBeDefined()
    expect(secure.getGasInfo).toBeDefined()
    expect(query.getAssetOverview).toBeDefined()
    expect(query.parseTransaction).toBeDefined()
    expect(query.inspectObject).toBeDefined()
  })
})
