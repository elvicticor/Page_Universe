"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Vector3, PerspectiveCamera } from "three";
import type { OrbitControls } from "three-stdlib";
import { PLANETS, SUN } from "@/lib/planets";

export default function SolarCamera({ selected, positions, controls }: { selected: string | null; positions: Record<string, Vector3>; controls: RefObject<OrbitControls | null> }) {
  const { camera, size } = useThree();
  const reduce = useReducedMotion();
  const previous = useRef(new Vector3());
  const flying = useRef(2);
  const last = useRef<string | null | undefined>(undefined);
  const vectors = useMemo(() => ({ zero: new Vector3(), delta: new Vector3(), direction: new Vector3(), destination: new Vector3() }), []);
  useEffect(() => {
    const c = controls.current;
    const cancel = () => { flying.current = 0; };
    c?.addEventListener("start", cancel);
    return () => c?.removeEventListener("start", cancel);
  }, [controls]);
  useEffect(() => { flying.current = 2; }, [size.width, size.height]);
  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    const target = selected ? positions[selected] : vectors.zero;
    if (selected !== last.current) {
      last.current = selected;
      flying.current = 2;
      previous.current.copy(target);
    }
    if (selected) {
      vectors.delta.copy(target).sub(previous.current);
      camera.position.add(vectors.delta);
      c.target.add(vectors.delta);
      previous.current.copy(target);
    }
    if (flying.current > 0) {
      const dt = Math.min(delta, 0.1);
      const k = reduce ? 1 : 1 - Math.exp(-5 * dt);
      c.target.lerp(target, k);
      const planet = selected === SUN.id ? SUN : PLANETS.find((p) => p.id === selected);
      const radius = planet ? planet.size * (planet.ring?.outer ?? 1) * 1.5 : 90;
      const vertical = ((camera as PerspectiveCamera).fov * Math.PI) / 360;
      const halfAngle = Math.min(vertical, Math.atan(Math.tan(vertical) * size.width / Math.max(size.height, 1)));
      const distance = Math.max(radius / Math.sin(halfAngle), planet ? planet.size * 5 : 160);
      vectors.direction.copy(camera.position).sub(c.target).normalize();
      if (!selected) vectors.direction.set(0.2, 0.8, 1).normalize();
      vectors.destination.copy(c.target).addScaledVector(vectors.direction, distance);
      camera.position.lerp(vectors.destination, k);
      flying.current = reduce ? 0 : flying.current - dt;
    }
    c.update();
  });
  return null;
}
