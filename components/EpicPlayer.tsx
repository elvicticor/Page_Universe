"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { EpicImage } from "@/lib/nasa";

/** Reproduce en bucle las fotos del día de la cámara EPIC: se ve la Tierra girar. */
export default function EpicPlayer({ images }: { images: EpicImage[] }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<Record<string, "loaded" | "error">>({});
  const [visible, setVisible] = useState(true);
  const reduce = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const img = images[i] ?? images[0];
  const next = images.length ? (i + 1) % images.length : 0;
  useEffect(() => { setI(0); setPlaying(false); setStatus({}); }, [images]);
  useEffect(() => { if (reduce) setPlaying(false); }, [reduce]);
  useEffect(() => {
    let intersecting = true;
    const update = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); });
    if (host.current) observer.observe(host.current);
    update(); document.addEventListener("visibilitychange", update);
    return () => {observer.disconnect(); document.removeEventListener("visibilitychange", update);};
  }, []);
  // Solo se descarga el fotograma actual y el siguiente, nunca toda la secuencia de golpe.
  useEffect(() => {
    if (!visible || !images.length) return;
    let active = true;
    const loaders = [...new Set([i, next])].map((index) => {
      const src = images[index]?.src;
      if (!src || status[src]) return null;
      const image = new Image();
      const finish = (result: "loaded" | "error") => { if (active) setStatus((old) => ({ ...old, [src]: result })); };
      image.onload = () => finish("loaded"); image.onerror = () => finish("error"); image.src = src;
      return image;
    });
    return () => { active = false; loaders.forEach((image) => { if (image) image.onload = image.onerror = null; }); };
  }, [i, next, images, visible, status]);
  useEffect(() => {
    if (!playing || !visible || !img || !status[img.src] || !status[images[next]?.src]) return;
    if (images.every((image) => status[image.src] === "error")) { setPlaying(false); return; }
    const timer = setTimeout(() => setI(next), 900);
    return () => clearTimeout(timer);
  }, [playing, visible, img, images, next, status]);
  if (!img) return <p className="panel rounded-2xl p-6">No hay imágenes disponibles.</p>;
  const ready = status[img.src] === "loaded";
  const time = new Date(img.date.replace(" ", "T") + "Z");

  return (
    <div ref={host} className="panel grid overflow-hidden rounded-3xl md:grid-cols-[minmax(0,620px)_1fr]">
      <div className="relative aspect-square bg-black">
        {ready && <img key={img.src} src={img.src} alt={`La Tierra fotografiada por la cámara EPIC desde DSCOVR · ${img.date} UTC`} className="absolute inset-0 size-full object-contain" />}
        {!ready && <div role="status" className="absolute inset-0 grid place-items-center p-6 text-center text-dim">{status[img.src] === "error" ? "No se pudo cargar este fotograma. Selecciona otro o vuelve a intentarlo." : "Cargando fotograma…"}</div>}
        {status[img.src] === "error" && <button className="absolute bottom-6 left-6 rounded-full border hairline px-4 py-2 text-sm" onClick={() => setStatus((old) => { const copy = {...old}; delete copy[img.src]; return copy; })}>Reintentar imagen</button>}
      </div>
      <div className="flex flex-col p-6">
        <p className="label">Fotograma {i + 1} de {images.length}</p>
        <p className="mt-2 font-mono text-3xl tabular-nums">
          {time.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} <span className="text-base text-dim">UTC</span>
        </p>
        <p className="font-mono text-sm text-dim">{time.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</p>

        <dl className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <dt className="label">Centro lat</dt>
            <dd className="font-mono">{img.centroid_coordinates.lat.toLocaleString("es-ES", { maximumFractionDigits: 2 })}°</dd>
          </div>
          <div>
            <dt className="label">Centro lon</dt>
            <dd className="font-mono">{img.centroid_coordinates.lon.toLocaleString("es-ES", { maximumFractionDigits: 2 })}°</dd>
          </div>
        </dl>

        <input
          type="range"
          min={0}
          max={images.length - 1}
          value={i}
          onChange={(e) => {
            setPlaying(false);
            setI(Number(e.target.value));
          }}
          className="mt-8 w-full accent-[#7fd6ff]"
          aria-label="Elegir fotograma"
        />
        <button
          disabled={images.length < 2}
          aria-pressed={playing}
          onClick={() => setPlaying((p) => !p)}
          className="label mt-4 self-start rounded-full border hairline px-4 py-2 hover:text-ink"
        >
          {playing ? "Pausar" : "Reproducir"}
        </button>
        <p className="mt-auto pt-6 text-xs text-faint">
          DSCOVR orbita el punto de Lagrange L1, entre la Tierra y el Sol, así que siempre ve el hemisferio de día.
        </p>
      </div>
    </div>
  );
}
