import React, { useState, useMemo } from 'react';
import {
  Pill,
  Search,
  Check,
  Package,
  Printer,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Plus,
  Filter,
  FileText,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import {
  MedicineRefillRequest,
  PharmacyInventoryItem,
} from '../../types/residentServices';
import { HealthPrintDocType } from './HealthPrintDocumentModal';
import { MonthlyDispensingReportModal } from './MonthlyDispensingReportModal';
import { useBarangay } from '../../context/BarangayContext';
import { isResidentRecordOwner } from '../../utils/residentAccountFilter';
import { RecentSearchesInput } from '../RecentSearchesInput';

interface HealthDispensingTabProps {
  requests: MedicineRefillRequest[];
  inventory: PharmacyInventoryItem[];
  mode: 'admin' | 'resident';
  residentId?: string;
  residentName?: string;
  currentAdminName?: string;
  onUpdateStatus?: (
    id: string,
    status: MedicineRefillRequest['status'],
    notes?: string
  ) => void;
  onRequestMedicine?: () => void;
  onPrintDocument: (doc: HealthPrintDocType) => void;
  onShowToast?: (msg: string) => void;
}

export const HealthDispensingTab: React.FC<HealthDispensingTabProps> = ({
  requests,
  inventory,
  mode,
  residentId,
  residentName,
  currentAdminName = 'Barangay Health Officer',
  onUpdateStatus,
  onRequestMedicine,
  onPrintDocument,
  onShowToast,
}) => {
  const { settings } = useBarangay();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Strict account isolation: in resident mode, strictly show only records matching this resident
  const userScopedRequests = useMemo(() => {
    if (mode !== 'resident') return requests;
    return (requests || []).filter((r) =>
      isResidentRecordOwner(
        {
          residentId: r.residentId,
          residentName: r.residentName,
          contactNumber: r.contactNumber,
        },
        { residentId, name: residentName }
      )
    );
  }, [requests, mode, residentId, residentName]);

  const pendingCount = userScopedRequests.filter(
    (r) => r.status === 'Pending Approval' || r.status === 'Pending Dispensing'
  ).length;
  const readyCount = userScopedRequests.filter((r) => r.status === 'Ready for Pickup').length;
  const dispensedCount = userScopedRequests.filter((r) => r.status === 'Dispensed').length;

  const filteredRequests = userScopedRequests.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const id = (r.id || '').toLowerCase();
    const medName = (r.medicineName || '').toLowerCase();
    const resName = (r.residentName || '').toLowerCase();
    const purpose = (r.purpose || '').toLowerCase();

    const matchesSearch =
      !q ||
      id.includes(q) ||
      medName.includes(q) ||
      resName.includes(q) ||
      purpose.includes(q);

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Pending'
        ? r.status === 'Pending Approval' || r.status === 'Pending Dispensing'
        : r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              Dispensary Desk
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {requests.length} Total Dispense Orders
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            {mode === 'admin'
              ? 'Maintenance Medicine Dispensing & Requisition Queue'
              : 'My Maintenance Medicine Requisitions & Pickup Status'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            {mode === 'admin'
              ? 'Review resident maintenance drug requisitions, verify doctor prescriptions, release medicines with automatic inventory deduction, and generate official monthly summary reports.'
              : 'Track the status of your monthly maintenance refills. Present your Claim Slip at the Health Center Botika counter.'}
          </p>

          {mode === 'resident' && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-lg text-rose-800 dark:text-rose-300 text-[11px] font-bold">
              <FileCheck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Personal Dispensary: Filtered strictly to your account's medicine requests.</span>
            </div>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2.5 self-start md:self-auto shrink-0">
          {/* Generate Report Button (Admin Only) */}
          {mode === 'admin' && (
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all"
              title="Generate summary PDF of all dispensed medications for current month"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Report</span>
            </button>
          )}

          {mode === 'resident' && onRequestMedicine && (
            <button
              type="button"
              onClick={onRequestMedicine}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Request Maintenance Medicine</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Requisitions</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{requests.length}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Pending Review</span>
          <p className="text-xl font-black text-amber-600 mt-1">{pendingCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">Ready for Pickup</span>
          <p className="text-xl font-black text-sky-600 mt-1">{readyCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Dispensed</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{dispensedCount}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <RecentSearchesInput
          className="w-full sm:w-80"
          placeholder="Search control #, medicine, resident..."
          value={searchQuery}
          onChange={setSearchQuery}
          storageKey="health_dispensing"
          theme="light"
          inputClassName="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500"
        />

        {/* Status Filter Tabs & Secondary Quick Report Button */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1">
            {['All', 'Pending', 'Ready for Pickup', 'Dispensed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  statusFilter === st
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {mode === 'admin' && (
            <>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
                title="Open Monthly Medication Dispensing Report"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Monthly PDF Report</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table / List Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Control No. & Medicine</th>
                <th className="p-3.5">Resident / Patient</th>
                <th className="p-3.5">Prescription / Indication</th>
                <th className="p-3.5">Requested Date</th>
                <th className="p-3.5">Dispense Status</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {mode === 'resident'
                      ? 'No medicine refill or dispensing records found for your resident account.'
                      : 'No medicine dispensing records found matching the filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((med) => {
                  const isPending =
                    med.status === 'Pending Dispensing' || med.status === 'Pending Approval';
                  const isReady = med.status === 'Ready for Pickup';
                  const isDispensed = med.status === 'Dispensed';

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-mono text-[10px] text-slate-400 font-bold">{med.id}</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{med.medicineName}</p>
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                          Qty: {med.quantityRequested} tabs/units
                        </p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{med.residentName}</p>
                        <p className="text-[11px] text-slate-500">{med.contactNumber || 'Resident of Barangay'}</p>
                      </td>
                      <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-400">
                        {med.prescriptionAttached && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-md mr-1.5 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3" /> Rx Verified
                          </span>
                        )}
                        <span className="text-xs">{med.purpose}</span>
                        {med.pharmacistNotes && (
                          <p className="text-[11px] text-cyan-900 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 p-1.5 rounded-lg border border-cyan-100 dark:border-cyan-900 mt-1">
                            <strong>Note:</strong> {med.pharmacistNotes}
                          </p>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {med.requestedAt}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isDispensed
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : isReady
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse'
                          }`}
                        >
                          {med.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {mode === 'admin' && onUpdateStatus && isPending && (
                            <button
                              onClick={() => {
                                onUpdateStatus(
                                  med.id,
                                  'Ready for Pickup',
                                  'Packaged at Health Center Botika counter. Claim with valid ID.'
                                );
                                onShowToast?.(`Medicine #${med.id} marked Ready for Pickup.`);
                              }}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Package className="w-3 h-3" /> Ready
                            </button>
                          )}
                          {mode === 'admin' && onUpdateStatus && isReady && (
                            <button
                              onClick={() => {
                                onUpdateStatus(
                                  med.id,
                                  'Dispensed',
                                  `Released by ${currentAdminName}. Stock auto-deducted.`
                                );
                                onShowToast?.(`Medicine #${med.id} released and inventory updated.`);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Check className="w-3 h-3" /> Mark Dispensed
                            </button>
                          )}
                          <button
                            onClick={() => onPrintDocument({ type: 'medicine_dispense', data: med })}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Print Rx Dispense Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Rx Slip</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Dispensing Report Modal */}
      <MonthlyDispensingReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        requests={requests}
        inventory={inventory}
        currentAdminName={currentAdminName}
        barangayName={settings?.barangayName}
        municipality={settings?.municipality}
        province={settings?.province}
        punongBarangay={settings?.punongBarangay}
      />
    </div>
  );
};
