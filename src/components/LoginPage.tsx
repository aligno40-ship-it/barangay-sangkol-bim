import React, { useState, useEffect } from 'react';
import { useBarangay } from '../context/BarangayContext';
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
  HelpCircle,
  X,
  UserPlus,
  Clock,
  CheckCircle2,
  Users,
  Building2,
  FileCheck2,
  MapPin,
  Sparkles,
  ArrowRightLeft,
  Scale,
  ArrowLeft,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
  isModal?: boolean;
  onClose?: () => void;
  onBackToLanding?: () => void;
  initialMode?: 'resident' | 'official';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  isModal = false,
  onClose,
  onBackToLanding,
  initialMode,
}) => {
  const { login, settings, users } = useBarangay();

  // Authentication Mode: 'resident' or 'official'
  const [authMode, setAuthMode] = useState<'resident' | 'official'>(initialMode || 'resident');

  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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

  const handleSwitchMode = (
    mode: 'resident' | 'official',
    retainedUsername?: string,
    retainedPassword?: string
  ) => {
    setAuthMode(mode);
    setErrorMessage('');
    setPortalMismatchInfo(null);
    setPendingStatusInfo(null);
    setRejectedStatusInfo(null);

    if (retainedUsername !== undefined) {
      setUsername(retainedUsername);
      if (retainedPassword !== undefined) {
        setPassword(retainedPassword);
      }
      return;
    }

    setUsername('');
    setPassword('');
  };

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
      const result = await login(cleanUsername, cleanPassword, undefined, authMode);
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
      setErrorMessage(err.message || 'An unexpected error occurred while signing in.');
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

        {/* 3. Role Mode Switcher Tab (Resident vs Officials) */}
        <div className="mt-4 p-1 bg-slate-100/90 rounded-2xl grid grid-cols-2 gap-1 border border-slate-200/80">
          <button
            type="button"
            onClick={() => handleSwitchMode('resident')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'resident'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resident Sign-In</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('official')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'official'
                ? 'bg-white text-blue-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Officials & Staff</span>
          </button>
        </div>

        {/* Mode Description Banner */}
        <div className="mt-3 text-center">
          {authMode === 'resident' ? (
            <p className="text-[11px] text-emerald-800 bg-emerald-50/70 py-1.5 px-3 rounded-xl border border-emerald-200/60 font-medium">
              Citizen portal for Sangkol residents. New accounts submit to Admin for verification.
            </p>
          ) : (
            <p className="text-[11px] text-blue-900 bg-blue-50/70 py-1.5 px-3 rounded-xl border border-blue-200/60 font-medium">
              Direct sign-in for Punong Barangay, Secretary, Treasurer, Tanods, and Staff.
            </p>
          )}
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
            <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between gap-2">
              <span className="text-[10px] text-rose-700 font-medium">
                {portalMismatchInfo.suggestedPortal === 'resident'
                  ? 'Switch to Resident Portal'
                  : 'Switch to Officials & Staff Portal'}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleSwitchMode(
                    portalMismatchInfo.suggestedPortal,
                    username,
                    password
                  )
                }
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>
                  Go to {portalMismatchInfo.suggestedPortal === 'resident' ? 'Resident Sign-In' : 'Officials Sign-In'}
                </span>
              </button>
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

        {/* Forgot Password Notice Helper */}
        {showForgotNotice && (
          <div className="mt-4 p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block">Password Reset Assistance</span>
              <span className="text-blue-800 text-[11px]">
                Please contact the Barangay Secretary or visit the Barangay Hall helpdesk to reset your password or verify your registered account.
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
              {authMode === 'resident' ? 'Username or Email' : 'Username'}
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
                placeholder={authMode === 'resident' ? 'Enter username or email' : 'Enter username'}
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
              onClick={() => setShowForgotNotice(!showForgotNotice)}
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors cursor-pointer text-[11px]"
            >
              Forgot Password?
            </button>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 px-4 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              authMode === 'resident'
                ? 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20'
                : 'bg-blue-700 hover:bg-blue-800 shadow-blue-700/20'
            }`}
          >
            {isLoading ? (
              <AnimatedLogoLoader mode="inline" label="Authenticating Secure Session..." />
            ) : (
              <>
                <span>Sign In to {authMode === 'resident' ? 'Resident Portal' : 'Administration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resident Registration Link Trigger (Strictly for Residents Only) */}
        {authMode === 'resident' && (
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
        )}

        {/* Quick Demo Credentials Dropdown */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <details className="text-[11px] text-slate-500 group">
            <summary className="font-medium text-slate-500 hover:text-emerald-700 cursor-pointer list-none flex items-center justify-center gap-1">
              <HelpCircle className="w-3 h-3 text-slate-400" />
              <span>
                {authMode === 'resident'
                  ? 'Sample Resident Accounts (Approved & Pending)'
                  : 'Quick Staff / Admin Login Accounts'}
              </span>
            </summary>
            <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1 text-[10px] text-slate-600 max-h-48 overflow-y-auto">
              {users
                .filter((u) => (authMode === 'resident' ? u.role === 'Resident' : u.role !== 'Resident'))
                .map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setUsername(u.username);
                      setPassword(u.role === 'Resident' ? 'password123' : 'AdminPassword2026!');
                      setErrorMessage('');
                      setPendingStatusInfo(null);
                      setRejectedStatusInfo(null);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-800 truncate leading-tight">{u.name}</p>
                        {u.status === 'Pending Approval' && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[8px] font-bold">
                            Pending
                          </span>
                        )}
                        {u.status === 'Active' && (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[8px] font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-500 font-mono leading-tight">
                        @{u.username} • {u.purok || u.role}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0">
                      ••••••
                    </span>
                  </div>
                ))}
            </div>
          </details>
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
          <span>Official LGU Portal • TLS 1.3 Encrypted</span>
        </div>
      </footer>

      {/* Legal & Governance Compliance Modal */}
      <LegalPoliciesModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
    </div>
  );
};
