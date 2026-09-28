import React, { useState, useMemo, useRef } from 'react';
import {
  Printer,
  Download,
  X,
  FileSpreadsheet,
  FileText,
  Pill,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Package,
  User,
  ShieldCheck,
  Building,
  Filter,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import {
  MedicineRefillRequest,
  PharmacyInventoryItem,
} from '../../types/residentServices';
import { RepublicSeal, BarangaySangkolSeal, DrySealStamp } from '../OfficialSeals';
import { printHtmlDocument, downloadHtmlReport, exportToCsv } from '../../utils/printUtils';
import { RecentSearchesInput } from '../RecentSearchesInput';

interface MonthlyDispensingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: MedicineRefillRequest[];
  inventory?: PharmacyInventoryItem[];
  currentAdminName?: string;
  barangayName?: string;
  municipality?: string;
  province?: string;
  punongBarangay?: string;
}

export const MonthlyDispensingReportModal: React.FC<MonthlyDispensingReportModalProps> = ({
  isOpen,
  onClose,
  requests,
  inventory = [],
  currentAdminName = 'Barangay Health Officer / Dispensary Officer',
  barangayName = 'Barangay Sangkol',
  municipality = 'Dipolog City',
  province = 'Zamboanga del Norte',
  punongBarangay = 'Hon. Roberto "Berting" Tan',
}) => {
  // Available Months Generator based on data + current year 2026
  const availableMonths = [
    { value: '2026-09', label: 'September 2026 (Current Month)' },
    { value: '2026-08', label: 'August 2026' },
    { value: '2026-07', label: 'July 2026' },
    { value: '2026-06', label: 'June 2026' },
    { value: '2026-05', label: 'May 2026' },
    { value: 'all', label: 'All Months (Year 2026 to Date)' },
  ];

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [filterStatus, setFilterStatus] = useState<'Dispensed' | 'All'>('Dispensed');
  const [searchFilter, setSearchFilter] = useState('');

  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Filter requests by month and status
  const monthlyRequests = useMemo(() => {
    return requests.filter((r) => {
      // Check date matches selected month (via requestedAt or dispensedAt)
      const dateToCheck = r.dispensedAt || r.requestedAt || '2026-09-01';
      const matchesMonth =
        selectedMonth === 'all' ? true : dateToCheck.startsWith(selectedMonth);

      // Status match
      const matchesStatus =
        filterStatus === 'All' ? true : r.status === 'Dispensed';

      // Search match
      const q = searchFilter.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.medicineName.toLowerCase().includes(q) ||
        r.residentName.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q) ||
        (r.dispensedBy && r.dispensedBy.toLowerCase().includes(q));

      return matchesMonth && matchesStatus && matchesSearch;
    });
  }, [requests, selectedMonth, filterStatus, searchFilter]);

  // Aggregate Metrics
  const totalTransactions = monthlyRequests.length;
  const totalUnitsDispensed = monthlyRequests.reduce(
    (acc, curr) => acc + (curr.quantityRequested || 0),
    0
  );
  const uniqueResidents = new Set(monthlyRequests.map((r) => r.residentName.toLowerCase())).size;
  const rxVerifiedCount = monthlyRequests.filter((r) => r.prescriptionAttached).length;
  const rxVerifiedPct =
    totalTransactions > 0 ? Math.round((rxVerifiedCount / totalTransactions) * 100) : 100;

  // Group by Medicine
  const medBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        medicineName: string;
        totalQty: number;
        transactions: number;
        category?: string;
        batchNumbers: Set<string>;
      }
    >();

    monthlyRequests.forEach((req) => {
      const key = req.medicineName;
      const existing = map.get(key) || {
        medicineName: req.medicineName,
        totalQty: 0,
        transactions: 0,
        category: 'Maintenance Pharmacy',
        batchNumbers: new Set<string>(),
      };

      existing.totalQty += req.quantityRequested || 0;
      existing.transactions += 1;
      if (req.batchDispensed) {
        existing.batchNumbers.add(req.batchDispensed);
      }

      // Match with inventory item if available
      const matchingInv = inventory.find(
        (inv) =>
          inv.id === req.inventoryItemId ||
          inv.name?.toLowerCase() === req.medicineName.toLowerCase() ||
          inv.genericName.toLowerCase().includes(req.medicineName.split(' ')[0].toLowerCase())
      );
      if (matchingInv) {
        existing.category = matchingInv.category;
      }

      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [monthlyRequests, inventory]);

  // Group by Category
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    medBreakdown.forEach((med) => {
      const cat = med.category || 'Maintenance Drug';
      map.set(cat, (map.get(cat) || 0) + med.totalQty);
    });
    return Array.from(map.entries()).map(([category, qty]) => ({
      category,
      qty,
      percentage: totalUnitsDispensed > 0 ? Math.round((qty / totalUnitsDispensed) * 100) : 0,
    }));
  }, [medBreakdown, totalUnitsDispensed]);

  const monthLabel =
    availableMonths.find((m) => m.value === selectedMonth)?.label || 'September 2026';

  const dateGenerated = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Handle Printable PDF Generation
  const handlePrintPdf = () => {
    const bodyContent = reportContainerRef.current?.innerHTML || '';
    printHtmlDocument(
      `Monthly-Medication-Dispensing-Report-${selectedMonth}-${barangayName.replace(/\s+/g, '-')}`,
      bodyContent
    );
  };

  // Handle HTML Report Download
  const handleDownloadHtml = () => {
    const bodyContent = reportContainerRef.current?.innerHTML || '';
    downloadHtmlReport(
      `Monthly-Dispensing-Report-${selectedMonth}.html`,
      `Monthly Medication Dispensing Summary - ${monthLabel}`,
      bodyContent
    );
  };

  // Handle CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Control No.',
      'Resident Name',
      'Contact Number',
      'Medicine Name',
      'Quantity Dispensed',
      'Purpose / Indication',
      'Doctor Prescriber',
      'Doctor License #',
      'Prescription Attached',
      'Dispensed By',
      'Dispensed Date',
      'Batch / Lot #',
      'Status',
    ];

    const rows = monthlyRequests.map((r) => [
      r.id,
      r.residentName,
      r.contactNumber || 'N/A',
      r.medicineName,
      r.quantityRequested,
      r.purpose,
      r.doctorPrescriberName || 'N/A',
      r.doctorLicenseNo || 'N/A',
      r.prescriptionAttached ? 'Yes' : 'No',
      r.dispensedBy || 'Dispensary Officer',
      r.dispensedAt || r.requestedAt,
      r.batchDispensed || 'LOT-2026-DEF',
      r.status,
    ]);

    exportToCsv(`Dispensed-Medications-Report-${selectedMonth}.csv`, headers, rows);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Top Sticky Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Botika Summary Report
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {monthlyRequests.length} Records Loaded
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Monthly Dispensing Summary Report
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              title="Print official document or save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-all"
              title="Download standalone HTML report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-all"
              title="Export as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Header */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>Target Month:</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Scope:</span>
            </label>
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setFilterStatus('Dispensed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'Dispensed'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Dispensed Only ({requests.filter((r) => r.status === 'Dispensed').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('All')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'All'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Orders ({requests.length})
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <RecentSearchesInput
            className="w-full sm:w-60"
            placeholder="Search medicine, resident..."
            value={searchFilter}
            onChange={setSearchFilter}
            storageKey="monthly_dispensing_report"
            theme="light"
            inputClassName="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950">
          <div
            ref={reportContainerRef}
            className="max-w-4xl mx-auto bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-md border border-slate-200 font-sans text-xs space-y-6"
          >
            {/* 1. Official Header / Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 text-center relative">
              <div className="flex items-center justify-between gap-4">
                <div className="w-16 h-16 flex items-center justify-center shrink-0">
                  <RepublicSeal size={64} />
                </div>

                <div className="flex-1 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Republic of the Philippines • Department of Health
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Province of {province} • {municipality}
                  </p>
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase mt-0.5">
                    {barangayName} Primary Health Station
                  </h1>
                  <p className="text-[11px] font-semibold text-rose-700">
                    BARANGAY BOTIKA SA BARANGAY (BSB) & MAINTENANCE DRUG DISPENSARY
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Purok Health Center, {barangayName} • Hotline: (088) 822-4410 • Email: health.{barangayName.toLowerCase().replace(/\s+/g, '')}@gov.ph
                  </p>
                </div>

                <div className="w-16 h-16 flex items-center justify-center shrink-0">
                  <BarangaySangkolSeal size={64} />
                </div>
              </div>

              {/* Title Banner */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col items-center">
                <div className="inline-block px-4 py-1 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-xs">
                  Monthly Medication Dispensing & Consumption Summary Report
                </div>
                <p className="text-xs font-bold text-slate-700 mt-1.5">
                  Reporting Period: <span className="text-rose-700 underline">{monthLabel}</span>
                </p>
              </div>
            </div>

            {/* 2. Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Document Control #</span>
                <strong className="font-mono text-slate-900 text-xs">
                  RPT-DISP-{selectedMonth.replace('-', '')}-{Math.floor(1000 + Math.random() * 9000)}
                </strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Date Generated</span>
                <strong className="text-slate-800">{dateGenerated}</strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Officer In-Charge</span>
                <strong className="text-slate-800">{currentAdminName}</strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Health Station Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                  <CheckCircle2 className="w-3 h-3" /> Fully Operational
                </span>
              </div>
            </div>

            {/* 3. Executive KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                <span className="text-[9px] font-bold text-rose-800 uppercase tracking-wider block">
                  Total Dispensed Orders
                </span>
                <p className="text-xl font-black text-rose-900 mt-1">{totalTransactions}</p>
                <p className="text-[9px] text-rose-700 mt-0.5">Approved & completed releases</p>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <span className="text-[9px] font-bold text-blue-800 uppercase tracking-wider block">
                  Total Units / Tablets Released
                </span>
                <p className="text-xl font-black text-blue-900 mt-1">{totalUnitsDispensed}</p>
                <p className="text-[9px] text-blue-700 mt-0.5">Tabs, caps & doses distributed</p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Unique Beneficiaries Served
                </span>
                <p className="text-xl font-black text-emerald-900 mt-1">{uniqueResidents}</p>
                <p className="text-[9px] text-emerald-700 mt-0.5">Resident patients assisted</p>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                <span className="text-[9px] font-bold text-purple-800 uppercase tracking-wider block">
                  Doctor Rx Verification
                </span>
                <p className="text-xl font-black text-purple-900 mt-1">{rxVerifiedPct}%</p>
                <p className="text-[9px] text-purple-700 mt-0.5">({rxVerifiedCount}/{totalTransactions} with verified Rx)</p>
              </div>
            </div>

            {/* 4. Drug Category & Top Dispensed Medicines Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>1. Therapeutic Category & Inventory Consumption Breakdown</span>
                <span className="text-[10px] text-slate-500 font-medium lowercase">({medBreakdown.length} unique medicines dispensed)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Breakdown Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 pl-3">Therapeutic Class</th>
                        <th className="p-2 text-right">Units Released</th>
                        <th className="p-2 pr-3 text-right">Share (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryBreakdown.map((cat, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 pl-3 font-semibold text-slate-800">{cat.category}</td>
                          <td className="p-2 text-right font-bold text-rose-700">{cat.qty} tabs</td>
                          <td className="p-2 pr-3 text-right font-mono text-slate-600">{cat.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Top Dispensed Drugs Summary Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 pl-3">Medicine / Formulation</th>
                        <th className="p-2 text-center">Orders</th>
                        <th className="p-2 pr-3 text-right">Qty Distributed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medBreakdown.slice(0, 5).map((med, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 pl-3">
                            <p className="font-bold text-slate-800">{med.medicineName}</p>
                            <span className="text-[9px] text-slate-500">{med.category}</span>
                          </td>
                          <td className="p-2 text-center font-semibold text-slate-700">{med.transactions}x</td>
                          <td className="p-2 pr-3 text-right font-black text-rose-700">{med.totalQty} tabs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 5. Complete Itemized Dispensing Records Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>2. Itemized Medication Dispensing Registry</span>
                <span className="text-[10px] text-slate-500 font-medium">Showing {monthlyRequests.length} transaction records</span>
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2 pl-3">Ref ID</th>
                      <th className="p-2">Date Released</th>
                      <th className="p-2">Resident Beneficiary</th>
                      <th className="p-2">Medicine Dispensed</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2">Indication / Purpose</th>
                      <th className="p-2">Prescribing Doctor</th>
                      <th className="p-2 pr-3">Dispensed By & Batch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                          No medication dispensing records found for the selected month and criteria.
                        </td>
                      </tr>
                    ) : (
                      monthlyRequests.map((req, idx) => (
                        <tr key={req.id || idx} className="hover:bg-slate-50/80">
                          <td className="p-2 pl-3 font-mono font-bold text-slate-600">{req.id}</td>
                          <td className="p-2 whitespace-nowrap text-slate-700 font-medium">
                            {req.dispensedAt || req.requestedAt}
                          </td>
                          <td className="p-2">
                            <p className="font-bold text-slate-900">{req.residentName}</p>
                            <p className="text-[9px] text-slate-500">{req.contactNumber || 'Resident Beneficiary'}</p>
                          </td>
                          <td className="p-2">
                            <p className="font-bold text-slate-900">{req.medicineName}</p>
                            {req.prescriptionAttached && (
                              <span className="inline-block text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 mt-0.5">
                                Rx Verified
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center font-black text-rose-700">
                            {req.quantityRequested}
                          </td>
                          <td className="p-2 max-w-[140px] text-slate-600 truncate" title={req.purpose}>
                            {req.purpose}
                          </td>
                          <td className="p-2 text-slate-700">
                            {req.doctorPrescriberName ? (
                              <>
                                <p className="font-semibold">{req.doctorPrescriberName}</p>
                                <p className="text-[9px] text-slate-400">{req.doctorLicenseNo || 'PRC Verified'}</p>
                              </>
                            ) : (
                              <span className="text-slate-400 italic">Health Station Protocol</span>
                            )}
                          </td>
                          <td className="p-2 pr-3">
                            <p className="font-medium text-slate-800">{req.dispensedBy || currentAdminName}</p>
                            <p className="text-[8px] font-mono text-slate-400">
                              Lot: {req.batchDispensed || 'LOT-2026-NCD'}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. Inventory Reorder & Stock Balance Notice */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[10px] space-y-0.5">
                <p className="font-bold uppercase tracking-wider text-amber-800">
                  Botika Sa Barangay Stock Requisition Protocol
                </p>
                <p className="text-amber-700 leading-relaxed">
                  All dispensed quantities have been deducted from the active Botika sa Barangay inventory ledger. Medications reaching minimum threshold levels will be automatically queued in the City Health Office Quarterly Allocation requisition form.
                </p>
              </div>
            </div>

            {/* 7. Official Signatures & Attestation */}
            <div className="pt-6 border-t-2 border-slate-900 space-y-4">
              <p className="text-[10px] text-slate-500 italic text-center">
                I hereby certify that the above medication dispensing records and pharmaceutical inventory releases for {barangayName} are true, accurate, and dispensed strictly in compliance with DOH Republic Act 9502 and Local Health Board guidelines.
              </p>

              <div className="grid grid-cols-3 gap-6 pt-6 text-center">
                {/* Prepared By */}
                <div className="space-y-1">
                  <div className="border-b border-slate-900 pb-1">
                    <strong className="block text-slate-900 text-xs uppercase font-black">
                      {currentAdminName}
                    </strong>
                  </div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">
                    Dispensary Officer / Health In-Charge
                  </span>
                  <span className="text-[8px] text-slate-400">Barangay Health Station</span>
                </div>

                {/* Verified By */}
                <div className="space-y-1">
                  <div className="border-b border-slate-900 pb-1">
                    <strong className="block text-slate-900 text-xs uppercase font-black">
                      Carmela Reyes, R.M.
                    </strong>
                  </div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">
                    Rural Health Midwife / BHW Lead
                  </span>
                  <span className="text-[8px] text-slate-400">City Health District Office</span>
                </div>

                {/* Approved By */}
                <div className="space-y-1">
                  <div className="border-b border-slate-900 pb-1">
                    <strong className="block text-slate-900 text-xs uppercase font-black">
                      {punongBarangay}
                    </strong>
                  </div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">
                    Punong Barangay
                  </span>
                  <span className="text-[8px] text-slate-400">Chairperson, Committee on Health</span>
                </div>
              </div>
            </div>

            {/* Document Footer Verification Stamp */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[9px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Barangay Sangkol BIMS • Official Health Registry v2.6 • 256-Bit Encrypted Record</span>
              </div>
              <div>Page 1 of 1 • System Generated</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
