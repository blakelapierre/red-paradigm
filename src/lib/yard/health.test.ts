import assert from "node:assert/strict";
import { test } from "node:test";
import { stormTau } from "../climate/model.ts";
import { createWorld } from "../climate/model.ts";
import { createCrust } from "../crust/crust.ts";
import { abrade, commitRepair, scaleArray } from "./health.ts";
import { closeSol, createStocks } from "./power.ts";

test("a storm abrades the array and a repair puts a tenth back", () => {
  const stocks = createStocks();
  assert.equal(scaleArray(1000, stocks.healthMilli), 1000);
  const hit = abrade(stocks, true);
  assert.equal(hit.healthMilli, 990);
  assert.equal(abrade(hit, false).healthMilli, 990);
  assert.equal(scaleArray(1000, 990), 990);
  const repaired = commitRepair({ ...hit, finesKg: 10_000n }, { ...hit, finesKg: 10_000n });
  assert.equal(repaired.accepted, true);
  assert.equal(repaired.a.healthMilli, 1000);
  assert.equal(repaired.a.finesKg, 0n);
  const intact = commitRepair(repaired.a, repaired.b);
  assert.equal(intact.accepted, false);
});

test("abrasion hits after this sol's array is banked", () => {
  let world = createWorld();
  let stocks = createStocks();
  let crust = createCrust();
  let closed = closeSol(world, stocks, crust);
  while (stormTau(closed.world.sol, closed.world.storm) <= 0.05) {
    world = closed.world;
    stocks = closed.stocks;
    crust = closed.crust;
    closed = closeSol(world, stocks, crust);
  }
  assert.equal(stocks.healthMilli, 1000);
  assert.equal(closed.stocks.healthMilli, 990);
  assert.ok(closed.stocks.batteryKwh >= stocks.batteryKwh);
});
