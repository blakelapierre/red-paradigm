import { type Stocks } from "./power.ts";

/** About half a kilogram of dry food. The plot does not grow this in a sol. */
export const RATION_G = 500;

export function eat(stocks: Stocks): Stocks {
  if (stocks.biomassG < RATION_G) return { ...stocks, foodDebt: 1 };
  return { ...stocks, biomassG: stocks.biomassG - RATION_G, foodDebt: 0 };
}

/** The sol ended fed, and a ration is still in the store. Eat runs before grow, so this is what was put back. */
export function coversRation(stocks: Stocks): boolean {
  return stocks.foodDebt === 0 && stocks.biomassG >= RATION_G;
}
