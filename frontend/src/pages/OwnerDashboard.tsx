import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { 
  Wifi, 
  Plus, 
  Settings, 
  TrendingUp, 
  Users, 
  Star, 
  Activity,
  Power,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  IndianRupee
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WiFi Owner Dashboard</h1>
            <p className="text-gray-600">Manage your WiFi spots and track earnings</p>
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

        {/* WiFi Spots Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your WiFi Spots</h2>
          </div>
          
          {spots.length === 0 ? (
            <div className="p-12 text-center">
              <Wifi className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No WiFi spots yet</h3>
              <p className="text-gray-500 mb-4">Start monetizing your internet by adding your first WiFi spot.</p>
              <Link
                to="/owner/spots/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add Your First Spot
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
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
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function SpotRow({ spot, onToggle, onDelete }: { spot: WifiSpot; onToggle: () => void; onDelete: () => void }) {
  const navigate = useNavigate();
  
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Spot Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{spot.name}</h3>
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
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
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
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-500" />
              <span className="font-medium">{spot.rating}</span>
            </div>
            <span className="text-xs text-gray-500">{spot.reviewCount} reviews</span>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1">
              <Activity size={14} className="text-green-500" />
              <span className="font-medium">{spot.monitoring.uptimePercent}%</span>
            </div>
            <span className="text-xs text-gray-500">uptime</span>
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
