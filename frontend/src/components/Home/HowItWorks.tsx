import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Wifi, CreditCard, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

const STEPS = [
    {
        id: 1,
        title: "Discover",
        description: "Find nearby WiFi spots on our interactive map. Filter by speed, price, and amenities.",
        icon: MapPin,
        color: "bg-blue-500",
    },
    {
        id: 2,
        title: "Connect",
        description: "Choose a spot and book instantly. Pay securely per minute or hour via crypto or fiat.",
        icon: Wifi,
        color: "bg-[#66FF00]",
    },
    {
        id: 3,
        title: "Earn",
        description: "Share your own WiFi and earn passive income. Get paid automatically for every connection.",
        icon: CreditCard,
        color: "bg-purple-500",
    }
];

export const HowItWorks = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="container max-w-7xl mx-auto px-6 md:px-8 relative z-10">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <span className="text-[#0055FF] font-bold tracking-wider uppercase text-xs mb-4 block">Process</span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-5 tracking-tight">How it works</h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Join the decentralized network in three simple steps.
                        Whether you're a user or a host, getting started is seamless.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-12 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-100 -z-10">
                        <motion.div 
                            initial={{ scaleX: 0 }}
                            animate={isInView ? { scaleX: 1 } : {}}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-blue-500 via-[#66FF00] to-purple-500 origin-left"
                        />
                    </div>

                    {STEPS.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: i * 0.2 }}
                                className="relative flex flex-col items-center text-center group"
                            >
                                <div className={`w-24 h-24 rounded-3xl ${step.color} bg-opacity-10 flex items-center justify-center mb-8 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-xl`}>
                                    <div className={`absolute inset-0 ${step.color} blur-2xl opacity-20`} />
                                    <Icon className={`w-10 h-10 ${step.color.replace('bg-', 'text-')}`} strokeWidth={1.5} />
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold border-4 border-white">
                                        {step.id}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                <p className="text-base text-gray-600 leading-relaxed max-w-xs mx-auto">
                                    {step.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 1 }}
                    className="mt-12 text-center"
                >
                    <Button className="rounded-full px-7 py-6 bg-black hover:bg-gray-800 text-white font-bold text-base shadow-lg shadow-black/10">
                        Get Started Now <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </motion.div>
            </div>
        </section>
    );
};