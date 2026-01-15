# CLAUDE.md - SuiLancet 项目指南

## 项目概述

SuiLancet 是一个轻量级的个人工具，用于在一个地方管理多个 Sui 钱包和后端服务。

---

## 开发流程 (Issue-Driven Development)

### 核心原则

**所有功能开发必须通过 Issue 驱动**，遵循以下流程：

### 1. Issue 创建规范

```
标题格式: [类型] 简短描述
类型标签: feature | bug | refactor | docs | test | chore
```

**Issue 模板**:
- **目标**: 清晰描述要实现什么
- **背景**: 为什么需要这个功能
- **验收标准**: 完成的定义 (Definition of Done)
- **技术方案**: (可选) 初步技术思路

### 2. 分支管理

```
分支命名规范:
- feature/issue-{number}-{short-description}
- bugfix/issue-{number}-{short-description}
- refactor/issue-{number}-{short-description}
```

### 3. 开发流程

```
1. 创建 Issue → 描述需求和验收标准
2. 创建分支 → 从 main 分支切出，关联 Issue 编号
3. 开发实现 → 遵循代码规范
4. 提交代码 → Commit message 引用 Issue (#123)
5. 创建 PR → 关联 Issue，请求 Review
6. 代码合并 → PR 合并后自动关闭 Issue
```

### 4. Commit 规范

```
格式: <type>(<scope>): <subject> (#issue-number)

类型 (type):
- feat:     新功能
- fix:      Bug 修复
- refactor: 代码重构
- docs:     文档更新
- test:     测试相关
- chore:    构建/工具变更

示例:
- feat(wallet): add multi-wallet support (#12)
- fix(backend): resolve connection timeout (#15)
- docs(readme): update installation guide (#8)
```

### 5. PR 规范

**PR 标题**: `[#Issue编号] 简短描述`

**PR 描述模板**:
```markdown
## 关联 Issue
Closes #xxx

## 变更内容
- 变更点 1
- 变更点 2

## 测试说明
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成

## 截图/录屏 (如适用)
```

---

## 项目规范

### 技术栈

- **区块链**: Sui Network
- **主要语言**: TypeScript / Rust (待定)
- **包管理**: pnpm / cargo (待定)

### 目录结构 (规划)

```
SuiLancet/
├── src/                    # 源代码
│   ├── wallet/            # 钱包管理模块
│   ├── backend/           # 后端服务模块
│   ├── config/            # 配置管理
│   └── utils/             # 工具函数
├── tests/                  # 测试文件
├── docs/                   # 文档
├── scripts/                # 脚本工具
└── .github/               # GitHub 配置
    ├── workflows/         # CI/CD
    └── ISSUE_TEMPLATE/    # Issue 模板
```

### 代码规范

1. **命名规范**
   - 文件名: `kebab-case.ts`
   - 类名: `PascalCase`
   - 函数/变量: `camelCase`
   - 常量: `UPPER_SNAKE_CASE`

2. **代码风格**
   - 使用 ESLint + Prettier (TypeScript)
   - 使用 rustfmt + clippy (Rust)
   - 单文件不超过 300 行
   - 函数不超过 50 行

3. **注释规范**
   - 公共 API 必须有 JSDoc/RustDoc
   - 复杂逻辑添加行内注释
   - TODO 格式: `// TODO(#issue): description`

### 测试规范

- 单元测试覆盖率目标: > 80%
- 关键路径必须有集成测试
- 测试文件命名: `*.test.ts` 或 `*_test.rs`

### 安全规范

- 私钥/助记词绝不能硬编码或提交到仓库
- 敏感配置使用环境变量
- 定期更新依赖，修复安全漏洞

---

## Claude 协作指南

### 任务处理流程

1. **接收任务时**: 首先确认关联的 Issue 编号
2. **开发时**: 在对应的 feature 分支工作
3. **提交时**: Commit message 必须引用 Issue
4. **完成时**: 创建 PR 并关联 Issue

### 代码修改原则

- 先阅读相关代码，理解上下文
- 最小化改动，只做必要的修改
- 不引入不必要的重构或"改进"
- 保持代码风格一致性

### 禁止事项

- 不提交包含敏感信息的代码
- 不直接推送到 main 分支
- 不创建没有 Issue 关联的功能分支
- 不忽略测试失败

---

## 常用命令 (待补充)

```bash
# 开发
# pnpm dev / cargo run

# 测试
# pnpm test / cargo test

# 构建
# pnpm build / cargo build --release

# 代码检查
# pnpm lint / cargo clippy
```

---

## 版本发布

遵循语义化版本 (Semantic Versioning):
- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的新功能
- **PATCH**: 向后兼容的 Bug 修复

---

*最后更新: 2026-01-15*
