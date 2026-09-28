import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  Search,
  Calendar,
  Clock,
  HeartPulse,
  Printer,
  Check,
  Plus,
  Filter,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { HealthAppointment } from '../../types/residentServices';
import { HealthPrintDocType } from './HealthPrintDocumentModal';
import { isResidentRecordOwner } from '../../utils/residentAccountFilter';
import { RecentSearchesInput } from '../RecentSearchesInput';

interface HealthConsultationsTabProps {
  appointments: HealthAppointment[];
  mode: 'admin' | 'resident';
  residentId?: string;
  residentName?: string;
  onOpenTriageModal?: (appt: HealthAppointment) => void;
  onUpdateStatus?: (id: string, status: HealthAppointment['status'], notes?: string) => void;
  onBookAppointment?: () => void;
  onPrintDocument: (doc: HealthPrintDocType) => void;
  onShowToast?: (msg: string) => void;
}

export const HealthConsultationsTab: React.FC<HealthConsultationsTabProps> = ({
  appointments,
  mode,
  residentId,
  residentName,
  onOpenTriageModal,
  onUpdateStatus,
  onBookAppointment,
  onPrintDocument,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Strict row-level isolation for resident account
  const userScopedAppointments = useMemo(() => {
    if (mode !== 'resident') return appointments;
    return (appointments || []).filter((a) =>
      isResidentRecordOwner(
        {
          residentId: a.residentId,
          residentName: a.residentName,
          patientName: a.patientName,
        },
        { residentId, name: residentName }
      )
    );
  }, [appointments, mode, residentId, residentName]);

  const pendingCount = userScopedAppointments.filter((a) => a.status === 'Pending Triage').length;
  const confirmedCount = userScopedAppointments.filter((a) => a.status === 'Confirmed').length;
  const completedCount = userScopedAppointments.filter((a) => a.status === 'Completed').length;

  const filteredAppointments = userScopedAppointments.filter((appt) => {
    const q = searchQuery.toLowerCase().trim();
    const id = (appt.id || '').toLowerCase();
    const service = (appt.serviceType || '').toLowerCase();
    const pName = (appt.patientName || appt.residentName || '').toLowerCase();
    const symptoms = (appt.symptomsOrPurpose || '').toLowerCase();

    const matchesSearch =
      !q ||
      id.includes(q) ||
      service.includes(q) ||
      pName.includes(q) ||
      symptoms.includes(q);

    const matchesStatus =
      statusFilter === 'All' ? true : appt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Clinical Triage Desk
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {appointments.length} Consultations Booked
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {mode === 'admin'
              ? 'Barangay Health Center Consultations & Triage Queue'
              : 'Clinical Consultations & Queue Status'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            {mode === 'admin'
              ? 'Triage patients, record vital signs (BP, Pulse, Temp, SpO2), log doctor recommendations, and manage clinic queue tickets.'
              : 'Book checkups with visiting physicians and barangay nurses. Monitor your live queue number and triage results.'}
          </p>

          {mode === 'resident' && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Personal Records: Showing only your registered consultations and triage slips.</span>
            </div>
          )}
        </div>

        {mode === 'resident' && onBookAppointment && (
          <button
            type="button"
            onClick={onBookAppointment}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Book Health Consultation</span>
          </button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{appointments.length}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Pending Triage</span>
          <p className="text-xl font-black text-amber-600 mt-1">{pendingCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">Confirmed Active</span>
          <p className="text-xl font-black text-sky-600 mt-1">{confirmedCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Completed</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <RecentSearchesInput
          className="w-full sm:w-80"
          placeholder="Search control #, patient, service..."
          value={searchQuery}
          onChange={setSearchQuery}
          storageKey="health_consultations"
          theme="light"
          inputClassName="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500"
        />

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'Pending Triage', 'Confirmed', 'Completed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Consultations Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Control No. & Service</th>
                <th className="p-3.5">Patient Name & Age</th>
                <th className="p-3.5">Preferred Schedule</th>
                <th className="p-3.5">Symptoms / Vitals</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {mode === 'resident'
                      ? 'No clinical consultations booked or recorded for your resident account.'
                      : 'No clinical consultations found matching the search or filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 pl-5">
                      <p className="font-mono text-[10px] text-slate-400 font-bold">{appt.id}</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{appt.serviceType}</p>
                      {appt.queueNumber && (
                        <span className="inline-block font-mono text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded mt-0.5">
                          {appt.queueNumber}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{appt.patientName}</p>
                      <p className="text-[11px] text-slate-500">{appt.patientAge} y/o (Booked: {appt.residentName})</p>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{appt.preferredDate}</p>
                      <p className="text-[11px] text-slate-400">{appt.preferredTimeSlot}</p>
                    </td>
                    <td className="p-3.5 max-w-xs space-y-1">
                      <p className="text-slate-600 dark:text-slate-400 truncate">{appt.symptomsOrPurpose}</p>
                      {appt.vitals?.bp && (
                        <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 text-[10px] font-bold rounded-md border border-blue-200 dark:border-blue-800">
                          <span>BP: {appt.vitals.bp}</span>
                          <span>HR: {appt.vitals.heartRate}</span>
                          <span>T: {appt.vitals.temperature}°C</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          appt.status === 'Completed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : appt.status === 'Confirmed'
                            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {mode === 'admin' && onOpenTriageModal && (
                          <button
                            onClick={() => onOpenTriageModal(appt)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                            <span>Triage Vitals</span>
                          </button>
                        )}
                        {mode === 'admin' && onUpdateStatus && appt.status === 'Confirmed' && (
                          <button
                            onClick={() => {
                              onUpdateStatus(appt.id, 'Completed', 'Consultation finished. Prescriptions provided.');
                              onShowToast?.(`Marked consultation #${appt.id} as Completed.`);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3 h-3" /> Mark Completed
                          </button>
                        )}
                        <button
                          onClick={() => onPrintDocument({ type: 'consultation', data: appt })}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Print Official Consultation Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Slip</span>
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
  );
};
