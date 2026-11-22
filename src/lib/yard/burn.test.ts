import assert from "node:assert/strict";
import { test } from "node:test";
import { BURN_CH4_KG, BURN_KWH_PER_KG, BURN_O2_KG, BURN_WATER_KG, commitBurn } from "./burn.ts";
import { createStocks } from "./power.ts";

test("burning 16 kg of methane returns 128 kWh and 36 kg of water", () => {
  const stocks = { ...createStocks(), ch4Kg: BURN_CH4_KG, o2Kg: BURN_O2_KG };
  const burned = commitBurn(stocks, stocks);
  assert.equal(burned.accepted, true);
  assert.equal(burned.a.batteryKwh, Number(BURN_CH4_KG) * BURN_KWH_PER_KG);
  assert.equal(burned.a.waterKg, BURN_WATER_KG);
  assert.equal(burned.a.ch4Kg, 0n);
  assert.equal(burned.a.o2Kg, 0n);
  assert.equal(burned.b.batteryKwh, burned.a.batteryKwh);
});
