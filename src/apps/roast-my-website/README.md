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

## Files

- `RoastMyWebsite.jsx` — Full UI component (~860 lines)
- `../../api/roast.js` — Serverless API endpoint
