# Red Paradigm

A planetary engineering game on the Red. The campaign is years, not a finished blue sky. Native gas cannot make air a person can breathe. Peace is a climate you can hold. Transcendence is leaving.

Design notes are in [docs/](docs/). Start with [docs/Red_Paradigm_GDD_v0.2.md](docs/Red_Paradigm_GDD_v0.2.md) and [docs/Red_Paradigm_Climate_Physics.md](docs/Red_Paradigm_Climate_Physics.md).

## What runs

The council map is a climate tick and one former, not the whole game.

- Survey pressure at four sites, from 610 Pa and an 11 km scale height.
- One sol of heat. The equator stays cold. A winter pole falls through the CO₂ frost point.
- A paid particle loft. 5,000,000 kg of fines and 200,000 kWh. Five grams per square meter is optical depth 1, so one batch is a thin veil, not τ 0.80. It warms that climate cell until τ 0.60, the 15 K cap. It does not move the CO₂ bar. Half of it is gone in 40 sols. Past the cap, neither client lofts.
- An encircling storm filed on sol 12, for both clients. By sol 32 the surface sun is about 2%. Dropping that line would split the hash. This board does not drop it.
- One former cut. A 1 km cell, 2 m down. Spoil is 3,000,000,000 kg. The yard holds that once. The cut costs 2,000,000 kWh from a 1 km² array at the Low Cradle, about 1 kWh per cubic meter. One clear sol cannot pay. A storm sol pays tens of thousands. A refused cut spends nothing, for both clients. The climate cell does not move. A roofed kilometer is not cut.
- One mill batch. 100,000,000 kg of spoil and 1,000,000 kWh become 5,000,000 kg of fines. The other 95,000,000 kg stays as tailings. It is not deleted. The warehouse holds 50,000,000 kg. No spoil, no power, or a full warehouse, and neither client mills.
- One painted kilometer. 50,000 kg of fines, albedo 0.10 on that cell only. A 5° climate cell does not move. Both clients paint, or neither does.
- One tonne of ice. 50 kWh from a 1,000,000,000 kg lens at the cradle. The water is dirty: toxin 1000. An empty lens or an empty battery mines for neither client.
- Electrolysis of 36 kg of water for 200 kWh. It yields 4 kg of hydrogen and 32 kg of oxygen. The masses close.
- One Sabatier batch. 8 kg of hydrogen and 50 kWh become 16 kg of methane and 36 kg of water. The planetary CO₂ bar does not move.
- Burn 16 kg of methane with 64 kg of oxygen. Electricity is 8 kWh per kilogram of methane, 128 kWh, plus 36 kg of water back.
- Wash the tanks. 100 kg of water and 20 kWh clear toxin 1000. That water becomes brine. It is not clean water again. A clean tank refuses the wash.
- Roof one kilometer. 50,000 kg of fines and 100,000 kWh. Inside the vessel is 101,325 Pa. The climate cell's pressure does not move.
- One road. 20,000 kg of fines on one kilometer. The climate cell does not move.
- One berm. 20,000 kg of fines. The climate cell's temperature amplitude does not move.
- The crew. One kilogram of oxygen and three kilograms of water each sol. Short either one and the sol is owed. Nothing is spent on a debt.
- Roof upkeep. 10,000 kWh a sol, taken after the array is banked. If the battery cannot pay, the roof flags come down. The climate cell does not move.
- One gram of biomass a sol, under a roof, with clean water and no debt. It spends one kilogram of water. It does not touch the air.
- A collector. 30,000 kg of fines. On a stripping sol it returns a tenth of the particle mass that left the array's climate cell, up to the warehouse cap. A clear sol returns nothing. Five grams per square meter per optical depth is an order of magnitude.
- Array health. It starts at 1000/1000 and scales the array the board shows. A stripping sol takes 10 off after that sol is banked. Repair spends 10,000 kg of fines and puts 100 back.
- One kilopower. 10 kW for 24 hours is 240 kWh a sol, added after the array and not scaled by dust or panel health. It starts once, for both clients.
- Open methane. One percent leaves each sol, and at least one kilogram when the tank is under 100 kg. A standing roof holds the tank. The air mass does not move.
- Vessel heat. 10,000 kWh raises the inside by 1 K, up to 40 K above the yard. There is no heat without a roof. The climate cell does not move.
- A condenser. 50 kWh takes 1 kg of water from the column over one kilometer, about 10,000 kg at 10 grams per square meter. That figure is an order of magnitude. At 10,000 kg the order refuses. The air mass does not move, and this board does not invent a wind to refill the column.
- Electrolysis heat. About 40 kWh of the 200 does not stay in the hydrogen. Past 80 kWh the cell refuses. The open yard sheds 40 kWh a sol. A radiator costs 20,000 kg of fines and sheds 200.
- One turn hash over the climate record, the crust record, and the stocks. They stay together. The hash does not split.

`node_modules` is not in the repo. Install, then:

```bash
npm install
npm run dev
npm test
```

## Not in this cut

Rovers, hops, and mirrors. Build caches, screenshots, and `node_modules`. Float motion is not hashed. Nothing here is a breathable-sky project.

