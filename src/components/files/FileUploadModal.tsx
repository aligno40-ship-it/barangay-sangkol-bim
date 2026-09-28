import React, { useState, useRef } from 'react';
import { BarangayFileRecord, FileCategory, FileAccessLevel, FileStatus } from '../../types';
import {
  X,
  UploadCloud,
  FileText,
  Shield,
  Tag,
  FileCheck,
  HardDrive,
  Info,
  Lock,
  Layers,
  AlertCircle,
} from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (
    fileData: Omit<BarangayFileRecord, 'id' | 'dateUploaded' | 'downloadCount' | 'fileHash'> & {
      customHash?: string;
      customId?: string;
    }
  ) => void;
  currentUser: {
    id: string;
    name: string;
    role: string;
    residentId?: string;
  };
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  currentUser,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [fileCategory, setFileCategory] = useState<FileCategory>('Forms & Templates');
  const [accessLevel, setAccessLevel] = useState<FileAccessLevel>(
    currentUser.role === 'Resident' ? 'Verified Residents Only' : 'Public (All Citizens)'
  );
  const [status, setStatus] = useState<FileStatus>('Active / Verified');
  const [isConfidential, setIsConfidential] = useState(false);
  const [linkedEntityType, setLinkedEntityType] = useState<string>('General');
  const [linkedEntityId, setLinkedEntityId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('Sangkol, Official');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [retentionPeriod, setRetentionPeriod] = useState('5 Years');
  const [version, setVersion] = useState('v1.0');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    if (!title) {
      // Auto fill title based on file name without extension
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please specify a title for this file record.');
      return;
    }

    const fileName = selectedFile
      ? selectedFile.name
      : `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`;

    const fileSizeBytes = selectedFile ? selectedFile.size : 256 * 1024;
    const fileSizeFormatted = formatFileSize(fileSizeBytes);

    const extMatch = fileName.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
    const fileType = extMatch ? extMatch[1].toUpperCase() : 'PDF';

    let mimeType = selectedFile ? selectedFile.type : 'application/pdf';
    if (!mimeType) {
      if (fileType === 'PDF') mimeType = 'application/pdf';
      else if (['JPG', 'JPEG'].includes(fileType)) mimeType = 'image/jpeg';
      else if (fileType === 'PNG') mimeType = 'image/png';
      else if (['XLSX', 'XLS'].includes(fileType)) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (['DOCX', 'DOC'].includes(fileType)) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else mimeType = 'application/octet-stream';
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Generate SHA-256 string
    const simulatedHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    onUpload({
      fileName,
      fileTitle: title.trim(),
      title: title.trim(),
      fileCategory,
      fileType,
      mimeType,
      fileSize: fileSizeBytes,
      fileSizeBytes,
      fileSizeFormatted,
      storagePath: `/storage/vault/${fileCategory.toLowerCase().replace(/[^a-z0-9]/g, '_')}/${fileName}`,
      filePath: `/storage/vault/${fileCategory.toLowerCase().replace(/[^a-z0-9]/g, '_')}/${fileName}`,
      uploaderId: currentUser.residentId || currentUser.id,
      uploaderName: currentUser.name,
      uploaderRole: currentUser.role,
      accessLevel,
      status,
      isConfidential,
      linkedEntityType: linkedEntityType === 'General' ? undefined : (linkedEntityType as any),
      linkedEntityId: linkedEntityId.trim() || undefined,
      tags,
      description: description.trim() || `${fileCategory} digital record registered for Barangay Sangkol repository.`,
      notes: notes.trim() || undefined,
      retentionExpiry: retentionPeriod,
      retentionPeriod,
      version,
      customHash: simulatedHash,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-none">Upload & Register Digital Asset</h3>
              <p className="text-xs text-slate-400 mt-1">
                Store file with SHA-256 cryptographic verification and attribute cataloging
              </p>
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
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-950/30'
                : selectedFile
                ? 'border-emerald-600/50 bg-emerald-950/10'
                : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <UploadCloud className="w-6 h-6" />
              </div>
              {selectedFile ? (
                <div className="space-y-0.5">
                  <p className="font-bold text-sm text-emerald-400">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Custom Format'}
                  </p>
                  <span className="inline-block text-[10px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800 mt-1">
                    Click or drop another file to replace
                  </span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="font-bold text-white text-xs">
                    Drop your document, scan, spreadsheet, or photo here
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports PDF, DOCX, XLSX, JPG, PNG, CSV, ZIP (Max 100MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title & Category */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                File Record Title <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Barangay Sangkol Flood Hazard & Risk Assessment Map 2026"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <label className="block text-slate-300 font-bold mb-1">Access Permission Level</label>
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
                  placeholder="v1.0"
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

            {/* Linked Entity Reference */}
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
                  placeholder="e.g., BS-RES-2026-0001 or ORD-2026-004"
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Confidentiality Toggle */}
            <div className="flex items-center gap-2 p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
              <input
                type="checkbox"
                id="confidentialCheck"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 bg-slate-800 border-slate-700 focus:ring-rose-500 cursor-pointer"
              />
              <label htmlFor="confidentialCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                Mark as <strong>Confidential / Sensitive Digital Asset</strong> (Restricts public directory indexing)
              </label>
            </div>

            {/* Tags & Description */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g., Hazard, DRRM, Purok Pinya, Flood Map"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Description & Scope</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of what this file contains, legal authority, or usage directives..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Internal Administrative Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal audit notes, cabinet reference numbers, etc."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Register & Save to File DB</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
