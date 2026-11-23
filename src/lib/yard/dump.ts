import { KG_PER_CM, fillOneCm, type Crust } from "../crust/crust.ts";

/** One centimeter back into the hole. Not a second cut. */
export function commitDump(
  a: Crust,
  b: Crust,
  ix: number,
  iy: number,
): { a: Crust; b: Crust; accepted: boolean; reason: string } {
  const same = { a, b, accepted: false };
  if (a.tailingsKg < KG_PER_CM || b.tailingsKg < KG_PER_CM) {
    return { ...same, reason: `need ${KG_PER_CM.toString()} kg of tailings` };
  }
  const left = fillOneCm(a, ix, iy);
  const right = fillOneCm(b, ix, iy);
  if (!left.accepted || !right.accepted) return { ...same, reason: left.accepted ? right.reason : left.reason };
  const take = (filled: Crust, before: Crust): Crust => ({
    ...filled,
    tailingsKg: before.tailingsKg - KG_PER_CM,
    holdKg: before.holdKg + KG_PER_CM,
  });
  return {
    a: take(left.crust, a),
    b: take(right.crust, b),
    accepted: true,
    reason: "returned 1 cm. 15,000,000 kg is back in the hole. that is not a second cut",
  };
}
