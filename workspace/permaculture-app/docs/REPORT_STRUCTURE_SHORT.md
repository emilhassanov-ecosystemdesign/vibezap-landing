# REPORT_STRUCTURE_SHORT.md
> Load when working on: short report generation, condensed report section prompts, report export layout.

---

## Overview

The **Short Report** (Condensed Permaculture Design Report) is a 15–25 page deliverable for clients who need actionable guidance without the depth of a full design report. It suits early-stage projects, smaller properties, or budget-conscious clients.

**Reference example:** `report_templates/Permaculture Design Report_Short Mahammadi_6ha.docx` — a real project report for a 6ha semi-arid site in Azerbaijan.

**Key principle:** Every section must tie recommendations to specific site observations. No generic advice. If a recommendation could apply to any property, it's too vague.

---

## Section Structure (11 Sections)

### Cover Page
- Project name
- Property location (region, coordinates)
- Property size
- Client name
- Designer name and credentials
- Date of report
- One hero image (current state aerial or eye-level photo)

> **AI gen note:** Not AI-generated. Assembled from project metadata.

---

### Section 1 — Project Overview
**Purpose:** Frame the project scope, client vision, and design approach in 1 page.

**Content:**
- Client's stated goals and vision for the property (verbatim or paraphrased from intake)
- Property summary: size, current state, land use history
- Design approach: brief explanation of permaculture methodology and Scale of Permanence framework
- Timeline horizon (e.g., "This design covers a 5-year development plan in 3 phases")
- Scope limitations and assumptions

**AI prompt context:** `project.name`, `project.clientGoals`, `project.propertySize`, `project.location`, `project.timelineYears`

---

### Section 2 — Site Analysis (Scale of Permanence)
**Purpose:** Present all site observations organized by the Scale of Permanence. This is the foundation — everything downstream flows from here.

**CRITICAL:** Subsections MUST appear in Scale of Permanence order. Each subsection follows: **Observation → Implication → Design Response.**

#### 2.1 Climate
- Köppen classification and description
- Annual temperature range (monthly min/max table or chart)
- Annual precipitation (total + monthly distribution chart)
- Frost dates (first/last, frost-free days)
- Humidity profile
- Drought frequency and severity
- **Design implications:** Climate-appropriate species palette, passive heating/cooling needs, irrigation demand

#### 2.2 Landform & Topography
- Elevation and slope gradient (%)
- Aspect (which direction slopes face)
- Ridgelines, valleys, flat areas
- Geological substrate
- **Design implications:** Water flow direction, erosion risk, building sites, cold air drainage paths

#### 2.3 Water
- Annual rainfall vs. estimated demand (water budget calculation)
- Roof catchment potential: `roof area (m²) × annual rainfall (mm) × 0.8 = liters/year`
- Existing water sources (wells, streams, irrigation, municipal)
- Groundwater depth (if known)
- Flood risk zones
- Surface runoff patterns
- **Design implications:** Storage requirements, swale placement, pond feasibility, greywater reuse potential

#### 2.4 Access & Circulation
- Existing roads, paths, vehicle access points
- Distance to nearest services/town
- Internal movement patterns (desire lines)
- Neighbor boundaries and access easements
- **Design implications:** Main entrance placement, zone layout relative to access, delivery/harvest routes

#### 2.5 Vegetation
- Existing trees (species, approximate age, health, location)
- Hedgerows, windbreaks
- Invasive species present
- Successional stage of current vegetation
- **Design implications:** What to retain (windbreaks, canopy, habitat), what to remove, successional planting strategy

#### 2.6 Microclimate
- Frost pocket locations (low areas where cold air pools)
- Warm sheltered spots (south-facing walls, thermal mass)
- Exposed ridges and wind corridors
- Shadow-casting structures/trees (winter vs. summer)
- **Design implications:** Zone 1 siting, greenhouse/nursery placement, frost-tender species placement

#### 2.7 Soil
- Soil type (texture triangle: sand/silt/clay proportions)
- pH reading
- Organic matter % (if tested)
- Compaction assessment
- Drainage rate (percolation test results)
- Previous land use and chemical history
- **Design implications:** Amendment plan priority, species selection constraints, timeline for soil building

#### 2.8 Structures & Infrastructure
- Existing buildings (size, orientation, condition, use)
- Fencing (type, condition, location)
- Utilities (power, water, gas routes)
- Outbuildings, sheds, ruins
- **Design implications:** Passive solar potential, greywater source locations, structure integration into zones

> **Note:** "Aesthetics & Spirit of Place" (Layer 8 in full Scale of Permanence) and "Zones of Use" (Layer 10) are woven into Section 3 (Design Overview) in the short report to reduce repetition.

**AI prompt context:** All `siteData.*` fields, organized by layer.
**AI instruction:** "For each subsection, state the key observation, its implication for design, and how the design responds. Be specific to this site — never use generic statements."

---

### Section 3 — Sector Analysis
**Purpose:** Map external energy flows across the site as directional forces. Present as a diagram with supporting text.

**Content (each as a directional overlay):**
- **Sun arc:** Summer and winter solstice paths, shadow zones
- **Prevailing wind:** Beneficial breeze vs. damaging wind directions, seasonal variation
- **Water flow:** Surface runoff direction, catchment boundaries
- **Cold air drainage:** Where frost settles (flows downhill like water)
- **Fire risk:** Direction of fire approach (if applicable)
- **Noise/visual pollution:** Roads, neighbors, industrial sources
- **Wildlife corridors:** Animal movement paths through or near property

**Visual:** Sector analysis diagram — arrows overlaid on site plan showing each force.

**AI prompt context:** `siteData.climate` (wind), `siteData.landform` (slope/aspect), `siteData.water` (flow), `siteData.microclimate` (frost/shelter)

---

### Section 4 — Design Overview
**Purpose:** Present the integrated design response to all site analysis findings. This is where observations become interventions.

#### 4.1 Design Philosophy & Client Goals
- How the design reflects the client's vision
- Which permaculture principles are most relevant to this site
- Aesthetic intent and spirit of place

#### 4.2 Zone Plan
- Zone 0–5 layout with descriptions specific to this property
- Zone map (color-coded overlay on satellite/site plan)
- Rationale for zone placement (tied to access, microclimate, water findings)

| Zone | Area (m²) | Primary Function | Key Elements |
|------|-----------|-----------------|--------------|
| 0 | — | Home / base | House, workshop |
| 1 | — | Intensive daily use | Kitchen garden, herbs, compost |
| 2 | — | Regular visits | Orchard, poultry, berries |
| 3 | — | Occasional management | Staple crops, pasture |
| 4 | — | Semi-wild | Food forest, timber, forage |
| 5 | — | Wilderness | Biodiversity reserve |

#### 4.3 Windbreak & Shelter Strategy
- Species selection by position (evergreen for winter wind, deciduous for solar access)
- Multi-functional windbreak design (food, habitat, timber, shelter)
- Spacing and expected establishment timeline

#### 4.4 Water Management Strategy
- Water harvesting hierarchy applied: Slow → Spread → Sink → Store → Use
- Swale locations (tied to contour/keyline from landform analysis)
- Storage: tanks, ponds, cisterns — capacity calculations
- Irrigation approach (drip, swale passive, flood)
- Greywater system design (if applicable)

#### 4.5 Soil Building Strategy
- Amendment plan by zone (compost, biochar, cover crops, mulch)
- Composting system design (thermal, vermicompost, or both)
- Cover crop rotation for soil recovery
- Timeline: expected years to reach target organic matter %

#### 4.6 Key Enterprises & Productive Systems
- Each enterprise as a subsection with:
  - **Description** of the system
  - **Scale** (area, animal numbers, expected yield)
  - **Key ratios** (e.g., 30 chickens = 1m³ compost/month = 2,000m² garden fertility)
  - **Integration** with other elements (outputs of one = inputs of another)
  - **Revenue potential** (if commercial)
- Examples: poultry-centered orchard, market garden, greenhouse, food forest, composting enterprise

#### 4.7 Energy & Infrastructure
- Renewable energy assessment (solar potential, wind feasibility)
- Building orientation recommendations
- Fencing strategy
- Tool and equipment needs

**AI prompt context:** All `siteData.*`, `designPlan.zones`, `designPlan.elements`, `project.clientGoals`, `project.budget`

---

### Section 5 — Plant Palette
**Purpose:** Provide climate-specific plant recommendations organized by guild and layer.

**Content:**
- 2–4 plant guilds appropriate to the climate zone, each showing:
  - Canopy / sub-canopy / shrub / herbaceous / groundcover / root / vine layers
  - Companion relationships and functions (nitrogen fixer, dynamic accumulator, pest confuser, etc.)
  - Expected yield timeline
- Windbreak species list with characteristics
- Cover crop recommendations by season
- Species to avoid (invasives, climate-inappropriate)

**Format:** Table or card layout per guild.

**AI prompt context:** `siteData.climate.koppenZone`, `siteData.soil`, `project.location`, `designPlan.zones`
**AI instruction:** "Select species proven in [Köppen zone]. Name specific cultivars where relevant. For each species, note its function in the guild (N-fixer, dynamic accumulator, groundcover, pollinator, etc.)."

---

### Section 6 — Implementation Plan
**Purpose:** Break the design into achievable phases with seasonal timing, budget, and task lists.

#### Phase 1 — Foundation (Months 1–6)
- Focus: Water infrastructure, access, soil building, Zone 1
- Month-by-month task list with seasonal context
- Materials and estimated costs (itemized)
- Key milestones and success indicators

#### Phase 2 — Establishment (Months 7–18)
- Focus: Perennial planting, Zone 2, livestock introduction, energy systems
- Seasonal planting windows (bare-root trees in dormant season, etc.)
- Materials and estimated costs
- Dependencies on Phase 1 completion

#### Phase 3 — Expansion & Maturation (Year 2–5)
- Focus: Zone 3–4 development, food forest canopy, community systems
- Annual milestones
- Materials and estimated costs
- Long-term enterprise ramp-up

#### Budget Summary Table

| Phase | Timeline | Focus | Estimated Cost |
|-------|----------|-------|---------------|
| 1 | Months 1–6 | Foundation | $X,XXX – $X,XXX |
| 2 | Months 7–18 | Establishment | $X,XXX – $X,XXX |
| 3 | Year 2–5 | Maturation | $X,XXX – $X,XXX |
| **Total** | | | **$XX,XXX – $XX,XXX** |

**AI prompt context:** `designPlan.*`, `project.budget`, `project.timelineYears`, `siteData.climate` (for seasonal timing)
**AI instruction:** "Tie each phase task to a specific design element from Section 4. Include seasonal planting windows based on the climate data. Budget estimates should be ranges, not exact figures."

---

### Section 7 — Maintenance & Monitoring
**Purpose:** Ensure the design is sustained after implementation. Provide clear routines and measurable indicators.

#### Routine Tasks
| Frequency | Tasks |
|-----------|-------|
| Daily | Livestock care, garden watering (dry season), observation walk |
| Weekly | Compost turning, plant health inspection, irrigation check |
| Monthly | Soil moisture monitoring, pest/disease assessment, infrastructure check |
| Seasonal | Pruning, mulching, planting/harvesting, cover crop rotation, energy system service |

#### Monitoring Indicators
- **Soil:** Organic matter % (baseline → target), pH, earthworm count
- **Water:** Storage levels, irrigation usage, rainfall logged
- **Vegetation:** Survival rate of plantings, growth measurements, yield records
- **Biodiversity:** Bird/insect species observed, pollinator activity
- **Financial:** Input costs vs. yields, enterprise revenue tracking

#### Adaptive Management
- Quarterly review process: What's working? What needs adjustment?
- Decision triggers (e.g., "If tree survival rate < 70% after Year 1, reassess species selection and irrigation")
- Feedback loop: observations feed back into design refinements

**AI prompt context:** `designPlan.zones`, `designPlan.elements`, `siteData.soil`, `siteData.climate`

---

### Section 8 — Education & Community
**Purpose:** Extend the project's impact beyond the property boundary.

**Content:**
- Recommended workshops the client can host (composting, food preservation, seed saving)
- Community engagement opportunities (open farm days, school visits, volunteer workdays)
- Knowledge sharing: social media, newsletters, local permaculture networks
- Potential partnerships (local organizations, permaculture guilds, agricultural extension)

**AI prompt context:** `project.clientGoals`, `project.location`

---

### Section 9 — Visualizations
**Purpose:** Show the property's transformation over time through rendered images.

**Content:**
- Current State (photo or rendered baseline)
- Year 1 visualization (aerial + eye-level)
- Year 3 visualization (aerial + eye-level)
- Year 7+ visualization (aerial + eye-level)
- Before/after comparison layout

> See `docs/IMAGE_GENERATION.md` for prompt templates and rendering pipeline.

**AI gen note:** Images are generated separately via the visualization pipeline, not inline with report text generation.

---

### Section 10 — Designer Profile
**Purpose:** Establish credibility and provide contact information.

**Content:**
- Designer name, credentials, certifications (PDC, etc.)
- Brief bio and design philosophy
- Contact information
- Portfolio link or previous project references

> **AI gen note:** Not AI-generated. Pulled from user profile data.

---

### Section 11 — Appendices
**Purpose:** Supporting reference material that doesn't belong in the main body.

#### A. Recommended Reading & Resources
- Key books (Mollison, Holmgren, Hemenway, Lawton, Jacke & Toensmeier)
- Websites and online communities
- Local suppliers (seeds, plants, tools, soil amendments)
- Relevant videos and courses

#### B. Soil Test Results
- Raw test data (if uploaded)
- Interpretation summary
- Amendment recommendations with quantities

#### C. Detailed Budget Breakdown
- Itemized costs per phase
- Materials, labor, equipment categories
- Potential funding sources or cost-saving strategies

#### D. Maintenance Log Templates
- Daily/weekly/monthly/seasonal checklists (printable format)
- Yield tracking sheets
- Observation journal template

#### E. Climate Data Tables
- Monthly temperature, precipitation, wind, humidity, sunshine hours
- Frost date records
- Extreme weather events history

---

## Generation Strategy (for AI pipeline)

### Section Generation Order
Generate sections in this order (each call receives only the context it needs):

1. **Section 2 (Site Analysis)** — generates first, establishes all observations
2. **Section 3 (Sector Analysis)** — builds on site analysis
3. **Section 4 (Design Overview)** — references both analysis sections
4. **Section 5 (Plant Palette)** — needs climate + soil + zone data
5. **Section 6 (Implementation Plan)** — needs full design + budget
6. **Section 7 (Maintenance)** — needs design + implementation
7. **Section 8 (Education)** — needs client goals + location
8. **Section 1 (Project Overview)** — generated LAST, summarizes everything

### Token Budgets (approximate)
| Section | Max Tokens |
|---------|-----------|
| Cover Page | N/A (metadata) |
| Section 1 | 500 |
| Section 2 | 2,000 |
| Section 3 | 800 |
| Section 4 | 2,500 |
| Section 5 | 1,200 |
| Section 6 | 1,500 |
| Section 7 | 800 |
| Section 8 | 500 |
| Section 9 | N/A (images) |
| Section 10 | N/A (user data) |
| Section 11 | 1,000 |

---

## Differences from Long Report

| Aspect | Short Report | Long Report |
|--------|-------------|-------------|
| Length | 15–25 pages | 40–80 pages |
| Plant detail | 2–4 guilds, summary tables | Full plant database with individual species profiles |
| Budget | Ranges by phase | Itemized line items with supplier quotes |
| Implementation | 3 phases, task lists | Gantt chart, seasonal calendar, role assignments |
| Appendices | 5 appendices (A–E) | 11 appendices (A–K) |
| Visualizations | 4–6 images | 8+ images with zone-by-zone breakdowns |
| Monitoring | Task table + indicators | Full monitoring framework with data collection templates |

---

## Export Formatting Notes

- **Word (.docx):** Use branded template with cover page, headers/footers, page numbers, table of contents
- **PDF:** Generated from Word template via puppeteer or pdfkit
- **Brand colors:** Dark green `#2D5016` for headings, earth tone `#8B6914` for accents, `#C4956A` for highlights
- **Typography:** Clean serif for headings (e.g., Playfair Display), sans-serif for body (e.g., Inter)
- **Charts:** Embed as images generated by Recharts (temperature, precipitation, sunshine hours)
- **Maps/diagrams:** Embed zone map and sector diagram as images from the map component
