# SuiLancet v2 - Product Requirements Document

> **Version**: 2.0
> **Last Updated**: 2026-01-23
> **Status**: Draft

---

## 1. Product Vision

### 1.1 One-Liner

**SuiLancet = Sui 链上的「瑞士军刀」，专治各种链上小毛病。**

### 1.2 Product Definition

SuiLancet 是一款轻量级 Sui 链上运维工具集，专注于解决用户在 Sui 链上遇到的常见及复杂通用问题。它不重复已有协议的成熟功能（如 Swap、借贷），而是填补生态中"没人愿意做但用户迫切需要"的工具空白。

### 1.3 Core Principles

| 原则 | 说明 |
|------|------|
| **做别人不做的** | 聚焦链上运维小工具，不做 Swap、借贷等成熟功能 |
| **专注痛点** | 每个功能必须对应一个明确的用户痛点 |
| **批量优先** | 凡是需要重复操作的，都提供批量方案 |
| **安全第一** | 所有交易先模拟后执行，保护用户资产安全 |

---

## 2. Target Users

### 2.1 Primary Users

- **DeFi 重度用户**: 多钱包管理，频繁交互各协议
- **NFT 收藏者**: 需要批量管理 Object 和 Kiosk
- **开发者/测试者**: 需要快速处理链上对象

### 2.2 User Pain Points

| 痛点 | 现有解决方案 | SuiLancet 方案 |
|------|-------------|---------------|
| 钱包内大量零余额垃圾 Coin | 手动逐个销毁 | 一键批量清理 |
| 收到可疑空投代币 | 不知如何处理，怕钓鱼 | 自动检测 + 安全销毁 |
| 需要迁移钱包资产 | 手动逐个转移 | 一键全量迁移 |
| Coin 碎片化严重 | 手动合并 | 智能合并/拆分 |
| 不确定交易效果 | 盲签 | 交易模拟预览 |
| Gas 设置不合理 | 凭经验估算 | 最优 Gas 建议 |

---

## 3. Product Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SuiLancet v2                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Interface Layer                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │   CLI    │  │  Web UI  │  │   SDK    │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Feature Modules                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Clean     │  │   Manage    │  │   Secure    │            │
│  │   清理工具   │  │   管理工具   │  │   安全工具   │            │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤            │
│  │ - 粉尘清理   │  │ - 批量转移   │  │ - 风险扫描   │            │
│  │ - 空投检测   │  │ - 钱包迁移   │  │ - 授权管理   │            │
│  │ - Coin 合并  │  │ - Object管理 │  │ - 交易预览   │            │
│  │ - 零值销毁   │  │ - Kiosk管理  │  │ - Gas优化   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │              Query 查询工具                      │           │
│  │  - 资产全览  - 交易解析  - Object详情  - 余额聚合 │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Core Layer                                                     │
│  ┌──────────────────────────────────────────────────┐          │
│  │ SuiScriptClient | Transaction Builder | Utilities │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Feature Specification

### 4.1 Clean - 清理工具

#### 4.1.1 粉尘清理器 (Dust Cleaner)

**问题**: 用户钱包中积累大量价值极低（< $0.01）的代币碎片，占用 gas 和视觉空间。

**功能**:
- 扫描钱包中所有 Coin 对象
- 按价值排序，标记低于阈值的 Coin
- 支持自定义阈值（默认 < $0.01 USD）
- 一键批量销毁/转出

**CLI**:
```bash
sui-lancet clean dust --threshold 0.01
sui-lancet clean dust --dry-run  # 预览模式
```

#### 4.1.2 空投检测器 (Airdrop Detector)

**问题**: 用户收到不明代币空投，可能是钓鱼攻击。

**功能**:
- 检测钱包中来源不明的代币/对象
- 基于已知风险列表进行匹配
- 检查代币合约是否开源/验证
- 提供风险等级评估（高/中/低）
- 支持一键安全销毁可疑对象

**CLI**:
```bash
sui-lancet clean airdrop-scan
sui-lancet clean airdrop-destroy --risk high
```

#### 4.1.3 零值 Coin 批量销毁 (Zero Balance Destroyer)

**Status**: ✅ 已实现

保持现有 `coin destroy-zero` 功能。

#### 4.1.4 Coin 批量合并 (Coin Merger)

**Status**: ✅ 已实现

保持现有 `coin merge` 功能，优化：
- 增加进度显示
- 增加合并前后对比报告

---

### 4.2 Manage - 管理工具

#### 4.2.1 钱包迁移工具 (Wallet Migration)

**问题**: 用户需要将旧钱包资产全部转移到新钱包，手动操作繁琐且容易遗漏。

**功能**:
- 扫描源钱包所有资产（Coin、NFT、Object）
- 生成迁移计划预览
- 分批执行迁移（受 PTB 限制自动分批）
- 支持选择性迁移（按类型/价值过滤）
- 迁移完成后生成报告

**CLI**:
```bash
sui-lancet manage migrate --to <address> --preview
sui-lancet manage migrate --to <address> --execute
sui-lancet manage migrate --to <address> --type coin  # 只迁移 Coin
```

#### 4.2.2 批量 Object 转移 (Batch Object Transfer)

**Status**: ✅ 部分已实现

增强：
- 支持按类型过滤
- 支持 NFT 批量转移
- 支持 Kiosk 内对象转移

**CLI**:
```bash
sui-lancet manage transfer-objects --to <address> --type <type>
sui-lancet manage transfer-objects --to <address> --ids <id1,id2,...>
```

#### 4.2.3 Kiosk 管理器 (Kiosk Manager)

**问题**: 用户的 NFT 和对象分散在多个 Kiosk 中，管理困难。

**功能**:
- 列出用户所有 Kiosk
- 查看 Kiosk 内容详情
- 提取 Kiosk 内对象
- 批量操作支持

**CLI**:
```bash
sui-lancet manage kiosk list
sui-lancet manage kiosk show <kiosk-id>
sui-lancet manage kiosk extract <kiosk-id> --item <item-id>
```

#### 4.2.4 批量 Claim (Batch Claim)

**问题**: 用户在多个协议中有待领取的奖励，需要逐个操作。

**功能**:
- 检测已知协议的待领奖励
- 一键批量领取
- 支持自定义协议扩展

**CLI**:
```bash
sui-lancet manage claim --scan          # 扫描可领取奖励
sui-lancet manage claim --execute       # 执行批量 claim
```

---

### 4.3 Secure - 安全工具

#### 4.3.1 交易模拟预览 (Transaction Simulator)

**Status**: ✅ 底层已实现 (devInspectTransactionBlock)

增强为用户友好的可视化结果：
- 显示资产变动预览（+/- 多少代币）
- 显示 Gas 消耗预估
- 风险提示（大额转账、首次交互合约等）

**CLI**:
```bash
sui-lancet secure simulate --tx <base64-tx>
sui-lancet secure simulate --file <tx-file>
```

#### 4.3.2 钱包安全扫描 (Wallet Security Scan)

**问题**: 用户不确定钱包中是否有可疑对象或安全风险。

**功能**:
- 扫描钱包中所有对象
- 检测异常权限设置
- 识别可疑合约交互
- 生成安全评估报告

**CLI**:
```bash
sui-lancet secure scan
sui-lancet secure scan --verbose
```

#### 4.3.3 Gas 优化器 (Gas Optimizer)

**问题**: 用户不确定设置多少 Gas Budget 最优。

**功能**:
- 分析交易复杂度
- 参考网络当前 Gas 价格
- 建议最优 Gas Budget
- 支持批量交易 Gas 优化

**CLI**:
```bash
sui-lancet secure gas-estimate --tx <base64-tx>
sui-lancet secure gas-suggest   # 当前网络 gas 建议
```

---

### 4.4 Query - 查询工具

#### 4.4.1 资产全览 (Asset Overview)

**Status**: ✅ 部分已实现 (wallet-info, balance)

增强：
- 按价值排序
- 按类型分组（Coin / NFT / Other Object）
- 显示美元估值

**CLI**:
```bash
sui-lancet query overview
sui-lancet query overview --sort value
```

#### 4.4.2 交易历史解析 (Transaction History Parser)

**问题**: 链上交易记录难以阅读理解。

**功能**:
- 获取指定地址的交易历史
- 将交易解析为人类可读格式
- 分类显示（转账/交互/铸造等）

**CLI**:
```bash
sui-lancet query history --limit 20
sui-lancet query history --tx <digest>  # 解析单笔交易
```

#### 4.4.3 Object 详情查询 (Object Inspector)

**功能**:
- 快速查看任意 Object 详细信息
- 支持 Dynamic Field 浏览
- 显示对象所有权和权限

**CLI**:
```bash
sui-lancet query object <object-id>
sui-lancet query object <object-id> --dynamic-fields
```

---

## 5. Feature Deprecation Plan

### 5.1 To Remove

| Module | 功能 | 理由 | 替代方案 |
|--------|------|------|---------|
| `movecall/cetus/` | Cetus Swap | 协议官网 + 聚合器更完善 | 推荐用户使用 Cetus/7K |
| `movecall/deepbookv3/` | DeepBook 交易 | 协议自有接口更完善 | 推荐用户使用 DeepBook UI |
| `methods/make_money.ts` | 套利交易 | 策略性功能，非通用工具 | 独立项目化 |
| `movecall/margin-trading/` | 保证金交易 | 专业交易功能 | 独立项目化 |
| `movecall/honny-hot/` | HoneyPot 交易 | 特定协议集成 | 移除 |
| `movecall/ns.ts` | NS Token Swap | 特定代币 Swap | 移除 |
| `methods/suilend/` | Suilend 测试币 | 测试工具 | 仅保留 testnet |

### 5.2 Migration Strategy

1. **Phase 1**: 标记即将废弃的功能（deprecation warning）
2. **Phase 2**: 在文档中推荐替代方案
3. **Phase 3**: 从主代码中移除，保留在 `legacy/` 分支

---

## 6. Competitive Analysis

| 场景 | SuiScan | Sui Wallet | 协议官网 | 聚合器(7K等) | **SuiLancet** |
|------|---------|------------|----------|-------------|---------------|
| 查余额 | ✅ | ✅ | - | - | ✅ |
| Swap | - | - | ✅✅ | ✅✅ | ❌ (不做) |
| 借贷 | - | - | ✅✅ | - | ❌ (不做) |
| 批量清理垃圾 | ❌ | ❌ | ❌ | ❌ | **✅** |
| 钱包迁移 | ❌ | ❌ | ❌ | ❌ | **✅** |
| 空投风险检测 | ❌ | ❌ | ❌ | ❌ | **✅** |
| 批量转账 | ❌ | ❌ | ❌ | ❌ | **✅** |
| 交易模拟预览 | ❌ | ❌ | ❌ | ❌ | **✅** |
| Kiosk 管理 | 查看 | ❌ | ❌ | ❌ | **✅** |
| Gas 优化 | ❌ | ❌ | ❌ | ❌ | **✅** |
| 交易解析 | 基础 | ❌ | ❌ | ❌ | **✅✅** |

---

## 7. Success Metrics

| Metric | Target | 说明 |
|--------|--------|------|
| 月活跃用户 | 500+ | CLI + Web 合计 |
| 功能使用率 | >60% | 各功能被使用的比率 |
| 清理 Coin 数量 | 10K+/月 | 核心指标 |
| 用户留存 (M1) | >30% | 月留存率 |
| 安全事件预防 | 0 | 零安全漏洞 |

---

## 8. Non-Goals (明确不做)

- ❌ DEX 聚合 / Swap 功能
- ❌ 借贷协议集成
- ❌ 交易策略 / 机器人
- ❌ 钱包创建和密钥管理
- ❌ 社交功能
- ❌ 代币发行工具
- ❌ 流动性挖矿管理

---

## 9. Technical Constraints

1. **PTB 限制**: 单笔 Programmable Transaction Block 最多包含 1024 个命令
2. **Coin 合并限制**: 单笔最多合并 2048 个 Coin (1 + 2047)
3. **Gas Budget**: 需合理估算，过低会失败
4. **RPC 限制**: 注意调用频率，避免被限流
5. **Object 版本**: 并发操作需处理版本冲突

---

*Document End*
