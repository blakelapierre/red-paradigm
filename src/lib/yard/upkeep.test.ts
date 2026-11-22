import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, stateHash } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { arrayKwh, closeSol, createStocks } from "./power.ts";
import { ROOF_UPKEEP_KWH, keepRoof } from "./upkeep.ts";

test("a roof stays up only if the battery can pay", () => {
  const crust = setFlag(createCrust(), 1, 2, "roof", 1);
  const kept = keepRoof(crust, { ...createStocks(), batteryKwh: ROOF_UPKEEP_KWH });
  assert.equal(kept.crust.overrides[0].roof, 1);
  assert.equal(kept.stocks.batteryKwh, 0);
  const dropped = keepRoof(kept.crust, kept.stocks);
  assert.equal(dropped.crust.overrides[0].roof, 0);
  assert.equal(dropped.stocks.batteryKwh, 0);
});

test("closing a sol bills the roof after the array is banked", () => {
  const world = createWorld();
  const hash = stateHash(world);
  const crust = setFlag(createCrust(), 1, 2, "roof", 1);
  const closed = closeSol(world, createStocks(), crust);
  assert.equal(closed.crust.overrides[0].roof, 1);
  assert.equal(closed.stocks.batteryKwh, arrayKwh(world) - ROOF_UPKEEP_KWH);
  assert.equal(stateHash(world), hash);
  assert.notEqual(stateHash(closed.world), hash);
});
