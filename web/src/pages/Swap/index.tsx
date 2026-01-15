import { useState } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'

type SwapProvider = 'cetus' | 'deepbook'

export default function Swap() {
  const account = useCurrentAccount()
  const [provider, setProvider] = useState<SwapProvider>('cetus')
  const [fromToken, setFromToken] = useState('SUI')
  const [toToken, setToToken] = useState('USDC')
  const [amount, setAmount] = useState('')

  if (!account) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">DEX Swap</h1>
        <p className="text-gray-400">Connect your wallet to swap tokens</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">DEX Swap</h1>

      {/* Provider Selection */}
      <div className="flex space-x-2">
        <button
          onClick={() => setProvider('cetus')}
          className={`px-6 py-3 rounded-lg font-medium ${
            provider === 'cetus'
              ? 'bg-sui-600 text-white'
              : 'bg-slate-700 text-gray-300'
          }`}
        >
          Cetus
        </button>
        <button
          onClick={() => setProvider('deepbook')}
          className={`px-6 py-3 rounded-lg font-medium ${
            provider === 'deepbook'
              ? 'bg-sui-600 text-white'
              : 'bg-slate-700 text-gray-300'
          }`}
        >
          DeepBook V3
        </button>
      </div>

      {/* Swap Card */}
      <div className="card max-w-lg">
        <h2 className="text-lg font-semibold text-white mb-6">
          Swap on {provider === 'cetus' ? 'Cetus' : 'DeepBook V3'}
        </h2>

        {/* From */}
        <div className="space-y-2 mb-4">
          <label className="text-gray-400 text-sm">From</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="input flex-1 text-xl"
            />
            <select
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
              className="input w-32"
            >
              <option value="SUI">SUI</option>
              <option value="USDC">USDC</option>
              <option value="DEEP">DEEP</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center my-4">
          <button
            onClick={() => {
              const temp = fromToken
              setFromToken(toToken)
              setToToken(temp)
            }}
            className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <span className="text-xl">⇅</span>
          </button>
        </div>

        {/* To */}
        <div className="space-y-2 mb-6">
          <label className="text-gray-400 text-sm">To</label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="0.0"
              disabled
              className="input flex-1 text-xl bg-slate-900"
            />
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="input w-32"
            >
              <option value="SUI">SUI</option>
              <option value="USDC">USDC</option>
              <option value="DEEP">DEEP</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <button
          disabled={!amount}
          className="btn-primary w-full py-4 text-lg disabled:opacity-50"
        >
          Swap
        </button>

        {/* Info */}
        <div className="mt-4 text-sm text-gray-400">
          <p>* Swap functionality coming soon</p>
          <p>* Will integrate with {provider === 'cetus' ? 'Cetus Protocol' : 'DeepBook V3'} SDK</p>
        </div>
      </div>
    </div>
  )
}
