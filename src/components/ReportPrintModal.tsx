import React, { useState, useRef } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { RepublicSeal, BarangaySangkolSeal, DrySealStamp } from './OfficialSeals';
import { printHtmlDocument, downloadHtmlReport, exportToCsv } from '../utils/printUtils';
import {
  Printer,
  X,
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  ShieldAlert,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  Table,
  Receipt,
  Building,
} from 'lucide-react';

export type ReportType =
  | 'comprehensive'
  | 'demographics'
  | 'financial'
  | 'peace_order'
  | 'purok_matrix';

interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReportType?: ReportType;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  isOpen,
  onClose,
  initialReportType = 'demographics',
}) => {
  const {
    residents,
    households,
    certificates,
    blotters,
    complaints,
    businesses,
    transactions,
    settings,
    officials,
    arePuroksMatching,
  } = useBarangay();

  const [reportType, setReportType] = useState<ReportType>(initialReportType);
  const [selectedPurok, setSelectedPurok] = useState<string>('All');
  const [reportYear, setReportYear] = useState<string>('2026');

  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Filter residents
  const activeResidents = residents.filter((r) => {
    const isAct = r.residentStatus === 'Active';
    const matchesPurok = arePuroksMatching(r.purok, selectedPurok);
    return isAct && matchesPurok;
  });

  const allActiveResidents = residents.filter((r) => r.residentStatus === 'Active');

  // Demographic stats
  const maleCount = activeResidents.filter((r) => r.sex === 'Male').length;
  const femaleCount = activeResidents.filter((r) => r.sex === 'Female').length;
  const age0to14 = activeResidents.filter((r) => r.age < 15).length;
  const age15to30 = activeResidents.filter((r) => r.age >= 15 && r.age <= 30).length;
  const age31to59 = activeResidents.filter((r) => r.age > 30 && r.age < 60).length;
  const age60plus = activeResidents.filter((r) => r.age >= 60).length;

  const seniors = activeResidents.filter((r) => r.isSeniorCitizen).length;
  const pwds = activeResidents.filter((r) => r.isPWD).length;
  const fourPs = activeResidents.filter((r) => r.is4PsBeneficiary).length;
  const soloParents = activeResidents.filter((r) => r.isSoloParent).length;
  const indigents = activeResidents.filter((r) => r.isIndigent).length;
  const voters = activeResidents.filter((r) => String(r.voterStatus || '').toLowerCase() === 'registered').length;
  const youth = activeResidents.filter((r) => r.isYouth).length;

  // Household stats
  const activeHouseholds = households.filter((h) => arePuroksMatching(h.purok, selectedPurok));

  // Financial stats
  const totalRevenue = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  // Peace & Order stats
  const settledBlotters = blotters.filter((b) => b.status === 'Amicably Settled' || b.status === 'Settled').length;
  const settledComplaints = complaints.filter((c) => c.status?.toLowerCase().includes('settled')).length;
  const totalDisputes = blotters.length + complaints.length;
  const totalSettled = settledBlotters + settledComplaints;
  const settlementRate = totalDisputes > 0 ? Math.round((totalSettled / totalDisputes) * 100) : 100;

  // Purok breakdown
  const purokMatrix = settings.puroks.map((purok) => {
    const pResidents = allActiveResidents.filter((r) => arePuroksMatching(r.purok, purok));
    const pHouseholds = households.filter((h) => arePuroksMatching(h.purok, purok));
    const pVoters = pResidents.filter((r) => String(r.voterStatus || '').toLowerCase() === 'registered').length;
    const pSeniors = pResidents.filter((r) => r.isSeniorCitizen).length;
    const pPwds = pResidents.filter((r) => r.isPWD).length;
    const p4Ps = pResidents.filter((r) => r.is4PsBeneficiary).length;
    const pIndigents = pResidents.filter((r) => r.isIndigent).length;
    return {
      purok,
      residentsCount: pResidents.length,
      householdsCount: pHouseholds.length,
      votersCount: pVoters,
      seniorsCount: pSeniors,
      pwdsCount: pPwds,
      fourPsCount: p4Ps,
      indigentsCount: pIndigents,
    };
  });

  const currentDateFormatted = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const punongBarangay =
    officials.find((o) => o.position.includes('Punong Barangay') || o.position.includes('Captain'))?.name ||
    settings.punongBarangay;
  const secretary =
    officials.find((o) => o.position.includes('Secretary'))?.name || settings.barangaySecretary;
  const treasurer =
    officials.find((o) => o.position.includes('Treasurer'))?.name || settings.barangayTreasurer;

  // Handle Print Action
  const handlePrint = () => {
    if (printContentRef.current) {
      const title = `${settings.barangayName} - Official Statistical Report (${reportType})`;
      printHtmlDocument(title, printContentRef.current.innerHTML);
    } else {
      window.print();
    }
  };

  // Handle Download HTML / Document
  const handleDownloadDoc = () => {
    if (printContentRef.current) {
      const filename = `Barangay_Sangkol_Report_${reportType}_${selectedPurok.replace(/\s+/g, '_')}_${reportYear}.html`;
      const title = `${settings.barangayName} - Official Statistical Report`;
      downloadHtmlReport(filename, title, printContentRef.current.innerHTML);
    }
  };

  // Handle CSV Data Export
  const handleExportCsv = () => {
    if (reportType === 'demographics' || reportType === 'purok_matrix' || reportType === 'comprehensive') {
      const headers = [
        'Purok',
        'Total Residents',
        'Total Households',
        'Registered Voters',
        'Senior Citizens (60+)',
        'PWDs',
        '4Ps Beneficiaries',
        'Indigent Inhabitants',
      ];
      const rows = purokMatrix.map((p) => [
        p.purok,
        p.residentsCount,
        p.householdsCount,
        p.votersCount,
        p.seniorsCount,
        p.pwdsCount,
        p.fourPsCount,
        p.indigentsCount,
      ]);
      exportToCsv(`Barangay_Sangkol_Demographics_Matrix_${reportYear}.csv`, headers, rows);
    } else if (reportType === 'financial') {
      const headers = ['OR Number', 'Date', 'Payor Name', 'Service / Certificate Type', 'Amount (PHP)', 'Payment Method', 'Cashier'];
      const rows = transactions.map((t) => [
        t.orNumber,
        t.date,
        t.payorName,
        t.serviceType,
        t.amount,
        t.paymentMethod || 'Cash',
        t.cashierName,
      ]);
      exportToCsv(`Barangay_Sangkol_Financial_Revenue_Journal_${reportYear}.csv`, headers, rows);
    } else if (reportType === 'peace_order') {
      const headers = ['Blotter No', 'Date Reported', 'Incident Type', 'Purok', 'Complainant', 'Respondent', 'Status', 'Assigned Officer'];
      const rows = blotters.map((b) => [
        b.blotterNo,
        b.dateReported,
        b.incidentType,
        b.purok,
        b.complainantName,
        b.respondentName,
        b.status,
        b.assignedOfficer,
      ]);
      exportToCsv(`Barangay_Sangkol_Peace_Order_Blotters_${reportYear}.csv`, headers, rows);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 modal-backdrop">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Official Report Generator & Print Desk</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  Official Document
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Generate, preview, print, and export official executive statistical reports
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadDoc}
              title="Download standalone printable HTML / Document"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>HTML Doc</span>
            </button>

            <button
              onClick={handleExportCsv}
              title="Export report table data as CSV"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
            >
              <Table className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Report Controls Bar (Hidden on Print) */}
        <div className="no-print px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Report Type Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-600 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Report Type:</span>
            </span>
            <button
              onClick={() => setReportType('demographics')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                reportType === 'demographics'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Demographics Profile
            </button>
            <button
              onClick={() => setReportType('financial')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                reportType === 'financial'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Financial & O.R.
            </button>
            <button
              onClick={() => setReportType('peace_order')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                reportType === 'peace_order'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Peace & Order
            </button>
            <button
              onClick={() => setReportType('purok_matrix')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                reportType === 'purok_matrix'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Purok Matrix
            </button>
            <button
              onClick={() => setReportType('comprehensive')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                reportType === 'comprehensive'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Consolidated Annual
            </button>
          </div>

          {/* Filters: Purok & Year */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Purok:</span>
              <select
                value={selectedPurok}
                onChange={(e) => setSelectedPurok(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              >
                <option value="All">All Puroks ({settings.puroks.length})</option>
                {settings.puroks.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Year:</span>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              >
                <option value="2026">CY 2026</option>
                <option value="2025">CY 2025</option>
                <option value="All-time">All Records</option>
              </select>
            </div>
          </div>
        </div>

        {/* Printable Canvas Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 printable-area">
          <div
            ref={printContentRef}
            className="bg-white p-8 sm:p-10 rounded-xl border border-slate-200 shadow-xs max-w-4xl mx-auto text-slate-900 space-y-6"
          >
            {/* OFFICIAL HEADER WITH SEALS */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 text-center">
              <div className="w-20 sm:w-24 flex justify-center shrink-0">
                <RepublicSeal size={74} />
              </div>

              <div className="flex-1 px-4 space-y-0.5 text-center">
                <p className="text-[11px] uppercase tracking-widest font-serif font-bold text-slate-700">
                  Republic of the Philippines
                </p>
                <p className="text-[11px] uppercase tracking-widest font-serif text-slate-700">
                  {settings.province} • {settings.municipality}
                </p>
                <h1 className="text-base sm:text-lg font-serif font-black tracking-wider text-slate-900 uppercase pt-0.5">
                  {settings.barangayName}
                </h1>
                <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide mt-1">
                  {reportType === 'demographics' && 'BARANGAY DEMOGRAPHIC & POPULATION PROFILE REPORT (RBI FORM 1A)'}
                  {reportType === 'financial' && 'BARANGAY REVENUE, COLLECTIONS & FINANCIAL AUDIT REPORT'}
                  {reportType === 'peace_order' && 'BARANGAY PEACE AND ORDER & BLOTTER STATISTICAL REPORT'}
                  {reportType === 'purok_matrix' && 'PUROK DEMOGRAPHIC DENSITY & SECTORAL DISTRIBUTION MATRIX'}
                  {reportType === 'comprehensive' && 'CONSOLIDATED BARANGAY ANNUAL EXECUTIVE & OPERATIONAL REPORT'}
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  Period: CY {reportYear} • Scope: {selectedPurok === 'All' ? 'Barangay-Wide (All Puroks)' : selectedPurok}
                </p>
              </div>

              <div className="w-20 sm:w-24 flex justify-center shrink-0">
                <BarangaySangkolSeal size={74} />
              </div>
            </div>

            {/* Sub-header meta bar */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-200 pb-2">
              <span>Date Generated: <strong>{currentDateFormatted}</strong></span>
              <span>Document Control: <strong>BS-REP-{reportYear}-{String(Math.floor(Math.random() * 900) + 100)}</strong></span>
              <span>Source: <strong>Registry of Barangay Inhabitants (BS-MIS)</strong></span>
            </div>

            {/* SECTION 1: DEMOGRAPHICS REPORT */}
            {(reportType === 'demographics' || reportType === 'comprehensive') && (
              <div className="space-y-4">
                <div className="border-b border-slate-300 pb-1">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-700" />
                    <span>I. Population & Demographic Profile</span>
                  </h2>
                </div>

                {/* Key Metric Blocks */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Population</span>
                    <span className="text-xl font-black text-slate-900">{activeResidents.length}</span>
                    <p className="text-[9px] text-slate-500">Active Inhabitants</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Households</span>
                    <span className="text-xl font-black text-slate-900">{activeHouseholds.length}</span>
                    <p className="text-[9px] text-slate-500">Living Quarters</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Registered Voters</span>
                    <span className="text-xl font-black text-slate-900">{voters}</span>
                    <p className="text-[9px] text-slate-500">
                      {((voters / (activeResidents.length || 1)) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Senior Citizens</span>
                    <span className="text-xl font-black text-slate-900">{seniors}</span>
                    <p className="text-[9px] text-slate-500">Age 60 & Above</p>
                  </div>
                </div>

                {/* Age & Gender Distribution Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-800 uppercase mb-2">Age Bracket Distribution</h3>
                    <table className="w-full border-collapse border border-slate-200 text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700">
                          <th className="border border-slate-200 p-1.5 text-left font-bold">Age Bracket</th>
                          <th className="border border-slate-200 p-1.5 text-right font-bold">Inhabitants</th>
                          <th className="border border-slate-200 p-1.5 text-right font-bold">% Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-200 p-1.5">Children (0 - 14 yrs)</td>
                          <td className="border border-slate-200 p-1.5 text-right font-bold">{age0to14}</td>
                          <td className="border border-slate-200 p-1.5 text-right">{((age0to14 / (activeResidents.length || 1)) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 p-1.5">Youth (15 - 30 yrs)</td>
                          <td className="border border-slate-200 p-1.5 text-right font-bold">{age15to30}</td>
                          <td className="border border-slate-200 p-1.5 text-right">{((age15to30 / (activeResidents.length || 1)) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 p-1.5">Working Adults (31 - 59 yrs)</td>
                          <td className="border border-slate-200 p-1.5 text-right font-bold">{age31to59}</td>
                          <td className="border border-slate-200 p-1.5 text-right">{((age31to59 / (activeResidents.length || 1)) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 p-1.5">Senior Citizens (60+ yrs)</td>
                          <td className="border border-slate-200 p-1.5 text-right font-bold">{age60plus}</td>
                          <td className="border border-slate-200 p-1.5 text-right">{((age60plus / (activeResidents.length || 1)) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                          <td className="border border-slate-200 p-1.5">Total Population</td>
                          <td className="border border-slate-200 p-1.5 text-right font-black">{activeResidents.length}</td>
                          <td className="border border-slate-200 p-1.5 text-right">100.0%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold text-slate-800 uppercase mb-2">Sex & Vulnerable Sector Breakdown</h3>
                    <table className="w-full border-collapse border border-slate-200 text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700">
                          <th className="border border-slate-200 p-1.5 text-left font-bold">Sector / Classification</th>
                          <th className="border border-slate-200 p-1.5 text-right font-bold">Count</th>
                          <th className="border border-slate-200 p-1.5 text-right font-bold">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-200 p-1.5">Male Inhabitants</td>
                          <td className="border border-slate-200 p-1.5 text-right font-bold">{maleCount}</td>
                          <td className="border border-slate-200 p-1.5 text-right text-[10px] text-slate-500">{((maleCount / (activeResidents.length || 1)) * 100).toFixed(1)}% ratio</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 p-1.5">Female Inhabitants</td>
                          <td className="border border-slate-200 p-1.5 text-right font-bold">{femaleCount}</td>
                          <td className="border border-slate-200 p-1.5 text-right text-[10px] text-slate-500">{((femaleCount / (activeResidents.length || 1)) * 100).toFixed(1)}% ratio</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 p-1.5">Persons with Disability (PWD)</td>
                          <td className="border border-slate-200 p-1.5 text-right font-bold">{pwds}</td>
                          <td className="border border-slate-200 p-1.5 text-right text-[10px] text-slate-500">With verified PWD ID</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 p-1.5">4Ps Program Beneficiaries</td>
                          <td className="border border-slate-200 p-1.5 text-right font-bold">{fourPs}</td>
                          <td className="border border-slate-200 p-1.5 text-right text-[10px] text-slate-500">DSWD 4Ps Roster</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 p-1.5">Indigent Families / Inhabitants</td>
                          <td className="border border-slate-200 p-1.5 text-right font-bold">{indigents}</td>
                          <td className="border border-slate-200 p-1.5 text-right text-[10px] text-slate-500">DSWD / MSWDO tier</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 p-1.5">Solo Parents</td>
                          <td className="border border-slate-200 p-1.5 text-right font-bold">{soloParents}</td>
                          <td className="border border-slate-200 p-1.5 text-right text-[10px] text-slate-500">RA 11861 Beneficiaries</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: PUROK MATRIX REPORT */}
            {(reportType === 'purok_matrix' || reportType === 'demographics' || reportType === 'comprehensive') && (
              <div className="space-y-3 pt-2">
                <div className="border-b border-slate-300 pb-1">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-indigo-700" />
                    <span>{reportType === 'comprehensive' ? 'II. Purok-by-Purok Population Density Matrix' : 'Purok Density & Sectoral Breakdown'}</span>
                  </h2>
                </div>

                <table className="w-full border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700">
                      <th className="border border-slate-200 p-1.5 text-left font-bold">Purok Area</th>
                      <th className="border border-slate-200 p-1.5 text-right font-bold">Residents</th>
                      <th className="border border-slate-200 p-1.5 text-right font-bold">Households</th>
                      <th className="border border-slate-200 p-1.5 text-right font-bold">Voters</th>
                      <th className="border border-slate-200 p-1.5 text-right font-bold">Seniors</th>
                      <th className="border border-slate-200 p-1.5 text-right font-bold">PWDs</th>
                      <th className="border border-slate-200 p-1.5 text-right font-bold">4Ps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purokMatrix.map((p) => (
                      <tr key={p.purok} className={selectedPurok === p.purok ? 'bg-indigo-50/50 font-bold' : ''}>
                        <td className="border border-slate-200 p-1.5 font-semibold text-slate-900">{p.purok}</td>
                        <td className="border border-slate-200 p-1.5 text-right font-bold">{p.residentsCount}</td>
                        <td className="border border-slate-200 p-1.5 text-right">{p.householdsCount}</td>
                        <td className="border border-slate-200 p-1.5 text-right">{p.votersCount}</td>
                        <td className="border border-slate-200 p-1.5 text-right">{p.seniorsCount}</td>
                        <td className="border border-slate-200 p-1.5 text-right">{p.pwdsCount}</td>
                        <td className="border border-slate-200 p-1.5 text-right">{p.fourPsCount}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td className="border border-slate-200 p-1.5 font-black uppercase">Total Barangay Total</td>
                      <td className="border border-slate-200 p-1.5 text-right font-black">{allActiveResidents.length}</td>
                      <td className="border border-slate-200 p-1.5 text-right font-black">{households.length}</td>
                      <td className="border border-slate-200 p-1.5 text-right font-black">{allActiveResidents.filter(r => r.voterStatus === 'Registered').length}</td>
                      <td className="border border-slate-200 p-1.5 text-right font-black">{allActiveResidents.filter(r => r.isSeniorCitizen).length}</td>
                      <td className="border border-slate-200 p-1.5 text-right font-black">{allActiveResidents.filter(r => r.isPWD).length}</td>
                      <td className="border border-slate-200 p-1.5 text-right font-black">{allActiveResidents.filter(r => r.is4PsBeneficiary).length}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* SECTION 3: FINANCIAL REVENUE REPORT */}
            {(reportType === 'financial' || reportType === 'comprehensive') && (
              <div className="space-y-4 pt-2">
                <div className="border-b border-slate-300 pb-1">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-700" />
                    <span>{reportType === 'comprehensive' ? 'III. Financial Collections & Revenue Summary' : 'Barangay Revenue & Official Receipts Summary'}</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-[9px] uppercase font-bold text-emerald-800 block">Total Revenue Collected</span>
                    <span className="text-xl font-black text-emerald-950">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <p className="text-[9px] text-emerald-700">Official Barangay Treasury</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Official Receipts (O.R.)</span>
                    <span className="text-xl font-black text-slate-900">{transactions.length}</span>
                    <p className="text-[9px] text-slate-500">Total Validated Transactions</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Commercial Establishments</span>
                    <span className="text-xl font-black text-slate-900">{businesses.length}</span>
                    <p className="text-[9px] text-slate-500">Registered Local Businesses</p>
                  </div>
                </div>

                {/* Standard Barangay Fees Schedule */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase mb-1">Standard Regulatory Fee Schedule</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2 border border-slate-200 rounded bg-slate-50">
                      <p className="text-[10px] text-slate-600 font-medium">Barangay Clearance</p>
                      <p className="font-bold text-slate-900">₱{settings.clearanceFeeRegular?.toFixed(2) || '50.00'}</p>
                    </div>
                    <div className="p-2 border border-slate-200 rounded bg-slate-50">
                      <p className="text-[10px] text-slate-600 font-medium">Business Clearance</p>
                      <p className="font-bold text-slate-900">₱{settings.businessClearanceFee?.toFixed(2) || '300.00'}</p>
                    </div>
                    <div className="p-2 border border-slate-200 rounded bg-slate-50">
                      <p className="text-[10px] text-slate-600 font-medium">Residency Certificate</p>
                      <p className="font-bold text-slate-900">₱{settings.residencyCertFee?.toFixed(2) || '50.00'}</p>
                    </div>
                    <div className="p-2 border border-slate-200 rounded bg-slate-50">
                      <p className="text-[10px] text-slate-600 font-medium">Indigency Certificate</p>
                      <p className="font-bold text-slate-900">₱{settings.indigencyCertFee?.toFixed(2) || '0.00'} (FREE)</p>
                    </div>
                    <div className="p-2 border border-slate-200 rounded bg-slate-50">
                      <p className="text-[10px] text-slate-600 font-medium">Good Moral Certificate</p>
                      <p className="font-bold text-slate-900">₱{settings.goodMoralFee?.toFixed(2) || '50.00'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: PEACE & ORDER / BLOTTER REPORT */}
            {(reportType === 'peace_order' || reportType === 'comprehensive') && (
              <div className="space-y-4 pt-2">
                <div className="border-b border-slate-300 pb-1">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-700" />
                    <span>{reportType === 'comprehensive' ? 'IV. Peace & Order and Katarungang Pambarangay Statistics' : 'Peace, Order & Dispute Settlement Statistics'}</span>
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Blotters Logged</span>
                    <span className="text-xl font-black text-slate-900">{blotters.length}</span>
                    <p className="text-[9px] text-slate-500">Incident Entries</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Lupon Mediation Cases</span>
                    <span className="text-xl font-black text-slate-900">{complaints.length}</span>
                    <p className="text-[9px] text-slate-500">KP Proceedings</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Amicably Settled</span>
                    <span className="text-xl font-black text-emerald-700">{totalSettled}</span>
                    <p className="text-[9px] text-slate-500">Kasunduan Executed</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Settlement Efficiency</span>
                    <span className="text-xl font-black text-indigo-700">{settlementRate}%</span>
                    <p className="text-[9px] text-slate-500">Lupon Success Rate</p>
                  </div>
                </div>
              </div>
            )}

            {/* OFFICIAL SIGNATORIES */}
            <div className="pt-8 mt-6 border-t-2 border-slate-800 grid grid-cols-3 gap-6 text-xs avoid-break">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-medium">Prepared by:</p>
                <div className="mt-8 border-t border-slate-900 pt-1">
                  <p className="font-bold text-slate-900 uppercase leading-tight">{secretary}</p>
                  <p className="text-slate-600 text-[10px]">Barangay Secretary</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-[10px] uppercase font-medium">Certified Collections by:</p>
                <div className="mt-8 border-t border-slate-900 pt-1">
                  <p className="font-bold text-slate-900 uppercase leading-tight">{treasurer}</p>
                  <p className="text-slate-600 text-[10px]">Barangay Treasurer</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-[10px] uppercase font-medium">Attested and Approved by:</p>
                <div className="mt-8 border-t border-slate-900 pt-1">
                  <p className="font-bold text-slate-900 uppercase leading-tight">{punongBarangay}</p>
                  <p className="text-slate-600 text-[10px]">Punong Barangay</p>
                </div>
              </div>
            </div>

            {/* Official Footer */}
            <div className="pt-2 text-center text-[9px] text-slate-400 border-t border-slate-200 flex justify-between items-center">
              <span>Barangay Sangkol Management & Information System (BS-MIS)</span>
              <span>Valid for Official Government Reference & Sangguniang Panlungsod Reporting</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
