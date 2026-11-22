import assert from "node:assert/strict";
import { test } from "node:test";
import { WASH_WATER_KG, commitWash } from "./wash.ts";
import { createStocks } from "./power.ts";

test("a wash clears the toxin and spends water", () => {
  const stocks = { ...createStocks(), batteryKwh: 20, waterKg: WASH_WATER_KG, toxinMilli: 1000 };
  const washed = commitWash(stocks, stocks);
  assert.equal(washed.accepted, true);
  assert.equal(washed.a.toxinMilli, 0);
  assert.equal(washed.a.waterKg, 0n);
  assert.equal(washed.a.brineKg, WASH_WATER_KG);
  assert.equal(washed.b.brineKg, WASH_WATER_KG);
  const clean = commitWash(washed.a, washed.b);
  assert.equal(clean.accepted, false);
});
