import { type Crust } from "../crust/crust.ts";
import { RATION_G } from "./food.ts";
import { LAMP_G } from "./lamp.ts";
import { type Stocks } from "./power.ts";

/** One more tray under the roof. Twenty-four of these, plus the landed bed, are one lit ration of floor. */
export const BED_FINES_KG = 200_000n;
/** 25 lit beds × 20 g. One person's floor, not a second crew. */
export const BED_CAP = RATION_G / LAMP_G;
/** The landed bed is already there. The rest of the floor is this much fines. */
export const RATION_BED_FINES_KG = BED_FINES_KG * BigInt(BED_CAP - 1);

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
  if (aStocks.beds >= BED_CAP || bStocks.beds >= BED_CAP) {
    return { ...same, reason: "twenty-five beds is one lit ration. another bed is refused" };
  }
  if (aStocks.finesKg < BED_FINES_KG || bStocks.finesKg < BED_FINES_KG) {
    return { ...same, reason: `need ${BED_FINES_KG} kg of fines` };
  }
  const take = (s: Stocks): Stocks => ({ ...s, finesKg: s.finesKg - BED_FINES_KG, beds: s.beds + 1 });
  return { a: take(aStocks), b: take(bStocks), accepted: true, reason: "one bed planted. the climate cell did not move" };
}
