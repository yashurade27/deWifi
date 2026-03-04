import { ShieldCheck, Zap, Globe, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
    {
        icon: ShieldCheck,
        title: "Verified Security",
        description: "Every host is verified. Smart contracts ensure secure payments and data privacy."
    },
    {
        icon: Zap,
        title: "Blazing Speed",
        description: "Connect to high-performance local networks. 5G and Fiber speeds available."
    },
    {
        icon: Globe,
        title: "Global Access",
        description: "One account, thousands of spots worldwide. Roam without roaming fees."
    },
    {
        icon: Wallet,
        title: "Instant Payouts",
        description: "Hosts receive earnings in real-time. No monthly waiting periods."
    }
];

export const Features = () => {
    return (
        <section className="py-24 bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
            <div className="container max-w-7xl mx-auto px-6 md:px-8">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-[#0055FF] font-bold tracking-wider uppercase text-xs mb-4 block">Why deWifi</span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-5 leading-tight">
                            The future of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">internet access.</span>
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
                            We are dismantling the monopoly of big telecom. 
                            By empowering the community, we build a faster, cheaper, and more resilient network for everyone.
                        </p>
                        <div className="flex gap-4">
                            <div className="h-1 w-20 bg-[#0055FF] rounded-full"></div>
                            <div className="h-1 w-20 bg-gray-300 dark:bg-gray-800 rounded-full"></div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                         {FEATURES.map((feature, i) => {
                             const Icon = feature.icon;
                             return (
                                 <motion.div
                                     key={i}
                                     whileHover={{ y: -5 }}
                                     className="bg-white dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 transition-colors duration-300"
                                 >
                                     <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 text-[#0055FF]">
                                         <Icon className="w-6 h-6" />
                                     </div>
                                     <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                                     <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                                         {feature.description}
                                     </p>
                                 </motion.div>
                             )
                         })}
                    </div>
                </div>
            </div>
        </section>
    );
};