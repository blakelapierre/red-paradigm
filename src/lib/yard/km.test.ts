import assert from "node:assert/strict";
import { test } from "node:test";
import { siteIndex } from "../climate/model.ts";
import { CRADLE_CELL } from "./cable.ts";
import { centerKm, climateIndexOfKm, stepKm } from "./km.ts";

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
