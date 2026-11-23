import { type Crust } from "../crust/crust.ts";
import { LAMP_G } from "./lamp.ts";
import { type Stocks } from "./power.ts";
import { STALE_CO2_KG } from "./vent.ts";

/** One gram a sol, inside a powered roof, with clean water. It does not touch the air. */
export const BIOMASS_WATER_KG = 1n;

export function grow(crust: Crust, stocks: Stocks, lit = stocks.lamp === 1): Stocks {
  const roofed = crust.overrides.some((row) => row.roof === 1);
  const beds = stocks.beds;
  if (!roofed || beds < 1 || stocks.toxinMilli !== 0 || stocks.debt !== 0 || stocks.cabinCo2Kg >= STALE_CO2_KG) return stocks;
  const water = BigInt(beds) * BIOMASS_WATER_KG;
  if (stocks.waterKg < water) return stocks;
  const gain = beds * (lit ? LAMP_G : 1);
  return { ...stocks, waterKg: stocks.waterKg - water, biomassG: stocks.biomassG + gain };
}
