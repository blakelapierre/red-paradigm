import assert from "node:assert/strict";
import { test } from "node:test";
import { airKg, createWorld } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { boilWater, ventHydrogen, ventOxygen } from "./open.ts";
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

test("open hydrogen loses a tenth, and a roof holds it", () => {
  const world = createWorld();
  const open = ventHydrogen(createCrust(), { ...createStocks(), h2Kg: 1000n });
  assert.equal(open.h2Kg, 900n);
  const small = ventHydrogen(createCrust(), { ...createStocks(), h2Kg: 4n });
  assert.equal(small.h2Kg, 3n);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const held = closeSol(world, { ...createStocks(), h2Kg: 1000n }, roof);
  assert.equal(held.stocks.h2Kg, 1000n);
  const lost = closeSol(world, { ...createStocks(), h2Kg: 1000n }, createCrust());
  assert.equal(lost.stocks.h2Kg, 900n);
});

test("open oxygen loses one percent, and a roof holds it", () => {
  const world = createWorld();
  const open = ventOxygen(createCrust(), { ...createStocks(), o2Kg: 32n });
  assert.equal(open.o2Kg, 31n);
  const pile = ventOxygen(createCrust(), { ...createStocks(), o2Kg: 500n });
  assert.equal(pile.o2Kg, 495n);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const held = closeSol(world, { ...createStocks(), o2Kg: 32n }, roof);
  assert.equal(held.stocks.o2Kg, 32n);
  const lost = closeSol(world, { ...createStocks(), o2Kg: 32n }, createCrust());
  assert.equal(lost.stocks.o2Kg, 31n);
});
