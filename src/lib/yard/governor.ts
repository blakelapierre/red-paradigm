import { type World } from "../climate/model.ts";
import { type Crust } from "../crust/crust.ts";
import { commitBerm } from "./berm.ts";
import { commitBeds, BED_CAP } from "./bed.ts";
import { BIOMASS_WATER_KG } from "./biomass.ts";
import { CREW_WATER_KG } from "./crew.ts";
import { commitCollector } from "./collector.ts";
import { commitCompress } from "./compress.ts";
import { commitCondenser } from "./condenser.ts";
import { commitElectrolysis } from "./electrolysis.ts";
import { commitRepair } from "./health.ts";
import { commitMine } from "./ice.ts";
import { commitReactor } from "./kilopower.ts";
import { commitLamp } from "./lamp.ts";
import { commitMeter } from "./meter.ts";
import { commitMill } from "./mill.ts";
import { commitPaint } from "./paint.ts";
import { closeSol, commitPoweredCut, type Stocks } from "./power.ts";
import { commitRadiator } from "./radiator.ts";
import { commitRelease } from "./release.ts";
import { commitRoad } from "./road.ts";
import { commitRoof } from "./roof.ts";
import { commitSabatier } from "./sabatier.ts";
import { commitVent } from "./vent.ts";
import { commitWash } from "./wash.ts";
import { kilometerHolds } from "./hold.ts";

/** A general aim. The buttons still issue one order. The list is not a second physics. */
export type AimId = "power" | "cut" | "mill" | "shelter" | "ration" | "water" | "fuel" | "column" | "veil" | "ground" | "array";

export type Aim = { id: AimId; on: boolean };

export const AIM_NAME: Record<AimId, string> = {
  power: "Power",
  cut: "Cut",
  mill: "Mill",
  shelter: "Shelter",
  ration: "Ration",
  water: "Water",
  fuel: "Fuel",
  column: "Column",
  veil: "Veil",
  ground: "Ground",
  array: "Array",
};

export const DEFAULT_AIMS: readonly Aim[] = [
  { id: "power", on: true },
  { id: "cut", on: true },
  { id: "mill", on: true },
  { id: "shelter", on: true },
  { id: "ration", on: true },
  { id: "water", on: true },
  { id: "fuel", on: true },
  { id: "column", on: false },
  { id: "veil", on: false },
  { id: "ground", on: false },
  { id: "array", on: false },
];

export type Yard = {
  canon: World;
  witness: World;
  canonCrust: Crust;
  witnessCrust: Crust;
  canonStocks: Stocks;
  witnessStocks: Stocks;
};

/** The kilometer the map has selected, and the survey pressure of that climate cell. */
export type WorkSite = {
  ix: number;
  iy: number;
  pressurePa: number;
  climateIndex: number;
  latDeg: number;
};

type StockResult = { a: Stocks; b: Stocks; accepted: boolean; reason: string };
type CrustStockResult = {
  a: Crust;
  b: Crust;
  aStocks: Stocks;
  bStocks: Stocks;
  accepted: boolean;
  reason: string;
};

function takeStocks(yard: Yard, result: StockResult, landed: string[]): Yard {
  if (!result.accepted) return yard;
  landed.push(result.reason);
  return { ...yard, canonStocks: result.a, witnessStocks: result.b };
}

function takeCrust(yard: Yard, result: CrustStockResult, landed: string[]): Yard {
  if (!result.accepted) return yard;
  landed.push(result.reason);
  return {
    ...yard,
    canonCrust: result.a,
    witnessCrust: result.b,
    canonStocks: result.aStocks,
    witnessStocks: result.bStocks,
  };
}

function runAim(yard: Yard, id: AimId, site: WorkSite, landed: string[]): Yard {
  const pressurePa = Math.round(site.pressurePa);
  if (id === "power") return takeStocks(yard, commitReactor(yard.canonStocks, yard.witnessStocks), landed);
  if (id === "cut") {
    return takeCrust(
      yard,
      commitPoweredCut(yard.canonCrust, yard.witnessCrust, yard.canonStocks, yard.witnessStocks, site.ix, site.iy),
      landed,
    );
  }
  if (id === "mill") {
    return takeCrust(yard, commitMill(yard.canonCrust, yard.witnessCrust, yard.canonStocks, yard.witnessStocks), landed);
  }
  if (id === "shelter") {
    let next = takeCrust(
      yard,
      commitRoof(yard.canonCrust, yard.witnessCrust, yard.canonStocks, yard.witnessStocks, site.ix, site.iy),
      landed,
    );
    next = takeStocks(next, commitMeter(next.canonStocks, next.witnessStocks), landed);
    next = takeStocks(next, commitVent(next.canonStocks, next.witnessStocks, next.canon), landed);
    next = takeStocks(next, commitLamp(next.canonCrust, next.witnessCrust, next.canonStocks, next.witnessStocks), landed);
    return takeStocks(next, commitRadiator(next.canonStocks, next.witnessStocks), landed);
  }
  if (id === "ration") {
    return takeStocks(yard, commitBeds(yard.canonCrust, yard.witnessCrust, yard.canonStocks, yard.witnessStocks), landed);
  }
  if (id === "water") {
    let next = yard;
    if (next.canonStocks.toxinMilli !== 0 || next.witnessStocks.toxinMilli !== 0) {
      next = takeStocks(next, commitWash(next.canonStocks, next.witnessStocks), landed);
    }
    if (!waterShort(next.canonStocks) && !waterShort(next.witnessStocks)) return next;
    const mined = takeStocks(next, commitMine(next.canonStocks, next.witnessStocks, pressurePa), landed);
    return takeStocks(mined, commitWash(mined.canonStocks, mined.witnessStocks), landed);
  }
  if (id === "fuel") {
    let next = takeStocks(yard, commitCompress(yard.canonStocks, yard.witnessStocks, yard.canon), landed);
    next = takeStocks(next, commitElectrolysis(next.canonStocks, next.witnessStocks), landed);
    return takeStocks(next, commitSabatier(next.canonStocks, next.witnessStocks, next.canon), landed);
  }
  if (id === "column") return takeStocks(yard, commitCondenser(yard.canonStocks, yard.witnessStocks, yard.canon), landed);
  if (id === "veil") {
    const released = commitRelease(
      yard.canon,
      yard.witness,
      yard.canonStocks,
      yard.witnessStocks,
      site.climateIndex,
      site.latDeg,
    );
    if (!released.accepted) return yard;
    landed.push(released.reason);
    return {
      ...yard,
      canon: released.a,
      witness: released.b,
      canonStocks: released.aStocks,
      witnessStocks: released.bStocks,
    };
  }
  if (id === "ground") {
    let next = takeCrust(
      yard,
      commitPaint(yard.canonCrust, yard.witnessCrust, yard.canonStocks, yard.witnessStocks, site.ix, site.iy),
      landed,
    );
    next = takeCrust(
      next,
      commitRoad(next.canonCrust, next.witnessCrust, next.canonStocks, next.witnessStocks, site.ix, site.iy),
      landed,
    );
    return takeCrust(
      next,
      commitBerm(next.canonCrust, next.witnessCrust, next.canonStocks, next.witnessStocks, site.ix, site.iy),
      landed,
    );
  }
  if (id === "array") {
    const up = takeStocks(yard, commitCollector(yard.canonStocks, yard.witnessStocks), landed);
    return takeStocks(up, commitRepair(up.canonStocks, up.witnessStocks), landed);
  }
  return yard;
}

/** One pass. An aim that is off is skipped. A refusal spends nothing and does not stop the next aim. Once both floors are in, the list does not cut or mill. */
export function workList(
  yard: Yard,
  aims: readonly Aim[],
  site: WorkSite,
): { yard: Yard; landed: string[] } {
  const landed: string[] = [];
  let next = yard;
  const floored =
    floorReady(yard.canonCrust, yard.canonStocks) && floorReady(yard.witnessCrust, yard.witnessStocks);
  for (const aim of aims) {
    if (!aim.on) continue;
    if (floored && (aim.id === "cut" || aim.id === "mill")) continue;
    next = runAim(next, aim.id, site, landed);
  }
  return { yard: next, landed };
}

function floorReady(crust: Crust, stocks: Stocks): boolean {
  return crust.overrides.some((row) => row.roof === 1) && stocks.lamp === 1 && stocks.beds >= BED_CAP;
}

function waterShort(stocks: Stocks): boolean {
  const need = CREW_WATER_KG + BigInt(Math.max(0, stocks.beds)) * BIOMASS_WATER_KG;
  return stocks.waterKg < need;
}

/** Close sols, then one pass of the list after each close, if the yard is set to follow. Stops when the mark lands, or when a followed sol spends nothing. */
export function bankSols(
  yard: Yard,
  sols: number,
  aims: readonly Aim[],
  site: WorkSite,
  follow: boolean,
): { yard: Yard; landed: string[]; quiet: boolean; holds: boolean } {
  let next = yard;
  const landed: string[] = [];
  const steps = Math.max(0, Math.floor(sols));
  let quiet = false;
  for (let i = 0; i < steps; i++) {
    const canon = closeSol(next.canon, next.canonStocks, next.canonCrust);
    const witness = closeSol(next.witness, next.witnessStocks, next.witnessCrust);
    next = {
      canon: canon.world,
      witness: witness.world,
      canonCrust: canon.crust,
      witnessCrust: witness.crust,
      canonStocks: canon.stocks,
      witnessStocks: witness.stocks,
    };
    if (kilometerHolds(next.canonStocks) && kilometerHolds(next.witnessStocks)) {
      return { yard: next, landed, quiet: false, holds: true };
    }
    if (!follow) continue;
    const worked = workList(next, aims, site);
    next = worked.yard;
    landed.push(...worked.landed);
    if (worked.landed.length === 0) {
      quiet = true;
      break;
    }
  }
  return { yard: next, landed, quiet, holds: false };
}

export function moveAim(aims: readonly Aim[], index: number, dir: -1 | 1): Aim[] {
  const next = aims.map((aim) => ({ ...aim }));
  const j = index + dir;
  if (index < 0 || index >= next.length || j < 0 || j >= next.length) return next;
  const [row] = next.splice(index, 1);
  next.splice(j, 0, row);
  return next;
}

export function toggleAim(aims: readonly Aim[], id: AimId): Aim[] {
  return aims.map((aim) => (aim.id === id ? { ...aim, on: !aim.on } : { ...aim }));
}
