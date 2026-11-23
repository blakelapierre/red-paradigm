import { cellLat, cellLon, latIndexOf, lonIndexOf } from "../climate/constants.ts";
import { sha256, toHex } from "../climate/hash.ts";
import { createWorld, siteIndex, step, surveyPressure, type World } from "../climate/model.ts";
import { cellOf, createCrust, type Crust } from "../crust/crust.ts";
import { turnHash } from "../turn.ts";
import { DEFAULT_AIMS, workList, type Aim, type WorkSite, type Yard } from "./governor.ts";
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

function freshSeat(): SeatYard {
  return {
    crust: createCrust(),
    witnessCrust: createCrust(),
    stocks: createStocks(),
    witnessStocks: createStocks(),
    aims: DEFAULT_AIMS.map((aim) => ({ ...aim })),
    sealedSol: null,
  };
}

export function createTable(): Table {
  return {
    climate: createWorld(),
    witness: createWorld(),
    cradle: freshSeat(),
    works: freshSeat(),
  };
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
  const other: SeatId = seat === "cradle" ? "works" : "cradle";
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
