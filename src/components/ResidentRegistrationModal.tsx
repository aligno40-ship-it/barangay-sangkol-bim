import React, { useState, useMemo, useCallback } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { ResidentRegistrationInput, Sex, CivilStatus } from '../types';
import { BarangaySangkolSeal } from './OfficialSeals';
import { AVATAR_PRESETS } from '../utils/imageUtils';
import { PasswordSecurityField } from './PasswordSecurityField';
import { FaceVerificationModal } from './FaceVerificationModal';
import { evaluatePasswordStrength, PasswordEvaluationResult } from '../utils/security';
import {
  PHILIPPINE_RELIGIONS,
  CITIZENSHIP_OPTIONS,
  BLOOD_TYPES,
  EDUCATIONAL_ATTAINMENTS,
  PWD_TYPES,
} from '../utils/civilRegistryConstants';
import {
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Upload,
  Camera,
  Search,
  Sparkles,
  Info,
  ArrowRight,
  Loader2,
  Building,
  Check,
  HelpCircle,
  Scan,
  RefreshCw,
} from 'lucide-react';

interface ResidentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (registeredUsername: string) => void;
}

const VALID_ID_TYPES = [
  'PhilSys National ID',
  "Driver's License",
  "COMELEC Voter's ID / Certification",
  'Postal ID (Digitized)',
  'Philippine Passport',
  'UMID / SSS / GSIS Card',
  'Senior Citizen ID',
  'Person with Disability (PWD) ID',
  'Student ID (School Year 2025-2026)',
  'Barangay Resident ID Card',
];

const SECURITY_QUESTIONS = [
  'What is your registered Purok in Barangay Sangkol?',
  'What was the name of your elementary school?',
  'What is your mother’s maiden name?',
  'What is your favorite native fruit in Sangkol?',
  'What is the street name where you grew up?',
];

export const ResidentRegistrationModal: React.FC<ResidentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { registerResidentAccount, checkResidentMatch, settings, residents } = useBarangay();

  // Form State
  const [formData, setFormData] = useState<ResidentRegistrationInput>({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    purok: settings.puroks[0] || 'Purok Pinya',
    streetAddress: '',
    householdNo: '',
    birthDate: '1995-01-01',
    sex: 'Female',
    civilStatus: 'Single',
    citizenship: 'Filipino',
    religion: 'Roman Catholic',
    bloodType: 'O+',
    educationalAttainment: 'High School Graduate',
    occupation: '',
    monthlyIncome: 0,
    voterStatus: 'Registered',
    precinctNo: '',
    isHouseholdHead: false,
    isSeniorCitizen: false,
    isPWD: false,
    pwdType: '',
    is4PsBeneficiary: false,
    isSoloParent: false,
    isIndigent: false,
    emergencyContactName: '',
    emergencyContactNumber: '',
    contactNumber: '',
    email: '',
    username: '',
    password: '',
    validIdType: 'PhilSys National ID',
    validIdNumber: '',
    validIdPhoto: AVATAR_PRESETS[0]?.url || '',
    proofOfResidency: 'Barangay Census Record',
    securityQuestion: SECURITY_QUESTIONS[0],
    securityAnswer: '',
    matchedResidentId: '',
    facePhotoUrl: '',
    faceVerified: false,
    faceConfidenceScore: undefined,
    faceLivenessScore: undefined,
    passwordStrengthScore: 0,
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [passwordEvaluation, setPasswordEvaluation] = useState<PasswordEvaluationResult | null>(null);

  const handlePasswordValidationChange = useCallback((isValid: boolean, evalResult: PasswordEvaluationResult) => {
    setIsPasswordValid(isValid);
    setPasswordEvaluation(evalResult);
  }, []);

  const passwordContext = useMemo(() => ({
    username: formData.username,
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
  }), [formData.username, formData.firstName, formData.lastName, formData.email]);

  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    success: boolean;
    referenceId: string;
    submittedAt: string;
    name: string;
    username: string;
    purok: string;
    matched: boolean;
    matchedResidentName?: string;
    matchedResidentId?: string;
    matchReason?: string;
    faceVerified?: boolean;
  } | null>(null);

  // Real-time civil registry 3-point triangulation match checking
  const matchResult = useMemo(() => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return null;
    return checkResidentMatch({
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      suffix: formData.suffix,
      birthDate: formData.birthDate,
      contactNumber: formData.contactNumber,
      householdNo: formData.householdNo,
      validIdNumber: formData.validIdNumber,
      email: formData.email,
      purok: formData.purok,
    });
  }, [
    formData.firstName,
    formData.middleName,
    formData.lastName,
    formData.suffix,
    formData.birthDate,
    formData.contactNumber,
    formData.householdNo,
    formData.validIdNumber,
    formData.email,
    formData.purok,
    checkResidentMatch,
  ]);

  const registryMatch = matchResult?.matchedResident || null;

  if (!isOpen) return null;

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        setCustomAvatarPreview(resultStr);
        setFormData((prev) => ({ ...prev, validIdPhoto: resultStr }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('Please enter your legal first and last name.');
      return;
    }
    if (!formData.birthDate) {
      setErrorMessage('Please provide your date of birth.');
      return;
    }
    if (!formData.streetAddress.trim()) {
      setErrorMessage('Please specify your street address or house number.');
      return;
    }
    if (!formData.contactNumber.trim()) {
      setErrorMessage('Please provide an active mobile contact number.');
      return;
    }
    if (!formData.username.trim() || formData.username.trim().length < 4) {
      setErrorMessage('Username must be at least 4 characters long.');
      return;
    }
    
    // Password Security Enforcement
    const currentEvaluation = evaluatePasswordStrength(formData.password, {
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
    });

    if (!formData.password || !currentEvaluation.isValid) {
      setErrorMessage(
        `Password does not meet required security standards (${currentEvaluation.label}, score: ${currentEvaluation.score}%). Please ensure at least 8 characters with uppercase, lowercase, number, and special symbol.`
      );
      return;
    }
    if (formData.password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password to confirm.');
      return;
    }

    if (matchResult?.matchedResident && matchResult.isAlreadyClaimed) {
      setErrorMessage(
        `This resident record (${matchResult.matchedResident.firstName} ${matchResult.matchedResident.lastName}, ID: ${matchResult.matchedResident.id}) is already linked to user @${matchResult.claimedByUsername}. You cannot register a duplicate account for a claimed record.`
      );
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('Please accept the Barangay Data Privacy & Residency Verification terms.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerResidentAccount({
        ...formData,
        passwordStrengthScore: currentEvaluation.score,
        matchedResidentId: matchResult?.matchedResident?.id,
      });

      setIsLoading(false);

      if (result.success && result.user) {
        setSubmittedResult({
          success: true,
          referenceId: result.user.id,
          submittedAt: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          name: result.user.name,
          username: result.user.username,
          purok: result.user.purok || formData.purok,
          matched: !!matchResult?.matchedResident,
          matchedResidentName: matchResult?.matchedResident ? `${matchResult.matchedResident.firstName} ${matchResult.matchedResident.lastName}` : undefined,
          matchedResidentId: matchResult?.matchedResident?.id,
          matchReason: matchResult?.matchReason,
          faceVerified: Boolean(formData.faceVerified || formData.facePhotoUrl),
        });

        if (onSuccess) {
          onSuccess(result.user.username);
        }
      } else {
        setErrorMessage(result.message || 'Registration failed. Please check your details.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'An unexpected error occurred during registration.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-5 sm:p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-emerald-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-inner">
              <BarangaySangkolSeal size={40} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
                  Resident Only
                </span>
                <span className="text-emerald-300 text-xs flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Requires Admin Verification
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                Barangay Resident Account Registration
              </h2>
              <p className="text-xs text-emerald-100/80">
                Official portal registration for residents of Barangay Sangkol
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {submittedResult ? (
            /* Successful Registration Submitted View */
            <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner border border-amber-200">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-full">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Status: Submitted — Awaiting Admin Approval
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Registration Successfully Submitted!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your resident application has been routed to the Barangay Administrator and Secretary for civil registry verification.
                </p>
              </div>

              {/* Applicant Summary Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2.5 text-xs max-w-md mx-auto shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-medium">Application Reference:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {submittedResult.referenceId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Applicant Name:</span>
                  <span className="font-bold text-slate-900">{submittedResult.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Registered Purok:</span>
                  <span className="font-semibold text-emerald-800">{submittedResult.purok}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Portal Username:</span>
                  <span className="font-mono font-bold text-indigo-700">@{submittedResult.username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Date Submitted:</span>
                  <span className="text-slate-700">{submittedResult.submittedAt}</span>
                </div>

                {submittedResult.matched && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Civil Census match verified! Faster admin approval queue.</span>
                  </div>
                )}
              </div>

              {/* Instructions Notice */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-left text-xs text-blue-900 space-y-1 max-w-md mx-auto">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>What happens next?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  1. The Barangay Administrator verifies your name and address against the official Sangkol census records.
                  <br />
                  2. Once approved, your account will be activated and you can sign in to request clearances, file concerns, and view community services.
                  <br />
                  3. If you try to sign in while pending, the system will remind you of the review status.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Return to Sign In Page
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Official Notice Banner */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-emerald-950 block">
                    Important Resident Notice:
                  </span>
                  This registration is exclusively for <strong>Barangay Sangkol residents</strong>. All new accounts undergo verification by the Barangay Administrator before login is granted. Officials and staff must use the official administration login.
                </div>
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Section 1: Full Legal Name & Civil Profile */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Resident Personal Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="e.g. Maria Clara"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      placeholder="e.g. Santos"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="e.g. Del Rosario"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Suffix
                    </label>
                    <input
                      type="text"
                      value={formData.suffix}
                      onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                      placeholder="Jr., III, etc."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Birth Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Sex <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value as Sex })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Civil Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.civilStatus}
                      onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value as CivilStatus })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Common Law">Common Law</option>
                    </select>
                  </div>
                </div>

                {/* Demographics & Registry Profile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                  {/* Religion */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Religion <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={
                        PHILIPPINE_RELIGIONS.includes(formData.religion as any)
                          ? formData.religion
                          : 'Other / Unspecified'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'Other / Unspecified') {
                          setFormData({ ...formData, religion: val });
                        } else {
                          setFormData({ ...formData, religion: 'Other' });
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {PHILIPPINE_RELIGIONS.map((rel) => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                    {(!PHILIPPINE_RELIGIONS.includes(formData.religion as any) || formData.religion === 'Other / Unspecified' || formData.religion === 'Other') && (
                      <input
                        type="text"
                        placeholder="Specify religion or denomination..."
                        value={formData.religion === 'Other' || formData.religion === 'Other / Unspecified' ? '' : formData.religion}
                        onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                      />
                    )}
                  </div>

                  {/* Citizenship */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Citizenship
                    </label>
                    <select
                      value={formData.citizenship || 'Filipino'}
                      onChange={(e) => setFormData({ ...formData, citizenship: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {CITIZENSHIP_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Blood Type */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Blood Type
                    </label>
                    <select
                      value={formData.bloodType || 'Unknown'}
                      onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer font-bold text-rose-600"
                    >
                      {BLOOD_TYPES.map((bt) => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Educational Attainment */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Educational Attainment
                    </label>
                    <select
                      value={formData.educationalAttainment || 'High School Graduate'}
                      onChange={(e) => setFormData({ ...formData, educationalAttainment: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {EDUCATIONAL_ATTAINMENTS.map((edu) => (
                        <option key={edu} value={edu}>{edu}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Barangay Sangkol Address & Purok */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Barangay Residency & Location</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Purok <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.purok}
                      onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                      className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-950 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {settings.puroks.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Street / House Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.streetAddress}
                      onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                      placeholder="e.g. 142 Mango Avenue"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Household ID / No. <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.householdNo || ''}
                      onChange={(e) => setFormData({ ...formData, householdNo: e.target.value, householdId: e.target.value })}
                      placeholder="e.g. HH-2024-001"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Civil Registry 3-Point Triangulation Match Preview */}
                {matchResult?.matchedResident ? (
                  matchResult.isAlreadyClaimed ? (
                    <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-900 space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5 text-rose-950">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Census Record Already Claimed</span>
                        </span>
                        <span className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded-lg text-[10px]">
                          Already Linked
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-800 leading-relaxed">
                        Census record for <strong>{matchResult.matchedResident.firstName} {matchResult.matchedResident.lastName}</strong> (ID: {matchResult.matchedResident.id}) is already claimed by user account <strong className="font-mono text-rose-900">@{matchResult.claimedByUsername}</strong>. You cannot create a duplicate login for an already registered resident.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-emerald-950">
                            Census Record Matched: {matchResult.matchedResident.firstName} {matchResult.matchedResident.lastName}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-700 text-white font-bold rounded-lg text-[10px]">
                          {matchResult.confidence}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-800">
                        <span>Resident ID: <strong className="text-emerald-950">{matchResult.matchedResident.id}</strong></span>
                        <span>•</span>
                        <span>Registered: <strong>{matchResult.matchedResident.purok}</strong></span>
                        <span>•</span>
                        <span>DOB: <strong>{matchResult.matchedResident.birthDate}</strong></span>
                      </div>
                      <p className="text-[11px] text-emerald-700 leading-relaxed pt-0.5">
                        ✓ <em>Triangulation: {matchResult.matchReason}</em>. Submitting will flag this request for Admin Review to link your new login account directly to this census record without creating a duplicate.
                      </p>
                    </div>
                  )
                ) : formData.firstName.trim() && formData.lastName.trim() ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-700 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="font-semibold block text-slate-900 text-[11px]">
                          New Resident Request (No existing census match found)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Approving this request will create a new official resident record in Barangay Sangkol.
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold rounded-md text-[10px]">
                      New Record
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Section 3: Civil, Livelihood & Sectoral Classification */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Livelihood, Sectoral & Voter Status</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Occupation / Livelihood
                    </label>
                    <input
                      type="text"
                      value={formData.occupation || ''}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      placeholder="e.g. Farmer, Carpenter, Teacher"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Monthly Income (₱)
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyIncome || 0}
                      onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sectoral tags */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="block text-[11px] font-bold text-slate-700">Sectoral Classification & Benefits</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isSeniorCitizen || false}
                        onChange={(e) => setFormData({ ...formData, isSeniorCitizen: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Senior Citizen (60+)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPWD || false}
                        onChange={(e) => setFormData({ ...formData, isPWD: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>PWD</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is4PsBeneficiary || false}
                        onChange={(e) => setFormData({ ...formData, is4PsBeneficiary: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>4Ps Beneficiary</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isSoloParent || false}
                        onChange={(e) => setFormData({ ...formData, isSoloParent: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Solo Parent</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isIndigent || false}
                        onChange={(e) => setFormData({ ...formData, isIndigent: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Indigent</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isHouseholdHead || false}
                        onChange={(e) => setFormData({ ...formData, isHouseholdHead: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Household Head</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer col-span-2 sm:col-span-1">
                      <input
                        type="checkbox"
                        checked={formData.voterStatus === 'Registered'}
                        onChange={(e) => setFormData({ ...formData, voterStatus: e.target.checked ? 'Registered' : 'Unregistered' })}
                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Registered Voter</span>
                    </label>
                  </div>

                  {formData.isPWD && (
                    <div className="pt-2 border-t border-slate-200">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">PWD Disability Classification</label>
                      <select
                        value={formData.pwdType || PWD_TYPES[0]}
                        onChange={(e) => setFormData({ ...formData, pwdType: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      >
                        {PWD_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.voterStatus === 'Registered' && (
                    <div className="pt-2 border-t border-slate-200">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Precinct Number / Cluster</label>
                      <input
                        type="text"
                        value={formData.precinctNo || ''}
                        onChange={(e) => setFormData({ ...formData, precinctNo: e.target.value })}
                        placeholder="e.g. 0042A"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Contact, Emergency Contact & Government ID Verification */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4. Contact, Emergency Contact & ID Verification</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        placeholder="0917-000-0000"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Email Address (Optional for notifications)
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Emergency Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContactName || ''}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      placeholder="e.g. Maria Dela Cruz"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContactNumber || ''}
                      onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
                      placeholder="0917-xxx-xxxx"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Valid Government ID Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.validIdType}
                      onChange={(e) => setFormData({ ...formData, validIdType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {VALID_ID_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Valid ID / Certificate Number
                    </label>
                    <input
                      type="text"
                      value={formData.validIdNumber}
                      onChange={(e) => setFormData({ ...formData, validIdNumber: e.target.value })}
                      placeholder="e.g. PH-9821-4402-1193"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Profile Photo / Biometric Face ID Verification */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Scan className="w-4 h-4 text-emerald-600" />
                        <span>Biometric Face Verification & ID Photo</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Liveness Check
                        </span>
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Scan your face using your camera for secure instant facial recognition sign-in.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFaceModalOpen(true)}
                      className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{formData.faceVerified ? 'Re-scan Face' : 'Scan Live Face'}</span>
                    </button>
                  </div>

                  {formData.facePhotoUrl ? (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm shrink-0">
                          <img
                            src={formData.facePhotoUrl}
                            alt="Face Biometric Scan"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-emerald-500/10" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Biometric Face Scan Verified</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-emerald-700 mt-0.5">
                            <span>Liveness: <strong>{formData.faceLivenessScore || 98}%</strong></span>
                            <span>•</span>
                            <span>Quality: <strong>Optimal</strong></span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsFaceModalOpen(true)}
                        className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-slate-500 mr-1">Or choose preset:</span>
                      {AVATAR_PRESETS.slice(0, 5).map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCustomAvatarPreview(null);
                            setFormData({
                              ...formData,
                              validIdPhoto: preset.url,
                              facePhotoUrl: preset.url,
                              faceVerified: true,
                              faceConfidenceScore: 94,
                            });
                          }}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                            formData.validIdPhoto === preset.url && !customAvatarPreview
                              ? 'border-emerald-600 scale-105 shadow-sm ring-2 ring-emerald-400/50'
                              : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      ))}

                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Upload ID Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCustomPhotoUpload}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Portal Sign-In Credentials & Password Security */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>5. Desired Resident Login Credentials & Password Security</span>
                </h3>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Desired Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">@</span>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          username: e.target.value.toLowerCase().replace(/\s+/g, '.'),
                        })
                      }
                      placeholder="e.g. maria.delacruz"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    This will be your unique resident login ID once approved by the Barangay Administrator.
                  </p>
                </div>

                {/* Secure Password Field with Real-Time Strength Meter & Generator */}
                <PasswordSecurityField
                  value={formData.password}
                  onChange={(val) => setFormData((prev) => ({ ...prev, password: val }))}
                  onValidationChange={handlePasswordValidationChange}
                  confirmPassword={confirmPassword}
                  onConfirmChange={setConfirmPassword}
                  showConfirm={true}
                  label="Resident Portal Password"
                  placeholder="Create a strong master password"
                  context={passwordContext}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Security Recovery Question
                    </label>
                    <select
                      value={formData.securityQuestion}
                      onChange={(e) => setFormData({ ...formData, securityQuestion: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {SECURITY_QUESTIONS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Security Answer
                    </label>
                    <input
                      type="text"
                      value={formData.securityAnswer}
                      onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                      placeholder="Your secret recovery answer"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <span className="leading-relaxed">
                    I declare under oath that I am a bona fide resident of Barangay Sangkol, and the information provided is true and correct. I understand that this registration will be submitted to the <strong>Barangay Administrator for civil verification and approval</strong> before my account is activated.
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting to Admin...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application for Admin Approval</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Biometric Face Verification Camera Modal */}
      <FaceVerificationModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        title="Resident Face Identity Verification"
        subtitle="Capture biometric face template with real-time liveness detection"
        onVerified={({ photoDataUrl, quality, livenessScore, confidenceScore }) => {
          setCustomAvatarPreview(photoDataUrl);
          setFormData((prev) => ({
            ...prev,
            facePhotoUrl: photoDataUrl,
            validIdPhoto: photoDataUrl,
            faceVerified: true,
            faceConfidenceScore: confidenceScore,
            faceLivenessScore: livenessScore,
            faceVerificationTimestamp: new Date().toISOString(),
          }));
          setIsFaceModalOpen(false);
        }}
      />
    </div>
  );
};
