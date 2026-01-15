import { Transaction } from "@mysten/sui/dist/cjs/transactions"

export async function withdraw_deep_fee_from_deepbookv3_vaults_movecall(
  txb: Transaction,
  amount: string,
  address: string,
  env: string
) {
  const deepbookv3_vault_published_at =
    env === "testnet"
      ? "0xd84cf3de51439cf38151c6dff28080b34bc817876f88badc989dc3a5016f6e55"
      : "0x0"
  const global_config =
    env === "testnet"
      ? "0x22cae613588ab5f1f3534bde040fe1697da01b286c8f536b0a4fe3256a6a0d1c"
      : "0xa0c3e61f2f57045942f498cdc38c6347bd2e09e04a85ac33b866b84de5b5b141"
  const admin_cap =
    env === "testnet"
      ? "0x468f6fb71a518fa322e9394e38b8c690a39821ebb53dd4ac9c40fb7580fa2501"
      : "0x5af89774fe35d80fc9b8de7971b4c9807ef3dcff83cf3e61b7224cbe20adc3c5"
  const deep = txb.moveCall({
    target: `${deepbookv3_vault_published_at}::global_config::withdraw_deep_fee`,
    arguments: [
      txb.object(admin_cap),
      txb.object(global_config),
      txb.pure.u64(amount),
    ],
  })
  txb.transferObjects([deep], txb.pure.address(address))
}
