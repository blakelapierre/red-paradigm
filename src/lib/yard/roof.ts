import { flagOf, setFlag, type Crust } from "../crust/crust.ts";
import { type Stocks } from "./power.ts";

/** A pressure vessel on one kilometer. Not a new atmosphere. */
export const ROOF_FINES_KG = 50_000n;
export const ROOF_KWH = 100_000;
export const VESSEL_PA = 101_325;

export function commitRoof(
  a: Crust,
  b: Crust,
  aStocks: Stocks,
  bStocks: Stocks,
  ix: number,
  iy: number,
): { a: Crust; b: Crust; aStocks: Stocks; bStocks: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, aStocks, bStocks, accepted: false };
  if (flagOf(a, ix, iy, "roof") || flagOf(b, ix, iy, "roof")) return { ...same, reason: "that kilometer is already roofed" };
  if (aStocks.finesKg < ROOF_FINES_KG || bStocks.finesKg < ROOF_FINES_KG) return { ...same, reason: `need ${ROOF_FINES_KG} kg of fines` };
  if (aStocks.batteryKwh < ROOF_KWH || bStocks.batteryKwh < ROOF_KWH) return { ...same, reason: `battery cannot pay ${ROOF_KWH} kWh` };
  const spend = (s: Stocks): Stocks => ({ ...s, finesKg: s.finesKg - ROOF_FINES_KG, batteryKwh: s.batteryKwh - ROOF_KWH });
  return {
    a: setFlag(a, ix, iy, "roof", 1),
    b: setFlag(b, ix, iy, "roof", 1),
    aStocks: spend(aStocks),
    bStocks: spend(bStocks),
    accepted: true,
    reason: `roof up. inside ${VESSEL_PA} Pa. the climate cell did not move`,
  };
}
