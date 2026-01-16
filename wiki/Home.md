# SuiLancet Wiki

Welcome to the **SuiLancet** documentation wiki!

SuiLancet is a lightweight personal tool for managing multiple Sui wallets and interacting with various DeFi protocols on the Sui blockchain.

---

## Quick Navigation

| Section | Description |
|---------|-------------|
| [[Getting Started]] | Installation, setup, and first steps |
| [[Architecture]] | Project structure and design overview |
| [[SDK Reference]] | Complete API documentation |
| [[CLI Guide]] | Command-line interface usage |
| [[Web Application]] | Web UI features and usage |
| [[Deployment]] | Deploy to Cloudflare Pages |
| [[Contributing]] | How to contribute to the project |
| [[FAQ]] | Frequently asked questions |

---

## Features

### Core Features
- **Multi-wallet Management** - Manage multiple Sui wallets from a single interface
- **Batch Coin Operations** - Merge, split, transfer coins in bulk (up to 2048 per tx)
- **Transaction Simulation** - Test transactions before execution
- **DEX Integration** - Swap tokens via Cetus and DeepBook

### Supported Protocols
| Protocol | Features |
|----------|----------|
| **Cetus** | Token swaps, liquidity pools |
| **DeepBook V3** | Order book trading, DEEP fee management |
| **Suilend** | Test coin faucet |
| **Margin Trading** | Leveraged positions |
| **Vault** | Token vault operations |

### Interfaces
- **CLI Tool** - Full-featured command-line interface
- **Web Application** - React-based web UI with wallet connection
- **SDK** - Programmatic access via TypeScript

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Blockchain | Sui Network |
| Language | TypeScript |
| SDK | @mysten/sui |
| Web Framework | React 18 + Vite |
| Wallet Integration | @mysten/dapp-kit |
| Styling | TailwindCSS |
| Deployment | Cloudflare Pages |

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/DolphinsLab/SuiLancet.git
cd SuiLancet

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your RPC endpoints and wallet

# Run CLI
npm run cli -- --help

# Or start web app
cd web && npm install && npm run dev
```

---

## Links

- **GitHub Repository**: [DolphinsLab/SuiLancet](https://github.com/DolphinsLab/SuiLancet)
- **Sui Documentation**: [docs.sui.io](https://docs.sui.io)
- **Cetus Protocol**: [cetus.zone](https://www.cetus.zone)
- **DeepBook**: [deepbook.tech](https://deepbook.tech)

---

*Last updated: 2026-01-16*
