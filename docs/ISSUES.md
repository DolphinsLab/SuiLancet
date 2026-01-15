# SuiLancet 功能开发 Issues

> 根据 Issue-Driven Development 流程，以下是待创建的 GitHub Issues

---

## Issue #1: [feature] 交易模拟与签名功能

### 目标
实现对 Base64 编码的 TransactionData 进行模拟执行和签名的功能。

### 背景
用户需要在执行交易前预览交易效果，验证交易是否会成功，以及预估 Gas 消耗。

### 验收标准
- [ ] 支持解析 Base64 编码的 TransactionData
- [ ] 支持模拟执行交易，返回执行结果
- [ ] 支持显示预估 Gas 消耗
- [ ] 支持显示交易 Effects 和 Events
- [ ] 支持签名 TransactionData
- [ ] 支持签名后执行交易

### 技术方案

**文件结构**:
```
src/transaction/
├── simulator.ts   # 交易模拟器
├── signer.ts      # 交易签名器
└── index.ts       # 统一导出
```

**核心接口**:
```typescript
// 模拟结果
interface SimulationResult {
  success: boolean
  gasUsed: string
  effects: TransactionEffects
  events: SuiEvent[]
  error?: string
}

// 模拟交易
async function simulateTransaction(
  client: SuiClient,
  txBase64: string,
  sender: string
): Promise<SimulationResult>

// 签名交易
async function signTransaction(
  keypair: Ed25519Keypair,
  txBase64: string
): Promise<SignedTransaction>
```

### 标签
`feature`

---

## Issue #2: [feature] 前端 Web 应用

### 目标
构建基于 React + Vite 的 Web 管理界面，支持通过浏览器操作各个 SDK 模块。

### 背景
CLI 工具虽然功能强大，但对于日常操作来说不够直观。需要一个 Web 界面来提供更好的用户体验。

### 验收标准
- [ ] 项目初始化 (React + Vite + TypeScript)
- [ ] 集成 Sui Wallet Kit，支持多钱包连接
- [ ] 实现 Dashboard 页面 (钱包概览)
- [ ] 实现 Coin 管理页面 (合并/分割/转移)
- [ ] 实现交易模拟页面 (输入 Base64 TX)
- [ ] 实现 DEX Swap 页面 (Cetus/DeepBook)
- [ ] 实现 Vault 管理页面
- [ ] 响应式设计，支持移动端

### 技术方案

**技术栈**:
- 框架: React 18 + TypeScript
- 构建: Vite
- 钱包: @mysten/dapp-kit
- UI: TailwindCSS + Headless UI
- 状态: Zustand
- 路由: React Router

**目录结构**:
```
web/
├── src/
│   ├── components/        # 通用组件
│   │   ├── Layout/       # 布局组件
│   │   ├── WalletButton/ # 钱包连接
│   │   └── common/       # 公共 UI
│   ├── pages/            # 页面
│   │   ├── Dashboard/    # 仪表盘
│   │   ├── Coin/         # 代币管理
│   │   ├── Transaction/  # 交易模拟/签名
│   │   ├── Swap/         # DEX 交换
│   │   ├── Vault/        # 金库管理
│   │   └── Settings/     # 设置
│   ├── hooks/            # 自定义 Hooks
│   ├── stores/           # Zustand stores
│   ├── services/         # API 服务
│   └── utils/            # 工具函数
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

### 子任务拆分

建议拆分为多个子 Issue:

1. **[feature] 前端项目初始化** - 创建 Vite 项目、配置 TailwindCSS
2. **[feature] 钱包连接组件** - 集成 Sui Wallet Kit
3. **[feature] Dashboard 页面** - 钱包概览、余额显示
4. **[feature] Coin 管理页面** - 代币操作界面
5. **[feature] 交易模拟页面** - TX 模拟/签名界面
6. **[feature] Swap 页面** - DEX 交换界面
7. **[feature] Vault 页面** - 金库管理界面

### 标签
`feature`, `frontend`

---

## Issue #3: [chore] 移除 Blub Ambassador 和 Nave Lending 模块

### 目标
从代码库中移除不再支持的 Blub Ambassador 和 Nave Lending 模块。

### 验收标准
- [ ] 删除 `src/movecall/blub/` 目录
- [ ] 删除 `src/movecall/nave/` 目录
- [ ] 删除 `src/methods/blub/` 目录
- [ ] 删除 `src/methods/nave/` 目录
- [ ] 删除相关测试文件
- [ ] 更新导出文件 (index.ts)
- [ ] 确保构建通过

### 标签
`chore`, `cleanup`

---

## 创建 Issue 命令

```bash
# Issue #1
gh issue create --title "[feature] 交易模拟与签名功能" --label "feature"

# Issue #2
gh issue create --title "[feature] 前端 Web 应用" --label "feature,frontend"

# Issue #3
gh issue create --title "[chore] 移除 Blub Ambassador 和 Nave Lending 模块" --label "chore,cleanup"
```

---

*创建时间: 2026-01-15*
