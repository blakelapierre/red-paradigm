# Red Paradigm

A planetary engineering game on the Red. The campaign is years, not a finished blue sky. Native gas cannot make air a person can breathe. Peace is a climate you can hold. Transcendence is leaving.

Design notes are in [docs/](docs/). Start with [docs/Red_Paradigm_GDD_v0.2.md](docs/Red_Paradigm_GDD_v0.2.md) and [docs/Red_Paradigm_Climate_Physics.md](docs/Red_Paradigm_Climate_Physics.md).

## What runs

The council map is a climate tick, not the whole game.

- Survey pressure at four sites, from 610 Pa and an 11 km scale height.
- One sol of heat. The equator stays cold. A winter pole falls through the CO₂ frost point.
- A particle release. Optical depth 0.80, half gone in 40 sols. The CO₂ bar does not move.
- An encircling storm filed on sol 12. A witness who never gets that line fails the hash. By sol 32 the surface sun is about 2%.

`node_modules` is not in the repo. Install, then:

```bash
npm install
npm run dev
node --experimental-strip-types --test src/lib/climate/climate.test.ts
```

## Next slice

One former, one pit.

A dig writes a sparse integer override on the crust, not on the 5° climate cell. The op carries the hash of the cell before the edit. Spoil goes to inventory, and the dig is refused if it cannot be held. A second client with a bad before-hash rejects the pit. No rovers, hops, or mirrors until that hash is as boring as the storm hash.

## Not in this repo

Build caches, screenshots, and `node_modules`. Float motion is not hashed. Nothing here is a breathable-sky project.
