import { useState } from 'react'
import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

type TransactionInput = Parameters<ReturnType<typeof useSignAndExecuteTransaction>['mutate']>[0]

type CoinAction = 'merge' | 'split' | 'transfer' | 'destroy'

// Maximum coins that can be merged in a single transaction (1 primary + 2047 others)
const MAX_MERGE_PER_TX = 2047

export default function Coin() {
  const account = useCurrentAccount()
  const [action, setAction] = useState<CoinAction>('merge')
  const [selectedCoinType, setSelectedCoinType] = useState<string>('')
  const [transferAddress, setTransferAddress] = useState('')
  const [splitAmount, setSplitAmount] = useState('')
  const [mergeProgress, setMergeProgress] = useState<{ current: number; total: number } | null>(null)

  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()

  const { data: coins, refetch } = useSuiClientQuery(
    'getAllCoins',
    { owner: account?.address ?? '' },
    { enabled: !!account }
  )

  const handleMergeCoins = async () => {
    if (!account || !selectedCoinType) return

    const coinsOfType = coins?.data.filter(c => c.coinType === selectedCoinType) || []
    if (coinsOfType.length < 2) {
      alert('Need at least 2 coins to merge')
      return
    }

    const coinIds = coinsOfType.map(c => c.coinObjectId)
    const [primaryCoin, ...otherCoins] = coinIds

    // If within single transaction limit, merge all at once
    if (otherCoins.length <= MAX_MERGE_PER_TX) {
      const txb = new Transaction()
      txb.mergeCoins(primaryCoin, otherCoins)

      signAndExecute(
        { transaction: txb } as unknown as TransactionInput,
        {
          onSuccess: () => {
            alert(`Successfully merged ${coinsOfType.length} coins into one!`)
            refetch()
          },
          onError: (err) => alert(`Error: ${err.message}`),
        }
      )
    } else {
      // Batch merge for large coin sets
      const totalBatches = Math.ceil(otherCoins.length / MAX_MERGE_PER_TX)
      setMergeProgress({ current: 0, total: totalBatches })

      // Create batches of coins to merge
      const batches: string[][] = []
      for (let i = 0; i < otherCoins.length; i += MAX_MERGE_PER_TX) {
        batches.push(otherCoins.slice(i, i + MAX_MERGE_PER_TX))
      }

      // Execute first batch
      const txb = new Transaction()
      txb.mergeCoins(primaryCoin, batches[0])

      signAndExecute(
        { transaction: txb } as unknown as TransactionInput,
        {
          onSuccess: () => {
            setMergeProgress({ current: 1, total: totalBatches })
            if (totalBatches > 1) {
              alert(`Batch 1/${totalBatches} completed. Please continue merging remaining coins.`)
            } else {
              alert(`Successfully merged ${coinsOfType.length} coins into one!`)
              setMergeProgress(null)
            }
            refetch()
          },
          onError: (err) => {
            setMergeProgress(null)
            alert(`Error: ${err.message}`)
          },
        }
      )
    }
  }

  const handleTransfer = async () => {
    if (!account || !selectedCoinType || !transferAddress) return

    const coinsOfType = coins?.data.filter(c => c.coinType === selectedCoinType) || []
    if (coinsOfType.length === 0) {
      alert('No coins to transfer')
      return
    }

    const txb = new Transaction()
    txb.transferObjects(
      coinsOfType.map(c => txb.object(c.coinObjectId)),
      transferAddress
    )

    signAndExecute(
      { transaction: txb } as unknown as TransactionInput,
      {
        onSuccess: () => {
          alert('Transfer successful!')
          refetch()
        },
        onError: (err) => alert(`Error: ${err.message}`),
      }
    )
  }

  if (!account) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Coin Management</h1>
        <p className="text-gray-400">Connect your wallet to manage coins</p>
      </div>
    )
  }

  // Group coins by type
  const coinsByType = coins?.data.reduce((acc, coin) => {
    if (!acc[coin.coinType]) {
      acc[coin.coinType] = []
    }
    acc[coin.coinType].push(coin)
    return acc
  }, {} as Record<string, typeof coins.data>) || {}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Coin Management</h1>

      {/* Action Tabs */}
      <div className="flex space-x-2">
        {(['merge', 'split', 'transfer', 'destroy'] as CoinAction[]).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`px-4 py-2 rounded-lg capitalize ${
              action === a ? 'bg-sui-600 text-white' : 'bg-slate-700 text-gray-300'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Coin Type Selector */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Select Coin Type</h2>
        <select
          value={selectedCoinType}
          onChange={(e) => setSelectedCoinType(e.target.value)}
          className="input w-full"
        >
          <option value="">Select a coin type...</option>
          {Object.keys(coinsByType).map((coinType) => (
            <option key={coinType} value={coinType}>
              {coinType.split('::').pop()} ({coinsByType[coinType].length} coins)
            </option>
          ))}
        </select>
      </div>

      {/* Action Panel */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 capitalize">{action} Coins</h2>

        {action === 'merge' && (
          <div className="space-y-4">
            <p className="text-gray-400">
              Merge all coins of the selected type into one.
              {selectedCoinType && coinsByType[selectedCoinType] && (
                <span className="block mt-2 text-sm">
                  {coinsByType[selectedCoinType].length > MAX_MERGE_PER_TX + 1 ? (
                    <span className="text-yellow-400">
                      {coinsByType[selectedCoinType].length} coins detected. Will require {Math.ceil((coinsByType[selectedCoinType].length - 1) / MAX_MERGE_PER_TX)} transactions (max {MAX_MERGE_PER_TX + 1} per tx).
                    </span>
                  ) : (
                    <span className="text-green-400">
                      {coinsByType[selectedCoinType].length} coins can be merged in a single transaction.
                    </span>
                  )}
                </span>
              )}
            </p>
            {mergeProgress && (
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Merge Progress</span>
                  <span className="text-white">{mergeProgress.current}/{mergeProgress.total} batches</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-sui-500 h-2 rounded-full transition-all"
                    style={{ width: `${(mergeProgress.current / mergeProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <button
              onClick={handleMergeCoins}
              disabled={isPending || !selectedCoinType}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isPending ? 'Processing...' : mergeProgress ? 'Continue Merge' : 'Merge Coins'}
            </button>
          </div>
        )}

        {action === 'transfer' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Recipient address (0x...)"
              value={transferAddress}
              onChange={(e) => setTransferAddress(e.target.value)}
              className="input w-full"
            />
            <button
              onClick={handleTransfer}
              disabled={isPending || !selectedCoinType || !transferAddress}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isPending ? 'Processing...' : 'Transfer All'}
            </button>
          </div>
        )}

        {action === 'split' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Amount to split (in smallest unit)"
              value={splitAmount}
              onChange={(e) => setSplitAmount(e.target.value)}
              className="input w-full"
            />
            <button
              disabled={isPending || !selectedCoinType || !splitAmount}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isPending ? 'Processing...' : 'Split Coin'}
            </button>
          </div>
        )}

        {action === 'destroy' && (
          <div className="space-y-4">
            <p className="text-gray-400">
              Destroy all zero-balance coins of the selected type.
            </p>
            <button
              disabled={isPending || !selectedCoinType}
              className="btn-primary w-full disabled:opacity-50 bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Processing...' : 'Destroy Zero Coins'}
            </button>
          </div>
        )}
      </div>

      {/* Coins List */}
      {selectedCoinType && coinsByType[selectedCoinType] && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">
            Coins ({coinsByType[selectedCoinType].length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {coinsByType[selectedCoinType].map((coin) => (
              <div
                key={coin.coinObjectId}
                className="flex justify-between items-center py-2 px-3 bg-slate-700 rounded-lg"
              >
                <span className="font-mono text-sm text-gray-300">
                  {coin.coinObjectId.slice(0, 10)}...{coin.coinObjectId.slice(-6)}
                </span>
                <span className="text-white">
                  {(Number(coin.balance) / 1e9).toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
