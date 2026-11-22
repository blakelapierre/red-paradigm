import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, step } from "../climate/model.ts";
import { createCrust } from "../crust/crust.ts";
import { KILOPOWER_KWH, commitReactor } from "./kilopower.ts";
import { arrayKwh, closeSol, createStocks } from "./power.ts";

test("a kilopower adds 240 kWh on a clear sol and on a storm sol", () => {
  const off = commitReactor({ ...createStocks(), reactor: 1 }, createStocks());
  assert.equal(off.accepted, false);
  const on = commitReactor(createStocks(), createStocks());
  assert.equal(on.accepted, true);
  assert.equal(on.a.reactor, 1);
  assert.equal(on.b.reactor, 1);

  const clear = createWorld();
  const banked = closeSol(clear, on.a, createCrust());
  assert.equal(banked.stocks.batteryKwh, arrayKwh(clear) + KILOPOWER_KWH);

  let storm = createWorld();
  for (let i = 0; i < 32; i++) storm = step(storm, { fileStorm: true });
  const dim = arrayKwh(storm);
  assert.ok(dim < 50_000);
  const during = closeSol(storm, { ...createStocks(), reactor: 1 }, createCrust());
  assert.equal(during.stocks.batteryKwh, dim + KILOPOWER_KWH);
});
