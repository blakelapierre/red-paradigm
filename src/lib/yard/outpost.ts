import { siteIndex, type World } from "../climate/model.ts";
import { centerKm, siteAt } from "./km.ts";
import { type WorkSite } from "./governor.ts";

/** The Datum is another climate cell on the cradle's books. Not the Works, and not a second warehouse. */
export function datumSite(world: World): WorkSite {
  const at = centerKm(siteIndex("datum"));
  return siteAt(world, at.ix, at.iy);
}

export function datumIsCradleCell(): boolean {
  return siteIndex("datum") === siteIndex("cradle");
}
