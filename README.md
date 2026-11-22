# Red Paradigm

A planetary engineering game on the Red. The campaign is years, not a finished blue sky. Native gas cannot make air a person can breathe. Peace is a climate you can hold. Transcendence is leaving.

Design notes are in [docs/](docs/). Start with [docs/Red_Paradigm_GDD_v0.2.md](docs/Red_Paradigm_GDD_v0.2.md) and [docs/Red_Paradigm_Climate_Physics.md](docs/Red_Paradigm_Climate_Physics.md).

## What runs

The council map is a climate tick and one former, not the whole game.

- Survey pressure at four sites, from 610 Pa and an 11 km scale height.
- One sol of heat. The equator stays cold. A winter pole falls through the CO₂ frost point.
- A particle release. Optical depth 0.80, half gone in 40 sols. The CO₂ bar does not move.
- An encircling storm filed on sol 12, for both clients. By sol 32 the surface sun is about 2%. Dropping that line would split the hash. This board does not drop it.
- One former cut. A 1 km cell, 2 m down. Spoil is 3,000,000,000 kg. The yard holds that once. The cut costs 2,000,000 kWh from a 1 km² array at the Low Cradle, about 1 kWh per cubic meter. One clear sol cannot pay. A storm sol pays tens of thousands. A refused cut spends nothing, for both clients. The climate cell does not move.
- One turn hash over the climate record, the crust record, and the battery. They stay together. The hash does not split.

`node_modules` is not in the repo. Install, then:

```bash
npm install
npm run dev
npm test
```

## Not in this cut

Rovers, hops, and mirrors. Build caches, screenshots, and `node_modules`. Float motion is not hashed. Nothing here is a breathable-sky project.

