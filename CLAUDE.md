# VibeZap.dev — AI Micro-Tools Portal

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

VibeZap is a **React SPA** that serves as a portal/studio for AI-powered micro-tools. Each tool is a self-contained "micro-app" that lives at its own route under vibezap.dev.

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
│   ├── roast.js                  # POST /api/roast — free website roast
│   ├── roast-report.js           # POST /api/roast-report — $5 paid premium report
│   ├── scam-check.js             # POST /api/scam-check — free scam analysis
│   ├── scam-report.js            # POST /api/scam-report — $3 paid forensic report
│   ├── check-payment.js          # GET /api/check-payment — payment polling fallback
│   └── lib/                      # Shared utilities (PDF gen, email, order verification)
├── src/
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Router — maps routes to micro-apps
│   ├── VibeZapLanding.jsx         # Landing page (/)
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
| 2 | Am I Being Scammed? | `/scam-check` | `/api/scam-check` | **Live** | Free / $3 full report |
| 3 | Screenshot → Mockup | `/mockup` | — | Planned | $3 |
| 4 | TLDR Contract | `/tldr-contract` | — | Planned | $3 |
| 5 | 365 Social Posts | `/social-posts` | — | Planned | $15 |
| 6 | Vibe Check Email | `/vibe-check` | — | Planned | $2 |

## Critical Rules — Follow These Every Time

### Architecture Rules
1. **Don't break routing** — Every micro-app route must be registered in `App.jsx` AND the SPA rewrite in `vercel.json` covers all routes.
2. **API keys are env vars** — Never hardcode. `ANTHROPIC_API_KEY` is set in Vercel dashboard.
3. **Rate limiting is in-memory** — Resets on cold starts. For persistent limiting, migrate to KV/Redis.
4. **Inline styles only** — No CSS files. All styling is done via React `style` props to keep components self-contained.
5. **One component per micro-app** — Each micro-app is a single `.jsx` file in its `src/apps/<name>/` folder.
6. **Test build before push** — Always run `npm run build` locally. Vercel auto-deploys on push.

### Development Discipline Rules

7. **Never Guess — Ask For Errors.** If something isn't working, do NOT hypothesize and generate speculative fixes. Ask for the exact error from: browser console, Vercel function logs, or terminal output. One correct fix based on a real error > five guesses based on assumptions.

8. **Test Every Assumption.** Before writing a fix, verify: Does the file actually exist at the path you think? Does the env var actually exist in Vercel? Does the API endpoint actually return what you think? If unsure, write a quick diagnostic (`console.log`, test API call) BEFORE writing the fix.

9. **Complete Solutions Only.** Never deliver partial code with `// add your logic here` or `// TODO: implement`. Every code block must be copy-paste ready and fully functional. If you need more information, ask instead of leaving placeholders.

10. **One Change at a Time.** When debugging, change ONE thing, explain what it should fix, and specify how to verify it worked. Do not stack five changes in one response — if the first one fixes it, the other four are noise.

## API Gotchas & Known Issues

### Claude API Response Parsing
- **`max_tokens` must match prompt complexity.** Premium reports request large JSON (30+ items). The `web_search` tool consumes output tokens for search results, reducing the budget for the actual JSON. If `max_tokens` is too low, the response gets truncated and JSON parsing fails silently.
  - `roast.js` (free): 1000 tokens — sufficient for small JSON
  - `roast-report.js` (paid): **16000 tokens** — needed for 30+ fixes + detailed analysis + web search overhead
  - `scam-report.js` (paid): **8000 tokens** — needed for 6 categories + technical indicators
- **Always use `extractJSON()` for parsing** — Both report endpoints use a 3-strategy parser (direct parse → bracket-counted → regex fallback) instead of fragile regex matching. Never go back to raw regex.
- **Retry on parse failure** — Report endpoints retry once automatically before returning an error. Frontend also has a "Try Again" button as a last resort.
- **Check `stop_reason`** — If `data.stop_reason === "max_tokens"`, the response was truncated. This is logged as a warning.

### Vercel Function Timeouts
- `roast-report.js`: **60s** (supports retry + PDF generation + email)
- `scam-report.js`: **30s** (supports retry + PDF generation + email)
- Free endpoints use default timeout (10s)

### Payment Flow (LemonSqueezy)

**How LemonSqueezy Works:**
1. **Checkout**: User clicks buy → LemonSqueezy overlay/redirect → payment happens there
2. **Webhook**: After payment, LemonSqueezy sends POST to our webhook endpoint with order details
3. **Verification**: Our webhook verifies the signature, extracts order data, activates access
4. **Access**: App checks if user has active access before serving paid features

**Polling Fallback** — LemonSqueezy overlay events can fail to fire. Frontend polls `/api/check-payment` as fallback (3s interval, 3min max). `check-payment.js` has a 30-second clock-skew buffer when filtering by timestamp. `verifyOrder()` validates both payment status and expected amount (500 cents for roast, 300 cents for scam).

**Required Environment Variables:**
```
LEMONSQUEEZY_API_KEY=           # Settings → API in LS dashboard
LEMONSQUEEZY_STORE_ID=          # Your store ID
LEMONSQUEEZY_WEBHOOK_SECRET=    # Signing secret from webhook creation
```

**Common Payment Bugs and Actual Fixes:**

| Symptom | Actual Cause | Fix |
|---------|-------------|-----|
| Webhook never fires | URL wrong in LS dashboard | Must be `https://vibezap.dev/api/<app-name>/webhook` — no trailing slash |
| Webhook fires but 500s | Wrong `LEMONSQUEEZY_WEBHOOK_SECRET` | Verify env var matches exactly what's in LS dashboard |
| Signature verification fails | Raw body not preserved | Must use `export const config = { api: { bodyParser: false } }` in webhook route |
| Payment succeeds but access not granted | Webhook doesn't persist result | Must write to database/KV store — NOT a local variable |
| Works locally but not in production | Env vars missing in Vercel | Check Vercel dashboard → Settings → Environment Variables |

**Webhook Route Template:**
```javascript
// api/<app-name>/webhook.js
import crypto from 'crypto';

export const config = {
  api: { bodyParser: false },  // CRITICAL: Raw body needed for signature verification
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const signature = req.headers['x-signature'];

  if (!signature) {
    console.error('WEBHOOK ERROR: No x-signature header');
    return res.status(401).json({ error: 'No signature' });
  }

  const hmac = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
  hmac.update(rawBody);
  const expectedSignature = hmac.digest('hex');

  if (signature !== expectedSignature) {
    console.error('WEBHOOK ERROR: Signature mismatch');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody.toString());
  const eventName = event.meta.event_name;
  console.log(`WEBHOOK RECEIVED: ${eventName}`, JSON.stringify(event.meta));

  // Handle the event — app-specific logic goes here
  // ALWAYS persist the result (database, KV store, etc.)

  return res.status(200).json({ received: true });
}
```

**Checkout Link Pattern:**
```javascript
const checkoutUrl = `https://vibezap.lemonsqueezy.com/checkout/buy/VARIANT_ID?checkout[custom][user_email]=${encodeURIComponent(userEmail)}`;
```

## API Route Rules

- All API routes go in `api/<app-name>.js` or `api/<app-name>/` folder
- Always include error handling with **specific** error messages (not generic "Something went wrong")
- Always log the full error server-side: `console.error('ENDPOINT_NAME error:', error.message, error.stack)`
- Never expose API keys or secrets in client-side code
- Always validate input before processing

### AI API Call Pattern

- Always set a timeout on fetch calls to AI APIs (30 seconds max)
- Always handle rate limits (429 status) with a user-friendly message
- Always validate and parse the AI response before sending to frontend
- If the AI returns unexpected format, log the raw response server-side and return a clear error — never silently fail

```javascript
// PATTERN: Safe AI response parsing
try {
  const aiResponse = await callAI(prompt);
  const parsed = JSON.parse(aiResponse);

  if (!parsed.requiredField) {
    console.error('AI response missing required field:', JSON.stringify(parsed));
    return res.status(500).json({ error: 'Analysis format error — please try again' });
  }

  return res.status(200).json(parsed);
} catch (error) {
  console.error('AI parsing failed. Raw response:', aiResponse, 'Error:', error.message);
  return res.status(500).json({ error: 'Could not parse analysis — please try again' });
}
```

## Adding a New Micro-App

See [docs/micro-app-guide.md](docs/micro-app-guide.md) for the full template and steps.

Quick summary:
1. Create `src/apps/<app-name>/` folder with `<AppName>.jsx` and `README.md`
2. Add route in `App.jsx`
3. Add API endpoint in `api/<name>.js` (if needed)
4. Add tool card in `VibeZapLanding.jsx` tools array
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

## Environment Variables Checklist

Before saying "it works", verify ALL of these are set in Vercel:

- [ ] `ANTHROPIC_API_KEY` — AI backend for micro-tools
- [ ] `LEMONSQUEEZY_API_KEY` — Payment API access
- [ ] `LEMONSQUEEZY_STORE_ID` — Store identifier
- [ ] `LEMONSQUEEZY_WEBHOOK_SECRET` — Webhook signature verification
- [ ] Any app-specific API keys (see app-specific README)
- [ ] Any database/KV connection strings (if applicable)

## Debugging Checklist

When something breaks, go through this in order:

1. **Get the exact error** — browser console, network tab response body, Vercel function logs
2. **Identify which layer failed** — frontend render? API route? External API call? Payment?
3. **Write a minimal test** for just that layer (a `console.log`, a test curl, etc.)
4. **Fix the one thing** that's actually broken
5. **Verify the fix** — specify exactly what to check and what the expected result is

## Styling Conventions

- Dark theme is the default (see Brand & Design Tokens above)
- Use consistent styling approach across all apps (check existing apps for the pattern)
- Inline CSS-in-JS only — no CSS files
- Keep the "vibezap.dev" branding consistent across tools

## Contact

- **Twitter/X:** @vibezapdev
- **Email:** hello@vibezap.dev
