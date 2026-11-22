import { flagOf, setFlag, type Crust } from "../crust/crust.ts";
import { type Stocks } from "./power.ts";

/** One berm. The climate cell's temperature amplitude does not move. */
export const BERM_FINES_KG = 20_000n;

export function commitBerm(
  a: Crust,
  b: Crust,
  aStocks: Stocks,
  bStocks: Stocks,
  ix: number,
  iy: number,
): { a: Crust; b: Crust; aStocks: Stocks; bStocks: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, aStocks, bStocks, accepted: false };
  if (flagOf(a, ix, iy, "berm") || flagOf(b, ix, iy, "berm")) return { ...same, reason: "that kilometer is already bermed" };
  if (aStocks.finesKg < BERM_FINES_KG || bStocks.finesKg < BERM_FINES_KG) return { ...same, reason: `need ${BERM_FINES_KG} kg of fines` };
  const spend = (s: Stocks): Stocks => ({ ...s, finesKg: s.finesKg - BERM_FINES_KG });
  return {
    a: setFlag(a, ix, iy, "berm", 1),
    b: setFlag(b, ix, iy, "berm", 1),
    aStocks: spend(aStocks),
    bStocks: spend(bStocks),
    accepted: true,
    reason: "berm built. the climate amplitude did not move",
  };
}
