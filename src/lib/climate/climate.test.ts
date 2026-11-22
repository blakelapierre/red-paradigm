import assert from "node:assert/strict";
import { test } from "node:test";
import { sha256, toHex } from "./hash.ts";
import {
  createWorld,
  dailyMu,
  inspect,
  releaseAerosol,
  siteIndex,
  stateHash,
  step,
  surveyPressure,
  tFrost,
} from "./model.ts";

test("sha256 matches the empty string and abc", () => {
  assert.equal(toHex(sha256(new Uint8Array())), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  assert.equal(
    toHex(sha256(new TextEncoder().encode("abc"))),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("survey hydrostatic column matches the four bands", () => {
  const rows = [
    { z: -7000, p: 1153 },
    { z: -4000, p: 877 },
    { z: 0, p: 610 },
    { z: 22000, p: 83 },
  ];
  for (const row of rows) {
    assert.ok(Math.abs(surveyPressure(row.z) - row.p) <= 2, `${row.z} → ${surveyPressure(row.z)}`);
  }
  assert.ok(surveyPressure(-7000) > 612);
  assert.ok(surveyPressure(22000) < 100);
});

test("a sol of heat is cold at the equator and frost-bound at the winter pole", () => {
  let world = createWorld();
  const equator = inspect(world, siteIndex("datum"));
  assert.ok(equator.tMean > 190 && equator.tMean < 240, `equator ${equator.tMean}`);
  assert.equal(equator.liquid, false);

  while (world.ls < 270 && world.sol < 80) world = step(world, { fileStorm: false });
  const pole = inspect(world, 0);
  assert.ok(pole.lat > 80);
  assert.ok(pole.tNight < tFrost(pole.pLive), `night ${pole.tNight} frost ${tFrost(pole.pLive)}`);
  assert.equal(pole.frost, true);
});

test("daily-mean cosine averages near a quarter of the solar constant", () => {
  let sum = 0;
  let n = 0;
  for (let lat = -87.5; lat <= 87.5; lat += 5) {
    const weight = Math.cos((lat * Math.PI) / 180);
    sum += dailyMu(lat, 0) * weight;
    n += weight;
  }
  const mean = sum / n;
  assert.ok(Math.abs(mean - 0.25) < 0.03, `mean μ ${mean}`);
});

test("particles halve in 40 sols and a missed storm record fails the hash", () => {
  const cradle = siteIndex("cradle");
  let canon = releaseAerosol(createWorld(), cradle);
  let witness = releaseAerosol(createWorld(), cradle);
  assert.equal(canon.tauAerMilli[cradle], 800);
  assert.equal(stateHash(canon), stateHash(witness));

  for (let i = 0; i < 11; i++) {
    canon = step(canon, { fileStorm: true });
    witness = step(witness, { fileStorm: false });
  }
  assert.equal(canon.sol, 11);
  assert.equal(canon.storm, null);
  assert.equal(stateHash(canon), stateHash(witness));

  canon = step(canon, { fileStorm: true });
  witness = step(witness, { fileStorm: false });
  assert.equal(canon.sol, 12);
  assert.ok(canon.storm);
  assert.equal(witness.storm, null);
  assert.notEqual(stateHash(canon), stateHash(witness));

  let quiet = releaseAerosol(createWorld(), cradle);
  for (let i = 0; i < 40; i++) quiet = step(quiet, { fileStorm: false });
  assert.ok(Math.abs(quiet.tauAerMilli[cradle] - 400) <= 8, `tau ${quiet.tauAerMilli[cradle]}`);

  for (let i = 0; i < 20; i++) {
    canon = step(canon, { fileStorm: true });
    witness = step(witness, { fileStorm: false });
  }
  const hot = inspect(canon, cradle);
  const missed = inspect(witness, cradle);
  assert.ok(hot.transmission < 0.08, `transmission ${hot.transmission}`);
  assert.ok(hot.kwh * 5 < missed.kwh, `storm ${hot.kwh} vs clear ${missed.kwh}`);
  assert.ok(hot.tauAer < missed.tauAer * 0.7);
  assert.notEqual(stateHash(canon), stateHash(witness));
});
