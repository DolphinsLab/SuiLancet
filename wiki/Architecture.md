# Architecture

This document describes the architecture and design of SuiLancet.

---

## Overview

SuiLancet follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Applications                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   CLI Tool  │  │   Web App   │  │   Scripts   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                    Methods Layer                         │
│  High-level business logic (process_coin, vault, etc.)  │
├─────────────────────────────────────────────────────────┤
│                    Movecall Layer                        │
│  Low-level Move contract call wrappers                   │
├─────────────────────────────────────────────────────────┤
│                    Core Layer                            │
│  SuiScriptClient, utilities, types                       │
├─────────────────────────────────────────────────────────┤
│                    @mysten/sui SDK                       │
└─────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
SuiLancet/
├── src/                    # Source code
│   ├── index.ts           # Main exports
│   ├── client.ts          # Core client class
│   ├── cli.ts             # CLI implementation
│   │
│   ├── common/            # Shared utilities
│   │   ├── index.ts       # Exports
│   │   ├── coin.ts        # Coin utilities
│   │   ├── keypair.ts     # Keypair utilities
│   │   └── object.ts      # Object utilities
│   │
│   ├── types/             # Type definitions
│   │   ├── index.ts
│   │   └── coin.ts        # CoinObject type
│   │
│   ├── methods/           # High-level methods
│   │   ├── index.ts
│   │   ├── process_coin.ts    # Coin batch operations
│   │   ├── vault.ts           # Vault operations
│   │   ├── make_money.ts      # Arbitrage/transfers
│   │   ├── destory_honny.ts   # HoneyPot trading
│   │   ├── cetus/             # Cetus methods
│   │   ├── deepbookv3/        # DeepBook methods
│   │   ├── suilend/           # Suilend methods
│   │   └── margin_trading/    # Margin methods
│   │
│   └── movecall/          # Move contract calls
│       ├── index.ts
│       ├── coin.ts            # Coin operations
│       ├── vault.ts           # Vault calls
│       ├── ns.ts              # NS swap
│       ├── cetus/             # Cetus contracts
│       ├── deepbookv3/        # DeepBook contracts
│       ├── suilend/           # Suilend contracts
│       ├── margin-trading/    # Margin contracts
│       └── honny-hot/         # HoneyPot contracts
│
├── web/                    # Web application
│   ├── src/
│   │   ├── main.tsx       # Entry point
│   │   ├── App.tsx        # Root component
│   │   ├── components/    # Reusable components
│   │   └── pages/         # Page components
│   ├── public/
│   └── package.json
│
├── tests/                  # Test files
├── docs/                   # Documentation
└── wiki/                   # Wiki pages
```

---

## Core Components

### SuiScriptClient

The central class for all Sui blockchain interactions.

```typescript
class SuiScriptClient {
  endpoint: string           // RPC endpoint URL
  client: SuiClient         // @mysten/sui client
  walletAddress: string     // Active wallet address

  constructor(env: "testnet" | "pre-mainnet" | "mainnet")

  // Coin methods
  getAllCoins(): Promise<CoinObject[]>
  getCoinsByType(coinType: string): Promise<CoinObject[]>
  buildInputCoin(coins, amount, txb): Promise<TransactionObjectArgument>

  // Transaction methods
  signAndExecuteTransaction(txb): Promise<SuiTransactionBlockResponse>
  devInspectTransactionBlock(txb): Promise<DevInspectResults>
  sendTransaction(txb): Promise<SuiTransactionBlockResponse>
}
```

### Methods Layer

High-level business logic that combines multiple movecalls:

| Module | Purpose |
|--------|---------|
| `process_coin.ts` | Batch coin operations (merge, split, transfer) |
| `vault.ts` | Vault deposit/withdraw |
| `make_money.ts` | Arbitrage and transfers |
| `deepbookv3/` | DeepBook fee management, whitelist |
| `cetus/` | Pool tick queries |

### Movecall Layer

Low-level Move contract call wrappers:

```typescript
// Example: Cetus swap
function cetus_swap_a2b_movecall(
  txb: Transaction,
  pool: string,
  coin_a: TransactionObjectArgument,
  coin_a_type: string,
  coin_b_type: string,
  env: string
): TransactionObjectArgument[]
```

---

## Data Flow

### CLI Command Flow

```
User Command
    │
    ▼
┌─────────────┐
│   cli.ts    │  Parse arguments, validate
└─────────────┘
    │
    ▼
┌─────────────┐
│  Methods    │  Build transaction logic
└─────────────┘
    │
    ▼
┌─────────────┐
│  Movecall   │  Create Move function calls
└─────────────┘
    │
    ▼
┌─────────────┐
│  Client     │  Sign and execute
└─────────────┘
    │
    ▼
Sui Blockchain
```

### Web App Flow

```
User Action
    │
    ▼
┌─────────────┐
│  React UI   │  User interface
└─────────────┘
    │
    ▼
┌─────────────┐
│  dapp-kit   │  Wallet connection
└─────────────┘
    │
    ▼
┌─────────────┐
│ Transaction │  Build TX
└─────────────┘
    │
    ▼
┌─────────────┐
│   Wallet    │  Sign (external)
└─────────────┘
    │
    ▼
Sui Blockchain
```

---

## Key Design Decisions

### 1. Environment-based Configuration

Multiple network support via environment variables:
- `testnet` - For development and testing
- `pre-mainnet` - For staging
- `mainnet` - For production

### 2. Batch Processing Limits

Transaction size limits handled automatically:
- **Merge coins**: Max 2048 per transaction (1 + 2047)
- **Transfer objects**: Batched as needed
- **Zero coin destroy**: Batched processing

### 3. Transaction Safety

All transactions go through simulation before execution:
```typescript
async sendTransaction(txb: Transaction) {
  // 1. Simulate first
  const devInspectRes = await this.devInspectTransactionBlock(txb)
  if (devInspectRes.effects.status.status !== "success") {
    return  // Don't execute if simulation fails
  }

  // 2. Execute only if simulation succeeds
  return await this.signAndExecuteTransaction(txb)
}
```

### 4. Type Safety

Full TypeScript coverage with strict typing:
```typescript
type CoinObject = {
  objectId: string
  coinType: string
  balance: number
}
```

---

## Module Dependencies

```
                 ┌──────────┐
                 │  cli.ts  │
                 └────┬─────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ methods/ │ │ methods/ │ │ methods/ │
    │  coin    │ │  vault   │ │   dex    │
    └────┬─────┘ └────┬─────┘ └────┬─────┘
         │            │            │
         └────────────┼────────────┘
                      ▼
              ┌──────────────┐
              │   movecall/  │
              └──────┬───────┘
                     ▼
              ┌──────────────┐
              │   client.ts  │
              └──────┬───────┘
                     ▼
              ┌──────────────┐
              │  @mysten/sui │
              └──────────────┘
```

---

*See also: [[SDK Reference]] for complete API documentation*
