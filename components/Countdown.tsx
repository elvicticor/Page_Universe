"use client";

import { useEffect, useState } from "react";

/** Cuenta regresiva T− hasta una fecha ISO. Renderiza vacío en el servidor para evitar desajustes. */
export default function Countdown({ to, compact = false }: { to: string; compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now == null) return <span className="font-mono tabular-nums text-faint">T− --:--:--</span>;

  const diff = new Date(to).getTime() - now;
  const past = diff < 0;
  const s = Math.floor(Math.abs(diff) / 1000);
  const d = Math.floor(s / 86400);
  const hh = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");

  if (compact) return <span className="font-mono tabular-nums">{`T${past ? "+" : "−"} ${d > 0 ? `${d}d ` : ""}${hh}:${mm}:${ss}`}</span>;
  return (
    <span className="flex items-baseline gap-3 font-mono tabular-nums">
      <span className="text-faint">T{past ? "+" : "−"}</span>
      {[
        [String(d), "días"],
        [hh, "h"],
        [mm, "min"],
        [ss, "s"],
      ].map(([v, u]) => (
        <span key={u} className="flex items-baseline gap-1">
          <span className="text-3xl text-ink">{v}</span>
          <span className="text-xs text-dim">{u}</span>
        </span>
      ))}
    </span>
  );
}
