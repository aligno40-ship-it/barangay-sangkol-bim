import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Check, Copy, Shield, Sparkles, Clock, X, ExternalLink, AlertCircle, ArrowRight } from 'lucide-react';
import { GmailOTPSession } from '../utils/security';
import { BarangaySangkolSeal, RepublicSeal } from './OfficialSeals';

interface GmailNotificationSimulatorProps {
  session: GmailOTPSession | null;
  onAutoFill?: (code: string) => void;
  onClose?: () => void;
}

export const GmailNotificationSimulator: React.FC<GmailNotificationSimulatorProps> = ({
  session,
  onAutoFill,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [timeLeftStr, setTimeLeftStr] = useState('5:00');

  useEffect(() => {
    if (!session) return;

    const updateTimer = () => {
      const remainingMs = Math.max(0, session.expiresAt - Date.now());
      const totalSec = Math.floor(remainingMs / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      setTimeLeftStr(`${min}:${sec < 10 ? '0' : ''}${sec}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(session.otpCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoFillClick = () => {
    if (onAutoFill) {
      onAutoFill(session.otpCode);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-3 right-3 sm:top-5 sm:right-5 z-60 max-w-md w-[calc(100vw-24px)] sm:w-[420px] shadow-2xl rounded-2xl overflow-hidden border border-red-200/80 bg-white font-sans text-slate-800"
      >
        {/* Gmail Notification Top App Bar */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            {/* Google Mail M Icon */}
            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center p-1 shadow-xs">
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-tight flex items-center gap-1">
                <span>Google Mail • Security Dispatch</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
              </span>
              <span className="text-[10px] text-red-100 font-mono">Incoming Inbox Message</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-mono text-red-100 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{timeLeftStr}</span>
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-lg hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
                title="Dismiss simulated alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Email Header Info */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span className="font-semibold text-slate-700">From: Sangguniang Barangay Sangkol Security</span>
            <span>Just now</span>
          </div>
          <div className="text-[11px] text-slate-600 truncate">
            <span className="font-medium text-slate-500">To: </span>
            <span className="font-bold text-indigo-700 font-mono">{session.email}</span>
          </div>
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 pt-0.5">
            <Shield className="w-3.5 h-3.5 text-red-600" />
            <span>[Barangay Sangkol BIMS] Your 6-Digit Password Reset OTP Verification Code</span>
          </div>
        </div>

        {/* Email Body & OTP Display */}
        <div className="p-4 space-y-3.5 bg-white">
          <p className="text-xs text-slate-600 leading-relaxed">
            A password reset was requested for account{' '}
            <strong className="text-slate-900 font-semibold">{session.identifier}</strong>. Use the secure 6-digit One-Time Password (OTP) below to authorize the password update.
          </p>

          {/* Highlighted OTP Code Display Box */}
          <div className="p-3 bg-red-50/70 border-2 border-dashed border-red-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-red-600">
                Official Verification OTP
              </p>
              <div className="text-2xl font-black font-mono tracking-widest text-red-700 select-all">
                {session.otpCode}
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 justify-center sm:justify-start">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Expires in {timeLeftStr} (Single-use only)</span>
              </p>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 sm:flex-none px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>

              {onAutoFill && (
                <button
                  type="button"
                  onClick={handleAutoFillClick}
                  className="flex-1 sm:flex-none px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Auto-Fill</span>
                </button>
              )}
            </div>
          </div>

          {/* Security Advisory */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-tight">
              <strong>Security Alert:</strong> If you did not request this OTP, someone may be attempting to access your account. No barangay official will ever ask for this code.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Google Workspace & Sangkol Gov Sec</span>
            <span>•</span>
            <a
              href="https://mail.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 font-bold hover:underline inline-flex items-center gap-0.5"
            >
              <span>Open Gmail Inbox</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <span className="font-mono text-slate-500">Encrypted 256-bit TLS</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
