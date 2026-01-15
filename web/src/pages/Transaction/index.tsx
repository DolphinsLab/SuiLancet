import { useState } from 'react'
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

type TransactionInput = Parameters<ReturnType<typeof useSignAndExecuteTransaction>['mutate']>[0]

export default function TransactionPage() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const [txBase64, setTxBase64] = useState('')
  const [simulationResult, setSimulationResult] = useState<any>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()

  const handleSimulate = async () => {
    if (!account || !txBase64.trim()) return

    setIsSimulating(true)
    setError(null)
    setSimulationResult(null)

    try {
      // Decode Base64 and simulate
      const result = await client.dryRunTransactionBlock({
        transactionBlock: txBase64,
      })

      setSimulationResult(result)
    } catch (err: any) {
      setError(err.message || 'Simulation failed')
    } finally {
      setIsSimulating(false)
    }
  }

  const handleExecute = async () => {
    if (!account || !txBase64.trim()) return

    try {
      const tx = Transaction.from(txBase64)

      signAndExecute(
        { transaction: tx } as unknown as TransactionInput,
        {
          onSuccess: (result) => {
            alert(`Transaction executed! Digest: ${result.digest}`)
            setTxBase64('')
            setSimulationResult(null)
          },
          onError: (err) => {
            setError(err.message)
          },
        }
      )
    } catch (err: any) {
      setError(err.message || 'Failed to execute transaction')
    }
  }

  if (!account) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Transaction Simulator</h1>
        <p className="text-gray-400">Connect your wallet to simulate and sign transactions</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Transaction Simulator</h1>

      {/* Input */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Transaction Data (Base64)</h2>
        <textarea
          value={txBase64}
          onChange={(e) => setTxBase64(e.target.value)}
          placeholder="Paste Base64 encoded TransactionData here..."
          className="input w-full h-40 font-mono text-sm resize-none"
        />
        <div className="flex space-x-4 mt-4">
          <button
            onClick={handleSimulate}
            disabled={isSimulating || !txBase64.trim()}
            className="btn-secondary flex-1 disabled:opacity-50"
          >
            {isSimulating ? 'Simulating...' : 'Simulate'}
          </button>
          <button
            onClick={handleExecute}
            disabled={isPending || !txBase64.trim()}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {isPending ? 'Executing...' : 'Sign & Execute'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card bg-red-900/50 border border-red-500">
          <h3 className="text-red-400 font-semibold mb-2">Error</h3>
          <p className="text-red-300 font-mono text-sm">{error}</p>
        </div>
      )}

      {/* Simulation Result */}
      {simulationResult && (
        <div className="space-y-4">
          {/* Status */}
          <div className={`card ${
            simulationResult.effects?.status?.status === 'success'
              ? 'bg-green-900/30 border border-green-500'
              : 'bg-red-900/30 border border-red-500'
          }`}>
            <h3 className="text-lg font-semibold text-white mb-2">Simulation Result</h3>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl ${
                simulationResult.effects?.status?.status === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {simulationResult.effects?.status?.status === 'success' ? '✓' : '✗'}
              </span>
              <span className="text-white capitalize">
                {simulationResult.effects?.status?.status || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Gas Used */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Gas Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Computation Cost</span>
                <span className="text-white font-mono">
                  {simulationResult.effects?.gasUsed?.computationCost || '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Storage Cost</span>
                <span className="text-white font-mono">
                  {simulationResult.effects?.gasUsed?.storageCost || '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Storage Rebate</span>
                <span className="text-white font-mono">
                  {simulationResult.effects?.gasUsed?.storageRebate || '0'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-600 pt-2 mt-2">
                <span className="text-gray-300 font-semibold">Total Gas</span>
                <span className="text-sui-400 font-mono font-semibold">
                  {(
                    Number(simulationResult.effects?.gasUsed?.computationCost || 0) +
                    Number(simulationResult.effects?.gasUsed?.storageCost || 0) -
                    Number(simulationResult.effects?.gasUsed?.storageRebate || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Events */}
          {simulationResult.events && simulationResult.events.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">
                Events ({simulationResult.events.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {simulationResult.events.map((event: any, index: number) => (
                  <div key={index} className="bg-slate-700 rounded-lg p-3">
                    <div className="text-sui-400 text-sm font-mono mb-1">
                      {event.type}
                    </div>
                    <pre className="text-gray-300 text-xs overflow-x-auto">
                      {JSON.stringify(event.parsedJson, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Result */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Raw Result</h3>
            <pre className="bg-slate-900 p-4 rounded-lg text-xs text-gray-300 overflow-x-auto max-h-60">
              {JSON.stringify(simulationResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
