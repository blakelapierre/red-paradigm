import assert from "node:assert/strict";
import { test } from "node:test";
import { commitElectrolysis, ELECTROLYSIS_H2_KG, ELECTROLYSIS_O2_KG, ELECTROLYSIS_WATER_KG } from "./electrolysis.ts";
import { createStocks } from "./power.ts";

test("36 kg of water becomes 4 kg of hydrogen and 32 kg of oxygen", () => {
  const stocks = { ...createStocks(), batteryKwh: 200, waterKg: ELECTROLYSIS_WATER_KG };
  const split = commitElectrolysis(stocks, stocks);
  assert.equal(split.accepted, true);
  assert.equal(split.a.waterKg, 0n);
  assert.equal(split.a.h2Kg, ELECTROLYSIS_H2_KG);
  assert.equal(split.a.o2Kg, ELECTROLYSIS_O2_KG);
  assert.equal(split.a.h2Kg + split.a.o2Kg, ELECTROLYSIS_WATER_KG);
  assert.equal(split.b.o2Kg, split.a.o2Kg);
});

test("electrolysis does not run without water", () => {
  const stocks = { ...createStocks(), batteryKwh: 200 };
  const missed = commitElectrolysis(stocks, stocks);
  assert.equal(missed.accepted, false);
  assert.equal(missed.a.h2Kg, 0n);
});

test("dirty water is not split", () => {
  const stocks = { ...createStocks(), batteryKwh: 200, waterKg: ELECTROLYSIS_WATER_KG, toxinMilli: 1000 };
  const dirty = commitElectrolysis(stocks, stocks);
  assert.equal(dirty.accepted, false);
  assert.match(dirty.reason, /wash/);
  assert.equal(dirty.a.waterKg, ELECTROLYSIS_WATER_KG);
  assert.equal(dirty.a.h2Kg, 0n);
  assert.equal(dirty.a.batteryKwh, 200);
});
