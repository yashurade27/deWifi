import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpots } from '@/hooks/useSpots';
import type { ApiSpot } from '@/hooks/useSpots';
import { Navbar } from '@/components/layout/Navbar';
import {
  Wifi,
  MapPin,
  Star,
  Zap,
  Users,
  Clock,
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  LocateFixed,
  Navigation2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WifiSpot } from '@/data/dummySpots';

// ─── Fix Leaflet's missing default marker icons in Vite/Webpack ───────────────
// (Leaflet resolves icon URLs at build time incorrectly without this fix)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Custom coloured marker factory ─────────────────────────────────────────
function makeIcon(color: string, isSelected: boolean) {
  const size = isSelected ? 44 : 36;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 44 44">
      <circle cx="22" cy="18" r="${isSelected ? 14 : 12}" fill="${color}" stroke="white" stroke-width="3"
        filter="url(#drop)"/>
      <polygon points="22,${isSelected ? 36 : 34} 16,${isSelected ? 26 : 25} 28,${isSelected ? 26 : 25}"
        fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
      <defs>
        <filter id="drop" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <text x="22" y="23" text-anchor="middle" fill="white"
        font-size="${isSelected ? 11 : 10}" font-family="sans-serif" font-weight="700">Ξ</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 4],
    popupAnchor: [0, -(size - 6)],
  });
}

const TAG_COLORS: Record<ApiSpot['tag'], string> = {
  Home: '#10b981',
  Cafe: '#f59e0b',
  Office: '#6366f1',
  Library: '#8b5cf6',
  CoWorking: '#0055FF',
};

// ─── Distance helpers ─────────────────────────────────────────────────────────
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

// ─── User location marker icon ────────────────────────────────────────────────
const userLocationIcon = L.divIcon({
  html: `<div class="user-location-marker"><div class="pulse-ring"></div><div class="location-dot"></div></div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// ─── Freshness helpers ────────────────────────────────────────────────────────
function getMonitoringFreshness(spot: ApiSpot): 'verified' | 'stale' | 'unknown' {
  if (!spot.monitoring?.lastPingAt) return 'unknown';
  const minutesAgo = (Date.now() - new Date(spot.monitoring.lastPingAt).getTime()) / 60000;
  if (minutesAgo <= 15) return 'verified';
  if (minutesAgo <= 120) return 'stale';
  return 'unknown';
}

function getLastPingLabel(lastPingAt: string | null): string {
  if (!lastPingAt) return 'Never checked';
  const minutesAgo = Math.round((Date.now() - new Date(lastPingAt).getTime()) / 60000);
  if (minutesAgo < 1) return 'Just now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hoursAgo = Math.round(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  return `${Math.round(hoursAgo / 24)}d ago`;
}

// ─── LiveStatusBadge (compact — for SpotCard footer) ─────────────────────────
function LiveStatusBadge({ spot }: { spot: ApiSpot }) {
  const freshness = getMonitoringFreshness(spot);
  const isOnline = spot.monitoring?.isOnline ?? spot.isActive;
  const uptime = spot.monitoring?.uptimePercent;

  if (!spot.isActive) {
    return (
      <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Offline
      </span>
    );
  }
  if (freshness === 'verified' && isOnline) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live{uptime !== undefined ? ` \u00b7 ${uptime}%` : ''}
      </span>
    );
  }
  if (freshness === 'verified' && !isOnline) {
    return (
      <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Down
      </span>
    );
  }
  if (freshness === 'stale') {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        {isOnline ? 'Unverified' : 'May be down'}
      </span>
    );
  }
  // unknown
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      Unverified
    </span>
  );
}

// ─── PopupHealthRow (rich — for map popup) ───────────────────────────────────
function PopupHealthRow({ spot }: { spot: ApiSpot }) {
  const freshness = getMonitoringFreshness(spot);
  const isOnline = spot.monitoring?.isOnline ?? spot.isActive;
  const uptime = spot.monitoring?.uptimePercent;
  const latency = spot.monitoring?.latencyMs;
  const lastPingLabel = getLastPingLabel(spot.monitoring?.lastPingAt ?? null);

  const dotColors = {
    verified: isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500',
    stale: 'bg-amber-400',
    unknown: 'bg-gray-300',
  };
  const textColors = {
    verified: isOnline ? 'text-emerald-700' : 'text-red-600',
    stale: 'text-amber-700',
    unknown: 'text-gray-500',
  };
  const statusText = {
    verified: isOnline ? 'Live' : 'Offline',
    stale: isOnline ? 'Unverified · may be up' : 'Unverified · may be down',
    unknown: 'No ping data',
  };

  return (
    <div className="mt-2.5 pt-2.5 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${textColors[freshness]}`}>
          <span className={`w-2 h-2 rounded-full ${dotColors[freshness]}`} />
          {statusText[freshness]}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          {freshness === 'verified' ? (
            <span className="flex items-center gap-0.5 text-emerald-600">
              <CheckCircle2 size={9} />
              {lastPingLabel}
            </span>
          ) : freshness === 'stale' ? (
            <span className="flex items-center gap-0.5 text-amber-600">
              <AlertTriangle size={9} />
              {lastPingLabel}
            </span>
          ) : (
            <span className="text-gray-400">Never verified</span>
          )}
        </div>
      </div>
      {(uptime !== undefined || latency) && (
        <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-500">
          {uptime !== undefined && (
            <span className="flex items-center gap-1">
              <Activity size={9} className="text-green-500" />
              {uptime}% uptime
            </span>
          )}
          {latency !== null && latency !== undefined && latency > 0 && (
            <span className="flex items-center gap-1">
              <Zap size={9} className="text-blue-400" />
              {latency}ms latency
            </span>
          )}
          {freshness !== 'verified' && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle size={9} />
              Verify before booking
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helper: fly to selected spot ────────────────────────────────────────────
function FlyToSpot({ spot }: { spot: ApiSpot | null }) {
  const map = useMap();
  useEffect(() => {
    if (spot) map.flyTo([spot.lat, spot.lng], 15, { duration: 0.8 });
  }, [spot, map]);
  return null;
}

// ─── Helper: fly to user's location ──────────────────────────────────────────
function FlyToLocation({ position, trigger }: { position: [number, number] | null; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (position && trigger > 0) map.flyTo(position, 15, { duration: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, map]);
  return null;
}

// ─── Tags / cities for filters ────────────────────────────────────────────────
const ALL_TAGS: (ApiSpot['tag'] | 'All')[] = ['All', 'Home', 'Cafe', 'Office', 'Library', 'CoWorking'];

// ─── SpotCard (sidebar) ───────────────────────────────────────────────────────
function SpotCard({
  spot,
  selected,
  onClick,
  distance,
}: {
  spot: ApiSpot;
  selected: boolean;
  onClick: () => void;
  distance?: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-200 ${
        selected
          ? 'border-[#0055FF] dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-[0_0_0_2px_rgba(0,85,255,0.2)]'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{spot.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {spot.address}
          </p>
        </div>
        <span
          className="shrink-0 mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: TAG_COLORS[spot.tag] }}
        >
          {spot.tag}
        </span>
      </div>

      {/* Stats row */}
      <div className="mt-2.5 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span className="font-semibold text-gray-800 dark:text-gray-200">{spot.rating}</span>
          <span className="text-gray-400 dark:text-gray-500">({spot.reviewCount})</span>
        </span>
        <span className="flex items-center gap-1">
          <Zap size={11} className="text-blue-500" />
          {spot.speedMbps} Mbps
        </span>
        <span className="flex items-center gap-1">
          <Users size={11} className="text-purple-500" />
          {spot.maxUsers}
        </span>
      </div>

      {/* Footer row */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {spot.availableFrom} – {spot.availableTo}
          </span>
          {distance !== undefined && (
            <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400 font-medium">
              <Navigation2 size={10} />
              {formatDistance(distance)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <LiveStatusBadge spot={spot} />
          <span className="text-sm font-black text-[#0055FF] dark:text-blue-400">
            {spot.pricePerHour} ETH
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">/hr</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Explore Page ────────────────────────────────────────────────────────
export default function Explore() {
  const { spots, loading, error, isUsingFallback, refetch } = useSpots();
  const navigate = useNavigate();

  const [selectedSpot, setSelectedSpot] = useState<ApiSpot | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState<ApiSpot['tag'] | 'All'>('All');
  const [maxPrice, setMaxPrice] = useState(Infinity);
  const [priceInited, setPriceInited] = useState(false);
  const [onlyActive, setOnlyActive] = useState(false);

  const mapRef = useRef<L.Map | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const watchIdRef = useRef<number | null>(null);
  const firstCallRef = useRef<boolean>(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sortByNearest, setSortByNearest] = useState(false);
  const [locateTrigger, setLocateTrigger] = useState(0);

  // Derive price ceiling from the loaded spots so the slider always covers all data
  const highestPrice = spots.length
    ? Math.ceil(Math.max(...spots.map((s) => s.pricePerHour)) * 1000) / 1000
    : 0.01;
  const sliderMax  = Math.max(highestPrice, 0.01);   // never below 0.01
  const sliderStep = sliderMax <= 0.01 ? 0.001 : sliderMax <= 1 ? 0.01 : 10;

  // Auto-set maxPrice to the ceiling once spots arrive
  useEffect(() => {
    if (spots.length > 0 && !priceInited) {
      setMaxPrice(sliderMax);
      setPriceInited(true);
    }
  }, [spots, sliderMax, priceInited]);

  // Build city list from live data
  const allCities = ['All', ...Array.from(new Set(spots.map((s) => s.city)))];

  const filtered = (() => {
    const base = spots.filter((s) => {
      if (onlyActive && !s.isActive) return false;
      if (cityFilter !== 'All' && s.city !== cityFilter) return false;
      if (tagFilter !== 'All' && s.tag !== tagFilter) return false;
      if (maxPrice !== Infinity && s.pricePerHour > maxPrice) return false;
      if (
        search &&
        !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.city.toLowerCase().includes(search.toLowerCase()) &&
        !s.address.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
    if (sortByNearest && userLocation) {
      return [...base].sort((a, b) => {
        const da = haversineDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const db = haversineDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return da - db;
      });
    }
    return base;
  })();

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    firstCallRef.current = true;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setIsLocating(false);
        setSortByNearest(true);
        if (firstCallRef.current) {
          firstCallRef.current = false;
          setLocateTrigger((t) => t + 1);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocationError('Location permission denied. Please enable it in browser settings.');
        } else {
          setLocationError('Unable to retrieve your location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleCardClick = (spot: ApiSpot) => {
    setSelectedSpot(spot);
    if (window.innerWidth < 768) setSidebarOpen(false); // close sidebar on mobile
  };

  // Resize handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 280 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* ── Sidebar ───────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              ref={sidebarRef}
              key="sidebar"
              initial={{ x: -340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -340, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ width: `${sidebarWidth}px` }}
              className="absolute md:relative z-[600] top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-xl md:shadow-none"
            >
              {/* Loading / error banner */}
              {loading && (
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-3 h-3 rounded-full border-2 border-uplink-blue border-t-transparent animate-spin" />
                  Loading spots…
                </div>
              )}
              {error && (
                <div className="px-4 py-2 border-b border-red-100 bg-red-50 dark:bg-red-950/30 dark:border-red-900 flex items-center justify-between text-xs text-red-600 dark:text-red-400">
                  <span>{error}</span>
                  <button onClick={refetch} className="underline font-medium shrink-0 ml-2">Retry</button>
                </div>
              )}
              {!error && isUsingFallback && (
                <div className="px-4 py-2 border-b border-amber-100 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
                  <span>Showing demo spots — your created spots are not visible. Start the backend and <button onClick={refetch} className="underline font-medium">refresh</button>.</span>
                </div>
              )}

              {/* Search */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search spots, city…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF]/30 focus:border-[#0055FF] dark:focus:border-blue-400 transition"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="border-b border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal size={12} />
                    Filters
                  </div>
                  {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                {filtersOpen && (
                  <div className="px-4 pb-3 space-y-3">

                {/* City */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">City</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => setCityFilter(city)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                          cityFilter === city
                            ? 'bg-[#0055FF] text-white border-[#0055FF]'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0055FF] dark:hover:border-blue-400 hover:text-[#0055FF] dark:hover:text-blue-400'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tag */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setTagFilter(tag)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                          tagFilter === tag
                            ? 'bg-[#0055FF] text-white border-[#0055FF]'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0055FF] dark:hover:border-blue-400 hover:text-[#0055FF] dark:hover:text-blue-400'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price slider */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Max price:{' '}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{maxPrice === Infinity ? sliderMax : maxPrice} ETH/hr</span>
                  </p>
                  <input
                    type="range"
                    min={sliderStep}
                    max={sliderMax}
                    step={sliderStep}
                    value={maxPrice === Infinity ? sliderMax : maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-[#0055FF]"
                  />
                </div>

                {/* Active only toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setOnlyActive((v) => !v)}
                    className={`w-9 h-5 rounded-full flex items-center transition-colors duration-200 ${
                      onlyActive ? 'bg-[#0055FF]' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                        onlyActive ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Active spots only</span>
                  </label>
                </div>
                )}
              </div>

              {/* Spot list */}
              <div className="flex-1 overflow-y-auto px-3 pt-4 pb-3 space-y-2.5">
                <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 pb-2 mb-1 flex items-center gap-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold px-1 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 flex-1">
                    {filtered.length} spot{filtered.length !== 1 ? 's' : ''} found
                  </p>
                  {userLocation && (
                    <button
                      onClick={() => setSortByNearest((v) => !v)}
                      className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-md border font-medium transition-all whitespace-nowrap ${
                        sortByNearest
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 text-blue-600 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-300 hover:text-blue-500'
                      }`}
                    >
                      <Navigation2 size={11} />
                      Nearest
                    </button>
                  )}
                </div>
                <AnimatePresence mode="popLayout">
                  {filtered.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-gray-400"
                    >
                      <Wifi size={32} className="mb-2 opacity-40" />
                      <p className="text-sm">No spots match your filters</p>
                    </motion.div>
                  ) : (
                    filtered.map((spot) => (
                      <SpotCard
                        key={spot._id}
                        spot={spot}
                        selected={selectedSpot?._id === spot._id}
                        onClick={() => handleCardClick(spot)}
                        distance={
                          userLocation
                            ? haversineDistance(userLocation.lat, userLocation.lng, spot.lat, spot.lng)
                            : undefined
                        }
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Resize Handle */}
              <div
                onMouseDown={handleMouseDown}
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors group z-[650]"
              >
                <div className="absolute top-1/2 -translate-y-1/2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white border border-gray-300 rounded-md p-0.5 shadow-sm">
                    <GripVertical size={12} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Sidebar toggle button ─────────────────────── */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute z-[601] top-4 left-4 md:top-1/2 md:-translate-y-1/2 md:left-auto"
          style={sidebarOpen ? { left: `${sidebarWidth + 4}px` } : { left: '16px' }}
        >
          <motion.div
            className="w-7 h-7 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-[#0055FF] dark:hover:text-blue-400 hover:border-[#0055FF] dark:hover:border-blue-400 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </motion.div>
        </button>

        {/* ── Map ──────────────────────────────────────────── */}
        <div className="flex-1 relative z-0">
          <MapContainer
            center={[19.07, 72.87]}
            zoom={5}
            className="w-full h-full"
            ref={mapRef}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Fly to selected */}
            <FlyToSpot spot={selectedSpot} />

            {/* User live location */}
            <FlyToLocation
              position={userLocation ? [userLocation.lat, userLocation.lng] : null}
              trigger={locateTrigger}
            />
            {userLocation && (
              <>
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={userLocationIcon}
                  zIndexOffset={1000}
                >
                  <Popup closeButton={false}>
                    <div className="font-sans">
                      <p className="text-xs font-bold text-blue-600">📍 Your Location</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={300}
                  pathOptions={{
                    color: '#2563eb',
                    fillColor: '#2563eb',
                    fillOpacity: 0.07,
                    weight: 1.5,
                    dashArray: '4 4',
                  }}
                />
              </>
            )}

            {filtered.map((spot) => (
              <Marker
                key={spot._id}
                position={[spot.lat, spot.lng]}
                icon={makeIcon(
                  spot.isActive ? TAG_COLORS[spot.tag] : '#9ca3af',
                  selectedSpot?._id === spot._id
                )}
                eventHandlers={{
                  click: () => setSelectedSpot(spot),
                }}
              >
                <Popup closeButton={false} className="leaflet-popup-custom">
                  <div className="w-64 font-sans">
                    {/* Tag + status */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: TAG_COLORS[spot.tag] }}
                      >
                        {spot.tag}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-xs font-medium ${
                          spot.isActive ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        <CircleDot size={10} />
                        {spot.isActive ? 'Active' : 'Offline'}
                      </span>
                    </div>

                    {/* Name */}
                    <p className="font-bold text-gray-900 text-sm leading-snug">{spot.name}</p>

                    {/* Address */}
                    <p className="flex items-start gap-1 text-xs text-gray-500 mt-1">
                      <MapPin size={11} className="mt-0.5 shrink-0" />
                      {spot.address}
                    </p>

                    {/* Stats */}
                    <div className="mt-2.5 flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <strong>{spot.rating}</strong>
                        <span className="text-gray-400">({spot.reviewCount})</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap size={11} className="text-blue-500" />
                        {spot.speedMbps} Mbps
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} className="text-purple-500" />
                        {spot.maxUsers} users
                      </span>
                    </div>

                    {/* Owner */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#0055FF] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {spot.ownerAvatar || spot.ownerName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-600">{spot.ownerName}</span>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {spot.amenities.slice(0, 4).map((a) => (
                        <span
                          key={a}
                          className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md"
                        >
                          {a}
                        </span>
                      ))}
                      {spot.amenities.length > 4 && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                          +{spot.amenities.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Live status — freshness-aware */}
                    <PopupHealthRow spot={spot} />

                    {/* CTA */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-black text-[#0055FF]">
                        {spot.pricePerHour} ETH
                        <span className="text-xs font-medium text-gray-400">/hr</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/spots/${spot._id}`);
                          }}
                          className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Details
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/book/${spot._id}`);
                          }}
                          disabled={!spot.isActive}
                          className="text-xs font-semibold text-white bg-[#0055FF] hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {spot.isActive ? 'Book Now →' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* ── Legend ─────────────────────────────────── */}
          <div className="absolute bottom-6 right-4 z-[500] bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg px-3 py-2.5 text-xs space-y-1">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Legend</p>
            {(Object.entries(TAG_COLORS) as [WifiSpot['tag'], string][]).map(([tag, color]) => (
              <div key={tag} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-600 dark:text-gray-400">{tag}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
              <span className="w-3 h-3 rounded-full border-2 border-white shadow bg-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Offline</span>
            </div>
            {userLocation && (
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                <span className="w-3 h-3 rounded-full border-2 border-white shadow bg-blue-500" />
                <span className="text-blue-600 dark:text-blue-400 font-medium">You</span>
              </div>
            )}
          </div>

          {/* ── Stats bar + Locate button ─────────────────────────── */}
          <div className="absolute top-4 right-4 z-[500] flex items-center gap-2">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-full border border-gray-200 dark:border-gray-700 shadow-md px-3.5 py-2 flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {spots.filter((s) => s.isActive).length}
              </span>
              <span className="text-gray-500 dark:text-gray-400">active spots</span>
            </div>
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-full border border-gray-200 dark:border-gray-700 shadow-md px-3.5 py-2 flex items-center gap-2 text-xs">
              <Wifi size={12} className="text-uplink-blue" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">{spots.length}</span>
              <span className="text-gray-500 dark:text-gray-400">total</span>
            </div>
            <motion.button
              onClick={handleLocateMe}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={userLocation ? 'Re-center on my location' : 'Show my location on map'}
              className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-full shadow-md px-3.5 py-2 flex items-center gap-1.5 text-xs font-medium border transition-all ${
                isLocating
                  ? 'border-blue-300 text-blue-500 dark:text-blue-400'
                  : userLocation
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              <LocateFixed size={13} className={isLocating ? 'animate-pulse' : ''} />
              {isLocating ? 'Locating…' : userLocation ? 'Located ✓' : 'My Location'}
            </motion.button>
          </div>
          {locationError && (
            <div className="absolute top-16 right-4 z-[500] bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 text-xs text-red-600 dark:text-red-400 shadow-lg flex items-center gap-2 max-w-xs">
              <AlertTriangle size={12} className="shrink-0" />
              <span>{locationError}</span>
              <button onClick={() => setLocationError(null)} className="ml-1 text-red-400 hover:text-red-600 font-bold shrink-0">×</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
