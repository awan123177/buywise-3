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

function FloatingOrbs() {
  const group = useRef<THREE.Group>(null!);

  const orbs = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10 - 5
      ] as [number, number, number],
      scale: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? '#e0e7ff' : '#f3e8ff', // Indigo-100 or Purple-100
      speed: Math.random() * 0.5 + 0.1
    }));
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (group.current) {
      group.current.children.forEach((child, i) => {
        child.position.y += Math.sin(time * orbs[i].speed + i) * 0.01;
        child.rotation.x += 0.005;
        child.rotation.y += 0.005;
      });
    }
  });

  return (
    <group ref={group}>
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.position} scale={orb.scale}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial 
            color={orb.color} 
            transparent 
            opacity={0.4} 
            roughness={0.1} 
            transmission={0.9} 
            thickness={1} 
          />
        </mesh>
      ))}
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
    <div className="fixed inset-0 -z-10 bg-[#fafafa] overflow-hidden pointer-events-none">
      <div className="absolute inset-0 z-0 opacity-60">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }} dpr={[1, 2]}>
          <CameraRig mouse={mouse} />
          <ambientLight intensity={1.5} color="#ffffff" />
          <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
          <FloatingOrbs />
        </Canvas>
      </div>

      {/* Soft gradient overlay instead of heavy vignette */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-transparent to-purple-50/40 z-20 pointer-events-none" />
      <div className="absolute inset-0 z-30 pointer-events-none backdrop-blur-[60px] opacity-100"></div>
    </div>
  );
}
