import { PANEL_M2 } from "../climate/constants.ts";
import { inspect, siteIndex, step, type World } from "../climate/model.ts";
import { commitDig, type Crust } from "../crust/crust.ts";

/** One crust cell of panels at the Low Cradle. Not the 100 m² survey coupon. */
export const ARRAY_M2 = 1_000_000;
/** 2 m × 1 km² at 1 kWh per cubic meter, the order of powered excavation. */
export const CUT_KWH = 2_000_000;
export const BATTERY_CAP_KWH = 4_000_000;

export const CRADLE = siteIndex("cradle");

export type Stocks = { batteryKwh: number; capKwh: number; finesKg: bigint };

export function createStocks(): Stocks {
  return { batteryKwh: 0, capKwh: BATTERY_CAP_KWH, finesKg: 0n };
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
  const bytes = new Uint8Array(20);
  const view = new DataView(bytes.buffer);
  bytes.set([0x50, 0x57, 0x52, 0x31]);
  view.setUint32(4, stocks.batteryKwh);
  view.setUint32(8, stocks.capKwh);
  view.setUint32(12, Number((stocks.finesKg >> 32n) & 0xffffffffn));
  view.setUint32(16, Number(stocks.finesKg & 0xffffffffn));
  return bytes;
}

/** Bank this sol's array, then advance. Both clients call this on their own world. */
export function closeSol(world: World, stocks: Stocks, index = CRADLE): { world: World; stocks: Stocks } {
  const gain = arrayKwh(world, index);
  return { world: step(world, { fileStorm: true }), stocks: credit(stocks, gain) };
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
