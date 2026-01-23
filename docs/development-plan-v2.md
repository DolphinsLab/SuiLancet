# SuiLancet v2 - Development Plan

> **Version**: 2.0
> **Last Updated**: 2026-01-23
> **Reference**: [PRD-v2.md](./PRD-v2.md)

---

## Overview

本文档将 PRD v2 的功能需求拆解为具体的开发计划，分为 4 个 Phase 执行。

---

## Phase 0: Codebase Refactor (基础重构)

> **Goal**: 清理遗留代码，建立新的模块结构

### 0.1 移除废弃模块

| Task | Files | Issue |
|------|-------|-------|
| 移除 Cetus swap 模块 | `src/movecall/cetus/`, `src/methods/cetus/` | SUI-TBD |
| 移除 DeepBook 模块 | `src/movecall/deepbookv3/`, `src/methods/deepbookv3/` | SUI-TBD |
| 移除套利模块 | `src/methods/make_money.ts` | SUI-TBD |
| 移除 Margin Trading 模块 | `src/movecall/margin-trading/`, `src/methods/margin_trading/` | SUI-TBD |
| 移除 HoneyPot 模块 | `src/movecall/honny-hot/`, `src/methods/destory_honny.ts` | SUI-TBD |
| 移除 NS Swap | `src/movecall/ns.ts` | SUI-TBD |
| 移除 Suilend 模块 | `src/movecall/suilend/`, `src/methods/suilend/` | SUI-TBD |

### 0.2 重构目录结构

```
src/
├── core/                    # 核心层
│   ├── client.ts           # SuiScriptClient (保持)
│   ├── transaction.ts      # 交易构建器
│   └── types.ts            # 公共类型
├── modules/                 # 功能模块
│   ├── clean/              # 清理工具
│   │   ├── index.ts
│   │   ├── dust-cleaner.ts
│   │   ├── airdrop-detector.ts
│   │   ├── zero-destroyer.ts
│   │   └── coin-merger.ts
│   ├── manage/             # 管理工具
│   │   ├── index.ts
│   │   ├── wallet-migration.ts
│   │   ├── batch-transfer.ts
│   │   ├── kiosk-manager.ts
│   │   └── batch-claim.ts
│   ├── secure/             # 安全工具
│   │   ├── index.ts
│   │   ├── tx-simulator.ts
│   │   ├── wallet-scanner.ts
│   │   └── gas-optimizer.ts
│   └── query/              # 查询工具
│       ├── index.ts
│       ├── asset-overview.ts
│       ├── tx-parser.ts
│       └── object-inspector.ts
├── cli/                     # CLI 入口
│   ├── index.ts
│   ├── commands/
│   │   ├── clean.ts
│   │   ├── manage.ts
│   │   ├── secure.ts
│   │   └── query.ts
│   └── utils/
│       └── output.ts       # CLI 输出格式化
├── common/                  # 通用工具 (保持)
└── index.ts                 # SDK 导出入口
```

### 0.3 基础设施升级

| Task | 说明 |
|------|------|
| 添加 CLI 输出美化 | 使用 chalk/ora 提供彩色输出和 spinner |
| 添加 --dry-run 全局选项 | 所有写操作支持预览模式 |
| 添加 --json 输出选项 | 支持机器可读输出 |
| 添加进度条 | 批量操作显示进度 |
| 统一错误处理 | 友好的错误提示和恢复建议 |

---

## Phase 1: Clean Module (清理工具)

> **Goal**: 实现核心清理功能，解决最常见的用户痛点

### 1.1 粉尘清理器 (Dust Cleaner)

**Issue**: SUI-TBD

**Implementation Steps**:

1. **获取代币价格数据**
   - 集成链上 Oracle 或 CoinGecko API
   - 缓存价格数据（5 分钟 TTL）
   - Fallback: 无价格数据的代币标记为 unknown

2. **扫描钱包 Coin 对象**
   - 复用现有 `getAllCoins()` 方法
   - 计算每个 Coin 的 USD 价值
   - 按价值排序

3. **生成清理计划**
   - 列出所有低于阈值的 Coin
   - 显示汇总信息（数量、类型、总价值）
   - 用户确认后执行

4. **执行清理**
   - 批量构建 destroy 交易
   - 遵守 PTB 限制自动分批
   - 显示执行结果

**CLI Interface**:
```bash
sui-lancet clean dust [options]
  --threshold <usd>    # 阈值，默认 0.01
  --dry-run            # 仅预览
  --include-unknown    # 包含无法定价的代币
  --yes                # 跳过确认
```

**Acceptance Criteria**:
- [ ] 正确获取 Coin 价格
- [ ] 按价值筛选低价值 Coin
- [ ] dry-run 模式不执行交易
- [ ] 批量销毁遵守 PTB 限制
- [ ] 有清晰的执行结果报告

---

### 1.2 空投检测器 (Airdrop Detector)

**Issue**: SUI-TBD

**Implementation Steps**:

1. **建立风险规则引擎**
   - 维护已知恶意合约地址列表
   - 定义风险评估规则:
     - 代币无流动性 → 中风险
     - 合约未验证 → 中风险
     - 匹配已知恶意列表 → 高风险
     - 代币名称仿冒已知品牌 → 高风险

2. **扫描钱包对象**
   - 获取所有 Coin 和非 Coin 对象
   - 检查对象来源（TransferObject 事件）
   - 匹配风险规则

3. **生成风险报告**
   - 按风险等级分组显示
   - 提供每个可疑对象的详细信息
   - 给出操作建议

4. **安全销毁**
   - 高风险对象一键销毁
   - 确保销毁操作本身安全（不触发恶意合约逻辑）

**CLI Interface**:
```bash
sui-lancet clean airdrop [options]
  scan                 # 扫描可疑空投
  destroy              # 销毁可疑对象
  --risk <level>       # high | medium | all
```

**Acceptance Criteria**:
- [ ] 正确识别已知恶意代币
- [ ] 风险评估规则合理
- [ ] 不误删用户有价值的代币
- [ ] 销毁操作安全可靠

---

### 1.3 增强现有 Coin 操作

**Issue**: SUI-TBD

**Enhancements**:
- 添加操作前后对比报告
- 添加进度条显示
- 统一 CLI 输出格式
- 添加 --dry-run 支持

---

## Phase 2: Manage Module (管理工具)

> **Goal**: 实现资产管理和批量操作功能

### 2.1 钱包迁移工具 (Wallet Migration)

**Issue**: SUI-TBD

**Implementation Steps**:

1. **资产扫描**
   - 获取所有 Coin 对象
   - 获取所有 owned Object（含 NFT）
   - 检测 Kiosk 内对象
   - 检测 Dynamic Field 对象
   - 生成资产清单

2. **迁移计划生成**
   - 按对象类型分组
   - 计算所需交易数量（基于 PTB 限制）
   - 估算总 Gas 消耗
   - 保留足够 SUI 支付 Gas
   - 显示迁移计划预览

3. **分批执行迁移**
   - 先迁移非 SUI Coin
   - 再迁移 NFT 和 Object
   - 最后迁移剩余 SUI（扣除 Gas）
   - 每批次完成后确认状态
   - 失败自动重试

4. **生成迁移报告**
   - 成功/失败统计
   - 未迁移对象列表（如有）
   - 新旧地址资产对比

**CLI Interface**:
```bash
sui-lancet manage migrate [options]
  --to <address>       # 目标地址 (必填)
  --preview            # 仅预览迁移计划
  --execute            # 执行迁移
  --type <type>        # 只迁移指定类型 (coin|nft|object)
  --exclude <types>    # 排除指定类型
  --batch-size <n>     # 每批次对象数量，默认 50
```

**Acceptance Criteria**:
- [ ] 正确扫描所有类型的资产
- [ ] 迁移计划准确反映实际操作
- [ ] 分批执行遵守 PTB 限制
- [ ] Gas 预留合理，不会因 gas 不足失败
- [ ] 失败批次可重试
- [ ] 生成准确的迁移报告

---

### 2.2 批量 Object 转移增强

**Issue**: SUI-TBD

**New Features**:
- 按类型过滤: `--type "0x2::coin::Coin<0x2::sui::SUI>"`
- NFT 批量转移支持
- Kiosk 内对象转移
- 支持正则匹配类型

---

### 2.3 Kiosk 管理器

**Issue**: SUI-TBD

**Implementation Steps**:

1. **Kiosk 发现**
   - 查询用户 owned 的所有 Kiosk 对象
   - 获取 Kiosk 内容列表

2. **内容展示**
   - 显示每个 Kiosk 中的物品
   - 显示物品类型、ID、listing 状态

3. **操作功能**
   - 提取物品到钱包
   - 批量提取
   - 转移 Kiosk 所有权

---

### 2.4 批量 Claim

**Issue**: SUI-TBD

**Implementation Steps**:

1. **协议适配器接口**
   ```typescript
   interface ClaimAdapter {
     name: string;
     detect(client: SuiClient, address: string): Promise<ClaimableReward[]>;
     claim(client: SuiClient, rewards: ClaimableReward[]): Promise<Transaction>;
   }
   ```

2. **已知协议适配**
   - 初期支持: Staking rewards, LP rewards
   - 可扩展: 用户可自定义适配器

3. **执行 Claim**
   - 批量构建 claim 交易
   - 自动分批处理

---

## Phase 3: Secure Module (安全工具)

> **Goal**: 提供交易安全保障和优化建议

### 3.1 交易模拟可视化

**Issue**: SUI-TBD

**Implementation Steps**:

1. **增强 devInspect 结果解析**
   - 解析 effects 中的 object changes
   - 提取 Coin balance 变动
   - 识别新创建/删除的对象

2. **人类可读输出**
   ```
   Transaction Simulation Result:
   ┌─────────────────────────────────────────┐
   │ Balance Changes:                        │
   │   SUI:   -1.5 → 98.5                   │
   │   USDC:  +150.0 → 150.0                │
   │                                         │
   │ Objects Created: 1                      │
   │ Objects Deleted: 2                      │
   │                                         │
   │ Gas Cost: ~0.005 SUI                    │
   │ Risk Level: LOW                         │
   └─────────────────────────────────────────┘
   ```

3. **风险提示**
   - 大额转出警告
   - 首次交互合约提醒
   - 授权操作提醒

**Acceptance Criteria**:
- [ ] 正确解析 balance 变动
- [ ] 输出格式清晰易读
- [ ] 风险提示准确

---

### 3.2 钱包安全扫描

**Issue**: SUI-TBD

**Implementation Steps**:

1. **扫描维度**
   - 对象类型异常检测
   - 可疑转入记录
   - 高权限对象检测（AdminCap 等）
   - 授权状态检查

2. **报告生成**
   ```
   Wallet Security Report:
   ┌─────────────────────────────────────────┐
   │ Address: 0x1234...5678                  │
   │ Risk Score: 72/100 (MEDIUM)             │
   │                                         │
   │ Findings:                               │
   │ ⚠️  3 unverified token types detected    │
   │ ⚠️  1 high-permission object found       │
   │ ✓  No suspicious recent transactions    │
   │ ✓  No known malicious interactions      │
   └─────────────────────────────────────────┘
   ```

---

### 3.3 Gas 优化器

**Issue**: SUI-TBD

**Implementation Steps**:

1. **交易分析**
   - 解析交易命令数量和类型
   - 评估 computation cost
   - 参考历史同类交易 gas 消耗

2. **网络状态感知**
   - 获取当前 reference gas price
   - 评估网络拥堵程度

3. **建议输出**
   - 推荐 gas budget
   - 预估实际消耗
   - 节省百分比提示

---

## Phase 4: Query Module (查询工具)

> **Goal**: 提供强大的链上数据查询和解析能力

### 4.1 资产全览增强

**Issue**: SUI-TBD

**Implementation Steps**:

1. **数据聚合**
   - Coin 余额 + USD 估值
   - NFT 列表 + 元数据
   - 其他 Object 分类

2. **输出格式**
   ```
   Wallet Overview: 0x1234...5678
   ┌─────────────────────────────────────────┐
   │ Total Value: ~$1,234.56                 │
   │                                         │
   │ Coins (5 types):                        │
   │   SUI     100.00    ($120.00)           │
   │   USDC    500.00    ($500.00)           │
   │   DEEP    1000.00   ($50.00)            │
   │   ...                                   │
   │                                         │
   │ NFTs (3):                               │
   │   SuiFrens #1234                        │
   │   ...                                   │
   │                                         │
   │ Other Objects (7)                       │
   └─────────────────────────────────────────┘
   ```

---

### 4.2 交易历史解析

**Issue**: SUI-TBD

**Implementation Steps**:

1. **交易获取**
   - 通过 queryTransactionBlocks 获取历史
   - 支持分页和过滤

2. **语义解析**
   - 将 Move call 翻译为人类语言
   - 识别常见操作模式（转账、swap、mint 等）
   - 提取关键参数

3. **输出示例**
   ```
   Recent Transactions:
   ┌──────────────────────────────────────────────────────┐
   │ #1  2h ago   Transfer                               │
   │     Sent 10.5 SUI to 0xabcd...                      │
   │     Gas: 0.003 SUI                                  │
   │                                                      │
   │ #2  5h ago   Swap (Cetus)                           │
   │     100 USDC → 83.2 SUI                             │
   │     Gas: 0.008 SUI                                  │
   │                                                      │
   │ #3  1d ago   NFT Mint                               │
   │     Minted SuiFrens #1234                           │
   │     Gas: 0.01 SUI                                   │
   └──────────────────────────────────────────────────────┘
   ```

---

### 4.3 Object 详情查询

**Issue**: SUI-TBD

**Implementation Steps**:

1. **基础信息获取**
   - Object ID, version, digest
   - Owner 信息
   - Object type

2. **内容解析**
   - 结构化显示 fields
   - 支持 Dynamic Field 遍历
   - 嵌套对象展开

---

## Development Guidelines

### Code Standards (Per Module)

```typescript
// 每个 module 的 index.ts 导出标准接口
export interface ModuleCommand {
  name: string;
  description: string;
  options: CommandOption[];
  execute(ctx: CommandContext): Promise<CommandResult>;
}

// 统一的命令结果
export interface CommandResult {
  success: boolean;
  data?: unknown;
  message: string;
  report?: string;  // 人类可读报告
}
```

### Testing Strategy

| Layer | 覆盖率目标 | 方法 |
|-------|-----------|------|
| Core | >90% | Unit tests, mock SuiClient |
| Modules | >80% | Unit + Integration tests |
| CLI | >60% | Command parsing tests |
| E2E | Critical paths | Testnet integration |

### PR Workflow (Per Feature)

```
1. Create Linear Issue (SUI-XXX)
2. Create branch: feature/SUI-XXX-description
3. Implement with tests
4. PR with issue reference
5. Review & merge
```

---

## Dependencies & Tools

### New Dependencies (Planned)

| Package | Purpose | Phase |
|---------|---------|-------|
| `chalk` | CLI colored output | 0 |
| `ora` | CLI spinners | 0 |
| `cli-table3` | Table formatting | 0 |
| `inquirer` | Interactive prompts | 0 |
| `progress` | Progress bars | 0 |

### External APIs

| API | Purpose | Phase |
|-----|---------|-------|
| CoinGecko/DexScreener | Token pricing | 1 |
| Sui RPC | On-chain queries | All |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| RPC 限流 | 批量操作失败 | 实现请求队列 + 退避重试 |
| 代币定价不准 | 误删有价值代币 | 保守阈值 + 确认机制 |
| PTB 限制变更 | 批量操作失败 | 动态检测限制 |
| 恶意对象交互 | 安全风险 | 仅执行 destroy，不调用对象方法 |

---

## Summary

| Phase | 核心交付物 | Issue 数量 (预估) |
|-------|-----------|-------------------|
| Phase 0 | 重构后的干净代码库 | 3-5 |
| Phase 1 | 粉尘清理 + 空投检测 | 3-4 |
| Phase 2 | 钱包迁移 + Kiosk 管理 | 4-5 |
| Phase 3 | 交易模拟 + 安全扫描 | 3-4 |
| Phase 4 | 资产全览 + 交易解析 | 3-4 |

**Total**: ~16-22 个 Linear Issues

---

*Document End*
