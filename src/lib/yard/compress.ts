import { airKg, type World } from "../climate/model.ts";
import { type Stocks } from "./power.ts";

/** CO2 + 4 H2 → CH4 + 2 H2O needs 44 kg of CO2 for 8 kg of hydrogen. Local capture. */
export const CO2_BATCH_KG = 44n;
export const CO2_KWH = 30;
/** Ten batches. The bottle is not the atmosphere. */
export const CO2_CAP_KG = 440n;

export function commitCompress(
  a: Stocks,
  b: Stocks,
  world: World,
): { a: Stocks; b: Stocks; accepted: boolean; reason: string; air: bigint } {
  const air = airKg(world.ls);
  const same = { a, b, accepted: false, air };
  if (a.co2Kg + CO2_BATCH_KG > CO2_CAP_KG || b.co2Kg + CO2_BATCH_KG > CO2_CAP_KG) {
    return { ...same, reason: `the bottle holds ${CO2_CAP_KG.toString()} kg` };
  }
  if (a.batteryKwh < CO2_KWH || b.batteryKwh < CO2_KWH) return { ...same, reason: `battery cannot pay ${CO2_KWH} kWh` };
  const take = (s: Stocks): Stocks => ({
    ...s,
    batteryKwh: s.batteryKwh - CO2_KWH,
    co2Kg: s.co2Kg + CO2_BATCH_KG,
  });
  return {
    a: take(a),
    b: take(b),
    accepted: true,
    air,
    reason: "set aside 44 kg of CO2. the air mass did not move",
  };
}
