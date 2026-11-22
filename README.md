# Red Paradigm

A planetary engineering game on the Red. The campaign is years, not a finished blue sky. Native gas cannot make air a person can breathe. Peace is a climate you can hold. Transcendence is leaving.

Design notes are in [docs/](docs/). Start with [docs/Red_Paradigm_GDD_v0.2.md](docs/Red_Paradigm_GDD_v0.2.md) and [docs/Red_Paradigm_Climate_Physics.md](docs/Red_Paradigm_Climate_Physics.md).

## What runs

The council map is a climate tick and one former, not the whole game.

- Survey pressure at four sites, from 610 Pa and an 11 km scale height.
- One sol of heat. The equator stays cold. A winter pole falls through the CO₂ frost point.
- A paid particle loft. 5,000,000 kg of fines and 200,000 kWh. Five grams per square meter is optical depth 1, so one batch is a thin veil, not τ 0.80. It warms that climate cell. It does not move the CO₂ bar. Half of it is gone in 40 sols.
- An encircling storm filed on sol 12, for both clients. By sol 32 the surface sun is about 2%. Dropping that line would split the hash. This board does not drop it.
- One former cut. A 1 km cell, 2 m down. Spoil is 3,000,000,000 kg. The yard holds that once. The cut costs 2,000,000 kWh from a 1 km² array at the Low Cradle, about 1 kWh per cubic meter. One clear sol cannot pay. A storm sol pays tens of thousands. A refused cut spends nothing, for both clients. The climate cell does not move.
- One mill batch. 100,000,000 kg of spoil and 1,000,000 kWh become 5,000,000 kg of fines. The other 95 percent is not metal. The warehouse holds 50,000,000 kg. No spoil, no power, or a full warehouse, and neither client mills.
- One painted kilometer. 50,000 kg of fines, albedo 0.10 on that cell only. A 5° climate cell does not move. Both clients paint, or neither does.
- One tonne of ice. 50 kWh from a 1,000,000,000 kg lens at the cradle. The water is dirty: toxin 1000. An empty lens or an empty battery mines for neither client.
- Electrolysis of 36 kg of water for 200 kWh. It yields 4 kg of hydrogen and 32 kg of oxygen. The masses close.
- One Sabatier batch. 8 kg of hydrogen and 50 kWh become 16 kg of methane and 36 kg of water. The planetary CO₂ bar does not move.
- Burn 16 kg of methane with 64 kg of oxygen. Electricity is 8 kWh per kilogram of methane, 128 kWh, plus 36 kg of water back.
- Wash the tanks. 100 kg of water and 20 kWh clear toxin 1000. A clean tank refuses the wash.
- One turn hash over the climate record, the crust record, and the stocks. They stay together. The hash does not split.

`node_modules` is not in the repo. Install, then:

```bash
npm install
npm run dev
npm test
```

## Not in this cut

Rovers, hops, and mirrors. Build caches, screenshots, and `node_modules`. Float motion is not hashed. Nothing here is a breathable-sky project.

