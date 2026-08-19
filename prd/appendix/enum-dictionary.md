# 枚举与状态字典

## 1. 网络

| 枚举 | 使用范围 | 说明 |
|---|---|---|
| `mainnet` | Web、CLI、SDK | 主网；Web 默认值 |
| `testnet` | Web、CLI、SDK | 测试网 |
| `devnet` | Web | 开发网 |
| `pre-mainnet` | CLI、SDK | 预主网；Web 不提供 |

## 2. 资产与仓位分类

| 枚举 | 说明 |
|---|---|
| `coin` | 钱包迁移只处理 Coin |
| `object` | 钱包迁移只处理非 Coin Owned Object |
| `all` | 钱包迁移处理两类资产 |
| `lending` | 借贷存款/借款仓位 |
| `lp` | 流动性池仓位 |
| `staking` | 原生质押或 Liquid Staking Token |

## 3. 风险与安全

### 空投风险 `RiskLevel`

| 值 | 评分规则 | 是否进入扫描结果 |
|---|---|---|
| `high` | 启发式分数 ≥ 50 | 是 |
| `medium` | 启发式分数 ≥ 20 | 是 |
| `low` | 低于 20 或无风险信号 | 当前扫描结果不收集 |

空投风险加分：可疑名称模式 +30、无 Metadata +20、异常大余额 +25、Package ID 长度异常 +10。命中安全白名单直接返回 low。

### 钱包 Finding 严重度

| 值 | 分数扣减 |
|---|---:|
| `high` | 30 |
| `medium` | 15 |
| `info` | 5 |

钱包分数从 100 开始：80–100 为 low risk，50–79 为 medium risk，0–49 为 high risk。

### Finding 分类

| 值 | 含义 |
|---|---|
| `privilege` | AdminCap、OwnerCap、TreasuryCap、UpgradeCap、Publisher、PolicyCap |
| `spam` | Coin Type 超过 20 种 |
| `cleanup` | 零余额 Coin 超过 10 个 |
| `unverified` | Coin Type 无链上 Metadata |
| `objects` | 第三方非 Coin Object 超过 50 个 |

## 4. Web 状态

### Dolphin ID

| 值 | 含义 |
|---|---|
| `idle` | 未登录且没有进行中的动作 |
| `restoring` | 正在从服务端恢复会话 |
| `connecting` | 正在连接 Dolphin Adapter 钱包 |
| `signing` | 等待用户签名 |
| `signed-in` | 已有有效会话 |
| `error` | 恢复或登录失败 |

### 通知类型

| 值 | 默认视觉含义 |
|---|---|
| `success` | 绿色，操作成功 |
| `error` | 红色，操作失败 |
| `info` | 蓝色，中性状态 |
| `warning` | 黄色，需要注意或输入不满足规则 |

### Clean 页签

| 值 | 页面名称 |
|---|---|
| `merge` | Merge Coins |
| `split` | Split Coins |
| `transfer` | Transfer Coins |
| `destroy` | Destroy Coins（当前未接线） |
| `gas` | Gas Object 筛选与分组 |

Gas 分组模式：`none`、`perGroup`、`totalGroups`。

## 5. 交易分类

CLI/SDK 交易历史解析可能返回：

| 类型 | 判定 |
|---|---|
| `Unknown` | 没有可解析交易数据 |
| `Empty` | 没有命令 |
| `Transfer` | 只有转移，无拆分/合并 |
| `Merge` | 包含 Coin 合并 |
| `Split & Transfer` | 同时包含拆分与转移 |
| `Split` | 包含拆分 |
| `Swap` | Move Call 目标包含 `::swap` 或 `::router` |
| `Mint` | 目标包含 `::mint` 或 `::create` |
| `Stake` | 目标包含 `::stake` 或 `::add_stake` |
| `Kiosk` | 目标包含 `::kiosk` |
| `Claim` | 目标包含 `::claim` |
| `Contract Call` | 有其他 Move Call |
| `Other` | 其他 Programmable Transaction |

## 6. Object 与交易状态

- Owner：AddressOwner、ObjectOwner、Shared、Immutable、Unknown。
- Object Change：created、mutated、deleted；类型定义还包含 wrapped、published，但当前模拟解析不会产生后二者。
- 交易执行：success、failed。
