# CLAUDE.md — Kids Story Creator

> **Read the root `/CLAUDE.md` FIRST** — it has project-wide rules, dev discipline, and payment patterns. This file covers kids-story-specific issues only.

## What This App Does

User enters their child's name, age, interests, and optional moral. AI generates a personalized story preview (free) or full illustrated PDF storybook (paid, $9). Illustrations generated via Replicate Flux Schnell with one-character-per-scene strategy for visual consistency.

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

**illustration_focus values** (each must be unique across all pages):
`protagonist`, `companion`, `creature`, `villain`, `setting`, `magical-object`, `action-scene`, `climax`

## Illustration Strategy

CRITICAL: Each character appears in exactly ONE illustration to avoid cross-image consistency issues.

- Claude generates `illustration_prompt` + `illustration_focus` per page
- All focus values are unique — no character rendered twice
- Replicate Flux Schnell generates images (~$0.01/image)
- Style prefix: "Children's storybook illustration, soft watercolor style, warm colors, whimsical and magical"
- Images generated in batches of 4 (parallel) to avoid API overload
- If Replicate fails: PDF generated without illustrations (decorative text-only)

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
- **Full illustrated story:** $9 via LemonSqueezy
- **Payment verification:** `verifyOrder()` checks total=900 cents
- **Vercel timeout:** 120s (image generation is slow)
