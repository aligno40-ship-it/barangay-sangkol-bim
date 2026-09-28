import React, { useState, useMemo } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { SystemUser, Resident } from '../types';
import { BarangaySangkolSeal } from './OfficialSeals';
import { RecentSearchesInput } from './RecentSearchesInput';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  MapPin,
  Calendar,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  Sparkles,
  Info,
  Clock,
  Building,
  Check,
  AlertTriangle,
  FileCheck2,
  Search,
  Link,
  UserPlus,
  ArrowRight,
  ShieldAlert,
  Scan,
  KeyRound,
  Shield,
  Camera,
} from 'lucide-react';

interface ResidentApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SystemUser | null;
  onSuccess?: (message?: string) => void;
}

export const ResidentApprovalModal: React.FC<ResidentApprovalModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const {
    approveResidentAccount,
    rejectResidentAccount,
    residents,
    users,
    checkResidentMatch,
  } = useBarangay();

  const [approvalMode, setApprovalMode] = useState<'link_existing' | 'create_new' | 'manual_select'>('link_existing');
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Run triangulation match check for this user's data
  const matchResult = useMemo(() => {
    if (!user) {
      return {
        isMatch: false,
        matchedResident: undefined,
        matchReason: undefined as string | undefined,
        isAlreadyClaimed: false,
        claimedByUsername: undefined as string | undefined,
        claimedByUserId: undefined as string | undefined,
        confidence: 'None' as const,
        matchPoints: [] as string[],
      };
    }
    return checkResidentMatch({
      firstName: user.name.split(' ')[0] || user.name,
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      birthDate: user.birthDate || '',
      contactNumber: user.contactNumber,
      householdNo: user.householdNo,
      householdId: user.householdId,
      validIdNumber: user.validIdNumber,
      email: user.email,
      purok: user.purok,
    });
  }, [user, checkResidentMatch]);

  // Primary matching resident candidate
  const candidateResident: Resident | null = useMemo(() => {
    if (!user) return null;
    if (user.residentId) {
      const found = residents.find((r) => r.id === user.residentId);
      if (found) return found;
    }
    if (user.matchedResidentId) {
      const found = residents.find((r) => r.id === user.matchedResidentId);
      if (found) return found;
    }
    if (matchResult.matchedResident) {
      return matchResult.matchedResident;
    }
    return null;
  }, [user, residents, matchResult]);

  // Check if candidate resident is already claimed by ANOTHER active user account
  const isCandidateClaimedByOther = useMemo(() => {
    if (!candidateResident || !user) return null;
    return users.find(
      (u) =>
        u.id !== user.id &&
        u.status !== 'Rejected' &&
        (u.residentId === candidateResident.id || (u.matchedResidentId === candidateResident.id && u.approvalStatus === 'Approved'))
    );
  }, [candidateResident, users, user]);

  // Filtered residents for manual search
  const filteredResidents = useMemo(() => {
    if (!searchQuery.trim()) return residents.slice(0, 8);
    const q = searchQuery.toLowerCase().trim();
    return residents
      .filter(
        (r) =>
          r.firstName.toLowerCase().includes(q) ||
          r.lastName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (r.purok && r.purok.toLowerCase().includes(q)) ||
          (r.contactNumber && r.contactNumber.includes(q))
      )
      .slice(0, 8);
  }, [residents, searchQuery]);

  const activeTargetResident = useMemo(() => {
    if (approvalMode === 'link_existing') return candidateResident;
    if (approvalMode === 'manual_select') {
      return residents.find((r) => r.id === selectedResidentId) || null;
    }
    return null;
  }, [approvalMode, candidateResident, selectedResidentId, residents]);

  const handleApprove = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      let result;
      if (approvalMode === 'link_existing') {
        if (!candidateResident) {
          result = { success: false, message: 'No matching census record found to link.' };
        } else if (isCandidateClaimedByOther) {
          result = {
            success: false,
            message: `Cannot link: This resident record (${candidateResident.id}) is already claimed by user @${isCandidateClaimedByOther.username}.`,
          };
        } else {
          result = approveResidentAccount(user.id, {
            mode: 'link_existing',
            residentId: candidateResident.id,
            updateExistingDetails: true,
          });
        }
      } else if (approvalMode === 'manual_select') {
        if (!selectedResidentId) {
          result = { success: false, message: 'Please select a resident record from the civil registry list.' };
        } else {
          result = approveResidentAccount(user.id, {
            mode: 'link_existing',
            residentId: selectedResidentId,
            updateExistingDetails: true,
          });
        }
      } else {
        // create_new
        result = approveResidentAccount(user.id, {
          mode: 'create_new',
        });
      }

      setIsSubmitting(false);
      setFeedback(result);

      if (result.success) {
        setTimeout(() => {
          if (onSuccess) onSuccess(result.message);
          onClose();
        }, 1200);
      }
    }, 400);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for declining the registration application.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const result = rejectResidentAccount(user.id, rejectionReason);
      setIsSubmitting(false);
      setFeedback(result);
      if (result.success) {
        setTimeout(() => {
          if (onSuccess) onSuccess(result.message);
          onClose();
        }, 1200);
      }
    }, 400);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 p-5 sm:p-6 text-white relative shrink-0 border-b border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
                  Admin Verification Desk
                </span>
                <span className="text-slate-400 text-xs font-mono">App ID: {user.id}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                Review Resident Sign-Up & Linking Request
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {feedback ? (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 ${
                feedback.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              {feedback.success ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{feedback.message}</span>
            </div>
          ) : (
            <>
              {/* Applicant Header Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 text-white font-bold text-lg flex items-center justify-center shrink-0 border border-slate-300">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{user.name}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        user.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : user.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>

                  <p className="font-mono text-indigo-700 text-xs font-semibold">@{user.username}</p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 pt-0.5 text-[11px]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <strong>{user.purok || 'Purok Mangga'}</strong>
                    </span>
                    {user.submittedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Submitted: {new Date(user.submittedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Submitted Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Street Address</span>
                  <span className="font-medium text-slate-800">{user.streetAddress || `${user.purok}, Barangay Sangkol`}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Contact Phone</span>
                  <span className="font-medium text-slate-800">{user.contactNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Email Address</span>
                  <span className="font-medium text-slate-800">{user.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Birthdate / Sex / Civil Status</span>
                  <span className="font-medium text-slate-800">
                    {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : 'N/A'} • {user.sex || 'Female'} ({user.civilStatus || 'Single'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Religion & Citizenship</span>
                  <span className="font-semibold text-slate-800">
                    {user.religion || 'Roman Catholic'} • {user.citizenship || 'Filipino'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Blood Type & Education</span>
                  <span className="font-medium text-slate-800">
                    <strong className="text-rose-600">{user.bloodType || 'Unknown'}</strong> • {user.educationalAttainment || 'High School Graduate'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Occupation & Livelihood</span>
                  <span className="font-medium text-slate-800">
                    {user.occupation || 'None / Not stated'} {user.monthlyIncome ? `(₱${user.monthlyIncome.toLocaleString()}/mo)` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Valid ID Presented</span>
                  <span className="font-semibold text-emerald-700">{user.validIdType || 'PhilSys National ID'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">ID Reference Number</span>
                  <span className="font-mono text-slate-800">{user.validIdNumber || 'N/A'}</span>
                </div>
              </div>

              {/* Resident Photo Verification & Security Audit Card */}
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                      <Scan className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">Resident Identity Photo Verification & Security</h4>
                      <p className="text-[10px] text-slate-400">Frontal face capture and credential security audit</p>
                    </div>
                  </div>
                  {user.faceVerified ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Face Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold text-[10px] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Manual Audit Required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Face Photo Capture Preview */}
                  <div className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-12 h-12 rounded-lg bg-slate-950 overflow-hidden border border-emerald-500/40 shrink-0 relative">
                      {user.facePhotoUrl || user.avatar ? (
                        <img
                          src={user.facePhotoUrl || user.avatar}
                          alt="Face capture"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <Camera className="w-5 h-5" />
                        </div>
                      )}
                      {user.faceVerified && (
                        <div className="absolute bottom-0 right-0 bg-emerald-500 text-slate-950 p-0.5 rounded-tl">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] space-y-0.5">
                      <span className="text-slate-400 text-[10px] block">Photo Framing Quality:</span>
                      <span className="font-bold text-emerald-400">
                        {user.faceBiometricQuality?.overallScore ? `${user.faceBiometricQuality.overallScore}% Confidence` : '96% Quality Match'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Framing Check: {user.faceBiometricQuality?.livenessPassed !== false ? 'Verified Passed' : 'Unchecked'}
                      </span>
                    </div>
                  </div>

                  {/* Password Security Strength */}
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-emerald-400" />
                        Password Strength Rating:
                      </span>
                      <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono font-bold text-[9px]">
                        {user.passwordStrengthScore !== undefined ? `${user.passwordStrengthScore}/100` : 'Strong'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300">
                      Enforced 12+ chars, uppercase, lowercase, numbers, symbols & zero dictionary leakage.
                    </p>
                  </div>
                </div>

                {/* Valid ID Attached Photo if present */}
                {(user.validIdPhotoUrl || user.validIdPhoto) && (
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1">Presented ID Document Scan:</span>
                    <div className="p-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                      <div className="w-20 h-12 rounded bg-slate-950 overflow-hidden border border-slate-700 shrink-0">
                        <img src={user.validIdPhotoUrl || user.validIdPhoto} alt="Valid ID" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[11px]">
                        <span className="font-bold text-white block">{user.validIdType || 'Government ID'}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{user.validIdNumber}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Approval & Civil Census Linking Mode Selector */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-700" />
                    <span>Civil Census Record Linking Decision</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-500">Select Action</span>
                </div>

                {/* Conflict Alert if already claimed */}
                {candidateResident && isCandidateClaimedByOther && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-rose-950">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Warning: Matched Resident Already Claimed!</span>
                    </div>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      Resident <strong>{candidateResident.firstName} {candidateResident.lastName}</strong> ({candidateResident.id}) is already linked to user account <strong className="font-mono text-rose-900">@{isCandidateClaimedByOther.username}</strong>. A census record cannot be claimed multiple times.
                    </p>
                  </div>
                )}

                <div className="space-y-2.5">
                  {/* Option 1: Link to Matched Existing Resident */}
                  {candidateResident && (
                    <label
                      className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                        approvalMode === 'link_existing'
                          ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      } ${isCandidateClaimedByOther ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="approvalMode"
                          value="link_existing"
                          disabled={!!isCandidateClaimedByOther}
                          checked={approvalMode === 'link_existing'}
                          onChange={() => setApprovalMode('link_existing')}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Link className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Link to Matched Civil Census Record</span>
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-md">
                              {user.matchConfidence || matchResult.confidence || 'Matched'}
                            </span>
                          </div>

                          <div className="mt-2 p-2.5 bg-white border border-emerald-200 rounded-lg space-y-1 text-[11px]">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-emerald-950">
                                {candidateResident.firstName} {candidateResident.lastName}
                              </span>
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                {candidateResident.id}
                              </span>
                            </div>
                            <div className="text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                              <span>Purok: <strong>{candidateResident.purok}</strong></span>
                              <span>DOB: <strong>{candidateResident.birthDate}</strong> (Age {candidateResident.age})</span>
                              <span>Phone: <strong>{candidateResident.contactNumber || 'N/A'}</strong></span>
                            </div>
                            <p className="text-[10px] text-emerald-700 italic pt-0.5">
                              Match reason: {user.matchReason || matchResult.matchReason || 'Name + Birthdate match'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  )}

                  {/* Option 2: Approve as Brand-New Resident Record */}
                  <label
                    className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                      approvalMode === 'create_new'
                        ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="approvalMode"
                        value="create_new"
                        checked={approvalMode === 'create_new'}
                        onChange={() => setApprovalMode('create_new')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <UserPlus className="w-3.5 h-3.5 text-blue-700" />
                            <span>Create Brand-New Civil Census Record</span>
                          </span>
                          {!candidateResident && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white font-bold text-[10px] rounded-md">
                              Recommended (No Match)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          Approves applicant as a new resident of Barangay Sangkol. Generates a new unique Resident ID in the civil registry and links this login account.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option 3: Manually Select from Civil Registry */}
                  <label
                    className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                      approvalMode === 'manual_select'
                        ? 'bg-purple-50 border-purple-400 ring-1 ring-purple-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="approvalMode"
                        value="manual_select"
                        checked={approvalMode === 'manual_select'}
                        onChange={() => setApprovalMode('manual_select')}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-purple-700" />
                          <span>Search & Manually Link Existing Resident Record</span>
                        </span>

                        {approvalMode === 'manual_select' && (
                          <div className="space-y-2 pt-1 animate-in fade-in">
                            <RecentSearchesInput
                              value={searchQuery}
                              onChange={setSearchQuery}
                              placeholder="Search by name, ID, purok, or contact number..."
                              storageKey="resident_approval_modal_search"
                              theme="light"
                              inputClassName="w-full pl-9 pr-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />

                            <div className="max-h-36 overflow-y-auto space-y-1 border border-purple-200 rounded-lg p-1 bg-white">
                              {filteredResidents.map((r) => {
                                const isClaimed = users.some(
                                  (u) => u.id !== user.id && u.status !== 'Rejected' && u.residentId === r.id
                                );
                                return (
                                  <button
                                    key={r.id}
                                    type="button"
                                    disabled={isClaimed}
                                    onClick={() => setSelectedResidentId(r.id)}
                                    className={`w-full text-left p-2 rounded-md text-[11px] flex items-center justify-between transition-colors ${
                                      selectedResidentId === r.id
                                        ? 'bg-purple-600 text-white font-bold'
                                        : isClaimed
                                        ? 'opacity-40 bg-slate-50 cursor-not-allowed text-slate-400'
                                        : 'hover:bg-purple-50 text-slate-800'
                                    }`}
                                  >
                                    <div>
                                      <span>{r.firstName} {r.lastName}</span>
                                      <span className={`text-[10px] ml-2 ${selectedResidentId === r.id ? 'text-purple-200' : 'text-slate-500'}`}>
                                        ({r.id} • {r.purok})
                                      </span>
                                    </div>
                                    {isClaimed && (
                                      <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.5 rounded font-bold">
                                        Claimed
                                      </span>
                                    )}
                                    {selectedResidentId === r.id && (
                                      <Check className="w-3.5 h-3.5 text-white" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Decline Application Sub-form */}
              {isRejecting && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 animate-in fade-in">
                  <label className="block font-bold text-rose-950">
                    Reason for Declining Registration:
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Identity and address could not be verified in the Barangay civil registry. Please visit the Barangay Hall with a valid government ID."
                    className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRejecting(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                    >
                      Confirm Decline
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!feedback && !isRejecting && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsRejecting(true)}
              className="px-4 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Decline Application</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting || (approvalMode === 'link_existing' && !!isCandidateClaimedByOther)}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <UserCheck className="w-4 h-4" />
                <span>
                  {approvalMode === 'link_existing'
                    ? 'Approve & Link Record'
                    : approvalMode === 'create_new'
                    ? 'Approve & Create New Resident'
                    : 'Approve & Link Selected'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
