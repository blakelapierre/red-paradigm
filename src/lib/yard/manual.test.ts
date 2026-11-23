import assert from "node:assert/strict";
import test from "node:test";
import { createWorld } from "../climate/model.ts";
import { CUT_KWH, arrayKwh } from "./power.ts";
import { MANUAL, entryByTitle } from "./manual.ts";

const ORDERS = [
  "Release particles here",
  "Dig 2 m",
  "Mill a batch",
  "Return 1 cm of tailings",
  "Raise a lamp",
  "Plant a bed",
  "Wire this kilometer",
  "Meter 28 kg into the cabin",
  "Paint this kilometer",
  "Mine 1 t ice",
  "Bottle 44 kg CO2",
  "Vent 1 kg cabin CO2",
  "Electrolyze 36 kg",
  "Sabatier batch",
  "Burn 16 kg methane",
  "Wash tanks",
  "Roof this kilometer",
  "Lay a road",
  "Raise a berm",
  "Raise a collector",
  "Repair the array",
  "Start the kilopower",
  "Heat the vessel",
  "Draw 1 kg from the column",
  "Raise a radiator",
];

test("every order on the board has a manual entry", () => {
  const titles = new Set(MANUAL.map((entry) => entry.title));
  const ids = new Set(MANUAL.map((entry) => entry.id));
  assert.equal(titles.size, MANUAL.length);
  assert.equal(ids.size, MANUAL.length);
  for (const title of ORDERS) {
    const entry = entryByTitle(title);
    assert.ok(entry, title);
    assert.ok(entry.does.length > 20, title);
    assert.ok(entry.costs.length > 0, title);
    assert.ok(entry.refuses.length > 0, title);
    assert.ok(entry.doesNot.length > 0, title);
  }
});

test("the manual quotes the constants, not a second set of numbers", () => {
  const dig = entryByTitle("Dig 2 m");
  assert.ok(dig?.costs.includes(CUT_KWH.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")));
  const sol = entryByTitle("One sol");
  const clear = arrayKwh(createWorld()).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  assert.ok(sol?.costs.includes(clear));
  const meter = entryByTitle("Meter 28 kg into the cabin");
  assert.match(meter?.doesNot ?? "", /not breathable air/);
  const burn = entryByTitle("Burn 16 kg methane");
  assert.match(burn?.doesNot ?? "", /does not add that CO₂ to the air/);
  const hash = entryByTitle("Turn hash");
  assert.match(hash?.doesNot ?? "", /does not split/);
  const yards = entryByTitle("Two yards");
  assert.match(yards?.does ?? "", /One window is one yard/);
  assert.match(yards?.doesNot ?? "", /not two seats/);
  assert.equal(MANUAL.some((entry) => /mars/i.test(`${entry.title} ${entry.does}`)), false);
});
