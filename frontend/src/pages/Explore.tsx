import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useState, useRef, useEffect } from 'react';
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
        font-size="${isSelected ? 11 : 10}" font-family="sans-serif" font-weight="700">₹</text>
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

// ─── Helper: fly to selected spot ────────────────────────────────────────────
function FlyToSpot({ spot }: { spot: ApiSpot | null }) {
  const map = useMap();
  useEffect(() => {
    if (spot) map.flyTo([spot.lat, spot.lng], 15, { duration: 0.8 });
  }, [spot, map]);
  return null;
}

// ─── Tags / cities for filters ────────────────────────────────────────────────
const ALL_TAGS: (ApiSpot['tag'] | 'All')[] = ['All', 'Home', 'Cafe', 'Office', 'Library', 'CoWorking'];

// ─── SpotCard (sidebar) ───────────────────────────────────────────────────────
function SpotCard({
  spot,
  selected,
  onClick,
}: {
  spot: ApiSpot;
  selected: boolean;
  onClick: () => void;
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
          ? 'border-[#0055FF] bg-blue-50 shadow-[0_0_0_2px_rgba(0,85,255,0.2)]'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{spot.name}</p>
          <p className="text-xs text-gray-500 truncate mt-0.5">
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
      <div className="mt-2.5 flex items-center gap-3 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span className="font-semibold text-gray-800">{spot.rating}</span>
          <span className="text-gray-400">({spot.reviewCount})</span>
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
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={11} />
          {spot.availableFrom} – {spot.availableTo}
        </div>
        <div className="flex items-center gap-1.5">
          {!spot.isActive && (
            <span className="text-xs text-red-500 font-medium">Offline</span>
          )}
          <span className="text-sm font-black text-[#0055FF]">
            ₹{spot.pricePerHour}
            <span className="text-xs font-medium text-gray-400">/hr</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Explore Page ────────────────────────────────────────────────────────
export default function Explore() {
  const { spots, loading, error, refetch } = useSpots();
  const navigate = useNavigate();

  const [selectedSpot, setSelectedSpot] = useState<ApiSpot | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState<ApiSpot['tag'] | 'All'>('All');
  const [maxPrice, setMaxPrice] = useState(100);
  const [onlyActive, setOnlyActive] = useState(false);

  const mapRef = useRef<L.Map | null>(null);

  // Build city list from live data
  const allCities = ['All', ...Array.from(new Set(spots.map((s) => s.city)))];

  const filtered = spots.filter((s) => {
    if (onlyActive && !s.isActive) return false;
    if (cityFilter !== 'All' && s.city !== cityFilter) return false;
    if (tagFilter !== 'All' && s.tag !== tagFilter) return false;
    if (s.pricePerHour > maxPrice) return false;
    if (
      search &&
      !s.name.toLowerCase().includes(search.toLowerCase()) &&
      !s.city.toLowerCase().includes(search.toLowerCase()) &&
      !s.address.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const handleCardClick = (spot: ApiSpot) => {
    setSelectedSpot(spot);
    if (window.innerWidth < 768) setSidebarOpen(false); // close sidebar on mobile
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* ── Sidebar ───────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ x: -340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -340, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute md:relative z-[600] top-0 left-0 h-full w-80 bg-white border-r border-gray-200 flex flex-col shadow-xl md:shadow-none"
            >
              {/* Loading / error banner */}
              {loading && (
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-full border-2 border-uplink-blue border-t-transparent animate-spin" />
                  Loading spots…
                </div>
              )}
              {error && (
                <div className="px-4 py-2 border-b border-red-100 bg-red-50 flex items-center justify-between text-xs text-red-600">
                  <span>{error}</span>
                  <button onClick={refetch} className="underline font-medium">Retry</button>
                </div>
              )}

              {/* Search */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search spots, city…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0055FF]/30 focus:border-[#0055FF] transition"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="px-4 py-3 border-b border-gray-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <SlidersHorizontal size={12} />
                  Filters
                </div>

                {/* City */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">City</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => setCityFilter(city)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                          cityFilter === city
                            ? 'bg-[#0055FF] text-white border-[#0055FF]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#0055FF] hover:text-[#0055FF]'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tag */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setTagFilter(tag)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                          tagFilter === tag
                            ? 'bg-[#0055FF] text-white border-[#0055FF]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#0055FF] hover:text-[#0055FF]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price slider */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">
                    Max price:{' '}
                    <span className="font-semibold text-gray-800">₹{maxPrice}/hr</span>
                  </p>
                  <input
                    type="range"
                    min={25}
                    max={100}
                    step={5}
                    value={maxPrice}
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
                  <span className="text-xs text-gray-600 font-medium">Active spots only</span>
                </label>
              </div>

              {/* Spot list */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                <p className="text-xs text-gray-400 font-medium px-1">
                  {filtered.length} spot{filtered.length !== 1 ? 's' : ''} found
                </p>
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
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Sidebar toggle button ─────────────────────── */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute z-[601] top-4 left-4 md:top-1/2 md:-translate-y-1/2 md:left-auto"
          style={sidebarOpen ? { left: '324px' } : { left: '16px' }}
        >
          <motion.div
            className="w-7 h-7 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:text-[#0055FF] hover:border-[#0055FF] transition-colors"
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

            {spots.map((spot) => (
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

                    {/* Monitoring Status */}
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Activity size={12} className={spot.isActive ? 'text-green-500' : 'text-red-500'} />
                      <span className={spot.isActive ? 'text-green-600' : 'text-red-600'}>
                        {spot.isActive ? 'Available' : 'Offline'}
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-black text-[#0055FF]">
                        ₹{spot.pricePerHour}
                        <span className="text-xs font-medium text-gray-400">/hr</span>
                      </span>
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
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* ── Legend ─────────────────────────────────── */}
          <div className="absolute bottom-6 right-4 z-[500] bg-white/95 backdrop-blur rounded-xl border border-gray-200 shadow-lg px-3 py-2.5 text-xs space-y-1">
            <p className="font-semibold text-gray-700 mb-1.5">Legend</p>
            {(Object.entries(TAG_COLORS) as [WifiSpot['tag'], string][]).map(([tag, color]) => (
              <div key={tag} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-600">{tag}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
              <span className="w-3 h-3 rounded-full border-2 border-white shadow bg-gray-400" />
              <span className="text-gray-500">Offline</span>
            </div>
          </div>

          {/* ── Stats bar ─────────────────────────────── */}
          <div className="absolute top-4 right-4 z-[500] flex items-center gap-2">
            <div className="bg-white/95 backdrop-blur rounded-full border border-gray-200 shadow-md px-3.5 py-2 flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-gray-700">
                {spots.filter((s) => s.isActive).length}
              </span>
              <span className="text-gray-500">active spots</span>
            </div>
            <div className="bg-white/95 backdrop-blur rounded-full border border-gray-200 shadow-md px-3.5 py-2 flex items-center gap-2 text-xs">
              <Wifi size={12} className="text-uplink-blue" />
              <span className="font-semibold text-gray-700">{spots.length}</span>
              <span className="text-gray-500">total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
