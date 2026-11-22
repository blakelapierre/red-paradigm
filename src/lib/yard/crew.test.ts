import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld } from "../climate/model.ts";
import { createCrust } from "../crust/crust.ts";
import { drawCrew } from "./crew.ts";
import { arrayKwh, closeSol, createStocks } from "./power.ts";

test("the crew drinks and breathes, or the sol is owed", () => {
  const stocks = { ...createStocks(), o2Kg: 1n, waterKg: 3n, debt: 1 };
  const fed = drawCrew(stocks);
  assert.equal(fed.debt, 0);
  assert.equal(fed.o2Kg, 0n);
  assert.equal(fed.waterKg, 0n);
  const hungry = drawCrew(fed);
  assert.equal(hungry.debt, 1);
  assert.equal(hungry.o2Kg, 0n);
  assert.equal(hungry.waterKg, 0n);
});

test("closing a sol draws the crew after the array is banked", () => {
  const world = createWorld();
  const shown = arrayKwh(world);
  const hungry = closeSol(world, createStocks(), createCrust());
  assert.equal(hungry.stocks.batteryKwh, shown);
  assert.equal(hungry.stocks.debt, 1);
  const fed = closeSol(world, { ...createStocks(), o2Kg: 1n, waterKg: 3n }, createCrust());
  assert.equal(fed.stocks.debt, 0);
  assert.equal(fed.stocks.o2Kg, 0n);
  assert.equal(fed.stocks.waterKg, 0n);
  assert.equal(fed.stocks.batteryKwh, shown);
});
