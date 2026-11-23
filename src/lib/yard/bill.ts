import { type Crust } from "../crust/crust.ts";
import { ROOF_UPKEEP_KWH } from "./upkeep.ts";

export function roofCount(crust: Crust): number {
  return crust.overrides.reduce((n, row) => n + (row.roof === 1 ? 1 : 0), 0);
}

/** Upkeep for every standing roof, plus whatever the lamps will draw this sol. */
export function roofBillKwh(roofs: number, lampKwh: number): number {
  return roofs * ROOF_UPKEEP_KWH + Math.max(0, lampKwh);
}

export function sunPaysRoof(sunKwh: number, roofs: number, lampKwh: number): boolean {
  if (roofs === 0) return true;
  return sunKwh >= roofBillKwh(roofs, lampKwh);
}

export function roofWarning(sunKwh: number, roofs: number, lampKwh: number): string | null {
  if (roofs === 0 || sunPaysRoof(sunKwh, roofs, lampKwh)) return null;
  const bill = roofBillKwh(roofs, lampKwh);
  return `This sol's sun is ${sunKwh} kWh. The roof bill is ${bill} kWh.`;
}

/** The warning is one sentence for both clients. A split hash says nothing. */
export function sharedRoofWarning(agree: boolean, sunKwh: number, roofs: number, lampKwh: number): string | null {
  if (!agree) return null;
  return roofWarning(sunKwh, roofs, lampKwh);
}
