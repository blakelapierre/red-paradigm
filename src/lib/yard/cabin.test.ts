import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, stateHash } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { CABIN_CAP_K, commitHeat } from "./cabin.ts";
import { createStocks } from "./power.ts";

test("heating the vessel does not move the climate cell", () => {
  const world = createWorld();
  const hash = stateHash(world);
  const open = commitHeat(createCrust(), createCrust(), { ...createStocks(), batteryKwh: 10_000 }, { ...createStocks(), batteryKwh: 10_000 });
  assert.equal(open.accepted, false);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const stocks = { ...createStocks(), batteryKwh: 10_000 };
  const warmed = commitHeat(roof, roof, stocks, stocks);
  assert.equal(warmed.accepted, true);
  assert.equal(warmed.a.cabinRiseK, 1);
  assert.equal(warmed.b.cabinRiseK, 1);
  assert.equal(warmed.a.batteryKwh, 0);
  assert.equal(stateHash(world), hash);
  const capped = commitHeat(roof, roof, { ...stocks, cabinRiseK: CABIN_CAP_K }, { ...stocks, cabinRiseK: CABIN_CAP_K });
  assert.equal(capped.accepted, false);
  assert.equal(capped.a.batteryKwh, stocks.batteryKwh);
});
