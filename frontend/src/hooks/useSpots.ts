import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { dummyApiSpots } from '@/data/dummySpots';

// Shape returned by the API (mirrors the Mongoose document minus ssid)
export interface ApiSpot {
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
  tag: 'Home' | 'Cafe' | 'Office' | 'Library' | 'CoWorking';
  // Monitoring data
  monitoring?: {
    isOnline: boolean;
    uptimePercent: number;
    lastPingAt: string | null;
    latencyMs?: number | null;  // from last ping entry
  };
  createdAt: string;
  updatedAt: string;
}

interface SpotsResponse {
  success: boolean;
  total: number;
  page: number;
  pages: number;
  spots: ApiSpot[];
}

interface UseSpotsReturn {
  spots: ApiSpot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSpots(): UseSpotsReturn {
  const [spots, setSpots]   = useState<ApiSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const fetchSpots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SpotsResponse>('/api/spots?limit=100');
      // If the API returned spots, use them; otherwise fall back to dummy data
      if (data.spots && data.spots.length > 0) {
        setSpots(data.spots);
      } else {
        setSpots(dummyApiSpots as unknown as ApiSpot[]);
      }
    } catch (err) {
      // API unreachable or errored — fall back to dummy data so the UI still works
      console.warn('API fetch failed, using dummy spots:', err);
      setSpots(dummyApiSpots as unknown as ApiSpot[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSpots(); }, [fetchSpots]);

  return { spots, loading, error, refetch: fetchSpots };
}
