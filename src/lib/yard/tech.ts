import { type Stocks } from "./power.ts";

export type LearnId = "climate" | "seed";

/** Learning spends nothing. The order it unlocks still costs what it costs. */
export function learnTech(
  a: Stocks,
  b: Stocks,
  id: LearnId,
): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, accepted: false };
  if (a.techIsru !== 1 || b.techIsru !== 1) return { ...same, reason: "ISRU is not known" };
  if (id === "climate") {
    if (a.techClimate === 1 || b.techClimate === 1) return { ...same, reason: "climate is already known" };
    const take = (s: Stocks): Stocks => ({ ...s, techClimate: 1 });
    return { a: take(a), b: take(b), accepted: true, reason: "Climate is known. The loft still costs the loft." };
  }
  if (a.techClimate !== 1 || b.techClimate !== 1) return { ...same, reason: "climate is not known" };
  if (a.techSeed === 1 || b.techSeed === 1) return { ...same, reason: "the seed is already known" };
  const take = (s: Stocks): Stocks => ({ ...s, techSeed: 1 });
  return { a: take(a), b: take(b), accepted: true, reason: "The seed is known. It still costs the methane and the oxygen." };
}
