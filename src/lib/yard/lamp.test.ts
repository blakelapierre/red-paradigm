import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { RATION_G } from "./food.ts";
import { LAMP_G, commitLamp } from "./lamp.ts";
import { closeSol, createStocks } from "./power.ts";

test("a lamp grows 20 g and still does not pay the ration", () => {
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const stocks = { ...createStocks(), finesKg: 20_000n };
  const up = commitLamp(roof, roof, stocks, stocks);
  assert.equal(up.accepted, true);
  assert.equal(up.a.lamp, 1);
  assert.equal(up.a.finesKg, 0n);
  const open = commitLamp(createCrust(), createCrust(), stocks, stocks);
  assert.equal(open.accepted, false);
  const world = createWorld();
  const closed = closeSol(world, { ...up.a, o2Kg: 1n, waterKg: 4n }, roof);
  assert.equal(closed.stocks.biomassG, LAMP_G);
  assert.ok(closed.stocks.biomassG < RATION_G);
  assert.equal(closed.stocks.foodDebt, 1);
});
