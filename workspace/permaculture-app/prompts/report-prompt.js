/**
 * report-prompt.js — Prompt builders for sketch analysis and one-page report
 *
 * Reuses context formatters from the original section-prompts.js
 * for climate, soil, elevation, and Köppen data formatting.
 */

const fs = require('fs');
const path = require('path');

// ─── Sketch Analysis Prompt ─────────────────────────────────────────

const SKETCH_ANALYSIS_PROMPT = `Analyze this hand-drawn permaculture site sketch. I need to reproduce it as an AI-generated image, so be EXTREMELY spatial and precise.

**PART A — PERSPECTIVE & BOUNDARY** (describe first):
- What drawing perspective is used? (isometric/oblique, top-down, 3/4 view, etc.)
- Describe the property boundary shape exactly: is it a rectangle? parallelogram? What angle is it tilted? Which direction does the long axis run?
- How much of the image does the property occupy?

**PART B — DOMINANT FEATURES** (what are the 2-3 most visually prominent elements?):
Describe these in detail first, with size, shape, and position.

**PART C — ALL ELEMENTS** (for each element, provide ALL of the following):
- Exact compass position: NW / N / NE / W / CENTER / E / SW / S / SE (inside or outside property boundary?)
- Approximate position as % from left edge and % from top
- Visual appearance: what does it look like drawn? (bumpy cloud shapes, rectangles, zigzag lines, wavy lines, etc.)
- Exact text label as written on sketch (transcribe character by character)
- Relative size compared to the property

**PART D — SPATIAL RELATIONSHIPS**:
- What is north/south/east/west of what
- What is inside vs outside the property boundary
- Any arrows or directional indicators and what they point to

Return this as a clear structured description. Be extremely specific — imagine you are briefing an artist who cannot see the sketch and must recreate it exactly from your words alone.`;

// ─── Context Formatters (extracted from section-prompts.js) ─────────

function formatClimateContext(siteData) {
  const c = siteData?.climate;
  const f = siteData?.frost;
  if (!c) return 'Climate data: not available.';

  let ctx = `## Climate Data (30-year normals)\n`;
  ctx += `- Annual rainfall: ${c.annual?.rainfall ?? '?'}mm (pattern: ${c.annual?.rainfallPattern ?? '?'})\n`;
  ctx += `- Temperature: annual mean ${c.annual?.tempMean ?? '?'}°C, max ${c.annual?.tempMax ?? '?'}°C, min ${c.annual?.tempMin ?? '?'}°C\n`;
  ctx += `- Humidity: ${c.annual?.humidity ?? '?'}%\n`;
  ctx += `- Wind: ${c.annual?.windSpeed ?? '?'} m/s from ${c.annual?.windDirectionLabel ?? '?'}\n`;
  ctx += `- Solar radiation: ${c.annual?.solarRadiation ?? '?'} MJ/m²/day\n`;

  if (c.monthly) {
    ctx += `\n### Monthly Data\n`;
    ctx += `| Month | Temp Min | Temp Max | Rain (mm) | Humidity | Wind (m/s) | Solar (MJ/m²/d) |\n`;
    ctx += `|-------|----------|----------|-----------|----------|------------|------------------|\n`;
    for (const m of c.monthly) {
      ctx += `| ${m.month} | ${m.tempMin}°C | ${m.tempMax}°C | ${m.precipitation} | ${m.humidity}% | ${m.windSpeed} | ${m.solarRadiation} |\n`;
    }
  }

  if (f) {
    ctx += `\n### Frost Data (${f.dataYear})\n`;
    ctx += `- Frost risk: ${f.frostRisk}\n`;
    ctx += `- Last spring frost: ${f.lastSpringFrost || 'none'}\n`;
    ctx += `- First autumn frost: ${f.firstAutumnFrost || 'none'}\n`;
    ctx += `- Frost-free days: ${f.frostFreeDays}\n`;
    ctx += `- Growing degree days (base 10°C): ${f.growingDegreeDays}\n`;
  }

  return ctx;
}

function formatSoilContext(siteData) {
  const s = siteData?.soil;
  if (!s) return 'Soil data: not available.';

  let ctx = `## Soil Data (SoilGrids 250m resolution)\n`;
  ctx += `- Classification: ${s.classification ?? '?'}\n`;
  ctx += `- Texture class: ${s.textureClass ?? '?'}\n`;
  ctx += `- Sand/Silt/Clay: ${s.sand ?? '?'}% / ${s.silt ?? '?'}% / ${s.clay ?? '?'}%\n`;
  ctx += `- pH: ${s.ph ?? '?'} (${s.phCategory ?? '?'})\n`;
  ctx += `- Organic carbon: ${s.organicCarbon ?? '?'} g/kg\n`;
  ctx += `- CEC: ${s.cec ?? '?'} mmol(c)/kg\n`;
  ctx += `- Bulk density: ${s.bulkDensity ?? '?'} g/cm³\n`;
  ctx += `- Nitrogen: ${s.nitrogen ?? '?'} g/kg\n`;
  return ctx;
}

function formatElevationContext(siteData) {
  const e = siteData?.elevation;
  if (!e) return '';
  let ctx = `## Elevation & Topography\n`;
  ctx += `- Elevation: ${e.elevation}m above sea level\n`;
  ctx += `- Slope: ${e.slopePercent}% (${e.slopeCategory})\n`;
  ctx += `- Aspect: ${e.aspectDirection} (${e.aspectDegrees}°)\n`;
  return ctx;
}

function formatKoppenContext(siteData) {
  const k = siteData?.koppen;
  if (!k) return '';
  return `## Köppen Climate Zone\n- Code: ${k.code}\n- Description: ${k.description}\n`;
}

function formatSiteDataForPrompt(siteData) {
  if (!siteData) return 'Site data: not available.';
  return [
    formatKoppenContext(siteData),
    formatElevationContext(siteData),
    formatClimateContext(siteData),
    formatSoilContext(siteData)
  ].filter(Boolean).join('\n');
}

// ─── Report System Prompt ───────────────────────────────────────────

function buildReportSystemPrompt() {
  let domainKnowledge = '';
  try {
    domainKnowledge = fs.readFileSync(
      path.join(__dirname, '..', 'docs', 'PERMACULTURE_DOMAIN.md'), 'utf8'
    );
  } catch (e) {
    console.warn('[Prompts] Could not load PERMACULTURE_DOMAIN.md:', e.message);
  }

  return `You are an expert permaculture designer creating a concise one-page design summary. You follow the Scale of Permanence framework (Yeomans/Holmgren) and the 12 Permaculture Principles.

CRITICAL RULES:
1. Every recommendation MUST tie to a specific site observation or sketch element. Never give generic advice.
2. Be DEFINITIVE, not hedging. Write "Plant Malus domestica 'Bramley' in the orchard zone" NOT "Consider planting apple trees."
3. Name SPECIFIC plant species and cultivars appropriate to the Köppen climate zone.
4. Name SPECIFIC animal breeds appropriate to the climate and property size.
5. QUANTIFY where possible (areas in m², counts, expected yields in kg).
6. Use metric units throughout (m, m², ha, mm, °C, L, kg).
7. Format output as Markdown with clear headings (##, ###), bullet points, and tables. Do NOT use strikethrough (~~text~~) anywhere — it will render as crossed-out text. Bold (**text**) and italics (*text*) only.
8. Keep the total output to approximately 800-1200 words — this is a ONE-PAGE summary, not a full report.
9. Focus on resilience in three pillars: FOOD, ENERGY, and WATER.
10. When referencing climate data, cite specific values (e.g., "July receives only 8mm of rain").

${domainKnowledge ? `\nReference knowledge:\n${domainKnowledge}` : ''}`;
}

// ─── Report User Prompt ─────────────────────────────────────────────

function buildReportUserPrompt(sketchAnalysis, siteData, location) {
  return `Generate a one-page permaculture design summary for this property.

## Location
${location.displayName || 'Unknown location'}
Coordinates: ${location.lat}, ${location.lng}

## Sketch Analysis (from the owner's hand-drawn design)
${sketchAnalysis}

## Site Data (auto-fetched)
${formatSiteDataForPrompt(siteData)}

---

Generate the report with EXACTLY these sections:

### Site Overview
Brief description of the property location, climate zone, terrain, and soil (3-4 sentences).
Mention the Köppen zone, annual rainfall, temperature range, and frost risk.

### Design Elements
Describe the key design elements visible in the sketch and how they work together as an integrated permaculture system. Reference zone placement rationale. (~150 words)

### Plant List
Table format: | Plant | Location | Function | Notes |
Include trees, shrubs, groundcovers, herbs, and vegetables appropriate to this climate. Minimum 15 specific species with cultivar names where relevant.

### Animals
Table format: | Animal | Location | Role | Management Notes |
Based on what the sketch shows plus climate-appropriate additions.

### Structures
Describe each structure's purpose, orientation recommendations, and integration with the overall design (passive solar, water catchment, etc.)

### Things to Consider
5-7 bullet points of critical considerations: frost pockets, wind exposure, water management challenges, soil amendments needed, seasonal timing, etc.

### Resilience Focus: Food, Energy & Water
How this design achieves resilience in each pillar:
- **Food**: diversity, year-round production, storage, caloric self-sufficiency
- **Energy**: passive solar, biomass, wind shelter, thermal mass
- **Water**: catchment, storage, grey water, drought resilience, water budget`;
}

module.exports = {
  SKETCH_ANALYSIS_PROMPT,
  buildReportSystemPrompt,
  buildReportUserPrompt,
  formatSiteDataForPrompt
};
