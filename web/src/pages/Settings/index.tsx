import { useState } from 'react'
import { useSuiClientContext } from '@mysten/dapp-kit'

type Network = 'mainnet' | 'testnet' | 'devnet'

export default function Settings() {
  const { selectNetwork, network } = useSuiClientContext()
  const [rpcEndpoint, setRpcEndpoint] = useState('')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Network Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Network</h2>
        <div className="flex space-x-2">
          {(['mainnet', 'testnet', 'devnet'] as Network[]).map((net) => (
            <button
              key={net}
              onClick={() => selectNetwork(net)}
              className={`px-6 py-3 rounded-lg font-medium capitalize ${
                network === net
                  ? 'bg-sui-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {net}
            </button>
          ))}
        </div>
        <p className="text-gray-400 text-sm mt-4">
          Current network: <span className="text-sui-400 capitalize">{network}</span>
        </p>
      </div>

      {/* Custom RPC */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Custom RPC Endpoint</h2>
        <div className="space-y-4">
          <input
            type="text"
            value={rpcEndpoint}
            onChange={(e) => setRpcEndpoint(e.target.value)}
            placeholder="https://..."
            className="input w-full"
          />
          <button
            disabled={!rpcEndpoint}
            className="btn-secondary disabled:opacity-50"
          >
            Set Custom RPC
          </button>
        </div>
        <p className="text-gray-400 text-sm mt-4">
          * Custom RPC support coming soon
        </p>
      </div>

      {/* About */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">About</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Version</span>
            <span className="text-white">0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">SDK Version</span>
            <span className="text-white">@mysten/sui ^1.6.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">GitHub</span>
            <a
              href="https://github.com/DolphinsLab/SuiLancet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sui-400 hover:underline"
            >
              DolphinsLab/SuiLancet
            </a>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border border-red-500/50">
        <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
        <div className="space-y-4">
          <button className="btn-secondary bg-red-900/50 hover:bg-red-800 text-red-300 w-full">
            Clear Local Storage
          </button>
          <button className="btn-secondary bg-red-900/50 hover:bg-red-800 text-red-300 w-full">
            Disconnect All Wallets
          </button>
        </div>
      </div>
    </div>
  )
}
