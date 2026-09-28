import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Flame,
  Truck,
} from 'lucide-react';
import { IllegalDumpingReport } from '../../types/residentServices';

interface IllegalDumpingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: IllegalDumpingReport;
  onUpdateStatus: (
    id: string,
    status: IllegalDumpingReport['status'],
    assignedTanodOrCrew?: string,
    resolutionRemarks?: string
  ) => void;
}

export const IllegalDumpingDetailModal: React.FC<IllegalDumpingDetailModalProps> = ({
  isOpen,
  onClose,
  report,
  onUpdateStatus,
}) => {
  const [status, setStatus] = useState<IllegalDumpingReport['status']>(report.status);
  const [assignedTanodOrCrew, setAssignedTanodOrCrew] = useState(
    report.assignedTanodOrCrew || 'Tanod Quick Response Team (Purok Lead)'
  );
  const [resolutionRemarks, setResolutionRemarks] = useState(
    report.resolutionRemarks || ''
  );

  useEffect(() => {
    setStatus(report.status);
    setAssignedTanodOrCrew(
      report.assignedTanodOrCrew || 'Tanod Quick Response Team (Purok Lead)'
    );
    setResolutionRemarks(report.resolutionRemarks || '');
  }, [report, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(report.id, status, assignedTanodOrCrew, resolutionRemarks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Sumbong Basura Incident Triage
              </h3>
              <p className="text-xs text-slate-500">Case ID: {report.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Incident Summary Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-black text-sm text-slate-900 dark:text-white">
              {report.violationType}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                report.severityLevel === 'High / Blocking Waterway'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : report.severityLevel === 'Medium / Public Nuisance'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-blue-100 text-blue-900'
              }`}
            >
              {report.severityLevel}
            </span>
          </div>

          <p className="text-slate-700 dark:text-slate-300 font-medium">
            <strong>Narrative:</strong> {report.description}
          </p>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>
              {report.exactLocationOrLandmark} ({report.purok})
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-slate-500">
            <span>
              Reporter: <strong>{report.residentName}</strong> ({report.contactNumber})
            </span>
            <span>Reported: {report.reportedAt}</span>
          </div>

          {report.photoUrl && (
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Attached Photographic Evidence:</span>
              <img
                src={report.photoUrl}
                alt="Illegal dumping evidence"
                className="mt-1 h-36 w-full object-cover rounded-xl border border-slate-200"
              />
            </div>
          )}
        </div>

        {/* Investigation & Resolution Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status Action *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
            >
              <option value="Report Received">Report Received (Under Review)</option>
              <option value="Tanod Dispatched">Tanod Dispatched (On-Site Verification)</option>
              <option value="Cleaned & Cleared">Cleaned & Cleared (Garbage Hauled)</option>
              <option value="Notice Issued / Resolved">Notice Issued / Resolved (RA 9003 Citation Given)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Tanod / Sanitation Unit</label>
            <input
              type="text"
              value={assignedTanodOrCrew}
              onChange={(e) => setAssignedTanodOrCrew(e.target.value)}
              placeholder="e.g. Tanod Team 1 / Kgd. Manalo / Clean-Up Crew"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Resolution Findings & Officer Notes</label>
            <textarea
              rows={2}
              value={resolutionRemarks}
              onChange={(e) => setResolutionRemarks(e.target.value)}
              placeholder="e.g. Tanods arrived on scene; violator instructed to extinguish siga and given 1st verbal warning under RA 9003..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl cursor-pointer shadow-md"
            >
              Update Incident Triage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
