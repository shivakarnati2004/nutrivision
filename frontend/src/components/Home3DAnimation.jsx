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
        ref.current.rotation.x += 0.005;
        ref.current.rotation.z += 0.003;
    });

    return (
        <group ref={ref}>
            <Float speed={2} rotationIntensity={1} floatIntensity={2}>
                <mesh castShadow>
                    <boxGeometry args={[0.8, 0.8, 0.8]} />
                    <meshPhysicalMaterial 
                        color={color}
                        transmission={0.8}
                        opacity={1}
                        roughness={0.1}
                        metalness={0.1}
                        ior={1.5}
                        thickness={0.5}
                        clearcoat={1}
                        side={THREE.DoubleSide}
                    />
                </mesh>
                <Html position={[0, 0, 0.5]} center transform>
                    <div className="text-3xl filter drop-shadow-lg">{text}</div>
                </Html>
            </Float>
        </group>
    );
}

function FoodPlate() {
    const plateRef = useRef();

    useFrame((state, delta) => {
        plateRef.current.rotation.y += delta * 0.2;
        plateRef.current.rotation.z = Math.sin(state.clock.getElapsedTime()) * 0.05;
        plateRef.current.rotation.x = Math.cos(state.clock.getElapsedTime() * 0.8) * 0.05;
    });

    return (
        <group ref={plateRef} position={[0, -0.5, 0]}>
            {/* The Plate (Glassmorphism Base) */}
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[1.6, 1.2, 0.1, 64]} />
                <meshPhysicalMaterial 
                    color="#ffffff"
                    transmission={0.9}
                    opacity={1}
                    metalness={0.1}
                    roughness={0.05}
                    ior={1.5}
                    thickness={0.5}
                    clearcoat={1}
                />
            </mesh>
            
            {/* Inner Ring (Detail) */}
            <mesh position={[0, 0.06, 0]}>
                <ringGeometry args={[1.2, 1.4, 64]} />
                <meshPhysicalMaterial color="#10b981" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>

            {/* Glowing "energy" food core in the center */}
            <mesh position={[0, 0.4, 0]}>
                <octahedronGeometry args={[0.6, 2]} />
                <meshPhysicalMaterial 
                    color="#34d399" 
                    emissive="#10b981"
                    emissiveIntensity={0.8}
                    transmission={0.5}
                    roughness={0.2}
                />
            </mesh>

            {/* Glass Cloche (Dome) covering the food */}
            <mesh position={[0, 0.1, 0]}>
                <sphereGeometry args={[1.5, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshPhysicalMaterial 
                    color="#f8fafc"
                    transmission={0.95}
                    opacity={1}
                    metalness={0.2}
                    roughness={0}
                    ior={1.2}
                    thickness={0.1}
                    clearcoat={1}
                    side={THREE.DoubleSide}
                />
            </mesh>
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
                
                <FoodPlate />

                {/* Orbiting Inputs */}
                <OrbitingIcon text="📷" radius={2.5} speed={0.5} offset={0} color="#3b82f6" />
                <OrbitingIcon text="📝" radius={2.5} speed={0.5} offset={(Math.PI * 2) / 3} color="#8b5cf6" />
                <OrbitingIcon text="🎙️" radius={2.5} speed={0.5} offset={(Math.PI * 4) / 3} color="#f59e0b" />
            </Canvas>
        </div>
    );
}
