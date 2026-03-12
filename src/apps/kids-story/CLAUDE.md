# CLAUDE.md — Kids Story Creator

> **Read the root `/CLAUDE.md` FIRST** — it has project-wide rules, dev discipline, and payment patterns. This file covers kids-story-specific issues only.

## What This App Does

User enters their child's name, age, interests, and optional moral. AI generates a personalized story preview (free) or full illustrated PDF storybook (paid, $3). Illustrations generated via Replicate Flux Schnell with one-character-per-scene strategy for visual consistency.

## Expected JSON Shapes

### Free Preview (`/api/kids-story`)

```json
{
  "title": "Luna and the Star Garden",
  "preview": "Paragraph 1...\n\nParagraph 2...\n\nParagraph 3...",
  "style": "fairy-tale"
}
```

### Paid Full Story (`/api/kids-story-report` — SSE events)

**Story event data:**
```json
{
  "story": {
    "title": "Luna and the Star Garden",
    "dedication": "For Luna, who always believed in magic",
    "pages": [
      {
        "page_number": 1,
        "text": "Story text for this page...",
        "illustration_prompt": "A magical garden with glowing flowers...",
        "illustration_focus": "setting"
      }
    ]
  },
  "generatedAt": "2026-03-11T...",
  "hasIllustrations": true
}
```

Pages with illustrations include `has_illustration: true`, `illustration_prompt`, and `illustration_character`.

## Illustration Strategy

Exactly 3 character illustrations per story — one per character (protagonist, companion, and one other key character).

- Claude marks exactly 3 pages with `has_illustration: true`
- Each illustrated page features a different character
- Illustrations spread across story (early, middle, late)
- Replicate Flux Schnell generates images (~$0.01/image, 3 per story)
- Style prefix: "Children's storybook illustration, soft watercolor style, warm colors, whimsical and magical"
- All 3 images generated in parallel (single Promise.all)
- If Replicate fails: PDF generated without illustrations (text-only)

## Token Budgets (do NOT lower)

- `kids-story.js` (free): **2000 tokens** — title + 2-3 paragraph preview
- `kids-story-report.js` (paid): **8000 tokens** — full story with 8 pages + illustration prompts

## Environment Variables (app-specific)

```
ANTHROPIC_API_KEY=        # Claude API (shared)
LEMONSQUEEZY_API_KEY=     # Order verification
REPLICATE_API_TOKEN=      # Flux Schnell image generation
RESEND_API_KEY=           # Email delivery (optional)
```

## File Map

```
src/apps/kids-story/
├── CLAUDE.md                      ← You are here
├── README.md                      ← App overview
└── KidsStoryCreator.jsx           ← Full UI component

api/
├── kids-story.js                  ← Free preview endpoint (POST)
├── kids-story-report.js           ← Paid full story endpoint (SSE)
└── lib/
    ├── generate-story-pdf.js      ← PDF generation (pdfkit, A5 storybook)
    ├── verify-order.js            ← LemonSqueezy verification (shared)
    └── send-report-email.js       ← Email delivery (shared, kids-story template added)
```

## Payment Model

- **Free preview:** Unlimited (5/hour rate limit)
- **Full illustrated story:** $3 via LemonSqueezy
- **Payment verification:** `verifyOrder()` checks total=300 cents
- **Vercel timeout:** 120s (image generation is slow)
