import assert from "node:assert/strict";
import { test } from "node:test";
import { airKg, createWorld, stateHash } from "../climate/model.ts";
import { COLUMN_KG, commitCondenser } from "./condenser.ts";
import { createStocks } from "./power.ts";

test("one kilogram comes out of a ten-tonne column and the air mass stays", () => {
  const world = createWorld();
  const hash = stateHash(world);
  const before = airKg(world.ls);
  const stocks = { ...createStocks(), batteryKwh: 50 };
  const drawn = commitCondenser(stocks, stocks, world);
  assert.equal(drawn.accepted, true);
  assert.equal(drawn.a.waterKg, 1n);
  assert.equal(drawn.a.drawnKg, 1);
  assert.equal(drawn.b.drawnKg, 1);
  assert.equal(drawn.air, before);
  assert.equal(airKg(world.ls), before);
  assert.equal(stateHash(world), hash);
  const empty = commitCondenser({ ...stocks, drawnKg: COLUMN_KG }, { ...stocks, drawnKg: COLUMN_KG }, world);
  assert.equal(empty.accepted, false);
  assert.equal(empty.a.waterKg, stocks.waterKg);
});
