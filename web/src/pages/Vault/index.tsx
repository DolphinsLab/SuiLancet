import { useState, useEffect } from 'react'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import type { CoinStruct } from '@mysten/sui/client'
import { useToast } from '../../components/Toast'

type VaultTab = 'balances' | 'deposit' | 'withdraw' | 'settings'

interface CoinBalance {
  coinType: string
  symbol: string
  totalBalance: bigint
  coinCount: number
}

interface VaultConfig {
  contractAddress: string
  vaultObject: string
  customRpcEndpoint: string
}

const DEFAULT_CONFIG: VaultConfig = {
  contractAddress: '',
  vaultObject: '',
  customRpcEndpoint: '',
}

const STORAGE_KEY = 'suilancet_vault_config'

export default function Vault() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<VaultTab>('balances')
  const [coinType, setCoinType] = useState('')
  const [amount, setAmount] = useState('')
  const [balances, setBalances] = useState<CoinBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Vault configuration
  const [config, setConfig] = useState<VaultConfig>(DEFAULT_CONFIG)
  const [isEditing, setIsEditing] = useState(false)
  const [tempConfig, setTempConfig] = useState<VaultConfig>(DEFAULT_CONFIG)

  // Load config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConfig(parsed)
        setTempConfig(parsed)
      } catch (e) {
        console.error('Failed to parse vault config:', e)
      }
    }
  }, [])

  // Save config to localStorage
  const saveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tempConfig))
    setConfig(tempConfig)
    setIsEditing(false)
    toast.success('Settings Saved', 'Vault configuration has been updated')
  }

  const cancelEdit = () => {
    setTempConfig(config)
    setIsEditing(false)
  }

  // Fetch all coin balances
  const fetchBalances = async () => {
    if (!account?.address) return

    setIsLoading(true)
    const allCoins: CoinStruct[] = []
    let cursor: string | null | undefined = null

    try {
      // Fetch all coins with pagination
      do {
        const response = await client.getAllCoins({
          owner: account.address,
          cursor: cursor,
          limit: 50,
        })
        allCoins.push(...response.data)
        cursor = response.hasNextPage ? response.nextCursor : null
      } while (cursor)

      // Group coins by type and calculate totals
      const balanceMap = new Map<string, CoinBalance>()

      for (const coin of allCoins) {
        const existing = balanceMap.get(coin.coinType)
        if (existing) {
          existing.totalBalance += BigInt(coin.balance)
          existing.coinCount += 1
        } else {
          const symbol = coin.coinType.split('::').pop() || 'Unknown'
          balanceMap.set(coin.coinType, {
            coinType: coin.coinType,
            symbol,
            totalBalance: BigInt(coin.balance),
            coinCount: 1,
          })
        }
      }

      // Sort by balance (descending)
      const sortedBalances = Array.from(balanceMap.values()).sort((a, b) =>
        Number(b.totalBalance - a.totalBalance)
      )

      setBalances(sortedBalances)
    } catch (error) {
      console.error('Error fetching balances:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBalances()
  }, [account?.address])

  // Format balance with proper decimals
  const formatBalance = (balance: bigint, decimals: number = 9): string => {
    const divisor = BigInt(10 ** decimals)
    const integerPart = balance / divisor
    const fractionalPart = balance % divisor
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0')

    // Trim trailing zeros but keep at least 2 decimal places
    let trimmed = fractionalStr.replace(/0+$/, '')
    if (trimmed.length < 2) trimmed = fractionalStr.slice(0, 4)

    return `${integerPart.toLocaleString()}.${trimmed || '00'}`
  }

  // Calculate total value (simplified - just show SUI equivalent placeholder)
  const totalCoins = balances.reduce((sum, b) => sum + b.coinCount, 0)

  if (!account) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Vault Management</h1>
        <p className="text-gray-400">Connect your wallet to manage vault</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Vault Management</h1>
        <button
          onClick={fetchBalances}
          disabled={isLoading}
          className="px-3 py-1 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeTab === 'balances'
              ? 'bg-sui-600 text-white'
              : 'bg-slate-700 text-gray-300'
          }`}
        >
          Balances
        </button>
        <button
          onClick={() => setActiveTab('deposit')}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeTab === 'deposit'
              ? 'bg-sui-600 text-white'
              : 'bg-slate-700 text-gray-300'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeTab === 'withdraw'
              ? 'bg-sui-600 text-white'
              : 'bg-slate-700 text-gray-300'
          }`}
        >
          Withdraw
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeTab === 'settings'
              ? 'bg-sui-600 text-white'
              : 'bg-slate-700 text-gray-300'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Total Assets</p>
                <p className="text-2xl font-bold text-white">{balances.length}</p>
                <p className="text-gray-500 text-xs">coin types</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Coins</p>
                <p className="text-2xl font-bold text-white">{totalCoins.toLocaleString()}</p>
                <p className="text-gray-500 text-xs">objects</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Wallet</p>
                <p className="text-sm font-mono text-white truncate">
                  {account.address.slice(0, 8)}...{account.address.slice(-6)}
                </p>
                <p className="text-gray-500 text-xs">connected</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Network</p>
                <p className="text-2xl font-bold text-green-400">Live</p>
                <p className="text-gray-500 text-xs">mainnet</p>
              </div>
            </div>
          </div>

          {/* Balances Table */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">All Coin Balances</h2>

            {isLoading ? (
              <div className="text-center py-8 text-gray-400">
                <div className="animate-spin inline-block w-8 h-8 border-2 border-gray-600 border-t-sui-500 rounded-full mb-2"></div>
                <p>Loading balances...</p>
              </div>
            ) : balances.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No coins found in wallet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Token</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Balance</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Objects</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium hidden md:table-cell">Coin Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((balance) => (
                      <tr
                        key={balance.coinType}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sui-500 to-sui-700 flex items-center justify-center text-white font-bold text-sm">
                              {balance.symbol.charAt(0)}
                            </div>
                            <div>
                              <p className="text-white font-medium">{balance.symbol}</p>
                              <p className="text-gray-500 text-xs md:hidden truncate max-w-[120px]">
                                {balance.coinType.split('::').slice(0, 2).join('::')}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="text-white font-mono">
                            {formatBalance(balance.totalBalance)}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            balance.coinCount > 10
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-600 text-gray-300'
                          }`}>
                            {balance.coinCount}
                          </span>
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          <p className="text-gray-400 font-mono text-xs truncate max-w-[300px]" title={balance.coinType}>
                            {balance.coinType}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <div className="card max-w-lg">
          <h2 className="text-lg font-semibold text-white mb-6">Deposit to Vault</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Coin Type</label>
              <input
                type="text"
                value={coinType}
                onChange={(e) => setCoinType(e.target.value)}
                placeholder="0x2::sui::SUI"
                className="input w-full font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Amount</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="input w-full text-xl"
              />
            </div>

            <button
              disabled={!coinType || !amount}
              className="btn-primary w-full py-4 text-lg disabled:opacity-50"
            >
              Deposit
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <p>* Vault functionality coming soon</p>
          </div>
        </div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <div className="card max-w-lg">
          <h2 className="text-lg font-semibold text-white mb-6">Withdraw from Vault</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Coin Type</label>
              <input
                type="text"
                value={coinType}
                onChange={(e) => setCoinType(e.target.value)}
                placeholder="0x2::sui::SUI"
                className="input w-full font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Amount</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="input w-full text-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Target Address</label>
              <input
                type="text"
                placeholder="0x..."
                className="input w-full font-mono text-sm"
              />
            </div>

            <button
              disabled={!coinType || !amount}
              className="btn-primary w-full py-4 text-lg disabled:opacity-50"
            >
              Withdraw
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <p>* Vault functionality coming soon</p>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">Vault Configuration</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveConfig}
                    className="px-4 py-2 bg-sui-600 text-white rounded-lg hover:bg-sui-700"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-gray-400 text-sm">Contract Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempConfig.contractAddress}
                    onChange={(e) => setTempConfig({ ...tempConfig, contractAddress: e.target.value })}
                    placeholder="0x..."
                    className="input w-full font-mono text-sm"
                  />
                ) : (
                  <p className="font-mono text-gray-300 text-sm bg-slate-700 px-4 py-2 rounded-lg">
                    {config.contractAddress || <span className="text-gray-500">Not configured</span>}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 text-sm">Vault Object ID</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempConfig.vaultObject}
                    onChange={(e) => setTempConfig({ ...tempConfig, vaultObject: e.target.value })}
                    placeholder="0x..."
                    className="input w-full font-mono text-sm"
                  />
                ) : (
                  <p className="font-mono text-gray-300 text-sm bg-slate-700 px-4 py-2 rounded-lg">
                    {config.vaultObject || <span className="text-gray-500">Not configured</span>}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-6">Network Settings</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-gray-400 text-sm">Custom RPC Endpoint</label>
                <p className="text-gray-500 text-xs">Leave empty to use default Sui RPC</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempConfig.customRpcEndpoint}
                    onChange={(e) => setTempConfig({ ...tempConfig, customRpcEndpoint: e.target.value })}
                    placeholder="https://fullnode.mainnet.sui.io:443"
                    className="input w-full font-mono text-sm"
                  />
                ) : (
                  <p className="font-mono text-gray-300 text-sm bg-slate-700 px-4 py-2 rounded-lg">
                    {config.customRpcEndpoint || <span className="text-gray-500">Using default RPC</span>}
                  </p>
                )}
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 text-sm">
                <p className="text-gray-400 mb-2">Common RPC Endpoints:</p>
                <ul className="space-y-1 text-gray-500 font-mono text-xs">
                  <li>• https://fullnode.mainnet.sui.io:443 (Mainnet)</li>
                  <li>• https://fullnode.testnet.sui.io:443 (Testnet)</li>
                  <li>• https://fullnode.devnet.sui.io:443 (Devnet)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vault Info Summary (shown on all tabs except settings) */}
      {activeTab !== 'settings' && (config.contractAddress || config.vaultObject) && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Vault Info</h2>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-sui-400 text-sm hover:text-sui-300"
            >
              Edit
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {config.contractAddress && (
              <div className="flex justify-between">
                <span className="text-gray-400">Contract Address</span>
                <span className="font-mono text-gray-300 truncate max-w-[200px]" title={config.contractAddress}>
                  {config.contractAddress.slice(0, 8)}...{config.contractAddress.slice(-6)}
                </span>
              </div>
            )}
            {config.vaultObject && (
              <div className="flex justify-between">
                <span className="text-gray-400">Vault Object</span>
                <span className="font-mono text-gray-300 truncate max-w-[200px]" title={config.vaultObject}>
                  {config.vaultObject.slice(0, 8)}...{config.vaultObject.slice(-6)}
                </span>
              </div>
            )}
            {config.customRpcEndpoint && (
              <div className="flex justify-between">
                <span className="text-gray-400">Custom RPC</span>
                <span className="font-mono text-green-400 text-xs">Connected</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
