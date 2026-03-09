import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Wifi, CreditCard, Home, Upload, BadgeDollarSign, ArrowRight, User, Building2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const USER_STEPS = [
    {
        id: 1,
        title: "Find WiFi Spots",
        description: "Browse our interactive map to discover nearby WiFi spots. Filter by location, price range, internet speed, and amenities to find the perfect match.",
        icon: MapPin,
        iconBg: "bg-[#0055FF]",
        glow: "rgba(0,85,255,0.35)",
        numberBg: "bg-[#0055FF]",
    },
    {
        id: 2,
        title: "Book & Pay",
        description: "Select your preferred WiFi spot and choose your duration (hourly booking). Pay securely with ETH via your MetaMask wallet — funds are held in a smart contract escrow.",
        icon: CreditCard,
        iconBg: "bg-[#66FF00]",
        glow: "rgba(102,255,0,0.30)",
        numberBg: "bg-[#66FF00]",
    },
    {
        id: 3,
        title: "Connect Instantly",
        description: "Receive WiFi credentials immediately after payment. Use the QR code or manual credentials to connect. Enjoy high-speed internet with real-time session tracking.",
        icon: Wifi,
        iconBg: "bg-white",
        glow: "rgba(255,255,255,0.15)",
        numberBg: "bg-white",
    },
];

const OWNER_STEPS = [
    {
        id: 1,
        title: "List Your WiFi",
        description: "Create a listing for your WiFi spot with details like location, speed, pricing, available hours, and amenities. Add photos to attract more users.",
        icon: Home,
        iconBg: "bg-[#0055FF]",
        glow: "rgba(0,85,255,0.35)",
        numberBg: "bg-[#0055FF]",
    },
    {
        id: 2,
        title: "Get Bookings",
        description: "Your spot goes live after approval. Users discover and book your WiFi. You'll receive instant notifications for each booking with automatic credential sharing.",
        icon: Upload,
        iconBg: "bg-[#66FF00]",
        glow: "rgba(102,255,0,0.30)",
        numberBg: "bg-[#66FF00]",
    },
    {
        id: 3,
        title: "Earn Money",
        description: "Get paid automatically for every booking. Keep 98% of earnings (2% platform fee). Track your income, bookings, and reviews on your owner dashboard.",
        icon: BadgeDollarSign,
        iconBg: "bg-white",
        glow: "rgba(255,255,255,0.15)",
        numberBg: "bg-white",
    },
];

export const HowItWorks = ({ standalone = false }: { standalone?: boolean }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const { user, isAuthenticated } = useAuth();
    
    // Determine the default tab based on user role
    const getDefaultTab = (): 'user' | 'owner' => {
        if (isAuthenticated && user) {
            return user.role === 'owner' ? 'owner' : 'user';
        }
        return 'user';
    };
    
    const [activeTab, setActiveTab] = useState<'user' | 'owner'>(getDefaultTab());
    
    // Show toggle only when not authenticated
    const showToggle = !isAuthenticated;

    const STEPS = activeTab === 'user' ? USER_STEPS : OWNER_STEPS;

    return (
        <section className={`py-24 bg-white dark:bg-black text-gray-900 dark:text-white relative overflow-hidden ${standalone ? 'min-h-screen pt-32' : ''}`}>
            {/* Subtle grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

            <div className="container max-w-7xl mx-auto px-6 md:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto mb-12"
                >
                    <span className="text-[#66FF00] font-bold tracking-wider uppercase text-xs mb-4 block">Process</span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-5 tracking-tight">How it works</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                        {isAuthenticated && user
                            ? `Step-by-step guide for ${user.role === 'owner' ? 'WiFi owners' : 'WiFi users'}`
                            : 'Join the decentralized network in three simple steps. Whether you\'re a user or a host, getting started is seamless.'
                        }
                    </p>
                </motion.div>

                {/* Tab Toggle - Only show when not authenticated */}
                {showToggle && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex justify-center mb-16"
                    >
                        <div className="inline-flex bg-gray-100 dark:bg-gray-900/50 backdrop-blur-sm rounded-full p-1.5 border border-gray-200 dark:border-gray-800">
                            <button
                                onClick={() => setActiveTab('user')}
                                className={`px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                                    activeTab === 'user'
                                        ? 'bg-[#0055FF] text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                For Users
                            </button>
                            <button
                                onClick={() => setActiveTab('owner')}
                                className={`px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                                    activeTab === 'owner'
                                        ? 'bg-[#66FF00] text-black shadow-lg shadow-green-500/30'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <Building2 className="w-4 h-4" />
                                For Owners
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Steps */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid md:grid-cols-3 gap-8 relative"
                >
                    {/* Connecting line (desktop) */}
                    <div className="hidden md:block absolute top-[52px] left-[22%] right-[22%] h-px bg-gray-200 dark:bg-gray-800">
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 1.4, delay: 0.3, ease: "easeInOut" }}
                            className={`h-full origin-left ${
                                activeTab === 'user'
                                    ? 'bg-gradient-to-r from-[#0055FF] via-[#66FF00] to-gray-900 dark:to-white'
                                    : 'bg-gradient-to-r from-[#0055FF] via-[#66FF00] to-gray-900 dark:to-white'
                            }`}
                        />
                    </div>

                    {STEPS.map((step, i) => {
                        const Icon = step.icon;
                        const isGreen = step.iconBg === "bg-[#66FF00]";
                        const isWhite = step.iconBg === "bg-white";
                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: i * 0.18 }}
                                className="group flex flex-col items-center text-center"
                            >
                                {/* Icon box */}
                                <div className="relative mb-8">
                                    {/* Glow behind box */}
                                    <div
                                        className="absolute inset-0 rounded-3xl blur-2xl scale-110 opacity-60 transition-opacity duration-300 group-hover:opacity-90"
                                        style={{ background: step.glow }}
                                    />
                                    <div
                                        className={`relative w-[104px] h-[104px] rounded-3xl ${step.iconBg} flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2`}
                                    >
                                        <Icon
                                            className={`w-12 h-12 ${isGreen || isWhite ? 'text-black' : 'text-white'}`}
                                            strokeWidth={1.75}
                                        />
                                    </div>
                                    {/* Step number badge */}
                                    <div className={`absolute -top-3 -right-3 w-8 h-8 ${step.numberBg} ${isGreen || isWhite ? 'text-black' : 'text-white'} rounded-full flex items-center justify-center text-sm font-black border-2 border-gray-200 dark:border-black shadow-lg`}>
                                        {step.id}
                                    </div>
                                </div>

                                {/* Text */}
                                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{step.title}</h3>
                                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                                    {step.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.9 }}
                    className="mt-16 text-center"
                >
                    <Link to={activeTab === 'user' ? '/explore' : '/signup'}>
                        <Button className={`rounded-full px-8 py-6 font-bold text-base shadow-lg transition-all duration-200 ${
                            activeTab === 'user'
                                ? 'bg-[#0055FF] hover:bg-blue-600 text-white shadow-blue-500/20'
                                : 'bg-[#66FF00] hover:bg-green-400 text-black shadow-green-500/20'
                        }`}>
                            {activeTab === 'user' ? 'Find WiFi Near You' : 'Start Earning Today'} <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};