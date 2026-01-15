import { fromBase64 } from "@mysten/sui/utils"
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519"
import * as dotenv from "dotenv"
dotenv.config()

const envSecret = process.env.SUI_WALLET_SECRET!

export function getKeypairFromSecret(secret: string) {
  const keypair = Ed25519Keypair.fromSecretKey(fromBase64(secret).slice(1, 33))
  return keypair
}
