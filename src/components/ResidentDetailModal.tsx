import React, { useState } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { Resident } from '../types';
import { BarangayIdCardView } from './BarangayIdCardView';
import { ResidentPrintModal } from './ResidentPrintModal';
import { UserProfilePhotoModal } from './UserProfilePhotoModal';
import {
  Printer,
  Download,
  X,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  HeartHandshake,
  Shield,
  FileCheck2,
  Edit,
  Tag,
  Home,
  Scan,
  CheckCircle2,
  AlertTriangle,
  Camera,
} from 'lucide-react';

export const ResidentDetailModal: React.FC<{
  resident: Resident | null;
  onClose: () => void;
  onEdit?: (resident: Resident) => void;
  onIssueCert?: (resident: Resident) => void;
}> = ({ resident, onClose, onEdit, onIssueCert }) => {
  const { settings, updateResident } = useBarangay();
  const [viewTab, setViewTab] = useState<'profile' | 'id_card'>('profile');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  if (!resident) return null;

  const handlePrintID = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 modal-backdrop">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              onClick={() => setIsPhotoModalOpen(true)}
              className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-indigo-200 bg-white shadow-xs group/avatar cursor-pointer transition-transform hover:scale-105"
              title="Click to view or change profile photo"
            >
              {resident.photoUrl || resident.avatar ? (
                <img
                  src={resident.photoUrl || resident.avatar}
                  alt={`${resident.firstName} ${resident.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-base">
                  {resident.firstName[0]}
                  {resident.lastName[0]}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Camera className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{resident.firstName} {resident.middleName ? `${resident.middleName[0]}.` : ''} {resident.lastName} {resident.suffix || ''}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold">
                  {resident.id}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {resident.purok} • {resident.residentStatus} Resident
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewTab('profile')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  viewTab === 'profile' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bio Profile
              </button>
              <button
                onClick={() => setViewTab('id_card')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewTab === 'id_card' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Barangay ID Card</span>
              </button>
            </div>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Print RBI Form 1A Record Sheet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Form 1A</span>
            </button>

            {onIssueCert && (
              <button
                onClick={() => onIssueCert(resident)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Issue Certificate</span>
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(resident)}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
                title="Edit Record"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {viewTab === 'profile' ? (
            <div className="space-y-6">
              {/* Sectoral Badges */}
              <div className="flex flex-wrap gap-2">
                {resident.isSeniorCitizen && (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5" /> Senior Citizen
                  </span>
                )}
                {resident.isPWD && (
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-xs font-bold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> PWD: {resident.pwdType || 'General'}
                  </span>
                )}
                {resident.is4PsBeneficiary && (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> 4Ps Beneficiary
                  </span>
                )}
                {resident.isSoloParent && (
                  <span className="px-2.5 py-1 bg-pink-50 text-pink-800 border border-pink-200 rounded-full text-xs font-bold">
                    Solo Parent
                  </span>
                )}
                {resident.isIndigent && (
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-bold">
                    Indigent Resident
                  </span>
                )}
                {resident.isYouth && (
                  <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold">
                    Youth / SK Member
                  </span>
                )}
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  resident.voterStatus === 'Registered'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  Voter: {resident.voterStatus} {resident.precinctNo ? `(Precinct ${resident.precinctNo})` : ''}
                </span>

                {resident.faceVerified ? (
                  <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold flex items-center gap-1">
                    <Scan className="w-3.5 h-3.5 text-teal-600" />
                    Biometrics Verified {resident.faceBiometricQuality?.overallScore ? `(${resident.faceBiometricQuality.overallScore}%)` : ''}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-xs font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    No Face Biometrics Enrolled
                  </span>
                )}
              </div>

              {/* Demographic Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Personal Info */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Personal Information
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Date of Birth:</span>
                      <span className="font-bold text-slate-900">{resident.birthDate} ({resident.age} yrs old)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Sex:</span>
                      <span className="font-bold text-slate-900">{resident.sex}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Civil Status:</span>
                      <span className="font-bold text-slate-900">{resident.civilStatus}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Citizenship:</span>
                      <span className="font-bold text-slate-900">{resident.citizenship}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Religion:</span>
                      <span className="font-bold text-slate-900">{resident.religion}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Blood Type:</span>
                      <span className="font-bold text-rose-600">{resident.bloodType || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Residence & Household */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Location & Household
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Purok / Sitio:</span>
                      <span className="font-bold text-indigo-700">{resident.purok}</span>
                    </div>
                    <div className="py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium block mb-0.5">Address:</span>
                      <span className="font-bold text-slate-900">{resident.streetAddress}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Household ID:</span>
                      <span className="font-mono font-bold text-slate-900">{resident.householdId || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Household Role:</span>
                      <span className="font-bold text-slate-900">{resident.isHouseholdHead ? 'Family Head' : 'Member'}</span>
                    </div>
                  </div>
                </div>

                {/* Socio-Economic & Contact */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Contact & Socio-Economic
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Contact Number:</span>
                      <span className="font-mono font-bold text-slate-900">{resident.contactNumber}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Occupation:</span>
                      <span className="font-bold text-slate-900">{resident.occupation || 'None / Unemployed'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Monthly Income:</span>
                      <span className="font-bold text-indigo-700">
                        {resident.monthlyIncome > 0 ? `₱${resident.monthlyIncome.toLocaleString()}` : 'None / Dependent'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Education:</span>
                      <span className="font-bold text-slate-900">{resident.educationalAttainment}</span>
                    </div>
                    <div className="py-1">
                      <span className="text-slate-500 font-medium block mb-0.5">Emergency Contact:</span>
                      <span className="font-bold text-slate-900">{resident.emergencyContactName} ({resident.emergencyContactNumber})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Printable Barangay Resident ID Card View with Functional Color-Coding */
            <div className="w-full flex flex-col items-center justify-center">
              <BarangayIdCardView
                resident={resident}
                settings={settings}
                onPrint={handlePrintID}
              />
            </div>
          )}
        </div>
      </div>

      {/* Official Form 1A Print Modal */}
      <ResidentPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        initialResident={resident}
      />

      {/* Profile Photo Modal */}
      {isPhotoModalOpen && resident && (
        <UserProfilePhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          title={`Profile Photo: ${resident.firstName} ${resident.lastName}`}
          subtitle={`Citizen ID ${resident.id} • Saved directly to Supabase DB and wired to user account`}
          onSaveAvatar={(newAvatarUrl) => {
            updateResident(resident.id, {
              photoUrl: newAvatarUrl || undefined,
              avatar: newAvatarUrl || undefined,
            });
            setIsPhotoModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
