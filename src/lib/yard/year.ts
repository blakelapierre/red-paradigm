import { SOLS_PER_YEAR } from "../climate/constants.ts";

/** One turn. From the clock, not a tuning knob. */
export const TURN_SOLS = 28;

/** Degrees of solar longitude between two sols. The year is 668.6, not an integer. */
export function lsTraveled(fromSol: number, toSol: number): number {
  return (toSol - fromSol) * (360 / SOLS_PER_YEAR);
}

/** True once Ls has gone all the way around. The sol count is derived. It is not a stored 669. */
export function lsAround(fromSol: number, toSol: number): boolean {
  return lsTraveled(fromSol, toSol) >= 360;
}

/** How many times Ls has come back around since start. */
export function circuits(sol: number, start = 0): number {
  if (sol <= start) return 0;
  return Math.floor((sol - start) / SOLS_PER_YEAR);
}

/** The board says the longitude, not a year number. */
export function yearLine(sol: number, start = 0): string {
  const n = circuits(sol, start);
  if (n < 1) return "Ls has not come back around.";
  if (n === 1) return "Ls has come back around.";
  return `Ls has come back around ${n} times.`;
}

/** Twenty-four turns pass the longitude and are still not a year. */
export function turnsPast(turns: number): boolean {
  return turns * TURN_SOLS >= SOLS_PER_YEAR;
}

