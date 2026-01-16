# SDK Reference

Complete API reference for the SuiLancet SDK.

---

## SuiScriptClient

The main client class for interacting with Sui blockchain.

### Constructor

```typescript
const client = new SuiScriptClient(env: 'testnet' | 'pre-mainnet' | 'mainnet')
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `env` | string | Network environment |

**Example:**
```typescript
import { SuiScriptClient } from 'suilancet'

const client = new SuiScriptClient('mainnet')
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `endpoint` | string | RPC endpoint URL |
| `client` | SuiClient | Underlying Sui client |
| `walletAddress` | string | Active wallet address |

---

## Coin Methods

### getAllCoins

Get all coins owned by the wallet.

```typescript
async getAllCoins(): Promise<CoinObject[]>
```

**Returns:** Array of CoinObject

**Example:**
```typescript
const coins = await client.getAllCoins()
console.log(`Total coins: ${coins.length}`)
```

### getCoinsByType

Get coins of a specific type.

```typescript
async getCoinsByType(coinType: string): Promise<CoinObject[]>
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `coinType` | string | Full coin type identifier |

**Example:**
```typescript
const suiCoins = await client.getCoinsByType(
  '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'
)
```

### getCoinsByTypeV2

Optimized version using direct RPC filtering.

```typescript
async getCoinsByTypeV2(coinType: string): Promise<CoinObject[]>
```

---

## Transaction Methods

### buildInputCoin

Build a coin input for transactions, handling merge and split automatically.

```typescript
async buildInputCoin(
  coins: CoinObject[],
  amount: bigint,
  txb: Transaction
): Promise<TransactionObjectArgument>
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `coins` | CoinObject[] | Available coins |
| `amount` | bigint | Required amount |
| `txb` | Transaction | Transaction builder |

**Example:**
```typescript
const coins = await client.getCoinsByType(coinType)
const txb = new Transaction()

const coin = await client.buildInputCoin(coins, 1000000000n, txb)
// Use coin in subsequent transaction commands
```

### signAndExecuteTransaction

Sign and execute a transaction.

```typescript
async signAndExecuteTransaction(txb: Transaction): Promise<SuiTransactionBlockResponse>
```

**Example:**
```typescript
const txb = new Transaction()
txb.transferObjects([coin], recipientAddress)

const result = await client.signAndExecuteTransaction(txb)
console.log(`Digest: ${result.digest}`)
```

### devInspectTransactionBlock

Simulate a transaction without executing.

```typescript
async devInspectTransactionBlock(txb: Transaction): Promise<DevInspectResults>
```

**Example:**
```typescript
const result = await client.devInspectTransactionBlock(txb)
if (result.effects.status.status === 'success') {
  console.log('Transaction would succeed')
}
```

### sendTransaction

Simulate then execute a transaction.

```typescript
async sendTransaction(txb: Transaction): Promise<SuiTransactionBlockResponse | undefined>
```

**Example:**
```typescript
const result = await client.sendTransaction(txb)
if (result) {
  console.log('Transaction successful:', result.digest)
}
```

---

## Coin Processing Functions

### mergeCoins

Merge all coins of a type into one.

```typescript
import { mergeCoins } from 'suilancet/methods/process_coin'

async function mergeCoins(
  client: SuiScriptClient,
  coinType: string,
  gasObjectId?: string
): Promise<void>
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `client` | SuiScriptClient | Client instance |
| `coinType` | string | Coin type to merge |
| `gasObjectId` | string? | Optional gas coin |

**Example:**
```typescript
await mergeCoins(
  client,
  '0x2::sui::SUI',
  '0x...' // optional gas object
)
```

### batchSplitSuiCoins

Split SUI into multiple coins.

```typescript
async function batchSplitSuiCoins(
  client: SuiScriptClient,
  amountVec: number[],
  gasObjectId: string
): Promise<void>
```

**Example:**
```typescript
const amounts = Array.from({ length: 100 }, () => 1_000_000_000) // 100 x 1 SUI
await batchSplitSuiCoins(client, amounts, gasObjectId)
```

### batchSplitSpecialCoins

Split non-SUI coins into multiple coins.

```typescript
async function batchSplitSpecialCoins(
  client: SuiScriptClient,
  coinObjectId: string,
  amountVec: number[],
  gasObjectId: string
): Promise<void>
```

### batchDestoryZeroCoin

Destroy all zero-balance coins.

```typescript
async function batchDestoryZeroCoin(
  client: SuiScriptClient,
  gasBudget: number,
  gasObjectId: string
): Promise<void>
```

### batchTransferZeroCoin

Transfer all zero-balance coins to another address.

```typescript
async function batchTransferZeroCoin(
  client: SuiScriptClient,
  recipient: string
): Promise<void>
```

### getSpecialAmountCoins

Find coins within a specific balance range.

```typescript
async function getSpecialAmountCoins(
  client: SuiScriptClient,
  minAmount: number,
  maxAmount: number,
  coinType: string
): Promise<CoinObject[]>
```

**Example:**
```typescript
const coins = await getSpecialAmountCoins(
  client,
  1_000_000_000,  // min: 1 SUI
  2_000_000_000,  // max: 2 SUI
  '0x2::sui::SUI'
)
```

### transfer_all_sui_coins

Transfer all SUI coins to another address.

```typescript
async function transfer_all_sui_coins(
  client: SuiScriptClient,
  recipient: string
): Promise<void>
```

---

## Types

### CoinObject

```typescript
interface CoinObject {
  coinType: string
  objectId: string
  balance: number
}
```

### MarginTradingConfig

```typescript
interface MarginTradingConfig {
  adminCap: string
  globalConfig: string
  markets: string
  versioned: string
}
```

---

## Utility Functions

### sleep

Delay execution for specified milliseconds.

```typescript
import { sleep } from 'suilancet'

await sleep(1000) // Wait 1 second
```

### completionCoin

Normalize coin type to full format.

```typescript
import { completionCoin } from 'suilancet/common'

const fullType = completionCoin('0x2::sui::SUI')
// Returns: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'
```

### getObjectRef

Get object reference for transaction building.

```typescript
import { getObjectRef } from 'suilancet/common/object'

const ref = await getObjectRef(client, objectId)
```

### printTransaction

Debug utility to print transaction details.

```typescript
import { printTransaction } from 'suilancet'

const txb = new Transaction()
// ... add commands
await printTransaction(txb)
```

---

## Constants

### MAX_MERGE_PER_TX

Maximum coins that can be merged in single transaction.

```typescript
const MAX_MERGE_PER_TX = 2047  // 1 primary + 2047 others = 2048 total
```

### Margin Trading Config

```typescript
import { marginTradingConfig } from 'suilancet/movecall/margin-trading/const'

const config = marginTradingConfig.get('mainnet')
console.log(config.globalConfig)
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing SUI_ENDPOINT_*` | Environment not configured | Add endpoint to `.env` |
| `No wallet secret or phrase found` | Wallet not configured | Add credentials to `.env` |
| `Insufficient balance` | Not enough coins | Ensure adequate balance |
| `No coins provided` | Empty coin array | Check coin type filter |

### Example Error Handling

```typescript
try {
  const result = await client.sendTransaction(txb)
  if (result) {
    console.log('Success:', result.digest)
  } else {
    console.log('Transaction simulation failed')
  }
} catch (error) {
  if (error.message.includes('Insufficient')) {
    console.log('Need more coins')
  } else {
    throw error
  }
}
```

---

*For more examples, see the tests in `tests/coin.test.ts`*
