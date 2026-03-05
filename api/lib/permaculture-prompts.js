/**
 * permaculture-prompts.js — Prompt builders for land design reports
 *
 * Domain knowledge is inlined (no filesystem access in Vercel serverless).
 * Exports free + paid prompt variants and context formatters.
 */

// ─── Domain Knowledge (inlined from PERMACULTURE_DOMAIN.md) ─────────

const DOMAIN_KNOWLEDGE = `
## The 12 Permaculture Principles (Holmgren)
1. Observe and Interact
2. Catch and Store Energy
3. Obtain a Yield
4. Apply Self-Regulation and Accept Feedback
5. Use and Value Renewable Resources and Services
6. Produce No Waste
7. Design from Patterns to Details
8. Integrate Rather than Segregate
9. Use Small and Slow Solutions
10. Use and Value Diversity
11. Use Edges and Value the Marginal
12. Creatively Use and Respond to Change

## Zone Definitions (Mollison)
| Zone | Description | Examples |
|---|---|---|
| 0 | The home / base of operations | House, studio, workshop |
| 1 | Most frequently visited, intensive care | Kitchen garden, herbs, salad greens, compost |
| 2 | Regular but less frequent visits | Orchard, berry patch, chickens, larger beds |
| 3 | Occasional management | Staple crops, pasture, larger livestock |
| 4 | Semi-wild, minimal intervention | Managed forest, nuts, forage, timber |
| 5 | Wilderness, no intervention | Biodiversity reserve, observation only |

## Sector Analysis Factors
- Sun arc (summer/winter solstice paths)
- Prevailing winds (beneficial breeze vs. damaging wind)
- Cold air drainage (frost pockets flow downhill)
- Fire risk direction
- Water flow (surface runoff paths)
- Noise / visual pollution sources
- Wildlife corridors

## Plant Guild Structure (7 Layers)
1. Canopy — Large fruit/nut trees (apple, pear, walnut, oak)
2. Sub-canopy — Smaller fruit trees (plum, cherry, mulberry)
3. Shrub layer — Fruiting shrubs (currants, gooseberry, elderberry)
4. Herbaceous — Perennial vegetables and herbs (comfrey, yarrow, fennel)
5. Groundcover — Low-growing plants (strawberry, clover, creeping thyme)
6. Root layer — Root crops and bulbs (comfrey root, burdock, garlic)
7. Vine layer — Climbers (grape, kiwi, hops, runner beans)

## Water Management Hierarchy
1. Slow it (contour swales, check dams)
2. Spread it (keyline design, broad swales)
3. Sink it (mulch, soil organic matter)
4. Store it (ponds, tanks, cisterns)
5. Use it (irrigation, livestock, domestic)

## Common Plant Guilds by Climate
- Temperate: Apple + comfrey + yarrow + chives + nasturtium + clover; Elderberry + currant + mint + fennel
- Mediterranean: Olive + lavender + rosemary + borage + garlic + clover
- Subtropical: Banana + papaya + ginger + turmeric + sweet potato + pigeon pea
- Semi-arid: Pomegranate + fig + jujube + wormwood + yarrow + rosemary

## Implementation Phases
- Phase 1 (Months 1-6): Water harvesting, paths, compost, fast annuals
- Phase 2 (Months 7-18): Fruit trees, shrubs, small livestock, renewable energy
- Phase 3 (Year 2-5+): Canopy trees, Zone 3-4, community systems
`;

// ─── Sketch Analysis Prompt ─────────────────────────────────────────

export const SKETCH_ANALYSIS_PROMPT = `Analyze this hand-drawn permaculture site sketch. I need to reproduce it as an AI-generated image, so be EXTREMELY spatial and precise.

**PART A — PERSPECTIVE & BOUNDARY**:
- What drawing perspective is used? (isometric/oblique, top-down, 3/4 view, etc.)
- Describe the property boundary shape exactly.
- How much of the image does the property occupy?

**PART B — DOMINANT FEATURES** (2-3 most visually prominent elements):
Describe these in detail with size, shape, and position.

**PART C — ALL ELEMENTS** (for each element):
- Exact compass position: NW / N / NE / W / CENTER / E / SW / S / SE
- Approximate position as % from left edge and % from top
- Visual appearance
- Exact text label as written on sketch
- Relative size compared to the property

**PART D — SPATIAL RELATIONSHIPS**:
- What is north/south/east/west of what
- What is inside vs outside the property boundary
- Any arrows or directional indicators

Return a clear structured description. Be extremely specific.`;

// ─── Context Formatters ─────────────────────────────────────────────

export function formatClimateContext(siteData) {
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

export function formatSoilContext(siteData) {
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

export function formatElevationContext(siteData) {
  const e = siteData?.elevation;
  if (!e) return '';
  let ctx = `## Elevation & Topography\n`;
  ctx += `- Elevation: ${e.elevation}m above sea level\n`;
  ctx += `- Slope: ${e.slopePercent}% (${e.slopeCategory})\n`;
  ctx += `- Aspect: ${e.aspectDirection} (${e.aspectDegrees}°)\n`;
  return ctx;
}

export function formatKoppenContext(siteData) {
  const k = siteData?.koppen;
  if (!k) return '';
  return `## Köppen Climate Zone\n- Code: ${k.code}\n- Description: ${k.description}\n`;
}

export function formatSiteDataForPrompt(siteData) {
  if (!siteData) return 'Site data: not available.';
  return [
    formatKoppenContext(siteData),
    formatElevationContext(siteData),
    formatClimateContext(siteData),
    formatSoilContext(siteData)
  ].filter(Boolean).join('\n');
}

// ─── System Prompt (shared base) ────────────────────────────────────

function buildSystemPrompt() {
  return `You are an expert permaculture designer creating design summaries. You follow the Scale of Permanence framework (Yeomans/Holmgren) and the 12 Permaculture Principles.

CRITICAL RULES:
1. Every recommendation MUST tie to a specific site observation. Never give generic advice.
2. Be DEFINITIVE, not hedging. Write "Plant Malus domestica 'Bramley' in the orchard zone" NOT "Consider planting apple trees."
3. Name SPECIFIC plant species and cultivars appropriate to the Köppen climate zone.
4. Name SPECIFIC animal breeds appropriate to the climate and property size.
5. QUANTIFY where possible (areas in m², counts, expected yields in kg).
6. Use metric units throughout (m, m², ha, mm, °C, L, kg).
7. Format output as Markdown with clear headings (##, ###), bullet points, and tables. Do NOT use strikethrough (~~text~~) anywhere. Bold (**text**) and italics (*text*) only.
8. Focus on resilience in three pillars: FOOD, ENERGY, and WATER.
9. When referencing climate data, cite specific values (e.g., "July receives only 8mm of rain").

${DOMAIN_KNOWLEDGE}`;
}

// ─── Free Tier Report Prompt ────────────────────────────────────────

export function buildFreeReportPrompt(siteData, location, description) {
  const system = buildSystemPrompt() + `\n\nKeep the total output to approximately 800-1000 words — this is a concise design summary.`;

  const user = `Generate a permaculture design summary for this property.

## Location
${location.displayName || 'Unknown location'}
Coordinates: ${location.lat}, ${location.lng}

## Owner's Description
${description}

## Site Data (auto-fetched)
${formatSiteDataForPrompt(siteData)}

---

Generate the report with EXACTLY these sections:

### Site Overview
Brief description of the property location, climate zone, terrain, and soil (3-4 sentences).
Mention the Köppen zone, annual rainfall, temperature range, and frost risk.

### Design Elements
Describe key design elements that suit this land and the owner's goals. Reference zone placement rationale. (~150 words)

### Plant List
Table format: | Plant | Location | Function | Notes |
Include trees, shrubs, groundcovers, herbs, and vegetables appropriate to this climate. Minimum 12 specific species with cultivar names where relevant.

### Animals
Table format: | Animal | Location | Role | Management Notes |
Climate-appropriate animals suited to the described property.

### Water Management
How to handle water on this site: catchment, storage, distribution, drought strategy. Tie to rainfall data.

### Implementation Timeline
3-phase timeline: Foundation (months 1-6), Expansion (months 7-18), Maturation (year 2-5+). Specific actions per phase.

### Resilience Focus: Food, Energy & Water
How this design achieves resilience in each pillar:
- **Food**: diversity, year-round production, storage
- **Energy**: passive solar, biomass, wind shelter
- **Water**: catchment, storage, grey water, drought resilience`;

  return { system, user };
}

// ─── Paid Tier Report Prompt (with sketch analysis) ─────────────────

export function buildPaidReportPrompt(sketchAnalysis, siteData, location, description) {
  const system = buildSystemPrompt() + `\n\nThis is a PREMIUM report. Be thorough and detailed. Keep the total output to approximately 1200-1500 words.`;

  const user = `Generate a detailed permaculture design report for this property. The owner has provided a hand-drawn sketch of their vision.

## Location
${location.displayName || 'Unknown location'}
Coordinates: ${location.lat}, ${location.lng}

## Owner's Description
${description}

## Sketch Analysis (from the owner's hand-drawn design)
${sketchAnalysis}

## Site Data (auto-fetched)
${formatSiteDataForPrompt(siteData)}

---

Generate the report with EXACTLY these sections:

### Site Overview
Detailed description of the property location, climate zone, terrain, and soil (4-5 sentences).
Mention the Köppen zone, annual rainfall, temperature range, frost risk, and how they influence the design.

### Design Elements
Describe the key design elements visible in the sketch and how they work together as an integrated permaculture system. Reference zone placement rationale and spatial relationships from the sketch. (~200 words)

### Plant List
Table format: | Plant | Location | Function | Notes |
Include trees, shrubs, groundcovers, herbs, and vegetables appropriate to this climate. Minimum 15 specific species with cultivar names. Reference sketch positions.

### Animals
Table format: | Animal | Location | Role | Management Notes |
Based on what the sketch shows plus climate-appropriate additions.

### Structures
Describe each structure's purpose, orientation recommendations, and integration with the overall design (passive solar, water catchment, etc.). Reference sketch layout.

### Water Management
Detailed water strategy: catchment area calculation, storage recommendations, distribution, grey water, drought resilience. Cite rainfall data.

### Implementation Timeline
3-phase timeline with specific actions, seasonal timing, and dependencies between phases.

### Things to Consider
5-7 bullet points: frost pockets, wind exposure, water challenges, soil amendments, seasonal timing, regulatory considerations, etc.

### Resilience Focus: Food, Energy & Water
How this design achieves resilience in each pillar:
- **Food**: diversity, year-round production, storage, caloric self-sufficiency
- **Energy**: passive solar, biomass, wind shelter, thermal mass
- **Water**: catchment, storage, grey water, drought resilience, water budget`;

  return { system, user };
}
