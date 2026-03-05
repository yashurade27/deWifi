import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Camera,
  Upload,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const { user, token, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [photoUrlInput, setPhotoUrlInput] = useState<string>('');
  const [showPhotoUrlInput, setShowPhotoUrlInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      }));
      setProfilePhoto(user.profilePhoto || '');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 2MB' });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
      setMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUrlSubmit = () => {
    if (photoUrlInput.trim()) {
      setProfilePhoto(photoUrlInput.trim());
      setPhotoUrlInput('');
      setShowPhotoUrlInput(false);
      setMessage(null);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto('');
    setMessage(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        profilePhoto: profilePhoto,
      };

      // Only include email if it changed
      if (formData.email !== user?.email) {
        updateData.email = formData.email;
      }

      const response = await apiFetch<{ message: string; user: any }>('/api/auth/profile', {
        method: 'PUT',
        token: token!,
        body: updateData,
      });

      updateUser(response.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    if (!formData.currentPassword) {
      setMessage({ type: 'error', text: 'Please enter your current password' });
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      await apiFetch('/api/auth/change-password', {
        method: 'PUT',
        token: token!,
        body: {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
      });

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setIsEditingPassword(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">
              Profile Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account information and security
            </p>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}

          {/* Profile Photo Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#0055FF] dark:text-[#66FF00]" />
              Profile Photo
            </h2>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Photo Preview */}
              <div className="relative">
                {profilePhoto ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#0055FF] dark:border-[#66FF00] shadow-lg">
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-[#0055FF] to-[#66FF00] flex items-center justify-center text-3xl font-bold text-white">
                            ${getInitials(user?.name || '')}
                          </div>
                        `;
                      }}
                    />
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute top-0 right-0 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0055FF] to-[#66FF00] flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-gray-200 dark:border-gray-700">
                    {getInitials(user?.name || '')}
                  </div>
                )}
              </div>

              {/* Upload Options */}
              <div className="flex-1 space-y-3 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full border-[#0055FF] dark:border-[#66FF00] text-[#0055FF] dark:text-[#66FF00] hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </Button>

                {!showPhotoUrlInput ? (
                  <Button
                    type="button"
                    onClick={() => setShowPhotoUrlInput(true)}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Add Photo URL
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      placeholder="Enter image URL"
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#66FF00] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handlePhotoUrlSubmit}
                      className="bg-[#0055FF] dark:bg-[#66FF00] text-white dark:text-black hover:bg-[#0044CC] dark:hover:bg-green-400"
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowPhotoUrlInput(false);
                        setPhotoUrlInput('');
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Recommended: Square image, max 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-[#0055FF] dark:text-[#66FF00]" />
              Personal Information
            </h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#66FF00] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#66FF00] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#66FF00] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0055FF] dark:bg-[#66FF00] text-white dark:text-black hover:bg-[#0044CC] dark:hover:bg-green-400 rounded-xl py-6 text-base font-bold shadow-lg shadow-blue-500/30 dark:shadow-green-500/30 hover:shadow-blue-500/50 dark:hover:shadow-green-500/50 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>

          {/* Password Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#0055FF] dark:text-[#66FF00]" />
                Password & Security
              </h2>
              {!isEditingPassword && (
                <Button
                  onClick={() => setIsEditingPassword(true)}
                  variant="outline"
                  className="border-[#0055FF] dark:border-[#66FF00] text-[#0055FF] dark:text-[#66FF00] hover:bg-blue-50 dark:hover:bg-gray-700"
                >
                  Change Password
                </Button>
              )}
            </div>

            {isEditingPassword ? (
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="w-full pl-11 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#66FF00] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full pl-11 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#66FF00] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Must be at least 8 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-11 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#66FF00] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsEditingPassword(false);
                      setFormData(prev => ({
                        ...prev,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      }));
                      setMessage(null);
                    }}
                    variant="outline"
                    className="flex-1 py-6 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#0055FF] dark:bg-[#66FF00] text-white dark:text-black hover:bg-[#0044CC] dark:hover:bg-green-400 rounded-xl py-6 font-bold shadow-lg shadow-blue-500/30 dark:shadow-green-500/30 hover:shadow-blue-500/50 dark:hover:shadow-green-500/50 transition-all duration-300"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Keep your account secure by using a strong password and changing it regularly.
              </p>
            )}
          </div>

          {/* Account Role Badge */}
          <div className="mt-6 text-center">
            <span className="inline-block px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-[#0055FF] dark:text-[#66FF00] rounded-full text-sm font-bold capitalize">
              {user.role} Account
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
