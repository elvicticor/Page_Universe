"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { coord, utcDay } from "@/lib/simulation";
import type { Neo } from "@/lib/nasa";

const SIZE = 640;
const C = SIZE / 2;
const R_MIN = 34;
const R_MAX = C - 36;
const LD_MIN = 0.3;
const LD_MAX = 250;

const fmt = (v: number, d: number) => v.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });

const rOf = (ld: number) => {
  const t = (Math.log10(Math.min(Math.max(ld, LD_MIN), LD_MAX)) - Math.log10(LD_MIN)) / (Math.log10(LD_MAX) - Math.log10(LD_MIN));
  return coord(R_MIN + t * (R_MAX - R_MIN));
};

export default function AsteroidRadar({ neos, initialTime }: { neos: Neo[]; initialTime: number }) {
  const [pinned, setPinned] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [onlyHazard, setOnlyHazard] = useState(false);
  const [sort, setSort] = useState<"fecha" | "distancia" | "tamaño">("fecha");

  const start = utcDay(initialTime);
  const [now, setNow] = useState(initialTime);
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) setNow(Date.now()); }, 60000);
    return () => clearInterval(id);
  }, []);
  const WEEK = 7 * 86400000;

  const points = useMemo(
    () =>
      neos.map((n) => {
        const a = ((n.approach - start) / WEEK) * Math.PI * 2 - Math.PI / 2;
        const r = rOf(n.lunar);
        return { ...n, x: coord(C + r * Math.cos(a)), y: coord(C + r * Math.sin(a)), dot: 2.5 + Math.sqrt(n.diameterM) / 3.2 };
      }),
    [neos, start, WEEK],
  );

  const shown = points.filter((p) => !onlyHazard || p.hazardous);
  const list = [...shown].sort((a, b) =>
    sort === "fecha" ? a.approach - b.approach : sort === "distancia" ? a.lunar - b.lunar : b.diameterM - a.diameterM,
  );
  const selected = pinned ?? active;
  const current = shown.find((p) => p.id === selected);
  const days = Array.from({ length: 7 }, (_, i) => new Date(start + i * 86400000));
  const nowAngle = ((now - start) / WEEK) * Math.PI * 2 - Math.PI / 2;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="panel relative rounded-3xl p-2 sm:p-6">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto block w-full max-w-[640px]" role="group" aria-label="Radar de asteroides cercanos a la Tierra">
          <defs>
            <radialGradient id="earthGlow">
              <stop offset="0%" stopColor="#7fd6ff" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#2f6bff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2f6bff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7fd6ff" stopOpacity="0" />
              <stop offset="100%" stopColor="#7fd6ff" stopOpacity="0.16" />
            </linearGradient>
          </defs>

          {/* Anillos de distancia */}
          {[1, 10, 100].map((ld) => (
            <g key={ld}>
              <circle cx={C} cy={C} r={rOf(ld)} fill="none" stroke="#1d2236" strokeDasharray={ld === 1 ? "0" : "3 5"} />
              <text x={coord(C + 6)} y={C - rOf(ld) - 5} fill="#565c70" fontSize="12" fontFamily="var(--font-mono)">
                {ld} DL{ld === 1 ? " · órbita lunar" : ""}
              </text>
            </g>
          ))}
          <circle cx={C} cy={C} r={R_MAX} fill="none" stroke="#1d2236" />

          {/* Días de la semana en el borde */}
          {days.map((d, i) => {
            const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
            const a2 = ((i + 0.5) / 7) * Math.PI * 2 - Math.PI / 2;
            return (
              <g key={i}>
                <line x1={coord(C + R_MIN * Math.cos(a))} y1={coord(C + R_MIN * Math.sin(a))} x2={coord(C + (R_MAX + 6) * Math.cos(a))} y2={coord(C + (R_MAX + 6) * Math.sin(a))} stroke="#1d2236" />
                <text
                  x={coord(C + (R_MAX + 20) * Math.cos(a2))}
                  y={coord(C + (R_MAX + 20) * Math.sin(a2))}
                  fill={i === 0 ? "#ffb454" : "#8b91a3"}
                  fontSize="12"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  letterSpacing="0.1em"
                >
                  {i === 0 ? "HOY" : d.toLocaleDateString("es-ES", { timeZone: "UTC", weekday: "short", day: "numeric" }).toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Barrido del radar */}
          <g className="radar-sweep">
            <path d={`M ${C} ${C} L ${C + R_MAX} ${C} A ${R_MAX} ${R_MAX} 0 0 0 ${C + R_MAX * Math.cos(-0.5)} ${C + R_MAX * Math.sin(-0.5)} Z`} fill="url(#sweep)" />
          </g>

          {/* Ahora */}
          <line x1={C} y1={C} x2={coord(C + R_MAX * Math.cos(nowAngle))} y2={coord(C + R_MAX * Math.sin(nowAngle))} stroke="#ffb454" strokeOpacity="0.5" strokeDasharray="2 4" />

          {/* La Tierra */}
          <circle cx={C} cy={C} r={26} fill="url(#earthGlow)" />
          <circle cx={C} cy={C} r={9} fill="#7fd6ff" />

          {/* Asteroides */}
          {shown.map((p, i) => {
            const on = selected === p.id;
            const col = p.hazardous ? "#ff6b5b" : "#ece9e2";
            return (
              <motion.g
                key={p.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: selected && !on ? 0.3 : 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.012, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformOrigin: `${p.x}px ${p.y}px`, cursor: "pointer" }}
                onMouseEnter={() => setActive(p.id)}
                onMouseLeave={() => setActive(null)}
                role="button"
                tabIndex={0}
                aria-label={`${p.name}, ${fmt(p.lunar, 1)} distancias lunares`}
                aria-pressed={pinned === p.id}
                onFocus={() => setActive(p.id)}
                onBlur={() => setActive(null)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPinned(pinned === p.id ? null : p.id); } if (e.key === "Escape") { setPinned(null); setActive(null); } }}
                onClick={() => setPinned(pinned === p.id ? null : p.id)}
              >
                {on && <line x1={C} y1={C} x2={p.x} y2={p.y} stroke={col} strokeOpacity="0.6" />}
                <circle cx={p.x} cy={p.y} r={p.dot + 6} fill={col} fillOpacity={on ? 0.18 : 0} />
                <circle cx={p.x} cy={p.y} r={p.dot} fill={col} fillOpacity={p.hazardous ? 0.9 : 0.7} />
              </motion.g>
            );
          })}
        </svg>

        <AnimatePresence>
          {current && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="panel relative mx-2 mb-4 rounded-xl p-4"
            >
              <p className="label" style={{ color: current.hazardous ? "#ff6b5b" : undefined }}>
                {current.hazardous ? "Potencialmente peligroso" : "Objeto cercano"}
              </p>
              <div className="flex items-center justify-between gap-3"><p className="mt-1 font-display text-2xl">{current.name}</p><button className="label p-2" onClick={() => {setPinned(null); setActive(null);}}>Cerrar</button></div>
              <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
                <dt className="text-dim">Distancia</dt>
                <dd>{fmt(current.lunar, 2)} DL</dd>
                <dt className="text-dim">Kilómetros</dt>
                <dd>{Math.round(current.km).toLocaleString("es-ES")}</dd>
                <dt className="text-dim">Diámetro</dt>
                <dd>~{Math.round(current.diameterM).toLocaleString("es-ES")} m</dd>
                <dt className="text-dim">Velocidad</dt>
                <dd>{fmt(current.kmPerSec, 1)} km/s</dd>
                <dt className="text-dim">Paso</dt>
                <dd>{new Date(current.approach).toLocaleString("es-ES", { timeZone: "UTC", weekday: "short", hour: "2-digit", minute: "2-digit" })}</dd>
              </dl><a className="mt-3 inline-block text-sm text-ion underline" href={current.url} target="_blank" rel="noreferrer">Ficha NASA/JPL ↗</a>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="label mt-2 flex flex-wrap justify-center gap-5 pb-2">
          <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-ink/70" /> Objeto cercano</span>
          <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-alert" /> Potencialmente peligroso</span>
          <span>Ángulo = día UTC · Tamaño = diámetro · Distancia logarítmica</span>
        </div>
      </div>

      <div className="panel flex max-h-[760px] flex-col rounded-3xl">
        <div className="flex flex-wrap items-center gap-2 border-b hairline p-4">
          {(["fecha", "distancia", "tamaño"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className={`rounded-full px-3 py-1 font-mono text-[11px] capitalize ${sort === s ? "bg-ink text-void" : "bg-white/5 text-dim hover:text-ink"}`}
            >
              {s}
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 font-mono text-[11px] text-dim">
            <input type="checkbox" checked={onlyHazard} onChange={(e) => { setOnlyHazard(e.target.checked); setPinned(null); setActive(null); }} className="accent-[#ff6b5b]" />
            Solo potencialmente peligrosos
          </label>
        </div>
        {list.length === 0 && <p className="p-6 text-sm text-dim">No hay objetos que coincidan con este filtro.</p>}
        <ul className="overflow-y-auto">
          {list.map((n) => (
            <li key={n.id} onMouseEnter={() => setActive(n.id)} onMouseLeave={() => setActive(null)}>
              <button
                onClick={() => setPinned(pinned === n.id ? null : n.id)}
                onFocus={() => setActive(n.id)}
                onBlur={() => setActive(null)}
                aria-pressed={pinned === n.id}
                className={`flex w-full text-left items-center gap-3 border-b hairline px-4 py-3 transition-colors ${selected === n.id ? "bg-white/5" : ""}`}
              >
                <span className={`size-2 shrink-0 rounded-full ${n.hazardous ? "bg-alert" : "bg-ink/50"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{n.name}</span>
                  <span className="font-mono text-[11px] text-faint">
                    {new Date(n.approach).toLocaleDateString("es-ES", { timeZone: "UTC", weekday: "short", day: "numeric" })} · ~{Math.round(n.diameterM)} m
                  </span>
                </span>
                <span className="text-right font-mono text-xs tabular-nums">
                  {fmt(n.lunar, 1)} <span className="text-faint">DL</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
