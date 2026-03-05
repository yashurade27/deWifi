import { useState, useEffect, type JSX } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wifi,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  PlayCircle,
  Calendar,
  IndianRupee,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Booking {
  _id: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  wifiSpot: {
    _id: string;
    name: string;
    address: string;
    ssid: string;
    monitoring: {
      isOnline: boolean;
    };
  };
}

export default function UserDashboard() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [isAuthenticated, navigate]);

  const fetchBookings = async () => {
    try {
      const [activeRes, allRes] = await Promise.all([
        apiFetch<{ bookings: Booking[] }>('/api/bookings/active', { token: token! }),
        apiFetch<{ bookings: Booking[] }>('/api/bookings/my-bookings', { token: token! }),
      ]);
      setActiveBookings(activeRes.bookings);
      setAllBookings(allRes.bookings);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus !== 'paid') {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Payment Pending</span>;
    }
    switch (status) {
      case 'active':
      case 'confirmed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{status}</span>;
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your WiFi bookings and sessions</p>
        </div>

        {/* Active Sessions Alert */}
        {activeBookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Wifi size={24} />
                </div>
                <div>
                  <p className="font-semibold">{activeBookings.length} Active Session{activeBookings.length > 1 ? 's' : ''}</p>
                  <p className="text-sm opacity-90">You have WiFi access right now</p>
                </div>
              </div>
              <Link
                to={`/session/${activeBookings[0]._id}`}
                className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
              >
                <PlayCircle size={18} />
                Access WiFi
              </Link>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Active ({activeBookings.length})
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            All Bookings ({allBookings.length})
          </button>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          {tab === 'active' ? (
            activeBookings.length === 0 ? (
              <div className="p-12 text-center">
                <Wifi className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Sessions</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">You don't have any active WiFi sessions right now.</p>
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Find WiFi
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {activeBookings.map((booking) => (
                  <ActiveBookingCard key={booking._id} booking={booking} />
                ))}
              </div>
            )
          ) : (
            allBookings.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Bookings Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't made any WiFi bookings yet.</p>
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Explore WiFi Spots
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {allBookings.map((booking) => (
                  <BookingRow 
                    key={booking._id} 
                    booking={booking} 
                    getStatusBadge={getStatusBadge}
                    getTimeRemaining={getTimeRemaining}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}

function ActiveBookingCard({ booking }: { booking: Booking }) {
  const navigate = useNavigate();
  
  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return { text: 'Expired', percent: 0 };
    
    const start = new Date(booking.startTime).getTime();
    const total = end - start;
    const elapsed = now - start;
    const percent = Math.max(0, Math.min(100, ((total - diff) / total) * 100));
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { text: `${hours}h ${mins}m left`, percent };
  };

  const timeInfo = getTimeRemaining(booking.endTime);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
      onClick={() => navigate(`/session/${booking._id}`)}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
          <Wifi className="text-green-600 dark:text-green-400" size={24} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{booking.wifiSpot.name}</h3>
            <span className={`w-2 h-2 rounded-full ${
              booking.wifiSpot.monitoring?.isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <MapPin size={14} />
            {booking.wifiSpot.address}
          </p>
          
          {/* Progress Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Session Progress</span>
              <span className="font-medium text-green-600 dark:text-green-400">{timeInfo.text}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${timeInfo.percent}%` }}
              />
            </div>
          </div>
        </div>

        <ChevronRight className="text-gray-400" size={20} />
      </div>
    </motion.div>
  );
}

function BookingRow({ 
  booking, 
  getStatusBadge,
  getTimeRemaining 
}: { 
  booking: Booking; 
  getStatusBadge: (status: string, paymentStatus: string) => JSX.Element;
  getTimeRemaining: (endTime: string) => string;
}) {
  const navigate = useNavigate();
  const isActive = booking.status === 'active' || booking.status === 'confirmed';
  const isPaid = booking.paymentStatus === 'paid';
  const isExpired = isPaid && new Date(booking.endTime) < new Date();

  return (
    <div 
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${isPaid ? 'cursor-pointer' : ''}`}
      onClick={() => isPaid && navigate(`/session/${booking._id}`)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Wifi size={16} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-gray-900 dark:text-white truncate">{booking.wifiSpot.name}</h3>
            {getStatusBadge(booking.status, booking.paymentStatus)}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(booking.startTime).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {booking.durationHours}h
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee size={14} />
              ₹{booking.totalAmount}
            </span>
          </div>
        </div>

        {isPaid && isActive && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              {getTimeRemaining(booking.endTime)}
            </span>
            <ChevronRight className="text-gray-400" size={20} />
          </div>
        )}
        
        {isPaid && isExpired && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/session/${booking._id}`);
            }}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Leave Review
          </button>
        )}
      </div>
    </div>
  );
}
