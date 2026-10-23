import React, { useState } from 'react';
import { BarangayFileRecord } from '../../types';
import {
  X,
  FileText,
  Shield,
  ShieldCheck,
  Lock,
  Download,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  User,
  HardDrive,
  Tag,
  Hash,
  Info,
  Layers,
  FileCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface FileAttributesModalProps {
  file: BarangayFileRecord | null;
  onClose: () => void;
  onVerifyChecksum: (id: string) => { isValid: boolean; hash: string; checkedAt: string; message: string };
  onDownload: (file: BarangayFileRecord) => void;
  onEdit?: (file: BarangayFileRecord) => void;
}

export const FileAttributesModal: React.FC<FileAttributesModalProps> = ({
  file,
  onClose,
  onVerifyChecksum,
  onDownload,
  onEdit,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    hash: string;
    checkedAt: string;
    message: string;
  } | null>(null);

  if (!file) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(file.fileHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleRunVerification = () => {
    const res = onVerifyChecksum(file.id);
    setVerificationResult(res);
  };

  const getFormatBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'xlsx':
      case 'xls':
      case 'csv':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'docx':
      case 'doc':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'zip':
      case 'rar':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
    }
  };

  const getAccessBadge = (level: string) => {
    switch (level) {
      case 'Public (All Citizens)':
        return { label: 'Public Access', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'Verified Residents Only':
        return { label: 'Resident Only', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      case 'Barangay Staff Only':
        return { label: 'Staff Only', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'Administrator & Council Only':
        return { label: 'Admin & Council', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      case 'Confidential / Restricted':
        return { label: 'Confidential', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      default:
        return { label: level, color: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
    }
  };

  const access = getAccessBadge(file.accessLevel);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400">{file.id}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {file.version}
                </span>
                {file.isConfidential && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Confidential
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white leading-tight mt-0.5">{file.fileTitle || file.title || file.fileName}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* Quick Attributes Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-emerald-400" />
                Format & Size
              </span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${getFormatBadgeColor(file.fileType)}`}>
                  {file.fileType}
                </span>
                <span className="font-mono font-bold text-white text-xs">{file.fileSizeFormatted}</span>
              </div>
              <p className="text-[9px] text-slate-500 font-mono">({(file.fileSize || file.fileSizeBytes || 0).toLocaleString()} bytes)</p>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-400" />
                Access Permission
              </span>
              <div className="pt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${access.color}`}>
                  {access.label}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 truncate">{file.accessLevel}</p>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Integrity Status
              </span>
              <div className="pt-0.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {file.status}
                </span>
              </div>
              <p className="text-[9px] text-slate-400">Downloads: {file.downloadCount}</p>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-400" />
                Upload Date
              </span>
              <p className="font-bold text-white text-xs pt-0.5">{file.dateUploaded.split(' ')[0]}</p>
              <p className="text-[9px] text-slate-500 font-mono">{file.dateUploaded.split(' ')[1] || '08:00:00'}</p>
            </div>
          </div>

          {/* Core File Attribute Specifications */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              File System Specifications & Metadata Attributes
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              <div className="flex items-start justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">File Name:</span>
                <span className="font-mono font-bold text-white text-right break-all">{file.fileName}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">File Category:</span>
                <span className="font-bold text-slate-200 text-right">{file.fileCategory}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">MIME Content Type:</span>
                <span className="font-mono text-slate-300 text-right">{file.mimeType}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">Physical Vault Storage Path:</span>
                <span className="font-mono text-[11px] text-slate-300 text-right break-all">{file.storagePath || file.filePath}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">Uploaded By:</span>
                <span className="text-slate-200 text-right">
                  <strong>{file.uploaderName}</strong> ({file.uploaderRole})
                </span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">Uploader Reference ID:</span>
                <span className="font-mono text-slate-300 text-right">{file.uploaderId}</span>
              </div>

              {file.lastModified && (
                <div className="flex items-start justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Last Modified:</span>
                  <span className="font-mono text-slate-300 text-right">{file.lastModified}</span>
                </div>
              )}

              {(file.retentionPeriod || file.retentionExpiry) && (
                <div className="flex items-start justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Data Retention Policy:</span>
                  <span className="text-slate-300 text-right">{file.retentionPeriod || file.retentionExpiry}</span>
                </div>
              )}

              {file.linkedEntityType && (
                <div className="flex items-start justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Linked Entity Association:</span>
                  <span className="font-mono text-emerald-400 text-right">
                    {file.linkedEntityType} {file.linkedEntityId ? `(${file.linkedEntityId})` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cryptographic SHA-256 Checksum Hash */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                Cryptographic SHA-256 Checksum Digest
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHash}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedHash ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy SHA-256</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleRunVerification}
                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verify Integrity</span>
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400/90 break-all select-all">
              {file.fileHash}
            </div>

            {verificationResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  verificationResult.isValid
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-800 text-rose-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">{verificationResult.message}</p>
                  <p className="text-[10px] opacity-80">Verified on {verificationResult.checkedAt} against tamper-evident blockchain ledger.</p>
                </div>
              </div>
            )}
          </div>

          {/* Description & Official Notes */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-bold text-slate-400">File Description & Scope</span>
            <p className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 text-slate-200 leading-relaxed text-xs">
              {file.description || 'No specific description provided for this digital file.'}
            </p>
          </div>

          {file.notes && (
            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold text-slate-400">Administrative Notes</span>
              <p className="p-3 bg-amber-950/20 rounded-xl border border-amber-800/30 text-amber-200 text-xs italic">
                {file.notes}
              </p>
            </div>
          )}

          {/* Tags */}
          {file.tags && file.tags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                Indexed Database Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {file.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400">
            Storage Engine: <strong className="text-slate-300">Barangay Sangkol Vault v2.0</strong>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(file);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                Edit Metadata
              </button>
            )}

            <button
              onClick={() => onDownload(file)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
