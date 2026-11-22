import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Pause, Play, RotateCcw, SunMedium, Wind } from "lucide-react";
import {
  CELL_COUNT,
  LON_COLS,
  latIndexOf,
  lonIndexOf,
} from "@/lib/climate/constants";
import {
  SITES,
  createWorld,
  formatPa,
  formatTemp,
  inspect,
  seasonLabel,
  siteIndex,
  stateHash,
  stormActive,
  surveyPressure,
  type World,
} from "@/lib/climate/model";
import {
  cellCenter,
  cellOf,
  createCrust,
  crustHash,
  floorM,
  overrideAt,
  type Crust,
} from "@/lib/crust/crust";
import { turnHash } from "@/lib/turn";
import { commitMill } from "@/lib/yard/mill";
import { commitRelease } from "@/lib/yard/release";
import {
  CUT_KWH,
  arrayKwh,
  closeSol,
  commitPoweredCut,
  createStocks,
  type Stocks,
} from "@/lib/yard/power";

type Pair = {
  canon: World;
  witness: World;
  canonCrust: Crust;
  witnessCrust: Crust;
  canonStocks: Stocks;
  witnessStocks: Stocks;
};

function fresh(): Pair {
  return {
    canon: createWorld(),
    witness: createWorld(),
    canonCrust: createCrust(),
    witnessCrust: createCrust(),
    canonStocks: createStocks(),
    witnessStocks: createStocks(),
  };
}

function closeBoth(p: Pair): Pair {
  const canon = closeSol(p.canon, p.canonStocks);
  const witness = closeSol(p.witness, p.witnessStocks);
  return { ...p, canon: canon.world, witness: witness.world, canonStocks: canon.stocks, witnessStocks: witness.stocks };
}

function formatKg(kg: bigint): string {
  return `${kg.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} kg`;
}

function formatKwh(kwh: number): string {
  return `${kwh.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} kWh`;
}

type CutNote = { accepted: boolean; reason: string };

function tempRgb(t: number): [number, number, number] {
  const stops: Array<{ t: number; c: [number, number, number] }> = [
    { t: 120, c: [18, 36, 64] },
    { t: 155, c: [42, 78, 118] },
    { t: 185, c: [92, 74, 68] },
    { t: 210, c: [166, 78, 42] },
    { t: 235, c: [206, 132, 72] },
    { t: 265, c: [230, 210, 180] },
  ];
  if (t <= stops[0].t) return stops[0].c;
  if (t >= stops[stops.length - 1].t) return stops[stops.length - 1].c;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t >= a.t && t <= b.t) {
      const u = (t - a.t) / (b.t - a.t);
      return [
        Math.round(a.c[0] + (b.c[0] - a.c[0]) * u),
        Math.round(a.c[1] + (b.c[1] - a.c[1]) * u),
        Math.round(a.c[2] + (b.c[2] - a.c[2]) * u),
      ];
    }
  }
  return stops[0].c;
}

export function Council() {
  const [pair, setPair] = useState<Pair>(fresh);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState(() => siteIndex("cradle"));
  const [canonCut, setCanonCut] = useState<CutNote | null>(null);
  const [witnessCut, setWitnessCut] = useState<CutNote | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      if (acc >= 0.4) {
        acc = 0;
        setPair(closeBoth);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "BUTTON" || tag === "INPUT") return;
      event.preventDefault();
      setPair(closeBoth);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const draw = () => {
      const width = wrap.clientWidth;
      if (width < 8) return;
      const height = Math.max(180, Math.round(width / 2));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const world = pair.canon;
      const worldCrust = pair.canonCrust;
      const cw = width / LON_COLS;
      const ch = height / (CELL_COUNT / LON_COLS);
      for (let i = 0; i < CELL_COUNT; i++) {
        const t = world.tMeanDK[i] / 10;
        const [r, g, b] = tempRgb(t);
        const dust = world.tauDustMilli[i] / 1000;
        const veil = Math.min(0.55, Math.max(0, dust - 0.4) * 0.12);
        ctx.fillStyle = `rgb(${Math.round(r * (1 - veil) + 180 * veil)},${Math.round(g * (1 - veil) + 160 * veil)},${Math.round(b * (1 - veil) + 130 * veil)})`;
        ctx.fillRect(lonIndexOf(i) * cw, latIndexOf(i) * ch, cw + 0.5, ch + 0.5);
      }
      ctx.strokeStyle = "rgba(20,17,14,0.45)";
      ctx.lineWidth = 1;
      for (let i = 0; i < CELL_COUNT; i++) {
        const lon = lonIndexOf(i);
        const lat = latIndexOf(i);
        const z = world.zM[i];
        const right = lat * LON_COLS + ((lon + 1) % LON_COLS);
        if (Math.abs(z - world.zM[right]) > 1800) {
          ctx.beginPath();
          ctx.moveTo((lon + 1) * cw, lat * ch);
          ctx.lineTo((lon + 1) * cw, (lat + 1) * ch);
          ctx.stroke();
        }
      }
      const selLat = latIndexOf(selected);
      const selLon = lonIndexOf(selected);
      ctx.strokeStyle = "#e6dcc8";
      ctx.lineWidth = 2;
      ctx.strokeRect(selLon * cw + 1, selLat * ch + 1, cw - 2, ch - 2);
      if (width >= 520) {
        ctx.font = "12px IBM Plex Sans, sans-serif";
        ctx.fillStyle = "#e6dcc8";
        for (const site of SITES) {
          const x = (site.lon / 360) * width;
          const y = ((90 - site.lat) / 180) * height;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillText(site.name, x + 6, y - 6);
        }
      }
      ctx.fillStyle = "#d4652f";
      for (const cut of worldCrust.overrides) {
        const at = cellCenter(cut.ix, cut.iy);
        const x = (at.lon / 360) * width;
        const y = ((90 - at.lat) / 180) * height;
        ctx.fillRect(x - 3, y - 3, 6, 6);
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [pair, selected]);

  const world = pair.canon;
  const view = inspect(world, selected);
  const hashA = stateHash(world);
  const hashB = stateHash(pair.witness);
  const turnA = turnHash(world, pair.canonCrust, pair.canonStocks);
  const turnB = turnHash(pair.witness, pair.witnessCrust, pair.witnessStocks);
  const witnessView = inspect(pair.witness, selected);

  const advance = (sols: number) => {
    setPair((p) => {
      let next = p;
      for (let i = 0; i < sols; i++) next = closeBoth(next);
      return next;
    });
  };

  const onCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const lon = x * 360;
    const lat = 90 - y * 180;
    const latIndex = Math.min(35, Math.max(0, Math.floor((90 - lat) / 5)));
    const lonIndex = Math.min(71, Math.max(0, Math.floor(lon / 5)));
    setSelected(latIndex * LON_COLS + lonIndex);
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
      <header className="flex flex-col gap-2 border-b border-line pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-xl font-medium tracking-wide text-fg">Red Paradigm</h1>
          <p className="font-mono text-sm text-frost">
            Sol {world.sol.toString().padStart(3, "0")} · Ls {world.ls.toFixed(1)}° · {seasonLabel(world.ls)}
          </p>
        </div>
        <p className="max-w-3xl text-sm text-muted">
          Datum pressure, one sol of heat, a particle release, and a storm that is a line in the log. A former can cut one pit. The climate cell does not move.
        </p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex min-w-0 flex-col gap-3">
          <div ref={wrapRef} className="overflow-hidden rounded-sm border border-line bg-surface">
            <canvas
              ref={canvasRef}
              onClick={onCanvasClick}
              className="block w-full"
              aria-label="Temperature map of the Red"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>Daily mean temperature</span>
            <span className="flex items-center gap-1">
              {[140, 175, 205, 230, 255].map((t) => {
                const [r, g, b] = tempRgb(t);
                return (
                  <span
                    key={t}
                    className="inline-block h-3 w-6 border border-line"
                    style={{ background: `rgb(${r},${g},${b})` }}
                  />
                );
              })}
            </span>
            <span className="font-mono">140 K to 255 K</span>
            {stormActive(world) ? (
              <span className="inline-flex items-center gap-1 text-oxide">
                <Wind className="size-3.5" aria-hidden />
                Encircling storm
              </span>
            ) : null}
          </div>
        </section>

        <aside className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-sm border border-line bg-surface p-3">
            <button
              type="button"
              className="min-h-11 rounded-sm bg-oxide px-3 text-sm font-medium text-bg"
              onClick={() => {
                const released = commitRelease(
                  pair.canon,
                  pair.witness,
                  pair.canonStocks,
                  pair.witnessStocks,
                  selected,
                  view.lat,
                );
                setCanonCut({ accepted: released.accepted, reason: released.reason });
                setWitnessCut({ accepted: released.accepted, reason: released.reason });
                setPair((p) => ({
                  ...p,
                  canon: released.a,
                  witness: released.b,
                  canonStocks: released.aStocks,
                  witnessStocks: released.bStocks,
                }));
              }}
            >
              Release particles here
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="min-h-11 rounded-sm border border-line px-3 text-sm text-fg" onClick={() => advance(1)}>
                One sol
              </button>
              <button type="button" className="min-h-11 rounded-sm border border-line px-3 text-sm text-fg" onClick={() => advance(10)}>
                Ten sols
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-line px-3 text-sm text-fg"
                onClick={() => setPlaying((v) => !v)}
              >
                {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
                {playing ? "Pause" : "Run"}
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-line px-3 text-sm text-fg"
                onClick={() => {
                  setPlaying(false);
                  setPair(fresh());
                  setSelected(siteIndex("cradle"));
                  setCanonCut(null);
                  setWitnessCut(null);
                }}
              >
                <RotateCcw className="size-4" aria-hidden />
                Reset
              </button>
            </div>
            <p className="text-xs text-muted">
              Lofting spends 5,000,000 kg of fines and 200,000 kWh. Five grams per square meter is optical depth 1, so one batch is a thin veil over this climate cell, not τ 0.80. It does warm the cell. It does not move the CO₂ bar.
            </p>
          </div>

          <Former
            seedZm={view.z}
            lat={view.lat}
            lon={view.lon}
            canon={pair.canonCrust}
            witness={pair.witnessCrust}
            stocks={pair.canonStocks}
            array={arrayKwh(world)}
            canonCut={canonCut}
            witnessCut={witnessCut}
            onDig={() => {
              const at = cellOf(view.lat, view.lon);
              const cut = commitPoweredCut(pair.canonCrust, pair.witnessCrust, pair.canonStocks, pair.witnessStocks, at.ix, at.iy);
              setCanonCut({ accepted: cut.accepted, reason: cut.reason });
              setWitnessCut({ accepted: cut.accepted, reason: cut.reason });
              setPair((p) => ({
                ...p,
                canonCrust: cut.a,
                witnessCrust: cut.b,
                canonStocks: cut.aStocks,
                witnessStocks: cut.bStocks,
              }));
            }}
            onMill={() => {
              const milled = commitMill(pair.canonCrust, pair.witnessCrust, pair.canonStocks, pair.witnessStocks);
              setCanonCut({ accepted: milled.accepted, reason: milled.reason });
              setWitnessCut({ accepted: milled.accepted, reason: milled.reason });
              setPair((p) => ({
                ...p,
                canonCrust: milled.a,
                witnessCrust: milled.b,
                canonStocks: milled.aStocks,
                witnessStocks: milled.bStocks,
              }));
            }}
          />

          <section className="rounded-sm border border-line bg-surface p-3">
            <h2 className="text-sm font-medium text-fg">Survey column</h2>
            <p className="mt-1 text-xs text-muted">610 Pa at the datum, 11 km scale height, before the seasonal cap.</p>
            <ul className="mt-2 flex flex-col">
              {SITES.map((site) => {
                const active = siteIndex(site.id) === selected;
                return (
                  <li key={site.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(siteIndex(site.id))}
                      className={`flex min-h-11 w-full items-center justify-between gap-3 border-t border-line px-1 text-left text-sm ${active ? "text-frost" : "text-fg"}`}
                    >
                      <span>
                        {site.name}
                        <span className="mt-0.5 block text-xs text-muted">
                          {site.survey} · {site.z > 0 ? "+" : ""}
                          {site.z} m
                        </span>
                      </span>
                      <span className="font-mono text-xs">{formatPa(surveyPressure(site.z))}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-sm border border-line bg-surface p-3">
            <h2 className="text-sm font-medium text-fg">This cell</h2>
            <p className="mt-1 font-mono text-xs text-muted">
              {view.lat.toFixed(1)}° · {view.lon.toFixed(1)}° · {view.z} m
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted">Live pressure</dt>
                <dd className="font-mono">{formatPa(view.pLive)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Mean / night</dt>
                <dd className="font-mono">
                  {formatTemp(view.tMean)} / {formatTemp(view.tNight)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Dust τ / particles</dt>
                <dd className="font-mono">
                  {view.tauDust.toFixed(2)} / {view.tauAer.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Panel, 100 m²</dt>
                <dd className="inline-flex items-center gap-1 font-mono">
                  <SunMedium className="size-3.5 text-oxide" aria-hidden />
                  {view.kwh.toFixed(1)} kWh
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted">{view.note}</p>
            <p className="mt-1 text-xs text-muted">
              Surface sun is {Math.round(view.transmission * 100)}% of the top of the air. Both clients read the same cell: {witnessView.kwh.toFixed(1)} kWh, particle τ {witnessView.tauAer.toFixed(2)}.
            </p>
          </section>

          <section className="rounded-sm border border-line bg-surface p-3">
            <h2 className="flex items-center justify-between text-sm font-medium text-fg">
              Witness
              <span className={turnA === turnB ? "font-mono text-xs text-frost" : "font-mono text-xs text-oxide"}>
                {turnA === turnB ? "AGREE" : "HASH SPLIT"}
              </span>
            </h2>
            <p className="mt-1 break-all font-mono text-xs text-fg">{turnA.slice(0, 32)}</p>
            <p className="mt-1 break-all font-mono text-xs text-muted">{turnB.slice(0, 32)}</p>
            <HashRow label="Climate" a={hashA} b={hashB} />
            <HashRow label="Crust" a={crustHash(pair.canonCrust)} b={crustHash(pair.witnessCrust)} />
            <p className="mt-2 text-xs text-muted">
              The turn hash is the climate record, the crust record, and the battery. Both clients take the same log, so the halves do not split.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function HashRow({ label, a, b }: { label: string; a: string; b: string }) {
  const split = a !== b;
  return (
    <div className="mt-2 border-t border-line pt-2">
      <p className="flex items-center justify-between text-xs text-muted">
        {label}
        <span className={split ? "font-mono text-oxide" : "font-mono text-frost"}>{split ? "HASH SPLIT" : "AGREE"}</span>
      </p>
      <p className="mt-1 break-all font-mono text-xs text-fg">{a.slice(0, 32)}</p>
      <p className="mt-1 break-all font-mono text-xs text-muted">{b.slice(0, 32)}</p>
    </div>
  );
}

function Former({
  seedZm,
  lat,
  lon,
  canon,
  witness,
  stocks,
  array,
  canonCut,
  witnessCut,
  onDig,
  onMill,
}: {
  seedZm: number;
  lat: number;
  lon: number;
  canon: Crust;
  witness: Crust;
  stocks: Stocks;
  array: number;
  canonCut: CutNote | null;
  witnessCut: CutNote | null;
  onDig: () => void;
  onMill: () => void;
}) {
  const at = cellOf(lat, lon);
  const dz = overrideAt(canon, at.ix, at.iy);
  const floor = floorM(seedZm, dz);
  const delta = surveyPressure(floor) - surveyPressure(seedZm);
  return (
    <section className="rounded-sm border border-line bg-surface p-3">
      <h2 className="text-sm font-medium text-fg">Former</h2>
      <p className="mt-1 font-mono text-xs text-muted">
        cell {at.ix}, {at.iy} · seed {seedZm} m · floor {floor} m
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-muted">Spoil in the yard</dt>
          <dd className="font-mono text-xs">{formatKg(canon.spoilKg)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Yard still holds</dt>
          <dd className="font-mono text-xs">{formatKg(canon.holdKg)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Battery</dt>
          <dd className="font-mono text-xs">{formatKwh(stocks.batteryKwh)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Cradle array this sol</dt>
          <dd className="font-mono text-xs">{formatKwh(array)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Fines</dt>
          <dd className="font-mono text-xs">{formatKg(stocks.finesKg)}</dd>
        </div>
      </dl>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className="min-h-11 rounded-sm bg-oxide px-3 text-sm font-medium text-bg" onClick={onDig}>
          Dig 2 m
        </button>
        <button type="button" className="min-h-11 rounded-sm border border-line px-3 text-sm text-fg" onClick={onMill}>
          Mill a batch
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        One kilometer, two meters down, 3,000,000,000 kg at 1,500 kg/m³. The cut costs {formatKwh(CUT_KWH)}. A mill batch is 100,000,000 kg of spoil and 1,000,000 kWh, and five percent of that mass is fines. Floor pressure moves by {delta.toFixed(2)} Pa. Both clients take the order, or neither does.
      </p>
      <p className={`mt-2 text-xs ${canonCut?.accepted ? "text-frost" : "text-muted"}`}>
        Order: {canonCut ? canonCut.reason : "no cut yet"}
      </p>
      <p className="mt-1 text-xs text-muted">
        Both clients: {witnessCut ? witnessCut.reason : "no cut yet"} · spoil {formatKg(witness.spoilKg)}
      </p>
    </section>
  );
}
