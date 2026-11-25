import assert from "node:assert/strict";
import { test } from "node:test";
import { STORM_DURATION, STORM_SOL, SOLS_PER_YEAR } from "../climate/constants.ts";
import { airKg, createWorld, seasonLabel, siteIndex, stateHash, step } from "../climate/model.ts";
import { createCrust, setFlag } from "../crust/crust.ts";
import { turnHash } from "../turn.ts";
import { KG_PER_KM, cableKm, commitCable } from "./cable.ts";
import { homeNeighbor, applyNeighbor } from "./claim.ts";
import { DEFAULT_AIMS, bankSols, workList, type Yard } from "./governor.ts";
import { RATION_G } from "./food.ts";
import { CABIN_O2_KG } from "./meter.ts";
import { MILL_FINES_KG } from "./mill.ts";
import { LOFT_KWH } from "./release.ts";
import { ROOF_FINES_KG, ROOF_KWH, commitRoof } from "./roof.ts";
import { ARRIVAL, FACTION_NAME, factionHolding, factionStartSol, packageStocks } from "./faction.ts";
import { datumIsCradleCell, datumSite } from "./outpost.ts";
import { atPeace, peaceAir, peaceLine } from "./peace.ts";
import { createStocks, stocksBytes, type Stocks } from "./power.ts";
import { seasonPayLine, sameRoofBill } from "./season.ts";
import { SEED_CH4_KG, SEED_O2_KG, commitSeed } from "./seed.ts";
import { blocksStorm, callOpen, listMayVeil, sessionOver, stormCallLine, stormPhase, takeCall } from "./session.ts";
import { createTable, publicFace, runSeat, seatSite, stormVerdict, tableHash, WORKS_FINES_KG } from "./table.ts";
import { learnTech } from "./tech.ts";
import { ROOF_UPKEEP_KWH } from "./upkeep.ts";
import { centerKm } from "./km.ts";

function yard(stocks: Stocks = createStocks()): Yard {
  return {
    canon: createWorld(),
    witness: createWorld(),
    canonCrust: createCrust(),
    witnessCrust: createCrust(),
    canonStocks: stocks,
    witnessStocks: { ...stocks },
  };
}

function richLoft(): Stocks {
  return { ...createStocks(), finesKg: MILL_FINES_KG, batteryKwh: LOFT_KWH, techClimate: 1 };
}

test("the storm is before, stripping, then after", () => {
  assert.equal(stormPhase(0), "before");
  assert.equal(stormPhase(STORM_SOL - 1), "before");
  assert.equal(stormPhase(STORM_SOL), "stripping");
  assert.equal(stormPhase(STORM_SOL + STORM_DURATION - 1), "stripping");
  assert.equal(stormPhase(STORM_SOL + STORM_DURATION), "after");
  assert.equal(sessionOver(STORM_SOL + STORM_DURATION), true);
  assert.equal(callOpen(STORM_SOL), false);
});

test("the sentence counts sols until the storm, not a stored year", () => {
  assert.match(stormCallLine(0), new RegExp(`filed in ${STORM_SOL} sols`));
  assert.match(stormCallLine(STORM_SOL - 1), /filed in 1 sol/);
  assert.match(stormCallLine(STORM_SOL), /call is closed/);
  assert.match(stormCallLine(STORM_SOL + STORM_DURATION), /has passed/);
  assert.equal(stormCallLine(0).includes(String(SOLS_PER_YEAR)), false);
});

test("a call is loft, bank, or the neighbor, and a second call is refused", () => {
  const loft = takeCall(null, "loft", 0, richLoft());
  assert.equal(loft.accepted, true);
  assert.equal(loft.call, "loft");
  const again = takeCall(loft.call, "bank", 0, richLoft());
  assert.equal(again.accepted, false);
  assert.equal(again.call, "loft");
  assert.match(again.reason, /already made/);
  const late = takeCall(null, "bank", STORM_SOL);
  assert.equal(late.accepted, false);
  assert.match(late.reason, /closed/);
  const bank = takeCall(null, "bank", 0);
  assert.equal(bank.call, "bank");
  const neighbor = takeCall(null, "neighbor", 3);
  assert.equal(neighbor.call, "neighbor");
});

test("loft is refused until climate is known, and the refusal spends nothing", () => {
  const stocks = richLoft();
  stocks.techClimate = 0;
  const refused = takeCall(null, "loft", 0, stocks);
  assert.equal(refused.accepted, false);
  assert.match(refused.reason, /climate is not known/);
  assert.equal(stocks.finesKg, MILL_FINES_KG);
  assert.equal(stocks.batteryKwh, LOFT_KWH);
});

test("the call itself does not enter the turn hash", () => {
  const row = yard();
  const before = turnHash(row.canon, row.canonCrust, row.canonStocks);
  takeCall(null, "bank", 0, row.canonStocks);
  assert.equal(turnHash(row.canon, row.canonCrust, row.canonStocks), before);
});

test("the list lofts only when the call is loft", () => {
  const site = seatSite(createWorld(), "cradle");
  const aims = DEFAULT_AIMS.map((aim) => ({ ...aim, on: aim.id === "veil" }));
  const open = workList(yard(richLoft()), aims, site, null);
  assert.equal(open.yard.canon.tauAerMilli[site.climateIndex], 0);
  assert.equal(open.yard.canonStocks.finesKg, MILL_FINES_KG);
  const banked = workList(yard(richLoft()), aims, site, "bank");
  assert.equal(banked.yard.canonStocks.batteryKwh, LOFT_KWH);
  const called = workList(yard(richLoft()), DEFAULT_AIMS.map((aim) => ({ ...aim, on: false })), site, "loft");
  assert.ok(called.yard.canon.tauAerMilli[site.climateIndex] > 0);
  assert.equal(called.yard.canonStocks.weather, 1);
  assert.equal(called.yard.witnessStocks.weather, 1);
  assert.equal(called.yard.canon.tauAerMilli[site.climateIndex], called.yard.witness.tauAerMilli[site.climateIndex]);
  assert.equal(listMayVeil(null), false);
  assert.equal(listMayVeil("loft"), true);
  assert.equal(listMayVeil(undefined), true);
});

test("a second loft on that cell is refused and spends nothing", () => {
  const site = seatSite(createWorld(), "cradle");
  const first = workList(yard(richLoft()), DEFAULT_AIMS, site, "loft");
  const tau = first.yard.canon.tauAerMilli[site.climateIndex];
  const again = workList(first.yard, DEFAULT_AIMS, site, "loft");
  assert.equal(again.yard.canon.tauAerMilli[site.climateIndex], tau);
  assert.equal(again.yard.canonStocks.finesKg, first.yard.canonStocks.finesKg);
  assert.equal(again.yard.canonStocks.batteryKwh, first.yard.canonStocks.batteryKwh);
});

test("bank does not loft and does not roof the neighbor", () => {
  const row = yard({ ...richLoft(), finesKg: ROOF_FINES_KG + MILL_FINES_KG });
  const site = seatSite(row.canon, "cradle");
  const neighbor = homeNeighbor(row.canon, "cradle");
  assert.ok(neighbor);
  const worked = workList(row, DEFAULT_AIMS.map((aim) => ({ ...aim, on: false })), site, "bank", neighbor);
  assert.equal(worked.yard.canonStocks.batteryKwh, row.canonStocks.batteryKwh);
  assert.equal(worked.yard.canon.tauAerMilli[site.climateIndex], 0);
  assert.equal(worked.yard.canonCrust.overrides.some((line) => line.roof === 1), false);
});

test("the neighbor call roofs one kilometer east and does not move the cell", () => {
  const row = yard({ ...createStocks(), finesKg: ROOF_FINES_KG, batteryKwh: ROOF_KWH });
  const site = seatSite(row.canon, "cradle");
  const neighbor = homeNeighbor(row.canon, "cradle");
  assert.ok(neighbor);
  assert.equal(neighbor.climateIndex, site.climateIndex);
  const hash = stateHash(row.canon);
  const air = airKg(row.canon.ls);
  const worked = workList(row, DEFAULT_AIMS.map((aim) => ({ ...aim, on: false })), site, "neighbor", neighbor);
  assert.equal(worked.yard.canonCrust.overrides.some((line) => line.ix === neighbor.ix && line.roof === 1), true);
  assert.equal(worked.yard.canonStocks.finesKg, 0n);
  assert.equal(worked.yard.canonStocks.batteryKwh, 0);
  assert.equal(stateHash(worked.yard.canon), hash);
  assert.equal(airKg(worked.yard.canon.ls), air);
  assert.equal(worked.yard.canon.tauAerMilli[site.climateIndex], 0);
});

test("a neighbor the yard cannot pay is refused, and nothing is spent", () => {
  const row = yard(createStocks());
  const neighbor = homeNeighbor(row.canon, "cradle");
  const applied = applyNeighbor(row, "neighbor", neighbor);
  assert.equal(applied.accepted, false);
  assert.equal(applied.yard.canonStocks.batteryKwh, 0);
  assert.equal(applied.yard.canonStocks.finesKg, 0n);
  const notTheCall = applyNeighbor(row, "bank", neighbor);
  assert.equal(notTheCall.accepted, false);
});

test("run stops on the sol before the storm until the call is in", () => {
  const row = yard();
  const site = seatSite(row.canon, "cradle");
  assert.equal(blocksStorm(STORM_SOL - 1, null), true);
  assert.equal(blocksStorm(STORM_SOL - 1, "bank"), false);
  assert.equal(blocksStorm(0, null), false);
  const held = bankSols(row, 40, DEFAULT_AIMS, site, false, null);
  assert.equal(held.yard.canon.sol, STORM_SOL - 1);
  assert.equal(held.yard.witness.sol, STORM_SOL - 1);
  assert.match(held.landed.at(-1) ?? "", /call is open/);
  const entered = bankSols(held.yard, 1, DEFAULT_AIMS, site, false, "bank");
  assert.equal(entered.yard.canon.sol, STORM_SOL);
  assert.equal(entered.yard.witness.sol, STORM_SOL);
});

test("one loft on the shared climate, and the other yard can see it but not the fines", () => {
  const table = createTable();
  const site = seatSite(table.climate, "cradle");
  const rich = richLoft();
  table.cradle.stocks = rich;
  table.cradle.witnessStocks = { ...rich };
  table.cradle.call = "loft";
  const ran = runSeat(table, "cradle", site);
  assert.ok(ran.table.climate.tauAerMilli[site.climateIndex] > 0);
  assert.equal(ran.table.cradle.stocks.weather, 1);
  assert.equal(ran.table.works.stocks.weather, 0);
  assert.equal(ran.table.works.stocks.finesKg, table.works.stocks.finesKg);
  const face = publicFace(ran.table);
  assert.equal(face.weather, "cradle");
  assert.equal(face.lofted, true);
  assert.equal("finesKg" in face, false);
  assert.equal("batteryKwh" in face, false);
  const next = ran.table;
  next.works.call = "loft";
  next.works.aims = DEFAULT_AIMS.map((aim) => ({ ...aim, on: false }));
  next.works.stocks = { ...next.works.stocks, techClimate: 1, batteryKwh: LOFT_KWH, finesKg: MILL_FINES_KG };
  next.works.witnessStocks = { ...next.works.stocks };
  const second = runSeat(next, "works");
  assert.equal(second.table.works.stocks.weather, 0);
  assert.equal(second.table.works.stocks.finesKg, ran.table.works.stocks.finesKg);
});

test("the table hash hears the call, and not a second copy of the fines", () => {
  const table = createTable();
  const other = createTable();
  other.cradle.call = "bank";
  assert.notEqual(tableHash(table), tableHash(other));
  assert.equal(publicFace(table).seedAway, false);
});

test("the session score is one held, both held, or both dark, and only after the storm", () => {
  const table = createTable();
  assert.equal(stormVerdict(table), null);
  table.climate = {
    ...table.climate,
    sol: STORM_SOL + STORM_DURATION,
    storm: { startSol: STORM_SOL, duration: STORM_DURATION, peakTauMilli: 5000 },
  };
  table.cradle.stocks = { ...table.cradle.stocks, stormSeen: 1, stormHeld: 1 };
  table.works.stocks = { ...table.works.stocks, stormSeen: 1, stormHeld: 0 };
  assert.match(stormVerdict(table) ?? "", /One yard held/);
  table.works.stocks = { ...table.works.stocks, stormHeld: 1 };
  assert.equal(stormVerdict(table), "Both yards held.");
  table.cradle.stocks = { ...table.cradle.stocks, stormHeld: 0 };
  table.works.stocks = { ...table.works.stocks, stormHeld: 0 };
  assert.equal(stormVerdict(table), "Both yards went dark.");
});

test("peace is both yards held and the cell not pushed", () => {
  const table = createTable();
  table.climate = {
    ...table.climate,
    sol: STORM_SOL + STORM_DURATION,
    storm: { startSol: STORM_SOL, duration: STORM_DURATION, peakTauMilli: 5000 },
  };
  table.cradle.stocks = { ...table.cradle.stocks, stormSeen: 1, stormHeld: 1 };
  table.works.stocks = { ...table.works.stocks, stormSeen: 1, stormHeld: 1 };
  assert.equal(atPeace(table), true);
  assert.match(peaceLine(table) ?? "", /not a sky/);
  assert.equal(peaceAir(table), airKg(table.climate.ls));
  const tau = new Uint16Array(table.climate.tauAerMilli);
  tau[siteIndex("cradle")] = 1;
  table.climate = { ...table.climate, tauAerMilli: tau };
  assert.equal(atPeace(table), false);
  assert.equal(peaceLine(table), null);
  table.climate = { ...table.climate, tauAerMilli: new Uint16Array(tau.length) };
  table.works.stocks = { ...table.works.stocks, stormHeld: 0 };
  assert.equal(atPeace(table), false);
});

test("the seed is ten batches, and a short yard spends nothing", () => {
  const at = centerKm(siteIndex("cradle"));
  const crust = setFlag(createCrust(), at.ix, at.iy, "roof", 1);
  const stocks = {
    ...createStocks(),
    cabinO2Kg: CABIN_O2_KG,
    biomassG: RATION_G,
    techClimate: 1,
    techSeed: 1,
    ch4Kg: SEED_CH4_KG - 1n,
    o2Kg: SEED_O2_KG,
  };
  const world = createWorld();
  const refused = commitSeed(crust, crust, stocks, { ...stocks }, world);
  assert.equal(refused.accepted, false);
  assert.equal(refused.a.ch4Kg, stocks.ch4Kg);
  assert.equal(refused.a.seed, 0);
  assert.equal(refused.air, airKg(world.ls));
});

test("a holding yard sends the seed, both clients, and the air mass stays", () => {
  const at = centerKm(siteIndex("cradle"));
  const crust = setFlag(createCrust(), at.ix, at.iy, "roof", 1);
  const stocks = {
    ...createStocks(),
    cabinO2Kg: CABIN_O2_KG,
    biomassG: RATION_G,
    techClimate: 1,
    techSeed: 1,
    ch4Kg: SEED_CH4_KG,
    o2Kg: SEED_O2_KG,
  };
  const world = createWorld();
  const hash = stateHash(world);
  const sent = commitSeed(crust, crust, stocks, { ...stocks }, world);
  assert.equal(sent.accepted, true);
  assert.equal(sent.a.seed, 1);
  assert.equal(sent.b.seed, 1);
  assert.equal(sent.a.ch4Kg, 0n);
  assert.equal(sent.a.o2Kg, 0n);
  assert.equal(sent.air, airKg(world.ls));
  assert.equal(stateHash(world), hash);
  const again = commitSeed(crust, crust, sent.a, sent.b, world);
  assert.equal(again.accepted, false);
  const bytes = stocksBytes(sent.a);
  assert.equal(bytes.length, 192);
  assert.equal(new DataView(bytes.buffer).getUint32(172), 1);
  assert.notEqual(Buffer.from(stocksBytes(stocks)).toString("hex"), Buffer.from(bytes).toString("hex"));
});

test("the seed is refused when the yard is not holding", () => {
  const stocks = { ...createStocks(), techSeed: 1, ch4Kg: SEED_CH4_KG, o2Kg: SEED_O2_KG };
  const sent = commitSeed(createCrust(), createCrust(), stocks, { ...stocks }, createWorld());
  assert.equal(sent.accepted, false);
  assert.match(sent.reason, /not holding/);
  assert.equal(sent.a.ch4Kg, SEED_CH4_KG);
});

test("the other yard's seed closes the paradigm", () => {
  const at = centerKm(siteIndex("cradle"));
  const crust = setFlag(createCrust(), at.ix, at.iy, "roof", 1);
  const stocks = {
    ...createStocks(),
    cabinO2Kg: CABIN_O2_KG,
    biomassG: RATION_G,
    techSeed: 1,
    ch4Kg: SEED_CH4_KG,
    o2Kg: SEED_O2_KG,
  };
  const sent = commitSeed(crust, crust, stocks, { ...stocks }, createWorld(), true);
  assert.equal(sent.accepted, false);
  assert.match(sent.reason, /already left/);
  assert.equal(sent.a.seed, 0);
  const table = createTable();
  table.cradle.stocks = { ...table.cradle.stocks, seed: 1 };
  assert.equal(publicFace(table).seedAway, true);
  assert.equal("ch4Kg" in publicFace(table), false);
});

test("three factions are packages on sol 0, and none of them is already holding", () => {
  assert.ok(ARRIVAL.industrial < ARRIVAL.scientific && ARRIVAL.scientific < ARRIVAL.final);
  assert.equal(packageStocks("industrial").reactor, 1);
  assert.equal(packageStocks("industrial").finesKg, WORKS_FINES_KG);
  assert.equal(packageStocks("scientific").collector, 1);
  assert.equal(packageStocks("scientific").reactor, 0);
  assert.equal(packageStocks("final").finesKg, 0n);
  assert.equal(factionHolding("industrial"), false);
  assert.equal(factionHolding("scientific"), false);
  assert.equal(factionHolding("final"), false);
  assert.equal(factionStartSol("industrial"), 0);
  assert.equal(factionStartSol("final"), 0);
  assert.equal(FACTION_NAME.scientific, "Scientific");
  const world = createWorld();
  assert.equal(world.sol, factionStartSol("scientific"));
});

test("industrial fines are the works head start, not a second number", () => {
  assert.equal(packageStocks("industrial").finesKg, WORKS_FINES_KG);
});

test("learning spends nothing, and both clients learn or neither does", () => {
  const a = createStocks();
  const b = createStocks();
  const battery = a.batteryKwh;
  const climate = learnTech(a, b, "climate");
  assert.equal(climate.accepted, true);
  assert.equal(climate.a.techClimate, 1);
  assert.equal(climate.b.techClimate, 1);
  assert.equal(climate.a.batteryKwh, battery);
  assert.equal(climate.a.finesKg, 0n);
  const blocked = learnTech(createStocks(), { ...createStocks(), techIsru: 0 }, "climate");
  assert.equal(blocked.accepted, false);
  assert.equal(blocked.a.techClimate, 0);
  const seed = learnTech(a, b, "seed");
  assert.equal(seed.accepted, false);
  const known = learnTech(climate.a, climate.b, "seed");
  assert.equal(known.accepted, true);
  assert.equal(known.a.techSeed, 1);
  const twice = learnTech(known.a, known.b, "seed");
  assert.equal(twice.accepted, false);
});

test("ISRU starts known, and the bits are in the stocks hash", () => {
  const stocks = createStocks();
  assert.equal(stocks.techIsru, 1);
  assert.equal(stocks.techClimate, 0);
  assert.equal(stocks.techSeed, 0);
  const view = new DataView(stocksBytes(stocks).buffer);
  assert.equal(view.getUint32(180), 1);
  assert.equal(view.getUint32(184), 0);
  const learned = stocksBytes({ ...stocks, techClimate: 1 });
  assert.notEqual(Buffer.from(learned).toString("hex"), Buffer.from(stocksBytes(stocks)).toString("hex"));
});

test("the season changes what the array pays and not the roof bill", () => {
  let world = createWorld();
  const firstName = seasonLabel(world.ls);
  const firstPay = seasonPayLine(world, siteIndex("cradle"));
  assert.match(firstPay, new RegExp(firstName));
  assert.match(firstPay, /roof bill stays/);
  let guard = 0;
  while (seasonLabel(world.ls) === firstName && guard < 400) {
    world = step(world, { fileStorm: true });
    guard += 1;
  }
  assert.notEqual(seasonLabel(world.ls), firstName);
  assert.notEqual(seasonPayLine(world, siteIndex("cradle")), firstPay);
  assert.equal(sameRoofBill(), ROOF_UPKEEP_KWH);
});

test("the datum is another climate cell on the same books", () => {
  const world = createWorld();
  const site = datumSite(world);
  assert.equal(datumIsCradleCell(), false);
  assert.notEqual(site.climateIndex, siteIndex("cradle"));
  assert.notEqual(site.climateIndex, siteIndex("works"));
  const stocks = { ...createStocks(), finesKg: ROOF_FINES_KG, batteryKwh: ROOF_KWH };
  const hash = stateHash(world);
  const air = airKg(world.ls);
  const roofed = commitRoof(createCrust(), createCrust(), stocks, { ...stocks }, site.ix, site.iy);
  assert.equal(roofed.accepted, true);
  assert.equal(roofed.aStocks.finesKg, 0n);
  assert.equal(roofed.bStocks.finesKg, 0n);
  assert.equal(stateHash(world), hash);
  assert.equal(airKg(world.ls), air);
  const km = cableKm(site.ix, site.iy);
  const cost = BigInt(km) * KG_PER_KM;
  const lined = commitCable({ ...createStocks(), finesKg: cost }, { ...createStocks(), finesKg: cost }, site.ix, site.iy);
  assert.equal(lined.accepted, true);
  assert.equal(lined.a.finesKg, 0n);
  assert.match(lined.reason, /did not move/);
});
