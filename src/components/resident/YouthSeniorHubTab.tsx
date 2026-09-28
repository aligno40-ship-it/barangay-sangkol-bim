import React, { useState, useMemo } from 'react';
import {
  Trophy,
  HeartHandshake,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Sparkles,
  Award,
  Accessibility,
  Heart,
  FileText,
  BadgeCheck,
  Send,
  Info,
} from 'lucide-react';
import {
  SKTournamentActivity,
  SKRegistrationRecord,
  SeniorCitizenBenefitSchedule,
  AssistiveDeviceRequest,
} from '../../types/residentServices';
import { useCommunityServices } from '../../context/CommunityServicesContext';
import { isResidentRecordOwner } from '../../utils/residentAccountFilter';

interface YouthSeniorHubTabProps {
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
}

export const YouthSeniorHubTab: React.FC<YouthSeniorHubTabProps> = ({
  residentId,
  residentName,
  contactNumber,
  purok,
}) => {
  const {
    skTournaments: skActivities,
    skRegistrations,
    seniorBenefitSchedules: seniorBenefits,
    assistiveDeviceRequests: assistiveRequests,
    registerForSKTournament,
    requestAssistiveDevice,
  } = useCommunityServices();

  const residentIdentity = useMemo(
    () => ({ residentId, name: residentName, contactNumber }),
    [residentId, residentName, contactNumber]
  );

  // STRICT RESIDENT ACCOUNT FILTERING
  const mySkRegistrations = useMemo(() => {
    return (skRegistrations || []).filter((r) =>
      isResidentRecordOwner(
        {
          residentId: r.residentId,
          residentName: r.residentName,
        },
        residentIdentity
      )
    );
  }, [skRegistrations, residentIdentity]);

  const myAssistiveRequests = useMemo(() => {
    return (assistiveRequests || []).filter((ast) =>
      isResidentRecordOwner(
        {
          residentId: ast.residentId,
          residentName: ast.residentName,
          beneficiaryName: ast.beneficiaryName,
        },
        residentIdentity
      )
    );
  }, [assistiveRequests, residentIdentity]);

  const [activeSubTab, setActiveSubTab] = useState<'sk_youth' | 'senior_benefits' | 'assistive_devices'>('sk_youth');

  const [selectedActivityForReg, setSelectedActivityForReg] = useState<SKTournamentActivity | null>(null);
  const [teamName, setTeamName] = useState('');
  const [participantAge, setParticipantAge] = useState(22);

  const [isAssistiveModalOpen, setIsAssistiveModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Assistive Form State
  const [deviceRequested, setDeviceRequested] = useState<AssistiveDeviceRequest['deviceRequested']>('Standard Adult Wheelchair');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryAge, setBeneficiaryAge] = useState(75);
  const [medicalReason, setMedicalReason] = useState('');
  const [priorityLevel, setPriorityLevel] = useState<AssistiveDeviceRequest['priorityLevel']>('Standard');

  const handleRegisterSK = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityForReg) return;

    registerForSKTournament({
      activityId: selectedActivityForReg.id,
      activityTitle: selectedActivityForReg.title,
      residentId,
      residentName,
      age: participantAge,
      purok,
      teamOrCategory: teamName || 'Individual Youth Participant',
    });

    setSuccessMessage(`✓ Registered in "${selectedActivityForReg.title}"! SK Committee and Admin have been notified.`);
    setSelectedActivityForReg(null);
    setTeamName('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  const handleRequestAssistive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiaryName || !medicalReason) return;

    const newReq = requestAssistiveDevice({
      residentId,
      residentName,
      beneficiaryName,
      beneficiaryAge,
      purok,
      deviceRequested,
      medicalConditionReason: medicalReason,
      priorityLevel,
    });

    setSuccessMessage(`✓ Requisition for ${deviceRequested} (${newReq.id}) submitted! Barangay OSCA & PWD desk will review and schedule assessment.`);
    setIsAssistiveModalOpen(false);
    setBeneficiaryName('');
    setMedicalReason('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-purple-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Youth Development & Senior Welfare
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-slate-200">
              Sangguniang Kabataan • OSCA Desk
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            SK Youth Programs & Senior Citizen Welfare Hub
          </h2>
          <p className="text-xs sm:text-sm text-violet-200/90 mt-1 max-w-2xl">
            Register for inter-purok sports cups & free student printing hubs, track senior citizen birthday cash payouts, and request wheelchairs or mobility devices.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAssistiveModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Accessibility className="w-4 h-4" />
          <span>Request Mobility Device</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="p-1 hover:bg-emerald-200/50 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('sk_youth')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'sk_youth'
                ? 'bg-violet-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>SK Youth Tournaments & Hubs</span>
            {skActivities.length > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
                {skActivities.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('senior_benefits')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'senior_benefits'
                ? 'bg-violet-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Senior Citizen & OSCA Benefits</span>
            {seniorBenefits.length > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
                {seniorBenefits.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('assistive_devices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'assistive_devices'
                ? 'bg-violet-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Accessibility className="w-4 h-4" />
            <span>Mobility & Assistive Devices</span>
            {myAssistiveRequests.length > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
                {myAssistiveRequests.length}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline font-medium">
          Barangay Sangkol Community Desk
        </span>
      </div>

      {activeSubTab === 'sk_youth' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skActivities.map((act) => {
              const isRegistered = mySkRegistrations.some((r) => r.activityId === act.id);
              return (
                <div key={act.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-violet-100 text-violet-900 border border-violet-200">
                        {act.registrationStatus}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {act.targetAgeGroup}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{act.title}</h3>

                    <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-xs border border-slate-100 text-slate-700">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Schedule: <strong>{act.scheduleDates}</strong></span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>Venue: {act.venue}</span>
                      </p>
                    </div>

                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <strong>Tournament Prizes / Benefit: </strong>
                      <span>{act.prizes}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">Contact: {act.skContactPerson}</span>
                    {isRegistered ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Registered
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedActivityForReg(act)}
                        className="px-3.5 py-1.5 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Register Youth</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* User's SK Registrations */}
          {mySkRegistrations.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs mt-6">
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-violet-600" />
                  <span>Your SK Tournament Teams & Youth Program Registrations</span>
                </h3>
                <span className="text-xs text-slate-500">{mySkRegistrations.length} registered</span>
              </div>

              <div className="divide-y divide-slate-100">
                {mySkRegistrations.map((reg) => (
                  <div key={reg.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {reg.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{reg.activityTitle}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {reg.status}
                        </span>
                      </div>
                      <p className="text-xs text-violet-800 mt-0.5 font-medium">Team / Entry: {reg.teamOrCategory} • Age: {reg.age} y/o</p>
                    </div>

                    <div className="text-right text-xs text-slate-400 font-mono">
                      Registered: {reg.registeredDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'senior_benefits' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seniorBenefits.map((ben) => (
              <div key={ben.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-200">
                      {ben.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">{ben.id}</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{ben.title}</h3>
                  <p className="text-xs font-semibold text-rose-700">{ben.category}</p>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs border border-slate-100 text-slate-700">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Payout / Release Date: <strong>{ben.distributionDate}</strong></span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Venue: {ben.venue}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Requirements to Bring:</span>
                    <div className="space-y-1">
                      {ben.requirements.map((req, idx) => (
                        <p key={idx} className="text-[11px] text-slate-600 flex items-start gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                  Coverage: {ben.purokCoverage}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'assistive_devices' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-violet-600" />
                <span>Senior & PWD Assistive Device Requests (Wheelchairs, Canes, Walkers)</span>
              </h3>
              <span className="text-xs text-slate-500">{myAssistiveRequests.length} request(s)</span>
            </div>

            {myAssistiveRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Accessibility className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No assistive device requests filed</p>
                <p className="text-xs text-slate-500">Click "Request Assistive Device" to apply for free wheelchairs, walkers, or crutches for seniors and PWDs.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myAssistiveRequests.map((ast) => (
                  <div key={ast.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-violet-900 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md">
                          {ast.id}
                        </span>
                        <span className="font-bold text-sm text-slate-900">{ast.deviceRequested}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ast.status === 'Approved for Delivery' || ast.status === 'Delivered to Residence'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {ast.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          Priority: {ast.priorityLevel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-semibold">
                        Beneficiary: {ast.beneficiaryName} ({ast.beneficiaryAge} y/o) • {ast.purok}
                      </p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        Medical Condition: {ast.medicalConditionReason}
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                      Requested: {ast.createdAt}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SK Tournament Registration Modal */}
      {selectedActivityForReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-100 text-violet-800">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">SK Tournament Registration</h3>
                  <p className="text-xs text-slate-500">{selectedActivityForReg.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivityForReg(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSK} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Participant / Captain Name</label>
                  <input
                    type="text"
                    readOnly
                    value={residentName}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    min={15}
                    max={30}
                    value={participantAge}
                    onChange={(e) => setParticipantAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Team Name / Purok Delegation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Purok Mangga Warriors (Team Captain)"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500 font-medium"
                />
              </div>

              <div className="p-3 bg-violet-50 rounded-xl border border-violet-200 text-[11px] text-violet-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-violet-700" />
                  <span>SK Code of Sportsmanship</span>
                </p>
                <p>All players must present a valid Barangay Resident ID and adhere to fair play and anti-gambling rules.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedActivityForReg(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-bold cursor-pointer shadow-md"
                >
                  Submit Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Assistive Device Modal */}
      {isAssistiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-100 text-violet-800">
                  <Accessibility className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Request Senior / PWD Assistive Device</h3>
                  <p className="text-xs text-slate-500">Barangay Sangkol OSCA & PWD Welfare Office</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssistiveModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestAssistive} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Assistive Device</label>
                <select
                  value={deviceRequested}
                  onChange={(e) => setDeviceRequested(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500 font-medium"
                >
                  <option value="Standard Adult Wheelchair">Standard Adult Wheelchair</option>
                  <option value="Quad Walking Cane">Quad Walking Cane (4-Prong)</option>
                  <option value="Adjustable Underarm Crutches">Adjustable Underarm Crutches (Pair)</option>
                  <option value="Adult Walker / Walking Frame">Adult Walker / Walking Frame</option>
                  <option value="Digital Blood Pressure Monitor Kit">Digital Blood Pressure Monitor Kit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Beneficiary Name (Senior/PWD)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lola Remedios Dela Cruz"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Beneficiary Age</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={beneficiaryAge}
                    onChange={(e) => setBeneficiaryAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Medical Condition & Justification</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe mobility limitations, stroke recovery, arthritis, fracture, or doctor's recommendation..."
                  value={medicalReason}
                  onChange={(e) => setMedicalReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssistiveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-bold cursor-pointer shadow-md"
                >
                  Submit Device Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
