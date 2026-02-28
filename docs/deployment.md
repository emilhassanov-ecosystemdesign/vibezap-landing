# Deployment Guide — VibeZap.dev

## Hosting: Vercel

VibeZap is deployed on **Vercel** with automatic Git integration.

### How It Works
1. Push to the connected Git branch (typically `main`)
2. Vercel detects the Vite framework via `vercel.json`
3. Runs `npm run build` → outputs to `dist/`
4. Deploys static files + serverless functions from `/api`

### Configuration (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The SPA rewrite ensures all client-side routes (e.g., `/roast`, `/scam-check`) resolve to `index.html`, where React Router handles routing.

### Environment Variables (Vercel Dashboard)

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key for AI-powered tools |

To add/update: Vercel Dashboard → Project → Settings → Environment Variables

### Custom Domain
- **Domain:** vibezap.dev
- Configured in Vercel Dashboard → Domains
- SSL is automatic (Let's Encrypt)

## Deployment Checklist (New Micro-App)

1. [ ] New component created in `src/apps/<name>/`
2. [ ] Route added in `src/App.jsx`
3. [ ] API endpoint added in `api/<name>.js` (if needed)
4. [ ] Tool card added in `VibeZapLanding.jsx`
5. [ ] Any new env vars added to Vercel dashboard
6. [ ] Local build passes: `npm run build`
7. [ ] Local preview works: `npm run preview`
8. [ ] Committed and pushed to Git
9. [ ] Vercel deployment succeeds (check dashboard)
10. [ ] Live URL tested: `https://vibezap.dev/<route>`

## Rollback

Vercel keeps all previous deployments. To rollback:
1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

## Preview Deployments

Every PR/branch push creates a preview URL (e.g., `vibezap-landing-abc123.vercel.app`). Use these to test before merging to production.

## Local Development

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build locally
```

**Note:** Serverless functions (`/api/*`) only work when deployed to Vercel or when using `vercel dev` locally. Install the Vercel CLI:

```bash
npm i -g vercel
vercel dev           # Runs local dev with serverless function support
```

## Monitoring

- **Vercel Dashboard** — Build logs, function logs, analytics
- **Google Analytics** — Traffic and engagement metrics
- **Vercel Functions tab** — Invocation counts, errors, cold starts
