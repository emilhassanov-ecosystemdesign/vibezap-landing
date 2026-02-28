# VibZap.dev — AI Micro-Tools Portal

> **One tool. One zap. Problem solved.**

## Quick Start

```bash
cd /config/workspace/vibezap-landing
npm install
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build
```

## Project Overview

VibZap is a **React SPA** that serves as a portal/studio for AI-powered micro-tools. Each tool is a self-contained "micro-app" that lives at its own route under vibezap.dev.

**Live URL:** https://vibezap.dev
**Deployment:** Vercel (auto-deploys from Git)
**Payment:** LemonSqueezy (per-tool pricing, no subscriptions)

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.x |
| Routing | React Router DOM | 7.x |
| Build | Vite | 7.x |
| Deployment | Vercel | — |
| Serverless API | Vercel Functions (`/api`) | Node.js |
| AI Backend | Anthropic Claude API | Sonnet 4 |
| Payments | LemonSqueezy | — |
| Analytics | Google Analytics 4 | G-M8T1TQF1CV |
| Styling | Inline CSS-in-JS (React style props) | — |
| Fonts | Google Fonts (Syne, Outfit, JetBrains Mono, Playfair Display, DM Sans, Space Mono) | — |

## Folder Structure

```
vibezap-landing/
├── api/                          # Vercel serverless functions
│   ├── roast.js                  # POST /api/roast — Claude-powered website roast
│   └── scam-check.js             # POST /api/scam-check — Claude-powered scam analysis
├── src/
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Router — maps routes to micro-apps
│   ├── VibZapLanding.jsx         # Landing page (/)
│   └── apps/                     # Micro-app modules
│       ├── roast-my-website/
│       │   ├── RoastMyWebsite.jsx    # Roast tool UI (/roast)
│       │   └── README.md             # App-specific docs
│       └── scam-check/
│           ├── ScamCheck.jsx         # Scam check tool UI (/scam-check)
│           └── README.md             # App-specific docs
├── public/
│   └── favicon.svg
├── docs/                         # Project documentation
│   ├── tech-stack.md
│   ├── deployment.md
│   ├── architecture.md
│   └── micro-app-guide.md
├── vercel.json                   # Vercel config (SPA rewrites)
├── vite.config.js                # Vite config
├── package.json
└── CLAUDE.md                     # This file
```

## Micro-Apps Registry

| # | Tool | Route | API | Status | Price |
|---|------|-------|-----|--------|-------|
| 1 | Roast My Website | `/roast` | `/api/roast` | **Live** | Free / $5 full report |
| 2 | Am I Being Scammed? | `/scam-check` | `/api/scam-check` | **Live** | Free |
| 3 | Screenshot → Mockup | `/mockup` | — | Planned | $3 |
| 4 | TLDR Contract | `/tldr-contract` | — | Planned | $3 |
| 5 | 365 Social Posts | `/social-posts` | — | Planned | $15 |
| 6 | Vibe Check Email | `/vibe-check` | — | Planned | $2 |

## Critical Rules

1. **Don't break routing** — Every micro-app route must be registered in `App.jsx` AND the SPA rewrite in `vercel.json` covers all routes.
2. **API keys are env vars** — Never hardcode. `ANTHROPIC_API_KEY` is set in Vercel dashboard.
3. **Rate limiting is in-memory** — Resets on cold starts. For persistent limiting, migrate to KV/Redis.
4. **Inline styles only** — No CSS files. All styling is done via React `style` props to keep components self-contained.
5. **One component per micro-app** — Each micro-app is a single `.jsx` file in its `src/apps/<name>/` folder.
6. **Test build before push** — Always run `npm run build` locally. Vercel auto-deploys on push.

## Adding a New Micro-App

See [docs/micro-app-guide.md](docs/micro-app-guide.md) for the full template and steps.

Quick summary:
1. Create `src/apps/<app-name>/` folder with `<AppName>.jsx` and `README.md`
2. Add route in `App.jsx`
3. Add API endpoint in `api/<name>.js` (if needed)
4. Add tool card in `VibZapLanding.jsx` tools array
5. Update the Micro-Apps Registry table above

## Brand & Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#00E5FF` (Cyan) | CTAs, accents, links |
| Secondary | `#FF8A00` (Amber) | Highlights, badges |
| Background | `#06070B` (Near-black) | Page background |
| Surface | `#0C0D14` | Cards, panels |
| Border | `rgba(255,255,255,0.06)` | Subtle borders |
| Text Primary | `#FFFFFF` | Headings |
| Text Secondary | `rgba(255,255,255,0.7)` | Body text |
| Font Display | Syne | Headings, hero |
| Font Body | Outfit | Body text |
| Font Mono | JetBrains Mono | Code, badges |

## External Services

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| Vercel | Hosting + serverless | `vercel.json` + Vercel dashboard |
| Anthropic API | AI for micro-tools | `ANTHROPIC_API_KEY` env var |
| LemonSqueezy | Payments | Checkout URLs in app components |
| Google Analytics | Traffic tracking | `G-M8T1TQF1CV` in `index.html` |
| Google Fonts | Typography | `<link>` tags in `index.html` |

## Contact

- **Twitter/X:** @vibezapdev
- **Email:** hello@vibezap.dev
