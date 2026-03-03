# CLAUDE.md — Am I Being Scammed?

> **Read the root `/CLAUDE.md` FIRST** — it has project-wide rules, dev discipline, and payment patterns. This file covers scam-check-specific issues only.

## What This App Does

User pastes a suspicious email, text message, or DM and the AI analyzes it for scam indicators. Returns a risk score, verdict, breakdown across 6 scam categories, and actionable next steps. Premium tier ($3) provides a full forensic report with technical indicators, similar scam patterns, reporting authorities, and protection tips — delivered as PDF + email.

## Input Handling

- Accepts plain text via textarea (pasted messages, emails, descriptions)
- **Character limit: 5000 chars** — enforced server-side with a 400 error. Frontend should show a counter.
- Input is embedded directly in the Claude prompt (no HTML rendering), so script injection isn't a risk in the AI call — but the frontend must sanitize anything displayed back to the user from the AI response.

## Privacy Considerations

Users paste sensitive personal messages (bank emails, threatening texts, romance scam conversations). The app should:

- **NOT log full input text** in production — only log metadata (length, risk score, verdict)
- The premium report truncates `originalMessage` to 200 chars in the JSON response
- Display a brief privacy note to users: "Your message is analyzed and not stored"
- Never send user input to analytics or tracking services

## Known Issues and Their Fixes

### #1: "Analysis incomplete" / Parse Failure

Same root cause as the roast app — AI response doesn't match expected JSON.

**Key differences from roast:**
- Scam check does NOT use `web_search` tool, so token budgets are lower
- Free endpoint (`scam-check.js`) uses simple regex parsing
- Paid endpoint (`scam-report.js`) uses the full `extractJSON()` 3-strategy parser with auto-retry (2 attempts)

**Token budgets (do NOT lower these):**
- `scam-check.js` (free): **1200 tokens** — 6 categories + verdict + summary
- `scam-report.js` (paid): **8000 tokens** — 6 detailed categories + executive summary + technical indicators + reporting authorities

**If parse failures increase:**
1. Check Vercel function logs for `stop_reason` and `output_tokens`
2. If `stop_reason === "max_tokens"`, increase `max_tokens`
3. Logs include `preview` (first 500 chars) and `tail` (last 300 chars) on parse failure

### #2: Rate Limit Confusion

Three independent rate limit layers:

| Layer | Limit | Scope |
|-------|-------|-------|
| Free tier (scam-check.js) | 5 req/hour per IP | In-memory, resets on cold start |
| Paid tier (scam-report.js) | 10 req/hour per IP | In-memory, resets on cold start |
| Claude API 429 | Anthropic's limits | Handled with "AI is taking a breather" message |

### #3: Edge Case — "Safe" Messages Getting Medium Scores

The 6-category scoring (1-10 each) can inflate the perceived risk if categories score 3-4 on benign messages (e.g., "Grammar Red Flags" scoring 4 on informal but legitimate texts). This is a prompt tuning issue, not a code bug. The `verdict` field is the authoritative assessment, not the average of category scores.

## Expected JSON Shapes

### Free Scam Check Response (`/api/scam-check`)

```json
{
  "risk_score": 8,
  "verdict": "Likely Scam",
  "verdict_headline": "This Has All the Hallmarks of a Phishing Attack",
  "summary": "2-3 sentences explaining the assessment...",
  "categories": {
    "Urgency Tactics": { "score": 9, "comment": "One-line observation" },
    "Identity Spoofing": { "score": 7, "comment": "One-line observation" },
    "Suspicious Links": { "score": 8, "comment": "One-line observation" },
    "Grammar Red Flags": { "score": 6, "comment": "One-line observation" },
    "Financial Bait": { "score": 5, "comment": "One-line observation" },
    "Emotional Manipulation": { "score": 4, "comment": "One-line observation" }
  },
  "what_to_do": ["Action 1", "Action 2", "Action 3"],
  "severity": "danger"
}
```

**Verdict values:** `Safe`, `Suspicious`, `Likely Scam`, `Definite Scam`
**Severity values:** `safe`, `caution`, `danger`, `critical`

### Premium Forensic Report Response (`/api/scam-report`)

Same as above PLUS:
```json
{
  "executive_summary": "2-3 detailed paragraphs...",
  "categories": {
    "Urgency Tactics": { "score": 9, "comment": "...", "detailed_analysis": "2-3 sentences with examples from the message" }
  },
  "technical_indicators": {
    "url_analysis": "Paragraph analyzing URLs, domains, link patterns...",
    "language_patterns": "Paragraph about tone, formality, inconsistencies...",
    "social_engineering": ["Technique 1", "Technique 2"]
  },
  "similar_scam_patterns": ["Known scam type 1 with description", "Known scam type 2"],
  "how_to_report": [
    { "authority": "FTC", "url": "reportfraud.ftc.gov", "description": "When and how to report" },
    { "authority": "IC3", "url": "ic3.gov", "description": "When and how to report" },
    { "authority": "Local Police", "url": "", "description": "Guidance on filing a report" }
  ],
  "protection_tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"]
}
```

**If you change either JSON shape, update BOTH the API prompt AND the frontend component (`ScamCheck.jsx`).**

## Environment Variables (app-specific)

```
ANTHROPIC_API_KEY=        # Claude API (shared across apps)
LEMONSQUEEZY_API_KEY=     # Order verification for premium reports
RESEND_API_KEY=           # Email delivery (optional — report works without it)
```

## Payment Model

- **Free scan:** Unlimited (subject to 5/hour rate limit)
- **Premium forensic report:** $3 one-time via LemonSqueezy checkout overlay
- **Payment verification:** `verifyOrder()` checks LemonSqueezy API for order status=paid AND total=300 cents
- **Polling fallback:** Frontend polls `/api/check-payment?product=scam&after=<timestamp>` every 3s, up to 3 min
- See root CLAUDE.md for the webhook template and common payment bugs table

## File Map

```
src/apps/scam-check/
├── CLAUDE.md                  ← You are here
├── README.md                  ← App overview and full API docs
└── ScamCheck.jsx              ← Full UI component

api/
├── scam-check.js              ← Free scan endpoint (POST)
├── scam-report.js             ← Premium forensic report endpoint (POST)
├── check-payment.js           ← Payment polling fallback (GET, shared with roast)
└── lib/
    ├── generate-scam-pdf.js   ← PDF generation (pdfkit) for premium reports
    ├── verify-order.js        ← LemonSqueezy order verification (shared)
    └── send-report-email.js   ← Email delivery via Resend (shared)
```

## Testing This App

1. **Known scam:** Paste a classic phishing email — should return high risk_score (7+), verdict "Likely Scam" or "Definite Scam"
2. **Safe message:** Paste a normal email from a friend — should return low risk_score (1-3), verdict "Safe"
3. **Edge case:** Paste something ambiguous (marketing email, urgent but legitimate bank notice) — should return medium score with nuanced analysis
4. **Input limits:** Send 6000+ characters — should return 400 error, not a 500
5. **Rate limiting:** Hit the endpoint 6 times quickly — 6th should return 429 with friendly message
6. **Premium report:** Requires valid paid order ID — use LemonSqueezy test mode

## Debugging Checklist (Scam-Check-Specific)

When a scan fails, check in this order:

1. **Get the exact error** — Vercel function logs (not just the frontend message)
2. **Check `stop_reason`** — If `"max_tokens"`, response was truncated. Increase token budget.
3. **Check `output_tokens`** — If close to `max_tokens`, the message was very long and ate into the budget
4. **Check raw response** — Logs include `preview` (first 500 chars) and `tail` (last 300 chars) on parse failure
5. **Check payment** — For premium reports, verify order ID is valid and payment confirmed in LemonSqueezy dashboard
6. **Check input length** — Very long messages (close to 5000 chars) consume more input tokens and may affect output quality
