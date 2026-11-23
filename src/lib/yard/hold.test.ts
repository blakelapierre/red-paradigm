import assert from "node:assert/strict";
import { test } from "node:test";
import { createCrust, setFlag } from "../crust/crust.ts";
import { cradleHolding } from "./hold.ts";
import { CABIN_O2_KG } from "./meter.ts";
import { createStocks } from "./power.ts";

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
