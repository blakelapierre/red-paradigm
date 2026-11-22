import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld } from "../climate/model.ts";
import { createCrust } from "../crust/crust.ts";
import { commitElectrolysis } from "./electrolysis.ts";
import { closeSol, createStocks } from "./power.ts";
import { commitRadiator, shedHeat } from "./radiator.ts";

test("the third split waits until the yard sheds heat", () => {
  let stocks = { ...createStocks(), batteryKwh: 1_000, waterKg: 200n };
  for (let i = 0; i < 2; i++) {
    const ran = commitElectrolysis(stocks, stocks);
    assert.equal(ran.accepted, true);
    stocks = ran.a;
  }
  assert.equal(stocks.heatKwh, 80);
  const blocked = commitElectrolysis(stocks, stocks);
  assert.equal(blocked.accepted, false);
  assert.equal(blocked.a.o2Kg, stocks.o2Kg);
  const rested = shedHeat(stocks);
  assert.equal(rested.heatKwh, 40);
  const again = commitElectrolysis(rested, rested);
  assert.equal(again.accepted, true);
  assert.equal(again.a.heatKwh, 80);
});

test("a radiator sheds the debt in one sol and the open yard sheds forty", () => {
  const fines = { ...createStocks(), finesKg: 20_000n, heatKwh: 80 };
  const up = commitRadiator(fines, fines);
  assert.equal(up.accepted, true);
  assert.equal(up.a.radiator, 1);
  assert.equal(up.a.finesKg, 0n);
  const world = createWorld();
  const cleared = closeSol(world, up.a, createCrust());
  assert.equal(cleared.stocks.heatKwh, 0);
  const bare = closeSol(world, { ...createStocks(), heatKwh: 80 }, createCrust());
  assert.equal(bare.stocks.heatKwh, 40);
});
