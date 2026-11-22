import { type Stocks } from "./power.ts";

/** A wash uses water and power. It does not invent clean ice. */
export const WASH_WATER_KG = 100n;
export const WASH_KWH = 20;

export function commitWash(a: Stocks, b: Stocks): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, accepted: false };
  if (a.toxinMilli === 0 && b.toxinMilli === 0) return { ...same, reason: "the tanks are already clean" };
  if (a.batteryKwh < WASH_KWH || b.batteryKwh < WASH_KWH) return { ...same, reason: `battery cannot pay ${WASH_KWH} kWh` };
  if (a.waterKg < WASH_WATER_KG || b.waterKg < WASH_WATER_KG) return { ...same, reason: `need ${WASH_WATER_KG} kg of water` };
  const take = (s: Stocks): Stocks => ({
    ...s,
    batteryKwh: s.batteryKwh - WASH_KWH,
    waterKg: s.waterKg - WASH_WATER_KG,
    toxinMilli: 0,
  });
  return { a: take(a), b: take(b), accepted: true, reason: "washed the tanks" };
}
