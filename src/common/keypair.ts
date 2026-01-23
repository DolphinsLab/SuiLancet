import { fromBase64 } from "@mysten/sui/utils"
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519"

export function getKeypairFromSecret(secret: string) {
  const keypair = Ed25519Keypair.fromSecretKey(fromBase64(secret).slice(1, 33))
  return keypair
}
