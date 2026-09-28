import React, { useState, useEffect } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { BlotterRecord, IncidentType, BlotterStatus, BlotterActivityLog } from '../types';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { DataImportModal } from '../components/DataImportModal';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { InfoButton } from '../components/InfoButton';
import {
  ShieldAlert,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Edit2,
  Trash2,
  Users,
  FileSpreadsheet,
  ArrowRight,
  History,
  Scale,
  Shield,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
  Send,
  Building2,
  Sparkles,
  Gavel,
  RefreshCw,
} from 'lucide-react';

const WORKFLOW_STAGES = [
  { key: 'Pending', label: 'Intake / Pending', short: 'Intake', icon: Clock, color: 'amber' },
  { key: 'Active Investigation', label: 'Active Investigation', short: 'Investigation', icon: Shield, color: 'blue' },
  { key: 'Mediation', label: 'Lupon Mediation', short: 'Mediation', icon: Scale, color: 'purple' },
  { key: 'Amicably Settled', label: 'Amicably Settled', short: 'Settled', icon: CheckCircle2, color: 'emerald' },
];

export const BlotterView: React.FC = () => {
  const {
    blotters,
    addBlotter,
    updateBlotter,
    updateBlotterStatus,
    addBlotterLog,
    deleteBlotter,
    approveBlotterExtract,
    rejectBlotterExtract,
    settings,
    currentUser,
    targetRecordId,
    setTargetRecordId,
    arePuroksMatching,
  } = useBarangay();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPurok, setSelectedPurok] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingBlotter, setEditingBlotter] = useState<BlotterRecord | null>(null);
  const [deleteTargetBlotter, setDeleteTargetBlotter] = useState<BlotterRecord | null>(null);

  // Workflow & Activity Timeline Modals
  const [workflowTargetBlotter, setWorkflowTargetBlotter] = useState<BlotterRecord | null>(null);
  const [activityLogsBlotter, setActivityLogsBlotter] = useState<BlotterRecord | null>(null);
  const [printTargetBlotter, setPrintTargetBlotter] = useState<BlotterRecord | null>(null);

  // Workflow Transition Form
  const [transitionStatus, setTransitionStatus] = useState<BlotterStatus>('Active Investigation');
  const [transitionAction, setTransitionAction] = useState('');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [hearingStage, setHearingStage] = useState('1st Mediation');
  const [hearingDate, setHearingDate] = useState('');
  const [hearingTime, setHearingTime] = useState('02:00 PM');
  const [mediatorName, setMediatorName] = useState(settings.punongBarangay || 'Punong Barangay');
  const [settlementTerms, setSettlementTerms] = useState('');
  const [pnpStation, setPnpStation] = useState('Dipolog City Police Station (PNP)');
  const [pnpEndorsementNo, setPnpEndorsementNo] = useState('');

  // Quick Log Entry Form in Activity Modal
  const [newLogAction, setNewLogAction] = useState('Officer Investigation Note');
  const [newLogNotes, setNewLogNotes] = useState('');

  const initialForm: Omit<BlotterRecord, 'id'> = {
    blotterNo: `BLT-2026-${String(blotters.length + 1).padStart(4, '0')}`,
    incidentType: 'Noise / Neighborhood Disturbance',
    dateReported: new Date().toISOString().split('T')[0],
    timeReported: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '08:30 PM',
    incidentLocation: 'Near Barangay Basketball Court',
    purok: settings.puroks[0] || 'Purok Pinya',
    complainantName: '',
    complainantAddress: '',
    complainantContact: '',
    respondentName: '',
    respondentAddress: '',
    respondentContact: '',
    witnesses: '',
    narrative: '',
    actionTaken: 'Initial investigation conducted by Barangay Tanod on duty',
    assignedOfficer: 'Chief Tanod Roberto Flores',
    status: 'Pending',
    recordedBy: currentUser.name,
  };

  const [formData, setFormData] = useState(initialForm);

  // Normalized status resolver for workflow comparison
  const normalizeStatus = (status: string): string => {
    if (status === 'Forwarded to Lupon' || status === 'Mediation' || status === 'Ongoing Mediation') return 'Mediation';
    if (status === 'Amicably Settled' || status === 'Settled' || status === 'Amicably Settled (Kasunduan)') return 'Amicably Settled';
    if (status === 'Active Investigation' || status === 'Investigation') return 'Active Investigation';
    if (status === 'Referred to PNP' || status === 'PNP Escalated') return 'Referred to PNP';
    if (status === 'Dismissed' || status === 'Closed / Dismissed') return 'Dismissed';
    return 'Pending';
  };

  // Metrics computation
  const metrics = {
    total: blotters.length,
    pending: blotters.filter((b) => normalizeStatus(b.status) === 'Pending').length,
    investigation: blotters.filter((b) => normalizeStatus(b.status) === 'Active Investigation').length,
    mediation: blotters.filter((b) => normalizeStatus(b.status) === 'Mediation').length,
    settled: blotters.filter((b) => normalizeStatus(b.status) === 'Amicably Settled').length,
    pnp: blotters.filter((b) => normalizeStatus(b.status) === 'Referred to PNP').length,
    dismissed: blotters.filter((b) => normalizeStatus(b.status) === 'Dismissed').length,
  };

  const filteredBlotters = blotters.filter((b) => {
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      b.blotterNo.toLowerCase().includes(term) ||
      b.complainantName.toLowerCase().includes(term) ||
      b.respondentName.toLowerCase().includes(term) ||
      b.incidentType.toLowerCase().includes(term) ||
      b.narrative.toLowerCase().includes(term) ||
      (b.assignedOfficer && b.assignedOfficer.toLowerCase().includes(term)) ||
      (b.purok && b.purok.toLowerCase().includes(term)) ||
      arePuroksMatching(b.purok, term);

    const normalized = normalizeStatus(b.status);
    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'Pending' && normalized === 'Pending') ||
      (selectedStatus === 'Active Investigation' && normalized === 'Active Investigation') ||
      (selectedStatus === 'Mediation' && normalized === 'Mediation') ||
      (selectedStatus === 'Amicably Settled' && normalized === 'Amicably Settled') ||
      (selectedStatus === 'Referred to PNP' && normalized === 'Referred to PNP') ||
      (selectedStatus === 'Dismissed' && normalized === 'Dismissed') ||
      b.status === selectedStatus;

    const matchesPurok = arePuroksMatching(b.purok, selectedPurok);
    const matchesType = selectedType === 'All' || b.incidentType === selectedType;

    return matchesSearch && matchesStatus && matchesPurok && matchesType;
  });

  const handleOpenAdd = () => {
    setEditingBlotter(null);
    setFormData({
      ...initialForm,
      blotterNo: `BLT-2026-${String(blotters.length + 1).padStart(4, '0')}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BlotterRecord) => {
    setEditingBlotter(b);
    setFormData({
      blotterNo: b.blotterNo,
      incidentType: b.incidentType,
      dateReported: b.dateReported,
      timeReported: b.timeReported,
      incidentDate: b.incidentDate,
      incidentTime: b.incidentTime,
      incidentLocation: b.incidentLocation,
      purok: b.purok,
      complainantName: b.complainantName,
      complainantAddress: b.complainantAddress,
      complainantContact: b.complainantContact,
      respondentName: b.respondentName,
      respondentAddress: b.respondentAddress,
      respondentContact: b.respondentContact || '',
      witnesses: b.witnesses || '',
      narrative: b.narrative,
      actionTaken: b.actionTaken,
      assignedOfficer: b.assignedOfficer,
      status: b.status,
      resolutionDate: b.resolutionDate || '',
      resolutionNotes: b.resolutionNotes || '',
      recordedBy: b.recordedBy,
    });
    setIsModalOpen(true);
  };

  const handleOpenWorkflowTransition = (b: BlotterRecord, defaultNext?: BlotterStatus) => {
    setWorkflowTargetBlotter(b);
    const normalized = normalizeStatus(b.status);

    let nextStatus: BlotterStatus = defaultNext || 'Active Investigation';
    if (!defaultNext) {
      if (normalized === 'Pending') nextStatus = 'Active Investigation';
      else if (normalized === 'Active Investigation') nextStatus = 'Mediation';
      else if (normalized === 'Mediation') nextStatus = 'Amicably Settled';
      else nextStatus = 'Amicably Settled';
    }

    setTransitionStatus(nextStatus);
    setTransitionAction(`Workflow Advanced to "${nextStatus}"`);
    setTransitionNotes('');
    setHearingStage(b.hearingStage || '1st Mediation');
    setHearingDate(b.hearingDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
    setHearingTime(b.hearingTime || '02:00 PM');
    setMediatorName(b.mediator || settings.punongBarangay || 'Punong Barangay');
    setSettlementTerms(b.settlementTerms || '');
    setPnpStation(b.pnpStation || 'Dipolog City Police Station (PNP)');
    setPnpEndorsementNo(b.pnpEndorsementNo || `PNP-REF-2026-${Date.now().toString().slice(-4)}`);
  };

  const handleSaveWorkflowTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowTargetBlotter) return;

    updateBlotterStatus(workflowTargetBlotter.id, transitionStatus, {
      action: transitionAction || `Workflow Advanced to "${transitionStatus}"`,
      notes: transitionNotes || `Case transitioned from ${workflowTargetBlotter.status} to ${transitionStatus}.`,
      hearingStage: transitionStatus === 'Mediation' || transitionStatus === 'Forwarded to Lupon' ? hearingStage : undefined,
      hearingDate: transitionStatus === 'Mediation' || transitionStatus === 'Forwarded to Lupon' ? hearingDate : undefined,
      hearingTime: transitionStatus === 'Mediation' || transitionStatus === 'Forwarded to Lupon' ? hearingTime : undefined,
      mediator: transitionStatus === 'Mediation' || transitionStatus === 'Forwarded to Lupon' ? mediatorName : undefined,
      settlementTerms: transitionStatus === 'Amicably Settled' || transitionStatus === 'Settled' ? settlementTerms : undefined,
      pnpStation: transitionStatus === 'Referred to PNP' ? pnpStation : undefined,
      pnpEndorsementNo: transitionStatus === 'Referred to PNP' ? pnpEndorsementNo : undefined,
    });

    setWorkflowTargetBlotter(null);
  };

  const handleAddQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityLogsBlotter || !newLogNotes.trim()) return;

    addBlotterLog(activityLogsBlotter.id, {
      action: newLogAction || 'Investigation / Field Note Logged',
      notes: newLogNotes.trim(),
    });

    setNewLogNotes('');
    // Refresh modal pointer with updated record
    const updated = blotters.find((item) => item.id === activityLogsBlotter.id);
    if (updated) setActivityLogsBlotter(updated);
  };

  useEffect(() => {
    if (targetRecordId) {
      if (targetRecordId === 'new' || targetRecordId === 'new_blotter') {
        handleOpenAdd();
      } else {
        const b = blotters.find((item) => item.id === targetRecordId || item.blotterNo === targetRecordId);
        if (b) {
          setSearchQuery(b.blotterNo);
          handleOpenEdit(b);
        }
      }
      setTargetRecordId(null);
    }
  }, [targetRecordId, blotters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.complainantName || !formData.respondentName || !formData.narrative) {
      alert('Complainant, Respondent, and Incident Narrative are required.');
      return;
    }

    if (editingBlotter) {
      updateBlotter(editingBlotter.id, formData);
    } else {
      addBlotter(formData);
    }
    setIsModalOpen(false);
  };

  // Helper to render workflow stepper state
  const getStageStatus = (currentStatus: string, stageKey: string) => {
    const norm = normalizeStatus(currentStatus);
    const order = ['Pending', 'Active Investigation', 'Mediation', 'Amicably Settled'];
    const currentIndex = order.indexOf(norm);
    const stageIndex = order.indexOf(stageKey);

    if (norm === 'Referred to PNP' || norm === 'Dismissed') {
      if (stageIndex === 0) return 'completed';
      return 'diverted';
    }

    if (currentIndex === -1) return 'pending';
    if (currentIndex > stageIndex) return 'completed';
    if (currentIndex === stageIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
                <span>Barangay Blotter & Incident Records</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Interactive Workflow & Audit Trail
                </span>
                <InfoButton
                  title="Blotter & Incident Records"
                  info="Peace & order incident intake, Tanod investigation responses, Lupon mediation stages, and timestamped activity logging."
                  variant="light"
                />
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            title="Import blotter records from Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Import Excel / CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Incident Entry</span>
          </button>
        </div>
      </div>

      {/* Pending Resident Certified Extract Requests Banner */}
      {blotters.some((b) => b.extractRequested && b.extractStatus === 'Pending') && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-200 flex items-center gap-2">
                <span>Pending Resident Extract Requests</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                  {blotters.filter((b) => b.extractRequested && b.extractStatus === 'Pending').length} Pending
                </span>
              </h4>
              <p className="text-xs text-amber-300/80">
                Residents have submitted requests for Certified True Copy of Blotter Extracts via the Resident Portal.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {blotters
              .filter((b) => b.extractRequested && b.extractStatus === 'Pending')
              .slice(0, 3)
              .map((b) => (
                <div key={b.id} className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs">
                  <span className="font-mono font-bold text-amber-300">{b.blotterNo}</span>
                  <span className="text-slate-300 truncate max-w-[120px]">{b.complainantName}</span>
                  <button
                    onClick={() => {
                      approveBlotterExtract(b.id, 'Certified copy released upon resident request');
                      setPrintTargetBlotter(b);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Approve & Print</span>
                  </button>
                  <button
                    onClick={() => rejectBlotterExtract(b.id, 'Declined: Resident must present valid government ID')}
                    className="px-2 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Interactive Workflow Summary Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedStatus('All')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'All'
              ? 'bg-slate-800 border-indigo-500 shadow-lg ring-1 ring-indigo-500/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">All Cases</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1.5">{metrics.total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total registered blotters</p>
        </button>

        <button
          onClick={() => setSelectedStatus('Pending')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Pending'
              ? 'bg-amber-950/40 border-amber-500 shadow-lg ring-1 ring-amber-500/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">1. Intake / Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1.5">{metrics.pending}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Awaiting investigation</p>
        </button>

        <button
          onClick={() => setSelectedStatus('Active Investigation')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Active Investigation'
              ? 'bg-blue-950/40 border-blue-500 shadow-lg ring-1 ring-blue-500/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">2. Investigation</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-300 mt-1.5">{metrics.investigation}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Tanods deployed</p>
        </button>

        <button
          onClick={() => setSelectedStatus('Mediation')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Mediation'
              ? 'bg-purple-950/40 border-purple-500 shadow-lg ring-1 ring-purple-500/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">3. Lupon Mediation</span>
            <Scale className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-300 mt-1.5">{metrics.mediation}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Summons & hearings</p>
        </button>

        <button
          onClick={() => setSelectedStatus('Amicably Settled')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Amicably Settled'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-lg ring-1 ring-emerald-500/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">4. Amicably Settled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-1.5">{metrics.settled}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Kasunduan executed</p>
        </button>

        <button
          onClick={() => setSelectedStatus('Referred to PNP')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Referred to PNP'
              ? 'bg-rose-950/40 border-rose-500 shadow-lg ring-1 ring-rose-500/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Referred to PNP</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-300 mt-1.5">{metrics.pnp}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Escalated to police</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <RecentSearchesInput
            className="flex-1"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by blotter #, complainant, respondent, narrative, or investigator..."
            storageKey="blotter"
            theme="dark"
          />

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="w-full sm:w-44">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Statuses ({blotters.length})</option>
                <option value="Pending">⏳ 1. Intake / Pending ({metrics.pending})</option>
                <option value="Active Investigation">🔍 2. Active Investigation ({metrics.investigation})</option>
                <option value="Mediation">⚖️ 3. Lupon Mediation ({metrics.mediation})</option>
                <option value="Amicably Settled">✅ 4. Amicably Settled ({metrics.settled})</option>
                <option value="Referred to PNP">🚨 Referred to PNP ({metrics.pnp})</option>
                <option value="Dismissed">🚫 Dismissed ({metrics.dismissed})</option>
              </select>
            </div>

            <div className="w-full sm:w-40">
              <select
                value={selectedPurok}
                onChange={(e) => setSelectedPurok(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Puroks</option>
                {settings.puroks.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-48">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Incident Types</option>
                <option value="Noise / Neighborhood Disturbance">Noise / Disturbance</option>
                <option value="Physical Altercation / Brawl">Physical Altercation</option>
                <option value="Boundary / Land Dispute">Boundary / Land Dispute</option>
                <option value="Theft / Petty Crime">Theft / Petty Crime</option>
                <option value="Domestic Conflict">Domestic Conflict</option>
                <option value="Unpaid Debt / Financial Dispute">Financial Dispute</option>
                <option value="Verbal Harassment / Threat">Verbal Harassment</option>
                <option value="Property Damage">Property Damage</option>
                <option value="Animals / Pet Nuisance">Animals / Pet Nuisance</option>
                <option value="Curfew / Ordinance Violation">Ordinance Violation</option>
                <option value="Other">Other Incident</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick status tabs pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold mr-1 shrink-0">Filter by Stage:</span>
          {[
            { key: 'All', label: 'All Cases', count: metrics.total },
            { key: 'Pending', label: '1. Pending Intake', count: metrics.pending, color: 'text-amber-300' },
            { key: 'Active Investigation', label: '2. Investigation', count: metrics.investigation, color: 'text-blue-300' },
            { key: 'Mediation', label: '3. Mediation', count: metrics.mediation, color: 'text-purple-300' },
            { key: 'Amicably Settled', label: '4. Settled', count: metrics.settled, color: 'text-emerald-300' },
            { key: 'Referred to PNP', label: 'PNP Escalated', count: metrics.pnp, color: 'text-rose-300' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${selectedStatus === tab.key ? 'bg-indigo-900/80 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Blotter Registry Directory Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Blotter & Incident Case Records
            </span>
            <span className="text-xs text-slate-400 ml-2">({filteredBlotters.length} cases found)</span>
          </div>

          <ViewModeToggle
            viewMode={viewMode}
            onChange={setViewMode}
            theme="dark"
            accentColor="emerald"
            tableTitle="Table View (Blotter Ledger)"
            gridTitle="Grid View (Incident Workflow Cards)"
          />
        </div>

        {filteredBlotters.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <ShieldAlert className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
            <p className="text-sm font-semibold text-slate-400">No blotter cases found matching your filters</p>
            <p className="text-xs text-slate-500">Try adjusting your search criteria, stage filter, or purok.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Case # & Date</th>
                  <th className="px-4 py-3">Incident Type & Purok</th>
                  <th className="px-4 py-3">Complainant vs Respondent</th>
                  <th className="px-4 py-3">Current Stage / Status</th>
                  <th className="px-4 py-3">Officer</th>
                  <th className="px-4 py-3">Timeline Logs</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredBlotters.map((b) => {
                  const normStatus = normalizeStatus(b.status);
                  const logsCount = b.activityLogs?.length || 1;

                  return (
                    <tr key={b.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-amber-300 text-[11px] block">
                          {b.blotterNo}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {b.dateReported}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-white text-xs">{b.incidentType}</p>
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{b.purok}</span>
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-emerald-300 font-semibold">
                          <span className="text-[10px] text-slate-400">By: </span>{b.complainantName}
                        </p>
                        <p className="text-xs text-rose-300 font-semibold mt-0.5">
                          <span className="text-[10px] text-slate-400">Vs: </span>{b.respondentName}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider inline-block ${
                            normStatus === 'Amicably Settled'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : normStatus === 'Referred to PNP'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                              : normStatus === 'Mediation'
                              ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                              : normStatus === 'Active Investigation'
                              ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                              : 'bg-amber-950/80 text-amber-300 border-amber-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">
                        {b.assignedOfficer || 'Desk Officer'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setActivityLogsBlotter(b)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-bold rounded-lg border border-slate-700 cursor-pointer flex items-center gap-1 transition-all"
                        >
                          <History className="w-3 h-3 text-indigo-400" />
                          <span>{logsCount} log{logsCount === 1 ? '' : 's'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {normStatus === 'Pending' && (
                            <button
                              onClick={() => handleOpenWorkflowTransition(b, 'Active Investigation')}
                              className="px-2 py-1 bg-blue-900/80 hover:bg-blue-800 text-blue-200 rounded-lg text-xs font-bold border border-blue-700/80 cursor-pointer"
                              title="Advance to Investigation"
                            >
                              Investigate
                            </button>
                          )}
                          {normStatus === 'Active Investigation' && (
                            <button
                              onClick={() => handleOpenWorkflowTransition(b, 'Mediation')}
                              className="px-2 py-1 bg-purple-900/80 hover:bg-purple-800 text-purple-200 rounded-lg text-xs font-bold border border-purple-700/80 cursor-pointer"
                              title="Advance to Mediation"
                            >
                              Mediate
                            </button>
                          )}
                          {normStatus === 'Mediation' && (
                            <button
                              onClick={() => handleOpenWorkflowTransition(b, 'Amicably Settled')}
                              className="px-2 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 rounded-lg text-xs font-bold border border-emerald-700/80 cursor-pointer"
                              title="Execute Settlement"
                            >
                              Settle
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenWorkflowTransition(b, normStatus as BlotterStatus)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                            title="Workflow Stage Options"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            onClick={() => setPrintTargetBlotter(b)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                            title="Print Extract / Notice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                            title="Edit Blotter Entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {currentUser.role === 'Administrator' && (
                            <button
                              onClick={() => setDeleteTargetBlotter(b)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
                              title="Delete Blotter Entry"
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
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredBlotters.map((b) => {
          const normStatus = normalizeStatus(b.status);
          const logsCount = b.activityLogs?.length || 1;
          const latestLog = b.activityLogs?.[0];

          return (
            <div
              key={b.id}
              className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/80">
                        {b.blotterNo}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{b.purok}</span>
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-white mt-1.5">{b.incidentType}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Reported {b.dateReported} • {b.timeReported}</span>
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider block text-center ${
                        normStatus === 'Amicably Settled'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          : normStatus === 'Referred to PNP'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                          : normStatus === 'Mediation'
                          ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                          : normStatus === 'Active Investigation'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                          : 'bg-amber-950/80 text-amber-300 border-amber-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>

                {/* Interactive Workflow Progress Stepper Pipeline */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/90 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Workflow Progression</span>
                    <button
                      onClick={() => handleOpenWorkflowTransition(b)}
                      className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>Transition Status</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1 relative">
                    {WORKFLOW_STAGES.map((st, idx) => {
                      const state = getStageStatus(b.status, st.key);
                      const isLast = idx === WORKFLOW_STAGES.length - 1;

                      let bgClass = 'bg-slate-800 text-slate-500 border-slate-700';
                      let iconColor = 'text-slate-500';

                      if (state === 'completed') {
                        bgClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80';
                        iconColor = 'text-emerald-400';
                      } else if (state === 'current') {
                        bgClass = 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold';
                        iconColor = 'text-white';
                      }

                      return (
                        <div
                          key={st.key}
                          onClick={() => handleOpenWorkflowTransition(b, st.key as BlotterStatus)}
                          className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer hover:border-indigo-400 flex flex-col items-center justify-center ${bgClass}`}
                          title={`Click to set workflow to ${st.label}`}
                        >
                          <div className="flex items-center justify-center mb-0.5">
                            {state === 'completed' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <st.icon className={`w-3 h-3 ${iconColor}`} />
                            )}
                          </div>
                          <span className="text-[9px] font-bold leading-none truncate w-full">{st.short}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Special Branch Notice if PNP or Dismissed */}
                  {normStatus === 'Referred to PNP' && (
                    <div className="text-[11px] bg-rose-950/40 text-rose-300 px-2.5 py-1.5 rounded-lg border border-rose-900/60 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Escalated to <strong>{b.pnpStation || 'Dipolog City PNP'}</strong></span>
                      </span>
                      <span className="text-[10px] font-mono text-rose-400">{b.pnpEndorsementNo || 'Case Endorsed'}</span>
                    </div>
                  )}

                  {normStatus === 'Mediation' && b.hearingDate && (
                    <div className="text-[11px] bg-purple-950/40 text-purple-300 px-2.5 py-1.5 rounded-lg border border-purple-900/60 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span><strong>{b.hearingStage || '1st Mediation'}:</strong> {b.hearingDate} @ {b.hearingTime || '2:00 PM'}</span>
                      </span>
                      <span className="text-[10px] text-purple-300 truncate max-w-[140px]">{b.mediator}</span>
                    </div>
                  )}

                  {normStatus === 'Amicably Settled' && (
                    <div className="text-[11px] bg-emerald-950/40 text-emerald-300 px-2.5 py-1.5 rounded-lg border border-emerald-900/60 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Amicable Kasunduan on record ({b.resolutionDate || b.dateReported})</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Involved Parties Box */}
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Complainant:</span>
                    <p className="font-bold text-white mt-0.5">{b.complainantName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{b.complainantAddress}</p>
                    {b.complainantContact && (
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{b.complainantContact}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Respondent:</span>
                    <p className="font-bold text-white mt-0.5">{b.respondentName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{b.respondentAddress}</p>
                    {b.respondentContact && (
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{b.respondentContact}</p>
                    )}
                  </div>
                </div>

                {/* Incident Narrative */}
                <div className="text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Incident Facts:</span>
                  <p className="line-clamp-2 leading-relaxed text-slate-300">{b.narrative}</p>
                </div>

                {/* Latest Activity Log Preview */}
                {latestLog && (
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 flex items-start justify-between gap-2 text-xs">
                    <div className="flex items-start gap-2">
                      <History className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-[11px]">{latestLog.action}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({latestLog.timestamp})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          By <strong className="text-slate-300">{latestLog.performedBy}</strong>: {latestLog.notes}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActivityLogsBlotter(b)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-bold rounded-lg border border-slate-700 shrink-0 cursor-pointer"
                    >
                      {logsCount} {logsCount === 1 ? 'Log' : 'Logs'}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <div className="text-[10px] text-slate-400">
                  Officer: <strong className="text-slate-300">{b.assignedOfficer}</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Quick Advance Button */}
                  {normStatus === 'Pending' && (
                    <button
                      onClick={() => handleOpenWorkflowTransition(b, 'Active Investigation')}
                      className="px-2.5 py-1 bg-blue-900/80 hover:bg-blue-800 text-blue-200 rounded-lg text-xs font-bold border border-blue-700/80 flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                      title="Dispatch Tanod and start active investigation"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-300" />
                      <span>Investigate</span>
                    </button>
                  )}

                  {normStatus === 'Active Investigation' && (
                    <button
                      onClick={() => handleOpenWorkflowTransition(b, 'Mediation')}
                      className="px-2.5 py-1 bg-purple-900/80 hover:bg-purple-800 text-purple-200 rounded-lg text-xs font-bold border border-purple-700/80 flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                      title="Schedule Lupon Mediation Hearing"
                    >
                      <Scale className="w-3.5 h-3.5 text-purple-300" />
                      <span>Mediate</span>
                    </button>
                  )}

                  {normStatus === 'Mediation' && (
                    <button
                      onClick={() => handleOpenWorkflowTransition(b, 'Amicably Settled')}
                      className="px-2.5 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 rounded-lg text-xs font-bold border border-emerald-700/80 flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                      title="Sign Kasunduan & Amicable Settlement"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Settle Case</span>
                    </button>
                  )}

                  {/* Activity Logbook Button */}
                  <button
                    onClick={() => setActivityLogsBlotter(b)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs border border-slate-700 cursor-pointer"
                    title="View timestamped activity & investigation timeline"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>

                  {/* Print Blotter Extract */}
                  <button
                    onClick={() => setPrintTargetBlotter(b)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 cursor-pointer"
                    title="Print official Blotter Extract & Activity Timeline"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  {/* Update Blotter Record */}
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer"
                    title="Edit Blotter details"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edit</span>
                  </button>

                  {/* Delete Button */}
                  {currentUser.role === 'Administrator' && (
                    <button
                      onClick={() => setDeleteTargetBlotter(b)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
                      title="Delete Blotter Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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

      {/* -------------------- WORKFLOW STATUS TRANSITION MODAL -------------------- */}
      {workflowTargetBlotter && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Advance Blotter Workflow & Status
                  </h3>
                  <p className="text-xs text-slate-400">
                    Case {workflowTargetBlotter.blotterNo} • Current: <strong className="text-amber-300">{workflowTargetBlotter.status}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWorkflowTargetBlotter(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkflowTransition} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Status Selector Pills */}
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">
                  Select New Target Workflow Status *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { status: 'Pending', label: '1. Pending Intake', icon: Clock, color: 'border-amber-500 bg-amber-950/40 text-amber-300' },
                    { status: 'Active Investigation', label: '2. Investigation', icon: Shield, color: 'border-blue-500 bg-blue-950/40 text-blue-300' },
                    { status: 'Mediation', label: '3. Lupon Mediation', icon: Scale, color: 'border-purple-500 bg-purple-950/40 text-purple-300' },
                    { status: 'Amicably Settled', label: '4. Amicably Settled', icon: CheckCircle2, color: 'border-emerald-500 bg-emerald-950/40 text-emerald-300' },
                    { status: 'Referred to PNP', label: 'Referred to PNP', icon: AlertCircle, color: 'border-rose-500 bg-rose-950/40 text-rose-300' },
                    { status: 'Dismissed', label: 'Dismissed', icon: X, color: 'border-slate-500 bg-slate-800 text-slate-300' },
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.status}
                      onClick={() => {
                        setTransitionStatus(s.status as BlotterStatus);
                        setTransitionAction(`Workflow Advanced to "${s.status}"`);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        transitionStatus === s.status
                          ? `${s.color} ring-2 ring-indigo-500 font-bold shadow-md`
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <s.icon className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] leading-tight">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Context Fields based on destination */}
              {(transitionStatus === 'Mediation' || transitionStatus === 'Forwarded to Lupon') && (
                <div className="p-4 bg-purple-950/30 border border-purple-800/60 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold uppercase text-[11px]">
                    <Scale className="w-4 h-4" />
                    <span>Lupon Tagapamayapa Mediation Schedule</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Hearing Round / Stage</label>
                      <select
                        value={hearingStage}
                        onChange={(e) => setHearingStage(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="1st Mediation">1st Mediation Hearing</option>
                        <option value="2nd Mediation">2nd Mediation Hearing</option>
                        <option value="3rd Conciliation">3rd Conciliation Hearing</option>
                        <option value="Lupon Panel Conciliation">Lupon Panel Conciliation</option>
                        <option value="Arbitration Hearing">Arbitration Hearing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Assigned Mediator</label>
                      <input
                        type="text"
                        value={mediatorName}
                        onChange={(e) => setMediatorName(e.target.value)}
                        placeholder="e.g. Punong Barangay Rodrigo Sangkol"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Scheduled Date</label>
                      <input
                        type="date"
                        required
                        value={hearingDate}
                        onChange={(e) => setHearingDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Hearing Time</label>
                      <input
                        type="text"
                        value={hearingTime}
                        onChange={(e) => setHearingTime(e.target.value)}
                        placeholder="e.g. 02:00 PM"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(transitionStatus === 'Amicably Settled' || transitionStatus === 'Settled') && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold uppercase text-[11px]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Amicable Settlement (*Kasunduan*) Execution Terms</span>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Kasunduan Agreement / Undertaking Terms *</label>
                    <textarea
                      rows={3}
                      required
                      value={settlementTerms}
                      onChange={(e) => setSettlementTerms(e.target.value)}
                      placeholder="Specify mutual agreement details, compliance dates, restitution amounts, or behavioral undertakings signed by both parties..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              )}

              {transitionStatus === 'Referred to PNP' && (
                <div className="p-4 bg-rose-950/30 border border-rose-800/60 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold uppercase text-[11px]">
                    <AlertCircle className="w-4 h-4" />
                    <span>PNP Police Endorsement Transmittal Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Police Station / Unit</label>
                      <input
                        type="text"
                        required
                        value={pnpStation}
                        onChange={(e) => setPnpStation(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Endorsement / Docket No.</label>
                      <input
                        type="text"
                        required
                        value={pnpEndorsementNo}
                        onChange={(e) => setPnpEndorsementNo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Title and Timestamped Log Notes */}
              <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/80">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Action Title</label>
                  <input
                    type="text"
                    required
                    value={transitionAction}
                    onChange={(e) => setTransitionAction(e.target.value)}
                    placeholder="e.g. Summons Served to Respondent, Hearing Convened"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Activity Notes & Officer Remarks *</label>
                  <textarea
                    rows={3}
                    required
                    value={transitionNotes}
                    onChange={(e) => setTransitionNotes(e.target.value)}
                    placeholder="Document the exact circumstances, officer actions, responses from complainant/respondent, and basis for transition..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                  />
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-700">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Timestamp: <strong>{new Date().toLocaleString()}</strong></span>
                  </span>
                  <span>Recorded by: <strong className="text-white">{currentUser.name}</strong></span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setWorkflowTargetBlotter(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Update Status & Log Activity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- ACTIVITY TIMELINE & LOGBOOK MODAL -------------------- */}
      {activityLogsBlotter && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <History className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Incident Activity & Investigation Logbook</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono border border-slate-700">
                      {activityLogsBlotter.blotterNo}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activityLogsBlotter.incidentType} • {activityLogsBlotter.complainantName} vs {activityLogsBlotter.respondentName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivityLogsBlotter(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Quick Add Log Form */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Log New Activity / Investigation Note</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date().toLocaleString()}
                  </span>
                </div>

                <form onSubmit={handleAddQuickLog} className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <select
                        value={newLogAction}
                        onChange={(e) => setNewLogAction(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold"
                      >
                        <option value="Officer Investigation Note">Officer Investigation Note</option>
                        <option value="Summons Notice Served (KP Form 7)">Summons Notice Served (KP Form 7)</option>
                        <option value="Ocular / Site Inspection Conducted">Ocular / Site Inspection Conducted</option>
                        <option value="Witness Statement Recorded">Witness Statement Recorded</option>
                        <option value="Mediation Hearing Convened">Mediation Hearing Convened</option>
                        <option value="Telephone Follow-Up & Contact">Telephone Follow-Up & Contact</option>
                        <option value="Police Coordination & Assistance">Police Coordination & Assistance</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Log detail notes (e.g. Met respondent at residence...)"
                        value={newLogNotes}
                        onChange={(e) => setNewLogNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newLogNotes.trim()}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer transition-all"
                    >
                      <Send className="w-3 h-3" />
                      <span>Post Log Entry</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Activity Timeline List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Chronological Activity Trail ({activityLogsBlotter.activityLogs?.length || 1} entries)</span>
                  <span className="text-[10px] text-slate-500">Newest first</span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {(activityLogsBlotter.activityLogs || []).map((log, idx) => (
                    <div key={log.id || idx} className="relative group">
                      {/* Timeline node icon */}
                      <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-[9px] font-bold text-indigo-300">
                        {idx + 1}
                      </span>

                      <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2 hover:border-slate-600 transition-all shadow-sm">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{log.action}</span>
                              {log.toStatus && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                                  {log.fromStatus ? `${log.fromStatus} ➔ ${log.toStatus}` : log.toStatus}
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span className="font-mono">{log.timestamp}</span>
                            </p>
                          </div>

                          <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-slate-300 rounded-md border border-slate-700">
                            By <strong>{log.performedBy}</strong> {log.role ? `(${log.role})` : ''}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                          {log.notes}
                        </p>

                        {/* Extra metadata tags */}
                        {log.hearingDate && (
                          <div className="text-[11px] text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-md border border-purple-900/50 flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>Hearing Scheduled: <strong>{log.hearingStage || 'Mediation'}</strong> on <strong>{log.hearingDate} @ {log.hearingTime || '2:00 PM'}</strong> ({log.mediator || 'Punong Barangay'})</span>
                          </div>
                        )}

                        {log.settlementTerms && (
                          <div className="text-[11px] text-emerald-300 bg-emerald-950/40 px-2.5 py-1.5 rounded-md border border-emerald-900/50 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                              <strong>Settlement Terms:</strong> {log.settlementTerms}
                            </div>
                          </div>
                        )}

                        {log.endorsementNumber && (
                          <div className="text-[11px] text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-900/50 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Endorsement No: <strong>{log.endorsementNumber}</strong> to {log.pnpStation || 'Dipolog City Police'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                Official Tanod & Lupon Audit Log
              </span>
              <button
                type="button"
                onClick={() => setActivityLogsBlotter(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold"
              >
                Close Logbook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- PRINTABLE BLOTTER EXTRACT MODAL -------------------- */}
      {printTargetBlotter && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
            {/* Header / Print Actions */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2 text-slate-800">
                <Printer className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-bold">Official Barangay Blotter Extract & Activity Timeline</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setPrintTargetBlotter(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-900 font-serif">
              {/* Barangay Header */}
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-800">
                <p className="text-xs uppercase font-sans tracking-widest text-slate-600">Republic of the Philippines</p>
                <p className="text-xs uppercase font-sans font-semibold text-slate-700">{settings.province} • {settings.municipality}</p>
                <h2 className="text-xl font-bold font-sans tracking-tight text-slate-900">BARANGAY SANGKOL</h2>
                <p className="text-xs font-sans text-indigo-900 font-bold uppercase tracking-wider">OFFICE OF THE BARANGAY TANOD & LUPON TAGAPAMAYAPA</p>
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold font-sans tracking-widest uppercase text-slate-900 underline underline-offset-4">
                  CERTIFIED TRUE BLOTTER EXTRACT
                </h3>
                <p className="text-xs font-sans text-slate-600 mt-1 font-mono">
                  CASE DOCKET NO: <strong>{printTargetBlotter.blotterNo}</strong>
                </p>
              </div>

              {/* Case Details Table */}
              <div className="text-xs font-sans space-y-3">
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Complainant:</span>
                    <p className="font-bold text-sm text-slate-900">{printTargetBlotter.complainantName}</p>
                    <p className="text-slate-600">{printTargetBlotter.complainantAddress}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{printTargetBlotter.complainantContact}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Respondent:</span>
                    <p className="font-bold text-sm text-slate-900">{printTargetBlotter.respondentName}</p>
                    <p className="text-slate-600">{printTargetBlotter.respondentAddress}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{printTargetBlotter.respondentContact || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Incident Nature:</span>
                    <strong className="text-slate-900">{printTargetBlotter.incidentType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date & Time of Occurrence:</span>
                    <strong className="text-slate-900">{printTargetBlotter.incidentDate} at {printTargetBlotter.incidentTime}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Location / Purok:</span>
                    <strong className="text-slate-900">{printTargetBlotter.incidentLocation}, {printTargetBlotter.purok}</strong>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Official Incident Facts & Narrative:</span>
                  <p className="text-xs leading-relaxed text-slate-800 italic">"{printTargetBlotter.narrative}"</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Initial Tanod / Officer Action:</span>
                  <p className="text-xs text-slate-800">{printTargetBlotter.actionTaken}</p>
                </div>

                {/* Workflow Status & Settlement */}
                <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-indigo-900 uppercase font-bold">Current Workflow Status:</span>
                    <span className="px-2 py-0.5 bg-indigo-900 text-white rounded font-bold text-[10px] uppercase">
                      {printTargetBlotter.status}
                    </span>
                  </div>
                  {printTargetBlotter.settlementTerms && (
                    <p className="text-slate-800 pt-1">
                      <strong>Kasunduan Settlement Terms:</strong> {printTargetBlotter.settlementTerms}
                    </p>
                  )}
                </div>

                {/* Chronological Activity Logbook Table */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] text-slate-700 uppercase font-bold block">
                    Official Activity Trail & Timestamped Logbook
                  </span>
                  <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300">
                        <th className="p-1.5 border-r border-slate-300">Timestamp</th>
                        <th className="p-1.5 border-r border-slate-300">Action / Transition</th>
                        <th className="p-1.5 border-r border-slate-300">Recorded By</th>
                        <th className="p-1.5">Action Notes & Resolution Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(printTargetBlotter.activityLogs || []).map((l, i) => (
                        <tr key={l.id || i} className="border-b border-slate-200">
                          <td className="p-1.5 border-r border-slate-200 font-mono whitespace-nowrap">{l.timestamp}</td>
                          <td className="p-1.5 border-r border-slate-200 font-bold">{l.action}</td>
                          <td className="p-1.5 border-r border-slate-200 whitespace-nowrap">{l.performedBy}</td>
                          <td className="p-1.5 text-slate-700">{l.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-10 text-center font-sans text-xs">
                <div>
                  <p className="border-b border-slate-400 pb-1 font-bold text-slate-900">{printTargetBlotter.assignedOfficer}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">Assigned Tanod / Investigator</p>
                </div>
                <div>
                  <p className="border-b border-slate-400 pb-1 font-bold text-slate-900">{settings.barangaySecretary}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">Barangay Secretary</p>
                </div>
                <div>
                  <p className="border-b border-slate-400 pb-1 font-bold text-slate-900">{settings.punongBarangay}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">Punong Barangay / Lupon Head</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- ADD / EDIT BLOTTER ENTRY MODAL -------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>{editingBlotter ? 'Update Blotter Entry' : 'Record Official Blotter Entry'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Blotter No.</label>
                  <input
                    type="text"
                    required
                    value={formData.blotterNo}
                    onChange={(e) => setFormData({ ...formData, blotterNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Incident Type / Nature *</label>
                  <select
                    value={formData.incidentType}
                    onChange={(e) => setFormData({ ...formData, incidentType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="Noise / Neighborhood Disturbance">Noise / Neighborhood Disturbance</option>
                    <option value="Physical Altercation / Brawl">Physical Altercation / Brawl</option>
                    <option value="Boundary / Land Dispute">Boundary / Land Dispute</option>
                    <option value="Theft / Petty Crime">Theft / Petty Crime</option>
                    <option value="Domestic Conflict">Domestic Conflict</option>
                    <option value="Unpaid Debt / Financial Dispute">Unpaid Debt / Financial Dispute</option>
                    <option value="Verbal Harassment / Threat">Verbal Harassment / Threat</option>
                    <option value="Property Damage">Property Damage</option>
                    <option value="Curfew / Ordinance Violation">Curfew / Ordinance Violation</option>
                    <option value="Animals / Pet Nuisance">Animals / Pet Nuisance</option>
                    <option value="Other">Other Incident</option>
                  </select>
                </div>
              </div>

              {/* Complainant & Respondent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700">
                <div className="space-y-2">
                  <label className="block text-xs text-emerald-400 font-bold uppercase">Complainant Details *</label>
                  <input
                    type="text"
                    required
                    placeholder="Complainant Full Name"
                    value={formData.complainantName}
                    onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Address / Purok"
                    value={formData.complainantAddress}
                    onChange={(e) => setFormData({ ...formData, complainantAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Contact Number (e.g. 0917-000-0000)"
                    value={formData.complainantContact}
                    onChange={(e) => setFormData({ ...formData, complainantContact: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-rose-400 font-bold uppercase">Respondent Details *</label>
                  <input
                    type="text"
                    required
                    placeholder="Respondent Full Name"
                    value={formData.respondentName}
                    onChange={(e) => setFormData({ ...formData, respondentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Address / Purok"
                    value={formData.respondentAddress}
                    onChange={(e) => setFormData({ ...formData, respondentAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Contact Number (Optional)"
                    value={formData.respondentContact}
                    onChange={(e) => setFormData({ ...formData, respondentContact: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Incident Date & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Incident Date</label>
                  <input
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Incident Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:30 PM"
                    value={formData.incidentTime}
                    onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Purok</label>
                  <select
                    value={formData.purok}
                    onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    {settings.puroks.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Exact Incident Location / Landmark</label>
                <input
                  type="text"
                  value={formData.incidentLocation}
                  onChange={(e) => setFormData({ ...formData, incidentLocation: e.target.value })}
                  placeholder="e.g. Near Barangay Basketball Court, Purok Pinya"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Witnesses (Optional)</label>
                <input
                  type="text"
                  value={formData.witnesses}
                  onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                  placeholder="Names of witnesses, Tanods on patrol, or bystanders"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Incident Facts & Narrative *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.narrative}
                  onChange={(e) => setFormData({ ...formData, narrative: e.target.value })}
                  placeholder="State the facts and circumstances of the incident..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Initial Action Taken</label>
                  <input
                    type="text"
                    value={formData.actionTaken}
                    onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                    placeholder="e.g. Dispatched Tanod patrol to scene"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Assigned Tanod / Investigator</label>
                  <input
                    type="text"
                    value={formData.assignedOfficer}
                    onChange={(e) => setFormData({ ...formData, assignedOfficer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Blotter Workflow Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-semibold"
                >
                  <option value="Pending">1. Intake / Pending</option>
                  <option value="Active Investigation">2. Active Investigation</option>
                  <option value="Mediation">3. Lupon Mediation</option>
                  <option value="Amicably Settled">4. Amicably Settled (Kasunduan)</option>
                  <option value="Referred to PNP">Referred to PNP</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Blotter Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetBlotter}
        title="Delete Blotter Entry"
        itemType="Blotter Record"
        itemName={deleteTargetBlotter ? `${deleteTargetBlotter.blotterNo} - ${deleteTargetBlotter.incidentType} (${deleteTargetBlotter.complainantName} vs ${deleteTargetBlotter.respondentName})` : undefined}
        description="Permanently delete this incident blotter entry and its activity timeline from the official security records."
        confirmText="Yes, Delete Blotter"
        onConfirm={() => {
          if (deleteTargetBlotter) {
            deleteBlotter(deleteTargetBlotter.id);
          }
        }}
        onClose={() => setDeleteTargetBlotter(null)}
      />

      {/* Excel / CSV Data Importer */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialEntity="blotter"
      />
    </div>
  );
};

export default BlotterView;
