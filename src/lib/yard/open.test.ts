import assert from "node:assert/strict";
import { test } from "node:test";
import { airKg, createWorld } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { boilWater } from "./open.ts";
import { closeSol, createStocks } from "./power.ts";

test("open water loses at least a kilogram and a roof holds it", () => {
  const world = createWorld();
  const before = airKg(world.ls);
  const open = boilWater(createCrust(), { ...createStocks(), waterKg: 100n });
  assert.equal(open.waterKg, 99n);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const held = closeSol(world, { ...createStocks(), waterKg: 100n }, roof);
  assert.equal(held.stocks.waterKg, 100n);
  const lost = closeSol(world, { ...createStocks(), waterKg: 100n }, createCrust());
  assert.equal(lost.stocks.waterKg, 99n);
  assert.equal(airKg(world.ls), before);
});
