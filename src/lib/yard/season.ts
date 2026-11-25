import { seasonLabel, type World } from "../climate/model.ts";
import { arrayKwh } from "./power.ts";
import { ROOF_UPKEEP_KWH } from "./upkeep.ts";

/** The season is already in the array. It does not rewrite the roof bill. */
export function seasonPayLine(world: World, index: number): string {
  const kwh = arrayKwh(world, index).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${seasonLabel(world.ls)}. The array pays ${kwh} kWh this sol. The roof bill stays ${ROOF_UPKEEP_KWH.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} kWh.`;
}

export function sameRoofBill(): number {
  return ROOF_UPKEEP_KWH;
}
