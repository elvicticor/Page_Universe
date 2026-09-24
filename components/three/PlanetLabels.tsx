"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, type RefObject } from "react";
import { Vector3 } from "three";
import { PLANETS } from "@/lib/planets";

export default function PlanetLabels({ positions, labels, selected, hovered }: { positions: Record<string, Vector3>; labels: RefObject<Record<string, HTMLDivElement | null>>; selected: string | null; hovered: string | null }) {
  const point = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    const occupied: { x: number; y: number }[] = [];
    // La etiqueta bajo el cursor tiene prioridad; se ocultan las que colisionan.
    const ordered = [...PLANETS].sort((a, b) => Number(b.id === hovered) - Number(a.id === hovered));
    for (const planet of ordered) {
      const el = labels.current[planet.id];
      if (!el) continue;
      point.copy(positions[planet.id]);
      // Ancla en el borde superior del planeta + separación en píxeles: no lo tapa a ninguna distancia.
      point.y += planet.size;
      point.project(camera);
      const x = (point.x + 1) * size.width / 2, y = (1 - point.y) * size.height / 2 - 14;
      const hidden = planet.id === selected || point.z < -1 || point.z > 1 || x < 40 || x > size.width - 40 || y < 16 || y > size.height - 20 || occupied.some((p) => Math.abs(p.x - x) < 85 && Math.abs(p.y - y) < 24);
      el.style.visibility = hidden ? "hidden" : "visible";
      if (!hidden) {
        occupied.push({ x, y });
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      }
    }
  });
  return null;
}
