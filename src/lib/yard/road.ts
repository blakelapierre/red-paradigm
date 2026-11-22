import { flagOf, setFlag, type Crust } from "../crust/crust.ts";
import { type Stocks } from "./power.ts";

/** A road on one kilometer. It does not change the climate cell. */
export const ROAD_FINES_KG = 20_000n;

export function commitRoad(
  a: Crust,
  b: Crust,
  aStocks: Stocks,
  bStocks: Stocks,
  ix: number,
  iy: number,
): { a: Crust; b: Crust; aStocks: Stocks; bStocks: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, aStocks, bStocks, accepted: false };
  if (flagOf(a, ix, iy, "road") || flagOf(b, ix, iy, "road")) return { ...same, reason: "that kilometer is already a road" };
  if (aStocks.finesKg < ROAD_FINES_KG || bStocks.finesKg < ROAD_FINES_KG) return { ...same, reason: `need ${ROAD_FINES_KG} kg of fines` };
  const spend = (s: Stocks): Stocks => ({ ...s, finesKg: s.finesKg - ROAD_FINES_KG });
  return {
    a: setFlag(a, ix, iy, "road", 1),
    b: setFlag(b, ix, iy, "road", 1),
    aStocks: spend(aStocks),
    bStocks: spend(bStocks),
    accepted: true,
    reason: "road laid. the climate cell did not move",
  };
}
