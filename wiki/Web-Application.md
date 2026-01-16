# Web Application

Guide to the SuiLancet web interface.

---

## Overview

The web application provides a user-friendly interface for managing Sui wallets and executing transactions.

**Tech Stack:**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- @mysten/dapp-kit (wallet connection)

---

## Getting Started

### Local Development

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Environment Configuration

Create `web/.env.local`:

```bash
VITE_APP_ENV=development
VITE_DEFAULT_NETWORK=testnet
```

| Variable | Values | Description |
|----------|--------|-------------|
| `VITE_APP_ENV` | `development`, `production` | App environment |
| `VITE_DEFAULT_NETWORK` | `mainnet`, `testnet`, `devnet` | Default network |

---

## Features

### Dashboard

The main overview page showing:

- **Wallet Status** - Connection state and address
- **Token Balances** - All coins in wallet
- **Network Info** - Current network selection

### Coin Management

Full coin operations:

| Feature | Description |
|---------|-------------|
| **Merge** | Combine multiple coins into one (up to 2048 per tx) |
| **Split** | Divide a coin into multiple coins |
| **Transfer** | Send coins to another address |
| **Destroy** | Remove zero-balance coins |

#### Merge Coins

1. Select coin type from dropdown
2. View coin count and batch estimate
3. Click "Merge Coins"
4. Approve transaction in wallet

**Batch Processing:**
- Under 2048 coins: Single transaction
- Over 2048 coins: Shows progress bar, multiple transactions needed

### Transaction Page

Simulate and execute Base64-encoded transactions:

1. **Paste TX Data** - Enter Base64-encoded transaction
2. **Simulate** - Test execution without spending gas
3. **Sign & Execute** - Execute the transaction

### Swap

DEX swap interface (planned):

- Cetus Protocol integration
- DeepBook V3 integration
- Price quotes and slippage settings

### Vault

Vault management:

- Deposit tokens to vault
- Withdraw from vault
- View vault balances

### Settings

Configure app settings:

- Network selection
- Theme preferences
- Advanced options

---

## Wallet Connection

### Supported Wallets

| Wallet | Status |
|--------|--------|
| Sui Wallet | Supported |
| Suiet | Supported |
| Ethos Wallet | Supported |
| Martian Wallet | Supported |

### Connecting

1. Click "Connect Wallet" button
2. Select your wallet from the modal
3. Approve connection in wallet extension

### Auto-Connect

The app remembers your last connected wallet and auto-connects on return visits.

---

## UI Components

### Layout

```
┌─────────────────────────────────────────────┐
│  Header                    [Connect Wallet] │
├─────────┬───────────────────────────────────┤
│         │                                   │
│ Sidebar │          Main Content             │
│  - Home │                                   │
│  - Coin │                                   │
│  - TX   │                                   │
│  - Swap │                                   │
│  - Vault│                                   │
│         │                                   │
└─────────┴───────────────────────────────────┘
```

### Styling

Custom TailwindCSS theme with Sui brand colors:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      sui: {
        500: '#6fbcf0',
        600: '#4da2e0',
      }
    }
  }
}
```

---

## Directory Structure

```
web/
├── src/
│   ├── main.tsx              # App entry point
│   ├── App.tsx               # Root component + routes
│   ├── index.css             # Global styles
│   │
│   ├── components/
│   │   ├── Layout/           # Page layout
│   │   │   └── index.tsx
│   │   └── WalletButton/     # Wallet connect button
│   │       └── index.tsx
│   │
│   └── pages/
│       ├── Dashboard/        # Home page
│       ├── Coin/             # Coin management
│       ├── Transaction/      # TX simulation/signing
│       ├── Swap/             # DEX swap
│       ├── Vault/            # Vault operations
│       └── Settings/         # App settings
│
├── public/
│   ├── _redirects            # SPA routing for Cloudflare
│   └── sui-logo.svg          # Logo asset
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Building for Production

```bash
# Build production bundle
npm run build

# Preview production build
npm run preview
```

Output is generated in `web/dist/`.

---

## Troubleshooting

### Wallet Modal Not Showing

**Cause:** Missing dapp-kit CSS

**Solution:** Ensure CSS is imported in `main.tsx`:
```typescript
import '@mysten/dapp-kit/dist/index.css'
```

### Blank Page After Build

**Cause:** Routing issues

**Solution:** Ensure `public/_redirects` exists:
```
/* /index.html 200
```

### TypeScript Errors

**Cause:** Type mismatch between packages

**Solution:** Use type assertions for Transaction:
```typescript
signAndExecute(
  { transaction: txb } as unknown as TransactionInput,
  { onSuccess: () => {...} }
)
```

---

*See also: [[Deployment]] for hosting instructions*
