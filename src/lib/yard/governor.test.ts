import assert from "node:assert/strict";
import test from "node:test";
import { cellLat, cellLon, latIndexOf, lonIndexOf } from "../climate/constants.ts";
import { createWorld, siteIndex, surveyPressure } from "../climate/model.ts";
import { cellOf, createCrust, setFlag } from "../crust/crust.ts";
import { turnHash } from "../turn.ts";
import { BED_FINES_KG } from "./bed.ts";
import { CRADLE_CELL } from "./cable.ts";
import { DEFAULT_AIMS, bankSols, moveAim, toggleAim, workList, type WorkSite, type Yard } from "./governor.ts";
import { CUT_KWH, createStocks } from "./power.ts";

function cradleSite(world = createWorld()): WorkSite {
  const index = siteIndex("cradle");
  const lat = cellLat(latIndexOf(index));
  const lon = cellLon(lonIndexOf(index));
  const at = cellOf(lat, lon);
  return {
    ix: at.ix,
    iy: at.iy,
    pressurePa: Math.round(surveyPressure(world.zM[index])),
    climateIndex: index,
    latDeg: lat,
  };
}

function freshYard(): Yard {
  return {
    canon: createWorld(),
    witness: createWorld(),
    canonCrust: createCrust(),
    witnessCrust: createCrust(),
    canonStocks: createStocks(),
    witnessStocks: createStocks(),
  };
}

function agree(yard: Yard): void {
  assert.equal(turnHash(yard.canon, yard.canonCrust, yard.canonStocks), turnHash(yard.witness, yard.witnessCrust, yard.witnessStocks));
}

test("an empty yard only starts the reactor", () => {
  const worked = workList(freshYard(), DEFAULT_AIMS, cradleSite());
  assert.deepEqual(worked.landed, ["10 kW is online. 240 kWh a sol. dust does not touch it"]);
  assert.equal(worked.yard.canonStocks.reactor, 1);
  assert.equal(worked.yard.witnessStocks.reactor, 1);
  assert.equal(worked.yard.canonCrust.spoilKg, 0n);
  assert.equal(worked.yard.canon.tauAerMilli[siteIndex("cradle")], 0);
  agree(worked.yard);
});

test("a paid battery cuts, and a disabled cut does not", () => {
  const site = cradleSite();
  assert.equal(site.ix, CRADLE_CELL.ix);
  assert.equal(site.iy, CRADLE_CELL.iy);
  const rich = freshYard();
  rich.canonStocks = { ...rich.canonStocks, batteryKwh: CUT_KWH };
  rich.witnessStocks = { ...rich.witnessStocks, batteryKwh: CUT_KWH };
  const cut = workList(rich, DEFAULT_AIMS, site);
  assert.ok(cut.yard.canonCrust.spoilKg > 0n);
  assert.equal(cut.yard.canonCrust.spoilKg, cut.yard.witnessCrust.spoilKg);
  assert.equal(cut.yard.canonStocks.batteryKwh, 0);
  agree(cut.yard);

  const held = workList(rich, toggleAim(DEFAULT_AIMS, "cut"), site);
  assert.equal(held.yard.canonCrust.spoilKg, 0n);
  assert.equal(held.yard.canonStocks.reactor, 1);
  agree(held.yard);
});

test("one client short of power cuts for neither", () => {
  const yard = freshYard();
  yard.canonStocks = { ...yard.canonStocks, batteryKwh: CUT_KWH, reactor: 1 };
  yard.witnessStocks = { ...yard.witnessStocks, batteryKwh: 0, reactor: 1 };
  const aims = DEFAULT_AIMS.map((aim) => ({ ...aim, on: aim.id === "cut" }));
  const beforeA = turnHash(yard.canon, yard.canonCrust, yard.canonStocks);
  const beforeB = turnHash(yard.witness, yard.witnessCrust, yard.witnessStocks);
  const worked = workList(yard, aims, cradleSite());
  assert.equal(worked.landed.length, 0);
  assert.equal(worked.yard.canonCrust.spoilKg, 0n);
  assert.equal(worked.yard.canonStocks.batteryKwh, CUT_KWH);
  assert.equal(worked.yard.witnessStocks.batteryKwh, 0);
  assert.equal(turnHash(worked.yard.canon, worked.yard.canonCrust, worked.yard.canonStocks), beforeA);
  assert.equal(turnHash(worked.yard.witness, worked.yard.witnessCrust, worked.yard.witnessStocks), beforeB);
});

test("two clear sols then the list cuts, and the veil stays off", () => {
  const site = cradleSite();
  let yard = workList(freshYard(), DEFAULT_AIMS, site).yard;
  let control = freshYard();
  for (let i = 0; i < 2; i++) {
    const stepped = bankSols(yard, 1, DEFAULT_AIMS, site, true);
    yard = stepped.yard;
    const closed = bankSols(control, 1, DEFAULT_AIMS, site, false);
    control = closed.yard;
  }
  assert.ok(yard.canonCrust.spoilKg > 0n);
  assert.equal(yard.canon.tauAerMilli[site.climateIndex], control.canon.tauAerMilli[site.climateIndex]);
  agree(yard);
});

test("a sol that does not follow the list only banks power", () => {
  const stepped = bankSols(freshYard(), 1, DEFAULT_AIMS, cradleSite(), false);
  assert.equal(stepped.landed.length, 0);
  assert.equal(stepped.yard.canonStocks.reactor, 0);
  assert.ok(stepped.yard.canonStocks.batteryKwh > 0);
  agree(stepped.yard);
});

test("moving an aim does not drop one", () => {
  const moved = moveAim(DEFAULT_AIMS, 0, 1);
  assert.equal(moved[0].id, "cut");
  assert.equal(moved[1].id, "power");
  assert.equal(moved.length, DEFAULT_AIMS.length);
  assert.deepEqual(moveAim(DEFAULT_AIMS, 0, -1).map((aim) => aim.id), DEFAULT_AIMS.map((aim) => aim.id));
});

test("ration plants one bed and does not cut or loft", () => {
  const site = cradleSite();
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const yard = freshYard();
  yard.canonCrust = roof;
  yard.witnessCrust = roof;
  yard.canonStocks = { ...yard.canonStocks, finesKg: BED_FINES_KG, reactor: 1 };
  yard.witnessStocks = { ...yard.witnessStocks, finesKg: BED_FINES_KG, reactor: 1 };
  const aims = DEFAULT_AIMS.map((aim) => ({ ...aim, on: aim.id === "ration" }));
  const worked = workList(yard, aims, site);
  assert.deepEqual(worked.landed, ["one bed planted. the climate cell did not move"]);
  assert.equal(worked.yard.canonStocks.beds, 2);
  assert.equal(worked.yard.witnessStocks.beds, 2);
  assert.equal(worked.yard.canonCrust.spoilKg, 0n);
  assert.equal(worked.yard.canon.tauAerMilli[site.climateIndex], 0);
  agree(worked.yard);

  const idle = workList(yard, toggleAim(aims, "ration"), site);
  assert.equal(idle.yard.canonStocks.beds, 1);
  assert.equal(idle.landed.length, 0);

  const short = freshYard();
  short.canonCrust = roof;
  short.witnessCrust = roof;
  short.canonStocks = { ...short.canonStocks, finesKg: BED_FINES_KG, reactor: 1 };
  const before = turnHash(short.witness, short.witnessCrust, short.witnessStocks);
  const missed = workList(short, aims, site);
  assert.equal(missed.landed.length, 0);
  assert.equal(missed.yard.canonStocks.beds, 1);
  assert.equal(missed.yard.canonStocks.finesKg, BED_FINES_KG);
  assert.equal(turnHash(missed.yard.witness, missed.yard.witnessCrust, missed.yard.witnessStocks), before);
});

test("the run stops on a quiet sol, and on the mark", () => {
  const site = cradleSite();
  const off = DEFAULT_AIMS.map((aim) => ({ ...aim, on: false }));
  const quiet = bankSols(freshYard(), 4, off, site, true);
  assert.equal(quiet.quiet, true);
  assert.equal(quiet.holds, false);
  assert.equal(quiet.yard.canon.sol, 1);
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const yard = freshYard();
  yard.canonCrust = roof;
  yard.witnessCrust = roof;
  const ready = {
    ...yard.canonStocks,
    lamp: 1,
    beds: 25,
    cabinO2Kg: 29n,
    biomassG: 500,
    o2Kg: 1n,
    waterKg: 28n,
    heldSols: 9,
  };
  yard.canonStocks = ready;
  yard.witnessStocks = ready;
  const marked = bankSols(yard, 5, DEFAULT_AIMS, site, true);
  assert.equal(marked.holds, true);
  assert.equal(marked.yard.canon.sol, 1);
  assert.equal(marked.yard.canonStocks.heldSols, 10);
  assert.equal(marked.yard.witnessStocks.heldSols, 10);
});

test("a finished floor is not cut or milled", () => {
  const roof = setFlag(createCrust(), 1, 2, "roof", 1);
  const yard = freshYard();
  yard.canonCrust = { ...roof, spoilKg: 100_000_000n };
  yard.witnessCrust = { ...roof, spoilKg: 100_000_000n };
  const stocks = { ...yard.canonStocks, lamp: 1, beds: 25, batteryKwh: CUT_KWH, finesKg: 5_000_000n };
  yard.canonStocks = stocks;
  yard.witnessStocks = stocks;
  const aims = DEFAULT_AIMS.map((aim) => ({ ...aim, on: aim.id === "cut" || aim.id === "mill" }));
  const worked = workList(yard, aims, cradleSite());
  assert.equal(worked.yard.canonCrust.spoilKg, 100_000_000n);
  assert.equal(worked.yard.canonStocks.batteryKwh, CUT_KWH);
  assert.equal(worked.landed.length, 0);
});

test("a full tank is not mined", () => {
  const yard = freshYard();
  const full = { ...yard.canonStocks, waterKg: 100n, batteryKwh: 1_000 };
  yard.canonStocks = full;
  yard.witnessStocks = full;
  const aims = DEFAULT_AIMS.map((aim) => ({ ...aim, on: aim.id === "water" }));
  const worked = workList(yard, aims, cradleSite());
  assert.equal(worked.landed.length, 0);
  assert.equal(worked.yard.canonStocks.iceKg, full.iceKg);
  const dry = freshYard();
  dry.canonStocks = { ...dry.canonStocks, batteryKwh: 1_000 };
  dry.witnessStocks = { ...dry.witnessStocks, batteryKwh: 1_000 };
  const mined = workList(dry, aims, cradleSite());
  assert.equal(mined.yard.canonStocks.iceKg, full.iceKg - 1000n);
  assert.equal(mined.yard.witnessStocks.iceKg, mined.yard.canonStocks.iceKg);
});

test("a stocked cabin is not split, and a hot yard is not split", () => {
  const aims = DEFAULT_AIMS.map((aim) => ({ ...aim, on: aim.id === "fuel" }));
  const fed = freshYard();
  const enough = { ...fed.canonStocks, o2Kg: 40n, cabinO2Kg: 28n, waterKg: 100n, batteryKwh: 1_000 };
  fed.canonStocks = enough;
  fed.witnessStocks = enough;
  const held = workList(fed, aims, cradleSite());
  assert.equal(held.yard.canonStocks.o2Kg, 40n);
  const short = freshYard();
  const need = { ...short.canonStocks, o2Kg: 0n, cabinO2Kg: 28n, waterKg: 100n, batteryKwh: 1_000, toxinMilli: 0 };
  short.canonStocks = need;
  short.witnessStocks = need;
  const split = workList(short, aims, cradleSite());
  assert.equal(split.yard.canonStocks.o2Kg, 32n);
  const hot = freshYard();
  const heat = { ...need, heatKwh: 80 };
  hot.canonStocks = heat;
  hot.witnessStocks = heat;
  const refused = workList(hot, aims, cradleSite());
  assert.equal(refused.yard.canonStocks.o2Kg, 0n);
  assert.equal(refused.yard.canonStocks.heatKwh, 80);
});





