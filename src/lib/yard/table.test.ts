import assert from "node:assert/strict";
import { test } from "node:test";
import { createTable, closeTable, seatSite } from "./table.ts";
import { closeSol, createStocks } from "./power.ts";
import { createCrust } from "../crust/crust.ts";
import { createWorld } from "../climate/model.ts";

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

test("the shared climate steps once, and each yard banks its own sun", () => {
  const table = createTable();
  const closed = closeTable(table);
  assert.equal(closed.climate.sol, 1);
  assert.equal(closed.witness.sol, 1);
  assert.ok(closed.cradle.stocks.batteryKwh > 0);
  assert.ok(closed.works.stocks.batteryKwh > 0);
  assert.equal(closed.cradle.witnessStocks.batteryKwh, closed.cradle.stocks.batteryKwh);
  assert.equal(closed.works.witnessStocks.batteryKwh, closed.works.stocks.batteryKwh);
  const twice = closeSol(closeSol(createWorld(), createStocks(), createCrust()).world, createStocks(), createCrust());
  assert.equal(twice.world.sol, 2);
  assert.notEqual(closed.climate.sol, twice.world.sol);
});
