# SCALE_OF_PERMANENCE.md
> Load when working on: intake wizard flow, site analysis ordering, report structure, AI prompt context assembly.

---

## What Is the Scale of Permanence?

The Scale of Permanence (developed by P.A. Yeomans, expanded in permaculture practice) ranks site factors by how difficult and costly they are to change. Designers must understand and work with the most permanent factors before addressing the most flexible ones.

**The rule:** Design decisions about more changeable factors must be constrained by and compatible with more permanent factors.

---

## The 10 Layers (App Intake Order)

### Layer 1 — Climate
**Permanence: Virtually unchangeable**
- Collect: Climate zone (Köppen classification), average annual rainfall (mm), temperature range (min/max), frost dates, prevailing wind direction and speed, humidity, drought frequency
- AI analysis focus: Identify climate constraints, opportunities for passive systems, climate-appropriate species
- Data sources to suggest: climate.gov, WorldClim, local met office

### Layer 2 — Landform (Topography)
**Permanence: Extremely difficult to change**
- Collect: Overall slope gradient (%), aspect (N/S/E/W facing), elevation above sea level, presence of ridgelines/valleys, geological substrate
- AI analysis focus: Water harvesting potential, frost risk (cold air drainage), erosion vulnerability, structural foundations
- Map tool: Elevation overlay from Mapbox terrain tiles

### Layer 3 — Water
**Permanence: Very difficult to change (natural hydrology)**
- Collect: Rainfall pattern (seasonal distribution), existing water bodies, streams/rivers, groundwater depth, flood risk zones, catchment area size
- AI analysis focus: Yeomans keyline design opportunity, pond placement, swale design, greywater reuse potential
- Key calculation: Roof catchment yield = roof area (m²) × annual rainfall (mm) × 0.8 efficiency

### Layer 4 — Access & Circulation
**Permanence: Difficult but possible to change**
- Collect: Existing roads and paths, vehicle access points, natural movement corridors (desire paths), proximity to neighbors/services
- AI analysis focus: Minimize energy expenditure in daily patterns, access to each zone appropriate to visit frequency

### Layer 5 — Vegetation
**Permanence: Moderately permanent (established trees), easily changed (herbaceous)**
- Collect: Existing trees (species, age, health), hedgerows, invasive species, successional stage
- AI analysis focus: What to retain (windbreaks, canopy, wildlife habitat), what to remove (invasives), what fills gaps

### Layer 6 — Microclimate
**Permanence: Moderate — can be influenced by design**
- Collect: Frost pocket locations, sheltered warm spots, exposed ridges, shadow-casting structures
- AI analysis focus: Zone 1 siting, greenhouse placement, sensitive plant placement

### Layer 7 — Soil
**Permanence: Can be changed over years with management**
- Collect: Soil type (loam/clay/sandy/silt), pH, organic matter %, compaction, drainage rate, previous land use history
- AI analysis focus: Amendment plan, soil-building sequences, crop rotation, biochar/compost application

### Layer 8 — Aesthetics & Spirit of Place
**Permanence: Subjective but influential on motivation**
- Collect: Client's emotional response to the land, cultural/spiritual significance, visual focal points, favorite views, neighboring landscape character
- AI analysis focus: Design elements that deepen relationship with place, meaningful gathering spaces

### Layer 9 — Structures & Infrastructure
**Permanence: Moderate — existing structures constrain options**
- Collect: Buildings (size, orientation, condition), fences, utilities (power/water/gas routes), outbuildings, sheds
- AI analysis focus: Passive solar retrofitting, grey water harvesting from existing buildings, integration of structures into design

### Layer 10 — Zones of Use
**Permanence: Least permanent — defined by human behavior**
- Collect: Client's daily routine, frequency of visits to different areas, physical abilities/limitations, time available for maintenance
- AI analysis focus: Zone mapping aligned with real human patterns, not just theory

---

## Intake Wizard Page Map

```
Page 1  — Project & Client Details
Page 2  — Layer 1: Climate
Page 3  — Layer 2: Landform (+ satellite map interaction)
Page 4  — Layer 3: Water
Page 5  — Layer 4: Access & Circulation (+ map path drawing)
Page 6  — Layer 5: Vegetation
Page 7  — Layer 6: Microclimate
Page 8  — Layer 7: Soil (+ option to upload soil test PDF)
Page 9  — Layer 8: Aesthetics & Spirit
Page 10 — Layer 9: Structures (+ upload site photos)
Page 11 — Layer 10: Zones of Use (+ zone drawing on map)
Page 12 — Review & Generate Analysis
```

---

## AI Analysis Prompt Context Assembly

When generating the site analysis, pass context in this order to Claude:

```typescript
const analysisContext = {
  layer1_climate: project.siteData.climate,
  layer2_landform: project.siteData.landform,
  layer3_water: project.siteData.water,
  // ... all 10 layers
  clientGoals: project.clientGoals,
  propertySize: project.propertySize,
  timelineYears: project.timelineYears,
  budget: project.budget,
}
```

The AI must always interpret each layer in the context of the layers above it. E.g., soil analysis must reference the topography (Layer 2) and water patterns (Layer 3) already identified.
