import { cellLat, cellLon, latIndexOf, lonIndexOf } from "../climate/constants.ts";
import { siteIndex } from "../climate/model.ts";
import { cellOf } from "../crust/crust.ts";
import { type Stocks } from "./power.ts";

/** The kilometer the board digs when the Low Cradle climate cell is selected. Not the site pin, which sits off that cell's center. */
const cradleIndex = siteIndex("cradle");
export const CRADLE_CELL = cellOf(cellLat(latIndexOf(cradleIndex)), cellLon(lonIndexOf(cradleIndex)));

/** One tonne of fines per kilometer of line. An order of magnitude for a conductor, not a catalog. */
export const KG_PER_KM = 1000n;

export function cableKm(ix: number, iy: number): number {
  const dx = ix - CRADLE_CELL.ix;
  const dy = iy - CRADLE_CELL.iy;
  return Math.round(Math.hypot(dx, dy));
}

export function commitCable(
  a: Stocks,
  b: Stocks,
  ix: number,
  iy: number,
): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, accepted: false };
  if (ix === CRADLE_CELL.ix && iy === CRADLE_CELL.iy) return { ...same, reason: "the array is already on this kilometer" };
  if ((a.cableOn && a.cableIx === ix && a.cableIy === iy) || (b.cableOn && b.cableIx === ix && b.cableIy === iy)) {
    return { ...same, reason: "this kilometer is already wired" };
  }
  const km = cableKm(ix, iy);
  const cost = BigInt(km) * KG_PER_KM;
  if (a.finesKg < cost || b.finesKg < cost) return { ...same, reason: `need ${cost.toString()} kg of fines` };
  const take = (s: Stocks): Stocks => ({ ...s, finesKg: s.finesKg - cost, cableOn: 1, cableIx: ix, cableIy: iy });
  return { a: take(a), b: take(b), accepted: true, reason: `line laid, ${km} km, ${cost.toString()} kg. the climate cell did not move` };
}
