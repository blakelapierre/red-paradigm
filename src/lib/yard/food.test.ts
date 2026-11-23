import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { BED_CAP } from "./bed.ts";
import { coversRation, eat } from "./food.ts";
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

test("twenty-five lit beds put the ration back on the second sol", () => {
  const world = createWorld();
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const start = {
    ...createStocks(),
    lamp: 1,
    beds: BED_CAP,
    o2Kg: 2n,
    waterKg: 56n,
  };
  const first = closeSol(world, start, roof);
  assert.equal(first.stocks.biomassG, 500);
  assert.equal(first.stocks.foodDebt, 1);
  assert.equal(coversRation(first.stocks), false);
  const second = closeSol(first.world, first.stocks, first.crust);
  assert.equal(second.stocks.biomassG, 500);
  assert.equal(second.stocks.foodDebt, 0);
  assert.equal(coversRation(second.stocks), true);
  const short = {
    ...start,
    beds: BED_CAP - 1,
    waterKg: 54n,
  };
  const shyFirst = closeSol(world, short, roof);
  const shy = closeSol(shyFirst.world, shyFirst.stocks, shyFirst.crust);
  assert.equal(shy.stocks.foodDebt, 1);
  assert.equal(coversRation(shy.stocks), false);
});
