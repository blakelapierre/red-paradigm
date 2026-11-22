import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, stateHash } from "../climate/model.ts";
import { createCrust, flagOf } from "../crust/crust.ts";
import { createStocks } from "./power.ts";
import { commitRoad } from "./road.ts";

test("a road is a flag and not a climate change", () => {
  const world = createWorld();
  const hash = stateHash(world);
  const stocks = { ...createStocks(), finesKg: 20_000n };
  const laid = commitRoad(createCrust(), createCrust(), stocks, stocks, 3, 4);
  assert.equal(laid.accepted, true);
  assert.equal(flagOf(laid.a, 3, 4, "road"), 1);
  assert.equal(flagOf(laid.b, 3, 4, "road"), 1);
  assert.equal(laid.aStocks.finesKg, 0n);
  assert.equal(laid.bStocks.finesKg, 0n);
  assert.equal(stateHash(world), hash);
  const again = commitRoad(laid.a, laid.b, laid.aStocks, laid.bStocks, 3, 4);
  assert.equal(again.accepted, false);
  assert.equal(again.a, laid.a);
  const poor = commitRoad(createCrust(), createCrust(), createStocks(), createStocks(), 3, 4);
  assert.equal(poor.accepted, false);
  assert.match(poor.reason, /fines/);
});
