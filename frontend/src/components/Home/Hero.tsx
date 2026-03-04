import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight, Wifi, Zap, Users } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useTheme } from '@/context/ThemeContext';

// Network particles/nodes component
const NetworkNodes = () => {
    const points = useRef<THREE.Points>(null!);
    
    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(150 * 3);
        for (let i = 0; i < 150; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const radius = 2.2 + Math.random() * 0.3;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
        }
        return positions;
    }, []);
    
    useFrame((state) => {
        if (points.current) {
            points.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    });
    
    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[particlesPosition, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.04}
                color="#66FF00"
                sizeAttenuation
                transparent
                opacity={0.8}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

// Main network sphere component
const NetworkSphere = ({ isDark }: { isDark: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
        }
    });
    
    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[2, 128, 128]} />
            <meshStandardMaterial
                color="#0055FF"
                metalness={0.9}
                roughness={0.1}
                emissive={isDark ? '#002266' : '#001a4d'}
                emissiveIntensity={isDark ? 0.9 : 0.5}
                wireframe={false}
            />
            {/* Inner glow sphere */}
            <mesh scale={0.98}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshBasicMaterial
                    color={isDark ? '#0088FF' : '#0066FF'}
                    transparent
                    opacity={isDark ? 0.25 : 0.15}
                    side={THREE.BackSide}
                />
            </mesh>
        </mesh>
    );
};

// 3D Globe visualization using React Three Fiber
const NetworkGlobe3D = ({ isDark }: { isDark: boolean }) => {
    return (
        <div className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center">
            {/* Ambient glow behind the globe in dark mode */}
            {isDark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(0,85,255,0.2)_0%,rgba(0,85,255,0.05)_50%,transparent_70%)] blur-xl" />
                </div>
            )}

            <Canvas
                camera={{ position: [0, 0, 6], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: isDark ? '#030712' : 'transparent' }}
            >
                <fog attach="fog" args={[isDark ? '#030712' : '#ffffff', 8, 18]} />
                
                {/* Lighting setup — brighter glow in dark, softer in light */}
                <ambientLight intensity={isDark ? 0.25 : 0.5} />
                <directionalLight position={[10, 10, 5]} intensity={isDark ? 0.7 : 1} color="#ffffff" />
                <pointLight position={[5, 5, 5]} intensity={isDark ? 1.2 : 0.8} color="#0055FF" />
                <pointLight position={[-5, -5, -5]} intensity={isDark ? 0.8 : 0.5} color="#66FF00" />
                <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={isDark ? 0.8 : 0.5} color="#0055FF" />
                
                {/* Stars — visible in dark mode only */}
                {isDark && <Stars radius={100} depth={50} count={3000} factor={2.5} saturation={0} fade speed={0.5} />}
                
                {/* Main network sphere */}
                <NetworkSphere isDark={isDark} />
                
                {/* Network nodes */}
                <NetworkNodes />
                
                {/* Orbital rings — more vivid in dark mode */}
                <group>
                    <mesh rotation={[Math.PI / 3, 0, Math.PI / 4]}>
                        <torusGeometry args={[3.2, 0.015, 16, 100]} />
                        <meshBasicMaterial color="#66FF00" transparent opacity={isDark ? 0.4 : 0.25} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 4, Math.PI / 3, 0]}>
                        <torusGeometry args={[2.9, 0.012, 16, 100]} />
                        <meshBasicMaterial color="#0088FF" transparent opacity={isDark ? 0.35 : 0.2} />
                    </mesh>
                    <mesh rotation={[0, Math.PI / 2, Math.PI / 6]}>
                        <torusGeometry args={[3.5, 0.01, 16, 100]} />
                        <meshBasicMaterial color="#ffffff" transparent opacity={isDark ? 0.25 : 0.15} />
                    </mesh>
                </group>

                <OrbitControls 
                    enableZoom={false} 
                    autoRotate 
                    autoRotateSpeed={0.5} 
                    enablePan={false}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.5}
                />
            </Canvas>

            {/* Floating stat card — top right */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="absolute top-[12%] right-[8%] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-100 dark:border-gray-800 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 z-10"
            >
                <div className="w-10 h-10 bg-[#0055FF] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Wifi className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Avg Speed</p>
                    <p className="text-base font-black text-black dark:text-white leading-none">350 Mbps</p>
                </div>
            </motion.div>

            {/* Floating stat card — bottom left */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="absolute bottom-[15%] left-[8%] bg-[#0055FF] text-white shadow-2xl shadow-blue-500/40 rounded-2xl px-4 py-3 flex items-center gap-3 z-10"
            >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                    <p className="text-[9px] text-blue-200 font-bold uppercase tracking-wider">Active Nodes</p>
                    <p className="text-base font-black leading-none">2,400+</p>
                </div>
            </motion.div>

             {/* Floating earnings card — middle right */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="absolute top-[52%] right-[25%] bg-gray-900 dark:bg-[#050511] text-white shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 border border-gray-800 dark:border-white/10 z-10"
            >
                <div className="w-10 h-10 bg-[#66FF00]/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#66FF00]" />
                </div>
                <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Live Earnings</p>
                    <p className="text-base font-black text-[#66FF00] leading-none">₹ 1.2/min</p>
                </div>
            </motion.div>
        </div>
    );
};

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
};

export const Hero = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <section className="relative w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-white dark:bg-gray-950 overflow-hidden">
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,85,255,0.04)_0%,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(0,85,255,0.15)_0%,transparent_60%)] pointer-events-none" />

            <div className="container max-w-7xl mx-auto px-6 md:px-8 relative z-10 py-16 lg:py-0">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Text content */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col items-start pt-10 lg:pt-0"
                    >
                        <motion.div variants={itemVariants}>
                            <span className="inline-flex items-center gap-2.5 rounded-full bg-blue-50 px-5 py-2 text-xs font-bold text-[#0055FF] uppercase tracking-wide mb-8 border border-blue-100">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0055FF]"></span>
                                </span>
                                Live on Mainnet
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-black dark:text-white leading-[1.05] mb-6"
                        >
                            Decentralized<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0055FF] to-[#003399] dark:from-[#0088FF] dark:to-[#00DDFF]">WiFi Network</span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="max-w-[540px] text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-8"
                        >
                            Turn your router into a passive income stream.
                            The world's first marketplace for peer-to-peer internet bandwidth sharing.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <Button className="bg-[#0055FF] hover:bg-[#0044CC] text-white rounded-full px-7 py-6 text-base font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 w-full sm:w-auto">
                                Start Earning <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#0055FF] hover:text-[#0055FF] hover:bg-blue-50 dark:hover:bg-blue-950 rounded-full px-7 py-6 text-base font-bold transition-all duration-300 w-full sm:w-auto"
                            >
                                Find Spots
                            </Button>
                        </motion.div>

                        {/* Trust stats */}
                        <motion.div
                            variants={itemVariants}
                            className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 w-full max-w-md"
                        >
                            {[
                                { value: '2.4k+', label: 'Active Nodes' },
                                { value: '₹30/hr', label: 'Avg Price' },
                                { value: '99.9%', label: 'Uptime' },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <p className="text-xl font-black text-black dark:text-white mb-0.5">{stat.value}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Right: 3D Globe */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                        className="hidden lg:flex relative items-center justify-center min-h-[600px]"
                    >
                        <NetworkGlobe3D isDark={isDark} />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
