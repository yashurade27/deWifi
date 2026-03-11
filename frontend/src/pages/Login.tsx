import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wifi, Eye, EyeOff, ArrowRight, ShieldCheck, Zap, Star, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useWeb3 } from '@/context/Web3Context';

const TESTIMONIAL = {
    quote: "I earned 0.5 ETH last month just by sharing my home broadband. Setup took 5 minutes.",
    author: "Yash Urade",
    role: "WiFi Host, Pune",
    rating: 5,
};

const STATS = [
    { value: '12,000+', label: 'Active Spots' },
    { value: '150 ETH', label: 'Paid to Hosts' },
    { value: '4.9★', label: 'Avg Rating' },
];

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signin } = useAuth();
    const { connect: connectWallet, address: walletAddress, isConnecting: walletConnecting, walletAvailable } = useWeb3();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signin({ email, password });
            navigate('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Sign in failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleWalletConnect = async () => {
        setError('');
        try {
            await connectWallet();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Wallet connection failed.');
        }
    };

    return (
        <div className="min-h-screen flex font-sans">
            {/* ── Left Panel ─────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[52%] relative flex-col bg-[#050511] dark:bg-gray-950 overflow-hidden">
                {/* Gradient blobs */}
                <div className="absolute top-[-120px] left-[-120px] w-[480px] h-[480px] rounded-full bg-[#0055FF]/20 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full bg-[#66FF00]/10 blur-[100px] pointer-events-none" />

                {/* Inner content */}
                <div className="relative z-10 flex flex-col h-full px-14 py-12">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group w-fit">
                        <div className="w-9 h-9 bg-[#0055FF] rounded-xl flex items-center justify-center shadow-[0_2px_16px_rgba(0,85,255,0.5)]">
                            <Wifi className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-[1.3rem] font-black tracking-tight text-white leading-none">
                            Air<span className="text-[#66FF00]">Link</span>
                        </span>
                    </Link>

                    {/* Main copy */}
                    <div className="mt-auto mb-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <span className="inline-block rounded-full bg-[#0055FF]/20 border border-[#0055FF]/40 px-4 py-1.5 text-xs font-bold text-[#0055FF] uppercase tracking-wider mb-6">
                                Peer-to-Peer WiFi
                            </span>
                            <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] mb-6">
                                Your internet.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0055FF] to-[#66FF00]">
                                    Your income.
                                </span>
                            </h1>
                            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                                Connect to thousands of verified WiFi spots or monetize your unused bandwidth — all in one platform.
                            </p>
                        </motion.div>

                        {/* Stats row */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                            className="flex gap-8 mt-10"
                        >
                            {STATS.map((s) => (
                                <div key={s.label}>
                                    <p className="text-2xl font-black text-white">{s.value}</p>
                                    <p className="text-gray-500 text-xs font-semibold mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Testimonial card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.28 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm"
                    >
                        <div className="flex gap-1 mb-3">
                            {Array.from({ length: TESTIMONIAL.rating }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <p className="text-white text-base font-medium leading-relaxed mb-4">
                            "{TESTIMONIAL.quote}"
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0055FF] to-[#66FF00] flex items-center justify-center text-sm font-black text-white">
                                {TESTIMONIAL.author[0]}
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold">{TESTIMONIAL.author}</p>
                                <p className="text-gray-500 text-xs">{TESTIMONIAL.role}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Right Panel (Form) ──────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-[420px]"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2.5 mb-10">
                        <div className="w-8 h-8 bg-[#0055FF] rounded-lg flex items-center justify-center shadow-[0_2px_12px_rgba(0,85,255,0.35)]">
                            <Wifi className="w-4 h-4 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-[1.2rem] font-black tracking-tight dark:text-white text-black leading-none">
                            Air<span className="text-[#66FF00]">Link</span>
                        </span>
                    </div>

                    {/* Heading */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-black dark:text-white tracking-tight mb-2">Welcome back</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to your AirLink account</p>
                    </div>

                    {/* Trust badges */}
                    <div className="flex items-center gap-4 mb-8 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
                        <ShieldCheck className="w-5 h-5 text-[#0055FF] shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                            Secured with bank-grade encryption & JWT authentication
                        </p>
                    </div>

                    {/* Form */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Email address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm focus-visible:border-[#0055FF] dark:focus-visible:border-[#66FF00] focus-visible:ring-[#0055FF]/20 dark:focus-visible:ring-[#66FF00]/20 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Password
                                </Label>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs font-semibold text-[#0055FF] dark:text-[#66FF00] hover:text-[#0044CC] dark:hover:text-green-400 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm pr-12 focus-visible:border-[#0055FF] dark:focus-visible:border-[#66FF00] focus-visible:ring-[#0055FF]/20 dark:focus-visible:ring-[#66FF00]/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2.5">
                            <input
                                id="remember"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#0055FF] dark:text-[#66FF00] accent-[#0055FF] dark:accent-[#66FF00] cursor-pointer dark:bg-gray-800"
                            />
                            <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400 font-medium cursor-pointer select-none">
                                Remember me for 30 days
                            </label>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[#0055FF] hover:bg-[#0044CC] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in…' : 'Sign in to AirLink'}
                            {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-7">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-gray-900 px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                or continue with
                            </span>
                        </div>
                    </div>

                    {/* Wallet Connect */}
                    {walletAvailable ? (
                        <button
                            type="button"
                            onClick={handleWalletConnect}
                            disabled={walletConnecting}
                            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-[#0055FF]/40 dark:hover:border-[#66FF00]/40 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all font-bold text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50"
                        >
                            <Wallet className="w-5 h-5 text-[#0055FF]" />
                            {walletConnecting
                                ? 'Connecting...'
                                : walletAddress
                                ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                                : 'Connect MetaMask Wallet'
                            }
                        </button>
                    ) : (
                        <a
                            href="https://metamask.io/download/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition-all font-bold text-sm text-gray-700 dark:text-gray-300"
                        >
                            <Wallet className="w-5 h-5 text-orange-500" />
                            Install MetaMask to use Web3
                        </a>
                    )}

                    {/* Quick role login hint */}
                    <div className="grid grid-cols-2 gap-3 mt-5">
                        <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-[#0055FF]/40 dark:hover:border-[#66FF00]/40 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all cursor-pointer group">
                            <div className="w-8 h-8 rounded-lg bg-[#0055FF]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0055FF]/20 transition-colors">
                                <Wifi className="w-4 h-4 text-[#0055FF]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-800 dark:text-white">Find WiFi</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">User account</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-[#66FF00]/50 dark:hover:border-[#66FF00]/50 hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-all cursor-pointer group">
                            <div className="w-8 h-8 rounded-lg bg-[#66FF00]/10 flex items-center justify-center shrink-0 group-hover:bg-[#66FF00]/20 transition-colors">
                                <Zap className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-800 dark:text-white">Share & Earn</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Host account</p>
                            </div>
                        </div>
                    </div>

                    {/* Sign up link */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                        Don't have an account?{' '}
                        <Link
                            to="/signup"
                            className="font-bold text-[#0055FF] dark:text-[#66FF00] hover:text-[#0044CC] dark:hover:text-green-400 transition-colors"
                        >
                            Create one free →
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
