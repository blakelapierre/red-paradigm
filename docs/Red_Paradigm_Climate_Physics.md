# Red Paradigm — Climate & Physics Rules
**Status:** Draft v0.1, implementable  
**Date:** 2026-11-22  
**Reads with:** GDD v0.2, Engine Take, ISRU model, Projects, Tech Tree, Starter Map

The planet is **the Red**. Survey constants below are the real body (some archives still say the old name). They are not tuning knobs. If a rule and a constant disagree, the constant wins and the rule changes.

This is the sim we said was not written yet: regional stocks for atmosphere, ice, dust, and heat. It is not a voxel water sim and not a full general circulation model.

---

## 1. What the player is actually allowed to do

A standard campaign lasts on the order of **years**, not millennia. In that window the honest outcomes are:

| Tier | Name | Open to a crew? | How you get it |
|---|---|---|---|
| 0 | Suit | No | Default outdoors |
| 1 | Pressure vessel | Inside only | Habitat, tank, rover cabin |
| 2 | Covered microclimate | Shirt-sleeve under a roof | Aerogel, canyon lid, greenhouse |
| 3 | Extremophile ground | No | Regional warmth, some pressure, toxins down |
| 4 | Pioneer plants in the open | No | Tier 3 plus liquid water, remediated soil, years of biomass |
| 5 | Unassisted human air | No | **Not a campaign result** |

Tier 5 needs on the order of 10¹⁸ kg of N₂ and O₂. The native nitrogen inventory is a trace in a 6 mbar sky. Photosynthesis at Earth-biome rates, even if the carbon were there, is thousands of years, and the known CO₂ reserve is not enough carbon to build that oxygen budget anyway. Peace is tiers 3–4 held stable. Transcendence is an industrial seed that can leave, not a finished blue sky.

Jakosky & Edwards (2018) is the inventory law, in words the UI can show:

> Accessible CO₂ can plausibly add on the order of **20 mbar**, not 1 bar. That is under **10 K** of CO₂ greenhouse warming, not the ~60 K that open liquid water wants everywhere. The shortfall is the reserve, not a missing tech node.

Engineered particles, albedo, and roofs are the real levers. They are local or regional, they cost industry every season, and a storm can strip them.

---

## 2. Clocks

Three clocks. Do not collapse them into one float.

| Clock | Length | Runs |
|---|---|---|
| **Physics** | milliseconds to seconds | Leapfrog, contact, drag. Only while a body is actually moving in a zoom or on a hop/orbit. Ephemeral. Not hashed. |
| **Sol** | 88775 s (24 h 39 min 35 s) | Insolation, night frost, solar yield, dust fallout step, unit orders that are “per sol.” |
| **Turn** | 28 sols | Player orders resolve. A year is 668.6 sols ≈ **24 turns**. A 120-turn game is about **5 years** after the last landing. |

Earlier factions’ head start is applied before turn 0 as already-resolved sols, not as free turns the player sits through.

Seasons use solar longitude **Ls**, 0° at northern spring equinox. Southern summer (Ls ≈ 270°) is perihelion: stronger sun, the storm season. Obliquity 25.2°, eccentricity 0.0934. Do not ship a 72-minute day.

A turn is long enough to order a former and short enough that a dust storm (tens of sols) can eat a whole turn of solar income. That is intentional.

---

## 3. Three layers of state

Climate does not live on the 25 cm brush. It does not all live on the 1 km crust either. Weather’s natural scale is hundreds of kilometers.

| Layer | Grid | Holds | Authority |
|---|---|---|---|
| **Body** | one record | Gas inventories, cap masses, mean optical depth, year seed, Ls | Integer stocks. Hashed. |
| **Climate cell** | 5° lat/lon (about 300 km at the equator). 72 × 36 = 2592 cells. Poles are single rings, not 72 copies. | Mean T, diurnal amplitude, dust τ, engineered τ, humidity class, wind class, perchlorate index, biomass | Integers. Hashed. Updated by the climate tick. |
| **Crust cell** | 0.25–1 km strategic grid, sparse overrides on a seed heightfield | Elevation edit, albedo paint, greenhouse footprint, road, pit, berm, local ice claim, “roofed” flag | Integer overrides + before-hash, same contract as the engine take. |

Zoom crust (25 cm) exists only inside a base or a pit someone is standing in. It has no climate variables. Stepping into it samples the parent crust cell and the parent climate cell.

**Elevation is the crust’s.** A climate cell stores no height. Surface pressure at a crust cell is hydrostatic from the datum pressure and that cell’s elevation (seed plus overrides). Digging a pit a few meters does not make a new atmosphere. Roofing a canyon cell does: it sets a **local pressure cap** on that crust cell only, paid for in structure, and it leaks if unmaintained.

Ice, perchlorate, and biomass are **column stocks** (kg, or kg/m²), never voxel fluids. Melt does not spawn a water mesh.

---

## 4. Conserved inventories

These are global kilograms. Processes move them. They do not respawn.

| Stock | Campaign start (survey) | Notes |
|---|---|---|
| CO₂ in air | 2.4×10¹⁶ kg | ≡ about 6.1 mbar global mean |
| CO₂, north seasonal cap | part of the seasonal swing | See §7 |
| CO₂, south seasonal + residual cap | the larger residual | Darkening this cap is a strategic action |
| CO₂, adsorbed regolith (accessible band) | designer cap, default **+14 mbar equivalent** once the whole band is mobilized | Hard ceiling. Not a magic bar. |
| CO₂, carbonates & deep stores | **locked** | No tech unlocks them in this game |
| N₂ | ~2% of the air, order 10¹⁴ kg | Buffer gas. Never enough to breathe |
| Ar and other nobles | traces | Inert. Sensor flavor, not a resource |
| H₂O ice, polar + mid-latitude sheets | large but **place-bound** | Mining a cell depletes that cell. Vapor mostly dies in a cold trap |
| H₂O vapor | tiny | Not a reserve |
| Dust in air | a τ, not a mine | Lofting moves dust from crust fines to air and back |
| Engineered aerosol | 0 at start | Manufactured mass only. Falls out |
| Imported volatiles | 0 | Only from a logistics spine. The only way past the native ceiling, and it is transcendence-scale |

**1 mbar of global-mean pressure ≡ 3.9×10¹⁵ kg** of gas. Print this on any “release the air” order so the tonnage is visible.

Sabatier, electrolysis, and habitats move kilograms at base scale. They do not show up on the global bar. A planetwide pressure tick only moves when a cap, a regolith band, or an import actually changes those stocks. This stops the ISRU loop from accidentally terraforming the sky, and it teaches the scale break.

Destroyed aerosol mass returns to “processed fines” in the owning faction’s stockpile at a loss (scattered, contaminated). It is not deleted.

---

## 5. Constants

Use these. Derive anything else from them. Do not retune g to make hops “feel Earthlike.”

| Symbol | Value | Use |
|---|---|---|
| R | 3.3895×10⁶ m mean | Datum radius. Equatorial 3396 km and polar 3376 km are map-only |
| M | 6.4171×10²³ kg | The one central mass in the integrator |
| G | 6.6743×10⁻¹¹ | Orbit and the check `g = GM/R²` |
| g | 3.71 m/s² | Constant in the local tangent frame. Coriolis off for rovers |
| sol | 88775 s | |
| year | 668.6 sols | |
| S at 1 AU | 1361 W/m² | |
| S mean | 586 W/m² | 1361 / (1.524)² |
| S perihelion | ~710 W/m² | Ls ≈ 251°, southern summer |
| S aphelion | ~490 W/m² | |
| Bond albedo | 0.25 datum | Cell albedo overrides this |
| P₀ | 610 Pa | Global-mean surface pressure at datum, start of campaign, before cap season |
| T mean skin | ~210 K | Energy-balance result, not a flat paint |
| R_CO₂ | 189 J/kg/K | Density and scale height |
| H | ~11 km | `R_CO₂ T / g` at 210 K. Recompute if T changes a lot |
| ρ₀ | ~0.015 kg/m³ | `P/(R_CO₂ T)` at datum. About 1% of Earth sea-level air |
| Triple point, water | 273.16 K, 612 Pa | The liquid rule |
| CO₂ frost | ~148 K at 610 Pa | Night and polar deposition. Rises slowly with P |
| ω | 7.088×10⁻⁵ rad/s | Wind and artillery only. Ignore for ground traction |
| Escape | 5.03 km/s | Landing and departure burns |

Phobos and Deimos are kinematic scenery unless a scenario says otherwise. They are not a second n-body problem.

---

## 6. Energy balance

Each climate cell, once per sol, updates a **daily-mean temperature** and a **diurnal amplitude**. No radiative-transfer stack.

### 6.1 Mean temperature

Absorbed solar at the surface:

```text
F_sun = S(Ls) * μ_day * (1 - A) * T_dust_surface
```

- `S(Ls)` interpolates perihelion to aphelion with the real eccentric orbit. Do not use a constant 586.
- `μ_day` is the day’s average cosine of the solar zenith for that latitude and Ls, including polar night (zero).
- `A` is the area-weighted albedo of crust cells in the climate cell: seed albedo, ice cover, paint, built cover.
- `T_dust_surface = exp(-0.7 * τ_dust)`. Clear air τ ≈ 0.3 (about 80% transmission). A global storm τ ≈ 5 leaves a few percent. Nuclear power does not use this factor. Solar does.

Greenhouse, added as a bounded offset, not a multiplier that can run away:

```text
ΔT = ΔT_co2(P) + ΔT_aer(τ_aer) + ΔT_mix
ΔT_co2 = min(12 K, 6 K * log2(max(P, P₀) / P₀))
ΔT_aer = min(ΔT_aer_cap, 25 K * τ_aer)
```

`ΔT_co2` saturates at **+12 K** from native gas. That is the Jakosky ceiling, slightly rounded, and it is a hard clamp. Importing gas is the only way to raise the clamp, and the import mass has to actually be in the air stock.

`τ_aer` is engineered optical depth in that climate cell. **25 K per unit τ** is the gameplay stand-in for “metal nanorods are mass-efficient.” The cap `ΔT_aer_cap` starts at **+15 K** (early aerosols leak and clump) and rises with tech: Aerosol Engineering +25 K, Atmospheric Accelerator +35 K, Regional Climate Stabilizer +35 K and a slower decay. It never reaches +60 K everywhere from particles alone. Stacking cells does not beat the cap inside one cell.

`ΔT_mix` is a diffuse share from neighboring cells, 10% of the neighbor-mean offset per sol, so a warm basin leaks heat downwind but does not paint the planet in one turn.

```text
T_mean = T_bare(F_sun, latitude, Ls) + ΔT
```

`T_bare` is a lookup built so that, with start-of-game albedo, τ, and P, equatorial cells sit near 210–230 K on a yearly mean and polar winter cells fall through the CO₂ frost point. Ship the lookup as data. Do not hand-tune individual factions’ home cells.

### 6.2 Diurnal amplitude

Thin air and dusty ground swing hard. Pressure and roofs damp the swing more than they kill the seasons (seasons are the orbit and the tilt).

| Surface class | Amplitude at 6 mbar, clear | Notes |
|---|---|---|
| Dust | ~60 K | Default regolith fines |
| Rock / duricrust | ~30 K | |
| Ice | ~20 K | |
| Roofed / aerogel | ~10 K, and a designer floor | The floor costs structure and power if it is actively held |
| Any, storm τ > 2 | ×0.6 | Dust warms the air and kills the sun. Nights are less brutal, days are dim |

Extra damping once the column thickens: multiply amplitude by `sqrt(P₀ / P)` but never below 0.5 from this term alone. A 20 mbar sky is milder at noon and at midnight. It is not temperate.

`T_day = T_mean + amplitude/2`, `T_night = T_mean - amplitude/2`.

### 6.3 What this is not

No 3D winds, no cloud-resolving model, no latent-heat thunderstorms. Water’s latent heat only appears as a **loss fraction** when ice is melted into vapor (§8). If a later patch wants a real GCM, it replaces the lookup and the neighbor mix. It should not replace the inventories or the clamps.

---

## 7. Pressure, caps, and elevation

Datum pressure comes from the air stock:

```text
P₀ = M_co2_air / 3.9e15   in mbar, times 100 for pascals
```

N₂ and Ar ride along; they are too small to track separately for P.

At a crust cell:

```text
P = P₀ * exp(-z / H)
H = R_CO₂ * T_mean / g
```

`z` is meters above the datum, from the seed heightfield plus crust overrides. Use the parent climate cell’s `T_mean` for H.

Worked survey checks the sim should reproduce at campaign start (H ≈ 11 km, P₀ = 610 Pa):

| Place | z | P | Liquid possible in the open? |
|---|---|---|---|
| Deep basin floor (the Low Cradle) | −7 km | ~1.15 kPa (11.5 mbar) | Pressure is over the triple point. Temperature is not, until late regional work |
| Northern plains (the Works, the Depot) | −4 km | ~0.88 kPa | Barely over the triple point. Brines before open water |
| Datum | 0 | 0.61 kPa | On the line. Treat as **no** stable liquid |
| High volcanics (the Rampart) | +22 km | ~0.08 kPa | Never. Vessels only |

So the starter map’s landing logic is a climate law, not flavor. The low basin is the biology site because the air is already thicker. The high watch is defensible and climatically useless outdoors. The northern ice plains are where industry can meet a marginal pressure line.

### Seasonal caps

About a quarter of the air mass freezes onto the winter pole and returns in spring. This is automatic:

```text
fraction_frozen = 0.25 * max(0, cos(Ls - Ls_pole))
```

with the south pole taking the larger residual. It moves `M_co2_air` into the cap stocks and back. Peers do not vote on it. Solar at high latitude goes to zero in winter anyway.

**Cap darkening** (a former action, once Aerosol or Local Warming allows surface work on ice) lowers cap albedo. Effect, in order:

1. That cap’s release happens earlier and more completely.
2. Global P₀ rises by however many kilograms actually leave the cap, up to the residual, not beyond.
3. A pressure pulse and a warmer shoulder season.
4. Dust burden increases. Storm odds rise the following southern summer.

You cannot farm this forever. The residual cap is finite. After it is gone, further darkening is just albedo on dirty ice.

**Regolith CO₂ band** (Regional Atmospheric Processors): a slow industrial process, not an explosion. Each climate cell has an accessible kg cap. Releasing it spends energy and heat and moves kg into `M_co2_air`. When the global accessible band (default +14 mbar) is exhausted, the order fails with the inventory tooltip. Deep carbonates stay locked.

---

## 8. Water

Three phases the sim will name. Only two are stocks.

```text
stable_liquid(cell) =
    P(cell) >= 612 Pa
    AND T_day >= 273 K
    AND ice_or_brine_kg > 0
    AND not perched on a steep slope that sheds it
```

If the check fails, a “melt” order does not create a lake. It creates vapor and a loss.

| Path | Result |
|---|---|
| Ice stays frozen | Stock unchanged. Mineable by an excavator. No climate effect beyond albedo if the pit is large |
| Melt under a roof or in a tank | kg moves from crust ice to faction water. Small loss. This is the ISRU path |
| Melt in the open where `stable_liquid` is true | A **transient brine** stock on that crust cell, in kg. It refreezes the next night unless T_night also holds or the cell is roofed. Perchlorates concentrate in the brine (toxicity index up) |
| Melt in the open otherwise | Up to 80% of the disturbed kg becomes vapor. Vapor is removed from the cell immediately |

Vapor’s destination, same sol, no fluid sim:

- 70% to the current winter cold trap (polar ice stock)
- 20% to the coldest non-polar climate cell (a cold trap, often a deep night basin)
- 10% stays as frost in the source climate cell

So “boil the ice in the plains” feeds the poles, it does not irrigate a neighbor. Condensers (Regional Processors, and early under the Atmospheric Accelerator) are the tool that catches vapor **on purpose** and puts water in a tank instead. That is why the Weather Paradigm’s condenser unlock matters economically, not just as a temperature buff.

Liquid water never becomes a navigable ocean in this campaign. If a brine stock exceeds a cell’s shallow holding capacity, the excess runs downhill one crust step and then re-evaluates the liquid check. Most of it freezes or vanishes into the cold-trap split.

---

## 9. Dust and storms

Dust is the weather that can lose you a game you were winning on solar and aerosols.

### Optical depth

Each climate cell:

```text
τ = τ_background(Ls, latitude) + τ_storm + τ_local_loft
```

- Background is a seasonal curve: roughly 0.2–0.5, higher in southern spring and summer.
- Local loft comes from heavy digs, blasts, and low hops over fines. It decays by half in about 3 sols.
- Storm τ is regional or global.

### When a storm happens

Deterministic. No host roll.

```text
hazard = dust_burden * season_weight(Ls) * (1 + cap_pulse) * (1 + recent_loft)
trigger = hash(campaign_seed, year_index, climate_band) < hazard_curve(hazard)
```

`season_weight` peaks at southern summer. Most years do not produce a planet-encircling storm. The curve should yield a global event on the order of **one year in three** if the planet is left alone, more often if players strip caps and loft dust, less often if someone is actively damping (Stabilizer, and only inside its basins — the storm can still exist outside).

| Event | τ | Duration | Solar |
|---|---|---|---|
| Clear | 0.2–0.4 | — | Nominal |
| Regional storm | 1–3 | 5–20 sols | Poor in that band |
| Encircling storm | 4–6 | 30–70 sols | A few percent to ~20% at the surface |

### What a storm does

- Solar collapses. Fission and stored methane do not.
- Diurnal amplitude damps (§6.2).
- **Engineered aerosol in a stormed cell is stripped.** Half of τ_aer is removed per 10 sols of encircling storm, returned as scattered fines to nobody useful (10% salvage if a faction has collectors in that cell). This is the counterplay to the Accelerator. The warm regions go cold when the particles fall or are blown out, unless industry replaces them.
- Abrasion damage on exposed solar, seals, and unarmored units. Not knock-over. Dynamic pressure at 30 m/s in this air is only a few pascals. The harm is dust, not wind load.
- Sensor range shortens. The Sensor Web Array degrades; it does not go blind.
- Aircraft and hops take a drag and navigation penalty. Ground crawlers are happier.

Wind itself is a **class** on the climate cell (calm, trade, storm), used for loft, abrasion, and hopper risk. It is not a vector field the integrator queries except as a uniform bias inside one zoomed cell.

---

## 10. Engineered climate

Formers write crust and, through crust, climate. Every order spends energy, time, and usually feedstock. None of them are free percentage auras.

| Order | Writes | Spends | Decays? |
|---|---|---|---|
| Albedo paint / dust darkening | Crust albedo | Fines, time | Slow (storms re-brighten with fresh dust) |
| Cap darkening | Cap albedo, then the global CO₂ stock | A lot of surface work, in season | Cap does not reset |
| Aerogel / greenhouse | Roof flag, local T floor, local pressure cap | Materials, power to hold | Collapses if power or maintenance stops |
| Aerosol release | τ_aer in the climate cell | Manufactured particle mass from iron/aluminum feedstock | **Yes. Default half-life 40 sols.** Accelerator improves production, not immortality. Stabilizer lengthens half-life toward 120 sols inside its basins |
| Gas release (regolith band) | Global CO₂ kg, cell’s band remainder | Energy, heat, processors | Does not decay. Hits the ceiling and stops |
| Condenser | Pulls vapor and brine into tank water | Power | — |
| Perchlorate wash | Lowers toxin index. Required before tier 4 | Water, chemistry, time | Brines can recontaminate if you melt dirty ice later |
| Emissivity / thermal mass (berms, rock blanket) | Amplitude class | Construction | Stable until dug up |

Fluorocarbon-style long-lived gases are a **branch, not the default.** They decay on the order of years rather than sols, they are diplomatically loud (Gaia’s objection is mechanical: a persistent gas is a planetwide externality), and they still cannot beat `ΔT_aer_cap` or the CO₂ clamp. The Accelerator’s early path is the metal-particle path, because that matches “local iron and aluminum, continuous replenishment.”

### Maintenance is the Weather Paradigm

The Atmospheric Accelerator does three things and only three:

1. Former climate orders in the owner’s logistics net run at **×1.5** rate (the old +50%). Combat and digging ordinary pits do not get this.
2. It unlocks the efficient particle recipe, condensers, and rapid cap work **before** the normal tech dates.
3. It does **not** grant free τ. The owner who cannot feed it feedstock and power holds a monument that goes dark in a storm.

The Regional Climate Stabilizer, later, multiplies aerosol lifetime in its climate cells and damps storm *coupling* there (local loft and the regional storm table, not the encircling event itself). It is the “you now have to govern the sky you made” project.

A warm cell with no replenishment order returns toward `T_bare` on the aerosol half-life. Biology that depended on it stalls the same season. The planet does not punish you with a cutscene. It just gets cold, and the numbers are on the council map.

---

## 11. Biology, only as a slow stock

Biomass is kg of organic stock on a crust cell, plus a climate-cell summary.

- No growth without: toxin index under the strain’s line, T_day in range, and either a roof or `stable_liquid` for at least part of the sol.
- Growth per turn is capped so that even a perfect basin contributes **grams of oxygen per square meter per year**, visible as a lab number, irrelevant to global P and to the breathable-air fantasy.
- Oxygen from biology stays a **local tank credit** and a peace-score credit. It is not added to `M_co2_air` as a negative. Do not let plants eat the CO₂ bar.
- Death is fast if T or water fails, slow if the failure is seasonal and the strain is dormant-capable. Engineered Pioneer Microbes unlock dormancy. Pioneer plants do not forgive a dry year.

Soil building (organics in the column) is the real prize. It raises agricultural yield under roofs and is a peace-victory input. It is not a climate input of any importance. The educational line is: life follows the climate you can hold; it does not create it on this clock.

---

## 12. Motion physics

Only moving bodies integrate. A former standing on an order is not a rigid body.

### 12.1 Ground, zoomed

- Gravity: `a = (0, -g, 0)` in the local frame, g = 3.71. The central-mass leapfrog is for orbit, not for a rover on the surface. Using n-body against the planet for a surface vehicle just invites merge bugs.
- Contact: momentum exchange, restitution **0.72** for loose bodies (`bumpSpheres` / `bumpBodies`). Structures and parked bases use restitution 0 and policy **separate**. Nothing is absorbed into the planet. Debris may still coalesce.
- Drag: `F = −½ ρ Cd A |v| v` with ρ from local P and T. At datum this is weak. It matters for landers, hops, and falls into a deep pit. It does not matter for a crawler at 5 m/s.
- Traction is a table, not a physics engine: regolith, duricrust, ice, dust, road, slope. If grade exceeds the class limit, the unit **slides** under leapfrog instead of pathing through the cell. Ice near the CO₂ frost point is the nasty class.
- Slope, dust τ, and night frost modify the strategic movement cost on the crust graph. The raycaster is not the pathfinder.

### 12.2 Hops and landers

Low g and thin air make ballistic hops rational.

```text
range ≈ v² sin(2θ) / g
```

with drag integrated, not ignored, above ~200 m/s or for any unpowered fall from orbit. A failed landing is a crash op: quantized cell, damage, cargo spill as a hashed inventory split. The float trajectory that got there is discarded.

Parachutes work and are large. They are not Earth parachutes. The UI should show terminal velocity from the local ρ so a player can see why the chute is the size of a habitat.

### 12.3 Orbit

One central mass M. Leapfrog. Mirrors, seed ships, and transfer craft use it.

- Drag only below ~150 km, density `ρ₀ exp(−h/H)`, and only while the body is in that regime.
- A mirror is a structure with mass, area, and a station-keeping budget in propellant. It is not a “+sun” aura. If the budget hits zero, it drifts off the aim point and its flux bonus on the target cells falls the same sols. This is the orbital version of aerosol decay: a sky hook you stop feeding goes quiet.
- Beamed power, if unlocked, is a line from the craft to a receiver cell, blocked by the same `cast` the sensors use, attenuated by τ along the column. Storms cut beams. They do not cut a reactor on the ground.

### 12.4 What stays out of the hash

Positions and velocities of moving bodies are ephemeral. The hashed facts are: which cell it occupied when the order resolved, whether the landing succeeded, whether the crash spilled cargo, whether the shot or the sensor ray quantized to a hit. Two clients can disagree about a float and must still agree about those integers.

---

## 13. Turn pipeline

Same order every turn, on every peer. No phase is “the host’s climate.”

1. Advance Ls by 28 sols. Apply seasonal cap freeze or thaw. Recompute P₀ from the air stock.
2. Decay aerosols (half-life), decay local loft, settle storm τ if a storm is in its tail.
3. Evaluate the storm function. If it fires, write a storm record into the log (seed, band, duration, peak τ). The record is determined by the seed; writing it is so clients can show the same alert.
4. Resolve player orders: movement, ISRU, former climate writes, combat. Climate writes apply to crust and to cell τ/albedo immediately, in a stable faction-id order so simultaneous orders commute or the earlier log timestamp wins.
5. Sol-loop inside the turn for power: each sol, solar yield uses that sol’s τ and μ. One bad storm turn is a stack of bad sols, not a single average that hides it.
6. Energy balance on every climate cell. Brine freeze/boil. Biomass growth or death. Night-frost flag on crust cells where T_night < T_frost(P).
7. Maintenance failures: roofs without power, aerosols at zero, reactors without coolant. Apply collapse as ordinary state, not as a special event type.
8. Hash the body record, the dirty climate cells, and the crust overrides. That hash is the turn snapshot. Floats are gone.

If a client’s hash disagrees, it does not get to keep its weather. It replays the log or it is the one who left the table.

---

## 14. Failure modes (the planet pushing back)

All of these are outputs of the rules above. They should not be extra scripts.

| Failure | Cause in the rules | What the player sees |
|---|---|---|
| Solar brownout | Storm τ or polar night or panel frost | Energy orders stall. Nuclear sites keep working. Markets for methane and spare power spike |
| Warmth collapse | Aerosol half-life, storm stripping, mirror out of propellant | Regional T falls within a season. Open biology dies. Roofed farms hold if powered |
| Dry hole | Ice column mined out, vapor sent to the cold trap | The Works can drink a local sheet dry. Hauling ice is a logistics problem, which is the economic game |
| Brine poison | Melt before the wash | Toxin index rises. Agriculture refuses to start |
| Roof blowout or freeze-out | Power loss under a pressure cap | Cell drops from tier 2 to tier 0. Casualties if crewed |
| Cap-pulse storm | Successful cap darkening | A global P bump **and** a worse dust season. The faction that warmed the world gets the dust too |
| Slide and slump | Grade over the traction or repose limit | Integer crust edit, spoil in inventory, unit displaced |
| Nothing, slowly | Waiting for plants to finish the air | The oxygen credit stays a lab figure. The victory card does not light |

---

## 15. Victory hooks

**Global Peace** needs, for a declared run of turns (default 8, one third of a year), all of:

- no active war
- every faction’s capital basin at habitability tier ≥ 3, or tier 2 if the council treaty accepts roofed peace
- aerosol and roof maintenance within each faction’s last-turn production (no one is spending a stockpile down to fake the check)
- toxin index under the treaty line in those basins
- the accessible CO₂ band not being strip-mined that season (you cannot bomb the sky for pressure and call it peace)

**Transcendence** needs the Industrial Seed and the Logistics Spine, a working propellant loop, and a ship that can depart. Climate stability is scored, not required: leaving a collapsing aerosol veil behind is allowed and is the unpleasant ending. Holding tier 3 behind you is the clean one. Neither ending pretends the air is done.

Economic victory still corners the exchange. The goods that matter in a storm year are power, particles, and water. The exchange does not move them by teleport; hauled mass still has to cross the dust.

---

## 16. Refused simplifications

- No breathable-sky project.
- No “magnetic shield or the air leaks this decade.” Sputtering is geological (the air’s lifetime is hundreds of millions of years). Retention tech is a radiation and long-future project, with a tooltip that says so. It is not a maintenance tax.
- No float water, no voxel oceans, no flooding shader that implies a sea.
- No Earth gravity, no 320 km planet, no 72-minute day.
- No merge-on-contact with the ground.
- No storm dice on the host.
- No climate variables on the 25 cm grid.
- No biomass term in the global energy balance.

---

## 17. Tooltip copy (short enough to ship)

- **Pressure.** “The open air at this site is {P} pascals. Liquid water needs at least 612, and it still boils away unless the day is warm and something covers it.”
- **Warmth.** “Particles bought this basin about {ΔT} degrees. They fall out. Half are gone in {half-life} sols if we stop making them. A storm is faster.”
- **The ceiling.** “All the CO₂ we can actually reach is about 20 millibars above what is already overhead, and most of that is hard. That is not a breathable sky. Some archives still call that a failed terraforming plan. It is just the size of the reserve.”
- **Dust.** “The sun at the surface is {pct}% of clear. The wind is not strong enough to knock a habitat over. The dust is enough to blind the panels and strip the particles.”
- **Life.** “The plots are producing grams of oxygen, not a new atmosphere. They live only while the water and the heat hold.”

---

## 18. First implementation slice

When this leaves the page, the first sim is not a former and not a rover.

1. Body stocks, the 5° grid, the elevation-to-pressure check against the four rows in §7, and one sol of energy balance that reproduces a cold equator and a frost-bound pole.
2. One aerosol write, one 40-sol decay, one scripted encircling storm that strips it and cuts a solar panel’s yield.
3. Hash the cell integers before and after. A second client that misses the storm record must fail the hash.

Motion, hops, and mirrors come after that hash is boring.
