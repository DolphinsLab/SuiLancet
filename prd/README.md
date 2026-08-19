# SuiLancet 当前产品文档

> 文档版本：2.0-current
> 源码基线：`a5245c8`
> 梳理日期：2026-08-19
> 口径：仅记录当前源码中可访问、可调用或明确展示的能力；规划项不计为已支持。

## 1. 产品概述

SuiLancet 是面向 Sui 用户和开发者的链上工具箱，聚焦钱包整理、资产批处理、交易安全检查、链上查询和 DeFi 仓位聚合。产品同时提供 Web UI、命令行工具（CLI）和 TypeScript SDK。

产品不负责 Swap、借贷下单或策略交易。DeFi 模块只读取钱包持有的仓位对象与余额，用于聚合展示，不代表协议官方数据源，也不会代替协议前端执行操作。

### 1.1 目标用户

- 持有大量 Coin/Object、需要批量整理的钱包用户。
- 需要迁移钱包、管理 Kiosk 或检查交易影响的高级用户。
- 需要以脚本方式查询和处理 Sui 资产的开发者与运维人员。
- 希望快速汇总主流 Sui DeFi 仓位的用户。

### 1.2 核心价值

- 批量处理：合并、拆分、转移、清理和迁移，降低重复操作成本。
- 交易前检查：在 SDK/CLI 的多数写操作中先模拟，再提交签名交易。
- 多入口复用：同一套核心能力通过 SDK 和 CLI 暴露，Web 提供常用流程。
- 风险透明：对可疑空投、钱包高权限对象、Gas 预算和交易影响给出结构化结果。

## 2. 产品形态与运行前提

| 形态 | 当前版本 | 身份/签名方式 | 网络支持 | 主要用途 |
|---|---:|---|---|---|
| Web UI | 0.1.0（页面显示） | 浏览器 Sui 钱包；可选 Dolphin ID | mainnet、testnet、devnet | 可视化查询与常用批处理 |
| CLI | 2.0.0 | 环境变量中的 Ed25519 密钥或助记词 | mainnet、testnet、pre-mainnet | 完整工具命令与自动化 |
| TypeScript SDK | 2.0.0 | `SuiScriptClient` 内置 Ed25519 签名 | mainnet、testnet、pre-mainnet | 二次开发与脚本集成 |

CLI/SDK 需要 Node.js 22+，并要求配置对应网络的 gRPC 地址，以及 `SUI_WALLET_SECRET` 或 `SUI_WALLET_PHRASE`。Web 默认使用官方 gRPC 地址，也可在构建时用环境变量覆盖。

## 3. 功能模块总览

| 模块 | 已支持能力 | Web | CLI | SDK |
|---|---|:---:|:---:|:---:|
| 钱包概览 | 地址、SUI 余额、全部 Token 余额 | ✅ | ✅ | ✅ |
| DeFi 仓位 | 借贷、LP、原生质押、LST 聚合 | ✅ | ✅ | ✅ |
| Coin 整理 | 合并、拆分、整类转移、Gas Object 筛选分组 | ✅ | 部分 | ✅ |
| 清理工具 | 零余额 Coin、粉尘、可疑空投扫描/安全销毁 | 部分 | ✅ | ✅ |
| 资产管理 | 单 Coin/按类型/批量转移、Object 转移、钱包迁移 | 常用流程 | ✅ | ✅ |
| Vault | 存入、提取、急救包 Move 调用 | — | ✅ | ✅ |
| Kiosk | 列表、内容、取出物品、提取收益 | — | ✅ | ✅ |
| 交易安全 | Base64 交易模拟、执行、Gas 估算 | 模拟/执行 | ✅ | ✅ |
| 钱包安全 | 权限对象、垃圾 Token、零余额 Coin 等扫描 | — | ✅ | ✅ |
| 链上查询 | 余额、金额范围 Coin、交易历史/详情、Object/动态字段 | 部分 | ✅ | ✅ |
| 网络与身份 | 网络切换、钱包连接、Dolphin ID 会话 | ✅ | 网络参数 | 客户端配置 |

## 4. Web 页面清单

| # | 页面 | 路由 | 核心功能 | 详细文档 |
|---:|---|---|---|---|
| 1 | Dashboard | `/`（未知路径也回退至此） | 钱包地址、SUI 余额、全部 Token 余额 | [查看](./pages/01-dashboard.md) |
| 2 | DeFi Portfolio | `/portfolio` | 扫描借贷、LP、质押仓位 | [查看](./pages/02-defi-portfolio.md) |
| 3 | Wallet Cleanup | `/clean` | Coin 合并/拆分/转移，Gas Object 管理 | [查看](./pages/03-wallet-cleanup.md) |
| 4 | Asset Management | `/manage` | 批量 Object 转移、全钱包迁移 | [查看](./pages/04-asset-management.md) |
| 5 | Transaction Simulator | `/secure` | 模拟或签名执行 Base64 交易 | [查看](./pages/05-transaction-security.md) |
| 6 | Chain Query | `/query` | Object 查询、交易查询 | [查看](./pages/06-chain-query.md) |
| 7 | Settings | `/settings` | 网络切换、Dolphin ID、版本信息 | [查看](./pages/07-settings.md) |

## 5. 全局交互规则

- 除 Settings 外，主要业务页面在未连接钱包时显示连接提示，不展示业务操作。
- 顶部钱包入口负责连接/切换浏览器钱包，并在连接后显示缩略地址。
- Dolphin ID 是可选的二次身份会话；必须先连接 Sui 钱包，登录时需要个人消息签名。
- 普通提示默认约 5 秒自动关闭；交易结果提示约 10 秒自动关闭，并支持复制交易摘要和跳转浏览器。
- Web 的链上写操作通过钱包弹窗逐笔签名；批量迁移可能连续触发多个签名请求。
- CLI/SDK 的写操作使用环境变量加载的本地密钥签名。多数核心模块会先模拟交易，但不是所有命令都有 `--dry-run`。

## 6. 当前能力边界

以下内容在界面或旧文档中出现，但当前不能按“已支持功能”使用：

- Web `/clean` 的“Destroy Zero Coins”按钮没有绑定执行逻辑。
- Web Settings 的自定义 gRPC 入口处于禁用状态。
- Web Settings 的“Clear Local Storage”和“Disconnect All Wallets”按钮没有绑定执行逻辑。
- Web 没有 CLI/SDK 的粉尘清理、空投风险扫描、钱包安全扫描、Gas 建议、Kiosk 和 Vault 操作界面。
- CLI 只有 Clean 写命令和钱包迁移提供 `--dry-run`；转账、拆分、Vault、Kiosk 等命令没有预览参数。
- 粉尘清理只真正销毁零余额 Coin；非零低价值 Coin 当前被转给自己，并不会销毁。
- DeFi 数据来自钱包对象/余额的启发式解析；金额精度大量按 9 位小数处理，无法保证与每个协议官方口径完全一致。
- Web 交易结果中的 SuiScan 链接固定为 mainnet，即使当前选择 testnet/devnet。

完整说明见[实现边界与已知限制](./appendix/implementation-boundaries.md)。

## 7. 附录

- [CLI 命令清单](./appendix/cli-inventory.md)
- [SDK 公共能力清单](./appendix/sdk-inventory.md)
- [外部接口与链上依赖](./appendix/api-inventory.md)
- [枚举与状态字典](./appendix/enum-dictionary.md)
- [页面与流程关系](./appendix/page-relationships.md)
- [实现边界与已知限制](./appendix/implementation-boundaries.md)
