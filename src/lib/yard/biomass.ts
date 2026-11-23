import { type Crust } from "../crust/crust.ts";
import { LAMP_G } from "./lamp.ts";
import { type Stocks } from "./power.ts";
import { STALE_CO2_KG } from "./vent.ts";

/** One gram a sol, inside a powered roof, with clean water. It does not touch the air. */
export const BIOMASS_WATER_KG = 1n;

export function grow(crust: Crust, stocks: Stocks): Stocks {
  const roofed = crust.overrides.some((row) => row.roof === 1);
  if (!roofed || stocks.toxinMilli !== 0 || stocks.debt !== 0 || stocks.cabinCo2Kg >= STALE_CO2_KG || stocks.waterKg < BIOMASS_WATER_KG) return stocks;
  const gain = stocks.lamp ? LAMP_G : 1;
  return { ...stocks, waterKg: stocks.waterKg - BIOMASS_WATER_KG, biomassG: stocks.biomassG + gain };
}
