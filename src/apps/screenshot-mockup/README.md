# Screenshot Mockup

**Route:** `/mockup`
**API:** `POST /api/mockup` (free), `POST /api/mockup-bulk` (paid)
**Status:** Live
**Price:** Free (iPhone, white bg, watermark) / $2.99 (all devices, custom bg, no watermark, ZIP)

## What It Does

User pastes a URL. Backend takes a screenshot with Puppeteer, composites it into a device frame using Sharp, returns a downloadable mockup image.

## User Flow

1. Paste URL → click "Mock it up"
2. Backend screenshots the site at iPhone 15 viewport
3. Composites into iPhone frame with white background + watermark
4. User downloads PNG
5. Upsell: "Unlock All Devices" ($2.99) → all 5 devices, custom backgrounds, no watermark, ZIP

## Devices

| ID | Name | Viewport |
|----|------|----------|
| iphone-15 | iPhone 15 | 393×852 |
| macbook-pro | MacBook Pro | 1440×900 |
| ipad | iPad | 1024×768 |
| android | Android Phone | 412×915 |
| desktop | Desktop Monitor | 1920×1080 |

## API

### Free: `POST /api/mockup`
- Input: `{ "url": "https://example.com" }`
- Output: `{ "image": "<base64>", "device": "iphone-15", "width": N, "height": N }`
- Rate limit: 3/hr per IP
- Timeout: 30s

### Paid: `POST /api/mockup-bulk`
- Input: `{ "urls": [...], "devices": [...], "background": "#hex" | { type, from, to }, "orderId": "..." }`
- Output: `{ "zipBase64": "<base64>", "count": N, "previews": [...] }`
- Rate limit: 10/hr per IP
- Timeout: 120s
- Payment: $2.99 (299 cents) via LemonSqueezy

## Files

- `src/apps/screenshot-mockup/ScreenshotMockup.jsx` — Frontend component
- `api/mockup.js` — Free endpoint
- `api/mockup-bulk.js` — Paid endpoint
- `api/lib/take-screenshot.js` — Puppeteer screenshot helper (shared)
- `api/lib/device-frames.js` — Device configs + Sharp compositing (shared)

## Design

- Theme: Standard VibeZap dark theme with cyan accent
- No AI involved — zero API cost per request
