import assert from "node:assert/strict";
import { test } from "node:test";
import { createCrust, crustHash } from "../crust/crust.ts";
import { commitMill, FINES_CAP_KG, MILL_FINES_KG, MILL_KWH, MILL_SPOIL_KG, MILL_TAILINGS_KG } from "./mill.ts";
import { createStocks } from "./power.ts";

function loaded() {
  const crust = createCrust();
  return {
    crust: { ...crust, spoilKg: MILL_SPOIL_KG, holdKg: 0n },
    stocks: { ...createStocks(), batteryKwh: MILL_KWH },
  };
}

test("a mill batch is five percent fines and both clients move together", () => {
  const { crust, stocks } = loaded();
  const milled = commitMill(crust, crust, stocks, stocks);
  assert.equal(milled.accepted, true);
  assert.equal(milled.a.spoilKg, 0n);
  assert.equal(milled.a.tailingsKg, MILL_TAILINGS_KG);
  assert.equal(milled.aStocks.finesKg + milled.a.tailingsKg, MILL_SPOIL_KG);
  assert.equal(milled.aStocks.finesKg, MILL_FINES_KG);
  assert.equal(milled.aStocks.batteryKwh, 0);
  assert.equal(crustHash(milled.a), crustHash(milled.b));
  assert.equal(milled.aStocks.finesKg, milled.bStocks.finesKg);
});

test("no spoil or no power leaves the yard untouched", () => {
  const empty = createCrust();
  const rich = { ...createStocks(), batteryKwh: MILL_KWH };
  const noSpoil = commitMill(empty, empty, rich, rich);
  assert.equal(noSpoil.accepted, false);
  assert.equal(noSpoil.a, empty);
  assert.equal(noSpoil.aStocks.finesKg, 0n);

  const { crust, stocks } = loaded();
  const poor = { ...stocks, batteryKwh: MILL_KWH - 1 };
  const before = crustHash(crust);
  const noPower = commitMill(crust, crust, poor, poor);
  assert.equal(noPower.accepted, false);
  assert.equal(crustHash(noPower.a), before);
  assert.equal(noPower.a.spoilKg, MILL_SPOIL_KG);
});

test("the warehouse stops at ten batches", () => {
  const { crust, stocks } = loaded();
  const full = { ...stocks, finesKg: FINES_CAP_KG - MILL_FINES_KG + 1n };
  const refused = commitMill(crust, crust, full, full);
  assert.equal(refused.accepted, false);
  assert.match(refused.reason, /warehouse/);
  assert.equal(refused.a.spoilKg, crust.spoilKg);
  const room = { ...stocks, finesKg: FINES_CAP_KG - MILL_FINES_KG };
  const milled = commitMill(crust, crust, room, room);
  assert.equal(milled.accepted, true);
  assert.equal(milled.aStocks.finesKg, FINES_CAP_KG);
});
