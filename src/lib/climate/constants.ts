/** Survey constants for the Red. Not tuning knobs. See Red_Paradigm_Climate_Physics.md */

export const RADIUS_M = 3_389_500;
export const MASS_KG = 6.4171e23;
export const G_GRAV = 6.6743e-11;
export const G_SURFACE = 3.71;
export const SOL_SECONDS = 88_775;
export const SOLS_PER_YEAR = 668.6;

export const R_CO2 = 189;
export const P_DATUM_PA = 610;
export const H_SURVEY_M = 11_000;
export const KG_PER_MBAR = 3.9e15;
/** 6.10 mbar × 3.9e15 kg. Safe as bigint; not as a JS number. */
export const FULL_AIR_KG = 2_379n * 10n ** 13n;

export const SIGMA = 5.670374419e-8;
export const OB_DEG = 25.19;
export const ECC = 0.0934;
export const AU = 1.5237;
export const S_1AU = 1361;
/** Perihelion, degrees of solar longitude. */
export const PERI_LS = 251;

export const ALBEDO_GROUND = 0.25;
export const ALBEDO_ICE = 0.55;
export const TRIPLE_P_PA = 612;
export const TRIPLE_T_K = 273.16;
export const F_MIX = 0.18;
export const AEROSOL_HALFLIFE_SOLS = 40;
export const STORM_STRIP_HALFLIFE_SOLS = 10;
export const AEROSOL_CAP_K = 15;
export const AEROSOL_K_PER_TAU = 25;
export const CO2_WARMING_CAP_K = 12;

export const LON_COLS = 72;
export const LAT_ROWS = 36;
export const CELL_COUNT = LON_COLS * LAT_ROWS;

export const STORM_SOL = 12;
export const STORM_DURATION = 40;
export const STORM_PEAK_TAU_MILLI = 5000;
export const RELEASE_TAU_MILLI = 800;

export const PANEL_M2 = 100;
export const PANEL_EFF = 0.22;

export function lsAt(sol: number): number {
  const raw = 240 + sol * (360 / SOLS_PER_YEAR);
  return ((raw % 360) + 360) % 360;
}

export function cellLat(latIndex: number): number {
  return 90 - (latIndex + 0.5) * (180 / LAT_ROWS);
}

export function cellLon(lonIndex: number): number {
  return (lonIndex + 0.5) * (360 / LON_COLS);
}

export function cellIndex(latDeg: number, lonDeg: number): number {
  const latIndex = Math.min(
    LAT_ROWS - 1,
    Math.max(0, Math.floor((90 - latDeg) / (180 / LAT_ROWS))),
  );
  const lon = ((lonDeg % 360) + 360) % 360;
  const lonIndex = Math.min(LON_COLS - 1, Math.floor(lon / (360 / LON_COLS)));
  return latIndex * LON_COLS + lonIndex;
}

export function latIndexOf(index: number): number {
  return Math.floor(index / LON_COLS);
}

export function lonIndexOf(index: number): number {
  return index % LON_COLS;
}
