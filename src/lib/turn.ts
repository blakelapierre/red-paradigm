import { sha256, toHex } from "./climate/hash.ts";
import { canonicalBytes, type World } from "./climate/model.ts";
import { crustBytes, type Crust } from "./crust/crust.ts";
import { stocksBytes, type Stocks } from "./yard/power.ts";

/** Climate record, crust record, then the battery. The board only writes them together. */
export function turnHash(world: World, ground: Crust, stocks: Stocks): string {
  const climate = canonicalBytes(world);
  const crust = crustBytes(ground);
  const power = stocksBytes(stocks);
  const buf = new Uint8Array(4 + climate.length + crust.length + power.length);
  buf[0] = 0x54;
  buf[1] = 0x55;
  buf[2] = 0x52;
  buf[3] = 0x4e;
  buf.set(climate, 4);
  buf.set(crust, 4 + climate.length);
  buf.set(power, 4 + climate.length + crust.length);
  return toHex(sha256(buf));
}
