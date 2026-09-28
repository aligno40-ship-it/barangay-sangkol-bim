import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { evaluatePasswordStrength, generateStrongPassword, PasswordEvaluationResult } from '../utils/security';

export interface PasswordSecurityFieldProps {
  password?: string;
  value?: string;
  onChange: (password: string) => void;
  confirmPassword?: string;
  onConfirmChange?: (confirmPassword: string) => void;
  showConfirm?: boolean;
  label?: string;
  confirmLabel?: string;
  placeholder?: string;
  confirmPlaceholder?: string;
  username?: string;
  fullName?: string;
  id?: string;
  context?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  required?: boolean;
  showGenerator?: boolean;
  showCriteriaChecklist?: boolean;
  onValidationChange?: (isValid: boolean, evaluation: PasswordEvaluationResult) => void;
  onValidityChange?: (isValid: boolean, evaluation: PasswordEvaluationResult) => void;
  idPrefix?: string;
  className?: string;
}

export const PasswordSecurityField: React.FC<PasswordSecurityFieldProps> = ({
  password: propPassword,
  value: propValue,
  onChange,
  confirmPassword = '',
  onConfirmChange,
  showConfirm = false,
  label = 'Password',
  confirmLabel = 'Confirm Password',
  placeholder = 'Enter strong password (8+ characters)',
  confirmPlaceholder = 'Re-enter password to confirm',
  username,
  fullName,
  id,
  context: propContext,
  required = true,
  showGenerator = true,
  showCriteriaChecklist = true,
  onValidationChange,
  onValidityChange,
  idPrefix: propIdPrefix,
  className = '',
}) => {
  const password = propValue !== undefined ? propValue : (propPassword || '');
  const idPrefix = id || propIdPrefix || 'pwd';
  const effectiveValidationChange = onValidationChange || onValidityChange;

  // Keep a stable ref to callback to prevent triggering re-renders when parent provides inline function
  const validationChangeRef = useRef(effectiveValidationChange);
  useEffect(() => {
    validationChangeRef.current = effectiveValidationChange;
  });

  // Extract primitive properties from context to avoid re-evaluating when an inline object literal is passed
  const ctxUsername = propContext?.username ?? username;
  const ctxFirstName = propContext?.firstName;
  const ctxLastName = propContext?.lastName;
  const ctxEmail = propContext?.email;

  const context = useMemo(() => {
    if (propContext) {
      return {
        username: ctxUsername,
        firstName: ctxFirstName,
        lastName: ctxLastName,
        email: ctxEmail,
      };
    }
    if (username || fullName) {
      const parts = (fullName || '').split(' ');
      return {
        username,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
      };
    }
    return undefined;
  }, [ctxUsername, ctxFirstName, ctxLastName, ctxEmail, username, fullName, propContext]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const evaluation = useMemo(() => {
    return evaluatePasswordStrength(password, context);
  }, [password, context]);

  const passwordsMatch = useMemo(() => {
    if (!showConfirm) return true;
    if (!confirmPassword) return false;
    return password === confirmPassword;
  }, [password, confirmPassword, showConfirm]);

  // Track last reported validation state to prevent duplicate state updates in parents
  const lastReportedRef = useRef<{
    valid?: boolean;
    score?: number;
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    const overallValid = evaluation.isValid && (!showConfirm || passwordsMatch);
    const prev = lastReportedRef.current;

    // Only invoke parent callback when validation status, score, or password value actually changes
    if (
      prev.valid !== overallValid ||
      prev.score !== evaluation.score ||
      prev.password !== password ||
      prev.confirmPassword !== confirmPassword
    ) {
      lastReportedRef.current = {
        valid: overallValid,
        score: evaluation.score,
        password,
        confirmPassword,
      };

      if (validationChangeRef.current) {
        validationChangeRef.current(overallValid, evaluation);
      }
    }
  }, [evaluation.isValid, evaluation.score, passwordsMatch, showConfirm, password, confirmPassword]);

  const handleGenerate = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const newPass = generateStrongPassword({ length: 14, includeSpecial: true, includeNumbers: true });
    onChange(newPass);
    if (showConfirm && onConfirmChange) {
      onConfirmChange(newPass);
    }
    setShowPassword(true);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(newPass).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const getStrengthBarWidth = () => {
    if (!password) return '0%';
    return `${Math.max(8, evaluation.score)}%`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Password Input Group */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor={`${idPrefix}-input`}
            className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-700" />
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>

          {showGenerator && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleGenerate}
                id={`${idPrefix}-generate-btn`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                title="Generate an ultra-secure 14-character password"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Auto-Generate Secure</span>
              </button>
              {copied && (
                <span className="text-[10px] font-bold text-emerald-600 animate-in fade-in flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Copied!
                </span>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <KeyRound className="w-4 h-4" />
          </div>
          <input
            id={`${idPrefix}-input`}
            type={showPassword ? 'text' : 'password'}
            required={required}
            value={password}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className={`w-full pl-9 pr-10 py-2.5 bg-slate-50/80 border rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 ${
              password.length > 0
                ? evaluation.isValid
                  ? 'border-emerald-300 focus:ring-emerald-500'
                  : 'border-amber-300 focus:ring-amber-500'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          />
          <button
            type="button"
            id={`${idPrefix}-toggle-visibility`}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Real-Time Password Strength Meter */}
        {password.length > 0 && (
          <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <span>Strength:</span>
                <span className={`font-bold ${evaluation.color}`}>
                  {evaluation.label} ({evaluation.score}%)
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ~{evaluation.entropyBits} bits entropy
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 rounded-full ${evaluation.bgColor}`}
                style={{ width: getStrengthBarWidth() }}
              />
            </div>
          </div>
        )}

        {/* Dynamic Criteria Checklist */}
        {showCriteriaChecklist && (isFocused || password.length > 0) && (
          <div className="p-3 bg-slate-50/90 border border-slate-200 rounded-xl space-y-1.5 animate-in fade-in duration-200 mt-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              <span>Security Requirements</span>
              {evaluation.isValid ? (
                <span className="text-emerald-700 flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Requirement Met
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-1 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" /> High-Security Policy
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 pt-0.5">
              {evaluation.rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                    rule.passed ? 'text-emerald-700 font-medium' : 'text-slate-400'
                  }`}
                >
                  {rule.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  )}
                  <span>{rule.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Optional Confirm Password Input */}
      {showConfirm && onConfirmChange && (
        <div className="space-y-1.5 pt-1">
          <label
            htmlFor={`${idPrefix}-confirm-input`}
            className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-700" />
            <span>{confirmLabel}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              id={`${idPrefix}-confirm-input`}
              type={showConfirmPassword ? 'text' : 'password'}
              required={required}
              value={confirmPassword}
              onChange={(e) => onConfirmChange(e.target.value)}
              placeholder={confirmPlaceholder}
              className={`w-full pl-9 pr-10 py-2.5 bg-slate-50/80 border rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 ${
                confirmPassword.length > 0
                  ? passwordsMatch
                    ? 'border-emerald-300 focus:ring-emerald-500'
                    : 'border-rose-300 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-emerald-500'
              }`}
            />
            <button
              type="button"
              id={`${idPrefix}-toggle-confirm-visibility`}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {confirmPassword.length > 0 && (
            <div className="text-[11px] font-medium pt-0.5 animate-in fade-in">
              {passwordsMatch ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Passwords match perfectly
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" /> Passwords do not match
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
