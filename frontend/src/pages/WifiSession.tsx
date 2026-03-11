import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Wifi,
  Copy,
  Check,
  Clock,
  MapPin,
  Zap,
  AlertCircle,
  Activity,
  QrCode,
  Shield,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Star,
  Send,
} from 'lucide-react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';

interface BookingDetails {
  _id: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  accessToken?: string;
  accessTokenOTP?: string;
  maxDevices?: number;
  activeDeviceCount?: number;
  wifiSpot: {
    _id: string;
    name: string;
    address: string;
    ssid: string;
    wifiPassword: string;
    securityType: string;
    speedMbps: number;
    monitoring: {
      isOnline: boolean;
      uptimePercent: number;
    };
  };
}

export default function WifiSession() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'ssid' | 'password' | 'token' | 'otp' | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showQR, setShowQR] = useState(false);

  // Review state
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchBooking();
  }, [isAuthenticated, navigate, id]);

  const fetchBooking = async () => {
    try {
      const res = await apiFetch<{ booking: BookingDetails }>(`/api/bookings/${id}`, {
        token: token!,
      });
      setBooking(res.booking);
      
      // Calculate initial time remaining
      const endTime = new Date(res.booking.endTime).getTime();
      const now = Date.now();
      setTimeRemaining(Math.max(0, Math.floor((endTime - now) / 1000)));

      // Check if already reviewed
      try {
        const reviewRes = await apiFetch<{ hasReview: boolean }>(`/api/reviews/booking/${id}`, {
          token: token!,
        });
        setHasReviewed(reviewRes.hasReview);
      } catch {
        // Ignore review check errors
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load booking';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!booking || reviewRating === 0) return;
    
    setReviewSubmitting(true);
    setReviewError('');
    try {
      await apiFetch('/api/reviews', {
        method: 'POST',
        token: token!,
        body: {
          bookingId: booking._id,
          overallRating: reviewRating,
          speedRating: reviewRating,
          reliabilityRating: reviewRating,
          valueRating: reviewRating,
          comment: reviewComment,
        },
      });
      setReviewSuccess(true);
      setHasReviewed(true);
    } catch (err: unknown) {
      console.error('Review submission failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to submit review. Please try again.';
      setReviewError(message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const copyToClipboard = async (text: string, type: 'ssid' | 'password' | 'token' | 'otp') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Generate WiFi QR code string (standard WiFi QR format)
  const generateWifiQR = () => {
    if (!booking?.wifiSpot) return '';
    const { ssid, wifiPassword, securityType } = booking.wifiSpot;
    const security = securityType === 'Open' ? 'nopass' : securityType;
    return `WIFI:T:${security};S:${ssid};P:${wifiPassword};;`;
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

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This booking does not exist or you do not have access.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const spot = booking.wifiSpot;
  const isActive = booking.paymentStatus === 'paid' && timeRemaining > 0;
  const isExpired = timeRemaining === 0 && booking.paymentStatus === 'paid';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        {/* Session Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header with Timer */}
          <div className={`p-6 text-white ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : isExpired ? 'bg-gray-600' : 'bg-yellow-600'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wifi size={28} />
                <div>
                  <h1 className="text-xl font-bold">{spot.name}</h1>
                  <p className="text-sm opacity-90 flex items-center gap-1">
                    <MapPin size={14} />
                    {spot.address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${spot.monitoring.isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                <span className="text-sm">{spot.monitoring.isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>

            {/* Timer */}
            <div className="text-center py-4">
              <p className="text-sm opacity-75 mb-1">
                {isActive ? 'Time Remaining' : isExpired ? 'Session Ended' : 'Session Pending'}
              </p>
              <div className="text-5xl font-mono font-bold tracking-wider">
                {formatTime(timeRemaining)}
              </div>
              {isActive && (
                <p className="text-sm opacity-75 mt-2">
                  Ends at {new Date(booking.endTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Connection Instructions */}
          {isActive && (
            <div className="p-6">
              {/* Captive Portal Access — this is the PRIMARY connection method */}
              {(booking.accessToken || booking.accessTokenOTP) ? (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield size={20} className="text-blue-600" />
                    How to Connect
                  </h2>

                  {/* Step-by-step instructions */}
                  <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <h4 className="text-xs font-semibold text-amber-800 mb-2">Follow these steps:</h4>
                    <ol className="text-sm text-amber-700 space-y-2 list-decimal list-inside">
                      <li>
                        Go to your phone's <strong>WiFi Settings</strong> and connect to the
                        owner's <strong>Mobile Hotspot</strong> network
                        <span className="block text-xs text-amber-600 ml-5 mt-0.5">
                          (This is NOT the home WiFi — it's the hotspot shared by the owner's laptop)
                        </span>
                      </li>
                      <li>A captive portal page will open automatically, or tap the button below</li>
                      <li>Enter your <strong>Access Token</strong> or <strong>OTP</strong> on the portal page</li>
                      <li>Once authenticated, you'll have internet access!</li>
                    </ol>
                  </div>

                  {/* Access Token */}
                  {booking.accessToken && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Access Token
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg font-mono text-lg tracking-wider text-center text-blue-800">
                          {booking.accessToken}
                        </div>
                        <button
                          onClick={() => copyToClipboard(booking.accessToken!, 'token')}
                          className={`p-3 rounded-lg transition-colors ${
                            copied === 'token' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          }`}
                        >
                          {copied === 'token' ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP */}
                  {booking.accessTokenOTP && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        OTP Code (Alternative)
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg font-mono text-2xl tracking-[0.3em] text-center text-green-800">
                          {booking.accessTokenOTP}
                        </div>
                        <button
                          onClick={() => copyToClipboard(booking.accessTokenOTP!, 'otp')}
                          className={`p-3 rounded-lg transition-colors ${
                            copied === 'otp' ? 'bg-green-100 text-green-600' : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                        >
                          {copied === 'otp' ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Device limit info */}
                  {booking.maxDevices && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <span className="text-blue-500">📱</span>
                      <span>
                        Devices: {booking.activeDeviceCount || 0} / {booking.maxDevices} connected
                      </span>
                    </div>
                  )}

                  {/* Open Captive Portal Button */}
                  {booking.accessToken && (
                    <button
                      onClick={() => navigate(`/portal?spot=${spot._id}&token=${booking.accessToken}`)}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={18} />
                      Open Captive Portal
                    </button>
                  )}
                </div>
              ) : (
                /* Fallback: show direct WiFi credentials only if NO captive portal token */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">WiFi Credentials</h2>
                    <button
                      onClick={() => setShowQR(!showQR)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <QrCode size={16} />
                      {showQR ? 'Hide QR' : 'Show QR'}
                    </button>
                  </div>

                  {showQR && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex justify-center mb-6 p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl"
                    >
                      <div className="text-center">
                        <QRCode value={generateWifiQR()} size={180} />
                        <p className="text-sm text-gray-500 mt-3">Scan with your phone's camera to connect</p>
                      </div>
                    </motion.div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Network Name (SSID)</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 bg-gray-50 rounded-lg font-mono text-lg">{spot.ssid}</div>
                      <button
                        onClick={() => copyToClipboard(spot.ssid, 'ssid')}
                        className={`p-3 rounded-lg transition-colors ${
                          copied === 'ssid' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {copied === 'ssid' ? <Check size={20} /> : <Copy size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Password</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 bg-gray-50 rounded-lg font-mono text-lg">{spot.wifiPassword}</div>
                      <button
                        onClick={() => copyToClipboard(spot.wifiPassword, 'password')}
                        className={`p-3 rounded-lg transition-colors ${
                          copied === 'password' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {copied === 'password' ? <Check size={20} /> : <Copy size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Shield size={16} />
                    Security: {spot.securityType}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connection Info */}
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-3">Connection Details</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Zap className="mx-auto text-blue-500 mb-1" size={20} />
                  <p className="text-lg font-bold text-gray-900">{spot.speedMbps}</p>
                  <p className="text-xs text-gray-500">Mbps Speed</p>
                </div>
                <div>
                  <Activity className="mx-auto text-green-500 mb-1" size={20} />
                  <p className="text-lg font-bold text-gray-900">{spot.monitoring.uptimePercent}%</p>
                  <p className="text-xs text-gray-500">Uptime</p>
                </div>
                <div>
                  <Clock className="mx-auto text-purple-500 mb-1" size={20} />
                  <p className="text-lg font-bold text-gray-900">{booking.durationHours}h</p>
                  <p className="text-xs text-gray-500">Duration</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {!spot.monitoring.isOnline && (
            <div className="px-6 pb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <div>
                  <p className="font-medium text-red-800">WiFi Currently Offline</p>
                  <p className="text-sm text-red-600">
                    The WiFi spot is experiencing connection issues. Please try again later or contact support.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="px-6 pb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-medium text-yellow-800 mb-2">Session Expired</p>
                <p className="text-sm text-yellow-700 mb-3">
                  Your WiFi access has ended. You can extend your session or book a new one.
                </p>
                <button
                  onClick={() => navigate(`/book/${spot._id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  <RefreshCw size={16} />
                  Book Again
                </button>
              </div>
            </div>
          )}

          {/* Review Section - available for any paid booking */}
          {booking.paymentStatus === 'paid' && !hasReviewed && !reviewSuccess && (
            <div className="px-6 pb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Star className="text-yellow-500" size={20} />
                  Rate Your Experience
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  How was your WiFi experience at {spot.name}?
                </p>

                {/* Error Message */}
                {reviewError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {reviewError}
                  </div>
                )}

                {/* Star Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={`transition-colors ${
                          star <= (hoverRating || reviewRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-sm text-gray-600">
                    {reviewRating > 0 && (
                      <>
                        {reviewRating === 1 && 'Poor'}
                        {reviewRating === 2 && 'Fair'}
                        {reviewRating === 3 && 'Good'}
                        {reviewRating === 4 && 'Very Good'}
                        {reviewRating === 5 && 'Excellent'}
                      </>
                    )}
                  </span>
                </div>

                {/* Comment */}
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience (optional)..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">{reviewComment.length}/500</span>
                </div>

                {/* Submit Button */}
                <button
                  onClick={submitReview}
                  disabled={reviewRating === 0 || reviewSubmitting}
                  className={`mt-4 w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    reviewRating > 0 && !reviewSubmitting
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {reviewSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Review
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          )}

          {/* Review Success Message */}
          {reviewSuccess && (
            <div className="px-6 pb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-green-800">Thanks for your review!</p>
                  <p className="text-sm text-green-600">Your feedback helps others find great WiFi spots.</p>
                </div>
              </motion.div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Booking ID: {booking._id.slice(-8).toUpperCase()}</span>
              <span>Paid: {booking.totalAmount} ETH</span>
            </div>
          </div>
        </motion.div>

        {/* Help Section */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Having trouble connecting? <a href="#" className="text-blue-600 hover:underline">Get Help</a></p>
        </div>
      </main>
    </div>
  );
}
