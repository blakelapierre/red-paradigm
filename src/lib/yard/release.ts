import { RADIUS_M } from "../climate/constants.ts";
import { addAerosol, type World } from "../climate/model.ts";
import { MILL_FINES_KG } from "./mill.ts";
import { type Stocks } from "./power.ts";

/** Five grams per square meter is optical depth 1. An order of magnitude, not a retrieval. */
export const GRAMS_PER_M2_PER_TAU = 5;
export const LOFT_KWH = 200_000;
/** 15 K cap at 25 K per optical depth. Past this the cell does not get warmer. */
export const TAU_CAP_MILLI = 600;

export function cellAreaM2(latDeg: number): number {
  const dLat = ((5 * Math.PI) / 180) * RADIUS_M;
  const width = Math.max(0.05, Math.cos((latDeg * Math.PI) / 180));
  return Math.round(dLat * dLat * width);
}

/** Milli-tau from a mass of fines spread over one climate cell. */
export function tauMilliFromFines(kg: bigint, latDeg: number): number {
  const area = BigInt(cellAreaM2(latDeg));
  if (area <= 0n || kg <= 0n) return 0;
  return Number((kg * 200_000n) / area);
}

export type ReleaseResult = {
  a: World;
  b: World;
  aStocks: Stocks;
  bStocks: Stocks;
  accepted: boolean;
  reason: string;
  tauMilli: number;
};

/** A cell already carrying lofted fines. The storm's dust is not this field. */
export function loftClaimed(world: World, index: number): boolean {
  return world.tauAerMilli[index] > 0;
}

/** One loft on the climate. A second cell does not get a second veil. */
export function loftAnywhere(world: World): boolean {
  for (let i = 0; i < world.tauAerMilli.length; i++) {
    if (world.tauAerMilli[i] > 0) return true;
  }
  return false;
}

export function commitRelease(
  a: World,
  b: World,
  aStocks: Stocks,
  bStocks: Stocks,
  index: number,
  latDeg: number,
): ReleaseResult {
  const tauMilli = tauMilliFromFines(MILL_FINES_KG, latDeg);
  const same = { a, b, aStocks, bStocks, accepted: false, tauMilli };
  if (aStocks.finesKg < MILL_FINES_KG || bStocks.finesKg < MILL_FINES_KG) {
    return { ...same, reason: `need ${MILL_FINES_KG.toString()} kg of fines` };
  }
  if (aStocks.batteryKwh < LOFT_KWH || bStocks.batteryKwh < LOFT_KWH) {
    return { ...same, reason: `battery cannot pay ${LOFT_KWH} kWh` };
  }
  if (a.tauAerMilli[index] + tauMilli > TAU_CAP_MILLI || b.tauAerMilli[index] + tauMilli > TAU_CAP_MILLI) {
    return { ...same, reason: "the warming cap is already met" };
  }
  if (tauMilli <= 0) return { ...same, reason: "that mass does not change the optical depth" };
  const spend = (stocks: Stocks): Stocks => ({
    ...stocks,
    batteryKwh: stocks.batteryKwh - LOFT_KWH,
    finesKg: stocks.finesKg - MILL_FINES_KG,
  });
  return {
    a: addAerosol(a, index, tauMilli),
    b: addAerosol(b, index, tauMilli),
    aStocks: spend(aStocks),
    bStocks: spend(bStocks),
    accepted: true,
    tauMilli,
    reason: `lofted τ ${(tauMilli / 1000).toFixed(3)}`,
  };
}
