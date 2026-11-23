import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, stateHash } from "../climate/model.ts";
import { createCrust } from "../crust/crust.ts";
import { turnHash } from "../turn.ts";
import { CABIN_O2_KG, CABIN_O2_PA, commitMeter } from "./meter.ts";
import { createStocks } from "./power.ts";

test("28 kg of cabin oxygen is about 21 kPa and not breathable air", () => {
  const world = createWorld();
  const hash = stateHash(world);
  const stocks = { ...createStocks(), batteryKwh: 10, o2Kg: CABIN_O2_KG };
  const metered = commitMeter(stocks, stocks);
  assert.equal(metered.accepted, true);
  assert.equal(metered.a.o2Kg, 0n);
  assert.equal(metered.a.cabinO2Kg, CABIN_O2_KG);
  assert.equal(CABIN_O2_PA, 21330);
  assert.match(metered.reason, /not breathable/);
  assert.equal(metered.b.cabinO2Kg, metered.a.cabinO2Kg);
  assert.equal(stateHash(world), hash);
  assert.notEqual(turnHash(world, createCrust(), stocks), turnHash(world, createCrust(), metered.a));
  const again = commitMeter(metered.a, metered.b);
  assert.equal(again.accepted, false);
  const poor = commitMeter({ ...createStocks(), batteryKwh: 10, o2Kg: 27n }, { ...createStocks(), batteryKwh: 10, o2Kg: 27n });
  assert.equal(poor.accepted, false);
  assert.equal(poor.a.cabinO2Kg, 0n);
});
