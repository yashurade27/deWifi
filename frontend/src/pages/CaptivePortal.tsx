import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  ExternalLink,
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

// Default gateway port; matches gateway.js default
const GATEWAY_PORT = 8080;

/**
 * TRUE when the current page is served over HTTPS.
 *
 * Browsers enforce Mixed Content: fetch() calls to plain HTTP endpoints are
 * silently blocked when the page itself is on HTTPS.  This means every call
 * to http://192.168.137.1:8080 from the ngrok HTTPS portal will fail.
 *
 * When this is true we must redirect the user to the gateway's own HTTP URL
 * instead of trying (and failing) to reach it via fetch.
 */
const PAGE_IS_HTTPS = window.location.protocol === 'https:';

/** Candidate gateway base URLs in preference order. */
function getGatewayBases(): string[] {
  // When this page is on HTTPS, HTTP fetch calls to the gateway are blocked
  // by Mixed Content policy — return empty so callers skip gateway entirely.
  if (PAGE_IS_HTTPS) return [];

  const bases: string[] = [];
  // 1. Same host as the page (e.g. user reached React app via 192.168.137.1:5173)
  if (window.location.hostname && window.location.hostname !== 'localhost') {
    bases.push(`http://${window.location.hostname}:${GATEWAY_PORT}`);
  }
  // 2. Windows Mobile Hotspot default gateway
  bases.push(`http://192.168.137.1:${GATEWAY_PORT}`);
  // 3. Localhost (owner testing on the same machine)
  bases.push(`http://localhost:${GATEWAY_PORT}`);
  return [...new Set(bases)];
}

/**
 * Returns the URL of the local HTTP gateway portal.
 * This is what the user should open when on HTTPS and auth fails.
 */
function getLocalGatewayUrl(token?: string): string {
  const base = `http://192.168.137.1:${GATEWAY_PORT}/`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

/**
 * Try to authenticate directly through the LOCAL gateway server.
 * The gateway has internet access and will validate the token with the
 * backend on our behalf — this works even when the client's DNS is hijacked
 * by the captive portal (i.e. the client can't reach the backend directly).
 *
 * Returns the gateway's auth result, or null if no gateway was reachable.
 */
async function tryGatewayAuth(
  spotId: string,
  accessToken?: string,
  otp?: string,
): Promise<AuthResult | null> {
  for (const base of getGatewayBases()) {
    try {
      const res = await fetch(`${base}/api/gateway/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotId,
          accessToken: accessToken || undefined,
          otp: otp || undefined,
        }),
        signal: AbortSignal.timeout(4000),
      });
      const data = await res.json();
      // Gateway found — return its result (success or failure) immediately
      console.log(`[CaptivePortal] Gateway responded at ${base}:`, data.success ? '✅' : '❌');
      return data as AuthResult;
    } catch {
      // This gateway address not reachable, try next
    }
  }
  // No gateway reachable
  return null;
}

/**
 * After authenticating with the backend, also register the session with the
 * local gateway so it can whitelist our IP in the Windows Firewall.
 * We try several common hotspot-gateway addresses.
 */
async function notifyGateway(sessionToken: string): Promise<boolean> {
  for (const base of getGatewayBases()) {
    try {
      const res = await fetch(`${base}/api/gateway/register-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        console.log(`[CaptivePortal] Gateway notified at ${base}`);
        return true;
      }
    } catch {
      // Try next
    }
  }
  console.warn('[CaptivePortal] Could not notify any gateway — firewall rules may not be updated');
  return false;
}

export default function CaptivePortal(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const spotId = searchParams.get('spot') || searchParams.get('spotId') || '';
  const tokenParam = (searchParams.get('token') || '').toUpperCase();
  const otpParam = searchParams.get('otp') || '';
  
  const [spot, setSpot] = useState<SpotInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  
  const [accessToken, setAccessToken] = useState(tokenParam);
  const [otp, setOtp] = useState(otpParam);
  const [useOTP, setUseOTP] = useState(!tokenParam && !!otpParam);
  
  const [sessionToken, setSessionToken] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState<{ type: string; active: number; max: number } | null>(null);

  // Tracks whether the local gateway has been notified (firewall whitelisted).
  // null = not yet attempted, true = success, false = failed (no internet until retried).
  const [gatewayRegistered, setGatewayRegistered] = useState<boolean | null>(null);
  const [retryingGateway, setRetryingGateway] = useState(false);

  // Set to true when the page is on HTTPS but the gateway is HTTP.
  // Browser Mixed Content policy silently blocks HTTP fetch from HTTPS pages.
  // We show a redirect card so the user can open the local HTTP portal instead.
  const [needsGatewayRedirect, setNeedsGatewayRedirect] = useState(false);

  // Check if already authenticated (via stored session)
  useEffect(() => {
    const storedSession = localStorage.getItem(`captive_session_${spotId}`);
    if (storedSession) {
      validateStoredSession(storedSession);
    } else {
      detectCaptivePortal();
    }
  }, [spotId]);

  // Auto-authenticate when token is passed via URL.
  // We fire once loading finishes — spot may be a placeholder but the gateway
  // auth path works without the backend being reachable directly.
  useEffect(() => {
    if (!tokenParam || loading || authenticated || authenticating) return;

    const autoAuth = async () => {
      setAuthenticating(true);
      setError('');
      setErrorCode('');
      try {
        // ── Step 1: Try gateway-direct auth first ─────────────────────────────
        // When the phone is on the hotspot, DNS is hijacked so the public
        // backend URL is unreachable. The gateway has internet access and will
        // validate our token with the backend on our behalf.
        const gatewayResult = await tryGatewayAuth(spotId, tokenParam);

        if (gatewayResult !== null) {
          // Gateway was reachable — use its answer
          if (gatewayResult.success && gatewayResult.expiresAt) {
            const sToken = gatewayResult.sessionToken || 'gateway-managed';
            setSessionToken(sToken);
            setAuthenticated(true);
            localStorage.removeItem(`dewifi_payment_${spotId}`);
            setExpiresAt(new Date(gatewayResult.expiresAt));
            setGatewayRegistered(true);
            if (sToken !== 'gateway-managed') {
              localStorage.setItem(`captive_session_${spotId}`, sToken);
            }
            if (gatewayResult.deviceInfo) {
              setDeviceInfo({
                type: gatewayResult.deviceInfo.type,
                active: gatewayResult.deviceInfo.activeDevices,
                max: gatewayResult.deviceInfo.maxDevices,
              });
            }
            return;
          } else {
            setError(gatewayResult.message || 'Authentication failed. Please check your token.');
            setErrorCode(gatewayResult.errorCode || '');
            return;
          }
        }

        // ── Step 2: Gateway not reachable → call backend directly ─────────────
        // This works when the user is NOT on the hotspot (e.g. they paid on
        // home WiFi and are previewing the portal before connecting).
        const res = await fetch(`${API_BASE}/api/captive/authenticate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spotId, accessToken: tokenParam }),
        });
        const data: AuthResult = await res.json();

        if (data.success && data.sessionToken) {
          setSessionToken(data.sessionToken);
          setAuthenticated(true);
          localStorage.removeItem(`dewifi_payment_${spotId}`);
          setExpiresAt(new Date(data.expiresAt!));
          if (data.deviceInfo) {
            setDeviceInfo({
              type: data.deviceInfo.type,
              active: data.deviceInfo.activeDevices,
              max: data.deviceInfo.maxDevices,
            });
          }
          localStorage.setItem(`captive_session_${spotId}`, data.sessionToken);

          // Notify the gateway (may fail if not on hotspot yet — user will see retry button)
          const registered = await notifyGateway(data.sessionToken);
          setGatewayRegistered(registered);
        } else {
          setError(data.message || 'Authentication failed. Please try again.');
          setErrorCode(data.errorCode || '');
        }
      } catch {
        setError('Auto-authentication failed. Please enter your token manually.');
      } finally {
        setAuthenticating(false);
      }
    };

    autoAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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
      // ── Try gateway heartbeat first (works when device has no internet) ──────
      let validated = false;
      for (const base of getGatewayBases()) {
        try {
          const res = await fetch(`${base}/api/gateway/status`, {
            signal: AbortSignal.timeout(3000),
          });
          const data = await res.json();
          if (!data.authenticated) {
            setAuthenticated(false);
            localStorage.removeItem(`captive_session_${spotId}`);
            setError('Your session has expired.');
          }
          validated = true;
          break;
        } catch { /* try next */ }
      }

      if (!validated) {
        // Fall back to direct backend
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
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(heartbeat);
  }, [authenticated, sessionToken, spotId]);

  /**
   * Fetch spot metadata on first load.
   *
   * Priority:
   *  1. Local gateway  (works when the phone is on the hotspot with no internet)
   *  2. Direct backend (works when the browser already has internet)
   *  3. Placeholder    (always lets the form render so the user can still auth)
   */
  const detectCaptivePortal = async () => {
    if (!spotId) {
      setError('No WiFi spot specified. Please connect to a valid deWifi hotspot.');
      setLoading(false);
      return;
    }

    // ── 1. Try local gateway (phone has no internet on hotspot) ──────────────
    for (const base of getGatewayBases()) {
      try {
        const res = await fetch(`${base}/api/gateway/spot-info`, {
          signal: AbortSignal.timeout(3000),
        });
        const data = await res.json();
        if (data.spot) {
          setSpot(data.spot);
          if (data.authenticated) {
            setAuthenticated(true);
            localStorage.removeItem(`dewifi_payment_${spotId}`);
            if (data.expiresAt) setExpiresAt(new Date(data.expiresAt));
          }
          setLoading(false);
          return; // Done — gateway responded, no error shown
        }
      } catch {
        // This gateway address not reachable, try next
      }
    }

    // ── 2. Try direct backend (user already has internet) ─────────────────────
    try {
      const res = await fetch(`${API_BASE}/api/captive/detect/${spotId}`);
      const data = await res.json();

      if (data.authenticated) {
        setAuthenticated(true);
        localStorage.removeItem(`dewifi_payment_${spotId}`);
        setSpot(data.spot);
        if (data.expiresAt) setExpiresAt(new Date(data.expiresAt));
      } else if (data.spot) {
        setSpot(data.spot);
      } else {
        setSpot({ id: spotId, name: 'deWifi Hotspot', address: '' });
        setError('WiFi spot not found. Please check your connection.');
      }
    } catch {
      // ── 3. Offline fallback — placeholder so the auth form can render ────────
      setSpot({ id: spotId, name: 'deWifi Hotspot', address: 'Connect to authenticate' });
      // If the page is on HTTPS and the backend is unreachable, the only way
      // to authenticate is through the local HTTP gateway.  Signal this so the
      // UI can show a direct link to http://192.168.137.1:8080.
      if (PAGE_IS_HTTPS) {
        setNeedsGatewayRedirect(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateStoredSession = async (storedToken: string) => {
    // ── 1. Try gateway status (no internet needed) ─────────────────────────────
    for (const base of getGatewayBases()) {
      try {
        const res = await fetch(`${base}/api/gateway/status`, {
          signal: AbortSignal.timeout(3000),
        });
        const data = await res.json();
        if (data.authenticated) {
          setAuthenticated(true);
          localStorage.removeItem(`dewifi_payment_${spotId}`);
          setSessionToken(storedToken);
          setExpiresAt(new Date(data.expiresAt));
          setGatewayRegistered(true);
          // Fetch spot info from gateway too
          try {
            const spotRes = await fetch(`${base}/api/gateway/spot-info`, { signal: AbortSignal.timeout(2000) });
            const spotData = await spotRes.json();
            if (spotData.spot) setSpot(spotData.spot);
          } catch { /* non-critical */ }
          setLoading(false);
          return;
        }
        // Gateway says not authenticated — clear stored session and show login form
        localStorage.removeItem(`captive_session_${spotId}`);
        detectCaptivePortal();
        return;
      } catch {
        // Gateway not reachable, try next
      }
    }

    // ── 2. Fall back to backend validation ─────────────────────────────────────
    try {
      const res = await fetch(`${API_BASE}/api/captive/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: storedToken, spotId }),
      });
      const data = await res.json();

      if (data.authenticated) {
        setAuthenticated(true);
        localStorage.removeItem(`dewifi_payment_${spotId}`);
        setSessionToken(storedToken);
        setExpiresAt(new Date(data.expiresAt));

        // Fetch spot info
        const statusRes = await fetch(`${API_BASE}/api/captive/status/${spotId}`);
        const statusData = await statusRes.json();
        if (statusData.spot) setSpot(statusData.spot);
      } else {
        localStorage.removeItem(`captive_session_${spotId}`);
        detectCaptivePortal();
      }
    } catch {
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
      // ── Step 1: Try gateway-direct auth first ───────────────────────────────
      const gatewayResult = await tryGatewayAuth(
        spotId,
        useOTP ? undefined : accessToken.trim(),
        useOTP ? otp.trim() : undefined,
      );

      if (gatewayResult !== null) {
        if (gatewayResult.success && gatewayResult.expiresAt) {
          const sToken = gatewayResult.sessionToken || 'gateway-managed';
          setSessionToken(sToken);
          setAuthenticated(true);
          localStorage.removeItem(`dewifi_payment_${spotId}`);
          setExpiresAt(new Date(gatewayResult.expiresAt));
          setGatewayRegistered(true);
          if (sToken !== 'gateway-managed') {
            localStorage.setItem(`captive_session_${spotId}`, sToken);
          }
          if (gatewayResult.deviceInfo) {
            setDeviceInfo({
              type: gatewayResult.deviceInfo.type,
              active: gatewayResult.deviceInfo.activeDevices,
              max: gatewayResult.deviceInfo.maxDevices,
            });
          }
          return;
        } else {
          setError(gatewayResult.message || 'Authentication failed. Please check your token.');
          setErrorCode(gatewayResult.errorCode || '');
          return;
        }
      }

      // ── Step 2: Gateway not reachable → call backend directly ───────────────
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
        localStorage.removeItem(`dewifi_payment_${spotId}`);
        setExpiresAt(new Date(data.expiresAt!));
        
        if (data.deviceInfo) {
          setDeviceInfo({
            type: data.deviceInfo.type,
            active: data.deviceInfo.activeDevices,
            max: data.deviceInfo.maxDevices,
          });
        }

        localStorage.setItem(`captive_session_${spotId}`, data.sessionToken);

        const registered = await notifyGateway(data.sessionToken);
        setGatewayRegistered(registered);
      } else {
        setError(data.message || 'Authentication failed. Please check your token and try again.');
        setErrorCode(data.errorCode || '');
      }
    } catch {
      // If on HTTPS and backend not reachable, the only remaining path is the
      // local HTTP gateway.  Show the redirect card instead of a generic error.
      if (PAGE_IS_HTTPS) {
        setNeedsGatewayRedirect(true);
      } else {
        setError('Failed to authenticate. Please try again.');
      }
    } finally {
      setAuthenticating(false);
    }
  };

  /** Retry gateway registration (used from the "Activate Internet" warning banner). */
  const retryGatewayRegistration = async () => {
    if (!sessionToken || sessionToken === 'gateway-managed') return;
    setRetryingGateway(true);
    const ok = await notifyGateway(sessionToken);
    setGatewayRegistered(ok);
    setRetryingGateway(false);
  };

  const handleDisconnect = async () => {
    try {
      // ── Try gateway disconnect first (releases firewall rule) ──────────────
      let gatewayDisconnected = false;
      for (const base of getGatewayBases()) {
        try {
          await fetch(`${base}/api/gateway/disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
            signal: AbortSignal.timeout(3000),
          });
          gatewayDisconnected = true;
          break;
        } catch { /* try next */ }
      }
      // Also tell the backend (best-effort, may fail when no internet)
      if (!gatewayDisconnected) {
        await fetch(`${API_BASE}/api/captive/disconnect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken }),
        });
      }
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
      <div className="min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
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

  // ── HTTPS + no internet — the user must open the local HTTP portal ───────────────
  // Mixed Content policy prevents fetch() calls from this HTTPS page to the
  // HTTP gateway.  The only solution is to navigate to the gateway directly.
  if (needsGatewayRedirect && !authenticated) {
    const gwUrl = getLocalGatewayUrl(accessToken || tokenParam || undefined);
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">deWifi Portal</h1>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
            <div className="text-center mb-5">
              <WifiOff className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-white mb-2">Open the Local Portal</h2>
              <p className="text-blue-200 text-sm">
                Your browser is blocking the authentication request because this
                page loads over HTTPS but the hotspot gateway uses HTTP.
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 mb-5 text-sm text-blue-200">
              <p className="font-medium text-white mb-1">📶 To connect to this WiFi:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Make sure you are connected to the hotspot</li>
                <li>Tap the button below to open the local portal</li>
                <li>Enter your access token there to authenticate</li>
              </ol>
            </div>
            <a
              href={gwUrl}
              className="flex items-center justify-center gap-2 w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all text-center"
            >
              <ExternalLink className="w-5 h-5" />
              Open Auth Portal
            </a>
            <p className="text-center text-blue-300/60 text-xs mt-4">
              Opens: <span className="font-mono">{gwUrl}</span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
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

                {/* Gateway registration warning — shown when the firewall hasn't been updated */}
                {gatewayRegistered === false && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-yellow-200 text-sm font-medium">
                          Internet not activated yet
                        </p>
                        <p className="text-yellow-300/80 text-xs mt-1">
                          The gateway couldn't be reached to unlock your internet access.
                          Make sure you are connected to this WiFi hotspot, then tap the button below.
                        </p>
                        <button
                          onClick={retryGatewayRegistration}
                          disabled={retryingGateway}
                          className="mt-3 flex items-center gap-2 px-4 py-2 bg-yellow-500/30 hover:bg-yellow-500/50 text-yellow-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {retryingGateway ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Activating...</>
                          ) : (
                            <><RefreshCw className="w-4 h-4" /> Activate Internet Access</>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {gatewayRegistered === true && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    <p className="text-green-200 text-xs">Internet access activated — enjoy browsing!</p>
                  </motion.div>
                )}

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
                          <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
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
