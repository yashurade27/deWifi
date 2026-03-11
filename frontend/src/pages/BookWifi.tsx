import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useWeb3 } from '@/context/Web3Context';
import { apiFetch } from '@/lib/api';
import { bookWifiAccess, calculateBookingCost, getProvider } from '@/lib/contracts';
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
  Wallet,
  Activity,
  Copy,
  Check,
  ExternalLink,
  Key,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
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
    lastPingAt?: string | null;
    latencyMs?: number | null;
  };
  images: string[];
}

interface HealthData {
  isActive: boolean;
  isOnline: boolean;
  uptimePercent: number;
  lastPingAt: string | null;
  latencyMs: number | null;
  freshness: 'verified' | 'stale' | 'unknown';
  freshnessLabel: string;
  minutesAgoChecked: number | null;
  currentUsers: number;
  maxUsers: number;
  recommendation: string;
}

export default function BookWifi() {
  const { user, token, isAuthenticated } = useAuth();
  const { address, signer, connect, isConnecting } = useWeb3();
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

  // Post-payment credentials
  const [accessToken, setAccessToken] = useState('');
  const [accessTokenOTP, setAccessTokenOTP] = useState('');
  const [copied, setCopied] = useState<'token' | 'otp' | null>(null);

  // On-chain cost estimate
  const [costEth, setCostEth] = useState<string | null>(null);

  // ── Restore payment state that was persisted before a network-switch reload ──
  // Key is per-spot so multiple bookings don't clash.
  const STORAGE_KEY = `airlink_payment_${spotId}`;

  useEffect(() => {
    if (!spotId) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved) as {
        bookingId: string;
        accessToken: string;
        accessTokenOTP: string;
        duration: number;
        savedAt: number;
      };
      // Only restore if saved within the last 6 hours
      if (Date.now() - data.savedAt > 6 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      setSuccess(true);
      setBookingId(data.bookingId);
      setAccessToken(data.accessToken);
      setAccessTokenOTP(data.accessTokenOTP);
      setDuration(data.duration);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotId]);

  // Live health check
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [justVerified, setJustVerified] = useState(false);

  const checkHealth = async () => {
    if (!spotId || healthLoading) return;
    setHealthLoading(true);
    setHealthError(null);
    setJustVerified(false);
    try {
      const res = await apiFetch<{ health: HealthData }>(`/api/spots/${spotId}/health`);
      setHealthData(res.health);
      setJustVerified(true);
      // Clear the "just verified" tick after 3 seconds
      setTimeout(() => setJustVerified(false), 3000);
    } catch (err: unknown) {
      setHealthError(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setHealthLoading(false);
    }
  };

  // Auto-run health check when spot loads
  useEffect(() => {
    if (spot) checkHealth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot?._id]);

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

  // Fetch on-chain cost whenever spot or duration changes
  useEffect(() => {
    if (!spot) return;
    let cancelled = false;
    (async () => {
      try {
        const provider = getProvider();
        // spot._id is the MongoDB id; we need the on-chain spotId.
        // For the hackathon demo, we use the spot's blockchain ID if available,
        // or fall back to 1 (first registered spot).
        const onChainSpotId = (spot as any).blockchainSpotId ?? 0;
        const cost = await calculateBookingCost(provider, onChainSpotId, duration);
        if (!cancelled) setCostEth(cost.totalEth);
      } catch {
        if (!cancelled) setCostEth(null);
      }
    })();
    return () => { cancelled = true; };
  }, [spot, duration]);

  const handleBooking = async () => {
    if (!spot || !user) return;

    // Ensure wallet is connected
    if (!address || !signer) {
      try {
        await connect();
      } catch {
        setError('Please connect your MetaMask wallet to continue.');
        return;
      }
    }

    setBooking(true);
    setError('');

    try {
      // Step 1: Calculate cost on-chain
      const provider = getProvider();
      const onChainSpotId = (spot as any).blockchainSpotId ?? 0;
      const cost = await calculateBookingCost(provider, onChainSpotId, duration);

      // Step 2: Purchase access on-chain (sends ETH, mints NFT, escrows payment)
      const currentSigner = signer!;
      const { bookingId: tokenId, txHash } = await bookWifiAccess(
        currentSigner,
        onChainSpotId,
        duration,
        cost.total
      );

      // Step 3: Record booking in backend database
      const bookingRes = await apiFetch<{
        booking: {
          id: string;
          accessToken?: string;
          accessTokenOTP?: string;
        };
      }>('/api/bookings', {
        method: 'POST',
        body: {
          wifiSpotId: spot._id,
          durationHours: duration,
          startTime: startTime === 'now' ? undefined : scheduledTime,
          txHash,
          tokenId,
        },
        token: token!,
      });

      const newBookingId = bookingRes.booking.id;
      const newToken = bookingRes.booking.accessToken || '';
      const newOTP = bookingRes.booking.accessTokenOTP || '';

      // Persist so a page reload doesn't lose creds
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          bookingId: newBookingId,
          accessToken: newToken,
          accessTokenOTP: newOTP,
          duration,
          savedAt: Date.now(),
        }));
      } catch { /* storage full — ignore */ }

      setSuccess(true);
      setBookingId(newBookingId);
      if (newToken) setAccessToken(newToken);
      if (newOTP) setAccessTokenOTP(newOTP);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed';
      if (message.includes('user rejected') || message.includes('ACTION_REJECTED')) {
        setError('Transaction cancelled by user.');
      } else {
        setError(message);
      }
    } finally {
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

  const copyToClipboard = async (text: string, type: 'token' | 'otp') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Success State
  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment Successful!</h1>
              <p className="text-gray-500 text-sm">Your WiFi access has been activated.</p>
            </div>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">WiFi Spot</span>
                <span className="font-medium text-sm">{spot.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Duration</span>
                <span className="font-medium text-sm">{duration} hour{duration > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Amount Paid</span>
                <span className="font-bold text-green-600">{costEth ? `${costEth} ETH` : `₹${total}`}</span>
              </div>
            </div>

            {/* Generated Credentials */}
            {(accessToken || accessTokenOTP) && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Key size={16} className="text-blue-600" />
                  <h3 className="font-semibold text-blue-900 text-sm">Your WiFi Access Credentials</h3>
                </div>
                <p className="text-xs text-blue-600 mb-3">
                  Use these to authenticate on the captive portal after connecting to the WiFi network.
                </p>

                {accessToken && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-blue-700 mb-1">Access Token</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg font-mono text-base tracking-widest text-center text-blue-800">
                        {accessToken}
                      </div>
                      <button
                        onClick={() => copyToClipboard(accessToken, 'token')}
                        className={`p-2 rounded-lg transition-colors ${
                          copied === 'token'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                      >
                        {copied === 'token' ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {accessTokenOTP && (
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">OTP (Alternative)</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg font-mono text-xl tracking-[0.4em] text-center text-green-700">
                        {accessTokenOTP}
                      </div>
                      <button
                        onClick={() => copyToClipboard(accessTokenOTP, 'otp')}
                        className={`p-2 rounded-lg transition-colors ${
                          copied === 'otp'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {copied === 'otp' ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step-by-step instructions */}
            <div className="mb-5 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <h4 className="text-xs font-semibold text-yellow-800 mb-3">How to connect:</h4>
              <ol className="text-xs text-yellow-700 space-y-3 list-none">
                <li className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 bg-yellow-400 text-white rounded-full flex items-center justify-center font-bold text-[11px]">1</span>
                  <span>
                    Go to your phone's <strong>WiFi Settings</strong> and connect to the owner's{' '}
                    <strong>Mobile Hotspot</strong> network.
                    <span className="block text-[10px] text-yellow-600 mt-0.5">
                      (The hotspot shared from the owner's laptop — NOT your home WiFi)
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <span className="shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-[11px]">2</span>
                  <span className="font-semibold text-yellow-900">
                    ⚠️ You MUST be connected to the hotspot before clicking "Open Captive Portal" below.
                    Opening the portal while on another network will not activate your internet access.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 bg-yellow-400 text-white rounded-full flex items-center justify-center font-bold text-[11px]">3</span>
                  <span>
                    A captive portal page will open automatically, or tap the button below.
                    Your credentials will be pre-filled.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 bg-yellow-400 text-white rounded-full flex items-center justify-center font-bold text-[11px]">4</span>
                  <span>Tap <strong>Connect to WiFi</strong> and enjoy your session!</span>
                </li>
              </ol>
            </div>

            {/* Primary CTA - Open Captive Portal */}
            <button
              onClick={() => {
                // Keep creds in storage — portal page needs them.
                // Clear only after the session is confirmed active.
                navigate(`/portal?spot=${spot._id}&token=${accessToken}`);
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <ExternalLink size={20} />
              Open Captive Portal (connect to hotspot first!)
            </button>

            {/* Secondary - View Session */}
            <button
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                navigate(`/session/${bookingId}`);
              }}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Wifi size={20} />
              View Session Details
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
                  {/* Live Status — freshness-aware */}
                  <div className="flex flex-col items-end gap-1">
                    {healthLoading ? (
                      <span className="flex items-center gap-1.5 text-xs text-gray-400">
                        <RefreshCw size={12} className="animate-spin" />
                        Checking…
                      </span>
                    ) : healthData ? (
                      <>
                        <span
                          className={`flex items-center gap-1.5 text-sm font-semibold ${
                            healthData.freshness === 'verified' && healthData.isOnline
                              ? 'text-emerald-600'
                              : healthData.freshness === 'verified' && !healthData.isOnline
                              ? 'text-red-600'
                              : healthData.freshness === 'stale'
                              ? 'text-amber-600'
                              : 'text-gray-500'
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              healthData.freshness === 'verified' && healthData.isOnline
                                ? 'bg-emerald-500 animate-pulse'
                                : healthData.freshness === 'verified' && !healthData.isOnline
                                ? 'bg-red-500'
                                : healthData.freshness === 'stale'
                                ? 'bg-amber-400'
                                : 'bg-gray-300'
                            }`}
                          />
                          {healthData.freshness === 'verified'
                            ? healthData.isOnline ? 'Live' : 'Offline'
                            : healthData.freshness === 'stale'
                            ? 'Unverified'
                            : 'Unknown'}
                        </span>
                        <span className="text-[10px] text-gray-400">{healthData.freshnessLabel}</span>
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                        {spot.monitoring.isOnline ? 'Online' : 'Offline'}
                      </span>
                    )}
                    <button
                      onClick={checkHealth}
                      disabled={healthLoading}
                      className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        justVerified
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : healthLoading
                          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 active:scale-95 cursor-pointer'
                      }`}
                    >
                      {healthLoading ? (
                        <><RefreshCw size={11} className="animate-spin" /> Checking…</>
                      ) : justVerified ? (
                        <><CheckCircle2 size={11} /> Verified! ✓</>
                      ) : (
                        <><RefreshCw size={11} /> Verify now</>
                      )}
                    </button>
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

                {/* Health recommendation banner */}
                {healthData && (
                  <div
                    className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
                      healthData.freshness === 'verified' && healthData.isOnline
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                        : healthData.freshness === 'verified' && !healthData.isOnline
                        ? 'bg-red-50 text-red-800 border border-red-100'
                        : 'bg-amber-50 text-amber-800 border border-amber-100'
                    }`}
                  >
                    {healthData.freshness === 'verified' && healthData.isOnline ? (
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{healthData.recommendation}</p>
                      {healthData.latencyMs !== null && healthData.latencyMs !== undefined && healthData.latencyMs > 0 && (
                        <p className="text-xs mt-0.5 opacity-75">Last measured latency: {healthData.latencyMs}ms</p>
                      )}
                    </div>
                  </div>
                )}
                {healthError && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500">
                    Could not fetch live health data. Showing last known status.
                  </div>
                )}

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
                <span className="text-blue-600">{costEth ? `${costEth} ETH` : `₹${total}`}</span>
              </div>

              <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <Shield size={16} />
                  <span>Secured by Ethereum smart contract</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Offline / stale warning */}
              {(() => {
                const definitelyOffline =
                  healthData?.freshness === 'verified' && !healthData.isOnline;
                const staleWarning =
                  healthData?.freshness === 'stale' || healthData?.freshness === 'unknown';
                const fallbackOffline = !healthData && !spot.monitoring.isOnline;

                if (definitelyOffline || fallbackOffline) {
                  return (
                    <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      <span>This WiFi spot is <strong>offline</strong>. Booking is disabled until the connection is restored.</span>
                    </div>
                  );
                }
                if (staleWarning) {
                  return (
                    <div className="mb-4 p-3 bg-amber-50 rounded-lg flex items-start gap-2 text-amber-700 text-sm">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      <span>Connection status hasn’t been verified recently. You can still book, but confirm connectivity on-site.</span>
                    </div>
                  );
                }
                return null;
              })()}

              {!address ? (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Connecting Wallet...
                    </>
                  ) : (
                    <>
                      <Wallet size={20} />
                      Connect Wallet
                    </>
                  )}
                </button>
              ) : null}

              <button
                onClick={handleBooking}
                disabled={booking || !address ||
                  (healthData?.freshness === 'verified' && !healthData.isOnline) ||
                  spot.currentUsers >= spot.maxUsers}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {booking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Confirming on blockchain...
                  </>
                ) : (
                  <>
                    <Wallet size={20} />
                    Pay {costEth ? `${costEth} ETH` : `₹${total}`}
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
