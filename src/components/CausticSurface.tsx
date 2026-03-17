"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { causticVertexShader, causticFragmentShader } from "@/shaders/caustics";

function CausticPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(viewport.width, viewport.height),
      },
      uIntensity: { value: 1.0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uResolution.value.set(
        viewport.width,
        viewport.height
      );
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={causticVertexShader}
        fragmentShader={causticFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function CausticSurface() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 1], fov: 75 }}
        dpr={[1, 2]}
        style={{ background: "#F5F0EB" }}
      >
        <CausticPlane />
      </Canvas>
    </div>
  );
}
