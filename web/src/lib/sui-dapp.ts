import { useCallback, useState } from 'react'
import { createDAppKit, useDAppKit } from '@mysten/dapp-kit-react'
import type { SuiClientTypes } from '@mysten/sui/client'
import { SuiGrpcClient } from '@mysten/sui/grpc'
import type { Transaction } from '@mysten/sui/transactions'

export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet'
export const SUI_NETWORKS: [SuiNetwork, SuiNetwork, SuiNetwork] = [
  'mainnet',
  'testnet',
  'devnet',
]

const GRPC_URLS: Record<SuiNetwork, string> = {
  mainnet:
    import.meta.env.VITE_SUI_GRPC_MAINNET ??
    'https://fullnode.mainnet.sui.io:443',
  testnet:
    import.meta.env.VITE_SUI_GRPC_TESTNET ??
    'https://fullnode.testnet.sui.io:443',
  devnet:
    import.meta.env.VITE_SUI_GRPC_DEVNET ??
    'https://fullnode.devnet.sui.io:443',
}

const configuredNetwork = import.meta.env.VITE_DEFAULT_NETWORK as
  | SuiNetwork
  | undefined
const defaultNetwork = SUI_NETWORKS.includes(configuredNetwork as SuiNetwork)
  ? configuredNetwork!
  : 'mainnet'

export const dAppKit = createDAppKit({
  networks: SUI_NETWORKS,
  defaultNetwork,
  createClient: (network) =>
    new SuiGrpcClient({
      network,
      baseUrl: GRPC_URLS[network],
    }),
})

declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: typeof dAppKit
  }
}

export interface TransactionInput {
  transaction: Transaction | string
}

interface MutationCallbacks {
  onSuccess?: (result: SuiClientTypes.Transaction) => void
  onError?: (error: Error) => void
}

/**
 * Small callback-style adapter for the existing screens while the transport and
 * wallet integration use the new gRPC-native dApp Kit.
 */
export function useSignAndExecuteTransaction() {
  const kit = useDAppKit()
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(
    (input: TransactionInput, callbacks: MutationCallbacks = {}) => {
      setIsPending(true)
      void kit
        .signAndExecuteTransaction(input)
        .then((result) => {
          if (result.$kind === 'FailedTransaction') {
            throw new Error(
              result.FailedTransaction.status.error?.message ??
                'Transaction execution failed',
            )
          }
          callbacks.onSuccess?.(result.Transaction)
        })
        .catch((error: unknown) => {
          callbacks.onError?.(
            error instanceof Error ? error : new Error(String(error)),
          )
        })
        .finally(() => setIsPending(false))
    },
    [kit],
  )

  return { mutate, isPending }
}
