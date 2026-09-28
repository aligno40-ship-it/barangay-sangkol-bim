import React, { useState, useEffect } from 'react';
import { BarangayFileRecord, FileCategory, FileAccessLevel, FileStatus } from '../../types';
import { X, Edit3, Save, Shield, Tag, FileText, Lock } from 'lucide-react';

interface FileEditModalProps {
  file: BarangayFileRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<BarangayFileRecord>) => void;
}

export const FileEditModal: React.FC<FileEditModalProps> = ({
  file,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [fileCategory, setFileCategory] = useState<FileCategory>('Forms & Templates');
  const [accessLevel, setAccessLevel] = useState<FileAccessLevel>('Public (All Citizens)');
  const [status, setStatus] = useState<FileStatus>('Active / Verified');
  const [isConfidential, setIsConfidential] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [retentionPeriod, setRetentionPeriod] = useState('5 Years');
  const [version, setVersion] = useState('v1.0');
  const [linkedEntityType, setLinkedEntityType] = useState<string>('General');
  const [linkedEntityId, setLinkedEntityId] = useState<string>('');

  useEffect(() => {
    if (file) {
      setTitle(file.fileTitle || file.title || '');
      setFileCategory(file.fileCategory);
      setAccessLevel(file.accessLevel);
      setStatus(file.status);
      setIsConfidential(file.isConfidential ?? false);
      setTagsInput(file.tags ? file.tags.join(', ') : '');
      setDescription(file.description || '');
      setNotes(file.notes || '');
      setRetentionPeriod(file.retentionPeriod || file.retentionExpiry || '5 Years');
      setVersion(file.version || 'v1.0');
      setLinkedEntityType(file.linkedEntityType || 'General');
      setLinkedEntityId(file.linkedEntityId || '');
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a valid title for this file.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave(file.id, {
      fileTitle: title.trim(),
      title: title.trim(),
      fileCategory,
      accessLevel,
      status,
      isConfidential,
      tags,
      description: description.trim(),
      notes: notes.trim() || undefined,
      retentionPeriod,
      retentionExpiry: retentionPeriod,
      version,
      linkedEntityType: linkedEntityType === 'General' ? undefined : (linkedEntityType as any),
      linkedEntityId: linkedEntityId.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400">{file.id}</span>
                <span className="text-[10px] text-slate-400">({file.fileName})</span>
              </div>
              <h3 className="text-base font-bold text-white leading-none mt-0.5">Edit File Attributes & Metadata</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              File Title <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">File Category</label>
              <select
                value={fileCategory}
                onChange={(e) => setFileCategory(e.target.value as FileCategory)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Infrastructure & Maps">Infrastructure & Maps</option>
                <option value="Financial & Vouchers">Financial & Vouchers</option>
                <option value="Legal & Ordinances">Legal & Ordinances</option>
                <option value="Resident KYC & IDs">Resident KYC & IDs</option>
                <option value="Forms & Templates">Forms & Templates</option>
                <option value="Health & Medical">Health & Medical</option>
                <option value="Blotter & Evidence">Blotter & Evidence</option>
                <option value="Administrative & Minutes">Administrative & Minutes</option>
                <option value="Public Advisories & Media">Public Advisories & Media</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Access Level Permission</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as FileAccessLevel)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Public (All Citizens)">Public (All Citizens)</option>
                <option value="Verified Residents Only">Verified Residents Only</option>
                <option value="Barangay Staff Only">Barangay Staff Only</option>
                <option value="Administrator & Council Only">Administrator & Council Only</option>
                <option value="Confidential / Restricted">Confidential / Restricted</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Data Retention</label>
              <select
                value={retentionPeriod}
                onChange={(e) => setRetentionPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="Permanent (Permanent Record)">Permanent (Permanent Record)</option>
                <option value="10 Years (Audited Records)">10 Years (Audited Records)</option>
                <option value="5 Years">5 Years</option>
                <option value="3 Years">3 Years</option>
                <option value="1 Year">1 Year</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FileStatus)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="Active / Verified">Active / Verified</option>
                <option value="Under Review">Under Review</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Linked System Entity</label>
              <select
                value={linkedEntityType}
                onChange={(e) => setLinkedEntityType(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
              >
                <option value="General">General (Unlinked)</option>
                <option value="Resident">Resident Record</option>
                <option value="Certificate">Barangay Certificate</option>
                <option value="Blotter">Blotter Incident</option>
                <option value="Treasury">Treasury / Voucher</option>
                <option value="Ordinance">Ordinance / Resolution</option>
                <option value="Project">Barangay Project</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Linked Record ID</label>
              <input
                type="text"
                value={linkedEntityId}
                onChange={(e) => setLinkedEntityId(e.target.value)}
                placeholder="e.g., BS-RES-2026-0001"
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
            <input
              type="checkbox"
              id="editConfidentialCheck"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 bg-slate-800 border-slate-700 focus:ring-rose-500 cursor-pointer"
            />
            <label htmlFor="editConfidentialCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
              Mark as <strong>Confidential / Sensitive Digital Asset</strong>
            </label>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Description & Scope</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Administrative Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-700/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
