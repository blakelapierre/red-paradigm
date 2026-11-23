import { type Stocks } from "./power.ts";

/** The pressurized volume is a cabin, not the square kilometer. */
export const CABIN_M3 = 100;
export const CABIN_O2_KG = 28n;
export const METER_KWH = 10;
/** 28 kg * 260 J/kg/K * 293 K / 100 m³. About 21 kPa. Integer arithmetic. */
export const CABIN_O2_PA = Number((CABIN_O2_KG * 260n * 293n) / BigInt(CABIN_M3));

export function commitMeter(a: Stocks, b: Stocks): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, accepted: false };
  if (a.cabinO2Kg >= CABIN_O2_KG || b.cabinO2Kg >= CABIN_O2_KG) return { ...same, reason: "the cabin already holds that oxygen" };
  if (a.o2Kg < CABIN_O2_KG || b.o2Kg < CABIN_O2_KG) return { ...same, reason: `need ${CABIN_O2_KG} kg of oxygen` };
  if (a.batteryKwh < METER_KWH || b.batteryKwh < METER_KWH) return { ...same, reason: `battery cannot pay ${METER_KWH} kWh` };
  const take = (s: Stocks): Stocks => ({
    ...s,
    batteryKwh: s.batteryKwh - METER_KWH,
    o2Kg: s.o2Kg - CABIN_O2_KG,
    cabinO2Kg: s.cabinO2Kg + CABIN_O2_KG,
  });
  const kpa = Math.round(CABIN_O2_PA / 1000);
  return {
    a: take(a),
    b: take(b),
    accepted: true,
    reason: `metered 28 kg into the ${CABIN_M3} m³ cabin, about ${kpa} kPa. there is no nitrogen. this is not breathable air`,
  };
}
