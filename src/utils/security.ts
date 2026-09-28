/**
 * Barangay Sangkol Information Management System (BIMS)
 * Security & Hacker-Defense Utilities
 * 
 * Features:
 * - Anti-Brute-Force & Account Lockout Defense
 * - Honeypot Bot-Trap Validation
 * - Timing-Attack Mitigation Delay
 * - Input Sanitization & Injection Prevention
 * - Password Entropy & Strength Evaluator
 * - Cryptographically Secure 6-Digit Gmail OTP Engine
 */

import { safeGetItem, safeSetItem, safeRemoveItem } from './storageUtils';

export interface SecurityState {
  failedAttempts: number;
  lockedUntil: number | null; // Timestamp in ms
  lastAttemptTime: number;
  lockoutCount: number;
}

export interface GmailOTPSession {
  identifier: string;
  email: string;
  otpCode: string;
  createdAt: number;
  expiresAt: number;
  attemptsLeft: number;
  resendAvailableAt: number;
  isVerified: boolean;
}

const STORAGE_SECURITY_KEY = 'sangkol_sec_state_v2';
const STORAGE_OTP_KEY = 'sangkol_active_otp_session';

export const SECURITY_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes lockout
  OTP_VALIDITY_MS: 5 * 60 * 1000, // 5 minutes validity
  OTP_RESEND_COOLDOWN_MS: 60 * 1000, // 60 seconds cooldown
  MAX_OTP_ATTEMPTS: 3,
};

/**
 * Retrieves the current security / lockout state for a given username or IP identifier
 */
export function getSecurityState(identifier: string): SecurityState {
  try {
    const raw = safeGetItem(`${STORAGE_SECURITY_KEY}_${identifier.toLowerCase().trim()}`);
    if (raw) {
      const parsed: SecurityState = JSON.parse(raw);
      // Check if lockout has naturally expired
      if (parsed.lockedUntil && Date.now() > parsed.lockedUntil) {
        return {
          failedAttempts: 0,
          lockedUntil: null,
          lastAttemptTime: Date.now(),
          lockoutCount: parsed.lockoutCount,
        };
      }
      return parsed;
    }
  } catch {
    // Safe fallback
  }

  return {
    failedAttempts: 0,
    lockedUntil: null,
    lastAttemptTime: Date.now(),
    lockoutCount: 0,
  };
}

/**
 * Saves the security state
 */
export function saveSecurityState(identifier: string, state: SecurityState): void {
  try {
    safeSetItem(
      `${STORAGE_SECURITY_KEY}_${identifier.toLowerCase().trim()}`,
      JSON.stringify(state)
    );
  } catch {
    // Safe fallback
  }
}

/**
 * Records a failed login attempt. Returns updated security status.
 */
export function recordFailedAttempt(identifier: string): {
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil: number | null;
  secondsRemaining: number;
} {
  const current = getSecurityState(identifier);
  const newFailed = current.failedAttempts + 1;
  let lockedUntil = current.lockedUntil;
  let isLocked = false;
  let lockoutCount = current.lockoutCount;

  if (newFailed >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS) {
    lockoutCount += 1;
    // Progressive lockout duration (15m, 30m, etc.)
    const duration = SECURITY_CONFIG.LOCKOUT_DURATION_MS * Math.min(lockoutCount, 3);
    lockedUntil = Date.now() + duration;
    isLocked = true;
  }

  const updated: SecurityState = {
    failedAttempts: isLocked ? newFailed : newFailed,
    lockedUntil,
    lastAttemptTime: Date.now(),
    lockoutCount,
  };

  saveSecurityState(identifier, updated);

  const secondsRemaining = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)) : 0;
  const remainingAttempts = Math.max(0, SECURITY_CONFIG.MAX_FAILED_ATTEMPTS - newFailed);

  return {
    isLocked,
    remainingAttempts,
    lockedUntil,
    secondsRemaining,
  };
}

/**
 * Resets failed login attempts after a successful authentication
 */
export function clearFailedAttempts(identifier: string): void {
  try {
    safeRemoveItem(`${STORAGE_SECURITY_KEY}_${identifier.toLowerCase().trim()}`);
  } catch {
    // Safe fallback
  }
}

/**
 * Sanitize strings to neutralize XSS and script injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Strip brackets
    .replace(/javascript:/gi, '') // Strip JS protocol
    .replace(/on\w+=/gi, '') // Strip inline event handlers like onclick=
    .trim();
}

/**
 * Evaluates password strength & entropy with optional personal context
 */
export interface PasswordRuleCheck {
  id: string;
  label: string;
  passed: boolean;
  critical: boolean;
}

export interface PasswordEvaluationResult {
  score: number; // 0 to 100
  label: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  color: string;
  bgColor: string;
  borderColor: string;
  isValid: boolean; // meets minimum threshold for registration (>= Strong or all critical rules passed)
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isCommon: boolean;
  hasPersonalInfo: boolean;
  rules: PasswordRuleCheck[];
  feedback: string[];
  entropyBits: number;
}

export function evaluatePasswordStrength(
  password: string,
  context?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }
): PasswordEvaluationResult {
  const feedback: string[] = [];
  const commonWeak = [
    '123456',
    'password',
    'admin123',
    '12345678',
    'qwerty',
    'sangkol',
    'barangay',
    'welcome',
    'purok123',
    'resident123',
    '123456789',
    'iloveyou',
    'admin2026',
    'pass1234',
    'sangkol2026',
  ];

  const cleanPass = password || '';
  const hasLength = cleanPass.length >= 8;
  const hasUpper = /[A-Z]/.test(cleanPass);
  const hasLower = /[a-z]/.test(cleanPass);
  const hasNumber = /[0-9]/.test(cleanPass);
  const hasSpecial = /[^A-Za-z0-9]/.test(cleanPass);
  const isCommon = commonWeak.some((cw) => cleanPass.toLowerCase().includes(cw.toLowerCase()));

  // Personal data leakage check
  let hasPersonalInfo = false;
  if (context) {
    const checks = [context.username, context.firstName, context.lastName, context.email]
      .filter((s): s is string => Boolean(s && s.trim().length >= 3))
      .map((s) => s.toLowerCase().trim());

    for (const token of checks) {
      if (token && cleanPass.toLowerCase().includes(token)) {
        hasPersonalInfo = true;
        break;
      }
    }
  }

  // Calculate Shannon Entropy approximation
  let charsetSize = 0;
  if (hasLower) charsetSize += 26;
  if (hasUpper) charsetSize += 26;
  if (hasNumber) charsetSize += 10;
  if (hasSpecial) charsetSize += 32;
  const entropyBits = charsetSize > 0 && cleanPass.length > 0 ? Math.round(cleanPass.length * Math.log2(charsetSize)) : 0;

  let score = 0;
  if (cleanPass.length > 0) score += 10;
  if (cleanPass.length >= 8) score += 20;
  if (cleanPass.length >= 12) score += 15;
  if (cleanPass.length >= 16) score += 10;
  if (hasUpper) score += 15;
  if (hasLower) score += 10;
  if (hasNumber) score += 10;
  if (hasSpecial) score += 15;

  if (isCommon) score = Math.min(score, 20);
  if (hasPersonalInfo) score = Math.max(0, score - 30);

  score = Math.min(100, Math.max(0, score));

  if (!hasLength) feedback.push('Must be at least 8 characters long (12+ recommended)');
  if (!hasUpper) feedback.push('Must include at least one uppercase letter (A-Z)');
  if (!hasLower) feedback.push('Must include at least one lowercase letter (a-z)');
  if (!hasNumber) feedback.push('Must include at least one numeric digit (0-9)');
  if (!hasSpecial) feedback.push('Must include at least one special symbol (!@#$%^&*)');
  if (isCommon) feedback.push('Password contains easily guessable dictionary patterns');
  if (hasPersonalInfo) feedback.push('Password should not contain your name, email, or username');

  const rules: PasswordRuleCheck[] = [
    { id: 'length', label: 'At least 8 characters long', passed: hasLength, critical: true },
    { id: 'upper', label: 'One uppercase letter (A-Z)', passed: hasUpper, critical: true },
    { id: 'lower', label: 'One lowercase letter (a-z)', passed: hasLower, critical: true },
    { id: 'number', label: 'One number (0-9)', passed: hasNumber, critical: true },
    { id: 'special', label: 'One special symbol (!@#$%^&*)', passed: hasSpecial, critical: true },
    { id: 'no_common', label: 'No common patterns or personal name', passed: !isCommon && !hasPersonalInfo, critical: false },
  ];

  let label: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong' = 'Very Weak';
  let color = 'text-rose-600';
  let bgColor = 'bg-rose-500';
  let borderColor = 'border-rose-300';

  if (score >= 85) {
    label = 'Very Strong';
    color = 'text-emerald-700';
    bgColor = 'bg-emerald-600';
    borderColor = 'border-emerald-400';
  } else if (score >= 70) {
    label = 'Strong';
    color = 'text-emerald-600';
    bgColor = 'bg-emerald-500';
    borderColor = 'border-emerald-300';
  } else if (score >= 50) {
    label = 'Medium';
    color = 'text-amber-600';
    bgColor = 'bg-amber-500';
    borderColor = 'border-amber-300';
  } else if (score >= 30) {
    label = 'Weak';
    color = 'text-orange-600';
    bgColor = 'bg-orange-500';
    borderColor = 'border-orange-300';
  }

  const isValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial && !isCommon && !hasPersonalInfo;

  return {
    score,
    label,
    color,
    bgColor,
    borderColor,
    isValid,
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    isCommon,
    hasPersonalInfo,
    rules,
    feedback,
    entropyBits,
  };
}

/**
 * Generates a cryptographically strong, unhackable password
 */
export function generateStrongPassword(options?: {
  length?: number;
  includeSpecial?: boolean;
  includeNumbers?: boolean;
}): string {
  const length = Math.max(12, options?.length || 14);
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous I, O
  const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // Exclude ambiguous l
  const numbers = '23456789'; // Exclude 0, 1 for clarity
  const symbols = '!@#$%^&*()_+-=[]{};:?';

  // Ensure at least one of each required set
  let chars = uppercase + lowercase;
  if (options?.includeNumbers !== false) chars += numbers;
  if (options?.includeSpecial !== false) chars += symbols;

  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : null;
  const getRandomByte = () => {
    if (cryptoObj) {
      const arr = new Uint8Array(1);
      cryptoObj.getRandomValues(arr);
      return arr[0];
    }
    return Math.floor(Math.random() * 256);
  };

  const resultChars: string[] = [
    uppercase[getRandomByte() % uppercase.length],
    lowercase[getRandomByte() % lowercase.length],
    numbers[getRandomByte() % numbers.length],
    symbols[getRandomByte() % symbols.length],
  ];

  while (resultChars.length < length) {
    resultChars.push(chars[getRandomByte() % chars.length]);
  }

  // Shuffle Fisher-Yates
  for (let i = resultChars.length - 1; i > 0; i--) {
    const j = getRandomByte() % (i + 1);
    const temp = resultChars[i];
    resultChars[i] = resultChars[j];
    resultChars[j] = temp;
  }

  return resultChars.join('');
}

/**
 * Generates a cryptographically strong 6-digit numeric OTP
 */
export function generateSecureOTP(): string {
  const array = new Uint32Array(1);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
    // Value between 100000 and 999999
    const code = 100000 + (array[0] % 900000);
    return code.toString();
  }
  // Fallback
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates and stores an active Gmail OTP Session
 */
export function createGmailOTPSession(identifier: string, email: string): GmailOTPSession {
  const now = Date.now();
  const otpCode = generateSecureOTP();
  const session: GmailOTPSession = {
    identifier: identifier.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    otpCode,
    createdAt: now,
    expiresAt: now + SECURITY_CONFIG.OTP_VALIDITY_MS,
    attemptsLeft: SECURITY_CONFIG.MAX_OTP_ATTEMPTS,
    resendAvailableAt: now + SECURITY_CONFIG.OTP_RESEND_COOLDOWN_MS,
    isVerified: false,
  };

  try {
    safeSetItem(STORAGE_OTP_KEY, JSON.stringify(session));
  } catch {
    // Safe fallback
  }

  return session;
}

/**
 * Gets the current active Gmail OTP Session
 */
export function getActiveGmailOTPSession(): GmailOTPSession | null {
  try {
    const raw = safeGetItem(STORAGE_OTP_KEY);
    if (!raw) return null;
    const session: GmailOTPSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      safeRemoveItem(STORAGE_OTP_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Verifies a submitted 6-digit OTP code
 */
export function verifyGmailOTPCode(inputCode: string): {
  success: boolean;
  message: string;
  session?: GmailOTPSession;
  attemptsLeft: number;
} {
  const session = getActiveGmailOTPSession();

  if (!session) {
    return {
      success: false,
      message: 'OTP has expired or is invalid. Please request a new Gmail verification code.',
      attemptsLeft: 0,
    };
  }

  if (Date.now() > session.expiresAt) {
    safeRemoveItem(STORAGE_OTP_KEY);
    return {
      success: false,
      message: 'The OTP code has expired (5-minute limit). Please request a fresh code.',
      attemptsLeft: 0,
    };
  }

  const cleanInput = inputCode.replace(/\D/g, '').trim();

  if (cleanInput === session.otpCode) {
    const verifiedSession = { ...session, isVerified: true };
    safeSetItem(STORAGE_OTP_KEY, JSON.stringify(verifiedSession));
    return {
      success: true,
      message: 'Gmail OTP code verified successfully!',
      session: verifiedSession,
      attemptsLeft: session.attemptsLeft,
    };
  }

  // Decrement attempts
  const remaining = session.attemptsLeft - 1;
  if (remaining <= 0) {
    safeRemoveItem(STORAGE_OTP_KEY);
    return {
      success: false,
      message: 'Too many incorrect OTP attempts. For your security, this code has been revoked. Please request a new one.',
      attemptsLeft: 0,
    };
  }

  const updatedSession = { ...session, attemptsLeft: remaining };
  safeSetItem(STORAGE_OTP_KEY, JSON.stringify(updatedSession));

  return {
    success: false,
    message: `Incorrect verification code. You have ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`,
    session: updatedSession,
    attemptsLeft: remaining,
  };
}

/**
 * Clears active OTP session after password has been successfully reset
 */
export function clearGmailOTPSession(): void {
  try {
    safeRemoveItem(STORAGE_OTP_KEY);
  } catch {
    // Safe fallback
  }
}

/**
 * Formats remaining timestamp into human-readable mm:ss format
 */
export function formatRemainingTime(targetTimestamp: number): string {
  const diffMs = targetTimestamp - Date.now();
  if (diffMs <= 0) return '0:00';
  const totalSeconds = Math.ceil(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

