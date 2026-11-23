import assert from "node:assert/strict";
import { test } from "node:test";
import { airKg, createWorld } from "../climate/model.ts";
import { CO2_BATCH_KG } from "./compress.ts";
import { SABATIER_CH4_KG, SABATIER_H2_KG, SABATIER_WATER_KG, commitSabatier } from "./sabatier.ts";
import { createStocks } from "./power.ts";

test("Sabatier makes methane and water and does not move the air bar", () => {
  const world = createWorld();
  const before = airKg(world.ls);
  const stocks = { ...createStocks(), batteryKwh: 50, h2Kg: SABATIER_H2_KG, co2Kg: CO2_BATCH_KG };
  const ran = commitSabatier(stocks, stocks, world);
  assert.equal(ran.accepted, true);
  assert.equal(ran.a.ch4Kg, SABATIER_CH4_KG);
  assert.equal(ran.a.h2Kg, 0n);
  assert.equal(ran.a.co2Kg, 0n);
  assert.equal(ran.a.waterKg, SABATIER_WATER_KG);
  assert.equal(CO2_BATCH_KG + SABATIER_H2_KG, SABATIER_CH4_KG + SABATIER_WATER_KG);
  assert.equal(ran.air, before);
  assert.equal(airKg(world.ls), before);
  assert.equal(ran.b.ch4Kg, ran.a.ch4Kg);
  const bare = commitSabatier({ ...stocks, co2Kg: 0n }, { ...stocks, co2Kg: 0n }, world);
  assert.equal(bare.accepted, false);
  assert.equal(bare.a.h2Kg, SABATIER_H2_KG);
});
