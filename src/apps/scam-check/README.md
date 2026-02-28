# Am I Being Scammed?

## Route: /scam-check
## API: /api/scam-check
## Status: Live
## Price: Free (rate-limited)

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

## Design
- **Theme:** Cyan/teal security palette with green-to-red risk colors
- **Score ring:** Animated SVG, color shifts by risk level (green=safe, red=scam)
- **Verdict badge:** Color-coded pill (Safe/Suspicious/Likely Scam/Definite Scam)
- **Typography:** Playfair Display (headlines), Space Mono (labels), DM Sans (body)
