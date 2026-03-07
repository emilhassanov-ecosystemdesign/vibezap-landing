/**
 * permaculture-design.ts — High-fidelity Permaculture Design Automation Tool
 *
 * Three-step pipeline:
 *   Step 1  Claude Vision (claude-sonnet-4-6) → structured Vision Map JSON with
 *           annotated (x, y) coordinates for every sketch element
 *   Step 2  Nominatim geocode + Open-Meteo climate → USDA hardiness zone +
 *           Claude-curated list of native permaculture species for the location
 *   Step 3  Two parallel Fal.ai calls:
 *     A)  fal-ai/flux-general  canny control (control_strength 0.85, denoise 0.4)
 *         → professional architectural watercolour masterplan
 *     B)  fal-ai/flux-general  depth control (control_strength 0.7)
 *         → high-end drone photography of the mature food forest
 *
 * CLI usage:
 *   ANTHROPIC_API_KEY=xxx FAL_KEY=yyy \
 *     npx ts-node src/permaculture-design.ts \
 *     --image /path/to/sketch.jpg \
 *     --location "Sheki, Azerbaijan"
 *
 * Importable:
 *   import { runPermacultureDesign } from './src/permaculture-design';
 *   const result = await runPermacultureDesign({ imageBase64, location });
 */

import Anthropic from '@anthropic-ai/sdk';
import { fal } from '@fal-ai/client';
import * as fs from 'fs';
import * as path from 'path';

// ── Types ──────────────────────────────────────────────────────────────────────

export type AnnotationType =
  | 'zone'
  | 'structure'
  | 'plant'
  | 'water'
  | 'path'
  | 'boundary'
  | 'label'
  | 'other';

export interface Annotation {
  /** Text exactly as handwritten on the sketch */
  label: string;
  /** 0–100, percentage from left edge */
  x: number;
  /** 0–100, percentage from top edge */
  y: number;
  type: AnnotationType;
  description: string;
}

export interface SketchZone {
  name: string;
  purpose: string;
  /** 0–100 percentage from left */
  centerX: number;
  /** 0–100 percentage from top */
  centerY: number;
  /** Estimated fraction of total area, e.g. "~15%" */
  approximateSizePct: string;
}

export interface VisionMap {
  imageWidth: number;
  imageHeight: number;
  /** Simplified ratio, e.g. "4:3" */
  aspectRatio: string;
  overallDesignIntent: string;
  annotations: Annotation[];
  zones: SketchZone[];
  keyFeatures: string[];
  designPrinciples: string[];
  /** Raw Claude response text (kept for debugging) */
  analysisRawText: string;
}

export interface HardinessInfo {
  /** USDA zone string, e.g. "Zone 8b" */
  zone: string;
  /** 10-year recorded minimum °C, or null if unavailable */
  minTempC: number | null;
  country: string;
  /** 8–12 species, formatted "Common Name (Latin) — permaculture function" */
  nativeSpecies: string[];
  localKnowledgeNotes: string;
}

export interface DesignResult {
  visionMap: VisionMap;
  hardiness: HardinessInfo;
  /** Fal.ai CDN URL for the canny-controlled enhanced masterplan */
  enhancedSketchUrl: string;
  /** Fal.ai CDN URL for the depth-controlled drone photo */
  futureStatePhotoUrl: string;
}

export interface DesignInput {
  /** data:image/...;base64,... OR raw base64 string */
  imageBase64: string;
  /** Human-readable location, e.g. "Sheki, Azerbaijan" */
  location: string;
}

// ── Image Dimension Extraction ─────────────────────────────────────────────────

/**
 * Extract pixel dimensions directly from image bytes — no external deps.
 * Supports PNG, JPEG, and WebP.
 */
function getImageDimensions(imageBase64: string): { width: number; height: number } {
  const rawB64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
  const buf = Buffer.from(rawB64, 'base64');

  // PNG — signature: 89 50 4E 47 0D 0A 1A 0A; IHDR width @ 16, height @ 20
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // JPEG — FF D8 preamble, scan for SOF markers
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 8) {
      if (buf[i] !== 0xff) break;
      const marker = buf[i + 1];
      // SOF0–SOF15 minus DHT (C4), JPG (C8), DAC (CC)
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      const segLen = buf.readUInt16BE(i + 2);
      i += 2 + segLen;
    }
  }

  // WebP — RIFF....WEBP container
  if (
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const format = buf.toString('ascii', 12, 16);
    if (format === 'VP8 ') {
      // Lossy: width/height at offsets 26/28 (14-bit values)
      return {
        width: (buf.readUInt16LE(26) & 0x3fff) + 1,
        height: (buf.readUInt16LE(28) & 0x3fff) + 1,
      };
    }
    if (format === 'VP8L') {
      // Lossless: packed 14-bit fields starting at byte 21
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }

  console.warn('[Dimensions] Unrecognised image format — falling back to 1024×768');
  return { width: 1024, height: 768 };
}

function computeAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(width, height);
  return `${width / d}:${height / d}`;
}

// ── Step 1: Claude Vision — Structured Sketch Analysis ─────────────────────────

const VISION_PROMPT = `You are an expert permaculture designer analysing a hand-drawn farm sketch.

Return ONLY a single valid JSON object — no markdown fences, no prose before or after — matching this schema exactly:

{
  "overallDesignIntent": "<one paragraph describing the design goals visible in the sketch>",
  "annotations": [
    {
      "label": "<text exactly as written on the sketch>",
      "x": <0–100 percentage from left edge>,
      "y": <0–100 percentage from top edge>,
      "type": "<zone|structure|plant|water|path|boundary|label|other>",
      "description": "<what this element is and its permaculture function>"
    }
  ],
  "zones": [
    {
      "name": "<Zone 1 / Kitchen Garden / Orchard / etc>",
      "purpose": "<permaculture function>",
      "centerX": <0–100>,
      "centerY": <0–100>,
      "approximateSizePct": "<e.g. ~20%>"
    }
  ],
  "keyFeatures": ["<landscape or design feature>"],
  "designPrinciples": ["<which permaculture principle is evident>"]
}

COORDINATE SYSTEM: x=0 is the left edge, x=100 is the right edge; y=0 is the top, y=100 is the bottom.
Be precise — identify each annotation's actual pixel position.
Do NOT invent elements not visible in the sketch.`;

async function analyzeSketchWithCoordinates(
  imageBase64: string,
  client: Anthropic
): Promise<{ rawText: string; parsed: Partial<VisionMap> }> {
  const mediaTypeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mediaType = (mediaTypeMatch?.[1] ?? 'image/jpeg') as
    | 'image/jpeg'
    | 'image/png'
    | 'image/gif'
    | 'image/webp';
  const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

  console.log('[Step 1] Sending sketch to Claude Vision (claude-sonnet-4-6)...');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: VISION_PROMPT },
        ],
      },
    ],
  });

  const rawText =
    response.content[0]?.type === 'text' ? response.content[0].text : '';
  console.log(`[Step 1] Vision analysis complete (${rawText.length} chars)`);

  let parsed: Partial<VisionMap> = {};
  try {
    // Strip any accidental markdown fences Claude may still include
    const jsonStr = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    console.warn('[Step 1] Could not parse JSON from Vision response — using raw text fallback');
  }

  return { rawText, parsed };
}

// ── Step 2: Hardiness Zone + Native Species ────────────────────────────────────

async function fetchMinTemp(lat: number, lng: number): Promise<number | null> {
  try {
    const year = new Date().getFullYear() - 1;
    const startYear = year - 9; // 10-year window
    const url =
      `https://archive-api.open-meteo.com/v1/archive` +
      `?latitude=${lat}&longitude=${lng}` +
      `&start_date=${startYear}-01-01&end_date=${year}-12-31` +
      `&daily=temperature_2m_min&timezone=UTC`;
    const res = await fetch(url);
    const data = (await res.json()) as { daily?: { temperature_2m_min?: (number | null)[] } };
    const temps = (data.daily?.temperature_2m_min ?? []).filter(
      (t): t is number => t !== null
    );
    return temps.length > 0 ? Math.min(...temps) : null;
  } catch {
    return null;
  }
}

async function determineHardinessAndSpecies(
  location: string,
  client: Anthropic
): Promise<HardinessInfo> {
  console.log(`[Step 2] Determining hardiness zone and native species for: ${location}`);

  // Geocode to get lat/lng for climate data
  let minTempC: number | null = null;
  let country = '';

  try {
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&addressdetails=1&limit=1`;
    const geoRes = await fetch(geoUrl, {
      headers: { 'User-Agent': 'PermacultureDesignTool/1.0' },
    });
    const geoData = (await geoRes.json()) as Array<{
      lat: string;
      lon: string;
      address?: { country?: string };
    }>;

    if (geoData?.[0]) {
      const lat = parseFloat(geoData[0].lat);
      const lng = parseFloat(geoData[0].lon);
      country = geoData[0].address?.country ?? '';
      minTempC = await fetchMinTemp(lat, lng);
      if (minTempC !== null) {
        console.log(
          `[Step 2] 10-year min temp at ${lat.toFixed(3)}, ${lng.toFixed(3)}: ${minTempC.toFixed(1)}°C`
        );
      }
    }
  } catch {
    console.warn('[Step 2] Geocoding or climate fetch failed — relying on Claude knowledge');
  }

  // Claude determines zone + species from location context
  const tempContext =
    minTempC !== null
      ? `The 10-year recorded minimum temperature is ${minTempC.toFixed(1)}°C.`
      : '';

  const prompt = `You are a permaculture specialist with deep regional knowledge.

Location: "${location}"
${tempContext}

Return ONLY valid JSON — no markdown — matching this schema:
{
  "zone": "<USDA hardiness zone, e.g. Zone 8b>",
  "country": "<country name, infer from location if not given: ${country || 'unknown'}>",
  "nativeSpecies": [
    "<8–12 permaculture-appropriate species for this specific location>",
    "<Include fruit trees, nitrogen-fixers, ground covers, herbs>",
    "<Prioritise species historically cultivated in this region>",
    "<Format each as: Common Name (Latin Name) — permaculture function>"
  ],
  "localKnowledgeNotes": "<2–3 sentences on traditional agroforestry and land management practices specific to this region>"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawText =
    response.content[0]?.type === 'text' ? response.content[0].text : '{}';

  let parsed: {
    zone?: string;
    country?: string;
    nativeSpecies?: string[];
    localKnowledgeNotes?: string;
  } = {};
  try {
    const jsonStr = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    console.warn('[Step 2] Could not parse hardiness JSON from Claude response');
  }

  const result: HardinessInfo = {
    zone: parsed.zone ?? 'Unknown',
    minTempC,
    country: parsed.country ?? country,
    nativeSpecies: Array.isArray(parsed.nativeSpecies) ? parsed.nativeSpecies : [],
    localKnowledgeNotes: parsed.localKnowledgeNotes ?? '',
  };

  console.log(`[Step 2] Zone: ${result.zone} | ${result.nativeSpecies.length} native species identified`);
  return result;
}

// ── Step 3A: Fal.ai — Enhanced Sketch via Canny ControlNet ───────────────────
//
// Endpoint: fal-ai/flux-general/image-to-image
//   image_url + strength  → img2img with denoise_strength=0.4
//   controlnet_unions     → ControlNetUnion with control_mode="canny", conditioning_scale=0.85

const ENHANCED_SKETCH_PROMPT =
  'A professional architectural masterplan of a permaculture farm, watercolor style, ' +
  'crisp black ink outlines matching the original sketch, vibrant green zones, ' +
  'legible annotations, top-down map view, clean and professional.';

async function generateEnhancedSketch(
  imageBase64: string,
  dimensions: { width: number; height: number }
): Promise<string> {
  console.log(
    `[Step 3A] Fal.ai flux-general/image-to-image — canny control_strength=0.85, denoise=0.4 ` +
      `(${dimensions.width}×${dimensions.height})...`
  );

  // Ensure proper data URL format — fal-client handles upload to CDN transparently
  const imageUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const result = await fal.subscribe('fal-ai/flux-general/image-to-image', {
    input: {
      prompt: ENHANCED_SKETCH_PROMPT,
      image_url: imageUrl,
      strength: 0.4, // denoise_strength — lower = more faithful to sketch layout
      controlnet_unions: [
        {
          path: 'InstantX/FLUX.1-dev-Controlnet-Union',
          controls: [
            {
              control_image_url: imageUrl,
              control_mode: 'canny' as const, // edge-detection structural guidance
              conditioning_scale: 0.85,        // control_strength
            },
          ],
        },
      ],
      num_inference_steps: 28,
      guidance_scale: 3.5,
      image_size: { width: dimensions.width, height: dimensions.height },
    },
    logs: true,
    onQueueUpdate(update) {
      if (update.status === 'IN_PROGRESS') {
        const msg = (update as any).logs?.[(update as any).logs.length - 1]?.message;
        if (msg) process.stdout.write(`\r[Fal-A] ${msg}                    `);
      }
    },
  });

  process.stdout.write('\n');

  // FluxGeneralImageToImageOutput returns { images: [{ url }] }
  const data = result.data as { images?: Array<{ url: string }>; image?: { url: string } };
  const outputUrl = data?.images?.[0]?.url ?? data?.image?.url;
  if (!outputUrl) {
    throw new Error(
      `Fal.ai (canny) returned no image URL. Response: ${JSON.stringify(result.data)}`
    );
  }

  console.log(`[Step 3A] Enhanced sketch URL: ${outputUrl}`);
  return outputUrl;
}

// ── Step 3B: Fal.ai — Future State Photo via Depth ControlNet ───────────────
//
// Endpoint: fal-ai/flux-general/image-to-image
//   controlnet_unions → ControlNetUnion with control_mode="depth", conditioning_scale=0.7
//   No denoise strength — depth map guides spatial layout without blending constraints

function buildFuturePhotoPrompt(location: string, species: string[]): string {
  // Take up to 5 species, strip function notes, use common names only for prompt clarity
  const speciesStr = species
    .slice(0, 5)
    .map(s => s.split('—')[0].split('(')[0].trim())
    .filter(Boolean)
    .join(', ');
  const speciesClause = speciesStr ? `, ${speciesStr} integrated into the landscape` : '';
  return (
    `High-end drone photography of a mature regenerative food forest at ${location}` +
    `${speciesClause}, lush swales, realistic soil textures, 8k resolution, golden hour lighting.`
  );
}

async function generateFutureStatePhoto(
  imageBase64: string,
  location: string,
  species: string[],
  dimensions: { width: number; height: number }
): Promise<string> {
  const prompt = buildFuturePhotoPrompt(location, species);
  console.log(
    `[Step 3B] Fal.ai flux-general/image-to-image — depth control_strength=0.7 ` +
      `(${dimensions.width}×${dimensions.height})...`
  );
  console.log(`[Step 3B] Prompt: ${prompt}`);

  const imageUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const result = await fal.subscribe('fal-ai/flux-general/image-to-image', {
    input: {
      prompt,
      image_url: imageUrl,
      // No explicit strength — use default (0.85) for more dramatic photo transformation
      controlnet_unions: [
        {
          path: 'InstantX/FLUX.1-dev-Controlnet-Union',
          controls: [
            {
              control_image_url: imageUrl,
              control_mode: 'depth' as const, // depth-map spatial structure guidance
              conditioning_scale: 0.7,         // control_strength
            },
          ],
        },
      ],
      num_inference_steps: 35,
      guidance_scale: 4.0,
      image_size: { width: dimensions.width, height: dimensions.height },
    },
    logs: true,
    onQueueUpdate(update) {
      if (update.status === 'IN_PROGRESS') {
        const msg = (update as any).logs?.[(update as any).logs.length - 1]?.message;
        if (msg) process.stdout.write(`\r[Fal-B] ${msg}                    `);
      }
    },
  });

  process.stdout.write('\n');

  const data = result.data as { images?: Array<{ url: string }>; image?: { url: string } };
  const outputUrl = data?.images?.[0]?.url ?? data?.image?.url;
  if (!outputUrl) {
    throw new Error(
      `Fal.ai (depth) returned no image URL. Response: ${JSON.stringify(result.data)}`
    );
  }

  console.log(`[Step 3B] Future state photo URL: ${outputUrl}`);
  return outputUrl;
}

// ── Main Pipeline ──────────────────────────────────────────────────────────────

/**
 * Full permaculture design automation pipeline.
 * Requires environment variables: ANTHROPIC_API_KEY, FAL_KEY
 */
export async function runPermacultureDesign(input: DesignInput): Promise<DesignResult> {
  const { imageBase64, location } = input;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY environment variable is not set');
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  fal.config({ credentials: process.env.FAL_KEY });

  console.log('\n🌿 Permaculture Design Automation Pipeline');
  console.log('━'.repeat(60));
  console.log(`   Location : ${location}`);

  // Extract image dimensions for aspect-ratio-consistent Fal.ai output
  const dimensions = getImageDimensions(imageBase64);
  const aspectRatio = computeAspectRatio(dimensions.width, dimensions.height);
  console.log(`   Image    : ${dimensions.width}×${dimensions.height} (${aspectRatio})\n`);

  // ── Step 1: Claude Vision sketch analysis ────────────────────────────────
  const { rawText: analysisRawText, parsed: visionParsed } =
    await analyzeSketchWithCoordinates(imageBase64, anthropic);

  // ── Step 2: Hardiness zone + native species ──────────────────────────────
  const hardinessInfo = await determineHardinessAndSpecies(location, anthropic);

  // ── Step 3: Both Fal.ai calls in parallel ───────────────────────────────
  console.log('\n[Step 3] Launching Request A (canny) and Request B (depth) in parallel...\n');

  const [enhancedSketchUrl, futureStatePhotoUrl] = await Promise.all([
    generateEnhancedSketch(imageBase64, dimensions),
    generateFutureStatePhoto(imageBase64, location, hardinessInfo.nativeSpecies, dimensions),
  ]);

  // ── Assemble Vision Map ──────────────────────────────────────────────────
  const visionMap: VisionMap = {
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
    aspectRatio,
    overallDesignIntent:
      visionParsed.overallDesignIntent ?? analysisRawText.slice(0, 300),
    annotations: visionParsed.annotations ?? [],
    zones: visionParsed.zones ?? [],
    keyFeatures: visionParsed.keyFeatures ?? [],
    designPrinciples: visionParsed.designPrinciples ?? [],
    analysisRawText,
  };

  const designResult: DesignResult = {
    visionMap,
    hardiness: hardinessInfo,
    enhancedSketchUrl,
    futureStatePhotoUrl,
  };

  // ── Console output ───────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  PERMACULTURE DESIGN RESULTS');
  console.log('═'.repeat(60));

  console.log('\n📐 VISION MAP (JSON):');
  console.log(JSON.stringify(visionMap, null, 2));

  console.log('\n🌱 HARDINESS & NATIVE SPECIES:');
  console.log(JSON.stringify(hardinessInfo, null, 2));

  console.log('\n🎨 GENERATED IMAGE URLs:');
  console.log(`  Request A — Enhanced Sketch (canny)  : ${enhancedSketchUrl}`);
  console.log(`  Request B — Future State Photo (depth): ${futureStatePhotoUrl}`);

  console.log('\n📦 FULL RESULT JSON:');
  console.log(JSON.stringify(designResult, null, 2));

  console.log('\n' + '═'.repeat(60) + '\n');

  return designResult;
}

// ── CLI Entry Point ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let imagePath = '';
  let location = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--image' && args[i + 1]) imagePath = args[++i];
    else if (args[i] === '--location' && args[i + 1]) location = args[++i];
  }

  if (!imagePath || !location) {
    console.error(
      'Usage:\n' +
        '  ANTHROPIC_API_KEY=xxx FAL_KEY=yyy \\\n' +
        '    npx ts-node src/permaculture-design.ts \\\n' +
        '    --image /path/to/sketch.jpg \\\n' +
        '    --location "Sheki, Azerbaijan"'
    );
    process.exit(1);
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`Image file not found: ${imagePath}`);
    process.exit(1);
  }

  const ext = path.extname(imagePath).toLowerCase();
  const mimeType =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

  try {
    await runPermacultureDesign({ imageBase64, location });
  } catch (err: unknown) {
    const e = err as { message?: string; body?: unknown };
    console.error('\n❌ Pipeline error:', e.message ?? err);
    if (e.body) console.error('   API response body:', JSON.stringify(e.body, null, 2));
    process.exit(1);
  }
}

// Run when executed directly (not when imported as module)
if (require.main === module) {
  void main();
}
