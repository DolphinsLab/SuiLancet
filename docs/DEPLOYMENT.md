# SuiLancet Deployment Guide

## Overview

SuiLancet frontend uses Cloudflare Pages with direct GitHub connection for deployment, supporting both Dev and Prod environments.

## Environment Overview

| Environment | Branch | Default Network | Cloudflare Project |
|-------------|--------|-----------------|-------------------|
| **Development** | `develop` | Testnet | `suilancet-dev` |
| **Production** | `main` | Mainnet | `suilancet` |

## Cloudflare Pages Configuration

### 1. Create Project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** → **Create application** → **Pages**
3. Select **Connect to Git**
4. Authorize and select `DolphinsLab/SuiLancet` repository

### 2. Build Configuration

#### Dev Environment (suilancet-dev)

| Setting | Value |
|---------|-------|
| Project name | `suilancet-dev` |
| Production branch | `develop` |
| Framework preset | `None` |
| Root directory | `web` |
| Build command | `npm install && npm run build` |
| Build output directory | `dist` |

**Environment Variables:**

| Variable | Value |
|----------|-------|
| `NODE_VERSION` | `20` |
| `VITE_APP_ENV` | `development` |
| `VITE_DEFAULT_NETWORK` | `testnet` |

#### Prod Environment (suilancet)

| Setting | Value |
|---------|-------|
| Project name | `suilancet` |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | `web` |
| Build command | `npm install && npm run build` |
| Build output directory | `dist` |

**Environment Variables:**

| Variable | Value |
|----------|-------|
| `NODE_VERSION` | `20` |
| `VITE_APP_ENV` | `production` |
| `VITE_DEFAULT_NETWORK` | `mainnet` |

## Configuration Checklist

### Build Configuration Check

- [ ] Root directory is set to `web`
- [ ] Build command is `npm install && npm run build`
- [ ] Build output directory is `dist`
- [ ] Production branch is correct (dev uses `develop`, prod uses `main`)

### Environment Variables Check

- [ ] `NODE_VERSION` = `20`
- [ ] `VITE_APP_ENV` is set
- [ ] `VITE_DEFAULT_NETWORK` is set

### Post-Deployment Verification

- [ ] Page loads normally (no white screen)
- [ ] No console errors
- [ ] Wallet connect button displays
- [ ] Default network is correct (check Settings page)
- [ ] All routes work (`/coin`, `/transaction`, etc.)

## Deployment Methods

### Automatic Deployment

Push code to the corresponding branch to trigger automatic deployment:

```bash
# Dev environment
git push origin develop

# Prod environment
git push origin main
```

### Manual Deployment

Click **Retry deployment** on the Cloudflare Pages project page to redeploy.

## Local Development

```bash
# Enter frontend directory
cd web

# Copy environment variables file
cp .env.example .env.local

# Install dependencies
npm install

# Start development server
npm run dev
```

## Troubleshooting

### 1. Build Failed - Cannot find package.json

**Cause**: Root directory not set to `web`

**Solution**: Settings → Builds → Root directory → Enter `web`

### 2. Page 404

**Cause**: SPA routing not configured

**Solution**: `web/public/_redirects` file has been added, ensure it's committed

### 3. Environment Variables Not Working

**Cause**: Vite environment variables require `VITE_` prefix

**Solution**: Ensure variable names start with `VITE_`

### 4. Wrong Default Network

**Check Method**: Execute in browser console:

```javascript
console.log(import.meta.env.VITE_DEFAULT_NETWORK)
```

## Custom Domain

Configure in Cloudflare Pages project:

1. Go to project → Custom domains
2. Add domain
3. Configure DNS records

**Recommended Configuration**:
- Dev: `dev.suilancet.com`
- Prod: `suilancet.com` / `app.suilancet.com`

---

*Last updated: 2026-01-15*
