import { SuiClient } from "@mysten/sui/client"

const SUI_TYPE =
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"

export interface TokenPrice {
  coinType: string
  priceUsd: number | null
}

/**
 * Fetch SUI price from Sui RPC reference gas price as a baseline.
 * For production use, integrate CoinGecko/DexScreener API.
 */
export async function fetchSuiPrice(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
    )
    if (!res.ok) return 0
    const data = (await res.json()) as { pairs?: { priceUsd?: string }[] }
    const pair = data.pairs?.[0]
    return pair?.priceUsd ? parseFloat(pair.priceUsd) : 0
  } catch {
    return 0
  }
}

/**
 * Fetch token prices for a list of coin types.
 * Returns a map of coinType -> USD price.
 * Tokens without price data will have null value.
 */
export async function fetchTokenPrices(
  coinTypes: string[]
): Promise<Map<string, number | null>> {
  const prices = new Map<string, number | null>()

  // Get SUI price as baseline
  const suiPrice = await fetchSuiPrice()
  prices.set(SUI_TYPE, suiPrice || null)

  // For non-SUI tokens, try DexScreener batch lookup
  const nonSuiTypes = coinTypes.filter((t) => t !== SUI_TYPE)

  for (const coinType of nonSuiTypes) {
    try {
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${coinType}`
      )
      if (!res.ok) {
        prices.set(coinType, null)
        continue
      }
      const data = (await res.json()) as { pairs?: { priceUsd?: string }[] }
      const pair = data.pairs?.[0]
      prices.set(coinType, pair?.priceUsd ? parseFloat(pair.priceUsd) : null)
    } catch {
      prices.set(coinType, null)
    }
  }

  return prices
}

/**
 * Get decimals for a coin type from on-chain metadata.
 */
export async function getCoinDecimals(
  client: SuiClient,
  coinType: string
): Promise<number> {
  try {
    const metadata = await client.getCoinMetadata({ coinType })
    return metadata?.decimals ?? 9
  } catch {
    return 9
  }
}
