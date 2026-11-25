import { siteIndex, type World } from "../climate/model.ts";
import { commitRoof } from "./roof.ts";
import { centerKm, siteAt, stepKm } from "./km.ts";
import { type WorkSite, type Yard } from "./governor.ts";
import { type StormCall } from "./session.ts";

/** One kilometer east of that yard's home. Not the cursor. */
export function homeNeighbor(world: World, home: "cradle" | "works"): WorkSite | null {
  const at = centerKm(siteIndex(home));
  const east = stepKm(at.ix, at.iy, "e");
  if (!east) return null;
  return siteAt(world, east.ix, east.iy);
}

/** The neighbor call roofs that kilometer. Bank and loft spend nothing here. */
export function applyNeighbor(
  yard: Yard,
  call: StormCall | null,
  neighbor: WorkSite | null,
): { yard: Yard; accepted: boolean; reason: string } {
  if (call !== "neighbor") return { yard, accepted: false, reason: "the call is not the neighbor" };
  if (!neighbor) return { yard, accepted: false, reason: "no neighbor" };
  const beforeA = yard.canon;
  const beforeB = yard.witness;
  const roofed = commitRoof(
    yard.canonCrust,
    yard.witnessCrust,
    yard.canonStocks,
    yard.witnessStocks,
    neighbor.ix,
    neighbor.iy,
  );
  if (!roofed.accepted) return { yard, accepted: false, reason: roofed.reason };
  return {
    accepted: true,
    reason: roofed.reason,
    yard: {
      ...yard,
      canon: beforeA,
      witness: beforeB,
      canonCrust: roofed.a,
      witnessCrust: roofed.b,
      canonStocks: roofed.aStocks,
      witnessStocks: roofed.bStocks,
    },
  };
}
