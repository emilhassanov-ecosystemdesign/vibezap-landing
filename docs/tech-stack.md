# Tech Stack — VibeZap.dev

## Frontend

### React 19 + Vite 7
- **React 19** — Latest stable. Using function components + hooks exclusively.
- **Vite 7** — Fast HMR dev server, optimized production builds via Rollup.
- **React Router DOM 7** — Client-side routing. All routes defined in `src/App.jsx`.
- **No CSS framework** — Pure inline styles via React `style` props. Keeps components fully self-contained.

### Why this stack?
- Zero config complexity — `npm create vite` + React plugin is all you need
- Instant dev feedback with Vite's native ESM dev server
- Tiny bundle size (React 19 + Router ≈ 50KB gzipped)
- Vercel has first-class Vite support (auto-detected framework)

## Serverless Backend

### Vercel Functions
- Files in `/api/*.js` auto-deploy as serverless endpoints
- Node.js runtime (default)
- Each function runs independently with its own cold start
- Rate limiting is in-memory (resets on cold start) — upgrade to Vercel KV for persistence if needed

### API Pattern
```
POST /api/<tool-name>
Body: { ...tool-specific input }
Response: { ...structured JSON result }
```

## AI Layer

### Anthropic Claude API
- **Model:** `claude-sonnet-4-20250514` (Sonnet 4)
- **Features used:** Tool use (web_search), structured JSON output
- **Auth:** `ANTHROPIC_API_KEY` env var in Vercel dashboard
- Each micro-app may use a different model/configuration depending on cost vs quality needs

## Payments

### LemonSqueezy
- No-code checkout links embedded in micro-app CTAs
- Per-tool pricing (no subscriptions)
- Checkout URLs are hardcoded in app components (update in JSX when changing pricing)

## Analytics

### Google Analytics 4
- **Tag:** `G-M8T1TQF1CV`
- Loaded via `<script>` in `index.html`
- Tracks page views, tool usage via gtag events

## Typography (Google Fonts)

| Font | Role | Weight(s) |
|------|------|-----------|
| Syne | Display headings | 700, 800 |
| Outfit | Body text | 300, 400, 500, 600 |
| JetBrains Mono | Code/badges | 400, 500 |
| Playfair Display | Accent headings | 400 italic |
| DM Sans | UI elements | 400, 500 |
| Space Mono | Monospace accent | 400 |

## Dev Dependencies

| Package | Purpose |
|---------|---------|
| `@vitejs/plugin-react` | JSX transform, React Fast Refresh |
| `eslint` + plugins | Code linting (react-hooks, react-refresh) |
| `@types/react` | TypeScript type hints (IDE support, not compiled) |

## Upgrade Path

When the project grows beyond 5-6 micro-apps, consider:
1. **Tailwind CSS** — If inline styles become unwieldy across many apps
2. **Vercel KV / Upstash Redis** — For persistent rate limiting and caching
3. **Stripe** — If LemonSqueezy doesn't scale for subscriptions
4. **Turborepo** — If micro-apps need independent build/deploy cycles
5. **TypeScript** — Types are already installed as devDeps; migration is incremental
