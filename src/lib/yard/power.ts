import { PANEL_M2, cellLat, latIndexOf } from "../climate/constants.ts";
import { inspect, siteIndex, step, stormTau, type World } from "../climate/model.ts";
import { commitDig, flagOf, type Crust } from "../crust/crust.ts";
import { boilMethane } from "./boil.ts";
import { CRADLE_CELL } from "./cable.ts";
import { boilWater, ventHydrogen, ventOxygen } from "./open.ts";
import { grow } from "./biomass.ts";
import { collectSalvage } from "./collector.ts";
import { drawCrew } from "./crew.ts";
import { eat } from "./food.ts";
import { abrade, scaleArray } from "./health.ts";
import { KILOPOWER_KWH } from "./kilopower.ts";
import { keepRoof } from "./upkeep.ts";
import { shedHeat } from "./radiator.ts";

/** One crust cell of panels at the Low Cradle. Not the 100 m² survey coupon. */
export const ARRAY_M2 = 1_000_000;
/** 2 m × 1 km² at 1 kWh per cubic meter, the order of powered excavation. */
export const CUT_KWH = 2_000_000;
export const BATTERY_CAP_KWH = 4_000_000;

export const CRADLE = siteIndex("cradle");

export type Stocks = {
  batteryKwh: number;
  capKwh: number;
  finesKg: bigint;
  waterKg: bigint;
  iceKg: bigint;
  o2Kg: bigint;
  h2Kg: bigint;
  ch4Kg: bigint;
  toxinMilli: number;
  debt: number;
  biomassG: number;
  collector: number;
  healthMilli: number;
  brineKg: bigint;
  reactor: number;
  cabinRiseK: number;
  drawnKg: number;
  heatKwh: number;
  radiator: number;
  co2Kg: bigint;
  cabinCo2Kg: bigint;
  foodDebt: number;
  lamp: number;
  beds: number;
  cableOn: number;
  cableIx: number;
  cableIy: number;
  cabinO2Kg: bigint;
};

export function createStocks(): Stocks {
  return {
    batteryKwh: 0,
    capKwh: BATTERY_CAP_KWH,
    finesKg: 0n,
    waterKg: 0n,
    iceKg: 1_000_000_000n,
    o2Kg: 0n,
    h2Kg: 0n,
    ch4Kg: 0n,
    toxinMilli: 0,
    debt: 0,
    biomassG: 0,
    collector: 0,
    healthMilli: 1000,
    brineKg: 0n,
    reactor: 0,
    cabinRiseK: 0,
    drawnKg: 0,
    heatKwh: 0,
    radiator: 0,
    co2Kg: 0n,
    cabinCo2Kg: 0n,
    foodDebt: 0,
    lamp: 0,
    beds: 1,
    cableOn: 0,
    cableIx: 0,
    cableIy: 0,
    cabinO2Kg: 0n,
  };
}

export function arrayKwh(world: World, index = CRADLE): number {
  const panel = inspect(world, index).kwh;
  return Math.round((panel * ARRAY_M2) / PANEL_M2);
}

export function credit(stocks: Stocks, kwh: number): Stocks {
  if (!Number.isInteger(kwh) || kwh < 0) return stocks;
  return { ...stocks, batteryKwh: Math.min(stocks.capKwh, stocks.batteryKwh + kwh) };
}

export function stocksBytes(stocks: Stocks): Uint8Array {
  const bytes = new Uint8Array(156);
  const view = new DataView(bytes.buffer);
  bytes.set([0x50, 0x57, 0x52, 0x31]);
  view.setUint32(4, stocks.batteryKwh);
  view.setUint32(8, stocks.capKwh);
  view.setUint32(12, Number((stocks.finesKg >> 32n) & 0xffffffffn));
  view.setUint32(16, Number(stocks.finesKg & 0xffffffffn));
  view.setUint32(20, Number((stocks.waterKg >> 32n) & 0xffffffffn));
  view.setUint32(24, Number(stocks.waterKg & 0xffffffffn));
  view.setUint32(28, Number((stocks.iceKg >> 32n) & 0xffffffffn));
  view.setUint32(32, Number(stocks.iceKg & 0xffffffffn));
  view.setUint32(36, Number((stocks.o2Kg >> 32n) & 0xffffffffn));
  view.setUint32(40, Number(stocks.o2Kg & 0xffffffffn));
  view.setUint32(44, Number((stocks.h2Kg >> 32n) & 0xffffffffn));
  view.setUint32(48, Number(stocks.h2Kg & 0xffffffffn));
  view.setUint32(52, stocks.toxinMilli >>> 0);
  view.setUint32(56, Number((stocks.ch4Kg >> 32n) & 0xffffffffn));
  view.setUint32(60, Number(stocks.ch4Kg & 0xffffffffn));
  view.setUint32(64, stocks.debt >>> 0);
  view.setUint32(68, stocks.biomassG >>> 0);
  view.setUint32(72, stocks.collector >>> 0);
  view.setUint32(76, stocks.healthMilli >>> 0);
  view.setUint32(80, Number((stocks.brineKg >> 32n) & 0xffffffffn));
  view.setUint32(84, Number(stocks.brineKg & 0xffffffffn));
  view.setUint32(88, stocks.reactor >>> 0);
  view.setUint32(92, stocks.cabinRiseK >>> 0);
  view.setUint32(96, stocks.drawnKg >>> 0);
  view.setUint32(100, stocks.heatKwh >>> 0);
  view.setUint32(104, stocks.radiator >>> 0);
  view.setUint32(108, Number((stocks.co2Kg >> 32n) & 0xffffffffn));
  view.setUint32(112, Number(stocks.co2Kg & 0xffffffffn));
  view.setUint32(116, Number((stocks.cabinCo2Kg >> 32n) & 0xffffffffn));
  view.setUint32(120, Number(stocks.cabinCo2Kg & 0xffffffffn));
  view.setUint32(124, stocks.foodDebt >>> 0);
  view.setUint32(128, stocks.lamp >>> 0);
  view.setUint32(132, stocks.cableOn >>> 0);
  view.setUint32(136, stocks.cableIx >>> 0);
  view.setUint32(140, stocks.cableIy >>> 0);
  view.setUint32(144, Number((stocks.cabinO2Kg >> 32n) & 0xffffffffn));
  view.setUint32(148, Number(stocks.cabinO2Kg & 0xffffffffn));
  view.setUint32(152, stocks.beds >>> 0);
  return bytes;
}

/** Bank the array, salvage a stripping sol, draw the crew, pay the roof, then grow. */
export function closeSol(
  world: World,
  stocks: Stocks,
  crust: Crust,
  index = CRADLE,
): { world: World; stocks: Stocks; crust: Crust } {
  const gain = scaleArray(arrayKwh(world, index), stocks.healthMilli);
  const beforeTau = world.tauAerMilli[index];
  const next = step(world, { fileStorm: true });
  let nextStocks = credit(stocks, gain);
  if (nextStocks.reactor) nextStocks = credit(nextStocks, KILOPOWER_KWH);
  nextStocks = abrade(nextStocks, stormTau(next.sol, next.storm) > 0.05);
  if (stormTau(next.sol, next.storm) > 0.05) {
    const lost = beforeTau - next.tauAerMilli[index];
    nextStocks = collectSalvage(nextStocks, lost, cellLat(latIndexOf(index)));
  }
  const kept = keepRoof(crust, drawCrew(nextStocks));
  const boiled = boilMethane(kept.crust, kept.stocks);
  const wet = boilWater(kept.crust, boiled);
  const light = ventHydrogen(kept.crust, wet);
  const aired = ventOxygen(kept.crust, light);
  const fed = eat(aired);
  return { world: next, stocks: shedHeat(grow(kept.crust, fed)), crust: kept.crust };
}

export function commitPoweredCut(
  a: Crust,
  b: Crust,
  aStocks: Stocks,
  bStocks: Stocks,
  ix: number,
  iy: number,
): { a: Crust; b: Crust; aStocks: Stocks; bStocks: Stocks; accepted: boolean; reason: string } {
  const atCradle = ix === CRADLE_CELL.ix && iy === CRADLE_CELL.iy;
  const aWired = aStocks.cableOn === 1 && aStocks.cableIx === ix && aStocks.cableIy === iy;
  const bWired = bStocks.cableOn === 1 && bStocks.cableIx === ix && bStocks.cableIy === iy;
  if (!atCradle && (!aWired || !bWired)) {
    return { a, b, aStocks, bStocks, accepted: false, reason: "no line from the cradle array to that kilometer" };
  }
  if (flagOf(a, ix, iy, "roof") || flagOf(b, ix, iy, "roof")) {
    return { a, b, aStocks, bStocks, accepted: false, reason: "the vessel is standing on that kilometer" };
  }
  if (aStocks.batteryKwh < CUT_KWH || bStocks.batteryKwh < CUT_KWH) {
    return { a, b, aStocks, bStocks, accepted: false, reason: `battery cannot pay ${CUT_KWH} kWh` };
  }
  const cut = commitDig(a, b, ix, iy);
  if (!cut.accepted) return { a, b, aStocks, bStocks, accepted: false, reason: cut.reason };
  return {
    a: cut.a,
    b: cut.b,
    aStocks: { ...aStocks, batteryKwh: aStocks.batteryKwh - CUT_KWH },
    bStocks: { ...bStocks, batteryKwh: bStocks.batteryKwh - CUT_KWH },
    accepted: true,
    reason: cut.reason,
  };
}
