import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, step } from "../climate/model.ts";
import { createCrust, crustHash, setFlag } from "../crust/crust.ts";
import { CRADLE_CELL } from "./cable.ts";
import { CUT_KWH, arrayKwh, closeSol, commitPoweredCut, createStocks, credit } from "./power.ts";

test("one clear sol cannot pay for the cut and two sols can", () => {
  let world = createWorld();
  let stocks = createStocks();
  const first = arrayKwh(world);
  assert.ok(first > 900_000 && first < CUT_KWH, `first ${first}`);
  stocks = credit(stocks, first);
  assert.ok(stocks.batteryKwh < CUT_KWH);
  world = step(world, { fileStorm: true });
  stocks = credit(stocks, arrayKwh(world));
  assert.ok(stocks.batteryKwh >= CUT_KWH, `banked ${stocks.batteryKwh}`);
  assert.ok(stocks.batteryKwh - CUT_KWH < 100_000);
});

test("a storm sol pays tens of thousands of kWh, not a cut", () => {
  let world = createWorld();
  for (let i = 0; i < 32; i++) world = step(world, { fileStorm: true });
  const storm = arrayKwh(world);
  assert.ok(storm > 10_000 && storm < 50_000, `storm ${storm}`);
});

test("closing a sol banks the array the board was showing", () => {
  const world = createWorld();
  const shown = arrayKwh(world);
  const closed = closeSol(world, createStocks(), createCrust());
  assert.equal(closed.world.sol, 1);
  assert.equal(closed.stocks.batteryKwh, shown);
});

test("a cut that cannot be paid does not dig, and a paid cut spends both batteries", () => {
  const crust = createCrust();
  const stocks = createStocks();
  const hash = crustHash(crust);
  const unpaid = commitPoweredCut(crust, crust, stocks, stocks, CRADLE_CELL.ix, CRADLE_CELL.iy);
  assert.equal(unpaid.accepted, false);
  assert.match(unpaid.reason, /battery cannot pay/);
  assert.equal(unpaid.a, crust);
  assert.equal(crustHash(crust), hash);

  let world = createWorld();
  let bank = stocks;
  bank = credit(bank, arrayKwh(world));
  world = step(world, { fileStorm: true });
  bank = credit(bank, arrayKwh(world));
  const paid = commitPoweredCut(crust, crust, bank, bank, CRADLE_CELL.ix, CRADLE_CELL.iy);
  assert.equal(paid.accepted, true);
  assert.equal(paid.aStocks.batteryKwh, bank.batteryKwh - CUT_KWH);
  assert.equal(paid.bStocks.batteryKwh, paid.aStocks.batteryKwh);
  assert.equal(crustHash(paid.a), crustHash(paid.b));
  const again = commitPoweredCut(paid.a, paid.b, paid.aStocks, paid.bStocks, CRADLE_CELL.ix, CRADLE_CELL.iy);
  assert.equal(again.accepted, false);
  assert.match(again.reason, /yard cannot hold|battery cannot pay/);
  assert.equal(again.a, paid.a);
  assert.equal(again.aStocks.batteryKwh, paid.aStocks.batteryKwh);
});

test("a cut under a roof is refused for both clients", () => {
  const crust = setFlag(createCrust(), CRADLE_CELL.ix, CRADLE_CELL.iy, "roof", 1);
  const stocks = { ...createStocks(), batteryKwh: CUT_KWH };
  const hash = crustHash(crust);
  const cut = commitPoweredCut(crust, crust, stocks, stocks, CRADLE_CELL.ix, CRADLE_CELL.iy);
  assert.equal(cut.accepted, false);
  assert.match(cut.reason, /vessel/);
  assert.equal(cut.aStocks.batteryKwh, CUT_KWH);
  assert.equal(cut.bStocks.batteryKwh, CUT_KWH);
  assert.equal(crustHash(cut.a), hash);
  assert.equal(cut.a, crust);
});
