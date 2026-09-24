"use client";

import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, useProgress } from "@react-three/drei";
import { Component, Suspense, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

/**
 * Aviso de carga como DOM normal sobre el canvas. No usa <Html> de drei: crea una raíz React
 * propia y, al desmontarse cuando termina la carga, React 19 avisa de una condición de carrera.
 */
function Loading() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <p role="status" className="panel whitespace-nowrap rounded-xl px-4 py-3 text-sm">Cargando escena · {Math.round(progress)} %</p>
    </div>
  );
}

function Unavailable() {
  return <div role="status" className="grid h-full place-items-center p-6 text-center text-dim"><p>La escena 3D no está disponible en este dispositivo. Puedes consultar los datos de la página y utilizar sus controles.</p></div>;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <Unavailable /> : this.props.children; }
}

/** Suspende el dibujo fuera de pantalla y reduce la resolución si la GPU no mantiene el ritmo. */
export default function SceneCanvas({ children, ...props }: ComponentProps<typeof Canvas>) {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [dpr, setDpr] = useState(1.5);
  useEffect(() => {
    let intersecting = true;
    const update = () => setActive(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); });
    if (host.current) observer.observe(host.current);
    document.addEventListener("visibilitychange", update);
    update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  return <div ref={host} className="relative h-full w-full"><SceneBoundary>
    <Canvas {...props} dpr={dpr} frameloop={active ? "always" : "never"} fallback={<Unavailable />}>
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
    <Loading />
  </SceneBoundary></div>;
}
