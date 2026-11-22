# Red Paradigm

A planetary engineering game on the Red. The campaign is years, not a finished blue sky. Native gas cannot make air a person can breathe. Peace is a climate you can hold. Transcendence is leaving.

Design notes are in [docs/](docs/). Start with [docs/Red_Paradigm_GDD_v0.2.md](docs/Red_Paradigm_GDD_v0.2.md) and [docs/Red_Paradigm_Climate_Physics.md](docs/Red_Paradigm_Climate_Physics.md).

## What runs

The council map is a climate tick and one former, not the whole game.

- Survey pressure at four sites, from 610 Pa and an 11 km scale height.
- One sol of heat. The equator stays cold. A winter pole falls through the CO₂ frost point.
- A particle release. Optical depth 0.80, half gone in 40 sols. The CO₂ bar does not move.
- An encircling storm filed on sol 12. A witness who never gets that line fails the hash. By sol 32 the surface sun is about 2%.
- One former cut. A 1 km cell, 2 m down, written as an integer centimeter override. Spoil is 3,000,000,000 kg. The yard holds that once. A second cut is refused. A witness with a bad before-hash does not dig. The climate cell does not move. Two meters of pit changes floor pressure by less than 1 Pa.

`node_modules` is not in the repo. Install, then:

```bash
npm install
npm run dev
npm test
```

## Not in this cut

Rovers, hops, and mirrors. Build caches, screenshots, and `node_modules`. Float motion is not hashed. Nothing here is a breathable-sky project.

