"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Line, OrbitControls, Stars, useTexture } from "@react-three/drei";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { AU_KM, PLANETS, SUN, distanceAU, heliocentric, toScene, type Planet } from "@/lib/planets";

import SceneCanvas from "./SceneCanvas";
import LabelProjector from "./PlanetLabels";
import SolarCamera from "./SolarCamera";
import { advanceTime, rotationAngle, MIN_TIME, MAX_TIME } from "@/lib/simulation";

const SPEEDS = [
  { label: "Pausa", v: 0 },
  { label: "Tiempo real", v: 1 },
  { label: "1 h/s", v: 3600 },
  { label: "1 día/s", v: 86400 },
  { label: "1 sem/s", v: 604800 },
  { label: "1 mes/s", v: 2592000 },
];

type Clock = { t: number; speed: number };
type Positions = Record<string, THREE.Vector3>;

/* ---------------- Escena ---------------- */

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(255,210,140,1)");
  grd.addColorStop(0.2, "rgba(255,170,70,0.55)");
  grd.addColorStop(0.5, "rgba(255,120,40,0.12)");
  grd.addColorStop(1, "rgba(255,100,20,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Sun({ onSelect, clock }: { onSelect: (id: string) => void; clock: RefObject<Clock> }) {
  const tex = useTexture(SUN.texture);
  tex.colorSpace = THREE.SRGBColorSpace;
  const glow = useMemo(glowTexture, []);
  const ref = useRef<THREE.Mesh>(null);
  useEffect(() => () => glow.dispose(), [glow]);
  useFrame(() => { if (ref.current) ref.current.rotation.y = rotationAngle(clock.current.t, SUN.rotationHours); });
  return (
    <group>
      <mesh ref={ref} onClick={(e) => (e.stopPropagation(), onSelect(SUN.id))} onPointerOver={pointer} onPointerOut={unpointer}>
        <sphereGeometry args={[SUN.size, 64, 64]} />
        <meshBasicMaterial map={tex} color={[1.4, 1.2, 1]} toneMapped={false} />
      </mesh>
      <sprite scale={SUN.size * 7}>
        <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
      </sprite>
      <pointLight intensity={2.2} decay={0} color="#fff3e0" />
    </group>
  );
}

const pointer = (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  document.body.style.cursor = "pointer";
};
const unpointer = () => (document.body.style.cursor = "");

function Ring({ planet }: { planet: Planet }) {
  const tex = useTexture(planet.ring!.texture);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = useMemo(() => {
    const { inner, outer } = planet.ring!;
    const g = new THREE.RingGeometry(planet.size * inner, planet.size * outer, 128, 1);
    // Reasigna UVs: la textura del anillo es una franja radial.
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const t = (v.length() - planet.size * inner) / (planet.size * (outer - inner));
      uv.setXY(i, t, 0.5);
    }
    return g;
  }, [planet]);
  return (
    <mesh geometry={geo} rotation-x={-Math.PI / 2}>
      <meshStandardMaterial map={tex} transparent side={THREE.DoubleSide} depthWrite={false} roughness={1} />
    </mesh>
  );
}

function Moon({ clock }: { clock: RefObject<Clock> }) {
  const tex = useTexture("/textures/2k_moon.jpg");
  tex.colorSpace = THREE.SRGBColorSpace;
  const ref = useRef<THREE.Group>(null);
  useFrame(() => { if (ref.current) ref.current.rotation.y = rotationAngle(clock.current.t, 27.321661 * 24); });
  return (
    <group ref={ref}>
      <mesh position={[1.9, 0, 0]}>
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
    </group>
  );
}

function PlanetBody({
  planet,
  clock,
  positions,
  selected,
  hover,
  onSelect,
  onHover,
}: {
  planet: Planet;
  clock: RefObject<Clock>;
  positions: Positions;
  selected: boolean;
  hover: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const tex = useTexture(planet.texture);
  tex.colorSpace = THREE.SRGBColorSpace;
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const calculationDate = useMemo(() => new Date(), []);

  // Órbita completa, muestreada una vez con los elementos de hoy.
  const orbit = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 256; i++) pts.push(toScene(heliocentric(planet.elements!, new Date(), -180 + (360 * i) / 256)));
    return pts;
  }, [planet]);

  useFrame(() => {
    calculationDate.setTime(clock.current.t);
    const p = toScene(heliocentric(planet.elements!, calculationDate));
    group.current?.position.set(...p);
    positions[planet.id].set(...p);
    if (body.current) body.current.rotation.y = rotationAngle(clock.current.t, planet.rotationHours);
  });

  return (
    <>
      <Line points={orbit} color={selected || hover ? planet.color : "#ffffff"} lineWidth={selected ? 1.4 : 1} transparent opacity={selected || hover ? 0.7 : 0.12} />
      <group ref={group}>
        <group rotation-z={THREE.MathUtils.degToRad(planet.tilt)}>
          <mesh
            ref={body}
            onClick={(e) => (e.stopPropagation(), onSelect(planet.id))}
            onPointerOver={(e) => (pointer(e), onHover(planet.id))}
            onPointerOut={() => (unpointer(), onHover(null))}
          >
            <sphereGeometry args={[planet.size, 64, 64]} />
            <meshStandardMaterial map={tex} roughness={0.9} metalness={0} />
          </mesh>
          {planet.ring && <Ring planet={planet} />}
        </group>
        {planet.id === "tierra" && <Moon clock={clock} />}
      </group>
    </>
  );
}

function Scene({
  clock,
  selected,
  hovered,
  onSelect,
  onHover,
  positions,
  labels,
}: {
  clock: RefObject<Clock>;
  selected: string | null;
  hovered: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  positions: Positions;
  labels: RefObject<Record<string, HTMLDivElement | null>>;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const reduce = useReducedMotion();
  useFrame((_, dt) => {
    clock.current.t = advanceTime(clock.current.t, dt, clock.current.speed);
  }, -2);
  return (
    <>
      <ambientLight intensity={0.06} />
      <Stars radius={400} depth={120} count={3500} factor={5} fade speed={reduce ? 0 : 0.3} />
      <Sun onSelect={onSelect} clock={clock} />
      {PLANETS.map((p) => (
        <PlanetBody
          key={p.id}
          planet={p}
          clock={clock}
          positions={positions}
          selected={selected === p.id}
          hover={hovered === p.id}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
      <LabelProjector positions={positions} labels={labels} selected={selected} hovered={hovered} />
      <OrbitControls ref={controls} enablePan={false} minDistance={1.5} maxDistance={600} enableDamping makeDefault />
      <SolarCamera selected={selected} positions={positions} controls={controls} />
    </>
  );
}

/* ---------------- Interfaz ---------------- */

type Img = { id: string; title: string; thumb: string; page: string };

function Gallery({ query }: { query: string }) {
  const [items, setItems] = useState<Img[] | null>(null);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setItems(null);
    fetch(`/api/images?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error("Imágenes no disponibles"); return r.json(); })
      .then((d) => alive && setItems(d.items.slice(0, 6)))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
      controller.abort();
    };
  }, [query]);

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {(items ?? Array.from({ length: 6 }, () => null)).map((it, i) =>
        it ? (
          <a key={it.id} href={it.page} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-md bg-deep">
            <img src={it.thumb} alt={it.title} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
          </a>
        ) : (
          <div key={i} className="aspect-square animate-pulse rounded-md bg-white/5" />
        ),
      )}
      {items?.length === 0 && <p className="col-span-3 text-sm text-dim">Sin imágenes disponibles.</p>}
    </div>
  );
}

function InfoPanel({ body, date, onClose, expanded, onToggle }: { body: Planet; date: Date; onClose: () => void; expanded: boolean; onToggle: () => void }) {
  const earth = PLANETS.find((p) => p.id === "tierra")!;
  const helio = body.elements ? heliocentric(body.elements, date) : null;
  const fromSun = helio ? Math.hypot(helio.x, helio.y, helio.z) : 0;
  const fromEarth = helio && body.id !== "tierra" ? distanceAU(helio, heliocentric(earth.elements!, date)) : null;
  const lightMin = fromEarth != null ? (fromEarth * AU_KM) / 299792.458 / 60 : null;
  const n = (v: number, d = 0) => v.toLocaleString("es-ES", { maximumFractionDigits: d });

  return (
    <motion.aside
      key={body.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`Información de ${body.name}`}
      className="panel absolute inset-x-3 bottom-16 max-h-[48%] overflow-y-auto rounded-2xl p-4 lg:inset-x-auto lg:top-3 lg:right-3 lg:bottom-16 lg:max-h-none lg:w-[360px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label" style={{ color: body.color }}>{body.facts.tipo}</p>
          <h2 className="mt-1 font-display text-3xl lg:text-5xl leading-none">{body.name}</h2>
        </div>
        <button onClick={onClose} className="label rounded-full border hairline px-3 py-1.5 hover:text-ink">
          Cerrar
        </button>
      </div>
      <button aria-expanded={expanded} aria-controls="planet-details" onClick={onToggle} className="mt-2 text-sm text-ion lg:hidden">{expanded ? "Ocultar detalles ↓" : "Ver detalles ↑"}</button>
      <div id="planet-details" className={expanded ? "block" : "hidden lg:block"}>
      <p className="mt-4 text-sm leading-relaxed text-dim">{body.blurb}</p>

      {helio && (
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border hairline p-4">
          <div>
            <p className="label">Distancia al Sol</p>
            <p className="mt-1 font-mono text-lg tabular-nums">{n(fromSun, 3)} UA</p>
            <p className="font-mono text-xs text-faint">{n(fromSun * AU_KM / 1e6, 1)} M km</p>
          </div>
          {fromEarth != null && lightMin != null && (
            <div>
              <p className="label">Distancia a la Tierra</p>
              <p className="mt-1 font-mono text-lg tabular-nums">{n(fromEarth, 3)} UA</p>
              <p className="font-mono text-xs text-faint">la luz tarda {lightMin < 60 ? `${n(lightMin, 1)} min` : `${n(lightMin / 60, 2)} h`}</p>
            </div>
          )}
        </div>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        <Fact k="Diámetro" v={`${n(body.facts.diametroKm)} km`} />
        <Fact k="Gravedad" v={`${n(body.facts.gravedad, 1)} m/s²`} />
        <Fact k="Día" v={body.facts.dia} />
        <Fact k="Año" v={body.facts.anio} />
        <Fact k="Lunas conocidas" v={String(body.facts.lunas)} />
        <Fact k="Temperatura" v={body.facts.temperatura} />
      </dl>

      <p className="label mt-6 mb-2">Archivo de imágenes NASA</p>
      <Gallery query={body.query} />
      </div>
    </motion.aside>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="label">{k}</dt>
      <dd className="mt-0.5">{v}</dd>
    </div>
  );
}

export default function SolarSystemExplorer() {
  const clock = useRef<Clock>({ t: Date.now(), speed: 1 });
  const positions = useMemo<Positions>(() => Object.fromEntries([SUN, ...PLANETS].map((p) => [p.id, new THREE.Vector3()])), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const labels = useRef<Record<string, HTMLDivElement | null>>({});
  const [speed, setSpeed] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [date, setDate] = useState(() => new Date());

  useEffect(() => {
    clock.current.speed = SPEEDS[speed].v;
  }, [speed]);
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) { setDate(new Date(clock.current.t)); if (clock.current.t === MIN_TIME || clock.current.t === MAX_TIME) setSpeed(0); } }, 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { setExpanded(false); }, [selected]);
  useEffect(() => () => { document.body.style.cursor = ""; }, []);

  const body = selected === SUN.id ? SUN : PLANETS.find((p) => p.id === selected);
  const offsetDays = Math.round((date.getTime() - Date.now()) / 86400000);

  return (
    <div className="relative h-[calc(100dvh-4rem)] min-h-[560px] w-full overflow-hidden">
      <div className={`absolute inset-x-0 top-44 lg:top-0 ${body ? (expanded ? "bottom-[52%] lg:bottom-16 lg:right-[380px]" : "bottom-48 lg:bottom-16 lg:right-[380px]") : "bottom-16"}`}>
      <SceneCanvas camera={{ position: [30, 100, 160], fov: 45, far: 2000 }} onPointerMissed={() => setSelected(null)}>
          <Scene
            clock={clock}
            selected={selected}
            hovered={hovered}
            onSelect={setSelected}
            onHover={setHovered}
            positions={positions}
            labels={labels}
          />
      </SceneCanvas>

      {/* Etiquetas de los planetas: LabelProjector las mueve cada fotograma */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {PLANETS.map((p) => (
          <div
            key={p.id}
            ref={(el) => {
              labels.current[p.id] = el;
            }}
            style={{ visibility: "hidden" }}
            className={`absolute top-0 left-0 whitespace-nowrap font-mono text-[10px] tracking-[0.18em] uppercase transition-opacity duration-300 will-change-transform ${
              selected === p.id ? "opacity-0" : hovered === p.id ? "text-ink opacity-100" : "text-dim opacity-80"
            }`}
          >
            {p.name}
          </div>
        ))}
      </div>

      </div>
      {/* Fecha simulada · UTC y control de tiempo */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 flex flex-col gap-3 lg:right-auto">
        <div className="panel pointer-events-auto rounded-2xl p-3 lg:max-w-[440px]">
          <p className="label">Fecha simulada · UTC</p>
          <p className="mt-1 font-mono text-2xl tabular-nums">
            {date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}
          </p>
          <p className="font-mono text-xs text-faint">
            {offsetDays === 0 ? "Posiciones aproximadas de hoy" : `${offsetDays > 0 ? "+" : ""}${offsetDays.toLocaleString("es-ES")} días desde hoy`}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                aria-pressed={speed === i}
                onClick={() => { clock.current.speed = s.v; setSpeed(i); }}
                className={`rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  speed === i ? "bg-sol text-void" : "bg-white/5 text-dim hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => {
                clock.current.t = Date.now();
                clock.current.speed = 1;
                setDate(new Date(clock.current.t));
                setSpeed(1);
              }}
              className="rounded-full border border-ion/40 px-2.5 py-1 font-mono text-[11px] text-ion hover:bg-ion/10"
            >
              Hoy
            </button>
          </div>
          <p className="mt-2 text-xs text-dim">1800–2050 · Rotaciones y Luna ilustrativas</p>
        </div>
      </div>

      {/* Selector de planetas */}
      <div className="absolute bottom-3 left-1/2 w-[calc(100%-1.5rem)] max-w-max -translate-x-1/2 overflow-x-auto">
        <div className="panel flex gap-1 rounded-full p-1">
          {[SUN, ...PLANETS].map((p) => (
            <button
              key={p.id}
              aria-pressed={selected === p.id}
              onClick={() => setSelected(p.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                selected === p.id ? "bg-white/10 text-ink" : "text-dim hover:text-ink"
              }`}
            >
              <span className="size-2 rounded-full" style={{ background: p.color }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>{body && <InfoPanel key={body.id} body={body} date={date} expanded={expanded} onToggle={() => setExpanded((v) => !v)} onClose={() => setSelected(null)} />}</AnimatePresence>
    </div>
  );
}
