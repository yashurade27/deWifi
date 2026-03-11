export interface WifiSpot {
  id: string;
  name: string;
  ownerName: string;
  ownerAvatar: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  pricePerHour: number;       // in ETH
  speedMbps: number;
  maxUsers: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  amenities: string[];
  availableFrom: string;      // "08:00"
  availableTo: string;        // "22:00"
  images: string[];
  ssid: string;
  tag: "Home" | "Cafe" | "Office" | "Library" | "CoWorking";
}

// ─── ApiSpot-compatible shape for fallback usage ──────────────────────────────
// This converts a local WifiSpot into the shape the frontend expects from the API
// so that Explore, SpotDetails, and BookWifi all work without a running backend.
export interface DummyApiSpot {
  _id: string;
  owner: string;
  ownerName: string;
  ownerAvatar: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  pricePerHour: number;
  speedMbps: number;
  maxUsers: number;
  currentUsers: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isApproved: boolean;
  amenities: string[];
  availableFrom: string;
  availableTo: string;
  images: string[];
  tag: "Home" | "Cafe" | "Office" | "Library" | "CoWorking";
  monitoring: {
    isOnline: boolean;
    uptimePercent: number;
    lastPingAt: string | null;
    latencyMs: number | null;
  };
  createdAt: string;
  updatedAt: string;
  blockchainSpotId: number;
}

/** Convert a dummy WifiSpot into the ApiSpot-compatible shape */
function toApiSpot(spot: WifiSpot, index: number): DummyApiSpot {
  const now = new Date().toISOString();
  return {
    _id: spot.id,
    owner: `owner-${spot.ownerAvatar.toLowerCase()}`,
    ownerName: spot.ownerName,
    ownerAvatar: spot.ownerAvatar,
    name: spot.name,
    description: spot.description,
    lat: spot.lat,
    lng: spot.lng,
    address: spot.address,
    city: spot.city,
    state: spot.state,
    pricePerHour: spot.pricePerHour,
    speedMbps: spot.speedMbps,
    maxUsers: spot.maxUsers,
    currentUsers: 0,
    rating: spot.rating,
    reviewCount: spot.reviewCount,
    isActive: spot.isActive,
    isApproved: true,
    amenities: spot.amenities,
    availableFrom: spot.availableFrom,
    availableTo: spot.availableTo,
    images: spot.images,
    tag: spot.tag,
    monitoring: {
      isOnline: spot.isActive,
      uptimePercent: spot.isActive ? 99 : 0,
      lastPingAt: spot.isActive ? now : null,
      latencyMs: spot.isActive ? Math.floor(Math.random() * 30) + 5 : null,
    },
    createdAt: now,
    updatedAt: now,
    blockchainSpotId: index % 5,   // matches seed logic
  };
}

export const dummySpots: WifiSpot[] = [
  // ── Pune ──────────────────────────────────────────────
  {
    id: "spot-1",
    name: "Yash's Home Fibre",
    ownerName: "Yash Urade",
    ownerAvatar: "YU",
    description: "Blazing-fast JioFiber connection in a quiet residential flat. Perfect for remote work or study sessions.",
    lat: 18.5204,
    lng: 73.8567,
    address: "12, Koregaon Park Lane 5, Pune",
    city: "Pune",
    state: "Maharashtra",
    pricePerHour: 0.002,
    speedMbps: 200,
    maxUsers: 3,
    rating: 4.8,
    reviewCount: 24,
    isActive: true,
    amenities: ["AC", "Parking", "Power Outlet", "Tea/Coffee"],
    availableFrom: "09:00",
    availableTo: "21:00",
    images: ["https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=600"],
    ssid: "Yash_Fibre_5G",
    tag: "Home",
  },
  {
    id: "spot-2",
    name: "Samiksha's Cafe Corner",
    ownerName: "Samiksha Musale",
    ownerAvatar: "SM",
    description: "Cozy corner café with unlimited high-speed WiFi, great coffee and a productive vibe.",
    lat: 18.5286,
    lng: 73.8476,
    address: "FC Road, Deccan Gymkhana, Pune",
    city: "Pune",
    state: "Maharashtra",
    pricePerHour: 0.003,
    speedMbps: 100,
    maxUsers: 8,
    rating: 4.5,
    reviewCount: 61,
    isActive: true,
    amenities: ["AC", "Coffee", "Snacks", "Power Outlet", "Washroom"],
    availableFrom: "08:00",
    availableTo: "22:00",
    images: ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600"],
    ssid: "CafeCorner_Guest",
    tag: "Cafe",
  },
  {
    id: "spot-3",
    name: "TechHub CoWork Aundh",
    ownerName: "Vaidehi Narkhede",
    ownerAvatar: "VN",
    description: "Dedicated co-working desk with dedicated 300 Mbps connection, standing desks available.",
    lat: 18.5583,
    lng: 73.8077,
    address: "D-Wing, Rahul Tower, Aundh, Pune",
    city: "Pune",
    state: "Maharashtra",
    pricePerHour: 0.005,
    speedMbps: 300,
    maxUsers: 12,
    rating: 4.9,
    reviewCount: 112,
    isActive: true,
    amenities: ["AC", "Standing Desk", "Locker", "Printer", "Power Outlet", "Coffee"],
    availableFrom: "07:00",
    availableTo: "23:00",
    images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=600"],
    ssid: "TechHub_Pro",
    tag: "CoWorking",
  },
  {
    id: "spot-4",
    name: "Spandan's Study Den",
    ownerName: "Spandan Mali",
    ownerAvatar: "SP",
    description: "Silent study room in a residential building near COEP. Ideal for students who need no distractions.",
    lat: 18.5308,
    lng: 73.8473,
    address: "Near COEP, Shivajinagar, Pune",
    city: "Pune",
    state: "Maharashtra",
    pricePerHour: 0.001,
    speedMbps: 50,
    maxUsers: 2,
    rating: 4.3,
    reviewCount: 18,
    isActive: true,
    amenities: ["Fan", "Power Outlet", "Whiteboard"],
    availableFrom: "06:00",
    availableTo: "23:00",
    images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"],
    ssid: "SP_StudyZone",
    tag: "Home",
  },
  {
    id: "spot-5",
    name: "Hinjewadi IT Park Lounge",
    ownerName: "Rohit Deshpande",
    ownerAvatar: "RD",
    description: "Spacious lounge inside Phase 1 IT Park. Great for freelancers working near the tech corridor.",
    lat: 18.5912,
    lng: 73.7389,
    address: "Phase 1, Hinjewadi Rajiv Gandhi Infotech Park, Pune",
    city: "Pune",
    state: "Maharashtra",
    pricePerHour: 0.004,
    speedMbps: 250,
    maxUsers: 20,
    rating: 4.6,
    reviewCount: 87,
    isActive: true,
    amenities: ["AC", "Standing Desk", "Power Outlet", "Cafeteria Access"],
    availableFrom: "08:00",
    availableTo: "20:00",
    images: ["https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600"],
    ssid: "ITLounge_WiFi",
    tag: "Office",
  },
  {
    id: "spot-6",
    name: "Viman Nagar Bookworm Café",
    ownerName: "Priya Joshi",
    ownerAvatar: "PJ",
    description: "Reading café with fast WiFi, green tea and the smell of fresh books.",
    lat: 18.5679,
    lng: 73.9143,
    address: "North Main Road, Viman Nagar, Pune",
    city: "Pune",
    state: "Maharashtra",
    pricePerHour: 0.002,
    speedMbps: 80,
    maxUsers: 6,
    rating: 4.7,
    reviewCount: 45,
    isActive: false,
    amenities: ["AC", "Books", "Tea", "Power Outlet"],
    availableFrom: "10:00",
    availableTo: "20:00",
    images: ["https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600"],
    ssid: "Bookworm_Guest",
    tag: "Cafe",
  },

  // ── Mumbai ────────────────────────────────────────────
  {
    id: "spot-7",
    name: "BKC Business Lounge",
    ownerName: "Arjun Mehta",
    ownerAvatar: "AM",
    description: "Premium lounge in the heart of Bandra Kurla Complex. Gigabit fibre, printer included.",
    lat: 19.0693,
    lng: 72.8680,
    address: "G Block, BKC, Bandra East, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    pricePerHour: 0.007,
    speedMbps: 500,
    maxUsers: 15,
    rating: 4.9,
    reviewCount: 203,
    isActive: true,
    amenities: ["AC", "Printer", "Scanner", "Coffee", "Power Outlet", "Locker"],
    availableFrom: "07:00",
    availableTo: "22:00",
    images: ["https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600"],
    ssid: "BKC_Premium_5G",
    tag: "CoWorking",
  },
  {
    id: "spot-8",
    name: "Andheri Home Office",
    ownerName: "Neha Shah",
    ownerAvatar: "NS",
    description: "Spare bedroom converted into a private office. Dedicated bandwidth, very private.",
    lat: 19.1197,
    lng: 72.8468,
    address: "Lokhandwala Complex, Andheri West, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    pricePerHour: 0.003,
    speedMbps: 150,
    maxUsers: 2,
    rating: 4.4,
    reviewCount: 31,
    isActive: true,
    amenities: ["AC", "Power Outlet", "Snacks", "Dedicated Desk"],
    availableFrom: "09:00",
    availableTo: "21:00",
    images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600"],
    ssid: "Neha_Office_WiFi",
    tag: "Home",
  },
  {
    id: "spot-9",
    name: "Carter Road Beachside WiFi",
    ownerName: "Kunal Kapoor",
    ownerAvatar: "KK",
    description: "Work while watching the sea! Outdoor setup near Carter Road promenade with weatherproof router.",
    lat: 19.0568,
    lng: 72.8188,
    address: "Carter Road, Bandra West, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    pricePerHour: 0.003,
    speedMbps: 75,
    maxUsers: 5,
    rating: 4.2,
    reviewCount: 56,
    isActive: true,
    amenities: ["Outdoor Seating", "Sea View", "Snacks Nearby"],
    availableFrom: "08:00",
    availableTo: "20:00",
    images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600"],
    ssid: "CarterRoad_Open",
    tag: "Office",
  },

  // ── Bengaluru ─────────────────────────────────────────
  {
    id: "spot-10",
    name: "Koramangala Startup Nest",
    ownerName: "Aditya Rao",
    ownerAvatar: "AR",
    description: "Startup-ready desk in Koramangala 5th Block. Hot-desking community, great networking.",
    lat: 12.9352,
    lng: 77.6245,
    address: "5th Block, Koramangala, Bengaluru",
    city: "Bengaluru",
    state: "Karnataka",
    pricePerHour: 0.005,
    speedMbps: 400,
    maxUsers: 25,
    rating: 4.8,
    reviewCount: 167,
    isActive: true,
    amenities: ["AC", "Coffee", "Meeting Rooms", "Power Outlet", "Printer"],
    availableFrom: "07:00",
    availableTo: "24:00",
    images: ["https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600"],
    ssid: "StartupNest_Koram",
    tag: "CoWorking",
  },
  {
    id: "spot-11",
    name: "Indiranagar Library WiFi",
    ownerName: "Deepa Krishnamurthy",
    ownerAvatar: "DK",
    description: "Quiet reading library with complimentary WiFi for members. 0.005 ETH/hr non-member access.",
    lat: 12.9784,
    lng: 77.6408,
    address: "100 Feet Road, Indiranagar, Bengaluru",
    city: "Bengaluru",
    state: "Karnataka",
    pricePerHour: 0.005,
    speedMbps: 100,
    maxUsers: 10,
    rating: 4.6,
    reviewCount: 89,
    isActive: true,
    amenities: ["AC", "Silent Zone", "Power Outlet", "Books"],
    availableFrom: "09:00",
    availableTo: "21:00",
    images: ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600"],
    ssid: "IndiraLib_WiFi",
    tag: "Library",
  },

  // ── Hyderabad ─────────────────────────────────────────
  {
    id: "spot-12",
    name: "HITEC City Rooftop Office",
    ownerName: "Sravani Reddy",
    ownerAvatar: "SR",
    description: "Rooftop terrace with panoramic city views and a dedicated leased line. Executive experience.",
    lat: 17.4435,
    lng: 78.3772,
    address: "Cyber Towers, HITEC City, Hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    pricePerHour: 0.006,
    speedMbps: 350,
    maxUsers: 8,
    rating: 4.7,
    reviewCount: 74,
    isActive: true,
    amenities: ["AC", "Rooftop View", "Coffee", "Power Outlet", "Meeting Room"],
    availableFrom: "08:00",
    availableTo: "22:00",
    images: ["https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600"],
    ssid: "HITEC_Roof_5G",
    tag: "Office",
  },

  // ── Delhi ────────────────────────────────────────────
  {
    id: "spot-13",
    name: "Connaught Place Café WiFi",
    ownerName: "Rajan Khanna",
    ownerAvatar: "RK",
    description: "Heritage café at CP with strong WiFi. Great place to work between meetings in central Delhi.",
    lat: 28.6328,
    lng: 77.2194,
    address: "Block A, Connaught Place, New Delhi",
    city: "New Delhi",
    state: "Delhi",
    pricePerHour: 0.003,
    speedMbps: 120,
    maxUsers: 10,
    rating: 4.3,
    reviewCount: 98,
    isActive: true,
    amenities: ["AC", "Coffee", "Snacks", "Power Outlet"],
    availableFrom: "09:00",
    availableTo: "23:00",
    images: ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600"],
    ssid: "CP_CafeWiFi",
    tag: "Cafe",
  },
];

// ── Derived exports (placed AFTER dummySpots so the array is defined) ─────────

/** All dummy spots converted to ApiSpot shape — ready for Explore, Book, Details */
export const dummyApiSpots: DummyApiSpot[] = dummySpots.map((s, i) => toApiSpot(s, i));

/** Find a single dummy spot by ID (for SpotDetails / BookWifi fallback) */
export function findDummySpot(id: string): DummyApiSpot | undefined {
  return dummyApiSpots.find((s) => s._id === id);
}
