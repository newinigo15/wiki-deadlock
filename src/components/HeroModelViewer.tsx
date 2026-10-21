"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

type Anim = "idle" | "parry" | "melee" | "reload";
const ANIMS: { id: Anim; label: string }[] = [
  { id: "parry", label: "Parry" },
  { id: "melee", label: "Melee" },
  { id: "reload", label: "Recarga" },
];
const ANIM_SECONDS = 0.9;

/** Figura de referencia procedimental hasta disponer de modelos .glb oficiales. */
function StandIn({ accent, anim, startedAt, onDone }: { accent: string; anim: Anim; startedAt: number; onDone: () => void }) {
  const rightArm = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = Math.min(1, (clock.elapsedTime - startedAt) / ANIM_SECONDS);
    const wave = Math.sin(t * Math.PI);
    if (!rightArm.current || !leftArm.current || !body.current) return;
    rightArm.current.rotation.set(0, 0, 0);
    leftArm.current.rotation.set(0, 0, 0);
    body.current.rotation.y = 0;
    if (anim === "parry") {
      rightArm.current.rotation.x = -wave * 1.6;
      leftArm.current.rotation.x = -wave * 1.6;
    } else if (anim === "melee") {
      rightArm.current.rotation.x = -wave * 2.2;
      body.current.rotation.y = wave * 0.5;
    } else if (anim === "reload") {
      rightArm.current.rotation.x = -0.6 - wave * 0.4;
      leftArm.current.rotation.x = -wave * 0.9;
    }
    if (anim !== "idle" && t >= 1) onDone();
  });

  const material = <meshStandardMaterial color="#2a241c" metalness={0.4} roughness={0.6} />;
  return (
    <group ref={body}>
      <mesh position={[0, 1.6, 0]}><sphereGeometry args={[0.28, 24, 24]} />{material}</mesh>
      <mesh position={[0, 0.95, 0]}><capsuleGeometry args={[0.32, 0.6, 8, 16]} />{material}</mesh>
      <mesh position={[-0.15, 0.25, 0]}><capsuleGeometry args={[0.11, 0.55, 6, 12]} />{material}</mesh>
      <mesh position={[0.15, 0.25, 0]}><capsuleGeometry args={[0.11, 0.55, 6, 12]} />{material}</mesh>
      <group ref={rightArm} position={[0.45, 1.3, 0]}>
        <mesh position={[0, -0.3, 0]}><capsuleGeometry args={[0.09, 0.45, 6, 12]} /><meshStandardMaterial color={accent} /></mesh>
      </group>
      <group ref={leftArm} position={[-0.45, 1.3, 0]}>
        <mesh position={[0, -0.3, 0]}><capsuleGeometry args={[0.09, 0.45, 6, 12]} /><meshStandardMaterial color={accent} /></mesh>
      </group>
    </group>
  );
}

function Hitboxes() {
  return (
    <group>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[0.62, 0.62, 0.62]} />
        <meshBasicMaterial color="#e25b4b" wireframe />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.9, 1.5, 0.7]} />
        <meshBasicMaterial color="#f2c14e" wireframe />
      </mesh>
    </group>
  );
}

function Clock({ onTick }: { onTick: (t: number) => void }) {
  useFrame(({ clock }) => onTick(clock.elapsedTime));
  return null;
}

export default function HeroModelViewer({ accent, name }: { accent: string; name: string }) {
  const [showHitboxes, setShowHitboxes] = useState(true);
  const [anim, setAnim] = useState<Anim>("idle");
  const [startedAt, setStartedAt] = useState(0);
  const now = useRef(0);

  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="h-80 touch-none">
        <Canvas camera={{ position: [2.2, 1.6, 3], fov: 45 }}>
          <color attach="background" args={["#15120e"]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 5, 2]} intensity={2} />
          <Clock onTick={(t) => (now.current = t)} />
          <StandIn accent={accent} anim={anim} startedAt={startedAt} onDone={() => setAnim("idle")} />
          {showHitboxes && <Hitboxes />}
          <gridHelper args={[6, 12, "#3a3128", "#221c16"]} />
          <OrbitControls enablePan={false} target={[0, 0.9, 0]} minDistance={2} maxDistance={7} />
        </Canvas>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line p-3 text-sm">
        {ANIMS.map((a) => (
          <button key={a.id} type="button" onClick={() => { setStartedAt(now.current); setAnim(a.id); }}
            className="rounded border border-line px-3 py-1 hover:border-brass">
            {a.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-muted">
          <input type="checkbox" checked={showHitboxes} onChange={(e) => setShowHitboxes(e.target.checked)} />
          Hitboxes (rojo = crítico)
        </label>
      </div>
      <p className="px-3 pb-3 text-xs text-muted">
        Figura de referencia para {name}. Arrastra para rotar; el modelo oficial se cargará cuando esté disponible.
      </p>
    </div>
  );
}
