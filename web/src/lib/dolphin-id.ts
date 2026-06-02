import type { SessionSnapshot } from '@dolphin-id/core'

export interface DolphinIdConfig {
  nonceUrl: string
  verifyUrl: string
  refreshUrl: string
  meUrl: string
  logoutUrl: string
  credentials: RequestCredentials
  domain: string
  uri: string
  statement: string
}

export interface DolphinIdMeResponse {
  session?: SessionSnapshot | null
}

export function getDolphinIdConfig(): DolphinIdConfig {
  const origin = window.location.origin

  return {
    nonceUrl: import.meta.env.VITE_DOLPHIN_ID_NONCE_URL || '/auth/nonce',
    verifyUrl: import.meta.env.VITE_DOLPHIN_ID_VERIFY_URL || '/auth/verify',
    refreshUrl: import.meta.env.VITE_DOLPHIN_ID_REFRESH_URL || '/auth/refresh',
    meUrl: import.meta.env.VITE_DOLPHIN_ID_ME_URL || '/auth/me',
    logoutUrl: import.meta.env.VITE_DOLPHIN_ID_LOGOUT_URL || '/auth/logout',
    credentials: (import.meta.env.VITE_DOLPHIN_ID_CREDENTIALS || 'same-origin') as RequestCredentials,
    domain: import.meta.env.VITE_DOLPHIN_ID_DOMAIN || window.location.host,
    uri: import.meta.env.VITE_DOLPHIN_ID_URI || origin,
    statement: import.meta.env.VITE_DOLPHIN_ID_STATEMENT || 'Sign in to SuiLancet with Dolphin ID.',
  }
}

export async function fetchDolphinIdSession(
  config: DolphinIdConfig
): Promise<SessionSnapshot | null> {
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

async function getResponseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; error?: string }
    return body.message || body.error || `${fallback} (${response.status})`
  } catch {
    return `${fallback} (${response.status})`
  }
}
