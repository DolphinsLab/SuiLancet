# SuiLancet SDK 功能文档

> 基于 `@mysten/sui` 构建的 Sui 区块链多项目交互工具集

---

## 目录

1. [架构概览](#架构概览)
2. [核心模块 (Core)](#核心模块-core)
3. [公共 Coin 处理模块](#公共-coin-处理模块)
4. [项目模块](#项目模块)
   - [Cetus Protocol](#cetus-protocol)
   - [DeepBook V3](#deepbook-v3)
   - [Blub Ambassador](#blub-ambassador)
   - [Nave Lending](#nave-lending)
   - [Suilend](#suilend)
   - [Margin Trading](#margin-trading)
   - [HoneyPot](#honeypot)
   - [Vault](#vault)
5. [CLI 命令参考](#cli-命令参考)

---

## 架构概览

```
src/
├── client.ts          # 核心客户端类
├── cli.ts             # CLI 命令行工具
├── index.ts           # 统一导出
├── common/            # 公共工具函数
│   ├── coin.ts        # Coin 地址格式化
│   ├── keypair.ts     # 密钥对处理
│   └── object.ts      # Object 引用获取
├── types/             # 类型定义
│   └── coin.ts        # CoinObject 类型
├── methods/           # 高级业务方法
│   ├── process_coin.ts    # Coin 批量处理
│   ├── vault.ts           # Vault 操作
│   ├── make_money.ts      # 套利/转账
│   ├── destory_honny.ts   # HoneyPot 交易
│   ├── cetus/             # Cetus 相关
│   ├── deepbookv3/        # DeepBook V3 相关
│   ├── blub/              # Blub Ambassador
│   ├── nave/              # Nave Lending
│   ├── suilend/           # Suilend 测试币
│   └── margin_trading/    # 保证金交易
└── movecall/          # Move 合约调用封装
    ├── coin.ts            # 通用 Coin 操作
    ├── vault.ts           # Vault 合约调用
    ├── ns.ts              # NS Token Swap
    ├── cetus/             # Cetus 合约
    ├── deepbookv3/        # DeepBook 合约
    ├── blub/              # Blub 合约
    ├── nave/              # Nave 合约
    ├── suilend/           # Suilend 合约
    ├── margin-trading/    # 保证金合约
    └── honny-hot/         # HoneyPot 合约
```

---

## 核心模块 (Core)

### SuiScriptClient

主客户端类，封装 Sui 网络交互。

**文件**: `src/client.ts`

```typescript
class SuiScriptClient {
  endpoint: string           // RPC 端点
  client: SuiClient         // Sui 客户端实例
  walletAddress: string     // 钱包地址

  constructor(env: "testnet" | "pre-mainnet" | "mainnet")
}
```

#### 构造函数

| 参数 | 类型 | 说明 |
|------|------|------|
| `env` | `"testnet" \| "pre-mainnet" \| "mainnet"` | 网络环境 |

**环境变量要求**:
- `SUI_ENDPOINT_TESTNET` / `SUI_ENDPOINT_PRE_MAINNET` / `SUI_ENDPOINT_MAINNET`
- `SUI_WALLET_SECRET` 或 `SUI_WALLET_PHRASE`

#### 方法列表

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getAllCoins()` | `Promise<CoinObject[]>` | 获取钱包所有代币 |
| `getCoinsByType(coinType)` | `Promise<CoinObject[]>` | 按类型获取代币 |
| `getCoinsByTypeV2(coinType)` | `Promise<CoinObject[]>` | 按类型获取代币 (优化版) |
| `buildInputCoin(coins, amount, txb)` | `Promise<TransactionObjectArgument>` | 构建指定金额的输入 Coin |
| `signAndExecuteTransaction(txb)` | `Promise<SuiTransactionBlockResponse>` | 签名并执行交易 |
| `devInspectTransactionBlock(txb)` | `Promise<DevInspectResults>` | 模拟执行交易 |
| `sendTransaction(txb)` | `Promise<SuiTransactionBlockResponse>` | 发送交易 (含模拟检查) |

---

### 类型定义

**文件**: `src/types/coin.ts`

```typescript
type CoinObject = {
  objectId: string    // Coin 对象 ID
  coinType: string    // 完整的 Coin 类型
  balance: number     // 余额
}
```

---

## 公共 Coin 处理模块

### Common 工具函数

**文件**: `src/common/`

#### completionCoin

补全 Coin 类型地址为 64 位十六进制格式。

```typescript
function completionCoin(s: string): string
```

**示例**:
```typescript
completionCoin("0x2::sui::SUI")
// => "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
```

#### getKeypairFromSecret

从 Base64 编码的密钥创建 Ed25519Keypair。

```typescript
function getKeypairFromSecret(secret: string): Ed25519Keypair
```

#### getObjectRef

获取对象的完整引用 (用于 Gas 支付等)。

```typescript
async function getObjectRef(client: SuiScriptClient, objectId: string): Promise<ObjectRef>
```

#### sleep

异步延时函数。

```typescript
function sleep(ms: number): Promise<void>
```

---

### Movecall - Coin 操作

**文件**: `src/movecall/coin.ts`

| 函数 | 说明 |
|------|------|
| `destoryZeroCoin(txb, objectId, coinType)` | 销毁余额为 0 的 Coin |
| `destoryZeroCoinArg(txb, object, coinType)` | 销毁 Coin (参数形式) |
| `transferOrDestoryCoin(txb, coin, coinType)` | 转移或销毁 Coin |
| `mintZeroCoin(txb, coinType)` | 创建零值 Coin |
| `checkCoinThreshold(txb, coin, coinType, amountLimit, env)` | 检查 Coin 数量阈值 |

---

### Methods - Coin 批量处理

**文件**: `src/methods/process_coin.ts`

#### batchDestoryZeroCoin

批量销毁余额为 0 的代币。

```typescript
async function batchDestoryZeroCoin(
  client: SuiScriptClient,
  gasBudget?: number,
  gas?: string
): Promise<void>
```

#### getSpecialAmountCoins

获取指定余额范围内的代币。

```typescript
async function getSpecialAmountCoins(
  client: SuiScriptClient,
  min_amount: number,
  max_amount: number,
  coinType: string
): Promise<string[]>
```

#### batchSplitSuiCoins

批量分割 SUI 代币。

```typescript
async function batchSplitSuiCoins(
  client: SuiScriptClient,
  amounts: number[],
  gas?: string
): Promise<void>
```

#### batchSplitSpecialCoins

批量分割指定代币。

```typescript
async function batchSplitSpecialCoins(
  client: SuiScriptClient,
  coin_object_id: string,
  amounts: number[],
  gas?: string
): Promise<void>
```

#### mergeCoins

合并同类型代币。

```typescript
async function mergeCoins(
  client: SuiScriptClient,
  coinType: string,
  gas?: string
): Promise<void>
```

#### mergeCoinsAndTransfer

合并代币并转移到指定地址。

```typescript
async function mergeCoinsAndTransfer(
  client: SuiScriptClient,
  coinType: string,
  acceptAddress: string,
  gas?: string
): Promise<void>
```

#### batchTransferZeroCoin

批量转移代币到指定地址。

```typescript
async function batchTransferZeroCoin(
  client: SuiScriptClient,
  acceptAddress: string
): Promise<void>
```

#### batchTransferCoin

批量转移指定类型代币。

```typescript
async function batchTransferCoin(
  client: SuiScriptClient,
  acceptAddress: string,
  coinType: string,
  amount: number
): Promise<void>
```

#### transfer_all_sui_coins

转移所有 SUI 到指定地址。

```typescript
async function transfer_all_sui_coins(
  client: SuiScriptClient,
  recipient: string
): Promise<void>
```

#### refuel_specifal_coin

向指定 Coin 对象补充余额。

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

## 项目模块

### Cetus Protocol

Cetus DEX 交易协议集成。

**文件**: `src/movecall/cetus/swap.ts`, `src/methods/cetus/tick.ts`

#### Swap 函数

| 函数 | 说明 |
|------|------|
| `cetus_swap_a2b_movecall(txb, pool, coin_a, coin_a_type, coin_b_type, env)` | A 代币换 B 代币 |
| `cetus_swap_b2a_movecall(txb, pool, coin_b, coin_a_type, coin_b_type, env)` | B 代币换 A 代币 |

**参数说明**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `txb` | `Transaction` | 交易构建器 |
| `pool` | `string` | Cetus 池子地址 |
| `coin_a/coin_b` | `TransactionObjectArgument` | 输入代币 |
| `coin_a_type` | `string` | A 代币类型 |
| `coin_b_type` | `string` | B 代币类型 |
| `env` | `string` | 环境 (mainnet/testnet) |

#### Tick 查询

```typescript
async function getTicksByRpc(poolId: string): Promise<any>
```

从 Cetus API 获取池子 Tick 数据。

---

### DeepBook V3

DeepBook V3 订单簿 DEX 集成。

**文件**: `src/movecall/deepbookv3/`, `src/methods/deepbookv3/`

#### 核心 Swap 函数

| 函数 | 说明 |
|------|------|
| `swap_exact_base_for_quote_movecall(...)` | Base 代币换 Quote 代币 |
| `swap_exact_quote_for_base_movecall(...)` | Quote 代币换 Base 代币 |

**参数**:
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

#### DEEP Fee 管理

| 函数 | 说明 |
|------|------|
| `withdraw_deep_fee_from_deepbookv3utils_movecall(...)` | 从 Utils 提取 DEEP 费用 |
| `deposit_deep_fee_to_deepbookv3_utils(...)` | 存入 DEEP 费用 |
| `withdraw_deep_fee_from_aggregator_movecall(...)` | 从 Aggregator 提取 DEEP |
| `deposit_deep_fee_to_aggregator_vault_movecall(...)` | 存入 Aggregator Vault |

#### 白名单管理

| 函数 | 说明 |
|------|------|
| `add_into_whitelist_movecall(txb, pool_id, env)` | 添加池子到白名单 |
| `remove_from_whitelist_movecall(txb, pool_id, env)` | 从白名单移除 |
| `add_sponsor_whitelist_address_movecall(...)` | 添加赞助白名单地址 |
| `remove_sponsor_whitelist_address_movecall(...)` | 移除赞助白名单地址 |

#### 配置管理

| 函数 | 说明 |
|------|------|
| `update_package_version_movecall(txb, new_version, env)` | 更新包版本 |
| `set_alternative_payment_movecall(txb, env, is_open)` | 设置替代支付 |
| `update_sponsor_fee_limit_movecall(...)` | 更新赞助费用限制 |
| `init_sponsor_fee_record_movecall(txb, env)` | 初始化赞助费用记录 |

#### Methods 层封装

```typescript
// 初始化白名单
async function init_aggregator_deepbookv3_whitelist(
  client: SuiScriptClient,
  pools: string[],
  env: string
): Promise<void>

// 存入 DEEP 费用 (按金额)
async function deposit_deep_fee_by_amount(
  client: SuiScriptClient,
  amount: bigint,
  env: string
): Promise<void>

// 提取 DEEP 费用
async function withdraw_deep_fee_from_aggregator_vault(
  client: SuiScriptClient,
  amount: string,
  env: string
): Promise<void>
```

---

### Blub Ambassador

Blub Ambassador NFT 系统集成。

**文件**: `src/movecall/blub/ambassador.ts`, `src/methods/blub/ambassador.ts`

#### Movecall 函数

| 函数 | 说明 |
|------|------|
| `query_ambassador_by_owner_movecall(txb, owner, env)` | 查询 Ambassador |
| `create_ambassador_movecall(txb, env)` | 创建 Ambassador |
| `query_ambassador_wait_claimed_rewards_movecall(txb, ambassador_id, env)` | 查询待领取奖励 |

#### Methods 函数

```typescript
// 查询 Ambassador ID
async function query_ambassador_by_owner(
  client: SuiScriptClient,
  owner: string,
  env: string
): Promise<string>

// 创建 Ambassador
async function create_ambassador(
  client: SuiScriptClient,
  env: string
): Promise<void>

// 获取支付信息
async function get_payment_info(
  client: SuiScriptClient,
  ambassador_id: string,
  env: string
): Promise<{
  payment_every_week: number,
  wait_claimed_rewards: number,
  payment_history: Map<number, PaymentHistory>
}>

// 查询待领取奖励
async function query_ambassador_wait_claimed_rewards(
  client: SuiScriptClient,
  ambassador_id: string,
  env: string
): Promise<number>
```

**PaymentHistory 类型**:
```typescript
type PaymentHistory = {
  timestamp: number
  amount: number
  coin_type: string
  usd_amount: number
  calculated_pool_id: string
}
```

---

### Nave Lending

Nave 借贷协议集成。

**文件**: `src/movecall/nave/lending.ts`, `src/methods/nave/lending.ts`

#### 函数

```typescript
// Movecall: 创建账户能力
function createAccountCapMoveCall(txb: Transaction): TransactionObjectArgument

// Methods: 创建账户
async function createAccountCap(client: SuiScriptClient): Promise<void>
```

**合约地址**: `0x834a86970ae93a73faf4fff16ae40bdb72b91c47be585fff19a2af60a19ddca3`

---

### Suilend

Suilend 测试币水龙头。

**文件**: `src/movecall/suilend/steammfe_test_coin.ts`, `src/methods/suilend/steammfe_test_coin.ts`

#### 函数

```typescript
// Movecall: 获取测试币
function get_test_coin_movecall(
  txb: Transaction,
  coin_type: string,
  amount: number
): TransactionObjectArgument

// Methods: 获取 Steammfe 测试币
async function get_steammfe_test_coin(
  client: SuiScriptClient,
  coin_type: string,
  amount: number,
  address?: string
): Promise<void>
```

**支持的测试币类型**:
- `0x2e868e44010e06c0fc925d29f35029b6ef75a50e03d997585980fb2acea45ec6::sui::SUI`
- `0x2e868e44010e06c0fc925d29f35029b6ef75a50e03d997585980fb2acea45ec6::usdc::USDC`

---

### Margin Trading

保证金交易系统。

**文件**: `src/movecall/margin-trading/`, `src/methods/margin_trading/`

#### 配置

```typescript
const MARGIN_TRADING_PUBLISHED_AT = "0xc41dca0f7de9e155862521e4d73386e2a45049c5c3c3fa6033525473fa6c634d"

type MarginTradingConfig = {
  adminCap: string
  globalConfig: string
  markets: string
  versioned: string
}
```

**环境配置**:
- `pre-mainnet`: 预主网配置
- `mainnet`: 主网配置

#### 创建市场

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

#### 更新市场配置

```typescript
// 更新杠杆倍数
async function updateMarketMaxLeverage(
  client: SuiScriptClient,
  env: string,
  params: UpdateMarketMaxLeverageParams
): Promise<void>

// 更新费率
async function updateMarketOpenFeeRate(
  client: SuiScriptClient,
  env: string,
  params: UpdateMarketOpenFeeRateParams
): Promise<void>
```

#### 管理功能

```typescript
// 转移 Admin Cap
async function transferAdminCap(
  client: SuiScriptClient,
  env: string,
  address: string
): Promise<void>

// 转移对象
async function transferObject(
  client: SuiScriptClient,
  env: string,
  object: string,
  address: string
): Promise<void>
```

---

### HoneyPot

HoneyPot 代币交易 (通过 Cetus)。

**文件**: `src/movecall/honny-hot/swap.ts`, `src/methods/destory_honny.ts`

#### 配置

```typescript
type HoneyConfig = {
  coin_type: string
  pool: string
}
```

**预置配置**:
- APU
- FROGS
- PAC
- BOBO
- NUMOGRAM

#### Movecall 函数

```typescript
// 买入 HoneyPot 代币
function buy_honey_pot(
  txb: Transaction,
  honey_config: HoneyConfig,
  amount: number
): TransactionObjectArgument

// 卖出 HoneyPot 代币
function sell_honey_pot(
  txb: Transaction,
  amount_limit: number,
  honey_config: HoneyConfig
): TransactionObjectArgument
```

#### Methods 函数

```typescript
// 循环卖出 HoneyPot 代币
async function destory_honny(
  client: SuiScriptClient,
  coin_type: string
): Promise<void>
```

---

### Vault

代币金库管理。

**文件**: `src/movecall/vault.ts`, `src/methods/vault.ts`

#### 合约地址

```typescript
const vault_published_at = "0x9ef0375d2c22479b97cd0b578798b00d84bb29300e95c12814d1eb870093bdae"
const vault = "0x22e87e53f184eaf1d74fde61ee78e1d96346f9ba350976181fc4013dceb20f7d"
const admin_cap = "0xef22a227d75f2ee6aa51e6b1205d6054b53e424118307ffaf656456832dfabc3"
```

#### Movecall 函数

```typescript
// 存入金库
async function deposit_movecall(
  txb: Transaction,
  coin_object_id: string,
  coin_type: string,
  amount: number
): Promise<void>

// 从金库提取
function withdraw_movecall(
  txb: Transaction,
  coin_type: string,
  amount: number
): TransactionObjectArgument

// 急救包 (批量处理)
function first_aid_packet_movecall(
  txb: Transaction,
  coins: string[]
): void
```

#### Methods 函数

```typescript
// 存入金库
async function deposit_into_vault(
  client: SuiScriptClient,
  coin_object_id: string,
  coin_type: string,
  amount: number
): Promise<void>

// 从金库提取并转移
async function withdraw_from_vault(
  client: SuiScriptClient,
  coin_type: string,
  amount: number,
  target_address: string,
  gas?: string
): Promise<void>

// 急救包
async function first_aid_packet(
  client: SuiScriptClient,
  coins: string[],
  gas?: string
): Promise<void>
```

---

### NS Token Swap

NS Token 多跳交换 (Turbos + FlowX CLMM)。

**文件**: `src/movecall/ns.ts`

```typescript
async function ns_swap_movecall(
  txb: Transaction,
  coin_object_id: string,
  amount: number,
  address: string
): Promise<void>
```

**路径**: SUI → NS (Turbos) → SUI (FlowX CLMM)

---

### 套利/转账方法

**文件**: `src/methods/make_money.ts`

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

#### 循环套利

```typescript
async function circle_swap(
  client: SuiScriptClient,
  amount: number,
  env: string
): Promise<void>
```

**路径**: SUI → DEEP (DeepBook) → USDC (DeepBook) → SUI (Cetus)

#### 转账函数

```typescript
// 按对象 ID 转移
async function transfer_coin(
  client: SuiScriptClient,
  coin_object_id: string,
  address: string
): Promise<void>

// 按代币类型和金额转移
async function transfer_coin_by_coin_type(
  client: SuiScriptClient,
  coin_type: string,
  address: string,
  amount: number
): Promise<void>

// 批量转移对象
async function transfer_objects(
  client: SuiScriptClient,
  objects: string[],
  address: string
): Promise<void>
```

---

## CLI 命令参考

**文件**: `src/cli.ts`

### 全局选项

```bash
cetus-cli [options] [command]

Options:
  -e, --env <env>     网络环境 (testnet, pre-mainnet, mainnet) (default: "mainnet")
  -d, --debug         启用调试模式
  -V, --version       输出版本号
  -h, --help          显示帮助信息
```

### 代币命令 (coin)

```bash
# 销毁零余额代币
cetus-cli coin destroy-zero [-g <gasBudget>] [--gas-object <id>]

# 分割 SUI
cetus-cli coin split-sui -a <amounts>

# 分割指定代币
cetus-cli coin split-coin -i <coinId> -a <amounts>

# 合并代币
cetus-cli coin merge -t <coinType>

# 转移代币
cetus-cli coin transfer -i <coinId> -r <recipient>

# 按类型转移
cetus-cli coin transfer-by-type -t <coinType> -r <recipient> -a <amount>

# 转移所有 SUI
cetus-cli coin transfer-all-sui -r <recipient>

# 批量转移
cetus-cli coin batch-transfer -r <recipient> -t <coinType> -a <amount>

# 获取特定金额范围代币
cetus-cli coin get-special-amount --min <amount> --max <amount> -t <coinType>
```

### 金库命令 (vault)

```bash
# 提取代币
cetus-cli vault withdraw -t <coinType> -a <amount>

# 急救包
cetus-cli vault first-aid -c <coins> [--gas-object <id>]
```

### 对象命令 (object)

```bash
# 转移对象
cetus-cli object transfer -o <objects> -r <recipient>
```

### 查询命令 (query)

```bash
# 钱包信息
cetus-cli query wallet-info

# 查询余额
cetus-cli query balance [-t <coinType>]
```

---

## 环境变量配置

```bash
# RPC 端点
SUI_ENDPOINT_TESTNET=https://...
SUI_ENDPOINT_PRE_MAINNET=https://...
SUI_ENDPOINT_MAINNET=https://...

# 钱包配置 (二选一)
SUI_WALLET_SECRET=<base64-encoded-secret>
SUI_WALLET_PHRASE=<mnemonic-phrase>
```

---

## 依赖说明

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

*文档版本: 0.0.8 | 最后更新: 2026-01-15*
