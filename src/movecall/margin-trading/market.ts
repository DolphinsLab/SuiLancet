import { Transaction } from "@mysten/sui/transactions"
import { MARGIN_TRADING_PUBLISHED_AT, marginTradingConfig } from "./const"
import { CLOCK_ADDRESS } from "@cetusprotocol/aggregator-sdk"

export type CreateMarketParams = {
  baseCoinType: string
  quoteCoinType: string
  maxLongLeverage: number
  maxShortLeverage: number
  openFeeRate: number
  closeFeeRate: number
}

export function createMarketMoveCall(
  txb: Transaction,
  env: string,
  params: CreateMarketParams
) {
  const config = marginTradingConfig.get(env)
  if (!config) {
    throw new Error(`No margin trading config found for environment: ${env}`)
  }
  const args = [
    txb.object(config!.adminCap),
    txb.object(config!.globalConfig),
    txb.object(config!.markets),
    txb.pure.u64(params.maxLongLeverage),
    txb.pure.u64(params.maxShortLeverage),
    txb.pure.u64(params.openFeeRate),
    txb.pure.u64(params.closeFeeRate),
    txb.object(config!.versioned),
  ]

  txb.moveCall({
    target: `${MARGIN_TRADING_PUBLISHED_AT}::market::create_market`,
    typeArguments: [params.baseCoinType, params.quoteCoinType],
    arguments: args,
  })
}

export type UpdateMarketMaxLeverageParams = {
  marketId: string
  maxLongLeverage: number
  maxShortLeverage: number
}

export function updateMarketMaxLeverageMoveCall(
  txb: Transaction,
  env: string,
  params: UpdateMarketMaxLeverageParams
) {
  const config = marginTradingConfig.get(env)
  if (!config) {
    throw new Error(`No margin trading config found for environment: ${env}`)
  }
  const args = [
    txb.object(config!.adminCap),
    txb.object(params.marketId),
    txb.pure.u64(params.maxLongLeverage),
    txb.pure.u64(params.maxShortLeverage),
  ]

  txb.moveCall({
    target: `${MARGIN_TRADING_PUBLISHED_AT}::market::set_max_leverage`,
    typeArguments: [],
    arguments: args,
  })
}

export type UpdateMarketOpenFeeRateParams = {
  marketId: string
  openFeeRate: number
  closeFeeRate: number
}

export function updateMarketOpenFeeRateMoveCall(
  txb: Transaction,
  env: string,
  params: UpdateMarketOpenFeeRateParams
) {
  const config = marginTradingConfig.get(env)
  if (!config) {
    throw new Error(`No margin trading config found for environment: ${env}`)
  }
  const args = [
    txb.object(config!.adminCap),
    txb.object(params.marketId),
    txb.pure.u64(params.openFeeRate),
    txb.pure.u64(params.closeFeeRate),
  ]

  txb.moveCall({
    target: `${MARGIN_TRADING_PUBLISHED_AT}::market::set_fee_rate`,
    typeArguments: [],
    arguments: args,
  })
}

export function transferAdminCapMoveCall(
  txb: Transaction,
  env: string,
  address: string
) {
  const config = marginTradingConfig.get(env)
  if (!config) {
    throw new Error(`No margin trading config found for environment: ${env}`)
  }
  txb.transferObjects([txb.object(config!.adminCap)], txb.pure.address(address))
}

export function transferObjectMoveCall(
  txb: Transaction,
  env: string,
  object: string,
  address: string
) {
  const config = marginTradingConfig.get(env)
  if (!config) {
    throw new Error(`No margin trading config found for environment: ${env}`)
  }
  txb.transferObjects([txb.object(object)], txb.pure.address(address))
}
