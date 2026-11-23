import assert from "node:assert/strict";
import { test } from "node:test";
import { createCrust, setFlag } from "../crust/crust.ts";
import { createStocks } from "./power.ts";
import { vesselLines } from "./status.ts";

test("the status is five lines", () => {
  const lines = vesselLines(createCrust(), createStocks());
  assert.deepEqual(lines, ["No roof", "Beds 1/25", "Food 0/500 g", "Cabin 0 kg", "Hold 0/10"]);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const up = vesselLines(roof, { ...createStocks(), beds: 25, biomassG: 500, cabinO2Kg: 28n, heldSols: 3 });
  assert.equal(up[0], "Roof up");
  assert.equal(up[4], "Hold 3/10");
});
