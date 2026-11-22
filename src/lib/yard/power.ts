import { PANEL_M2, cellLat, latIndexOf } from "../climate/constants.ts";
import { inspect, siteIndex, step, stormTau, type World } from "../climate/model.ts";
import { commitDig, type Crust } from "../crust/crust.ts";
import { grow } from "./biomass.ts";
import { collectSalvage } from "./collector.ts";
import { drawCrew } from "./crew.ts";
import { keepRoof } from "./upkeep.ts";

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
  const bytes = new Uint8Array(76);
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
  return bytes;
}

/** Bank the array, salvage a stripping sol, draw the crew, pay the roof, then grow. */
export function closeSol(
  world: World,
  stocks: Stocks,
  crust: Crust,
  index = CRADLE,
): { world: World; stocks: Stocks; crust: Crust } {
  const gain = arrayKwh(world, index);
  const beforeTau = world.tauAerMilli[index];
  const next = step(world, { fileStorm: true });
  let nextStocks = credit(stocks, gain);
  if (stormTau(next.sol, next.storm) > 0.05) {
    const lost = beforeTau - next.tauAerMilli[index];
    nextStocks = collectSalvage(nextStocks, lost, cellLat(latIndexOf(index)));
  }
  const kept = keepRoof(crust, drawCrew(nextStocks));
  return { world: next, stocks: grow(kept.crust, kept.stocks), crust: kept.crust };
}

export function commitPoweredCut(
  a: Crust,
  b: Crust,
  aStocks: Stocks,
  bStocks: Stocks,
  ix: number,
  iy: number,
): { a: Crust; b: Crust; aStocks: Stocks; bStocks: Stocks; accepted: boolean; reason: string } {
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
