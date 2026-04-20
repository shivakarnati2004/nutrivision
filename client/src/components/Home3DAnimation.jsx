import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Center, Text3D, Html } from '@react-three/drei';
import * as THREE from 'three';

// Orbiting Icon Component
function OrbitingIcon({ text, radius, speed, offset, color }) {
    const ref = useRef();
    
    useFrame((state) => {
        const t = state.clock.getElapsedTime() * speed + offset;
        ref.current.position.x = Math.cos(t) * radius;
        ref.current.position.z = Math.sin(t) * radius;
        // Make it face the center slightly, or just rotate
        ref.current.rotation.y += 0.01;
    });

    return (
        <group ref={ref}>
            <Float speed={2} rotationIntensity={1} floatIntensity={2}>
                <mesh castShadow>
                    <boxGeometry args={[0.8, 0.8, 0.8]} />
                    <meshPhysicalMaterial 
                        color={color}
                        transparent
                        opacity={0.8}
                        roughness={0.2}
                        metalness={0.8}
                        clearcoat={1}
                    />
                </mesh>
                <Html position={[0, 0, 0.5]} center transform>
                    <div className="text-3xl filter drop-shadow-lg">{text}</div>
                </Html>
            </Float>
        </group>
    );
}

// Central Core Component
function AICore() {
    const coreRef = useRef();
    const ringRef = useRef();

    useFrame((state, delta) => {
        coreRef.current.rotation.y += delta * 0.5;
        coreRef.current.rotation.x += delta * 0.2;
        ringRef.current.rotation.z -= delta * 0.3;
        ringRef.current.rotation.x += delta * 0.1;
    });

    return (
        <group>
            {/* Core Sphere */}
            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
                <mesh ref={coreRef} castShadow>
                    <icosahedronGeometry args={[1, 1]} />
                    <meshPhysicalMaterial 
                        color="#10b981" 
                        wireframe 
                        emissive="#10b981"
                        emissiveIntensity={0.5}
                        roughness={0.2}
                    />
                </mesh>
                
                {/* Inner glowing core */}
                <mesh>
                    <sphereGeometry args={[0.6, 32, 32]} />
                    <meshBasicMaterial color="#34d399" />
                </mesh>

                {/* Orbiting Ring */}
                <mesh ref={ringRef}>
                    <torusGeometry args={[1.6, 0.02, 16, 100]} />
                    <meshBasicMaterial color="#6ee7b7" transparent opacity={0.3} />
                </mesh>
            </Float>
        </group>
    );
}

// Main Scene
export default function Home3DAnimation() {
    return (
        <div className="w-full h-64 glass-card rounded-2xl overflow-hidden relative mb-6">
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-transparent to-dark-900/50" />
            
            <div className="absolute bottom-4 left-0 right-0 text-center z-20 pointer-events-none">
                <p className="text-primary-400 font-medium tracking-wide spark-text text-sm">
                    AI NUTRITION ENGINE
                </p>
                <p className="text-xs text-dark-400 mt-1">Image • Text • Speech</p>
            </div>

            <Canvas camera={{ position: [0, 2, 6], fov: 45 }} className="w-full h-full">
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#10b981" />
                <pointLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
                
                <AICore />

                {/* Orbiting Inputs */}
                <OrbitingIcon text="📷" radius={2.5} speed={0.5} offset={0} color="#3b82f6" />
                <OrbitingIcon text="📝" radius={2.5} speed={0.5} offset={(Math.PI * 2) / 3} color="#8b5cf6" />
                <OrbitingIcon text="🎙️" radius={2.5} speed={0.5} offset={(Math.PI * 4) / 3} color="#f59e0b" />
            </Canvas>
        </div>
    );
}
