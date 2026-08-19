# 实现边界与已知限制

本页用于区分“当前真正可用的产品能力”和“已有 UI/文案/旧文档但尚未完整实现的能力”。

## 1. 明确未实现的 Web 入口

| 入口 | 现状 | 可用替代 |
|---|---|---|
| Clean → Destroy Zero Coins | 按钮没有 `onClick` | CLI `clean destroy-zero` / SDK `batchDestroyZeroCoin` |
| Settings → Set Custom gRPC | 输入与按钮均禁用 | 构建时配置 `VITE_SUI_GRPC_*` |
| Settings → Clear Local Storage | 按钮没有事件 | 浏览器开发者工具手动清除 |
| Settings → Disconnect All Wallets | 按钮没有事件 | 使用钱包连接组件自身的断开能力 |

## 2. 文档与实现口径差异

- 历史 `docs/PRD-v2.md` 包含 Batch Claim、协议验证等规划描述，当前源码没有相应实现。
- 历史 `docs/SDK-REFERENCE.md` 仍描述 Cetus Swap、DeepBook、套利和保证金交易等旧功能；这些不在当前导出结构中。
- README 声称 Web 支持安全扫描、Kiosk 等广泛能力；当前 Web 实际没有对应页面，只有 CLI/SDK 支持。
- Web About 显示 0.1.0，根包/CLI 显示 2.0.0，产品版本口径未统一。

## 3. `dry-run` 与模拟边界

- 有 `--dry-run`：`clean destroy-zero`、`clean merge`、`clean dust`、`clean airdrop-destroy`、`manage migrate`。
- 无 `--dry-run`：Manage 的转移、拆分、Vault、Kiosk；Secure/Query/DeFi 只读命令不需要。
- SDK `sendTransaction` 会先模拟，但模拟失败时返回 `undefined`；部分上层方法仍构造 `success: true` 的结果，只是 digest 为空。这意味着调用方不能只依赖 `CommandResult.success` 判断交易是否真正上链。
- Web Clean/Manage 写操作不展示模拟结果，直接进入钱包签名流程。

## 4. 清理工具边界

### 粉尘

- 价格不可得时默认跳过；`includeUnknown` 也只纳入余额为 0 的 Coin。
- 零余额 Coin 真正调用 `destroy_zero`。
- 非零低价值 Coin 仅 `transferObjects` 给当前钱包；Object 仍存在，产品消息却计入“Cleaned/Processed”。
- 价格取 DexScreener 第一条 Pair，存在市场选择偏差。

### 空投

- 风险判断是本地启发式，不是安全审计、恶意合约数据库或 Package 验证服务。
- 安全白名单和可疑名称正则写死在代码中。
- `scanAirdrops` 只返回 high/medium；low 数量始终为 0。
- 自动销毁永远只针对零余额 Coin，非零余额可疑 Token 要求人工处理。

## 5. DeFi 边界

- 只读，不执行协议操作。
- 依赖主网 Package ID 与钱包直接持有对象；testnet/devnet 或协议升级后可能无法识别。
- 多个适配器根据通用字段名猜测 deposits、borrows、liquidity 等字段，可能漏报或误读。
- 资产 decimals 基本固定为 9，没有为每个仓位 Token 查询 Metadata。
- Turbos 仓位 Token 数量固定为 0，因为对象不直接提供。
- SDK 的协议失败被静默忽略，因此“成功”可能只代表拿到了部分协议结果。
- Web 与 SDK 使用两套相似但独立的解析实现，结果口径可能不同。

## 6. 迁移与批处理边界

- Web Wallet Migration 会尝试转移全部非 Coin Object，没有可转移性检查、排除列表或 dry-run。
- CLI/SDK 可排除 Coin Type，但不能按 Object Type 排除其他资产。
- 指定 `gasObject` 时，迁移的 SUI 阶段仍可能把 `tx.gas` 转走；使用者需确认 Gas Object 与迁移计划的关系。
- 多批交易不是原子操作：中途失败不会回滚已成功批次。
- Web Batch Transfer 与整类 Coin Transfer 不分批，输入过大可能超过 Sui 交易限制。
- Kiosk 内容查询没有识别上架状态；`take` 仍由链上规则决定是否允许。

## 7. 展示精度与网络边界

- Web Dashboard、Clean、Portfolio 大量统一按 9 位 decimals 展示，非 9 位资产可能显示错误。
- Web Query 的 Balance Changes 显示原始最小单位。
- Web 交易 Toast 的 SuiScan URL 固定 mainnet。
- CLI 网络枚举包含 pre-mainnet；Web 包含 devnet，两者不一致。

## 8. 安全模型边界

- Web 不接触私钥，依赖钱包扩展签名。
- CLI/SDK 直接从环境变量读取私钥或助记词；运行环境安全由使用者负责。
- Dolphin ID 服务端端点不在本仓库中，是否可用取决于部署环境。
- 钱包安全分数是规则分，不代表正式安全评级：高权限 Cap 仅记 info，检查项也不覆盖授权历史、恶意交易签名或合约字节码审计。
- Vault 与低层 Utils Move Call 使用固定地址，调用前应确认目标网络和部署所有权。

## 9. 建议的产品状态标签

为避免后续文档再次混淆，建议所有功能统一使用：

| 标签 | 定义 |
|---|---|
| Available | 有入口、有执行逻辑、可返回结果 |
| Partial | 核心逻辑可用，但缺少关键校验、数据源或部分交互 |
| CLI/SDK only | 核心已实现，Web 尚无入口 |
| UI only | 仅有界面，无执行逻辑 |
| Planned | 只有需求或历史文案，当前没有代码 |
