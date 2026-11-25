import { createWorld } from "../climate/model.ts";
import { cradleHolding } from "./hold.ts";
import { createCrust } from "../crust/crust.ts";
import { createStocks, type Stocks } from "./power.ts";
import { WORKS_FINES_KG } from "./table.ts";

/** Arrival order. All of them are in play on sol 0. None of them is a second player inside this window. */
export type FactionId = "industrial" | "scientific" | "final";

export const FACTION_NAME: Record<FactionId, string> = {
  industrial: "Industrial",
  scientific: "Scientific",
  final: "Final wave",
};

export const ARRIVAL: Record<FactionId, number> = {
  industrial: 0,
  scientific: 1,
  final: 2,
};

/** A starting package. Not a turn, and not a unit. */
export function packageStocks(id: FactionId): Stocks {
  const base = createStocks();
  if (id === "industrial") return { ...base, reactor: 1, finesKg: WORKS_FINES_KG };
  if (id === "scientific") return { ...base, collector: 1 };
  return base;
}

export function factionHolding(id: FactionId): boolean {
  return cradleHolding(createCrust(), packageStocks(id));
}

/** The package does not fast-forward the climate. Earlier is not an NPC. */
export function factionStartSol(id: FactionId): number {
  void id;
  return createWorld().sol;
}
