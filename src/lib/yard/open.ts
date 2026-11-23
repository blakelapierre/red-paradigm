import { type Crust } from "../crust/crust.ts";
import { type Stocks } from "./power.ts";

function roofed(crust: Crust): boolean {
  return crust.overrides.some((row) => row.roof === 1);
}

function leak(kg: bigint, divisor: bigint): bigint {
  if (kg <= 0n) return kg;
  const pct = kg / divisor;
  const loss = pct > 0n ? pct : 1n;
  const next = kg - loss;
  return next > 0n ? next : 0n;
}

/** Open water does not sit. One percent a sol, and at least a kilogram. */
export function boilWater(crust: Crust, stocks: Stocks): Stocks {
  if (roofed(crust)) return stocks;
  return { ...stocks, waterKg: leak(stocks.waterKg, 100n) };
}

/** Hydrogen leaves faster than methane. Ten percent a sol, and at least a kilogram. An order of magnitude. */
export function ventHydrogen(crust: Crust, stocks: Stocks): Stocks {
  if (roofed(crust)) return stocks;
  return { ...stocks, h2Kg: leak(stocks.h2Kg, 10n) };
}

/** Open oxygen is a cryogen, not a sky. One percent a sol, and at least a kilogram. */
export function ventOxygen(crust: Crust, stocks: Stocks): Stocks {
  if (roofed(crust)) return stocks;
  return { ...stocks, o2Kg: leak(stocks.o2Kg, 100n) };
}
