import { STORM_DURATION, STORM_SOL } from "../climate/constants.ts";
import { type Stocks } from "./power.ts";

/** The storm is filed on sol 12 and strips for 40. The call is only open before it. */
export type StormPhase = "before" | "stripping" | "after";

/** One choice. The list does not make it. */
export type StormCall = "loft" | "bank" | "neighbor";

export function stormPhase(sol: number): StormPhase {
  if (sol < STORM_SOL) return "before";
  if (sol < STORM_SOL + STORM_DURATION) return "stripping";
  return "after";
}

export function solsUntilStorm(sol: number): number {
  return Math.max(0, STORM_SOL - Math.max(0, Math.floor(sol)));
}

export function stormCallLine(sol: number): string {
  const phase = stormPhase(sol);
  if (phase === "stripping") return "The storm is stripping. The call is closed.";
  if (phase === "after") return "The storm has passed.";
  const n = solsUntilStorm(sol);
  if (n === 1) return "The storm is filed in 1 sol. Choose loft, bank, or the neighbor.";
  return `The storm is filed in ${n} sols. Choose loft, bank, or the neighbor.`;
}

export function callOpen(sol: number): boolean {
  return stormPhase(sol) === "before";
}

export function sessionOver(sol: number): boolean {
  return stormPhase(sol) === "after";
}

/** Undefined keeps the old list. Null means the call is still open, so the list does not loft. */
export function listMayVeil(call: StormCall | null | undefined): boolean {
  if (call === undefined) return true;
  return call === "loft";
}

/** Stop on the sol before the storm is filed, until a call is in. */
export function blocksStorm(sol: number, call: StormCall | null | undefined): boolean {
  if (call === undefined) return false;
  return call === null && sol < STORM_SOL && sol + 1 >= STORM_SOL;
}

export function takeCall(
  current: StormCall | null,
  next: StormCall,
  sol: number,
  stocks?: Stocks,
): { call: StormCall | null; accepted: boolean; reason: string } {
  if (!callOpen(sol)) return { call: current, accepted: false, reason: "the call is closed" };
  if (current !== null) return { call: current, accepted: false, reason: "the call is already made" };
  if (next !== "loft" && next !== "bank" && next !== "neighbor") {
    return { call: current, accepted: false, reason: "that is not a call" };
  }
  if (next === "loft" && stocks && stocks.techClimate !== 1) {
    return { call: current, accepted: false, reason: "climate is not known" };
  }
  return { call: next, accepted: true, reason: callReason(next) };
}

function callReason(call: StormCall): string {
  if (call === "loft") return "The call is loft.";
  if (call === "bank") return "The call is bank. The battery stays for the roof.";
  return "The call is the neighbor.";
}
