import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { 
  Wifi, 
  Plus, 
  TrendingUp, 
  Users, 
  Star, 
  Activity,
  Power,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  IndianRupee,
  Copy,
  Check,
  Terminal,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

interface WifiSpot {
  _id: string;
  name: string;
  address: string;
  city: string;
  pricePerHour: number;
  speedMbps: number;
  maxUsers: number;
  currentUsers: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  tag: string;
  monitoring: {
    isOnline: boolean;
    uptimePercent: number;
    lastPingAt: string;
  };
}

interface OwnerStats {
  totalSpots: number;
  activeSpots: number;
  onlineSpots: number;
  avgRating: number;
  avgUptime: number;
}

export default function OwnerDashboard() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [spots, setSpots] = useState<WifiSpot[]>([]);
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'owner') {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, navigate]);

  const fetchData = async () => {
    try {
      const [spotsRes, statsRes] = await Promise.all([
        apiFetch<{ spots: WifiSpot[] }>('/api/owner/spots', { token: token! }),
        apiFetch<{ stats: OwnerStats }>('/api/owner/stats', { token: token! }),
      ]);
      setSpots(spotsRes.spots);
      setStats(statsRes.stats);
    } catch (err) {
      console.error('Failed to fetch owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpotActive = async (spotId: string) => {
    try {
      await apiFetch(`/api/owner/spots/${spotId}/toggle`, {
        method: 'POST',
        token: token!,
      });
      setSpots(spots.map(s => 
        s._id === spotId ? { ...s, isActive: !s.isActive } : s
      ));
    } catch (err) {
      console.error('Failed to toggle spot:', err);
    }
  };

  const deleteSpot = async (spotId: string) => {
    if (!confirm('Are you sure you want to delete this WiFi spot?')) return;
    try {
      await apiFetch(`/api/owner/spots/${spotId}`, {
        method: 'DELETE',
        token: token!,
      });
      setSpots(spots.filter(s => s._id !== spotId));
    } catch (err) {
      console.error('Failed to delete spot:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WiFi Owner Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your WiFi spots and track earnings</p>
          </div>
          <Link
            to="/owner/spots/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Add WiFi Spot
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard
              icon={<Wifi className="text-blue-600" />}
              label="Total Spots"
              value={stats.totalSpots}
            />
            <StatCard
              icon={<Power className="text-green-600" />}
              label="Active"
              value={stats.activeSpots}
            />
            <StatCard
              icon={<Activity className="text-emerald-600" />}
              label="Online"
              value={stats.onlineSpots}
            />
            <StatCard
              icon={<Star className="text-yellow-500" />}
              label="Avg Rating"
              value={stats.avgRating.toFixed(1)}
            />
            <StatCard
              icon={<TrendingUp className="text-purple-600" />}
              label="Avg Uptime"
              value={`${stats.avgUptime}%`}
            />
          </div>
        )}

        {/* Gateway Setup Guide */}
        {spots.length > 0 && <GatewaySetup spots={spots} />}

        {/* WiFi Spots Grid */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your WiFi Spots</h2>
          </div>
          
          {spots.length === 0 ? (
            <div className="p-12 text-center">
              <Wifi className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No WiFi spots yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Start monetizing your internet by adding your first WiFi spot.</p>
              <Link
                to="/owner/spots/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add Your First Spot
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {spots.map((spot) => (
                <SpotRow
                  key={spot._id}
                  spot={spot}
                  onToggle={() => toggleSpotActive(spot._id)}
                  onDelete={() => deleteSpot(spot._id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function SpotRow({ spot, onToggle, onDelete }: { spot: WifiSpot; onToggle: () => void; onDelete: () => void }) {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);

  const copySpotId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(spot._id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };
  
  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Spot Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{spot.name}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              spot.monitoring.isOnline 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {spot.monitoring.isOnline ? 'Online' : 'Offline'}
            </span>
            {!spot.isActive && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                Inactive
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {spot.address}
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee size={14} />
              ₹{spot.pricePerHour}/hr
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} />
              {spot.currentUsers}/{spot.maxUsers} users
            </span>
            <button
              onClick={copySpotId}
              className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-xs font-mono"
              title="Copy Spot ID for Gateway"
            >
              {copiedId ? <Check size={12} /> : <Copy size={12} />}
              {copiedId ? 'Copied!' : `ID: ${spot._id.slice(-8)}`}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-500" />
              <span className="font-medium">{spot.rating}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{spot.reviewCount} reviews</span>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1">
              <Activity size={14} className="text-green-500" />
              <span className="font-medium">{spot.monitoring.uptimePercent}%</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">uptime</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-colors ${
              spot.isActive 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title={spot.isActive ? 'Deactivate' : 'Activate'}
          >
            {spot.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button
            onClick={() => navigate(`/owner/spots/${spot._id}/edit`)}
            className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function GatewaySetup({ spots }: { spots: WifiSpot[] }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedSpotId, setCopiedSpotId] = useState('');
  const [copiedCmd, setCopiedCmd] = useState('');

  const copyText = async (text: string, type: 'spot' | 'cmd', spotId?: string) => {
    await navigator.clipboard.writeText(text);
    if (type === 'spot') {
      setCopiedSpotId(spotId || '');
      setTimeout(() => setCopiedSpotId(''), 2000);
    } else {
      setCopiedCmd(text);
      setTimeout(() => setCopiedCmd(''), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 rounded-xl shadow-sm border border-indigo-200 dark:border-indigo-900 mb-8 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
            <Shield className="text-indigo-600 dark:text-indigo-400" size={20} />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Captive Portal Gateway</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Set up the local gateway to control WiFi access on your hotspot
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} className="text-gray-500 dark:text-gray-400" /> : <ChevronDown size={20} className="text-gray-500 dark:text-gray-400" />}
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 pb-6"
        >
          {/* Quick Start Steps */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Terminal size={18} className="text-indigo-600 dark:text-indigo-400" />
              Quick Start Guide
            </h3>

            <div className="space-y-4">
              <Step number={1} title="Enable Windows Mobile Hotspot">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Go to <strong>Settings → Network & Internet → Mobile Hotspot</strong> and toggle it ON.
                  Set security to <strong>Open (no password)</strong> for captive portal mode.
                </p>
              </Step>

              <Step number={2} title="Install Gateway Dependencies">
                <CodeBlock
                  code="cd gateway && npm install"
                  copied={copiedCmd === 'cd gateway && npm install'}
                  onCopy={() => copyText('cd gateway && npm install', 'cmd')}
                />
              </Step>

              <Step number={3} title="Start the Gateway (Run as Admin)">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Pick your spot and run the gateway:
                </p>
                {spots.map((spot) => (
                  <div key={spot._id} className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Wifi size={14} className="text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">{spot.name}</span>
                    </div>
                    <CodeBlock
                      code={`node gateway.js --spot ${spot._id}`}
                      copied={copiedCmd === `node gateway.js --spot ${spot._id}`}
                      onCopy={() => copyText(`node gateway.js --spot ${spot._id}`, 'cmd')}
                    />
                  </div>
                ))}
              </Step>

              <Step number={4} title="(Optional) Start DNS Redirect">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Makes the portal appear automatically when users connect:
                </p>
                <CodeBlock
                  code="node dns-redirect.js"
                  copied={copiedCmd === 'node dns-redirect.js'}
                  onCopy={() => copyText('node dns-redirect.js', 'cmd')}
                />
              </Step>

              <Step number={5} title="Users Connect!">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Users connect to your hotspot → portal appears → they enter their Access Token
                  (received after booking & paying) → internet access granted until booking expires.
                </p>
              </Step>
            </div>
          </div>

          {/* Spot IDs Quick Copy */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Your Spot IDs</h4>
            <div className="space-y-2">
              {spots.map((spot) => (
                <div key={spot._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wifi size={14} className={spot.isActive ? 'text-green-500' : 'text-gray-400'} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{spot.name}</span>
                  </div>
                  <button
                    onClick={() => copyText(spot._id, 'spot', spot._id)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors text-xs font-mono whitespace-nowrap"
                  >
                    {copiedSpotId === spot._id ? <Check size={12} /> : <Copy size={12} />}
                    {copiedSpotId === spot._id ? 'Copied!' : spot._id}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{title}</h4>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ code, copied, onCopy }: { code: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
      <code className="flex-1 text-sm text-green-400 font-mono">{code}</code>
      <button
        onClick={onCopy}
        className="p-1 text-gray-400 hover:text-white transition-colors shrink-0"
        title="Copy command"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
    </div>
  );
}
