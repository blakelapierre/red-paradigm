import { RADIUS_M } from "../climate/constants.ts";
import { sha256, toHex } from "../climate/hash.ts";

/** Strategic crust. One kilometer on a side. Untouched ground is not stored. */
export const CELL_M = 1000;
export const COLS = Math.round((2 * Math.PI * RADIUS_M) / CELL_M);
export const ROWS = Math.round((Math.PI * RADIUS_M) / CELL_M);

/** Loose regolith, kilograms per cubic meter. A survey figure, not a difficulty knob. */
export const BULK_KG_PER_M3 = 1500;
/** One cut. Integer centimeters, same unit a later brush would use. */
export const DIG_DZ_CM = -200;

const M3_PER_CM = (BigInt(CELL_M) * BigInt(CELL_M)) / 100n;
export const CUT_KG = M3_PER_CM * BigInt(-DIG_DZ_CM) * BigInt(BULK_KG_PER_M3);
/** The yard at campaign start holds one cut and not two. */
export const YARD_KG = CUT_KG;

export type Override = { ix: number; iy: number; dzCm: number; albedoMilli: number };

export type Crust = {
  seed: number;
  holdKg: bigint;
  spoilKg: bigint;
  overrides: readonly Override[];
};

export type DigOp = {
  ix: number;
  iy: number;
  dzCm: number;
  beforeHash: string;
};

export type DigResult = {
  crust: Crust;
  accepted: boolean;
  reason: string;
};

export function createCrust(seed = 0x52454431): Crust {
  return { seed, holdKg: YARD_KG, spoilKg: 0n, overrides: [] };
}

export function cellOf(latDeg: number, lonDeg: number): { ix: number; iy: number } {
  const lat = Math.min(90, Math.max(-90, latDeg));
  const lon = ((lonDeg % 360) + 360) % 360;
  const iy = Math.min(ROWS - 1, Math.max(0, Math.floor(((lat + 90) / 180) * ROWS)));
  const ix = Math.min(COLS - 1, Math.floor((lon / 360) * COLS));
  return { ix, iy };
}

export function cellCenter(ix: number, iy: number): { lat: number; lon: number } {
  return {
    lat: ((iy + 0.5) / ROWS) * 180 - 90,
    lon: ((ix + 0.5) / COLS) * 360,
  };
}

export function overrideAt(crust: Crust, ix: number, iy: number): number {
  const found = crust.overrides.find((row) => row.ix === ix && row.iy === iy);
  return found ? found.dzCm : 0;
}

/** Surveyed elevation plus the integer override. A missing override is zero, not a stored cell. */
export function floorM(seedZm: number, dzCm: number): number {
  return seedZm + dzCm / 100;
}

export function spoilKg(dzCm: number): bigint {
  if (!Number.isInteger(dzCm) || dzCm >= 0) return 0n;
  return M3_PER_CM * BigInt(-dzCm) * BigInt(BULK_KG_PER_M3);
}

function writeI32(view: DataView, offset: number, n: number): void {
  view.setInt32(offset, n);
}

function writeU32(view: DataView, offset: number, n: number): void {
  view.setUint32(offset, n);
}

function writeU64(view: DataView, offset: number, n: bigint): void {
  writeU32(view, offset, Number((n >> 32n) & 0xffffffffn));
  writeU32(view, offset + 4, Number(n & 0xffffffffn));
}

/** SHA-256 over seed, the cell being edited, and every sparse override. Stand-in for the BLAKE3 op hash. */
export function beforeHash(crust: Crust, ix: number, iy: number): string {
  const n = crust.overrides.length;
  const bytes = new Uint8Array(4 + 4 + 4 + 4 + 4 + n * 16);
  const view = new DataView(bytes.buffer);
  bytes.set([0x50, 0x49, 0x54, 0x31]);
  writeU32(view, 4, crust.seed >>> 0);
  writeI32(view, 8, ix);
  writeI32(view, 12, iy);
  writeU32(view, 16, n);
  crust.overrides.forEach((row, i) => {
    const at = 20 + i * 16;
    writeI32(view, at, row.ix);
    writeI32(view, at + 4, row.iy);
    writeI32(view, at + 8, row.dzCm);
    writeI32(view, at + 12, row.albedoMilli);
  });
  return toHex(sha256(bytes));
}

export function crustBytes(crust: Crust): Uint8Array {
  const n = crust.overrides.length;
  const bytes = new Uint8Array(4 + 4 + 8 + 8 + 4 + n * 16);
  const view = new DataView(bytes.buffer);
  bytes.set([0x43, 0x52, 0x53, 0x54]);
  writeU32(view, 4, crust.seed >>> 0);
  writeU64(view, 8, crust.holdKg);
  writeU64(view, 16, crust.spoilKg);
  writeU32(view, 24, n);
  crust.overrides.forEach((row, i) => {
    const at = 28 + i * 16;
    writeI32(view, at, row.ix);
    writeI32(view, at + 4, row.iy);
    writeI32(view, at + 8, row.dzCm);
    writeI32(view, at + 12, row.albedoMilli);
  });
  return bytes;
}

export function crustHash(crust: Crust): string {
  return toHex(sha256(crustBytes(crust)));
}

export function proposeDig(crust: Crust, ix: number, iy: number, dzCm = DIG_DZ_CM): DigOp {
  return { ix, iy, dzCm, beforeHash: beforeHash(crust, ix, iy) };
}

/** Both clients take the cut, or neither does. A refusal leaves both hashes where they were. */
export function commitDig(
  a: Crust,
  b: Crust,
  ix: number,
  iy: number,
  dzCm = DIG_DZ_CM,
): { a: Crust; b: Crust; accepted: boolean; reason: string } {
  const op = proposeDig(a, ix, iy, dzCm);
  const left = applyDig(a, op);
  const right = applyDig(b, op);
  if (!left.accepted || !right.accepted) {
    return { a, b, accepted: false, reason: left.accepted ? right.reason : left.reason };
  }
  return { a: left.crust, b: right.crust, accepted: true, reason: left.reason };
}

function withPaint(rows: readonly Override[], ix: number, iy: number, albedoMilli: number): Override[] {
  const next = rows.map((row) => ({ ...row }));
  const index = next.findIndex((row) => row.ix === ix && row.iy === iy);
  if (index >= 0) next[index] = { ...next[index], albedoMilli };
  else next.push({ ix, iy, dzCm: 0, albedoMilli });
  next.sort((a, b) => a.iy - b.iy || a.ix - b.ix);
  return next;
}

export function paintOf(crust: Crust, ix: number, iy: number): number {
  return crust.overrides.find((row) => row.ix === ix && row.iy === iy)?.albedoMilli ?? 0;
}

export function paintCell(crust: Crust, ix: number, iy: number, albedoMilli: number): Crust {
  return { ...crust, overrides: withPaint(crust.overrides, ix, iy, albedoMilli) };
}

function withOverride(rows: readonly Override[], ix: number, iy: number, dzCm: number): Override[] {
  const next = rows.map((row) => ({ ...row }));
  const index = next.findIndex((row) => row.ix === ix && row.iy === iy);
  if (index >= 0) next[index] = { ...next[index], dzCm: next[index].dzCm + dzCm };
  else next.push({ ix, iy, dzCm, albedoMilli: 0 });
  next.sort((a, b) => a.iy - b.iy || a.ix - b.ix);
  return next;
}

export function applyDig(crust: Crust, op: DigOp): DigResult {
  if (!Number.isInteger(op.ix) || !Number.isInteger(op.iy) || !Number.isInteger(op.dzCm)) {
    return { crust, accepted: false, reason: "the cut is not an integer" };
  }
  if (op.ix < 0 || op.ix >= COLS || op.iy < 0 || op.iy >= ROWS) {
    return { crust, accepted: false, reason: "that cell is not on the grid" };
  }
  if (op.dzCm >= 0) return { crust, accepted: false, reason: "this order only digs" };
  if (op.beforeHash !== beforeHash(crust, op.ix, op.iy)) {
    return { crust, accepted: false, reason: "before-hash does not match" };
  }
  const spoil = spoilKg(op.dzCm);
  if (spoil > crust.holdKg) {
    return { crust, accepted: false, reason: `yard cannot hold ${spoil.toString()} kg` };
  }
  return {
    crust: {
      seed: crust.seed,
      holdKg: crust.holdKg - spoil,
      spoilKg: crust.spoilKg + spoil,
      overrides: withOverride(crust.overrides, op.ix, op.iy, op.dzCm),
    },
    accepted: true,
    reason: "cut accepted",
  };
}

export function corruptHash(hex: string): string {
  const last = hex.slice(-1);
  return hex.slice(0, -1) + (last === "0" ? "1" : "0");
}
