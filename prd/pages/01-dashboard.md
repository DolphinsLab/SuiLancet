# Dashboard（钱包概览）

> 路由：`/`；未匹配路由也会回退到本页
> 模块：Web / 钱包概览
> 前置条件：查看欢迎页无需连接；查看资产需要连接钱包

## 页面目标

连接钱包后，快速确认当前地址、SUI 余额和全部 Token 余额。页面只读，不发起链上交易。

## 页面区域与字段

| 区域 | 字段 | 数据来源 | 展示规则 |
|---|---|---|---|
| Wallet Info | Address | 当前钱包账户 | 完整地址 |
| SUI Balance | SUI 余额 | gRPC `getBalance` | 除以 `1e9`，保留 4 位小数 |
| All Tokens | Token 名称 | `coinType` 最后一段 | 不显示完整 Coin Type |
| All Tokens | Token 余额 | gRPC `listBalances` | 全部统一除以 `1e9`，保留 4 位小数 |

## 交互逻辑

### 未连接钱包

- 页面显示欢迎文案和产品简介。
- 引导用户使用顶部的“Connect Wallet”。

### 连接钱包后

- 页面自动查询 SUI 余额和全部 Token 余额。
- 查询缓存键包含网络与钱包地址；切换网络或钱包会触发新的查询。
- SUI 余额加载中显示 `Loading...`。
- 没有 Token 余额时显示 `No tokens found`。

## 依赖与限制

- SUI 余额：Sui Core gRPC `getBalance`。
- 全部 Token：分页调用 Sui Core gRPC `listBalances`，每页 50 条。
- 页面把所有 Token 都按 9 位小数格式化；对 decimals 不是 9 的 Token，显示值可能不准确。
- 页面没有手动刷新按钮，依赖查询缓存与网络/账户变化刷新。

## 页面关系

- 入口：应用 Logo、侧边栏 Dashboard、未知路由回退。
- 出口：通过全局侧边栏进入 DeFi、Clean、Manage、Secure、Query、Settings。
