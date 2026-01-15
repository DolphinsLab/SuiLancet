# SuiLancet 部署指南

## 概述

SuiLancet 前端使用 GitHub Actions 自动部署到 Cloudflare Pages，支持 Dev 和 Prod 两个环境。

## 环境说明

| 环境 | 分支 | 默认网络 | Cloudflare 项目 |
|------|------|----------|-----------------|
| **Development** | `develop` | Testnet | `suilancet-dev` |
| **Production** | `main` | Mainnet | `suilancet` |

## 前置要求

### 1. Cloudflare 配置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 获取 Account ID (在 Workers & Pages 页面右侧)
3. 创建 API Token:
   - 进入 My Profile > API Tokens
   - Create Token > Custom Token
   - 权限: `Cloudflare Pages:Edit`, `Account:Read`

### 2. GitHub Secrets 配置

在 GitHub 仓库设置中添加以下 Secrets:

| Secret 名称 | 说明 |
|-------------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |

路径: Repository Settings > Secrets and variables > Actions > New repository secret

### 3. Cloudflare Pages 项目创建

首次部署前，需要在 Cloudflare 创建 Pages 项目:

```bash
# 本地安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 Dev 项目
wrangler pages project create suilancet-dev

# 创建 Prod 项目
wrangler pages project create suilancet
```

## 部署方式

### 自动部署

#### Dev 环境
- 推送代码到 `develop` 分支
- 修改 `web/` 目录下的文件时自动触发

```bash
git checkout develop
git push origin develop
```

#### Prod 环境
- 推送代码到 `main` 分支
- 发布 Release 时自动触发

```bash
git checkout main
git push origin main
```

### 手动部署

通过 GitHub Actions 手动触发:

1. 进入 Actions 页面
2. 选择 "Manual Deploy to Cloudflare Pages"
3. 点击 "Run workflow"
4. 选择环境和网络配置
5. 点击 "Run workflow" 执行

## Workflows 说明

### deploy-dev.yml
- **触发条件**: 推送到 `develop` 分支
- **部署目标**: `suilancet-dev` 项目
- **环境变量**:
  - `VITE_APP_ENV=development`
  - `VITE_DEFAULT_NETWORK=testnet`

### deploy-prod.yml
- **触发条件**: 推送到 `main` 分支 或 发布 Release
- **部署目标**: `suilancet` 项目
- **环境变量**:
  - `VITE_APP_ENV=production`
  - `VITE_DEFAULT_NETWORK=mainnet`

### deploy-manual.yml
- **触发条件**: 手动触发
- **可选参数**:
  - `environment`: dev / prod
  - `network`: mainnet / testnet / devnet

## 环境变量

| 变量名 | 说明 | Dev 默认值 | Prod 默认值 |
|--------|------|------------|-------------|
| `VITE_APP_ENV` | 应用环境 | `development` | `production` |
| `VITE_DEFAULT_NETWORK` | 默认 Sui 网络 | `testnet` | `mainnet` |

## 本地开发

```bash
# 进入前端目录
cd web

# 复制环境变量文件
cp .env.example .env.local

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

## 构建命令

```bash
# 开发构建
VITE_APP_ENV=development VITE_DEFAULT_NETWORK=testnet pnpm build

# 生产构建
VITE_APP_ENV=production VITE_DEFAULT_NETWORK=mainnet pnpm build
```

## 部署后验证

### 检查清单

- [ ] 页面正常加载
- [ ] 钱包连接功能正常
- [ ] 网络切换正确 (Dev 默认 Testnet, Prod 默认 Mainnet)
- [ ] 所有页面路由正常

### 常见问题

#### 1. 部署失败: API Token 无效
- 检查 `CLOUDFLARE_API_TOKEN` 是否正确
- 确认 Token 权限包含 Cloudflare Pages

#### 2. 部署失败: 项目不存在
- 确认已创建对应的 Cloudflare Pages 项目
- 项目名称必须与 workflow 中一致

#### 3. 页面 404
- 检查 Cloudflare Pages 的 SPA 配置
- 添加 `_redirects` 文件: `/* /index.html 200`

## 自定义域名

在 Cloudflare Pages 项目中配置:

1. 进入项目 > Custom domains
2. 添加域名
3. 配置 DNS 记录

**推荐配置**:
- Dev: `dev.suilancet.com`
- Prod: `suilancet.com` / `app.suilancet.com`

---

*最后更新: 2026-01-15*
