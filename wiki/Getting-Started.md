# Getting Started

This guide will help you set up and start using SuiLancet.

---

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**
- A Sui wallet (private key or mnemonic phrase)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/DolphinsLab/SuiLancet.git
cd SuiLancet
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# RPC Endpoints
SUI_ENDPOINT_TESTNET=https://fullnode.testnet.sui.io:443
SUI_ENDPOINT_MAINNET=https://fullnode.mainnet.sui.io:443
SUI_ENDPOINT_PRE_MAINNET=https://fullnode.mainnet.sui.io:443

# Wallet Configuration (choose one)
SUI_WALLET_SECRET=<your-base64-encoded-secret-key>
# OR
SUI_WALLET_PHRASE=<your-12-or-24-word-mnemonic>
```

### 4. Build the Project

```bash
npm run build
```

---

## Wallet Configuration

### Option 1: Using Secret Key (Base64)

Export your wallet's secret key and encode it in Base64:

```bash
# If you have the raw 32-byte secret key
echo -n "your-32-byte-secret-key" | base64
```

Add to `.env`:
```bash
SUI_WALLET_SECRET=<base64-encoded-secret>
```

### Option 2: Using Mnemonic Phrase

Add your 12 or 24-word mnemonic to `.env`:

```bash
SUI_WALLET_PHRASE="word1 word2 word3 ... word12"
```

> **Security Note**: Never commit your `.env` file or share your private keys!

---

## Verify Installation

### Check CLI

```bash
npm run cli -- --help
```

Expected output:
```
Usage: cetus-cli [options] [command]

Cetus Scripts CLI Tool - Blockchain interaction command line tool

Options:
  -e, --env <env>  Network environment (testnet, pre-mainnet, mainnet)
  -d, --debug      Enable debug mode
  -V, --version    Show version number
  -h, --help       Show help information

Commands:
  coin             Coin related operations
  vault            Vault related operations
  object           Object related operations
  query            Query related operations
```

### Check Wallet Connection

```bash
npm run cli -- query wallet-info
```

This should display your wallet address and RPC endpoint.

---

## Quick Examples

### Query Balance

```bash
npm run cli -- query balance
```

### Merge Coins

```bash
npm run cli -- coin merge -t "0x2::sui::SUI"
```

### Transfer SUI

```bash
npm run cli -- coin transfer-all-sui -r "0x<recipient-address>"
```

---

## Web Application Setup

### 1. Navigate to Web Directory

```bash
cd web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment (Optional)

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
VITE_DEFAULT_NETWORK=mainnet
```

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Next Steps

- [[CLI Guide]] - Learn all CLI commands
- [[Web Application]] - Explore web UI features
- [[SDK Reference]] - Use SuiLancet programmatically
- [[Architecture]] - Understand the codebase

---

## Troubleshooting

### "Missing SUI_ENDPOINT_*" Error

Ensure your `.env` file has the correct RPC endpoint for your environment:
```bash
SUI_ENDPOINT_MAINNET=https://fullnode.mainnet.sui.io:443
```

### "No wallet secret or phrase found" Error

Check that either `SUI_WALLET_SECRET` or `SUI_WALLET_PHRASE` is set in `.env`.

### Web App Shows Blank Page

1. Check browser console for errors
2. Ensure all dependencies are installed: `npm install`
3. Clear browser cache and reload

---

*See also: [[FAQ]] for more troubleshooting tips*
