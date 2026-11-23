import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { roofBillKwh, roofCount, roofWarning, sunPaysRoof } from "./bill.ts";
import { scaleArray } from "./health.ts";
import { LAMP_BED_KWH } from "./lamp.ts";
import { arrayKwh, closeSol, createStocks } from "./power.ts";
import { ROOF_UPKEEP_KWH } from "./upkeep.ts";

test("the warning names a sun that cannot pay the roof", () => {
  const open = createCrust();
  assert.equal(roofCount(open), 0);
  assert.equal(roofWarning(0, 0, 0), null);
  const roof = setFlag(open, 1, 2, "roof", 1);
  assert.equal(roofCount(roof), 1);
  assert.equal(sunPaysRoof(ROOF_UPKEEP_KWH, 1, 0), true);
  assert.equal(roofWarning(ROOF_UPKEEP_KWH, 1, 0), null);
  const short = ROOF_UPKEEP_KWH - 1;
  assert.equal(sunPaysRoof(short, 1, 0), false);
  assert.equal(roofWarning(short, 1, 0), `This sol's sun is ${short} kWh. The roof bill is ${ROOF_UPKEEP_KWH} kWh.`);
  assert.equal(roofBillKwh(1, 25 * LAMP_BED_KWH), ROOF_UPKEEP_KWH + 250);
  const a = roofWarning(short, 1, 0);
  const b = roofWarning(short, 1, 0);
  assert.equal(a, b);
});

test("a sun under the bill drops the roof for both clients", () => {
  const world = createWorld();
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const stocks = { ...createStocks(), healthMilli: 0, batteryKwh: 0 };
  assert.ok(scaleArray(arrayKwh(world), 0) < ROOF_UPKEEP_KWH);
  const a = closeSol(world, stocks, roof);
  const b = closeSol(world, stocks, roof);
  assert.equal(a.crust.overrides[0]?.roof, 0);
  assert.equal(b.crust.overrides[0]?.roof, 0);
  assert.equal(a.stocks.batteryKwh, 0);
  assert.equal(b.stocks.batteryKwh, 0);
});
