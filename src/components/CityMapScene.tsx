"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  BUILDING_TYPES,
  DEFAULT_SEED,
  generateCity,
  groupByType,
  type BuildingType,
  type CityBuilding,
} from "@/lib/cityGen";

const GRID = 21;
const SPACING = 1.1;
const BASE_COLOR = new THREE.Color("#2a1d10");
const ACCENT_COLOR = new THREE.Color("#9b6cf0").multiplyScalar(0.5);

/** Un InstancedMesh por tipo: draw calls constantes (= nº de tipos). */
function BuildingBatch({ items }: { items: CityBuilding[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    items.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, b.accent ? ACCENT_COLOR : BASE_COLOR);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);

  if (items.length === 0) return null;
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, items.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial metalness={0.6} roughness={0.45} emissive="#c8a25a" emissiveIntensity={0.08} />
    </instancedMesh>
  );
}

function City({ seed, animate }: { seed: number; animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const groups = useMemo(() => groupByType(generateCity({ seed, grid: GRID, spacing: SPACING })), [seed]);

  useFrame((_, delta) => {
    if (animate && group.current) group.current.rotation.y += delta * 0.04;
  });

  const size = GRID * SPACING * 1.6;
  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#120e0a" roughness={1} />
      </mesh>
      {BUILDING_TYPES.map((t: BuildingType) => (
        <BuildingBatch key={t} items={groups[t]} />
      ))}
    </group>
  );
}

export default function CityMapScene({ animate = true, seed = DEFAULT_SEED }: { animate?: boolean; seed?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 7, 11], fov: 45 }}
      dpr={[1, 1.5]}
      frameloop={visible ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "low-power" }}
    >
      <color attach="background" args={["#0c0a08"]} />
      <fog attach="fog" args={["#0c0a08", 8, 24]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 5, 4]} intensity={60} color="#e0892f" />
      <pointLight position={[-5, 3, -3]} intensity={40} color="#9b6cf0" />
      <City seed={seed} animate={animate} />
    </Canvas>
  );
}
