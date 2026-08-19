# 页面与流程关系

## 1. 全局导航

```mermaid
flowchart LR
    W["Connect Wallet"] --> D["Dashboard /"]
    D --> P["DeFi /portfolio"]
    D --> C["Clean /clean"]
    D --> M["Manage /manage"]
    D --> S["Secure /secure"]
    D --> Q["Query /query"]
    D --> G["Settings /settings"]
    G --> N["Switch Network"]
    G --> I["Dolphin ID Session"]
```

所有页面共享顶部钱包与 Dolphin ID 状态。侧边栏是页面之间唯一的内置导航；业务结果中的 Object ID 和交易摘要通常不是页面内链接。

## 2. 状态变化传播

| 来源 | 变化 | 影响页面 |
|---|---|---|
| 顶部钱包按钮 | 连接/切换/断开账户 | Dashboard、DeFi、Clean、Manage、Secure、Query 的数据上下文 |
| Settings | 切换网络 | 后续所有 gRPC 查询与交易；Dashboard Query Key 会随网络变化 |
| Clean | 合并/拆分/转移成功 | Clean 自动刷新 Coin 列表；Dashboard/DeFi 不主动刷新 |
| Manage | 批量转移成功 | 当前页不重新列资产；Dashboard/Clean 不主动刷新 |
| Secure | 交易执行成功 | 清空本页输入与模拟结果；其他页面不主动刷新 |
| Dolphin ID | 登录/登出/恢复 | 顶部按钮与 Settings 状态同步 |
| Gas 分组 | 保存/删除 | 仅 Clean 页；持久化到当前浏览器 localStorage |

## 3. 关键业务流程

### Coin 整理

```mermaid
flowchart TD
    A["连接钱包"] --> B["扫描最多 10,000 个 Coin"]
    B --> C{"选择操作"}
    C --> D["Merge"]
    C --> E["Split"]
    C --> F["Transfer All"]
    C --> G["Gas Object 筛选/分组"]
    D --> H["钱包签名"]
    E --> H
    F --> H
    H --> I["成功后刷新 Coin"]
    G --> J["复制或保存 localStorage"]
```

### Web 钱包迁移

```mermaid
flowchart TD
    A["输入目标地址"] --> B["扫描 Coin 与其他 Object"]
    B --> C["每 50 个迁移非 SUI Coin"]
    C --> D["每 50 个迁移其他 Object"]
    D --> E["最后合并并迁移 SUI/Gas"]
    E --> F["完成"]
    C -. "任一批失败" .-> X["中断；已成功批次不回滚"]
    D -. "任一批失败" .-> X
    E -. "失败" .-> X
```

### Dolphin ID

```mermaid
sequenceDiagram
    participant U as 用户
    participant W as Sui Wallet
    participant UI as SuiLancet Web
    participant A as Dolphin Auth Backend
    UI->>A: GET /auth/me（应用启动/刷新会话）
    A-->>UI: 会话或 401/404
    U->>UI: Sign In
    UI->>W: 连接适配器并请求个人消息签名
    W-->>UI: 签名
    UI->>A: nonce/verify
    A-->>UI: SessionSnapshot
```

## 4. 页面间缺失联动

- Query 查到的 Object 不能一键带入 Manage 转移。
- Query 查到的交易不能一键带入 Secure 模拟；模拟需要 Base64 TransactionData，不是 digest。
- DeFi 卡片不能跳转到协议、区块浏览器或 Object Inspector。
- Dashboard Token 不能跳转到 Clean 的对应 Coin Type。
- 写操作完成后，其他页面的缓存不会统一失效。
