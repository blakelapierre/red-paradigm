import { CELL_M, paintCell, paintOf, type Crust } from "../crust/crust.ts";
import { type Stocks } from "./power.ts";

/** A 50 g/m² coat on one kilometer. Dark rock, albedo 0.10. */
export const PAINT_ALBEDO_MILLI = 100;
export const PAINT_FINES_KG = (BigInt(CELL_M) * BigInt(CELL_M) * 50n) / 1000n;
export const PAINT_KWH = 100_000;

export type PaintResult = {
  a: Crust;
  b: Crust;
  aStocks: Stocks;
  bStocks: Stocks;
  accepted: boolean;
  reason: string;
};

export function commitPaint(
  a: Crust,
  b: Crust,
  aStocks: Stocks,
  bStocks: Stocks,
  ix: number,
  iy: number,
): PaintResult {
  const same = { a, b, aStocks, bStocks, accepted: false };
  if (paintOf(a, ix, iy) > 0 || paintOf(b, ix, iy) > 0) {
    return { ...same, reason: "that kilometer is already painted" };
  }
  if (aStocks.finesKg < PAINT_FINES_KG || bStocks.finesKg < PAINT_FINES_KG) {
    return { ...same, reason: `need ${PAINT_FINES_KG.toString()} kg of fines` };
  }
  if (aStocks.batteryKwh < PAINT_KWH || bStocks.batteryKwh < PAINT_KWH) {
    return { ...same, reason: `battery cannot pay ${PAINT_KWH} kWh` };
  }
  const spend = (stocks: Stocks): Stocks => ({
    ...stocks,
    batteryKwh: stocks.batteryKwh - PAINT_KWH,
    finesKg: stocks.finesKg - PAINT_FINES_KG,
  });
  return {
    a: paintCell(a, ix, iy, PAINT_ALBEDO_MILLI),
    b: paintCell(b, ix, iy, PAINT_ALBEDO_MILLI),
    aStocks: spend(aStocks),
    bStocks: spend(bStocks),
    accepted: true,
    reason: "kilometer painted. the climate cell did not move",
  };
}
