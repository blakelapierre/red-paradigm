import { cellAreaM2 } from "./release.ts";
import { FINES_CAP_KG } from "./mill.ts";
import { type Stocks } from "./power.ts";

/** Ten percent of the optical depth that left the cell during a stripping sol. */
export const COLLECTOR_FINES_KG = 30_000n;

export function commitCollector(a: Stocks, b: Stocks): { a: Stocks; b: Stocks; accepted: boolean; reason: string } {
  const same = { a, b, accepted: false };
  if (a.collector || b.collector) return { ...same, reason: "a collector is already up" };
  if (a.finesKg < COLLECTOR_FINES_KG || b.finesKg < COLLECTOR_FINES_KG) {
    return { ...same, reason: `need ${COLLECTOR_FINES_KG} kg of fines` };
  }
  const take = (s: Stocks): Stocks => ({ ...s, finesKg: s.finesKg - COLLECTOR_FINES_KG, collector: 1 });
  return { a: take(a), b: take(b), accepted: true, reason: "collector up" };
}

export function salvageKg(lostMilli: number, latDeg: number): bigint {
  if (lostMilli <= 0) return 0n;
  const area = BigInt(cellAreaM2(latDeg));
  const kg = (BigInt(lostMilli) * area) / 200_000n;
  return kg / 10n;
}

export function collectSalvage(stocks: Stocks, lostMilli: number, latDeg: number): Stocks {
  if (!stocks.collector || lostMilli <= 0) return stocks;
  const room = FINES_CAP_KG - stocks.finesKg;
  if (room <= 0n) return stocks;
  const got = salvageKg(lostMilli, latDeg);
  const add = got > room ? room : got;
  return { ...stocks, finesKg: stocks.finesKg + add };
}
