import { SuiClient } from "@mysten/sui/client"
import { StakingPosition } from "../types"
import { LIQUID_STAKING, SUI_TYPE } from "../constants"

/**
 * Liquid Staking Token adapter.
 * Detects haSUI, afSUI, vSUI, mSUI balances in the wallet.
 * These represent staked SUI positions in various LST protocols.
 */
export async function fetchLiquidStakingPositions(
  client: SuiClient,
  walletAddress: string
): Promise<StakingPosition[]> {
  const positions: StakingPosition[] = []

  const allBalances = await client.getAllBalances({ owner: walletAddress })

  const lstConfigs = Object.values(LIQUID_STAKING)

  for (const balance of allBalances) {
    const lstConfig = lstConfigs.find(
      (lst) => normalizeCoinType(balance.coinType) === normalizeCoinType(lst.coinType)
    )

    if (lstConfig) {
      const amount = Number(balance.totalBalance)
      if (amount > 0) {
        positions.push({
          protocol: lstConfig.protocol,
          category: "staking",
          stakedToken: SUI_TYPE,
          receivedToken: lstConfig.coinType,
          symbol: lstConfig.symbol,
          amount,
          decimals: 9,
        })
      }
    }
  }

  // Also check for native SUI staking (StakedSui objects)
  const nativeStaking = await fetchNativeStaking(client, walletAddress)
  positions.push(...nativeStaking)

  return positions
}

/**
 * Fetch native SUI staking positions (StakedSui objects).
 */
async function fetchNativeStaking(
  client: SuiClient,
  walletAddress: string
): Promise<StakingPosition[]> {
  const positions: StakingPosition[] = []

  try {
    const stakes = await client.getStakes({ owner: walletAddress })

    for (const validatorStake of stakes) {
      for (const stake of validatorStake.stakes) {
        const amount = Number(stake.principal)
        if (amount > 0) {
          positions.push({
            protocol: "Sui Native Staking",
            category: "staking",
            objectId: stake.stakedSuiId,
            stakedToken: SUI_TYPE,
            receivedToken: SUI_TYPE,
            symbol: "SUI",
            amount,
            decimals: 9,
          })
        }
      }
    }
  } catch {
    // Native staking query may fail on testnet
  }

  return positions
}

function normalizeCoinType(coinType: string): string {
  // Normalize 0x2 -> full address format
  return coinType
    .replace(
      /^0x2::/,
      "0x0000000000000000000000000000000000000000000000000000000000000002::"
    )
    .toLowerCase()
}
