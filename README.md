# SuiLancet

A lightweight personal tool for managing multiple Sui wallets and backend services in one place.

## Features

- **Multi-Wallet Management**: Manage multiple Sui wallets from a single interface
- **Coin Operations**: Merge, split, transfer, and destroy coins
- **Cleanup Tools**: Destroy zero-balance coins, clean dust, and scan suspicious airdrops
- **Asset Management**: Transfer assets, split coins, migrate wallets, and manage Kiosk items
- **Security Tools**: Simulate transactions, scan wallet risks, and inspect gas recommendations
- **Query Tools**: Review balances, transaction history, object details, and dynamic fields
- **Dolphin ID Sign-In**: Authenticate through Dolphin ID from the Web UI
- **CLI & Web UI**: Both command-line and web interface available

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/DolphinsLab/SuiLancet.git
cd SuiLancet

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Environment Variables

```bash
# RPC Endpoints
SUI_ENDPOINT_TESTNET=https://fullnode.testnet.sui.io
SUI_ENDPOINT_MAINNET=https://fullnode.mainnet.sui.io

# Wallet Configuration (choose one)
SUI_WALLET_SECRET=<base64-encoded-secret>
SUI_WALLET_PHRASE=<mnemonic-phrase>
```

### Build & Run

```bash
# Build the SDK
npm run build

# Run CLI
npm run cli -- --help

# Start web UI (development)
cd web && npm install && npm run dev
```

## Project Structure

```
SuiLancet/
├── src/                    # SDK and CLI source
│   ├── core/              # Core client and shared types
│   ├── modules/           # Clean, Manage, Secure, Query, DeFi modules
│   ├── cli/               # Commander CLI entrypoint and commands
│   ├── common/            # Utility functions
│   └── movecall/          # Move call wrappers
├── tests/                  # Test files
├── docs/                   # Documentation
└── web/                    # Web UI (React + Vite)
```

## Documentation

- [SDK Reference](docs/SDK-REFERENCE.md) - Complete API documentation
- [Deployment Guide](docs/DEPLOYMENT.md) - Cloudflare Pages deployment

## CLI Commands

```bash
# Cleanup operations
sui-lancet clean destroy-zero --dry-run
sui-lancet clean merge -t <coinType>
sui-lancet clean dust --threshold 0.01 --dry-run
sui-lancet clean airdrop-scan

# Asset management
sui-lancet manage transfer -i <coinId> -r <recipient>
sui-lancet manage migrate -r <recipient> --dry-run
sui-lancet manage kiosk-list

# Security operations
sui-lancet secure simulate --tx <base64Tx>
sui-lancet secure scan
sui-lancet secure gas-info

# Query operations
sui-lancet query wallet-info
sui-lancet query balance
sui-lancet query object <objectId> --dynamic-fields
```

## Web UI

The web interface provides a visual dashboard for:

- Wallet connection (Sui Wallet, Suiet, etc.)
- Dolphin ID sign-in via Sui personal-message auth endpoints
- Coin management (merge, split, transfer)
- Wallet migration and Kiosk management
- Transaction simulation and security scanning
- Gas object filtering and grouped object ID export

### Local Development

```bash
cd web
npm install
npm run dev
```

Optional Dolphin ID endpoints can be configured in `web/.env`:

```bash
VITE_DOLPHIN_ID_NONCE_URL=/auth/nonce
VITE_DOLPHIN_ID_VERIFY_URL=/auth/verify
VITE_DOLPHIN_ID_REFRESH_URL=/auth/refresh
VITE_DOLPHIN_ID_ME_URL=/auth/me
VITE_DOLPHIN_ID_LOGOUT_URL=/auth/logout
```

### Deployment

See [Deployment Guide](docs/DEPLOYMENT.md) for Cloudflare Pages setup.

## Tech Stack

- **Blockchain**: Sui Network
- **SDK**: @mysten/sui
- **CLI**: Commander.js
- **Web**: React 18 + Vite + TypeScript
- **Wallet**: @mysten/dapp-kit
- **Styling**: TailwindCSS

## Security

- Never hardcode private keys or mnemonics
- Use environment variables for sensitive configuration
- Keep dependencies updated

## License

MIT

---

*Last updated: 2026-01-15*
