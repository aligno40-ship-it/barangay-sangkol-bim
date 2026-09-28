import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBarangay } from '../context/BarangayContext';
import {
  ShieldAlert,
  Clock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface SessionTimeoutModalProps {
  /**
   * Timeout duration in seconds (default: 15 minutes = 900 seconds)
   */
  timeoutSeconds?: number;
  /**
   * Warning threshold in seconds before timeout (default: 60 seconds)
   */
  warningSeconds?: number;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  timeoutSeconds = 15 * 60, // 15 minutes
  warningSeconds = 60, // 60 seconds countdown
}) => {
  const { isAuthenticated, currentUser, logout, addAuditLog } = useBarangay();

  const [remainingTime, setRemainingTime] = useState<number>(timeoutSeconds);
  const [isWarningVisible, setIsWarningVisible] = useState<boolean>(false);
  const [isExtending, setIsExtending] = useState<boolean>(false);

  const lastActivityRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);

  // Reset user activity timestamp
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setRemainingTime(timeoutSeconds);
    if (isWarningVisible) {
      setIsWarningVisible(false);
    }
  }, [timeoutSeconds, isWarningVisible]);

  // Handle manual session extension
  const handleExtendSession = () => {
    setIsExtending(true);
    setTimeout(() => {
      resetActivity();
      setIsExtending(false);
      addAuditLog(
        'SECURITY_ALERT',
        'Session Security',
        `User ${currentUser.name} (${currentUser.role}) manually extended their active session.`
      );
    }, 300);
  };

  // Handle automatic timeout logout
  const handleTimeoutLogout = useCallback(() => {
    setIsWarningVisible(false);
    
    // Store message for LoginPage to display
    try {
      sessionStorage.setItem(
        'barangay_bims_session_timeout_alert',
        `Your session has expired due to ${Math.round(timeoutSeconds / 60)} minutes of inactivity. For security and protection of resident records, you have been automatically signed out.`
      );
    } catch {
      // safe fallback
    }

    addAuditLog(
      'LOGOUT',
      'Session Security',
      `Auto-logout: Session expired due to inactivity for user ${currentUser.name} (${currentUser.role}).`
    );

    logout();
  }, [currentUser, logout, addAuditLog, timeoutSeconds]);

  // Activity listeners across the entire document
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel',
    ];

    let lastThrottle = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle event handling to once every 2 seconds
      if (now - lastThrottle > 2000) {
        lastThrottle = now;
        if (!isWarningVisible) {
          lastActivityRef.current = now;
        }
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated, isWarningVisible]);

  const handleTimeoutLogoutRef = useRef(handleTimeoutLogout);
  useEffect(() => {
    handleTimeoutLogoutRef.current = handleTimeoutLogout;
  });

  // Periodic heartbeat timer to check elapsed idle time
  useEffect(() => {
    if (!isAuthenticated) {
      setIsWarningVisible(false);
      return;
    }

    lastActivityRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastActivityRef.current) / 1000);
      const secondsLeft = Math.max(0, timeoutSeconds - elapsedSeconds);

      setRemainingTime(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(timerIntervalRef.current);
        handleTimeoutLogoutRef.current();
      } else if (secondsLeft <= warningSeconds) {
        setIsWarningVisible(true);
      } else {
        setIsWarningVisible(false);
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isAuthenticated, timeoutSeconds, warningSeconds]);

  if (!isAuthenticated || !isWarningVisible) {
    return null;
  }

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const percentageLeft = Math.max(0, Math.min(100, (remainingTime / warningSeconds) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="timeout-title"
      >
        {/* Header Alert Strip */}
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 id="timeout-title" className="text-sm font-black tracking-wide uppercase">
                Session Inactivity Warning
              </h3>
              <p className="text-[11px] text-white/90 font-medium">
                Barangay Sangkol Security Shield
              </p>
            </div>
          </div>

          <div className="px-2.5 py-1 bg-black/20 rounded-full text-xs font-mono font-bold tracking-wider">
            {formattedCountdown}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-center">
          {/* Animated Countdown Ring / Badge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Circular Background */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${
                    remainingTime <= 15 ? 'text-rose-500' : 'text-amber-500'
                  } transition-all duration-1000 ease-linear`}
                  strokeDasharray={`${percentageLeft}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span
                  className={`text-2xl font-black font-mono leading-none ${
                    remainingTime <= 15 ? 'text-rose-600 animate-pulse' : 'text-slate-800'
                  }`}
                >
                  {remainingTime}s
                </span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                  Remaining
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-bold text-slate-900">
              Are you still working, {currentUser.name.split(' ')[0]}?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              You have been inactive for nearly 15 minutes. For security and protection of resident
              civil records, your session will automatically close in{' '}
              <strong className="text-rose-600 font-mono font-bold">{remainingTime} seconds</strong>.
            </p>
          </div>

          {/* User & Security Context Pill */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-left flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900 leading-tight truncate max-w-[170px]">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">{currentUser.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              <Lock className="w-3 h-3" />
              <span>256-bit Active</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleTimeoutLogout()}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Log Out Now</span>
            </button>

            <button
              onClick={handleExtendSession}
              disabled={isExtending}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {isExtending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Stay Signed In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
