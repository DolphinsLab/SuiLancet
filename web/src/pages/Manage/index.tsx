import { useState } from 'react'
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useToast } from '../../components/Toast'

type TransactionInput = Parameters<ReturnType<typeof useSignAndExecuteTransaction>['mutate']>[0]
type ManageAction = 'transfer' | 'migrate'

export default function Manage() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const toast = useToast()
  const [action, setAction] = useState<ManageAction>('transfer')
  const [recipient, setRecipient] = useState('')
  const [objectIds, setObjectIds] = useState('')
  const [migrateStatus, setMigrateStatus] = useState<string | null>(null)

  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()

  const handleTransferObjects = async () => {
    if (!account || !recipient || !objectIds.trim()) return

    const ids = objectIds.split('\n').map(s => s.trim()).filter(Boolean)
    if (ids.length === 0) {
      toast.warning('No Objects', 'Enter at least one object ID')
      return
    }

    const txb = new Transaction()
    const refs = ids.map(id => txb.object(id))
    txb.transferObjects(refs, recipient)

    signAndExecute(
      { transaction: txb } as unknown as TransactionInput,
      {
        onSuccess: (result) => {
          toast.success('Transfer Successful', `Transferred ${ids.length} objects (${result.digest.slice(0, 10)}...)`)
          setObjectIds('')
        },
        onError: (err) => toast.error('Transfer Failed', err.message),
      }
    )
  }

  const handleMigrate = async () => {
    if (!account || !recipient) return

    setMigrateStatus('Scanning assets...')

    try {
      // Fetch all coins
      const allCoins: { objectId: string; coinType: string }[] = []
      let cursor: string | null | undefined = null
      do {
        const response = await client.getAllCoins({
          owner: account.address,
          cursor: cursor,
          limit: 50,
        })
        allCoins.push(...response.data.map(c => ({ objectId: c.coinObjectId, coinType: c.coinType })))
        cursor = response.hasNextPage ? response.nextCursor : null
      } while (cursor)

      // Fetch all objects (non-coin)
      const allObjects: string[] = []
      let objCursor: string | null | undefined = null
      let hasNext = true
      while (hasNext) {
        const result = await client.getOwnedObjects({
          owner: account.address,
          options: { showType: true },
          cursor: objCursor ?? undefined,
          limit: 50,
        })
        for (const obj of result.data) {
          if (!obj.data) continue
          const type = obj.data.type ?? ''
          if (!type.startsWith('0x2::coin::Coin<')) {
            allObjects.push(obj.data.objectId)
          }
        }
        hasNext = result.hasNextPage
        objCursor = result.nextCursor
      }

      const suiType = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'
      const nonSuiCoins = allCoins.filter(c => c.coinType !== suiType)
      const suiCoins = allCoins.filter(c => c.coinType === suiType)

      setMigrateStatus(`Found ${nonSuiCoins.length} non-SUI coins, ${allObjects.length} objects, ${suiCoins.length} SUI coins`)

      // Phase 1: Transfer non-SUI coins in batches
      const batchSize = 50
      if (nonSuiCoins.length > 0) {
        for (let i = 0; i < nonSuiCoins.length; i += batchSize) {
          const batch = nonSuiCoins.slice(i, i + batchSize)
          const tx = new Transaction()
          tx.transferObjects(batch.map(c => tx.object(c.objectId)), recipient)
          setMigrateStatus(`Migrating non-SUI coins: batch ${Math.floor(i / batchSize) + 1}...`)

          await new Promise<void>((resolve, reject) => {
            signAndExecute(
              { transaction: tx } as unknown as TransactionInput,
              { onSuccess: () => resolve(), onError: (err) => reject(err) }
            )
          })
        }
      }

      // Phase 2: Transfer objects
      if (allObjects.length > 0) {
        for (let i = 0; i < allObjects.length; i += batchSize) {
          const batch = allObjects.slice(i, i + batchSize)
          const tx = new Transaction()
          tx.transferObjects(batch.map(id => tx.object(id)), recipient)
          setMigrateStatus(`Migrating objects: batch ${Math.floor(i / batchSize) + 1}...`)

          await new Promise<void>((resolve, reject) => {
            signAndExecute(
              { transaction: tx } as unknown as TransactionInput,
              { onSuccess: () => resolve(), onError: (err) => reject(err) }
            )
          })
        }
      }

      // Phase 3: Transfer all SUI last
      if (suiCoins.length > 0) {
        setMigrateStatus('Migrating SUI...')
        const tx = new Transaction()
        if (suiCoins.length > 1) {
          const others = suiCoins.slice(1).map(c => tx.object(c.objectId))
          tx.mergeCoins(tx.gas, others)
        }
        tx.transferObjects([tx.gas], recipient)

        await new Promise<void>((resolve, reject) => {
          signAndExecute(
            { transaction: tx } as unknown as TransactionInput,
            { onSuccess: () => resolve(), onError: (err) => reject(err) }
          )
        })
      }

      setMigrateStatus('Migration complete!')
      toast.success('Migration Complete', 'All assets transferred successfully')
    } catch (err: any) {
      setMigrateStatus(`Error: ${err.message}`)
      toast.error('Migration Failed', err.message)
    }
  }

  if (!account) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Asset Management</h1>
        <p className="text-gray-400">Connect your wallet to manage assets</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Asset Management</h1>

      {/* Action Tabs */}
      <div className="flex space-x-2">
        {(['transfer', 'migrate'] as ManageAction[]).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`px-4 py-2 rounded-lg capitalize ${
              action === a ? 'bg-sui-600 text-white' : 'bg-slate-700 text-gray-300'
            }`}
          >
            {a === 'transfer' ? 'Batch Transfer' : 'Wallet Migration'}
          </button>
        ))}
      </div>

      {action === 'transfer' && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-white">Transfer Objects</h2>
          <p className="text-gray-400 text-sm">Transfer multiple objects to a recipient address.</p>
          <input
            type="text"
            placeholder="Recipient address (0x...)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="input w-full"
          />
          <textarea
            value={objectIds}
            onChange={(e) => setObjectIds(e.target.value)}
            placeholder="Object IDs (one per line)"
            className="input w-full h-32 font-mono text-sm resize-none"
          />
          <button
            onClick={handleTransferObjects}
            disabled={isPending || !recipient || !objectIds.trim()}
            className="btn-primary w-full disabled:opacity-50"
          >
            {isPending ? 'Processing...' : 'Transfer Objects'}
          </button>
        </div>
      )}

      {action === 'migrate' && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-white">Wallet Migration</h2>
          <p className="text-gray-400 text-sm">
            Transfer ALL assets (coins, NFTs, objects) to a new address.
            SUI is transferred last to cover gas fees.
          </p>
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3">
            <p className="text-yellow-300 text-sm">
              Warning: This will transfer everything in your wallet. Make sure the recipient address is correct.
            </p>
          </div>
          <input
            type="text"
            placeholder="Target address (0x...)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="input w-full"
          />
          {migrateStatus && (
            <div className="bg-slate-700 rounded-lg p-3 text-sm text-gray-300">
              {migrateStatus}
            </div>
          )}
          <button
            onClick={handleMigrate}
            disabled={isPending || !recipient}
            className="btn-primary w-full disabled:opacity-50 bg-orange-600 hover:bg-orange-700"
          >
            {isPending ? 'Migrating...' : 'Start Migration'}
          </button>
        </div>
      )}
    </div>
  )
}
