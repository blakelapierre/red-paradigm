# Mars Paradigm: Game Design Document (Draft v0.1)
**Working Title:** Mars Paradigm (or Ares Bootstrap / Terra Ares)  
**Genre:** 4X Strategy / Educational Simulation (hex or grid-based planetary management with real-time or turn-based elements)  
**Inspiration:** Sid Meier's Alpha Centauri (systems depth, factions, secret projects, unit design, multiplayer tension) + realistic Mars colonization science  
**Target Feel:** Deep, systemic, educational through play; multiplayer-first with stable late-game; terraforming and bootstrapping as core fantasy.  
**Platforms:** PC (primary), with existing renderer/game loop/physics as foundation.  
**Date:** 2026-11-22

## 1. High-Level Concept
Players lead competing factions on Mars in a near-to-mid future setting. Starting with limited imported mass, they bootstrap industry via In-Situ Resource Utilization (ISRU), reshape local and regional environments through terraforming, race for high-impact unique projects, and pursue multiple victory paths. The game teaches real planetary engineering constraints (volatiles, energy scale, soil chemistry, atmosphere, radiation) through mechanics rather than exposition. Mars is a stepping stone; the preferred long-term wins involve stability or launching outward.

**Core Pillars:**
- Realistic staged terraforming and ISRU bootstrapping.
- Modular unit design tied to tech.
- High-stakes unique "Paradigm" projects (secret projects).
- Meaningful fog of war + targeted intel.
- Stable multiplayer with incomplete information and races.
- Educational systems that reward understanding constraints.
- Multiple victory conditions, with strong peace and transcendence paths.

## 2. Narrative & Setting
**Premise:**  
In the mid-21st century (or slightly later), Earth faces cascading pressures (climate, resources, geopolitics). Multiple state, corporate, scientific, and ideological groups launch independent or semi-coordinated missions to Mars. The goal is not just survival but to create a self-sustaining industrial and biological base capable of supporting further expansion into the solar system and beyond. Players arrive with starter hardware, seeds, and personnel; everything else must be extracted or manufactured on-site.

**Tone:** Grounded hard sci-fi with philosophical undertones (similar to Alpha Centauri). Factions have distinct ideologies about humanity’s future, risk, ecology, and governance. Interludes, project completion texts, and faction quotes deliver narrative and science education. No fantasy elements; all systems rooted in known or near-term plausible science (with clear abstraction for gameplay).

**Key Narrative Beats:**
- Arrival and initial survival/bootstrapping.
- First major industrial hubs and regional habitability gains.
- Climate and atmospheric engineering races.
- Emergence of ecological or industrial maturity.
- Decision point: stabilize and coexist, dominate, or seed the next expansion wave.

**Factions (initial concepts – 6–8):**
1. **Industrial Consortium** – Efficiency, heavy extraction, rapid scaling. Strength: mineral/energy output, construction speed. Weakness: higher ecological disruption.
2. **Ecological Stewardship** – Careful biological and climate approaches. Strength: soil remediation, long-term stability, biological oxygen production. Weakness: slower early expansion.
3. **Corporate Resource Group** – Market control, trade, propellant and volatiles monopolies. Strength: economic leverage, flexible production.
4. **Scientific Collective** – Research acceleration, advanced tech unlocks, sensor/intel superiority.
5. **Security/Defense Compact** – Robust units, rapid response, territorial control.
6. **Autonomous/Transhuman Path** – Automation, self-replicating systems, late-game transcendence bonuses.
7. (Optional) **Earth-Remnant Authority** or hybrid factions.

Each faction modifies base systems (production modifiers, unique unit components, preferred project priorities, diplomatic attitudes) without hard-locking paths.

## 3. Core Gameplay Loop
**Turn structure (or hybrid):** Classic 4X turns with simultaneous or phased resolution for multiplayer. Physics/renderer support continuous simulation elements (atmosphere diffusion, resource flows, construction progress) where useful.

**Phases per turn/cycle:**
- Research & project allocation.
- Production & unit design/build.
- Terraforming & ISRU orders (formers/units act).
- Movement, combat/probes, diplomacy.
- Planetary simulation update (climate, resources, ecology).
- Events / intel updates.

**Map:** Hex or square grid of Mars regions (Valles Marineris, Hellas, Tharsis, poles, etc. as starting or procedural variants). Tiles have elevation, ice content, regolith type, radiation exposure, temperature, pressure contribution, perchlorate levels. Global atmosphere and climate are shared simulated layers.

## 4. Key Systems

### 4.1 ISRU & Bootstrapping (Early Game Core)
- Starter assets: limited power plant, basic excavator/processor, habitat module, seed stock.
- Resources: Water ice, atmospheric CO₂, regolith (metals, silicon, building feedstock), energy (solar/nuclear).
- Processes: Electrolysis, Sabatier (methane/oxygen), soil washing/remediation, additive manufacturing, biomanufacturing.
- Goal: Positive resource loops so expansion no longer depends on Earth imports. Failure modes (power shortages, toxic buildup) are visible and solvable.

### 4.2 Terraforming (Signature System)
Staged and regional-first:
- **Local:** Greenhouses, aerogel/solid-state covers, soil amendment, water distribution, radiation shielding.
- **Regional:** Temperature/pressure modification via aerosols, localized gas release, mirrors, condensers/borehole equivalents (energy-intensive extractors).
- **Broader:** Atmospheric thickening contributions, biological seeding that slowly generates oxygen and organics, climate feedback tracking.
- Mechanics: Formers (specialized units) perform tasks with time/energy/resource costs. Improvements persist and compound. Planet “pushes back” via dust storms, resource depletion, ecological instability, or atmosphere loss without maintenance.
- Visual/physics: Renderer + physics sims show changing terrain, ice melt, dust, habitat growth, atmospheric haze.

**Weather/Climate Paradigm equivalent:** Early-mid unique project that accelerates terraforming rates and unlocks advanced regional tools before normal tech (mirrors, advanced condensers, rapid soil processing).

### 4.3 Tech Tree
Branching, non-linear, focused on unlocking processes and options rather than flat bonuses. Major trunks:

- **ISRU & Materials:** Atmosphere processing → Water extraction → Regolith refining → Advanced manufacturing / biomanufacturing.
- **Energy Systems:** Solar optimization → Nuclear → Advanced storage / beamed concepts.
- **Climate & Atmosphere:** Local warming → Aerosol/greenhouse engineering → Regional processors → Retention & magnetic concepts (late).
- **Biology & Soil:** Perchlorate remediation → Engineered microbes → Pioneer plants → Ecological succession / oxygen contribution.
- **Propulsion & Logistics:** Surface mobility → Hoppers / short-range → Interplanetary capability (feeds transcendence).
- **Sensors, Intel & Automation:** Basic probes → Wide sensor nets → Advanced infiltration / AI assistance.
- **Social / Governance:** Parallel track affecting production efficiency, diplomacy, ecological impact, unit morale/specials (abstracted from AC social engineering).

Techs have prerequisites, mutually exclusive or synergistic choices, and clear educational tooltips explaining real-world basis and trade-offs.

### 4.4 Unit Design
Modular designer:
- Chassis (infantry/personnel, rover, flyer/drone, stationary platform, former/construction).
- Power source.
- Primary function (weapon, processor, sensor, terraformer tool, cargo).
- Armor/shielding / specials (radiation hardened, low-power, ecological, probe capable, etc.).
Faction-unique components. Units serve combat, construction, intel, logistics, and terraforming roles.

### 4.5 Unique Projects (“Paradigms”)
Limited, raceable, high-impact projects (one of each planet-wide). Examples:
- Atmospheric Accelerator / Weather Paradigm analog (terraforming speed + early advanced tools).
- Planetary Resource Exchange (economic tools).
- Biological Foundry (faster ecological succession).
- Sensor Web / Hunter-Seeker analog (intel dominance).
- Industrial Seed / Self-Replicating Hub (late manufacturing explosion, transcendence enabler).
- Magnetic or Radiation Mitigation Array.
Completion grants lasting bonuses; capture or sabotage possible. Races create multiplayer tension with partial intel.

### 4.6 Diplomacy, Intel & Fog of War
Standard exploration fog. Sensors, orbital assets, and probe units reveal targeted areas or project progress. Incomplete information preserves tension. Diplomacy: trade resources/tech, non-aggression, joint projects, or conflict.

### 4.7 Victory Conditions
All standard available:
- **Military:** Eliminate or subjugate rivals.
- **Economic:** Control critical resource production or market share thresholds.
- **Diplomatic / Peace:** Achieve stable multi-faction coexistence with high ecological/industrial stability metrics and no active wars (or unified council).
- **Transcendence / Outward:** Complete late projects enabling reliable interplanetary seed capability; Mars left as functioning base.
- **Score / Time:** Optional.

Peace and transcendence are designed to feel strong and natural when players invest in terraforming and industry.

## 5. Multiplayer Considerations
- Stable late-game state handling (leveraging existing architecture).
- Autosave / recovery.
- Clear project race signals without full spoilers.
- LAN and online support.
- Asymmetric factions create interesting matchups.

## 6. Educational Integration
- Every major system has concise, accurate explanations (volatiles inventory limits, energy requirements for warming, perchlorate chemistry, oxygen timescales, ISRU reaction basics).
- Tooltips, project interludes, and optional “science log” expand on real concepts.
- Abstractions are documented so players understand what is simplified.

## 7. Technical Notes (Leveraging Existing Code)
- Renderer: Terrain deformation, atmospheric effects, unit/habitat visuals, climate visualization overlays.
- Game loop: Turn resolution + continuous sim ticks for resource flows, construction, atmosphere diffusion.
- Physics: Tile interactions, resource transport, simple climate/atmosphere models, unit movement/collision where relevant.
- Data-driven design for techs, projects, factions, and unit components to support iteration and modding.

## 8. Next Development Priorities (Suggested)
1. Core map + tile data model with basic ISRU resource loops.
2. Former/unit actions for local terraforming.
3. Simple tech tree prototype (ISRU + Climate trunks).
4. One or two Paradigm projects.
5. Basic multiplayer sync test.
6. Faction modifiers.

## 9. Open Questions / Iteration Points
- Exact turn length vs. real-time hybrid.
- Scope of global climate simulation vs. regional abstraction.
- Number of factions at launch.
- How much biological vs. purely industrial terraforming to emphasize.
- Art and UI direction (lean technical/readable like classic strategy, or more modern).

---
*This is a living draft. Expand sections as implementation progresses. All systems should reinforce terraforming, bootstrapping, and multiplayer races while remaining scientifically grounded.*
