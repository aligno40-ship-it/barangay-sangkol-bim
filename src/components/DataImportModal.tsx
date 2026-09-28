import React, { useState, useRef } from 'react';
import { useBarangay } from '../context/BarangayContext';
import {
  ImportEntityType,
  parseUploadedFile,
  mapRowsToResidents,
  mapRowsToBusinesses,
  mapRowsToHouseholds,
  mapRowsToBlotter,
  mapRowsToOfficials,
  downloadSampleTemplate,
} from '../utils/excelImportUtils';
import confetti from 'canvas-confetti';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  FileText,
  Users,
  Building2,
  Home,
  ShieldAlert,
  Award,
  Trash2,
  RefreshCw,
  Eye,
  Check,
  ChevronRight,
  Database,
  Layers,
} from 'lucide-react';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEntity?: ImportEntityType;
  onImportComplete?: (count: number, entityType: ImportEntityType) => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  initialEntity = 'residents',
  onImportComplete,
}) => {
  const {
    settings,
    bulkImportResidents,
    bulkImportBusinesses,
    bulkImportHouseholds,
    bulkImportBlotter,
    bulkImportOfficials,
  } = useBarangay();

  const [entityType, setEntityType] = useState<ImportEntityType>(initialEntity);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [defaultPurok, setDefaultPurok] = useState(settings.puroks[0] || 'Purok Pinya');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Parsed results
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [parsedData, setParsedData] = useState<{
    valid: any[];
    invalid: { row: number; data: any; errors: string[] }[];
    total: number;
    warnings: string[];
  }>({
    valid: [],
    invalid: [],
    total: 0,
    warnings: [],
  });

  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [importCount, setImportCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const entityMetadata: Record<
    ImportEntityType,
    { label: string; icon: React.ReactNode; color: string; desc: string }
  > = {
    residents: {
      label: 'Residents Civil Registry',
      icon: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      color: 'emerald',
      desc: 'Bulk register residents, households, age calculations, voter and sectoral tags.',
    },
    businesses: {
      label: 'Barangay Commercial Businesses',
      icon: <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      color: 'blue',
      desc: 'Import commercial stores, sari-sari shops, DTI/SEC registrations, and permits.',
    },
    households: {
      label: 'Household Registry',
      icon: <Home className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      color: 'amber',
      desc: 'Import household units, head of family records, utilities, and income brackets.',
    },
    blotter: {
      label: 'Blotter & Incident Records',
      icon: <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      color: 'rose',
      desc: 'Import incident logs, complaints, hearing histories, and case assignments.',
    },
    officials: {
      label: 'Barangay Officials & Staff',
      icon: <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      color: 'purple',
      desc: 'Import barangay kagawads, SK officials, tanod rosters, and committee chairs.',
    },
    complaints: {
      label: 'Lupon Complaints & Disputes',
      icon: <ShieldAlert className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      color: 'orange',
      desc: 'Import Lupon Tagapamayapa case dockets and mediation proceedings.',
    },
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processFile(droppedFile);
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsParsing(true);
    setParseError(null);

    try {
      const { rawRows: rows } = await parseUploadedFile(uploadedFile);
      if (!rows || rows.length === 0) {
        setParseError('The uploaded file appears to be empty or has no readable rows.');
        setIsParsing(false);
        return;
      }

      setRawRows(rows);
      revalidateRows(rows, entityType, defaultPurok);
      setStep('preview');
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParseError(
        `Failed to parse file: ${err?.message || 'Invalid format'}. Please make sure you are using .xlsx, .xls, or .csv.`
      );
    } finally {
      setIsParsing(false);
    }
  };

  const revalidateRows = (rows: any[], currentType: ImportEntityType, purok: string) => {
    if (currentType === 'residents') {
      const result = mapRowsToResidents(rows, purok);
      setParsedData({
        valid: result.validRecords,
        invalid: result.invalidRecords,
        total: result.totalRows,
        warnings: result.warnings,
      });
    } else if (currentType === 'businesses') {
      const result = mapRowsToBusinesses(rows, purok);
      setParsedData({
        valid: result.validRecords,
        invalid: result.invalidRecords,
        total: result.totalRows,
        warnings: result.warnings,
      });
    } else if (currentType === 'households') {
      const result = mapRowsToHouseholds(rows, purok);
      setParsedData({
        valid: result.validRecords,
        invalid: result.invalidRecords,
        total: result.totalRows,
        warnings: result.warnings,
      });
    } else if (currentType === 'blotter') {
      const result = mapRowsToBlotter(rows, purok);
      setParsedData({
        valid: result.validRecords,
        invalid: result.invalidRecords,
        total: result.totalRows,
        warnings: result.warnings,
      });
    } else if (currentType === 'officials') {
      const result = mapRowsToOfficials(rows, purok);
      setParsedData({
        valid: result.validRecords,
        invalid: result.invalidRecords,
        total: result.totalRows,
        warnings: result.warnings,
      });
    }
  };

  const handleEntityTypeChange = (newType: ImportEntityType) => {
    setEntityType(newType);
    if (rawRows.length > 0) {
      revalidateRows(rawRows, newType, defaultPurok);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedData.valid.length === 0) return;

    setIsImporting(true);
    try {
      let count = 0;

      if (entityType === 'residents') {
        const res = await bulkImportResidents(parsedData.valid as any);
        count = res.addedCount;
      } else if (entityType === 'businesses') {
        const res = await bulkImportBusinesses(parsedData.valid as any);
        count = res.addedCount;
      } else if (entityType === 'households') {
        const res = await bulkImportHouseholds(parsedData.valid as any);
        count = res.addedCount;
      } else if (entityType === 'blotter') {
        const res = await bulkImportBlotter(parsedData.valid as any);
        count = res.addedCount;
      } else if (entityType === 'officials') {
        const res = await bulkImportOfficials(parsedData.valid as any);
        count = res.addedCount;
      }

      setImportCount(count);
      setStep('success');

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe if confetti fails
      }

      if (onImportComplete) {
        onImportComplete(count, entityType);
      }
    } catch (err: any) {
      console.error('Import execution error:', err);
      setParseError(`Failed to save records: ${err?.message || 'Unknown database error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setRawRows([]);
    setParsedData({ valid: [], invalid: [], total: 0, warnings: [] });
    setParseError(null);
    setStep('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Excel & CSV Bulk Data Importer
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  Instant Registration
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Import and automatically allocate spreadsheet records directly into the Barangay system.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-6">
            <div
              className={`flex items-center gap-2 ${
                step === 'upload'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center bg-current text-white font-bold text-[10px]">
                1
              </span>
              <span>Upload & Target Module</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <div
              className={`flex items-center gap-2 ${
                step === 'preview'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center bg-current text-white font-bold text-[10px]">
                2
              </span>
              <span>Review & Auto-Allocation</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <div
              className={`flex items-center gap-2 ${
                step === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center bg-current text-white font-bold text-[10px]">
                3
              </span>
              <span>Completed</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Download official format:</span>
            <button
              type="button"
              onClick={() => downloadSampleTemplate(entityType, 'xlsx')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              .XLSX Template
            </button>
            <button
              type="button"
              onClick={() => downloadSampleTemplate(entityType, 'csv')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              .CSV Template
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">

          {/* STEP 1: Upload and Module Selector */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Target Entity Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Destination Module / Registration Form:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(Object.keys(entityMetadata) as ImportEntityType[]).map((key) => {
                    const item = entityMetadata[key];
                    const isSelected = entityType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleEntityTypeChange(key)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                            {item.icon}
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Upload Excel or CSV File:
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/30 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls, .csv, .json"
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Click to browse or drag and drop your spreadsheet
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports Excel (<code className="text-emerald-600 font-mono">.xlsx, .xls</code>), CSV (<code className="text-emerald-600 font-mono">.csv</code>), and JSON
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-full font-medium">
                      Smart Column Auto-Detection Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Parsing Indicator */}
              {isParsing && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-3 text-blue-700 dark:text-blue-300 text-xs font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Reading spreadsheet rows and detecting schema mapping...
                </div>
              )}

              {/* Error Message */}
              {parseError && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold">Error reading file:</div>
                    <div>{parseError}</div>
                  </div>
                </div>
              )}

              {/* Tips & Instructions */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Helpful Import Tips:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>Column headers do not have to match exact casing (e.g. <code>First Name</code>, <code>fname</code>, and <code>given_name</code> will all map correctly).</li>
                  <li>Birth dates can be formatted as <code>YYYY-MM-DD</code> or standard Excel date cells; exact dynamic age is calculated automatically.</li>
                  <li>You can download the sample template above to see exact column recommendations.</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Confirmation */}
          {step === 'preview' && (
            <div className="space-y-5">
              {/* File & Validation Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">File Name</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {file?.name || 'Uploaded Spreadsheet'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Target Module</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                    {entityMetadata[entityType].label}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30">
                  <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Ready to Register</div>
                  <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {parsedData.valid.length} <span className="text-xs font-normal">records</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30">
                  <div className="text-[11px] font-medium text-rose-700 dark:text-rose-300">Incomplete / Errors</div>
                  <div className="text-xl font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">
                    {parsedData.invalid.length} <span className="text-xs font-normal">rows</span>
                  </div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    Data Preview (First 50 Valid Records):
                  </h3>
                  <button
                    onClick={handleReset}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Choose different file
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        {entityType === 'residents' && (
                          <>
                            <th className="py-2.5 px-3">Full Name</th>
                            <th className="py-2.5 px-3">Birth Date</th>
                            <th className="py-2.5 px-3">Age</th>
                            <th className="py-2.5 px-3">Sex / Civil</th>
                            <th className="py-2.5 px-3">Purok</th>
                            <th className="py-2.5 px-3">Contact</th>
                            <th className="py-2.5 px-3">Voter Status</th>
                          </>
                        )}
                        {entityType === 'businesses' && (
                          <>
                            <th className="py-2.5 px-3">Business Name</th>
                            <th className="py-2.5 px-3">Proprietor</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">Purok</th>
                            <th className="py-2.5 px-3">Capital</th>
                            <th className="py-2.5 px-3">Status</th>
                          </>
                        )}
                        {entityType === 'households' && (
                          <>
                            <th className="py-2.5 px-3">HH No</th>
                            <th className="py-2.5 px-3">Household Head</th>
                            <th className="py-2.5 px-3">Purok</th>
                            <th className="py-2.5 px-3">Housing Type</th>
                            <th className="py-2.5 px-3">Income</th>
                          </>
                        )}
                        {entityType === 'blotter' && (
                          <>
                            <th className="py-2.5 px-3">Blotter No</th>
                            <th className="py-2.5 px-3">Incident Type</th>
                            <th className="py-2.5 px-3">Complainant</th>
                            <th className="py-2.5 px-3">Respondent</th>
                            <th className="py-2.5 px-3">Status</th>
                          </>
                        )}
                        {entityType === 'officials' && (
                          <>
                            <th className="py-2.5 px-3">Official Name</th>
                            <th className="py-2.5 px-3">Position</th>
                            <th className="py-2.5 px-3">Committee</th>
                            <th className="py-2.5 px-3">Purok</th>
                            <th className="py-2.5 px-3">Status</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {parsedData.valid.slice(0, 50).map((row: any, i: number) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-2 px-3 font-mono text-slate-400">{i + 1}</td>
                          {entityType === 'residents' && (
                            <>
                              <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                                {row.firstName} {row.middleName || ''} {row.lastName} {row.suffix || ''}
                              </td>
                              <td className="py-2 px-3 font-mono">{row.birthDate}</td>
                              <td className="py-2 px-3 font-bold text-emerald-600">{row.age} yrs</td>
                              <td className="py-2 px-3">
                                {row.sex} • {row.civilStatus}
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[11px] font-medium">
                                  {row.purok}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px]">{row.contactNumber}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    row.voterStatus === 'Registered'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                                >
                                  {row.voterStatus}
                                </span>
                              </td>
                            </>
                          )}
                          {entityType === 'businesses' && (
                            <>
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                                {row.businessName}
                              </td>
                              <td className="py-2 px-3">{row.ownerName}</td>
                              <td className="py-2 px-3 text-[11px]">{row.category}</td>
                              <td className="py-2 px-3">{row.purok}</td>
                              <td className="py-2 px-3 font-mono">₱{Number(row.capitalInvestment).toLocaleString()}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  {row.status}
                                </span>
                              </td>
                            </>
                          )}
                          {entityType === 'households' && (
                            <>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-600">{row.householdNo}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{row.headName}</td>
                              <td className="py-2 px-3">{row.purok}</td>
                              <td className="py-2 px-3">{row.housingType}</td>
                              <td className="py-2 px-3 font-mono">₱{Number(row.monthlyHouseholdIncome).toLocaleString()}</td>
                            </>
                          )}
                          {entityType === 'blotter' && (
                            <>
                              <td className="py-2 px-3 font-mono font-bold text-rose-600">{row.blotterNo}</td>
                              <td className="py-2 px-3 font-semibold">{row.incidentType}</td>
                              <td className="py-2 px-3">{row.complainantName}</td>
                              <td className="py-2 px-3 text-rose-600">{row.respondentName}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  {row.status}
                                </span>
                              </td>
                            </>
                          )}
                          {entityType === 'officials' && (
                            <>
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{row.name}</td>
                              <td className="py-2 px-3 font-medium text-purple-600">{row.position}</td>
                              <td className="py-2 px-3 text-[11px]">{row.committee}</td>
                              <td className="py-2 px-3">{row.purok}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  {row.status}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Incomplete / Error Rows Warning */}
              {parsedData.invalid.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <div className="font-bold">
                      {parsedData.invalid.length} row(s) were skipped due to missing required data:
                    </div>
                    <div className="text-[11px] mt-0.5">
                      Rows lacking critical names or fields will be automatically excluded. Only the{' '}
                      <strong>{parsedData.valid.length} valid records</strong> will be registered.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Success State */}
          {step === 'success' && (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg animate-in zoom-in-75 duration-300">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Data Successfully Imported & Allocated!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  <strong className="text-emerald-600 font-extrabold text-base">{importCount}</strong> new{' '}
                  {entityMetadata[entityType].label} records have been officially registered into the Barangay Sangkol system.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 max-w-md mx-auto text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{entityMetadata[entityType].label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Records Registered:</span>
                  <span className="font-bold text-emerald-600">+{importCount} entries</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dynamic Calculations:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Ages & IDs Synced</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Audit Trail:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Logged to Security Ledger</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            {step === 'preview' && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Back to File Selection
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step !== 'success' ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                {step === 'preview' && (
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isImporting || parsedData.valid.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Registering Records...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Import & Register {parsedData.valid.length} Records
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handleReset();
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Done & View Records
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
