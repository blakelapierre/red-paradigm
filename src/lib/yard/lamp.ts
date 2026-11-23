import { type Crust } from "../crust/crust.ts";
import { type Stocks } from "./power.ts";

/** A lamp under the roof. Twenty grams, not a ration. */
export const LAMP_FINES_KG = 20_000n;
export const LAMP_G = 20;

export function commitLamp(
  a: Crust,
  b: Crust,
  aStocks: Stocks,
  bStocks: Stocks,
): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a: aStocks, b: bStocks, accepted: false };
  const aRoof = a.overrides.some((row) => row.roof === 1);
  const bRoof = b.overrides.some((row) => row.roof === 1);
  if (!aRoof || !bRoof) return { ...same, reason: "the lamp needs a roof" };
  if (aStocks.lamp || bStocks.lamp) return { ...same, reason: "a lamp is already up" };
  if (aStocks.finesKg < LAMP_FINES_KG || bStocks.finesKg < LAMP_FINES_KG) return { ...same, reason: `need ${LAMP_FINES_KG} kg of fines` };
  const take = (s: Stocks): Stocks => ({ ...s, finesKg: s.finesKg - LAMP_FINES_KG, lamp: 1 });
  return { a: take(aStocks), b: take(bStocks), accepted: true, reason: "lamp up. 20 g a sol, not a 500 g ration" };
}
