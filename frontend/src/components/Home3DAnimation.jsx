import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Center, Text3D, Html } from '@react-three/drei';
import * as THREE from 'three';

// Orbiting Icon Component
function OrbitingIcon({ text, radius, speed, offset }) {
    const ref = useRef();
    
    useFrame((state) => {
        const t = state.clock.getElapsedTime() * speed + offset;
        ref.current.position.x = Math.cos(t) * radius;
        ref.current.position.z = Math.sin(t) * radius;
        ref.current.position.y = Math.sin(t * 0.5) * 0.5;
    });

    return (
        <group ref={ref}>
            <Html center transform distanceFactor={10}>
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-3xl shadow-2xl transition-all duration-300 hover:scale-125">
                    {text}
                </div>
            </Html>
        </group>
    );
}

function FoodPlate() {
    const plateRef = useRef();
    const texture = useMemo(() => new THREE.TextureLoader().load('/food_plate.png'), []);

    useFrame((state, delta) => {
        plateRef.current.rotation.y += delta * 0.2;
    });

    return (
        <group ref={plateRef}>
            {/* Realistic Food Image on a Plane */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1.5, 64]} />
                <meshBasicMaterial map={texture} transparent opacity={1} />
            </mesh>

            {/* Premium Glass Plate Base */}
            <mesh position={[0, -0.05, 0]}>
                <cylinderGeometry args={[1.7, 1.5, 0.1, 64]} />
                <meshPhysicalMaterial 
                    color="#ffffff"
                    transmission={0.95}
                    roughness={0.05}
                    ior={1.5}
                    thickness={0.2}
                    clearcoat={1}
                />
            </mesh>

            {/* Glowing Ring Effect */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <ringGeometry args={[1.75, 1.85, 64]} />
                <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
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
                <OrbitingIcon text="📷" radius={2.5} speed={0.5} offset={0} />
                <OrbitingIcon text="📝" radius={2.5} speed={0.5} offset={(Math.PI * 2) / 3} />
                <OrbitingIcon text="🎙️" radius={2.5} speed={0.5} offset={(Math.PI * 4) / 3} />
            </Canvas>
        </div>
    );
}
