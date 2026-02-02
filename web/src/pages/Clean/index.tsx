import { useState, useEffect } from 'react'
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import type { CoinStruct } from '@mysten/sui/client'
import { useToast } from '../../components/Toast'

type TransactionInput = Parameters<ReturnType<typeof useSignAndExecuteTransaction>['mutate']>[0]

type CoinAction = 'merge' | 'split' | 'transfer' | 'destroy' | 'gas'

// Sui limits: 512 arguments per MoveCall, 131072 bytes max tx size
const MAX_ARGS_PER_CALL = 511  // 512 - 1 (for primary coin)
const MAX_CALLS_PER_TX = 3     // Reduced from 4 to stay under 128KB tx size limit
// Maximum coins that can be merged in a single transaction
const MAX_MERGE_PER_TX = MAX_ARGS_PER_CALL * MAX_CALLS_PER_TX  // 1533
// Maximum coins to fetch (no limit - fetch all)
const MAX_COINS_FETCH = 10000
// Maximum coins to split in a single transaction
const MAX_SPLIT_PER_TX = MAX_ARGS_PER_CALL * MAX_CALLS_PER_TX  // 1533
// SUI coin type
const SUI_COIN_TYPE = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'

export default function Coin() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const toast = useToast()
  const [action, setAction] = useState<CoinAction>('merge')
  const [selectedCoinType, setSelectedCoinType] = useState<string>('')
  const [transferAddress, setTransferAddress] = useState('')
  const [splitAmount, setSplitAmount] = useState('')
  const [splitCount, setSplitCount] = useState('')
  const [mergeProgress, setMergeProgress] = useState<{ current: number; total: number } | null>(null)
  const [gasMinBalance, setGasMinBalance] = useState('')
  const [gasMaxBalance, setGasMaxBalance] = useState('')
  const [gasCopied, setGasCopied] = useState(false)
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
      toast.warning('Cannot Merge', 'Need at least 2 coins to merge')
      return
    }

    // Sort coins by balance (descending) to use largest as primary
    const sortedCoins = [...coinsOfType].sort((a, b) =>
      Number(BigInt(b.balance) - BigInt(a.balance))
    )
    const coinIds = sortedCoins.map(c => c.coinObjectId)
    const [primaryCoin, ...otherCoins] = coinIds

    // Check if merging SUI coins - need to set gas payment
    const isSuiCoin = selectedCoinType === SUI_COIN_TYPE ||
      selectedCoinType.endsWith('::sui::SUI')

    // Build transaction with multiple mergeCoins calls if needed
    const txb = new Transaction()

    // For SUI coins, set the primary coin as gas payment to avoid "No valid SUI" error
    if (isSuiCoin) {
      txb.setGasPayment([{
        objectId: primaryCoin,
        version: sortedCoins[0].version,
        digest: sortedCoins[0].digest,
      }])
    }

    if (otherCoins.length <= MAX_ARGS_PER_CALL) {
      // Single mergeCoins call
      txb.mergeCoins(isSuiCoin ? txb.gas : primaryCoin, otherCoins)
    } else if (otherCoins.length <= MAX_MERGE_PER_TX) {
      // Multiple mergeCoins calls in single transaction
      for (let i = 0; i < otherCoins.length; i += MAX_ARGS_PER_CALL) {
        const batch = otherCoins.slice(i, i + MAX_ARGS_PER_CALL)
        txb.mergeCoins(isSuiCoin ? txb.gas : primaryCoin, batch)
      }
    } else {
      // Need multiple transactions
      const totalTxs = Math.ceil(otherCoins.length / MAX_MERGE_PER_TX)
      setMergeProgress({ current: 0, total: totalTxs })

      // First transaction: merge first batch
      const firstBatch = otherCoins.slice(0, MAX_MERGE_PER_TX)
      for (let i = 0; i < firstBatch.length; i += MAX_ARGS_PER_CALL) {
        const batch = firstBatch.slice(i, i + MAX_ARGS_PER_CALL)
        txb.mergeCoins(isSuiCoin ? txb.gas : primaryCoin, batch)
      }

      signAndExecute(
        { transaction: txb } as unknown as TransactionInput,
        {
          onSuccess: () => {
            setMergeProgress({ current: 1, total: totalTxs })
            toast.info('Batch Complete', `Transaction 1/${totalTxs} completed. Please continue merging remaining coins.`)
            refetch()
          },
          onError: (err) => {
            setMergeProgress(null)
            toast.error('Transaction Failed', err.message)
          },
        }
      )
      return
    }

    // Execute single transaction (covers both single call and multiple calls cases)
    signAndExecute(
      { transaction: txb } as unknown as TransactionInput,
      {
        onSuccess: () => {
          const callCount = Math.ceil(otherCoins.length / MAX_ARGS_PER_CALL)
          toast.success('Merge Successful', `Merged ${coinsOfType.length} coins into one (${callCount} call${callCount > 1 ? 's' : ''})`)
          setMergeProgress(null)
          refetch()
        },
        onError: (err) => toast.error('Merge Failed', err.message),
      }
    )
  }

  const handleTransfer = async () => {
    if (!account || !selectedCoinType || !transferAddress) return

    const coinsOfType = coins.filter(c => c.coinType === selectedCoinType)
    if (coinsOfType.length === 0) {
      toast.warning('Cannot Transfer', 'No coins to transfer')
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
          toast.success('Transfer Successful', 'All coins have been transferred')
          refetch()
        },
        onError: (err) => toast.error('Transfer Failed', err.message),
      }
    )
  }

  const handleSplitCoins = async () => {
    if (!account || !selectedCoinType || !splitAmount || !splitCount) return

    const amount = BigInt(splitAmount)
    const count = parseInt(splitCount, 10)

    if (count <= 0 || count > MAX_SPLIT_PER_TX) {
      toast.warning('Invalid Count', `Count must be between 1 and ${MAX_SPLIT_PER_TX}`)
      return
    }

    const totalRequired = amount * BigInt(count)
    const coinsOfType = coins.filter(c => c.coinType === selectedCoinType)
    const totalBalance = coinsOfType.reduce((sum, c) => sum + BigInt(c.balance), 0n)

    if (totalBalance < totalRequired) {
      toast.error('Insufficient Balance', `Required: ${(Number(totalRequired) / 1e9).toFixed(4)}, Available: ${(Number(totalBalance) / 1e9).toFixed(4)}`)
      return
    }

    // Find the largest coin to split from
    const sortedCoins = [...coinsOfType].sort((a, b) =>
      Number(BigInt(b.balance) - BigInt(a.balance))
    )
    const sourceCoin = sortedCoins[0]

    if (BigInt(sourceCoin.balance) < totalRequired) {
      toast.warning('Need to Merge First', `Largest coin (${(Number(sourceCoin.balance) / 1e9).toFixed(4)}) is smaller than required (${(Number(totalRequired) / 1e9).toFixed(4)}). Please merge coins first.`)
      return
    }

    const txb = new Transaction()

    if (count <= MAX_ARGS_PER_CALL) {
      // Single splitCoins call
      const amounts = Array(count).fill(amount)
      txb.splitCoins(sourceCoin.coinObjectId, amounts)
    } else {
      // Multiple splitCoins calls in single transaction
      let remaining = count
      for (let i = 0; i < count; i += MAX_ARGS_PER_CALL) {
        const batchSize = Math.min(MAX_ARGS_PER_CALL, remaining)
        const amounts = Array(batchSize).fill(amount)
        txb.splitCoins(sourceCoin.coinObjectId, amounts)
        remaining -= batchSize
      }
    }

    const callCount = Math.ceil(count / MAX_ARGS_PER_CALL)
    signAndExecute(
      { transaction: txb } as unknown as TransactionInput,
      {
        onSuccess: () => {
          toast.success('Split Successful', `Split into ${count} coins of ${(Number(amount) / 1e9).toFixed(4)} each (${callCount} call${callCount > 1 ? 's' : ''})`)
          setSplitAmount('')
          setSplitCount('')
          refetch()
        },
        onError: (err) => toast.error('Split Failed', err.message),
      }
    )
  }

  if (!account) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Wallet Cleanup</h1>
        <p className="text-gray-400">Connect your wallet to clean up coins</p>
      </div>
    )
  }

  // Get all SUI gas objects with optional balance filter
  const getFilteredGasObjects = () => {
    const suiCoins = coins.filter(c =>
      c.coinType === SUI_COIN_TYPE || c.coinType.endsWith('::sui::SUI')
    )

    let filtered = suiCoins

    if (gasMinBalance) {
      const minBal = BigInt(Math.floor(parseFloat(gasMinBalance) * 1e9))
      filtered = filtered.filter(c => BigInt(c.balance) >= minBal)
    }

    if (gasMaxBalance) {
      const maxBal = BigInt(Math.floor(parseFloat(gasMaxBalance) * 1e9))
      filtered = filtered.filter(c => BigInt(c.balance) <= maxBal)
    }

    // Sort by balance descending
    return filtered.sort((a, b) => Number(BigInt(b.balance) - BigInt(a.balance)))
  }

  const filteredGasObjects = getFilteredGasObjects()

  const handleCopyGasObjects = async () => {
    const objectIds = filteredGasObjects.map(c => `"${c.coinObjectId}"`)
    const text = objectIds.join(',\n')

    try {
      await navigator.clipboard.writeText(text)
      setGasCopied(true)
      toast.success('Copied!', `${filteredGasObjects.length} gas object IDs copied to clipboard`)
      setTimeout(() => setGasCopied(false), 2000)
    } catch (err) {
      toast.error('Copy Failed', 'Failed to copy to clipboard')
    }
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
        <h1 className="text-2xl font-bold text-white">Wallet Cleanup</h1>
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
      <div className="flex space-x-2 flex-wrap gap-y-2">
        {(['merge', 'split', 'transfer', 'destroy', 'gas'] as CoinAction[]).map((a) => (
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

      {/* Coin Type Selector - hidden for gas action since it only works with SUI */}
      {action !== 'gas' && (
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
      )}

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

        {action === 'gas' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Filter and copy all available SUI gas object IDs. Useful for batch operations.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Min Balance (SUI)</label>
                <input
                  type="text"
                  placeholder="e.g. 0.1"
                  value={gasMinBalance}
                  onChange={(e) => setGasMinBalance(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Max Balance (SUI)</label>
                <input
                  type="text"
                  placeholder="e.g. 10"
                  value={gasMaxBalance}
                  onChange={(e) => setGasMaxBalance(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="input w-full"
                />
              </div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Filtered Gas Objects:</span>
                <span className="text-white font-semibold">{filteredGasObjects.length}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <span>Total Balance:</span>
                <span className="text-white font-mono">
                  {(filteredGasObjects.reduce((sum, c) => sum + Number(c.balance), 0) / 1e9).toFixed(4)} SUI
                </span>
              </div>
            </div>
            <button
              onClick={handleCopyGasObjects}
              disabled={filteredGasObjects.length === 0}
              className={`btn-primary w-full disabled:opacity-50 ${gasCopied ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {gasCopied ? 'Copied!' : `Copy ${filteredGasObjects.length} Gas Object IDs`}
            </button>

            {/* Gas Objects List */}
            {filteredGasObjects.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Gas Objects Preview</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredGasObjects.slice(0, 50).map((coin) => (
                    <div
                      key={coin.coinObjectId}
                      className="flex justify-between items-center py-2 px-3 bg-slate-600 rounded-lg"
                    >
                      <span className="font-mono text-xs text-gray-300">
                        {coin.coinObjectId.slice(0, 16)}...{coin.coinObjectId.slice(-8)}
                      </span>
                      <span className="text-white text-sm">
                        {(Number(coin.balance) / 1e9).toFixed(4)} SUI
                      </span>
                    </div>
                  ))}
                  {filteredGasObjects.length > 50 && (
                    <div className="text-center text-gray-400 text-sm py-2">
                      ... and {filteredGasObjects.length - 50} more
                    </div>
                  )}
                </div>
              </div>
            )}
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
