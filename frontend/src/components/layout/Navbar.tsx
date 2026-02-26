import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Menu, X, Wifi } from 'lucide-react';

const NAV_LINKS = [
    { label: 'Explore', to: '/explore' },
    { label: 'How it works', to: '/how-it-works' },
    { label: 'Community', to: '/community' },
    { label: 'Enterprise', to: '/enterprise' },
];

export const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${
                scrolled
                    ? 'bg-white/96 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.06)]'
                    : 'bg-white/80 backdrop-blur-md border-b border-gray-100/80'
            }`}
        >
            <div className="container px-4 md:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                    <div className="w-8 h-8 bg-[#0055FF] rounded-lg flex items-center justify-center shadow-[0_2px_12px_rgba(0,85,255,0.35)] group-hover:shadow-[0_4px_16px_rgba(0,85,255,0.5)] transition-shadow duration-300">
                        <Wifi className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-[1.2rem] font-black tracking-tight text-black leading-none">
                        de<span className="text-[#0055FF]">Wifi</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-0.5">
                    {NAV_LINKS.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#0055FF] hover:bg-blue-50 rounded-full transition-all duration-200"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* CTA */}
                <div className="hidden md:flex items-center gap-2">
                    <Link
                        to="/login"
                        className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-[#0055FF] rounded-full hover:bg-blue-50 transition-all duration-200"
                    >
                        Log in
                    </Link>
                    <Button asChild className="bg-[#0055FF] text-white hover:bg-[#0044CC] rounded-full px-6 h-10 text-sm font-bold shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300">
                        <Link to="/signup">Get Started</Link>
                    </Button>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={isOpen ? 'close' : 'open'}
                            initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.15 }}
                        >
                            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </motion.div>
                    </AnimatePresence>
                </button>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="md:hidden overflow-hidden bg-white border-t border-gray-100"
                    >
                        <div className="container px-4 py-4 flex flex-col gap-1">
                            {NAV_LINKS.map((link, i) => (
                                <motion.div
                                    key={link.to}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05, duration: 0.2 }}
                                >
                                    <Link
                                        to={link.to}
                                        className="block px-4 py-3 text-base font-semibold text-gray-700 hover:text-[#0055FF] hover:bg-blue-50 rounded-xl transition-all"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}
                            <hr className="my-2 border-gray-100" />
                            <Link to="/login" className="px-4 py-3 text-base font-semibold text-gray-700 hover:text-[#0055FF]" onClick={() => setIsOpen(false)}>
                                Log in
                            </Link>
                            <Button asChild className="bg-[#0055FF] w-full rounded-full py-5 text-base font-bold mt-1 shadow-md shadow-blue-500/25">
                                <Link to="/signup" onClick={() => setIsOpen(false)}>Get Started</Link>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};
