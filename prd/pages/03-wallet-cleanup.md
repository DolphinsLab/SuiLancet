# Wallet Cleanup（Coin 整理）

> 路由：`/clean`
> 模块：Web / Coin 批处理与 Gas Object 管理
> 前置条件：连接钱包；写操作需要钱包签名

## 页面目标

扫描钱包持有的 Coin Object，并按 Coin Type 执行合并、等额拆分、整类转移，以及筛选和保存 SUI Gas Object ID。

## 页面初始化

- 连接钱包后自动分页扫描 Owned Object，最多保留 10,000 个 Coin。
- 顶部显示 Coin Object 总数与 Coin Type 数；达到上限时提示仅显示前 10,000 个。
- “Refresh”可手动重新扫描。
- 除 Gas 页签外，操作前必须选择 Coin Type；下拉项显示 Token 符号和该类型的 Object 数。

## 功能一：Merge

| 项目 | 规则 |
|---|---|
| 输入 | Coin Type |
| 最低数量 | 至少 2 个 Coin Object |
| 主 Coin | 按余额降序选择最大 Coin |
| 单次 Move Call | 最多合并 511 个附属 Coin |
| 单笔交易 | 最多 3 个合并调用，即最多处理 1,534 个 Coin（主 Coin + 1,533） |
| 超限处理 | 只提交第一批，成功后提示用户继续合并 |
| SUI 特殊处理 | 最大 SUI Coin 同时作为 Gas Payment，合并目标使用 `tx.gas` |

成功后提示合并数量并刷新 Coin 列表；失败显示钱包或链上返回的错误。

## 功能二：Split

### 字段

| 字段 | 类型 | 必填 | 校验/说明 |
|---|---|:---:|---|
| Coin Type | 下拉 | 是 | 选择待拆分资产 |
| Amount per coin | 仅数字文本 | 是 | 使用最小单位，不自动按 Token decimals 换算 |
| Number of coins | 仅数字文本 | 是 | 1–1,533 |

### 规则

- 页面计算并展示总需求与当前总余额；展示值统一按 `1e9` 换算。
- 总余额不足时阻止交易。
- 只从余额最大的单个 Coin 拆分；若最大 Coin 不足，即使多个 Coin 总余额足够，也要求先执行 Merge。
- 拆出的 Coin 全部转回当前钱包。
- SUI 拆分时使用源 Coin 作为 Gas Payment。

## 功能三：Transfer

| 字段 | 类型 | 必填 | 说明 |
|---|---|:---:|---|
| Coin Type | 下拉 | 是 | 整个类型的所有 Coin Object |
| Recipient address | 文本 | 是 | 页面只检查非空，格式由钱包/链上校验 |

点击“Transfer All”后，把该类型全部 Coin Object 放入同一笔交易并转给目标地址。页面没有按数量分批逻辑，Coin 数量过多时可能超过交易限制。

## 功能四：Destroy

页面展示“Destroy Zero Coins”按钮和说明，但当前按钮没有执行事件，属于未实现入口。实际零余额清理可使用 CLI `clean destroy-zero` 或 SDK `batchDestroyZeroCoin`。

## 功能五：Gas Object

### 筛选与复制

| 字段 | 类型 | 规则 |
|---|---|---|
| Min Balance (SUI) | 数字文本 | 可空；筛选余额大于等于下限 |
| Max Balance (SUI) | 数字文本 | 可空；筛选余额小于等于上限 |
| Grouping Mode | 枚举 | 不分组 / 每组固定数量 / 平均拆成 N 组 |
| Group Value | 整数文本 | 分组模式启用时生效 |

- 仅筛选 SUI Coin，按余额降序排列。
- 页面展示筛选数量与总 SUI 余额，并预览前 50 个 Object。
- 不分组时复制带双引号、逗号和换行的 ID 列表。
- 分组时复制 JSON 风格的二维数组片段，各组之间空一行。

### 保存分组

- 可把当前筛选结果保存为命名分组。
- 可手工粘贴 JSON 数组、逗号分隔或换行分隔的 Object ID，再保存为分组。
- 手工输入仅校验每个 ID 以 `0x` 开头。
- 分组保存在浏览器 `localStorage` 的 `sui-lancet-gas-groups` 键下。
- 已保存分组支持复制为格式化 JSON和删除；删除不要求二次确认。

## 共用结果区

选择 Coin Type 后，页面显示该类型全部 Coin Object 的缩略 ID 与余额。余额统一按 9 位 decimals 格式化。

## 依赖与限制

- 数据来自 Sui gRPC `listOwnedObjects`。
- 写操作通过浏览器钱包签名并执行。
- 没有交易前模拟结果页或显式 `dry-run`；最终确认依赖钱包弹窗。
- 非 9 decimals Token 的展示金额可能不准确，但链上操作使用原始最小单位。
