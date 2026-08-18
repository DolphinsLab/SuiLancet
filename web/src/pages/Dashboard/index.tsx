import { useQuery } from '@tanstack/react-query'
import {
  useCurrentAccount,
  useCurrentClient,
  useCurrentNetwork,
} from '@mysten/dapp-kit-react'
import { listAllBalances } from '../../lib/balances'

export default function Dashboard() {
  const account = useCurrentAccount()
  const client = useCurrentClient()
  const network = useCurrentNetwork()

  const { data: balance, isLoading } = useQuery({
    queryKey: ['balance', network, account?.address],
    queryFn: async () =>
      (
        await client.core.getBalance({
          owner: account!.address,
        })
      ).balance,
    enabled: !!account,
  })

  const { data: allBalances } = useQuery({
    queryKey: ['balances', network, account?.address],
    queryFn: async () => listAllBalances(client, account!.address),
    enabled: !!account,
  })

  if (!account) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-white mb-4">Welcome to SuiLancet</h1>
        <p className="text-gray-400 mb-8">Connect your wallet to get started</p>
        <div className="card max-w-md mx-auto">
          <p className="text-gray-300">
            SuiLancet is your Sui on-chain utility toolkit — cleanup dust coins, batch transfer assets, scan wallet security, and query chain data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Wallet Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Wallet Info</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Address</span>
            <span className="font-mono text-white">{account.address}</span>
          </div>
        </div>
      </div>

      {/* SUI Balance */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">SUI Balance</h2>
        {isLoading ? (
          <div className="text-gray-400">Loading...</div>
        ) : (
          <div className="text-3xl font-bold text-sui-400">
            {balance ? (Number(balance.balance) / 1e9).toFixed(4) : '0'} SUI
          </div>
        )}
      </div>

      {/* All Balances */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">All Tokens</h2>
        {allBalances && allBalances.length > 0 ? (
          <div className="space-y-3">
            {allBalances.map((token, index) => {
              const coinType = token.coinType.split('::').pop() || token.coinType
              const balance = Number(token.balance) / 1e9
              return (
                <div key={index} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                  <span className="text-gray-300">{coinType}</span>
                  <span className="text-white font-mono">{balance.toFixed(4)}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-gray-400">No tokens found</div>
        )}
      </div>
    </div>
  )
}
