import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519"
import { fromBase64 } from "@mysten/sui/utils"
import { SuiScriptClient } from "../src"

describe("coin module", () => {
  const env = "mainnet"
  const client = new SuiScriptClient(env)

  it("look up wallet address", () => {
    const wallet = client.walletAddress
    console.log("wallet: ", wallet)
  })

  it("find specific wallet", () => {
    const wallet = []
    for (const phrase of wallet) {
      const keypair = Ed25519Keypair.fromSecretKey(
        fromBase64(phrase).slice(1, 33)
      )
      const walletAddress = keypair.getPublicKey().toSuiAddress()

      if (
        walletAddress ===
        "0x10e0cedcd78dc7d075f59744d2e161e22f1202d63f733d6f63f6325cba2ffdb7"
      ) {
        console.log("find", phrase)
      }
    }
  })
})
