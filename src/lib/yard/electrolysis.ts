import { type Stocks } from "./power.ts";

/** 2 H2O → 2 H2 + O2. A 36 kg batch. About 50 kWh per kilogram of hydrogen. */
export const ELECTROLYSIS_WATER_KG = 36n;
export const ELECTROLYSIS_KWH = 200;
export const ELECTROLYSIS_H2_KG = 4n;
export const ELECTROLYSIS_O2_KG = 32n;

export function commitElectrolysis(a: Stocks, b: Stocks): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, accepted: false };
  if (a.batteryKwh < ELECTROLYSIS_KWH || b.batteryKwh < ELECTROLYSIS_KWH) {
    return { ...same, reason: `battery cannot pay ${ELECTROLYSIS_KWH} kWh` };
  }
  if (a.waterKg < ELECTROLYSIS_WATER_KG || b.waterKg < ELECTROLYSIS_WATER_KG) {
    return { ...same, reason: `need ${ELECTROLYSIS_WATER_KG} kg of water` };
  }
  const take = (s: Stocks): Stocks => ({
    ...s,
    batteryKwh: s.batteryKwh - ELECTROLYSIS_KWH,
    waterKg: s.waterKg - ELECTROLYSIS_WATER_KG,
    h2Kg: s.h2Kg + ELECTROLYSIS_H2_KG,
    o2Kg: s.o2Kg + ELECTROLYSIS_O2_KG,
  });
  return { a: take(a), b: take(b), accepted: true, reason: "split 36 kg of water" };
}
