# DeFi Portfolio（DeFi 仓位）

> 路由：`/portfolio`
> 模块：Web / DeFi 只读聚合
> 前置条件：连接钱包

## 页面目标

扫描当前钱包直接持有的 DeFi 仓位对象和 LST 余额，以统一卡片展示借贷、流动性池和质押仓位。

## 支持范围

| 分类 | 协议/资产 | 识别方式 | 展示内容 |
|---|---|---|---|
| 借贷 | NAVI | Obligation Object 类型与字段 | 协议、Object ID、存款、借款 |
| 借贷 | Suilend | Obligation Object 类型与字段 | 协议、Object ID、存款、借款 |
| 借贷 | Scallop | Obligation Object 类型与字段 | 协议、Object ID、存款、借款 |
| LP | Cetus | Position Object 类型与字段 | 交易对、流动性、Tick 区间、Token 数量（若对象提供） |
| LP | Turbos | Position NFT 类型与字段 | 交易对、流动性、Tick 区间 |
| 质押 | Sui Native Staking | `StakedSui` Object | SUI 本金、Object ID |
| LST | haSUI / Haedal | Coin 余额 | Token 数量 |
| LST | afSUI / Aftermath | Coin 余额 | Token 数量 |
| LST | vSUI / Volo | Coin 余额 | Token 数量 |
| LST | mSUI / Momentum | Coin 余额 | Token 数量 |

## 页面区域

### 顶部操作

| 控件 | 行为 |
|---|---|
| Scan Positions | 扫描全部 Owned Object 与 Token 余额；扫描中禁用 |
| Last updated | 成功扫描后显示本地更新时间 |

### 汇总卡片

| 卡片 | 统计口径 |
|---|---|
| Lending | 识别出的借贷仓位对象数量 |
| Liquidity Pools | 识别出的 Cetus/Turbos LP 仓位数量 |
| Staking | 原生质押对象与 LST 余额项数量 |

### 详情卡片

- Lending：显示协议、缩略 Object ID、Deposits 与 Borrows 列表。
- LP：显示协议、交易对、缩略 Object ID、Liquidity、Tick Range，以及对象中可直接解析的 Token 数量。
- Staking：显示 Token 符号、协议、格式化数量和可选 Object ID。

## 交互逻辑

- 页面首次打开不自动扫描，显示引导卡片。
- 点击“Scan Positions”后读取钱包的所有 Owned Object（每页 50）及全部余额。
- 找到仓位时显示成功提示和总仓位数；没有仓位时显示信息提示与空状态。
- 扫描异常时保留当前页面，并显示错误提示。

## 业务规则与限制

- 本页只读，不提供存款、借款、还款、撤池或领取收益操作。
- 仓位识别依赖写死的主网 Package ID 和对象字段结构；协议升级后可能漏报。
- 所有仓位数量默认使用 9 位 decimals；不同精度资产可能显示不准确。
- 本页定义了 USD 字段但没有获取或展示价格；汇总卡只统计仓位数量，不统计总价值。
- Turbos 对象不直接提供 Token 数量时，页面仅显示流动性与 Tick 信息。
- 扫描的是钱包直接持有对象；托管、共享或协议内部未映射的仓位可能无法识别。

## 页面关系

- 入口：侧边栏 DeFi。
- 共享依赖：钱包连接、当前网络、Sui gRPC。
- 无页面内跳转；结果 Object ID 仅展示缩略文本。
