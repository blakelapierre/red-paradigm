import { cellLat, cellLon, latIndexOf, lonIndexOf } from "../climate/constants.ts";
import { sha256, toHex } from "../climate/hash.ts";
import { createWorld, siteIndex, step, stormTau, surveyPressure, type World } from "../climate/model.ts";
import { cellOf, createCrust, type Crust } from "../crust/crust.ts";
import { turnHash } from "../turn.ts";
import { DEFAULT_AIMS, workList, type Aim, type WorkSite, type Yard } from "./governor.ts";
import { cradleHolding, kilometerHolds } from "./hold.ts";
import { createStocks, liveSol, type Stocks } from "./power.ts";

/** One window is one yard. The other yard is another window, not a second seat here. */
export type SeatId = "cradle" | "works";

export type SeatYard = {
  crust: Crust;
  witnessCrust: Crust;
  stocks: Stocks;
  witnessStocks: Stocks;
  aims: Aim[];
  sealedSol: number | null;
};

/** One climate, two yards. Each yard keeps its own witness of the stocks and the crust. */
export type Table = {
  climate: World;
  witness: World;
  cradle: SeatYard;
  works: SeatYard;
};

/** One mill of fines and a reactor. Ahead of the cradle, not already holding. */
export const WORKS_FINES_KG = 5_000_000n;

/** The works already has a reactor. It does not cut or mill the head start away, and it does not loft. */
export const WORKS_AIMS: readonly Aim[] = DEFAULT_AIMS.map((aim) =>
  aim.id === "power" || aim.id === "cut" || aim.id === "mill" || aim.id === "veil" ? { ...aim, on: false } : { ...aim },
);

function freshSeat(seed: Stocks = createStocks(), aims: readonly Aim[] = DEFAULT_AIMS): SeatYard {
  return {
    crust: createCrust(),
    witnessCrust: createCrust(),
    stocks: seed,
    witnessStocks: { ...seed },
    aims: aims.map((aim) => ({ ...aim })),
    sealedSol: null,
  };
}

export function createTable(): Table {
  const works = { ...createStocks(), reactor: 1, finesKg: WORKS_FINES_KG };
  return {
    climate: createWorld(),
    witness: createWorld(),
    cradle: freshSeat(),
    works: freshSeat(works, WORKS_AIMS),
  };
}

export function seatFromSearch(search: string): SeatId {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(raw).get("seat") === "works" ? "works" : "cradle";
}

/** Off unless this window asked to sit. One window alone keeps the cradle board. */
export function tableWanted(search: string): boolean {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(raw).get("table") === "1";
}

export function seatSite(world: World, seat: SeatId): WorkSite {
  const index = siteIndex(seat);
  const lat = cellLat(latIndexOf(index));
  const lon = cellLon(lonIndexOf(index));
  const at = cellOf(lat, lon);
  return {
    ix: at.ix,
    iy: at.iy,
    pressurePa: Math.round(surveyPressure(world.zM[index])),
    climateIndex: index,
    latDeg: lat,
  };
}

function liveYard(before: World, after: World, beforeWitness: World, afterWitness: World, seat: SeatYard, index: number): SeatYard {
  const canon = liveSol(before, after, seat.stocks, seat.crust, index);
  const witness = liveSol(beforeWitness, afterWitness, seat.witnessStocks, seat.witnessCrust, index);
  return {
    ...seat,
    crust: canon.crust,
    stocks: canon.stocks,
    witnessCrust: witness.crust,
    witnessStocks: witness.stocks,
    sealedSol: null,
  };
}

/** Step the shared climate once. Each yard banks the sun at its own site. */
export function closeTable(table: Table): Table {
  const climate = step(table.climate, { fileStorm: true });
  const witness = step(table.witness, { fileStorm: true });
  return {
    climate,
    witness,
    cradle: liveYard(table.climate, climate, table.witness, witness, table.cradle, siteIndex("cradle")),
    works: liveYard(table.climate, climate, table.witness, witness, table.works, siteIndex("works")),
  };
}

export function sealSeat(table: Table, seat: SeatId, aims: readonly Aim[]): Table {
  const row = table[seat];
  return {
    ...table,
    [seat]: { ...row, aims: aims.map((aim) => ({ ...aim })), sealedSol: table.climate.sol },
  };
}

export function bothSealed(table: Table): boolean {
  return table.cradle.sealedSol === table.climate.sol && table.works.sealedSol === table.climate.sol;
}

/** The sol stays open until both yards have sealed it. */
export function closeIfSealed(table: Table): { table: Table; closed: boolean } {
  if (!bothSealed(table)) return { table, closed: false };
  return { table: closeTable(table), closed: true };
}

/** Spend this yard's list. The other yard's stocks and crust are not in the order. */
export function runSeat(table: Table, seat: SeatId, site: WorkSite = seatSite(table.climate, seat)): { table: Table; landed: string[] } {
  const other: SeatId = seat === "cradle" ? "works" : "cradle";
  const foreign = seatSite(table.climate, other);
  if (site.ix === foreign.ix && site.iy === foreign.iy) {
    return { table, landed: ["that kilometer is the other yard"] };
  }
  const row = table[seat];
  const yard: Yard = {
    canon: table.climate,
    witness: table.witness,
    canonCrust: row.crust,
    witnessCrust: row.witnessCrust,
    canonStocks: row.stocks,
    witnessStocks: row.witnessStocks,
  };
  const worked = workList(yard, row.aims, site);
  return {
    landed: worked.landed,
    table: {
      ...table,
      climate: worked.yard.canon,
      witness: worked.yard.witness,
      [seat]: {
        ...row,
        crust: worked.yard.canonCrust,
        witnessCrust: worked.yard.witnessCrust,
        stocks: worked.yard.canonStocks,
        witnessStocks: worked.yard.witnessStocks,
      },
      [other]: table[other],
    },
  };
}

/** Climate plus both yards, canon and witness. A dropped storm splits. */
export function tableHash(table: Table): string {
  const lines = [
    turnHash(table.climate, table.cradle.crust, table.cradle.stocks),
    turnHash(table.witness, table.cradle.witnessCrust, table.cradle.witnessStocks),
    turnHash(table.climate, table.works.crust, table.works.stocks),
    turnHash(table.witness, table.works.witnessCrust, table.works.witnessStocks),
  ].join("\n");
  return toHex(sha256(new TextEncoder().encode(lines)));
}

export type SealMsg = { type: "seal"; seat: SeatId; aims: Aim[]; sol: number };

export type TableMsg = SealMsg | { type: "table"; table: Table; hash: string };

export type TableState = { table: Table; split: boolean; waiting: boolean; log: string[] };

/** Record a seal. When both yards have sealed the sol, step the climate once and run each list on its own yard. */
export function reduceTable(state: TableState, msg: TableMsg): TableState {
  if (msg.type === "table") {
    if (msg.hash !== tableHash(msg.table)) return { ...state, split: true };
    return { table: msg.table, split: false, waiting: !bothSealed(msg.table), log: state.log };
  }
  if (msg.sol !== state.table.climate.sol) return state;
  const sealed = sealSeat(state.table, msg.seat, msg.aims);
  if (!bothSealed(sealed)) return { table: sealed, split: false, waiting: true, log: state.log };
  const closed = closeTable(sealed);
  const cradle = runSeat(closed, "cradle");
  const works = runSeat(cradle.table, "works");
  return { table: works.table, split: false, waiting: false, log: [...cradle.landed, ...works.landed] };
}

export function replaySeals(seals: readonly SealMsg[]): TableState {
  return seals.reduce<TableState>(reduceTable, { table: createTable(), split: false, waiting: false, log: [] });
}

export function splitLine(split: boolean): string | null {
  if (!split) return null;
  return "HASH SPLIT. This window did not take that table.";
}

export type FaceBit = "held" | "dark";

export type PublicFace = {
  sol: number;
  ls: number;
  storming: boolean;
  cradle: FaceBit;
  works: FaceBit;
  cradleThrough: boolean;
  worksThrough: boolean;
};

/** Held or dark. Not the warehouse. */
export function faceBit(crust: Crust, stocks: Stocks): FaceBit {
  if (stocks.stormHeld === 1 || kilometerHolds(stocks) || cradleHolding(crust, stocks)) return "held";
  return "dark";
}

export function publicFace(table: Table): PublicFace {
  return {
    sol: table.climate.sol,
    ls: table.climate.ls,
    storming: stormTau(table.climate.sol, table.climate.storm) > 0.05,
    cradle: faceBit(table.cradle.crust, table.cradle.stocks),
    works: faceBit(table.works.crust, table.works.stocks),
    cradleThrough: table.cradle.stocks.stormHeld === 1,
    worksThrough: table.works.stocks.stormHeld === 1,
  };
}

/** After the dust, the only scores are one held, both held, or both dark. */
export function stormVerdict(table: Table): string | null {
  const face = publicFace(table);
  if (face.storming) return null;
  const seen = table.cradle.stocks.stormSeen === 1 || table.works.stocks.stormSeen === 1;
  if (!seen) return null;
  if (face.cradle === "held" && face.works === "held") return "Both yards held.";
  if (face.cradle === "dark" && face.works === "dark") return "Both yards went dark.";
  return "One yard held. The other went dark.";
}
