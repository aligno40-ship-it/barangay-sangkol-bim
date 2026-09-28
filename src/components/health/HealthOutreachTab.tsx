import React, { useState, useMemo } from 'react';
import {
  HeartPulse,
  Baby,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Printer,
  Plus,
  Search,
  Check,
  Sparkles,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  HealthMission,
  ChildImmunizationTracker,
} from '../../types/residentServices';
import { HealthPrintDocType } from './HealthPrintDocumentModal';
import { useCommunityServices } from '../../context/CommunityServicesContext';
import { isResidentRecordOwner } from '../../utils/residentAccountFilter';
import { RecentSearchesInput } from '../RecentSearchesInput';

interface HealthOutreachTabProps {
  missions: HealthMission[];
  immunizations: ChildImmunizationTracker[];
  mode: 'admin' | 'resident';
  residentId?: string;
  residentName?: string;
  purok?: string;
  onOpenMissionModal?: () => void;
  onOpenImmunizationModal?: () => void;
  onRegisterMission?: (missionId: string, resId: string, resName: string) => void;
  onCancelMissionReservation?: (missionId: string, resId: string, resName: string) => void;
  onUpdateImmunizationStatus?: (
    id: string,
    status: ChildImmunizationTracker['status'],
    administeredDate?: string,
    administeredBy?: string
  ) => void;
  onPrintDocument: (doc: HealthPrintDocType) => void;
  onShowToast?: (msg: string) => void;
}

export const HealthOutreachTab: React.FC<HealthOutreachTabProps> = ({
  missions = [],
  immunizations = [],
  mode,
  residentId = 'RES-CURRENT',
  residentName = 'Resident Beneficiary',
  purok = 'Barangay Sangkol',
  onOpenMissionModal,
  onOpenImmunizationModal,
  onRegisterMission,
  onCancelMissionReservation,
  onUpdateImmunizationStatus,
  onPrintDocument,
  onShowToast,
}) => {
  const { registerForHealthMission, cancelHealthMissionReservation } = useCommunityServices();
  const [activeSection, setActiveSection] = useState<'missions' | 'immunizations'>('missions');
  const [missionSearch, setMissionSearch] = useState('');
  const [vaccineSearch, setVaccineSearch] = useState('');

  const safeMissions = missions || [];

  // Scoped to resident account in resident mode
  const userScopedImmunizations = useMemo(() => {
    if (mode !== 'resident') return immunizations || [];
    return (immunizations || []).filter((imm) =>
      isResidentRecordOwner(
        {
          parentResidentId: imm.parentResidentId,
          parentName: imm.parentName,
        },
        { residentId, name: residentName }
      )
    );
  }, [immunizations, mode, residentId, residentName]);

  const handleRegister = (mission: HealthMission) => {
    if (onRegisterMission) {
      onRegisterMission(mission.id, residentId, residentName);
    } else {
      registerForHealthMission(mission.id, residentId, residentName);
    }
    const msg = `✓ Successfully reserved your slot for ${mission.title}! Priority pass is ready.`;
    onShowToast?.(msg);
  };

  const handleCancelReservation = (mission: HealthMission) => {
    if (onCancelMissionReservation) {
      onCancelMissionReservation(mission.id, residentId, residentName);
    } else {
      cancelHealthMissionReservation(mission.id, residentId, residentName);
    }
    const msg = `Reservation cancelled for ${mission.title}.`;
    onShowToast?.(msg);
  };

  const filteredMissions = safeMissions.filter((m) => {
    const q = (missionSearch || '').toLowerCase().trim();
    if (!q) return true;
    const title = (m?.title || '').toLowerCase();
    const type = (m?.missionType || m?.programType || '').toLowerCase();
    const venue = (m?.venue || '').toLowerCase();
    const desc = (m?.description || '').toLowerCase();
    return title.includes(q) || type.includes(q) || venue.includes(q) || desc.includes(q);
  });

  const filteredImmunizations = userScopedImmunizations.filter((imm) => {
    const q = (vaccineSearch || '').toLowerCase().trim();
    if (!q) return true;
    const child = (imm?.childName || '').toLowerCase();
    const parent = (imm?.parentName || '').toLowerCase();
    const vName = (imm?.vaccineName || '').toLowerCase();
    const dose = (imm?.doseNumber || '').toLowerCase();
    return child.includes(q) || parent.includes(q) || vName.includes(q) || dose.includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Top Banner & Toggle */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Community Outreach & Prevention
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {safeMissions.length} Missions • {userScopedImmunizations.length} Vaccine Trackers
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            {mode === 'admin'
              ? 'Health Caravans, Outreach Missions & Child Bakuna Registry'
              : 'Barangay Health Missions & Child Immunization Tracker'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            {mode === 'admin'
              ? 'Organize free medical/dental caravans, maternal days, and maintain the DOH Expanded Program on Immunization (EPI) master list.'
              : 'Register for free health missions, download passes, and track child immunization schedules.'}
          </p>
        </div>

        {/* Section Switcher Pills */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSection('missions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'missions'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Health Missions ({safeMissions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('immunizations')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'immunizations'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            <span>Child Bakuna EPI ({userScopedImmunizations.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: HEALTH MISSIONS */}
      {activeSection === 'missions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <RecentSearchesInput
              className="w-full sm:w-80"
              placeholder="Search health mission title, venue..."
              value={missionSearch}
              onChange={setMissionSearch}
              storageKey="health_missions"
              theme="light"
              inputClassName="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500"
            />

            {mode === 'admin' && onOpenMissionModal && (
              <button
                type="button"
                onClick={onOpenMissionModal}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Mission</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMissions.map((mission) => {
              const regIds = Array.isArray(mission.registeredBeneficiaryIds) ? mission.registeredBeneficiaryIds : [];
              const isRegistered = Boolean(residentId && regIds.includes(residentId));
              const regCount = regIds.length > 0 ? regIds.length : (mission.registeredCount ?? 0);
              const maxSlots = mission.maxSlots || 50;
              const remainingSlots = Math.max(0, maxSlots - regCount);
              const isFull = remainingSlots <= 0 && !isRegistered;
              const progressPct = Math.min(100, Math.round((regCount / maxSlots) * 100));
              const missionTypeLabel = mission.missionType || mission.programType || 'Community Health Mission';
              const reqsList = mission.requirements && mission.requirements.length > 0 
                ? mission.requirements 
                : ['Barangay Resident ID or Proof of Residency', 'Valid ID / PhilHealth (if available)'];

              return (
                <div
                  key={mission.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {missionTypeLabel}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        {mission.status || 'Upcoming'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">{mission.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{mission.description}</p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Date: <strong className="text-slate-900 dark:text-white">{mission.date}</strong> ({mission.timeSchedule})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Venue: <strong className="text-slate-900 dark:text-white">{mission.venue}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>Slots: <strong className="text-slate-900 dark:text-white">{remainingSlots} slots remaining</strong> ({regCount}/{maxSlots} registered)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>Registration Capacity</span>
                        <span>{progressPct}% Booked</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Requirements:</span>
                      <div className="flex flex-wrap gap-1">
                        {reqsList.map((req, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] rounded-md font-medium">
                            • {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {isRegistered ? (
                      <div className="flex items-center gap-2 w-full justify-between flex-wrap sm:flex-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Slot Reserved</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPrintDocument({ type: 'mission_pass', data: mission, residentName, purok })}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Pass</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelReservation(mission)}
                            className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                            title="Cancel slot reservation"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : isFull ? (
                      <button
                        type="button"
                        disabled
                        className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Mission Slots Full</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRegister(mission)}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                      >
                        <HeartPulse className="w-4 h-4" />
                        <span>Reserve My Slot for Mission</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: CHILD IMMUNIZATION TRACKER */}
      {activeSection === 'immunizations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <RecentSearchesInput
              className="w-full sm:w-80"
              placeholder="Search child name, vaccine antigen..."
              value={vaccineSearch}
              onChange={setVaccineSearch}
              storageKey="health_vaccines"
              theme="light"
              inputClassName="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500"
            />

            {onOpenImmunizationModal && (
              <button
                type="button"
                onClick={onOpenImmunizationModal}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Child Vaccine Tracker</span>
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Child Name & Age/DOB</th>
                    <th className="p-3.5">Vaccine Antigen & Dose</th>
                    <th className="p-3.5">Target Due Date</th>
                    <th className="p-3.5">Lot & Injection Site</th>
                    <th className="p-3.5">Administration Status</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredImmunizations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {mode === 'resident'
                          ? 'No child immunization records registered under your resident account.'
                          : 'No child immunization records found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredImmunizations.map((imm) => (
                      <tr key={imm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 pl-5">
                          <p className="font-bold text-slate-900 dark:text-white">{imm.childName}</p>
                          <p className="text-[11px] text-slate-500">DOB: {imm.childBirthDate || imm.birthDate || 'N/A'} (Parent: {imm.parentName})</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{imm.vaccineName}</p>
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 mt-0.5">
                            {imm.doseNumber}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {imm.dueDate}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400">
                          <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{imm.batchNumber || imm.batchOrLotNumber || 'LOT-EPI-2026'}</p>
                          <p className="text-[11px] text-slate-400">{imm.injectionSite || 'Left Anterolateral Thigh'}</p>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              imm.status === 'Completed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {imm.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {mode === 'admin' && onUpdateImmunizationStatus && imm.status !== 'Completed' && (
                              <button
                                onClick={() => {
                                  onUpdateImmunizationStatus(
                                    imm.id,
                                    'Completed',
                                    new Date().toISOString().split('T')[0],
                                    'Barangay Midwife'
                                  );
                                  onShowToast?.(`Recorded immunization for ${imm.childName}.`);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Check className="w-3 h-3" /> Given
                              </button>
                            )}
                            <button
                              onClick={() => onPrintDocument({ type: 'immunization_card', data: imm })}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Print Child Immunization Card"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Bakuna Card</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

