import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, stateHash } from "../climate/model.ts";
import { createCrust } from "../crust/crust.ts";
import { CRADLE_CELL, WORKS_CELL, cableKm, commitCable } from "./cable.ts";
import { CUT_KWH, commitPoweredCut, createStocks } from "./power.ts";

test("a cut off the cradle needs a line, and the line is a tonne per kilometer", () => {
  const world = createWorld();
  const hash = stateHash(world);
  const ix = CRADLE_CELL.ix + 3;
  const iy = CRADLE_CELL.iy + 4;
  assert.equal(cableKm(ix, iy), 5);
  const rich = { ...createStocks(), batteryKwh: CUT_KWH, finesKg: 5_000n };
  const bare = commitPoweredCut(createCrust(), createCrust(), rich, rich, ix, iy);
  assert.equal(bare.accepted, false);
  assert.match(bare.reason, /no line/);
  assert.equal(bare.aStocks.batteryKwh, CUT_KWH);
  const here = commitCable(rich, rich, CRADLE_CELL.ix, CRADLE_CELL.iy);
  assert.equal(here.accepted, false);
  const laid = commitCable(rich, rich, ix, iy);
  assert.equal(laid.accepted, true);
  assert.equal(laid.a.finesKg, 0n);
  assert.equal(laid.a.cableOn, 1);
  const cut = commitPoweredCut(createCrust(), createCrust(), laid.a, laid.b, ix, iy);
  assert.equal(cut.accepted, true);
  assert.equal(stateHash(world), hash);
  const cradle = commitPoweredCut(createCrust(), createCrust(), rich, rich, CRADLE_CELL.ix, CRADLE_CELL.iy);
  assert.equal(cradle.accepted, true);
});

test("a cable cannot land on the other yard's home kilometer", () => {
  const rich = { ...createStocks(), finesKg: 1_000_000n };
  const fromCradle = commitCable(rich, rich, WORKS_CELL.ix, WORKS_CELL.iy, "cradle");
  assert.equal(fromCradle.accepted, false);
  assert.equal(fromCradle.reason, "that kilometer is the other yard");
  assert.equal(fromCradle.a.finesKg, rich.finesKg);
  const fromWorks = commitCable(rich, rich, CRADLE_CELL.ix, CRADLE_CELL.iy, "works");
  assert.equal(fromWorks.accepted, false);
  assert.equal(fromWorks.reason, "that kilometer is the other yard");
  const own = commitCable(rich, rich, WORKS_CELL.ix, WORKS_CELL.iy, "works");
  assert.equal(own.accepted, false);
  assert.equal(own.reason, "the array is already on this kilometer");
});
