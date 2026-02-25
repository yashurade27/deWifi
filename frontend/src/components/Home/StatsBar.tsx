import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Trophy, TrendingUp } from 'lucide-react';

const stats = [
    {
        value: '23%',
        title: 'Customers',
        description: 'Increase in local customers for businesses using the WiFi network.',
        icon: Trophy,
        variant: 'blue' as const,
    },
    {
        value: '45%',
        title: 'Connected Devices',
        description: 'Amount of increased connected devices for enterprises on the p2p network.',
        icon: Zap,
        variant: 'light' as const,
    },
    {
        value: '82%',
        title: 'Data Transactions',
        description: 'Data consumption increase by customers now connected via our marketplace.',
        icon: TrendingUp,
        variant: 'light' as const,
    },
];

export const StatsSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <section className="w-full py-24 bg-white">
            <div className="container max-w-7xl mx-auto px-6 md:px-8">
                {/* Header */}
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 32 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-12"
                >
                    <span className="inline-block rounded-full bg-[#66FF00] px-4 py-1.5 text-xs font-bold text-black uppercase tracking-wider mb-5">
                        Provider Stats
                    </span>
                    <div className="grid lg:grid-cols-2 gap-8 items-end">
                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-black leading-tight">
                            Our impact
                        </h2>
                        <div>
                            <h3 className="text-xl font-bold mb-3 text-black">Data-led, with results to show.</h3>
                            <p className="text-base text-gray-600 leading-relaxed">
                                For years, the network has boosted connectivity for leading enterprises
                                and everyday users — and the numbers prove it.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        const isBlue = stat.variant === 'blue';
                        return (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 40 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.1 }}
                                whileHover={{ scale: 1.025, transition: { duration: 0.2 } }}
                                className={`p-8 rounded-[2rem] flex flex-col justify-between min-h-[380px] cursor-default ${
                                    isBlue
                                        ? 'bg-[#0055FF] text-white shadow-xl shadow-blue-500/20'
                                        : 'bg-[#F3F4F6] text-black'
                                }`}
                            >
                                <span className={`text-8xl font-light block leading-none ${isBlue ? 'text-white' : 'text-black'}`}>
                                    {stat.value.replace('%', '')}
                                    <span className="text-4xl font-bold align-top">%</span>
                                </span>
                                <div>
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                                        isBlue ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-200'
                                    }`}>
                                        <Icon className={`h-5 w-5 ${isBlue ? 'text-white' : 'text-black'}`} />
                                    </div>
                                    <h4 className="text-xl font-bold mb-2">{stat.title}</h4>
                                    <p className={`text-sm leading-relaxed ${isBlue ? 'text-blue-100' : 'text-gray-500'}`}>
                                        {stat.description}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
