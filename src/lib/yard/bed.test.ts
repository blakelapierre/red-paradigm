import assert from "node:assert/strict";
import { test } from "node:test";
import { createCrust, setFlag } from "../crust/crust.ts";
import { grow } from "./biomass.ts";
import { createStocks, stocksBytes } from "./power.ts";

test("the yard starts with one bed, and the count is in the stocks hash", () => {
  const stocks = createStocks();
  assert.equal(stocks.beds, 1);
  const bytes = stocksBytes(stocks);
  assert.equal(bytes.length, 156);
  assert.equal(new DataView(bytes.buffer).getUint32(152), 1);
  const more = stocksBytes({ ...stocks, beds: 2 });
  assert.notEqual(Buffer.from(more).toString("hex"), Buffer.from(bytes).toString("hex"));
});

test("beds scale the gram and the water, or the sol grows nothing", () => {
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const four = grow(roof, { ...createStocks(), beds: 4, waterKg: 4n, lamp: 0 }, false);
  assert.equal(four.biomassG, 4);
  assert.equal(four.waterKg, 0n);
  const short = grow(roof, { ...createStocks(), beds: 4, waterKg: 3n }, false);
  assert.equal(short.biomassG, 0);
  assert.equal(short.waterKg, 3n);
  const lit = grow(roof, { ...createStocks(), beds: 2, waterKg: 2n, lamp: 1 });
  assert.equal(lit.biomassG, 40);
  assert.equal(lit.waterKg, 0n);
});
