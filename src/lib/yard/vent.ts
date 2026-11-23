import { airKg, type World } from "../climate/model.ts";
import { type Stocks } from "./power.ts";

/** One kilogram out of the cabin. Not a change to the planetary bar. */
export const VENT_KG = 1n;
export const VENT_KWH = 5;
export const STALE_CO2_KG = 5n;

export function commitVent(
  a: Stocks,
  b: Stocks,
  world: World,
): { a: Stocks; b: Stocks; accepted: boolean; reason: string; air: bigint } {
  const air = airKg(world.ls);
  const same = { a, b, accepted: false, air };
  if (a.cabinCo2Kg < VENT_KG || b.cabinCo2Kg < VENT_KG) return { ...same, reason: "the cabin has no CO2 to vent" };
  if (a.batteryKwh < VENT_KWH || b.batteryKwh < VENT_KWH) return { ...same, reason: `battery cannot pay ${VENT_KWH} kWh` };
  const take = (s: Stocks): Stocks => ({
    ...s,
    batteryKwh: s.batteryKwh - VENT_KWH,
    cabinCo2Kg: s.cabinCo2Kg - VENT_KG,
  });
  return { a: take(a), b: take(b), accepted: true, air, reason: "vented 1 kg. the air mass did not move" };
}
