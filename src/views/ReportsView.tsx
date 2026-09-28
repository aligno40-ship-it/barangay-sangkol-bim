import React, { useState } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { RepublicSeal, BarangaySangkolSeal } from '../components/OfficialSeals';
import { ReportPrintModal, ReportType } from '../components/ReportPrintModal';
import { printHtmlDocument, downloadHtmlReport, exportToCsv } from '../utils/printUtils';
import { InfoButton } from '../components/InfoButton';
import {
  BarChart3,
  Printer,
  Users,
  Home,
  ShieldAlert,
  FileCheck2,
  Download,
  Calendar,
  PieChart,
  TrendingUp,
  Table,
  FileText,
  DollarSign,
  Layers,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { residents, households, certificates, blotters, complaints, businesses, transactions, settings, officials } = useBarangay();

  const [activeReportTab, setActiveReportTab] = useState<'demographics' | 'financial' | 'peace_order'>('demographics');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [modalReportType, setModalReportType] = useState<ReportType>('demographics');

  const activeResidents = residents.filter((r) => r.residentStatus === 'Active');
  const maleCount = activeResidents.filter((r) => r.sex === 'Male').length;
  const femaleCount = activeResidents.filter((r) => r.sex === 'Female').length;

  // Age Groups
  const age0to14 = activeResidents.filter((r) => r.age < 15).length;
  const age15to30 = activeResidents.filter((r) => r.age >= 15 && r.age <= 30).length;
  const age31to59 = activeResidents.filter((r) => r.age > 30 && r.age < 60).length;
  const age60plus = activeResidents.filter((r) => r.age >= 60).length;

  // Sectors
  const seniors = activeResidents.filter((r) => r.isSeniorCitizen).length;
  const pwds = activeResidents.filter((r) => r.isPWD).length;
  const fourPs = activeResidents.filter((r) => r.is4PsBeneficiary).length;
  const soloParents = activeResidents.filter((r) => r.isSoloParent).length;
  const indigents = activeResidents.filter((r) => r.isIndigent).length;
  const voters = activeResidents.filter((r) => r.voterStatus === 'Registered').length;

  // Purok Counts
  const purokCounts: { [p: string]: number } = {};
  settings.puroks.forEach((p) => (purokCounts[p] = 0));
  activeResidents.forEach((r) => {
    purokCounts[r.purok] = (purokCounts[r.purok] || 0) + 1;
  });

  // Financial Stats
  const totalRevenue = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  const secretary = officials.find((o) => o.position.includes('Secretary'))?.name || settings.barangaySecretary;
  const punongBarangay = officials.find((o) => o.position.includes('Punong Barangay') || o.position.includes('Captain'))?.name || settings.punongBarangay;
  const treasurer = officials.find((o) => o.position.includes('Treasurer'))?.name || settings.barangayTreasurer;

  const handleOpenPrintModal = (type?: ReportType) => {
    setModalReportType(type || activeReportTab);
    setIsPrintModalOpen(true);
  };

  const handleDirectPrintCurrent = () => {
    const printableEl = document.getElementById('reports-printable-canvas');
    if (printableEl) {
      const title = `${settings.barangayName} - Official Report (${activeReportTab.toUpperCase()})`;
      printHtmlDocument(title, printableEl.innerHTML);
    } else {
      window.print();
    }
  };

  const handleExportCurrentTabCsv = () => {
    if (activeReportTab === 'demographics') {
      const headers = ['Purok', 'Active Population'];
      const rows = Object.entries(purokCounts).map(([p, count]) => [p, count]);
      exportToCsv(`Barangay_Sangkol_Demographics_${new Date().getFullYear()}.csv`, headers, rows);
    } else if (activeReportTab === 'financial') {
      const headers = ['OR Number', 'Date', 'Payor Name', 'Service Type', 'Amount (PHP)', 'Cashier'];
      const rows = transactions.map((t) => [t.orNumber, t.date, t.payorName, t.serviceType, t.amount, t.cashierName]);
      exportToCsv(`Barangay_Sangkol_Financial_Transactions_${new Date().getFullYear()}.csv`, headers, rows);
    } else {
      const headers = ['Blotter No', 'Date', 'Incident Type', 'Purok', 'Complainant', 'Respondent', 'Status'];
      const rows = blotters.map((b) => [b.blotterNo, b.dateReported, b.incidentType, b.purok, b.complainantName, b.respondentName, b.status]);
      exportToCsv(`Barangay_Sangkol_Blotters_${new Date().getFullYear()}.csv`, headers, rows);
    }
  };

  const standardFees = [
    { name: 'Barangay Clearance', amount: settings.clearanceFeeRegular },
    { name: 'Business Clearance', amount: settings.businessClearanceFee },
    { name: 'Residency Certification', amount: settings.residencyCertFee },
    { name: 'Indigency Certificate', amount: settings.indigencyCertFee },
    { name: 'Good Moral Character', amount: settings.goodMoralFee },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Reports, Statistics & Demographic Analytics</span>
            <InfoButton
              title="Reports & Analytics"
              info={`Statistical summaries, executive briefs, population censuses, and revenue reports for ${settings.barangayName}.`}
              variant="light"
            />
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveReportTab('demographics')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeReportTab === 'demographics' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Demographics
            </button>
            <button
              onClick={() => setActiveReportTab('financial')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeReportTab === 'financial' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Financials & O.R.
            </button>
            <button
              onClick={() => setActiveReportTab('peace_order')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeReportTab === 'peace_order' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Peace & Order
            </button>
          </div>

          {/* Quick Export CSV */}
          <button
            onClick={handleExportCurrentTabCsv}
            title="Export current tab data as CSV"
            className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
          >
            <Table className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Direct Print */}
          <button
            onClick={handleDirectPrintCurrent}
            title="Quick print current active tab"
            className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span className="hidden sm:inline">Quick Print</span>
          </button>

          {/* Open Official Print & Generator Desk */}
          <button
            onClick={() => handleOpenPrintModal(activeReportTab)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report Desk</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div id="reports-printable-canvas" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 printable-area text-slate-900">
        {/* Printable Official Letterhead */}
        <div className="text-center border-b-2 border-slate-800 pb-4">
          <div className="flex items-center justify-between px-2 sm:px-6">
            <div className="w-16 sm:w-20 flex justify-center shrink-0">
              <RepublicSeal size={64} />
            </div>
            <div className="flex-1 px-4">
              <p className="text-[10px] uppercase tracking-widest font-serif font-bold text-slate-600">Republic of the Philippines</p>
              <p className="text-[10px] uppercase tracking-wider font-serif text-slate-600 font-semibold">{settings.province} • {settings.municipality}</p>
              <h3 className="text-base sm:text-lg font-serif font-black text-slate-900 uppercase tracking-wide mt-0.5">
                {settings.barangayName}
              </h3>
              <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mt-1">
                {activeReportTab === 'demographics' && 'BARANGAY DEMOGRAPHIC & POPULATION PROFILE REPORT (RBI FORM 1A)'}
                {activeReportTab === 'financial' && 'BARANGAY REVENUE & COLLECTION SUMMARY REPORT'}
                {activeReportTab === 'peace_order' && 'BARANGAY PEACE AND ORDER & BLOTTER STATISTICAL REPORT'}
              </p>
            </div>
            <div className="w-16 sm:w-20 flex justify-center shrink-0">
              <BarangaySangkolSeal size={64} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Generated on: {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} • System Source: BIMS Sangkol
          </p>
        </div>

        {/* Tab 1: Demographics Report */}
        {activeReportTab === 'demographics' && (
          <div className="space-y-6">
            {/* Top KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Total Population</span>
                <span className="text-2xl font-black text-slate-900">{activeResidents.length}</span>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">Active verified registry</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Total Households</span>
                <span className="text-2xl font-black text-slate-900">{households.length}</span>
                <p className="text-[10px] text-indigo-600 font-semibold mt-1">Avg {(activeResidents.length / (households.length || 1)).toFixed(1)} / household</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Registered Voters</span>
                <span className="text-2xl font-black text-slate-900">{voters}</span>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">{((voters / (activeResidents.length || 1)) * 100).toFixed(1)}% of total</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Indigent Residents</span>
                <span className="text-2xl font-black text-slate-900">{indigents}</span>
                <p className="text-[10px] text-amber-600 font-semibold mt-1">Priority welfare tier</p>
              </div>
            </div>

            {/* Age & Sex Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age Groups */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Age Bracket Distribution</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Children (0 - 14 years old):</span>
                    <span className="font-bold text-slate-900">{age0to14} ({((age0to14 / (activeResidents.length || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Youth (15 - 30 years old):</span>
                    <span className="font-bold text-teal-700">{age15to30} ({((age15to30 / (activeResidents.length || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Working Adults (31 - 59 years old):</span>
                    <span className="font-bold text-indigo-700">{age31to59} ({((age31to59 / (activeResidents.length || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Senior Citizens (60+ years old):</span>
                    <span className="font-bold text-amber-700">{age60plus} ({((age60plus / (activeResidents.length || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>

              {/* Sex & Sectoral Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sex & Special Sector Summary</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Male Residents:</span>
                    <span className="font-bold text-slate-900">{maleCount} ({((maleCount / (activeResidents.length || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Female Residents:</span>
                    <span className="font-bold text-slate-900">{femaleCount} ({((femaleCount / (activeResidents.length || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Persons with Disability (PWD):</span>
                    <span className="font-bold text-purple-700">{pwds}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">4Ps Program Beneficiaries:</span>
                    <span className="font-bold text-emerald-700">{fourPs}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Solo Parents:</span>
                    <span className="font-bold text-pink-700">{soloParents}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purok Distribution Table */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Population Density Across All {settings.puroks.length} Puroks
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(purokCounts).map(([purok, count]) => (
                  <div key={purok} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-xs font-bold text-indigo-700 block">{purok}</span>
                    <span className="text-lg font-black text-slate-900">{count}</span>
                    <span className="text-[10px] text-slate-500 ml-1">residents</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Financial Report */}
        {activeReportTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200">
                <span className="text-[10px] uppercase text-indigo-700 font-bold block">Total Collections Recorded</span>
                <span className="text-3xl font-black text-indigo-900">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <p className="text-[10px] text-indigo-600 font-medium mt-1">{transactions.length} Official Receipts Issued</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Certificates Issued</span>
                <span className="text-3xl font-black text-slate-900">{certificates.length}</span>
                <p className="text-[10px] text-slate-500 mt-1">Clearances, Residencies, Indigencies</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Registered Businesses</span>
                <span className="text-3xl font-black text-slate-900">{businesses.length}</span>
                <p className="text-[10px] text-slate-500 mt-1">Annual Permit & Clearances</p>
              </div>
            </div>

            {/* Fee Schedule Reference */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Barangay Revenue Code - Standard Fee Rates
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {standardFees.map((fee) => (
                  <div key={fee.name} className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between shadow-2xs">
                    <span className="text-slate-600 font-medium">{fee.name}:</span>
                    <span className="font-bold text-indigo-700">₱{fee.amount?.toFixed(2) || '0.00'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Peace and Order Report */}
        {activeReportTab === 'peace_order' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Total Blotters Logged</span>
                <span className="text-3xl font-black text-slate-900">{blotters.length}</span>
                <p className="text-[10px] text-amber-700 font-semibold mt-1">{blotters.filter((b) => b.status === 'Amicably Settled' || b.status === 'Settled').length} amicably settled</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Lupon Mediation Cases</span>
                <span className="text-3xl font-black text-slate-900">{complaints.length}</span>
                <p className="text-[10px] text-indigo-600 font-semibold mt-1">Katarungang Pambarangay</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Settlement Rate</span>
                <span className="text-3xl font-black text-emerald-700">
                  {Math.round(((blotters.filter((b) => b.status === 'Amicably Settled' || b.status === 'Settled').length + complaints.filter((c) => c.status?.toLowerCase().includes('settled')).length) / (blotters.length + complaints.length || 1)) * 100)}%
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Success in community mediation</p>
              </div>
            </div>
          </div>
        )}

        {/* Signatures for Print */}
        <div className="pt-8 mt-8 border-t border-slate-300 grid grid-cols-3 gap-4 text-xs avoid-break">
          <div>
            <p className="text-slate-500 text-[10px] uppercase font-medium">Prepared by:</p>
            <div className="mt-8 border-t border-slate-800 pt-1">
              <p className="font-bold text-slate-900 uppercase leading-tight">{secretary}</p>
              <p className="text-slate-600 text-[10px]">Barangay Secretary</p>
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] uppercase font-medium">Certified Collections by:</p>
            <div className="mt-8 border-t border-slate-800 pt-1">
              <p className="font-bold text-slate-900 uppercase leading-tight">{treasurer}</p>
              <p className="text-slate-600 text-[10px]">Barangay Treasurer</p>
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] uppercase font-medium">Attested and Noted by:</p>
            <div className="mt-8 border-t border-slate-800 pt-1">
              <p className="font-bold text-slate-900 uppercase leading-tight">{punongBarangay}</p>
              <p className="text-slate-600 text-[10px]">Punong Barangay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Official Report Print Modal */}
      <ReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        initialReportType={modalReportType}
      />
    </div>
  );
};

