import assert from "node:assert/strict";
import { test } from "node:test";
import { airKg, createWorld, stateHash, step } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { turnHash } from "../turn.ts";
import { CABIN_LEAK_KG, CABIN_O2_KG, CABIN_O2_PA, commitMeter, leakCabin } from "./meter.ts";
import { closeSol, createStocks } from "./power.ts";

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

test("the cabin loses one kilogram a sol and does not return it", () => {
  const world = createWorld();
  const before = airKg(world.ls);
  const sealed = leakCabin({ ...createStocks(), cabinO2Kg: CABIN_O2_KG, o2Kg: 10n });
  assert.equal(sealed.cabinO2Kg, CABIN_O2_KG - CABIN_LEAK_KG);
  assert.equal(sealed.o2Kg, 10n);
  const empty = leakCabin(createStocks());
  assert.equal(empty.cabinO2Kg, 0n);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const closed = closeSol(world, { ...createStocks(), cabinO2Kg: CABIN_O2_KG, o2Kg: 1n, waterKg: 4n }, roof);
  assert.equal(closed.stocks.cabinO2Kg, 27n);
  assert.equal(closed.stocks.o2Kg, 0n);
  const stepped = step(world, { fileStorm: true });
  assert.equal(airKg(closed.world.ls), airKg(stepped.ls));
  assert.equal(airKg(world.ls), before);
});
