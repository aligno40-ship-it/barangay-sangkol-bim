import React, { useState, useEffect } from 'react';
import { useBarangay, areNamesMatching } from '../context/BarangayContext';
import { CitizenConcern, CitizenConcernStatus } from '../types';
import {
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Send,
  UserCheck,
  Calendar,
  Scale,
  ShieldAlert,
  Printer,
  Eye,
  History,
  Tag,
  Building2,
  FileCheck2,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

interface ConcernActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  concern: CitizenConcern | null;
  onEscalateToLupon?: (concern: CitizenConcern) => void;
  onEscalateToBlotter?: (concern: CitizenConcern) => void;
  onPrintSlip?: (concern: CitizenConcern) => void;
}

export const ConcernActionModal: React.FC<ConcernActionModalProps> = ({
  isOpen,
  onClose,
  concern,
  onEscalateToLupon,
  onEscalateToBlotter,
  onPrintSlip,
}) => {
  const { officials, currentUser, settings, takeConcernAction, markConcernAsRead } = useBarangay();

  const [status, setStatus] = useState<CitizenConcernStatus>('In Review');
  const [priority, setPriority] = useState<'Normal' | 'Urgent' | 'High' | 'Emergency'>('Normal');
  const [assignedTo, setAssignedTo] = useState('');
  const [customAssigned, setCustomAssigned] = useState('');
  const [targetResolutionDate, setTargetResolutionDate] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'action' | 'history' | 'resident_details'>('action');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && concern) {
      // Mark as read automatically when admin opens the ticket
      if (!concern.isRead) {
        markConcernAsRead(concern.id, currentUser.name);
      }

      setStatus(concern.status || 'In Review');
      setPriority(concern.priority || 'Normal');
      setAssignedTo(concern.assignedTo || '');
      setTargetResolutionDate(concern.targetResolutionDate || '');
      setActionNotes(concern.actionNotes || '');
      setFeedbackNotes(
        concern.feedbackNotes ||
          'Your concern is being processed by the Barangay Council and responding unit. We will provide updates on actions taken.'
      );
      setSaveSuccess(false);
    }
  }, [isOpen, concern]);

  if (!isOpen || !concern) return null;

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveAssignee = assignedTo === 'Other' ? customAssigned : assignedTo;

    takeConcernAction(concern.id, {
      status,
      priority,
      assignedTo: effectiveAssignee || 'Barangay Administrative Unit',
      actionNotes: actionNotes.trim(),
      feedbackNotes: feedbackNotes.trim(),
      targetResolutionDate,
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Action Taken':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'In Review':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Endorsed to Lupon':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Dismissed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-rose-50 text-rose-800 border-rose-200';
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
        return 'bg-slate-100 text-slate-700 font-semibold';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-300">{concern.id}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getStatusBadge(status)}`}>
                  {status}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityBadge(priority)}`}>
                  {priority} Priority
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 truncate max-w-md">{concern.subject}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read Receipt Bar */}
        <div className="px-6 py-2.5 bg-emerald-50/80 border-b border-emerald-100 flex flex-wrap items-center justify-between text-xs text-emerald-900">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Verified Read:</strong> Concern opened and logged by {concern.readBy || currentUser.name} on{' '}
              {concern.readAt || new Date().toLocaleString()}
            </span>
          </span>
          <span className="text-[11px] text-emerald-700">Resident Portal Live Sync Active</span>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('action')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'action'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Barangay Action & Resolution</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resident_details')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'resident_details'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Concern Details & Complainant</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit History ({concern.actionHistory?.length || 1})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {saveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 flex items-center gap-3 text-xs font-bold animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Official Barangay Action successfully logged and updated! Live status synced to Resident Portal.</span>
            </div>
          )}

          {activeTab === 'action' && (
            <form onSubmit={handleSaveAction} className="space-y-4">
              {/* Concern Overview Summary Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500">
                  <span className="font-semibold text-slate-800">
                    Complainant: <strong>{concern.residentName}</strong> ({concern.purok})
                  </span>
                  <span>Submitted: {concern.dateSubmitted}</span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">{concern.description || concern.details}</p>
                {concern.locationDetails && (
                  <p className="text-[11px] text-slate-500">
                    📍 <strong>Location:</strong> {concern.locationDetails}
                  </p>
                )}
              </div>

              {/* Action Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Update Resolution Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CitizenConcernStatus)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Received">Received (Awaiting Action)</option>
                    <option value="In Review">In Review (Assigned / Investigating)</option>
                    <option value="Action Taken">Action Taken (In Progress / Dispatched)</option>
                    <option value="Resolved">Resolved (Addressed & Completed)</option>
                    <option value="Endorsed to Lupon">Endorsed to Lupon Mediation</option>
                    <option value="Dismissed">Dismissed / Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Normal">Normal Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Priority</option>
                    <option value="Emergency">Emergency Response</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assigned Responding Official / Committee *
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Official / Unit --</option>
                    <option value={`${settings.punongBarangay} (Punong Barangay)`}>
                      {settings.punongBarangay} (Punong Barangay)
                    </option>
                    <option value={`${settings.barangaySecretary} (Barangay Secretary)`}>
                      {settings.barangaySecretary} (Barangay Secretary & Civil Registry)
                    </option>
                    {officials
                      .filter(
                        (off) =>
                          !areNamesMatching(off.name, settings.punongBarangay) &&
                          !areNamesMatching(off.name, settings.barangaySecretary)
                      )
                      .map((off) => (
                        <option key={off.id} value={`${off.name} (${off.position})`}>
                          {off.name} ({off.position})
                        </option>
                      ))}
                    <option value="Barangay Police Safety Officers (BPSO & Night Patrol)">
                      Barangay Police Safety Officers (BPSO & Night Patrol)
                    </option>
                    <option value="Barangay Health Workers (BHW & Health Station)">
                      Barangay Health Workers (BHW & Health Station)
                    </option>
                    <option value="Other">Other Custom Unit / Team</option>
                  </select>
                  {assignedTo === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify custom responding team..."
                      value={customAssigned}
                      onChange={(e) => setCustomAssigned(e.target.value)}
                      className="mt-2 w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Inspection / Resolution Date
                  </label>
                  <input
                    type="date"
                    value={targetResolutionDate}
                    onChange={(e) => setTargetResolutionDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Internal Barangay Action Log & Operations Notes
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Record internal findings, dispatched patrol vehicles, material requisitions, or electrician scheduling..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Official Citizen Feedback (Visible in Resident Portal)</span>
                  <span className="text-[10px] text-indigo-600 font-normal">Displayed live to {concern.residentName}</span>
                </label>
                <textarea
                  rows={3}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Official advisory sent directly to resident citizen portal tracking view..."
                  className="w-full px-3.5 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {onEscalateToLupon && (
                    <button
                      type="button"
                      onClick={() => onEscalateToLupon(concern)}
                      className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Docket as Lupon Dispute</span>
                    </button>
                  )}

                  {onEscalateToBlotter && (
                    <button
                      type="button"
                      onClick={() => onEscalateToBlotter(concern)}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Log into Blotter</span>
                    </button>
                  )}

                  {onPrintSlip && (
                    <button
                      type="button"
                      onClick={() => onPrintSlip(concern)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Work Slip</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save & Dispatch Action</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'resident_details' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-indigo-700">
                    Complainant Information
                  </h4>
                  <p>
                    Full Name: <strong>{concern.residentName}</strong>
                  </p>
                  <p>
                    Purok / Sector: <strong>{concern.purok}</strong>
                  </p>
                  <p>
                    Contact Mobile: <strong>{concern.contactNumber || 'N/A'}</strong>
                  </p>
                  {concern.email && (
                    <p>
                      Email Address: <strong>{concern.email}</strong>
                    </p>
                  )}
                  {concern.residentId && (
                    <p>
                      Civil Registry ID: <strong className="font-mono">{concern.residentId}</strong>
                    </p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-indigo-700">
                    Grievance Metadata
                  </h4>
                  <p>
                    Ticket Ref: <strong className="font-mono">{concern.id}</strong>
                  </p>
                  <p>
                    Category: <strong>{concern.category}</strong>
                  </p>
                  <p>
                    Date Submitted: <strong>{concern.dateSubmitted}</strong>
                  </p>
                  <p>
                    Location in Purok: <strong>{concern.locationDetails || `${concern.purok} vicinity`}</strong>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                  Full Grievance Statement / Description
                </h4>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {concern.description || concern.details}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Timestamped Resolution & Action Trail
              </h4>

              <div className="relative pl-6 space-y-4 border-l-2 border-indigo-200">
                {(concern.actionHistory || []).map((entry, idx) => (
                  <div key={idx} className="relative space-y-1 text-xs">
                    <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{entry.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{entry.timestamp}</span>
                    </div>
                    <p className="text-slate-600">{entry.notes}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>By: {entry.actor}</span>
                      {entry.statusAfter && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {entry.statusAfter}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
