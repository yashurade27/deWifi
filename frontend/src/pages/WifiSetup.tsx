import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
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
  CreditCard,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Building2,
  Home,
  Coffee,
  BookOpen,
  Briefcase,
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
    upiId: string;
    bankAccountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
}

export default function WifiSetup() {
  const { user, token, isAuthenticated } = useAuth();
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
      upiId: '',
      bankAccountNumber: '',
      ifscCode: '',
      accountHolderName: '',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/owner/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit WiFi Spot' : 'Setup New WiFi Spot'}
            </h1>
            <p className="text-gray-600">
              {isEdit ? 'Update your WiFi spot details' : 'Share your WiFi and start earning'}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-16 sm:w-24 h-1 mx-2 rounded ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
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

          {/* Step 4: Payment Setup */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="text-blue-600" size={24} />
                <h2 className="text-lg font-semibold">Payment Setup</h2>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  Set up your payment details to receive earnings directly to your bank account. 
                  You'll receive 98% of each booking amount.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UPI ID (Preferred)
                </label>
                <input
                  type="text"
                  value={formData.paymentSetup.upiId}
                  onChange={(e) => updateField('paymentSetup.upiId', e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or Bank Account</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.paymentSetup.accountHolderName}
                  onChange={(e) => updateField('paymentSetup.accountHolderName', e.target.value)}
                  placeholder="As per bank records"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.paymentSetup.bankAccountNumber}
                    onChange={(e) => updateField('paymentSetup.bankAccountNumber', e.target.value)}
                    placeholder="Account number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={formData.paymentSetup.ifscCode}
                    onChange={(e) => updateField('paymentSetup.ifscCode', e.target.value.toUpperCase())}
                    placeholder="e.g., SBIN0001234"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{errors.submit}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
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
