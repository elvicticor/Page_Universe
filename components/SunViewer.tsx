"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const CHANNELS = [
  { id: "0193", label: "193 Å", note: "Corona y agujeros coronales (1,2 millones °C)" },
  { id: "0171", label: "171 Å", note: "Bucles magnéticos de la corona tranquila" },
  { id: "0304", label: "304 Å", note: "Cromosfera y protuberancias" },
  { id: "0131", label: "131 Å", note: "Plasma de las fulguraciones (10 millones °C)" },
  { id: "HMIIC", label: "Visible", note: "Fotosfera: aquí se ven las manchas solares" },
  { id: "HMIB", label: "Magnético", note: "Magnetograma: polaridad norte (blanco) y sur (negro)" },
];

/** Imágenes más recientes del Solar Dynamics Observatory; se refrescan cada 15 minutos. */
export default function SunViewer() {
  const [ch, setCh] = useState(0);
  const [stamp, setStamp] = useState(0);
  const [loadedSrc, setLoadedSrc] = useState("");
  const [failedSrc, setFailedSrc] = useState("");
  useEffect(() => {
    const update = () => { if (!document.hidden) setStamp(Math.floor(Date.now() / 900000)); };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);
  const c = CHANNELS[ch];
  const src = `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_${c.id}.jpg?t=${stamp}`;

  return (
    <div className="panel grid overflow-hidden rounded-3xl md:grid-cols-[minmax(0,620px)_1fr]">
      <div className="relative aspect-square bg-black">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={src}
            src={src}
            onLoad={() => setLoadedSrc(src)}
            onError={() => setFailedSrc(src)}
            alt={`El Sol ahora en ${c.label}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: loadedSrc === src ? 1 : 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 size-full object-contain"
          />
        </AnimatePresence>
        {loadedSrc !== src && <p role="status" className="absolute inset-0 grid place-items-center p-6 text-center text-dim">{failedSrc === src ? "No se pudo cargar la imagen del Sol. Prueba otro canal." : "Cargando imagen solar…"}</p>}
        <p className="label absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1">
          <span className="live-dot" /> SDO · última imagen
        </p>
      </div>
      <div className="flex flex-col p-6">
        <p className="label">Longitud de onda</p>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {CHANNELS.map((x, i) => (
            <button
              key={x.id}
              aria-pressed={i === ch}
              onClick={() => setCh(i)}
              className={`rounded-lg px-3 py-2 text-left font-mono text-xs transition-colors ${
                i === ch ? "bg-sol text-void" : "bg-white/5 text-dim hover:text-ink"
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <p className="mt-6 text-sm text-dim">{c.note}</p>
        <p className="mt-auto pt-6 text-xs text-faint">
          El Solar Dynamics Observatory fotografía el Sol cada pocos segundos desde una órbita geosíncrona.
        </p>
      </div>
    </div>
  );
}
