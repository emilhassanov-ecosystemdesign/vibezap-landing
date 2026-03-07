# IMAGE_GENERATION.md
> Load this file when working on: image generation, prompts, AI model selection, image pipeline.

---

## Overview

Two images are generated per run from the user's uploaded sketch:

| Output | ID | Method | Input |
|---|---|---|---|
| Enhanced watercolor illustration | `enhanced` | `gpt-image-1` via `images.edit()` | Original sketch pixels |
| Photorealistic aerial drone photo | `realistic` | `gpt-image-1` via `images.edit()` | Enhanced sketch pixels (or original if enhanced failed) |

Both use **`images.edit()` as primary** — the model receives the actual sketch image and transforms it. This is critical: text-only generation (`images.generate()`) ignores the sketch layout and invents a new farm.

---

## Generation Pipeline

```
1. Upload sketch → saved to data/uploads/<uuid>.jpg
2. Claude Vision analyzes sketch → structured spatial description (sketchAnalysis)
3. generateEnhancedSketch(sketchPath, sketchAnalysis, siteData)
   → images.edit(sketchPath, watercolor prompt) → data/outputs/enhanced-<uuid>.png
4. generateRealisticPhoto(enhancedPath, sketchAnalysis, siteData)
   → images.edit(enhancedPath, photorealistic prompt) → data/outputs/realistic-<uuid>.png
5. URLs returned via SSE: enhanced_complete / realistic_complete
```

Step 4 uses the enhanced sketch as input (not the original) to preserve the cleaned-up spatial layout for the photo render.

---

## Fallback Order

### Enhanced Sketch
1. **Primary:** `gpt-image-1` `images.edit()` — sketch pixels in, watercolor style out
2. **Fallback:** DALL-E 3 `images.generate()` — text-only, layout fidelity is low

### Realistic Photo
1. **Primary:** `gpt-image-1` `images.edit()` — enhanced sketch in, photorealistic out
2. **Fallback:** DALL-E 3 `images.generate()` — text-only
3. **Fallback 2:** Stability AI `control/sketch` — only if `STABILITY_API_KEY` is set

---

## Prompts

Prompts live in `lib/image-generator.js`. Both are style-transformation prompts, not layout-description prompts — the model already sees the image, so prompts must NOT describe what to draw, only how to render it.

### Enhanced Sketch Prompt (key instructions)
- "Keep every element exactly where it is drawn — do not move, add, or remove anything. Only change the visual style."
- Watercolor washes: sage green/olive for vegetation, pale blue-grey for water, ochre for paths, grey for buildings
- Pen-and-ink outlines following existing sketch lines
- Preserve handwritten labels and annotations

### Realistic Photo Prompt (key instructions)
- "Keep every element in its exact position as drawn — same layout, same shapes, same spatial relationships."
- Aerial drone photograph, 80–120m altitude, 35–45° angle
- Real materials, golden afternoon light, no text labels in output
- Climate and terrain context appended from `siteData` (Köppen, elevation, slope)

---

## Result Cache

- Cache file: `data/cache.json`
- Cache key: MD5 hash of sketch file content + rounded lat/lng
- On hit: replays all SSE events (analysis, report, both images) instantly
- On miss: runs full pipeline and stores result
- **`force: true`** in the POST body evicts the cache entry before checking
- UI "Regenerate Images" button sends `force: true`
- **Always clear `data/cache.json` after changing prompts or generation logic** — `echo '{}' > data/cache.json`

---

## Image Storage

- All generated images saved to `data/outputs/<prefix>-<uuid>.png`
- Served via `GET /api/output/<filename>` with `Cache-Control: public, max-age=86400`
- URLs returned as relative paths: `api/output/<filename>`
- No external storage — disk only

---

## Model Parameters

| Parameter | Value |
|---|---|
| Model | `gpt-image-1` |
| Size | `1536x1024` |
| Quality | `high` |
| Response format | `b64_json` |

DALL-E 3 fallback uses `1792x1024`, `hd` quality, `natural` style, `url` response (downloaded immediately as URL expires).
