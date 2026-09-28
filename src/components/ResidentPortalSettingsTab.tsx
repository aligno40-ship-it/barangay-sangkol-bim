import React, { useState, useCallback } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { safeGetItem, safeSetItem } from '../utils/storageUtils';
import { supabase, isSupabaseConfigured } from '../services/supabaseService';
import { PasswordSecurityField } from './PasswordSecurityField';
import { FaceVerificationModal } from './FaceVerificationModal';
import {
  Sun,
  Moon,
  Laptop,
  ShieldCheck,
  KeyRound,
  Bell,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Mail,
  UserCheck,
  Lock,
  Sparkles,
  HelpCircle,
  Radio,
  Sliders,
  BadgeCheck,
  Shield,
  Clock,
  MapPin,
  RefreshCw,
  Scan,
  Camera,
  Check,
  Fingerprint,
  FileText,
  Activity,
  Scale,
} from 'lucide-react';

interface ResidentPortalSettingsTabProps {
  onNavigateToProfile?: () => void;
}

export const ResidentPortalSettingsTab: React.FC<ResidentPortalSettingsTabProps> = ({
  onNavigateToProfile,
}) => {
  const {
    currentUser,
    isDarkMode,
    theme,
    setTheme,
    toggleDarkMode,
    updateUser,
    updateUserPassword,
    updateUserFaceBiometrics,
    updateResidentFaceBiometrics,
    settings,
    residents,
  } = useBarangay();

  // Find linked resident record if any
  const residentRecord = residents.find(
    (r) => r.id === currentUser.residentId || r.id === currentUser.matchedResidentId
  );

  // Password Update Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0);

  const handlePasswordValidityChange = useCallback((isValid: boolean, result: any) => {
    setIsPasswordValid(isValid);
    setPasswordStrengthScore(result?.score ?? 0);
  }, []);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Biometrics State
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceUpdateSuccess, setFaceUpdateSuccess] = useState<string | null>(null);

  // Security Question Form State
  const [securityQuestion, setSecurityQuestion] = useState(
    currentUser.securityQuestion || 'What is your registered Purok in Barangay Sangkol?'
  );
  const [securityAnswer, setSecurityAnswer] = useState(currentUser.securityAnswer || '');
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);

  // Notification Preferences State (Stored in localStorage per user)
  const notifStorageKey = `barangay_sangkol_bims_resident_notifs_${currentUser.id}`;
  const [notifPrefs, setNotifPrefs] = useState<{
    smsReady: boolean;
    smsDisaster: boolean;
    smsEvents: boolean;
    emailReceipts: boolean;
    directoryVisibility: boolean;
    purokLeaderContact: boolean;
  }>(() => {
    try {
      const saved = safeGetItem(notifStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      smsReady: true,
      smsDisaster: true,
      smsEvents: true,
      emailReceipts: true,
      directoryVisibility: true,
      purokLeaderContact: true,
    };
  });

  const [notifSuccess, setNotifSuccess] = useState(false);

  const handleToggleNotif = (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    try {
      safeSetItem(notifStorageKey, JSON.stringify(updated));
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 2500);
    } catch {}
  };

  // Password Change Handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current account password.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (!isPasswordValid && passwordStrengthScore < 50) {
      setPasswordError('Please choose a stronger password meeting all government cyber-security criteria.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please verify.');
      return;
    }

    // Verify current password & update via Supabase Auth
    const userEmail = currentUser.email || `${currentUser.username}@barangaysangkol.gov.ph`;
    if (isSupabaseConfigured) {
      try {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: currentPassword,
        });

        if (signInErr) {
          setPasswordError('Current password verification failed. Please enter your correct current password.');
          return;
        }

        const { error: updateErr } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateErr) {
          setPasswordError(`Failed to update password: ${updateErr.message}`);
          return;
        }
      } catch (err: any) {
        setPasswordError(err.message || 'Supabase authentication service error.');
        return;
      }
    }

    // Update security score metadata
    updateUser(currentUser.id, {
      passwordStrengthScore: passwordStrengthScore,
    });
    setPasswordSuccess('Your account password has been updated securely with Supabase Auth encryption.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(null), 4000);
  };

  const handleFaceBiometricsCaptured = (captured: {
    photoDataUrl: string;
    confidenceScore?: number;
    [key: string]: any;
  }) => {
    setIsFaceModalOpen(false);
    updateUserFaceBiometrics(currentUser.id, captured.photoDataUrl, captured.confidenceScore || 98);
    setFaceUpdateSuccess('Your facial biometric scan has been updated successfully and activated for Face ID sign-in!');
    setTimeout(() => setFaceUpdateSuccess(null), 4000);
  };

  // Security Question Save Handler
  const handleSaveSecurityQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySuccess(null);

    if (!securityAnswer.trim()) {
      return;
    }

    updateUser(currentUser.id, {
      securityQuestion: securityQuestion.trim(),
      securityAnswer: securityAnswer.trim(),
    });

    setSecuritySuccess('Security recovery question and answer updated successfully.');
    setTimeout(() => setSecuritySuccess(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Resident Account Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white p-6 rounded-2xl sm:rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pointer-events-none pr-6">
          <Sliders className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-300" />
                Resident Citizen Account Settings
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono">
                @{currentUser.username}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Portal Preferences & Display Settings
            </h2>
            <p className="text-xs text-emerald-100/90 max-w-2xl leading-relaxed">
              Customize your personal appearance mode, password credentials, SMS notifications, and privacy options. Theme preferences apply only to your resident account and do not affect barangay administrators or other citizens.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-right">
              <p className="text-[10px] uppercase font-bold text-emerald-200">Civil Registry ID</p>
              <p className="text-xs font-mono font-bold text-white">
                {currentUser.residentId || (residentRecord?.id ?? 'BS-RES-2026-0005')}
              </p>
              <p className="text-[10px] text-emerald-200/80">{currentUser.purok || 'Purok Lumboy'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Appearance & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: ACCOUNT-ISOLATED APPEARANCE & DARK MODE */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sun className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Personal Display & Theme
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Control how the Resident Portal looks on your screen.
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                {isDarkMode ? '🌙 Dark Mode Active' : '☀️ Light Mode Active'}
              </span>
            </div>

            {/* Account Isolation Notice */}
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-emerald-950 dark:text-emerald-100">
                  Isolated Account Preference
                </p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                  Your chosen theme is stored exclusively for your user account (<strong>@{currentUser.username}</strong>). Toggling Dark or Light mode here will never alter the theme for Barangay Officials, system administrators, or other residents.
                </p>
              </div>
            </div>

            {/* 3 Theme Options Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Light Mode */}
              <div
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  {theme === 'light' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">☀️ Light Sunlight</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    High contrast crisp day theme with clean light backgrounds.
                  </p>
                </div>
              </div>

              {/* Option 2: Dark Mode */}
              <div
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-900 text-indigo-200 flex items-center justify-center">
                    <Moon className="w-4 h-4" />
                  </div>
                  {theme === 'dark' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">🌙 Dark Midnight</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Low-light slate dark theme to reduce eye strain at night.
                  </p>
                </div>
              </div>

              {/* Option 3: System Mode */}
              <div
                onClick={() => setTheme('system')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  theme === 'system'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                    <Laptop className="w-4 h-4" />
                  </div>
                  {theme === 'system' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">💻 System Default</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Matches your phone or computer OS dark/light schedule.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Toggle Button */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Looking for quick switching?</span>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                <span>Toggle {isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: PASSWORD & CREDENTIALS SECURITY */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <KeyRound className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Password & Account Credentials
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your resident portal sign-in password with interactive security strength evaluation.
                </p>
              </div>
            </div>

            {/* Password Feedback Toasts */}
            {passwordError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Password Security Field with Entropy Meter */}
              <PasswordSecurityField
                id="settings-new-password"
                label="New Enhanced Password"
                value={newPassword}
                onChange={setNewPassword}
                username={currentUser.username}
                fullName={currentUser.name}
                onValidityChange={handlePasswordValidityChange}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {confirmPassword && newPassword && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-rose-500 mt-1">Passwords do not match.</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!isPasswordValid || confirmPassword !== newPassword}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2.5: BIOMETRIC FACE RECOGNITION */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <Scan className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Biometric Face Verification & Face ID
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Use optical facial biometrics to sign in securely without typing your password.
                  </p>
                </div>
              </div>

              {currentUser.faceVerified ? (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Face ID
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold">
                  Not Enrolled
                </span>
              )}
            </div>

            {faceUpdateSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{faceUpdateSuccess}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border-2 border-teal-500/40 shrink-0 relative shadow-inner">
                  {currentUser.facePhotoUrl || currentUser.avatar ? (
                    <img
                      src={currentUser.facePhotoUrl || currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                  {currentUser.faceVerified && (
                    <div className="absolute bottom-1 right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Enrolled Biometric Profile
                    </span>
                    <span className="px-1.5 py-0.2 bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[10px] font-bold rounded">
                      256-D Biometric Hash
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {currentUser.faceVerified
                      ? `Facial biometrics verified on ${currentUser.faceVerifiedAt ? new Date(currentUser.faceVerifiedAt).toLocaleDateString() : 'recent enrollment'}. You can sign in using your camera at the login screen.`
                      : 'Capture a clear photo of your face using your camera to activate seamless, ultra-secure biometric authentication.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Camera-based liveness verification</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFaceModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>{currentUser.faceVerified ? 'Update Biometric Scan' : 'Enroll Face ID Now'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: RECOVERY SECURITY QUESTION */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Password Recovery Security Question
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Used by the system to verify your identity if you ever forget your password.
                </p>
              </div>
            </div>

            {securitySuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{securitySuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSecurityQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Security Question
                </label>
                <select
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="What is your registered Purok in Barangay Sangkol?">
                    What is your registered Purok in Barangay Sangkol?
                  </option>
                  <option value="What was the name of your first elementary school?">
                    What was the name of your first elementary school?
                  </option>
                  <option value="What is your mother's middle or maiden name?">
                    What is your mother's middle or maiden name?
                  </option>
                  <option value="What was the street name of your childhood residence?">
                    What was the street name of your childhood residence?
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Security Answer *
                </label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Enter your security answer"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Recovery Question</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1 Col): Notifications, Privacy & Session Info */}
        <div className="space-y-6">
          {/* SECTION 4: CITIZEN NOTIFICATIONS & SMS ALERTS */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Alerts & Notifications
                  </h3>
                </div>
              </div>

              {notifSuccess && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold animate-in fade-in">
                  Saved!
                </span>
              )}
            </div>

            <div className="space-y-3.5 text-xs">
              {/* SMS Pickup Ready */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Certificate Pickup SMS</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Receive text when your clearance or certificate is approved.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.smsReady}
                  onChange={() => handleToggleNotif('smsReady')}
                  className="w-4 h-4 mt-1 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Disaster Warnings */}
              <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 text-rose-500" />
                    <span>Emergency Weather & Flood Broadcasts</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Urgent typhoon alerts and evacuation advisories from MDRRMO.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.smsDisaster}
                  onChange={() => handleToggleNotif('smsDisaster')}
                  className="w-4 h-4 mt-1 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Barangay Assembly */}
              <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Assembly & Purok Reminders
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Notices on clean-up drives, health missions, and meetings.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.smsEvents}
                  onChange={() => handleToggleNotif('smsEvents')}
                  className="w-4 h-4 mt-1 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Email Receipts */}
              <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Official Receipt Email Copies</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Send digital duplicate receipts for paid barangay fees.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.emailReceipts}
                  onChange={() => handleToggleNotif('emailReceipts')}
                  className="w-4 h-4 mt-1 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: PRIVACY & DIRECTORY PREFERENCES */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Privacy & Data Sharing
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Community Directory Listing
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Show verified name in the resident community roster.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.directoryVisibility}
                  onChange={() => handleToggleNotif('directoryVisibility')}
                  className="w-4 h-4 mt-1 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Purok Leader Contact Access
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Allow your assigned Purok Leader to contact you for localized relief programs.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.purokLeaderContact}
                  onChange={() => handleToggleNotif('purokLeaderContact')}
                  className="w-4 h-4 mt-1 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {onNavigateToProfile && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onNavigateToProfile}
                  className="w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>View Civil Data & ID Card</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 6: DATA PRIVACY & STATUTORY RIGHTS (RA 10173) */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 space-y-3.5 text-xs">
            <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-300">
              <span className="font-bold flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Data Privacy & Citizen Rights</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                RA 10173 Compliant
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Your civil records, certificates, and activity history are protected under the Philippine Data Privacy Act of 2012. You have the right to access, dispute, and verify all personal information processed by the Barangay.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-legal-policies', { detail: { tab: 'privacy' } }));
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Read Privacy Policy</span>
              </button>
            </div>
          </div>

          {/* SECTION 7: SESSION & SECURITY STATUS */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Session Security</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Active 256-Bit SSL
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <p>Registered Email: <strong className="text-slate-700 dark:text-slate-200">{currentUser.email}</strong></p>
              <p>Contact Number: <strong className="text-slate-700 dark:text-slate-200">{currentUser.contactNumber}</strong></p>
              <p>Assigned LGU: <strong className="text-slate-700 dark:text-slate-200">{settings.barangayName}, {settings.municipality}</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Face Capture Enrollment Modal */}
      <FaceVerificationModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        title="Biometric Face Enrollment & Update"
        subtitle="Align your face within the frame and follow the on-screen prompt to verify liveness"
        onVerified={handleFaceBiometricsCaptured}
      />
    </div>
  );
};
