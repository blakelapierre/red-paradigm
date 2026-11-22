import { type Stocks } from "./power.ts";

/** 10 kW for 24 hours. A sol is longer. Dust does not touch this. */
export const KILOPOWER_KWH = 240;

export function commitReactor(a: Stocks, b: Stocks): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  if (a.reactor || b.reactor) return { a, b, accepted: false, reason: "the kilopower is already online" };
  return {
    a: { ...a, reactor: 1 },
    b: { ...b, reactor: 1 },
    accepted: true,
    reason: "10 kW is online. 240 kWh a sol. dust does not touch it",
  };
}
