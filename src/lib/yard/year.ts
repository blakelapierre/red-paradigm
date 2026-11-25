import { SOLS_PER_YEAR } from "../climate/constants.ts";

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
