import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, siteIndex } from "../climate/model.ts";
import { CRADLE_CELL } from "./cable.ts";
import { centerKm, climateIndexOfKm, siteAt, stepKm } from "./km.ts";

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

