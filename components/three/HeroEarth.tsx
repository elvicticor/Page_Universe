"use client";

import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import SceneCanvas from "./SceneCanvas";
import { useReducedMotion } from "motion/react";
import Earth from "./Earth";
import { latLonToVec3, subsolarPoint } from "@/lib/astro";

function Scene() {
  const reduce = useReducedMotion();
  const sunDir = useMemo(() => {
    const s = subsolarPoint(new Date());
    return new THREE.Vector3(...latLonToVec3(s.lat, s.lon, 1)).normalize();
  }, []);
  useEffect(() => {
    const update = () => { const s = subsolarPoint(new Date()); sunDir.set(...latLonToVec3(s.lat, s.lon, 1)).normalize(); };
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [sunDir]);
  // La cámara arranca a 70° del Sol: se ve el día, el terminador y las luces de las ciudades.
  const camPos = useMemo(
    () => sunDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-70)).setY(0.35).normalize().multiplyScalar(3.2),
    [sunDir],
  );
  const light = useRef<THREE.DirectionalLight>(null);
  const started = useRef(false);

  useFrame(({ camera }) => {
    if (!started.current) {
      camera.position.copy(camPos);
      started.current = true;
    }
    light.current?.position.copy(sunDir).multiplyScalar(20);
  });

  return (
    <>
      <ambientLight intensity={0.04} />
      <directionalLight ref={light} intensity={2.4} />
      <Earth radius={1} sunDir={sunDir} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={!reduce} autoRotateSpeed={0.35} enableDamping rotateSpeed={0.5} />
    </>
  );
}

export default function HeroEarth() {
  return (
    <SceneCanvas camera={{ fov: 35, position: [0, 0, 3.2] }} dpr={[1, 2]} gl={{ alpha: true }}>
        <Scene />
    </SceneCanvas>
  );
}
