import { sha256, toHex } from "./climate/hash.ts";
import { canonicalBytes, type World } from "./climate/model.ts";
import { crustBytes, type Crust } from "./crust/crust.ts";

/** One snapshot: the climate record, then the crust record. Either disagreement splits it. */
export function turnHash(world: World, ground: Crust): string {
  const climate = canonicalBytes(world);
  const crust = crustBytes(ground);
  const buf = new Uint8Array(4 + climate.length + crust.length);
  buf[0] = 0x54;
  buf[1] = 0x55;
  buf[2] = 0x52;
  buf[3] = 0x4e;
  buf.set(climate, 4);
  buf.set(crust, 4 + climate.length);
  return toHex(sha256(buf));
}
