import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function CameraRig({ mouse }: { mouse: React.MutableRefObject<{ x: number, y: number }> }) {
  const { camera } = useThree();
  useFrame((state, delta) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.current.x * 2, delta * 2);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.current.y * 2, delta * 2);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function DataMatrix() {
  const mesh = useRef<THREE.Points>(null!);
  const count = 2000;

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      // Emerald green shades
      color.setHSL(0.4 + Math.random() * 0.1, 1.0, 0.4 + Math.random() * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return [positions, colors];
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (mesh.current) {
      mesh.current.rotation.y = time * 0.05;
      mesh.current.rotation.x = time * 0.02;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.6} sizeAttenuation={true} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function CyberGlobe() {
  const group = useRef<THREE.Group>(null!);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = time * 0.1;
      group.current.rotation.x = time * 0.05;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[8, 2]} />
        <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.15} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[8.5, 1]} />
        <meshBasicMaterial color="#047857" wireframe transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

export default function ThreeBackground() {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-transparent overflow-hidden pointer-events-none">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 15], fov: 60 }} dpr={[1, 2]}>
          <CameraRig mouse={mouse} />
          <DataMatrix />
          <CyberGlobe />
        </Canvas>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-transparent to-slate-900/80 z-20 pointer-events-none mix-blend-multiply" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05)_0%,rgba(0,0,0,0.5)_100%)] z-20 pointer-events-none"></div>
    </div>
  );
}
