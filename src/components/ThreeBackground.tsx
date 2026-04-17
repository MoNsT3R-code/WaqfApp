import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function GeometricStructure() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[10, 3, 100, 16]} />
        <MeshDistortMaterial
          color="#1a1a1a"
          envMapIntensity={0.5}
          distort={0.4}
          speed={2}
          roughness={0}
          metalness={1}
          wireframe
        />
      </mesh>
    </Float>
  );
}

function StarField() {
  const points = useMemo(() => {
    const p = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      p[i * 3] = (Math.random() - 0.5) * 100;
      p[i * 3 + 1] = (Math.random() - 0.5) * 100;
      p[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return p;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.05;
  });

  return (
    <Points ref={ref} positions={points} stride={3}>
      <PointMaterial
        transparent
        color="#00f5ff"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  );
}

export const ThreeBackground = ({ theme }: { theme: string }) => {
  const isDark = theme === "dark" || theme === "system"; // Simplified for this component
  
  return (
    <div className="fixed inset-0 -z-10 bg-[var(--bg)]">
      <Canvas camera={{ position: [0, 0, 30], fov: 75 }}>
        <ambientLight intensity={isDark ? 0.2 : 0.5} />
        <pointLight position={[10, 10, 10]} intensity={isDark ? 1.5 : 0.8} color={isDark ? "#00f2ff" : "#0099ae"} />
        <pointLight position={[-10, -10, -10]} intensity={isDark ? 1 : 0.5} color={isDark ? "#ff00ff" : "#ae00ae"} />
        <GeometricStructure />
        <StarField />
      </Canvas>
      <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${isDark ? "via-[#050507]/50 to-[#050507]" : "via-[#fdfdfc]/50 to-[#fdfdfc]"}`} />
    </div>
  );
};
