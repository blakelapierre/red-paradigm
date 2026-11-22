import { type Crust } from "../crust/crust.ts";
import { type Stocks } from "./power.ts";

/** Open methane does not store itself. A standing roof is the tank. */
export function boilMethane(crust: Crust, stocks: Stocks): Stocks {
  if (crust.overrides.some((row) => row.roof === 1) || stocks.ch4Kg <= 0n) return stocks;
  const pct = stocks.ch4Kg / 100n;
  const loss = pct > 0n ? pct : 1n;
  const next = stocks.ch4Kg - loss;
  return { ...stocks, ch4Kg: next > 0n ? next : 0n };
}
