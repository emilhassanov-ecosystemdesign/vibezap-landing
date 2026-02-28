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
├── roast.js         # POST /api/roast
├── scam-check.js    # POST /api/scam-check  (future)
└── ...
```

Each API endpoint follows the same pattern:
1. Validate request method (POST only)
2. Parse and validate input
3. Rate limit check (per IP)
4. Call Anthropic API with tool-specific prompt
5. Parse and return structured JSON

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
User clicks "Upgrade" → Redirect to LemonSqueezy checkout → Payment processed → Webhook (future) → Deliver premium content
```

Currently checkout links are direct redirects. For gated content, add LemonSqueezy webhook verification.
