import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  X,
  Lock,
  RefreshCw,
  Clock,
  Layers,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  getAnalyticsEvents,
  clearAnalyticsData,
  isAnalyticsConsentGranted,
  getCookieConsent,
  AnalyticsEvent,
  CookieConsentState,
} from '../utils/analytics';

interface TrackingAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCookieSettings: () => void;
}

export const TrackingAnalyticsModal: React.FC<TrackingAnalyticsModalProps> = ({
  isOpen,
  onClose,
  onOpenCookieSettings,
}) => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [consentState, setConsentState] = useState<CookieConsentState>(getCookieConsent());
  const [copiedNotification, setCopiedNotification] = useState(false);

  const refreshData = () => {
    setConsentState(getCookieConsent());
    setEvents(getAnalyticsEvents());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleConsentChange = () => refreshData();
    const handleNewEvent = () => refreshData();
    const handleClear = () => refreshData();

    window.addEventListener('barangay-consent-change', handleConsentChange);
    window.addEventListener('barangay-analytics-event', handleNewEvent);
    window.addEventListener('barangay-analytics-cleared', handleClear);

    return () => {
      window.removeEventListener('barangay-consent-change', handleConsentChange);
      window.removeEventListener('barangay-analytics-event', handleNewEvent);
      window.removeEventListener('barangay-analytics-cleared', handleClear);
    };
  }, []);

  if (!isOpen) return null;

  const handleClearData = () => {
    clearAnalyticsData();
    setEvents([]);
  };

  const isGranted = consentState.analytics;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracking-analytics-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 rounded-2xl border border-purple-200 dark:border-purple-800">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="tracking-analytics-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Client-Side Analytics & Privacy Transparency
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isGranted
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}>
                  {isGranted ? 'Active Tracking (Consented)' : 'Tracking Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect exactly what anonymized telemetry data is collected during your session
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm overflow-y-auto max-h-[75vh]">
          {/* Privacy Guarantee Banner */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-emerald-950 dark:text-emerald-200 text-xs">
                Zero PII & Zero Third-Party Advertising Guarantee
              </h4>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                All analytics events are recorded locally in session storage only. No personal names, PhilSys numbers, phone numbers, or passwords ever enter the telemetry pipeline. External ad networks or trackers are strictly blocked.
              </p>
            </div>
          </div>

          {/* Consent Status Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                Current Consent Status
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCookieSettings();
                }}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Cookie Preferences</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Strictly Essential</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Enabled (Required)
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Functional Preferences</span>
                <span className={`font-bold flex items-center gap-1 mt-0.5 ${
                  consentState.functional ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                }`}>
                  {consentState.functional ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Anonymous Analytics</span>
                <span className={`font-bold flex items-center gap-1 mt-0.5 ${
                  isGranted ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'
                }`}>
                  {isGranted ? 'Consented & Active' : 'Opted Out / Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Session Events Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Session Telemetry Stream ({events.length} Events)
                </h4>
              </div>

              {events.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearData}
                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Telemetry Log</span>
                </button>
              )}
            </div>

            {!isGranted ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                  Tracking is Completely Inactive
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Because analytics consent has not been granted, the system does not record or process any navigation or interaction events.
                </p>
              </div>
            ) : events.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 text-xs">
                  No telemetry events logged yet in this session. Navigating across views will record anonymized module tags here.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto font-mono text-[11px]">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded text-[9px] font-bold shrink-0">
                        {evt.category}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {evt.action}
                      </span>
                      {evt.label && (
                        <span className="text-slate-500 truncate">
                          ({evt.label})
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[10px] shrink-0">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Barangay Sangkol Digital Transparency Center
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
