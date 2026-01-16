import { useState, useEffect, useMemo } from 'react'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import type { CoinStruct } from '@mysten/sui/client'
import { useToast } from '../../components/Toast'

type VaultTab = 'balances' | 'deposit' | 'withdraw' | 'settings'

// Wallet addresses allowed to access Vault Manager
const ALLOWED_WALLETS: string[] = [
  '0x10e0cedcd78dc7d075f59744d2e161e22f1202d63f733d6f63f6325cba2ffdb7',
]

// Trusted coin types (official/verified coins)
const TRUSTED_COINS: Set<string> = new Set([
  '0x2::sui::SUI',
  '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
  '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN', // USDT
  '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', // wUSDC
  '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN', // wETH
  '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN', // wBTC
])

interface CoinBalance {
  coinType: string
  symbol: string
  totalBalance: bigint
  coinCount: number
  isTrusted: boolean
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

  // Check if current wallet is allowed to access Vault Manager
  const isWalletAllowed = useMemo(() => {
    if (!account?.address) return false
    const normalizedAddress = account.address.toLowerCase()
    return ALLOWED_WALLETS.some(
      (addr) => addr.toLowerCase() === normalizedAddress
    )
  }, [account?.address])

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
          const isTrusted = TRUSTED_COINS.has(coin.coinType)
          balanceMap.set(coin.coinType, {
            coinType: coin.coinType,
            symbol,
            totalBalance: BigInt(coin.balance),
            coinCount: 1,
            isTrusted,
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
  const unverifiedCount = balances.filter((b) => !b.isTrusted).length

  if (!account) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Vault Management</h1>
        <p className="text-gray-400">Connect your wallet to manage vault</p>
      </div>
    )
  }

  // Access denied for unauthorized wallets
  if (!isWalletAllowed) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Vault Management</h1>
        <div className="card max-w-md mx-auto">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">
            Your wallet is not authorized to access Vault Manager.
          </p>
          <p className="text-gray-500 text-sm font-mono break-all">
            Connected: {account.address}
          </p>
        </div>
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                <p className="text-gray-400 text-sm">Unverified</p>
                <p className={`text-2xl font-bold ${unverifiedCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {unverifiedCount}
                </p>
                <p className="text-gray-500 text-xs">tokens</p>
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

          {/* Unverified Tokens Warning */}
          {unverifiedCount > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-red-400 font-medium">Warning: Unverified Tokens Detected</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {unverifiedCount} token(s) in your wallet are not in the trusted list.
                    These may be fake tokens (scam coins). Exercise caution and verify before interacting.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Balance</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Objects</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium hidden md:table-cell">Coin Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((balance) => (
                      <tr
                        key={balance.coinType}
                        className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                          !balance.isTrusted ? 'bg-red-900/10' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              balance.isTrusted
                                ? 'bg-gradient-to-br from-sui-500 to-sui-700'
                                : 'bg-gradient-to-br from-red-500 to-red-700'
                            }`}>
                              {balance.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-white font-medium">{balance.symbol}</p>
                                {!balance.isTrusted && (
                                  <span className="text-xs text-red-400" title="Unverified token - may be fake">
                                    (Unverified)
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-500 text-xs md:hidden truncate max-w-[120px]">
                                {balance.coinType.split('::').slice(0, 2).join('::')}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {balance.isTrusted ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400" title="This token is not in the trusted list. Exercise caution.">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Caution
                            </span>
                          )}
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
