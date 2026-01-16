# SuiLancet SDK Reference

> Multi-project interaction toolkit for Sui blockchain, built on `@mysten/sui`

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Module](#core-module)
3. [Coin Processing Module](#coin-processing-module)
4. [Project Modules](#project-modules)
   - [Cetus Protocol](#cetus-protocol)
   - [DeepBook V3](#deepbook-v3)
   - [Suilend](#suilend)
   - [Margin Trading](#margin-trading)
   - [HoneyPot](#honeypot)
   - [Vault](#vault)
5. [Transaction Simulation & Signing](#transaction-simulation--signing)
6. [CLI Reference](#cli-reference)
7. [Web Application](#web-application)

---

## Architecture Overview

```
src/
├── client.ts          # Core client class
├── cli.ts             # CLI tool
├── index.ts           # Unified exports
├── common/            # Utility functions
│   ├── coin.ts        # Coin address formatting
│   ├── keypair.ts     # Keypair handling
│   └── object.ts      # Object reference retrieval
├── types/             # Type definitions
│   └── coin.ts        # CoinObject type
├── methods/           # High-level business methods
│   ├── process_coin.ts    # Coin batch processing
│   ├── vault.ts           # Vault operations
│   ├── make_money.ts      # Arbitrage/transfers
│   ├── destory_honny.ts   # HoneyPot trading
│   ├── cetus/             # Cetus related
│   ├── deepbookv3/        # DeepBook V3 related
│   ├── suilend/           # Suilend test coins
│   └── margin_trading/    # Margin trading
└── movecall/          # Move contract call wrappers
    ├── coin.ts            # Generic coin operations
    ├── vault.ts           # Vault contract calls
    ├── ns.ts              # NS Token Swap
    ├── cetus/             # Cetus contracts
    ├── deepbookv3/        # DeepBook contracts
    ├── suilend/           # Suilend contracts
    ├── margin-trading/    # Margin contracts
    └── honny-hot/         # HoneyPot contracts
```

---

## Core Module

### SuiScriptClient

Main client class encapsulating Sui network interactions.

**File**: `src/client.ts`

```typescript
class SuiScriptClient {
  endpoint: string           // RPC endpoint
  client: SuiClient         // Sui client instance
  walletAddress: string     // Wallet address

  constructor(env: "testnet" | "pre-mainnet" | "mainnet")
}
```

#### Constructor

| Parameter | Type | Description |
|-----------|------|-------------|
| `env` | `"testnet" \| "pre-mainnet" \| "mainnet"` | Network environment |

**Required Environment Variables**:
- `SUI_ENDPOINT_TESTNET` / `SUI_ENDPOINT_PRE_MAINNET` / `SUI_ENDPOINT_MAINNET`
- `SUI_WALLET_SECRET` or `SUI_WALLET_PHRASE`

#### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getAllCoins()` | `Promise<CoinObject[]>` | Get all wallet coins |
| `getCoinsByType(coinType)` | `Promise<CoinObject[]>` | Get coins by type |
| `getCoinsByTypeV2(coinType)` | `Promise<CoinObject[]>` | Get coins by type (optimized) |
| `buildInputCoin(coins, amount, txb)` | `Promise<TransactionObjectArgument>` | Build input coin for specified amount |
| `signAndExecuteTransaction(txb)` | `Promise<SuiTransactionBlockResponse>` | Sign and execute transaction |
| `devInspectTransactionBlock(txb)` | `Promise<DevInspectResults>` | Simulate transaction execution |
| `sendTransaction(txb)` | `Promise<SuiTransactionBlockResponse>` | Send transaction (with simulation check) |

---

### Type Definitions

**File**: `src/types/coin.ts`

```typescript
type CoinObject = {
  objectId: string    // Coin object ID
  coinType: string    // Full coin type
  balance: number     // Balance
}
```

---

## Coin Processing Module

### Common Utilities

**File**: `src/common/`

#### completionCoin

Complete coin type address to 64-character hex format.

```typescript
function completionCoin(s: string): string
```

**Example**:
```typescript
completionCoin("0x2::sui::SUI")
// => "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
```

#### getKeypairFromSecret

Create Ed25519Keypair from Base64-encoded secret.

```typescript
function getKeypairFromSecret(secret: string): Ed25519Keypair
```

#### getObjectRef

Get complete object reference (for gas payment, etc.).

```typescript
async function getObjectRef(client: SuiScriptClient, objectId: string): Promise<ObjectRef>
```

#### sleep

Async delay function.

```typescript
function sleep(ms: number): Promise<void>
```

---

### Movecall - Coin Operations

**File**: `src/movecall/coin.ts`

| Function | Description |
|----------|-------------|
| `destoryZeroCoin(txb, objectId, coinType)` | Destroy zero-balance coin |
| `destoryZeroCoinArg(txb, object, coinType)` | Destroy coin (argument form) |
| `transferOrDestoryCoin(txb, coin, coinType)` | Transfer or destroy coin |
| `mintZeroCoin(txb, coinType)` | Create zero-value coin |
| `checkCoinThreshold(txb, coin, coinType, amountLimit, env)` | Check coin amount threshold |

---

### Methods - Coin Batch Processing

**File**: `src/methods/process_coin.ts`

#### batchDestoryZeroCoin

Batch destroy zero-balance coins.

```typescript
async function batchDestoryZeroCoin(
  client: SuiScriptClient,
  gasBudget?: number,
  gas?: string
): Promise<void>
```

#### getSpecialAmountCoins

Get coins within specified balance range.

```typescript
async function getSpecialAmountCoins(
  client: SuiScriptClient,
  min_amount: number,
  max_amount: number,
  coinType: string
): Promise<string[]>
```

#### batchSplitSuiCoins

Batch split SUI coins.

```typescript
async function batchSplitSuiCoins(
  client: SuiScriptClient,
  amounts: number[],
  gas?: string
): Promise<void>
```

#### batchSplitSpecialCoins

Batch split specified coins.

```typescript
async function batchSplitSpecialCoins(
  client: SuiScriptClient,
  coin_object_id: string,
  amounts: number[],
  gas?: string
): Promise<void>
```

#### mergeCoins

Merge coins of same type.

```typescript
async function mergeCoins(
  client: SuiScriptClient,
  coinType: string,
  gas?: string
): Promise<void>
```

#### mergeCoinsAndTransfer

Merge coins and transfer to specified address.

```typescript
async function mergeCoinsAndTransfer(
  client: SuiScriptClient,
  coinType: string,
  acceptAddress: string,
  gas?: string
): Promise<void>
```

#### batchTransferZeroCoin

Batch transfer coins to specified address.

```typescript
async function batchTransferZeroCoin(
  client: SuiScriptClient,
  acceptAddress: string
): Promise<void>
```

#### batchTransferCoin

Batch transfer specified type coins.

```typescript
async function batchTransferCoin(
  client: SuiScriptClient,
  acceptAddress: string,
  coinType: string,
  amount: number
): Promise<void>
```

#### transfer_all_sui_coins

Transfer all SUI to specified address.

```typescript
async function transfer_all_sui_coins(
  client: SuiScriptClient,
  recipient: string
): Promise<void>
```

#### refuel_specifal_coin

Refuel specified coin object with balance.

```typescript
async function refuel_specifal_coin(
  client: SuiScriptClient,
  pure_coin_object_id: string,
  refuel_coin_object_id: string,
  amount: number,
  gas?: string
): Promise<void>
```

---

## Project Modules

### Cetus Protocol

Cetus DEX trading protocol integration.

**Files**: `src/movecall/cetus/swap.ts`, `src/methods/cetus/tick.ts`

#### Swap Functions

| Function | Description |
|----------|-------------|
| `cetus_swap_a2b_movecall(txb, pool, coin_a, coin_a_type, coin_b_type, env)` | Swap token A to B |
| `cetus_swap_b2a_movecall(txb, pool, coin_b, coin_a_type, coin_b_type, env)` | Swap token B to A |

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `txb` | `Transaction` | Transaction builder |
| `pool` | `string` | Cetus pool address |
| `coin_a/coin_b` | `TransactionObjectArgument` | Input coin |
| `coin_a_type` | `string` | Token A type |
| `coin_b_type` | `string` | Token B type |
| `env` | `string` | Environment (mainnet/testnet) |

#### Tick Query

```typescript
async function getTicksByRpc(poolId: string): Promise<any>
```

Get pool tick data from Cetus API.

---

### DeepBook V3

DeepBook V3 order book DEX integration.

**Files**: `src/movecall/deepbookv3/`, `src/methods/deepbookv3/`

#### Core Swap Functions

| Function | Description |
|----------|-------------|
| `swap_exact_base_for_quote_movecall(...)` | Swap base token for quote |
| `swap_exact_quote_for_base_movecall(...)` | Swap quote token for base |

**Parameters**:
```typescript
function swap_exact_base_for_quote_movecall(
  txb: Transaction,
  env: string,
  pool_id: string,
  base_coin: TransactionObjectArgument,
  base_coin_type: string,
  quote_coin_type: string,
  min_quote_out: number
): TransactionObjectArgument[]
```

#### DEEP Fee Management

| Function | Description |
|----------|-------------|
| `withdraw_deep_fee_from_deepbookv3utils_movecall(...)` | Withdraw DEEP fee from Utils |
| `deposit_deep_fee_to_deepbookv3_utils(...)` | Deposit DEEP fee |
| `withdraw_deep_fee_from_aggregator_movecall(...)` | Withdraw DEEP from Aggregator |
| `deposit_deep_fee_to_aggregator_vault_movecall(...)` | Deposit to Aggregator Vault |

#### Whitelist Management

| Function | Description |
|----------|-------------|
| `add_into_whitelist_movecall(txb, pool_id, env)` | Add pool to whitelist |
| `remove_from_whitelist_movecall(txb, pool_id, env)` | Remove from whitelist |
| `add_sponsor_whitelist_address_movecall(...)` | Add sponsor whitelist address |
| `remove_sponsor_whitelist_address_movecall(...)` | Remove sponsor whitelist address |

#### Configuration Management

| Function | Description |
|----------|-------------|
| `update_package_version_movecall(txb, new_version, env)` | Update package version |
| `set_alternative_payment_movecall(txb, env, is_open)` | Set alternative payment |
| `update_sponsor_fee_limit_movecall(...)` | Update sponsor fee limit |
| `init_sponsor_fee_record_movecall(txb, env)` | Initialize sponsor fee record |

#### Methods Layer Wrappers

```typescript
// Initialize whitelist
async function init_aggregator_deepbookv3_whitelist(
  client: SuiScriptClient,
  pools: string[],
  env: string
): Promise<void>

// Deposit DEEP fee by amount
async function deposit_deep_fee_by_amount(
  client: SuiScriptClient,
  amount: bigint,
  env: string
): Promise<void>

// Withdraw DEEP fee
async function withdraw_deep_fee_from_aggregator_vault(
  client: SuiScriptClient,
  amount: string,
  env: string
): Promise<void>
```

---

### Suilend

Suilend test coin faucet.

**Files**: `src/movecall/suilend/steammfe_test_coin.ts`, `src/methods/suilend/steammfe_test_coin.ts`

#### Functions

```typescript
// Movecall: Get test coin
function get_test_coin_movecall(
  txb: Transaction,
  coin_type: string,
  amount: number
): TransactionObjectArgument

// Methods: Get Steammfe test coin
async function get_steammfe_test_coin(
  client: SuiScriptClient,
  coin_type: string,
  amount: number,
  address?: string
): Promise<void>
```

**Supported Test Coin Types**:
- `0x2e868e44010e06c0fc925d29f35029b6ef75a50e03d997585980fb2acea45ec6::sui::SUI`
- `0x2e868e44010e06c0fc925d29f35029b6ef75a50e03d997585980fb2acea45ec6::usdc::USDC`

---

### Margin Trading

Margin trading system.

**Files**: `src/movecall/margin-trading/`, `src/methods/margin_trading/`

#### Configuration

```typescript
const MARGIN_TRADING_PUBLISHED_AT = "0xc41dca0f7de9e155862521e4d73386e2a45049c5c3c3fa6033525473fa6c634d"

type MarginTradingConfig = {
  adminCap: string
  globalConfig: string
  markets: string
  versioned: string
}
```

**Environment Configs**:
- `pre-mainnet`: Pre-mainnet configuration
- `mainnet`: Mainnet configuration

#### Create Market

```typescript
type CreateMarketParams = {
  baseCoinType: string
  quoteCoinType: string
  maxLongLeverage: number
  maxShortLeverage: number
  openFeeRate: number
  closeFeeRate: number
}

async function createMarket(
  client: SuiScriptClient,
  env: string,
  params: CreateMarketParams
): Promise<void>
```

#### Update Market Configuration

```typescript
// Update leverage
async function updateMarketMaxLeverage(
  client: SuiScriptClient,
  env: string,
  params: UpdateMarketMaxLeverageParams
): Promise<void>

// Update fee rate
async function updateMarketOpenFeeRate(
  client: SuiScriptClient,
  env: string,
  params: UpdateMarketOpenFeeRateParams
): Promise<void>
```

#### Admin Functions

```typescript
// Transfer Admin Cap
async function transferAdminCap(
  client: SuiScriptClient,
  env: string,
  address: string
): Promise<void>

// Transfer object
async function transferObject(
  client: SuiScriptClient,
  env: string,
  object: string,
  address: string
): Promise<void>
```

---

### HoneyPot

HoneyPot token trading (via Cetus).

**Files**: `src/movecall/honny-hot/swap.ts`, `src/methods/destory_honny.ts`

#### Configuration

```typescript
type HoneyConfig = {
  coin_type: string
  pool: string
}
```

**Preset Configs**: APU, FROGS, PAC, BOBO, NUMOGRAM

#### Movecall Functions

```typescript
// Buy HoneyPot token
function buy_honey_pot(
  txb: Transaction,
  honey_config: HoneyConfig,
  amount: number
): TransactionObjectArgument

// Sell HoneyPot token
function sell_honey_pot(
  txb: Transaction,
  amount_limit: number,
  honey_config: HoneyConfig
): TransactionObjectArgument
```

#### Methods Functions

```typescript
// Loop sell HoneyPot tokens
async function destory_honny(
  client: SuiScriptClient,
  coin_type: string
): Promise<void>
```

---

### Vault

Token vault management.

**Files**: `src/movecall/vault.ts`, `src/methods/vault.ts`

#### Contract Addresses

```typescript
const vault_published_at = "0x9ef0375d2c22479b97cd0b578798b00d84bb29300e95c12814d1eb870093bdae"
const vault = "0x22e87e53f184eaf1d74fde61ee78e1d96346f9ba350976181fc4013dceb20f7d"
const admin_cap = "0xef22a227d75f2ee6aa51e6b1205d6054b53e424118307ffaf656456832dfabc3"
```

#### Movecall Functions

```typescript
// Deposit to vault
async function deposit_movecall(
  txb: Transaction,
  coin_object_id: string,
  coin_type: string,
  amount: number
): Promise<void>

// Withdraw from vault
function withdraw_movecall(
  txb: Transaction,
  coin_type: string,
  amount: number
): TransactionObjectArgument

// First aid packet (batch processing)
function first_aid_packet_movecall(
  txb: Transaction,
  coins: string[]
): void
```

#### Methods Functions

```typescript
// Deposit to vault
async function deposit_into_vault(
  client: SuiScriptClient,
  coin_object_id: string,
  coin_type: string,
  amount: number
): Promise<void>

// Withdraw from vault and transfer
async function withdraw_from_vault(
  client: SuiScriptClient,
  coin_type: string,
  amount: number,
  target_address: string,
  gas?: string
): Promise<void>

// First aid packet
async function first_aid_packet(
  client: SuiScriptClient,
  coins: string[],
  gas?: string
): Promise<void>
```

---

### NS Token Swap

NS Token multi-hop swap (Turbos + FlowX CLMM).

**File**: `src/movecall/ns.ts`

```typescript
async function ns_swap_movecall(
  txb: Transaction,
  coin_object_id: string,
  amount: number,
  address: string
): Promise<void>
```

**Path**: SUI → NS (Turbos) → SUI (FlowX CLMM)

---

### Arbitrage/Transfer Methods

**File**: `src/methods/make_money.ts`

#### Swap + Market Order

```typescript
async function swap_then_place_market_order(
  client: SuiScriptClient,
  amount: number,
  cetus_pool: string,
  deep_pool: string,
  coin_a_type: string,
  coin_b_type: string,
  swap_first: boolean,
  env: string
): Promise<void>
```

#### Circle Arbitrage

```typescript
async function circle_swap(
  client: SuiScriptClient,
  amount: number,
  env: string
): Promise<void>
```

**Path**: SUI → DEEP (DeepBook) → USDC (DeepBook) → SUI (Cetus)

---

## Transaction Simulation & Signing

For simulating and signing Base64-encoded TransactionData.

**Files**: `src/transaction/simulator.ts`, `src/transaction/signer.ts`

### Transaction Simulator

#### simulateTransaction

Simulate Base64-encoded transaction data.

```typescript
interface SimulationResult {
  success: boolean
  gasUsed: string
  effects: TransactionEffects
  events: SuiEvent[]
  error?: string
}

async function simulateTransaction(
  client: SuiClient,
  txBase64: string,
  sender: string
): Promise<SimulationResult>
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `client` | `SuiClient` | Sui client instance |
| `txBase64` | `string` | Base64-encoded TransactionData |
| `sender` | `string` | Sender address |

**Returns**:

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether simulation succeeded |
| `gasUsed` | `string` | Estimated gas consumption |
| `effects` | `TransactionEffects` | Transaction effects |
| `events` | `SuiEvent[]` | Triggered events |
| `error` | `string?` | Error message (if any) |

#### parseTransactionData

Parse Base64-encoded transaction data.

```typescript
interface ParsedTransaction {
  sender: string
  gasData: GasData
  commands: TransactionCommand[]
  inputs: TransactionInput[]
}

function parseTransactionData(txBase64: string): ParsedTransaction
```

### Transaction Signer

#### signTransaction

Sign Base64-encoded transaction data.

```typescript
interface SignedTransaction {
  txBytes: string      // Signed transaction bytes
  signature: string    // Signature
}

async function signTransaction(
  keypair: Ed25519Keypair,
  txBase64: string
): Promise<SignedTransaction>
```

#### signAndExecuteTransaction

Sign and execute transaction.

```typescript
async function signAndExecuteTransaction(
  client: SuiClient,
  keypair: Ed25519Keypair,
  txBase64: string
): Promise<SuiTransactionBlockResponse>
```

### Usage Example

```typescript
import { simulateTransaction, signAndExecuteTransaction } from './transaction'

// 1. Simulate transaction
const txBase64 = "AAA..." // Base64 encoded transaction
const simulation = await simulateTransaction(client, txBase64, senderAddress)

if (simulation.success) {
  console.log(`Gas estimate: ${simulation.gasUsed}`)

  // 2. Sign and execute
  const result = await signAndExecuteTransaction(client, keypair, txBase64)
  console.log(`Transaction digest: ${result.digest}`)
} else {
  console.error(`Simulation failed: ${simulation.error}`)
}
```

---

#### Transfer Functions

```typescript
// Transfer by object ID
async function transfer_coin(
  client: SuiScriptClient,
  coin_object_id: string,
  address: string
): Promise<void>

// Transfer by coin type and amount
async function transfer_coin_by_coin_type(
  client: SuiScriptClient,
  coin_type: string,
  address: string,
  amount: number
): Promise<void>

// Batch transfer objects
async function transfer_objects(
  client: SuiScriptClient,
  objects: string[],
  address: string
): Promise<void>
```

---

## CLI Reference

**File**: `src/cli.ts`

### Global Options

```bash
cetus-cli [options] [command]

Options:
  -e, --env <env>     Network environment (testnet, pre-mainnet, mainnet) (default: "mainnet")
  -d, --debug         Enable debug mode
  -V, --version       Show version number
  -h, --help          Show help information
```

### Coin Commands

```bash
# Destroy zero-balance coins
cetus-cli coin destroy-zero [-g <gasBudget>] [--gas-object <id>]

# Split SUI
cetus-cli coin split-sui -a <amounts>

# Split specified coin
cetus-cli coin split-coin -i <coinId> -a <amounts>

# Merge coins
cetus-cli coin merge -t <coinType>

# Transfer coin
cetus-cli coin transfer -i <coinId> -r <recipient>

# Transfer by type
cetus-cli coin transfer-by-type -t <coinType> -r <recipient> -a <amount>

# Transfer all SUI
cetus-cli coin transfer-all-sui -r <recipient>

# Batch transfer
cetus-cli coin batch-transfer -r <recipient> -t <coinType> -a <amount>

# Get coins in amount range
cetus-cli coin get-special-amount --min <amount> --max <amount> -t <coinType>
```

### Vault Commands

```bash
# Withdraw coins
cetus-cli vault withdraw -t <coinType> -a <amount>

# First aid packet
cetus-cli vault first-aid -c <coins> [--gas-object <id>]
```

### Object Commands

```bash
# Transfer objects
cetus-cli object transfer -o <objects> -r <recipient>
```

### Query Commands

```bash
# Wallet info
cetus-cli query wallet-info

# Query balance
cetus-cli query balance [-t <coinType>]
```

---

## Environment Variables

```bash
# RPC Endpoints
SUI_ENDPOINT_TESTNET=https://...
SUI_ENDPOINT_PRE_MAINNET=https://...
SUI_ENDPOINT_MAINNET=https://...

# Wallet Configuration (choose one)
SUI_WALLET_SECRET=<base64-encoded-secret>
SUI_WALLET_PHRASE=<mnemonic-phrase>
```

---

## Dependencies

```json
{
  "@mysten/sui": "^1.6.0",
  "@cetusprotocol/aggregator-sdk": "^0.3.1",
  "commander": "^12.0.0",
  "dotenv": "^16.4.5",
  "bip39": "^3.1.0"
}
```

---

## Web Application

Web management interface built with React + Vite.

### Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Wallet Connection**: @mysten/dapp-kit (Sui Wallet Kit)
- **UI Components**: TailwindCSS + Headless UI
- **State Management**: Zustand

### Directory Structure

```
web/
├── src/
│   ├── components/        # Common components
│   │   ├── Layout/       # Layout component
│   │   ├── WalletButton/ # Wallet connect button
│   │   └── common/       # Common UI components
│   ├── pages/            # Pages
│   │   ├── Dashboard/    # Dashboard
│   │   ├── Coin/         # Coin management
│   │   ├── Transaction/  # Transaction simulation/signing
│   │   ├── Swap/         # DEX swap
│   │   ├── Vault/        # Vault management
│   │   └── Settings/     # Settings
│   ├── hooks/            # Custom hooks
│   ├── stores/           # Zustand stores
│   ├── services/         # API services
│   └── utils/            # Utility functions
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

### Feature Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Wallet overview, token balances, recent transactions |
| **Coin Management** | Merge/split/transfer coins, destroy zero-balance coins |
| **Transaction Simulation** | Input Base64 TX data, simulate execution, view results |
| **Transaction Signing** | Sign transactions, execute transactions |
| **DEX Swap** | Cetus/DeepBook swap interface |
| **Vault** | Vault deposit/withdraw operations |

### Wallet Integration

```typescript
import { WalletKitProvider, ConnectButton } from '@mysten/dapp-kit'

// Supported wallets:
// - Sui Wallet
// - Suiet
// - Ethos Wallet
// - Martian Wallet
```

---

*Document version: 0.1.0 | Last updated: 2026-01-15*
