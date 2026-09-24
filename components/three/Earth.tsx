"use client";

import { useReducedMotion } from "motion/react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const dayNightVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const dayNightFragment = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sunDir;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    float light = dot(normalize(vNormal), normalize(sunDir));
    float dayMix = smoothstep(-0.18, 0.22, light);
    vec3 day = texture2D(dayMap, vUv).rgb * (0.25 + 1.05 * max(light, 0.0));
    vec3 night = texture2D(nightMap, vUv).rgb * vec3(1.35, 1.1, 0.8) * 1.6;
    // Rayo cálido en el terminador
    float dusk = (1.0 - smoothstep(0.0, 0.25, abs(light))) * 0.18;
    vec3 color = mix(night, day, dayMix) + vec3(1.0, 0.45, 0.2) * dusk;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const atmosphereFragment = /* glsl */ `
  uniform vec3 sunDir;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.0);
    float lit = smoothstep(-0.4, 0.5, dot(normalize(vNormal), normalize(sunDir)));
    vec3 color = mix(vec3(0.25, 0.45, 1.0), vec3(0.45, 0.8, 1.0), lit);
    gl_FragColor = vec4(color, rim * (0.25 + 0.85 * lit));
  }
`;

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/**
 * Tierra fija en su marco de referencia (lat/lon alineados con la textura).
 * `sunDir` es un vector unitario hacia el Sol en ese mismo marco.
 */
export default function Earth({ radius = 1, sunDir }: { radius?: number; sunDir: THREE.Vector3 }) {
  const reduce = useReducedMotion();
  const [day, night, clouds] = useTexture([
    "/textures/2k_earth_daymap.jpg",
    "/textures/2k_earth_nightmap.jpg",
    "/textures/2k_earth_clouds.jpg",
  ]);
  day.colorSpace = THREE.SRGBColorSpace;
  night.colorSpace = THREE.SRGBColorSpace;
  day.anisotropy = 8;

  const uniforms = useMemo(
    () => ({ dayMap: { value: day }, nightMap: { value: night }, sunDir: { value: sunDir.clone() } }),
    [day, night], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const atmoUniforms = useMemo(() => ({ sunDir: { value: sunDir.clone() } }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const cloudsRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    uniforms.sunDir.value.copy(sunDir);
    atmoUniforms.sunDir.value.copy(sunDir);
    if (cloudsRef.current && !reduce) cloudsRef.current.rotation.y += Math.min(dt, 0.1) * 0.004;
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 96, 96]} />
        <shaderMaterial vertexShader={dayNightVertex} fragmentShader={dayNightFragment} uniforms={uniforms} />
      </mesh>
      <mesh ref={cloudsRef} scale={1.012}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshLambertMaterial alphaMap={clouds} transparent opacity={0.85} depthWrite={false} color="#ffffff" />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={atmoUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
