import assert from "node:assert/strict";
import { test } from "node:test";
import { cellLat, cellLon, latIndexOf, lonIndexOf } from "../climate/constants.ts";
import { createWorld, siteIndex, surveyPressure } from "../climate/model.ts";
import { cellOf, createCrust } from "../crust/crust.ts";
import { SOLS_PER_YEAR } from "../climate/constants.ts";
import { DEFAULT_AIMS, bankSols, type WorkSite, type Yard } from "./governor.ts";
import { createStocks } from "./power.ts";
import { TURN_SOLS, circuits, lsAround, lsTraveled, turnsPast, yearLine } from "./year.ts";

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

test("a turn is 28 sols, and twenty-four turns are not a year", () => {
  assert.equal(TURN_SOLS, 28);
  assert.equal(turnsPast(23), false);
  assert.equal(lsAround(0, 23 * TURN_SOLS), false);
  assert.equal(turnsPast(24), true);
  assert.notEqual(24 * TURN_SOLS, SOLS_PER_YEAR);
  assert.equal(lsAround(0, TURN_SOLS), false);
});

test("one turn banks 28 sols and the longitude has not come around", () => {
  const index = siteIndex("cradle");
  const lat = cellLat(latIndexOf(index));
  const lon = cellLon(lonIndexOf(index));
  const at = cellOf(lat, lon);
  const world = createWorld();
  const site: WorkSite = {
    ix: at.ix,
    iy: at.iy,
    pressurePa: Math.round(surveyPressure(world.zM[index])),
    climateIndex: index,
    latDeg: lat,
  };
  const yard: Yard = {
    canon: world,
    witness: createWorld(),
    canonCrust: createCrust(),
    witnessCrust: createCrust(),
    canonStocks: createStocks(),
    witnessStocks: createStocks(),
  };
  const stepped = bankSols(yard, TURN_SOLS, DEFAULT_AIMS, site, false);
  assert.equal(stepped.yard.canon.sol, TURN_SOLS);
  assert.equal(stepped.yard.witness.sol, TURN_SOLS);
  assert.equal(lsAround(0, stepped.yard.canon.sol), false);
  assert.equal(yearLine(stepped.yard.canon.sol), "Ls has not come back around.");
  assert.equal(stepped.landed.length, 0);
});



