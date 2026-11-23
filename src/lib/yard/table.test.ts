import assert from "node:assert/strict";
import { test } from "node:test";
import { createTable, seatSite } from "./table.ts";

test("a table is two yards and one climate", () => {
  const table = createTable();
  assert.equal(table.climate.sol, table.witness.sol);
  assert.equal(table.cradle.sealedSol, null);
  assert.equal(table.works.sealedSol, null);
  assert.notEqual(table.cradle, table.works);
  assert.notEqual(table.cradle.stocks, table.works.stocks);
  assert.notEqual(table.cradle.crust, table.works.crust);
  assert.notEqual(table.climate, table.cradle);
  const cradle = seatSite(table.climate, "cradle");
  const works = seatSite(table.climate, "works");
  assert.notEqual(cradle.climateIndex, works.climateIndex);
  assert.notEqual(cradle.ix, works.ix);
  table.cradle.aims[0].on = false;
  assert.equal(table.works.aims[0].on, true);
});
