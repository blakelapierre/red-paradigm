import { type Stocks } from "./power.ts";

/** One person. About a kilogram of oxygen and three kilograms of water a sol. The oxygen comes back out as about a kilogram of CO2. */
export const CREW_O2_KG = 1n;
export const CREW_WATER_KG = 3n;
export const CREW_CO2_KG = 1n;

export function drawCrew(stocks: Stocks): Stocks {
  if (stocks.o2Kg < CREW_O2_KG || stocks.waterKg < CREW_WATER_KG) return { ...stocks, debt: 1 };
  return {
    ...stocks,
    o2Kg: stocks.o2Kg - CREW_O2_KG,
    waterKg: stocks.waterKg - CREW_WATER_KG,
    cabinCo2Kg: stocks.cabinCo2Kg + CREW_CO2_KG,
    debt: 0,
  };
}
