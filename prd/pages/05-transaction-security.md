# Transaction Simulator（交易模拟与执行）

> 路由：`/secure`
> 模块：Web / 交易安全
> 前置条件：连接钱包

## 页面目标

让用户粘贴 Base64 编码的 Sui TransactionData，在签名前查看执行状态、Gas、事件和原始返回；也允许直接签名执行该交易。

## 输入与操作

| 字段/按钮 | 必填 | 行为 |
|---|:---:|---|
| Transaction Data (Base64) | 是 | 接收可被 Sui SDK `Transaction.from` 解析的 Base64 文本 |
| Simulate | — | 调用当前网络的交易模拟，不签名、不上链 |
| Sign & Execute | — | 解析同一交易并调用浏览器钱包签名执行 |

## 模拟结果

| 区域 | 内容 |
|---|---|
| Simulation Result | 成功/失败状态 |
| Gas Usage | computation cost、storage cost、storage rebate、三者计算出的 total |
| Events | 事件类型和 JSON 内容；有事件时显示 |
| Raw Result | 完整模拟返回 JSON |

解析或模拟失败时显示错误卡片。

## 执行结果

- 成功：显示交易结果 Toast，包含交易摘要、复制按钮和 SuiScan 链接；清空输入与模拟结果。
- 失败：显示失败 Toast 与错误文本，同时保留页面错误信息。
- 执行按钮不要求先成功模拟；用户可以直接签名执行。
- 模拟结果不会自动阻止失败交易的签名尝试。

## 依赖与限制

- 模拟：Sui Core gRPC `simulateTransaction`，请求 effects、events、balance changes 和 transaction。
- 执行：浏览器钱包 `signAndExecuteTransaction`。
- 页面没有展示 balance changes 的专用视图，只能在 Raw Result 中查看。
- 交易结果 Toast 的浏览器链接固定为 `suiscan.xyz/mainnet`，在 testnet/devnet 下可能跳错网络。
- 页面不提供交易构建器、文件上传、Gas Budget 编辑或风险规则判断。
