import { type Crust } from "../crust/crust.ts";
import { type Stocks } from "./power.ts";

/** A roof that is not powered falls down. Ten thousand kWh a sol. */
export const ROOF_UPKEEP_KWH = 10_000;

export function keepRoof(crust: Crust, stocks: Stocks): { crust: Crust; stocks: Stocks } {
  const roofed = crust.overrides.some((row) => row.roof === 1);
  if (!roofed) return { crust, stocks };
  if (stocks.batteryKwh < ROOF_UPKEEP_KWH) {
    return {
      crust: { ...crust, overrides: crust.overrides.map((row) => ({ ...row, roof: 0 })) },
      stocks,
    };
  }
  return { crust, stocks: { ...stocks, batteryKwh: stocks.batteryKwh - ROOF_UPKEEP_KWH } };
}
