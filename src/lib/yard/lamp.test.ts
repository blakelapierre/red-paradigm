import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { RATION_G } from "./food.ts";
import { LAMP_BED_KWH, LAMP_G, commitLamp, payLamp } from "./lamp.ts";
import { closeSol, createStocks } from "./power.ts";
import { ROOF_UPKEEP_KWH } from "./upkeep.ts";

test("a lamp grows 20 g and still does not pay the ration", () => {
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const stocks = { ...createStocks(), finesKg: 20_000n };
  const up = commitLamp(roof, roof, stocks, stocks);
  assert.equal(up.accepted, true);
  assert.equal(up.a.lamp, 1);
  assert.equal(up.a.finesKg, 0n);
  const open = commitLamp(createCrust(), createCrust(), stocks, stocks);
  assert.equal(open.accepted, false);
  const world = createWorld();
  const closed = closeSol(world, { ...up.a, o2Kg: 1n, waterKg: 4n }, roof);
  assert.equal(closed.stocks.biomassG, LAMP_G);
  assert.ok(closed.stocks.biomassG < RATION_G);
  assert.equal(closed.stocks.foodDebt, 1);
  assert.equal(closed.stocks.batteryKwh > 0, true);
});

test("the lamp is dark when the battery can pay the roof and not the beds", () => {
  const unpaid = payLamp({ ...createStocks(), lamp: 1, beds: 1, batteryKwh: LAMP_BED_KWH - 1 });
  assert.equal(unpaid.lit, false);
  assert.equal(unpaid.stocks.batteryKwh, LAMP_BED_KWH - 1);
  const paid = payLamp({ ...createStocks(), lamp: 1, beds: 25, batteryKwh: 25 * LAMP_BED_KWH });
  assert.equal(paid.lit, true);
  assert.equal(paid.stocks.batteryKwh, 0);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const world = createWorld();
  const tight = closeSol(
    world,
    { ...createStocks(), lamp: 1, beds: 2, capKwh: ROOF_UPKEEP_KWH, o2Kg: 1n, waterKg: 5n },
    roof,
  );
  assert.equal(tight.crust.overrides[0].roof, 1);
  assert.equal(tight.stocks.batteryKwh, 0);
  assert.equal(tight.stocks.biomassG, 2);
  assert.ok(tight.stocks.biomassG < RATION_G);
});
