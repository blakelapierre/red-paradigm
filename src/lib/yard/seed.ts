import { airKg, type World } from "../climate/model.ts";
import { type Crust } from "../crust/crust.ts";
import { BURN_O2_KG } from "./burn.ts";
import { cradleHolding } from "./hold.ts";
import { type Stocks } from "./power.ts";
import { SABATIER_CH4_KG } from "./sabatier.ts";

/** Ten Sabatier batches, and the oxygen ten burns would take. An order of magnitude, not a ship catalog. */
export const SEED_BATCHES = 10;
export const SEED_CH4_KG = SABATIER_CH4_KG * BigInt(SEED_BATCHES);
export const SEED_O2_KG = BURN_O2_KG * BigInt(SEED_BATCHES);

export function commitSeed(
  aCrust: Crust,
  bCrust: Crust,
  a: Stocks,
  b: Stocks,
  world: World,
  otherGone = false,
): { a: Stocks; b: Stocks; accepted: boolean; reason: string; air: bigint } {
  const air = airKg(world.ls);
  const same = { a, b, accepted: false, air };
  if (otherGone || a.seed === 1 || b.seed === 1) return { ...same, reason: "the seed has already left" };
  if (a.techSeed !== 1 || b.techSeed !== 1) return { ...same, reason: "the seed is not known" };
  if (!cradleHolding(aCrust, a) || !cradleHolding(bCrust, b)) return { ...same, reason: "the yard is not holding" };
  if (a.ch4Kg < SEED_CH4_KG || b.ch4Kg < SEED_CH4_KG) return { ...same, reason: `need ${SEED_CH4_KG.toString()} kg of methane` };
  if (a.o2Kg < SEED_O2_KG || b.o2Kg < SEED_O2_KG) return { ...same, reason: `need ${SEED_O2_KG.toString()} kg of oxygen` };
  const take = (s: Stocks): Stocks => ({
    ...s,
    ch4Kg: s.ch4Kg - SEED_CH4_KG,
    o2Kg: s.o2Kg - SEED_O2_KG,
    seed: 1,
  });
  return {
    a: take(a),
    b: take(b),
    accepted: true,
    reason: "A seed mass has left. The yard is still holding. This is not a sky.",
    air,
  };
}
