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
| `NODE_VERSION` | `22` |
| `VITE_APP_ENV` | `development` |
| `VITE_DEFAULT_NETWORK` | `testnet` |
| `VITE_SUI_GRPC_TESTNET` | `https://fullnode.testnet.sui.io:443` |
| `VITE_SUI_GRPC_MAINNET` | `https://fullnode.mainnet.sui.io:443` |
| `VITE_SUI_GRPC_DEVNET` | `https://fullnode.devnet.sui.io:443` |

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
| `NODE_VERSION` | `22` |
| `VITE_APP_ENV` | `production` |
| `VITE_DEFAULT_NETWORK` | `mainnet` |
| `VITE_SUI_GRPC_MAINNET` | `https://fullnode.mainnet.sui.io:443` |
| `VITE_SUI_GRPC_TESTNET` | `https://fullnode.testnet.sui.io:443` |
| `VITE_SUI_GRPC_DEVNET` | `https://fullnode.devnet.sui.io:443` |

## Configuration Checklist

### Build Configuration Check

- [ ] Root directory is set to `web`
- [ ] Build command is `npm install && npm run build`
- [ ] Build output directory is `dist`
- [ ] Production branch is correct (dev uses `develop`, prod uses `main`)

### Environment Variables Check

- [ ] `NODE_VERSION` = `22`
- [ ] `VITE_APP_ENV` is set
- [ ] `VITE_DEFAULT_NETWORK` is set
- [ ] `VITE_SUI_GRPC_*` endpoints use HTTPS and support gRPC-web

### Post-Deployment Verification

- [ ] Page loads normally (no white screen)
- [ ] No console errors
- [ ] Wallet connect button displays
- [ ] Default network is correct (check Settings page)
- [ ] All routes work (`/clean`, `/manage`, `/secure`, `/query`, `/settings`)
- [ ] Dashboard balance and Query object lookup return data
- [ ] Browser network panel shows gRPC-web service requests
- [ ] No Sui JSON-RPC request or legacy dApp Kit bundle is present

## Deployment Methods

### Automatic Deployment

Push code to the corresponding branch to trigger automatic deployment:

```bash
# Dev environment
git push origin develop

# Prod environment
git push origin main
```

Production changes must reach `main` through an issue-linked pull request after
the root tests, live gRPC smoke test, and Web production build pass. Do not push
the release branch directly to `main`.

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

### 5. gRPC Requests Fail

Confirm the endpoint supports browser gRPC-web requests and CORS. The production
default is `https://fullnode.mainnet.sui.io:443`. A generic JSON-RPC-only
endpoint is not compatible with this release.

## Production Rollout and Rollback

Before merging:

- Record the current production deployment and `main` commit as the rollback target.
- Verify `RUN_LIVE_GRPC=1 npm test -- tests/grpc-live.test.ts`.
- Verify `npm test`, root `npm run build`, and Web `npm run build`.
- Confirm the Cloudflare production variables above are set before the build starts.

After merging:

1. Wait for the Cloudflare Pages deployment associated with the merged `main` commit.
2. Verify the production URL, all routes, wallet connect UI, mainnet balance read,
   object lookup, and transaction simulation.
3. Inspect browser requests and confirm Sui calls use gRPC-web service endpoints.
4. Watch error rate and latency during the initial rollout window.

Rollback immediately if critical gRPC reads fail, transaction simulation reports
incorrect status, error rate doubles, or P95 latency increases by more than 50%.
Use Cloudflare Pages to roll back to the recorded deployment, verify it is healthy,
and keep the gRPC pull request open until a regression test covers the failure.

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
