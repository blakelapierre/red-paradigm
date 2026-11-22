import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { boilMethane } from "./boil.ts";
import { closeSol, createStocks } from "./power.ts";

test("open methane loses at least a kilogram, and a roof holds it", () => {
  const open = boilMethane(createCrust(), { ...createStocks(), ch4Kg: 16n });
  assert.equal(open.ch4Kg, 15n);
  const bulk = boilMethane(createCrust(), { ...createStocks(), ch4Kg: 250n });
  assert.equal(bulk.ch4Kg, 248n);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  assert.equal(boilMethane(roof, { ...createStocks(), ch4Kg: 16n }).ch4Kg, 16n);

  const world = createWorld();
  const bare = closeSol(world, { ...createStocks(), ch4Kg: 16n }, createCrust());
  assert.equal(bare.stocks.ch4Kg, 15n);
  const held = closeSol(world, { ...createStocks(), ch4Kg: 16n }, roof);
  assert.equal(held.stocks.ch4Kg, 16n);
  assert.equal(held.crust.overrides[0].roof, 1);
});
