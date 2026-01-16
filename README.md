# SuiLancet

A lightweight personal tool for managing multiple Sui wallets and backend services in one place.

## Features

- **Multi-Wallet Management**: Manage multiple Sui wallets from a single interface
- **Coin Operations**: Merge, split, transfer, and destroy coins
- **DEX Integration**: Cetus Protocol, DeepBook V3 swap support
- **Transaction Tools**: Simulate and sign Base64-encoded transactions
- **Vault Management**: Deposit and withdraw from vaults
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
├── src/                    # SDK source code
│   ├── client.ts          # Core client class
│   ├── cli.ts             # CLI tool
│   ├── common/            # Utility functions
│   ├── methods/           # High-level business methods
│   ├── movecall/          # Move contract call wrappers
│   └── types/             # Type definitions
├── tests/                  # Test files
├── docs/                   # Documentation
└── web/                    # Web UI (React + Vite)
```

## Documentation

- [SDK Reference](docs/SDK-REFERENCE.md) - Complete API documentation
- [Deployment Guide](docs/DEPLOYMENT.md) - Cloudflare Pages deployment

## CLI Commands

```bash
# Coin operations
cetus-cli coin destroy-zero          # Destroy zero-balance coins
cetus-cli coin merge -t <coinType>   # Merge coins
cetus-cli coin transfer -i <id> -r <recipient>  # Transfer coin

# Vault operations
cetus-cli vault withdraw -t <coinType> -a <amount>

# Query operations
cetus-cli query wallet-info          # Show wallet info
cetus-cli query balance              # Query balances
```

## Web UI

The web interface provides a visual dashboard for:

- Wallet connection (Sui Wallet, Suiet, etc.)
- Coin management (merge, split, transfer)
- Transaction simulation and signing
- DEX swap operations
- Vault management

### Local Development

```bash
cd web
npm install
npm run dev
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
