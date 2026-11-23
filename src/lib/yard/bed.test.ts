import assert from "node:assert/strict";
import { test } from "node:test";
import { airKg, createWorld } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { turnHash } from "../turn.ts";
import { BED_CAP, BED_FINES_KG, RATION_BED_FINES_KG, commitBeds, commitPlant } from "./bed.ts";
import { grow } from "./biomass.ts";
import { RATION_G } from "./food.ts";
import { LAMP_G } from "./lamp.ts";
import { MILL_FINES_KG } from "./mill.ts";
import { createStocks, stocksBytes } from "./power.ts";

test("the yard starts with one bed, and the count is in the stocks hash", () => {
  const stocks = createStocks();
  assert.equal(stocks.beds, 1);
  const bytes = stocksBytes(stocks);
  assert.equal(bytes.length, 160);
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

test("a bed is planted for both clients, or for neither", () => {
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const bare = createCrust();
  const stocks = { ...createStocks(), finesKg: BED_FINES_KG };
  const open = commitPlant(bare, bare, stocks, stocks);
  assert.equal(open.accepted, false);
  assert.equal(open.a.beds, 1);
  assert.equal(open.a.finesKg, BED_FINES_KG);
  const poor = commitPlant(roof, roof, createStocks(), createStocks());
  assert.equal(poor.accepted, false);
  assert.equal(poor.reason, `need ${BED_FINES_KG} kg of fines`);
  const world = createWorld();
  const beforeAir = airKg(world.ls);
  const up = commitPlant(roof, roof, stocks, stocks);
  assert.equal(up.accepted, true);
  assert.equal(up.a.beds, 2);
  assert.equal(up.b.beds, 2);
  assert.equal(up.a.finesKg, 0n);
  assert.equal(up.b.finesKg, 0n);
  assert.equal(airKg(world.ls), beforeAir);
  const split = commitPlant(roof, roof, stocks, createStocks());
  assert.equal(split.accepted, false);
  assert.equal(split.a.beds, 1);
  assert.equal(split.b.finesKg, 0n);
  const hashA = turnHash(world, roof, stocks);
  const hashB = turnHash(world, roof, createStocks());
  assert.equal(turnHash(world, roof, split.a), hashA);
  assert.equal(turnHash(world, roof, split.b), hashB);
});

test("the twenty-sixth bed is refused", () => {
  assert.equal(BED_CAP, 25);
  assert.equal(BED_CAP * LAMP_G, RATION_G);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const full = { ...createStocks(), beds: BED_CAP, finesKg: BED_FINES_KG };
  const refused = commitPlant(roof, roof, full, full);
  assert.equal(refused.accepted, false);
  assert.equal(refused.a.beds, BED_CAP);
  assert.equal(refused.a.finesKg, BED_FINES_KG);
  const uneven = commitPlant(roof, roof, { ...createStocks(), beds: BED_CAP - 1, finesKg: BED_FINES_KG }, full);
  assert.equal(uneven.accepted, false);
  assert.equal(uneven.a.beds, BED_CAP - 1);
  assert.equal(uneven.b.beds, BED_CAP);
});

test("one mill batch pays the added beds and leaves a bed the cap will not spend", () => {
  assert.equal(RATION_BED_FINES_KG, 4_800_000n);
  assert.equal(MILL_FINES_KG - RATION_BED_FINES_KG, BED_FINES_KG);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  let stocks = { ...createStocks(), finesKg: MILL_FINES_KG };
  for (let i = 0; i < BED_CAP; i++) {
    const planted = commitPlant(roof, roof, stocks, stocks);
    if (!planted.accepted) break;
    stocks = planted.a;
  }
  assert.equal(stocks.beds, BED_CAP);
  assert.equal(stocks.finesKg, BED_FINES_KG);
  const refused = commitPlant(roof, roof, stocks, stocks);
  assert.equal(refused.accepted, false);
  assert.equal(refused.a.finesKg, BED_FINES_KG);
});

test("one pass plants every bed the fines will pay", () => {
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const stocks = { ...createStocks(), finesKg: MILL_FINES_KG };
  const planted = commitBeds(roof, roof, stocks, stocks);
  assert.equal(planted.accepted, true);
  assert.equal(planted.planted, BED_CAP - 1);
  assert.equal(planted.a.beds, BED_CAP);
  assert.equal(planted.b.beds, BED_CAP);
  assert.equal(planted.a.finesKg, BED_FINES_KG);
  const again = commitBeds(roof, roof, planted.a, planted.b);
  assert.equal(again.accepted, false);
  assert.equal(again.a.finesKg, BED_FINES_KG);
});


