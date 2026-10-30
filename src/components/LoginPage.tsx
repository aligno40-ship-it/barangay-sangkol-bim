import React, { useState, useEffect } from 'react';
import { useBarangay, areNamesMatching } from '../context/BarangayContext';
import { BarangaySangkolSeal, RepublicSeal } from './OfficialSeals';
import { AnimatedLogoLoader } from './AnimatedLogoLoader';
import { ResidentRegistrationModal } from './ResidentRegistrationModal';
import { LegalPoliciesModal, LegalPolicyTab } from './LegalPoliciesModal';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storageUtils';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Info,
  X,
  UserPlus,
  Clock,
  CheckCircle2,
  FileCheck2,
  MapPin,
  Sparkles,
  Scale,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
  isModal?: boolean;
  onClose?: () => void;
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  isModal = false,
  onClose,
  onBackToLanding,
}) => {
  const { login, settings, users, resetPassword } = useBarangay();

  // Authentication Mode: 'resident' or 'official'
  // The login form has no portal selector. The account role determined during authentication
  // controls whether the resident or official experience is opened.
  const [authMode, setAuthMode] = useState<'resident' | 'official'>('resident');

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [portalMismatchInfo, setPortalMismatchInfo] = useState<{
    message: string;
    suggestedPortal: 'resident' | 'official';
    userRole?: string;
    userName?: string;
  } | null>(null);
  const [pendingStatusInfo, setPendingStatusInfo] = useState<{
    name: string;
    username: string;
    submittedAt?: string;
    purok?: string;
    message: string;
  } | null>(null);
  const [rejectedStatusInfo, setRejectedStatusInfo] = useState<{
    name: string;
    message: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // Self-Service Reset Password Modal State
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalPolicyTab>('privacy');
  const [sessionTimeoutNotice, setSessionTimeoutNotice] = useState<string | null>(() => {
    try {
      const msg = sessionStorage.getItem('barangay_bims_session_timeout_alert');
      if (msg) {
        sessionStorage.removeItem('barangay_bims_session_timeout_alert');
        return msg;
      }
    } catch {
      // safe fallback
    }
    return null;
  });

  const handleSelfServiceResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    const cleanIdent = resetIdentifier.trim();
    if (!cleanIdent) {
      setResetError('Please enter your username or registered email.');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match. Please verify.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      const res = await resetPassword(cleanIdent, resetNewPassword, resetAnswer.trim() || undefined);
      setIsResetSubmitting(false);
      if (res.success) {
        setIsResetPasswordModalOpen(false);
        setUsername(cleanIdent);
        setPassword(resetNewPassword);
        setResetSuccessMessage(res.message || 'Password successfully updated! You can now log in.');
        setErrorMessage('');
      } else {
        setResetError(res.message || 'Unable to reset password. Please check your username/email.');
      }
    } catch (err: any) {
      setIsResetSubmitting(false);
      setResetError(err?.message || 'A service error occurred while resetting password.');
    }
  };

  // Load remembered username if saved by user
  useEffect(() => {
    try {
      const savedUser = safeGetItem('barangay_bims_remembered_user');
      // If legacy default 'admin' or 'resident.maria' was saved automatically in past sessions, clear it so textbox stays clean
      if (savedUser && savedUser !== 'admin' && savedUser !== 'resident.maria') {
        setUsername(savedUser);
        setRememberMe(true);
      } else if (savedUser === 'admin' || savedUser === 'resident.maria') {
        safeRemoveItem('barangay_bims_remembered_user');
      }
    } catch {
      // safe fallback
    }
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setPortalMismatchInfo(null);
    setPendingStatusInfo(null);
    setRejectedStatusInfo(null);
    setShowForgotNotice(false);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // 1. Validate empty fields before submitting
    if (!cleanUsername && !cleanPassword) {
      setErrorMessage('Please enter your username and password to sign in.');
      return;
    }
    if (!cleanUsername) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!cleanPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const lower = cleanUsername.toLowerCase();
      const targetUser = users.find((u) => {
        const uUser = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const uName = (u.name || '').toLowerCase();
        return (
          uUser === lower ||
          uEmail === lower ||
          uName === lower ||
          areNamesMatching(u.name, cleanUsername)
        );
      });

      const effectiveAuthMode: 'resident' | 'official' = targetUser
        ? (targetUser.role === 'Resident' ? 'resident' : 'official')
        : authMode;

      if (effectiveAuthMode !== authMode) {
        setAuthMode(effectiveAuthMode);
      }

      const result = await login(cleanUsername, cleanPassword, undefined, effectiveAuthMode);
      setIsLoading(false);

      if (result.success) {
        // Save or clear remember me preference
        try {
          if (rememberMe) {
            safeSetItem('barangay_bims_remembered_user', cleanUsername);
          } else {
            safeRemoveItem('barangay_bims_remembered_user');
          }
        } catch {
          // ignore storage error
        }

        if (onSuccess) {
          onSuccess();
        }
        if (onClose) {
          onClose();
        }
      } else if (result.isPortalMismatch) {
        // Handle cross-portal login restriction
        setPortalMismatchInfo({
          message: result.message,
          suggestedPortal: result.suggestedPortal || (authMode === 'resident' ? 'official' : 'resident'),
          userRole: result.user?.role,
          userName: result.user?.name,
        });
      } else if (result.isPendingApproval && result.user) {
        // Handle Resident Pending Approval
        setPendingStatusInfo({
          name: result.user.name,
          username: result.user.username,
          submittedAt: result.user.submittedAt,
          purok: result.user.purok,
          message: result.message,
        });
      } else if (result.isRejected && result.user) {
        // Handle Resident Rejected Status
        setRejectedStatusInfo({
          name: result.user.name,
          message: result.message,
        });
      } else {
        setErrorMessage(result.message || 'Invalid username or password. Please check your credentials and try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error('Login submit error:', err);
      const rawMsg = err?.message || '';
      let friendlyMsg = 'Unable to sign in. Please check your credentials, or use password recovery.';
      if (rawMsg.toLowerCase().includes('rate limit')) {
        friendlyMsg = 'Too many authentication attempts. Please wait a moment and try again.';
      } else if (rawMsg.toLowerCase().includes('network') || rawMsg.toLowerCase().includes('failed to fetch')) {
        friendlyMsg = 'Network connection issue. Local authentication active — please try again.';
      } else if (rawMsg && !rawMsg.includes('object Object') && !rawMsg.toLowerCase().includes('unexpected error')) {
        friendlyMsg = rawMsg;
      }
      setErrorMessage(friendlyMsg);
    }
  };

  const cardContent = (
    <div className="w-full max-w-[460px] transition-all relative">
      {/* Main Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 relative overflow-hidden">
        {/* Animated Logo Loader Overlay when Authenticating */}
        {isLoading && (
          <AnimatedLogoLoader
            mode="overlay"
            authMode={authMode}
            isAuthenticating={true}
            label={authMode === 'resident' ? 'Signing in to Resident Portal' : 'Signing in to Barangay Administration'}
            sublabel={`${settings.barangayName}, ${settings.municipality}`}
          />
        )}

        {/* Modal Close Button */}
        {isModal && onClose && !isLoading && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer z-10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* 1. Official Barangay Animated Logo Header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3.5">
            <AnimatedLogoLoader mode="header" authMode={authMode} />
          </div>

          {/* 2. System Name & Subtitle */}
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Barangay Information Management System
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {settings.barangayName}, {settings.municipality}
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-600 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200 font-medium">
            Sign in with your account credentials. Your role will determine your destination.
          </p>
        </div>

        {/* Session Timeout Expiry Notice Banner */}
        {sessionTimeoutNotice && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl text-xs space-y-1.5 animate-in fade-in duration-200 shadow-xs relative">
            <div className="flex items-start gap-2.5">
              <div className="p-1 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1 pr-4">
                <p className="font-bold text-amber-950 text-xs">
                  Session Timed Out Due to Inactivity
                </p>
                <p className="text-[11px] text-amber-900/90 leading-relaxed mt-0.5">
                  {sessionTimeoutNotice}
                </p>
              </div>
              <button
                onClick={() => setSessionTimeoutNotice(null)}
                className="absolute top-2.5 right-2.5 p-1 text-amber-700 hover:text-amber-950 rounded-md"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Portal Cross-Access Restriction Alert Banner */}
        {portalMismatchInfo && (
          <div className="mt-4 p-4 bg-rose-50 border-2 border-rose-400 text-rose-950 rounded-2xl text-xs space-y-2.5 animate-in fade-in duration-200 shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-rose-950 text-xs tracking-tight">
                    Portal Access Restricted
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-200/80 text-rose-900 border border-rose-300">
                    Access Denied
                  </span>
                </div>
                <p className="text-rose-900 text-[11px] leading-relaxed">
                  {portalMismatchInfo.message}
                </p>
              </div>
            </div>

            {/* Quick Switch Action */}
            <div className="pt-2 border-t border-rose-200/80">
              <p className="text-[10px] text-rose-700 font-medium">
                Use your role-appropriate account credentials; the system routes automatically.
              </p>
            </div>
          </div>
        )}

        {/* Pending Resident Approval Alert Banner */}
        {pendingStatusInfo && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs space-y-2 animate-in fade-in duration-200 shadow-xs">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-950 block text-xs">
                  Account Status: Pending Admin Verification
                </span>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Hi <strong>{pendingStatusInfo.name}</strong> (@{pendingStatusInfo.username}), your Resident Portal registration was submitted and is currently being verified by the Barangay Administrator against the civil registry records.
                </p>
              </div>
            </div>
            <div className="p-2 bg-amber-100/70 rounded-xl text-[10px] text-amber-900 font-medium flex justify-between">
              <span>Purok: <strong>{pendingStatusInfo.purok || 'Sangkol'}</strong></span>
              <span>Submitted: {pendingStatusInfo.submittedAt ? new Date(pendingStatusInfo.submittedAt).toLocaleDateString() : 'Recently'}</span>
            </div>
            <p className="text-[10px] text-amber-700 italic text-center">
              Please wait for approval. Once activated, you will be able to access the resident portal immediately.
            </p>
          </div>
        )}

        {/* Rejected Resident Alert Banner */}
        {rejectedStatusInfo && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-bold block text-rose-950">Registration Declined</span>
              <span className="text-rose-800 text-[11px]">{rejectedStatusInfo.message}</span>
            </div>
          </div>
        )}

        {/* General Error Notification Alert */}
        {errorMessage && !pendingStatusInfo && !rejectedStatusInfo && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block text-rose-900">Sign-In Notice</span>
              <span className="text-rose-700">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Reset Password Success Alert */}
        {resetSuccessMessage && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block text-emerald-900">Password Reset Completed</span>
              <span className="text-emerald-800 text-[11px]">{resetSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setResetSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Forgot Password Notice Helper */}
        {showForgotNotice && (
          <div className="mt-4 p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block">Password Reset Assistance</span>
              <span className="text-blue-800 text-[11px]">
                You can reset your password immediately using the self-service reset dialog below, or visit the Barangay Hall helpdesk for account verification.
              </span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Username Field */}
          <div className="space-y-1">
            <label
              htmlFor="bims-username"
              className="block text-xs font-semibold text-slate-700"
            >
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="bims-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMessage('');
                  setPendingStatusInfo(null);
                  setRejectedStatusInfo(null);
                }}
                placeholder="Enter username or email"
                disabled={isLoading}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent focus:bg-white transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label
              htmlFor="bims-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="bims-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                  setPendingStatusInfo(null);
                  setRejectedStatusInfo(null);
                }}
                placeholder="Enter your password"
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent focus:bg-white transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-[11px]">Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setResetIdentifier(username.trim());
                setResetError(null);
                setResetNewPassword('');
                setResetConfirmPassword('');
                setResetAnswer('');
                setIsResetPasswordModalOpen(true);
              }}
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors cursor-pointer text-[11px]"
            >
              Forgot Password?
            </button>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20"
          >
            {isLoading ? (
              <AnimatedLogoLoader mode="inline" label="Authenticating Secure Session..." />
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resident Registration Link */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Not yet registered in the Resident Portal?
          </p>
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
            <span>Register Resident Account (Admin Approval Required)</span>
          </button>
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-5 text-center text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-600">
          © 2026 Barangay Information Management System
        </p>
        <p className="text-[11px] text-slate-400">
          All rights reserved. {settings.barangayName}, {settings.municipality}
        </p>
      </footer>

      {/* Resident Registration Modal */}
      <ResidentRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={(regUsername) => {
          setUsername(regUsername);
          setPassword('');
        }}
      />
    </div>
  );

  if (isModal) {
    return cardContent;
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden bg-slate-100">
      {/* Subtle Government & Barangay Geometric Pattern Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#1e3a8a 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="absolute top-8 right-8 opacity-[0.035] hidden lg:block select-none">
          <RepublicSeal size={320} />
        </div>
        <div className="absolute bottom-8 left-8 opacity-[0.03] hidden lg:block select-none">
          <BarangaySangkolSeal size={300} />
        </div>
      </div>

      {/* Top subtle bar / status banner */}
      <header className="relative z-10 py-4 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-800 text-xs font-bold border border-slate-200/90 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back to Public Portal</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Barangay Sangkol E-Services Network Online</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsRegisterModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-emerald-800 text-xs font-bold border border-emerald-200 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Resident Registration</span>
        </button>
      </header>

      {/* Centered Login Card Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:py-8">
        {cardContent}
      </main>

      {/* Bottom compliance and legal links */}
      <footer className="relative z-10 py-4 px-4 border-t border-slate-200/60 bg-white/70 backdrop-blur-xs text-center text-xs text-slate-500 space-y-1.5">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setLegalModalTab('privacy');
              setIsLegalModalOpen(true);
            }}
            className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer hover:underline"
          >
            Privacy Policy (RA 10173)
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setLegalModalTab('terms');
              setIsLegalModalOpen(true);
            }}
            className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer hover:underline"
          >
            Terms and Conditions
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setLegalModalTab('cookies');
              setIsLegalModalOpen(true);
            }}
            className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer hover:underline"
          >
            Cookie Policy
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-center gap-2">
          <span>Republic of the Philippines • Barangay Sangkol, Dipolog City</span>
          <span>•</span>
          <span>Official LGU Portal • PMA</span>
        </div>
      </footer>

      {/* Legal & Governance Compliance Modal */}
      <LegalPoliciesModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* Self-Service Reset Password Modal */}
      {isResetPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => !isResetSubmitting && setIsResetPasswordModalOpen(false)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Reset User Password</h3>
                <p className="text-xs text-slate-500">
                  Update your account password to regain access to the portal.
                </p>
              </div>
              <button
                type="button"
                disabled={isResetSubmitting}
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSelfServiceResetPassword} className="mt-4 space-y-3.5">
              {resetError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Username or Registered Email</label>
                <input
                  type="text"
                  required
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="Enter your username or email"
                  disabled={isResetSubmitting}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">New Password</label>
                  <button
                    type="button"
                    onClick={() => setResetShowPassword(!resetShowPassword)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    {resetShowPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={resetShowPassword ? 'text' : 'password'}
                    required
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    disabled={isResetSubmitting}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Confirm New Password</label>
                <input
                  type={resetShowPassword ? 'text' : 'password'}
                  required
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  disabled={isResetSubmitting}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Security Answer <span className="text-slate-400 font-normal">(Optional if question was configured)</span>
                </label>
                <input
                  type="text"
                  value={resetAnswer}
                  onChange={(e) => setResetAnswer(e.target.value)}
                  placeholder="Security question answer (if previously set)"
                  disabled={isResetSubmitting}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Immediate Account Recovery</span>
                </p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Resetting the password saves directly to the system database and unlocks any temporary security lockouts.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isResetSubmitting}
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetSubmitting}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  {isResetSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Save & Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
