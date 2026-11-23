import { type Crust } from "../crust/crust.ts";
import { BED_CAP } from "./bed.ts";
import { RATION_G } from "./food.ts";
import { HELD_MARK } from "./hold.ts";
import { type Stocks } from "./power.ts";

/** The five lines a player needs. The stock grid is the rest. */
export function vesselLines(crust: Crust, stocks: Stocks): string[] {
  const roof = crust.overrides.some((row) => row.roof === 1);
  return [
    roof ? "Roof up" : "No roof",
    `Beds ${stocks.beds}/${BED_CAP}`,
    `Food ${stocks.biomassG}/${RATION_G} g`,
    `Cabin ${stocks.cabinO2Kg.toString()} kg`,
    `Hold ${stocks.heldSols}/${HELD_MARK}`,
  ];
}
