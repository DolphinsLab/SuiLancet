import { listAllBalances } from "../src/common/balance"
import { getTransactionHistory } from "../src/modules/query/tx-parser"

describe("gRPC pagination helpers", () => {
  it("collects every balance page", async () => {
    const pages = [
      {
        balances: [{ coinType: "coin-a", balance: "1" }],
        hasNextPage: true,
        cursor: "next",
      },
      {
        balances: [{ coinType: "coin-b", balance: "2" }],
        hasNextPage: false,
        cursor: null,
      },
    ]
    let page = 0
    const client = {
      core: {
        listBalances: async () => pages[page++],
      },
    }

    const balances = await listAllBalances(client as never, "0xowner")

    expect(balances.map((balance) => balance.coinType)).toEqual([
      "coin-a",
      "coin-b",
    ])
    expect(page).toBe(2)
  })

  it("continues transaction scans and restores gRPC timestamps", async () => {
    const beforeValues: Array<string | null> = []
    let page = 0
    const pages = [
      {
        transactions: [],
        hasNextPage: true,
        endCursor: "scan-frontier",
      },
      {
        transactions: [
          {
            $kind: "Transaction",
            Transaction: {
              digest: "digest-1",
              effects: {
                gasUsed: {
                  computationCost: "10",
                  storageCost: "5",
                  storageRebate: "2",
                },
              },
              transaction: { commands: [] },
              status: { success: true },
            },
          },
        ],
        hasNextPage: false,
        endCursor: "digest-1",
      },
    ]
    const client = {
      walletAddress: "0xowner",
      client: {
        core: {
          listTransactions: async ({
            before,
          }: {
            before: string | null
          }) => {
            beforeValues.push(before)
            return pages[page++]
          },
        },
        ledgerService: {
          batchGetTransactions: async () => ({
            response: {
              transactions: [
                {
                  result: {
                    oneofKind: "transaction",
                    transaction: {
                      digest: "digest-1",
                      timestamp: {
                        seconds: 1_700_000_000n,
                        nanos: 123_000_000,
                      },
                    },
                  },
                },
              ],
            },
          }),
        },
      },
    }
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

    try {
      const result = await getTransactionHistory(client as never, { limit: 1 })
      const transactions = result.data as Array<{ timestamp: number }>

      expect(beforeValues).toEqual([null, "scan-frontier"])
      expect(transactions[0].timestamp).toBe(1_700_000_000_123)
    } finally {
      consoleSpy.mockRestore()
    }
  })
})
