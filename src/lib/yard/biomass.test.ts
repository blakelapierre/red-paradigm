import assert from "node:assert/strict";
import { test } from "node:test";
import { airKg, createWorld } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { grow } from "./biomass.ts";
import { closeSol, createStocks } from "./power.ts";

test("a gram of biomass grows under a roof and does not touch the air", () => {
  const world = createWorld();
  const before = airKg(world.ls);
  const open = grow(createCrust(), { ...createStocks(), waterKg: 10n });
  assert.equal(open.biomassG, 0);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const grown = grow(roof, { ...createStocks(), waterKg: 10n, toxinMilli: 0, debt: 0 });
  assert.equal(grown.biomassG, 1);
  assert.equal(grown.waterKg, 9n);
  const dirty = grow(roof, { ...grown, toxinMilli: 1000 });
  assert.equal(dirty.biomassG, 1);
  const owed = grow(roof, { ...createStocks(), waterKg: 10n, debt: 1 });
  assert.equal(owed.biomassG, 0);
  assert.equal(airKg(world.ls), before);
});

test("a stocked sol under a roof grows one gram after the crew draws", () => {
  const world = createWorld();
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const closed = closeSol(world, { ...createStocks(), o2Kg: 1n, waterKg: 4n }, roof);
  assert.equal(closed.stocks.debt, 0);
  assert.equal(closed.stocks.biomassG, 1);
  assert.equal(closed.stocks.waterKg, 0n);
  assert.equal(closed.crust.overrides[0].roof, 1);
  const bare = closeSol(world, { ...createStocks(), o2Kg: 1n, waterKg: 4n }, createCrust());
  assert.equal(bare.stocks.biomassG, 0);
  assert.equal(airKg(closed.world.ls), airKg(bare.world.ls));
});
