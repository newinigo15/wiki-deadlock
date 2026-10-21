"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 900;

function PatronCore() {
  const core = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (core.current) core.current.rotation.y += delta * 0.12;
    if (ringA.current) ringA.current.rotation.x += delta * 0.18;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.14;
  });

  return (
    <group ref={core}>
      <mesh>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshStandardMaterial color="#2a1d10" emissive="#c8a25a" emissiveIntensity={0.12} metalness={0.95} roughness={0.3} flatShading />
      </mesh>
      <mesh scale={1.55}>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial color="#c8a25a" wireframe transparent opacity={0.18} />
      </mesh>
      <mesh ref={ringA} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[2.6, 0.015, 8, 160]} />
        <meshBasicMaterial color="#e0892f" transparent opacity={0.6} />
      </mesh>
      <mesh ref={ringB} rotation={[0, Math.PI / 3, Math.PI / 5]}>
        <torusGeometry args={[3.2, 0.012, 8, 160]} />
        <meshBasicMaterial color="#9b6cf0" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function SoulDust() {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 3 + Math.random() * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi) * 0.6;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y -= delta * 0.02;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#7fd1c7" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

/** Balanceo de cámara que sigue al ratón (parallax). */
function ParallaxRig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 1.2, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.4 + pointer.y * 0.7, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function PatronScene() {
  return (
    <Canvas camera={{ position: [0, 0.4, 8], fov: 50 }} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: "low-power" }}>
      <color attach="background" args={["#0c0a08"]} />
      <fog attach="fog" args={["#0c0a08", 6, 16]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[4, 3, 4]} intensity={40} color="#e0892f" />
      <pointLight position={[-4, -2, 2]} intensity={25} color="#9b6cf0" />
      <PatronCore />
      <SoulDust />
      <ParallaxRig />
    </Canvas>
  );
}
