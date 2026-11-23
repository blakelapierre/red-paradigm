import { TRIPLE_P_PA } from "../climate/constants.ts";
import { type Stocks } from "./power.ts";

/** A local ice lens at the cradle, not the polar cap. One tonne a time. */
export const ICE_LENS_KG = 1_000_000_000n;
export const MINE_KG = 1_000n;
export const MINE_KWH = 50;

export function commitMine(
  a: Stocks,
  b: Stocks,
  pressurePa: number,
): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, accepted: false };
  if (!Number.isInteger(pressurePa) || pressurePa < TRIPLE_P_PA) {
    return { ...same, reason: "below 612 Pa this is vapor. this board will not bottle it" };
  }
  if (a.batteryKwh < MINE_KWH || b.batteryKwh < MINE_KWH) return { ...same, reason: `battery cannot pay ${MINE_KWH} kWh` };
  if (a.iceKg < MINE_KG || b.iceKg < MINE_KG) return { ...same, reason: "the lens is empty" };
  const take = (s: Stocks): Stocks => ({
    ...s,
    batteryKwh: s.batteryKwh - MINE_KWH,
    iceKg: s.iceKg - MINE_KG,
    waterKg: s.waterKg + MINE_KG,
    toxinMilli: 1000,
  });
  return { a: take(a), b: take(b), accepted: true, reason: "mined 1000 kg of dirty ice" };
}
