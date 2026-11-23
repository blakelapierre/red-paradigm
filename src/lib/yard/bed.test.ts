import assert from "node:assert/strict";
import { test } from "node:test";
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
