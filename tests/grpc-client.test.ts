import { isSuiGrpcClient } from "@mysten/sui/grpc"
import { createSuiGrpcClient } from "../src/core/client"

describe("createSuiGrpcClient", () => {
  it("creates a branded gRPC client for the explicit network", () => {
    const client = createSuiGrpcClient(
      "testnet",
      "https://fullnode.testnet.sui.io:443"
    )

    expect(isSuiGrpcClient(client)).toBe(true)
    expect(client.network).toBe("testnet")
  })
})
