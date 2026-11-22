import { airKg, type World } from "../climate/model.ts";
import { type Stocks } from "./power.ts";

/** About 10 g/m² over one kilometer. An order of magnitude, not a sounding. */
export const COLUMN_KG = 10_000;
export const DRAW_KG = 1n;
export const CONDENSER_KWH = 50;

export function commitCondenser(
  a: Stocks,
  b: Stocks,
  world: World,
): { a: Stocks; b: Stocks; accepted: boolean; reason: string; air: bigint } {
  const air = airKg(world.ls);
  const same = { a, b, accepted: false, air };
  if (a.drawnKg >= COLUMN_KG || b.drawnKg >= COLUMN_KG) {
    return { ...same, reason: "that kilometer's column is already taken. weather would refill it. this board does not invent that wind" };
  }
  if (a.batteryKwh < CONDENSER_KWH || b.batteryKwh < CONDENSER_KWH) {
    return { ...same, reason: `battery cannot pay ${CONDENSER_KWH} kWh` };
  }
  const take = (s: Stocks): Stocks => ({
    ...s,
    batteryKwh: s.batteryKwh - CONDENSER_KWH,
    waterKg: s.waterKg + DRAW_KG,
    drawnKg: s.drawnKg + 1,
  });
  return {
    a: take(a),
    b: take(b),
    accepted: true,
    air,
    reason: "took 1 kg from a column of about 10,000 kg. the air mass did not move",
  };
}
