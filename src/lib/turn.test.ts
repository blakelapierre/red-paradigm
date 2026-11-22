import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, stateHash, step } from "./climate/model.ts";
import { applyDig, corruptHash, createCrust, crustHash, proposeDig } from "./crust/crust.ts";
import { turnHash } from "./turn.ts";

test("the turn hash agrees until the climate record or the crust record splits", () => {
  let canon = createWorld();
  let witness = createWorld();
  let canonCrust = createCrust();
  let witnessCrust = createCrust();
  assert.equal(turnHash(canon, canonCrust), turnHash(witness, witnessCrust));

  const op = proposeDig(canonCrust, 4, 5);
  canonCrust = applyDig(canonCrust, op).crust;
  const missed = applyDig(witnessCrust, { ...op, beforeHash: corruptHash(op.beforeHash) });
  witnessCrust = missed.crust;
  assert.equal(missed.accepted, false);
  assert.equal(stateHash(canon), stateHash(witness));
  assert.notEqual(crustHash(canonCrust), crustHash(witnessCrust));
  assert.notEqual(turnHash(canon, canonCrust), turnHash(witness, witnessCrust));

  for (let i = 0; i < 12; i++) {
    canon = step(canon, { fileStorm: true });
    witness = step(witness, { fileStorm: false });
  }
  assert.notEqual(stateHash(canon), stateHash(witness));
  assert.notEqual(turnHash(canon, canonCrust), turnHash(witness, witnessCrust));

  const caughtUp = turnHash(canon, canonCrust);
  assert.equal(turnHash(canon, canonCrust), caughtUp);
  assert.notEqual(turnHash(witness, canonCrust), caughtUp);
  assert.notEqual(turnHash(canon, witnessCrust), caughtUp);
});
