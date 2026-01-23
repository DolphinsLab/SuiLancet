import { useState } from 'react'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useToast } from '../../components/Toast'

type QueryAction = 'object' | 'transaction'

export default function Query() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const toast = useToast()
  const [action, setAction] = useState<QueryAction>('object')
  const [objectId, setObjectId] = useState('')
  const [txDigest, setTxDigest] = useState('')
  const [objectResult, setObjectResult] = useState<any>(null)
  const [txResult, setTxResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleInspectObject = async () => {
    if (!objectId.trim()) return

    setIsLoading(true)
    setObjectResult(null)

    try {
      const result = await client.getObject({
        id: objectId.trim(),
        options: { showContent: true, showType: true, showOwner: true, showDisplay: true },
      })

      if (!result.data) {
        toast.error('Not Found', 'Object does not exist or has been deleted')
        return
      }

      setObjectResult(result.data)
    } catch (err: any) {
      toast.error('Query Failed', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLookupTransaction = async () => {
    if (!txDigest.trim()) return

    setIsLoading(true)
    setTxResult(null)

    try {
      const result = await client.getTransactionBlock({
        digest: txDigest.trim(),
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showBalanceChanges: true,
          showObjectChanges: true,
        },
      })

      setTxResult(result)
    } catch (err: any) {
      toast.error('Query Failed', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!account) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Chain Query</h1>
        <p className="text-gray-400">Connect your wallet to query on-chain data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Chain Query</h1>

      {/* Action Tabs */}
      <div className="flex space-x-2">
        {(['object', 'transaction'] as QueryAction[]).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`px-4 py-2 rounded-lg capitalize ${
              action === a ? 'bg-sui-600 text-white' : 'bg-slate-700 text-gray-300'
            }`}
          >
            {a === 'object' ? 'Object Inspector' : 'Transaction Lookup'}
          </button>
        ))}
      </div>

      {action === 'object' && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-white">Inspect Object</h2>
          <p className="text-gray-400 text-sm">Look up any on-chain object by its ID.</p>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Object ID (0x...)"
              value={objectId}
              onChange={(e) => setObjectId(e.target.value)}
              className="input flex-1"
            />
            <button
              onClick={handleInspectObject}
              disabled={isLoading || !objectId.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Inspect'}
            </button>
          </div>

          {objectResult && (
            <div className="space-y-4">
              <div className="bg-slate-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Object ID</span>
                  <span className="text-white font-mono text-sm">{objectResult.objectId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type</span>
                  <span className="text-sui-400 font-mono text-sm break-all">
                    {objectResult.type || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Version</span>
                  <span className="text-white font-mono text-sm">{objectResult.version}</span>
                </div>
                {objectResult.owner && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Owner</span>
                    <span className="text-white font-mono text-sm">
                      {typeof objectResult.owner === 'object'
                        ? objectResult.owner.AddressOwner || objectResult.owner.Shared?.initial_shared_version || 'Immutable'
                        : objectResult.owner}
                    </span>
                  </div>
                )}
              </div>

              {objectResult.content && (
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Content</h3>
                  <pre className="text-xs text-gray-300 overflow-x-auto max-h-60">
                    {JSON.stringify(objectResult.content, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {action === 'transaction' && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-white">Transaction Lookup</h2>
          <p className="text-gray-400 text-sm">Look up a transaction by its digest.</p>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Transaction digest"
              value={txDigest}
              onChange={(e) => setTxDigest(e.target.value)}
              className="input flex-1"
            />
            <button
              onClick={handleLookupTransaction}
              disabled={isLoading || !txDigest.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Lookup'}
            </button>
          </div>

          {txResult && (
            <div className="space-y-4">
              {/* Status */}
              <div className={`bg-slate-700 rounded-lg p-4 border ${
                txResult.effects?.status?.status === 'success'
                  ? 'border-green-600'
                  : 'border-red-600'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-semibold capitalize ${
                    txResult.effects?.status?.status === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {txResult.effects?.status?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-gray-400">Digest</span>
                  <span className="text-white font-mono text-sm">{txResult.digest}</span>
                </div>
                {txResult.timestampMs && (
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-400">Time</span>
                    <span className="text-white text-sm">
                      {new Date(Number(txResult.timestampMs)).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Gas */}
              {txResult.effects?.gasUsed && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Gas Usage</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Computation</span>
                      <span className="text-white font-mono">{txResult.effects.gasUsed.computationCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Storage</span>
                      <span className="text-white font-mono">{txResult.effects.gasUsed.storageCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rebate</span>
                      <span className="text-white font-mono">{txResult.effects.gasUsed.storageRebate}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Balance Changes */}
              {txResult.balanceChanges && txResult.balanceChanges.length > 0 && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">
                    Balance Changes ({txResult.balanceChanges.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {txResult.balanceChanges.map((change: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-400 font-mono truncate max-w-[200px]">
                          {change.coinType.split('::').pop()}
                        </span>
                        <span className={`font-mono ${
                          Number(change.amount) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {Number(change.amount) >= 0 ? '+' : ''}{change.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {txResult.events && txResult.events.length > 0 && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">
                    Events ({txResult.events.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {txResult.events.map((event: any, i: number) => (
                      <div key={i} className="bg-slate-800 rounded p-2">
                        <div className="text-sui-400 text-xs font-mono mb-1">{event.type}</div>
                        <pre className="text-gray-300 text-xs overflow-x-auto">
                          {JSON.stringify(event.parsedJson, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
