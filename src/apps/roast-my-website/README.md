# Roast My Website

## Route: /roast
## API: POST /api/roast
## Status: Live
## Price: Free (basic) / $5 (full PDF report via LemonSqueezy)

## What It Does

AI-powered brutally honest website critique. Enter any URL and get a roast with scores across 5 categories, a savage headline, and actionable top 3 fixes.

## User Flow

1. User enters a website URL
2. Clicks "Roast This Site"
3. Loading animation with humorous phases ("Stalking the website...", "Judging design choices...")
4. API calls Claude with web search to actually browse the site
5. Results displayed: overall score (ring), headline (typewriter effect), category breakdown, top fixes
6. CTA to upgrade for $5 full PDF report (LemonSqueezy checkout)

## API Details

- **Endpoint:** `POST /api/roast`
- **Input:** `{ "url": "https://example.com" }`
- **Output:**
  ```json
  {
    "overall_score": 7,
    "roast_headline": "Your Homepage Called. It Wants Its 2015 Back.",
    "roast_summary": "...",
    "categories": {
      "Design": { "score": 6, "comment": "..." },
      "Copy": { "score": 8, "comment": "..." },
      "UX": { "score": 5, "comment": "..." },
      "Performance": { "score": 7, "comment": "..." },
      "Trust": { "score": 6, "comment": "..." }
    },
    "top_fixes": ["Fix 1", "Fix 2", "Fix 3"],
    "severity": "harsh"
  }
  ```
- **Model:** claude-sonnet-4-20250514
- **Tools:** web_search (to actually visit and analyze the site)
- **Rate Limit:** 3 requests/hour per IP (in-memory)

## Design

- **Theme:** Fire/red gradient (`#ff2d55` → `#ff6b35` → `#ffc233`)
- **Severity levels:** brutal, harsh, mild, decent, fire (affects headline color and tone)
- **Score ring:** Animated SVG circle with color based on score
- **Background:** Dark (`#0a0a0b`)
- **Typewriter effect:** Headline reveals character by character

## Premium Flow ($5 Full Report)

### User Flow
1. User completes free roast (above)
2. CTA appears: "Get Full Report"
3. User clicks → LemonSqueezy overlay checkout opens
4. After payment, `Checkout.Success` event fires (or fallback polling via `/api/check-payment`)
5. Frontend calls `POST /api/roast-report` with URL + order ID
6. Backend verifies payment, runs enhanced Claude analysis with web search, generates PDF
7. PDF downloads automatically + email sent to customer

### Premium API
- **Endpoint:** POST /api/roast-report
- **Input:** `{ "url": "string", "orderId": "string" }`
- **Output:** `{ success, analysis, pdfBase64, pdfFilename, email, generatedAt, analyzedUrl }`
- **Model:** claude-sonnet-4-20250514 (16000 max_tokens + web_search tool)
- **Rate Limit:** 10 req/hour per IP
- **Timeout:** 60s (vercel.json)
- **Payment verification:** LemonSqueezy API order check (status=paid, total=$5)
- **Retry:** Auto-retries once on JSON parse failure before returning error

### PDF Contents
- Overall score, headline, severity, executive summary
- 5 category breakdowns with detailed analysis
- 30+ specific fixes (prioritized by high/medium/low)
- Quick wins, competitor insights, SEO/accessibility/mobile notes

### Gotchas
- **max_tokens must be 16000+** — The enhanced prompt requests 30+ specific fixes, 5 detailed category analyses, executive summary, and 3 notes paragraphs. Combined with web_search consuming output tokens, anything under 16000 risks truncation and "Could not parse analysis" errors.
- **JSON parsing uses `extractJSON()`** — 3-strategy parser (direct → bracket-counted → regex). Never replace with raw regex matching.
- **Payment polling fallback** — LemonSqueezy overlay events don't always fire. Frontend polls `/api/check-payment?product=roast&after=<timestamp>` every 3s for up to 3 minutes.

### Environment Variables
- `ANTHROPIC_API_KEY` — Claude API (shared with free tier)
- `LEMONSQUEEZY_API_KEY` — Order verification
- `RESEND_API_KEY` — Email delivery (optional, report still works without it)

## Files

- `RoastMyWebsite.jsx` — Full UI component (~860 lines)
- `../../api/roast.js` — Free roast API endpoint
- `../../api/roast-report.js` — Premium report API endpoint
- `../../api/check-payment.js` — Payment polling fallback
- `../../api/lib/generate-roast-pdf.js` — PDF generation
- `../../api/lib/verify-order.js` — LemonSqueezy order verification
- `../../api/lib/send-report-email.js` — Email delivery via Resend
