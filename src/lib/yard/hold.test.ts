import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { BED_CAP } from "./bed.ts";
import { cradleHolding, markHold } from "./hold.ts";
import { CABIN_O2_KG } from "./meter.ts";
import { closeSol, createStocks, stocksBytes } from "./power.ts";
import { STALE_CO2_KG } from "./vent.ts";

function ready() {
  return {
    crust: setFlag(createCrust(), 1, 2, "roof", 1),
    stocks: { ...createStocks(), cabinO2Kg: CABIN_O2_KG, biomassG: 500, foodDebt: 0, debt: 0 },
  };
}

test("the cradle holds only when the vessel, the meter, the crew, and the ration all do", () => {
  const ok = ready();
  assert.equal(cradleHolding(ok.crust, ok.stocks), true);
  assert.equal(cradleHolding(createCrust(), ok.stocks), false);
  assert.equal(cradleHolding(ok.crust, { ...ok.stocks, cabinO2Kg: CABIN_O2_KG - 1n }), false);
  assert.equal(cradleHolding(ok.crust, { ...ok.stocks, debt: 1 }), false);
  assert.equal(cradleHolding(ok.crust, { ...ok.stocks, foodDebt: 1 }), false);
  assert.equal(cradleHolding(ok.crust, { ...ok.stocks, biomassG: 499 }), false);
});

test("a holding sol advances the run, and a miss zeros it", () => {
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const world = createWorld();
  const held = closeSol(
    world,
    {
      ...createStocks(),
      lamp: 1,
      beds: BED_CAP,
      cabinO2Kg: CABIN_O2_KG + 1n,
      biomassG: 500,
      o2Kg: 1n,
      waterKg: 28n,
      heldSols: 3,
    },
    roof,
  );
  assert.equal(held.stocks.cabinO2Kg, CABIN_O2_KG);
  assert.equal(held.stocks.foodDebt, 0);
  assert.equal(held.stocks.biomassG, 500);
  assert.equal(held.stocks.heldSols, 4);
  const missed = closeSol(
    world,
    {
      ...createStocks(),
      lamp: 1,
      beds: BED_CAP,
      cabinO2Kg: CABIN_O2_KG,
      biomassG: 500,
      o2Kg: 1n,
      waterKg: 28n,
      heldSols: 4,
    },
    roof,
  );
  assert.equal(missed.stocks.cabinO2Kg, CABIN_O2_KG - 1n);
  assert.equal(missed.stocks.heldSols, 0);
  assert.equal(markHold(createCrust(), { ...held.stocks, heldSols: 2 }).heldSols, 0);
  const plain = stocksBytes(createStocks());
  const marked = stocksBytes({ ...createStocks(), heldSols: 4 });
  assert.equal(new DataView(marked.buffer).getUint32(156), 4);
  assert.notEqual(Buffer.from(plain).toString("hex"), Buffer.from(marked).toString("hex"));
});

test("five breaths without a vent zero the run", () => {
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  let world = createWorld();
  let stocks = {
    ...createStocks(),
    lamp: 1,
    beds: BED_CAP,
    cabinO2Kg: CABIN_O2_KG + STALE_CO2_KG,
    biomassG: 500,
    o2Kg: STALE_CO2_KG,
    waterKg: 28n * STALE_CO2_KG,
  };
  let crust = roof;
  for (let sol = 1; sol < Number(STALE_CO2_KG); sol++) {
    const closed = closeSol(world, stocks, crust);
    world = closed.world;
    stocks = closed.stocks;
    crust = closed.crust;
    assert.equal(stocks.heldSols, sol);
  }
  const stale = closeSol(world, stocks, crust);
  assert.equal(stale.stocks.cabinCo2Kg, STALE_CO2_KG);
  assert.equal(stale.stocks.biomassG, 0);
  assert.equal(stale.stocks.heldSols, 0);
});

