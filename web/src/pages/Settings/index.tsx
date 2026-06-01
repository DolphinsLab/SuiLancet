import { useState } from 'react'
import { useCurrentAccount, useSuiClientContext } from '@mysten/dapp-kit'
import { useDolphinId } from '../../components/DolphinIdProvider'
import { useToast } from '../../components/Toast'

type Network = 'mainnet' | 'testnet' | 'devnet'

export default function Settings() {
  const { selectNetwork, network } = useSuiClientContext()
  const account = useCurrentAccount()
  const dolphinId = useDolphinId()
  const toast = useToast()
  const [rpcEndpoint, setRpcEndpoint] = useState('')

  const handleDolphinSignIn = async () => {
    try {
      await dolphinId.signIn()
      toast.success('Dolphin ID Connected')
    } catch (err: any) {
      toast.error('Dolphin ID Failed', err.message)
    }
  }

  const handleDolphinLogout = async () => {
    await dolphinId.logout()
    toast.info('Dolphin ID', 'Signed out')
  }

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

      {/* Dolphin ID */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Dolphin ID</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-6">
            <span className="text-gray-400">Status</span>
            <span className="text-white capitalize">{dolphinId.session ? 'signed in' : dolphinId.status}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-gray-400">Domain</span>
            <span className="text-white font-mono break-all text-right">{dolphinId.config.domain}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-gray-400">Nonce Endpoint</span>
            <span className="text-white font-mono break-all text-right">{dolphinId.config.nonceUrl}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-gray-400">Verify Endpoint</span>
            <span className="text-white font-mono break-all text-right">{dolphinId.config.verifyUrl}</span>
          </div>
          {dolphinId.session && (
            <>
              <div className="flex justify-between gap-6">
                <span className="text-gray-400">Subject</span>
                <span className="text-sui-400 font-mono break-all text-right">{dolphinId.session.subject}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-gray-400">Expires</span>
                <span className="text-white">{new Date(dolphinId.session.expiresAt).toLocaleString()}</span>
              </div>
            </>
          )}
          {dolphinId.error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300">
              {dolphinId.error}
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          {dolphinId.session ? (
            <button
              type="button"
              onClick={handleDolphinLogout}
              className="btn-secondary"
            >
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDolphinSignIn}
              disabled={!account || dolphinId.status === 'signing'}
              className="btn-primary disabled:opacity-50"
            >
              {dolphinId.status === 'signing' ? 'Signing...' : 'Sign In'}
            </button>
          )}
          <button
            type="button"
            onClick={() => void dolphinId.restore()}
            className="btn-secondary"
          >
            Refresh Session
          </button>
        </div>
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
