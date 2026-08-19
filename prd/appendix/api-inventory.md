# 外部接口与链上依赖

SuiLancet 没有内置业务后端。Web、CLI 和 SDK 主要直接访问 Sui gRPC；Dolphin ID 登录需要部署方提供认证端点；Token 价格来自 DexScreener。

## 1. Sui gRPC / Core API

| 能力 | 方法 | 触发场景 | 关键参数/返回 |
|---|---|---|---|
| 钱包全部 Object | `core.listOwnedObjects` | Coin 扫描、迁移、DeFi、安全扫描 | owner、type、cursor、limit=50、可选 JSON |
| 指定类型 Coin | `core.listCoins` | `query find-coins`、SDK 类型查询 | owner、coinType、cursor、limit=50 |
| Token 汇总余额 | `core.listBalances` | Dashboard、DeFi LST/Scallop | owner、cursor、limit=50 |
| SUI 余额 | `core.getBalance` | Web Dashboard | owner |
| Coin Metadata | `core.getCoinMetadata` | decimals、空投和钱包安全扫描 | coinType |
| Object 详情 | `core.getObject` | Object Inspector、Gas Ref、Kiosk | objectId、include JSON/Display |
| Dynamic Fields | `core.listDynamicFields` | Kiosk 内容、Object 动态字段 | parentId、cursor、limit |
| 交易列表 | `core.listTransactions` | CLI/SDK 历史 | sender filter、descending、before |
| 交易详情 | `core.getTransaction` | Web/CLI/SDK 单笔查询 | digest、effects/events/balance changes |
| 交易模拟 | `core.simulateTransaction` | Web Secure、SDK 写前模拟、Gas 估算 | Transaction、include flags |
| 签名执行 | `core.signAndExecuteTransaction` | CLI/SDK 写操作 | Transaction、Ed25519 signer |
| 参考 Gas Price | `core.getReferenceGasPrice` | Gas Info | 当前 epoch 参考值 |
| 服务信息 | `ledgerService.getServiceInfo` | Gas Info | 最新 Checkpoint Height |
| 批量交易时间 | `ledgerService.batchGetTransactions` | 交易历史补时间戳 | 最多 50 个 digest/批 |

### 网络地址

| 入口 | 网络 | 配置 |
|---|---|---|
| Web | mainnet | `VITE_SUI_GRPC_MAINNET`，默认官方 Fullnode |
| Web | testnet | `VITE_SUI_GRPC_TESTNET`，默认官方 Fullnode |
| Web | devnet | `VITE_SUI_GRPC_DEVNET`，默认官方 Fullnode |
| CLI/SDK | mainnet | `SUI_GRPC_ENDPOINT_MAINNET`，必须配置 |
| CLI/SDK | testnet | `SUI_GRPC_ENDPOINT_TESTNET`，必须配置 |
| CLI/SDK | pre-mainnet | `SUI_GRPC_ENDPOINT_PRE_MAINNET`，必须配置 |

## 2. 浏览器钱包接口

Web 使用 `@mysten/dapp-kit-react`：

| 能力 | 触发 | 结果 |
|---|---|---|
| 钱包连接 | 顶部 Connect Wallet | 当前账户、钱包与网络状态 |
| 网络切换 | Settings 网络按钮 | 切换当前 gRPC Client |
| 签名执行 | Clean、Manage、Secure | 钱包弹窗确认并返回交易结果 |

Web 不存储私钥。CLI/SDK 则从进程环境变量加载密钥材料。

## 3. Dolphin ID 认证端点

| 端点 | 方法/用途 | 默认路径 | 状态 |
|---|---|---|---|
| Nonce | 获取登录挑战 | `/auth/nonce` | 由 Dolphin SDK 调用 |
| Verify | 验证 Sui 个人消息签名并创建会话 | `/auth/verify` | 由 Dolphin SDK 调用 |
| Refresh | 刷新会话 | `/auth/refresh` | 由 Dolphin SDK 调用 |
| Me | 恢复当前会话 | `/auth/me` | Web 显式 GET |
| Logout | 注销会话 | `/auth/logout` | Dolphin SDK 调用 |

请求默认使用 `credentials: same-origin`。仓库没有实现这些服务端路由；部署环境必须单独提供。Me 接口返回 401/404 时按“未登录”处理，非 JSON 成功响应也按无会话处理。

## 4. DexScreener 价格接口

| 方法 | 路径模式 | 触发 | 使用规则 |
|---|---|---|---|
| GET | `https://api.dexscreener.com/latest/dex/tokens/{coinType}` | 粉尘清理、DeFi USD 估值 | 取 `pairs[0].priceUsd` |

- 请求失败、非 2xx 或没有 Pair 时价格记为 null/0。
- 每个非 SUI Coin Type 单独请求，没有重试、缓存或并发限流。
- DeFi 组合最多对前 20 个唯一 Coin Type 获取价格。
- “第一条 Pair”不保证是流动性最好的市场，因此 USD 估值仅供参考。

## 5. Move Call 依赖

### Sui Framework

| Target | 功能 |
|---|---|
| `0x2::coin::destroy_zero` | 销毁零余额 Coin |
| `0x2::coin::zero` | 构造零余额 Coin |
| `0x2::kiosk::take` | 从 Kiosk 取出 Item |
| `0x2::kiosk::withdraw` | 提取 Kiosk 收益 |
| `0x1::option::none<u64>` | 表示提取全部 Kiosk 收益 |

### 固定部署合约

| 功能 | 依赖 | 产品边界 |
|---|---|---|
| transfer-or-destroy | 固定 Utils Package | 低层 SDK API，不可配置 |
| Vault deposit | 固定 Vault Package + Vault Object | 只适用于该部署 |
| Vault withdraw | 固定 Router Package + Vault + AdminCap | 只适用于该部署，并依赖 AdminCap 可用性 |
| First aid packet | 固定 Router Package + Vault + AdminCap | Coin Type 固定为 SUI |

具体地址保存在 `src/movecall/coin.ts` 与 `src/movecall/vault.ts`。产品文档不把这些地址视为跨环境稳定配置。

## 6. 主网协议识别依赖

DeFi 模块通过固定 Package ID/类型模式识别：NAVI、Suilend、Scallop、Cetus、Turbos；通过固定 Coin Type 识别 haSUI、afSUI、vSUI、mSUI。它没有调用协议官方 API，也不校验 Package 升级映射。
