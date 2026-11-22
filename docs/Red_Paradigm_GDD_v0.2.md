# Red Paradigm: Game Design Document (Draft v0.2)
**Working Title:** Red Paradigm  
**Genre:** 4X Strategy / Educational Simulation  
**Inspiration:** Sid Meier's Alpha Centauri + realistic planetary engineering on a cold, thin-atmosphere world  
**Date:** 2026-11-22 (updated)

## Naming & Setting Note
The planet is primarily referred to as **the Red** or “the world.”  
Occasional in-fiction references to the older name are allowed (“some still called it Mars,” archival logs, or flavor from specific factions), but the word is not the focus, does not appear in the title, and is avoided in most UI, tech names, and mechanical text. All science remains grounded in the real constraints of a cold, thin-atmosphere, high-radiation world with accessible ice and regolith.

## 1. High-Level Concept
Players lead factions that have arrived at different times on the Red. The game begins for all players at the moment the final faction’s landers touch down. Earlier arrivals already possess established infrastructure, partial terraforming, and resource loops. Everyone starts play simultaneously, but the map and faction starting positions reflect staggered historical arrival.

Core loop remains ISRU bootstrapping, staged terraforming, modular units, Paradigm project races, intel under fog of war, and multiple victory paths (peace and transcendence preferred by design but not exclusive).

## 2. Narrative & Arrival Structure
**Premise:**  
Over a period of years, independent missions from a pressured home world reached the Red. Each carried different ideologies, hardware, and priorities. Earlier landings had time to extract ice, stand up power and processors, begin soil work, and expand. The final wave arrives to a world that is no longer empty.

**Game Start Moment:**  
All players (and any AI factions) begin on the same turn—the turn the last faction’s primary habitat and equipment are operational. Earlier factions are already present with:
- One or more established bases
- Partial ISRU loops running
- Some local terraforming or greenhouses
- A small number of units and stored resources
- Possibly a head-start tech or two

The amount of prior progress scales with how early that faction arrived (designer-tunable or scenario-based). This creates asymmetric but lore-justified starts without forcing players to sit through solo early turns.

**Tone:** Unchanged—grounded, intelligent, slightly austere. Interludes can reference “the earlier landings” or “those who came before.”

## 3. Staggered Arrival Implementation Ideas
- **Pre-placed progress:** Earlier factions start with extra bases, formers, power capacity, and completed local improvements. Their starting tech or project progress can be slightly advanced.
- **Arrival order as scenario data:** Each faction has an “arrival offset.” At game creation the engine applies the corresponding starting package.
- **Player fairness:** All human players receive control at the same global turn. No one plays alone first. The asymmetry is visible and part of the strategic landscape (do you attack the established power, race to catch up via a strong Paradigm, or cooperate?).
- **Narrative delivery:** Opening text or short cinematic shows prior landings in fast-forward, then drops all players in together on the final arrival.

## 4. Updated Faction Arrival Concept (example)
| Faction              | Relative Arrival | Starting Advantage Example                  |
|----------------------|------------------|---------------------------------------------|
| Industrial           | Earliest         | 2 bases, running ISRU, extra formers        |
| Corporate / Resource | Early            | Strong propellant stockpile, trade post     |
| Scientific           | Mid              | Extra research, sensor coverage             |
| Ecological           | Mid-late         | Some soil remediation & biology started     |
| Security             | Late             | Fortified position, military units          |
| Final / Player wave  | Last             | Fresh but complete starter package          |

(Exact mapping is flexible; any faction can be assigned any slot per scenario.)

## 5. All Other Systems
Tech tree, Paradigm projects, ISRU model, unit designer, victory conditions, multiplayer, and educational approach remain as previously detailed. Only references to the planet’s name and the uniform “everyone lands together with nothing” start have changed.

Climate and motion are specified in **Red_Paradigm_Climate_Physics.md**. Native CO₂ cannot produce a breathable sky; turns are 28 sols; aerosols decay; storms are a pure function of the campaign seed. Peace and transcendence both consume that model rather than a green-sky end state.

The staggered start reinforces the educational theme (early bootstrapping is hard; those with time pull ahead) while preserving simultaneous multiplayer.

---
*Living document. Previous expansion files (Tech Tree, Projects, ISRU, Factions, Units, Narrative) should be read with this naming and start-condition overlay.*
