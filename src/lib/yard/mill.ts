import { type Crust } from "../crust/crust.ts";
import { type Stocks } from "./power.ts";

/** One batch out of the yard. Five percent of the mass is iron and aluminum fines. */
export const MILL_SPOIL_KG = 100_000_000n;
export const MILL_FINES_KG = 5_000_000n;
export const MILL_TAILINGS_KG = MILL_SPOIL_KG - MILL_FINES_KG;
export const MILL_KWH = 1_000_000;
/** Ten batches. The warehouse is not the pit. */
export const FINES_CAP_KG = 50_000_000n;

export type MillResult = {
  a: Crust;
  b: Crust;
  aStocks: Stocks;
  bStocks: Stocks;
  accepted: boolean;
  reason: string;
};

function refuse(a: Crust, b: Crust, aStocks: Stocks, bStocks: Stocks, reason: string): MillResult {
  return { a, b, aStocks, bStocks, accepted: false, reason };
}

/** Both clients mill one batch, or neither does. */
export function commitMill(a: Crust, b: Crust, aStocks: Stocks, bStocks: Stocks): MillResult {
  if (aStocks.batteryKwh < MILL_KWH || bStocks.batteryKwh < MILL_KWH) {
    return refuse(a, b, aStocks, bStocks, `battery cannot pay ${MILL_KWH} kWh`);
  }
  if (a.spoilKg < MILL_SPOIL_KG || b.spoilKg < MILL_SPOIL_KG) {
    return refuse(a, b, aStocks, bStocks, `yard has no ${MILL_SPOIL_KG.toString()} kg batch`);
  }
  if (aStocks.finesKg + MILL_FINES_KG > FINES_CAP_KG || bStocks.finesKg + MILL_FINES_KG > FINES_CAP_KG) {
    return refuse(a, b, aStocks, bStocks, `warehouse holds ${FINES_CAP_KG.toString()} kg`);
  }
  const take = (crust: Crust): Crust => ({
    ...crust,
    spoilKg: crust.spoilKg - MILL_SPOIL_KG,
    tailingsKg: crust.tailingsKg + MILL_TAILINGS_KG,
  });
  const spend = (stocks: Stocks): Stocks => ({
    ...stocks,
    batteryKwh: stocks.batteryKwh - MILL_KWH,
    finesKg: stocks.finesKg + MILL_FINES_KG,
  });
  return {
    a: take(a),
    b: take(b),
    aStocks: spend(aStocks),
    bStocks: spend(bStocks),
    accepted: true,
    reason: "batch milled. the other 95 percent is tailings",
  };
}
