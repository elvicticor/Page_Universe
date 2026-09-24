"use client";

import { coord } from "@/lib/simulation";
import { useState } from "react";
import type { Flare } from "@/lib/nasa";

import { kpColor, flux } from "@/lib/space-weather";

export function KpChart({ data }: { data: { time_tag: string; Kp: number }[] }) {
  const [detail, setDetail] = useState("Selecciona una barra para ver su medición en UTC.");
  const W = 800, H = 240, P = 34;
  const bw = (W - P) / Math.max(data.length, 1);
  return (<>
    <svg viewBox={`0 -12 ${W} ${H + 42}`} className="w-full" role="group" aria-label="Índice Kp de los últimos días">
      {[0, 3, 5, 7, 9].map((k) => (
        <g key={k}>
          <line x1={P} x2={W} y1={H - (k / 9) * H} y2={H - (k / 9) * H} stroke="#1d2236" strokeDasharray={k === 5 ? "0" : "2 4"} />
          <text x={0} y={H - (k / 9) * H + 4} fill="#949aaf" fontSize="14" fontFamily="var(--font-mono)">
            {k}
          </text>
        </g>
      ))}
      <text x={W - 4} y={H - (5 / 9) * H - 6} fill="#ff6b5b" fontSize="14" textAnchor="end" fontFamily="var(--font-mono)">
        umbral de tormenta
      </text>
      {data.map((d, i) => {
        const h = Math.max((d.Kp / 9) * H, 2);
        // Sin etiqueta para el último día: no cabe en el borde derecho.
        const newDay = d.time_tag.slice(11, 13) === "00" && i < data.length - 4;
        return (
          <g key={d.time_tag} role="button" tabIndex={0} aria-label={`${d.time_tag} UTC · Kp ${d.Kp}`} onFocus={() => setDetail(`${d.time_tag.replace("T", " ")} UTC · Kp ${d.Kp.toLocaleString("es-ES")}`)} onClick={() => setDetail(`${d.time_tag.replace("T", " ")} UTC · Kp ${d.Kp.toLocaleString("es-ES")}`)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") {e.preventDefault(); setDetail(`${d.time_tag} UTC · Kp ${d.Kp.toLocaleString("es-ES")}`);} }}>
            <rect x={P + i * bw + 1} y={H - h} width={Math.max(bw - 2, 1)} height={h} rx={1.5} fill={kpColor(d.Kp)} fillOpacity={0.85}>
              <title>{`${d.time_tag.replace("T", " ").slice(0, 16)} UTC · Kp ${d.Kp}`}</title>
            </rect>
            {newDay && (
              <text x={P + i * bw} y={H + 22} fill="#8b91a3" fontSize="14" fontFamily="var(--font-mono)">
                {new Date(d.time_tag + "Z").toLocaleDateString("es-ES", { timeZone: "UTC", day: "numeric", month: "short" })}
              </text>
            )}
          </g>
        );
      })}
    </svg><p role="status" className="mt-4 min-h-10 text-sm text-dim">{detail}</p></>
  );
}

export function FlareChart({ flares, end }: { flares: Flare[]; end: number }) {
  const [detail, setDetail] = useState("Selecciona una fulguración para ver su intensidad y fecha.");
  const W = 800, H = 260, P = 34;
  const start = end - 30 * 86400000;
  const lo = Math.log10(1e-7), hi = Math.log10(1e-3);
  const y = (f: number) => coord(Math.max(4, Math.min(H, H - ((Math.log10(f) - lo) / (hi - lo)) * H)));
  const x = (t: string) => coord(Math.max(P, Math.min(W - 8, P + ((new Date(t).getTime() - start) / (end - start)) * (W - P))));
  const bands: [string, number][] = [["B", 1e-7], ["C", 1e-6], ["M", 1e-5], ["X", 1e-4]];
  return (<>
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full" role="group" aria-label="Fulguraciones solares de los últimos 30 días">
      {bands.map(([l, f]) => (
        <g key={l}>
          <line x1={P} x2={W} y1={y(f)} y2={y(f)} stroke="#1d2236" strokeDasharray="2 4" />
          <text x={4} y={y(f) - 4} fill={l === "X" ? "#ff6b5b" : l === "M" ? "#ffb454" : "#949aaf"} fontSize="15" fontFamily="var(--font-mono)">
            {l}
          </text>
        </g>
      ))}
      {[0, 7, 14, 21, 28].map((d) => (
        <text key={d} x={P + (d / 30) * (W - P)} y={H + 22} fill="#8b91a3" fontSize="14" fontFamily="var(--font-mono)">
          {new Date(start + d * 86400000).toLocaleDateString("es-ES", { timeZone: "UTC", day: "numeric", month: "short" })}
        </text>
      ))}
      {flares.map((f) => {
        const v = flux(f.classType);
        const col = f.classType[0] === "X" ? "#ff6b5b" : f.classType[0] === "M" ? "#ffb454" : "#8b91a3";
        return (
          <g key={f.flrID} role="button" tabIndex={0} aria-label={`${f.classType} · ${f.peakTime}`} onFocus={() => setDetail(`${f.classType} · ${f.peakTime.replace("T", " ").replace("Z", "")} UTC`)} onClick={() => setDetail(`${f.classType} · ${f.peakTime.replace("T", " ").replace("Z", "")} UTC`)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") {e.preventDefault(); setDetail(`${f.classType} · ${f.peakTime.replace("T", " ").replace("Z", "")} UTC`);} }}>
            <circle cx={x(f.peakTime)} cy={y(v)} r={12} fill="transparent" />
            <line x1={x(f.peakTime)} x2={x(f.peakTime)} y1={H} y2={y(v)} stroke={col} strokeOpacity={0.35} />
            <circle cx={x(f.peakTime)} cy={y(v)} r={f.classType[0] === "X" ? 6 : 4} fill={col}>
              <title>{`${f.classType} · ${new Date(f.peakTime).toLocaleString("es-ES", { timeZone: "UTC" })}${f.activeRegionNum ? ` · región ${f.activeRegionNum}` : ""}`}</title>
            </circle>
          </g>
        );
      })}
    </svg><p role="status" className="mt-4 min-h-10 text-sm text-dim">{detail}</p></>
  );
}

