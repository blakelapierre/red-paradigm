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
  paintOf,
  type Crust,
} from "@/lib/crust/crust";
import { turnHash } from "@/lib/turn";
import { commitRoof } from "@/lib/yard/roof";
import { commitRoad } from "@/lib/yard/road";
import { commitBerm } from "@/lib/yard/berm";
import { commitCollector } from "@/lib/yard/collector";
import { scaleArray, commitRepair } from "@/lib/yard/health";
import { commitHeat } from "@/lib/yard/cabin";
import { commitCondenser } from "@/lib/yard/condenser";
import { commitRadiator } from "@/lib/yard/radiator";
import { commitReactor } from "@/lib/yard/kilopower";
import { commitWash } from "@/lib/yard/wash";
import { commitBurn } from "@/lib/yard/burn";
import { commitSabatier } from "@/lib/yard/sabatier";
import { commitElectrolysis } from "@/lib/yard/electrolysis";
import { commitMine } from "@/lib/yard/ice";
import { commitMill } from "@/lib/yard/mill";
import { commitDump } from "@/lib/yard/dump";
import { commitPaint } from "@/lib/yard/paint";
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
  const canon = closeSol(p.canon, p.canonStocks, p.canonCrust);
  const witness = closeSol(p.witness, p.witnessStocks, p.witnessCrust);
  return {
    ...p,
    canon: canon.world,
    witness: witness.world,
    canonStocks: canon.stocks,
    witnessStocks: witness.stocks,
    canonCrust: canon.crust,
    witnessCrust: witness.crust,
  };
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
              Lofting spends 5,000,000 kg of fines and 200,000 kWh. Five grams per square meter is optical depth 1, so one batch is a thin veil over this climate cell, not τ 0.80. It does warm the cell, until τ 0.60, where 15 K is already the cap. It does not move the CO₂ bar.
            </p>
          </div>

          <Former
            seedZm={view.z}
            lat={view.lat}
            lon={view.lon}
            canon={pair.canonCrust}
            witness={pair.witnessCrust}
            stocks={pair.canonStocks}
            array={scaleArray(arrayKwh(world), pair.canonStocks.healthMilli)}
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
            onDump={() => {
              const at = cellOf(view.lat, view.lon);
              const dumped = commitDump(pair.canonCrust, pair.witnessCrust, at.ix, at.iy);
              setCanonCut({ accepted: dumped.accepted, reason: dumped.reason });
              setWitnessCut({ accepted: dumped.accepted, reason: dumped.reason });
              setPair((p) => ({ ...p, canonCrust: dumped.a, witnessCrust: dumped.b }));
            }}
            onPaint={() => {
              const at = cellOf(view.lat, view.lon);
              const painted = commitPaint(pair.canonCrust, pair.witnessCrust, pair.canonStocks, pair.witnessStocks, at.ix, at.iy);
              setCanonCut({ accepted: painted.accepted, reason: painted.reason });
              setWitnessCut({ accepted: painted.accepted, reason: painted.reason });
              setPair((p) => ({
                ...p,
                canonCrust: painted.a,
                witnessCrust: painted.b,
                canonStocks: painted.aStocks,
                witnessStocks: painted.bStocks,
              }));
            }}
            onMine={() => {
              const mined = commitMine(pair.canonStocks, pair.witnessStocks);
              setCanonCut({ accepted: mined.accepted, reason: mined.reason });
              setWitnessCut({ accepted: mined.accepted, reason: mined.reason });
              setPair((p) => ({ ...p, canonStocks: mined.a, witnessStocks: mined.b }));
            }}
            onSplit={() => {
              const split = commitElectrolysis(pair.canonStocks, pair.witnessStocks);
              setCanonCut({ accepted: split.accepted, reason: split.reason });
              setWitnessCut({ accepted: split.accepted, reason: split.reason });
              setPair((p) => ({ ...p, canonStocks: split.a, witnessStocks: split.b }));
            }}
            onSabatier={() => {
              const ran = commitSabatier(pair.canonStocks, pair.witnessStocks, pair.canon);
              setCanonCut({ accepted: ran.accepted, reason: ran.reason });
              setWitnessCut({ accepted: ran.accepted, reason: ran.reason });
              setPair((p) => ({ ...p, canonStocks: ran.a, witnessStocks: ran.b }));
            }}
            onBurn={() => {
              const burned = commitBurn(pair.canonStocks, pair.witnessStocks);
              setCanonCut({ accepted: burned.accepted, reason: burned.reason });
              setWitnessCut({ accepted: burned.accepted, reason: burned.reason });
              setPair((p) => ({ ...p, canonStocks: burned.a, witnessStocks: burned.b }));
            }}
            onWash={() => {
              const washed = commitWash(pair.canonStocks, pair.witnessStocks);
              setCanonCut({ accepted: washed.accepted, reason: washed.reason });
              setWitnessCut({ accepted: washed.accepted, reason: washed.reason });
              setPair((p) => ({ ...p, canonStocks: washed.a, witnessStocks: washed.b }));
            }}
            onRoof={() => {
              const at = cellOf(view.lat, view.lon);
              const roofed = commitRoof(pair.canonCrust, pair.witnessCrust, pair.canonStocks, pair.witnessStocks, at.ix, at.iy);
              setCanonCut({ accepted: roofed.accepted, reason: roofed.reason });
              setWitnessCut({ accepted: roofed.accepted, reason: roofed.reason });
              setPair((p) => ({
                ...p,
                canonCrust: roofed.a,
                witnessCrust: roofed.b,
                canonStocks: roofed.aStocks,
                witnessStocks: roofed.bStocks,
              }));
            }}
            onRoad={() => {
              const at = cellOf(view.lat, view.lon);
              const laid = commitRoad(pair.canonCrust, pair.witnessCrust, pair.canonStocks, pair.witnessStocks, at.ix, at.iy);
              setCanonCut({ accepted: laid.accepted, reason: laid.reason });
              setWitnessCut({ accepted: laid.accepted, reason: laid.reason });
              setPair((p) => ({
                ...p,
                canonCrust: laid.a,
                witnessCrust: laid.b,
                canonStocks: laid.aStocks,
                witnessStocks: laid.bStocks,
              }));
            }}
            onBerm={() => {
              const at = cellOf(view.lat, view.lon);
              const built = commitBerm(pair.canonCrust, pair.witnessCrust, pair.canonStocks, pair.witnessStocks, at.ix, at.iy);
              setCanonCut({ accepted: built.accepted, reason: built.reason });
              setWitnessCut({ accepted: built.accepted, reason: built.reason });
              setPair((p) => ({
                ...p,
                canonCrust: built.a,
                witnessCrust: built.b,
                canonStocks: built.aStocks,
                witnessStocks: built.bStocks,
              }));
            }}
            onCollector={() => {
              const up = commitCollector(pair.canonStocks, pair.witnessStocks);
              setCanonCut({ accepted: up.accepted, reason: up.reason });
              setWitnessCut({ accepted: up.accepted, reason: up.reason });
              setPair((p) => ({ ...p, canonStocks: up.a, witnessStocks: up.b }));
            }}
            onRepair={() => {
              const fixed = commitRepair(pair.canonStocks, pair.witnessStocks);
              setCanonCut({ accepted: fixed.accepted, reason: fixed.reason });
              setWitnessCut({ accepted: fixed.accepted, reason: fixed.reason });
              setPair((p) => ({ ...p, canonStocks: fixed.a, witnessStocks: fixed.b }));
            }}
            onReactor={() => {
              const started = commitReactor(pair.canonStocks, pair.witnessStocks);
              setCanonCut({ accepted: started.accepted, reason: started.reason });
              setWitnessCut({ accepted: started.accepted, reason: started.reason });
              setPair((p) => ({ ...p, canonStocks: started.a, witnessStocks: started.b }));
            }}
            onHeat={() => {
              const warmed = commitHeat(pair.canonCrust, pair.witnessCrust, pair.canonStocks, pair.witnessStocks);
              setCanonCut({ accepted: warmed.accepted, reason: warmed.reason });
              setWitnessCut({ accepted: warmed.accepted, reason: warmed.reason });
              setPair((p) => ({ ...p, canonStocks: warmed.a, witnessStocks: warmed.b }));
            }}
            onDraw={() => {
              const drawn = commitCondenser(pair.canonStocks, pair.witnessStocks, pair.canon);
              setCanonCut({ accepted: drawn.accepted, reason: drawn.reason });
              setWitnessCut({ accepted: drawn.accepted, reason: drawn.reason });
              setPair((p) => ({ ...p, canonStocks: drawn.a, witnessStocks: drawn.b }));
            }}
            onRadiator={() => {
              const up = commitRadiator(pair.canonStocks, pair.witnessStocks);
              setCanonCut({ accepted: up.accepted, reason: up.reason });
              setWitnessCut({ accepted: up.accepted, reason: up.reason });
              setPair((p) => ({ ...p, canonStocks: up.a, witnessStocks: up.b }));
            }}
            climateAlbedoMilli={world.albedoMilli[selected]}
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
              The turn hash is the climate record, the crust record, and the stocks. Both clients take the same log, so the halves do not split.
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
  onDump,
  onPaint,
  onMine,
  onSplit,
  onSabatier,
  onBurn,
  onWash,
  onRoof,
  onRoad,
  onBerm,
  onCollector,
  onRepair,
  onReactor,
  onHeat,
  onDraw,
  onRadiator,
  climateAlbedoMilli,
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
  onDump: () => void;
  onPaint: () => void;
  onMine: () => void;
  onSplit: () => void;
  onSabatier: () => void;
  onBurn: () => void;
  onWash: () => void;
  onRoof: () => void;
  onRoad: () => void;
  onBerm: () => void;
  onCollector: () => void;
  onRepair: () => void;
  onReactor: () => void;
  onHeat: () => void;
  onDraw: () => void;
  onRadiator: () => void;
  climateAlbedoMilli: number;
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
          <dt className="text-xs text-muted">Tailings</dt>
          <dd className="font-mono text-xs">{formatKg(canon.tailingsKg)}</dd>
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
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onDump}>
        Return 1 cm of tailings
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onPaint}>
        Paint this kilometer
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onMine}>
        Mine 1 t ice
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onSplit}>
        Electrolyze 36 kg
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onSabatier}>
        Sabatier batch
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onBurn}>
        Burn 16 kg methane
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onWash}>
        Wash tanks
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onRoof}>
        Roof this kilometer
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onRoad}>
        Lay a road
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onBerm}>
        Raise a berm
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onCollector}>
        Raise a collector
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onRepair}>
        Repair the array
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onReactor}>
        Start the kilopower
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onHeat}>
        Heat the vessel
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onDraw}>
        Draw 1 kg from the column
      </button>
      <button type="button" className="mt-2 min-h-11 w-full rounded-sm border border-line px-3 text-sm text-fg" onClick={onRadiator}>
        Raise a radiator
      </button>
      <p className="mt-2 font-mono text-xs text-muted">
        ice {formatKg(stocks.iceKg)} · water {formatKg(stocks.waterKg)} · brine {formatKg(stocks.brineKg)} · O2 {formatKg(stocks.o2Kg)} · H2 {formatKg(stocks.h2Kg)} · CH4 {formatKg(stocks.ch4Kg)} · toxin {stocks.toxinMilli} · debt {stocks.debt ? "owed" : "clear"} · biomass {stocks.biomassG} g · collector {stocks.collector ? "up" : "down"} · health {stocks.healthMilli}/1000 · reactor {stocks.reactor ? "on" : "off"} · cabin +{stocks.cabinRiseK} K · column {stocks.drawnKg}/10000 kg · heat {stocks.heatKwh} kWh · radiator {stocks.radiator ? "up" : "down"}
      </p>
      <p className="mt-2 text-xs text-muted">
        Each sol takes 1 kg of oxygen and 3 kg of water. If either is short, the sol is owed and neither is spent. Dirty water is not split. Wash the tanks first. A roof costs 10,000 kWh that same sol. If the battery cannot pay, every roof comes down. Under a standing roof, with clean water and no debt, one gram of biomass grows and one kilogram of water is spent. The air mass does not move. A collector costs 30,000 kg of fines. On a stripping sol it returns a tenth of the particle mass that left this array's climate cell. Five grams per square meter per optical depth is an order of magnitude. A clear sol returns nothing. A stripping sol also takes 10/1000 off the array after that sol's power is banked. Repair spends 10,000 kg of fines to put 100/1000 back. Methane in the open loses 1 percent a sol, and at least 1 kg when the tank is smaller than 100 kg. Open water does the same. Open hydrogen loses 10 percent. Open oxygen loses 1 percent. A standing roof holds them. Heating that vessel costs 10,000 kWh per kelvin, up to 40 K above the yard. The climate cell does not move. Drawing water takes 1 kg and 50 kWh from a column of about 10,000 kg over this kilometer. At 10,000 kg the order refuses. The air mass does not move. About 40 kWh of each 200 kWh split does not stay in the hydrogen. Past 80 kWh the cell waits. The open yard sheds 40 kWh a sol. A radiator costs 20,000 kg of fines and sheds 200.
      </p>
      <p className="mt-2 text-xs text-muted">
        One kilometer, two meters down, 3,000,000,000 kg at 1,500 kg/m³. The cut costs {formatKwh(CUT_KWH)}. It will not cut a kilometer that has a roof. A mill batch is 100,000,000 kg of spoil and 1,000,000 kWh. Five percent is fines. The other ninety-five percent stays as tailings. One centimeter of that fill is 15,000,000 kg back in the hole, and it does not free a second cut. Paint is 50,000 kg of fines on this kilometer, albedo 0.10. This cell's albedo stays {(climateAlbedoMilli / 1000).toFixed(3)}. The coat is {paintOf(canon, at.ix, at.iy) > 0 ? "on" : "not on"} this kilometer. Floor pressure moves by {delta.toFixed(2)} Pa.
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
