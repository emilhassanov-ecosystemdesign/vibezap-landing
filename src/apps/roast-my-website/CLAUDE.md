# CLAUDE.md — Roast My Website

> **Read the root `/CLAUDE.md` FIRST** — it has project-wide rules, dev discipline, and payment patterns. This file covers roast-specific issues only.

## What This App Does

Takes a URL, uses Claude with `web_search` to actually visit and analyze the website, and generates a humorous "roast" with scores across 5 categories, a savage headline, top 3 fixes, and severity level. Premium tier ($5) provides 30+ specific fixes, detailed analysis, PDF report, and email delivery.

## Known Issues and Their Fixes

### #1: "Could not parse analysis" Error

This is the most common bug. It means the AI response didn't match the expected JSON structure.

**Root causes (in order of likelihood):**
1. `max_tokens` too low — `web_search` tool consumes output tokens, leaving insufficient budget for the JSON
2. AI wrapped JSON in markdown code fences or added preamble text
3. AI returned truncated JSON (check `stop_reason === "max_tokens"` in logs)

**How parsing works (DO NOT replace this pattern):**

Both endpoints use `extractJSON()` — a 3-strategy parser:
1. **Direct parse** — try `JSON.parse()` on the cleaned response
2. **Bracket-counted extraction** — string-aware brace matching to find the outermost `{...}`
3. **Greedy regex fallback** — `/\{[\s\S]*\}/` as last resort

The free endpoint (`roast.js`) uses a simpler regex approach. The paid endpoint (`roast-report.js`) uses the full `extractJSON()` with auto-retry (2 attempts).

**Token budgets (do NOT lower these):**
- `roast.js` (free): **1000 tokens** — small JSON, 5 categories
- `roast-report.js` (paid): **16000 tokens** — 30+ fixes, detailed analysis, web search overhead

**If this error starts happening frequently:**
1. Check Vercel function logs for `stop_reason` and `output_tokens`
2. If `stop_reason === "max_tokens"`, increase `max_tokens`
3. If parse fails despite complete response, check if the prompt output format changed

### #2: Website Fetching Issues

Both endpoints now **pre-fetch the website server-side** via `fetchSite()` (`api/lib/fetch-site.js`) before calling Claude. The fetched HTML content (title, meta description, body text) is injected into the prompt so Claude has actual page data regardless of search indexability.

- **Pre-fetch is the PRIMARY content source** — Claude analyzes the fetched content directly
- **web_search is kept as supplementary** — for competitor research and industry context
- **Graceful degradation** — if pre-fetch fails (timeout, non-HTML, blocked), the prompt tells Claude to use web_search as fallback
- **Quality gate (paid reports only)** — `checkReportQuality()` rejects reports with all-0 scores or "can't find it" language. This prevents charging customers for useless reports.
- **Order consumption is deferred** — `consumeOrder()` only runs AFTER quality validation passes, so failed analyses allow retry

**Why this was added:** Claude's `web_search` couldn't find sites on uncommon TLDs (e.g. `.design`) that weren't well-indexed, producing garbage "can't find the website" reports.

### #3: Rate Limit Confusion

- **Free tier:** 3 requests/hour per IP (in-memory, resets on cold start)
- **Paid tier:** 10 requests/hour per IP (in-memory, resets on cold start)
- **Claude API 429:** Handled separately with user-friendly message ("Our AI is taking a breather...")

These are independent limits. A user hitting the app rate limit is different from Claude API rate limits.

## Expected JSON Shapes

### Free Roast Response (`/api/roast`)

```json
{
  "overall_score": 7,
  "roast_headline": "Your Homepage Called. It Wants Its 2015 Back.",
  "roast_summary": "2-3 sentences of brutally honest feedback...",
  "categories": {
    "Design": { "score": 6, "comment": "One funny roast line" },
    "Copy": { "score": 8, "comment": "One funny roast line" },
    "UX": { "score": 5, "comment": "One funny roast line" },
    "Performance": { "score": 7, "comment": "One funny roast line" },
    "Trust": { "score": 6, "comment": "One funny roast line" }
  },
  "top_fixes": ["Fix 1", "Fix 2", "Fix 3"],
  "severity": "harsh"
}
```

### Premium Report Response (`/api/roast-report`)

Same as above PLUS:
```json
{
  "executive_summary": "2-3 detailed paragraphs...",
  "categories": {
    "Design": { "score": 6, "comment": "...", "detailed_analysis": "2-3 sentences..." }
  },
  "specific_fixes": [
    { "title": "Fix name", "description": "What and why", "priority": "high|medium|low", "category": "Design|Copy|UX|Performance|Trust" }
  ],
  "quick_wins": ["Easy fix 1", "Easy fix 2", "Easy fix 3", "Easy fix 4", "Easy fix 5"],
  "competitor_insights": [
    { "suggestion": "What competitors do better", "example": "Specific example" }
  ],
  "seo_notes": "Paragraph about SEO...",
  "accessibility_notes": "Paragraph about a11y...",
  "mobile_notes": "Paragraph about mobile..."
}
```

**If you change either JSON shape, update BOTH the API prompt AND the frontend component (`RoastMyWebsite.jsx`).**

## Environment Variables (app-specific)

```
ANTHROPIC_API_KEY=        # Claude API (shared across apps)
LEMONSQUEEZY_API_KEY=     # Order verification for premium reports
RESEND_API_KEY=           # Email delivery (optional — report works without it)
```

## Payment Model

- **Free roast:** Unlimited (subject to 3/hour rate limit)
- **Premium report:** $5 one-time via LemonSqueezy checkout overlay
- **Payment verification:** `verifyOrder()` checks LemonSqueezy API for order status=paid AND total=500 cents
- **Polling fallback:** Frontend polls `/api/check-payment?product=roast&after=<timestamp>` every 3s, up to 3 min
- See root CLAUDE.md for the webhook template and common payment bugs table

## File Map

```
src/apps/roast-my-website/
├── CLAUDE.md                  ← You are here
├── README.md                  ← App overview and full API docs
└── RoastMyWebsite.jsx         ← Full UI component (~860 lines)

api/
├── roast.js                   ← Free roast endpoint (POST)
├── roast-report.js            ← Premium report endpoint (POST, has quality gate)
├── check-payment.js           ← Payment polling fallback (GET)
└── lib/
    ├── fetch-site.js          ← Server-side URL fetcher (pre-fetch for Claude)
    ├── generate-roast-pdf.js  ← PDF generation for premium reports
    ├── verify-order.js        ← LemonSqueezy order verification
    └── send-report-email.js   ← Email delivery via Resend
```

## Testing This App

1. **Free roast:** `POST /api/roast` with `{ "url": "https://example.com" }` — should return roast JSON with 5 categories
2. **Error handling:** `POST /api/roast` with `{ "url": "https://thisdoesnotexist12345.com" }` — should return a clean error, not a 500
3. **Rate limiting:** Hit the endpoint 4 times quickly — 4th should return 429 with a friendly message
4. **Premium report:** Requires a valid paid order ID — use LemonSqueezy test mode to create one
5. **Parser resilience:** If AI response format drifts, `extractJSON()` should still extract valid JSON

## Debugging Checklist (Roast-Specific)

When a roast fails, check in this order:

1. **Get the exact error** — Vercel function logs (not just the frontend message)
2. **Check `stop_reason`** — If `"max_tokens"`, the response was truncated. Increase token budget.
3. **Check `output_tokens`** — If close to `max_tokens`, web search consumed too many tokens
4. **Check raw response** — Logs include `preview` (first 500 chars) and `tail` (last 300 chars) on parse failure
5. **Check payment** — For premium reports, verify the order ID is valid and payment is confirmed in LemonSqueezy dashboard
