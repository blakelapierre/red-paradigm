import assert from "node:assert/strict";
import { test } from "node:test";
import { airKg, createWorld, stateHash } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { grow } from "./biomass.ts";
import { createStocks } from "./power.ts";
import { commitVent } from "./vent.ts";

test("venting one kilogram does not move the air, and five kilograms stop growth", () => {
  const world = createWorld();
  const hash = stateHash(world);
  const before = airKg(world.ls);
  const stocks = { ...createStocks(), batteryKwh: 5, cabinCo2Kg: 1n };
  const vented = commitVent(stocks, stocks, world);
  assert.equal(vented.accepted, true);
  assert.equal(vented.a.cabinCo2Kg, 0n);
  assert.equal(vented.air, before);
  assert.equal(stateHash(world), hash);
  const empty = commitVent(vented.a, vented.b, world);
  assert.equal(empty.accepted, false);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const stale = grow(roof, { ...createStocks(), waterKg: 10n, cabinCo2Kg: 5n });
  assert.equal(stale.biomassG, 0);
  const fresh = grow(roof, { ...createStocks(), waterKg: 10n, cabinCo2Kg: 4n });
  assert.equal(fresh.biomassG, 1);
});
