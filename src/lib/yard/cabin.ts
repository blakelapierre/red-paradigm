import { type Crust } from "../crust/crust.ts";
import { type Stocks } from "./power.ts";

/** Ten thousand kWh raises the vessel one kelvin. Not the climate cell. */
export const CABIN_KWH = 10_000;
export const CABIN_CAP_K = 40;

export function commitHeat(
  aCrust: Crust,
  bCrust: Crust,
  a: Stocks,
  b: Stocks,
): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, accepted: false };
  const aRoof = aCrust.overrides.some((row) => row.roof === 1);
  const bRoof = bCrust.overrides.some((row) => row.roof === 1);
  if (!aRoof || !bRoof) return { ...same, reason: "no vessel to heat" };
  if (a.cabinRiseK >= CABIN_CAP_K && b.cabinRiseK >= CABIN_CAP_K) {
    return { ...same, reason: "the vessel is already 40 K above the yard" };
  }
  if (a.batteryKwh < CABIN_KWH || b.batteryKwh < CABIN_KWH) {
    return { ...same, reason: `battery cannot pay ${CABIN_KWH} kWh` };
  }
  const take = (s: Stocks): Stocks => ({
    ...s,
    batteryKwh: s.batteryKwh - CABIN_KWH,
    cabinRiseK: Math.min(CABIN_CAP_K, s.cabinRiseK + 1),
  });
  return { a: take(a), b: take(b), accepted: true, reason: "vessel warmed 1 K. the climate cell did not move" };
}
