import { type Stocks } from "./power.ts";

/** Storm abrasion. Repair puts back a tenth of the array. */
export const HEALTH_FULL = 1000;
export const HEALTH_STORM_LOSS = 10;
export const REPAIR_FINES_KG = 10_000n;
export const REPAIR_HEALTH = 100;

export function scaleArray(kwh: number, healthMilli: number): number {
  return Math.round((kwh * healthMilli) / HEALTH_FULL);
}

export function abrade(stocks: Stocks, storming: boolean): Stocks {
  if (!storming || stocks.healthMilli <= 0) return stocks;
  return { ...stocks, healthMilli: Math.max(0, stocks.healthMilli - HEALTH_STORM_LOSS) };
}

export function commitRepair(a: Stocks, b: Stocks): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, accepted: false };
  if (a.healthMilli >= HEALTH_FULL && b.healthMilli >= HEALTH_FULL) return { ...same, reason: "the array is intact" };
  if (a.finesKg < REPAIR_FINES_KG || b.finesKg < REPAIR_FINES_KG) return { ...same, reason: `need ${REPAIR_FINES_KG} kg of fines` };
  const take = (s: Stocks): Stocks => ({
    ...s,
    finesKg: s.finesKg - REPAIR_FINES_KG,
    healthMilli: Math.min(HEALTH_FULL, s.healthMilli + REPAIR_HEALTH),
  });
  return { a: take(a), b: take(b), accepted: true, reason: "array repaired" };
}
