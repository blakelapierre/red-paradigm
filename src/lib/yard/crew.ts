import { type Stocks } from "./power.ts";

/** One person. About a kilogram of oxygen and three kilograms of water a sol. */
export const CREW_O2_KG = 1n;
export const CREW_WATER_KG = 3n;

export function drawCrew(stocks: Stocks): Stocks {
  if (stocks.o2Kg < CREW_O2_KG || stocks.waterKg < CREW_WATER_KG) return { ...stocks, debt: 1 };
  return {
    ...stocks,
    o2Kg: stocks.o2Kg - CREW_O2_KG,
    waterKg: stocks.waterKg - CREW_WATER_KG,
    debt: 0,
  };
}
