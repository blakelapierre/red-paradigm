import assert from "node:assert/strict";
import { test } from "node:test";
import { SOLS_PER_YEAR } from "../climate/constants.ts";
import { circuits, lsAround, lsTraveled, yearLine } from "./year.ts";

test("Ls comes back around from 668.6, not from a stored 669", () => {
  const short = Math.floor(SOLS_PER_YEAR);
  const first = Math.ceil(SOLS_PER_YEAR);
  assert.ok(short < SOLS_PER_YEAR);
  assert.ok(first > SOLS_PER_YEAR);
  assert.ok(lsTraveled(0, short) < 360);
  assert.ok(lsTraveled(0, first) >= 360);
  assert.equal(lsAround(0, short), false);
  assert.equal(lsAround(0, first), true);
  assert.equal(circuits(short), 0);
  assert.equal(circuits(first), 1);
  assert.notEqual(SOLS_PER_YEAR, first);
});

test("the sentence is the longitude, not a year count", () => {
  const short = Math.floor(SOLS_PER_YEAR);
  const first = Math.ceil(SOLS_PER_YEAR);
  assert.equal(yearLine(0), "Ls has not come back around.");
  assert.equal(yearLine(short), "Ls has not come back around.");
  assert.equal(yearLine(first), "Ls has come back around.");
  assert.equal(yearLine(first + Math.ceil(SOLS_PER_YEAR)), "Ls has come back around 2 times.");
  assert.equal(yearLine(first).includes("669"), false);
});

