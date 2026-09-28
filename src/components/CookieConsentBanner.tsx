import React, { useState, useEffect } from 'react';
import {
  Cookie,
  ShieldCheck,
  Check,
  Settings,
  X,
  Info,
  Sliders,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  getCookieConsent,
  saveCookieConsent,
  CookieConsentState,
} from '../utils/analytics';
import { LegalPolicyTab } from './LegalPoliciesModal';

interface CookieConsentBannerProps {
  onOpenLegalModal: (tab: LegalPolicyTab) => void;
  isAdmin?: boolean;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenLegalModal,
  isAdmin = false,
}) => {
  const [consentState, setConsentState] = useState<CookieConsentState>(getCookieConsent());
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  // Granular preference state
  const [prefFunctional, setPrefFunctional] = useState(true);
  const [prefAnalytics, setPrefAnalytics] = useState(false);

  useEffect(() => {
    const current = getCookieConsent();
    setConsentState(current);
    if (!current.hasConsented) {
      // Delay showing banner slightly for smooth page entry
      const timer = setTimeout(() => setShowBanner(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for global request to open cookie settings (e.g. from footer or settings tab)
  useEffect(() => {
    const handleOpenCookieSettings = () => {
      if (!isAdmin) return;
      const current = getCookieConsent();
      setPrefFunctional(current.functional);
      setPrefAnalytics(current.analytics);
      setShowPreferencesModal(true);
    };

    window.addEventListener('open-cookie-settings', handleOpenCookieSettings);
    return () => window.removeEventListener('open-cookie-settings', handleOpenCookieSettings);
  }, [isAdmin]);

  const handleAcceptAll = () => {
    saveCookieConsent({ functional: true, analytics: true });
    setConsentState(getCookieConsent());
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const handleEssentialOnly = () => {
    saveCookieConsent({ functional: false, analytics: false });
    setConsentState(getCookieConsent());
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const handleSavePreferences = () => {
    saveCookieConsent({ functional: prefFunctional, analytics: prefAnalytics });
    setConsentState(getCookieConsent());
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const openCustomizeModal = () => {
    setPrefFunctional(consentState.functional);
    setPrefAnalytics(consentState.analytics);
    setShowPreferencesModal(true);
  };

  return (
    <>
      {/* Bottom Floating Consent Banner */}
      {showBanner && !showPreferencesModal && (
        <aside
          aria-label="Cookie and Privacy Consent"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 rounded-2xl shrink-0 mt-0.5 border border-emerald-200 dark:border-emerald-800">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Privacy Notice & Storage Preferences</span>
                  <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded text-[9px] font-bold">
                    RA 10173
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowBanner(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Barangay Sangkol BIMS uses strictly essential session storage and optional privacy-respecting metrics. We do not sell data, use third-party advertising cookies, or track across external websites.
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('privacy')}
                  className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  Privacy Policy
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('cookies')}
                  className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  Cookie Policy
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('terms')}
                  className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  Terms of Use
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Accept All
                </button>
                <button
                  type="button"
                  onClick={handleEssentialOnly}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  Essential Only
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={openCustomizeModal}
                    className="w-full sm:w-auto px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Cookie Settings</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Granular Preferences Dialog Modal */}
      {showPreferencesModal && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
        >
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-xl">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="cookie-preferences-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Cookie & Storage Preferences
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Granular consent controls under Republic Act 10173
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Configure your data storage choices below. You can update these settings at any time from the portal footer or account settings.
              </p>

              {/* 1. Strictly Necessary Storage */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Strictly Necessary / Essential Storage
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-bold">
                    Always Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Required for core platform operation, user authentication, CSRF security tokens, and preventing session timeout during certificate filing. Cannot be disabled.
                </p>
              </div>

              {/* 2. Functional & Visual Preferences */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Functional & Visual Preferences
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefFunctional}
                      onChange={(e) => setPrefFunctional(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Saves your dark/light theme choice and remembered username across browser visits to improve login convenience.
                </p>
              </div>

              {/* 3. Anonymous Analytics & Telemetry */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cookie className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Anonymous Analytics & Performance Tracking
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefAnalytics}
                      onChange={(e) => setPrefAnalytics(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Collects fully anonymized module navigation counters (e.g. tracking which frontline services are most accessed). Never collects personal identities, passwords, or contact info. Stored only in session.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrefFunctional(false);
                  setPrefAnalytics(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer underline"
              >
                Reject All Non-Essential
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
