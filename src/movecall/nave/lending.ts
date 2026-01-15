import { Transaction } from "@mysten/sui/transactions"

export function createAccountCapMoveCall(txb: Transaction) {
  const nave_published_at =
    "0x834a86970ae93a73faf4fff16ae40bdb72b91c47be585fff19a2af60a19ddca3"

  const accountCap = txb.moveCall({
    target: `${nave_published_at}::lending::create_account`,
    typeArguments: [],
    arguments: [],
  })
  return accountCap
}
