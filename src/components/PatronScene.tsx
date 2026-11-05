"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { resolveFrameloop } from "@/lib/sceneMode";

const GRID = 15; // manzanas por lado
const SPACING = 1.1;
const PARTICLE_COUNT = 500;

const BASE_COLOR = new THREE.Color("#2a1d10");
const HOVER_COLOR = new THREE.Color("#e0892f");
const ACCENT_COLOR = new THREE.Color("#9b6cf0");

/** PRNG determinista para que la ciudad sea igual en cada carga. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  accent: boolean;
}

function buildCity(): Building[] {
  const rnd = mulberry32(1337);
  const out: Building[] = [];
  const half = (GRID - 1) / 2;
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      // calles: cada 4 celdas se deja un hueco
      if (i % 4 === 3 || j % 4 === 3) continue;
      const dist = Math.hypot(i - half, j - half) / half; // 0 centro, 1 borde
      const h = 0.3 + rnd() * 1.6 * (1.3 - Math.min(dist, 1)) + (rnd() > 0.93 ? 1.5 : 0);
      out.push({
        x: (i - half) * SPACING,
        z: (j - half) * SPACING,
        w: 0.55 + rnd() * 0.3,
        d: 0.55 + rnd() * 0.3,
        h,
        accent: rnd() > 0.9,
      });
    }
  }
  return out;
}

/** Ciudad con un único InstancedMesh y resaltado de edificio bajo el puntero. */
function City({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const hovered = useRef(-1);
  const frame = useRef(0);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const buildings = useMemo(buildCity, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, b.accent ? ACCENT_COLOR.clone().multiplyScalar(0.5) : BASE_COLOR);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [buildings, dummy]);

  const paint = (i: number, on: boolean) => {
    const m = mesh.current;
    if (!m || i < 0) return;
    const b = buildings[i];
    if (on) tmp.copy(HOVER_COLOR);
    else tmp.copy(b.accent ? ACCENT_COLOR.clone().multiplyScalar(0.5) : BASE_COLOR);
    m.setColorAt(i, tmp);
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  };

  useFrame(({ camera, pointer }, delta) => {
    if (animate && group.current) group.current.rotation.y += delta * 0.04;
    // Raycast cada 3 frames: suficiente para hover y barato.
    frame.current = (frame.current + 1) % 3;
    if (frame.current !== 0 || !mesh.current || !group.current) return;
    group.current.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(mesh.current, false)[0];
    const id = hit?.instanceId ?? -1;
    if (id !== hovered.current) {
      paint(hovered.current, false);
      paint(id, true);
      hovered.current = id;
    }
  });

  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[GRID * SPACING * 1.6, GRID * SPACING * 1.6]} />
        <meshStandardMaterial color="#120e0a" roughness={1} />
      </mesh>
      <gridHelper args={[GRID * SPACING * 1.6, GRID * 2, "#c8a25a", "#3a2c18"]} position={[0, 0, 0]} />
      <instancedMesh ref={mesh} args={[undefined, undefined, buildings.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.6} roughness={0.45} emissive="#c8a25a" emissiveIntensity={0.08} />
      </instancedMesh>
    </group>
  );
}

function SoulDust({ animate }: { animate: boolean }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const rnd = mulberry32(42);
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = (rnd() - 0.5) * 18;
      arr[i * 3 + 1] = 0.3 + rnd() * 5;
      arr[i * 3 + 2] = (rnd() - 0.5) * 18;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (animate && points.current) points.current.rotation.y -= delta * 0.02;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#7fd1c7" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

/** Cámara orbital suave que sigue al ratón/dedo (parallax). */
function ParallaxRig() {
  useFrame(({ camera, pointer }) => {
    const angle = pointer.x * 0.5;
    const radius = 9;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, Math.sin(angle) * radius, 0.04);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, Math.cos(angle) * radius, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 5 + pointer.y * 1.5, 0.04);
    camera.lookAt(0, 0.4, 0);
  });
  return null;
}

export default function PatronScene({
  animate = true,
  onContextLost,
}: {
  animate?: boolean;
  onContextLost?: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [eventSource, setEventSource] = useState<HTMLElement | undefined>();

  useEffect(() => {
    // El fondo está detrás del contenido: escuchamos los eventos en <body>.
    setEventSource(document.body);
    const onVis = () => setVisible(!document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!eventSource) return null;

  return (
    <Canvas
      camera={{ position: [0, 5, 9], fov: 45 }}
      dpr={[1, 1.5]}
      frameloop={resolveFrameloop(animate, visible)}
      eventSource={eventSource}
      eventPrefix="client"
      gl={{ antialias: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onContextLost?.();
          },
          { once: true },
        );
      }}
    >
      <color attach="background" args={["#0c0a08"]} />
      <fog attach="fog" args={["#0c0a08", 7, 20]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 5, 4]} intensity={60} color="#e0892f" />
      <pointLight position={[-5, 3, -3]} intensity={40} color="#9b6cf0" />
      <City animate={animate} />
      <SoulDust animate={animate} />
      {animate && <ParallaxRig />}
    </Canvas>
  );
}
