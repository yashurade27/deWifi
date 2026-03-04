import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Wifi, LogOut, Settings, LayoutDashboard, Plus, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const NAV_LINKS = [
    { label: 'Explore', to: '/explore' },
    { label: 'How it works', to: '/how-it-works' },
    { label: 'Community', to: '/community' },
    { label: 'Enterprise', to: '/enterprise' },
];

export const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const { user, signout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignout = async () => {
        await signout();
        navigate('/');
        setDropdownOpen(false);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${
                scrolled
                    ? 'bg-white/96 dark:bg-gray-900/96 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)]'
                    : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100/80 dark:border-gray-800/80'
            }`}
        >
            <div className="container px-4 md:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                    <div className="w-8 h-8 bg-[#0055FF] rounded-lg flex items-center justify-center shadow-[0_2px_12px_rgba(0,85,255,0.35)] group-hover:shadow-[0_4px_16px_rgba(0,85,255,0.5)] transition-shadow duration-300">
                        <Wifi className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-[1.2rem] font-black tracking-tight text-black dark:text-white leading-none">
                        de<span className="text-[#0055FF]">Wifi</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-0.5">
                    {NAV_LINKS.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#0055FF] dark:hover:text-[#66FF00] hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-all duration-200"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* CTA */}
                {user ? (
                    <div className="hidden md:flex items-center gap-3">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? (
                                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            ) : (
                                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            )}
                        </button>
                        
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0055FF] to-[#66FF00] flex items-center justify-center text-xs font-bold text-white">
                                    {getInitials(user.name)}
                                </div>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden lg:block">{user.name}</span>
                            </button>

                            {/* Dropdown */}
                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-50"
                                    >
                                        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                            <span className="inline-block mt-2 px-2 py-1 text-xs font-bold rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#0055FF] dark:text-[#66FF00] capitalize">{user.role}</span>
                                        </div>
                                        <div className="py-2">
                                            {user.role === 'owner' ? (
                                                <>
                                                    <Link
                                                        to="/owner/dashboard"
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                        onClick={() => setDropdownOpen(false)}
                                                    >
                                                        <LayoutDashboard className="w-4 h-4" />
                                                        Owner Dashboard
                                                    </Link>
                                                    <Link
                                                        to="/owner/spots/new"
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                        onClick={() => setDropdownOpen(false)}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Add WiFi Spot
                                                    </Link>
                                                </>
                                            ) : (
                                                <Link
                                                    to="/dashboard"
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <LayoutDashboard className="w-4 h-4" />
                                                    My Bookings
                                                </Link>
                                            )}
                                            <Link
                                                to="/profile"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <Settings className="w-4 h-4" />
                                                Profile Settings
                                            </Link>
                                            <button
                                                onClick={handleSignout}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex items-center gap-3">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? (
                                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            ) : (
                                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            )}
                        </button>
                        
                        <Link
                            to="/login"
                            className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-[#0055FF] dark:hover:text-[#66FF00] rounded-full hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200"
                        >
                            Log in
                        </Link>
                        <Button asChild className="bg-[#0055FF] dark:bg-[#66FF00] text-white dark:text-black hover:bg-[#0044CC] dark:hover:bg-green-400 rounded-full px-6 h-10 text-sm font-bold shadow-md shadow-blue-500/25 dark:shadow-green-500/25 hover:shadow-blue-500/40 dark:hover:shadow-green-500/40 transition-all duration-300">
                            <Link to="/signup">Get Started</Link>
                        </Button>
                    </div>
                )}

                {/* Mobile Toggle */}
                <button
                    className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                        className="md:hidden overflow-hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800"
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
                                        className="block px-4 py-3 text-base font-semibold text-gray-700 dark:text-gray-300 hover:text-[#0055FF] dark:hover:text-[#66FF00] hover:bg-blue-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}
                            
                            {/* Theme Toggle in Mobile Menu */}
                            <button
                                onClick={() => {
                                    toggleTheme();
                                    setIsOpen(false);
                                }}
                                className="flex items-center gap-2 px-4 py-3 text-base font-semibold text-gray-700 dark:text-gray-300 hover:text-[#0055FF] dark:hover:text-[#66FF00] hover:bg-blue-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                            >
                                {theme === 'light' ? (
                                    <>
                                        <Moon className="w-4 h-4" />
                                        Dark Mode
                                    </>
                                ) : (
                                    <>
                                        <Sun className="w-4 h-4" />
                                        Light Mode
                                    </>
                                )}
                            </button>
                            
                            <hr className="my-2 border-gray-100 dark:border-gray-800" />
                            {user ? (
                                <>
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                        <span className="inline-block mt-2 px-2 py-1 text-xs font-bold rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#0055FF] dark:text-[#66FF00] capitalize">{user.role}</span>
                                    </div>
                                    <Link to="/profile" className="px-4 py-3 text-base font-semibold text-gray-700 dark:text-gray-300 hover:text-[#0055FF] dark:hover:text-[#66FF00] flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                        <Settings className="w-4 h-4" />
                                        Profile Settings
                                    </Link>
                                    <button
                                        onClick={handleSignout}
                                        className="w-full text-left px-4 py-3 text-base font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="px-4 py-3 text-base font-semibold text-gray-700 dark:text-gray-300 hover:text-[#0055FF] dark:hover:text-[#66FF00]" onClick={() => setIsOpen(false)}>
                                        Log in
                                    </Link>
                                    <Button asChild className="bg-[#0055FF] w-full rounded-full py-5 text-base font-bold mt-1 shadow-md shadow-blue-500/25">
                                        <Link to="/signup" onClick={() => setIsOpen(false)}>Get Started</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};
