import React, { useState, useEffect } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { Complaint, ComplaintStatus, CitizenConcern, CitizenConcernCategory, CitizenConcernStatus } from '../types';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { ConcernActionModal } from '../components/ConcernActionModal';
import { ConcernPrintModal } from '../components/ConcernPrintModal';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { InfoButton } from '../components/InfoButton';
import {
  Scale,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Users,
  ShieldCheck,
  AlertTriangle,
  BadgeAlert,
  Send,
  Eye,
  Check,
  Printer,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  User,
  History,
  Tag,
  FolderArchive,
  Layers,
  ArrowRight,
  ShieldAlert,
  Filter,
} from 'lucide-react';

export const ComplaintsView: React.FC = () => {
  const {
    complaints,
    addComplaint,
    updateComplaint,
    deleteComplaint,
    concerns,
    addConcern,
    updateConcern,
    deleteConcern,
    markConcernAsRead,
    escalateConcernToLupon,
    escalateConcernToBlotter,
    settings,
    currentUser,
    targetRecordId,
    setTargetRecordId,
    officials,
    sendHearingSummonsAlert,
    setIsSMSDispatchModalOpen,
    arePuroksMatching,
  } = useBarangay();

  // Active top-level sub-tab
  const [activeTab, setActiveTab] = useState<'concerns' | 'lupon'>('concerns');

  // Citizen Concerns States
  const [concernSearch, setConcernSearch] = useState('');
  const [concernStatusFilter, setConcernStatusFilter] = useState<CitizenConcernStatus | 'All' | 'Unread'>('All');
  const [concernCategoryFilter, setConcernCategoryFilter] = useState<CitizenConcernCategory | 'All'>('All');
  const [concernPurokFilter, setConcernPurokFilter] = useState<string>('All');
  const [selectedConcernForAction, setSelectedConcernForAction] = useState<CitizenConcern | null>(null);
  const [selectedConcernForPrint, setSelectedConcernForPrint] = useState<CitizenConcern | null>(null);
  const [deleteTargetConcern, setDeleteTargetConcern] = useState<CitizenConcern | null>(null);
  const [expandedConcernId, setExpandedConcernId] = useState<string | null>(null);
  const [isAddConcernModalOpen, setIsAddConcernModalOpen] = useState(false);

  // New Concern Intake Form (for Walk-in or Hotline intake)
  const [newConcernForm, setNewConcernForm] = useState({
    residentName: '',
    contactNumber: '',
    email: '',
    purok: 'Purok Pinya',
    category: 'Infrastructure & Lighting' as CitizenConcernCategory,
    subject: '',
    details: '',
    locationDetails: '',
    priority: 'Normal' as 'Normal' | 'Urgent' | 'High' | 'Emergency',
    assignedTo: 'Chief Tanod Arman K. Morales (BPSO & Night Patrol)',
  });

  // Lupon Mediation States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [deleteTargetComplaint, setDeleteTargetComplaint] = useState<Complaint | null>(null);

  const initialForm: Omit<Complaint, 'id'> = {
    caseNumber: `LUPON-2026-${String(complaints.length + 1).padStart(3, '0')}`,
    complainantName: '',
    respondentName: '',
    natureOfComplaint: 'Boundary & Property Fence Dispute',
    dateFiled: new Date().toISOString().split('T')[0],
    hearingDate: '2026-03-01',
    hearingTime: '09:00 AM',
    mediatorOfficial: settings.punongBarangay,
    hearingRound: 1,
    status: 'Open',
    settlementTerms: '',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialForm);

  // Handle incoming notification navigation
  useEffect(() => {
    if (targetRecordId) {
      // Check if targetRecordId matches a citizen concern
      const targetCon = concerns.find(
        (c) => c.id === targetRecordId || c.subject.toLowerCase().includes(targetRecordId.toLowerCase())
      );
      if (targetCon) {
        setActiveTab('concerns');
        setConcernSearch(targetCon.id);
        setSelectedConcernForAction(targetCon);
        setTargetRecordId(null);
        return;
      }

      // Check if targetRecordId matches a Lupon complaint
      const targetComp = complaints.find(
        (item) => item.id === targetRecordId || item.caseNumber === targetRecordId
      );
      if (targetComp) {
        setActiveTab('lupon');
        setSearchQuery(targetComp.caseNumber);
        handleOpenEdit(targetComp);
        setTargetRecordId(null);
        return;
      }
      setTargetRecordId(null);
    }
  }, [targetRecordId, concerns, complaints]);

  // Concerns Filter logic
  const filteredConcerns = concerns.filter((c) => {
    const term = concernSearch.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.id.toLowerCase().includes(term) ||
      c.subject.toLowerCase().includes(term) ||
      c.residentName.toLowerCase().includes(term) ||
      (c.details && c.details.toLowerCase().includes(term)) ||
      (c.description && c.description.toLowerCase().includes(term)) ||
      (c.locationDetails && c.locationDetails.toLowerCase().includes(term)) ||
      (c.purok && c.purok.toLowerCase().includes(term)) ||
      arePuroksMatching(c.purok, term);

    let matchesStatus = true;
    if (concernStatusFilter === 'Unread') {
      matchesStatus = !c.isRead;
    } else if (concernStatusFilter !== 'All') {
      matchesStatus = c.status === concernStatusFilter;
    }

    const matchesCategory = concernCategoryFilter === 'All' || c.category === concernCategoryFilter;
    const matchesPurok = arePuroksMatching(c.purok, concernPurokFilter);

    return matchesSearch && matchesStatus && matchesCategory && matchesPurok;
  });

  // Lupon complaints filter logic
  const filteredComplaints = complaints.filter((c) => {
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.caseNumber.toLowerCase().includes(term) ||
      c.complainantName.toLowerCase().includes(term) ||
      c.respondentName.toLowerCase().includes(term) ||
      c.natureOfComplaint.toLowerCase().includes(term);
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Metric counts for Citizen Concerns
  const totalConcerns = concerns.length;
  const unreadConcernsCount = concerns.filter((c) => !c.isRead).length;
  const inReviewConcernsCount = concerns.filter((c) => c.status === 'In Review').length;
  const actionTakenConcernsCount = concerns.filter((c) => c.status === 'Action Taken').length;
  const resolvedConcernsCount = concerns.filter((c) => c.status === 'Resolved').length;

  const handleOpenAdd = () => {
    setEditingComplaint(null);
    setFormData({
      ...initialForm,
      caseNumber: `LUPON-2026-${String(complaints.length + 1).padStart(3, '0')}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Complaint) => {
    setEditingComplaint(c);
    setFormData({
      caseNumber: c.caseNumber,
      complainantName: c.complainantName,
      respondentName: c.respondentName,
      natureOfComplaint: c.natureOfComplaint,
      dateFiled: c.dateFiled,
      hearingDate: c.hearingDate || '',
      hearingTime: c.hearingTime || '',
      mediatorOfficial: c.mediatorOfficial,
      hearingRound: c.hearingRound,
      status: c.status,
      settlementTerms: c.settlementTerms || '',
      remarks: c.remarks || '',
      certificateToFileActionIssued: c.certificateToFileActionIssued,
    });
    setIsModalOpen(true);
  };

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.complainantName || !formData.respondentName) {
      alert('Complainant and Respondent names are required.');
      return;
    }

    if (editingComplaint) {
      updateComplaint(editingComplaint.id, formData);
    } else {
      addComplaint(formData);
    }
    setIsModalOpen(false);
  };

  const handleSaveNewConcern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConcernForm.residentName || !newConcernForm.subject || !newConcernForm.details) {
      alert('Please fill in resident name, subject, and details.');
      return;
    }

    addConcern({
      residentName: newConcernForm.residentName,
      contactNumber: newConcernForm.contactNumber || '0917-000-0000',
      email: newConcernForm.email,
      purok: newConcernForm.purok,
      category: newConcernForm.category,
      subject: newConcernForm.subject,
      details: newConcernForm.details,
      description: newConcernForm.details,
      locationDetails: newConcernForm.locationDetails || `${newConcernForm.purok} vicinity`,
      priority: newConcernForm.priority,
      assignedTo: newConcernForm.assignedTo,
    });

    setIsAddConcernModalOpen(false);
    setNewConcernForm({
      residentName: '',
      contactNumber: '',
      email: '',
      purok: 'Purok Pinya',
      category: 'Streetlight / Infrastructure',
      subject: '',
      details: '',
      locationDetails: '',
      priority: 'Normal',
      assignedTo: 'Chief Tanod Arman K. Morales (BPSO & Night Patrol)',
    });
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Action Taken':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'In Review':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Endorsed to Lupon':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'Dismissed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-rose-50 text-rose-800 border-rose-300';
    }
  };

  const getPriorityBadge = (pr?: string) => {
    switch (pr) {
      case 'Emergency':
      case 'Urgent':
        return 'bg-rose-500 text-white font-bold animate-pulse';
      case 'High':
        return 'bg-amber-500 text-white font-bold';
      default:
        return 'bg-slate-100 text-slate-700 font-medium';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Public Service & Legal Bureau</span>
            </span>
            {unreadConcernsCount > 0 && (
              <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{unreadConcernsCount} Unread Citizen Concern{unreadConcernsCount > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Lupon Mediation & Citizen Concerns Management
            </h1>
            <InfoButton
              title="Lupon & Citizen Concerns"
              info="Manage filed citizen community reports, street lighting, sanitation, and dispatch official barangay field actions, alongside Katarungang Pambarangay dispute conciliation."
              variant="light"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {activeTab === 'concerns' ? (
            <button
              onClick={() => setIsAddConcernModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Intake Walk-in / Hotline Concern</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Docket New Lupon Case</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('concerns')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'concerns'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BadgeAlert className="w-4 h-4" />
          <span>Citizen Helpdesk & Filed Concerns</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
              activeTab === 'concerns' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {concerns.length}
          </span>
          {unreadConcernsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lupon')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'lupon'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Katarungang Pambarangay (Lupon Mediation)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
              activeTab === 'lupon' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {complaints.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CITIZEN HELPDESK & CONCERNS */}
      {activeTab === 'concerns' && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Grievances</p>
              <p className="text-2xl font-black text-slate-900 font-mono">{totalConcerns}</p>
              <p className="text-[11px] text-slate-400">All registered reports</p>
            </div>

            <div
              onClick={() => setConcernStatusFilter('Unread')}
              className={`bg-white border rounded-2xl p-4 shadow-xs space-y-1 cursor-pointer transition-all hover:scale-[1.02] ${
                concernStatusFilter === 'Unread'
                  ? 'border-rose-400 ring-2 ring-rose-300'
                  : 'border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Unread / New</p>
                {unreadConcernsCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
              </div>
              <p className="text-2xl font-black text-rose-600 font-mono">{unreadConcernsCount}</p>
              <p className="text-[11px] text-rose-600 font-semibold">Requires Desk Review</p>
            </div>

            <div
              onClick={() => setConcernStatusFilter('In Review')}
              className={`bg-white border rounded-2xl p-4 shadow-xs space-y-1 cursor-pointer transition-all hover:scale-[1.02] ${
                concernStatusFilter === 'In Review'
                  ? 'border-amber-400 ring-2 ring-amber-300'
                  : 'border-amber-200'
              }`}
            >
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">In Review</p>
              <p className="text-2xl font-black text-amber-600 font-mono">{inReviewConcernsCount}</p>
              <p className="text-[11px] text-amber-700 font-medium">Assigned & Inspecting</p>
            </div>

            <div
              onClick={() => setConcernStatusFilter('Action Taken')}
              className={`bg-white border rounded-2xl p-4 shadow-xs space-y-1 cursor-pointer transition-all hover:scale-[1.02] ${
                concernStatusFilter === 'Action Taken'
                  ? 'border-blue-400 ring-2 ring-blue-300'
                  : 'border-blue-200'
              }`}
            >
              <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Action Taken</p>
              <p className="text-2xl font-black text-blue-600 font-mono">{actionTakenConcernsCount}</p>
              <p className="text-[11px] text-blue-700 font-medium">Work order in progress</p>
            </div>

            <div
              onClick={() => setConcernStatusFilter('Resolved')}
              className={`bg-white border rounded-2xl p-4 shadow-xs space-y-1 cursor-pointer transition-all hover:scale-[1.02] ${
                concernStatusFilter === 'Resolved'
                  ? 'border-emerald-400 ring-2 ring-emerald-300'
                  : 'border-emerald-200'
              }`}
            >
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Resolved</p>
              <p className="text-2xl font-black text-emerald-600 font-mono">{resolvedConcernsCount}</p>
              <p className="text-[11px] text-emerald-700 font-medium">Completed & Closed</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <RecentSearchesInput
                value={concernSearch}
                onChange={setConcernSearch}
                placeholder="Search subject, resident, ticket ID..."
                storageKey="citizen_concerns"
                theme="light"
              />

              {/* Status Filter */}
              <div>
                <select
                  value={concernStatusFilter}
                  onChange={(e) => setConcernStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="All">All Statuses ({concerns.length})</option>
                  <option value="Unread">⚠️ Unread Only ({unreadConcernsCount})</option>
                  <option value="Received">Received</option>
                  <option value="In Review">In Review</option>
                  <option value="Action Taken">Action Taken</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Endorsed to Lupon">Endorsed to Lupon</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={concernCategoryFilter}
                  onChange={(e) => setConcernCategoryFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="All">All Categories</option>
                  <option value="Infrastructure & Lighting">Infrastructure & Street Lighting</option>
                  <option value="Sanitation & Garbage">Sanitation & Garbage</option>
                  <option value="Peace & Order">Peace & Order</option>
                  <option value="Health & Safety">Health & Safety</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>

              {/* Purok Filter */}
              <div>
                <select
                  value={concernPurokFilter}
                  onChange={(e) => setConcernPurokFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="All">All Puroks</option>
                  <option value="Purok Pinya">Purok Pinya</option>
                  <option value="Purok Lumboy">Purok Lumboy</option>
                  <option value="Purok Mangga">Purok Mangga</option>
                  <option value="Purok Tambis">Purok Tambis</option>
                  <option value="Purok Kaimito">Purok Kaimito</option>
                  <option value="Purok Bayabas">Purok Bayabas</option>
                </select>
              </div>
            </div>

            {/* Active Filters Pill Bar */}
            {(concernSearch || concernStatusFilter !== 'All' || concernCategoryFilter !== 'All' || concernPurokFilter !== 'All') && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Filters:</span>
                {concernStatusFilter !== 'All' && (
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium flex items-center gap-1">
                    Status: {concernStatusFilter}
                    <button type="button" onClick={() => setConcernStatusFilter('All')} className="hover:text-indigo-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {concernCategoryFilter !== 'All' && (
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium flex items-center gap-1">
                    Category: {concernCategoryFilter}
                    <button type="button" onClick={() => setConcernCategoryFilter('All')} className="hover:text-indigo-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {concernPurokFilter !== 'All' && (
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium flex items-center gap-1">
                    Purok: {concernPurokFilter}
                    <button type="button" onClick={() => setConcernPurokFilter('All')} className="hover:text-indigo-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setConcernSearch('');
                    setConcernStatusFilter('All');
                    setConcernCategoryFilter('All');
                    setConcernPurokFilter('All');
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer ml-1"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

          {/* Concerns Cards List */}
          {filteredConcerns.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No citizen concerns found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No tickets match your active filter criteria. Clear filters or intake a walk-in/hotline concern.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConcernSearch('');
                  setConcernStatusFilter('All');
                  setConcernCategoryFilter('All');
                  setConcernPurokFilter('All');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConcerns.map((con) => {
                const isExpanded = expandedConcernId === con.id;
                const isUnread = !con.isRead;

                return (
                  <div
                    key={con.id}
                    className={`bg-white rounded-3xl border transition-all shadow-xs p-5 space-y-4 hover:shadow-md ${
                      isUnread
                        ? 'border-rose-300 ring-2 ring-rose-100 bg-gradient-to-r from-rose-50/30 to-white'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {/* Top Row: Meta badges, Priority & Read Status */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                            {con.id}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(con.status)}`}>
                            {con.status}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${getPriorityBadge(con.priority)}`}>
                            {con.priority || 'Normal'} Priority
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {con.category}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900">{con.subject}</h3>
                      </div>

                      {/* Read Status Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isUnread ? (
                          <button
                            type="button"
                            onClick={() => markConcernAsRead(con.id, currentUser.name)}
                            className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer animate-pulse"
                            title="Click to mark as read"
                          >
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            <span>Mark as Read</span>
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Read by {con.readBy || 'Barangay Desk'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Citizen & Location Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Complainant / Citizen</span>
                          <strong className="text-slate-900">{con.residentName}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Purok & Location</span>
                          <strong className="text-slate-900">{con.purok}</strong>
                          {con.locationDetails && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-xs">{con.locationDetails}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Date Filed & Contact</span>
                          <strong className="text-slate-900">{con.dateSubmitted}</strong>
                          <span className="text-[11px] text-slate-500 block font-mono">{con.contactNumber || 'No Phone'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <p className="font-semibold text-slate-800 mb-0.5">Concern Details:</p>
                      <p className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 whitespace-pre-wrap">
                        {con.description || con.details}
                      </p>
                    </div>

                    {/* Barangay Official Action & Feedback Section */}
                    {(con.assignedTo || con.actionNotes || con.feedbackNotes) && (
                      <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            <span>Official Barangay Action & Field Directives</span>
                          </span>
                          {con.targetResolutionDate && (
                            <span className="text-[11px] text-indigo-700 font-semibold">
                              Target Date: <strong>{con.targetResolutionDate}</strong>
                            </span>
                          )}
                        </div>

                        {con.assignedTo && (
                          <div className="text-[11px]">
                            <span className="text-slate-500 font-semibold">Assigned Responding Unit: </span>
                            <strong className="text-slate-900">{con.assignedTo}</strong>
                          </div>
                        )}

                        {con.actionNotes && (
                          <div className="text-[11px]">
                            <span className="text-slate-500 font-semibold block">Internal Action Log:</span>
                            <p className="text-slate-800 mt-0.5 bg-white/70 p-2 rounded-lg border border-indigo-100">
                              {con.actionNotes}
                            </p>
                          </div>
                        )}

                        {con.feedbackNotes && (
                          <div className="text-[11px]">
                            <span className="text-indigo-800 font-semibold block">Feedback to Resident (Portal):</span>
                            <p className="text-indigo-900 mt-0.5 bg-white/70 p-2 rounded-lg border border-indigo-200 italic">
                              "{con.feedbackNotes}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expandable History Drawer */}
                    {isExpanded && con.actionHistory && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3 animate-fade-in">
                        <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Timestamped Action Trail & Audit History</span>
                        </h4>

                        <div className="relative pl-5 space-y-3 border-l-2 border-indigo-200">
                          {con.actionHistory.map((item, idx) => (
                            <div key={idx} className="relative space-y-0.5">
                              <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600" />
                              <div className="flex items-center justify-between text-[11px]">
                                <strong className="text-slate-900">{item.action}</strong>
                                <span className="text-slate-400 font-mono">{item.timestamp}</span>
                              </div>
                              <p className="text-slate-600 text-[11px]">{item.notes}</p>
                              <div className="text-[10px] text-slate-400">By: {item.actor}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Bar Footer */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedConcernId(isExpanded ? null : con.id)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Hide History</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>View History ({con.actionHistory?.length || 1})</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedConcernForPrint(con)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Print Official Action Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Work Slip</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!con.isRead) {
                              markConcernAsRead(con.id, currentUser.name);
                            }
                            setSelectedConcernForAction(con);
                          }}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Review & Give Action</span>
                        </button>

                        {currentUser.role === 'Administrator' && (
                          <button
                            type="button"
                            onClick={() => setDeleteTargetConcern(con)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Concern Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LUPON MEDIATION DISPUTES */}
      {activeTab === 'lupon' && (
        <div className="space-y-6">
          {/* Lupon Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Docketed Cases</p>
              <p className="text-2xl font-black text-slate-900 font-mono">{complaints.length}</p>
              <p className="text-[11px] text-slate-400">Lupon Tagapamayapa roster</p>
            </div>

            <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Ongoing Mediation</p>
              <p className="text-2xl font-black text-amber-600 font-mono">
                {complaints.filter((c) => c.status === 'Ongoing Mediation' || c.status === 'Open').length}
              </p>
              <p className="text-[11px] text-amber-700 font-medium">Hearings scheduled</p>
            </div>

            <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Amicably Settled</p>
              <p className="text-2xl font-black text-emerald-600 font-mono">
                {complaints.filter((c) => c.status === 'Amicably Settled').length}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">Kasunduan Executed</p>
            </div>

            <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">CFA Court Referrals</p>
              <p className="text-2xl font-black text-rose-600 font-mono">
                {complaints.filter((c) => c.status === 'Certificate to File Action Issued').length}
              </p>
              <p className="text-[11px] text-rose-700 font-medium">Endorsed to MTC Court</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row gap-3">
            <RecentSearchesInput
              className="flex-1"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search case number, complainant, respondent, or dispute nature..."
              storageKey="lupon_cases"
              theme="light"
            />

            <div className="w-full sm:w-64">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
              >
                <option value="All">All Mediation Statuses</option>
                <option value="Open">Open / Newly Docketed</option>
                <option value="Ongoing Mediation">Ongoing Mediation</option>
                <option value="Amicably Settled">Amicably Settled (Kasunduan)</option>
                <option value="Certificate to File Action Issued">CFA Issued (Court Referral)</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>
          </div>

          {/* Complaints Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComplaints.map((c) => (
              <div
                key={c.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-all space-y-4 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {c.caseNumber}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1.5">{c.natureOfComplaint}</h3>
                      <p className="text-[11px] text-slate-400">Docketed on {c.dateFiled}</p>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${
                        c.status === 'Amicably Settled'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : c.status === 'Certificate to File Action Issued'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  {/* Parties */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold uppercase block">Complainant:</span>
                      <p className="font-bold text-slate-900">{c.complainantName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-700 font-bold uppercase block">Respondent:</span>
                      <p className="font-bold text-slate-900">{c.respondentName}</p>
                    </div>
                  </div>

                  {/* Hearing Schedule & Round */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        Hearing:{' '}
                        <strong>
                          {c.hearingDate || 'TBD'} ({c.hearingTime || 'TBD'})
                        </strong>
                      </span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                      Round {c.hearingRound}
                    </span>
                  </div>

                  {/* Settlement Terms */}
                  {c.settlementTerms && (
                    <div className="text-xs bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 text-emerald-900">
                      <span className="font-bold uppercase text-[10px] block text-emerald-800">
                        Kasunduan / Settlement Agreement:
                      </span>
                      <p className="mt-0.5 font-medium">{c.settlementTerms}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Mediator: <strong className="text-slate-800">{c.mediatorOfficial}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        sendHearingSummonsAlert({
                          caseNumber: c.caseNumber,
                          caseTitle: c.caseType,
                          recipientName: c.complainantName,
                          recipientPhone: c.contactNumber,
                          hearingDate: c.hearingDate || new Date().toISOString().split('T')[0],
                          hearingTime: c.hearingTime || '09:00 AM',
                          hearingStage: c.stage,
                          venue: 'Barangay Sangkol Lupon Mediation Hall',
                          mediator: c.mediatorOfficial,
                          role: 'Complainant',
                          complaintOrBlotterId: c.id,
                        })
                      }
                      className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold border border-sky-200 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                      title="Send Hearing Summons & Notice of Conciliation via SMS & Email"
                    >
                      <Send className="w-3 h-3 text-sky-600" />
                      <span>Dispatch Summons</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Update Proceedings</span>
                    </button>

                    {currentUser.role === 'Administrator' && (
                      <button
                        onClick={() => setDeleteTargetComplaint(c)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Lupon Docket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concern Action Modal */}
      <ConcernActionModal
        isOpen={!!selectedConcernForAction}
        onClose={() => setSelectedConcernForAction(null)}
        concern={selectedConcernForAction}
        onEscalateToLupon={(con) => {
          escalateConcernToLupon(con.id, currentUser.name);
          setSelectedConcernForAction(null);
          setActiveTab('lupon');
        }}
        onEscalateToBlotter={(con) => {
          escalateConcernToBlotter(con.id, currentUser.name);
          setSelectedConcernForAction(null);
        }}
        onPrintSlip={(con) => {
          setSelectedConcernForPrint(con);
        }}
      />

      {/* Concern Print Slip Modal */}
      <ConcernPrintModal
        isOpen={!!selectedConcernForPrint}
        onClose={() => setSelectedConcernForPrint(null)}
        concern={selectedConcernForPrint}
      />

      {/* Walk-in / Hotline Concern Intake Modal */}
      {isAddConcernModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BadgeAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Intake Citizen Concern / Hotline Report</h3>
                  <p className="text-xs text-slate-500">Record a walk-in resident complaint, phone report, or radio dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddConcernModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewConcern} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Complainant Citizen Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newConcernForm.residentName}
                    onChange={(e) => setNewConcernForm({ ...newConcernForm, residentName: e.target.value })}
                    placeholder="e.g. Juan De La Cruz"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Mobile Number
                  </label>
                  <input
                    type="text"
                    value={newConcernForm.contactNumber}
                    onChange={(e) => setNewConcernForm({ ...newConcernForm, contactNumber: e.target.value })}
                    placeholder="e.g. 0917-123-4567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Purok / Vicinity *
                  </label>
                  <select
                    value={newConcernForm.purok}
                    onChange={(e) => setNewConcernForm({ ...newConcernForm, purok: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                  >
                    <option value="Purok Pinya">Purok Pinya</option>
                    <option value="Purok Lumboy">Purok Lumboy</option>
                    <option value="Purok Mangga">Purok Mangga</option>
                    <option value="Purok Tambis">Purok Tambis</option>
                    <option value="Purok Kaimito">Purok Kaimito</option>
                    <option value="Purok Bayabas">Purok Bayabas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={newConcernForm.category}
                    onChange={(e) => setNewConcernForm({ ...newConcernForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                  >
                    <option value="Infrastructure & Lighting">Infrastructure & Lighting</option>
                    <option value="Sanitation & Garbage">Sanitation & Garbage</option>
                    <option value="Peace & Order">Peace & Order</option>
                    <option value="Health & Safety">Health & Safety</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newConcernForm.priority}
                    onChange={(e) => setNewConcernForm({ ...newConcernForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specific Location Details
                </label>
                <input
                  type="text"
                  value={newConcernForm.locationDetails}
                  onChange={(e) => setNewConcernForm({ ...newConcernForm, locationDetails: e.target.value })}
                  placeholder="e.g. Near corner sari-sari store, beside basketball court"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={newConcernForm.subject}
                  onChange={(e) => setNewConcernForm({ ...newConcernForm, subject: e.target.value })}
                  placeholder="e.g. Defective street solar light pole #14"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Description & Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newConcernForm.details}
                  onChange={(e) => setNewConcernForm({ ...newConcernForm, details: e.target.value })}
                  placeholder="Provide comprehensive details for the field action team..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Responding Official / Unit
                </label>
                <select
                  value={newConcernForm.assignedTo}
                  onChange={(e) => setNewConcernForm({ ...newConcernForm, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="Arman K. Morales (Chief Barangay Tanod & BPSO)">
                    Chief Tanod Arman K. Morales (BPSO & Night Patrol)
                  </option>
                  <option value="Hon. Arnaldo B. Santos (Committee on Infrastructure)">
                    Hon. Arnaldo B. Santos (Infrastructure & Lighting)
                  </option>
                  <option value="Hon. Danilo R. Navarro (Committee on Environment & Sanitation)">
                    Hon. Danilo R. Navarro (Sanitation & Garbage)
                  </option>
                  <option value="Hon. Jocelyn S. Macaraeg (Committee on Health & Nutrition)">
                    Hon. Jocelyn S. Macaraeg (Health Station & BHW)
                  </option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddConcernModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Record Citizen Concern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lupon Docketing / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingComplaint ? 'Update Lupon Proceedings' : 'Docket New Lupon Case'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{formData.caseNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nature of Dispute / Complaint *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.natureOfComplaint}
                    onChange={(e) => setFormData({ ...formData, natureOfComplaint: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date Filed
                  </label>
                  <input
                    type="date"
                    value={formData.dateFiled}
                    onChange={(e) => setFormData({ ...formData, dateFiled: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    Complainant Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.complainantName}
                    onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
                    Respondent Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.respondentName}
                    onChange={(e) => setFormData({ ...formData, respondentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hearing Date
                  </label>
                  <input
                    type="date"
                    value={formData.hearingDate}
                    onChange={(e) => setFormData({ ...formData, hearingDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hearing Time
                  </label>
                  <input
                    type="text"
                    value={formData.hearingTime}
                    onChange={(e) => setFormData({ ...formData, hearingTime: e.target.value })}
                    placeholder="e.g. 09:30 AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hearing Round (1st, 2nd, 3rd)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.hearingRound}
                    onChange={(e) => setFormData({ ...formData, hearingRound: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Mediator / Lupon Member
                  </label>
                  <input
                    type="text"
                    value={formData.mediatorOfficial}
                    onChange={(e) => setFormData({ ...formData, mediatorOfficial: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mediation Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white"
                  >
                    <option value="Open">Open</option>
                    <option value="Ongoing Mediation">Ongoing Mediation</option>
                    <option value="Amicably Settled">Amicably Settled (Kasunduan)</option>
                    <option value="Certificate to File Action Issued">CFA Issued (Endorsement to Court)</option>
                    <option value="Dismissed">Dismissed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kasunduan / Amicable Settlement Terms (if resolved)
                </label>
                <textarea
                  rows={3}
                  value={formData.settlementTerms}
                  onChange={(e) => setFormData({ ...formData, settlementTerms: e.target.value })}
                  placeholder="State the terms and conditions agreed upon by both parties..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Lupon Docket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Complaint */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetComplaint}
        title="Delete Lupon Case Docket"
        itemType="Lupon Complaint"
        itemName={
          deleteTargetComplaint
            ? `${deleteTargetComplaint.caseNumber} - ${deleteTargetComplaint.natureOfComplaint} (${deleteTargetComplaint.complainantName} vs ${deleteTargetComplaint.respondentName})`
            : undefined
        }
        description="Permanently delete this Lupon Tagapamayapa case docket and all recorded conciliation proceedings from the records."
        confirmText="Yes, Delete Case"
        onConfirm={() => {
          if (deleteTargetComplaint) {
            deleteComplaint(deleteTargetComplaint.id);
          }
        }}
        onClose={() => setDeleteTargetComplaint(null)}
      />

      {/* Delete Confirmation Modal for Concern */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetConcern}
        title="Delete Citizen Concern Ticket"
        itemType="Citizen Concern"
        itemName={
          deleteTargetConcern
            ? `${deleteTargetConcern.id} - ${deleteTargetConcern.subject} (${deleteTargetConcern.residentName})`
            : undefined
        }
        description="Permanently delete this citizen report ticket and all associated administrative action logs from the system."
        confirmText="Yes, Delete Concern"
        onConfirm={() => {
          if (deleteTargetConcern) {
            deleteConcern(deleteTargetConcern.id);
          }
        }}
        onClose={() => setDeleteTargetConcern(null)}
      />
    </div>
  );
};
