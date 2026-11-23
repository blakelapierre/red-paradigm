import { type Crust } from "../crust/crust.ts";
import { type Stocks } from "./power.ts";

/** One more tray under the roof. Twenty-four of these, plus the landed bed, are one lit ration of floor. */
export const BED_FINES_KG = 200_000n;

export function commitPlant(
  a: Crust,
  b: Crust,
  aStocks: Stocks,
  bStocks: Stocks,
): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a: aStocks, b: bStocks, accepted: false };
  const aRoof = a.overrides.some((row) => row.roof === 1);
  const bRoof = b.overrides.some((row) => row.roof === 1);
  if (!aRoof || !bRoof) return { ...same, reason: "a bed needs a roof" };
  if (aStocks.finesKg < BED_FINES_KG || bStocks.finesKg < BED_FINES_KG) {
    return { ...same, reason: `need ${BED_FINES_KG} kg of fines` };
  }
  const take = (s: Stocks): Stocks => ({ ...s, finesKg: s.finesKg - BED_FINES_KG, beds: s.beds + 1 });
  return { a: take(aStocks), b: take(bStocks), accepted: true, reason: "one bed planted. the climate cell did not move" };
}
