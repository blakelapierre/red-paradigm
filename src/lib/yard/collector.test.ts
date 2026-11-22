import assert from "node:assert/strict";
import { test } from "node:test";
import { cellLat, latIndexOf } from "../climate/constants.ts";
import { addAerosol, createWorld, stormTau } from "../climate/model.ts";
import { createCrust } from "../crust/crust.ts";
import { collectSalvage, commitCollector, salvageKg } from "./collector.ts";
import { CRADLE, closeSol, createStocks } from "./power.ts";

test("a collector costs fines, and salvage is a tenth of the lost mass", () => {
  const stocks = { ...createStocks(), finesKg: 30_000n };
  const up = commitCollector(stocks, stocks);
  assert.equal(up.accepted, true);
  assert.equal(up.a.collector, 1);
  assert.equal(up.b.collector, 1);
  assert.equal(up.a.finesKg, 0n);
  const again = commitCollector(up.a, up.b);
  assert.equal(again.accepted, false);
  const kg = salvageKg(1000, 0);
  assert.ok(kg > 0n);
  assert.equal(salvageKg(0, 0), 0n);
  const full = collectSalvage({ ...up.a, finesKg: 50_000_000n }, 1000, 0);
  assert.equal(full.finesKg, 50_000_000n);
});

test("salvage lands only on a stripping sol, for both the mass and the refusal", () => {
  const index = CRADLE;
  const crust = createCrust();
  let quiet = addAerosol(createWorld(), index, 400);
  const parked = { ...createStocks(), collector: 1 };
  const clear = closeSol(quiet, parked, crust, index);
  assert.equal(clear.stocks.finesKg, 0n);
  assert.ok(stormTau(clear.world.sol, clear.world.storm) <= 0.05);

  let world = quiet;
  let stocks = parked;
  let ground = crust;
  let gained = 0n;
  for (let i = 0; i < 25 && gained === 0n; i++) {
    const before = world.tauAerMilli[index];
    const closed = closeSol(world, stocks, ground, index);
    const lost = before - closed.world.tauAerMilli[index];
    if (stormTau(closed.world.sol, closed.world.storm) > 0.05 && lost > 0) {
      const lat = cellLat(latIndexOf(index));
      assert.equal(closed.stocks.finesKg, salvageKg(lost, lat));
      gained = closed.stocks.finesKg;
    } else {
      assert.equal(closed.stocks.finesKg, 0n);
    }
    world = closed.world;
    stocks = { ...closed.stocks, finesKg: 0n };
    ground = closed.crust;
  }
  assert.ok(gained > 0n, "a stripping sol should return fines");

  const bare = closeSol(world, { ...createStocks(), collector: 0 }, ground, index);
  assert.equal(bare.stocks.finesKg, 0n);
});
