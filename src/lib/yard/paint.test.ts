import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, siteIndex, stateHash } from "../climate/model.ts";
import { cellLat, cellLon } from "../climate/constants.ts";
import { cellOf, createCrust, crustHash, paintOf } from "../crust/crust.ts";
import { createStocks } from "./power.ts";
import { PAINT_FINES_KG, commitPaint } from "./paint.ts";

test("painting one kilometer does not move the climate cell", () => {
  const index = siteIndex("cradle");
  const latIndex = Math.floor(index / 72);
  const lonIndex = index % 72;
  const { ix, iy } = cellOf(cellLat(latIndex), cellLon(lonIndex));
  const world = createWorld();
  const albedo = world.albedoMilli[index];
  const hash = stateHash(world);
  const crust = createCrust();
  const stocks = { ...createStocks(), batteryKwh: 1_000_000, finesKg: PAINT_FINES_KG };
  const painted = commitPaint(crust, crust, stocks, stocks, ix, iy);
  assert.equal(painted.accepted, true);
  assert.equal(paintOf(painted.a, ix, iy), 100);
  assert.equal(paintOf(painted.b, ix, iy), 100);
  assert.equal(crustHash(painted.a), crustHash(painted.b));
  assert.equal(world.albedoMilli[index], albedo);
  assert.equal(stateHash(world), hash);
  assert.equal(painted.aStocks.finesKg, 0n);
  const again = commitPaint(painted.a, painted.b, painted.aStocks, painted.bStocks, ix, iy);
  assert.equal(again.accepted, false);
  assert.equal(again.a, painted.a);
});

test("a coat is fifty grams per square meter of one kilometer", () => {
  assert.equal(PAINT_FINES_KG, 50_000n);
});
