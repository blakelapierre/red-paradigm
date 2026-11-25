import assert from "node:assert/strict";
import { test } from "node:test";
import { airKg, createWorld, siteIndex, stateHash } from "../climate/model.ts";
import { createCrust } from "../crust/crust.ts";
import { turnHash } from "../turn.ts";
import { CRADLE_CELL, commitCable } from "./cable.ts";
import { centerKm, climateIndexOfKm, focusOn, siteAt, stepKm } from "./km.ts";
import { CUT_KWH, commitPoweredCut, createStocks } from "./power.ts";

test("one kilometer east of the cradle center is still that climate cell", () => {
  const home = centerKm(siteIndex("cradle"));
  assert.equal(home.ix, CRADLE_CELL.ix);
  assert.equal(home.iy, CRADLE_CELL.iy);
  const east = stepKm(home.ix, home.iy, "e");
  assert.ok(east);
  assert.equal(east.ix, home.ix + 1);
  assert.equal(climateIndexOfKm(east.ix, east.iy), siteIndex("cradle"));
  assert.equal(climateIndexOfKm(home.ix, home.iy), siteIndex("cradle"));
  assert.equal(stepKm(0, 0, "w"), null);
  assert.equal(stepKm(0, 0, "s"), null);
});

test("the neighbor's work site is that kilometer, on the cradle's climate cell", () => {
  const world = createWorld();
  const home = centerKm(siteIndex("cradle"));
  const east = stepKm(home.ix, home.iy, "e");
  assert.ok(east);
  const site = siteAt(world, east.ix, east.iy);
  assert.equal(site.ix, home.ix + 1);
  assert.equal(site.iy, home.iy);
  assert.equal(site.climateIndex, siteIndex("cradle"));
  const center = siteAt(world, home.ix, home.iy);
  assert.equal(site.pressurePa, center.pressurePa);
});

test("a neighbor cut needs a line, and the refusal spends nothing", () => {
  const home = centerKm(siteIndex("cradle"));
  const east = stepKm(home.ix, home.iy, "e");
  assert.ok(east);
  const rich = { ...createStocks(), batteryKwh: CUT_KWH, finesKg: 1_000n };
  const cut = commitPoweredCut(createCrust(), createCrust(), rich, rich, east.ix, east.iy);
  assert.equal(cut.accepted, false);
  assert.match(cut.reason, /no line/);
  assert.equal(cut.a.spoilKg, 0n);
  assert.equal(cut.aStocks.batteryKwh, CUT_KWH);
  assert.notEqual(east.ix, CRADLE_CELL.ix);
});

test("a lined neighbor is cut for both clients, and the air mass stays", () => {
  const world = createWorld();
  const hash = stateHash(world);
  const before = airKg(world.ls);
  const home = centerKm(siteIndex("cradle"));
  const east = stepKm(home.ix, home.iy, "e");
  assert.ok(east);
  const rich = { ...createStocks(), batteryKwh: CUT_KWH, finesKg: 1_000n };
  const laid = commitCable(rich, rich, east.ix, east.iy);
  assert.equal(laid.accepted, true);
  const cut = commitPoweredCut(createCrust(), createCrust(), laid.a, laid.b, east.ix, east.iy);
  assert.equal(cut.accepted, true);
  assert.equal(cut.a.spoilKg, cut.b.spoilKg);
  assert.ok(cut.a.spoilKg > 0n);
  assert.equal(cut.a.overrides[0].ix, east.ix);
  assert.equal(cut.aStocks.batteryKwh, 0);
  assert.equal(cut.bStocks.batteryKwh, 0);
  assert.equal(airKg(world.ls), before);
  assert.equal(stateHash(world), hash);
  assert.equal(climateIndexOfKm(east.ix, east.iy), siteIndex("cradle"));
});

test("a second pit is refused while the yard still holds the first", () => {
  const home = centerKm(siteIndex("cradle"));
  const east = stepKm(home.ix, home.iy, "e");
  assert.ok(east);
  const rich = { ...createStocks(), batteryKwh: CUT_KWH, finesKg: 1_000n };
  const first = commitPoweredCut(createCrust(), createCrust(), rich, rich, home.ix, home.iy);
  assert.equal(first.accepted, true);
  const paid = { ...first.aStocks, batteryKwh: CUT_KWH, finesKg: 1_000n };
  const laid = commitCable(paid, { ...first.bStocks, batteryKwh: CUT_KWH, finesKg: 1_000n }, east.ix, east.iy);
  assert.equal(laid.accepted, true);
  const second = commitPoweredCut(first.a, first.b, laid.a, laid.b, east.ix, east.iy);
  assert.equal(second.accepted, false);
  assert.match(second.reason, /yard cannot hold/);
  assert.equal(second.a.overrides.length, 1);
  assert.equal(second.a.spoilKg, first.a.spoilKg);
  assert.equal(second.aStocks.batteryKwh, laid.a.batteryKwh);
});

test("pointing at a climate cell puts the cursor on that cell's center", () => {
  const cradle = focusOn(siteIndex("cradle"));
  const works = focusOn(siteIndex("works"));
  assert.equal(cradle.ix, CRADLE_CELL.ix);
  assert.notEqual(works.ix, cradle.ix);
  assert.equal(climateIndexOfKm(works.ix, works.iy), siteIndex("works"));
  const east = stepKm(works.ix, works.iy, "e");
  assert.ok(east);
  assert.equal(climateIndexOfKm(east.ix, east.iy), siteIndex("works"));
  assert.notEqual(east.ix, works.ix);
});

test("stepping the cursor does not enter the turn hash", () => {
  const world = createWorld();
  const crust = createCrust();
  const stocks = createStocks();
  const before = turnHash(world, crust, stocks);
  const east = stepKm(CRADLE_CELL.ix, CRADLE_CELL.iy, "e");
  assert.ok(east);
  assert.notEqual(east.ix, CRADLE_CELL.ix);
  assert.equal(turnHash(world, crust, stocks), before);
  assert.equal(world.sol, 0);
});






