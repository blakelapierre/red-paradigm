import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, siteIndex, stateHash } from "../climate/model.ts";
import { cellLat, cellLon } from "../climate/constants.ts";
import { cellOf, createCrust, flagOf } from "../crust/crust.ts";
import { createStocks } from "./power.ts";
import { commitRoof } from "./roof.ts";

test("a roof is a vessel and not a new climate cell", () => {
  const index = siteIndex("cradle");
  const { ix, iy } = cellOf(cellLat(Math.floor(index / 72)), cellLon(index % 72));
  const world = createWorld();
  const hash = stateHash(world);
  const stocks = { ...createStocks(), batteryKwh: 100_000, finesKg: 50_000n };
  const roofed = commitRoof(createCrust(), createCrust(), stocks, stocks, ix, iy);
  assert.equal(roofed.accepted, true);
  assert.equal(flagOf(roofed.a, ix, iy, "roof"), 1);
  assert.equal(flagOf(roofed.b, ix, iy, "roof"), 1);
  assert.equal(stateHash(world), hash);
  const again = commitRoof(roofed.a, roofed.b, roofed.aStocks, roofed.bStocks, ix, iy);
  assert.equal(again.accepted, false);
});
