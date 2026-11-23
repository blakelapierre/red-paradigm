import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, stateHash } from "../climate/model.ts";
import { CUT_KG, KG_PER_CM, commitDig, createCrust, overrideAt } from "../crust/crust.ts";
import { commitDump } from "./dump.ts";

test("one centimeter of tailings fills the hole and does not free a second cut", () => {
  const world = createWorld();
  const hash = stateHash(world);
  const dug = commitDig(createCrust(), createCrust(), 4, 5);
  assert.equal(dug.accepted, true);
  const withTailings = { ...dug.a, tailingsKg: KG_PER_CM };
  const dumped = commitDump(withTailings, withTailings, 4, 5);
  assert.equal(dumped.accepted, true);
  assert.equal(overrideAt(dumped.a, 4, 5), -199);
  assert.equal(dumped.a.tailingsKg, 0n);
  assert.equal(dumped.a.holdKg, KG_PER_CM);
  assert.equal(overrideAt(dumped.b, 4, 5), -199);
  assert.ok(dumped.a.holdKg < CUT_KG);
  const again = commitDig(dumped.a, dumped.b, 6, 7);
  assert.equal(again.accepted, false);
  assert.match(again.reason, /yard cannot hold/);
  assert.equal(stateHash(world), hash);
  const bare = commitDump(createCrust(), createCrust(), 4, 5);
  assert.equal(bare.accepted, false);
});
