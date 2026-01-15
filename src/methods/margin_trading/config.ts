import { Transaction } from "@mysten/sui/transactions"
import { SuiScriptClient } from "../../client"
import {
  createMarketMoveCall,
  CreateMarketParams,
  transferAdminCapMoveCall,
  transferObjectMoveCall,
  updateMarketMaxLeverageMoveCall,
  UpdateMarketMaxLeverageParams,
  updateMarketOpenFeeRateMoveCall,
  UpdateMarketOpenFeeRateParams,
} from "~/movecall/margin-trading/market"

export async function createMarket(
  client: SuiScriptClient,
  env: string,
  params: CreateMarketParams
) {
  const txb = new Transaction()
  createMarketMoveCall(txb, env, params)
  await client.sendTransaction(txb)
}

export async function updateMarketMaxLeverage(
  client: SuiScriptClient,
  env: string,
  params: UpdateMarketMaxLeverageParams
) {
  const txb = new Transaction()
  updateMarketMaxLeverageMoveCall(txb, env, params)
  await client.sendTransaction(txb)
}

export async function updateMarketOpenFeeRate(
  client: SuiScriptClient,
  env: string,
  params: UpdateMarketOpenFeeRateParams
) {
  const txb = new Transaction()
  updateMarketOpenFeeRateMoveCall(txb, env, params)
  await client.sendTransaction(txb)
}

export async function transferAdminCap(
  client: SuiScriptClient,
  env: string,
  address: string
) {
  const txb = new Transaction()
  transferAdminCapMoveCall(txb, env, address)
  await client.sendTransaction(txb)
}

export async function transferObject(
  client: SuiScriptClient,
  env: string,
  object: string,
  address: string
) {
  const txb = new Transaction()
  transferObjectMoveCall(txb, env, object, address)
  await client.sendTransaction(txb)
}
