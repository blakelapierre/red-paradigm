# Red Paradigm – Rough Starter Map Data
**Basis:** Real geography of the Red. Underlying data uses standard survey names for implementation clarity.  
**In-game naming:** Factions use their own names. The “official” or default map labels can be neutral or historical; each faction’s UI, logs, and dialogue prefer their terminology. Occasional references to older names (“what the first probes called Valles Marineris”) are fine for flavor.

## Major Regions & Rough Characteristics

| Region (Survey Name) | Common Faction Alternatives | Approx. Location | Terrain / Notes | Ice / Water | Other Traits | Gameplay Hooks |
|----------------------|-----------------------------|------------------|-----------------|-------------|--------------|----------------|
| **Northern Lowlands** (Vastitas Borealis, Arcadia, Utopia, Amazonis) | The Open Plains, The Ice Fields, The Northern Reach, Helios Corridor | North of dichotomy | Broad smooth plains, lower elevation | Good mid-latitude ice (esp. Arcadia-style) | Flat construction | Early industry, ice access |
| **Tharsis Rise / Olympus Mons** | The Great Bulge, The Forge Heights, Mons Ares, The High Volcanics | Equatorial west | Massive volcanic province, extreme elevation | Limited near-surface ice | Mineral-rich | High-ground industry, later energy |
| **Valles Marineris** | The Great Rift, The Canyon, Mariner Trench, The Shelter Cut, Prometheus Scar | Equatorial | Enormous canyon system | Some permafrost / layered deposits | Scientific & defensive value | Research, shelter, logistics challenge |
| **Hellas Planitia** | The Deep Basin, Hellas Hollow, The Low Cradle, Gaia’s Bowl | Southern mid-latitudes | Deepest impact basin | Possible ice; pressure advantage | Lower elevation | Landing bonus, biology potential |
| **Arabia Terra / Meridiani** | The Ancient Uplands, The Mineral Fields, The Old Craterlands | Equatorial-north | Cratered, hydrated minerals | Minerals > free ice | Science-rich | Research, soil chemistry |
| **Elysium Planitia** | The Eastern Plains, The Quiet Volcanics, Autonomist Flats | Equatorial-east | Volcanic plains, relatively flat | Mixed ice potential | Good insolation | Balanced sites |
| **Polar regions** | The Ice Caps, The Frozen Poles, The High Cold | High latitudes | Permanent/seasonal caps | Abundant ice | Extreme cold, poor insolation | Specialized late ice mining |
| **Dichotomy boundary** | The Scarp, The Great Divide, The Borderlands | Mid-latitude transition | Scarps, chaos, channels | Variable | Natural borders | Chokepoints, mixed terrain |

## Fleshed-Out Factions & Suggested Default Landing Sites
(Underlying locations stay the same; names below are examples of what that faction might call their site.)

| Faction | Ideology | Default Site (Survey) | Faction Name for Site | Why | Starting Progress (if early) |
|---------|----------|-----------------------|-----------------------|-----|------------------------------|
| **Ares Industrial** | Heavy extraction, rapid scaling | Arcadia / Amazonis Planitia | The Works, Open Extract, Northern Forge | Flat + ice for industry | Earliest: 2 bases, running ISRU, extra formers |
| **Helios Resource** | Markets, propellant, trade | Utopia or Elysium edge | Helios Station, The Depot, Volatiles Reach | Ice + logistics plains | Early: propellant stockpile, trade post |
| **Prometheus Collective** | Science, sensors | Valles Marineris or Arabia | The Rift Lab, Prometheus Deep, Ancient Archive | Science density, shelter | Mid: labs, sensor net, tech head-start |
| **Gaia Stewardship** | Ecology, soil, biology | Hellas rim or mid-latitude | The Cradle, Low Garden, Steward’s Basin | Lower elevation, biology space | Mid-late: soil work, small greenhouses |
| **Vanguard Compact** | Security, defense | Tharsis foothills / high ground | The Rampart, High Watch, Forge Bastion | Defensible overlook | Late: fortified base, military units |
| **Autonomist Path** | Automation, outward | Elysium or northern secondary | Seed Plain, The Bootstrap, Quiet Start | Balanced for automation | Last: fresh starter package |

**Implementation notes:**
- Map data and pathfinding use stable internal IDs / survey names.
- Display names, tooltips, and faction logs pull from a per-faction name table.
- Neutral / “historical survey” view available as a toggle.
- Free-pick and random modes ignore suggested sites but still support faction renaming of whatever they settle.

This keeps the real geography for accuracy and education while letting factions feel distinct in how they talk about the Red.