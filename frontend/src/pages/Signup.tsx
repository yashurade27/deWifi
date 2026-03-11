import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wifi, Eye, EyeOff, ArrowRight, ShieldCheck, User, Zap, CheckCircle2, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useWeb3 } from '@/context/Web3Context';

type Role = 'user' | 'owner';

const ROLE_OPTIONS: { value: Role; icon: typeof User; label: string; sub: string; color: string; bg: string; border: string }[] = [
    {
        value: 'user',
        icon: Wifi,
        label: 'Find WiFi',
        sub: 'Browse & book spots',
        color: 'text-[#0055FF]',
        bg: 'bg-[#0055FF]/10',
        border: 'border-[#0055FF]',
    },
    {
        value: 'owner',
        icon: Zap,
        label: 'Share & Earn',
        sub: 'List your WiFi spot',
        color: 'text-green-600',
        bg: 'bg-[#66FF00]/15',
        border: 'border-green-500',
    },
];

const PERKS = [
    'No setup fees — free forever',
    'Payments secured on Ethereum blockchain',
    'Cancel or pause any time',
    'Verified hosts only',
];

const LEFT_PANEL_CONTENT: Record<Role, { badge: string; title: string; highlight: string; desc: string }> = {
    user: {
        badge: 'For Users',
        title: 'Fast WiFi,\nanywhere.',
        highlight: 'Pay only for what you use.',
        desc: 'Browse thousands of verified spots near you. Book by the hour starting at ₹30 — no subscriptions, no contracts.',
    },
    owner: {
        badge: 'For Hosts',
        title: 'Your router.\nYour income.',
        highlight: 'Earn ₹3,000–8,000/month.',
        desc: 'Turn your unused bandwidth into passive income. List your spot, set your price, and get paid automatically.',
    },
};

export default function Signup() {
    const [role, setRole] = useState<Role>('user');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signup } = useAuth();
    const { connect: connectWallet, address: walletAddress, isConnecting: walletConnecting, walletAvailable, disconnect: disconnectWallet } = useWeb3();
    const navigate = useNavigate();

    const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleWalletConnect = async () => {
        setError('');
        try {
            await connectWallet();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Wallet connection failed.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirm) return;
        setError('');
        setLoading(true);
        try {
            await signup({
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password,
                role,
                walletAddress: walletAddress || undefined,
            });
            navigate('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Sign up failed.');
        } finally {
            setLoading(false);
        }
    };

    const panel = LEFT_PANEL_CONTENT[role];

    return (
        <div className="min-h-screen flex font-sans">
            {/* ── Left Panel ─────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[48%] relative flex-col bg-[#050511] dark:bg-gray-950 overflow-hidden">
                {/* Gradient blobs */}
                <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-[#0055FF]/20 blur-[130px] pointer-events-none" />
                <div className="absolute bottom-[-60px] right-[-60px] w-[380px] h-[380px] rounded-full bg-[#66FF00]/10 blur-[110px] pointer-events-none" />

                {/* Dot-grid pattern overlay */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />

                <div className="relative z-10 flex flex-col h-full px-14 py-8">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group w-fit">
                        <div className="w-9 h-9 bg-[#0055FF] rounded-xl flex items-center justify-center shadow-[0_2px_16px_rgba(0,85,255,0.5)]">
                            <Wifi className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-[1.3rem] font-black tracking-tight text-white leading-none">
                            Air<span className="text-[#66FF00]">Link</span>
                        </span>
                    </Link>

                    {/* Dynamic copy */}
                    <div className="mt-8 mb-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={role}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <span className="inline-block rounded-full bg-[#0055FF]/20 border border-[#0055FF]/40 px-4 py-1.5 text-xs font-bold text-[#0055FF] uppercase tracking-wider mb-6">
                                    {panel.badge}
                                </span>
                                <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] mb-4 whitespace-pre-line">
                                    {panel.title}
                                </h1>
                                <p className="text-[#66FF00] font-bold text-lg mb-3">{panel.highlight}</p>
                                <p className="text-gray-400 text-base leading-relaxed max-w-sm">{panel.desc}</p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Perks list */}
                        <motion.ul
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="mt-6 space-y-2"
                        >
                            {PERKS.map((perk) => (
                                <li key={perk} className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-[#66FF00] shrink-0" />
                                    {perk}
                                </li>
                            ))}
                        </motion.ul>
                    </div>

                    {/* Bottom label */}
                    <p className="text-gray-700 text-xs font-medium">
                        Trusted by <span className="text-white font-bold">12,000+</span> users across India
                    </p>
                </div>
            </div>

            {/* ── Right Panel (Form) ──────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 px-6 py-6 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-[440px]"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2.5 mb-6">
                        <div className="w-8 h-8 bg-[#0055FF] rounded-lg flex items-center justify-center shadow-[0_2px_12px_rgba(0,85,255,0.35)]">
                            <Wifi className="w-4 h-4 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-[1.2rem] font-black tracking-tight dark:text-white text-black leading-none">
                            Air<span className="text-[#66FF00]">Link</span>
                        </span>
                    </div>

                    {/* Heading */}
                    <div className="mb-5">
                        <h2 className="text-3xl font-black text-black dark:text-white tracking-tight mb-1.5">Create your account</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Join thousands of users on AirLink — it's free.</p>
                    </div>

                    {/* Role selector */}
                    <div className="mb-5">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">I want to…</p>
                        <div className="grid grid-cols-2 gap-3">
                            {ROLE_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const active = role === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setRole(opt.value)}
                                        className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left focus:outline-none ${
                                            active
                                                ? `${opt.border} bg-white dark:bg-gray-800 shadow-md`
                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? opt.bg : 'bg-gray-200 dark:bg-gray-700'} transition-colors`}>
                                            <Icon className={`w-4 h-4 ${active ? opt.color : 'text-gray-500 dark:text-gray-400'}`} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{opt.label}</p>
                                            <p className="text-[11px] text-gray-400 font-medium">{opt.sub}</p>
                                        </div>
                                        {active && (
                                            <motion.div
                                                layoutId="role-check"
                                                className="absolute top-2.5 right-2.5"
                                            >
                                                <CheckCircle2 className={`w-4 h-4 ${opt.color}`} />
                                            </motion.div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Trust badge */}
                    <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
                        <ShieldCheck className="w-5 h-5 text-[#0055FF] shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                            Your data is encrypted and never shared with third parties
                        </p>
                    </div>

                    {/* Form */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Name */}
                        <div className="space-y-1">
                            <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Yash Urade"
                                value={form.name}
                                onChange={handleChange('name')}
                                required
                                className="h-12 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm focus-visible:border-[#0055FF] dark:focus-visible:border-[#66FF00] focus-visible:ring-[#0055FF]/20 dark:focus-visible:ring-[#66FF00]/20 transition-all"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange('email')}
                                required
                                className="h-12 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm focus-visible:border-[#0055FF] dark:focus-visible:border-[#66FF00] focus-visible:ring-[#0055FF]/20 dark:focus-visible:ring-[#66FF00]/20 transition-all"
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-1">
                            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone number</Label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 dark:text-gray-400 select-none">+91</span>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="98765 43210"
                                    value={form.phone}
                                    onChange={handleChange('phone')}
                                    required
                                    className="h-12 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm pl-12 focus-visible:border-[#0055FF] dark:focus-visible:border-[#66FF00] focus-visible:ring-[#0055FF]/20 dark:focus-visible:ring-[#66FF00]/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Wallet Connect */}
                        <div className="space-y-1">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <Wallet className="w-4 h-4 inline mr-1" />
                                Ethereum Wallet {role === 'owner' ? '(Recommended)' : '(Optional)'}
                            </Label>
                            {walletAddress ? (
                                <div className="flex items-center gap-2 h-12 px-4 rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm font-mono text-green-800 dark:text-green-300 flex-1">
                                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={disconnectWallet}
                                        className="text-xs font-semibold text-red-500 hover:text-red-700"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : walletAvailable ? (
                                <button
                                    type="button"
                                    onClick={handleWalletConnect}
                                    disabled={walletConnecting}
                                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-[#0055FF] dark:hover:border-[#66FF00] hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-sm font-semibold text-gray-600 dark:text-gray-300 disabled:opacity-50"
                                >
                                    <Wallet className="w-4 h-4 text-[#0055FF]" />
                                    {walletConnecting ? 'Connecting...' : 'Connect MetaMask'}
                                </button>
                            ) : (
                                <a
                                    href="https://metamask.io/download/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition-all text-sm font-semibold text-gray-500 dark:text-gray-400"
                                >
                                    <Wallet className="w-4 h-4 text-orange-500" />
                                    Install MetaMask
                                </a>
                            )}
                            {role === 'owner' && !walletAddress && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                                    Owners should connect a wallet to receive ETH payments from bookings
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 8 characters"
                                    value={form.password}
                                    onChange={handleChange('password')}
                                    required
                                    minLength={8}
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

                        {/* Confirm Password */}
                        <div className="space-y-1">
                            <Label htmlFor="confirm" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Confirm password</Label>
                            <div className="relative">
                                <Input
                                    id="confirm"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Re-enter password"
                                    value={form.confirm}
                                    onChange={handleChange('confirm')}
                                    required
                                    className={`h-12 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm pr-12 transition-all focus-visible:ring-2 ${
                                        form.confirm && form.password !== form.confirm
                                            ? 'border-red-400 dark:border-red-600 bg-gray-50 dark:bg-gray-800 focus-visible:border-red-400 dark:focus-visible:border-red-500 focus-visible:ring-red-200 dark:focus-visible:ring-red-900/50'
                                            : form.confirm && form.password === form.confirm
                                            ? 'border-green-400 dark:border-green-600 bg-gray-50 dark:bg-gray-800 focus-visible:border-green-400 dark:focus-visible:border-green-500 focus-visible:ring-green-200 dark:focus-visible:ring-green-900/50'
                                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-visible:border-[#0055FF] dark:focus-visible:border-[#66FF00] focus-visible:ring-[#0055FF]/20 dark:focus-visible:ring-[#66FF00]/20'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    aria-label="Toggle confirm password visibility"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {form.confirm && form.password !== form.confirm && (
                                <p className="text-xs text-red-500 dark:text-red-400 font-medium mt-1">Passwords don't match</p>
                            )}
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-2.5 pt-1">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                required
                                className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 accent-[#0055FF] dark:accent-[#66FF00] cursor-pointer shrink-0 dark:bg-gray-800"
                            />
                            <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer select-none">
                                I agree to AirLink's{' '}
                                <Link to="/terms" className="text-[#0055FF] font-semibold hover:underline">Terms of Service</Link>
                                {' '}and{' '}
                                <Link to="/privacy" className="text-[#0055FF] font-semibold hover:underline">Privacy Policy</Link>
                            </label>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={!agreed || loading || (form.confirm !== '' && form.password !== form.confirm)}
                            className="w-full h-12 bg-[#0055FF] hover:bg-[#0044CC] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account…' : 'Create free account'}
                            {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </form>

                    {/* Sign in link */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-bold text-[#0055FF] dark:text-[#66FF00] hover:text-[#0044CC] dark:hover:text-green-400 transition-colors"
                        >
                            Sign in →
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
