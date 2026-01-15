import { Transaction } from "@mysten/sui/transactions"

export async function deposit_movecall(
  txb: Transaction,
  coin_object_id: string,
  coin_type: string,
  amount: number
) {
  const vault_published_at =
    "0x9ef0375d2c22479b97cd0b578798b00d84bb29300e95c12814d1eb870093bdae"
  const vault =
    "0x22e87e53f184eaf1d74fde61ee78e1d96346f9ba350976181fc4013dceb20f7d"

  txb.moveCall({
    target: `${vault_published_at}::vault::deposit`,
    arguments: [
      txb.object(vault),
      txb.object(coin_object_id),
      txb.pure.u64(amount),
    ],
    typeArguments: [coin_type],
  })
}

export function withdraw_movecall(
  txb: Transaction,
  coin_type: string,
  amount: number
) {
  const vault_published_at =
    "0x9ef0375d2c22479b97cd0b578798b00d84bb29300e95c12814d1eb870093bdae"
  const vault =
    "0x22e87e53f184eaf1d74fde61ee78e1d96346f9ba350976181fc4013dceb20f7d"
  const admin_cap =
    "0xef22a227d75f2ee6aa51e6b1205d6054b53e424118307ffaf656456832dfabc3"
  const coin = txb.moveCall({
    target: `${vault_published_at}::router::withdraw`,
    arguments: [txb.object(admin_cap), txb.object(vault), txb.pure.u64(amount)],
    typeArguments: [coin_type],
  })
  return coin
}

export function first_aid_packet_movecall(txb: Transaction, coins: string[]) {
  const vault_published_at =
    "0xcdea665bd66529a3ef4675784d7f06be971a4151d60016b7afb2755039037b75"
  const vault =
    "0x22e87e53f184eaf1d74fde61ee78e1d96346f9ba350976181fc4013dceb20f7d"
  const admin_cap =
    "0xef22a227d75f2ee6aa51e6b1205d6054b53e424118307ffaf656456832dfabc3"
  for (const coin of coins) {
    txb.moveCall({
      target: `${vault_published_at}::router::first_aid_packet`,
      arguments: [txb.object(admin_cap), txb.object(vault), txb.object(coin)],
      typeArguments: [
        "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
      ],
    })
  }
}
