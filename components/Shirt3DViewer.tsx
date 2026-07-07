'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function PlaceholderModel() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1.2, 0]} />
        <MeshDistortMaterial
          color="#8b5cf6"
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          metalness={0.3}
          roughness={0.2}
          distort={0.3}
          speed={3}
        />
      </mesh>
    </Float>
  );
}

export default function Shirt3DViewer() {
  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        flex: 1,
        minHeight: '400px', 
        position: 'relative',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, oklch(0.2 0.05 280), oklch(0.15 0.02 280))',
        boxShadow: 'inset 0 0 40px oklch(0 0 0 / 0.5)'
      }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#c084fc" />
        
        <PlaceholderModel />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate 
          autoRotateSpeed={0.5} 
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        bottom: 'var(--space-4)',
        left: 0,
        right: 0,
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <span style={{
          background: 'oklch(0 0 0 / 0.4)',
          backdropFilter: 'blur(8px)',
          color: 'oklch(1 0 0 / 0.8)',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.05em'
        }}>
          3D SHIRT PREVIEW
        </span>
      </div>
    </div>
  );
}
