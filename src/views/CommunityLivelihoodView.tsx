import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import {
  GraduationCap,
  Briefcase,
  Award,
  Sparkles,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  User,
  Phone,
  FileText,
  DollarSign,
  Package,
  ChevronRight,
  Printer,
  ShieldCheck,
  AlertCircle,
  Eye,
  Check,
  X,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
  BadgeCheck,
  Send,
  HelpCircle,
  Paperclip,
  Building,
  Hammer,
  Scissors,
  Sprout,
  Store,
  Flame,
  FileCheck,
  Download,
} from 'lucide-react';
import { useCommunityServices } from '../context/CommunityServicesContext';
import { useBarangay } from '../context/BarangayContext';
import {
  LivelihoodAssistanceRequest,
  LivelihoodTrainingWorkshop,
  LivelihoodEnrollmentRecord,
  JobApplicationRecord,
  CommunityJobPosting,
} from '../types/residentServices';
import { AttachedDocumentModal, DocumentViewerData } from '../components/community/AttachedDocumentModal';
import { PrintSlipModal } from '../components/community/CommunityModals';
import { BarangaySangkolSeal } from '../components/OfficialSeals';

type LivelihoodTab = 'assistance_grants' | 'workshops_tesda' | 'peso_jobs';

export const CommunityLivelihoodView: React.FC = () => {
  const {
    livelihoodAssistanceRequests,
    requestLivelihoodAssistance,
    updateLivelihoodAssistanceStatus,
    deleteLivelihoodAssistance,
    pendingLivelihoodAssistanceCount,

    livelihoodTrainings,
    addLivelihoodTraining,
    deleteLivelihoodTraining,
    livelihoodEnrollments,
    updateLivelihoodEnrollmentStatus,

    jobPostings,
    addJobPosting,
    deleteJobPosting,
    jobApplications,
    updateJobApplicationStatus,
  } = useCommunityServices();

  const { settings, residents } = useBarangay();

  // Active Tab
  const [activeTab, setActiveTab] = useState<LivelihoodTab>('assistance_grants');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [docViewerData, setDocViewerData] = useState<DocumentViewerData | null>(null);
  const [printData, setPrintData] = useState<{ title: string; subtitle: string; content: React.ReactNode } | null>(null);

  // New Assistance Grant Modal State
  const [isAddGrantModalOpen, setIsAddGrantModalOpen] = useState(false);
  const [newGrantForm, setNewGrantForm] = useState<{
    residentId: string;
    residentName: string;
    contactNumber: string;
    purok: string;
    programType: LivelihoodAssistanceRequest['programType'];
    proposedBusiness: string;
    estimatedBudget: number;
    requestedGrantAmount: number;
    targetStartDate: string;
    statementOfNeed: string;
    businessPlanFileName?: string;
    businessPlanFileData?: string;
    endorsementLetterFileName?: string;
    endorsementLetterFileData?: string;
  }>({
    residentId: '',
    residentName: '',
    contactNumber: '',
    purok: 'Purok Mangga',
    programType: 'Micro-Enterprise Starter Capital',
    proposedBusiness: '',
    estimatedBudget: 10000,
    requestedGrantAmount: 8000,
    targetStartDate: new Date().toISOString().split('T')[0],
    statementOfNeed: '',
  });

  // Review Assistance Modal State
  const [selectedGrantForReview, setSelectedGrantForReview] = useState<LivelihoodAssistanceRequest | null>(null);
  const [reviewForm, setReviewForm] = useState<{
    status: LivelihoodAssistanceRequest['status'];
    approvedAmount: number;
    reviewerNotes: string;
    resolutionReferenceNo: string;
  }>({
    status: 'Pending Review',
    approvedAmount: 0,
    reviewerNotes: '',
    resolutionReferenceNo: '',
  });

  // New Workshop Modal State
  const [isAddWorkshopModalOpen, setIsAddWorkshopModalOpen] = useState(false);
  const [workshopForm, setWorkshopForm] = useState<{
    title: string;
    category: string;
    description: string;
    slotsTotal: number;
    schedule: string;
    duration: string;
    venue: string;
    trainerName: string;
    partnerAgency: LivelihoodTrainingWorkshop['partnerAgency'];
    starterKitProvided: boolean;
    startDate: string;
    endDate: string;
  }>({
    title: '',
    category: 'Food Processing & Culinary',
    description: '',
    slotsTotal: 25,
    schedule: 'Mon / Wed / Fri (1:00 PM - 5:00 PM)',
    duration: '40 Hours (2 Weeks)',
    venue: 'Barangay Livelihood & Skills Center',
    trainerName: '',
    partnerAgency: 'TESDA Accredited',
    starterKitProvided: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalGrantsAmountRequested = livelihoodAssistanceRequests.reduce((sum, r) => sum + r.requestedGrantAmount, 0);
  const totalGrantsAmountApproved = livelihoodAssistanceRequests
    .filter((r) => r.status === 'Approved - For Release' || r.status === 'Disbursed / Released')
    .reduce((sum, r) => sum + (r.approvedAmount || r.requestedGrantAmount), 0);
  const certifiedEnrolleesCount = livelihoodEnrollments.filter((e) => e.status === 'Graduated with Certificate').length;

  // Filtered Grants
  const filteredGrants = livelihoodAssistanceRequests.filter((req) => {
    const matchesSearch =
      req.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.proposedBusiness.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.purok.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesProgram = programFilter === 'all' || req.programType === programFilter;

    return matchesSearch && matchesStatus && matchesProgram;
  });

  // Handle Resident Selection in Add Grant Form
  const handleResidentSelect = (residentId: string) => {
    const res = residents.find((r) => r.id === residentId);
    if (res) {
      setNewGrantForm((prev) => ({
        ...prev,
        residentId: res.id,
        residentName: `${res.firstName} ${res.middleName ? res.middleName.charAt(0) + '. ' : ''}${res.lastName}`,
        contactNumber: res.contactNumber || '0917-000-0000',
        purok: res.purok || 'Purok Mangga',
      }));
    }
  };

  // Handle Submit New Grant
  const handleSubmitGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrantForm.residentName || !newGrantForm.proposedBusiness) {
      showToast('Please provide the resident name and proposed business/project title.');
      return;
    }

    requestLivelihoodAssistance({
      residentId: newGrantForm.residentId || `BS-RES-${Date.now().toString().slice(-4)}`,
      residentName: newGrantForm.residentName,
      contactNumber: newGrantForm.contactNumber,
      purok: newGrantForm.purok,
      programType: newGrantForm.programType,
      proposedBusiness: newGrantForm.proposedBusiness,
      estimatedBudget: Number(newGrantForm.estimatedBudget),
      requestedGrantAmount: Number(newGrantForm.requestedGrantAmount),
      targetStartDate: newGrantForm.targetStartDate,
      statementOfNeed: newGrantForm.statementOfNeed,
      businessPlanFileName: newGrantForm.businessPlanFileName,
      businessPlanFileData: newGrantForm.businessPlanFileData,
      endorsementLetterFileName: newGrantForm.endorsementLetterFileName,
      endorsementLetterFileData: newGrantForm.endorsementLetterFileData,
    });

    setIsAddGrantModalOpen(false);
    showToast(`Successfully submitted livelihood assistance requisition for ${newGrantForm.residentName}.`);
  };

  // Open Review Grant Modal
  const openReviewGrantModal = (grant: LivelihoodAssistanceRequest) => {
    setSelectedGrantForReview(grant);
    setReviewForm({
      status: grant.status,
      approvedAmount: grant.approvedAmount || grant.requestedGrantAmount,
      reviewerNotes: grant.reviewerNotes || '',
      resolutionReferenceNo: grant.resolutionReferenceNo || `BR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    });
  };

  // Save Grant Review
  const handleSaveGrantReview = () => {
    if (!selectedGrantForReview) return;
    updateLivelihoodAssistanceStatus(
      selectedGrantForReview.id,
      reviewForm.status,
      reviewForm.reviewerNotes,
      reviewForm.approvedAmount,
      reviewForm.resolutionReferenceNo
    );
    setSelectedGrantForReview(null);
    showToast(`Updated assistance requisition #${selectedGrantForReview.id} to "${reviewForm.status}".`);
  };

  // Print Livelihood Release / Endorsement Slip
  const handlePrintGrantVoucher = (grant: LivelihoodAssistanceRequest) => {
    setPrintData({
      title: 'BARANGAY LIVELIHOOD ASSISTANCE RELEASE VOUCHER',
      subtitle: `Reference Control No: ${grant.id} • Resolution No: ${grant.resolutionReferenceNo || 'N/A'}`,
      content: (
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Beneficiary Name:</span>
              <span className="font-bold text-slate-900">{grant.residentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Purok / Contact:</span>
              <span className="font-semibold text-slate-800">{grant.purok} • {grant.contactNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Assistance Package:</span>
              <span className="font-bold text-emerald-800">{grant.programType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Proposed Project / Enterprise:</span>
              <span className="font-semibold text-slate-800">{grant.proposedBusiness}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5">
              <span className="text-slate-700 font-bold">Approved Grant Amount / Valuation:</span>
              <span className="font-mono font-black text-emerald-700 text-sm">
                ₱{(grant.approvedAmount || grant.requestedGrantAmount).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 space-y-1">
            <p className="font-bold text-slate-900">Program Terms & Liquidation Agreement:</p>
            <p className="text-[11px] text-slate-600">
              The recipient acknowledges receipt of the designated livelihood assistance grant / starter equipment and agrees to utilize the assets solely for the approved enterprise. Periodic site monitoring will be conducted by the Barangay Development Council Livelihood Committee.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-6">
            <div className="text-center">
              <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-800">
                {grant.residentName}
              </div>
              <p className="text-[10px] text-slate-500">Beneficiary Signature over Printed Name</p>
            </div>
            <div className="text-center">
              <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-800">
                {settings.punongBarangay}
              </div>
              <p className="text-[10px] text-slate-500">Punong Barangay / Livelihood Chair</p>
            </div>
          </div>
        </div>
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Barangay Livelihood & Skills Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  PESO, TESDA & DTI Accredited
                </span>
                {pendingLivelihoodAssistanceCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {pendingLivelihoodAssistanceCount} Requisition(s) Under Review
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Track micro-enterprise starter grants, inspect uploaded business proposals & resumes, manage TESDA skills workshops, and update assistance disbursement statuses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsAddGrantModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Assistance Requisition</span>
            </button>
            <button
              onClick={() => setIsAddWorkshopModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Workshop</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Grant Requests</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {livelihoodAssistanceRequests.length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">₱{totalGrantsAmountRequested.toLocaleString()} requested</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
            <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Approved & Disbursed</p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              ₱{totalGrantsAmountApproved.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">Micro-capital & toolsets</p>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
            <p className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300">Vocational Workshops</p>
            <p className="text-xl font-black text-indigo-700 dark:text-indigo-400 mt-1">
              {livelihoodTrainings.length}
            </p>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">{livelihoodEnrollments.length} total enrollees</p>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60">
            <p className="text-[11px] font-semibold text-purple-800 dark:text-purple-300">Certified Graduates</p>
            <p className="text-xl font-black text-purple-700 dark:text-purple-400 mt-1">
              {certifiedEnrolleesCount}
            </p>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">TESDA / DTI Certificates issued</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-xs overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('assistance_grants')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'assistance_grants'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Micro-Enterprise Grants & Equipment ({livelihoodAssistanceRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('workshops_tesda')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'workshops_tesda'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>TESDA Workshops & Enrollees ({livelihoodEnrollments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('peso_jobs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'peso_jobs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>PESO Job Matching & Bio-Data Desk ({jobApplications.length})</span>
        </button>
      </div>

      {/* TAB 1: LIVELIHOOD ASSISTANCE GRANTS & EQUIPMENT PACKAGES */}
      {activeTab === 'assistance_grants' && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <RecentSearchesInput
              className="w-full md:w-80"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search beneficiary, enterprise, ID..."
              storageKey="livelihood_assistance"
              theme="light"
              inputClassName="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white"
            />

            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Program:</span>
              </div>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <option value="all">All Assistance Packages</option>
                <option value="Micro-Enterprise Starter Capital">Micro-Enterprise Starter Capital</option>
                <option value="Sewing & Tailoring Machine Package">Sewing & Tailoring Package</option>
                <option value="Agricultural Inputs & Seeds Grant">Agricultural Inputs & Seeds</option>
                <option value="Sari-Sari Store Expansion Kit">Sari-Sari Store Expansion Kit</option>
                <option value="Food Processing & Cooking Equipment">Food Processing Equipment</option>
                <option value="Vocational Toolset Assistance">Vocational Toolset Assistance</option>
                <option value="Welding & Fabrication Starter Package">Welding & Fabrication Package</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <option value="all">All Review Statuses</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Field Validation">Field Validation</option>
                <option value="Approved - For Release">Approved - For Release</option>
                <option value="Disbursed / Released">Disbursed / Released</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Grants Ledger Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Requisition ID & Date</th>
                    <th className="p-3.5">Resident Beneficiary</th>
                    <th className="p-3.5">Assistance Package</th>
                    <th className="p-3.5">Proposed Business / Need</th>
                    <th className="p-3.5">Requested / Approved</th>
                    <th className="p-3.5">Attached Proposal</th>
                    <th className="p-3.5">Review Status</th>
                    <th className="p-3.5 pr-5 text-right">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredGrants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No livelihood assistance records matched the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredGrants.map((grant) => (
                      <tr key={grant.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 pl-5 whitespace-nowrap">
                          <p className="font-mono font-bold text-slate-900 dark:text-slate-100">{grant.id}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" /> {grant.dateRequested}
                          </p>
                        </td>

                        <td className="p-3.5">
                          <p className="font-bold text-slate-900 dark:text-white">{grant.residentName}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" /> {grant.purok} • <Phone className="w-3 h-3 text-slate-400" /> {grant.contactNumber}
                          </p>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold rounded-lg text-[11px] border border-emerald-200 dark:border-emerald-800">
                            {grant.programType}
                          </span>
                        </td>

                        <td className="p-3.5 max-w-xs">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{grant.proposedBusiness}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{grant.statementOfNeed}</p>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <p className="font-mono font-black text-slate-900 dark:text-white">
                            ₱{(grant.approvedAmount || grant.requestedGrantAmount).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-400">Est. Budget: ₱{grant.estimatedBudget.toLocaleString()}</p>
                        </td>

                        <td className="p-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {grant.businessPlanFileName ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setDocViewerData({
                                    documentType: 'Business Proposal / Plan',
                                    applicantName: grant.residentName,
                                    contactNumber: grant.contactNumber,
                                    purok: grant.purok,
                                    targetTitle: grant.proposedBusiness,
                                    targetCategory: 'Livelihood Micro-Grant / Assistance',
                                    employerOrAgency: grant.programType,
                                    appliedDate: grant.dateRequested,
                                    fileName: grant.businessPlanFileName,
                                    fileData: grant.businessPlanFileData,
                                    letterText: `Proposed Enterprise: ${grant.proposedBusiness}\nEstimated Startup Cost: ₱${grant.estimatedBudget.toLocaleString()}\nRequested Assistance: ₱${grant.requestedGrantAmount.toLocaleString()}\nTarget Launch Date: ${grant.targetStartDate}\n\nProject Rationale & Statement of Need:\n${grant.statementOfNeed}`,
                                    budget: grant.estimatedBudget,
                                    grantAmount: grant.approvedAmount || grant.requestedGrantAmount,
                                  })
                                }
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800 transition-colors"
                              >
                                <Paperclip className="w-3 h-3" /> View Plan
                              </button>
                            ) : null}

                            {grant.endorsementLetterFileName ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setDocViewerData({
                                    documentType: 'Barangay Endorsement Letter',
                                    applicantName: grant.residentName,
                                    contactNumber: grant.contactNumber,
                                    purok: grant.purok,
                                    targetTitle: grant.proposedBusiness,
                                    targetCategory: 'Livelihood Micro-Grant / Assistance',
                                    employerOrAgency: 'Purok Livelihood Chapter',
                                    appliedDate: grant.dateRequested,
                                    fileName: grant.endorsementLetterFileName,
                                    fileData: grant.endorsementLetterFileData,
                                    letterText: `BARANGAY SANGKOL LIVELIHOOD COMMITTEE ENDORSEMENT\n\nThis is to officially endorse the livelihood assistance application of ${grant.residentName} residing at ${grant.purok} for the "${grant.programType}" program.\n\nValidated by: Purok President & Committee on Livelihood`,
                                  })
                                }
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-amber-200 dark:border-amber-800 transition-colors"
                              >
                                <FileCheck className="w-3 h-3" /> Endorsement
                              </button>
                            ) : null}

                            {!grant.businessPlanFileName && !grant.endorsementLetterFileName && (
                              <span className="text-[10px] text-slate-400 italic">No files attached</span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              grant.status === 'Disbursed / Released'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : grant.status === 'Approved - For Release'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : grant.status === 'Field Validation'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : grant.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {grant.status}
                          </span>
                          {grant.resolutionReferenceNo && (
                            <p className="text-[10px] font-mono text-slate-400 mt-1">Res: {grant.resolutionReferenceNo}</p>
                          )}
                        </td>

                        <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openReviewGrantModal(grant)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                            >
                              Review & Update
                            </button>

                            {(grant.status === 'Approved - For Release' || grant.status === 'Disbursed / Released') && (
                              <button
                                type="button"
                                onClick={() => handlePrintGrantVoucher(grant)}
                                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                                title="Print Official Release Slip"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete assistance record #${grant.id}?`)) {
                                  deleteLivelihoodAssistance(grant.id);
                                  showToast(`Removed assistance request #${grant.id}.`);
                                }
                              }}
                              className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg cursor-pointer"
                              title="Delete Record"
                            >
                              <X className="w-4 h-4" />
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

      {/* TAB 2: TESDA & DTI VOCATIONAL WORKSHOPS */}
      {activeTab === 'workshops_tesda' && (
        <div className="space-y-6">
          {/* Workshop Programs Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-500" />
                  Active Livelihood & Skills Training Courses ({livelihoodTrainings.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  TESDA-accredited vocational courses, DTI micro-business seminars, and Department of Agriculture modules.
                </p>
              </div>
              <button
                onClick={() => setIsAddWorkshopModalOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Workshop</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {livelihoodTrainings.map((trn) => (
                <div
                  key={trn.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold rounded-md">
                        {trn.partnerAgency}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {trn.slotsAvailable} / {trn.slotsTotal} slots left
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-2">{trn.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{trn.description}</p>

                    <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                      <p className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {trn.schedule}</p>
                      <p className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> Duration: {trn.duration}</p>
                      <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> Venue: {trn.venue}</p>
                      <p className="flex items-center gap-1"><User className="w-3 h-3 text-slate-400" /> Trainer: {trn.trainerName}</p>
                    </div>

                    {trn.starterKitProvided && (
                      <div className="mt-2 p-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Includes Free Starter Toolset & Certification</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Starts: {trn.startDate}</span>
                    <button
                      onClick={() => {
                        deleteLivelihoodTraining(trn.id);
                        showToast(`Removed workshop "${trn.title}".`);
                      }}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enrollees & Beneficiaries Ledger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                Resident Workshop Enrollees & Graduation Ledger ({livelihoodEnrollments.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect applicant bio-data, letters of intent, and issue NC II / TESDA completion certificates.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Enrollee Resident</th>
                    <th className="p-3.5">Workshop Course</th>
                    <th className="p-3.5">Educational Background & Goal</th>
                    <th className="p-3.5">Attached Bio-Data & Intent</th>
                    <th className="p-3.5">Date Enrolled</th>
                    <th className="p-3.5">Completion Status</th>
                    <th className="p-3.5 pr-5 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {livelihoodEnrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{enr.residentName}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {enr.contactNumber} • {enr.purok}
                        </p>
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-indigo-700 dark:text-indigo-400">{enr.trainingTitle}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{enr.id}</p>
                      </td>

                      <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-300">
                        <p className="font-medium text-[11px]">{enr.educationalBackground || 'High School Level'}</p>
                        <p className="text-[10px] text-slate-500 truncate">{enr.intentReason || enr.currentOccupation || 'Skills upgrading candidate'}</p>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {enr.resumeFileName ? (
                            <button
                              type="button"
                              onClick={() =>
                                setDocViewerData({
                                  documentType: 'Resume / Bio-Data',
                                  applicantName: enr.residentName,
                                  contactNumber: enr.contactNumber,
                                  purok: enr.purok,
                                  targetTitle: enr.trainingTitle,
                                  targetCategory: 'Livelihood Workshop',
                                  appliedDate: enr.enrolledDate,
                                  fileName: enr.resumeFileName,
                                  fileData: enr.resumeFileData,
                                  educationalAttainment: enr.educationalBackground,
                                  experienceOrBackground: enr.intentReason,
                                })
                              }
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800 transition-colors"
                            >
                              <Paperclip className="w-3 h-3" /> View Bio-Data
                            </button>
                          ) : null}

                          {(enr.applicationLetterFileName || enr.applicationLetterText || enr.intentReason) && (
                            <button
                              type="button"
                              onClick={() =>
                                setDocViewerData({
                                  documentType: 'Letter of Intent',
                                  applicantName: enr.residentName,
                                  contactNumber: enr.contactNumber,
                                  purok: enr.purok,
                                  targetTitle: enr.trainingTitle,
                                  targetCategory: 'Livelihood Workshop',
                                  appliedDate: enr.enrolledDate,
                                  fileName: enr.applicationLetterFileName,
                                  fileData: enr.applicationLetterFileData,
                                  letterText: enr.applicationLetterText || enr.intentReason,
                                  educationalAttainment: enr.educationalBackground,
                                  experienceOrBackground: enr.intentReason,
                                })
                              }
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-emerald-200 dark:border-emerald-800 transition-colors"
                            >
                              <FileText className="w-3 h-3" /> View Intent
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-slate-500">{enr.enrolledDate}</td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            enr.status === 'Graduated with Certificate'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : enr.status === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {enr.status}
                        </span>
                      </td>

                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <select
                          value={enr.status}
                          onChange={(e) => {
                            updateLivelihoodEnrollmentStatus(enr.id, e.target.value as LivelihoodEnrollmentRecord['status']);
                            showToast(`Updated enrollee ${enr.residentName} status to ${e.target.value}.`);
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Waitlisted">Waitlisted</option>
                          <option value="Graduated with Certificate">Graduated with Certificate</option>
                          <option value="Under Review">Under Review</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PESO JOB MATCHING & RESUMES */}
      {activeTab === 'peso_jobs' && (
        <div className="space-y-6">
          {/* Applications Received Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  PESO Job Applications Received ({jobApplications.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review applicant profiles, educational credentials, attached resumes, and cover letters.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Applicant Resident</th>
                    <th className="p-3.5">Position Applied</th>
                    <th className="p-3.5">Educational Attainment</th>
                    <th className="p-3.5">Attached Credentials</th>
                    <th className="p-3.5">Applied Date</th>
                    <th className="p-3.5">Recruitment Status</th>
                    <th className="p-3.5 pr-5 text-right">PESO Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {jobApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{app.residentName}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {app.contactNumber}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-blue-600 dark:text-blue-400">{app.jobTitle}</p>
                        <p className="text-[11px] text-slate-500">{app.employerName}</p>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        <p className="font-medium">{app.educationalAttainment}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{app.workExperience}</p>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {app.resumeFileName ? (
                            <button
                              type="button"
                              onClick={() =>
                                setDocViewerData({
                                  documentType: 'Resume / Bio-Data',
                                  applicantName: app.residentName,
                                  contactNumber: app.contactNumber,
                                  targetTitle: app.jobTitle,
                                  targetCategory: 'Job Application',
                                  employerOrAgency: app.employerName,
                                  appliedDate: app.appliedDate,
                                  fileName: app.resumeFileName,
                                  fileData: app.resumeFileData,
                                  educationalAttainment: app.educationalAttainment,
                                  experienceOrBackground: app.workExperience,
                                })
                              }
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800 transition-colors"
                            >
                              <Paperclip className="w-3 h-3" /> View Resume
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No File</span>
                          )}

                          {(app.applicationLetterFileName || app.applicationLetterText) && (
                            <button
                              type="button"
                              onClick={() =>
                                setDocViewerData({
                                  documentType: 'Application Letter',
                                  applicantName: app.residentName,
                                  contactNumber: app.contactNumber,
                                  targetTitle: app.jobTitle,
                                  targetCategory: 'Job Application',
                                  employerOrAgency: app.employerName,
                                  appliedDate: app.appliedDate,
                                  fileName: app.applicationLetterFileName,
                                  fileData: app.applicationLetterFileData,
                                  letterText: app.applicationLetterText,
                                  educationalAttainment: app.educationalAttainment,
                                  experienceOrBackground: app.workExperience,
                                })
                              }
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-amber-200 dark:border-amber-800 transition-colors"
                            >
                              <FileText className="w-3 h-3" /> View Letter
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-500">{app.appliedDate}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            app.status === 'Hired'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : app.status === 'Invited for Interview'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : app.status === 'Under Review'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <select
                          value={app.status}
                          onChange={(e) => {
                            updateJobApplicationStatus(app.id, e.target.value as JobApplicationRecord['status']);
                            showToast(`Updated applicant ${app.residentName} to ${e.target.value}.`);
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Invited for Interview">Invited for Interview</option>
                          <option value="Hired">Hired</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW LIVELIHOOD ASSISTANCE REQUISITION */}
      {isAddGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">New Livelihood Assistance Requisition</h3>
                  <p className="text-xs text-slate-500">Walk-in or community project grant enrollment</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddGrantModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitGrant} className="space-y-4 mt-4 text-xs">
              {/* Resident Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Resident (from Barangay Registry):
                </label>
                <select
                  value={newGrantForm.residentId}
                  onChange={(e) => handleResidentSelect(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  <option value="">-- Choose Registered Citizen or Enter Manually --</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.lastName}, {r.firstName} ({r.purok}) - {r.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Beneficiary Full Name:</label>
                  <input
                    type="text"
                    required
                    value={newGrantForm.residentName}
                    onChange={(e) => setNewGrantForm({ ...newGrantForm, residentName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Number:</label>
                  <input
                    type="text"
                    required
                    value={newGrantForm.contactNumber}
                    onChange={(e) => setNewGrantForm({ ...newGrantForm, contactNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Purok Assignment:</label>
                  <select
                    value={newGrantForm.purok}
                    onChange={(e) => setNewGrantForm({ ...newGrantForm, purok: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Purok Mangga">Purok Mangga</option>
                    <option value="Purok Pinya">Purok Pinya</option>
                    <option value="Purok Lumboy">Purok Lumboy</option>
                    <option value="Purok Tambis">Purok Tambis</option>
                    <option value="Purok Kaimito">Purok Kaimito</option>
                    <option value="Purok Bayabas">Purok Bayabas</option>
                    <option value="Purok Rosas">Purok Rosas</option>
                    <option value="Purok Kawayan">Purok Kawayan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assistance Package:</label>
                  <select
                    value={newGrantForm.programType}
                    onChange={(e) => setNewGrantForm({ ...newGrantForm, programType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Micro-Enterprise Starter Capital">Micro-Enterprise Starter Capital</option>
                    <option value="Sewing & Tailoring Machine Package">Sewing & Tailoring Package</option>
                    <option value="Agricultural Inputs & Seeds Grant">Agricultural Inputs & Seeds</option>
                    <option value="Sari-Sari Store Expansion Kit">Sari-Sari Store Expansion Kit</option>
                    <option value="Food Processing & Cooking Equipment">Food Processing Equipment</option>
                    <option value="Vocational Toolset Assistance">Vocational Toolset Assistance</option>
                    <option value="Welding & Fabrication Starter Package">Welding & Fabrication Package</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Proposed Project / Enterprise Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Backyard Hydroponics & Organic Greens Farm"
                  value={newGrantForm.proposedBusiness}
                  onChange={(e) => setNewGrantForm({ ...newGrantForm, proposedBusiness: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Estimated Budget (₱):</label>
                  <input
                    type="number"
                    value={newGrantForm.estimatedBudget}
                    onChange={(e) => setNewGrantForm({ ...newGrantForm, estimatedBudget: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Requested Grant (₱):</label>
                  <input
                    type="number"
                    value={newGrantForm.requestedGrantAmount}
                    onChange={(e) => setNewGrantForm({ ...newGrantForm, requestedGrantAmount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Statement of Need & Project Description:</label>
                <textarea
                  rows={3}
                  placeholder="Describe the business proposal, market potential, and justification for barangay assistance..."
                  value={newGrantForm.statementOfNeed}
                  onChange={(e) => setNewGrantForm({ ...newGrantForm, statementOfNeed: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* File Attachment Controls */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  Attach Business Plan / Proposal File:
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewGrantForm((prev) => ({
                          ...prev,
                          businessPlanFileName: file.name,
                          businessPlanFileData: reader.result as string,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {newGrantForm.businessPlanFileName && (
                  <p className="text-[11px] text-emerald-600 font-bold">Attached: {newGrantForm.businessPlanFileName}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddGrantModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Requisition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW & UPDATE LIVELIHOOD ASSISTANCE STATUS */}
      {selectedGrantForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Review Livelihood Grant #{selectedGrantForReview.id}</h3>
                <p className="text-xs text-slate-500">Beneficiary: {selectedGrantForReview.residentName} ({selectedGrantForReview.purok})</p>
              </div>
              <button
                onClick={() => setSelectedGrantForReview(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedGrantForReview.proposedBusiness}</p>
                <p className="text-slate-500">{selectedGrantForReview.programType}</p>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 mt-1 font-mono">
                  <span>Requested Amount:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₱{selectedGrantForReview.requestedGrantAmount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Administrative Status Decision:</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="Pending Review">Pending Review</option>
                  <option value="Field Validation">Field Validation (Inspect Site / Inventory)</option>
                  <option value="Approved - For Release">Approved - For Release</option>
                  <option value="Disbursed / Released">Disbursed / Released (Funds / Kit Given)</option>
                  <option value="Rejected">Rejected / Disapproved</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Approved Amount (₱):</label>
                  <input
                    type="number"
                    value={reviewForm.approvedAmount}
                    onChange={(e) => setReviewForm({ ...reviewForm, approvedAmount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-700 dark:text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Barangay Resolution Ref #:</label>
                  <input
                    type="text"
                    placeholder="e.g. BR-2026-092"
                    value={reviewForm.resolutionReferenceNo}
                    onChange={(e) => setReviewForm({ ...reviewForm, resolutionReferenceNo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reviewer Assessment & Validation Notes:</label>
                <textarea
                  rows={3}
                  placeholder="Record inspection findings, release schedule, or reason for disapproval..."
                  value={reviewForm.reviewerNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewerNotes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedGrantForReview(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveGrantReview}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Decision</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE WORKSHOP */}
      {isAddWorkshopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Create Vocational Training Course</h3>
              <button
                onClick={() => setIsAddWorkshopModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addLivelihoodTraining({
                  title: workshopForm.title,
                  description: workshopForm.description || 'Comprehensive hands-on livelihood and vocational training program.',
                  qualifications: 'Open to all bonafide barangay residents aged 18 and above.',
                  slotsTotal: Number(workshopForm.slotsTotal),
                  slotsAvailable: Number(workshopForm.slotsTotal),
                  schedule: workshopForm.schedule,
                  duration: workshopForm.duration,
                  venue: workshopForm.venue,
                  trainerName: workshopForm.trainerName || 'Certified TESDA Instructor',
                  partnerAgency: workshopForm.partnerAgency,
                  starterKitProvided: workshopForm.starterKitProvided,
                  startDate: workshopForm.startDate,
                  status: 'Open for Registration',
                });
                setIsAddWorkshopModalOpen(false);
                showToast(`Created workshop course "${workshopForm.title}".`);
              }}
              className="space-y-4 mt-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Course / Workshop Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrical Installation & Maintenance NC II"
                  value={workshopForm.title}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category:</label>
                  <input
                    type="text"
                    value={workshopForm.category}
                    onChange={(e) => setWorkshopForm({ ...workshopForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Partner Agency:</label>
                  <select
                    value={workshopForm.partnerAgency}
                    onChange={(e) => setWorkshopForm({ ...workshopForm, partnerAgency: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="TESDA Accredited">TESDA Accredited</option>
                    <option value="Barangay Livelihood Council">Barangay Livelihood Council</option>
                    <option value="DOST / DTI Provincial Desk">DOST / DTI Provincial Desk</option>
                    <option value="DA Regional Office">DA Regional Office</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Total Enrollee Slots:</label>
                  <input
                    type="number"
                    value={workshopForm.slotsTotal}
                    onChange={(e) => setWorkshopForm({ ...workshopForm, slotsTotal: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Trainer / Facilitator:</label>
                  <input
                    type="text"
                    placeholder="Instructor Name"
                    value={workshopForm.trainerName}
                    onChange={(e) => setWorkshopForm({ ...workshopForm, trainerName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Course Description & Learning Outcomes:</label>
                <textarea
                  rows={2}
                  required
                  value={workshopForm.description}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="starterKitCheck"
                  checked={workshopForm.starterKitProvided}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, starterKitProvided: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="starterKitCheck" className="font-semibold text-slate-700 dark:text-slate-300">
                  Includes Free Starter Equipment Kit & Training Materials
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddWorkshopModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Create Course</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT VIEWER MODAL */}
      <AttachedDocumentModal data={docViewerData} onClose={() => setDocViewerData(null)} />

      {/* PRINT SLIP MODAL */}
      <PrintSlipModal
        data={printData}
        onClose={() => setPrintData(null)}
        barangayName={settings.barangayName}
        municipality={settings.municipality}
        province={settings.province}
        punongBarangay={settings.punongBarangay}
      />
    </div>
  );
};
