import {
  AEROSOL_CAP_K,
  AEROSOL_HALFLIFE_SOLS,
  AEROSOL_K_PER_TAU,
  ALBEDO_GROUND,
  ALBEDO_ICE,
  AU,
  CELL_COUNT,
  CO2_WARMING_CAP_K,
  ECC,
  F_MIX,
  FULL_AIR_KG,
  G_SURFACE,
  H_SURVEY_M,
  LAT_ROWS,
  LON_COLS,
  OB_DEG,
  P_DATUM_PA,
  PANEL_EFF,
  PANEL_M2,
  PERI_LS,
  R_CO2,
  RELEASE_TAU_MILLI,
  S_1AU,
  SIGMA,
  SOL_SECONDS,
  STORM_DURATION,
  STORM_PEAK_TAU_MILLI,
  STORM_SOL,
  STORM_STRIP_HALFLIFE_SOLS,
  TRIPLE_P_PA,
  TRIPLE_T_K,
  cellIndex,
  cellLat,
  cellLon,
  latIndexOf,
  lonIndexOf,
  lsAt,
} from "./constants.ts";
import { sha256, toHex } from "./hash.ts";

export type StormRecord = {
  startSol: number;
  duration: number;
  peakTauMilli: number;
};

export type World = {
  seed: number;
  sol: number;
  ls: number;
  storm: StormRecord | null;
  zM: Int16Array;
  albedoMilli: Uint16Array;
  tauAerMilli: Uint16Array;
  tauDustMilli: Uint16Array;
  tMeanDK: Int16Array;
  tAmpDK: Int16Array;
};

export const SITES = [
  { id: "cradle", name: "The Low Cradle", survey: "Deep basin", lat: -42, lon: 70, z: -7000 },
  { id: "works", name: "The Works", survey: "Northern plains", lat: 45, lon: 184, z: -4000 },
  { id: "datum", name: "The Datum", survey: "Prime meridian", lat: 0, lon: 0, z: 0 },
  { id: "rampart", name: "The Rampart", survey: "High volcanics", lat: 18.6, lon: 226.2, z: 22000 },
] as const;

export type SiteId = (typeof SITES)[number]["id"];

const DECAY = 0.5 ** (1 / AEROSOL_HALFLIFE_SOLS);
const STRIP = 0.5 ** (1 / STORM_STRIP_HALFLIFE_SOLS);

export function siteIndex(id: SiteId): number {
  const site = SITES.find((s) => s.id === id);
  if (!site) throw new Error(id);
  return cellIndex(site.lat, site.lon);
}

export function pressurePa(p0: number, hM: number, zM: number): number {
  return p0 * Math.exp(-zM / hM);
}

export function surveyPressure(zM: number): number {
  return pressurePa(P_DATUM_PA, H_SURVEY_M, zM);
}

export function scaleHeightM(tKelvin: number): number {
  return (R_CO2 * tKelvin) / G_SURFACE;
}

export function frozenFraction(ls: number): { north: number; south: number } {
  const s = Math.sin((ls * Math.PI) / 180);
  return { north: 0.25 * Math.max(0, -s), south: 0.25 * Math.max(0, s) };
}

export function p0Pa(ls: number): number {
  const f = frozenFraction(ls);
  return P_DATUM_PA * (1 - f.north - f.south);
}

export function airKg(ls: number): bigint {
  const f = frozenFraction(ls);
  const milli = BigInt(Math.round((1 - f.north - f.south) * 1_000_000));
  return (FULL_AIR_KG * milli) / 1_000_000n;
}

/** CO2 frost point, Clausius-Clapeyron anchored at 194.65 K / 1 atm. */
export function tFrost(pPa: number): number {
  const inv = 1 / 194.65 + (8.314 / 26_000) * Math.log(101_325 / Math.max(pPa, 1));
  return 1 / inv;
}

export function solarConstant(ls: number): number {
  const nu = ((ls - PERI_LS) * Math.PI) / 180;
  const r = (AU * (1 - ECC * ECC)) / (1 + ECC * Math.cos(nu));
  return S_1AU / (r * r);
}

export function declinationRad(ls: number): number {
  const ob = (OB_DEG * Math.PI) / 180;
  return Math.asin(Math.sin(ob) * Math.sin((ls * Math.PI) / 180));
}

/** Daily-mean cosine of the solar zenith angle, night included. Averages ~1/4. */
export function dailyMu(latDeg: number, ls: number): number {
  const phi = (latDeg * Math.PI) / 180;
  const dec = declinationRad(ls);
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosD = Math.cos(dec);
  const sinD = Math.sin(dec);
  if (Math.abs(cosPhi) < 1e-8) return Math.max(0, sinPhi * sinD);
  const x = (-sinPhi * sinD) / (cosPhi * cosD);
  if (x <= -1) return Math.max(0, sinPhi * sinD);
  if (x >= 1) return 0;
  const h0 = Math.acos(Math.min(1, Math.max(-1, x)));
  return (1 / Math.PI) * (h0 * sinPhi * sinD + cosPhi * cosD * Math.sin(h0));
}

export function stormTau(sol: number, storm: StormRecord | null): number {
  if (!storm) return 0;
  const age = sol - storm.startSol;
  if (age < 0 || age >= storm.duration) return 0;
  return (storm.peakTauMilli / 1000) * Math.sin((Math.PI * age) / storm.duration);
}

export function backgroundTau(ls: number): number {
  const season = Math.max(0, Math.cos(((ls - 270) * Math.PI) / 180));
  return 0.3 + 0.15 * season;
}

export function surfaceTransmission(tau: number): number {
  return Math.exp(-0.7 * tau);
}

export function seasonLabel(ls: number): string {
  const x = ((ls % 360) + 360) % 360;
  if (x < 90) return "Northern spring";
  if (x < 180) return "Northern summer";
  if (x < 270) return "Northern autumn";
  return "Northern winter";
}

function angDistDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dlon / 2) ** 2;
  return (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 180) / Math.PI;
}

function bump(lat: number, lon: number, clat: number, clon: number, sigma: number, amp: number): number {
  const d = angDistDeg(lat, lon, clat, clon);
  return amp * Math.exp(-(d * d) / (2 * sigma * sigma));
}

/** Stylized seed height. Site cells are pinned to survey elevations after this. */
export function seedElevation(lat: number, lon: number): number {
  const north = 1 / (1 + Math.exp(-(lat - 10) / 8));
  let z = (1 - north) * 1600 + north * -3400;
  z += bump(lat, lon, -42.5, 70, 14, -6200);
  z += bump(lat, lon, -50, 318, 8, -2800);
  z += bump(lat, lon, -5, 250, 32, 5500);
  z += bump(lat, lon, 18.6, 226.2, 5.5, 15000);
  z += bump(lat, lon, 25, 147, 12, 2200);
  if (lat > -16 && lat < 2 && lon > 275 && lon < 330) {
    const axis = Math.abs(lat + 8);
    z -= 3500 * Math.exp(-(axis * axis) / 30);
  }
  if (Math.abs(lat) > 78) z += (Math.abs(lat) - 78) * 80;
  return Math.max(-9000, Math.min(23000, Math.round(z)));
}

function albedoOf(lat: number): number {
  return Math.abs(lat) >= 72 ? ALBEDO_ICE : ALBEDO_GROUND;
}

function emptyArrays(): Pick<World, "zM" | "albedoMilli" | "tauAerMilli" | "tauDustMilli" | "tMeanDK" | "tAmpDK"> {
  return {
    zM: new Int16Array(CELL_COUNT),
    albedoMilli: new Uint16Array(CELL_COUNT),
    tauAerMilli: new Uint16Array(CELL_COUNT),
    tauDustMilli: new Uint16Array(CELL_COUNT),
    tMeanDK: new Int16Array(CELL_COUNT),
    tAmpDK: new Int16Array(CELL_COUNT),
  };
}

export function createWorld(seed = 0x52454431): World {
  const arrays = emptyArrays();
  for (let latIndex = 0; latIndex < LAT_ROWS; latIndex++) {
    for (let lonIndex = 0; lonIndex < LON_COLS; lonIndex++) {
      const i = latIndex * LON_COLS + lonIndex;
      const lat = cellLat(latIndex);
      const lon = cellLon(lonIndex);
      arrays.zM[i] = seedElevation(lat, lon);
      arrays.albedoMilli[i] = Math.round(albedoOf(lat) * 1000);
    }
  }
  for (const site of SITES) {
    arrays.zM[siteIndex(site.id)] = site.z;
  }
  const world: World = {
    seed,
    sol: 0,
    ls: lsAt(0),
    storm: null,
    ...arrays,
  };
  return derive(world);
}

function neighborMean(values: Float64Array, index: number): number {
  const lat = latIndexOf(index);
  const lon = lonIndexOf(index);
  let sum = 0;
  let n = 0;
  const take = (la: number, lo: number) => {
    sum += values[la * LON_COLS + lo];
    n += 1;
  };
  take(lat, (lon + 1) % LON_COLS);
  take(lat, (lon + LON_COLS - 1) % LON_COLS);
  if (lat > 0) take(lat - 1, lon);
  if (lat < LAT_ROWS - 1) take(lat + 1, lon);
  return n ? sum / n : 0;
}

export function derive(world: World): World {
  const tauDust = new Uint16Array(CELL_COUNT);
  const tMean = new Int16Array(CELL_COUNT);
  const tAmp = new Int16Array(CELL_COUNT);
  const bg = backgroundTau(world.ls);
  const storm = stormTau(world.sol, world.storm);
  const dust = bg + storm;
  const trans = surfaceTransmission(dust);
  const s = solarConstant(world.ls);
  const p0 = p0Pa(world.ls);
  const fPlanet = s * 0.25 * (1 - ALBEDO_GROUND) * trans;

  const aerLocal = new Float64Array(CELL_COUNT);
  for (let i = 0; i < CELL_COUNT; i++) {
    const tau = world.tauAerMilli[i] / 1000;
    aerLocal[i] = Math.min(AEROSOL_CAP_K, AEROSOL_K_PER_TAU * tau);
  }

  for (let i = 0; i < CELL_COUNT; i++) {
    const lat = cellLat(latIndexOf(i));
    const mu = Math.max(0, dailyMu(lat, world.ls));
    const albedo = world.albedoMilli[i] / 1000;
    const fLocal = s * mu * (1 - albedo) * trans;
    const absorbed = (1 - F_MIX) * fLocal + F_MIX * fPlanet;
    const tBare = (Math.max(absorbed, 0.5) / SIGMA) ** 0.25;
    const z = world.zM[i];
    const h = scaleHeightM(Math.max(150, tBare));
    const p = pressurePa(p0, h, z);
    const co2 = Math.min(CO2_WARMING_CAP_K, 6 * Math.log2(Math.max(p, P_DATUM_PA) / P_DATUM_PA));
    const aer = 0.9 * aerLocal[i] + 0.1 * neighborMean(aerLocal, i);
    const t = tBare + co2 + aer;
    let amp = Math.abs(lat) >= 72 || albedo >= 0.45 ? 20 : 60;
    let damp = Math.sqrt(P_DATUM_PA / Math.max(p, 50));
    damp = Math.min(1.6, Math.max(0.5, damp));
    amp *= damp;
    if (dust > 2) amp *= 0.6;
    tauDust[i] = Math.round(dust * 1000);
    tMean[i] = Math.round(t * 10);
    tAmp[i] = Math.round(amp * 10);
  }

  return { ...world, tauDustMilli: tauDust, tMeanDK: tMean, tAmpDK: tAmp };
}

export function step(world: World, opts: { fileStorm: boolean }): World {
  const sol = world.sol + 1;
  let storm = world.storm;
  if (opts.fileStorm && !storm && sol >= STORM_SOL) {
    storm = { startSol: STORM_SOL, duration: STORM_DURATION, peakTauMilli: STORM_PEAK_TAU_MILLI };
  }
  const tauAer = new Uint16Array(world.tauAerMilli);
  const stripping = stormTau(sol, storm) > 0.05;
  for (let i = 0; i < CELL_COUNT; i++) {
    let tau = (tauAer[i] / 1000) * DECAY;
    if (stripping) tau *= STRIP;
    tauAer[i] = Math.max(0, Math.min(65535, Math.round(tau * 1000)));
  }
  return derive({ ...world, sol, ls: lsAt(sol), storm, tauAerMilli: tauAer });
}

export function releaseAerosol(world: World, index: number): World {
  const tauAer = new Uint16Array(world.tauAerMilli);
  tauAer[index] = RELEASE_TAU_MILLI;
  return derive({ ...world, tauAerMilli: tauAer });
}

export type CellView = {
  index: number;
  lat: number;
  lon: number;
  z: number;
  tMean: number;
  tAmp: number;
  tDay: number;
  tNight: number;
  pSurvey: number;
  pLive: number;
  tauDust: number;
  tauAer: number;
  transmission: number;
  kwh: number;
  frost: boolean;
  liquid: boolean;
  note: string;
};

export function inspect(world: World, index: number): CellView {
  const lat = cellLat(latIndexOf(index));
  const lon = cellLon(lonIndexOf(index));
  const z = world.zM[index];
  const tMean = world.tMeanDK[index] / 10;
  const tAmp = world.tAmpDK[index] / 10;
  const tDay = tMean + tAmp / 2;
  const tNight = tMean - tAmp / 2;
  const pSurvey = surveyPressure(z);
  const pLive = pressurePa(p0Pa(world.ls), scaleHeightM(tMean), z);
  const tauDust = world.tauDustMilli[index] / 1000;
  const tauAer = world.tauAerMilli[index] / 1000;
  const transmission = surfaceTransmission(tauDust);
  const mu = Math.max(0, dailyMu(lat, world.ls));
  const flux = solarConstant(world.ls) * mu * transmission;
  const kwh = (flux * PANEL_M2 * PANEL_EFF * SOL_SECONDS) / 3.6e6;
  const frost = tNight < tFrost(pLive);
  const liquid = pLive >= TRIPLE_P_PA && tDay >= TRIPLE_T_K;
  return {
    index,
    lat,
    lon,
    z,
    tMean,
    tAmp,
    tDay,
    tNight,
    pSurvey,
    pLive,
    tauDust,
    tauAer,
    transmission,
    kwh,
    frost,
    liquid,
    note: climateNote(pLive, tDay, frost),
  };
}

function climateNote(pLive: number, tDay: number, frost: boolean): string {
  if (pLive < TRIPLE_P_PA) {
    return "Under the triple point. Open liquid is impossible here. A roof is a vessel, not a climate.";
  }
  if (tDay < TRIPLE_T_K) {
    return "Pressure is over the triple point. The day is not warm enough. Open water does not hold.";
  }
  if (frost) {
    return "The day can make a brine. The night drops through the frost point and takes it back.";
  }
  return "Transient liquid can sit until the next energy balance says otherwise.";
}

export function canonicalBytes(world: World): Uint8Array {
  const cellBytes = 12;
  const header = 4 + 4 + 4 + 4 + 8 + 1 + 12;
  const buf = new Uint8Array(header + CELL_COUNT * cellBytes);
  const view = new DataView(buf.buffer);
  buf[0] = 0x52;
  buf[1] = 0x50;
  buf[2] = 0x43;
  buf[3] = 0x31;
  let o = 4;
  view.setUint32(o, world.seed >>> 0);
  o += 4;
  view.setUint32(o, world.sol >>> 0);
  o += 4;
  view.setUint32(o, Math.round(world.ls * 1000) >>> 0);
  o += 4;
  const air = airKg(world.ls);
  view.setUint32(o, Number(air >> 32n));
  o += 4;
  view.setUint32(o, Number(air & 0xffffffffn));
  o += 4;
  if (world.storm) {
    buf[o] = 1;
    o += 1;
    view.setUint32(o, world.storm.startSol);
    o += 4;
    view.setUint32(o, world.storm.duration);
    o += 4;
    view.setUint32(o, world.storm.peakTauMilli);
    o += 4;
  } else {
    buf[o] = 0;
    o += 13;
  }
  for (let i = 0; i < CELL_COUNT; i++) {
    view.setInt16(o, world.tMeanDK[i]);
    o += 2;
    view.setInt16(o, world.tAmpDK[i]);
    o += 2;
    view.setUint16(o, world.tauDustMilli[i]);
    o += 2;
    view.setUint16(o, world.tauAerMilli[i]);
    o += 2;
    view.setUint16(o, world.albedoMilli[i]);
    o += 2;
    view.setInt16(o, world.zM[i]);
    o += 2;
  }
  return buf;
}

export function stateHash(world: World): string {
  return toHex(sha256(canonicalBytes(world)));
}

export function formatPa(p: number): string {
  const rounded = Math.round(p);
  const body = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  return `${body} Pa`;
}

export function formatTemp(k: number): string {
  return `${k.toFixed(1)} K`;
}

export function stormActive(world: World): boolean {
  return stormTau(world.sol, world.storm) > 0.2;
}
