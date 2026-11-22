import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, stateHash, step } from "./climate/model.ts";
import { applyDig, corruptHash, createCrust, crustHash, proposeDig } from "./crust/crust.ts";
import { createStocks } from "./yard/power.ts";
import { turnHash } from "./turn.ts";

test("the turn hash agrees until the climate record or the crust record splits", () => {
  let canon = createWorld();
  let witness = createWorld();
  let canonCrust = createCrust();
  let witnessCrust = createCrust();
  const stocks = createStocks();
  assert.equal(turnHash(canon, canonCrust, stocks), turnHash(witness, witnessCrust, stocks));

  const op = proposeDig(canonCrust, 4, 5);
  canonCrust = applyDig(canonCrust, op).crust;
  const missed = applyDig(witnessCrust, { ...op, beforeHash: corruptHash(op.beforeHash) });
  witnessCrust = missed.crust;
  assert.equal(missed.accepted, false);
  assert.equal(stateHash(canon), stateHash(witness));
  assert.notEqual(crustHash(canonCrust), crustHash(witnessCrust));
  assert.notEqual(turnHash(canon, canonCrust, stocks), turnHash(witness, witnessCrust, stocks));

  for (let i = 0; i < 12; i++) {
    canon = step(canon, { fileStorm: true });
    witness = step(witness, { fileStorm: false });
  }
  assert.notEqual(stateHash(canon), stateHash(witness));
  assert.notEqual(turnHash(canon, canonCrust, stocks), turnHash(witness, witnessCrust, stocks));

  const caughtUp = turnHash(canon, canonCrust, stocks);
  assert.equal(turnHash(canon, canonCrust, stocks), caughtUp);
  assert.notEqual(turnHash(witness, canonCrust, stocks), caughtUp);
  assert.notEqual(turnHash(canon, witnessCrust, stocks), caughtUp);
  const rich = { ...stocks, batteryKwh: stocks.batteryKwh + 1 };
  assert.notEqual(turnHash(canon, canonCrust, stocks), turnHash(canon, canonCrust, rich));
});
