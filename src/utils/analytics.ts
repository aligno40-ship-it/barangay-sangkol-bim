/**
 * Privacy-Preserving Analytics & Telemetry Engine for Barangay Sangkol BIMS
 * 
 * Strict Privacy Commitments:
 * 1. Zero Third-Party Leakage: All event data stays strictly local / client-side in session.
 * 2. Zero PII: Never records personal names, emails, passwords, phone numbers, or health data.
 * 3. Consent Gated: Completely disabled unless user grants analytics consent via Cookie Preferences.
 * 4. Compliance: Designed under Republic Act 10173 (Philippine Data Privacy Act of 2012).
 */

export interface AnalyticsEvent {
  id: string;
  category: 'navigation' | 'service' | 'verification' | 'security' | 'accessibility' | 'system';
  action: string;
  label?: string;
  timestamp: string;
}

export interface CookieConsentState {
  hasConsented: boolean;
  essential: boolean;      // Always true
  functional: boolean;     // Theme, remembered username
  analytics: boolean;      // Telemetry & metrics
  updatedAt: string;
}

const CONSENT_STORAGE_KEY = 'barangay_cookie_consent_v1';
const ANALYTICS_EVENTS_KEY = 'barangay_analytics_events_v1';
const MAX_STORED_EVENTS = 50;

/**
 * Retrieves current cookie & analytics consent preferences
 */
export const getCookieConsent = (): CookieConsentState => {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        hasConsented: true,
        essential: true,
        functional: parsed.functional ?? true,
        analytics: parsed.analytics ?? false,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch {
    // safe fallback
  }

  return {
    hasConsented: false,
    essential: true,
    functional: true,
    analytics: false,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Saves cookie & analytics consent preferences and dispatches event
 */
export const saveCookieConsent = (preferences: { functional: boolean; analytics: boolean }): void => {
  const state: CookieConsentState = {
    hasConsented: true,
    essential: true,
    functional: preferences.functional,
    analytics: preferences.analytics,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
    // If analytics disabled, purge stored event logs immediately
    if (!preferences.analytics) {
      sessionStorage.removeItem(ANALYTICS_EVENTS_KEY);
    }
  } catch {
    // safe fallback
  }

  // Notify listeners across components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('barangay-consent-change', { detail: state }));
  }
};

/**
 * Checks whether user has explicitly opted into analytics tracking
 */
export const isAnalyticsConsentGranted = (): boolean => {
  return getCookieConsent().analytics;
};

/**
 * Retrieve session telemetry events
 */
export const getAnalyticsEvents = (): AnalyticsEvent[] => {
  if (!isAnalyticsConsentGranted()) {
    return [];
  }

  try {
    const raw = sessionStorage.getItem(ANALYTICS_EVENTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // safe fallback
  }
  return [];
};

/**
 * Track an anonymized event if user consented
 */
export const trackEvent = (
  category: AnalyticsEvent['category'],
  action: string,
  label?: string
): void => {
  if (!isAnalyticsConsentGranted()) {
    return; // Strictly no tracking without explicit consent
  }

  try {
    const existing = getAnalyticsEvents();
    const newEvent: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      category,
      action: action.slice(0, 100),
      label: label ? label.slice(0, 100) : undefined,
      timestamp: new Date().toISOString(),
    };

    const updated = [newEvent, ...existing].slice(0, MAX_STORED_EVENTS);
    sessionStorage.setItem(ANALYTICS_EVENTS_KEY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barangay-analytics-event', { detail: newEvent }));
    }
  } catch {
    // safe fallback
  }
};

/**
 * Track page / module navigation
 */
export const trackPageView = (moduleName: string): void => {
  trackEvent('navigation', 'view_module', moduleName);
};

/**
 * Clear stored telemetry logs
 */
export const clearAnalyticsData = (): void => {
  try {
    sessionStorage.removeItem(ANALYTICS_EVENTS_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barangay-analytics-cleared'));
    }
  } catch {
    // safe fallback
  }
};
