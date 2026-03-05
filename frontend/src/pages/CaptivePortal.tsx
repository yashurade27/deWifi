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
  Check,
  AlertTriangle,
  XCircle,
  ShieldCheck,
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
  // by Mixed Content policy â€” return empty so callers skip gateway entirely.
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
 * backend on our behalf â€” this works even when the client's DNS is hijacked
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
      // Gateway found â€” return its result (success or failure) immediately
      console.log(`[CaptivePortal] Gateway responded at ${base}:`, data.success ? 'âœ…' : 'âŒ');
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
  console.warn('[CaptivePortal] Could not notify any gateway â€” firewall rules may not be updated');
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
  // We fire once loading finishes â€” spot may be a placeholder but the gateway
  // auth path works without the backend being reachable directly.
  useEffect(() => {
    if (!tokenParam || loading || authenticated || authenticating) return;

    const autoAuth = async () => {
      setAuthenticating(true);
      setError('');
      setErrorCode('');
      try {
        // â”€â”€ Step 1: Try gateway-direct auth first â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // When the phone is on the hotspot, DNS is hijacked so the public
        // backend URL is unreachable. The gateway has internet access and will
        // validate our token with the backend on our behalf.
        const gatewayResult = await tryGatewayAuth(spotId, tokenParam);

        if (gatewayResult !== null) {
          // Gateway was reachable â€” use its answer
          if (gatewayResult.success && gatewayResult.expiresAt) {
            const sToken = gatewayResult.sessionToken || 'gateway-managed';
            setSessionToken(sToken);
            setAuthenticated(true);
            localStorage.removeItem(`airlink_payment_${spotId}`);
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

        // â”€â”€ Step 2: Gateway not reachable â†’ call backend directly â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          localStorage.removeItem(`airlink_payment_${spotId}`);
          setExpiresAt(new Date(data.expiresAt!));
          if (data.deviceInfo) {
            setDeviceInfo({
              type: data.deviceInfo.type,
              active: data.deviceInfo.activeDevices,
              max: data.deviceInfo.maxDevices,
            });
          }
          localStorage.setItem(`captive_session_${spotId}`, data.sessionToken);

          // Notify the gateway (may fail if not on hotspot yet â€” user will see retry button)
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
      // â”€â”€ Try gateway heartbeat first (works when device has no internet) â”€â”€â”€â”€â”€â”€
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
      setError('No WiFi spot specified. Please connect to a valid AirLink hotspot.');
      setLoading(false);
      return;
    }

    // â”€â”€ 1. Try local gateway (phone has no internet on hotspot) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            localStorage.removeItem(`airlink_payment_${spotId}`);
            if (data.expiresAt) setExpiresAt(new Date(data.expiresAt));
          }
          setLoading(false);
          return; // Done â€” gateway responded, no error shown
        }
      } catch {
        // This gateway address not reachable, try next
      }
    }

    // â”€â”€ 2. Try direct backend (user already has internet) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    try {
      const res = await fetch(`${API_BASE}/api/captive/detect/${spotId}`);
      const data = await res.json();

      if (data.authenticated) {
        setAuthenticated(true);
        localStorage.removeItem(`airlink_payment_${spotId}`);
        setSpot(data.spot);
        if (data.expiresAt) setExpiresAt(new Date(data.expiresAt));
      } else if (data.spot) {
        setSpot(data.spot);
      } else {
        setSpot({ id: spotId, name: 'AirLink Hotspot', address: '' });
        setError('WiFi spot not found. Please check your connection.');
      }
    } catch {
      // â”€â”€ 3. Offline fallback â€” placeholder so the auth form can render â”€â”€â”€â”€â”€â”€â”€â”€
      setSpot({ id: spotId, name: 'AirLink Hotspot', address: 'Connect to authenticate' });
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
    // â”€â”€ 1. Try gateway status (no internet needed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (const base of getGatewayBases()) {
      try {
        const res = await fetch(`${base}/api/gateway/status`, {
          signal: AbortSignal.timeout(3000),
        });
        const data = await res.json();
        if (data.authenticated) {
          setAuthenticated(true);
          localStorage.removeItem(`airlink_payment_${spotId}`);
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
        // Gateway says not authenticated â€” clear stored session and show login form
        localStorage.removeItem(`captive_session_${spotId}`);
        detectCaptivePortal();
        return;
      } catch {
        // Gateway not reachable, try next
      }
    }

    // â”€â”€ 2. Fall back to backend validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    try {
      const res = await fetch(`${API_BASE}/api/captive/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: storedToken, spotId }),
      });
      const data = await res.json();

      if (data.authenticated) {
        setAuthenticated(true);
        localStorage.removeItem(`airlink_payment_${spotId}`);
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
      // â”€â”€ Step 1: Try gateway-direct auth first â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          localStorage.removeItem(`airlink_payment_${spotId}`);
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

      // â”€â”€ Step 2: Gateway not reachable â†’ call backend directly â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        localStorage.removeItem(`airlink_payment_${spotId}`);
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
      // â”€â”€ Try gateway disconnect first (releases firewall rule) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-[#0055FF]/20 border-t-[#0055FF] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm font-medium">Connecting to WiFi spot...</p>
        </motion.div>
      </div>
    );
  }

  // â”€â”€ HTTPS + no internet â€” the user must open the local HTTP portal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Mixed Content policy prevents fetch() calls from this HTTPS page to the
  // HTTP gateway.  The only solution is to navigate to the gateway directly.
  if (needsGatewayRedirect && !authenticated) {
    const gwUrl = getLocalGatewayUrl(accessToken || tokenParam || undefined);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-[-120px] left-[-120px] w-[480px] h-[480px] rounded-full bg-[#0055FF]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full bg-[#66FF00]/5 blur-[100px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-2xl">
            <div className="w-14 h-14 bg-[#0055FF]/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Wifi className="w-7 h-7 text-[#0055FF]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Redirect Required
            </h2>
            <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed">
              For security reasons, please open the captive portal directly in your browser.
            </p>
            <a
              href={gwUrl}
              className="block w-full bg-gradient-to-r from-[#0055FF] to-[#0066FF] hover:from-[#0044CC] hover:to-[#0055DD] text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 text-center shadow-[0_4px_20px_rgba(0,85,255,0.4)]"
            >
              Open Portal
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute top-[-120px] left-[-120px] w-[480px] h-[480px] rounded-full bg-[#0055FF]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full bg-[#66FF00]/5 blur-[100px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-14 h-14 bg-[#0055FF] rounded-2xl flex items-center justify-center shadow-[0_6px_24px_rgba(0,85,255,0.5)]">
              <Wifi className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[1.8rem] font-black tracking-tight text-gray-900 leading-none">
              Air<span className="text-[#0055FF]">Link</span>
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden">
          {/* Spot Info Header */}
          {spot && (
            <div className="bg-gradient-to-br from-blue-50 to-transparent p-6 border-b border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#0055FF]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wifi className="w-6 h-6 text-[#0055FF]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{spot.name}</h2>
                  <p className="text-gray-600 text-sm">{spot.address}</p>
                </div>
              </div>
            </div>
          )}
          {authenticated ? (
            /* Authenticated State */
            <div className="p-6 space-y-6">
              {/* Success Icon */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="w-8 h-8 text-green-600" strokeWidth={3} />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">You're Connected!</h3>
                <p className="text-gray-600 text-sm">Enjoy high-speed internet</p>
              </div>

              {/* Countdown Timer */}
              {expiresAt && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600 text-sm font-medium">Time Remaining</span>
                    <Clock className="w-4 h-4 text-[#0055FF]" />
                  </div>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0055FF] to-[#66FF00]">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#0055FF] to-[#66FF00]"
                      initial={{ width: '100%' }}
                      animate={{ 
                        width: expiresAt ? `${Math.max(0, (timeRemaining / ((expiresAt.getTime() - Date.now() + timeRemaining * 1000) / 1000)) * 100)}%` : '100%'
                      }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                </div>
              )}

              {/* Device Info */}
              {deviceInfo && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-700">
                      {getDeviceIcon(deviceInfo.type)}
                      <div>
                        <p className="text-gray-900 text-sm font-semibold">Your Device</p>
                        <p className="text-gray-600 text-xs">{deviceInfo.active} of {deviceInfo.max} devices active</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gateway Registration Warning */}
              {gatewayRegistered === false && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-yellow-900 text-sm font-semibold mb-2">
                        Internet access pending
                      </p>
                      <p className="text-yellow-700 text-xs mb-3">
                        The gateway needs to activate your connection.
                      </p>
                      <button
                        onClick={retryGatewayRegistration}
                        disabled={retryingGateway}
                        className="text-xs font-bold text-yellow-700 hover:text-yellow-800 transition-colors disabled:opacity-50"
                      >
                        {retryingGateway ? 'Activating...' : 'Retry Activation'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Disconnect Button */}
              <button
                onClick={handleDisconnect}
                className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
              >
                Disconnect
              </button>
            </div>
          ) : (
            /* Login Form */
            <div className="p-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4"
                >
                  <div className="flex gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-900 text-sm font-semibold">Authentication Failed</p>
                      <p className="text-red-700 text-xs mt-1">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleAuthenticate} className="space-y-5">
                {/* Toggle: Access Token / OTP */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUseOTP(false)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
                      !useOTP
                        ? 'bg-[#0055FF] text-white shadow-[0_4px_16px_rgba(0,85,255,0.3)]'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Access Token
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseOTP(true)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
                      useOTP
                        ? 'bg-[#0055FF] text-white shadow-[0_4px_16px_rgba(0,85,255,0.3)]'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    OTP Code
                  </button>
                </div>

                {/* Input Field */}
                {useOTP ? (
                  <div>
                    <label className="block text-gray-900 text-sm font-semibold mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0055FF] focus:border-transparent transition-all text-center text-2xl font-bold tracking-widest"
                      required
                    />
                    <p className="text-gray-500 text-xs mt-2">
                      Enter the 6-digit OTP from your booking confirmation
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-gray-900 text-sm font-semibold mb-2">
                      Access Token
                    </label>
                    <input
                      type="text"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value.toUpperCase())}
                      placeholder="A3B5C7D9E1F2G4H6"
                      maxLength={16}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0055FF] focus:border-transparent transition-all font-mono tracking-wider"
                      required
                    />
                    <p className="text-gray-500 text-xs mt-2">
                      Found in your booking confirmation email
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={authenticating}
                  className="w-full bg-gradient-to-r from-[#0055FF] to-[#0066FF] hover:from-[#0044CC] hover:to-[#0055DD] text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(0,85,255,0.4)] hover:shadow-[0_6px_24px_rgba(0,85,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {authenticating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-5 h-5" />
                      <span>Connect to WiFi</span>
                    </>
                  )}
                </button>
              </form>

              {/* Help Text */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3 text-gray-600 text-xs">
                  <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Your connection is secured with end-to-end encryption. Access token is valid for the duration of your booking.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div className="text-center mt-6">
          <a
            href="https://airlink.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 text-xs font-medium transition-colors"
          >
            Powered by AirLink
          </a>
        </div>
      </motion.div>
    </div>
  );
}
