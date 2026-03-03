# Architecture — VibeZap.dev

## Overview

VibeZap follows a **monolithic SPA with modular micro-apps** pattern. All micro-apps share a single React application, router, and deployment — but each app is self-contained in its own folder.

```
┌─────────────────────────────────────────┐
│              vibezap.dev                 │
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌────────┐  │
│  │ Landing  │  │  Roast  │  │ Scam   │  │
│  │  Page    │  │   My    │  │ Check  │  │
│  │   (/)    │  │ Website │  │  (TBD) │  │
│  │         │  │ (/roast) │  │        │  │
│  └─────────┘  └────┬────┘  └────────┘  │
│                     │                    │
│              ┌──────┴──────┐             │
│              │  /api/roast │             │
│              │  (Vercel    │             │
│              │  Function)  │             │
│              └──────┬──────┘             │
│                     │                    │
│              ┌──────┴──────┐             │
│              │  Anthropic  │             │
│              │  Claude API │             │
│              └─────────────┘             │
└─────────────────────────────────────────┘
```

## Why Monolithic SPA (Not Micro-Frontends)?

1. **Simplicity** — One repo, one build, one deploy. No orchestration needed.
2. **Shared routing** — React Router handles all navigation with zero latency.
3. **Small scope** — 6 planned tools, each a single-page experience. Doesn't warrant separate deployments.
4. **Fast iteration** — Add a new tool in ~1 hour without infrastructure changes.

When to reconsider: If tools need independent deploy cycles, different tech stacks, or team isolation.

## Component Architecture

Each micro-app is a **single self-contained React component**:

```
src/apps/<tool-name>/
├── <ToolName>.jsx     # Full UI + logic + styles (inline)
└── README.md          # App-specific documentation
```

### Design Principles
- **One file per app** — Keeps things simple. Extract sub-components only when a single file exceeds ~1000 lines.
- **Inline styles** — No CSS files. Every component owns its styles via `style` props.
- **No shared state** — Each micro-app is independent. No global store needed.
- **Self-contained API calls** — Each app calls its own `/api/<name>` endpoint directly.

### When to use `src/shared/`
Only extract to `shared/` when **3+ apps** need the same thing:
- Common UI components (back-to-home nav, footer)
- Utility functions (formatters, validators)
- Brand constants (colors, fonts)

## API Architecture

```
api/
├── roast.js              # POST /api/roast (free)
├── roast-report.js       # POST /api/roast-report (paid, $5)
├── scam-check.js         # POST /api/scam-check (free)
├── scam-report.js        # POST /api/scam-report (paid, $3)
├── check-payment.js      # GET /api/check-payment (polling fallback)
└── lib/
    ├── generate-roast-pdf.js
    ├── generate-scam-pdf.js
    ├── verify-order.js
    └── send-report-email.js
```

### Free endpoints follow this pattern:
1. Validate request method (POST only)
2. Parse and validate input
3. Rate limit check (per IP)
4. Call Anthropic API with tool-specific prompt
5. Parse and return structured JSON

### Paid report endpoints add:
1. Verify payment via LemonSqueezy API (`verifyOrder()`)
2. Call Anthropic API with enhanced prompt (larger max_tokens)
3. Parse JSON using `extractJSON()` (3-strategy robust parser)
4. Auto-retry once on parse failure
5. Generate PDF via pdfkit
6. Send email via Resend (non-blocking)
7. Return JSON with base64-encoded PDF

### Rate Limiting
Currently in-memory (`Map` per function instance). Resets on cold starts. For persistent rate limiting, consider Vercel KV or Upstash Redis.

## Routing Convention

| Pattern | Example | Maps to |
|---------|---------|---------|
| `/` | vibezap.dev | `VibeZapLanding.jsx` (landing page) |
| `/<tool-slug>` | vibezap.dev/roast | `src/apps/<tool>/Component.jsx` |
| `/api/<tool-slug>` | vibezap.dev/api/roast | `api/<tool>.js` (serverless) |

All client routes are handled by React Router. The Vercel `rewrites` rule sends everything to `index.html`.

## Data Flow

```
User Input → React Component → fetch('/api/<tool>') → Vercel Function → Claude API → JSON Response → UI Update
```

No database. No auth. No sessions. Each request is stateless.

## Payment Flow

```
User clicks "Get Report" → LemonSqueezy overlay checkout opens
  → Payment processed → Checkout.Success event fires (or fallback polling)
  → Frontend calls /api/<tool>-report with orderId
  → Backend verifies payment via LemonSqueezy API
  → Enhanced Claude analysis → PDF generation → Email delivery
  → PDF auto-downloads + report rendered on-screen
```

### Payment Verification
- Backend calls LemonSqueezy API to verify order status=paid and correct amount
- `check-payment.js` provides a polling fallback when checkout overlay events don't fire
- Polling runs every 3s for up to 3 minutes with 30s clock-skew buffer

### Report Generation Gotchas
- **max_tokens must match prompt size** — Premium prompts request large JSON structures. The `web_search` tool also consumes output tokens. Insufficient max_tokens causes truncation and parse failures.
- **Auto-retry** — Report endpoints retry once on JSON parse failure before returning an error to the user.
- **`extractJSON()` parser** — Uses 3 strategies (direct parse → bracket-counted → regex fallback) for robust JSON extraction from Claude responses. Never replace with raw regex.
- **Function timeouts** — Set in `vercel.json`: 60s for roast-report, 30s for scam-report.
