/**
 * Safe LocalStorage & Memory Fallback Manager
 * 
 * IMPORTANT ARCHITECTURE NOTE:
 * All actual application data (residents, users, certificates, blotters,
 * officials, announcements, appointments, community services, etc.)
 * is strictly persisted in and queried exclusively from Supabase.
 * LocalStorage / memory store is ONLY used for transient UI preferences
 * (e.g., dark/light theme, recent search terms, notification read states).
 */

const STORAGE_KEY_PREFIX = 'barangay_sangkol_bims_';
const memoryStore = new Map<string, string>();
const memorySessionStore = new Map<string, string>();

/**
 * List of obsolete data storage keys that must never be read or written to localStorage.
 * Any residual data from older local-only versions is aggressively purged.
 */
export const OBSOLETE_APP_DATA_KEYS = [
  // Session Authentication keys (strictly session-only now; closing the browser terminates the session)
  'auth_session',
  'current_user_id',
  // Core Barangay Admin records
  'residents',
  'users',
  'households',
  'officials',
  'certificates',
  'blotters',
  'complaints',
  'businesses',
  'announcements',
  'announcementAttendees',
  'activities',
  'activityAttendees',
  'concerns',
  'appointments',
  'documents',
  'files',
  'transactions',
  'auditLogs',
  'settings',
  'sms_alerts',
  'sms_gateway_settings',
  // Community Services records
  'bims_resident_blotter_reports',
  'bims_resident_lupon_schedules',
  'bims_resident_facility_reservations',
  'bims_resident_equipment_reservations',
  'bims_resident_health_appointments',
  'bims_resident_child_immunizations',
  'bims_resident_medicine_refills',
  'bims_resident_pharmacy_inventory',
  'bims_resident_health_missions',
  'bims_resident_job_postings',
  'bims_resident_job_applications',
  'bims_resident_livelihood_trainings',
  'bims_resident_livelihood_enrollments',
  'bims_resident_livelihood_assistance',
  'bims_resident_ayuda_claims',
  'bims_resident_financial_aid',
  'bims_resident_waste_schedules',
  'bims_resident_bulk_waste_requests',
  'bims_resident_cleanup_drives',
  'bims_resident_cleanup_volunteers',
  'bims_resident_illegal_dumping_reports',
  'bims_resident_mrf_drop_records',
  'bims_resident_sk_tournaments',
  'bims_resident_sk_registrations',
  'bims_resident_senior_schedules',
  'bims_resident_assistive_requests',
  'bims_resident_facilities',
  'bims_resident_equipment',
  'bims_resident_incidents',
  'bims_resident_lupon',
  'bims_resident_health_appts',
  'bims_resident_child_vax',
  'bims_resident_rx_refills',
  'bims_resident_job_apps',
  'bims_resident_livelihoods',
  'bims_resident_ayuda_stubs',
  'bims_resident_fin_assistance',
  'bims_resident_bulk_waste',
  'bims_resident_volunteers',
];

/**
 * Purges any obsolete application data keys from localStorage so nothing ever
 * reads stale records or acts as a local cache for real Supabase data.
 * Also removes persistent auth sessions so closing the browser requires logging in again.
 */
export function purgeLegacyAppStorageData(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // Purge prefixed and non-prefixed obsolete keys
    for (const key of OBSOLETE_APP_DATA_KEYS) {
      try {
        window.localStorage.removeItem(key);
        window.localStorage.removeItem(STORAGE_KEY_PREFIX + key);
        memoryStore.delete(key);
        memoryStore.delete(STORAGE_KEY_PREFIX + key);
      } catch {
        // continue
      }
    }

    // Explicitly purge legacy auth items from localStorage
    window.localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_session');
    window.localStorage.removeItem(STORAGE_KEY_PREFIX + 'current_user_id');
    window.localStorage.removeItem('auth_session');
    window.localStorage.removeItem('current_user_id');

    // Remove any persistent Supabase auth tokens stored in localStorage
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith('sb-') && k.endsWith('-auth-token'))) {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

// Automatically purge legacy data keys on script evaluation
purgeLegacyAppStorageData();

/**
 * Checks if localStorage is actually functional and accessible
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__bims_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const localStorageAvailable = typeof window !== 'undefined' && isLocalStorageAvailable();

/**
 * Safely retrieves an item from localStorage or in-memory fallback
 */
export function safeGetItem(key: string): string | null {
  try {
    if (localStorageAvailable) {
      const value = window.localStorage.getItem(key);
      if (value !== null) return value;
    }
  } catch {
    // Ignore error, fallback to memoryStore
  }
  return memoryStore.get(key) ?? null;
}

/**
 * Attempts to clear non-critical data when quota is exceeded
 */
function attemptQuotaRecovery(): void {
  if (!localStorageAvailable) return;

  try {
    // 1. Purge any legacy app data keys if they exist
    purgeLegacyAppStorageData();

    // 2. Remove non-critical temporary UI keys
    const nonCriticalKeys = [
      STORAGE_KEY_PREFIX + 'read_notif_ids',
      STORAGE_KEY_PREFIX + 'dismissed_notif_ids',
      'barangay_bims_remembered_user',
      'barangay_bims_otp_session',
    ];

    for (const k of nonCriticalKeys) {
      try {
        window.localStorage.removeItem(k);
      } catch {
        // continue
      }
    }
  } catch {
    // Quota recovery failed, will gracefully fall back to memory
  }
}

/**
 * Safely saves an item to localStorage with automatic memory fallback on QuotaExceededError
 */
export function safeSetItem(key: string, value: string): boolean {
  // Always update in-memory store so it remains synchronized
  memoryStore.set(key, value);

  if (!localStorageAvailable) return true;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    // Check for QuotaExceededError or generic storage exception
    if (
      e?.name === 'QuotaExceededError' ||
      e?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e?.code === 22 ||
      e?.code === 1014 ||
      (e?.message && e.message.includes('exceeded the quota'))
    ) {
      // Try to recover storage space by trimming non-critical items
      attemptQuotaRecovery();

      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch {
        // Quota is still exceeded; graceful fallback to in-memory store
        // Do NOT call console.error so error trackers don't raise uncaught alerts
        return false;
      }
    }

    // For any other storage error, fallback to in-memory store silently
    return false;
  }
}

/**
 * Safely removes an item from localStorage and memoryStore
 */
export function safeRemoveItem(key: string): void {
  memoryStore.delete(key);
  try {
    if (localStorageAvailable) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore error
  }
}

/**
 * Safely clears all application keys from localStorage and memoryStore
 */
export function safeClear(prefix = STORAGE_KEY_PREFIX): void {
  memoryStore.clear();
  try {
    if (localStorageAvailable) {
      if (!prefix) {
        window.localStorage.clear();
      } else {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            keysToRemove.push(k);
          }
        }
        for (const k of keysToRemove) {
          window.localStorage.removeItem(k);
        }
      }
    }
  } catch {
    // Ignore error
  }
}

/**
 * Checks if sessionStorage is functional and accessible
 */
function isSessionStorageAvailable(): boolean {
  try {
    const testKey = '__bims_session_test__';
    window.sessionStorage.setItem(testKey, '1');
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const sessionStorageAvailable = typeof window !== 'undefined' && isSessionStorageAvailable();

/**
 * Safely retrieves an item from sessionStorage or memorySessionStore.
 * Used for authentication and active session states that must automatically
 * expire and return to the login portal when the browser is closed.
 */
export function safeGetSessionItem(key: string): string | null {
  try {
    if (sessionStorageAvailable) {
      const val = window.sessionStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // Ignore error, fallback to memorySessionStore
  }
  return memorySessionStore.get(key) ?? null;
}

/**
 * Safely saves an item to sessionStorage with in-memory fallback.
 */
export function safeSetSessionItem(key: string, value: string): boolean {
  memorySessionStore.set(key, value);
  try {
    if (sessionStorageAvailable) {
      window.sessionStorage.setItem(key, value);
      return true;
    }
  } catch {
    // Ignore error, stored in memorySessionStore
  }
  return false;
}

/**
 * Safely removes an item from sessionStorage and memorySessionStore.
 */
export function safeRemoveSessionItem(key: string): void {
  memorySessionStore.delete(key);
  try {
    if (sessionStorageAvailable) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore error
  }
}

/**
 * Safely clears all session keys from sessionStorage and memorySessionStore.
 */
export function safeClearSession(): void {
  memorySessionStore.clear();
  try {
    if (sessionStorageAvailable) {
      window.sessionStorage.clear();
    }
  } catch {
    // Ignore error
  }
}

/**
 * Safe loader helper for UI preferences with deep fallback merging.
 * NOTE: Never use this for real app records (residents, users, blotters, etc.);
 * all primary application data is loaded exclusively from Supabase.
 */
export function loadState<T>(key: string, fallback: T, prefix = STORAGE_KEY_PREFIX): T {
  try {
    const fullKey = prefix + key;
    const item = safeGetItem(fullKey);
    if (!item) return fallback;

    const parsed = JSON.parse(item);

    if (typeof fallback === 'object' && fallback !== null && !Array.isArray(fallback)) {
      return { ...fallback, ...parsed };
    }
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Safe state saver for UI preferences.
 * NOTE: Never use this for real app records (residents, users, blotters, etc.);
 * all primary application data is persisted exclusively to Supabase.
 */
export function saveState<T>(
  key: string,
  data: T,
  prefix = STORAGE_KEY_PREFIX,
  options?: { maxItems?: number }
): void {
  try {
    let payload = data;

    // Prune oversized arrays to prevent storage bloating
    if (Array.isArray(data) && options?.maxItems && data.length > options.maxItems) {
      payload = (data as any[]).slice(0, options.maxItems) as unknown as T;
    }

    const fullKey = prefix + key;
    const json = JSON.stringify(payload);
    safeSetItem(fullKey, json);
  } catch {
    // Ignore error, safeSetItem already handled in-memory persistence
  }
}
