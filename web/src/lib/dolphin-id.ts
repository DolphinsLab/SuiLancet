import { normalizeSuiAddress } from '@mysten/sui/utils'

const DEFAULT_SESSION_TTL_MS = 5 * 60 * 1000

export interface DolphinIdConfig {
  nonceUrl: string
  verifyUrl: string
  meUrl: string
  logoutUrl: string
  credentials: RequestCredentials
  domain: string
  uri: string
  statement: string
}

export interface DolphinIdSession {
  subject: string
  issuedAt: string
  expiresAt: string
  token?: string
  metadata?: Readonly<Record<string, unknown>>
}

export interface DolphinIdRefreshToken {
  token: string
  subject: string
  issuedAt: string
  expiresAt: string
}

export interface DolphinIdNonceResponse {
  nonce: string
  expiresAt?: string
}

export interface DolphinIdSiwxMessage {
  format: 'sui-personal-message'
  chainType: 'sui'
  domain: string
  address: string
  statement?: string
  uri: string
  version: '1'
  chainId: string
  nonce: string
  issuedAt: string
  expirationTime: string
  purpose: 'sign-in'
  raw: string
}

export interface DolphinIdSignInResponse {
  session: DolphinIdSession
  refreshToken?: DolphinIdRefreshToken
  user?: unknown
  identity?: unknown
  verification?: unknown
}

export interface DolphinIdMeResponse {
  session?: DolphinIdSession | null
}

export function getDolphinIdConfig(): DolphinIdConfig {
  const origin = window.location.origin

  return {
    nonceUrl: import.meta.env.VITE_DOLPHIN_ID_NONCE_URL || '/auth/nonce',
    verifyUrl: import.meta.env.VITE_DOLPHIN_ID_VERIFY_URL || '/auth/verify',
    meUrl: import.meta.env.VITE_DOLPHIN_ID_ME_URL || '/auth/me',
    logoutUrl: import.meta.env.VITE_DOLPHIN_ID_LOGOUT_URL || '/auth/logout',
    credentials: (import.meta.env.VITE_DOLPHIN_ID_CREDENTIALS || 'same-origin') as RequestCredentials,
    domain: import.meta.env.VITE_DOLPHIN_ID_DOMAIN || window.location.host,
    uri: import.meta.env.VITE_DOLPHIN_ID_URI || origin,
    statement: import.meta.env.VITE_DOLPHIN_ID_STATEMENT || 'Sign in to SuiLancet with Dolphin ID.',
  }
}

export function createDolphinIdSuiMessage(input: {
  address: string
  chainId: string
  nonce: string
  domain: string
  uri: string
  statement: string
  issuedAt?: Date
  expirationTime?: Date
}): DolphinIdSiwxMessage {
  const issuedAt = input.issuedAt ?? new Date()
  const expirationTime =
    input.expirationTime ?? new Date(issuedAt.getTime() + DEFAULT_SESSION_TTL_MS)
  const address = normalizeSuiAddress(input.address)
  const raw = [
    'Dolphin ID Sui Sign-In',
    `Domain: ${input.domain}`,
    `Address: ${address}`,
    `Chain ID: ${input.chainId}`,
    `Nonce: ${input.nonce}`,
    `URI: ${input.uri}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expiration Time: ${expirationTime.toISOString()}`,
    `Statement: ${input.statement}`,
  ].join('\n')

  return {
    format: 'sui-personal-message',
    chainType: 'sui',
    domain: input.domain,
    address,
    statement: input.statement,
    uri: input.uri,
    version: '1',
    chainId: input.chainId,
    nonce: input.nonce,
    issuedAt: issuedAt.toISOString(),
    expirationTime: expirationTime.toISOString(),
    purpose: 'sign-in',
    raw,
  }
}

export async function issueDolphinIdNonce(
  config: DolphinIdConfig,
  input: {
    address: string
    chainId: string
    walletName: string
  }
): Promise<DolphinIdNonceResponse> {
  return postJson<DolphinIdNonceResponse>(config.nonceUrl, config, {
    purpose: 'sign-in',
    domain: config.domain,
    address: normalizeSuiAddress(input.address),
    chainType: 'sui',
    chainId: input.chainId,
    walletId: input.walletName,
    walletName: input.walletName,
  })
}

export async function verifyDolphinIdSignIn(
  config: DolphinIdConfig,
  input: {
    nonce: string
    message: DolphinIdSiwxMessage
    signature: string
  }
): Promise<DolphinIdSignInResponse> {
  return postJson<DolphinIdSignInResponse>(config.verifyUrl, config, input)
}

export async function fetchDolphinIdSession(
  config: DolphinIdConfig
): Promise<DolphinIdSession | null> {
  const response = await fetch(config.meUrl, {
    method: 'GET',
    credentials: config.credentials,
  })

  if (response.status === 401 || response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await getResponseError(response, 'Failed to restore Dolphin ID session.'))
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  const body = (await response.json()) as DolphinIdMeResponse
  return body.session ?? null
}

export async function logoutDolphinId(
  config: DolphinIdConfig,
  refreshToken?: string
): Promise<void> {
  await postJson(config.logoutUrl, config, refreshToken ? { refreshToken } : {})
}

async function postJson<T>(
  url: string,
  config: DolphinIdConfig,
  body: unknown
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: config.credentials,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await getResponseError(response, 'Dolphin ID request failed.'))
  }

  return (await response.json()) as T
}

async function getResponseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; error?: string }
    return body.message || body.error || `${fallback} (${response.status})`
  } catch {
    return `${fallback} (${response.status})`
  }
}
