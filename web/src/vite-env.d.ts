/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: 'development' | 'production'
  readonly VITE_DEFAULT_NETWORK: 'mainnet' | 'testnet' | 'devnet'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
