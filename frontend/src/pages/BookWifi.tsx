import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Wifi,
  Clock,
  MapPin,
  Zap,
  Star,
  Users,
  Shield,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SpotDetails {
  _id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  pricePerHour: number;
  speedMbps: number;
  maxUsers: number;
  currentUsers: number;
  rating: number;
  reviewCount: number;
  tag: string;
  amenities: string[];
  availableFrom: string;
  availableTo: string;
  monitoring: {
    isOnline: boolean;
    uptimePercent: number;
  };
  images: string[];
}

export default function BookWifi() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { spotId } = useParams();

  const [spot, setSpot] = useState<SpotDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const [duration, setDuration] = useState(1);
  const [startTime, setStartTime] = useState<'now' | 'scheduled'>('now');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchSpot();
  }, [isAuthenticated, navigate, spotId]);

  const fetchSpot = async () => {
    try {
      const res = await apiFetch<{ spot: SpotDetails }>(`/api/spots/${spotId}`);
      setSpot(res.spot);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load spot';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = spot ? spot.pricePerHour * duration : 0;
  const platformFee = Math.round(subtotal * 0.02 * 100) / 100;
  const total = subtotal;

  const handleBooking = async () => {
    if (!spot || !user) return;

    setBooking(true);
    setError('');

    try {
      // Step 1: Get Razorpay key
      const keyRes = await apiFetch<{ key: string }>('/api/bookings/razorpay-key', {
        token: token!,
      });

      // Step 2: Create booking and get Razorpay order
      const bookingRes = await apiFetch<{
        booking: {
          id: string;
          razorpayOrderId: string;
          amount: number;
          currency: string;
        };
      }>('/api/bookings', {
        method: 'POST',
        body: {
          wifiSpotId: spot._id,
          durationHours: duration,
          startTime: startTime === 'now' ? undefined : scheduledTime,
        },
        token: token!,
      });

      const { booking: bookingData } = bookingRes;

      // Step 3: Initialize Razorpay checkout
      const options = {
        key: keyRes.key,
        amount: bookingData.amount,
        currency: bookingData.currency,
        name: 'deWifi',
        description: `WiFi Access - ${spot.name}`,
        order_id: bookingData.razorpayOrderId,
        handler: async (response: any) => {
          try {
            // Step 4: Verify payment on backend
            const verifyRes = await apiFetch<{
              booking: { id: string };
            }>('/api/bookings/verify-payment', {
              method: 'POST',
              body: {
                bookingId: bookingData.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              token: token!,
            });

            setSuccess(true);
            setBookingId(verifyRes.booking.id);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Payment verification failed';
            setError(message);
            setBooking(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            setBooking(false);
            setError('Payment cancelled');
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed';
      setError(message);
      setBooking(false);
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

  if (!spot) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <Wifi className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">WiFi Spot Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This WiFi spot does not exist.'}</p>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Explore WiFi Spots
          </button>
        </div>
      </div>
    );
  }

  // Success State
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your WiFi access has been activated. You can now connect to the network.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">WiFi Spot</span>
                <span className="font-medium">{spot.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium">{duration} hour{duration > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-bold text-green-600">₹{total}</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/session/${bookingId}`)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Wifi size={20} />
              Access WiFi Now
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Spot Details & Duration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Spot Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{spot.name}</h1>
                    <p className="text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={16} />
                      {spot.address}, {spot.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${spot.monitoring.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm text-gray-600">{spot.monitoring.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center py-4 border-t border-b border-gray-100">
                  <div>
                    <Star className="mx-auto text-yellow-500 mb-1" size={20} />
                    <p className="font-semibold">{spot.rating}</p>
                    <p className="text-xs text-gray-500">{spot.reviewCount} reviews</p>
                  </div>
                  <div>
                    <Zap className="mx-auto text-blue-500 mb-1" size={20} />
                    <p className="font-semibold">{spot.speedMbps}</p>
                    <p className="text-xs text-gray-500">Mbps</p>
                  </div>
                  <div>
                    <Users className="mx-auto text-purple-500 mb-1" size={20} />
                    <p className="font-semibold">{spot.currentUsers}/{spot.maxUsers}</p>
                    <p className="text-xs text-gray-500">Users</p>
                  </div>
                  <div>
                    <Activity className="mx-auto text-green-500 mb-1" size={20} />
                    <p className="font-semibold">{spot.monitoring.uptimePercent}%</p>
                    <p className="text-xs text-gray-500">Uptime</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {spot.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Duration Selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={20} />
                Select Duration
              </h2>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {[1, 2, 3, 5].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setDuration(hours)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      duration === hours
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl font-bold">{hours}</span>
                    <span className="text-sm block">hour{hours > 1 ? 's' : ''}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Duration (hours)
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 hr</span>
                  <span className="font-medium text-blue-600">{duration} hours</span>
                  <span>12 hrs</span>
                </div>
              </div>
            </motion.div>

            {/* Start Time */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">When do you want to start?</h2>

              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setStartTime('now')}
                  className={`flex-1 p-4 rounded-xl border-2 text-center ${
                    startTime === 'now'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-semibold">Start Now</span>
                  <p className="text-sm text-gray-500">Access immediately</p>
                </button>
                <button
                  onClick={() => setStartTime('scheduled')}
                  className={`flex-1 p-4 rounded-xl border-2 text-center ${
                    startTime === 'scheduled'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-semibold">Schedule</span>
                  <p className="text-sm text-gray-500">Pick a time</p>
                </button>
              </div>

              {startTime === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Price Breakdown */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Price Summary</h2>

              <div className="space-y-3 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">₹{spot.pricePerHour}/hr × {duration} hr{duration > 1 ? 's' : ''}</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Platform fee (2%)</span>
                  <span>₹{platformFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between py-4 text-lg font-bold">
                <span>Total</span>
                <span className="text-blue-600">₹{total}</span>
              </div>

              <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <Shield size={16} />
                  <span>Secure payment via Razorpay</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {!spot.monitoring.isOnline && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-yellow-700 text-sm">
                  This WiFi spot is currently offline. Booking may not be available.
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={booking || !spot.monitoring.isOnline || spot.currentUsers >= spot.maxUsers}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {booking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Pay ₹{total}
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500 mt-3">
                By proceeding, you agree to our Terms of Service
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
