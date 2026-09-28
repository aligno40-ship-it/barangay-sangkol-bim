import React, { useState, useMemo } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { BarangayDocument, BarangayFileRecord, FileCategory, FileAccessLevel } from '../types';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { FileAttributesModal } from '../components/files/FileAttributesModal';
import { FileUploadModal } from '../components/files/FileUploadModal';
import { FileEditModal } from '../components/files/FileEditModal';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { InfoButton } from '../components/InfoButton';
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Tag,
  Calendar,
  Edit2,
  Trash2,
  X,
  ShieldCheck,
  FolderOpen,
  HardDrive,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Lock,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  RefreshCw,
  Hash,
  Share2,
  Shield,
  FileCheck2,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';

export const DocumentsView: React.FC = () => {
  const {
    documents,
    addDocument,
    deleteDocument,
    files,
    addFile,
    updateFile,
    deleteFile,
    verifyFileChecksum,
    incrementFileDownload,
    settings,
    currentUser,
  } = useBarangay();

  const isResident = currentUser.role === 'Resident';
  const canManage = currentUser.role === 'Administrator' || currentUser.role === 'Barangay Staff';

  // Primary Tab: 'files_db' (Files Database & Attributes) or 'ordinances' (Legislative Archive)
  const [activeSubTab, setActiveSubTab] = useState<'files_db' | 'ordinances'>('files_db');

  // View Mode for Files: 'table' or 'grid'
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Search & Filters for Files DB
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFormat, setSelectedFormat] = useState<string>('All');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'downloads'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals State for Files DB
  const [inspectingFile, setInspectingFile] = useState<BarangayFileRecord | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<BarangayFileRecord | null>(null);
  const [deleteTargetFile, setDeleteTargetFile] = useState<BarangayFileRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters for Legislative Ordinances
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>('All');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<BarangayDocument | null>(null);
  const [deleteTargetDoc, setDeleteTargetDoc] = useState<BarangayDocument | null>(null);

  const initialDocForm: Omit<BarangayDocument, 'id' | 'dateUploaded'> = {
    title: '',
    category: 'Ordinance',
    documentNumber: `ORD-2026-${String(documents.length + 1).padStart(3, '0')}`,
    authorOrSponsor: 'Sangguniang Barangay',
    description: '',
    tags: ['Legislation', 'Barangay Sangkol'],
    status: 'Approved',
  };

  const [docFormData, setDocFormData] = useState(initialDocForm);
  const [docTagInput, setDocTagInput] = useState('');

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper for Format Icons
  const getFormatIcon = (format: string) => {
    const f = format.toLowerCase();
    if (f === 'pdf') return <FileText className="w-4 h-4 text-rose-400" />;
    if (['xlsx', 'xls', 'csv'].includes(f)) return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    if (['docx', 'doc', 'txt'].includes(f)) return <FileCode className="w-4 h-4 text-blue-400" />;
    if (['png', 'jpg', 'jpeg', 'webp'].includes(f)) return <ImageIcon className="w-4 h-4 text-purple-400" />;
    if (['zip', 'rar', '7z', 'tar'].includes(f)) return <FileArchive className="w-4 h-4 text-amber-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  // Access Permission Badges
  const getAccessBadge = (level: FileAccessLevel) => {
    switch (level) {
      case 'Public (All Citizens)':
        return { label: 'Public', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'Resident (Owner & Staff)':
      case 'Verified Residents Only':
        return { label: 'Resident Only', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      case 'Barangay Staff Only':
        return { label: 'Staff Only', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'Administrator Only':
      case 'Administrator & Council Only':
        return { label: 'Admin Only', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      case 'Confidential / Restrictive':
      case 'Confidential / Restricted':
        return { label: 'Confidential', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      default:
        return { label: level, color: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
    }
  };

  // Filtered & Sorted Files List
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        // Role check: If resident and confidential or staff-only, only allow if uploaded by this resident
        if (isResident) {
          if (
            file.accessLevel === 'Confidential / Restrictive' ||
            file.accessLevel === 'Confidential / Restricted' ||
            file.accessLevel === 'Barangay Staff Only' ||
            file.accessLevel === 'Administrator Only' ||
            file.accessLevel === 'Administrator & Council Only'
          ) {
            if (file.uploaderId !== currentUser.id && file.uploaderId !== currentUser.residentId) {
              return false;
            }
          }
        }

        const term = searchQuery.toLowerCase().trim();
        const displayTitle = file.fileTitle || file.title || file.fileName;
        const matchesSearch =
          !term ||
          displayTitle.toLowerCase().includes(term) ||
          file.fileName.toLowerCase().includes(term) ||
          file.id.toLowerCase().includes(term) ||
          file.fileHash.toLowerCase().includes(term) ||
          file.uploaderName.toLowerCase().includes(term) ||
          (file.tags && file.tags.some((t) => t.toLowerCase().includes(term))) ||
          (file.linkedEntityId && file.linkedEntityId.toLowerCase().includes(term));

        const matchesCategory = selectedCategory === 'All' || file.fileCategory === selectedCategory;
        const matchesFormat =
          selectedFormat === 'All' ||
          (selectedFormat === 'PDF' && file.fileType === 'PDF') ||
          (selectedFormat === 'Excel' && ['XLSX', 'XLS', 'CSV'].includes(file.fileType)) ||
          (selectedFormat === 'Word' && ['DOCX', 'DOC'].includes(file.fileType)) ||
          (selectedFormat === 'Images' && ['PNG', 'JPG', 'JPEG'].includes(file.fileType)) ||
          (selectedFormat === 'Archives' && ['ZIP', 'RAR'].includes(file.fileType));

        const matchesAccess = selectedAccessLevel === 'All' || file.accessLevel === selectedAccessLevel;
        const matchesStatus = selectedStatus === 'All' || file.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesFormat && matchesAccess && matchesStatus;
      })
      .sort((a, b) => {
        let comp = 0;
        const titleA = a.fileTitle || a.title || a.fileName;
        const titleB = b.fileTitle || b.title || b.fileName;
        const sizeA = a.fileSize || a.fileSizeBytes || 0;
        const sizeB = b.fileSize || b.fileSizeBytes || 0;

        if (sortBy === 'date') {
          comp = new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime();
        } else if (sortBy === 'name') {
          comp = titleA.localeCompare(titleB);
        } else if (sortBy === 'size') {
          comp = sizeB - sizeA;
        } else if (sortBy === 'downloads') {
          comp = (b.downloadCount || 0) - (a.downloadCount || 0);
        }
        return sortOrder === 'asc' ? -comp : comp;
      });
  }, [files, searchQuery, selectedCategory, selectedFormat, selectedAccessLevel, selectedStatus, sortBy, sortOrder, isResident, currentUser]);

  // Storage and Metrics calculation
  const totalStorageBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.fileSize || f.fileSizeBytes || 0), 0);
  }, [files]);

  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);

  // File Download Simulation
  const handleDownloadFile = (file: BarangayFileRecord) => {
    incrementFileDownload(file.id);
    const displayTitle = file.fileTitle || file.title || file.fileName;
    const actualSize = file.fileSize || file.fileSizeBytes || 0;
    const actualPath = file.storagePath || file.filePath || '';
    const actualRetention = file.retentionPeriod || file.retentionExpiry || 'Permanent';

    // Create simulated file content for download
    const content = `=====================================================
BARANGAY SANGKOL DIGITAL ASSET REPOSITORY
Official File Vault Record & Authenticity Certificate
=====================================================

File ID: ${file.id}
File Name: ${file.fileName}
Title: ${displayTitle}
Category: ${file.fileCategory}
MIME Content Type: ${file.mimeType}
File Size: ${file.fileSizeFormatted} (${actualSize} bytes)
Storage Vault Path: ${actualPath}
Version: ${file.version}
Status: ${file.status}
Access Level: ${file.accessLevel}
Confidential: ${file.isConfidential ? 'YES (Restricted)' : 'NO (Unrestricted)'}

UPLOADER CREDENTIALS:
Uploaded By: ${file.uploaderName} (${file.uploaderRole})
Uploader Reference ID: ${file.uploaderId}
Timestamp: ${file.dateUploaded}

CRYPTOGRAPHIC INTEGRITY:
SHA-256 Checksum Digest:
${file.fileHash}

DESCRIPTION & USAGE:
${file.description || 'Barangay Sangkol official digital asset.'}

TAGS:
${file.tags ? file.tags.join(', ') : 'None'}

RETENTION DIRECTIVE:
${actualRetention}

=====================================================
BARANGAY SANGKOL INFORMATION MANAGEMENT SYSTEM (BIMS)
Tamper-evident, cryptographically signed record.
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName.endsWith('.txt') ? file.fileName : `${file.fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Downloaded "${file.fileName}" (Download counter updated)`);
  };

  // Export File Database Manifest (CSV or JSON)
  const handleExportFilesManifestCSV = () => {
    const headers = [
      'File ID',
      'File Name',
      'Title',
      'Category',
      'Type',
      'MIME Type',
      'Size (Bytes)',
      'Size Formatted',
      'Storage Path',
      'Uploader Name',
      'Uploader Role',
      'Date Uploaded',
      'Access Level',
      'Status',
      'SHA-256 Hash',
      'Downloads',
      'Confidential',
      'Tags',
    ];

    const rows = files.map((f) => {
      const displayTitle = f.fileTitle || f.title || f.fileName;
      const actualSize = f.fileSize || f.fileSizeBytes || 0;
      const actualPath = f.storagePath || f.filePath || '';
      return [
        `"${f.id}"`,
        `"${f.fileName}"`,
        `"${displayTitle.replace(/"/g, '""')}"`,
        `"${f.fileCategory}"`,
        `"${f.fileType}"`,
        `"${f.mimeType}"`,
        actualSize,
        `"${f.fileSizeFormatted}"`,
        `"${actualPath}"`,
        `"${f.uploaderName}"`,
        `"${f.uploaderRole}"`,
        `"${f.dateUploaded}"`,
        `"${f.accessLevel}"`,
        `"${f.status}"`,
        `"${f.fileHash}"`,
        f.downloadCount,
        f.isConfidential ? 'YES' : 'NO',
        `"${(f.tags || []).join(';')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Barangay_Sangkol_Files_Database_Manifest_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Exported official File Database Manifest (CSV)');
  };

  // Quick Integrity Verification for single file
  const handleVerifyQuick = (file: BarangayFileRecord) => {
    const res = verifyFileChecksum(file.id);
    if (res.isValid) {
      showToast(`✓ File ${file.id} Verified: SHA-256 Hash Valid & Intact`);
    } else {
      showToast(`Verification Alert on ${file.id}: ${res.message}`);
    }
  };

  // Ordinances Handlers
  const filteredDocs = documents.filter((d) => {
    const term = docSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      d.title.toLowerCase().includes(term) ||
      d.documentNumber.toLowerCase().includes(term) ||
      d.description.toLowerCase().includes(term) ||
      d.tags.some((t) => t.toLowerCase().includes(term));
    const matchesCategory = selectedDocCategory === 'All' || d.category === selectedDocCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddDoc = () => {
    if (isResident) return;
    setDocFormData(initialDocForm);
    setDocTagInput('');
    setIsDocModalOpen(true);
  };

  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isResident) return;
    if (!docFormData.title) {
      alert('Document Title is required.');
      return;
    }

    const tagsArray = docTagInput
      ? docTagInput.split(',').map((t) => t.trim()).filter(Boolean)
      : docFormData.tags;

    addDocument({
      ...docFormData,
      tags: tagsArray,
    });
    setIsDocModalOpen(false);
    showToast(`Archived document ${docFormData.documentNumber}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/80 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              Barangay Sangkol Digital Records Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1 flex-wrap">
            <FolderOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Files Database & Document Management System</span>
            <InfoButton
              title="Files & Document Management"
              info="Unified digital asset vault, SHA-256 cryptographic file table, public forms, and legislative ordinances repository."
              variant="light"
            />
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {activeSubTab === 'files_db' ? (
            <>
              <button
                onClick={handleExportFilesManifestCSV}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Export File Database Manifest in CSV"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Export Manifest (CSV)</span>
              </button>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Upload & Register File</span>
              </button>
            </>
          ) : (
            canManage && (
              <button
                onClick={handleOpenAddDoc}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Archive Ordinance / Enactment</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Module Tabs Bar */}
      <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-2 shadow-xs">
        <button
          onClick={() => setActiveSubTab('files_db')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'files_db'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>Files Database & Asset Vault</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeSubTab === 'files_db' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {files.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('ordinances')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'ordinances'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Legislative Ordinances & Resolutions</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeSubTab === 'ordinances' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {documents.length}
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: DIGITAL FILES DATABASE & ATTRIBUTES TABLE */}
      {activeSubTab === 'files_db' && (
        <div className="space-y-6">
          {/* Storage & Quick Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                Indexed Digital Files
              </span>
              <p className="text-2xl font-black text-white font-mono">{files.length}</p>
              <p className="text-[10px] text-slate-500">Across 9 barangay categories</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                Vault Storage Volume
              </span>
              <p className="text-2xl font-black text-white font-mono">{totalStorageMB} MB</p>
              <p className="text-[10px] text-slate-500">{totalStorageBytes.toLocaleString()} total bytes</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Cryptographic Integrity
              </span>
              <p className="text-2xl font-black text-emerald-400 font-mono">Verified</p>
              <p className="text-[10px] text-slate-500">SHA-256 digests validated</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-purple-400" />
                Total File Downloads
              </span>
              <p className="text-2xl font-black text-white font-mono">
                {files.reduce((acc, f) => acc + (f.downloadCount || 0), 0)}
              </p>
              <p className="text-[10px] text-slate-500">Official citizen downloads</p>
            </div>
          </div>

          {/* Table of Features & Controls Filter Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <RecentSearchesInput
                className="flex-1"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search file name, title, category, SHA-256 hash, uploader, tags, record ID..."
                storageKey="documents"
                theme="dark"
              />

              {/* View Mode & Sort Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'table' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Table View (Full Attributes Database)"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Visual Grid Cards"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="date" className="bg-slate-800">Date Uploaded</option>
                    <option value="name" className="bg-slate-800">Title / Name</option>
                    <option value="size" className="bg-slate-800">File Size</option>
                    <option value="downloads" className="bg-slate-800">Most Downloaded</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
                  >
                    {sortOrder.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Filters Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
              {/* Category Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="All">All Categories ({files.length})</option>
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

              {/* Format Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Format / MIME</label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="All">All Formats</option>
                  <option value="PDF">PDF Documents</option>
                  <option value="Excel">Excel / CSV Spreadsheets</option>
                  <option value="Word">Word Documents</option>
                  <option value="Images">Images (JPG, PNG)</option>
                  <option value="Archives">Archives (ZIP, RAR)</option>
                </select>
              </div>

              {/* Access Level Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Access Level</label>
                <select
                  value={selectedAccessLevel}
                  onChange={(e) => setSelectedAccessLevel(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="All">All Access Levels</option>
                  <option value="Public (All Citizens)">Public Access</option>
                  <option value="Verified Residents Only">Verified Residents</option>
                  <option value="Barangay Staff Only">Barangay Staff</option>
                  <option value="Administrator & Council Only">Admin & Council</option>
                  <option value="Confidential / Restricted">Confidential / Restricted</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active / Verified">Active / Verified</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white font-mono">{filteredFiles.length}</strong> of{' '}
              <strong className="text-white font-mono">{files.length}</strong> files in vault
            </span>
            {(selectedCategory !== 'All' || selectedFormat !== 'All' || selectedAccessLevel !== 'All' || selectedStatus !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedFormat('All');
                  setSelectedAccessLevel('All');
                  setSelectedStatus('All');
                  setSearchQuery('');
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* VIEW MODE 1: INTERACTIVE DATABASE TABLE (FULL ATTRIBUTES & FEATURES) */}
          {viewMode === 'table' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800/80 border-b border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-4">File ID & Title</th>
                      <th className="py-3.5 px-3">Category</th>
                      <th className="py-3.5 px-3">Format & Size</th>
                      <th className="py-3.5 px-3">Access Level</th>
                      <th className="py-3.5 px-3">Uploader</th>
                      <th className="py-3.5 px-3">Date Uploaded</th>
                      <th className="py-3.5 px-3">Integrity (SHA-256)</th>
                      <th className="py-3.5 px-3 text-center">Downloads</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredFiles.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <FolderOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="font-bold text-slate-300">No files match your search criteria.</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Try clearing filters or uploading a new file record.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredFiles.map((file) => {
                        const access = getAccessBadge(file.accessLevel);
                        return (
                          <tr
                            key={file.id}
                            className="hover:bg-slate-800/40 transition-colors group"
                          >
                            {/* File ID & Title */}
                            <td className="py-3 px-4">
                              <div className="flex items-start gap-2.5">
                                <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0 mt-0.5">
                                  {getFormatIcon(file.fileType)}
                                </div>
                                <div className="space-y-0.5 max-w-xs sm:max-w-sm">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-bold text-emerald-400">{file.id}</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                                      {file.version}
                                    </span>
                                    {file.isConfidential && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5" />
                                        Confidential
                                      </span>
                                    )}
                                  </div>
                                  <h4
                                    onClick={() => setInspectingFile(file)}
                                    className="font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors leading-tight line-clamp-1"
                                  >
                                    {file.fileTitle || file.title || file.fileName}
                                  </h4>
                                  <p className="text-[11px] font-mono text-slate-400 truncate">{file.fileName}</p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-3">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium whitespace-nowrap">
                                {file.fileCategory}
                              </span>
                            </td>

                            {/* Format & Size */}
                            <td className="py-3 px-3">
                              <div className="space-y-0.5">
                                <span className="font-mono font-bold text-white text-xs">{file.fileSizeFormatted}</span>
                                <p className="text-[10px] font-mono text-slate-500">{file.fileType}</p>
                              </div>
                            </td>

                            {/* Access Level */}
                            <td className="py-3 px-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${access.color}`}>
                                {access.label}
                              </span>
                            </td>

                            {/* Uploader */}
                            <td className="py-3 px-3">
                              <div className="space-y-0.5">
                                <p className="font-semibold text-slate-200 truncate">{file.uploaderName}</p>
                                <span className="text-[9px] text-slate-400">{file.uploaderRole}</span>
                              </div>
                            </td>

                            {/* Date Uploaded */}
                            <td className="py-3 px-3">
                              <div className="space-y-0.5">
                                <p className="text-slate-300 whitespace-nowrap">{file.dateUploaded.split(' ')[0]}</p>
                                <p className="text-[10px] font-mono text-slate-500">{file.dateUploaded.split(' ')[1] || ''}</p>
                              </div>
                            </td>

                            {/* Integrity Checksum */}
                            <td className="py-3 px-3">
                              <button
                                onClick={() => handleVerifyQuick(file)}
                                className="group/hash flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Click to verify SHA-256 cryptographic checksum"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="font-mono text-[10px] text-slate-400 group-hover/hash:text-emerald-400">
                                  {file.fileHash.slice(0, 8)}...
                                </span>
                              </button>
                            </td>

                            {/* Downloads */}
                            <td className="py-3 px-3 text-center">
                              <span className="font-mono font-bold text-white text-xs bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                                {file.downloadCount}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setInspectingFile(file)}
                                  className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                                  title="Inspect Full Attributes & Metadata"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                </button>

                                <button
                                  onClick={() => handleDownloadFile(file)}
                                  className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                                  title="Download File"
                                >
                                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                                </button>

                                {canManage && (
                                  <>
                                    <button
                                      onClick={() => setEditingFile(file)}
                                      className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                                      title="Edit Attributes"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                                    </button>

                                    <button
                                      onClick={() => setDeleteTargetFile(file)}
                                      className="p-1.5 text-rose-400 hover:text-rose-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                                      title="Delete File"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: VISUAL ASSET GRID */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => {
                const access = getAccessBadge(file.accessLevel);
                return (
                  <div
                    key={file.id}
                    className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between shadow-md group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                            {getFormatIcon(file.fileType)}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-emerald-400">{file.id}</span>
                            <span className="text-[9px] font-mono text-slate-400 ml-1.5">({file.version})</span>
                          </div>
                        </div>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${access.color}`}>
                          {access.label}
                        </span>
                      </div>

                      <div>
                        <h4
                          onClick={() => setInspectingFile(file)}
                          className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors leading-snug line-clamp-2"
                        >
                          {file.fileTitle || file.title || file.fileName}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">{file.fileName}</p>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                        {file.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-1 text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                          {file.fileSizeFormatted}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                          {file.fileCategory}
                        </span>
                        {file.tags && file.tags.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate">By: <strong className="text-slate-300">{file.uploaderName}</strong></span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setInspectingFile(file)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="p-1 text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                        </button>

                        {canManage && (
                          <button
                            onClick={() => setDeleteTargetFile(file)}
                            className="p-1 text-rose-400 hover:text-rose-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer"
                            title="Delete File"
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
      )}

      {/* SUB-TAB 2: LEGISLATIVE ORDINANCES & RESOLUTIONS REPOSITORY */}
      {activeSubTab === 'ordinances' && (
        <div className="space-y-6">
          {/* Filter Bar for Ordinances */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
            <RecentSearchesInput
              className="flex-1"
              value={docSearchQuery}
              onChange={setDocSearchQuery}
              placeholder="Search ordinance title, number, keywords, tags..."
              storageKey="ordinances"
              theme="dark"
            />

            <div className="w-full sm:w-64">
              <select
                value={selectedDocCategory}
                onChange={(e) => setSelectedDocCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Document Types</option>
                <option value="Ordinance">Barangay Ordinances</option>
                <option value="Resolution">Sangguniang Resolutions</option>
                <option value="Executive Order">Executive Orders</option>
                <option value="Annual Investment Plan (AIP)">Annual Investment Plans (AIP)</option>
                <option value="Barangay Development Plan (BDP)">Development Plans (BDP)</option>
                <option value="Memorandum">Memoranda / Circulars</option>
              </select>
            </div>
          </div>

          {/* Ordinances Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {doc.documentNumber}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">{doc.title}</h3>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                      {doc.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                    {doc.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((t, idx) => (
                      <span key={idx} className="text-[9px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Author: <strong className="text-slate-300">{doc.authorOrSponsor}</strong></span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingDoc(doc)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Read</span>
                    </button>
                    {currentUser.role === 'Administrator' && (
                      <button
                        onClick={() => setDeleteTargetDoc(doc)}
                        className="p-1 text-rose-400 hover:text-rose-300 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer"
                        title="Delete Document"
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

      {/* Inspect File Attributes Modal */}
      {inspectingFile && (
        <FileAttributesModal
          file={inspectingFile}
          onClose={() => setInspectingFile(null)}
          onVerifyChecksum={verifyFileChecksum}
          onDownload={handleDownloadFile}
          onEdit={(f) => setEditingFile(f)}
        />
      )}

      {/* Upload New File Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={(data) => {
          const newF = addFile(data);
          showToast(`Uploaded & Registered "${newF.fileName}"`);
        }}
        currentUser={currentUser}
      />

      {/* Edit File Metadata Modal */}
      <FileEditModal
        file={editingFile}
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        onSave={(id, updates) => {
          updateFile(id, updates);
          showToast(`Updated metadata for file ${id}`);
        }}
      />

      {/* Delete File Confirmation */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetFile}
        title="Delete Digital Asset Record"
        itemType="Digital File"
        itemName={deleteTargetFile ? `${deleteTargetFile.id} - ${deleteTargetFile.fileName}` : undefined}
        description="Permanently remove this file from the Barangay Sangkol Files Database & Vault."
        confirmText="Yes, Delete File"
        onConfirm={() => {
          if (deleteTargetFile) {
            deleteFile(deleteTargetFile.id);
            showToast(`Deleted file ${deleteTargetFile.id}`);
            setDeleteTargetFile(null);
          }
        }}
        onClose={() => setDeleteTargetFile(null)}
      />

      {/* Document Reader Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">{viewingDoc.documentNumber} - {viewingDoc.category}</h3>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <h2 className="text-lg font-bold text-white">{viewingDoc.title}</h2>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 grid grid-cols-2 gap-2 text-slate-300">
                <div>Author / Sponsor: <strong className="text-white">{viewingDoc.authorOrSponsor}</strong></div>
                <div>Status: <strong className="text-emerald-400">{viewingDoc.status}</strong></div>
                <div>Date Enacted/Uploaded: <strong className="text-white">{viewingDoc.dateUploaded}</strong></div>
                <div>Category: <strong className="text-white">{viewingDoc.category}</strong></div>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Document Text & Enactment Summary:</span>
                <div className="mt-2 p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                  {viewingDoc.description}
                  {'\n\n'}
                  <strong>BE IT ORDAINED / RESOLVED</strong> by the Sangguniang Barangay of {settings.barangayName}, Municipality of {settings.municipality}, Province of {settings.province} in regular session assembled:
                  {'\n\n'}
                  SECTION 1. TITLE. This official enactment shall be known and cited as the {viewingDoc.title}.
                  {'\n\n'}
                  SECTION 2. ENFORCEMENT & IMPLEMENTATION. The Punong Barangay, Barangay Kagawads, and Barangay Tanod brigade are tasked with the full enforcement of this measure.
                  {'\n\n'}
                  SECTION 3. EFFECTIVITY. This document shall take effect immediately upon posting in conspicuous public locations within the barangay jurisdiction.
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setViewingDoc(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-100">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Archive New Barangay Document</span>
              </h3>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDocSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={docFormData.title}
                  onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                  placeholder="e.g. Barangay Ordinance No. 04-2026 (Curfew for Minors)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Document Number</label>
                  <input
                    type="text"
                    required
                    value={docFormData.documentNumber}
                    onChange={(e) => setDocFormData({ ...docFormData, documentNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select
                    value={docFormData.category}
                    onChange={(e) => setDocFormData({ ...docFormData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="Ordinance">Ordinance</option>
                    <option value="Resolution">Resolution</option>
                    <option value="Executive Order">Executive Order</option>
                    <option value="Annual Investment Plan (AIP)">Annual Investment Plan (AIP)</option>
                    <option value="Barangay Development Plan (BDP)">Development Plan (BDP)</option>
                    <option value="Memorandum">Memorandum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Author / Sponsor / Committee</label>
                <input
                  type="text"
                  value={docFormData.authorOrSponsor}
                  onChange={(e) => setDocFormData({ ...docFormData, authorOrSponsor: e.target.value })}
                  placeholder="e.g. Hon. Roberto Tan, Comm. on Peace & Order"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description / Enactment Summary *</label>
                <textarea
                  rows={4}
                  required
                  value={docFormData.description}
                  onChange={(e) => setDocFormData({ ...docFormData, description: e.target.value })}
                  placeholder="Brief synopsis and legal scope of this ordinance or resolution..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={docTagInput}
                  onChange={(e) => setDocTagInput(e.target.value)}
                  placeholder="e.g. Peace, Curfew, Youth, Public Safety"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  Archive Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetDoc}
        title="Delete Archived Document"
        itemType="Barangay Document"
        itemName={deleteTargetDoc ? `${deleteTargetDoc.documentNumber} - ${deleteTargetDoc.title}` : undefined}
        description="Permanently delete this document from the official barangay repository."
        confirmText="Yes, Delete Document"
        onConfirm={() => {
          if (deleteTargetDoc) {
            deleteDocument(deleteTargetDoc.id);
            setDeleteTargetDoc(null);
          }
        }}
        onClose={() => setDeleteTargetDoc(null)}
      />
    </div>
  );
};
