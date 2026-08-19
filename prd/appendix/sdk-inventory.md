# TypeScript SDK 公共能力清单

> 包名：`sui-lancet`
> 版本：2.0.0
> 顶层命名空间：`clean`、`manage`、`secure`、`query`、`defi`

## 1. Core

### `createSuiGrpcClient(network, baseUrl)`

创建 Sui gRPC 客户端，是 SDK 当前唯一的链上 Transport。

### `new SuiScriptClient(env)`

`env` 支持 `testnet | pre-mainnet | mainnet`。构造时读取网络地址和本地钱包凭证，并暴露：

| 方法 | 产品行为 |
|---|---|
| `buildAccount()` | 从 Base64 Secret 或助记词构造 Ed25519 Keypair |
| `getAllCoins()` | 扫描全部 Owned Object，返回全部 Coin Object |
| `getCoinsByType(coinType)` | 对完整 Coin 清单按标准化类型过滤 |
| `getCoinsByTypeV2(coinType)` | 通过 gRPC `listCoins` 分页查询指定 Coin Type |
| `buildInputCoin(coins, amount, tx)` | 选择足额 Coin、必要时合并，再拆出目标数量 |
| `signAndExecuteTransaction(tx)` | 本地签名并执行，返回 effects/events/transaction/balance changes |
| `devInspectTransactionBlock(tx)` | 关闭检查进行交易模拟，返回 effects/events/balance changes/command results |
| `sendTransaction(tx)` | 先模拟，成功后签名执行；模拟失败时不抛错而返回 `undefined` |
| `printTransaction(tx, isPrint)` | 把 Transaction 的 inputs 和 commands 输出到控制台，供调试使用 |

公共结果通常使用 `CommandResult`：`success`、`message`、可选 `data`。

## 2. Clean 命名空间

| API | 关键参数 | 行为 |
|---|---|---|
| `batchDestroyZeroCoin` | gasBudget、gasObject、dryRun | 500 个/批销毁零余额 Coin，每批先模拟 |
| `mergeCoins` | coinType、gasObject、dryRun | 最多选择 1,200 个同类型 Coin 合并 |
| `cleanDust` | threshold、includeUnknown、dryRun、gasBudget、gasObject | 按 USD 阈值识别粉尘，400 个/批处理 |
| `scanAirdrops` | client | 启发式识别高/中风险空投 Coin |
| `destroyAirdrops` | riskLevel、dryRun、gasObject | 只销毁达到阈值且余额为 0 的可疑 Coin |

## 3. Manage 命名空间

### 转移

| API | 行为 |
|---|---|
| `transferCoin` | 转移指定 Coin Object |
| `transferCoinByType` | 从同类型 Coin 中构造指定最小单位金额并转移 |
| `transferAllSui` | 把交易 Gas Coin 全部转给目标地址 |
| `batchTransferCoin` | 转移指定数量的 Coin Object |
| `transferObjects` | 批量转移任意 Object ID |

### 拆分

| API | 行为 |
|---|---|
| `splitSuiCoins` | 从 `tx.gas` 拆出多个指定金额 Coin 并转回自己 |
| `splitSpecialCoin` | 从指定 Coin 拆分并转回自己；该 Coin 是 Gas 时改用 `tx.gas` |

### Vault

| API | 行为 |
|---|---|
| `depositIntoVault` | 调用固定部署的 Vault `deposit` |
| `withdrawFromVault` | 使用固定 AdminCap 从 Vault 提取并转给目标地址 |
| `firstAidPacket` | 对 Coin 列表逐一调用固定合约急救方法 |

### 钱包迁移

| API | 行为 |
|---|---|
| `previewMigration` | 按 coin/object/all、批大小和排除列表生成迁移计划 |
| `executeMigration` | 非 SUI Coin → 其他 Object → SUI 三阶段执行迁移 |

### Kiosk

| API | 行为 |
|---|---|
| `listKiosks` | 由 KioskOwnerCap 反查 Kiosk 信息 |
| `showKiosk` | 扫描 Kiosk Dynamic Fields 中的 Item |
| `takeFromKiosk` | 调用 `0x2::kiosk::take` 并把 Item 转回钱包 |
| `withdrawKioskProfits` | 调用 `0x2::kiosk::withdraw` 提取全部收益 |

## 4. Secure 命名空间

| API | 行为 | 主要返回 |
|---|---|---|
| `simulateTransaction` | 模拟 Base64 交易 | 状态、Gas、余额/Object 变化、事件 |
| `simulateTransactionBlock` | 构建 Transaction 后转 Base64 并复用模拟 | 同上 |
| `scanWalletSecurity` | 扫描 Owned Object、Coin Type 和 Metadata | 0–100 分、安全等级、Finding 列表 |
| `getGasInfo` | 获取参考 Gas Price 与 Checkpoint | simple/moderate/complex 三档预算 |
| `estimateGas` | 模拟交易并计算净 Gas | 各成本与净成本 +20% 建议 |

## 5. Query 命名空间

| API | 默认值 | 行为 |
|---|---|---|
| `getAssetOverview` | — | 按 Coin Type 汇总数量和总余额，按总余额降序 |
| `getSpecialAmountCoins` | — | 返回余额位于闭区间内的指定类型 Coin ID |
| `getTransactionHistory` | 20 笔 | 查询当前钱包作为 sender 的交易，分类并补充时间戳 |
| `parseTransaction` | — | 获取单笔交易的状态、Gas、余额/Object 变化和事件 |
| `inspectObject` | — | 获取 Object ID、版本、摘要、类型、Owner、Display 和字段 |
| `listDynamicFields` | 20 条 | 分页列出动态字段；Name 的 BCS 值以 Base64 返回 |

交易分类枚举见[枚举字典](./enum-dictionary.md)。

## 6. DeFi 命名空间

| API | 行为 |
|---|---|
| `fetchAllPositions` | 并行扫描选定分类，按需补充 USD 价格并生成 PortfolioSummary |
| `getDefiPositions` | CLI 友好的 `CommandResult` 包装 |
| `fetchNaviPositions` | 解析 NAVI Obligation |
| `fetchSuilendPositions` | 解析 Suilend Obligation |
| `fetchScallopPositions` | 解析 Scallop Obligation 与疑似 MarketCoin 余额 |
| `fetchCetusPositions` | 解析 Cetus CLMM Position |
| `fetchTurbosPositions` | 解析 Turbos Position NFT |
| `fetchLiquidStakingPositions` | 识别 4 种 LST 与原生 `StakedSui` |

`fetchAllPositions` 接受：

- `categories`: `lending | lp | staking` 数组，默认全部。
- `withPricing`: 是否调用 DexScreener，默认 true。

某一协议适配器失败时会被 `Promise.allSettled` 吞掉，组合结果仍成功返回其他协议数据。

## 7. Common 与低层 Move Call

### Common

| API | 行为 |
|---|---|
| `getKeypairFromSecret` | 从 Base64 Secret 构造 Ed25519 Keypair |
| `completionCoin` | 把短 Package 地址补齐为 64 位十六进制 |
| `fetchSuiPrice` / `fetchTokenPrices` | 从 DexScreener 获取价格 |
| `getCoinDecimals` | 读取 Coin Metadata，失败时回退 9 |
| `listAllBalances` | 分页读取全部 Token Balance |
| `sleep` | Promise 延时工具 |

### 顶层低层 Move Call

| API | 行为 |
|---|---|
| `destoryZeroCoin` / `destoryZeroCoinArg` | 构造 `0x2::coin::destroy_zero` 调用 |
| `transferOrDestoryCoin` | 构造固定 Utils 合约的 transfer-or-destroy 调用 |
| `mintZeroCoin` | 构造 `0x2::coin::zero` 调用 |
| `deposit_movecall` | 构造固定 Vault 存款调用 |
| `withdraw_movecall` | 构造固定 Vault 提款调用 |
| `first_aid_packet_movecall` | 为多个 Coin 构造固定急救调用 |

注意：这些低层函数只负责把命令加入 Transaction，不负责完整校验、模拟或执行。
