import { credit, type Stocks } from "./power.ts";

/** CH4 + 2 O2 → CO2 + 2 H2O, credited as 8 kWh of electricity per kilogram of methane. */
export const BURN_CH4_KG = 16n;
export const BURN_O2_KG = 64n;
export const BURN_WATER_KG = 36n;
export const BURN_KWH_PER_KG = 8;

export function commitBurn(a: Stocks, b: Stocks): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, accepted: false };
  if (a.ch4Kg < BURN_CH4_KG || b.ch4Kg < BURN_CH4_KG) return { ...same, reason: `need ${BURN_CH4_KG} kg of methane` };
  if (a.o2Kg < BURN_O2_KG || b.o2Kg < BURN_O2_KG) return { ...same, reason: `need ${BURN_O2_KG} kg of oxygen` };
  const gained = Number(BURN_CH4_KG) * BURN_KWH_PER_KG;
  const take = (s: Stocks): Stocks =>
    credit(
      { ...s, ch4Kg: s.ch4Kg - BURN_CH4_KG, o2Kg: s.o2Kg - BURN_O2_KG, waterKg: s.waterKg + BURN_WATER_KG },
      gained,
    );
  return { a: take(a), b: take(b), accepted: true, reason: `burned methane for ${gained} kWh` };
}
