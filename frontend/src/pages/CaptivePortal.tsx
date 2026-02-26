import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from '@/lib/api';
import {
  Wifi,
  WifiOff,
  Shield,
  Lock,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpotInfo {
  id: string;
  name: string;
  address: string;
}

interface AuthResult {
  success: boolean;
  message: string;
  sessionToken?: string;
  expiresAt?: string;
  spot?: {
    name: string;
    address: string;
  };
  deviceInfo?: {
    type: string;
    activeDevices: number;
    maxDevices: number;
  };
  errorCode?: string;
  maxDevices?: number;
  activeDevices?: number;
}

export default function CaptivePortal() {
  const [searchParams] = useSearchParams();
  const spotId = searchParams.get('spot') || searchParams.get('spotId') || '';
  
  const [spot, setSpot] = useState<SpotInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  
  const [accessToken, setAccessToken] = useState('');
  const [otp, setOtp] = useState('');
  const [useOTP, setUseOTP] = useState(false);
  
  const [sessionToken, setSessionToken] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState<{ type: string; active: number; max: number } | null>(null);

  // Check if already authenticated (via stored session)
  useEffect(() => {
    const storedSession = localStorage.getItem(`captive_session_${spotId}`);
    if (storedSession) {
      validateStoredSession(storedSession);
    } else {
      detectCaptivePortal();
    }
  }, [spotId]);

  // Countdown timer
  useEffect(() => {
    if (!authenticated || !expiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        // Session expired
        setAuthenticated(false);
        localStorage.removeItem(`captive_session_${spotId}`);
        setError('Your session has expired. Please authenticate again.');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [authenticated, expiresAt, spotId]);

  // Heartbeat to validate session periodically
  useEffect(() => {
    if (!authenticated || !sessionToken) return;

    const heartbeat = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/captive/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken, spotId }),
        });
        const data = await res.json();
        
        if (!data.authenticated) {
          setAuthenticated(false);
          localStorage.removeItem(`captive_session_${spotId}`);
          setError(data.message || 'Session expired');
        }
      } catch (err) {
        console.error('Heartbeat failed:', err);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(heartbeat);
  }, [authenticated, sessionToken, spotId]);

  const detectCaptivePortal = async () => {
    if (!spotId) {
      setError('No WiFi spot specified. Please connect to a valid deWifi hotspot.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/captive/detect/${spotId}`);
      const data = await res.json();

      if (data.authenticated) {
        setAuthenticated(true);
        setSpot(data.spot);
        if (data.expiresAt) {
          setExpiresAt(new Date(data.expiresAt));
        }
      } else if (data.spot) {
        setSpot(data.spot);
      } else {
        setError('WiFi spot not found. Please check your connection.');
      }
    } catch (err) {
      setError('Unable to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const validateStoredSession = async (storedToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/captive/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: storedToken, spotId }),
      });
      const data = await res.json();

      if (data.authenticated) {
        setAuthenticated(true);
        setSessionToken(storedToken);
        setExpiresAt(new Date(data.expiresAt));
        
        // Fetch spot info
        const statusRes = await fetch(`${API_BASE}/api/captive/status/${spotId}`);
        const statusData = await statusRes.json();
        if (statusData.spot) {
          setSpot(statusData.spot);
        }
      } else {
        localStorage.removeItem(`captive_session_${spotId}`);
        detectCaptivePortal();
      }
    } catch (err) {
      localStorage.removeItem(`captive_session_${spotId}`);
      detectCaptivePortal();
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setAuthenticating(true);

    try {
      const res = await fetch(`${API_BASE}/api/captive/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotId,
          accessToken: useOTP ? undefined : accessToken.trim(),
          otp: useOTP ? otp.trim() : undefined,
        }),
      });
      
      const data: AuthResult = await res.json();

      if (data.success && data.sessionToken) {
        setSessionToken(data.sessionToken);
        setAuthenticated(true);
        setExpiresAt(new Date(data.expiresAt!));
        
        if (data.deviceInfo) {
          setDeviceInfo({
            type: data.deviceInfo.type,
            active: data.deviceInfo.activeDevices,
            max: data.deviceInfo.maxDevices,
          });
        }

        // Store session for persistence
        localStorage.setItem(`captive_session_${spotId}`, data.sessionToken);
      } else {
        setError(data.message);
        setErrorCode(data.errorCode || '');
        
        if (data.errorCode === 'DEVICE_LIMIT_REACHED') {
          setDeviceInfo({
            type: '',
            active: data.activeDevices || 0,
            max: data.maxDevices || 1,
          });
        }
      }
    } catch (err) {
      setError('Failed to authenticate. Please try again.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch(`${API_BASE}/api/captive/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      });
    } catch (err) {
      console.error('Disconnect failed:', err);
    } finally {
      setAuthenticated(false);
      setSessionToken('');
      localStorage.removeItem(`captive_session_${spotId}`);
    }
  };

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  }, []);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      case 'laptop': return <Laptop className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center"
        >
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Detecting WiFi network...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur mb-4"
          >
            {authenticated ? (
              <Wifi className="w-10 h-10 text-green-400" />
            ) : (
              <Shield className="w-10 h-10 text-white" />
            )}
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {authenticated ? 'Connected!' : 'deWifi Portal'}
          </h1>
          {spot && (
            <p className="text-blue-200 text-sm">
              {spot.name} • {spot.address}
            </p>
          )}
        </div>

        {/* Main Card */}
        <motion.div
          layout
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20"
        >
          <AnimatePresence mode="wait">
            {authenticated ? (
              /* ─── Authenticated View ─── */
              <motion.div
                key="authenticated"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6"
              >
                <div className="text-center mb-6">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white">
                    You're Connected!
                  </h2>
                  <p className="text-blue-200 text-sm mt-2">
                    Enjoy your WiFi session
                  </p>
                </div>

                {/* Time Remaining */}
                <div className="bg-white/10 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-200">
                      <Clock className="w-5 h-5" />
                      <span>Time Remaining</span>
                    </div>
                    <span className={`font-mono text-lg font-bold ${
                      timeRemaining < 300 ? 'text-red-400' : 'text-white'
                    }`}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        timeRemaining < 300 ? 'bg-red-400' : 'bg-green-400'
                      }`}
                      initial={{ width: '100%' }}
                      animate={{ 
                        width: `${Math.min(100, (timeRemaining / 3600) * 100)}%` 
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Device Info */}
                {deviceInfo && (
                  <div className="bg-white/10 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-200">
                        {getDeviceIcon(deviceInfo.type)}
                        <span>Connected Devices</span>
                      </div>
                      <span className="text-white font-semibold">
                        {deviceInfo.active} / {deviceInfo.max}
                      </span>
                    </div>
                  </div>
                )}

                {/* Disconnect Button */}
                <button
                  onClick={handleDisconnect}
                  className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <WifiOff className="w-5 h-5" />
                  Disconnect
                </button>
              </motion.div>
            ) : (
              /* ─── Login View ─── */
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6"
              >
                {!spotId ? (
                  <div className="text-center py-8">
                    <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">
                      No WiFi Spot Detected
                    </h2>
                    <p className="text-blue-200 text-sm">
                      Please connect to a valid deWifi hotspot to continue.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <Lock className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                      <h2 className="text-xl font-semibold text-white">
                        Authentication Required
                      </h2>
                      <p className="text-blue-200 text-sm mt-2">
                        Enter your booking access token to connect
                      </p>
                    </div>

                    {/* Error Display */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`mb-4 p-4 rounded-xl flex items-start gap-3 ${
                            errorCode === 'DEVICE_LIMIT_REACHED'
                              ? 'bg-orange-500/20 border border-orange-500/30'
                              : 'bg-red-500/20 border border-red-500/30'
                          }`}
                        >
                          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            errorCode === 'DEVICE_LIMIT_REACHED'
                              ? 'text-orange-400'
                              : 'text-red-400'
                          }`} />
                          <div>
                            <p className={`text-sm ${
                              errorCode === 'DEVICE_LIMIT_REACHED'
                                ? 'text-orange-200'
                                : 'text-red-200'
                            }`}>
                              {error}
                            </p>
                            {errorCode === 'DEVICE_LIMIT_REACHED' && (
                              <p className="text-xs text-orange-300 mt-1">
                                Disconnect another device to connect this one.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Auth Form */}
                    <form onSubmit={handleAuthenticate} className="space-y-4">
                      {/* Toggle Token/OTP */}
                      <div className="flex bg-white/10 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setUseOTP(false)}
                          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                            !useOTP
                              ? 'bg-blue-500 text-white'
                              : 'text-blue-200 hover:text-white'
                          }`}
                        >
                          Access Token
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseOTP(true)}
                          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                            useOTP
                              ? 'bg-blue-500 text-white'
                              : 'text-blue-200 hover:text-white'
                          }`}
                        >
                          OTP Code
                        </button>
                      </div>

                      {/* Token Input */}
                      {!useOTP ? (
                        <div>
                          <label className="block text-blue-200 text-sm mb-2">
                            Access Token
                          </label>
                          <input
                            type="text"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value.toUpperCase())}
                            placeholder="Enter your 16-character token"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent font-mono text-lg tracking-wider text-center uppercase"
                            maxLength={16}
                            autoComplete="off"
                            autoFocus
                          />
                          <p className="text-xs text-blue-300 mt-2">
                            Find this in your booking confirmation
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-blue-200 text-sm mb-2">
                            OTP Code
                          </label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 6-digit OTP"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent font-mono text-2xl tracking-[0.5em] text-center"
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                          />
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={authenticating || (useOTP ? otp.length !== 6 : accessToken.length < 8)}
                        className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        {authenticating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Authenticating...
                          </>
                        ) : (
                          <>
                            <Wifi className="w-5 h-5" />
                            Connect to WiFi
                          </>
                        )}
                      </button>
                    </form>

                    {/* Help Text */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <p className="text-center text-blue-300 text-xs">
                        Don't have a booking?{' '}
                        <a
                          href={`/book/${spotId}`}
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Book now
                        </a>
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-blue-300/60 text-xs mt-6">
          Secured by deWifi • Real-time access control
        </p>
      </motion.div>
    </div>
  );
}
