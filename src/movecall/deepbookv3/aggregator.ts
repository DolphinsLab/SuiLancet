import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils"
import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions"

export async function add_into_whitelist_movecall(
  txb: Transaction,
  pool_id: string,
  env: string
) {
  const deepbook_vault_published_at =
    env === "testnet"
      ? "0x807e5c072051e28b501f70cc7256a15b6ff1fd3859debd08a233c15750d7b5dc"
      : env === "pre-mainnet"
      ? "0xd08fe2ea2fcf60a200154031986c0d882ebcb83a8efeaf704f6bb8375accf02c"
      : "0x79bd71317665179f4f6025df6c478d9ed47fd281c9335c4c51e1ba0996010519"
  const admin_cap =
    env === "testnet"
      ? "0x4feed7eb6e0d0395143291d23116eef9bf790522b57668d44b866d30388b3f7f"
      : env === "pre-mainnet"
      ? "0xaa176e977807e1169ba62a1a3d213daae1c6558bdc9c4673ff09d4b9a6d65c98"
      : "0x4bf2ad30c73a8911cad09812b1f80665f6559bd48e7d470edec1fe5e44480617"
  const deepbookv3_config =
    env === "testnet"
      ? "0xf6710b3667243a7f297c1206c69360f917a2eeb3962814fd043289fdc62333fb"
      : env === "pre-mainnet"
      ? "0xb952c03378c8de2323410874f13a094608acbe285a89441a4e740457763e601d"
      : "0x699d455ab8c5e02075b4345ea1f91be55bf46064ae6026cc2528e701ce3ac135"

  txb.moveCall({
    target: `${deepbook_vault_published_at}::global_config::add_whitelist`,
    arguments: [
      txb.object(admin_cap),
      txb.object(deepbookv3_config),
      txb.object(pool_id),
      txb.pure.bool(true),
    ],
  })
}

export async function remove_from_whitelist_movecall(
  txb: Transaction,
  pool_id: string,
  env: string
) {
  const deepbook_vault_published_at =
    env === "testnet"
      ? "0x807e5c072051e28b501f70cc7256a15b6ff1fd3859debd08a233c15750d7b5dc"
      : env === "pre-mainnet"
      ? "0xd08fe2ea2fcf60a200154031986c0d882ebcb83a8efeaf704f6bb8375accf02c"
      : "0x79bd71317665179f4f6025df6c478d9ed47fd281c9335c4c51e1ba0996010519"
  const admin_cap =
    env === "testnet"
      ? "0x4feed7eb6e0d0395143291d23116eef9bf790522b57668d44b866d30388b3f7f"
      : env === "pre-mainnet"
      ? "0xaa176e977807e1169ba62a1a3d213daae1c6558bdc9c4673ff09d4b9a6d65c98"
      : "0x4bf2ad30c73a8911cad09812b1f80665f6559bd48e7d470edec1fe5e44480617"
  const deepbookv3_config =
    env === "testnet"
      ? "0xf6710b3667243a7f297c1206c69360f917a2eeb3962814fd043289fdc62333fb"
      : env === "pre-mainnet"
      ? "0xb952c03378c8de2323410874f13a094608acbe285a89441a4e740457763e601d"
      : "0x699d455ab8c5e02075b4345ea1f91be55bf46064ae6026cc2528e701ce3ac135"

  txb.moveCall({
    target: `${deepbook_vault_published_at}::global_config::remove_whitelist`,
    arguments: [
      txb.object(admin_cap),
      txb.object(deepbookv3_config),
      txb.object(pool_id),
    ],
  })
}

export async function update_package_version_movecall(
  txb: Transaction,
  new_version: number,
  env: string
) {
  const aggregator_published_at =
    env === "testnet"
      ? "0x807e5c072051e28b501f70cc7256a15b6ff1fd3859debd08a233c15750d7b5dc"
      : env === "pre-mainnet"
      ? "0x86df2423b1073b167fdd2afafe229967fff7b73a6b395893faa9fe099d86bd23"
      : "0x86df2423b1073b167fdd2afafe229967fff7b73a6b395893faa9fe099d86bd23"
  const admin_cap =
    env === "testnet"
      ? "0x4feed7eb6e0d0395143291d23116eef9bf790522b57668d44b866d30388b3f7f"
      : env === "pre-mainnet"
      ? "0xaa176e977807e1169ba62a1a3d213daae1c6558bdc9c4673ff09d4b9a6d65c98"
      : "0x4bf2ad30c73a8911cad09812b1f80665f6559bd48e7d470edec1fe5e44480617"
  const deepbookv3_config =
    env === "testnet"
      ? "0xf6710b3667243a7f297c1206c69360f917a2eeb3962814fd043289fdc62333fb"
      : env === "pre-mainnet"
      ? "0xb952c03378c8de2323410874f13a094608acbe285a89441a4e740457763e601d"
      : "0x699d455ab8c5e02075b4345ea1f91be55bf46064ae6026cc2528e701ce3ac135"

  txb.moveCall({
    target: `${aggregator_published_at}::global_config::update_package_version`,
    arguments: [
      txb.object(admin_cap),
      txb.object(deepbookv3_config),
      txb.pure.u64(new_version),
    ],
  })
}

export async function withdraw_deep_fee_from_aggregator_movecall(
  txb: Transaction,
  amount: string,
  address: string,
  env: string
) {
  const deepbookv3_vault_published_at =
    env === "testnet"
      ? "0x807e5c072051e28b501f70cc7256a15b6ff1fd3859debd08a233c15750d7b5dc"
      : env === "pre-mainnet"
      ? "0xd08fe2ea2fcf60a200154031986c0d882ebcb83a8efeaf704f6bb8375accf02c"
      : "0x79bd71317665179f4f6025df6c478d9ed47fd281c9335c4c51e1ba0996010519"
  const admin_cap =
    env === "testnet"
      ? "0x4feed7eb6e0d0395143291d23116eef9bf790522b57668d44b866d30388b3f7f"
      : env === "pre-mainnet"
      ? "0xaa176e977807e1169ba62a1a3d213daae1c6558bdc9c4673ff09d4b9a6d65c98"
      : "0x4bf2ad30c73a8911cad09812b1f80665f6559bd48e7d470edec1fe5e44480617"
  const global_config =
    env === "testnet"
      ? "0xf6710b3667243a7f297c1206c69360f917a2eeb3962814fd043289fdc62333fb"
      : env === "pre-mainnet"
      ? "0xb952c03378c8de2323410874f13a094608acbe285a89441a4e740457763e601d"
      : "0x699d455ab8c5e02075b4345ea1f91be55bf46064ae6026cc2528e701ce3ac135"
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

export async function deposit_deep_fee_to_aggregator_vault_movecall(
  txb: Transaction,
  deep_coin: TransactionObjectArgument,
  env: string
) {
  const deepbookv3_vault_published_at =
    env === "testnet"
      ? "0x807e5c072051e28b501f70cc7256a15b6ff1fd3859debd08a233c15750d7b5dc"
      : env === "pre-mainnet"
      ? "0xd08fe2ea2fcf60a200154031986c0d882ebcb83a8efeaf704f6bb8375accf02c"
      : "0x79bd71317665179f4f6025df6c478d9ed47fd281c9335c4c51e1ba0996010519"
  const deepbookv3_config =
    env === "testnet"
      ? "0xf6710b3667243a7f297c1206c69360f917a2eeb3962814fd043289fdc62333fb"
      : env === "pre-mainnet"
      ? "0xb952c03378c8de2323410874f13a094608acbe285a89441a4e740457763e601d"
      : "0x699d455ab8c5e02075b4345ea1f91be55bf46064ae6026cc2528e701ce3ac135"

  txb.moveCall({
    target: `${deepbookv3_vault_published_at}::global_config::deposit_deep_fee`,
    arguments: [txb.object(deepbookv3_config), txb.object(deep_coin)],
  })
}

export async function set_alternative_payment_movecall(
  txb: Transaction,
  env: string,
  is_open: boolean
) {
  const aggregator_published_at =
    env === "testnet"
      ? "0xf92cdec6c2d73a12d8afa8dd41199b3e95b621272bbc655996539cd30de6a462"
      : env === "pre-mainnet"
      ? "0xd08fe2ea2fcf60a200154031986c0d882ebcb83a8efeaf704f6bb8375accf02c"
      : "0x79bd71317665179f4f6025df6c478d9ed47fd281c9335c4c51e1ba0996010519"
  const deepbookv3_config =
    env === "testnet"
      ? "0xe19b5d072346cae83a037d4e3c8492068a74410a74e5830b3a68012db38296aa"
      : env === "pre-mainnet"
      ? "0xb952c03378c8de2323410874f13a094608acbe285a89441a4e740457763e601d"
      : "0x699d455ab8c5e02075b4345ea1f91be55bf46064ae6026cc2528e701ce3ac135"
  const admin_cap =
    env === "testnet"
      ? "0x814edc578451181cf3da17e2d6de9eca66c209ffeb55fdf5979ea8c527fc820b"
      : env === "pre-mainnet"
      ? "0xaa176e977807e1169ba62a1a3d213daae1c6558bdc9c4673ff09d4b9a6d65c98"
      : "0x4bf2ad30c73a8911cad09812b1f80665f6559bd48e7d470edec1fe5e44480617"
  txb.moveCall({
    target: `${aggregator_published_at}::deepbookv3::set_alternative_payment`,
    arguments: [
      txb.object(admin_cap),
      txb.object(deepbookv3_config),
      txb.pure.bool(is_open),
    ],
  })
}

export async function init_sponsor_fee_record_movecall(
  txb: Transaction,
  env: string
) {
  const deepbookv3_vault_published_at =
    env === "testnet"
      ? "0x807e5c072051e28b501f70cc7256a15b6ff1fd3859debd08a233c15750d7b5dc"
      : env === "pre-mainnet"
      ? "0xd08fe2ea2fcf60a200154031986c0d882ebcb83a8efeaf704f6bb8375accf02c"
      : "0x79bd71317665179f4f6025df6c478d9ed47fd281c9335c4c51e1ba0996010519"
  const deepbookv3_config =
    env === "testnet"
      ? "0xe19b5d072346cae83a037d4e3c8492068a74410a74e5830b3a68012db38296aa"
      : env === "pre-mainnet"
      ? "0xb952c03378c8de2323410874f13a094608acbe285a89441a4e740457763e601d"
      : "0x699d455ab8c5e02075b4345ea1f91be55bf46064ae6026cc2528e701ce3ac135"

  txb.moveCall({
    target: `${deepbookv3_vault_published_at}::global_config::init_sponsor_fee_record`,
    arguments: [txb.object(deepbookv3_config)],
  })
}

export async function swap_b2a_movecall(
  txb: Transaction,
  env: string,
  pool_id: string,
  quote_coin: TransactionObjectArgument,
  base_coin_type: string,
  quote_coin_type: string,
  address: string
) {
  const aggregator_published_at =
    env === "testnet"
      ? "0xf92cdec6c2d73a12d8afa8dd41199b3e95b621272bbc655996539cd30de6a462"
      : env === "pre-mainnet"
      ? "0xd08fe2ea2fcf60a200154031986c0d882ebcb83a8efeaf704f6bb8375accf02c"
      : "0x79bd71317665179f4f6025df6c478d9ed47fd281c9335c4c51e1ba0996010519"
  const deepbookv3_config =
    env === "testnet"
      ? "0xe19b5d072346cae83a037d4e3c8492068a74410a74e5830b3a68012db38296aa"
      : env === "pre-mainnet"
      ? "0xb952c03378c8de2323410874f13a094608acbe285a89441a4e740457763e601d"
      : "0x699d455ab8c5e02075b4345ea1f91be55bf46064ae6026cc2528e701ce3ac135"

  const deep_coin = txb.moveCall({
    target: "0x2::coin::zero",
    typeArguments: [
      "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
    ],
  })

  const [return_base_coin, return_quote_coin, return_deep_coin] = txb.moveCall({
    target: `${aggregator_published_at}::deepbook_v3::swap_b2a_`,
    arguments: [
      txb.object(deepbookv3_config),
      txb.object(pool_id),
      quote_coin,
      deep_coin,
      txb.object(SUI_CLOCK_OBJECT_ID),
    ],
    typeArguments: [base_coin_type, quote_coin_type],
  })
  txb.transferObjects(
    [return_base_coin, return_quote_coin, return_deep_coin],
    txb.pure.address(address)
  )
}

export async function update_sponsor_fee_limit_movecall(
  txb: Transaction,
  env: string,
  sponsor_fee_limit: number
) {
  const aggregator_published_at =
    env === "testnet"
      ? "0xf92cdec6c2d73a12d8afa8dd41199b3e95b621272bbc655996539cd30de6a462"
      : env === "pre-mainnet"
      ? "0xd08fe2ea2fcf60a200154031986c0d882ebcb83a8efeaf704f6bb8375accf02c"
      : "0x79bd71317665179f4f6025df6c478d9ed47fd281c9335c4c51e1ba0996010519"
  const deepbookv3_config =
    env === "testnet"
      ? "0xe19b5d072346cae83a037d4e3c8492068a74410a74e5830b3a68012db38296aa"
      : env === "pre-mainnet"
      ? "0xb952c03378c8de2323410874f13a094608acbe285a89441a4e740457763e601d"
      : "0x699d455ab8c5e02075b4345ea1f91be55bf46064ae6026cc2528e701ce3ac135"
  const admin_cap =
    env === "testnet"
      ? "0x814edc578451181cf3da17e2d6de9eca66c209ffeb55fdf5979ea8c527fc820b"
      : env === "pre-mainnet"
      ? "0xaa176e977807e1169ba62a1a3d213daae1c6558bdc9c4673ff09d4b9a6d65c98"
      : "0x4bf2ad30c73a8911cad09812b1f80665f6559bd48e7d470edec1fe5e44480617"

  txb.moveCall({
    target: `${aggregator_published_at}::global_config::update_sponsor_fee_limit`,
    arguments: [
      txb.object(deepbookv3_config),
      txb.object(admin_cap),
      txb.pure.u64(sponsor_fee_limit),
    ],
  })
}

export async function add_sponsor_whitelist_address_movecall(
  txb: Transaction,
  env: string,
  address: string
) {
  const aggregator_published_at =
    env === "testnet"
      ? "0xf92cdec6c2d73a12d8afa8dd41199b3e95b621272bbc655996539cd30de6a462"
      : env === "pre-mainnet"
      ? "0xd08fe2ea2fcf60a200154031986c0d882ebcb83a8efeaf704f6bb8375accf02c"
      : "0x79bd71317665179f4f6025df6c478d9ed47fd281c9335c4c51e1ba0996010519"
  const deepbookv3_config =
    env === "testnet"
      ? "0xe19b5d072346cae83a037d4e3c8492068a74410a74e5830b3a68012db38296aa"
      : env === "pre-mainnet"
      ? "0xb952c03378c8de2323410874f13a094608acbe285a89441a4e740457763e601d"
      : "0x699d455ab8c5e02075b4345ea1f91be55bf46064ae6026cc2528e701ce3ac135"
  const admin_cap =
    env === "testnet"
      ? "0x814edc578451181cf3da17e2d6de9eca66c209ffeb55fdf5979ea8c527fc820b"
      : env === "pre-mainnet"
      ? "0xaa176e977807e1169ba62a1a3d213daae1c6558bdc9c4673ff09d4b9a6d65c98"
      : "0x4bf2ad30c73a8911cad09812b1f80665f6559bd48e7d470edec1fe5e44480617"

  txb.moveCall({
    target: `${aggregator_published_at}::global_config::add_sponsor_whitelist_address`,
    arguments: [
      txb.object(deepbookv3_config),
      txb.object(admin_cap),
      txb.pure.address(address),
    ],
  })
}

export async function remove_sponsor_whitelist_address_movecall(
  txb: Transaction,
  env: string,
  address: string
) {
  const aggregator_published_at =
    env === "testnet"
      ? "0xf92cdec6c2d73a12d8afa8dd41199b3e95b621272bbc655996539cd30de6a462"
      : env === "pre-mainnet"
      ? "0xd08fe2ea2fcf60a200154031986c0d882ebcb83a8efeaf704f6bb8375accf02c"
      : "0x79bd71317665179f4f6025df6c478d9ed47fd281c9335c4c51e1ba0996010519"
  const deepbookv3_config =
    env === "testnet"
      ? "0xe19b5d072346cae83a037d4e3c8492068a74410a74e5830b3a68012db38296aa"
      : env === "pre-mainnet"
      ? "0xb952c03378c8de2323410874f13a094608acbe285a89441a4e740457763e601d"
      : "0x699d455ab8c5e02075b4345ea1f91be55bf46064ae6026cc2528e701ce3ac135"
  const admin_cap =
    env === "testnet"
      ? "0x814edc578451181cf3da17e2d6de9eca66c209ffeb55fdf5979ea8c527fc820b"
      : env === "pre-mainnet"
      ? "0xaa176e977807e1169ba62a1a3d213daae1c6558bdc9c4673ff09d4b9a6d65c98"
      : "0x4bf2ad30c73a8911cad09812b1f80665f6559bd48e7d470edec1fe5e44480617"

  txb.moveCall({
    target: `${aggregator_published_at}::global_config::remove_sponsor_whitelist_address`,
    arguments: [
      txb.object(deepbookv3_config),
      txb.object(admin_cap),
      txb.pure.address(address),
    ],
  })
}
