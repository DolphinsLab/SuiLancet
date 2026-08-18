import { createSuiGrpcClient } from "../src/core/client"

const liveTest = process.env.RUN_LIVE_GRPC === "1" ? it : it.skip

describe("live Sui gRPC endpoint", () => {
  liveTest.each([
    [
      "mainnet" as const,
      process.env.SUI_GRPC_ENDPOINT_MAINNET ??
        "https://fullnode.mainnet.sui.io:443",
    ],
    [
      "testnet" as const,
      process.env.SUI_GRPC_ENDPOINT_TESTNET ??
        "https://fullnode.testnet.sui.io:443",
    ],
  ])(
    "serves %s Core API and ledger service reads",
    async (network, endpoint) => {
      const client = createSuiGrpcClient(network, endpoint)

      const [
        { referenceGasPrice },
        { response },
        { balance },
        { coinMetadata },
        ownedObjects,
      ] = await Promise.all([
        client.core.getReferenceGasPrice(),
        client.ledgerService.getServiceInfo({}),
        client.core.getBalance({ owner: "0x0" }),
        client.core.getCoinMetadata({ coinType: "0x2::sui::SUI" }),
        client.core.listOwnedObjects({ owner: "0x0", limit: 1 }),
      ])

      expect(BigInt(referenceGasPrice)).toBeGreaterThan(0n)
      expect(response.checkpointHeight).toBeDefined()
      expect(BigInt(response.checkpointHeight!.toString())).toBeGreaterThan(0n)
      expect(balance.coinType).toContain("::sui::SUI")
      expect(BigInt(balance.balance)).toBeGreaterThanOrEqual(0n)
      expect(coinMetadata?.symbol).toBe("SUI")
      expect(Array.isArray(ownedObjects.objects)).toBe(true)
    },
    30_000
  )
})
