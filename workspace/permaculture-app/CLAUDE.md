# CLAUDE.md — Permaculture Design Generator

> **Single source of truth for AI-assisted development of this app.**

---

## 1. Project Identity

**What this app does:** A one-page web app that transforms a hand-drawn permaculture site sketch + location into AI-enhanced design outputs: an enhanced watercolor illustration, a photorealistic aerial render, and a concise one-page design report focused on resilience in food, energy, and water.

**Who uses it:** Landowners, homesteaders, and permaculture designers who want to quickly visualize and document a permaculture site plan.

**Core flow:** Upload sketch → Enter location → Click generate → Get enhanced images + report.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (single `index.html`) |
| Styling | `assets/styles.css` (Fraunces + DM Sans fonts) |
| Backend | Node.js native `http` module (`server.js`) |
| AI — Text | Anthropic Claude API (`claude-sonnet-4-6`) |
| AI — Vision | Anthropic Claude Vision (sketch analysis) |
| AI — Images | OpenAI `gpt-image-1` (enhanced sketch + realistic photo) |
| Site Data | 5 free APIs: Nominatim, NASA POWER, Open-Meteo, SoilGrids, Climate API |
| Markdown | marked.js (CDN) |

**Dependencies (4 only):** `@anthropic-ai/sdk`, `openai`, `dotenv`, `uuid`

---

## 3. File Structure

```
permaculture-app/
├── CLAUDE.md                    — You are here
├── index.html                   — Single-page frontend
├── server.js                    — API server (port 3002)
├── assets/styles.css            — All styling
├── lib/
│   ├── site-data-fetcher.js     — Geocoding + climate/soil/elevation APIs
│   ├── report-generator.js      — Claude Vision analysis + report streaming
│   └── image-generator.js       — OpenAI gpt-image-1 integration (see docs/IMAGE_GENERATION.md)
├── prompts/
│   └── report-prompt.js         — Sketch analysis + report prompt builders
├── docs/
│   ├── IMAGE_GENERATION.md      — Current image pipeline, prompt design, cache rules
│   ├── PERMACULTURE_DOMAIN.md   — Domain knowledge loaded into report prompts at runtime
│   ├── SCALE_OF_PERMANENCE.md   — Framework reference
│   ├── REPORT_STRUCTURE_SHORT.md
│   └── REPORT_STRUCTURE_LONG.md
├── report_templates/            — Reference input/output examples
├── data/
│   ├── cache.json               — Result cache (keyed by sketch MD5 + lat/lng)
│   ├── uploads/                 — User-uploaded sketches (UUID filenames)
│   └── outputs/                 — AI-generated images (UUID filenames)
├── .env                         — ANTHROPIC_API_KEY, OPENAI_API_KEY, PORT
└── package.json
```

---

## 4. API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /api/geocode?address=` | GET | Address → lat/lng via Nominatim |
| `GET /api/site-data?lat=&lng=` | GET | Fetch climate, soil, elevation, frost, Köppen |
| `POST /api/upload-sketch` | POST | Upload sketch image (multipart/form-data) |
| `POST /api/generate` | POST→SSE | Main pipeline: analyze → report + images |

### Generation Pipeline (`/api/generate`)
1. Read uploaded sketch, convert to base64
2. Claude Vision analyzes sketch → structured description
3. **In parallel:**
   - Claude streams one-page report (SSE: `report_chunk`, `report_complete`)
   - OpenAI generates enhanced watercolor sketch (SSE: `enhanced_complete`)
   - OpenAI generates photorealistic aerial photo (SSE: `realistic_complete`)
4. Each output is independent — if one fails, others still complete

---

## 5. Key Design Decisions

- **No project save/load** — single-use generation tool
- **Sketch uploaded separately** — filename passed to `/api/generate`, server reads from disk
- **Generated images saved to disk** — URL returned via SSE (not base64)
- **Client-side resize** — sketch resized to max 2048px before upload
- **Report streams via Claude SDK** — `messages.stream()` yields text chunks
- **Site data fetches silently** — user sees location badge, not raw data
- **Result cache** — `data/cache.json`, keyed by MD5(sketch bytes) + lat/lng. `POST /api/generate` with `force: true` evicts the entry before generating.
- **"Regenerate Images" button** — appears in results section after generation; sends `force: true` to bypass cache
- **Report strikethrough prevention** — prompt forbids `~~text~~`; frontend also strips it with `.replace(/~~([^~]+)~~/g, '$1')` before `marked.parse()`
- **`/api/generate` SSE events:** `status`, `cache_hit`, `analysis_complete`, `report_chunk`, `report_complete`, `enhanced_complete`, `realistic_complete`, `generation_complete`, `*_error`

---

## 6. Running the App

```bash
cd permaculture-app
npm install
# Set API keys in .env
npm start
# Open http://localhost:3002
```

---

## 7. Report Output Structure

The one-page report includes these sections:
- **Site Overview** — Location, climate zone, terrain, soil summary
- **Design Elements** — How sketch elements work as an integrated system
- **Plant List** — Table with specific species, locations, functions
- **Animals** — Table with breeds, locations, roles
- **Structures** — Purpose, orientation, integration recommendations
- **Things to Consider** — 5-7 critical considerations
- **Resilience Focus: Food, Energy & Water** — Three-pillar analysis

---

## 8. AI Rules

- Use `claude-sonnet-4-6` for all text generation
- Use `gpt-image-1` for all image generation (1536x1024, high quality)
- Prompts load `docs/PERMACULTURE_DOMAIN.md` at runtime for domain grounding
- All prompts in `prompts/report-prompt.js` — never inline
- Sketch analysis prompt extracts: structures, zones, plants, animals, water, infrastructure, labels, spatial layout
- **Image generation must use `images.edit()` as primary** — it sends actual sketch pixels so the layout is preserved. DALL-E 3 text-to-image is fallback only (it invents a new farm from scratch).

---

## 9. Operational Rules (Claude must follow without being asked)

- **Always restart the server** after editing any `.js` file in this project. Kill the old `node server.js` process and start a new one.
- **Always clear the cache** (`echo '{}' > data/cache.json`) after any change to image generation logic, prompts, or AI parameters — otherwise old cached images will be served.
- Both of the above must happen together whenever image-related code changes.
