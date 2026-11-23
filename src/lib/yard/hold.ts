import { type Crust } from "../crust/crust.ts";
import { stormTau, type World } from "../climate/model.ts";
import { BIOMASS_WATER_KG } from "./biomass.ts";
import { BED_CAP } from "./bed.ts";
import { CREW_O2_KG, CREW_WATER_KG } from "./crew.ts";
import { coversRation } from "./food.ts";
import { CABIN_O2_KG } from "./meter.ts";
import { type Stocks } from "./power.ts";
import { STALE_CO2_KG } from "./vent.ts";

/** Ten sols. A mark on one kilometer, not a sky. */
export const HELD_MARK = 10;

const GAP_LINE: Record<string, string> = {
  roof: "Still missing a roof.",
  lamp: "Still missing a lamp.",
  beds: "Still missing beds.",
  water: "Still missing water for the next sol.",
  oxygen: "Still missing oxygen.",
  meter: "The cabin meter is short.",
  vent: "The cabin is stale.",
  debt: "The crew is in debt.",
  food: "The store is short of a ration.",
};

/** The one thing between this yard and a holding sol. Null when the sol would count. */
export function holdGap(crust: Crust, stocks: Stocks): string | null {
  if (cradleHolding(crust, stocks)) return null;
  const roofed = crust.overrides.some((row) => row.roof === 1);
  if (!roofed) return "roof";
  if (!stocks.lamp) return "lamp";
  if (stocks.beds < BED_CAP) return "beds";
  const water = CREW_WATER_KG + BigInt(Math.max(0, stocks.beds)) * BIOMASS_WATER_KG;
  if (stocks.waterKg < water) return "water";
  if (stocks.o2Kg < CREW_O2_KG) return "oxygen";
  if (stocks.cabinO2Kg < CABIN_O2_KG) return "meter";
  if (stocks.cabinCo2Kg >= STALE_CO2_KG) return "vent";
  if (stocks.debt !== 0) return "debt";
  if (!coversRation(stocks)) return "food";
  return null;
}

export function holdGapLine(crust: Crust, stocks: Stocks): string | null {
  const gap = holdGap(crust, stocks);
  return gap ? GAP_LINE[gap] : null;
}

/** The vessel, not the climate cell. A ration still in store, a meter that still reads, no debt, a roof. */
export function cradleHolding(crust: Crust, stocks: Stocks): boolean {
  if (!crust.overrides.some((row) => row.roof === 1)) return false;
  if (stocks.cabinO2Kg < CABIN_O2_KG) return false;
  if (stocks.debt !== 0) return false;
  return coversRation(stocks);
}

export function markHold(crust: Crust, stocks: Stocks): Stocks {
  if (!cradleHolding(crust, stocks)) return stocks.heldSols === 0 ? stocks : { ...stocks, heldSols: 0 };
  return { ...stocks, heldSols: stocks.heldSols + 1 };
}

export function kilometerHolds(stocks: Stocks): boolean {
  return stocks.heldSols >= HELD_MARK;
}

/** The storm bit is not cleared by a later miss. It is set only if the run never broke while dust was stripping. */
export function markStorm(before: World, after: World, crust: Crust, stocks: Stocks): Stocks {
  const was = stormTau(before.sol, before.storm) > 0.05;
  const now = stormTau(after.sol, after.storm) > 0.05;
  let stormBroke = stocks.stormBroke;
  if (now && !cradleHolding(crust, stocks)) stormBroke = 1;
  let stormHeld = stocks.stormHeld;
  if (was && !now && stormBroke === 0 && stocks.stormSeen === 1 && cradleHolding(crust, stocks)) stormHeld = 1;
  const stormSeen = stocks.stormSeen || was || now ? 1 : 0;
  if (stormBroke === stocks.stormBroke && stormHeld === stocks.stormHeld && stormSeen === stocks.stormSeen) return stocks;
  return { ...stocks, stormBroke, stormHeld, stormSeen };
}
