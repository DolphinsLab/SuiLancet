# FAQ

Frequently asked questions about SuiLancet.

---

## General

### What is SuiLancet?

SuiLancet is a lightweight tool for managing Sui blockchain wallets. It provides both CLI and web interfaces for common wallet operations like coin management, transfers, and transaction signing.

### Is SuiLancet open source?

Yes, SuiLancet is open source and available on GitHub.

### Which networks are supported?

- **Mainnet** - Production network
- **Testnet** - Testing network
- **Devnet** - Development network

---

## Installation

### What are the prerequisites?

- Node.js 18 or higher
- npm or pnpm package manager
- A Sui wallet (mnemonic phrase or secret key)

### How do I install SuiLancet?

```bash
git clone https://github.com/YourUsername/SuiLancet.git
cd SuiLancet
npm install
```

### How do I configure my wallet?

Create a `.env` file with either:

```bash
# Option 1: Mnemonic phrase
SUI_WALLET_PHRASE="your twelve word mnemonic phrase here"

# Option 2: Secret key (base64)
SUI_WALLET_SECRET="your-base64-secret-key"
```

---

## CLI

### How do I run CLI commands?

```bash
npm run dev <command> [options]
```

### What commands are available?

| Command | Description |
|---------|-------------|
| `merge` | Merge coins of a specific type |
| `split` | Split a coin into multiple coins |
| `transfer` | Transfer coins to another address |
| `destroy` | Destroy zero-balance coins |

### How do I merge coins?

```bash
npm run dev merge --coin-type 0x2::sui::SUI
```

---

## Web Application

### How do I start the web app?

```bash
cd web
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

### Which wallets are supported?

- Sui Wallet
- Suiet
- Ethos Wallet
- Martian Wallet

### Why isn't the wallet connect button working?

Make sure the dapp-kit CSS is imported in `main.tsx`:

```typescript
import '@mysten/dapp-kit/dist/index.css'
```

### Can I merge more than 2048 coins?

Yes! SuiLancet supports batch merging. If you have more than 2048 coins:

1. The system automatically calculates required batches
2. Shows progress bar during multi-batch operations
3. You'll need to approve each batch transaction

---

## Coin Operations

### What is the maximum coins per merge transaction?

2048 coins per transaction (1 primary + 2047 others).

### How does batch merging work?

For large coin sets:

1. Coins are divided into batches of 2047
2. First batch merges into the primary coin
3. Subsequent batches merge remaining coins
4. Process continues until all coins are merged

### Can I merge different coin types together?

No, you can only merge coins of the same type. For example:
- SUI coins can only merge with other SUI coins
- USDC coins can only merge with other USDC coins

### What happens to zero-balance coins?

Zero-balance coins can be destroyed using the "Destroy" action, which removes them from your wallet and frees up storage.

---

## Transactions

### How do I simulate a transaction?

In the web app:
1. Go to the Transaction page
2. Paste your Base64-encoded transaction
3. Click "Simulate"

### What's the difference between simulate and execute?

| Action | Gas Cost | On-Chain | Reversible |
|--------|----------|----------|------------|
| Simulate | Free | No | N/A |
| Execute | Yes | Yes | No |

### How do I sign a custom transaction?

1. Prepare your transaction as Base64
2. Paste in the Transaction page
3. Optionally simulate first
4. Click "Sign & Execute"
5. Approve in your wallet

---

## Troubleshooting

### "Missing SUI_ENDPOINT" error

Add the appropriate endpoint to your `.env`:

```bash
SUI_ENDPOINT_MAINNET=https://fullnode.mainnet.sui.io
SUI_ENDPOINT_TESTNET=https://fullnode.testnet.sui.io
```

### "No wallet secret or phrase found"

Your `.env` file must contain either `SUI_WALLET_SECRET` or `SUI_WALLET_PHRASE`.

### Transaction failed

Common causes:
- Insufficient gas
- Object version mismatch (object was modified)
- Invalid transaction data

Try:
1. Refresh coin data
2. Ensure sufficient SUI for gas
3. Try again with fresh object references

### Blank page after deployment

Add SPA routing configuration. For Cloudflare Pages, create `public/_redirects`:

```
/* /index.html 200
```

---

## Security

### Is my private key safe?

Your private key is:
- Stored only in your local `.env` file
- Never transmitted to any server
- Used only for local transaction signing

### Should I use mainnet for testing?

No, always use testnet for testing. Mainnet transactions use real funds.

### How do I revoke wallet connection?

In the web app, click on your connected wallet and select "Disconnect".

---

## Contributing

### How can I contribute?

See the [[Contributing]] guide for:
- Development workflow
- Code standards
- PR guidelines

### How do I report bugs?

Create a GitHub Issue with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)

---

*Have a question not listed here? Open an issue on GitHub!*
