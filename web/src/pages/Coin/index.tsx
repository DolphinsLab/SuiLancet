import { useState, useEffect } from 'react'
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import type { CoinStruct } from '@mysten/sui/client'

type TransactionInput = Parameters<ReturnType<typeof useSignAndExecuteTransaction>['mutate']>[0]

type CoinAction = 'merge' | 'split' | 'transfer' | 'destroy'

// Maximum coins that can be merged in a single transaction (1 primary + 2047 others)
const MAX_MERGE_PER_TX = 2047
// Maximum coins to fetch (matches max merge capability)
const MAX_COINS_FETCH = 2048
// Maximum coins to split in a single transaction (Sui limit: 512 arguments per command)
const MAX_SPLIT_PER_TX = 256

export default function Coin() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const [action, setAction] = useState<CoinAction>('merge')
  const [selectedCoinType, setSelectedCoinType] = useState<string>('')
  const [transferAddress, setTransferAddress] = useState('')
  const [splitAmount, setSplitAmount] = useState('')
  const [splitCount, setSplitCount] = useState('')
  const [mergeProgress, setMergeProgress] = useState<{ current: number; total: number } | null>(null)
  const [coins, setCoins] = useState<CoinStruct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()

  // Fetch coins with pagination (max 2048)
  const fetchAllCoins = async () => {
    if (!account?.address) return

    setIsLoading(true)
    const allCoins: CoinStruct[] = []
    let cursor: string | null | undefined = null

    try {
      do {
        const response = await client.getAllCoins({
          owner: account.address,
          cursor: cursor,
          limit: 50,
        })
        allCoins.push(...response.data)
        cursor = response.hasNextPage ? response.nextCursor : null

        // Stop if we've reached the max
        if (allCoins.length >= MAX_COINS_FETCH) {
          setHasMore(!!cursor)
          break
        }
      } while (cursor)

      setCoins(allCoins.slice(0, MAX_COINS_FETCH))
      if (allCoins.length < MAX_COINS_FETCH) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error fetching coins:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = fetchAllCoins

  useEffect(() => {
    fetchAllCoins()
  }, [account?.address])

  const handleMergeCoins = async () => {
    if (!account || !selectedCoinType) return

    const coinsOfType = coins.filter(c => c.coinType === selectedCoinType)
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

    const coinsOfType = coins.filter(c => c.coinType === selectedCoinType)
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

  const handleSplitCoins = async () => {
    if (!account || !selectedCoinType || !splitAmount || !splitCount) return

    const amount = BigInt(splitAmount)
    const count = parseInt(splitCount, 10)

    if (count <= 0 || count > MAX_SPLIT_PER_TX) {
      alert(`Count must be between 1 and ${MAX_SPLIT_PER_TX}`)
      return
    }

    const totalRequired = amount * BigInt(count)
    const coinsOfType = coins.filter(c => c.coinType === selectedCoinType)
    const totalBalance = coinsOfType.reduce((sum, c) => sum + BigInt(c.balance), 0n)

    if (totalBalance < totalRequired) {
      alert(`Insufficient balance. Required: ${totalRequired}, Available: ${totalBalance}`)
      return
    }

    // Find the largest coin to split from
    const sortedCoins = [...coinsOfType].sort((a, b) =>
      Number(BigInt(b.balance) - BigInt(a.balance))
    )
    const sourceCoin = sortedCoins[0]

    if (BigInt(sourceCoin.balance) < totalRequired) {
      alert(`Largest coin (${sourceCoin.balance}) is smaller than required (${totalRequired}). Please merge coins first.`)
      return
    }

    const txb = new Transaction()
    const amounts = Array(count).fill(amount)
    txb.splitCoins(sourceCoin.coinObjectId, amounts)

    signAndExecute(
      { transaction: txb } as unknown as TransactionInput,
      {
        onSuccess: () => {
          alert(`Successfully split into ${count} coins of ${amount} each!`)
          setSplitAmount('')
          setSplitCount('')
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
  const coinsByType = coins.reduce((acc, coin) => {
    if (!acc[coin.coinType]) {
      acc[coin.coinType] = []
    }
    acc[coin.coinType].push(coin)
    return acc
  }, {} as Record<string, CoinStruct[]>)

  const totalCoins = coins.length
  const totalTypes = Object.keys(coinsByType).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Coin Management</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            {isLoading ? 'Loading...' : (
              <>
                {totalCoins} coins in {totalTypes} types
                {hasMore && <span className="text-yellow-400 ml-1">(showing first {MAX_COINS_FETCH})</span>}
              </>
            )}
          </span>
          <button
            onClick={fetchAllCoins}
            disabled={isLoading}
            className="px-3 py-1 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

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
            <p className="text-gray-400 text-sm">
              Split a coin into multiple coins of equal amount.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Amount per coin</label>
                <input
                  type="text"
                  placeholder="e.g. 1000000000 (1 SUI)"
                  value={splitAmount}
                  onChange={(e) => setSplitAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Number of coins (max {MAX_SPLIT_PER_TX})</label>
                <input
                  type="text"
                  placeholder={`e.g. 10 (max ${MAX_SPLIT_PER_TX})`}
                  value={splitCount}
                  onChange={(e) => setSplitCount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="input w-full"
                />
              </div>
            </div>
            {splitAmount && splitCount && (
              <div className="bg-slate-700 rounded-lg p-3 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Total required:</span>
                  <span className="text-white font-mono">
                    {(Number(BigInt(splitAmount || '0') * BigInt(splitCount || '0')) / 1e9).toFixed(4)} {selectedCoinType?.split('::').pop() || 'tokens'}
                  </span>
                </div>
                {selectedCoinType && coinsByType[selectedCoinType] && (
                  <div className="flex justify-between text-gray-300 mt-1">
                    <span>Available:</span>
                    <span className="text-white font-mono">
                      {(coinsByType[selectedCoinType].reduce((sum, c) => sum + Number(c.balance), 0) / 1e9).toFixed(4)} {selectedCoinType.split('::').pop()}
                    </span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleSplitCoins}
              disabled={isPending || !selectedCoinType || !splitAmount || !splitCount}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isPending ? 'Processing...' : `Split into ${splitCount || '?'} coins`}
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
