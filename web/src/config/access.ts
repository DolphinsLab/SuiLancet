// Access control configuration from environment variables

/**
 * Parse comma-separated wallet addresses from environment variable
 * Configured in Cloudflare Pages environment variables
 */
export function getVaultAllowedWallets(): string[] {
  const envValue = import.meta.env.VITE_VAULT_ALLOWED_WALLETS || ''
  if (!envValue.trim()) {
    return []
  }
  return envValue
    .split(',')
    .map((addr: string) => addr.trim().toLowerCase())
    .filter((addr: string) => addr.length > 0)
}

/**
 * Check if a wallet address is allowed to access Vault Manager
 */
export function isWalletAllowedForVault(address: string | undefined): boolean {
  if (!address) return false
  const allowedWallets = getVaultAllowedWallets()
  // If no wallets configured, deny all access
  if (allowedWallets.length === 0) return false
  return allowedWallets.includes(address.toLowerCase())
}
