import assert from "node:assert/strict";
import { test } from "node:test";
import { airKg, createWorld, stateHash } from "../climate/model.ts";
import { CO2_BATCH_KG, CO2_CAP_KG, commitCompress } from "./compress.ts";
import { createStocks } from "./power.ts";

test("44 kg of CO2 is set aside and the air mass stays", () => {
  const world = createWorld();
  const hash = stateHash(world);
  const before = airKg(world.ls);
  const stocks = { ...createStocks(), batteryKwh: 30 };
  const ran = commitCompress(stocks, stocks, world);
  assert.equal(ran.accepted, true);
  assert.equal(ran.a.co2Kg, CO2_BATCH_KG);
  assert.equal(ran.b.co2Kg, CO2_BATCH_KG);
  assert.equal(ran.air, before);
  assert.equal(stateHash(world), hash);
  const full = commitCompress({ ...stocks, co2Kg: CO2_CAP_KG }, { ...stocks, co2Kg: CO2_CAP_KG }, world);
  assert.equal(full.accepted, false);
  assert.equal(full.a.co2Kg, CO2_CAP_KG);
});
