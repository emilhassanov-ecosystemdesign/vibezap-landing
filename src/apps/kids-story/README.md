# Kids Story Creator

## Route: /kids-story
## API: /api/kids-story (free), /api/kids-story-report (paid)
## Status: Live
## Price: Free preview / $3 full illustrated PDF

## What It Does
Creates personalized children's stories starring the user's child. Users enter their child's name, age, interests, and an optional moral/lesson. The AI generates a story preview (free) or a full illustrated PDF storybook (paid).

## User Flow
1. User enters child's name, age, interests, optional moral, and story style
2. Clicks "Create Story" — free preview generates (2-3 paragraphs)
3. Preview displayed with child's name highlighted
4. User sees upsell: "Get Full Illustrated Story — $3"
5. Payment via LemonSqueezy → SSE stream: story generation → illustration generation → PDF → email

## API Details

### Free Preview
- **Endpoint:** POST /api/kids-story
- **Input:** `{ childName, age, interests, moral?, style? }`
- **Output:** `{ title, preview, style }`
- **Model:** claude-sonnet-4-20250514
- **max_tokens:** 2000
- **Rate Limit:** 5 req/hour per IP

### Paid Full Story
- **Endpoint:** POST /api/kids-story-report (SSE)
- **Input:** `{ childName, age, interests, moral?, style?, orderId }`
- **Output:** SSE events: progress, story, pdf, email, error
- **Model:** claude-sonnet-4-20250514 (story) + Replicate Flux Schnell (illustrations)
- **max_tokens:** 8000
- **Payment:** $3 (300 cents) via LemonSqueezy
- **Timeout:** 120s (Vercel)

## Illustration Strategy
- Each character/creature appears in exactly ONE illustration (no cross-image consistency needed)
- Claude generates `illustration_focus` per page (protagonist, companion, setting, etc.)
- All focus values are unique across pages
- Replicate Flux Schnell generates watercolor-style storybook illustrations
- Fallback: text-only decorative PDF if image generation fails

## Design
- **Theme color:** #FFD93D (golden yellow)
- **Accent:** #FFB347 (warm orange)
- **Typography:** Playfair Display (story text), Outfit (UI), Space Mono (badges)
- **Special effects:** Twinkling star background, pulse glow on story card
