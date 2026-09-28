import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { CertificateRecord, CertificateType } from '../types';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { CertificateVerificationModal } from '../components/CertificateVerificationModal';
import { CertificateAlertDispatchModal } from '../components/CertificateAlertDispatchModal';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { InfoButton } from '../components/InfoButton';
import { Pagination } from '../components/Pagination';
import { calculateAge, formatCleanCertificateAddress } from '../utils/ageUtils';
import {
  FileCheck2,
  Plus,
  Search,
  Printer,
  FileText,
  User,
  ShieldCheck,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  BellRing,
  MapPin,
  Sparkles,
  Inbox,
  Filter,
  QrCode,
  ExternalLink,
  Radio,
  Smartphone,
  Mail,
  ChevronDown,
  Check,
} from 'lucide-react';

export const CertificatesView: React.FC = () => {
  const {
    certificates,
    issueCertificate,
    approveCertificate,
    rejectCertificate,
    deleteCertificate,
    residents,
    settings,
    currentUser,
    officials,
    setSelectedCertForPrint,
    setActiveModule,
    targetCertificateId,
    setTargetCertificateId,
    sendCertificateReadyAlert,
    setIsSMSDispatchModalOpen,
  } = useBarangay();

  // Strict Role Guard: Only Administrators, Barangay Staff, and Barangay Officials can approve or issue official documents
  if (currentUser.role === 'Resident') {
    return (
      <div className="max-w-2xl mx-auto p-8 my-12 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Administrative Clearance Desk (Restricted)</h2>
          <p className="text-sm text-slate-600">
            The official clearance approval desk and issuance ledger are restricted to <strong>Barangay Administrators and Staff</strong>.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            As a resident, you can apply for Barangay Clearances and track your approved documents directly through the <strong>Citizen Portal</strong>.
          </p>
        </div>
        <div className="pt-4">
          <button
            onClick={() => setActiveModule('resident_portal')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 mx-auto"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Go to Resident Clearance Request Desk</span>
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'requests' | 'ledger'>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const secretaryName =
    officials?.find((o) => o.position.toLowerCase().includes('secretary'))?.name ||
    settings.barangaySecretary ||
    'Atty. Maria Elena V. Ramos';

  const getDisplayIssuer = (cert: CertificateRecord) => {
    const raw = cert.issuedBy || cert.approvedBy;
    if (
      !raw ||
      raw.toLowerCase().includes('portal') ||
      raw.toLowerCase().includes('online') ||
      raw.toLowerCase().includes('residential') ||
      raw.toLowerCase().includes('system')
    ) {
      return secretaryName;
    }
    return raw;
  };

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [approvingCert, setApprovingCert] = useState<CertificateRecord | null>(null);
  const [rejectingCert, setRejectingCert] = useState<CertificateRecord | null>(null);
  const [deleteTargetCert, setDeleteTargetCert] = useState<CertificateRecord | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);
  const [isVerificationDeskOpen, setIsVerificationDeskOpen] = useState(false);
  const [targetVerificationControlNo, setTargetVerificationControlNo] = useState<string | null>(null);
  const [alertDispatchCert, setAlertDispatchCert] = useState<CertificateRecord | null>(null);

  // Approval Form State
  const [approvalOrNumber, setApprovalOrNumber] = useState('');
  const [approvalFee, setApprovalFee] = useState(50);
  const [approvalRemarks, setApprovalRemarks] = useState('Approved and verified against Barangay Sangkol Resident Registry.');
  const [approvalPickupInstructions, setApprovalPickupInstructions] = useState('Ready for pickup at Barangay Hall Window 1. Please present 1 valid government ID.');

  // Rejection Form State
  const [rejectionReason, setRejectionReason] = useState('');

  // Walk-in Issue Form State
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [certType, setCertType] = useState<CertificateType>('Barangay Clearance');
  const [purpose, setPurpose] = useState('Employment Requirement');
  const [orNumber, setOrNumber] = useState(`OR-2026-${String(certificates.length + 1).padStart(4, '0')}`);
  const [fee, setFee] = useState(settings.clearanceFeeRegular || 50);
  const [cedulaNo, setCedulaNo] = useState('CCI2026-98765432');
  const [cedulaIssuedAt, setCedulaIssuedAt] = useState(settings.municipality);
  const [cedulaIssuedDate, setCedulaIssuedDate] = useState('2026-01-10');
  const [businessName, setBusinessName] = useState('');
  const [businessNature, setBusinessNature] = useState('');
  const [remarks, setRemarks] = useState('');

  // Pagination states
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsPageSize, setRequestsPageSize] = useState(25);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(25);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    setRequestsPage(1);
    setLedgerPage(1);
  }, [deferredSearchQuery, statusFilter, selectedType, activeTab]);

  const pendingRequests = useMemo(() => certificates.filter((c) => c.status === 'Pending'), [certificates]);
  const issuedLedger = useMemo(() => certificates.filter((c) => c.status === 'Issued' || c.status === 'Approved'), [certificates]);

  const filteredRequests = useMemo(() => {
    const term = deferredSearchQuery.toLowerCase().trim();
    return certificates.filter((c) => {
      if (selectedType !== 'All' && c.type !== selectedType) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (term) {
        const matchesSearch =
          c.controlNumber.toLowerCase().includes(term) ||
          c.residentName.toLowerCase().includes(term) ||
          c.type.toLowerCase().includes(term) ||
          c.purpose.toLowerCase().includes(term) ||
          (c.residentAddress && c.residentAddress.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [certificates, deferredSearchQuery, selectedType, statusFilter]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (requestsPage - 1) * requestsPageSize;
    return filteredRequests.slice(startIndex, startIndex + requestsPageSize);
  }, [filteredRequests, requestsPage, requestsPageSize]);

  const filteredLedger = useMemo(() => {
    const term = deferredSearchQuery.toLowerCase().trim();
    return issuedLedger.filter((c) => {
      if (selectedType !== 'All' && c.type !== selectedType) return false;
      if (term) {
        const matchesSearch =
          c.controlNumber.toLowerCase().includes(term) ||
          c.residentName.toLowerCase().includes(term) ||
          c.type.toLowerCase().includes(term) ||
          c.purpose.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [issuedLedger, deferredSearchQuery, selectedType]);

  const paginatedLedger = useMemo(() => {
    const startIndex = (ledgerPage - 1) * ledgerPageSize;
    return filteredLedger.slice(startIndex, startIndex + ledgerPageSize);
  }, [filteredLedger, ledgerPage, ledgerPageSize]);

  const handleResidentSelect = (rId: string) => {
    setSelectedResidentId(rId);
  };

  const activeResidents = useMemo(() => residents.filter((r) => r.residentStatus === 'Active'), [residents]);

  const filteredRegistryResidents = useMemo(() => {
    const q = residentSearchQuery.toLowerCase().trim();
    if (!q) return activeResidents.slice(0, 40);

    const matches: typeof activeResidents = [];
    for (let i = 0; i < activeResidents.length; i++) {
      const r = activeResidents[i];
      const fullName = `${r.firstName} ${r.middleName || ''} ${r.lastName} ${r.suffix || ''}`.toLowerCase();
      const reverseName = `${r.lastName}, ${r.firstName} ${r.middleName || ''}`.toLowerCase();
      const purok = (r.purok || '').toLowerCase();
      const phone = (r.contactNumber || '').toLowerCase();
      const street = (r.streetAddress || '').toLowerCase();
      const idNum = (r.id || '').toLowerCase();

      if (
        fullName.includes(q) ||
        reverseName.includes(q) ||
        purok.includes(q) ||
        phone.includes(q) ||
        street.includes(q) ||
        idNum.includes(q)
      ) {
        matches.push(r);
        if (matches.length >= 40) break; // High performance cap
      }
    }
    return matches;
  }, [activeResidents, residentSearchQuery]);

  const selectedResident = residents.find((r) => r.id === selectedResidentId);

  const handleCertTypeChange = (type: CertificateType) => {
    setCertType(type);
    if (type === 'Certificate of Indigency' || type === 'First Time Jobseeker (RA 11261)') {
      setFee(0);
    } else if (type === 'Business Clearance') {
      setFee(settings.businessClearanceFee || 300);
    } else if (type === 'Certificate of Residency') {
      setFee(settings.residencyCertFee || 50);
    } else {
      setFee(settings.clearanceFeeRegular || 50);
    }
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId) {
      setActionSuccessToast('Please select a resident to issue the certificate to.');
      setTimeout(() => setActionSuccessToast(null), 4000);
      return;
    }

    const resident = residents.find((r) => r.id === selectedResidentId);
    if (!resident) {
      setActionSuccessToast('Selected resident was not found in the registry.');
      setTimeout(() => setActionSuccessToast(null), 4000);
      return;
    }

    const calculatedAge = resident.birthDate ? calculateAge(resident.birthDate) : (resident.age || 26);

    const newCert = issueCertificate({
      controlNumber: `CERT-${Date.now().toString().slice(-6)}`,
      type: certType,
      residentId: resident.id,
      residentName: `${resident.firstName} ${resident.middleName ? resident.middleName.charAt(0) + '. ' : ''}${resident.lastName}${resident.suffix ? ' ' + resident.suffix : ''}`,
      residentAddress: formatCleanCertificateAddress(null, resident.purok, settings.barangayName),
      residentAge: calculatedAge,
      residentBirthDate: resident.birthDate,
      residentCivilStatus: resident.civilStatus,
      purpose,
      orNumber: fee > 0 ? orNumber : 'EXEMPTED / WAIVED',
      fee,
      cedulaNo,
      cedulaIssuedAt,
      cedulaIssuedDate,
      signatoryOfficial: settings.punongBarangay,
      signatoryPosition: 'Punong Barangay',
      issuedBy: currentUser.role === 'Barangay Secretary' ? currentUser.name : secretaryName,
      businessName: certType === 'Business Clearance' ? businessName : undefined,
      businessNature: certType === 'Business Clearance' ? businessNature : undefined,
      businessAddress: certType === 'Business Clearance' ? `${resident.streetAddress}, ${resident.purok}` : undefined,
      status: 'Issued',
      isReadyForPickup: true,
      remarks,
    });

    setIsIssueModalOpen(false);
    setSelectedCertForPrint(newCert);
  };

  const handleOpenApproveModal = (cert: CertificateRecord) => {
    setApprovingCert(cert);
    setApprovalOrNumber(
      cert.fee > 0
        ? `OR-2026-${String(certificates.length + 1).padStart(4, '0')}`
        : 'EXEMPTED / WAIVED'
    );
    setApprovalFee(cert.fee);
    setApprovalRemarks('Approved and verified against Barangay Sangkol Resident Registry.');
    setApprovalPickupInstructions(
      cert.deliveryOption === 'Digital Copy'
        ? 'Digital certificate approved. Resident may immediately download or print from the portal.'
        : 'Ready for pickup at Barangay Hall Window 1. Please present 1 valid government ID.'
    );
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingCert) return;

    approveCertificate(approvingCert.id, {
      orNumber: approvalOrNumber,
      fee: approvalFee,
      remarks: approvalRemarks,
      pickupInstructions: approvalPickupInstructions,
    });

    setActionSuccessToast(
      `✓ Approved! Notification dispatched to ${approvingCert.residentName}. Certificate is now marked READY for pickup/print.`
    );
    setTimeout(() => setActionSuccessToast(null), 6000);
    setApprovingCert(null);
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCert) return;

    rejectCertificate(rejectingCert.id, rejectionReason || 'Request details require physical consultation at the Barangay Hall.');

    setActionSuccessToast(
      `Certificate request ${rejectingCert.controlNumber} for ${rejectingCert.residentName} was returned. Notification sent to resident.`
    );
    setTimeout(() => setActionSuccessToast(null), 6000);
    setRejectingCert(null);
    setRejectionReason('');
  };

  // Immediate notification tap response: automatically route tab, filter, and open approval or print modal
  useEffect(() => {
    if (targetCertificateId) {
      const targetCert = certificates.find(
        (c) => c.id === targetCertificateId || c.controlNumber === targetCertificateId
      );
      if (targetCert) {
        if (targetCert.status === 'Pending') {
          setActiveTab('requests');
          setStatusFilter('All');
          setSearchQuery(targetCert.controlNumber);
          handleOpenApproveModal(targetCert);
        } else if (targetCert.status === 'Approved' || targetCert.status === 'Issued') {
          setActiveTab('ledger');
          setSearchQuery(targetCert.controlNumber);
          setSelectedCertForPrint(targetCert);
        } else if (targetCert.status === 'Rejected') {
          setActiveTab('requests');
          setStatusFilter('Rejected');
          setSearchQuery(targetCert.controlNumber);
        }
      }
      setTargetCertificateId(null);
    }
  }, [targetCertificateId, certificates]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Banner */}
      {actionSuccessToast && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-white px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-200">Action Complete</p>
              <p className="text-xs text-white">{actionSuccessToast}</p>
            </div>
          </div>
          <button
            onClick={() => setActionSuccessToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <FileCheck2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Certificate & Clearance Management</span>
            <InfoButton
              title="Certificates & Clearances"
              info="Review online resident certificate requests, verify printed document QR codes, and issue Republic clearances."
              variant="light"
            />
          </h2>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setTargetVerificationControlNo(null);
              setIsVerificationDeskOpen(true);
            }}
            className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
          >
            <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>QR Verification Desk</span>
          </button>

          <button
            onClick={() => {
              setOrNumber(`OR-2026-${String(certificates.length + 1).padStart(4, '0')}`);
              setResidentSearchQuery('');
              setSelectedResidentId('');
              setIsIssueModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Walk-in Certificate Issuance</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Resident Portal Requests</span>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
              {pendingRequests.length} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Issued Certificates Ledger ({issuedLedger.length})</span>
        </button>
      </div>

      {/* TAB 1: ONLINE REQUESTS QUEUE */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black">
                {pendingRequests.length}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Awaiting Approval</p>
                <p className="text-sm font-bold text-white">Pending Requests</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black">
                {certificates.filter((c) => c.status === 'Approved' || c.status === 'Issued').length}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approved & Ready</p>
                <p className="text-sm font-bold text-white">Ready for Pickup</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black">
                ₱{pendingRequests.reduce((sum, c) => sum + (c.fee || 0), 0)}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Collections</p>
                <p className="text-sm font-bold text-white">Queue Total Fees</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-black">
                {certificates.filter((c) => c.status === 'Rejected').length}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Returned</p>
                <p className="text-sm font-bold text-white">Disapproved</p>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3">
            <RecentSearchesInput
              className="flex-1"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by resident name, control no., purpose, address..."
              storageKey="certificates"
              theme="dark"
            />

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Review Only</option>
                <option value="Approved">Approved & Ready</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Certificate Types</option>
                <option value="Barangay Clearance">Barangay Clearance</option>
                <option value="Certificate of Residency">Certificate of Residency</option>
                <option value="Certificate of Indigency">Certificate of Indigency</option>
                <option value="Certificate of Good Moral Character">Good Moral Character</option>
                <option value="Business Clearance">Business Clearance</option>
                <option value="First Time Jobseeker (RA 11261)">First Time Jobseeker (RA 11261)</option>
              </select>
            </div>
          </div>

          {/* Requests Queue List */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Resident Portal Application Queue
                </span>
                <span className="text-xs text-slate-400 ml-2">({filteredRequests.length} applications)</span>
              </div>

              <ViewModeToggle
                viewMode={viewMode}
                onChange={setViewMode}
                theme="dark"
                accentColor="indigo"
                tableTitle="Table View (Applications Queue)"
                gridTitle="Grid View (Application Cards)"
              />
            </div>

            {filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <FileCheck2 className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
                <p className="text-sm font-semibold text-slate-400">No certificate applications match the selected filter</p>
                <p className="text-xs text-slate-500">New requests submitted from the resident portal will appear here in real time.</p>
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Control No. & Date</th>
                      <th className="px-4 py-3">Applicant Resident</th>
                      <th className="px-4 py-3">Document Type & Purpose</th>
                      <th className="px-4 py-3">Delivery / Claim Preference</th>
                      <th className="px-4 py-3">Fee & O.R.</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {paginatedRequests.map((cert) => {
                      const isPending = cert.status === 'Pending';
                      const isApproved = cert.status === 'Approved' || cert.status === 'Issued';
                      const isRejected = cert.status === 'Rejected';

                      return (
                        <tr key={cert.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono">
                            <p className="font-bold text-white text-[11px]">{cert.controlNumber}</p>
                            <p className="text-[10px] text-slate-400">{cert.requestedAt || cert.dateIssued}</p>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-900/60 border border-indigo-700 text-indigo-200 font-bold flex items-center justify-center text-xs shrink-0">
                                {cert.residentName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-white">{cert.residentName}</p>
                                <p className="text-[10px] text-slate-400 truncate max-w-xs">
                                  {cert.residentAddress || 'Barangay Sangkol Resident'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 block w-fit mb-1">
                              {cert.type}
                            </span>
                            <p className="text-slate-200 text-[11px] line-clamp-1">{cert.purpose}</p>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{cert.deliveryOption || 'Pick up at Barangay Hall'}</span>
                            </div>
                            {cert.pickupInstructions && (
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {cert.pickupInstructions}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <p className="font-bold text-emerald-400">
                              {cert.fee > 0 ? `₱${cert.fee.toFixed(2)}` : 'FREE / WAIVED'}
                            </p>
                            <p className="font-mono text-[10px] text-slate-400">{cert.orNumber || 'Pending OR'}</p>
                          </td>

                          <td className="px-4 py-3">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                <Clock className="w-3 h-3 animate-spin" />
                                <span>Pending Approval</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approved & Ready</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <XCircle className="w-3 h-3" />
                                <span>Returned</span>
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleOpenApproveModal(cert)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1 transition-all"
                                    title="Approve and notify resident"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve & Notify</span>
                                  </button>

                                  <button
                                    onClick={() => setRejectingCert(cert)}
                                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg text-xs font-medium border border-slate-700 cursor-pointer"
                                    title="Return / Disapprove request"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <>
                                  <button
                                    onClick={() => setAlertDispatchCert(cert)}
                                    className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-semibold border border-rose-700/70 inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                    title="Send Gmail Alert to Citizen"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Gmail Alert</span>
                                  </button>

                                  <button
                                    onClick={() => setSelectedCertForPrint(cert)}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-semibold border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Print Document</span>
                                  </button>
                                </>
                              )}

                              {currentUser.role === 'Administrator' && (
                                <button
                                  onClick={() => setDeleteTargetCert(cert)}
                                  className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedRequests.map((cert) => {
                  const isPending = cert.status === 'Pending';
                  const isApproved = cert.status === 'Approved' || cert.status === 'Issued';
                  const isRejected = cert.status === 'Rejected';

                  return (
                    <div
                      key={cert.id}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                              {cert.controlNumber}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1">{cert.requestedAt || cert.dateIssued}</p>
                          </div>

                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3 animate-spin" />
                              <span>Pending</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approved</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              <span>Returned</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-900/60 border border-indigo-700 text-indigo-200 font-bold flex items-center justify-center text-sm shrink-0">
                            {cert.residentName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-sm truncate">{cert.residentName}</h4>
                            <p className="text-[11px] text-slate-400 truncate">{formatCleanCertificateAddress(cert.residentAddress, null, settings.barangayName)}</p>
                          </div>
                        </div>

                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-900">
                              {cert.type}
                            </span>
                            <span className="font-bold text-emerald-400 text-xs">
                              {cert.fee > 0 ? `₱${cert.fee.toFixed(2)}` : 'WAIVED'}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] line-clamp-2">
                            <strong className="text-slate-400 font-medium">Purpose:</strong> {cert.purpose}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-amber-300/90 pt-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{cert.deliveryOption || 'Pick up at Barangay Hall'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-1">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleOpenApproveModal(cert)}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => setRejectingCert(cert)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg text-xs border border-slate-700 cursor-pointer"
                                title="Return / Disapprove"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <>
                              <button
                                onClick={() => setAlertDispatchCert(cert)}
                                className="flex-1 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-semibold border border-rose-700/70 inline-flex items-center justify-center gap-1 cursor-pointer"
                                title="Send Gmail Alert"
                              >
                                <Mail className="w-3.5 h-3.5 text-rose-400" />
                                <span>Gmail Alert</span>
                              </button>
                              <button
                                onClick={() => setSelectedCertForPrint(cert)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs border border-slate-700 cursor-pointer"
                                title="Print Document"
                              >
                                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                            </>
                          )}
                        </div>

                        {currentUser.role === 'Administrator' && (
                          <button
                            onClick={() => setDeleteTargetCert(cert)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* High-Performance Pagination Bar for Applications Queue */}
            <Pagination
              currentPage={requestsPage}
              totalItems={filteredRequests.length}
              pageSize={requestsPageSize}
              onPageChange={setRequestsPage}
              onPageSizeChange={setRequestsPageSize}
              pageSizeOptions={[15, 25, 50, 100]}
              itemName="applications"
              theme="dark"
            />
          </div>
        </div>
      )}

      {/* TAB 2: ISSUED CERTIFICATES LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
            <RecentSearchesInput
              className="flex-1"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by control no., resident name, or certificate purpose..."
              storageKey="certificates_ledger"
              theme="dark"
            />

            <div className="w-full sm:w-64">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Certificate Types</option>
                <option value="Barangay Clearance">Barangay Clearance</option>
                <option value="Certificate of Residency">Certificate of Residency</option>
                <option value="Certificate of Indigency">Certificate of Indigency</option>
                <option value="Certificate of Good Moral Character">Good Moral Character</option>
                <option value="Business Clearance">Business Clearance</option>
                <option value="First Time Jobseeker (RA 11261)">First Time Jobseeker (RA 11261)</option>
              </select>
            </div>
          </div>

          {/* Issued Records Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Official Issued Certificates Ledger</span>
                <span className="text-xs text-slate-400 ml-2">({filteredLedger.length} issued documents)</span>
              </div>

              <ViewModeToggle
                viewMode={viewMode}
                onChange={setViewMode}
                theme="dark"
                accentColor="emerald"
                tableTitle="Table View (Issued Ledger)"
                gridTitle="Grid View (Issued Document Cards)"
              />
            </div>

            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Control No. & Date</th>
                      <th className="px-4 py-3">Resident / Client</th>
                      <th className="px-4 py-3">Certificate Type</th>
                      <th className="px-4 py-3">Purpose</th>
                      <th className="px-4 py-3">O.R. No. & Fee</th>
                      <th className="px-4 py-3">Signatory / Issued By</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {paginatedLedger.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono">
                          <p className="font-bold text-white text-[11px]">{cert.controlNumber}</p>
                          <p className="text-[10px] text-slate-400">{cert.dateIssued}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-white">{cert.residentName}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-xs">{formatCleanCertificateAddress(cert.residentAddress, null, settings.barangayName)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {cert.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-200">{cert.purpose}</td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-[10px] text-slate-400">{cert.orNumber}</p>
                          <p className="font-bold text-emerald-400">
                            {cert.fee > 0 ? `₱${cert.fee.toFixed(2)}` : 'FREE / WAIVED'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <p className="text-[11px] font-semibold text-white">{getDisplayIssuer(cert)}</p>
                          <p className="text-[10px] text-slate-500">{cert.signatoryOfficial}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setAlertDispatchCert(cert)}
                              className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-semibold border border-rose-700/70 inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              title="Send Gmail Alert to Citizen via Google Workspace"
                            >
                              <Mail className="w-3.5 h-3.5 text-rose-400" />
                              <span>Gmail Alert</span>
                            </button>

                            <button
                              onClick={() => {
                                setTargetVerificationControlNo(cert.controlNumber);
                                setIsVerificationDeskOpen(true);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-400 rounded-lg text-xs font-semibold border border-slate-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Verify QR Code & Authenticity"
                            >
                              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                            </button>

                            <button
                              onClick={() => setSelectedCertForPrint(cert)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Print Document</span>
                            </button>

                            {currentUser.role === 'Administrator' && (
                              <button
                                onClick={() => setDeleteTargetCert(cert)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
                                title="Delete Certificate Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedLedger.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                            {cert.controlNumber}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">{cert.dateIssued}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {cert.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 font-bold flex items-center justify-center text-sm shrink-0">
                          {cert.residentName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-sm truncate">{cert.residentName}</h4>
                          <p className="text-[11px] text-slate-400 truncate">{formatCleanCertificateAddress(cert.residentAddress, null, settings.barangayName)}</p>
                        </div>
                      </div>

                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                        <p className="text-slate-300 text-[11px] line-clamp-2">
                          <strong className="text-slate-400 font-medium">Purpose:</strong> {cert.purpose}
                        </p>
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-400 font-mono text-[10px]">OR: {cert.orNumber}</span>
                          <span className="font-bold text-emerald-400">
                            {cert.fee > 0 ? `₱${cert.fee.toFixed(2)}` : 'FREE / WAIVED'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 pt-0.5">
                          <span>Issued by: </span>
                          <span className="text-slate-200 font-semibold">{getDisplayIssuer(cert)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-1">
                        <button
                          onClick={() => setAlertDispatchCert(cert)}
                          className="flex-1 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-semibold border border-rose-700/70 inline-flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                          title="Gmail Alert"
                        >
                          <Mail className="w-3.5 h-3.5 text-rose-400" />
                          <span>Gmail Alert</span>
                        </button>

                        <button
                          onClick={() => {
                            setTargetVerificationControlNo(cert.controlNumber);
                            setIsVerificationDeskOpen(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-400 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer"
                          title="Verify QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                        </button>

                        <button
                          onClick={() => setSelectedCertForPrint(cert)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer"
                          title="Print Document"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      </div>

                      {currentUser.role === 'Administrator' && (
                        <button
                          onClick={() => setDeleteTargetCert(cert)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* High-Performance Pagination Bar for Issued Certificates Ledger */}
            <Pagination
              currentPage={ledgerPage}
              totalItems={filteredLedger.length}
              pageSize={ledgerPageSize}
              onPageChange={setLedgerPage}
              onPageSizeChange={setLedgerPageSize}
              pageSizeOptions={[15, 25, 50, 100]}
              itemName="certificates"
              theme="dark"
            />
          </div>
        </div>
      )}

      {/* APPROVAL & PICKUP NOTIFICATION MODAL */}
      {approvingCert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-emerald-950/60 border-b border-emerald-900/60 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Approve Certificate Request</span>
              </h3>
              <button
                onClick={() => setApprovingCert(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="p-6 space-y-4 text-xs">
              {/* Applicant Card */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Applicant Details</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {approvingCert.type}
                  </span>
                </div>
                <p className="text-sm font-bold text-white">{approvingCert.residentName}</p>
                <p className="text-slate-400">{formatCleanCertificateAddress(approvingCert.residentAddress, null, settings.barangayName)}</p>
                <p className="text-slate-300 font-semibold pt-1">
                  Purpose: <span className="text-white font-normal">{approvingCert.purpose}</span>
                </p>
                <p className="text-slate-400 text-[11px]">
                  Preferred Delivery: <strong className="text-amber-300">{approvingCert.deliveryOption || 'Pick up at Barangay Hall'}</strong>
                </p>
              </div>

              {/* Fee & OR */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Official Receipt (O.R.) No.</label>
                  <input
                    type="text"
                    required
                    value={approvalOrNumber}
                    onChange={(e) => setApprovalOrNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Fee Collected (₱)</label>
                  <input
                    type="number"
                    value={approvalFee}
                    onChange={(e) => setApprovalFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-bold"
                  />
                </div>
              </div>

              {/* Pickup & Ready Instructions */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Claiming / Pickup Notice (Sent to Resident Portal) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={approvalPickupInstructions}
                  onChange={(e) => setApprovalPickupInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g. Ready for pickup at Barangay Hall Window 1. Please present 1 valid ID."
                />
              </div>

              {/* Official Remarks */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Internal Verification Remarks</label>
                <input
                  type="text"
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl flex items-start gap-2.5 text-[11px] text-rose-300">
                <Mail className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-rose-300">Instant Gmail Notification</p>
                  <p>
                    Approving this request will immediately send an official Gmail notification to <strong>{approvingCert.residentName}</strong> with Control No. <code>{approvingCert.controlNumber}</code> and pickup instructions.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setApprovingCert(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Approval & Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISAPPROVE / REJECT MODAL */}
      {rejectingCert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-rose-950/60 border-b border-rose-900/60 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>Disapprove Certificate Application</span>
              </h3>
              <button
                onClick={() => setRejectingCert(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRejection} className="p-6 space-y-4 text-xs">
              <p className="text-slate-300">
                Are you sure you want to return the application for <strong>{rejectingCert.residentName}</strong> ({rejectingCert.type})?
              </p>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Reason for Disapproval *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete residency records, unverified cedula number, or pending hearing settlement."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectingCert(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold"
                >
                  Return Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WALK-IN ISSUE MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <span>Issue Official Barangay Document (Walk-in)</span>
              </h3>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Searchable Resident Selector for fast lookup among 1,000+ residents */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Select Registered Resident *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {filteredRegistryResidents.length} of {activeResidents.length} active residents
                  </span>
                </div>

                {/* Search Bar Input */}
                <div className="mb-2">
                  <RecentSearchesInput
                    value={residentSearchQuery}
                    onChange={setResidentSearchQuery}
                    placeholder="Search resident by name, purok, ID number, or phone..."
                    storageKey="certificate_modal_resident_search"
                    theme="dark"
                    inputClassName="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Selected Resident Preview Pill (if selected) */}
                {selectedResident && (
                  <div className="mb-2 p-2.5 bg-indigo-950/40 border border-indigo-500/40 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {selectedResident.firstName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">
                          {selectedResident.lastName}, {selectedResident.firstName} {selectedResident.middleName || ''} {selectedResident.suffix || ''}
                        </p>
                        <p className="text-[11px] text-indigo-300 truncate">
                          {selectedResident.purok} • Age {selectedResident.age || 'N/A'} • {selectedResident.civilStatus || 'Single'}
                          {selectedResident.contactNumber ? ` • ${selectedResident.contactNumber}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold bg-indigo-600/40 text-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Selected
                    </span>
                  </div>
                )}

                {/* Scrollable Resident Registry List with Fast Click */}
                <div className="border border-slate-700/80 bg-slate-800/90 rounded-xl overflow-hidden shadow-inner">
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-700/50">
                    {filteredRegistryResidents.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                        <p className="font-medium text-slate-300">No matching resident found</p>
                        <p className="text-[11px] text-slate-500">
                          Try searching by another keyword, last name, or purok name.
                        </p>
                      </div>
                    ) : (
                      filteredRegistryResidents.map((r) => {
                        const isSelected = r.id === selectedResidentId;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => handleResidentSelect(r.id)}
                            className={`w-full text-left p-2.5 text-xs transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600/20 text-white font-medium border-l-4 border-indigo-500'
                                : 'text-slate-200 hover:bg-slate-750 hover:text-white'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="font-semibold truncate">
                                {r.lastName}, {r.firstName} {r.middleName || ''} {r.suffix || ''}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                <span className="text-slate-300 font-medium">{r.purok}</span>
                                {r.streetAddress ? ` • ${r.streetAddress}` : ''}
                                <span> • Age {r.age}</span>
                                {r.contactNumber ? ` • ${r.contactNumber}` : ''}
                              </p>
                            </div>
                            {isSelected ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                Select
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Fallback hidden select to guarantee HTML5 required validity */}
                <select
                  required
                  value={selectedResidentId}
                  onChange={(e) => handleResidentSelect(e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <option value="">-- Choose Resident --</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.lastName}, {r.firstName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Document Type *</label>
                  <select
                    value={certType}
                    onChange={(e) => handleCertTypeChange(e.target.value as CertificateType)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-semibold"
                  >
                    <option value="Barangay Clearance">Barangay Clearance</option>
                    <option value="Certificate of Residency">Certificate of Residency</option>
                    <option value="Certificate of Indigency">Certificate of Indigency</option>
                    <option value="Certificate of Good Moral Character">Certificate of Good Moral Character</option>
                    <option value="Business Clearance">Business Clearance</option>
                    <option value="First Time Jobseeker (RA 11261)">First Time Jobseeker (RA 11261)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Purpose of Request *</label>
                  <input
                    type="text"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Local Employment, Bank Requirement, Scholarship"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {certType === 'Business Clearance' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Business Trade Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Sangkol Store"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Business Nature / Line</label>
                    <input
                      type="text"
                      value={businessNature}
                      onChange={(e) => setBusinessNature(e.target.value)}
                      placeholder="e.g. General Merchandise"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* CTC / Cedula info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Cedula / CTC No.</label>
                  <input
                    type="text"
                    value={cedulaNo}
                    onChange={(e) => setCedulaNo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Issued At</label>
                  <input
                    type="text"
                    value={cedulaIssuedAt}
                    onChange={(e) => setCedulaIssuedAt(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Issued Date</label>
                  <input
                    type="date"
                    value={cedulaIssuedDate}
                    onChange={(e) => setCedulaIssuedDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Official Receipt & Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Official Receipt (O.R.) No.</label>
                  <input
                    type="text"
                    value={orNumber}
                    onChange={(e) => setOrNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Fee Amount (₱)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  Issue & Generate Preview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetCert}
        title="Delete Certificate Record"
        itemType="Certificate Record"
        itemName={deleteTargetCert ? `${deleteTargetCert.type} (${deleteTargetCert.controlNumber}) - ${deleteTargetCert.residentName}` : undefined}
        description="Permanently delete this issued certificate record. This action will be logged in the audit trail."
        confirmText="Yes, Delete Certificate"
        onConfirm={() => {
          if (deleteTargetCert) {
            deleteCertificate(deleteTargetCert.id);
          }
        }}
        onClose={() => setDeleteTargetCert(null)}
      />

      {/* QR Verification Desk Modal */}
      <CertificateVerificationModal
        initialControlNumber={targetVerificationControlNo}
        isOpen={isVerificationDeskOpen}
        onClose={() => {
          setIsVerificationDeskOpen(false);
          setTargetVerificationControlNo(null);
        }}
      />

      {/* Real Citizen Alert Dispatch Modal */}
      <CertificateAlertDispatchModal
        isOpen={Boolean(alertDispatchCert)}
        onClose={() => setAlertDispatchCert(null)}
        certificate={alertDispatchCert}
        onAlertSent={(type, message) => {
          setActionSuccessToast(`✓ ${message}`);
          setTimeout(() => setActionSuccessToast(null), 5000);
        }}
      />
    </div>
  );
};
