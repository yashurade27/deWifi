import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Wifi } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="w-full bg-[#00112e] dark:bg-gray-950 text-white pt-20 pb-10">
            <div className="container px-4 md:px-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div>
                        <Link to="/" className="flex items-center gap-2.5 mb-6 group">
                            <div className="w-8 h-8 bg-[#0055FF] rounded-lg flex items-center justify-center shadow-md shadow-blue-500/30">
                                <Wifi className="w-4 h-4 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-lg font-black tracking-tight text-white leading-none">
                                Air<span className="text-[#4d88ff]">Link</span>
                            </span>
                        </Link>
                        <p className="text-sm text-blue-300/70 mb-6 leading-relaxed">
                            Decentralized WiFi marketplace — share bandwidth, earn passively.
                        </p>
                        <div className="flex w-full max-w-xs items-center bg-white/5 p-1 rounded-full border border-blue-500/20 pl-4 focus-within:border-blue-500/50 transition-colors">
                            <input
                                type="email"
                                placeholder="your@email.com"
                                className="bg-transparent border-none focus:outline-none text-white w-full text-sm placeholder:text-blue-300/40"
                            />
                            <Button className="rounded-full bg-[#0055FF] hover:bg-[#0044CC] px-5 h-8 text-sm font-bold shrink-0">
                                Join
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h4 className="text-[#66FF00] text-xs font-bold uppercase tracking-widest mb-1">Company</h4>
                        {['Home', 'Enterprise', 'Explorer', 'About'].map(item => (
                            <Link key={item} to="/" className="text-sm text-blue-200/70 hover:text-white transition-colors">{item}</Link>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <h4 className="text-[#66FF00] text-xs font-bold uppercase tracking-widest mb-1">Resources</h4>
                        {['Blog', 'Litepaper', 'Points', 'Docs'].map(item => (
                            <Link key={item} to="/" className="text-sm text-blue-200/70 hover:text-white transition-colors">{item}</Link>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <h4 className="text-[#66FF00] text-xs font-bold uppercase tracking-widest mb-1">Connect</h4>
                        {['Discord', 'X (Twitter)', 'Telegram', 'GitHub'].map(item => (
                            <Link key={item} to="/" className="text-sm text-blue-200/70 hover:text-white transition-colors">{item}</Link>
                        ))}
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-blue-300/50">&copy; 2026 AirLink Inc. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="/terms" className="text-xs text-blue-300/50 hover:text-white transition-colors">Terms</Link>
                        <Link to="/privacy" className="text-xs text-blue-300/50 hover:text-white transition-colors">Privacy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
