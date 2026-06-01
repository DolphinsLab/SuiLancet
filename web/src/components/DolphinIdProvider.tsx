import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createSuiAdapter, type SuiNetwork } from '@dolphin-id/adapter-sui'
import { DolphinProvider, useDolphin, useSession, type DolphinRefreshTokenSnapshot } from '@dolphin-id/react'
import type { SessionSnapshot, Wallet } from '@dolphin-id/core'
import { useCurrentAccount, useCurrentWallet, useSuiClientContext } from '@mysten/dapp-kit'
import {
  DolphinIdConfig,
  fetchDolphinIdSession,
  getDolphinIdConfig,
} from '../lib/dolphin-id'

type DolphinIdStatus = 'idle' | 'restoring' | 'connecting' | 'signing' | 'signed-in' | 'error'

interface DolphinIdContextValue {
  config: DolphinIdConfig
  session: SessionSnapshot | null
  refreshToken: DolphinRefreshTokenSnapshot | null
  status: DolphinIdStatus
  error: string | null
  signIn: () => Promise<SessionSnapshot>
  logout: () => Promise<void>
  restore: () => Promise<void>
}

const DolphinIdContext = createContext<DolphinIdContextValue | null>(null)

export function DolphinIdProvider({ children }: { children: ReactNode }) {
  const { network } = useSuiClientContext()
  const config = useMemo(() => getDolphinIdConfig(), [])
  const adapters = useMemo(
    () => [createSuiAdapter({ network: toDolphinSuiNetwork(network) })],
    [network]
  )

  return (
    <DolphinProvider
      config={{
        adapters,
        auth: {
          nonceUrl: config.nonceUrl,
          verifyUrl: config.verifyUrl,
          refreshUrl: config.refreshUrl,
          logoutUrl: config.logoutUrl,
          credentials: config.credentials,
        },
      }}
    >
      <DolphinIdSessionBridge config={config}>{children}</DolphinIdSessionBridge>
    </DolphinProvider>
  )
}

function DolphinIdSessionBridge({
  children,
  config,
}: {
  children: ReactNode
  config: DolphinIdConfig
}) {
  const account = useCurrentAccount()
  const { currentWallet } = useCurrentWallet()
  const dolphin = useDolphin()
  const dolphinSession = useSession()
  const [restoredSession, setRestoredSession] = useState<SessionSnapshot | null>(null)
  const [status, setStatus] = useState<DolphinIdStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const session = dolphinSession.session ?? restoredSession
  const refreshToken = dolphinSession.refreshToken ?? null
  const derivedStatus = session
    ? 'signed-in'
    : status === 'idle' && dolphin.state.status === 'connected'
    ? 'idle'
    : status

  const restore = useCallback(async () => {
    setStatus('restoring')
    setError(null)

    try {
      const nextSession = await fetchDolphinIdSession(config)
      setRestoredSession(nextSession)
      setStatus(nextSession ? 'signed-in' : 'idle')
    } catch (err) {
      setRestoredSession(null)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to restore Dolphin ID session.')
    }
  }, [config])

  useEffect(() => {
    void restore()
  }, [restore])

  useEffect(() => {
    if (session && account && !session.subject.toLowerCase().includes(account.address.toLowerCase())) {
      setRestoredSession(null)
      setStatus('idle')
    }
  }, [account, session])

  const signIn = useCallback(async () => {
    if (!account) {
      throw new Error('Connect a Sui wallet before signing in with Dolphin ID.')
    }

    setStatus('connecting')
    setError(null)

    try {
      const wallets = dolphin.wallets.length > 0 ? dolphin.wallets : await dolphin.refreshWallets()
      const wallet = selectWallet(wallets, currentWallet?.name)

      if (!wallet) {
        throw new Error('No Sui wallet is available for Dolphin ID.')
      }

      if (dolphin.state.status !== 'connected' || dolphin.activeWallet?.id !== wallet.id) {
        await dolphin.connectWallet({
          walletId: wallet.id,
          adapterId: wallet.adapterId,
        })
      }

      setStatus('signing')
      const result = await dolphin.signIn({
        domain: config.domain,
        uri: config.uri,
        statement: config.statement,
      })

      setRestoredSession(null)
      setStatus('signed-in')
      return result.session
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Dolphin ID sign-in failed.'
      setRestoredSession(null)
      setStatus('error')
      setError(message)
      throw new Error(message)
    }
  }, [account, config, currentWallet, dolphin])

  const logout = useCallback(async () => {
    setError(null)

    try {
      await dolphinSession.logoutSession({ refreshToken: refreshToken?.token })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dolphin ID logout request failed.')
    } finally {
      setRestoredSession(null)
      setStatus('idle')
    }
  }, [dolphinSession, refreshToken])

  const value = useMemo<DolphinIdContextValue>(
    () => ({
      config,
      session: session ?? null,
      refreshToken,
      status: derivedStatus,
      error,
      signIn,
      logout,
      restore,
    }),
    [config, derivedStatus, error, logout, refreshToken, restore, session, signIn]
  )

  return <DolphinIdContext.Provider value={value}>{children}</DolphinIdContext.Provider>
}

export function useDolphinId() {
  const context = useContext(DolphinIdContext)

  if (!context) {
    throw new Error('useDolphinId must be used within DolphinIdProvider')
  }

  return context
}

function toDolphinSuiNetwork(network: string): SuiNetwork {
  if (network === 'testnet' || network === 'devnet' || network === 'localnet') {
    return network
  }

  return 'mainnet'
}

function selectWallet(wallets: readonly Wallet[], preferredName?: string): Wallet | undefined {
  const installedWallets = wallets.filter((wallet) => wallet.installed)

  if (preferredName) {
    const preferred = installedWallets.find(
      (wallet) => wallet.name.toLowerCase() === preferredName.toLowerCase()
    )

    if (preferred) {
      return preferred
    }
  }

  return installedWallets[0] ?? wallets[0]
}
