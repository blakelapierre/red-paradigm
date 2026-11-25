import { cellIndex, cellLat, cellLon, latIndexOf, lonIndexOf } from "../climate/constants.ts";
import { surveyPressure, type World } from "../climate/model.ts";
import { COLS, ROWS, cellCenter, cellOf } from "../crust/crust.ts";
import { type WorkSite } from "./governor.ts";

export type Dir = "n" | "e" | "s" | "w";

/** The climate cell that contains this kilometer. One step is not a new cell. */
export function climateIndexOfKm(ix: number, iy: number): number {
  const at = cellCenter(ix, iy);
  return cellIndex(at.lat, at.lon);
}

export function centerKm(climateIndex: number): { ix: number; iy: number } {
  return cellOf(cellLat(latIndexOf(climateIndex)), cellLon(lonIndexOf(climateIndex)));
}

/** One kilometer. North is +iy. Off the grid is a refusal, not a wrap. */
export function stepKm(ix: number, iy: number, dir: Dir): { ix: number; iy: number } | null {
  const x = dir === "e" ? ix + 1 : dir === "w" ? ix - 1 : ix;
  const y = dir === "n" ? iy + 1 : dir === "s" ? iy - 1 : iy;
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
  return { ix: x, iy: y };
}

/** The kilometer the former is standing on. Pressure is the climate cell's, not a new atmosphere. */
export function siteAt(world: World, ix: number, iy: number): WorkSite {
  const index = climateIndexOfKm(ix, iy);
  const at = cellCenter(ix, iy);
  return {
    ix,
    iy,
    pressurePa: Math.round(surveyPressure(world.zM[index])),
    climateIndex: index,
    latDeg: at.lat,
  };
}

