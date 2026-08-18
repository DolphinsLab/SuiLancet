import { listAllOwnedCoins } from "../web/src/lib/coins"

describe("listAllOwnedCoins", () => {
  it("paginates all owned objects and keeps every coin type", async () => {
    const pages = [
      {
        objects: [
          {
            objectId: "0xsui",
            version: "1",
            digest: "sui-digest",
            type: "0x2::coin::Coin<0x2::sui::SUI>",
            json: { balance: "42" },
          },
          {
            objectId: "0xnft",
            version: "1",
            digest: "nft-digest",
            type: "0xabc::nft::Example",
            json: { name: "not a coin" },
          },
        ],
        hasNextPage: true,
        cursor: "next-page",
      },
      {
        objects: [
          {
            objectId: "0xcoin",
            version: "2",
            digest: "coin-digest",
            type: "0x2::coin::Coin<0xabc::token::TOKEN>",
            json: { balance: 7 },
          },
        ],
        hasNextPage: false,
        cursor: null,
      },
    ]
    let page = 0
    const client = {
      core: {
        listOwnedObjects: async () => pages[page++],
      },
    }

    const coins = await listAllOwnedCoins(client as never, "0xowner")

    expect(coins).toEqual([
      {
        coinType:
          "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
        coinObjectId: "0xsui",
        balance: "42",
        version: "1",
        digest: "sui-digest",
      },
      {
        coinType:
          "0x0000000000000000000000000000000000000000000000000000000000000abc::token::TOKEN",
        coinObjectId: "0xcoin",
        balance: "7",
        version: "2",
        digest: "coin-digest",
      },
    ])
    expect(page).toBe(2)
  })
})
