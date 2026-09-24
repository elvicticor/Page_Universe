"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { degreesLat, degreesLong, eciToGeodetic, gstime, propagate, twoline2satrec, type SatRec } from "satellite.js";
import SceneCanvas from "./SceneCanvas";
import { useReducedMotion } from "motion/react";
import { useLiveData } from "../useLiveData";
import Earth from "./Earth";
import { latLonToVec3, subsolarPoint } from "@/lib/astro";

const R = 5;
const EARTH_KM = 6371;
/** La altitud se exagera un poco para que la órbita se despegue visualmente del globo. */
const altToR = (km: number) => R * (1 + (km / EARTH_KM) * 1.6);

type Geo = { lat: number; lon: number; alt: number; speed: number };

function locate(sat: SatRec, date: Date): Geo | null {
  const pv = propagate(sat, date);
  if (!pv || typeof pv.position === "boolean" || !pv.position) return null;
  const g = eciToGeodetic(pv.position, gstime(date));
  const v = pv.velocity && typeof pv.velocity !== "boolean" ? pv.velocity : { x: 0, y: 0, z: 0 };
  return {
    lat: degreesLat(g.latitude),
    lon: degreesLong(g.longitude),
    alt: g.height,
    speed: Math.hypot(v.x, v.y, v.z) * 3600,
  };
}

function sunVector(date: Date) {
  const s = subsolarPoint(date);
  return new THREE.Vector3(...latLonToVec3(s.lat, s.lon, 1)).normalize();
}

/** Traza la órbita desde 45 min atrás hasta 95 min adelante, en el marco que gira con la Tierra. */
function orbitPath(sat: SatRec, now: Date) {
  const past: [number, number, number][] = [];
  const future: [number, number, number][] = [];
  for (let m = -45; m <= 95; m += 0.5) {
    const g = locate(sat, new Date(now.getTime() + m * 60000));
    if (!g) continue;
    (m <= 0 ? past : future).push(latLonToVec3(g.lat, g.lon, altToR(g.alt)));
  }
  return { past, future };
}

const earthSphere = new THREE.Sphere(new THREE.Vector3(), R);

function Scene({
  sat,
  follow,
  onTick,
  label,
  onManual,
}: {
  sat: SatRec;
  follow: boolean;
  onTick: (g: Geo) => void;
  label: RefObject<HTMLDivElement | null>;
  onManual: () => void;
}) {
  const reduce = useReducedMotion();
  const sunUpdate = useRef(0);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const sunDir = useMemo(() => sunVector(new Date()), []);
  const light = useRef<THREE.DirectionalLight>(null);
  const iss = useRef<THREE.Group>(null);
  const [path, setPath] = useState(() => orbitPath(sat, new Date()));
  const { camera, size } = useThree();
  const lastTick = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const ray = useMemo(() => new THREE.Ray(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) setPath(orbitPath(sat, new Date())); }, 30000);
    return () => clearInterval(id);
  }, [sat]);

  useFrame(({ clock }, dt) => {
    const now = new Date();
    const g = locate(sat, now);
    if (!g) return;
    const p = latLonToVec3(g.lat, g.lon, altToR(g.alt));
    iss.current?.position.set(...p);
    if (now.getTime() - sunUpdate.current > 60000) {
      const sun = subsolarPoint(now); sunDir.set(...latLonToVec3(sun.lat, sun.lon, 1)).normalize(); sunUpdate.current = now.getTime();
    }
    light.current?.position.copy(sunDir).multiplyScalar(50);

    if (follow) {
      tmp.set(...p).normalize().multiplyScalar(19);
      camera.position.lerp(tmp, reduce ? 1 : 1 - Math.exp(-2.5 * Math.min(dt, 0.1)));
    }

    // Etiqueta DOM proyectada a pantalla; se oculta si la Tierra tapa a la ISS.
    const el = label.current;
    if (el) {
      tmp.set(...p);
      const dist = camera.position.distanceTo(tmp);
      ray.set(camera.position, direction.copy(tmp).sub(camera.position).normalize());
      const blocked = ray.intersectSphere(earthSphere, hit) !== null && camera.position.distanceTo(hit) < dist - 0.05;
      tmp.project(camera);
      el.style.visibility = blocked || tmp.z > 1 ? "hidden" : "visible";
      el.style.transform = `translate(-50%, -150%) translate(${((tmp.x + 1) / 2) * size.width}px, ${((1 - tmp.y) / 2) * size.height}px)`;
    }
    if (clock.elapsedTime - lastTick.current > 1) {
      lastTick.current = clock.elapsedTime;
      onTick(g);
    }
  });

  return (
    <>
      <ambientLight intensity={0.05} />
      <directionalLight ref={light} intensity={2.4} />
      <Stars radius={160} depth={60} count={2500} factor={4} fade speed={reduce ? 0 : 0.4} />
      <Earth radius={R} sunDir={sunDir} />
      {path.past.length > 1 && <Line points={path.past} color="#7fd6ff" lineWidth={1.4} transparent opacity={0.35} />}
      {path.future.length > 1 && (
        <Line points={path.future} color="#ffb454" lineWidth={1.6} dashed dashSize={0.18} gapSize={0.12} transparent opacity={0.85} />
      )}
      <group ref={iss}>
        <mesh>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#ffb454" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      </group>
      <OrbitControls onStart={onManual} enablePan={false} minDistance={7} maxDistance={40} enableDamping />
    </>
  );
}

type ApiIss = { visibility: string; footprint: number; latitude: number; longitude: number; timestamp: number; observedAt: string; stale: boolean };

export default function IssExplorer() {
  const [sat, setSat] = useState<SatRec | null>(null);
  const [error, setError] = useState(false);
  const [geo, setGeo] = useState<Geo | null>(null);
  const live = useLiveData<ApiIss>("/api/iss", 5000);
  const api = live.data;
  const tle = useLiveData<{ line1: string; line2: string }>("/api/tle", 3600000);
  const [follow, setFollow] = useState(false);
  const label = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tle.data) return;
    try {
      const parsed = twoline2satrec(tle.data.line1, tle.data.line2);
      if (!locate(parsed, new Date())) throw new Error("Órbita no válida");
      setSat(parsed); setError(false);
    } catch { setError(true); }
  }, [tle.data]);

  const fmt = (n: number, d = 2) => n.toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="panel relative h-[62vh] min-h-[420px] overflow-hidden rounded-3xl">
        {sat ? (
          <SceneCanvas camera={{ position: [0, 4, 19], fov: 45 }} dpr={[1, 2]}>
              <Scene sat={sat} follow={follow} onTick={setGeo} label={label} onManual={() => setFollow(false)} />
          </SceneCanvas>
        ) : (
          <div className="grid h-full place-items-center text-dim">
            {error || tle.error ? "No se pudo obtener la órbita de la ISS. Se reintentará automáticamente." : <span className="label animate-pulse">Calculando órbita…</span>}
          </div>
        )}
        <div
          ref={label}
          aria-hidden
          style={{ visibility: "hidden" }}
          className="pointer-events-none absolute top-0 left-0 whitespace-nowrap rounded-full border border-sol/50 bg-void/80 px-2 py-0.5 font-mono text-[10px] tracking-widest text-sol will-change-transform"
        >
          ISS
        </div>
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <button
            aria-pressed={follow}
            onClick={() => setFollow((f) => !f)}
            className={`label rounded-full border px-3 py-1.5 transition-colors ${
              follow ? "border-sol/60 bg-sol/10 text-sol" : "hairline bg-void/60 hover:text-ink"
            }`}
          >
            {follow ? "Siguiendo a la ISS" : "Seguir a la ISS"}
          </button>
        </div>
        <div className="label absolute right-4 bottom-4 hidden gap-4 sm:flex">
          <span className="flex items-center gap-2"><i className="h-px w-5 bg-ion/60" /> Pasado 45 min</span>
          <span className="flex items-center gap-2"><i className="h-px w-5 border-t border-dashed border-sol" /> Próxima órbita</span>
        </div>
      </div>

      <aside className="panel flex flex-col rounded-3xl p-6">
        <p className="label flex items-center gap-2">
          <span className={live.error || api?.stale ? "size-2 rounded-full bg-sol" : "live-dot"} /> {live.error || api?.stale ? "Últimos datos · sin actualizar" : "Posición calculada · SGP4"}
        </p>
        <p className="mt-3 text-xs text-dim">{api ? `Observación externa: ${new Date(api.observedAt).toLocaleTimeString("es-ES", { timeZone: "UTC" })} UTC` : "Esperando observación externa…"}{tle.error ? " · No se pudo renovar la órbita" : ""}</p>
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
          <Stat label="Latitud" value={geo ? `${fmt(geo.lat)}°` : "—"} />
          <Stat label="Longitud" value={geo ? `${fmt(geo.lon)}°` : "—"} />
          <Stat label="Altitud" value={geo ? `${fmt(geo.alt, 1)} km` : "—"} />
          <Stat label="Velocidad" value={geo ? `${fmt(geo.speed, 0)} km/h` : "—"} />
          <Stat
            label="Iluminación"
            value={api ? (api.visibility === "daylight" ? "Al sol" : "En sombra") : "—"}
            accent={api?.visibility === "daylight" ? "text-sol" : "text-ion"}
          />
          <Stat label="Huella visible" value={api ? `${fmt(api.footprint, 0)} km` : "—"} />
        </dl>
        <p className="mt-auto pt-8 text-sm leading-relaxed text-dim">
          Da una vuelta a la Tierra cada ~92 minutos: ve unos 16 amaneceres al día. La posición se calcula en tu navegador
          con el modelo SGP4 y la iluminación se consulta cada 5 s en wheretheiss.at. La órbita se renueva cada hora.
        </p>
      </aside>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className={`mt-1 font-mono text-lg whitespace-nowrap tabular-nums ${accent ?? "text-ink"}`}>{value}</dd>
    </div>
  );
}
