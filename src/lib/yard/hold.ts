import { type Crust } from "../crust/crust.ts";
import { coversRation } from "./food.ts";
import { CABIN_O2_KG } from "./meter.ts";
import { type Stocks } from "./power.ts";

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
