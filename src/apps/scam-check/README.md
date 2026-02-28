# Am I Being Scammed?

## Route: /scam-check
## API: /api/scam-check
## Status: Live
## Price: Free (rate-limited) / $3 Full Forensic Report PDF

## What It Does
AI-powered scam detection tool. Users paste suspicious emails, text messages, or DMs and get an instant risk analysis with a detailed breakdown of scam tactics detected.

## User Flow
1. User pastes a suspicious message into the textarea
2. Clicks "Scan" button
3. API sends message to Claude for analysis
4. Results displayed with animated score ring, verdict badge, category breakdown, and actionable next steps

## API Details
- **Endpoint:** POST /api/scam-check
- **Input:** `{ "message": "string (max 5000 chars)" }`
- **Output:**
  ```json
  {
    "risk_score": 8,
    "verdict": "Likely Scam",
    "verdict_headline": "This Has All the Hallmarks of a Phishing Attack",
    "summary": "2-3 sentences...",
    "categories": {
      "Urgency Tactics": { "score": 9, "comment": "..." },
      "Identity Spoofing": { "score": 7, "comment": "..." },
      "Suspicious Links": { "score": 8, "comment": "..." },
      "Grammar Red Flags": { "score": 6, "comment": "..." },
      "Financial Bait": { "score": 5, "comment": "..." },
      "Emotional Manipulation": { "score": 4, "comment": "..." }
    },
    "what_to_do": ["...", "...", "..."],
    "severity": "danger"
  }
  ```
- **Model:** claude-sonnet-4-20250514
- **Rate Limit:** 5 req/hour per IP

## Premium Flow ($3 Full Forensic Report)

### User Flow
1. User completes free scan (above)
2. CTA appears: "Want the Full Forensic Report?"
3. User clicks "Get Full Report — $3" → LemonSqueezy overlay checkout opens
4. After payment, `Checkout.Success` event fires with order ID
5. Frontend calls `POST /api/scam-report` with original message + order ID
6. Backend verifies payment via LemonSqueezy API, runs enhanced Claude analysis, generates PDF
7. PDF downloads automatically

### Premium API
- **Endpoint:** POST /api/scam-report
- **Input:** `{ "message": "string", "orderId": "string" }`
- **Output:** PDF file (`application/pdf`)
- **Model:** claude-sonnet-4-20250514 (2000 max_tokens vs free tier's 1200)
- **Rate Limit:** 10 req/hour per IP
- **Payment verification:** LemonSqueezy API order check (status=paid, total=$3)

### PDF Contents
- **Page 1:** VibeZap branding, verdict badge, risk score, executive summary, original message
- **Page 2:** Detailed red flag analysis (6 categories with 2-3 sentence explanations each)
- **Page 3:** Technical indicators, similar scam patterns, how to report, protection tips

### Environment Variables
- `ANTHROPIC_API_KEY` — Claude API (shared with free tier)
- `LEMONSQUEEZY_API_KEY` — Order verification

### Dependencies
- `pdfkit` — PDF generation (serverless-compatible, <5MB)

## Design
- **Theme:** Cyan/teal security palette with green-to-red risk colors
- **Score ring:** Animated SVG, color shifts by risk level (green=safe, red=scam)
- **Verdict badge:** Color-coded pill (Safe/Suspicious/Likely Scam/Definite Scam)
- **Typography:** Playfair Display (headlines), Space Mono (labels), DM Sans (body)
