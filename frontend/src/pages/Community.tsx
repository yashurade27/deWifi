import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Trophy, Heart, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Community = () => {
    const { user, isAuthenticated } = useAuth();

    const stats = [
        { icon: Users, label: 'Active Members', value: '50,000+', color: 'text-blue-500' },
        { icon: MessageSquare, label: 'Daily Connections', value: '5,000+', color: 'text-green-500' },
        { icon: Trophy, label: 'Top Contributors', value: '1,200+', color: 'text-yellow-500' },
        { icon: Heart, label: 'Success Stories', value: '10,000+', color: 'text-red-500' },
    ];

    const benefits = [
        {
            title: 'Connect with WiFi Enthusiasts',
            description: 'Join a vibrant community of users and owners sharing their experiences.',
            icon: Users,
            color: 'bg-blue-500',
        },
        {
            title: 'Share Your Experience',
            description: 'Post reviews, tips, and recommendations to help others find the best WiFi spots.',
            icon: MessageSquare,
            color: 'bg-green-500',
        },
        {
            title: 'Earn Rewards & Badges',
            description: 'Get recognized for your contributions with exclusive badges and rewards.',
            icon: Trophy,
            color: 'bg-yellow-500',
        },
        {
            title: 'Get Support',
            description: 'Ask questions, get help, and learn from experienced community members.',
            icon: Star,
            color: 'bg-purple-500',
        },
    ];

    const topContributors = [
        { name: 'Yash Urade', spots: 25, reviews: 150, rating: 4.9, badge: 'Super Host' },
        { name: 'Samiksha Musale', bookings: 200, reviews: 85, rating: 4.8, badge: 'Explorer' },
        { name: 'Vaidehi Narkhede', spots: 18, reviews: 120, rating: 4.9, badge: 'Trusted Owner' },
        { name: 'Spandan Mali', bookings: 150, reviews: 95, rating: 4.7, badge: 'Active User' },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <Navbar />
            
            {/* Hero Section */}
            <section className="pt-32 pb-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
                
                <div className="container max-w-7xl mx-auto px-6 md:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <span className="text-[#0055FF] dark:text-[#66FF00] font-bold tracking-wider uppercase text-xs mb-4 block">
                            Join the Network
                        </span>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                            Welcome to the{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0055FF] to-[#66FF00]">
                                AirLink Community
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                            Connect with thousands of WiFi users and owners. Share experiences, 
                            earn rewards, and be part of the decentralized internet revolution.
                        </p>
                        {!isAuthenticated && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap gap-4 justify-center"
                            >
                                <a
                                    href="/signup"
                                    className="px-8 py-4 bg-[#0055FF] hover:bg-blue-600 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 transition-all"
                                >
                                    Join the Community
                                </a>
                                <a
                                    href="/login"
                                    className="px-8 py-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white font-bold rounded-full border border-gray-200 dark:border-white/20 transition-all"
                                >
                                    Sign In
                                </a>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white dark:bg-black">
                <div className="container max-w-7xl mx-auto px-6 md:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
                                >
                                    <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                                    <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-gray-50 dark:bg-black">
                <div className="container max-w-7xl mx-auto px-6 md:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            Community Benefits
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Discover what makes our community special
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {benefits.map((benefit, index) => {
                            const Icon = benefit.icon;
                            return (
                                <motion.div
                                    key={benefit.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-8 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-xl transition-all group"
                                >
                                    <div className={`w-14 h-14 ${benefit.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{benefit.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{benefit.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Top Contributors Section */}
            <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900">
                <div className="container max-w-7xl mx-auto px-6 md:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="text-[#0055FF] dark:text-[#66FF00] font-bold tracking-wider uppercase text-xs mb-4 block">
                            Hall of Fame
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            Top Contributors
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Meet our amazing community members making a difference
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {topContributors.map((contributor, index) => (
                            <motion.div
                                key={contributor.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-[#0055FF] dark:hover:border-[#66FF00] hover:shadow-xl transition-all group"
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-[#0055FF] to-[#66FF00] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black text-white group-hover:scale-110 transition-transform">
                                    {contributor.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{contributor.name}</h3>
                                <span className="inline-block px-3 py-1 bg-[#0055FF]/10 dark:bg-[#66FF00]/20 text-[#0055FF] dark:text-[#66FF00] text-xs font-bold rounded-full mb-3">
                                    {contributor.badge}
                                </span>
                                <div className="flex items-center justify-center gap-1 text-yellow-500 mb-3">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="font-bold text-gray-900 dark:text-white">{contributor.rating}</span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    {contributor.spots && <p>{contributor.spots} WiFi Spots</p>}
                                    {contributor.bookings && <p>{contributor.bookings} Bookings</p>}
                                    <p>{contributor.reviews} Reviews</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {!isAuthenticated && (
                <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
                    <div className="container max-w-4xl mx-auto px-6 md:px-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <TrendingUp className="w-16 h-16 text-[#0055FF] dark:text-[#66FF00] mx-auto mb-6" />
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
                                Ready to Join?
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                                Create your account today and become part of the fastest-growing WiFi sharing community.
                            </p>
                            <a
                                href="/signup"
                                className="inline-block px-10 py-4 bg-gradient-to-r from-[#0055FF] to-[#66FF00] hover:from-blue-600 hover:to-green-400 text-white font-bold rounded-full shadow-2xl shadow-blue-500/30 dark:shadow-blue-500/20 transition-all"
                            >
                                Get Started Now
                            </a>
                        </motion.div>
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
};

export default Community;
