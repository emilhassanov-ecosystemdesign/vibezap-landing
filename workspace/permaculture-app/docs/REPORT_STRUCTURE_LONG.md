# REPORT_STRUCTURE_LONG.md
> Load when working on: long report generation, full report section prompts, comprehensive design deliverables.

---

## Overview

The **Long Report** (Full Permaculture Design Report) is a 40–80 page deliverable for comprehensive design projects. It is the premium output — equivalent to what a professional permaculture consultancy would deliver for a full-site design engagement.

**Audience:** Clients investing significantly in property transformation, grant applications requiring detailed plans, projects with multiple stakeholders, properties over 2 hectares, or designs involving livestock, commercial enterprises, or community elements.

**Key principle:** The long report must function as both a design document AND a standalone implementation manual. A competent landscaper or farmer should be able to execute the design from this document alone, without further designer input.

**Relationship to Short Report:** The long report includes everything in the short report but expands each section with deeper analysis, more detailed specifications, individual species profiles, itemized budgets, role assignments, risk analysis, and 6 additional appendices.

---

## Document Structure (10 Chapters + 11 Appendices)

```
Front Matter
  - Cover Page
  - Table of Contents
  - List of Figures & Tables
  - Acknowledgements (optional)

Chapter 1  — Introduction
Chapter 2  — Site Assessment (Scale of Permanence — all 10 layers)
Chapter 3  — Sector Analysis & Overlays
Chapter 4  — Design Framework (Zones, Goals, Element Placement)
Chapter 5  — Design Details (Water, Soil, Planting, Energy, Animals, Waste)
Chapter 6  — Plant Palette & Guild Design
Chapter 7  — Implementation Plan (Phases, Gantt, Budget, Roles, Risk)
Chapter 8  — Maintenance, Monitoring & Adaptive Management
Chapter 9  — Education, Community & Knowledge Transfer
Chapter 10 — Designer Profile & Methodology

Appendices A–K
```

---

## Front Matter

### Cover Page
- Project name (prominent, branded)
- Subtitle: "Full Permaculture Design Report"
- Property location (region, country, coordinates)
- Property size (hectares/acres)
- Client name
- Designer name, credentials (PDC, Diploma, etc.)
- Date of report
- Version number (e.g., "v1.0 — Initial Design")
- Hero image: current-state aerial photo or rendered visualization of mature design
- Designer/consultancy logo

> **AI gen note:** Not AI-generated. Assembled from project metadata + uploaded images.

### Table of Contents
- Auto-generated from chapter headings and subheadings
- Include page numbers for all chapters, subsections, and appendices

### List of Figures & Tables
- Numbered list of all maps, diagrams, charts, photos, and tables with page references
- Essential for a professional document of this length

### Acknowledgements (optional)
- Client acknowledgement
- Land acknowledgement (indigenous peoples, if appropriate to region)
- Contributing experts (soil testers, surveyors, etc.)

---

## Chapter 1 — Introduction (3–5 pages)

### 1.1 Project Overview
- Client's stated goals and vision (verbatim quotes from intake where powerful)
- Property summary: size, current state, land use history, ownership history
- Geographic and cultural context
- How this project came about

### 1.2 Design Brief
- Specific objectives agreed between client and designer
- Constraints: budget range, timeline, physical limitations, legal restrictions
- Priorities ranked by client (food production, aesthetics, revenue, education, biodiversity, etc.)
- What is explicitly out of scope

### 1.3 Permaculture Design Methodology
- Brief explanation of permaculture ethics (Earth Care, People Care, Fair Share)
- The 12 Principles (Holmgren) — listed with 1-sentence explanation of each
- Scale of Permanence framework — why site analysis follows this order
- How this report is structured to reflect the design process: Observe → Analyze → Design → Plan → Implement → Monitor

### 1.4 Site Analysis Summary
- 1-page executive summary of key findings from Chapter 2
- Top 5 opportunities identified
- Top 5 constraints identified
- Generated LAST (after Chapter 2 is complete) as a synthesis

**AI prompt context:** `project.*`, `project.clientGoals`, `project.budget`, `project.timelineYears`
**Token budget:** 1,500

---

## Chapter 2 — Site Assessment (10–15 pages)

**Purpose:** The most critical chapter. Every design decision downstream is justified by observations recorded here. This follows the full 10-layer Scale of Permanence — no layers omitted.

**CRITICAL:** Each layer MUST follow the structure:
1. **Data** — What was observed/measured
2. **Analysis** — What it means for this site
3. **Opportunities** — What the site enables
4. **Constraints** — What the site limits
5. **Design Response** — How the design addresses this layer

### 2.1 Climate (Layer 1)
**Permanence: Virtually unchangeable**

#### 2.1.1 Köppen Classification & Description
- Full classification code and plain-language description
- Comparison to well-known reference climates for context

#### 2.1.2 Temperature Profile
- Monthly average min/max table
- Monthly average mean chart (embedded Recharts image)
- Extreme temperature records (hottest day, coldest night in last 20 years)
- Growing degree days (base 10°C)
- Frost-free season length

#### 2.1.3 Precipitation Profile
- Annual total and monthly distribution
- Monthly precipitation chart (embedded image)
- Rainfall intensity patterns (gentle vs. heavy events)
- Snow: frequency, average depth, contribution to soil moisture
- Drought: frequency, severity, longest recorded dry spell

#### 2.1.4 Humidity & Evapotranspiration
- Monthly average relative humidity
- Estimated potential evapotranspiration (PET) vs. precipitation — the moisture deficit/surplus by month
- Implications for irrigation demand

#### 2.1.5 Wind Profile
- Prevailing direction by season
- Average speed and gust maximums
- Named/notable winds (if any)
- Monthly wind speed chart

#### 2.1.6 Sunshine Hours
- Monthly sunshine hours table/chart
- Solar radiation estimates (kWh/m²/day by month)
- Implications for solar energy and growing season

#### 2.1.7 Climate Design Implications
- Climate-appropriate species palette (broad categories)
- Passive heating/cooling strategy
- Irrigation demand estimate: PET minus rainfall = deficit to cover
- Season extension opportunities (greenhouse, cold frames, thermal mass)
- Climate change projections for this region (next 20–30 years if data available)

**AI prompt context:** `siteData.climate.*`
**AI instruction:** "Present all climate data with specific numbers. Always calculate the moisture deficit (PET - rainfall) by month. End with a clear statement of which months are the critical stress period for plants and how the design must respond."
**Token budget:** 3,000

---

### 2.2 Landform & Topography (Layer 2)
**Permanence: Extremely difficult to change**

#### 2.2.1 Elevation & Slope
- Elevation range across property (m above sea level)
- Slope gradient (%) for each major area
- Slope map or contour overlay on satellite image

#### 2.2.2 Aspect
- Predominant slope facing direction
- Variation across property (if multiple aspects)
- Solar exposure implications by aspect

#### 2.2.3 Geological Features
- Ridgelines, valleys, saddle points, flat areas
- Rock outcrops, geological substrate
- Erosion evidence (rills, gullies, exposed subsoil)

#### 2.2.4 Landform Design Implications
- Keyline analysis: key points, key lines, and cultivation direction
- Water flow paths and harvesting opportunities
- Cold air drainage paths (frost risk mapping)
- Optimal building sites (stable ground, good drainage, solar access)
- Erosion risk zones requiring immediate stabilization
- Earth-moving requirements (if any — swales, ponds, terracing)

**AI prompt context:** `siteData.landform.*`, `siteData.climate.precipitation` (for erosion risk)
**Token budget:** 2,000

---

### 2.3 Water (Layer 3)
**Permanence: Very difficult to change (natural hydrology)**

#### 2.3.1 Water Sources Inventory
- Existing: wells, springs, streams, rivers, ponds, municipal/irrigation connections
- Quality assessment of each source (if known)
- Legal rights and restrictions on water use

#### 2.3.2 Rainfall Analysis
- Annual total (from 2.1 climate data — cross-reference, don't repeat)
- Seasonal distribution and reliability
- Maximum single-event rainfall (for flood/overflow design)

#### 2.3.3 Water Budget Calculation
Full water budget table:

| Category | Annual Volume (liters) | Calculation Method |
|----------|----------------------|-------------------|
| Rainfall on property | property area (m²) × rainfall (mm) | Direct |
| Roof catchment (potential) | roof area × rainfall × 0.8 | Efficiency-adjusted |
| Irrigation demand (est.) | planted area × PET deficit × crop factor | By zone |
| Livestock demand | animal count × daily need × 365 | By species |
| Domestic demand | persons × daily use × 365 | Standard rates |
| **Net surplus/deficit** | **Supply minus demand** | |

#### 2.3.4 Groundwater
- Depth to water table (if known)
- Seasonal variation
- Well feasibility assessment

#### 2.3.5 Surface Hydrology
- Natural drainage patterns on property
- Catchment boundaries
- Flood risk zones and return periods
- Existing drainage infrastructure

#### 2.3.6 Water Design Implications
- Water harvesting hierarchy applied: Slow → Spread → Sink → Store → Use
- Swale placement recommendations (tied to keyline from 2.2)
- Pond feasibility: location, size, depth, seal method
- Storage requirements: volume needed to bridge dry season
- Greywater reuse potential and regulations
- Rainwater harvesting system sizing

**AI prompt context:** `siteData.water.*`, `siteData.landform.*`, `siteData.climate.*`
**AI instruction:** "Always calculate the water budget numerically. Identify the critical deficit months. Size storage to bridge the gap. Every recommendation must reference specific topographic features from 2.2."
**Token budget:** 2,500

---

### 2.4 Access & Circulation (Layer 4)
**Permanence: Difficult but possible to change**

#### 2.4.1 External Access
- Road connections, quality, seasonal accessibility
- Distance to nearest town/services
- Public transport availability
- Legal access rights and easements

#### 2.4.2 Internal Circulation
- Existing paths, tracks, driveways
- Vehicle-accessible areas vs. foot-only
- Natural desire lines observed
- Current movement patterns (where does the client walk daily?)

#### 2.4.3 Neighbor & Boundary Context
- Adjacent land uses
- Shared boundaries and relationships
- Visual and noise exposure from neighbors
- Opportunity for collaboration or conflict potential

#### 2.4.4 Access Design Implications
- Main entrance and driveway placement/improvement
- Zone layout driven by access frequency (Zone 1 nearest to daily path)
- Delivery and harvest routes for commercial operations
- Emergency vehicle access
- Path materials and drainage (functional + aesthetic)

**AI prompt context:** `siteData.access.*`, `siteData.landform.*`
**Token budget:** 1,500

---

### 2.5 Vegetation (Layer 5)
**Permanence: Moderately permanent (established trees), easily changed (herbaceous)**

#### 2.5.1 Existing Tree Inventory
- Species, estimated age, health assessment, canopy spread, location
- Table format with each significant tree/tree group

| ID | Species | Est. Age | Health | Canopy (m) | Notes |
|----|---------|----------|--------|-----------|-------|
| T1 | — | — | — | — | — |

#### 2.5.2 Ground Vegetation & Cover
- Dominant species and ground cover percentage
- Successional stage (bare → pioneer → building → climax)
- Seasonal variation in cover

#### 2.5.3 Invasive Species
- Species identified, extent, and severity
- Removal priority and methods
- Replacement planting strategy

#### 2.5.4 Ecological Value
- Existing wildlife habitat features
- Pollinator resources
- Windbreak function of existing vegetation
- Heritage or protected species

#### 2.5.5 Vegetation Design Implications
- What to retain (mark on site plan): windbreaks, canopy trees, habitat
- What to remove: invasives, hazardous, poorly placed
- Successional planting strategy to fill gaps
- Existing vegetation as indicator species (what they tell us about soil/moisture)

**AI prompt context:** `siteData.vegetation.*`, `siteData.climate.*`, `siteData.soil.*`
**Token budget:** 2,000

---

### 2.6 Microclimate (Layer 6)
**Permanence: Moderate — can be influenced by design**

#### 2.6.1 Frost Pockets & Cold Air Drainage
- Low areas where cold air pools
- Observed frost patterns (client knowledge)
- Cold air flow paths on slope

#### 2.6.2 Warm Microclimates
- South-facing walls and slopes (thermal mass)
- Sheltered pockets out of prevailing wind
- Heat-reflecting or heat-absorbing surfaces

#### 2.6.3 Wind Exposure Zones
- Exposed ridges and open areas
- Wind tunnel effects between structures
- Seasonal variation in exposure

#### 2.6.4 Shadow Analysis
- Winter shadow casting by structures and trees (longest shadows)
- Summer shadow patterns
- Shadow map overlay (winter solstice)

#### 2.6.5 Microclimate Design Implications
- Zone 1 siting: sheltered, warm, frost-free location
- Greenhouse/nursery optimal placement
- Frost-tender species placement strategy
- Microclimate modification: windbreaks to create new sheltered zones, thermal mass, water bodies as temperature moderators
- Where NOT to plant sensitive species

**AI prompt context:** `siteData.microclimate.*`, `siteData.landform.*`, `siteData.climate.*`, `siteData.vegetation.*`
**Token budget:** 1,500

---

### 2.7 Soil (Layer 7)
**Permanence: Can be changed over years with management**

#### 2.7.1 Soil Type & Texture
- Texture classification (sand/silt/clay percentages, or field assessment)
- Texture triangle position
- Variation across property (if multiple soil types)

#### 2.7.2 Soil Chemistry
- pH by area (test results or field test)
- Major nutrients: N, P, K levels
- Micronutrients and trace elements (if tested)
- Cation Exchange Capacity (CEC) — if lab-tested

#### 2.7.3 Soil Biology
- Organic matter percentage
- Earthworm count per sample
- Fungal/bacterial ratio indicators (visual assessment or lab)
- Evidence of biological activity (mycorrhizal networks, decomposition rate)

#### 2.7.4 Soil Structure & Drainage
- Compaction assessment (penetrometer or fork test)
- Drainage rate (percolation test results: inches/hour)
- Water table depth and seasonal variation
- Evidence of waterlogging or hardpan

#### 2.7.5 Land Use History
- Previous crops, treatments, chemicals
- Years since last chemical application
- Contamination risk assessment
- Soil degradation indicators (erosion, salinization, compaction)

#### 2.7.6 Soil Design Implications
- Amendment plan priority by zone (what needs most work first)
- Compost requirements: volume, source, application rate
- Cover crop prescription by season and zone
- Biochar application (if appropriate for soil type)
- Mulch strategy: type, depth, timing
- Timeline to reach target organic matter %
- Species selection constraints (pH tolerance, drainage needs)
- Soil building as a phased process — expected milestones Year 1, 3, 5

**AI prompt context:** `siteData.soil.*`, `siteData.landform.*` (erosion), `siteData.water.*` (drainage), `siteData.climate.*` (decomposition rates)
**AI instruction:** "Always connect soil analysis to the climate and water data. Hot dry climates decompose mulch faster. Heavy rainfall leaches nutrients. State specific amendment quantities per hectare and the expected timeline to see results."
**Token budget:** 2,500

---

### 2.8 Aesthetics & Spirit of Place (Layer 8)
**Permanence: Subjective but influential on motivation**

#### 2.8.1 Client's Relationship with the Land
- Emotional response and personal meaning
- Cultural or spiritual significance
- Memories and associations
- What drew them to this property

#### 2.8.2 Visual Character
- Landscape character: open, enclosed, dramatic, gentle
- Key views: what to frame, protect, or screen
- Neighboring landscape context
- Visual focal points on property

#### 2.8.3 Sensory Experience
- Sounds: birdsong, wind, water, road noise
- Smells: soil, plants, neighboring activities
- Light quality by season and time of day
- Tactile qualities: soil underfoot, ground surface

#### 2.8.4 Aesthetic Design Implications
- Design elements that strengthen emotional connection
- Gathering spaces, contemplation spots, threshold experiences
- Views to preserve and create
- Screening unwanted views or sounds
- Honoring cultural or historical elements
- Beauty as a design principle — not decoration, but functional beauty

**AI prompt context:** `siteData.aesthetics.*`, `project.clientGoals`
**AI instruction:** "This section must be warm and personal. Reflect the client's own words where possible. Avoid generic landscape design language — ground every recommendation in what the client has expressed about their relationship with this land."
**Token budget:** 1,200

---

### 2.9 Structures & Infrastructure (Layer 9)
**Permanence: Moderate — existing structures constrain options**

#### 2.9.1 Building Inventory
| Structure | Size (m²) | Orientation | Condition | Current Use | Roof Area (m²) |
|-----------|----------|-------------|-----------|-------------|----------------|
| — | — | — | — | — | — |

#### 2.9.2 Fencing & Boundaries
- Types, materials, condition, location
- Livestock-proof assessment
- Visual impact

#### 2.9.3 Utilities & Services
- Power: grid connection, capacity, meter location
- Water: mains connection, pipe routes, pressure
- Gas: supply route (if any)
- Telecommunications: coverage, cable routes
- Septic/sewage: system type, location, capacity

#### 2.9.4 Outbuildings & Hardscape
- Sheds, barns, greenhouses, ruins
- Paved areas, driveways, retaining walls
- Salvageable materials on site

#### 2.9.5 Structures Design Implications
- Passive solar assessment: orientation, window placement, thermal mass
- Roof catchment calculation per building (area × rainfall × 0.8)
- Greywater source locations and volumes
- New building siting recommendations
- Infrastructure integration into zone plan
- Fencing upgrade plan (phased with livestock introduction)
- Utility extensions needed for design elements

**AI prompt context:** `siteData.structures.*`, `siteData.water.*` (for catchment), `siteData.climate.*` (for passive solar)
**Token budget:** 1,500

---

### 2.10 Zones of Use (Layer 10)
**Permanence: Least permanent — defined by human behavior**

#### 2.10.1 Client Profile
- Number of people on site daily
- Physical abilities and limitations
- Time available for land management (hours/week)
- Existing skills and knowledge
- Animals/pets

#### 2.10.2 Daily Patterns
- Morning routine and movement (door-to-door)
- Work patterns (on-site or commuting)
- Seasonal variation in presence and activity
- Weekend vs. weekday patterns

#### 2.10.3 Current Zone Usage
- Where the client spends most time outdoors
- Areas visited daily / weekly / rarely / never
- Existing functional zones (even if informal)

#### 2.10.4 Zone of Use Design Implications
- Zone 0–5 boundaries derived from actual human patterns, not theory
- Zone 1 placement validated against daily movement
- Accessibility requirements
- Maintenance time budget per zone
- Scaling plan: if client's time increases/decreases, which zones expand/contract

**AI prompt context:** `siteData.zonesOfUse.*`, `project.clientGoals`
**Token budget:** 1,200

---

## Chapter 3 — Sector Analysis & Overlays (3–5 pages)

**Purpose:** Map all external energy flows as directional forces on the site plan. This chapter produces the sector analysis diagram — one of the most important visual outputs.

### 3.1 Sun Sector
- Summer solstice arc (highest, longest day)
- Winter solstice arc (lowest, shortest day)
- Equinox path
- Shadow zones by season (from structures, trees, landforms)
- Solar window for key areas (Zone 1, greenhouse site, solar panel site)

### 3.2 Wind Sector
- Prevailing wind direction by season
- Damaging wind direction and frequency
- Beneficial breeze direction (summer cooling)
- Wind speed zones across property (exposed vs. sheltered)
- Existing and needed windbreak positions

### 3.3 Water Flow Sector
- Surface runoff direction (from topography)
- Catchment boundaries
- Where water concentrates (valleys, low points)
- Where water is scarce (ridges, exposed slopes)
- Off-property water entering the site
- Flood approach direction

### 3.4 Cold Air Drainage
- Frost flow path (cold air drains like water — downhill)
- Frost pool locations
- Frost dam locations (walls, hedges, buildings that trap cold air)
- Frost-free zones identified

### 3.5 Fire Sector (if applicable)
- Direction of fire approach (dominant fire weather wind direction)
- Fuel load assessment (dry vegetation, structures)
- Fire break locations (existing and needed)
- Defendable space around structures
- Evacuation routes

### 3.6 Wildlife & Ecology Sector
- Wildlife corridors through or adjacent to property
- Nesting and breeding areas
- Water sources for wildlife
- Species observed (mammals, birds, reptiles, insects)
- Protected or significant species

### 3.7 Human & Noise Sector
- Road noise direction and intensity
- Neighbor activity and visual exposure
- Light pollution sources
- Privacy zones needed
- Screening and buffering recommendations

### 3.8 Integrated Sector Diagram
- Composite diagram with all sectors overlaid on site plan
- Color-coded arrows by sector type
- Legend and compass orientation
- Key design response notes on diagram

**AI prompt context:** All `siteData.*` fields relevant to sectors
**AI instruction:** "For each sector, provide specific directional data (compass bearings where possible). Always connect the sector analysis back to design responses — each energy flow is either harvested, deflected, or managed."
**Token budget:** 2,500

---

## Chapter 4 — Design Framework (8–12 pages)

**Purpose:** Present the integrated design response. This is where all observations from Chapters 2–3 converge into a coherent spatial plan.

### 4.1 Design Philosophy
- Which permaculture principles are most relevant to this site and client (select top 5, explain why)
- Ethical framework: how Earth Care, People Care, Fair Share manifest in this specific design
- Aesthetic vision and spirit of place (drawn from 2.8)
- Overall design metaphor or narrative (optional but powerful — e.g., "an oasis in the semi-arid landscape" or "rebuilding the forest that was here")

### 4.2 Client Goals & Design Priorities
- Ranked list of client objectives
- How each goal translates to specific design elements
- Trade-offs acknowledged (e.g., "maximum food production conflicts with low maintenance; design prioritizes food production in Zones 1–2, low-maintenance systems in Zones 3–4")

### 4.3 Zone Plan
- Full zone map (color-coded overlay on satellite/site plan)
- Zone rationale: why each zone boundary is where it is (tied to access, microclimate, water, soil findings)

#### Zone 0 — Home & Core
- Building function and layout
- Indoor-outdoor connection points
- Kitchen-to-garden pathway

#### Zone 1 — Intensive Daily Use
- Exact location and boundaries with rationale
- Area: m²
- Elements: kitchen garden, herb spiral, compost, seedling nursery, cold frame
- Design detail: bed layout, path width, irrigation method
- Expected yields (kg/year)

#### Zone 2 — Regular Management
- Location and boundaries
- Area: m²
- Elements: orchard, berry patch, small livestock, larger garden beds
- Stacking functions: orchard floor planted as guild, poultry integrated
- Expected yields

#### Zone 3 — Broad-Scale Production
- Location and boundaries
- Area: m² or hectares
- Elements: staple crops, pasture, larger livestock, field-scale composting
- Management approach: low-input, broad-scale methods
- Enterprise potential

#### Zone 4 — Semi-Wild
- Location and boundaries
- Area: m² or hectares
- Elements: managed woodland, food forest, coppice, foraging areas, timber
- Minimal intervention strategy
- Long-term canopy plan

#### Zone 5 — Wilderness
- Location and boundaries
- Area: m² or hectares
- Function: biodiversity reserve, observation, spiritual retreat
- Intervention: observation only, no management
- Wildlife habitat value

### 4.4 Element Placement Map
- Master design map showing all key elements placed on property
- Each element tied to its zone
- Element interaction lines (outputs → inputs between elements)
- Legend with element key

### 4.5 Functional Interconnections
- Matrix or diagram showing how elements are integrated
- Outputs of one system become inputs of another
- Example: kitchen scraps → compost → garden beds → kitchen; poultry manure → compost → orchard floor → fruit → kitchen
- Waste streams eliminated through integration

**AI prompt context:** All `siteData.*`, `designPlan.*`, `project.clientGoals`, `project.budget`
**AI instruction:** "Every element placement must be justified by at least one site observation from Chapter 2. Never place an element without explaining why it goes HERE and not elsewhere. Show functional connections between every pair of adjacent elements."
**Token budget:** 4,000

---

## Chapter 5 — Design Details (12–18 pages)

**Purpose:** Deep-dive into each design system. Where Chapter 4 says "what goes where," Chapter 5 says "exactly how it works."

### 5.1 Water System Design

#### 5.1.1 Earthworks
- Swale specifications: length, width, depth, spacing, location on contour
- Keyline cultivation plan (direction, depth, timing)
- Check dams: locations, materials, sizing
- Terracing (if needed): dimensions, retaining method

#### 5.1.2 Water Storage
- Pond design: location, size (m³), depth, seal method (clay/liner), overflow route
- Tank/cistern specifications: material, volume, placement, plumbing
- Dam feasibility (for larger properties)

#### 5.1.3 Irrigation System
- Method by zone (drip, swale passive, flood, sprinkler, hand)
- Pipe layout and sizing
- Pressure requirements and pump specifications (if needed)
- Scheduling: frequency and duration by season
- Automation options

#### 5.1.4 Greywater System
- Source: kitchen, laundry, shower (volumes estimated)
- Treatment: reed bed, banana circle, mulch pit
- Distribution: gravity-fed to Zone 2 trees
- Legal compliance note

#### 5.1.5 Rainwater Harvesting
- Roof catchment per building (table from 2.9 structure data)
- First-flush diverter specifications
- Storage tank sizing and placement
- Filtration for potable use (if applicable)

**AI prompt context:** `siteData.water.*`, `siteData.landform.*`, `siteData.structures.*`, `designPlan.waterFeatures`
**Token budget:** 3,000

---

### 5.2 Soil Management Plan

#### 5.2.1 Zone-by-Zone Amendment Schedule

| Zone | Current State | Target | Year 1 Amendments | Year 2–3 Amendments | Year 5+ Maintenance |
|------|-------------|--------|-------------------|--------------------|--------------------|
| 1 | — | — | — | — | — |
| 2 | — | — | — | — | — |
| 3 | — | — | — | — | — |

#### 5.2.2 Composting System Design
- Thermal compost: bin design (dimensions, materials), turning schedule, expected volume/year
- Vermicompost: bin design, worm species, feeding rate, harvest cycle
- Input sources: kitchen waste, livestock manure, green waste, carbon sources
- Integration with poultry (deep-litter, compost-yard systems)

#### 5.2.3 Cover Crop Plan
- Species by season and zone
- Rotation calendar
- Seeding rates and methods
- Termination timing and method (crimp, chop-and-drop, incorporation)

#### 5.2.4 Mulching Strategy
- Materials by zone (wood chips, straw, leaf litter, living mulch)
- Depth targets
- Application timing
- Source: on-site production vs. imported

#### 5.2.5 Biochar (if applicable)
- Production method (if on-site)
- Charging process (inoculation with compost tea)
- Application rates and target areas

**AI prompt context:** `siteData.soil.*`, `siteData.climate.*`, `designPlan.zones`
**Token budget:** 2,500

---

### 5.3 Planting Design

> Note: Individual species are detailed in Chapter 6 (Plant Palette). This section covers the spatial planting design.

#### 5.3.1 Windbreak & Shelter Belt Design
- Species composition by position (N/S/E/W boundary)
- Planting density and spacing diagrams
- Expected growth rate and establishment timeline
- Multi-functional yields (food, timber, habitat, biomass)
- Cross-section diagram showing height layers

#### 5.3.2 Food Forest Design (per zone)
- Canopy spacing plan (tree centers on map)
- Guild arrangement around each canopy tree
- Understory planting timeline (Year 1 pioneer → Year 3 shrubs → Year 5 climax)
- Cross-section diagram showing all 7 layers at maturity
- Plan-view diagram showing spatial arrangement

#### 5.3.3 Annual Production Areas
- Bed layout: dimensions, orientation, path width
- Crop rotation plan (minimum 4-year rotation)
- Succession planting calendar for continuous harvest
- Season extension structures (cold frame, cloche, row cover)

#### 5.3.4 Orchard Design
- Tree spacing and arrangement (grid, offset, contour-following)
- Rootstock selection rationale
- Pollination groups
- Orchard floor management (guild planting, mowing regime, or livestock)

**AI prompt context:** `designPlan.plantingPlan`, `siteData.climate.*`, `siteData.soil.*`, `designPlan.zones`
**Token budget:** 3,000

---

### 5.4 Energy Systems

#### 5.4.1 Solar Assessment
- Available roof area and orientation
- Estimated annual generation (kWh)
- System sizing recommendation
- Grid-tie vs. off-grid considerations
- Battery storage recommendation

#### 5.4.2 Wind Assessment
- Average wind speed at site
- Feasibility determination (typically viable above 5 m/s average)
- Turbine siting recommendation (if viable)

#### 5.4.3 Passive Energy Design
- Building orientation for passive solar gain
- Thermal mass placement
- Natural ventilation strategy
- Shade design for summer cooling

#### 5.4.4 Biomass & Fuel
- On-site wood fuel potential (coppice, orchard prunings)
- Rocket mass heater or wood stove recommendations
- Biogas potential (if sufficient livestock waste)

**AI prompt context:** `siteData.climate.sunshineHours`, `siteData.climate.wind`, `siteData.structures.*`
**Token budget:** 1,500

---

### 5.5 Animal Systems

#### 5.5.1 Species Selection & Rationale
- Which animals and why (tied to client goals + site capacity)
- Breed recommendations for climate
- Stocking rates per area

#### 5.5.2 Housing & Infrastructure
- Coop/shelter design: size, materials, orientation
- Fencing: type, height, area enclosed
- Water and feed systems

#### 5.5.3 Rotation & Integration
- Rotational grazing plan (paddock layout, rotation frequency)
- Orchard-poultry integration design (tree-range model)
- Market garden-poultry integration (compost-yard model)
- Livestock-crop rotation calendar

#### 5.5.4 Feed Strategy
- On-site feed production (forage crops, orchard drops, food forest produce)
- Supplementary feed requirements and cost
- Goal: percentage of feed produced on-site by Year 3, Year 5

#### 5.5.5 Manure & Waste Management
- Volume estimates per species
- Composting integration
- Direct-to-soil application schedule (if appropriate)

**AI prompt context:** `designPlan.elements` (animal elements), `siteData.climate.*`, `designPlan.zones`
**Token budget:** 2,000

---

### 5.6 Waste & Nutrient Cycling

#### 5.6.1 Waste Stream Audit
- Kitchen waste: volume, destination (compost, chickens, worm farm)
- Garden waste: volume, destination (compost, mulch, chop-and-drop)
- Livestock waste: volume, destination (compost, direct application)
- Greywater: volume, treatment, reuse
- Humanure: feasibility assessment (composting toilet, if applicable)
- Construction/packaging waste: reduction and recycling plan

#### 5.6.2 Nutrient Cycling Diagram
- Visual diagram showing nutrient flow loops on property
- Identify any nutrient imports needed (off-site compost, rock dust, etc.)
- Goal: progressively close loops, reduce off-site inputs year by year

#### 5.6.3 Zero-Waste Target
- Timeline to achieve minimal external waste
- Remaining waste streams that cannot be closed on-site
- "Produce No Waste" principle applied

**AI prompt context:** `designPlan.elements`, `designPlan.zones`, `siteData.soil.*`
**Token budget:** 1,500

---

## Chapter 6 — Plant Palette & Guild Design (5–8 pages)

**Purpose:** Comprehensive plant selection guide with full species profiles, guild compositions, and planting specifications.

### 6.1 Climate-Appropriate Species Database

#### Master Plant List
Table with all recommended species:

| Species | Common Name | Layer | Function | Zone | Yield | Spacing | Notes |
|---------|------------|-------|----------|------|-------|---------|-------|
| — | — | — | — | — | — | — | — |

Functions coded as: N = nitrogen fixer, DA = dynamic accumulator, PC = pest confuser, P = pollinator attractor, GC = groundcover, W = windbreak, F = food, T = timber, M = medicinal

### 6.2 Plant Guild Designs (4–8 guilds)

Each guild presented as a full-page card:

#### Guild Card Template
- **Guild name** (e.g., "Apple Guild — Temperate Food Forest")
- **Central species** and cultivar recommendation
- **Layer diagram** (cross-section illustration showing all 7 layers)
- **Species table:**

| Layer | Species | Function | Spacing from Center | Notes |
|-------|---------|----------|-------------------|-------|
| Canopy | — | — | — | — |
| Sub-canopy | — | — | — | — |
| Shrub | — | — | — | — |
| Herbaceous | — | — | — | — |
| Groundcover | — | — | — | — |
| Root | — | — | — | — |
| Vine | — | — | — | — |

- **Companion benefits:** Which species support which and how
- **Establishment timeline:** What to plant in Year 1, 2, 3
- **Estimated yield at maturity** (kg/year per guild)
- **Maintenance notes:** Annual pruning, mulching, division schedule

### 6.3 Windbreak Species Palette
- Species by position (N/S/E/W) with rationale
- Growth rate, mature height, width
- Multi-functional yields (fruit, timber, fodder, habitat)
- Salt/wind/drought tolerance ratings

### 6.4 Cover Crop Recommendations
| Season | Species | Seeding Rate | Function | Termination |
|--------|---------|-------------|----------|-------------|
| Autumn | — | — | — | — |
| Winter | — | — | — | — |
| Spring | — | — | — | — |
| Summer | — | — | — | — |

### 6.5 Species to Avoid
- Known invasives for this region
- Climate-inappropriate species that may be tempting but will fail
- Allelopathic species that suppress guild partners

**AI prompt context:** `siteData.climate.koppenZone`, `siteData.soil.*`, `project.location`, `designPlan.zones`
**AI instruction:** "Select only species proven in the specific Köppen zone. Include specific cultivar names where they significantly affect performance (e.g., rootstock choice for fruit trees). For each guild, explain the functional relationships between species — why these specific plants together."
**Token budget:** 3,500

---

## Chapter 7 — Implementation Plan (6–10 pages)

**Purpose:** Transform the design into an actionable, phased work plan. This chapter must be executable — a competent landscaper should be able to follow it without consulting the designer.

### 7.1 Phasing Strategy
- Why implementation is phased (manage risk, spread cost, build soil first, learn as you go)
- Phase dependency chain: what must be completed before the next phase begins
- Decision gates between phases (what triggers Phase 2 start?)

### 7.2 Phase 1 — Foundation (Months 1–6)
**Focus:** Water infrastructure, access, soil building, Zone 1

#### Task Schedule

| Month | Week | Task | Zone | Materials | Labor | Est. Cost |
|-------|------|------|------|-----------|-------|-----------|
| 1 | 1–2 | — | — | — | — | — |
| 1 | 3–4 | — | — | — | — | — |
| 2 | 1–2 | — | — | — | — | — |
| ... | ... | — | — | — | — | — |

#### Seasonal Planting Windows
- What must be planted when (bare-root season, seed sowing dates, transplant windows)
- Tied to climate data from 2.1

#### Phase 1 Milestones
- End of Month 3: water infrastructure operational
- End of Month 6: Zone 1 garden beds planted, compost system active, paths established

#### Phase 1 Budget (itemized)

| Item | Quantity | Unit Cost | Total |
|------|----------|----------|-------|
| — | — | — | — |
| **Phase 1 Total** | | | **$X,XXX** |

### 7.3 Phase 2 — Establishment (Months 7–18)
**Focus:** Perennial planting, Zone 2, livestock introduction, energy systems

Same structure as Phase 1: task schedule, seasonal windows, milestones, itemized budget.

### 7.4 Phase 3 — Expansion (Year 2–3)
**Focus:** Zone 3–4 development, food forest canopy, commercial enterprise launch

Same structure with annual rather than monthly granularity.

### 7.5 Phase 4 — Maturation (Year 3–7+)
**Focus:** Food forest canopy closing, full system integration, community engagement

High-level milestones and annual goals. Less task-level detail — by this phase the client is managing adaptively.

### 7.6 Implementation Gantt Chart
- Visual timeline showing all phases, major tasks, and seasonal planting windows
- Highlight critical path items
- Show overlap between phases where appropriate
- Embedded as an image from Recharts or a dedicated Gantt component

### 7.7 Roles & Responsibilities

| Role | Who | Tasks | Time Commitment |
|------|-----|-------|----------------|
| Project lead (client) | — | — | — |
| Designer (ongoing consult) | — | — | — |
| Landscaper / earth mover | — | — | — |
| Plumber (irrigation) | — | — | — |
| Arborist (tree work) | — | — | — |
| Volunteers | — | — | — |

### 7.8 Risk Assessment & Contingency

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Drought in Year 1 (high plant mortality) | — | — | Increase irrigation, prioritize water storage |
| Budget overrun in Phase 1 | — | — | Delay Phase 2 non-essentials |
| Livestock disease | — | — | Quarantine plan, vet relationship |
| Invasive species spread | — | — | Early detection protocol, rapid response |
| Client time availability decreases | — | — | Scale back to Zone 1–2 focus |

### 7.9 Consolidated Budget Summary

| Phase | Timeline | Focus | Materials | Labor | Contingency (15%) | Total |
|-------|----------|-------|-----------|-------|-------------------|-------|
| 1 | Months 1–6 | Foundation | — | — | — | — |
| 2 | Months 7–18 | Establishment | — | — | — | — |
| 3 | Year 2–3 | Expansion | — | — | — | — |
| 4 | Year 3–7+ | Maturation | — | — | — | — |
| **Total** | | | | | | **$XX,XXX** |

**AI prompt context:** `designPlan.*`, `project.budget`, `project.timelineYears`, `siteData.climate.*` (seasonal timing)
**AI instruction:** "Every task must reference a specific design element from Chapters 4–5. Include seasonal planting windows based on climate data — do not schedule bare-root planting in summer. Budget must include 15% contingency. Be specific about materials: not 'mulch' but '15m³ hardwood woodchip mulch, 100mm depth over 150m²'."
**Token budget:** 4,000

---

## Chapter 8 — Maintenance, Monitoring & Adaptive Management (4–6 pages)

**Purpose:** Ensure the design is sustained and improved over time. This chapter turns the client from a builder into a steward.

### 8.1 Maintenance Calendar

#### Daily Tasks
| Task | Zone | Duration | Seasonal Variation |
|------|------|----------|-------------------|
| Observation walk | All | 15 min | Year-round |
| Garden watering | 1 | 20 min | Dry season only |
| Livestock feeding & water | 2 | 30 min | Year-round |
| Harvest check | 1–2 | 15 min | Growing season |

#### Weekly Tasks
| Task | Zone | Duration | Season |
|------|------|----------|--------|
| Compost management | 1 | 30 min | Year-round |
| Plant health inspection | 1–2 | 30 min | Growing season |
| Irrigation system check | All | 20 min | Irrigation season |
| Weed management | 1–2 | 1 hr | Spring–Autumn |

#### Monthly Tasks
| Task | Zone | Duration | Season |
|------|------|----------|--------|
| Soil moisture check (probe) | 1–3 | 30 min | Year-round |
| Pest & disease assessment | 1–3 | 1 hr | Growing season |
| Infrastructure inspection | All | 1 hr | Year-round |
| Record keeping | — | 30 min | Year-round |

#### Seasonal Tasks
| Season | Key Tasks |
|--------|-----------|
| Spring | Pruning, mulching, seed sowing, transplanting, compost application |
| Summer | Irrigation management, harvest, succession planting, pest monitoring |
| Autumn | Harvest, cover crop sowing, soil testing, tree planting (bare-root) |
| Winter | Pruning (dormant), infrastructure repair, planning, tool maintenance |

### 8.2 Monitoring Framework

#### Soil Health Monitoring
| Indicator | Baseline | Year 1 Target | Year 3 Target | Year 5 Target | Method |
|-----------|----------|--------------|--------------|--------------|--------|
| Organic matter % | — | — | — | — | Lab test |
| pH | — | — | — | — | Field kit |
| Earthworm count/m² | — | — | — | — | Dig count |
| Infiltration rate (mm/hr) | — | — | — | — | Perc test |

#### Vegetation Monitoring
| Indicator | Method | Frequency |
|-----------|--------|-----------|
| Tree survival rate | Count | Quarterly (Year 1–2) |
| Growth measurement | Height + canopy | Annually |
| Yield records | Weight at harvest | Per harvest |
| Pest/disease incidence | Visual inspection | Monthly |

#### Water Monitoring
| Indicator | Method | Frequency |
|-----------|--------|-----------|
| Rainfall | Rain gauge | Daily |
| Storage levels | Dipstick/gauge | Weekly |
| Irrigation usage | Meter reading | Weekly |
| Water quality | Visual + smell | Monthly |

#### Biodiversity Monitoring
| Indicator | Method | Frequency |
|-----------|--------|-----------|
| Bird species count | Observation | Monthly |
| Pollinator activity | Timed count | Monthly (spring–autumn) |
| Soil fauna | Dig sample | Annually |
| Plant diversity | Species list | Annually |

#### Financial Monitoring
| Indicator | Method | Frequency |
|-----------|--------|-----------|
| Input costs | Receipt tracking | Monthly |
| Harvest value | Weight × market price | Per harvest |
| Enterprise revenue | Sales records | Monthly |
| Labor hours | Time tracking | Weekly |

### 8.3 Adaptive Management Protocol

#### Quarterly Review Checklist
1. What is thriving? (Identify and amplify)
2. What is struggling? (Diagnose root cause using Scale of Permanence — is it a water problem? A soil problem? A microclimate problem?)
3. What has died or failed? (Record, analyze, decide: retry, replace, or redesign)
4. What unexpected successes appeared? (Volunteer plants, wildlife, self-seeding)
5. What has the client learned? (Skills developed, confidence grown)

#### Decision Triggers
| Observation | Trigger | Response |
|-------------|---------|----------|
| Tree survival < 70% after Year 1 | Reassess | Check irrigation, species selection, planting technique |
| Soil organic matter not increasing after Year 2 | Intensify | Double compost application, add cover crops |
| Water storage empty before end of dry season | Expand | Add storage capacity, reduce demand |
| Pest damage > 20% in any crop | Investigate | Check guild diversity, beneficial insect habitat |
| Client reports overwhelm | Simplify | Reduce active zones, defer Phase expansion |

### 8.4 Long-Term Succession Plan
- Year 1–3: Establishment phase — high maintenance, frequent intervention
- Year 3–7: Maturation phase — decreasing maintenance as systems self-regulate
- Year 7+: Climax phase — minimal intervention, harvest and observation focus
- Projected maintenance hours/week by year

**AI prompt context:** `designPlan.*`, `siteData.soil.*`, `siteData.climate.*`
**Token budget:** 3,000

---

## Chapter 9 — Education, Community & Knowledge Transfer (2–3 pages)

### 9.1 Client Education Plan
- Skills the client needs to develop (composting, pruning, animal husbandry, seed saving)
- Recommended courses and workshops (online and local)
- Books and resources specific to their climate and goals
- Suggested mentorship connections (local permaculture network)

### 9.2 Community Engagement Opportunities
- Workshops the client can host on-site (composting, food preservation, natural building)
- Open farm days and seasonal celebrations
- Volunteer workday programs (WWOOFing, local community)
- School and youth group visits
- Revenue potential from education activities

### 9.3 Knowledge Sharing
- Documentation practice: photo journal, blog, social media
- Local permaculture guild participation
- Contribution to citizen science projects (biodiversity monitoring data)
- Potential for demonstration site status

### 9.4 Partnerships & Network
- Local organizations for collaboration
- Agricultural extension services
- Seed libraries and plant swaps
- Bulk purchasing cooperatives

**AI prompt context:** `project.clientGoals`, `project.location`, `siteData.climate.koppenZone`
**Token budget:** 1,500

---

## Chapter 10 — Designer Profile & Methodology (1–2 pages)

### 10.1 Designer Credentials
- Name, certifications (PDC, Diploma, university qualifications)
- Years of practice
- Design philosophy statement
- Specializations (food forests, water systems, animal integration, etc.)

### 10.2 Design Process Used
- Site visits conducted (dates, duration, conditions)
- Data collection methods
- Consultation process with client
- Tools and technology used (mapping, soil testing, climate data sources)

### 10.3 Contact & Follow-Up
- Designer contact information
- Follow-up consultation schedule (if included)
- Ongoing support options and pricing
- Portfolio link

> **AI gen note:** Not AI-generated. Pulled from user profile data.

---

## Appendices (A–K)

### Appendix A — Maps & Diagrams
- Base map (satellite imagery with property boundary)
- Contour/topographic map
- Zone map (color-coded overlay)
- Sector analysis diagram (composite)
- Master design plan (all elements placed)
- Water system plan
- Planting plan (tree/shrub locations)
- Cross-section diagrams (food forest layers, windbreak profile, swale profile)

### Appendix B — Complete Plant Lists
- Full species database with: botanical name, common name, climate zone, soil preference, water needs, height, spread, yield, function codes, supplier suggestions
- Organized by zone, then by layer within each zone

### Appendix C — Recommended Resources
- Books: Mollison, Holmgren, Hemenway, Lawton, Jacke & Toensmeier, Shepard, Falk, Lancaster
- Websites and online communities
- Courses (online PDC options, local workshops)
- Relevant YouTube channels and podcasts
- Local suppliers (seeds, plants, tools, soil amendments, livestock)

### Appendix D — Soil Test Results
- Raw laboratory data (if uploaded)
- Field test results (pH, texture, percolation)
- Interpretation summary
- Amendment recommendations with specific quantities per zone
- Retest schedule

### Appendix E — Water Data
- Monthly rainfall records (historical average + recent years)
- Water budget calculation (full table)
- Catchment area calculations
- Storage sizing calculations
- Irrigation schedule by season and zone

### Appendix F — Energy Specifications
- Solar panel specifications and layout
- Wind assessment data (if applicable)
- Passive solar design calculations
- Biomass fuel estimates
- Energy budget: production vs. consumption

### Appendix G — Monitoring Logs & Templates
- Daily observation journal template (printable)
- Weekly task checklist (printable)
- Monthly monitoring record sheets
- Seasonal review template
- Yield tracking spreadsheet format
- Photo monitoring guide (same angle, same time, monthly)

### Appendix H — Community Events Calendar Template
- Annual event planning template
- Workshop outlines for common topics
- Volunteer coordination checklist
- Safety and insurance considerations

### Appendix I — Detailed Budget Breakdown
- Phase 1 itemized budget (materials, labor, equipment, services)
- Phase 2 itemized budget
- Phase 3 itemized budget
- Phase 4 itemized budget
- Running cost estimates (annual maintenance)
- Revenue projections by enterprise (Year 1, 3, 5)
- Break-even analysis (when does the property pay for itself?)
- Potential funding sources (grants, subsidies, crowdfunding)

### Appendix J — Legal & Regulatory Notes
- Planning permissions relevant to structures, ponds, earthworks
- Water rights and extraction limits
- Livestock regulations (numbers, species, housing standards)
- Organic certification pathway (if applicable)
- Fencing obligations (boundary responsibilities)
- Insurance recommendations

### Appendix K — References & Bibliography
- All sources cited in the report
- Climate data sources with URLs
- Soil science references
- Species identification references
- Permaculture design methodology references

---

## AI Generation Strategy

### Section Generation Order
Generate in dependency order — each section builds on those before it:

```
Round 1 (independent — can be parallel):
  - Chapter 2 sections 2.1–2.10 (Site Assessment, each layer independently)

Round 2 (depends on Round 1):
  - Chapter 3 (Sector Analysis — needs all site data)
  - Chapter 6 (Plant Palette — needs climate + soil)

Round 3 (depends on Rounds 1–2):
  - Chapter 4 (Design Framework — needs site + sector + plants)

Round 4 (depends on Round 3):
  - Chapter 5 (Design Details — needs full design framework)

Round 5 (depends on Round 4):
  - Chapter 7 (Implementation — needs full design details)

Round 6 (depends on Round 5):
  - Chapter 8 (Maintenance — needs implementation plan)
  - Chapter 9 (Education — needs client goals + design)

Round 7 (generated LAST — synthesizes everything):
  - Chapter 1, Section 1.4 (Site Analysis Summary)
  - Chapter 1, Sections 1.1–1.3 (Introduction framing)
```

### Token Budgets

| Chapter | Max Tokens | Notes |
|---------|-----------|-------|
| Ch 1 — Introduction | 1,500 | Generated last |
| Ch 2 — Site Assessment | 18,000 | 10 subsections, each 1,200–3,000 |
| Ch 3 — Sector Analysis | 2,500 | |
| Ch 4 — Design Framework | 4,000 | |
| Ch 5 — Design Details | 12,000 | 6 subsections, each 1,500–3,000 |
| Ch 6 — Plant Palette | 3,500 | |
| Ch 7 — Implementation | 4,000 | |
| Ch 8 — Maintenance | 3,000 | |
| Ch 9 — Education | 1,500 | |
| Ch 10 — Designer | N/A | User data, not AI-generated |
| Appendices A–K | 5,000 | Only text appendices; maps/diagrams are images |
| **Total** | **~55,000** | Across ~15–20 API calls |

### Cost Estimate
At ~$0.015 per 1K output tokens (Sonnet): ~$0.83 per full report generation.
At ~$0.003 per 1K input tokens: ~$0.30 for context across all calls.
**Total estimated cost per long report: ~$1.10–$1.50**

---

## Differences from Short Report

| Aspect | Short Report | Long Report |
|--------|-------------|-------------|
| Length | 15–25 pages | 40–80 pages |
| Site Assessment | 8 subsections (layers merged) | Full 10-layer Scale of Permanence |
| Design Details | Overviews per system | Full specifications with dimensions, materials, quantities |
| Plant detail | 2–4 guilds, summary tables | 4–8 guilds with full profiles + master species database |
| Animal systems | Mentioned in enterprises | Dedicated section with housing, rotation, feed plans |
| Waste/nutrient cycling | Not explicit | Full waste stream audit and nutrient flow diagram |
| Budget | Ranges by phase | Itemized line items + revenue projections + break-even |
| Implementation | 3 phases, task lists | 4 phases, Gantt chart, seasonal calendar, role assignments, risk matrix |
| Appendices | 5 (A–E) | 11 (A–K) including legal, energy, events, detailed budgets |
| Visualizations | 4–6 images | 8+ images with zone-by-zone breakdowns |
| Monitoring | Task table + indicators | Full framework with baselines, targets, decision triggers |
| Risk assessment | Not included | Formal risk matrix with likelihood, impact, mitigation |
| Roles | Not included | Responsibility matrix with time commitments |

---

## Export Formatting Notes

- **Word (.docx):** Professional branded template with:
  - Cover page with full-bleed hero image
  - Running headers (chapter name) and footers (page number, project name)
  - Auto-generated Table of Contents and List of Figures
  - Consistent heading hierarchy (H1 = Chapter, H2 = Section, H3 = Subsection)
  - Branded color palette in headings and table headers
  - Print-ready margins (25mm all sides)
- **PDF:** Generated from Word template, bookmarked for navigation
- **Brand colors:** Dark green `#2D5016` for headings, earth tone `#8B6914` for accents, `#C4956A` for highlights, `#F5F0EB` for table backgrounds
- **Typography:** Serif for headings (Playfair Display), sans-serif for body (Inter), monospace for data tables (JetBrains Mono)
- **Charts:** Embedded as high-resolution images from Recharts (climate charts, budget charts, timeline)
- **Maps/diagrams:** Exported from map component as high-res PNG, embedded at full page width
- **Photos:** Client-uploaded site photos at relevant sections, captioned with date and location
