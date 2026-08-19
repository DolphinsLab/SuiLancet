# Chain Query（链上查询）

> 路由：`/query`
> 模块：Web / Object 与交易查询
> 前置条件：连接钱包（虽然查询目标可与当前钱包无关）

## 页面目标

按 Object ID 或交易摘要读取当前网络的链上详情，并以摘要卡片展示常用信息。

## 功能一：Object Inspector

### 输入

| 字段 | 类型 | 必填 | 校验 |
|---|---|:---:|---|
| Object ID | 文本 | 是 | 仅去除首尾空白并检查非空 |

### 输出

- Object ID。
- Move Object 类型；缺失时显示 `Unknown`。
- Version。
- Owner：AddressOwner、ObjectOwner、Shared、Immutable 或未知类型。
- JSON Content：存在时以格式化 JSON 展示，区域最大高度 60。

查询调用包含 JSON 与 Display 数据，但页面当前不展示 Display 字段、Digest 或动态字段。

## 功能二：Transaction Lookup

### 输入

| 字段 | 类型 | 必填 | 校验 |
|---|---|:---:|---|
| Transaction digest | 文本 | 是 | 仅去除首尾空白并检查非空 |

### 输出

| 区域 | 内容 |
|---|---|
| Status | success/failed 与完整 digest |
| Gas Usage | computation、storage、rebate |
| Balance Changes | Token 符号、原始最小单位增减值、正负颜色 |
| Events | 事件类型与格式化 JSON |

## 交互规则

- Object 和 Transaction 使用页签切换，各自保留输入与已有结果。
- 查询期间两个页签共用 `isLoading` 状态，当前操作按钮显示 Loading。
- 新查询开始时只清空对应类型的旧结果。
- 查询失败通过全局错误提示展示。

## 依赖与限制

- Object：Sui Core gRPC `getObject`。
- Transaction：Sui Core gRPC `getTransaction`，请求 transaction、effects、events、balance changes、object types。
- 本页没有交易历史、动态字段、分页或导出；这些能力只在 CLI/SDK 中提供。
- Balance Changes 不读取 Coin metadata decimals，因此展示的是原始最小单位。
