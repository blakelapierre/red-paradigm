import { type Stocks } from "./power.ts";

/** About 40 kWh of a 200 kWh split does not stay in the hydrogen. */
export const SPLIT_HEAT_KWH = 40;
export const HEAT_LIMIT_KWH = 80;
export const BARE_SHED_KWH = 40;
export const RADIATOR_SHED_KWH = 200;
export const RADIATOR_FINES_KG = 20_000n;

export function commitRadiator(a: Stocks, b: Stocks): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, accepted: false };
  if (a.radiator || b.radiator) return { ...same, reason: "a radiator is already up" };
  if (a.finesKg < RADIATOR_FINES_KG || b.finesKg < RADIATOR_FINES_KG) {
    return { ...same, reason: `need ${RADIATOR_FINES_KG} kg of fines` };
  }
  const take = (s: Stocks): Stocks => ({ ...s, finesKg: s.finesKg - RADIATOR_FINES_KG, radiator: 1 });
  return { a: take(a), b: take(b), accepted: true, reason: "radiator up. it sheds 200 kWh a sol" };
}

export function shedHeat(stocks: Stocks): Stocks {
  const shed = stocks.radiator ? RADIATOR_SHED_KWH : BARE_SHED_KWH;
  return { ...stocks, heatKwh: Math.max(0, stocks.heatKwh - shed) };
}
