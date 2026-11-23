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
- A cable. The cut is free to run on the cradle kilometer, the center of the Low Cradle climate cell, not the survey pin. Anywhere else needs a line, one tonne of fines per kilometer from the cradle array. One line is remembered. The climate cell does not move.
- One mill batch. 100,000,000 kg of spoil and 1,000,000 kWh become 5,000,000 kg of fines. The other 95,000,000 kg stays as tailings. It is not deleted. The warehouse holds 50,000,000 kg. No spoil, no power, or a full warehouse, and neither client mills.
- Return one centimeter of tailings to the hole. That is 15,000,000 kg at 1,500 kg/m³. The yard can hold that much again. It is not a second cut. The climate cell does not move.
- One painted kilometer. 50,000 kg of fines, albedo 0.10 on that cell only. A 5° climate cell does not move. Both clients paint, or neither does.
- One tonne of ice. 50 kWh from a 1,000,000,000 kg lens at the cradle. The water is dirty: toxin 1000. Below 612 Pa the order refuses. That site is vapor, and this board will not bottle it. An empty lens or an empty battery mines for neither client.
- Electrolysis of 36 kg of water for 200 kWh. It yields 4 kg of hydrogen and 32 kg of oxygen. The masses close. Toxin 1000 refuses the split. Wash the tanks first.
- One Sabatier batch. 8 kg of hydrogen, 44 kg from the CO2 bottle, and 50 kWh become 16 kg of methane and 36 kg of water. The masses close. The planetary CO₂ bar does not move.
- A CO2 bottle. 30 kWh sets aside 44 kg, the mass one Sabatier batch will ask for. The bottle holds 440 kg. The air mass does not move.
- Burn 16 kg of methane with 64 kg of oxygen. Electricity is 8 kWh per kilogram of methane, 128 kWh, plus 36 kg of water back.
- Wash the tanks. 100 kg of water and 20 kWh clear toxin 1000. That water becomes brine. It is not clean water again. A clean tank refuses the wash.
- Roof one kilometer. 50,000 kg of fines and 100,000 kWh. Inside the vessel is 101,325 Pa. The climate cell's pressure does not move.
- One road. 20,000 kg of fines on one kilometer. The climate cell does not move.
- One berm. 20,000 kg of fines. The climate cell's temperature amplitude does not move.
- The crew. One kilogram of oxygen and three kilograms of water each sol. Short either one and the sol is owed. Nothing is spent on a debt. A breathed sol puts one kilogram of CO2 in the cabin. That is the order of the oxygen they took, not a new atmosphere.
- Vent one kilogram of cabin CO2 for 5 kWh. The air mass does not move. At 5 kg left in the cabin, the beds do not grow, and a holding run returns to zero.
- Roof upkeep. 10,000 kWh a sol, taken after the array is banked. If the battery cannot pay, the roof flags come down and a holding run returns to zero. The climate cell does not move.
- One gram of biomass a bed a sol, under a roof, with clean water and no debt, and cabin CO2 under 5 kg. Water is one kilogram a bed, or that sol grows nothing. It does not touch the air.
- Food. The crew eats 500 g a sol, or the sol is short. Eat runs before grow. Twenty-five lit beds put 500 g back, so the next sol can eat and still end with a ration in store. The sol that fills an empty store is still short. Twenty-four lit beds do not hold that.
- A lamp. 20,000 kg of fines, under a roof. Each lit bed grows 20 g. The sol bills 10 kWh a bed after the roof. If the battery cannot pay, nothing is spent and the beds grow the dark gram. Twenty-five dark beds are 25 g.
- A bed. The yard starts with one. Another costs 200,000 kg of fines, and only under a roof. Twenty-four added beds are 4,800,000 kg. One mill batch is 5,000,000 kg and leaves 200,000 kg, which the cap will not spend. The twenty-sixth bed is refused for both clients. The climate cell does not move.
- A collector. 30,000 kg of fines. On a stripping sol it returns a tenth of the particle mass that left the array's climate cell, up to the warehouse cap. A clear sol returns nothing. Five grams per square meter per optical depth is an order of magnitude.
- Array health. It starts at 1000/1000 and scales the array the board shows. A stripping sol takes 10 off after that sol is banked. Repair spends 10,000 kg of fines and puts 100 back.
- One kilopower. 10 kW for 24 hours is 240 kWh a sol, added after the array and not scaled by dust or panel health. It starts once, for both clients.
- Open methane. One percent leaves each sol, and at least one kilogram when the tank is under 100 kg. A standing roof holds the tank. The air mass does not move.
- Open water. The same one percent, and at least one kilogram. A standing roof holds it. It does not become weather.
- Open hydrogen. Ten percent a sol, and at least one kilogram. Faster than methane, as an order of magnitude, not a permeability. A standing roof holds it.
- Open oxygen. One percent a sol, and at least one kilogram. It is a cryogen, not a sky. A standing roof holds it.
- Vessel heat. 10,000 kWh raises the inside by 1 K, up to 40 K above the yard. There is no heat without a roof. The climate cell does not move.
- A condenser. 50 kWh takes 1 kg of water from the column over one kilometer, about 10,000 kg at 10 grams per square meter. That figure is an order of magnitude. At 10,000 kg the order refuses. The air mass does not move, and this board does not invent a wind to refill the column.
- Electrolysis heat. About 40 kWh of the 200 does not stay in the hydrogen. Past 80 kWh the cell refuses. The open yard sheds 40 kWh a sol. A radiator costs 20,000 kg of fines and sheds 200.
- Cabin oxygen. 10 kWh meters 28 kg into a 100 m³ cabin. That is about 21 kPa. There is no nitrogen buffer. This is not breathable air. Each sol the seal loses 1 kg. It is not returned to the tank, and it does not move the climate cell.
- The kilometer holds. A sol counts when a roof is up, the cabin still has 28 kg after the seal, the crew is not in debt, and the store still has 500 g. A miss zeros the run. Ten such sols is the mark. Both clients reach it together, or the board does not say so. The air mass stays on solar longitude. This is not a sky.
- A field manual. Each order says what it does, what it costs, what it refuses, and what it does not move. The figures are the constants the board spends.
- Standing orders. The player ranks Power, Cut, Mill, Shelter, Ration, Water, and Fuel. Those start on. Ration plants one bed. Each sol the yard tries the list once, if the player leaves it on. A refusal spends nothing and does not stop the next aim. Column, veil, ground, and the array start off. Heat, burn, the cable, and the dump stay on the buttons.
- Keep. Once the floor is a roof, a lamp, and twenty-five beds, the list stops cutting, milling, and lofting. While the hold is open it pays the roof and the beds before a dig. A sun under the roof bill drops the roof and does not spend the short battery. Shelter can raise it again. The buttons stay.
- The storm. A run that never misses while dust is stripping is marked when the storm ends. A later miss does not clear that mark. The board says the kilometer held through the storm. The air mass did not change.
- One turn hash over the climate record, the crust record, and the stocks. They stay together. The hash does not split.

`node_modules` is not in the repo. Install, then:

```bash
npm install
npm run dev
npm test
```

## Not in this cut

Rovers, hops, and mirrors. Build caches, screenshots, and `node_modules`. Float motion is not hashed. Nothing here is a breathable-sky project.

