import assert from "node:assert/strict";
import { test } from "node:test";
import { addAerosol, createWorld, inspect, siteIndex, stateHash } from "../climate/model.ts";
import { MILL_FINES_KG } from "./mill.ts";
import { createStocks, type Stocks } from "./power.ts";
import { TAU_CAP_MILLI, commitRelease, tauMilliFromFines } from "./release.ts";

function funded(): Stocks {
  return { ...createStocks(), batteryKwh: 1_000_000, finesKg: MILL_FINES_KG };
}

test("five million kilograms is a thin veil, and it does warm the cell", () => {
  const index = siteIndex("cradle");
  const world = createWorld();
  const before = inspect(world, index);
  const milli = tauMilliFromFines(MILL_FINES_KG, before.lat);
  assert.ok(milli >= 10 && milli <= 30, `milli ${milli}`);
  const lofted = commitRelease(world, world, funded(), funded(), index, before.lat);
  assert.equal(lofted.accepted, true);
  const after = inspect(lofted.a, index);
  assert.equal(Math.round(after.tauAer * 1000), milli);
  assert.ok(after.tMean > before.tMean, `temp ${before.tMean} → ${after.tMean}`);
  assert.equal(lofted.aStocks.finesKg, 0n);
  assert.equal(stateHash(lofted.a), stateHash(lofted.b));
  assert.notEqual(stateHash(lofted.a), stateHash(world));
});

test("a release without fines changes nothing", () => {
  const index = siteIndex("cradle");
  const world = createWorld();
  const stocks = { ...funded(), finesKg: 0n };
  const hash = stateHash(world);
  const missed = commitRelease(world, world, stocks, stocks, index, inspect(world, index).lat);
  assert.equal(missed.accepted, false);
  assert.equal(stateHash(missed.a), hash);
  assert.equal(missed.aStocks.batteryKwh, stocks.batteryKwh);
});

test("a loft that would pass the warming cap is refused", () => {
  const index = siteIndex("cradle");
  const world = addAerosol(createWorld(), index, TAU_CAP_MILLI - 5);
  const stocks = funded();
  const hash = stateHash(world);
  const missed = commitRelease(world, world, stocks, stocks, index, inspect(world, index).lat);
  assert.equal(missed.accepted, false);
  assert.match(missed.reason, /warming cap/);
  assert.equal(missed.aStocks.finesKg, stocks.finesKg);
  assert.equal(missed.aStocks.batteryKwh, stocks.batteryKwh);
  assert.equal(stateHash(missed.a), hash);
  assert.equal(stateHash(missed.b), hash);
});

