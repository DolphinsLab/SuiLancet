# Settings（设置与身份）

> 路由：`/settings`
> 模块：Web / 网络、Dolphin ID 与应用信息
> 前置条件：网络切换无需钱包；Dolphin ID 登录需要连接钱包

## 功能一：网络切换

| 选项 | 状态 |
|---|---|
| mainnet | 支持 |
| testnet | 支持 |
| devnet | 支持 |

- 默认网络由构建变量 `VITE_DEFAULT_NETWORK` 决定；无效或未配置时使用 mainnet。
- 点击网络按钮后切换 dApp Kit 的当前网络；业务页面后续查询使用新网络客户端。
- 每个网络的 gRPC 地址可在构建时配置，否则使用官方 Fullnode 地址。

## 功能二：Dolphin ID

### 展示字段

| 字段 | 说明 |
|---|---|
| Status | idle、restoring、connecting、signing、signed-in 或 error |
| Domain | 签名域名 |
| Nonce Endpoint | 获取登录 nonce 的服务端地址 |
| Verify Endpoint | 验证签名的服务端地址 |
| Subject | 登录成功后显示会话主体 |
| Expires | 登录成功后显示本地化过期时间 |
| Error | 会话恢复、登录或登出错误 |

### 操作流程

- 应用加载时自动调用 Me Endpoint 恢复服务端会话。
- Sign In：要求先连接 Sui 钱包；选择优先匹配的已安装钱包，必要时连接 Dolphin Adapter，随后请求个人消息签名并创建会话。
- Sign Out：调用 Dolphin ID logout 接口；无论服务端调用是否成功，本地会话都会清除。
- Refresh Session：重新调用 Me Endpoint 获取当前会话。
- 如果恢复的会话 Subject 与当前钱包地址不匹配，页面清除本地恢复会话。

## 功能三：应用信息

- Web 页面版本：0.1.0。
- Sui SDK：`@mysten/sui 2.23.1 (gRPC)`。
- GitHub 仓库外链。

## 未实现入口

- Custom gRPC Endpoint 输入框和按钮处于禁用状态，只能构建时配置。
- “Clear Local Storage”按钮没有事件处理，不会清除 Gas 分组或其他本地数据。
- “Disconnect All Wallets”按钮没有事件处理，不会断开钱包。

## 依赖与配置

| 配置 | 默认值 |
|---|---|
| `VITE_DOLPHIN_ID_NONCE_URL` | `/auth/nonce` |
| `VITE_DOLPHIN_ID_VERIFY_URL` | `/auth/verify` |
| `VITE_DOLPHIN_ID_REFRESH_URL` | `/auth/refresh` |
| `VITE_DOLPHIN_ID_ME_URL` | `/auth/me` |
| `VITE_DOLPHIN_ID_LOGOUT_URL` | `/auth/logout` |
| `VITE_DOLPHIN_ID_CREDENTIALS` | `same-origin` |
| `VITE_DOLPHIN_ID_DOMAIN` | 当前 Host |
| `VITE_DOLPHIN_ID_URI` | 当前 Origin |
| `VITE_DOLPHIN_ID_STATEMENT` | `Sign in to SuiLancet with Dolphin ID.` |
