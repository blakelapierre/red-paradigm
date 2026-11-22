# Red Paradigm — what to take from the existing code

Read of [meridian](https://github.com/blakelapierre/meridian) (`main`, `feeb7ca`), [facerace](https://github.com/blakelapierre/facerace) branch `modern` (`2fad353`, 11 Nov 2026), and the projects they sit on. Default `facerace` branch is still `rewrite2` from 2014. The live tech is `modern`.

This is a take-list, not a port plan. Nothing here replaces the GDD.

## Lineage

```text
system_creator (2017)     educational n-body, browser
gravity-game (2019)       gulp scaffold, no sim
gravity-simulation (2023) empty repo
        |
nbody-raycaster (2026)    canvas raycaster + leapfrog
        |  pin 6506c5e  (merges on overlap)
        |  HEAD bc803074 (1 Nov 2026: momentum exchange)  <-- not in the pin
        v
meridian                  living-globe sim, ~18k lines, 102 modules
        |                 engine copy + crust + P2P + perception
        v
facerace modern           vendors that raytracer, adds contact.ts from HEAD
orbital-mass (20 Nov)     strategy sketch: orders, LOS, checkpoint root
```

## What each one actually is

| Repo | Useful core | Not a Red Paradigm |
|---|---|---|
| **nbody-raycaster** | `Mass`, leapfrog `tick`, `cast` / sphere hit, octree for many spheres | Toy sun + planets. Camera is a flycam. Overlap used to absorb the smaller body |
| **meridian** | Port of that engine, integer crust, signed terrain ops, WebRTC rooms, interest/perception, software + WebGL2 | First-person war on a 320 km fantasy world (Cairn). Pre-alpha Atoll, not a 4X |
| **facerace `modern`** | Same picture, momentum bumps, terrain speed, adaptive frame pace, torrent room codes, garage parts confirmed by a local ledger | Kart race, faces, FaceCoin. `rewrite2` is the 2014 Angular/Three client |
| **orbital-mass** | High-level click orders over a continuous sim, compact state-root checkpoint | Two-player HTML demo. Mass comes from mock BCH deposits |
| **system_creator** | “Change a number, watch the system” as the educational UI ancestor | 2017 bundle. Do not port |
| **gravity-game / gravity-simulation** | Nothing to salvage | Scaffold and an empty repo |

## Take

### 1. Physics, but the later contact, and Mars numbers

From `src/engine` (the pinned pen): one central mass, pairwise gravity, control in `acceleration`, gravity only written by the integrator. Units are meters, kilograms, seconds. Characters and structures use collision policy `separate` or `event`. Nobody is absorbed into the planet. Float motion is ephemeral. Digs, claims, and kills are not.

**Do not vendor the pin as-is.** `engine.lock.json` is `6506c5e`. That pen merges overlapping bodies. [bc803074](https://github.com/blakelapierre/nbody-raycaster/commit/bc803074d856ee2d266783c2c54ff11832802de7) (“Exchange momentum on contact instead of merging bodies”) is the current raycaster, and FaceRace already copied it into [`src/game/contact.ts`](https://github.com/blakelapierre/facerace/blob/modern/src/game/contact.ts) (`bumpSpheres` / `bumpBodies`, restitution 0.72). Rovers and landers need that. Debris may still coalesce; units and bases must not.

Retune the constants. Cairn is `R = 320 km` and `g = 9.81` so the core mass is `9.81 * R² / G`. The Red is the real body: radius about 3390 km, surface gravity about 3.71 m/s². Same formula, different numbers. Do not ship a 72-minute day. A sol is about 24.6 h, and dust optical depth is what kills solar, not a toy terminator used as a weapon.

### 2. One ray for the picture and for line of sight

`cast` is both the frame and the gameplay trace. That is the right sensor model:

- Fog is not a bitmap the host paints. If no sensor can know about a unit, its transform is not in the packet (Meridian interest filtering, `docs/perception.md`, `docs/concept.md`).
- A probe team or the Sensor Web Array is an explicit interest grant into someone else’s area. That is Alpha Centauri’s “see into their territory, still under fog” without sending the whole map.
- Shots, artillery correction, and “can this former see the ice” call the same tests, then quantize (Meridian uses integer centimeters) so two peers can disagree about a float and still agree about a certified hit.

The strategic map stays the heightfield / Mercator already drawn. The raycaster is the zoom: a base, a canyon road, a convoy. Do not raytrace the planet as the main view. Default internal resolution in the pen is 160×90. Fine for a ground camera, wrong for the council map.

### 3. Durable ground is an integer log, not a mesh

`docs/crust.md` and `src/sim/crust.js` / `src/net/terrain.js`:

- Untouched ground is a pure function of the seed. Only overrides are stored.
- An edit is a list of integer writes plus `before_hash` (BLAKE3 over seed, cell, sparse overrides). Witnesses apply those integers or reject the op. They do not rebuild a brush from a float camera.
- Spoil is an inventory item. If you cannot hold it, the dig is refused.
- Slump is a cheap integer erosion pass, certified like any other edit.

That pattern is the terraforming save. The **scale is not**. Voxels are 25 cm, reach is 4 m, chunks are 16 m. That is a person with a shovel. Formers and regional climate work in hundreds of meters to kilometers.

Keep the contract, coarsen the grid:

| Layer | Grid | What lives there |
|---|---|---|
| Seed | Real elevation (MOLA-style), internal survey ids | The starter map. Free when unmodified |
| Strategic crust | On the order of 100 m–1 km | Roads, pits, berms, greenhouse footprints, albedo, local pressure caps |
| Zoom crust | Meridian’s 25 cm brush | Only inside a base or a dig you are standing in |

Atmosphere, ice inventory, and perchlorate are **not** voxels and must not be implemented as float water “for now.” Crust.md already refuses that. They are regional stocks on the strategic grid, which is the sim we have not written yet.

### 4. Multiplayer that survives a dead host

This is the Alpha Centauri failure (late game, one process, save every turn) and the part of Meridian that is actually aimed at it.

- A lighthouse or public WebTorrent tracker only introduces peers (`src/net/signal-torrent.js`, `src/net/room.js`). Play is WebRTC. Neither socket decides a hit, a dig, or a death.
- Industry, digging, and claims are signed ops on a per-cell log. A log that does not hash is rejected.
- FaceRace room codes (`pit`, or empty for solo bots) are the LAN-party join. `localhub.js` covers same-machine tests.
- `orbital-mass` checkpoints a compact state root instead of shipping every float. That is the turn snapshot: ownership, stocks, project progress, crust hash. Not a blockchain requirement.
- The 50-client scale bench already drops extra clients to sim-only because browsers cap live WebGL contexts. A strategic tick should be that cheap path by default. The picture is optional.

Float physics stays off the hash. The match is the op log. A crashed client reconnects by replaying ops, it does not end the table.

### 5. Pace, terrain speed, modular parts

Small modules, worth lifting rather than rewriting:

- **Pace.** Meridian `src/render/pace.js` and FaceRace `src/game/pace.ts`: resolution and frame rate step together, floor around 12 fps, sharpen back when the device can. Crossfade on a resolution change. This is how a ground view stays up when the strategic sim is also running.
- **Terrain speed.** FaceRace `terrain.ts`: grass, sand, rock, water as speed multipliers. Same table for regolith, duricrust, ice, dust, and slope. Formers and rovers read it. It is not a physics engine.
- **Garage.** FaceRace parts (wing, rudder) do nothing until a block confirms they fit the selected chassis. That is the unit designer in miniature: chassis, power, function, special, then a confirmed design. Do not take the mechanic-for-hire, FaceCoin, or the webcam helmet.

### 6. Orders, not possession

Orbital-mass and the Meridian command chair agree on the verb Red Paradigm should use. You click a destination, a former route, a dig. You do not pilot the unit. The chair is furniture: lose it and you are looking at the map again, the army does not despawn.

Meridian’s three clocks (hands / strike / dominion) map cleanly if **dominion is the default**. Hands are the optional raycaster zoom. Strikes are battles, not the campaign.

Economy picture to keep, with one correction. Metal and energy stream only along a logistics graph (roads, pipes, cables). Past the last road, crates move. Cutting a road beats winning a duel. There is no teleport auction.

The correction: Meridian refuses a global market. You liked cornering one. The Planetary Resource Exchange is a priced board whose goods still have to move. Price gaps between basins are the game. The paradigm removes friction. It does not delete distance.

### 7. The educational habit, from the old project

`system_creator` (2017, [blakelapierre.github.io/system_creator](https://blakelapierre.github.io/system_creator)) is a solar-system toy: edit parameters, watch the integration. No game rules worth porting, and `handler.js` is a 1.6 MB bundle. What it contributes is the UI stance already in the GDD. Insolation, gravity, ice grade, and atmospheric mass are numbers the player can read, not hidden modifiers. `gravity-game` (`init_gui`, 2019) and empty `gravity-simulation` add nothing on top of that.

`facerace` `rewrite2` is phone tilt, keyboard, Three.js, and an early WebRTC room. `modern` already kept the room and threw out Angular. Do not mine 2014 for netcode.

## Do not take

- Cairn’s radius, Earth gravity, 72-minute day, Holds / Hosts / Veil as the factions, or “no global win.” The six factions and the victory set (including peace and transcendence) stay.
- First-person combat, strikes, nests, and resonance as the core loop.
- A 25 cm voxel planet.
- Merge-on-overlap from the pinned pen.
- Ashen Hold (second client under `hold/`: skills, ravens, fantasy towns).
- BCH / CashTokens as required infrastructure. FaceRace Blocks and orbital-mass deposits are optional later, off by default. The checkpoint and the “design must be confirmed” rule are the useful pieces.
- Widgets that leak another faction’s economy. Probes and the sensor web earn that view.
- Infinite metal makers, commander-death defeat, and a flat lobby map.

## Suggested stack, when you start the sim

1. Strategic state: seed heightfield + sparse integer overrides + regional stocks (energy, water, oxygen, methane, regolith, organics, research).
2. Authority: signed ops and chunk hashes from Meridian. Turn snapshot = orbital-mass state root.
3. Session: FaceRace/Meridian rooms over trackers, solo if none answer.
4. Motion, only where a unit is actually moving: leapfrog plus `contact.ts` bumps, `separate` against the crust, Mars g.
5. View: council map first. Raycaster second, sharing `cast` with sensors, paced like FaceRace.

The pin move (6506c5e → bc803074, or just depend on `contact.ts`) should happen before any vehicle work. Everything else can wait until a single-player former can dig a hashed pit and another client can reject a bad hash.
