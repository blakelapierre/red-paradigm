import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, inspect, stateHash } from "../climate/model.ts";
import { createCrust, flagOf } from "../crust/crust.ts";
import { createStocks } from "./power.ts";
import { commitBerm } from "./berm.ts";

test("a berm does not change the climate cell amplitude", () => {
  const world = createWorld();
  const hash = stateHash(world);
  const before = inspect(world, 0).tAmp;
  const stocks = { ...createStocks(), finesKg: 20_000n };
  const built = commitBerm(createCrust(), createCrust(), stocks, stocks, 1, 2);
  assert.equal(built.accepted, true);
  assert.equal(flagOf(built.a, 1, 2, "berm"), 1);
  assert.equal(flagOf(built.b, 1, 2, "berm"), 1);
  assert.equal(built.aStocks.finesKg, 0n);
  assert.equal(inspect(world, 0).tAmp, before);
  assert.equal(stateHash(world), hash);
  const again = commitBerm(built.a, built.b, built.aStocks, built.bStocks, 1, 2);
  assert.equal(again.accepted, false);
});
