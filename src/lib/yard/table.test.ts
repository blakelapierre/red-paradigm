import assert from "node:assert/strict";
import { test } from "node:test";
import { bothSealed, closeIfSealed, closeTable, createTable, publicFace, runSeat, sealSeat, seatSite, tableHash, WORKS_FINES_KG } from "./table.ts";
import { DEFAULT_AIMS } from "./governor.ts";
import { CUT_KWH, closeSol, createStocks, stocksBytes } from "./power.ts";
import { createWorld } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { LOFT_KWH, TAU_CAP_MILLI } from "./release.ts";
import { MILL_FINES_KG } from "./mill.ts";

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

test("the sol does not close until both yards have sealed it", () => {
  const one = sealSeat(createTable(), "cradle", DEFAULT_AIMS);
  assert.equal(bothSealed(one), false);
  assert.equal(closeIfSealed(one).closed, false);
  assert.equal(closeIfSealed(one).table.climate.sol, 0);
  const both = sealSeat(one, "works", DEFAULT_AIMS);
  const closed = closeIfSealed(both);
  assert.equal(closed.closed, true);
  assert.equal(closed.table.climate.sol, 1);
  assert.equal(closed.table.cradle.sealedSol, null);
  assert.equal(closed.table.works.sealedSol, null);
});

test("a list cannot spend the other yard", () => {
  const table = createTable();
  table.cradle.stocks = { ...table.cradle.stocks, batteryKwh: CUT_KWH };
  table.cradle.witnessStocks = { ...table.cradle.witnessStocks, batteryKwh: CUT_KWH };
  table.cradle.aims = DEFAULT_AIMS.map((aim) => ({ ...aim, on: aim.id === "cut" }));
  const before = Buffer.from(stocksBytes(table.works.stocks)).toString("hex");
  const ran = runSeat(table, "cradle");
  assert.ok(ran.table.cradle.crust.spoilKg > 0n);
  assert.equal(ran.table.works.crust.spoilKg, 0n);
  assert.equal(ran.table.works.stocks.batteryKwh, 0);
  assert.equal(Buffer.from(stocksBytes(ran.table.works.stocks)).toString("hex"), before);
  assert.equal(ran.table.works.witnessStocks.batteryKwh, 0);
});

test("the table hash covers both yards, and a dropped storm splits", () => {
  const a = createTable();
  const b = createTable();
  assert.equal(tableHash(a), tableHash(b));
  const dropped = {
    ...a,
    witness: { ...a.witness, storm: { startSol: 12, duration: 40, peakTauMilli: 5000 } },
  };
  assert.notEqual(tableHash(dropped), tableHash(a));
  const richer = { ...a, works: { ...a.works, stocks: { ...a.works.stocks, finesKg: 1n } } };
  assert.notEqual(tableHash(richer), tableHash(a));
});

test("the public face is held or dark, not the warehouse", () => {
  const open = publicFace(createTable());
  assert.deepEqual(
    { cradle: open.cradle, works: open.works, storming: open.storming },
    { cradle: "dark", works: "dark", storming: false },
  );
  assert.equal(JSON.stringify(open).includes("Kg"), false);
  const piled = createTable();
  piled.works.stocks = { ...piled.works.stocks, finesKg: 9_000_000n, batteryKwh: 50_000 };
  assert.equal(publicFace(piled).works, "dark");
  assert.equal(publicFace(piled).cradle, publicFace(createTable()).cradle);
  const held = createTable();
  held.cradle.crust = setFlag(createCrust(), 1, 2, "roof", 1);
  held.cradle.stocks = { ...held.cradle.stocks, cabinO2Kg: 28n, biomassG: 500, debt: 0, foodDebt: 0 };
  assert.equal(publicFace(held).cradle, "held");
  assert.equal(publicFace(held).works, "dark");
});

test("a loft writes the shared climate for both copies, or for neither", () => {
  const table = createTable();
  const site = seatSite(table.climate, "cradle");
  const rich = { ...table.cradle.stocks, finesKg: MILL_FINES_KG, batteryKwh: LOFT_KWH };
  table.cradle.stocks = rich;
  table.cradle.witnessStocks = { ...rich };
  table.cradle.aims = DEFAULT_AIMS.map((aim) => ({ ...aim, on: aim.id === "veil" }));
  const ran = runSeat(table, "cradle", site);
  assert.ok(ran.table.climate.tauAerMilli[site.climateIndex] > 0);
  assert.equal(ran.table.climate.tauAerMilli[site.climateIndex], ran.table.witness.tauAerMilli[site.climateIndex]);
  assert.equal(ran.table.works.stocks.finesKg, WORKS_FINES_KG);
  assert.ok(ran.table.cradle.stocks.finesKg < MILL_FINES_KG);

  const capped = createTable();
  const tau = new Uint16Array(capped.witness.tauAerMilli);
  tau[site.climateIndex] = TAU_CAP_MILLI;
  capped.witness = { ...capped.witness, tauAerMilli: tau };
  capped.cradle.stocks = { ...rich };
  capped.cradle.witnessStocks = { ...rich };
  capped.cradle.aims = table.cradle.aims;
  const heldBack = runSeat(capped, "cradle", site);
  assert.equal(heldBack.table.climate.tauAerMilli[site.climateIndex], 0);
  assert.equal(heldBack.table.cradle.stocks.finesKg, MILL_FINES_KG);
  assert.equal(heldBack.table.cradle.stocks.batteryKwh, LOFT_KWH);
});

test("the works starts with a reactor and fines, and it is not already holding", () => {
  const table = createTable();
  assert.equal(table.cradle.stocks.reactor, 0);
  assert.equal(table.cradle.stocks.finesKg, 0n);
  assert.equal(table.works.stocks.reactor, 1);
  assert.equal(table.works.witnessStocks.finesKg, WORKS_FINES_KG);
  assert.equal(table.works.stocks.biomassG, 0);
  assert.equal(publicFace(table).works, "dark");
  assert.equal(publicFace(table).cradle, "dark");
});
