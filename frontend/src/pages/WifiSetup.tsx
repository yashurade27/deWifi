import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useWeb3 } from '@/context/Web3Context';
import { apiFetch } from '@/lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Wifi,
  MapPin,
  IndianRupee,
  Clock,
  Users,
  Zap,
  Shield,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Building2,
  Home,
  Coffee,
  BookOpen,
  Briefcase,
  Wallet,
} from 'lucide-react';
import { motion } from 'framer-motion';

const TAGS = [
  { value: 'Home', label: 'Home', icon: Home },
  { value: 'Cafe', label: 'Cafe', icon: Coffee },
  { value: 'Office', label: 'Office', icon: Building2 },
  { value: 'Library', label: 'Library', icon: BookOpen },
  { value: 'CoWorking', label: 'Co-Working', icon: Briefcase },
];

const AMENITIES = [
  'AC', 'Parking', 'Power Outlets', 'Quiet Zone', 'Restroom', 
  'Food Available', 'Drinks Available', 'Seating', '24/7 Access'
];

const SECURITY_TYPES = ['WPA2', 'WPA3', 'WEP', 'Open'];

interface FormData {
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
  availableFrom: string;
  availableTo: string;
  ssid: string;
  wifiPassword: string;
  securityType: string;
  tag: string;
  amenities: string[];
  paymentSetup: {
    walletAddress: string;
  };
}

export default function WifiSetup() {
  const { user, token, isAuthenticated } = useAuth();
  const { connect: connectWallet, address: walletAddr, isConnecting: walletConnecting, walletAvailable } = useWeb3();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    lat: 18.5204,
    lng: 73.8567,
    address: '',
    city: '',
    state: '',
    pricePerHour: 30,
    speedMbps: 50,
    maxUsers: 5,
    availableFrom: '08:00',
    availableTo: '22:00',
    ssid: '',
    wifiPassword: '',
    securityType: 'WPA2',
    tag: 'Home',
    amenities: [],
    paymentSetup: {
      walletAddress: '',
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'owner') {
      navigate('/');
      return;
    }
    if (isEdit) {
      fetchSpot();
    }
  }, [isAuthenticated, user, navigate, isEdit, id]);

  const fetchSpot = async () => {
    try {
      const res = await apiFetch<{ spot: FormData }>(`/api/owner/spots/${id}`, { token: token! });
      setFormData({ ...formData, ...res.spot });
    } catch (err) {
      console.error('Failed to fetch spot:', err);
      navigate('/owner/dashboard');
    }
  };

  const updateField = (field: string, value: unknown) => {
    setFormData(prev => {
      if (field.startsWith('paymentSetup.')) {
        const key = field.replace('paymentSetup.', '');
        return {
          ...prev,
          paymentSetup: { ...prev.paymentSetup, [key]: value },
        };
      }
      return { ...prev, [field]: value };
    });
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
    }

    if (currentStep === 2) {
      if (!formData.ssid.trim()) newErrors.ssid = 'SSID is required';
      if (!formData.wifiPassword.trim() && formData.securityType !== 'Open') {
        newErrors.wifiPassword = 'Password is required';
      }
      if (formData.speedMbps <= 0) newErrors.speedMbps = 'Speed must be greater than 0';
    }

    if (currentStep === 3) {
      if (formData.pricePerHour <= 0) newErrors.pricePerHour = 'Price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      if (isEdit) {
        await apiFetch(`/api/owner/spots/${id}`, {
          method: 'PUT',
          body: formData,
          token: token!,
        });
      } else {
        await apiFetch('/api/owner/spots', {
          method: 'POST',
          body: formData,
          token: token!,
        });
      }
      navigate('/owner/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateField('lat', position.coords.latitude);
          updateField('lng', position.coords.longitude);
        },
        (error) => console.error('Geolocation error:', error)
      );
    }
  };

  const STEP_LABELS = ['Location', 'WiFi Config', 'Pricing', 'Payment'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/owner/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit WiFi Spot' : 'Add New WiFi Spot'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {isEdit ? 'Update your WiFi spot details' : 'List your WiFi and start earning ETH'}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    step > s
                      ? 'bg-[#66FF00] text-black'
                      : step === s
                      ? 'bg-[#0055FF] text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step > s ? '✓' : s}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block ${
                  step >= s ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
                }`}>{STEP_LABELS[s - 1]}</span>
              </div>
              {s < 4 && (
                <div className={`flex-1 h-0.5 mx-2 rounded transition-all ${
                  step > s ? 'bg-[#66FF00]' : 'bg-gray-200 dark:bg-gray-800'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6"
        >
          {/* Step 1: Basic Info & Location */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-blue-600" size={24} />
                <h2 className="text-lg font-semibold">Basic Information</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spot Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Cozy Cafe WiFi"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe your WiFi spot..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Location
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {TAGS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateField('tag', value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                        formData.tag === value
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Street address"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="City"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder="State"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Coordinates
                  </label>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
                  >
                    <MapPin size={16} />
                    Use Current Location
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Lat: {formData.lat.toFixed(4)}, Lng: {formData.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: WiFi Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Wifi className="text-blue-600" size={24} />
                <h2 className="text-lg font-semibold">WiFi Configuration</h2>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Your WiFi password will be encrypted and only revealed to users after successful payment.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WiFi Network Name (SSID) *
                </label>
                <input
                  type="text"
                  value={formData.ssid}
                  onChange={(e) => updateField('ssid', e.target.value)}
                  placeholder="Your WiFi network name"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.ssid ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.ssid && <p className="text-red-500 text-sm mt-1">{errors.ssid}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WiFi Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.wifiPassword}
                    onChange={(e) => updateField('wifiPassword', e.target.value)}
                    placeholder="Your WiFi password"
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.wifiPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.wifiPassword && <p className="text-red-500 text-sm mt-1">{errors.wifiPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {SECURITY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField('securityType', type)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        formData.securityType === type
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {type === 'Open' ? '🔓' : '🔒'} {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Zap size={16} className="inline mr-1" />
                    Speed (Mbps) *
                  </label>
                  <input
                    type="number"
                    value={formData.speedMbps}
                    onChange={(e) => updateField('speedMbps', parseInt(e.target.value) || 0)}
                    min="1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.speedMbps ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.speedMbps && <p className="text-red-500 text-sm mt-1">{errors.speedMbps}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Users size={16} className="inline mr-1" />
                    Max Simultaneous Users
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => updateField('maxUsers', parseInt(e.target.value) || 1)}
                    min="1"
                    max="50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock size={16} className="inline mr-1" />
                    Available From
                  </label>
                  <input
                    type="time"
                    value={formData.availableFrom}
                    onChange={(e) => updateField('availableFrom', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock size={16} className="inline mr-1" />
                    Available Until
                  </label>
                  <input
                    type="time"
                    value={formData.availableTo}
                    onChange={(e) => updateField('availableTo', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        formData.amenities.includes(amenity)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <IndianRupee className="text-blue-600" size={24} />
                <h2 className="text-lg font-semibold">Pricing Setup</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Per Hour (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={formData.pricePerHour}
                    onChange={(e) => updateField('pricePerHour', parseInt(e.target.value) || 0)}
                    min="1"
                    className={`w-full pl-8 pr-4 py-3 text-2xl font-bold border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.pricePerHour ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.pricePerHour && <p className="text-red-500 text-sm mt-1">{errors.pricePerHour}</p>}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3">Earnings Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">User pays per hour</span>
                    <span className="font-medium">₹{formData.pricePerHour}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Platform fee (2%)</span>
                    <span>- ₹{(formData.pricePerHour * 0.02).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex justify-between font-semibold text-green-700">
                    <span>Your earnings per hour</span>
                    <span>₹{(formData.pricePerHour * 0.98).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Suggested Pricing</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[20, 30, 50].map((price) => (
                    <button
                      key={price}
                      type="button"
                      onClick={() => updateField('pricePerHour', price)}
                      className={`p-3 rounded-lg border-2 text-center transition-colors ${
                        formData.pricePerHour === price
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl font-bold">₹{price}</span>
                      <span className="text-xs text-gray-500 block">/hour</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Payment Setup — Blockchain Wallet Only */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#0055FF]/10 rounded-xl flex items-center justify-center">
                  <Wallet className="text-[#0055FF]" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ethereum Wallet</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Where you'll receive ETH payments</p>
                </div>
              </div>

              <div className="bg-[#0055FF]/5 dark:bg-[#0055FF]/10 border border-[#0055FF]/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#0055FF] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Wallet size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0055FF] dark:text-blue-300 mb-1">Powered by Ethereum Smart Contracts</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Payments are handled entirely on-chain. When a user books your spot, funds are held in escrow and automatically released to your wallet after the session. You keep <strong className="text-gray-900 dark:text-white">98%</strong> of every booking.
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Wallet Address <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.paymentSetup.walletAddress || walletAddr || ''}
                    onChange={(e) => updateField('paymentSetup.walletAddress', e.target.value)}
                    placeholder="0x..."
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-[#0055FF] focus:border-[#0055FF] font-mono text-sm transition-all"
                  />
                  {walletAvailable && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!walletAddr) await connectWallet();
                        if (walletAddr) updateField('paymentSetup.walletAddress', walletAddr);
                      }}
                      disabled={walletConnecting}
                      className="px-4 py-3 bg-[#0055FF] text-white rounded-xl hover:bg-[#0044CC] transition-colors text-sm font-bold disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-md shadow-blue-500/25"
                    >
                      <Wallet size={16} />
                      {walletConnecting ? 'Connecting...' : walletAddr ? 'Use Connected' : 'Connect'}
                    </button>
                  )}
                </div>
                {walletAddr && !formData.paymentSetup.walletAddress && (
                  <p className="text-xs text-[#0055FF] dark:text-blue-400 mt-2 font-medium">
                    ✓ MetaMask connected: {walletAddr.slice(0, 6)}...{walletAddr.slice(-4)} — click "Use Connected"
                  </p>
                )}
                {formData.paymentSetup.walletAddress && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                    ✓ Wallet address saved
                  </p>
                )}
              </div>

              <div className="bg-[#66FF00]/10 dark:bg-[#66FF00]/5 border border-[#66FF00]/30 rounded-xl p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-bold text-gray-900 dark:text-white">How it works:</span> Payments are sent directly to your wallet via smart contracts — no intermediary, no withdrawal wait times, no KYC required.
                </p>
              </div>

              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-red-700 dark:text-red-400 text-sm">{errors.submit}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-[#0055FF] text-white rounded-xl hover:bg-[#0044CC] transition-colors font-bold shadow-md shadow-blue-500/25"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-[#66FF00] text-black rounded-xl hover:bg-[#55ee00] transition-colors font-bold disabled:opacity-50 shadow-md shadow-green-400/25"
              >
                <Save size={18} />
                {loading ? 'Saving...' : isEdit ? 'Update Spot' : 'Create WiFi Spot'}
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
