import { useState } from 'react'
import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

type TransactionInput = Parameters<ReturnType<typeof useSignAndExecuteTransaction>['mutate']>[0]

type CoinAction = 'merge' | 'split' | 'transfer' | 'destroy'

export default function Coin() {
  const account = useCurrentAccount()
  const [action, setAction] = useState<CoinAction>('merge')
  const [selectedCoinType, setSelectedCoinType] = useState<string>('')
  const [transferAddress, setTransferAddress] = useState('')
  const [splitAmount, setSplitAmount] = useState('')

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

    const txb = new Transaction()
    const [primaryCoin, ...otherCoins] = coinsOfType.map(c => c.coinObjectId)

    if (otherCoins.length > 0) {
      txb.mergeCoins(primaryCoin, otherCoins)
    }

    signAndExecute(
      { transaction: txb } as unknown as TransactionInput,
      {
        onSuccess: () => {
          alert('Coins merged successfully!')
          refetch()
        },
        onError: (err) => alert(`Error: ${err.message}`),
      }
    )
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
            </p>
            <button
              onClick={handleMergeCoins}
              disabled={isPending || !selectedCoinType}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isPending ? 'Processing...' : 'Merge Coins'}
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
