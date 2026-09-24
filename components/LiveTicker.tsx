"use client";

import { useLiveData } from "./useLiveData";

type Item = { k: string; v: string; tone?: "sol" | "ion" | "alert" | "aurora" };

const tones = { sol: "text-sol", ion: "text-ion", alert: "text-alert", aurora: "text-aurora" };

/** Cinta de datos en vivo: combina valores del servidor con otros que se refrescan en el navegador. */
export default function LiveTicker({ items }: { items: Item[] }) {
  const issState = useLiveData<{ latitude: number; longitude: number; velocity: number; altitude: number; stale: boolean }>("/api/iss", 5000);
  const kpState = useLiveData<{ kp: number; stale: boolean }>("/api/kp", 60000);
  const iss = issState.data, kp = kpState.data?.kp;
  const issOld = issState.error || issState.data?.stale;
  const kpOld = kpState.error || kpState.data?.stale;
  const f = (n: number, d = 1) => n.toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d });
  const live: Item[] = [
    ...(iss
      ? [
          { k: issOld ? "ISS · último dato" : "ISS lat/lon", v: `${f(iss.latitude)}°, ${f(iss.longitude)}°`, tone: "sol" as const },
          { k: "ISS velocidad", v: `${f(iss.velocity, 0)} km/h` },
          { k: "ISS altitud", v: `${f(iss.altitude)} km` },
        ]
      : []),
    ...(kp != null ? [{ k: kpOld ? "Kp · último dato" : "Kp estimado", v: f(kp, 2), tone: (kp >= 5 ? "alert" : kp >= 4 ? "sol" : "aurora") as Item["tone"] }] : []),
  ];
  const all = [...live, ...items, ...(!iss && issState.error ? [{ k: "ISS", v: "Sin conexión" }] : []), ...(kp == null && kpState.error ? [{ k: "Kp", v: "Sin conexión" }] : [])];

  return (
    <div className="ticker relative overflow-hidden border-y hairline bg-void/60 py-3 backdrop-blur [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="marquee flex w-max gap-10 whitespace-nowrap">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex gap-10" aria-hidden={dup === 1}>
            {all.map((it, i) => (
              <span key={i} className="flex items-baseline gap-2">
                <span className="label">{it.k}</span>
                <span className={`font-mono text-sm tabular-nums ${it.tone ? tones[it.tone] : "text-ink"}`}>{it.v}</span>
                <span className="ml-8 text-faint">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
