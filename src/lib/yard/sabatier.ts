import { airKg } from "../climate/model.ts";
import type { World } from "../climate/model.ts";
import { CO2_BATCH_KG } from "./compress.ts";
import { type Stocks } from "./power.ts";

/** CO2 + 4 H2 → CH4 + 2 H2O. The CO2 is a local capture. The planetary bar does not move. */
export const SABATIER_H2_KG = 8n;
export const SABATIER_KWH = 50;
export const SABATIER_CH4_KG = 16n;
export const SABATIER_WATER_KG = 36n;

export function commitSabatier(
  a: Stocks,
  b: Stocks,
  world: World,
): { a: Stocks; b: Stocks; accepted: boolean; reason: string; air: bigint } {
  const air = airKg(world.ls);
  const same = { a, b, accepted: false, air };
  if (a.batteryKwh < SABATIER_KWH || b.batteryKwh < SABATIER_KWH) return { ...same, reason: `battery cannot pay ${SABATIER_KWH} kWh` };
  if (a.h2Kg < SABATIER_H2_KG || b.h2Kg < SABATIER_H2_KG) return { ...same, reason: `need ${SABATIER_H2_KG} kg of hydrogen` };
  if (a.co2Kg < CO2_BATCH_KG || b.co2Kg < CO2_BATCH_KG) return { ...same, reason: `need ${CO2_BATCH_KG} kg of CO2` };
  const take = (s: Stocks): Stocks => ({
    ...s,
    batteryKwh: s.batteryKwh - SABATIER_KWH,
    h2Kg: s.h2Kg - SABATIER_H2_KG,
    co2Kg: s.co2Kg - CO2_BATCH_KG,
    ch4Kg: s.ch4Kg + SABATIER_CH4_KG,
    waterKg: s.waterKg + SABATIER_WATER_KG,
  });
  return { a: take(a), b: take(b), accepted: true, reason: "ran one Sabatier batch", air };
}
