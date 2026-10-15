import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Shield,
  Key,
  Calendar,
  LogOut,
  ShoppingBag,
  Package,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (fullName.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters.');
      return;
    }

    setIsUpdatingProfile(true);
    const success = await updateProfile({ full_name: fullName.trim() });
    setIsUpdatingProfile(false);

    if (success) {
      setProfileSuccess('Profile information updated successfully.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } else {
      setProfileError('Failed to update profile. Please try again.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPasswordError('New password must contain at least one letter and one number.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    const success = await changePassword({
      current_password: currentPassword,
      new_password: newPassword,
    });
    setIsChangingPassword(false);

    if (success) {
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } else {
      setPasswordError('Incorrect current password or invalid new password.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const userInitials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <PageContainer
      title="My Account"
      subtitle="Manage your profile settings, login credentials, and account preferences."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Account Card & Quick Links (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Identity Card */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              {userInitials || 'U'}
            </div>

            <h2 className="text-xl font-bold text-white font-display mb-1">
              {user.full_name}
            </h2>
            <p className="text-xs text-slate-400 mb-3">{user.email}</p>

            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isAdmin
                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                  : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
              }`}>
                {isAdmin ? <Shield className="w-3.5 h-3.5 text-purple-400" /> : <UserIcon className="w-3.5 h-3.5 text-indigo-400" />}
                {user.role}
              </span>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Customer since {formattedDate}</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <Link
              to="/orders"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 text-slate-300 hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold">My Orders</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/cart"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 text-slate-300 hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold">Shopping Cart</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/40 text-purple-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold">Admin Dashboard</span>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors text-sm font-semibold mt-2"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>

        {/* Right Column: Profile & Security Settings (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Profile Details Form */}
          <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
            <h3 className="text-lg font-bold text-white font-display mb-1 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-400" />
              <span>Personal Information</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Update your display name and contact preferences.
            </p>

            {profileSuccess && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Full Name"
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-500 text-sm cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Email address is locked as your primary account identifier.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={isUpdatingProfile}
                  disabled={isUpdatingProfile}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Security & Password Form */}
          <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
            <h3 className="text-lg font-bold text-white font-display mb-1 flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              <span>Change Password</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Ensure your account stays secure by using a strong password with letters and numbers.
            </p>

            {passwordSuccess && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 chars (letters + digits)"
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="secondary"
                  type="submit"
                  isLoading={isChangingPassword}
                  disabled={isChangingPassword}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </PageContainer>
  );
};
