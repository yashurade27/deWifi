import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { findDummySpot } from '@/data/dummySpots';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Wifi,
  MapPin,
  Zap,
  Clock,
  Users,
  Star,
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface WifiSpot {
  _id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  pricePerHour: number; // in ETH
  speedMbps: number;
  maxUsers: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  amenities: string[];
  availableFrom: string;
  availableTo: string;
  securityType: string;
  tag: string;
  ownerName: string;
  monitoring: {
    isOnline: boolean;
    uptimePercent: number;
  };
}

interface Review {
  _id: string;
  user: {
    name: string;
    avatar?: string;
  };
  overallRating: number;
  speedRating: number;
  reliabilityRating: number;
  valueRating: number;
  comment: string;
  ownerResponse?: string;
  ownerRespondedAt?: string;
  createdAt: string;
  isVerified: boolean;
}

interface ReviewStats {
  averageRating: number;
  averageSpeed: number;
  averageReliability: number;
  averageValue: number;
  totalReviews: number;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

export default function SpotDetails() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [spot, setSpot] = useState<WifiSpot | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSpotDetails();
  }, [id]);

  const fetchSpotDetails = async () => {
    try {
      // Fetch spot details
      const spotRes = await apiFetch<{ spot: WifiSpot }>(`/api/spots/${id}`);
      setSpot(spotRes.spot);

      // Fetch reviews
      const reviewsRes = await apiFetch<{ reviews: Review[]; stats: ReviewStats }>(
        `/api/reviews/spot/${id}`
      );
      setReviews(reviewsRes.reviews);
      setReviewStats(reviewsRes.stats);
    } catch (err: unknown) {
      // API failed — try dummy data as fallback
      const dummy = findDummySpot(id!);
      if (dummy) {
        setSpot(dummy as unknown as WifiSpot);
      } else {
        const message = err instanceof Error ? err.message : 'Failed to load spot details';
        setError(message);
      }
    } finally {
      setLoading(false);
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

  if (error || !spot) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Spot Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This WiFi spot does not exist.'}</p>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Spots
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
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

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                    {spot.tag}
                  </span>
                  {spot.monitoring.isOnline ? (
                    <span className="flex items-center gap-1 text-xs">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-300">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      Offline
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold mb-2">{spot.name}</h1>
                <p className="flex items-center gap-1 text-sm opacity-90">
                  <MapPin size={14} />
                  {spot.address}, {spot.city}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{spot.pricePerHour} ETH</p>
                <p className="text-sm opacity-75">per hour</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 divide-x divide-gray-200 border-b border-gray-200">
            <div className="p-4 text-center">
              <Zap className="mx-auto text-blue-500 mb-1" size={20} />
              <p className="text-lg font-bold text-gray-900">{spot.speedMbps}</p>
              <p className="text-xs text-gray-500">Mbps</p>
            </div>
            <div className="p-4 text-center">
              <Users className="mx-auto text-green-500 mb-1" size={20} />
              <p className="text-lg font-bold text-gray-900">{spot.maxUsers}</p>
              <p className="text-xs text-gray-500">Max Users</p>
            </div>
            <div className="p-4 text-center">
              <Star className="mx-auto text-yellow-500 mb-1" size={20} />
              <p className="text-lg font-bold text-gray-900">{spot.rating.toFixed(1)}</p>
              <p className="text-xs text-gray-500">{spot.reviewCount} reviews</p>
            </div>
            <div className="p-4 text-center">
              <Shield className="mx-auto text-purple-500 mb-1" size={20} />
              <p className="text-lg font-bold text-gray-900">{spot.monitoring.uptimePercent}%</p>
              <p className="text-xs text-gray-500">Uptime</p>
            </div>
          </div>

          {/* Description & Details */}
          <div className="p-6">
            {spot.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-600">{spot.description}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Amenities */}
              {spot.amenities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {spot.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={18} />
                  <span>
                    {spot.availableFrom} - {spot.availableTo}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Security: {spot.securityType}
                </p>
              </div>
            </div>

            {/* Owner Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {spot.ownerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Hosted by {spot.ownerName}</p>
                  <p className="text-sm text-gray-500">Verified Host</p>
                </div>
              </div>
            </div>
          </div>

          {/* Book CTA */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <Link
              to={isAuthenticated ? `/book/${spot._id}` : `/login`}
              className="w-full py-4 bg-blue-600 text-white text-center rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Wifi size={20} />
              Book Now - {spot.pricePerHour} ETH/hour
              <ChevronRight size={20} />
            </Link>
          </div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="text-yellow-500" size={24} />
              Reviews
            </h2>

            {reviewStats && reviewStats.totalReviews > 0 && (
              <div className="mt-4 grid md:grid-cols-2 gap-6">
                {/* Overall Rating */}
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold text-gray-900">
                    {reviewStats.averageRating.toFixed(1)}
                  </div>
                  <div>
                    <StarRating rating={Math.round(reviewStats.averageRating)} size={20} />
                    <p className="text-sm text-gray-500 mt-1">
                      Based on {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-20 text-gray-600">Speed</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(reviewStats.averageSpeed / 5) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-gray-700">{reviewStats.averageSpeed.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-20 text-gray-600">Reliability</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(reviewStats.averageReliability / 5) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-gray-700">{reviewStats.averageReliability.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-20 text-gray-600">Value</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(reviewStats.averageValue / 5) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-gray-700">{reviewStats.averageValue.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="divide-y divide-gray-200">
            {reviews.length === 0 ? (
              <div className="p-8 text-center">
                <Star className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                <p className="text-gray-500">Be the first to review this WiFi spot!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{review.user.name}</span>
                          {review.isVerified && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle size={12} />
                              Verified
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={review.overallRating} size={14} />
                        <span className="text-sm text-gray-600">{review.overallRating}/5</span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}

                      {/* Owner Response */}
                      {review.ownerResponse && (
                        <div className="mt-4 pl-4 border-l-2 border-blue-200 bg-blue-50 rounded-r-lg p-3">
                          <p className="text-sm font-medium text-blue-900 mb-1">Host Response</p>
                          <p className="text-sm text-blue-800">{review.ownerResponse}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
