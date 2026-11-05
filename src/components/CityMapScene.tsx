"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  BUILDING_TYPES,
  DEFAULT_SEED,
  generateCity,
  groupByType,
  type BuildingType,
  type CityBuilding,
} from "@/lib/cityGen";
import { CITY_CONFIG as C } from "@/lib/cityConfig";
import { damp, easeOutCubic, parallaxTarget, scrollOffset, stepHover } from "@/lib/sceneMath";
import { resolveFrameloop } from "@/lib/sceneMode";

const BASE_COLOR = new THREE.Color(C.colors.building);
const ACCENT_COLOR = new THREE.Color(C.colors.accent).multiplyScalar(0.5);
const HOVER_COLOR = new THREE.Color(C.colors.hover).multiplyScalar(2.2); // >1: simula emisivo por instancia

interface HoverState {
  mesh: THREE.InstancedMesh | null;
  id: number;
}

/** Un InstancedMesh por tipo: draw calls constantes (= nº de tipos). */
function BuildingBatch({
  items,
  meshes,
  hover,
}: {
  items: CityBuilding[];
  meshes: RefObject<Set<THREE.InstancedMesh>>;
  hover: RefObject<HoverState>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const levels = useRef(new Map<number, number>());
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  // Geometría con bisel y material físico creados aquí para poder liberarlos explícitamente.
  const geometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.05), []);
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        metalness: 0.6,
        roughness: 0.45,
        clearcoat: 0.4,
        clearcoatRoughness: 0.35,
        emissive: new THREE.Color(C.colors.emissive),
        emissiveIntensity: 0.08,
      }),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const write = (i: number, lift: number, level: number) => {
    const m = mesh.current;
    if (!m) return;
    const b = items[i];
    dummy.position.set(b.x, b.h / 2 + lift, b.z);
    dummy.scale.set(b.w, b.h, b.d);
    dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix);
    m.setColorAt(i, tmp.copy(b.accent ? ACCENT_COLOR : BASE_COLOR).lerp(HOVER_COLOR, level));
  };

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    levels.current.clear();
    items.forEach((_, i) => write(i, 0, 0));
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
    const set = meshes.current;
    set.add(m);
    return () => {
      set.delete(m);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const hid = hover.current.mesh === m ? hover.current.id : -1;
    if (hid >= 0 && !levels.current.has(hid)) levels.current.set(hid, 0);
    if (levels.current.size === 0) return;
    for (const [id, lv] of levels.current) {
      const next = stepHover(lv, id === hid, dt, C.hover.riseSeconds, C.hover.fallSeconds);
      if (id !== hid && next < 0.002) {
        levels.current.delete(id);
        write(id, 0, 0);
      } else {
        levels.current.set(id, next);
        const e = easeOutCubic(next);
        write(id, e * C.hover.lift, e);
      }
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  if (items.length === 0) return null;
  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, items.length]}
      castShadow
      receiveShadow
    />
  );
}

/** Puntero (lerp), scroll y raycast con throttle. Escucha en window: el canvas es de fondo. */
function Interaction({ meshes, hover, animate }: { meshes: RefObject<Set<THREE.InstancedMesh>>; hover: RefObject<HoverState>; animate: boolean }) {
  const { camera, gl } = useThree();
  const ndc = useRef(new THREE.Vector2(0, 0));
  const hasPointer = useRef(false);
  const scrollY = useRef(0);
  const cur = useRef({ x: 0, y: 0, s: 0 });
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const sinceCast = useRef(0);
  const base = useMemo(() => camera.position.clone(), [camera]);
  const look = useMemo(() => new THREE.Vector3(0, 0.5, 0), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      ndc.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      hasPointer.current = true;
    };
    const onLeave = () => {
      hasPointer.current = false;
    };
    const onScroll = () => {
      scrollY.current = window.scrollY;
    };
    const state = hover.current;
    onScroll();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerleave", onLeave);
      state.mesh = null;
      state.id = -1;
    };
  }, [hover]);

  useFrame((_, dt) => {
    const t = parallaxTarget(hasPointer.current ? ndc.current.x : 0, hasPointer.current ? ndc.current.y : 0, C.parallax.strength);
    const s = scrollOffset(scrollY.current, window.innerHeight, C.parallax.scrollFactor, C.parallax.scrollMax);
    const c = cur.current;
    c.x = damp(c.x, t.x, C.parallax.damping, dt);
    c.y = damp(c.y, t.y, C.parallax.damping, dt);
    c.s = damp(c.s, s, C.parallax.damping, dt);
    camera.position.set(base.x + c.x, base.y + c.y * 0.5 + c.s, base.z);
    camera.lookAt(look);

    if (!animate) return;
    sinceCast.current += dt * 1000;
    if (sinceCast.current < C.hover.throttleMs) return;
    sinceCast.current = 0;
    if (!hasPointer.current) {
      hover.current.mesh = null;
      hover.current.id = -1;
      gl.domElement.style.cursor = "";
      return;
    }
    raycaster.setFromCamera(ndc.current, camera);
    const hit = raycaster.intersectObjects([...meshes.current], false)[0];
    hover.current.mesh = hit ? (hit.object as THREE.InstancedMesh) : null;
    hover.current.id = hit?.instanceId ?? -1;
  });

  return null;
}

function Ground({ grid, spacing }: { grid: number; spacing: number }) {
  const size = grid * spacing * 1.6;
  const divisions = Math.ceil(grid / 8) * 2; // par: una línea pasa por el origen
  const gridObj = useMemo(() => {
    const g = new THREE.GridHelper(divisions * 4 * spacing, divisions, C.colors.emissive, C.colors.streetLine);
    (g.material as THREE.Material).transparent = true;
    (g.material as THREE.Material).opacity = 0.35;
    return g;
  }, [divisions, spacing]);
  useEffect(
    () => () => {
      gridObj.geometry.dispose();
      (gridObj.material as THREE.Material).dispose();
    },
    [gridObj],
  );
  const half = (grid - 1) / 2;
  const off = ((((3 - half) % 4) + 4) % 4) * spacing; // alinea las líneas con las calles de cityGen
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={C.colors.ground} roughness={1} />
      </mesh>
      <primitive object={gridObj} position={[off, 0.002, off]} />
    </group>
  );
}

function City({ seed, animate }: { seed: number; animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef(new Set<THREE.InstancedMesh>());
  const hover = useRef<HoverState>({ mesh: null, id: -1 });
  const groups = useMemo(() => groupByType(generateCity({ seed, grid: C.grid, spacing: C.spacing, density: C.density })), [seed]);

  useFrame((_, delta) => {
    if (animate && group.current) group.current.rotation.y += delta * C.autoRotateSpeed;
  });

  return (
    <>
      <Interaction meshes={meshes} hover={hover} animate={animate} />
      <group ref={group}>
        <Ground grid={C.grid} spacing={C.spacing} />
        {BUILDING_TYPES.map((t: BuildingType) => (
          <BuildingBatch key={t} items={groups[t]} meshes={meshes} hover={hover} />
        ))}
      </group>
    </>
  );
}

export default function CityMapScene({
  animate = true,
  seed = DEFAULT_SEED,
  onContextLost,
}: {
  animate?: boolean;
  seed?: number;
  onContextLost?: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const { key, fill, rim, hemisphere, shadowMapSize } = C.lights;
  return (
    <Canvas
      camera={{ position: [0, 7, 11], fov: 45 }}
      dpr={[1, C.maxDpr]}
      shadows="soft" // PCFSoftShadowMap
      frameloop={resolveFrameloop(animate, visible)}
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
      <color attach="background" args={[C.colors.background]} />
      <fogExp2 attach="fog" args={[C.colors.background, C.fogDensity]} />
      <hemisphereLight args={[hemisphere.sky, hemisphere.ground, hemisphere.intensity]} />
      <directionalLight
        position={[...key.position]}
        color={key.color}
        intensity={key.intensity}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[...fill.position]} color={fill.color} intensity={fill.intensity} />
      <directionalLight position={[...rim.position]} color={rim.color} intensity={rim.intensity} />
      <City seed={seed} animate={animate} />
    </Canvas>
  );
}
