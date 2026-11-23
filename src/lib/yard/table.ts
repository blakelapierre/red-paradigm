import { cellLat, cellLon, latIndexOf, lonIndexOf } from "../climate/constants.ts";
import { createWorld, siteIndex, surveyPressure, type World } from "../climate/model.ts";
import { cellOf, createCrust, type Crust } from "../crust/crust.ts";
import { DEFAULT_AIMS, type Aim, type WorkSite } from "./governor.ts";
import { createStocks, type Stocks } from "./power.ts";

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
