import {
  AEROSOL_CAP_K,
  AEROSOL_HALFLIFE_SOLS,
  AEROSOL_K_PER_TAU,
  ALBEDO_GROUND,
  cellLat,
  latIndexOf,
  P_DATUM_PA,
  STORM_DURATION,
  STORM_PEAK_TAU_MILLI,
  STORM_SOL,
  SOLS_PER_YEAR,
  TRIPLE_P_PA,
} from "../climate/constants.ts";
import { createWorld } from "../climate/model.ts";
import { CELL_M, CUT_KG, DIG_DZ_CM, KG_PER_CM, YARD_KG } from "../crust/crust.ts";
import { KG_PER_KM } from "./cable.ts";
import { CABIN_CAP_K, CABIN_KWH } from "./cabin.ts";
import { COLLECTOR_FINES_KG } from "./collector.ts";
import { CO2_BATCH_KG, CO2_CAP_KG, CO2_KWH } from "./compress.ts";
import { COLUMN_KG, CONDENSER_KWH, DRAW_KG } from "./condenser.ts";
import { CREW_CO2_KG, CREW_O2_KG, CREW_WATER_KG } from "./crew.ts";
import { BURN_CH4_KG, BURN_KWH_PER_KG, BURN_O2_KG, BURN_WATER_KG } from "./burn.ts";
import { RATION_G } from "./food.ts";
import { HEALTH_FULL, HEALTH_STORM_LOSS, REPAIR_FINES_KG, REPAIR_HEALTH } from "./health.ts";
import { ICE_LENS_KG, MINE_KG, MINE_KWH } from "./ice.ts";
import { KILOPOWER_KWH } from "./kilopower.ts";
import { BERM_FINES_KG } from "./berm.ts";
import { BED_CAP, BED_FINES_KG, RATION_BED_FINES_KG } from "./bed.ts";
import { HELD_MARK } from "./hold.ts";
import { TURN_SOLS } from "./year.ts";
import { LAMP_BED_KWH, LAMP_FINES_KG, LAMP_G } from "./lamp.ts";
import { CABIN_LEAK_KG, CABIN_M3, CABIN_O2_KG, CABIN_O2_PA, METER_KWH } from "./meter.ts";
import { FINES_CAP_KG, MILL_FINES_KG, MILL_KWH, MILL_SPOIL_KG, MILL_TAILINGS_KG } from "./mill.ts";
import { PAINT_ALBEDO_MILLI, PAINT_FINES_KG, PAINT_KWH } from "./paint.ts";
import { ARRAY_M2, BATTERY_CAP_KWH, CRADLE, CUT_KWH, arrayKwh } from "./power.ts";
import { BARE_SHED_KWH, HEAT_LIMIT_KWH, RADIATOR_FINES_KG, RADIATOR_SHED_KWH, SPLIT_HEAT_KWH } from "./radiator.ts";
import { GRAMS_PER_M2_PER_TAU, LOFT_KWH, TAU_CAP_MILLI, tauMilliFromFines } from "./release.ts";
import { ROAD_FINES_KG } from "./road.ts";
import { ROOF_FINES_KG, ROOF_KWH, VESSEL_PA } from "./roof.ts";
import { SABATIER_CH4_KG, SABATIER_H2_KG, SABATIER_KWH, SABATIER_WATER_KG } from "./sabatier.ts";
import {
  ELECTROLYSIS_H2_KG,
  ELECTROLYSIS_KWH,
  ELECTROLYSIS_O2_KG,
  ELECTROLYSIS_WATER_KG,
} from "./electrolysis.ts";
import { ROOF_UPKEEP_KWH } from "./upkeep.ts";
import { STALE_CO2_KG, VENT_KG, VENT_KWH } from "./vent.ts";
import { WASH_KWH, WASH_WATER_KG } from "./wash.ts";

export type ManualEntry = {
  id: string;
  group: string;
  title: string;
  does: string;
  costs: string;
  refuses: string;
  doesNot: string;
};

function commas(n: number | bigint): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const CLEAR_SOL_KWH = arrayKwh(createWorld(), CRADLE);
const CRADLE_TAU_MILLI = tauMilliFromFines(MILL_FINES_KG, cellLat(latIndexOf(CRADLE)));

function note(
  id: string,
  group: string,
  title: string,
  does: string,
  costs: string,
  refuses: string,
  doesNot: string,
): ManualEntry {
  return { id, group, title, does, costs, refuses, doesNot };
}

/** The field manual. Every figure is a constant the board already spends. */
export const MANUAL: readonly ManualEntry[] = [
  note(
    "first",
    "Start",
    "Order of work",
    `The yard starts with an empty battery, no fines, and no water. A click that cannot pay is a refusal, and the stocks do not move. That is why the new buttons look idle.

1. Start the kilopower, or bank sols. One clear sol at the cradle banks ${commas(CLEAR_SOL_KWH)} kWh. A cut wants ${commas(CUT_KWH)} kWh. The battery holds ${commas(BATTERY_CAP_KWH)} kWh, so two clear sols pay the cut. A third sol is clipped by the cap. The reactor adds ${commas(KILOPOWER_KWH)} kWh a sol, and dust does not scale it.

2. Dig 2 m on the Low Cradle. The free kilometer is the climate cell the board has selected. The survey pin sits off that center.

3. Mill a batch. ${commas(MILL_SPOIL_KG)} kg of spoil and ${commas(MILL_KWH)} kWh become ${commas(MILL_FINES_KG)} kg of fines. The other ${commas(MILL_TAILINGS_KG)} kg stays as tailings.

4. Fines pay a coat, a roof, a road, a berm, a lamp, a line, a collector, a radiator, and a repair.

5. Mine ice only at or above ${TRIPLE_P_PA} Pa. The water is dirty. Wash it before you electrolyze.

6. Bottle CO2, run one Sabatier batch, and keep the methane under a roof or it boils off.

Both clients take an order, or neither does.`,
    "Nothing. This page does not spend.",
    "Nothing. It is a note.",
    "Reading it does not move a climate cell, and it does not make breathable air.",
  ),
  note(
    "sol",
    "Start",
    "One sol",
    "Closes one sol on both clients, in this order: bank the array, add the reactor if it is on, abrade the panels if a storm is stripping, salvage fines if a collector is up, draw the crew, bill the roof, boil open methane, boil open water, vent open hydrogen, vent open oxygen, pay the lamps, eat, grow, leak the cabin seal, mark the hold, mark the storm, shed heat.",
    `A clear cradle sol at the start banks ${commas(CLEAR_SOL_KWH)} kWh from the ${commas(ARRAY_M2)} m² array, scaled by panel health. The reactor, if it is on, adds ${commas(KILOPOWER_KWH)} kWh after that. Ten sols is the same close, ten times.`,
    "A sol always closes. It does not refuse.",
    "The air mass is a function of solar longitude only. A sol does not spend it. If standing orders are on, the list runs after the close.",
  ),
  note(
    "year",
    "Start",
    "One year",
    `A year is ${SOLS_PER_YEAR} sols of solar longitude. Ls starts at 240°. It has come back around when the angle traveled is a full turn. That is not an integer count of sols, and it is not ${TURN_SOLS * 24} sols. A turn is ${TURN_SOLS} sols. Twenty-three turns have not come around. Twenty-four turns have gone past, and they are still not a year. One turn on the board banks ${TURN_SOLS} sols.`,
    "Nothing. The clock does not spend.",
    "Nothing.",
    "The board does not call 669 sols a year. A turn does not move a climate cell by itself. The air mass stays on solar longitude.",
  ),
  note(
    "neighbor",
    "Start",
    "The next kilometer",
    `N, E, S, and W step one kilometer, ${CELL_M} m. One step stays in the climate cell. A far step does not. The cursor is not in the turn hash. A cut there needs a line from the cradle array, unless it is already the cradle center. The yard holds one pit, ${YARD_KG.toString()} kg. A second pit is refused while that spoil is still in the yard. A roof on the neighbor spends the same fines and the same battery. At the table the list stays on that yard's home kilometer. The step buttons are this window's cursor.`,
    "Whatever the order on that kilometer already costs. The step itself spends nothing.",
    "No line, no neighbor cut. A full yard, no second pit. Off the grid, the step does nothing.",
    "One kilometer does not move a 5° climate cell. The cursor does not make breathable air. The Works is still the other yard, not a cursor.",
  ),
  note(
    "standing",
    "Start",
    "Standing orders",
    `The player ranks general aims. Power, Cut, Mill, Shelter, Ration, and Fuel start on, and so does Water. Column, Veil, Ground, and Array start off. If the yard is set to follow, each sol tries the list once, top to bottom, after the array is banked. Work the list now does one pass without closing a sol.

Power starts the kilopower. Cut digs 2 m on the kilometer the map has selected. Mill runs one batch. Shelter roofs that kilometer, then meters the cabin, vents stale CO2, and raises a lamp and a radiator. Ration plants one bed. Water mines one tonne if the column is at least ${TRIPLE_P_PA} Pa, then washes dirty tanks. Fuel bottles 44 kg, electrolyzes one batch, then runs one Sabatier batch. Column draws 1 kg. Veil lofts one batch on the selected climate cell. Ground paints, then lays a road, then raises a berm. Array raises a collector, then repairs if health is short.

One try each. A refusal spends nothing and does not stop the next aim.`,
    "Whatever those orders already cost. The list is not a discount.",
    "An aim that is off is skipped. An aim that cannot pay is refused for both clients.",
    "Heat, burn, the cable, and the dump stay on the buttons. The list does not move a climate cell except the veil, and only when that aim is on. The priorities themselves are not in the turn hash. The stocks they change are.",
  ),
  note(
    "doing",
    "Start",
    "What the list is doing",
    `The list tries to make one kilometer hold. The order line names the one gap: roof, lamp, beds, water for the next sol, oxygen, the cabin meter, a stale cabin, crew debt, or a short store. Once the floor is ${BED_CAP} beds under a lamp and a roof, the list stops cutting, milling, and lofting. While the hold is open, the roof and the beds are tried before a dig. A full water tank is not mined. Oxygen is split only when the crew or the meter is short, and not when the yard cannot reject the heat. Run stops when the hold reaches ${HELD_MARK} sols, or when a sol spends nothing.`,
    "Whatever those orders already cost.",
    "An aim that is off is skipped. A refusal spends nothing.",
    "The list does not make breathable air. It does not move a climate cell unless the veil is on.",
  ),
  note(
    "yards",
    "Start",
    "Two yards",
    "One window is one yard. The Low Cradle and the Works share one climate and do not share a warehouse. Each yard seals its own list. The sol does not close until both seals are in. A list cannot spend the other yard, and it cannot be pointed at the other yard's home kilometer. The other window sees held or dark, not the stocks. Sit at the table only if the other yard is another window. One window, not at the table, still runs this board alone.",
    "Each yard pays its own orders. The climate steps once.",
    "A seal with no partner waits. A table whose hash does not match is refused.",
    "This is not two seats at one board. It is not combat. A loft writes the shared climate for both copies, or for neither. It does not make breathable air.",
  ),
  note(
    "cell",
    "Start",
    "Climate cell and kilometer",
    `The map is 5° cells. The former works one kilometer, ${commas(CELL_M)} m on a side. The Low Cradle button selects the climate cell. Dig, paint, roof, road, berm, and wire use the kilometer at that cell's center.`,
    "Nothing.",
    "Nothing.",
    "A 2 m pit, one painted kilometer, a roof, a road, a berm, a cable, a lamp, or a cabin meter does not move a 5° climate cell.",
  ),
  note(
    "kilo",
    "Power",
    "Start the kilopower",
    `Puts a reactor on both clients. Each later sol adds ${commas(KILOPOWER_KWH)} kWh after the array is banked. That is 10 kW for 24 hours. A sol is longer. The figure is the day, not the sol.`,
    "No fines and no battery. It starts once.",
    "A second start is refused. The first one already spent nothing.",
    "Dust and panel health do not scale it. It is not a cut, and it is not a sky.",
  ),
  note(
    "array",
    "Power",
    "Cradle array",
    `The array is ${commas(ARRAY_M2)} m² at the Low Cradle, ten thousand times the 100 m² survey panel, at the same efficiency. The board shows this sol's credit before it is banked.`,
    "The array is already there. It is not an order.",
    `The battery refuses credit past ${commas(BATTERY_CAP_KWH)} kWh.`,
    "A storm does not destroy the array. It cuts the sunlight, and a stripping sol wears the health.",
  ),
  note(
    "repair",
    "Power",
    "Repair the array",
    `Health starts at ${HEALTH_FULL} / ${HEALTH_FULL} and scales the array the board shows. A stripping sol takes ${HEALTH_STORM_LOSS} after that sol's credit is banked. Repair puts ${REPAIR_HEALTH} back, and it does not pass ${HEALTH_FULL}.`,
    `${commas(REPAIR_FINES_KG)} kg of fines. No electricity.`,
    "No fines, and neither client repairs.",
    "Repair does not move the climate cell. It does not refund a sol already banked at the old health.",
  ),
  note(
    "dig",
    "Ground",
    "Dig 2 m",
    `One cut. ${-DIG_DZ_CM} cm down, one kilometer. Spoil is ${commas(CUT_KG)} kg at 1,500 kg/m³. The yard holds ${commas(YARD_KG)} kg, which is one cut and not two. About 1 kWh per cubic meter.`,
    `${commas(CUT_KWH)} kWh from the battery. The cradle kilometer needs no line.`,
    "An empty battery, a roof already standing on that kilometer, or no line from the cradle array. A second cut is refused while the yard is full. A refusal spends nothing.",
    "The pit is not a new atmosphere. The climate cell's pressure does not move.",
  ),
  note(
    "mill",
    "Ground",
    "Mill a batch",
    `Mills ${commas(MILL_SPOIL_KG)} kg of spoil. Five percent becomes fines. The rest is tailings, and it is not deleted.`,
    `${commas(MILL_KWH)} kWh and ${commas(MILL_SPOIL_KG)} kg of spoil. The warehouse holds ${commas(FINES_CAP_KG)} kg of fines, ten batches.`,
    "No spoil, no power, or a full warehouse. Neither client mills.",
    "Fines are not a climate. They are a stock.",
  ),
  note(
    "dump",
    "Ground",
    "Return 1 cm of tailings",
    `Puts ${commas(KG_PER_CM)} kg back into a hole, one centimeter. The yard can hold that much again.`,
    `${commas(KG_PER_CM)} kg of tailings, and a hole that can take a centimeter.`,
    "No tailings, or no hole. Neither client fills.",
    "It is not a second cut. The climate cell does not move.",
  ),
  note(
    "paint",
    "Ground",
    "Paint this kilometer",
    `A dark coat on one kilometer. Albedo ${ (PAINT_ALBEDO_MILLI / 1000).toFixed(2) }, against ground albedo ${ALBEDO_GROUND.toFixed(2)}. Fifty grams per square meter.`,
    `${commas(PAINT_FINES_KG)} kg of fines and ${commas(PAINT_KWH)} kWh.`,
    "Already painted, or short fines, or short power.",
    "A 5° climate cell does not take that albedo. One painted kilometer is not a new energy balance.",
  ),
  note(
    "road",
    "Ground",
    "Lay a road",
    "A flag on one kilometer.",
    `${commas(ROAD_FINES_KG)} kg of fines. No electricity.`,
    "Already a road, or short fines.",
    "The climate cell does not move.",
  ),
  note(
    "berm",
    "Ground",
    "Raise a berm",
    "A flag on one kilometer.",
    `${commas(BERM_FINES_KG)} kg of fines. No electricity.`,
    "Already a berm, or short fines.",
    "The climate cell's temperature amplitude does not move.",
  ),
  note(
    "roof",
    "Ground",
    "Roof this kilometer",
    `A pressure vessel on one kilometer. Inside is ${commas(VESSEL_PA)} Pa. That set point is the vessel, not a claim that the square kilometer is full of air.`,
    `${commas(ROOF_FINES_KG)} kg of fines and ${commas(ROOF_KWH)} kWh. Upkeep is a separate bill.`,
    "Already roofed, or short fines, or short power.",
    "The climate cell's pressure does not move. A roofed kilometer is not cut.",
  ),
  note(
    "cable",
    "Ground",
    "Wire this kilometer",
    `One remembered line from the cradle array. The cost is ${commas(KG_PER_KM)} kg of fines per kilometer of index distance, rounded. An order of magnitude for a conductor, not a catalog. The cradle kilometer needs no line.`,
    "The rounded kilometers, times one tonne. Rewiring a different cell spends again.",
    "The cradle cell itself, a cell that is already wired, or short fines. A cut off the line is refused before the battery is touched.",
    "The cable does not move the climate cell. One line is not a grid.",
  ),
  note(
    "loft",
    "Veil",
    "Release particles here",
    `Lofts one mill of fines over the selected climate cell. Five grams per square meter is optical depth 1, so the mass sets the τ. At the cradle that batch is τ ${(CRADLE_TAU_MILLI / 1000).toFixed(3)}. It warms the cell at ${AEROSOL_K_PER_TAU} K per τ, until ${AEROSOL_CAP_K} K, which is τ ${TAU_CAP_MILLI / 1000}. Half of it is gone in ${AEROSOL_HALFLIFE_SOLS} sols.`,
    `${commas(MILL_FINES_KG)} kg of fines and ${commas(LOFT_KWH)} kWh.`,
    "Short fines, short power, or a loft that would pass the warming cap. A zero τ is refused.",
    "Particles are a mass, not a free τ button. The loft does not move the CO₂ bar.",
  ),
  note(
    "storm",
    "Veil",
    "Encircling storm",
    `Filed on sol ${STORM_SOL} for both clients, and it lasts ${STORM_DURATION} sols. Peak dust optical depth is ${STORM_PEAK_TAU_MILLI / 1000}. Near the middle, the surface sun is about 2%.`,
    "Nothing you spend. It is a line in the log.",
    "The board does not offer a button to skip it. Dropping the line would split the hash. This board does not drop it.",
    `The storm is not a weapon and not a slider. A stripping sol abrades health by ${HEALTH_STORM_LOSS} and, if a collector is up, returns a tenth of the particle mass that left the array's cell.`,
  ),
  note(
    "collector",
    "Veil",
    "Raise a collector",
    "On a stripping sol it returns a tenth of the particle mass that left the array's climate cell, up to the warehouse cap. Five grams per square meter per optical depth is an order of magnitude.",
    `${commas(COLLECTOR_FINES_KG)} kg of fines.`,
    "Already up, or short fines. A clear sol returns nothing.",
    "It does not invent fines. It does not move the climate cell.",
  ),
  note(
    "mine",
    "Water",
    "Mine 1 t ice",
    `One tonne from a local lens of ${commas(ICE_LENS_KG)} kg at the cradle. Not the polar cap. The water arrives dirty: toxin 1000. That is a flag, not an assay.`,
    `${MINE_KWH} kWh and ${commas(MINE_KG)} kg of ice. The lens is already stocked.`,
    `Below ${TRIPLE_P_PA} Pa the order refuses. That site is vapor, and this board will not bottle it. An empty lens or an empty battery mines for neither client. The survey column at the datum is ${P_DATUM_PA} Pa.`,
    "The tonne does not become weather. It does not move the air mass.",
  ),
  note(
    "wash",
    "Water",
    "Wash tanks",
    "Clears toxin 1000. The water that did the washing becomes brine. It is not clean water again.",
    `${commas(WASH_WATER_KG)} kg of water and ${WASH_KWH} kWh.`,
    "A clean tank, or short water, or short power.",
    "The wash does not invent clean ice, and it does not touch the air.",
  ),
  note(
    "split",
    "Water",
    "Electrolyze 36 kg",
    `2 H₂O → 2 H₂ + O₂. ${ELECTROLYSIS_WATER_KG} kg of water becomes ${ELECTROLYSIS_H2_KG} kg of hydrogen and ${ELECTROLYSIS_O2_KG} kg of oxygen. The masses close. About ${ELECTROLYSIS_KWH / Number(ELECTROLYSIS_H2_KG)} kWh per kilogram of hydrogen. ${SPLIT_HEAT_KWH} kWh of the batch does not stay in the hydrogen.`,
    `${ELECTROLYSIS_KWH} kWh and ${ELECTROLYSIS_WATER_KG} kg of clean water.`,
    `Short power, short water, toxin still set, or the yard already holding more than it can reject. Past ${HEAT_LIMIT_KWH} kWh of heat the cell refuses. Wash the tanks first.`,
    "The split does not touch the air. The hydrogen is a stock, not a sky.",
  ),
  note(
    "draw",
    "Water",
    "Draw 1 kg from the column",
    `Pulls ${DRAW_KG} kg of water from the column over one kilometer. About ${commas(COLUMN_KG)} kg at 10 grams per square meter. That figure is an order of magnitude.`,
    `${CONDENSER_KWH} kWh per kilogram, until ${commas(COLUMN_KG)} kg have been drawn.`,
    "Short power, or the column already taken. At the cap the order refuses.",
    "The air mass does not move. This board does not invent a wind to refill the column.",
  ),
  note(
    "open",
    "Water",
    "Open tanks",
    "There is no button. At the close of a sol, open methane and open water and open oxygen each lose one percent, and at least one kilogram. Open hydrogen loses ten percent, and at least one kilogram. Faster than methane, as an order of magnitude, not a permeability.",
    "The loss itself. A standing roof anywhere on the board holds the tanks.",
    "Nothing to refuse. An empty tank stays empty.",
    "The lost gas does not become weather and does not change the air mass.",
  ),
  note(
    "bottle",
    "Gas",
    "Bottle 44 kg CO2",
    `Sets aside ${CO2_BATCH_KG} kg, the mass one Sabatier batch will ask for. The bottle holds ${commas(CO2_CAP_KG)} kg, ten batches.`,
    `${CO2_KWH} kWh. The gas is local capture, not a bite taken out of the planetary total.`,
    "Short power, or a full bottle.",
    "The air mass does not move.",
  ),
  note(
    "sabatier",
    "Gas",
    "Sabatier batch",
    `CO₂ + 4 H₂ → CH₄ + 2 H₂O. ${SABATIER_H2_KG} kg of hydrogen and ${CO2_BATCH_KG} kg from the bottle become ${SABATIER_CH4_KG} kg of methane and ${SABATIER_WATER_KG} kg of water. The masses close: 52 kg in, 52 kg out.`,
    `${SABATIER_KWH} kWh, plus the hydrogen and the bottled CO₂.`,
    "Short power, short hydrogen, or short CO₂.",
    "The planetary CO₂ bar does not move. The air mass does not move.",
  ),
  note(
    "burn",
    "Gas",
    "Burn 16 kg methane",
    `CH₄ + 2 O₂ → CO₂ + 2 H₂O, credited as ${BURN_KWH_PER_KG} kWh of electricity per kilogram of methane. ${BURN_CH4_KG} kg of methane and ${BURN_O2_KG} kg of oxygen return ${BURN_WATER_KG} kg of water and ${Number(BURN_CH4_KG) * BURN_KWH_PER_KG} kWh, and the battery cap still applies.`,
    "The methane and the oxygen. No separate power cost.",
    "Short methane or short oxygen.",
    "The board keeps the water and the electricity. It does not bottle the CO₂ from the flame, and it does not add that CO₂ to the air.",
  ),
  note(
    "heat",
    "Cabin",
    "Heat the vessel",
    `Raises the inside by 1 K, up to ${CABIN_CAP_K} K above the yard.`,
    `${commas(CABIN_KWH)} kWh per kelvin.`,
    "No roof, short power, or the cap already met.",
    "There is no heat without a roof. The climate cell does not move.",
  ),
  note(
    "radiator",
    "Cabin",
    "Raise a radiator",
    `The open yard sheds ${BARE_SHED_KWH} kWh of electrolysis heat a sol. A radiator sheds ${RADIATOR_SHED_KWH}. The cell refuses another split past ${HEAT_LIMIT_KWH} kWh.`,
    `${commas(RADIATOR_FINES_KG)} kg of fines.`,
    "Already up, or short fines.",
    "The shed heat does not warm a climate cell.",
  ),
  note(
    "lamp",
    "Cabin",
    "Raise a lamp",
    `Under a roof, each lit bed grows ${LAMP_G} g a sol instead of 1 g. The sol bills ${LAMP_BED_KWH} kWh a bed after the roof. If the battery cannot pay that, nothing is spent and the beds grow the dark gram.`,
    `${commas(LAMP_FINES_KG)} kg of fines to raise it. Then ${LAMP_BED_KWH} kWh a bed a sol.`,
    "No roof, already lit, or short fines. A short battery does not clear the lamp. It only leaves that sol dark.",
    `${BED_CAP} lit beds are ${RATION_G} g. One bed is not a ration. The lamp does not touch the air.`,
  ),
  note(
    "plant",
    "Cabin",
    "Plant a bed",
    `Plants one bed on both clients. The yard already has the landed bed. ${BED_CAP} lit beds are ${RATION_G} g a sol, which is ${BED_CAP} times ${LAMP_G} g. Dark, those beds are ${BED_CAP} g.`,
    `${commas(BED_FINES_KG)} kg of fines. ${BED_CAP - 1} added beds are ${commas(RATION_BED_FINES_KG)} kg. One mill batch is ${commas(MILL_FINES_KG)} kg and leaves ${commas(BED_FINES_KG)} kg.`,
    `No roof on either client, short fines, or either client already at ${BED_CAP} beds. A one-sided shortage plants for neither.`,
    "The climate cell does not move. A bed is not a second person, and it is not breathable air.",
  ),
  note(
    "hold",
    "Sol",
    "The kilometer holds",
    `There is no button. A sol counts when a roof is up, the cabin still holds at least ${CABIN_O2_KG} kg after the seal, the crew is not in debt, and the store still has ${RATION_G} g after eat and grow. ${HELD_MARK} such sols is the mark.`,
    "Whatever the roof, the lamps, the crew, the vent, and the beds already cost. The mark spends nothing.",
    `A miss zeros the run. Stale cabin CO₂, a crew debt, a dark lamp that does not put the ration back, a meter under ${CABIN_O2_KG} kg, or a roof that fell.`,
    "The climate cell does not move. The air mass stays on solar longitude. This is not a sky, and it is not breathable air.",
  ),
  note(
    "meter",
    "Cabin",
    "Meter 28 kg into the cabin",
    `Meters ${CABIN_O2_KG} kg of oxygen into a ${CABIN_M3} m³ cabin. That is ${CABIN_O2_PA} Pa, about ${Math.round(CABIN_O2_PA / 1000)} kPa. Each later sol the seal loses ${CABIN_LEAK_KG} kg.`,
    `${METER_KWH} kWh and ${CABIN_O2_KG} kg of oxygen from the tanks.`,
    "The cabin already holds that charge, or the tanks are short, or the battery cannot pay.",
    "There is no nitrogen buffer. This is not breathable air. The leaked kilogram is not returned to the tank, and it does not move the climate cell.",
  ),
  note(
    "vent",
    "Cabin",
    "Vent 1 kg cabin CO2",
    `Removes ${VENT_KG} kg of cabin CO₂. At ${STALE_CO2_KG} kg left in the cabin, the beds do not grow, and a holding run returns to zero.`,
    `${VENT_KWH} kWh per kilogram.`,
    "Short power, or no cabin CO₂ to vent.",
    "The air mass does not move. Vented cabin gas is not a climate.",
  ),
  note(
    "crew",
    "Sol",
    "Crew",
    `There is no button. Each sol the crew takes ${CREW_O2_KG} kg of oxygen and ${CREW_WATER_KG} kg of water. A breathed sol puts ${CREW_CO2_KG} kg of CO₂ in the cabin. That is the order of the oxygen they took, not a new atmosphere.`,
    "The oxygen and the water, after the array is banked.",
    "Short either one and the sol is owed. Nothing is spent on a debt.",
    "The draw does not touch the air mass.",
  ),
  note(
    "food",
    "Sol",
    "Food",
    `There is no button. The crew eats ${RATION_G} g of biomass a sol, or the sol is short of food. Eat runs before grow. ${BED_CAP} lit beds put ${RATION_G} g back, so the next sol can eat and still end with a ration in store. The sol that first fills an empty store is still short.`,
    `${RATION_G} g, if the store has it.`,
    `Under ${RATION_G} g, nothing is eaten and the sol is short.`,
    "Today's gram does not pay today's ration. Twenty-four lit beds do not hold a ration in the store.",
  ),
  note(
    "grow",
    "Sol",
    "Biomass",
    `There is no button. One gram a bed a sol, under a roof, with clean water, no crew debt, and cabin CO₂ under ${STALE_CO2_KG} kg. A lit bed is ${LAMP_G} g. Water is one kilogram a bed. Short water grows nothing.`,
    "One kilogram of water a bed, and a standing roof.",
    "No roof, toxin still set, a crew debt, stale cabin CO₂, or water short of the beds. Then nothing is spent.",
    "It does not touch the air. One bed is not a ration. Twenty-five dark beds are 25 g.",
  ),
  note(
    "upkeep",
    "Sol",
    "Roof upkeep",
    `There is no button. ${commas(ROOF_UPKEEP_KWH)} kWh a sol, taken after the array is banked. A clear cradle sol covers that. If the battery still cannot pay, every roof flag comes down.`,
    `${commas(ROOF_UPKEEP_KWH)} kWh while any roof is up.`,
    "An unpaid bill drops the roofs. It does not spend the short battery.",
    "The climate cell does not move when a roof falls.",
  ),
  note(
    "hash",
    "Log",
    "Turn hash",
    "One hash over the climate record, the crust record, and the stocks. Both clients take the same log. The board shows Witness, Climate, and Crust.",
    "Nothing.",
    "A missed storm line or a dropped order would split the hash. This board does not drop one. A refusal is recorded as no change, for both.",
    "The hash does not split in ordinary play. Agree is the check that the two clients are still the same board.",
  ),
];

export function entryByTitle(title: string): ManualEntry | undefined {
  return MANUAL.find((entry) => entry.title === title);
}
