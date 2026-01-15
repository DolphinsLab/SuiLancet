import { useState } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'

type VaultAction = 'deposit' | 'withdraw'

export default function Vault() {
  const account = useCurrentAccount()
  const [action, setAction] = useState<VaultAction>('deposit')
  const [coinType, setCoinType] = useState('')
  const [amount, setAmount] = useState('')

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
      <h1 className="text-2xl font-bold text-white">Vault Management</h1>

      {/* Action Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setAction('deposit')}
          className={`px-6 py-3 rounded-lg font-medium ${
            action === 'deposit'
              ? 'bg-sui-600 text-white'
              : 'bg-slate-700 text-gray-300'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setAction('withdraw')}
          className={`px-6 py-3 rounded-lg font-medium ${
            action === 'withdraw'
              ? 'bg-sui-600 text-white'
              : 'bg-slate-700 text-gray-300'
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Vault Card */}
      <div className="card max-w-lg">
        <h2 className="text-lg font-semibold text-white mb-6 capitalize">
          {action} to Vault
        </h2>

        <div className="space-y-4">
          {/* Coin Type */}
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

          {/* Amount */}
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

          {action === 'withdraw' && (
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Target Address</label>
              <input
                type="text"
                placeholder="0x..."
                className="input w-full font-mono text-sm"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            disabled={!coinType || !amount}
            className="btn-primary w-full py-4 text-lg disabled:opacity-50 capitalize"
          >
            {action}
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 text-sm text-gray-400">
          <p>* Vault functionality coming soon</p>
          <p>* Will integrate with SuiLancet Vault contract</p>
        </div>
      </div>

      {/* Vault Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Vault Info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Contract Address</span>
            <span className="font-mono text-gray-300">
              0x9ef0...bdae
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Vault Object</span>
            <span className="font-mono text-gray-300">
              0x22e8...0f7d
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
