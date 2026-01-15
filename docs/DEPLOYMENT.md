# SuiLancet 部署指南

## 概述

SuiLancet 前端使用 Cloudflare Pages 直连 GitHub 进行部署，支持 Dev 和 Prod 两个环境。

## 环境说明

| 环境 | 分支 | 默认网络 | Cloudflare 项目 |
|------|------|----------|-----------------|
| **Development** | `develop` | Testnet | `suilancet-dev` |
| **Production** | `main` | Mainnet | `suilancet` |

## Cloudflare Pages 配置

### 1. 创建项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create application** → **Pages**
3. 选择 **Connect to Git**
4. 授权并选择 `DolphinsLab/SuiLancet` 仓库

### 2. 构建配置

#### Dev 环境 (suilancet-dev)

| 设置 | 值 |
|------|-----|
| Project name | `suilancet-dev` |
| Production branch | `develop` |
| Framework preset | `None` |
| Root directory | `web` |
| Build command | `npm install && npm run build` |
| Build output directory | `dist` |

**环境变量:**

| 变量名 | 值 |
|--------|-----|
| `NODE_VERSION` | `20` |
| `VITE_APP_ENV` | `development` |
| `VITE_DEFAULT_NETWORK` | `testnet` |

#### Prod 环境 (suilancet)

| 设置 | 值 |
|------|-----|
| Project name | `suilancet` |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | `web` |
| Build command | `npm install && npm run build` |
| Build output directory | `dist` |

**环境变量:**

| 变量名 | 值 |
|--------|-----|
| `NODE_VERSION` | `20` |
| `VITE_APP_ENV` | `production` |
| `VITE_DEFAULT_NETWORK` | `mainnet` |

## 配置检查清单

### 构建配置检查

- [ ] Root directory 设置为 `web`
- [ ] Build command 为 `npm install && npm run build`
- [ ] Build output directory 为 `dist`
- [ ] Production branch 正确 (dev 用 `develop`, prod 用 `main`)

### 环境变量检查

- [ ] `NODE_VERSION` = `20`
- [ ] `VITE_APP_ENV` 已设置
- [ ] `VITE_DEFAULT_NETWORK` 已设置

### 部署后验证

- [ ] 页面正常加载 (无白屏)
- [ ] 控制台无报错
- [ ] 钱包连接按钮显示
- [ ] 默认网络正确 (Settings 页面查看)
- [ ] 所有路由正常 (`/coin`, `/transaction` 等)

## 部署方式

### 自动部署

推送代码到对应分支即可自动触发部署：

```bash
# Dev 环境
git push origin develop

# Prod 环境
git push origin main
```

### 手动部署

在 Cloudflare Pages 项目页面点击 **Retry deployment** 重新部署。

## 本地开发

```bash
# 进入前端目录
cd web

# 复制环境变量文件
cp .env.example .env.local

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 常见问题

### 1. 构建失败 - 找不到 package.json

**原因**: Root directory 未设置为 `web`

**解决**: Settings → Builds → Root directory → 填入 `web`

### 2. 页面 404

**原因**: SPA 路由未配置

**解决**: 已添加 `web/public/_redirects` 文件，确保已提交

### 3. 环境变量不生效

**原因**: Vite 环境变量需要 `VITE_` 前缀

**解决**: 确保变量名以 `VITE_` 开头

### 4. 默认网络不对

**检查方法**: 浏览器控制台执行

```javascript
console.log(import.meta.env.VITE_DEFAULT_NETWORK)
```

## 自定义域名

在 Cloudflare Pages 项目中配置:

1. 进入项目 → Custom domains
2. 添加域名
3. 配置 DNS 记录

**推荐配置**:
- Dev: `dev.suilancet.com`
- Prod: `suilancet.com` / `app.suilancet.com`

---

*最后更新: 2026-01-15*
