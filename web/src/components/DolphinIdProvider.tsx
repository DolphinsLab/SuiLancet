import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  useCurrentAccount,
  useCurrentWallet,
  useSignPersonalMessage,
  useSuiClientContext,
} from '@mysten/dapp-kit'
import {
  DolphinIdConfig,
  DolphinIdRefreshToken,
  DolphinIdSession,
  createDolphinIdSuiMessage,
  fetchDolphinIdSession,
  getDolphinIdConfig,
  issueDolphinIdNonce,
  logoutDolphinId,
  verifyDolphinIdSignIn,
} from '../lib/dolphin-id'

type DolphinIdStatus = 'idle' | 'restoring' | 'signing' | 'signed-in' | 'error'

interface DolphinIdContextValue {
  config: DolphinIdConfig
  session: DolphinIdSession | null
  refreshToken: DolphinIdRefreshToken | null
  status: DolphinIdStatus
  error: string | null
  signIn: () => Promise<DolphinIdSession>
  logout: () => Promise<void>
  restore: () => Promise<void>
}

const DolphinIdContext = createContext<DolphinIdContextValue | null>(null)

export function DolphinIdProvider({ children }: { children: ReactNode }) {
  const account = useCurrentAccount()
  const { currentWallet } = useCurrentWallet()
  const { network } = useSuiClientContext()
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage()
  const config = useMemo(() => getDolphinIdConfig(), [])
  const [session, setSession] = useState<DolphinIdSession | null>(null)
  const [refreshToken, setRefreshToken] = useState<DolphinIdRefreshToken | null>(null)
  const [status, setStatus] = useState<DolphinIdStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const restore = useCallback(async () => {
    setStatus('restoring')
    setError(null)

    try {
      const restoredSession = await fetchDolphinIdSession(config)
      setSession(restoredSession)
      setStatus(restoredSession ? 'signed-in' : 'idle')
    } catch (err) {
      setSession(null)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to restore Dolphin ID session.')
    }
  }, [config])

  useEffect(() => {
    void restore()
  }, [restore])

  useEffect(() => {
    if (session && account && !session.subject.toLowerCase().includes(account.address.toLowerCase())) {
      setSession(null)
      setRefreshToken(null)
      setStatus('idle')
    }
  }, [account, session])

  const signIn = useCallback(async () => {
    if (!account) {
      throw new Error('Connect a Sui wallet before signing in with Dolphin ID.')
    }

    setStatus('signing')
    setError(null)

    try {
      const nonce = await issueDolphinIdNonce(config, {
        address: account.address,
        chainId: network,
        walletName: currentWallet?.name ?? 'Sui Wallet',
      })
      const message = createDolphinIdSuiMessage({
        address: account.address,
        chainId: network,
        nonce: nonce.nonce,
        domain: config.domain,
        uri: config.uri,
        statement: config.statement,
      })
      const signed = await signPersonalMessage({
        message: new TextEncoder().encode(message.raw),
      })
      const response = await verifyDolphinIdSignIn(config, {
        nonce: nonce.nonce,
        message,
        signature: signed.signature,
      })

      setSession(response.session)
      setRefreshToken(response.refreshToken ?? null)
      setStatus('signed-in')
      return response.session
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Dolphin ID sign-in failed.'
      setSession(null)
      setStatus('error')
      setError(message)
      throw new Error(message)
    }
  }, [account, config, currentWallet, network, signPersonalMessage])

  const logout = useCallback(async () => {
    setError(null)

    try {
      await logoutDolphinId(config, refreshToken?.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dolphin ID logout request failed.')
    } finally {
      setSession(null)
      setRefreshToken(null)
      setStatus('idle')
    }
  }, [config, refreshToken])

  const value = useMemo<DolphinIdContextValue>(
    () => ({
      config,
      session,
      refreshToken,
      status,
      error,
      signIn,
      logout,
      restore,
    }),
    [config, error, logout, refreshToken, restore, session, signIn, status]
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
