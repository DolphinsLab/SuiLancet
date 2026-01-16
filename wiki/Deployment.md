# Deployment

Guide to deploying the SuiLancet web application.

---

## Cloudflare Pages Deployment

### Prerequisites

- GitHub account
- Cloudflare account
- Repository pushed to GitHub

### Setup Steps

#### 1. Connect Repository

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click **Create application** > **Pages**
4. Select **Connect to Git**
5. Authorize GitHub and select your repository

#### 2. Configure Build Settings

| Setting | Value |
|---------|-------|
| **Framework preset** | None |
| **Build command** | `cd web && npm install && npm run build` |
| **Build output directory** | `web/dist` |
| **Root directory** | `/` |

#### 3. Environment Variables

Add these in the Cloudflare Pages settings:

| Variable | Production Value | Preview Value |
|----------|-----------------|---------------|
| `VITE_APP_ENV` | `production` | `development` |
| `VITE_DEFAULT_NETWORK` | `mainnet` | `testnet` |

#### 4. Deploy

Click **Save and Deploy**. Cloudflare will:
1. Clone your repository
2. Run the build command
3. Deploy to global CDN

### Custom Domain

1. Go to **Custom domains** tab
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `app.suilancet.com`)
4. Add the provided DNS records to your domain registrar

---

## Manual Deployment

### Build Locally

```bash
cd web
npm install
npm run build
```

The production bundle will be in `web/dist/`.

### Deploy to Any Static Host

Upload the contents of `web/dist/` to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any static file server

### SPA Routing Configuration

For single-page app routing, configure your host to redirect all paths to `index.html`.

**Cloudflare Pages** (`public/_redirects`):
```
/* /index.html 200
```

**Nginx**:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Apache** (`.htaccess`):
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

---

## CI/CD with GitHub Actions

### Automatic Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
    paths:
      - 'web/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install and Build
        run: |
          cd web
          npm ci
          npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: suilancet
          directory: web/dist
```

### Required Secrets

Add these to your GitHub repository secrets:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with Pages edit permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

---

## Production Checklist

Before deploying to production:

- [ ] Environment variables configured correctly
- [ ] Default network set to `mainnet`
- [ ] Build completes without errors
- [ ] All TypeScript errors resolved
- [ ] SPA routing configured
- [ ] Custom domain SSL active

---

## Troubleshooting

### Build Fails

**Check Node.js version**: Ensure Node.js 18+ is used.

```bash
node --version  # Should be 18.x or higher
```

### Blank Page After Deploy

**Cause**: Missing SPA redirect configuration.

**Solution**: Add `_redirects` file to `public/` directory.

### Assets Not Loading

**Cause**: Incorrect base path.

**Solution**: Check `vite.config.ts` base setting:
```typescript
export default defineConfig({
  base: '/',  // or '/subpath/' if deployed to subpath
})
```

---

*See also: [[Web-Application]] for development setup*
