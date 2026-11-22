import assert from "node:assert/strict";
import { test } from "node:test";
import { CELL_COUNT, cellIndex, cellLat, cellLon } from "../climate/constants.ts";
import { createWorld, stateHash, surveyPressure } from "../climate/model.ts";
import {
  CELL_M,
  COLS,
  CUT_KG,
  DIG_DZ_CM,
  ROWS,
  YARD_KG,
  applyDig,
  beforeHash,
  cellCenter,
  cellOf,
  commitDig,
  corruptHash,
  createCrust,
  crustHash,
  floorM,
  overrideAt,
  proposeDig,
  spoilKg,
} from "./crust.ts";

test("the grid is one kilometer and untouched ground is not stored", () => {
  assert.equal(CELL_M, 1000);
  assert.equal(COLS, 21297);
  assert.equal(ROWS, 10648);
  const crust = createCrust();
  assert.equal(crust.overrides.length, 0);
  assert.equal(crust.holdKg, YARD_KG);
  assert.equal(floorM(-4000, overrideAt(crust, 10, 10)), -4000);
});

test("one cut of two meters is three billion kilograms, and the yard holds one", () => {
  assert.equal(DIG_DZ_CM, -200);
  assert.equal(spoilKg(DIG_DZ_CM), 3_000_000_000n);
  assert.equal(CUT_KG, 3_000_000_000n);
  assert.equal(YARD_KG, CUT_KG);
});

test("a dig writes one integer and leaves the climate hash alone", () => {
  const world = createWorld();
  const before = stateHash(world);
  const cell = cellOf(cellLat(18), cellLon(0));
  const crust = createCrust(world.seed);
  const op = proposeDig(crust, cell.ix, cell.iy);
  const dug = applyDig(crust, op);
  assert.equal(dug.accepted, true);
  assert.equal(dug.crust.overrides.length, 1);
  assert.equal(dug.crust.overrides[0].dzCm, -200);
  assert.equal(dug.crust.spoilKg, CUT_KG);
  assert.equal(dug.crust.holdKg, 0n);
  assert.equal(floorM(-4000, dug.crust.overrides[0].dzCm), -4002);
  assert.equal(stateHash(world), before);
});

test("two meters of pit is not a new atmosphere", () => {
  const seed = -4000;
  const floor = floorM(seed, DIG_DZ_CM);
  const delta = surveyPressure(floor) - surveyPressure(seed);
  assert.ok(delta > 0 && delta < 1, `delta ${delta}`);
});

test("a second cut is refused and the hash does not move", () => {
  let crust = createCrust();
  const first = applyDig(crust, proposeDig(crust, 100, 200));
  crust = first.crust;
  const hash = crustHash(crust);
  const again = applyDig(crust, proposeDig(crust, 101, 200));
  assert.equal(again.accepted, false);
  assert.match(again.reason, /yard cannot hold/);
  assert.equal(again.crust, crust);
  assert.equal(crustHash(again.crust), hash);
  assert.equal(again.crust.overrides.length, 1);
});

test("a shared cut lands for both clients or for neither", () => {
  const a = createCrust();
  const b = createCrust();
  const first = commitDig(a, b, 4, 5);
  assert.equal(first.accepted, true);
  assert.equal(crustHash(first.a), crustHash(first.b));
  const hash = crustHash(first.a);
  const second = commitDig(first.a, first.b, 6, 7);
  assert.equal(second.accepted, false);
  assert.match(second.reason, /yard cannot hold/);
  assert.equal(second.a, first.a);
  assert.equal(second.b, first.b);
  assert.equal(crustHash(second.a), hash);
});

test("a bad before-hash is refused even when the yard has room", () => {
  const crust = createCrust();
  const op = proposeDig(crust, 4, 5);
  const bad = applyDig(crust, { ...op, beforeHash: corruptHash(op.beforeHash) });
  assert.equal(bad.accepted, false);
  assert.equal(bad.reason, "before-hash does not match");
  assert.equal(bad.crust, crust);
  assert.equal(crustHash(bad.crust), crustHash(crust));
  assert.notEqual(corruptHash(op.beforeHash), op.beforeHash);
});

test("two clients with the same before-hash dig the same pit", () => {
  const a = createCrust();
  const b = createCrust();
  const op = proposeDig(a, 8, 9);
  assert.equal(beforeHash(b, 8, 9), op.beforeHash);
  const da = applyDig(a, op);
  const db = applyDig(b, op);
  assert.equal(da.accepted && db.accepted, true);
  assert.equal(crustHash(da.crust), crustHash(db.crust));
});

test("a witness who already diverged cannot apply the next cut", () => {
  const canon = createCrust();
  const witness = createCrust();
  const first = proposeDig(canon, 3, 4);
  const dug = applyDig(canon, first);
  const missed = applyDig(witness, { ...first, beforeHash: corruptHash(first.beforeHash) });
  assert.equal(missed.accepted, false);
  const second = proposeDig(dug.crust, 30, 40);
  const rejected = applyDig(missed.crust, second);
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.reason, "before-hash does not match");
  assert.notEqual(crustHash(dug.crust), crustHash(missed.crust));
});

test("every climate cell center lands back in that cell", () => {
  for (let i = 0; i < CELL_COUNT; i++) {
    const latIndex = Math.floor(i / 72);
    const lonIndex = i % 72;
    const { ix, iy } = cellOf(cellLat(latIndex), cellLon(lonIndex));
    const center = cellCenter(ix, iy);
    assert.equal(cellIndex(center.lat, center.lon), i, `cell ${i}`);
  }
});
