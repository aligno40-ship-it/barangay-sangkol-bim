import React, { useState, useMemo } from 'react';
import {
  User,
  HeartPulse,
  Activity,
  Calendar,
  Clock,
  Pill,
  Baby,
  Printer,
  Search,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  HealthAppointment,
  MedicineRefillRequest,
  ChildImmunizationTracker,
  PharmacyInventoryItem,
} from '../../types/residentServices';
import { HealthPrintDocType } from './HealthPrintDocumentModal';
import { isResidentRecordOwner } from '../../utils/residentAccountFilter';
import { RecentSearchesInput } from '../RecentSearchesInput';

interface ResidentSummary {
  id: string;
  name: string;
  purok?: string;
  age?: number;
  contactNumber?: string;
  philhealthNo?: string;
  bloodType?: string;
  allergies?: string;
}

interface HealthPatientHistoryTabProps {
  mode: 'admin' | 'resident';
  appointments: HealthAppointment[];
  medicineRequests: MedicineRefillRequest[];
  immunizations: ChildImmunizationTracker[];
  inventory: PharmacyInventoryItem[];
  currentResident?: ResidentSummary;
  allResidents?: ResidentSummary[];
  onOpenTriageModal?: (appt: HealthAppointment) => void;
  onPrintDocument: (doc: HealthPrintDocType) => void;
  onBookConsultation?: () => void;
}

export const HealthPatientHistoryTab: React.FC<HealthPatientHistoryTabProps> = ({
  mode,
  appointments,
  medicineRequests,
  immunizations,
  inventory,
  currentResident,
  allResidents = [],
  onOpenTriageModal,
  onPrintDocument,
  onBookConsultation,
}) => {
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState<string>(() => {
    if (mode === 'resident') return currentResident?.name || '';
    if (appointments.length > 0) return appointments[0].patientName || appointments[0].residentName;
    return allResidents.length > 0 ? allResidents[0].name : '';
  });

  // Extract unique patient names from appointments & residents
  const patientDirectory = useMemo(() => {
    const map = new Map<string, ResidentSummary>();

    // From residents context
    (allResidents || []).forEach((r) => {
      if (!r?.name) return;
      map.set(r.name.toLowerCase(), {
        id: r.id || 'RES-0',
        name: r.name,
        purok: r.purok || 'Purok 1',
        age: r.age || 35,
        contactNumber: r.contactNumber || '0917-889-1020',
        philhealthNo: r.philhealthNo || `PH-${(r.id || '0000').slice(-4)}-2026`,
        bloodType: r.bloodType || 'O+',
        allergies: r.allergies || 'No known drug allergies',
      });
    });

    // From appointments
    (appointments || []).forEach((a) => {
      const pName = a.patientName || a.residentName;
      if (!pName) return;
      const key = pName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: a.residentId || 'RES-0',
          name: pName,
          purok: 'Barangay Sangkol',
          age: a.patientAge || 30,
          contactNumber: '0917-000-0000',
          philhealthNo: `PH-${(a.residentId || '0000').slice(-4)}-2026`,
          bloodType: 'O+',
          allergies: 'None recorded',
        });
      }
    });

    return Array.from(map.values());
  }, [allResidents, appointments]);

  const activePatient = useMemo(() => {
    if (mode === 'resident') {
      return (
        currentResident || {
          id: 'RES-DEFAULT',
          name: 'Resident Patient',
          purok: 'Purok 1',
          age: 32,
          contactNumber: '0917-123-4567',
          philhealthNo: 'PH-1092-2026',
          bloodType: 'O+',
          allergies: 'No known allergies',
        }
      );
    }
    const targetName = (selectedPatientName || '').toLowerCase();
    const found = patientDirectory.find(
      (p) => (p.name || '').toLowerCase() === targetName
    );
    return found || patientDirectory[0] || null;
  }, [mode, currentResident, selectedPatientName, patientDirectory]);

  // Filter records for active patient
  const patientAppointments = useMemo(() => {
    if (!activePatient) return [];
    return appointments.filter((a) =>
      isResidentRecordOwner(
        {
          residentId: a.residentId,
          residentName: a.residentName,
          patientName: a.patientName,
        },
        {
          residentId: activePatient.id,
          name: activePatient.name,
          contactNumber: activePatient.contactNumber,
        }
      )
    );
  }, [appointments, activePatient]);

  const patientMedicines = useMemo(() => {
    if (!activePatient) return [];
    return medicineRequests.filter((m) =>
      isResidentRecordOwner(
        {
          residentId: m.residentId,
          residentName: m.residentName,
          contactNumber: m.contactNumber,
        },
        {
          residentId: activePatient.id,
          name: activePatient.name,
          contactNumber: activePatient.contactNumber,
        }
      )
    );
  }, [medicineRequests, activePatient]);

  const patientImmunizations = useMemo(() => {
    if (!activePatient) return [];
    return immunizations.filter((i) =>
      isResidentRecordOwner(
        {
          parentResidentId: i.parentResidentId,
          parentName: i.parentName,
        },
        {
          residentId: activePatient.id,
          name: activePatient.name,
        }
      )
    );
  }, [immunizations, activePatient]);

  // Get most recent vitals if any
  const latestVitalsAppt = useMemo(() => {
    return patientAppointments.find((a) => a.vitals && a.vitals.bp);
  }, [patientAppointments]);

  const filteredPatientList = useMemo(() => {
    const q = patientSearch.toLowerCase().trim();
    if (!q) return patientDirectory;
    return patientDirectory.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.purok && p.purok.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q)
    );
  }, [patientDirectory, patientSearch]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Electronic Health Records (EHR)
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-slate-200">
              Barangay Primary Health Station
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Patient Medical History & Vitals Timeline
          </h2>
          <p className="text-xs sm:text-sm text-blue-200/90 mt-1 max-w-2xl">
            Unified longitudinal clinical history, vital signs telemetry, doctor consultation notes, pharmacy dispensing records, and family vaccination logs.
          </p>
        </div>

        {mode === 'resident' && onBookConsultation && (
          <button
            type="button"
            onClick={onBookConsultation}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0 self-start md:self-auto"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Consultation</span>
          </button>
        )}
      </div>

      {/* Admin Patient Selector Sidebar / Bar */}
      {mode === 'admin' && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <RecentSearchesInput
              className="flex-1 sm:max-w-md"
              placeholder="Search patient name, resident ID, purok..."
              value={patientSearch}
              onChange={setPatientSearch}
              storageKey="health_patient_history"
              theme="light"
              inputClassName="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />

            <span className="text-xs text-slate-500">
              Active Patient Directory: <strong className="text-slate-900 dark:text-white">{filteredPatientList.length}</strong> registered
            </span>
          </div>

          {/* Quick Patient Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {filteredPatientList.map((p) => {
              const isSelected = activePatient && activePatient.name.toLowerCase() === p.name.toLowerCase();
              return (
                <button
                  key={p.id + p.name}
                  type="button"
                  onClick={() => setSelectedPatientName(p.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{p.name}</span>
                  {p.age && <span className="text-[10px] opacity-80">({p.age} y/o)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Patient Profile & Clinical Summary Card */}
      {activePatient ? (
        <div className="space-y-6">
          {/* Patient Dossier Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xl shrink-0 border border-blue-200 dark:border-blue-800">
                {activePatient.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {activePatient.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {activePatient.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    PhilHealth: {activePatient.philhealthNo || 'Active Member'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                  <span>Age: <strong className="text-slate-800 dark:text-slate-200">{activePatient.age || 32} y/o</strong></span>
                  <span>•</span>
                  <span>Purok: <strong className="text-slate-800 dark:text-slate-200">{activePatient.purok || 'Purok 2'}</strong></span>
                  <span>•</span>
                  <span>Blood Type: <strong className="text-rose-600 font-bold">{activePatient.bloodType || 'O+'}</strong></span>
                  <span>•</span>
                  <span>Allergies: <strong className="text-slate-700 dark:text-slate-300">{activePatient.allergies || 'NKDA'}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
              {patientAppointments.length > 0 && (
                <button
                  type="button"
                  onClick={() => onPrintDocument({ type: 'consultation', data: patientAppointments[0] })}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Print official patient consultation summary"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Medical Record</span>
                </button>
              )}
            </div>
          </div>

          {/* Vitals Telemetry Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Blood Pressure</span>
                <HeartPulse className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {latestVitalsAppt?.vitals?.bp || '120/80'} <span className="text-[10px] text-slate-400 font-normal">mmHg</span>
              </p>
              <span className="inline-block px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded">
                Normal Range
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Heart / Pulse</span>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {latestVitalsAppt?.vitals?.heartRate || 74} <span className="text-[10px] text-slate-400 font-normal">bpm</span>
              </p>
              <span className="inline-block px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded">
                Regular Rhythm
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Body Temp</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {latestVitalsAppt?.vitals?.temperature || '36.5'} <span className="text-[10px] text-slate-400 font-normal">°C</span>
              </p>
              <span className="inline-block px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded">
                Afebrile
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">SpO2 Oxygen</span>
                <Award className="w-4 h-4 text-cyan-500" />
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {latestVitalsAppt?.vitals?.spo2 || 99} <span className="text-[10px] text-slate-400 font-normal">%</span>
              </p>
              <span className="inline-block px-1.5 py-0.5 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold rounded">
                Optimum Saturation
              </span>
            </div>
          </div>

          {/* Section 1: Clinical Consultations & Diagnoses */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Clinical Consultations, Triage Records & Physician Advice</span>
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                {patientAppointments.length} record(s)
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {patientAppointments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No consultation records registered for this patient yet.
                </div>
              ) : (
                patientAppointments.map((appt) => (
                  <div key={appt.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md">
                            {appt.id}
                          </span>
                          {appt.queueNumber && (
                            <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                              Queue: {appt.queueNumber}
                            </span>
                          )}
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{appt.serviceType}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            appt.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : appt.status === 'Confirmed'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {appt.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Chief Reason / Symptoms: <strong className="text-slate-800 dark:text-slate-200">{appt.symptomsOrPurpose}</strong>
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>Date: <strong className="text-slate-800 dark:text-slate-200">{appt.preferredDate}</strong></span>
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Slot: <strong className="text-slate-800 dark:text-slate-200">{appt.preferredTimeSlot}</strong></span>
                          </span>
                          {appt.attendingHealthWorker && (
                            <span>Attending: <strong className="text-slate-800 dark:text-slate-200">{appt.attendingHealthWorker}</strong></span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {mode === 'admin' && onOpenTriageModal && (
                          <button
                            type="button"
                            onClick={() => onOpenTriageModal(appt)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                            <span>Triage Vitals</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onPrintDocument({ type: 'consultation', data: appt })}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Slip</span>
                        </button>
                      </div>
                    </div>

                    {/* Vitals breakdown */}
                    {appt.vitals?.bp && (
                      <div className="p-3 bg-blue-50/60 dark:bg-slate-800/60 rounded-xl border border-blue-200 dark:border-slate-700 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                            Triage Vitals Recorded by BHW
                          </span>
                          {appt.vitals.triagePriority && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-[10px] font-bold rounded-md">
                              {appt.vitals.triagePriority}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-blue-100 dark:border-slate-800">
                            <span className="text-slate-500 block text-[10px]">Blood Pressure:</span>
                            <strong className="font-mono text-slate-900 dark:text-white">{appt.vitals.bp} mmHg</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-blue-100 dark:border-slate-800">
                            <span className="text-slate-500 block text-[10px]">Heart Rate:</span>
                            <strong className="font-mono text-slate-900 dark:text-white">{appt.vitals.heartRate} bpm</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-blue-100 dark:border-slate-800">
                            <span className="text-slate-500 block text-[10px]">Temperature:</span>
                            <strong className="font-mono text-slate-900 dark:text-white">{appt.vitals.temperature} °C</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-blue-100 dark:border-slate-800">
                            <span className="text-slate-500 block text-[10px]">SpO2 Saturation:</span>
                            <strong className="font-mono text-slate-900 dark:text-white">{appt.vitals.spo2 || 99} %</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {appt.prescriptionsOrAdvice && (
                      <p className="text-[11px] text-blue-950 dark:text-blue-200 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <strong className="text-blue-950 dark:text-blue-100">Doctor Advice & Prescriptions: </strong>
                        {appt.prescriptionsOrAdvice}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 2: Dispensed Maintenance Medicines */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Pill className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Maintenance Medicine Dispensing History</span>
              </h4>
              <span className="text-xs text-slate-500 font-medium">{patientMedicines.length} request(s)</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {patientMedicines.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No medicine refill records found for this patient.
                </div>
              ) : (
                patientMedicines.map((med) => (
                  <div key={med.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-cyan-900 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 rounded-md">
                          {med.id}
                        </span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{med.medicineName}</span>
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-cyan-100 text-cyan-800">
                          Qty: {med.quantityRequested} tabs
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          med.status === 'Dispensed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : med.status === 'Ready for Pickup'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {med.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Indication: {med.purpose} • Requested: {med.requestedAt}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPrintDocument({ type: 'medicine_dispense', data: med })}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Voucher</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: Child & Family Immunization Tracker */}
          {patientImmunizations.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Baby className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Linked Child & Infant Immunization (EPI) Records</span>
                </h4>
                <span className="text-xs text-slate-500 font-medium">{patientImmunizations.length} vaccine(s)</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {patientImmunizations.map((imm) => (
                  <div key={imm.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{imm.vaccineName}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                          {imm.doseNumber}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Child: <strong className="text-slate-900 dark:text-white">{imm.childName}</strong>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          imm.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {imm.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Target Due Date: <strong className="text-slate-700 dark:text-slate-300">{imm.dueDate}</strong>
                        {imm.administeredDate && ` • Administered on: ${imm.administeredDate} by ${imm.administeredBy || 'BHW'}`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPrintDocument({ type: 'immunization_card', data: imm })}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Bakuna Slip</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          No patient selected. Please choose a resident from the directory above.
        </div>
      )}
    </div>
  );
};
