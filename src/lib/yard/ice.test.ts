import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld } from "../climate/model.ts";
import { createCrust } from "../crust/crust.ts";
import { turnHash } from "../turn.ts";
import { ICE_LENS_KG, MINE_KG, commitMine } from "./ice.ts";
import { createStocks } from "./power.ts";

test("one tonne of ice becomes dirty water and the lens shrinks", () => {
  const stocks = { ...createStocks(), batteryKwh: 50 };
  assert.equal(stocks.iceKg, ICE_LENS_KG);
  const mined = commitMine(stocks, stocks);
  assert.equal(mined.accepted, true);
  assert.equal(mined.a.waterKg, MINE_KG);
  assert.equal(mined.a.iceKg, ICE_LENS_KG - MINE_KG);
  assert.equal(mined.a.toxinMilli, 1000);
  assert.equal(mined.b.waterKg, mined.a.waterKg);
  const world = createWorld();
  const crust = createCrust();
  assert.notEqual(turnHash(world, crust, stocks), turnHash(world, crust, mined.a));
});

test("no power or no ice leaves the tanks alone", () => {
  const stocks = createStocks();
  const dry = commitMine(stocks, stocks);
  assert.equal(dry.accepted, false);
  assert.equal(dry.a.waterKg, 0n);
  const rich = { ...stocks, batteryKwh: 50, iceKg: 0n };
  const empty = commitMine(rich, rich);
  assert.equal(empty.accepted, false);
  assert.match(empty.reason, /lens/);
});
