import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { eat } from "./food.ts";
import { closeSol, createStocks } from "./power.ts";

test("a 500 g ration clears food debt, and a gram does not", () => {
  const short = eat({ ...createStocks(), biomassG: 499 });
  assert.equal(short.foodDebt, 1);
  assert.equal(short.biomassG, 499);
  const fed = eat({ ...createStocks(), biomassG: 500, foodDebt: 1 });
  assert.equal(fed.foodDebt, 0);
  assert.equal(fed.biomassG, 0);
  const world = createWorld();
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const closed = closeSol(world, { ...createStocks(), o2Kg: 1n, waterKg: 4n, biomassG: 500 }, roof);
  assert.equal(closed.stocks.foodDebt, 0);
  assert.equal(closed.stocks.biomassG, 1);
  const hungry = closeSol(world, { ...createStocks(), o2Kg: 1n, waterKg: 4n, biomassG: 499 }, roof);
  assert.equal(hungry.stocks.foodDebt, 1);
  assert.equal(hungry.stocks.biomassG, 500);
});
