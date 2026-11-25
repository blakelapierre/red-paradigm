import { siteIndex } from "../climate/model.ts";
import { airKg } from "../climate/model.ts";
import { type Table, publicFace } from "./table.ts";
import { sessionOver } from "./session.ts";

/** Both yards held the storm, and neither home cell was lofted. Not a sky. */
export function atPeace(table: Table): boolean {
  if (!sessionOver(table.climate.sol)) return false;
  const face = publicFace(table);
  if (!face.cradleThrough || !face.worksThrough) return false;
  const cradle = siteIndex("cradle");
  const works = siteIndex("works");
  return table.climate.tauAerMilli[cradle] === 0 && table.climate.tauAerMilli[works] === 0;
}

export function peaceLine(table: Table): string | null {
  if (!sessionOver(table.climate.sol)) return null;
  if (!atPeace(table)) return null;
  return "Both yards held. The cell was not pushed. This is not a sky.";
}

/** Peace does not touch the air mass. The figure is still solar longitude. */
export function peaceAir(table: Table): bigint {
  return airKg(table.climate.ls);
}
