import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useBarangay } from '../context/BarangayContext';
import {
  ImportEntityType,
  parseWorkbook,
  autoDetectHeaderRow,
  autoMatchColumns,
  processMappedRowsToResidents,
  ColumnMappingInfo,
  WorkbookParseResult,
  SmartResidentImportResult,
  RESIDENT_FIELD_DEFINITIONS,
  ResidentFieldKey,
  mapRowsToBusinesses,
  mapRowsToHouseholds,
  mapRowsToBlotter,
  mapRowsToOfficials,
  downloadSampleTemplate,
  cleanSpreadsheetValue,
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
  Users,
  Building2,
  Home,
  ShieldAlert,
  Award,
  RefreshCw,
  Eye,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  Sliders,
  Copy,
  Table,
  ArrowRight,
  ArrowLeft,
  Info,
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
    residents,
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
  const defaultPurok = settings.puroks[0] || 'Purok Pinya';

  // Smart Multi-Sheet & Column Mapping State for Residents
  const [workbookResult, setWorkbookResult] = useState<WorkbookParseResult | null>(null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);
  const [headerRowNumber, setHeaderRowNumber] = useState<number>(1); // 1-based display
  const [detectedScore, setDetectedScore] = useState<number>(0);
  const [columnMappings, setColumnMappings] = useState<ColumnMappingInfo[]>([]);
  const [smartResult, setSmartResult] = useState<SmartResidentImportResult>({
    validRecords: [],
    skippedRecords: [],
    missingBirthDateRecords: [],
    totalRows: 0,
  });

  // Duplicate resolution for residents: 'skip' | 'update' | 'import_anyway'
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'update' | 'import_anyway'>('skip');
  const [showSkippedDetails, setShowSkippedDetails] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number; message: string } | null>(null);
  const [importSummary, setImportSummary] = useState<{ addedCount: number; updatedCount: number; skippedDuplicates: number }>({
    addedCount: 0,
    updatedCount: 0,
    skippedDuplicates: 0,
  });

  // Legacy parser state for other entities
  const [legacyParsedData, setLegacyParsedData] = useState<{
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

  // Steps:
  // For Residents: 'upload' -> 'mapping' -> 'validation' -> 'success'
  // For Others: 'upload' -> 'legacy_preview' -> 'success'
  const [step, setStep] = useState<'upload' | 'mapping' | 'validation' | 'legacy_preview' | 'success'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial entity if modal reopened
  useEffect(() => {
    if (isOpen) {
      setEntityType(initialEntity);
    }
  }, [isOpen, initialEntity]);

  const entityMetadata: Record<
    ImportEntityType,
    { label: string; icon: React.ReactNode; color: string; desc: string }
  > = {
    residents: {
      label: 'Residents Civil Registry',
      icon: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      color: 'emerald',
      desc: 'Smart Import: Multi-sheet picker, auto-header scan, 3-tier column matching, sector tags & duplicate resolution.',
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

  // ----------------------------------------------------
  // File Upload & Parsing Handler
  // ----------------------------------------------------

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processUploadedFile(selectedFile);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processUploadedFile(droppedFile);
  };

  const processUploadedFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsParsing(true);
    setParseError(null);

    try {
      const wb = await parseWorkbook(uploadedFile);
      if (!wb.sheets || wb.sheets.length === 0) {
        setParseError('The uploaded file appears to be empty or has no readable sheets.');
        setIsParsing(false);
        return;
      }

      setWorkbookResult(wb);
      const initialSheetIdx = wb.defaultSheetIndex;
      setSelectedSheetIndex(initialSheetIdx);

      if (entityType === 'residents') {
        // Initialize Smart Import workflow for residents
        initializeSheetAnalysis(wb.sheets[initialSheetIdx].data);
        setStep('mapping');
      } else {
        // Legacy workflow for other entities
        initializeLegacyEntity(wb.sheets[initialSheetIdx].data, entityType);
        setStep('legacy_preview');
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParseError(
        `Failed to parse file: ${err?.message || 'Invalid format'}. Please ensure the file is a valid .xlsx, .xls, or .csv spreadsheet.`
      );
    } finally {
      setIsParsing(false);
    }
  };

  /**
   * Initializes header detection, column matching, and preview for a sheet
   */
  const initializeSheetAnalysis = (sheetData: any[][], overrideHeader1Based?: number) => {
    if (!sheetData || sheetData.length === 0) return;

    let headerIdx = 0;
    let score = 0;
    let headers: string[] = [];

    if (overrideHeader1Based !== undefined && overrideHeader1Based >= 1) {
      headerIdx = Math.max(0, Math.min(sheetData.length - 1, overrideHeader1Based - 1));
      const targetRow = sheetData[headerIdx] || [];
      headers = targetRow.map((c, i) => cleanSpreadsheetValue(c) || `Column ${String.fromCharCode(65 + (i % 26))}`);
      score = 50; // manual override score
    } else {
      const detected = autoDetectHeaderRow(sheetData);
      headerIdx = detected.headerRowIndex;
      score = detected.score;
      headers = detected.candidateHeaders;
    }

    setHeaderRowNumber(headerIdx + 1);
    setDetectedScore(score);

    // Extract sample data rows (rows immediately following header)
    const sampleRows = sheetData.slice(headerIdx + 1, headerIdx + 6);
    const mappings = autoMatchColumns(headers, sampleRows);
    setColumnMappings(mappings);

    // Initial parsing
    const res = processMappedRowsToResidents(sheetData, headerIdx, mappings, defaultPurok);
    setSmartResult(res);
  };

  /**
   * Handles switching sheet in multi-sheet workbooks
   */
  const handleSheetChange = (newSheetIndex: number) => {
    if (!workbookResult || !workbookResult.sheets[newSheetIndex]) return;
    setSelectedSheetIndex(newSheetIndex);
    const targetSheet = workbookResult.sheets[newSheetIndex];

    if (entityType === 'residents') {
      initializeSheetAnalysis(targetSheet.data);
    } else {
      initializeLegacyEntity(targetSheet.data, entityType);
    }
  };

  /**
   * Handles manually overriding the detected header row number
   */
  const handleHeaderRowOverride = (newRow1Based: number) => {
    if (!workbookResult || !workbookResult.sheets[selectedSheetIndex]) return;
    const clampedRow = Math.max(1, Math.min(25, newRow1Based));
    initializeSheetAnalysis(workbookResult.sheets[selectedSheetIndex].data, clampedRow);
  };

  /**
   * Updates mapping for an individual column with collision avoidance
   */
  const handleColumnMappingChange = (colIndex: number, newField: ResidentFieldKey | '') => {
    if (!workbookResult || !workbookResult.sheets[selectedSheetIndex]) return;

    setColumnMappings((prevMappings) => {
      const updated: ColumnMappingInfo[] = prevMappings.map((m) => {
        // If another column already had this field, unmap it to enforce 1-to-1 mapping
        if (newField && m.matchedField === newField && m.columnIndex !== colIndex) {
          return { ...m, matchedField: '' as const, confidence: 'none' as const };
        }
        if (m.columnIndex === colIndex) {
          return {
            ...m,
            matchedField: newField,
            confidence: (newField ? 'high' : 'none') as ColumnMappingInfo['confidence'],
          };
        }
        return m;
      });

      // Re-run processor with new mappings
      const res = processMappedRowsToResidents(
        workbookResult.sheets[selectedSheetIndex].data,
        headerRowNumber - 1,
        updated,
        defaultPurok
      );
      setSmartResult(res);

      return updated;
    });
  };

  /**
   * Reset mappings to automatic recommendations
   */
  const handleResetToAutoMatches = () => {
    if (!workbookResult || !workbookResult.sheets[selectedSheetIndex]) return;
    initializeSheetAnalysis(workbookResult.sheets[selectedSheetIndex].data, headerRowNumber);
  };

  /**
   * Unmaps all columns
   */
  const handleClearAllMappings = () => {
    if (!workbookResult || !workbookResult.sheets[selectedSheetIndex]) return;
    setColumnMappings((prev) => {
      const cleared = prev.map((m) => ({ ...m, matchedField: '' as const, confidence: 'none' as const }));
      const res = processMappedRowsToResidents(
        workbookResult.sheets[selectedSheetIndex].data,
        headerRowNumber - 1,
        cleared,
        defaultPurok
      );
      setSmartResult(res);
      return cleared;
    });
  };

  // ----------------------------------------------------
  // Legacy parsing for other entities
  // ----------------------------------------------------
  const initializeLegacyEntity = (sheetData: any[][], type: ImportEntityType) => {
    // Convert 2D array to row objects using row 0 as header
    if (!sheetData || sheetData.length < 2) {
      setLegacyParsedData({ valid: [], invalid: [], total: 0, warnings: [] });
      return;
    }
    const headers = sheetData[0].map((c) => String(c || '').trim());
    const rawObjs = sheetData.slice(1).map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => {
        if (h) obj[h] = row[i];
      });
      return obj;
    });

    if (type === 'businesses') {
      const res = mapRowsToBusinesses(rawObjs, defaultPurok);
      setLegacyParsedData({ valid: res.validRecords, invalid: res.invalidRecords, total: res.totalRows, warnings: res.warnings });
    } else if (type === 'households') {
      const res = mapRowsToHouseholds(rawObjs, defaultPurok);
      setLegacyParsedData({ valid: res.validRecords, invalid: res.invalidRecords, total: res.totalRows, warnings: res.warnings });
    } else if (type === 'blotter') {
      const res = mapRowsToBlotter(rawObjs, defaultPurok);
      setLegacyParsedData({ valid: res.validRecords, invalid: res.invalidRecords, total: res.totalRows, warnings: res.warnings });
    } else if (type === 'officials') {
      const res = mapRowsToOfficials(rawObjs, defaultPurok);
      setLegacyParsedData({ valid: res.validRecords, invalid: res.invalidRecords, total: res.totalRows, warnings: res.warnings });
    }
  };

  // ----------------------------------------------------
  // Duplicate Resident Detection
  // ----------------------------------------------------
  const makeCanonicalKey = (lname?: string, fname?: string, bdate?: string) =>
    `${(lname || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '')}|${(fname || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '')}|${bdate || ''}`;

  const existingResidentKeyMap = useMemo(() => {
    const map = new Map<string, typeof residents[0]>();
    residents.forEach((r) => {
      const k = makeCanonicalKey(r.lastName, r.firstName, r.birthDate);
      if (k) map.set(k, r);
    });
    return map;
  }, [residents]);

  const duplicateMatches = useMemo(() => {
    if (entityType !== 'residents') return [];
    return smartResult.validRecords.filter((rec) => {
      const k = makeCanonicalKey(rec.lastName, rec.firstName, rec.birthDate);
      return existingResidentKeyMap.has(k);
    });
  }, [smartResult.validRecords, existingResidentKeyMap, entityType]);

  // ----------------------------------------------------
  // Execution of Bulk Import
  // ----------------------------------------------------
  const handleExecuteImport = async () => {
    setIsImporting(true);
    setParseError(null);

    try {
      if (entityType === 'residents') {
        if (smartResult.validRecords.length === 0) return;

        setBatchProgress({
          completed: 0,
          total: smartResult.validRecords.length,
          message: 'Preparing 500-record batch queue...',
        });

        const res = await bulkImportResidents(smartResult.validRecords, {
          duplicateMode,
          onProgress: (completed, total, message) => {
            setBatchProgress({ completed, total, message });
          },
        });

        const skippedDupes = duplicateMode === 'skip' ? duplicateMatches.length : 0;
        setImportSummary({
          addedCount: res.addedCount,
          updatedCount: res.updatedCount || 0,
          skippedDuplicates: skippedDupes,
        });

        setStep('success');

        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {
          // safe fallback
        }

        if (onImportComplete) {
          onImportComplete(res.addedCount, 'residents');
        }
      } else {
        // Legacy Entities
        if (legacyParsedData.valid.length === 0) return;

        let count = 0;
        if (entityType === 'businesses') {
          const res = await bulkImportBusinesses(legacyParsedData.valid);
          count = res.addedCount;
        } else if (entityType === 'households') {
          const res = await bulkImportHouseholds(legacyParsedData.valid);
          count = res.addedCount;
        } else if (entityType === 'blotter') {
          const res = await bulkImportBlotter(legacyParsedData.valid);
          count = res.addedCount;
        } else if (entityType === 'officials') {
          const res = await bulkImportOfficials(legacyParsedData.valid);
          count = res.addedCount;
        }

        setImportSummary({
          addedCount: count,
          updatedCount: 0,
          skippedDuplicates: 0,
        });
        setStep('success');

        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // safe fallback
        }

        if (onImportComplete) {
          onImportComplete(count, entityType);
        }
      }
    } catch (err: any) {
      console.error('Import execution error:', err);
      setParseError(`Failed to save records: ${err?.message || 'Database connection error'}`);
    } finally {
      setIsImporting(false);
      setBatchProgress(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setWorkbookResult(null);
    setSelectedSheetIndex(0);
    setHeaderRowNumber(1);
    setColumnMappings([]);
    setSmartResult({ validRecords: [], skippedRecords: [], missingBirthDateRecords: [], totalRows: 0 });
    setLegacyParsedData({ valid: [], invalid: [], total: 0, warnings: [] });
    setParseError(null);
    setStep('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Group resident field definitions by category for structured dropdowns
  const groupedFieldDefinitions = useMemo(() => {
    const groups: Record<string, typeof RESIDENT_FIELD_DEFINITIONS> = {
      'Core Identity': RESIDENT_FIELD_DEFINITIONS.filter((f) => f.category === 'identity'),
      'Demographics': RESIDENT_FIELD_DEFINITIONS.filter((f) => f.category === 'demographics'),
      'Address & Location': RESIDENT_FIELD_DEFINITIONS.filter((f) => f.category === 'address'),
      'Socioeconomic': RESIDENT_FIELD_DEFINITIONS.filter((f) => f.category === 'socioeconomic'),
      'Sectoral & Special Tags': RESIDENT_FIELD_DEFINITIONS.filter((f) => f.category === 'sectoral'),
      'System & Status': RESIDENT_FIELD_DEFINITIONS.filter((f) => f.category === 'system'),
    };
    return groups;
  }, []);

  const selectedSheet = workbookResult?.sheets[selectedSheetIndex];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Smart Spreadsheet Importer
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Universal RBI & Civil Registry
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supports multi-sheet workbooks, banner skip, 3-tier column matching, sector flags, and 500-record batch sync.
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

        {/* Step Indicator Bar */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto">
            <div
              className={`flex items-center gap-1.5 shrink-0 ${
                step === 'upload'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center bg-current text-white font-bold text-[10px]">
                1
              </span>
              <span>Upload & Sheet</span>
            </div>

            {entityType === 'residents' && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                <div
                  className={`flex items-center gap-1.5 shrink-0 ${
                    step === 'mapping'
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center bg-current text-white font-bold text-[10px]">
                    2
                  </span>
                  <span>Smart Column Mapping</span>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                <div
                  className={`flex items-center gap-1.5 shrink-0 ${
                    step === 'validation'
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center bg-current text-white font-bold text-[10px]">
                    3
                  </span>
                  <span>Validation & Duplicates</span>
                </div>
              </>
            )}

            {entityType !== 'residents' && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                <div
                  className={`flex items-center gap-1.5 shrink-0 ${
                    step === 'legacy_preview'
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center bg-current text-white font-bold text-[10px]">
                    2
                  </span>
                  <span>Review & Allocations</span>
                </div>
              </>
            )}

            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            <div
              className={`flex items-center gap-1.5 shrink-0 ${
                step === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center bg-current text-white font-bold text-[10px]">
                {entityType === 'residents' ? '4' : '3'}
              </span>
              <span>Import Completed</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Download Template:</span>
            <button
              type="button"
              onClick={() => downloadSampleTemplate(entityType, 'xlsx')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              .XLSX
            </button>
            <button
              type="button"
              onClick={() => downloadSampleTemplate(entityType, 'csv')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              .CSV
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">

          {/* ==================================================== */}
          {/* STEP 1: Upload & Target Module Selection              */}
          {/* ==================================================== */}
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
                        onClick={() => {
                          setEntityType(key);
                          if (workbookResult) {
                            const sheet = workbookResult.sheets[selectedSheetIndex];
                            if (key === 'residents') {
                              initializeSheetAnalysis(sheet.data);
                            } else {
                              initializeLegacyEntity(sheet.data, key);
                            }
                          }
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-xs'
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
                  Upload Excel or CSV File (Works with Any Layout & Multi-Sheet Workbooks):
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
                      Accepts standard formats (<code className="text-emerald-600 font-mono font-bold">.xlsx, .xls, .csv</code>) including multi-sheet files like Registry of Barangay Inhabitants (RBI)
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <span className="text-[11px] px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-full font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Auto-Header Scan (First 25 Rows)
                    </span>
                    <span className="text-[11px] px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full font-medium flex items-center gap-1">
                      <Layers className="w-3 h-3 text-blue-600" />
                      Multi-Sheet Picker
                    </span>
                    <span className="text-[11px] px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded-full font-medium flex items-center gap-1">
                      <Copy className="w-3 h-3 text-purple-600" />
                      Duplicate Checker
                    </span>
                  </div>
                </div>
              </div>

              {/* Parsing Progress Indicator */}
              {isParsing && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-3 text-blue-700 dark:text-blue-300 text-xs font-medium animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  Scanning workbook sheets, identifying headers, and establishing smart column mappings...
                </div>
              )}

              {/* Error Alert */}
              {parseError && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold">Error reading spreadsheet:</div>
                    <div>{parseError}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* STEP 2 (RESIDENTS): Smart Column Mapping & Preview    */}
          {/* ==================================================== */}
          {step === 'mapping' && entityType === 'residents' && workbookResult && (
            <div className="space-y-6">
              
              {/* Sheet Picker & Header Row Config Banner */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Sheet Selector (Feature 1) */}
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      Select Worksheet to Import:
                      {workbookResult.sheets.length > 1 && (
                        <span className="text-[10px] font-normal px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
                          {workbookResult.sheets.length} Sheets Found
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedSheetIndex}
                      onChange={(e) => handleSheetChange(parseInt(e.target.value, 10))}
                      className="w-full text-xs font-medium py-2 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      {workbookResult.sheets.map((sheet, idx) => (
                        <option key={idx} value={idx}>
                          {sheet.name} — ({sheet.nonEmptyRowCount} data rows)
                          {idx === workbookResult.defaultSheetIndex ? ' [Auto-Selected: Most Rows]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Header Row Auto-Detect & Override (Feature 2) */}
                  <div className="sm:w-64">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      Detected Header Row:
                      <span className="text-[10px] font-normal text-slate-500">
                        (Scanned first 25)
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={headerRowNumber}
                          onChange={(e) => handleHeaderRowOverride(parseInt(e.target.value, 10))}
                          className="w-full text-xs font-semibold py-2 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        >
                          {Array.from({ length: Math.min(25, selectedSheet?.rowCount || 25) }, (_, i) => i + 1).map((rNum) => (
                            <option key={rNum} value={rNum}>
                              Row {rNum} {rNum === headerRowNumber ? '(Current Header)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span className="text-[11px] px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono text-center font-bold">
                        {detectedScore > 0 ? `Score: ${detectedScore}` : 'Manual'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2.5">
                  <span>
                    Rows above Row {headerRowNumber} (such as municipal headers, titles, and blank cells) are automatically skipped.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetToAutoMatches}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      Reset to Auto Matches
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleClearAllMappings}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline cursor-pointer"
                    >
                      Ignore All
                    </button>
                  </div>
                </div>
              </div>

              {/* Column Mapping Table (Feature 3 & 4) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-600" />
                    Spreadsheet Column Mapping:
                    <span className="text-slate-400 font-normal">
                      ({columnMappings.filter((c) => c.matchedField).length} of {columnMappings.length} columns mapped)
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Each BIMS field can only be mapped to one spreadsheet column.
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-44">Spreadsheet Column</th>
                        <th className="py-2.5 px-3">Sample Data (Row {headerRowNumber + 1}+)</th>
                        <th className="py-2.5 px-3 w-64">Target BIMS Resident Field</th>
                        <th className="py-2.5 px-3 w-28 text-center">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {columnMappings.map((col) => (
                        <tr
                          key={col.columnIndex}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                            col.matchedField ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/20 opacity-80'
                          }`}
                        >
                          {/* Column Name */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                                {col.columnLetter}
                              </span>
                              <span className="truncate max-w-[140px]" title={col.originalHeader}>
                                {col.originalHeader}
                              </span>
                            </div>
                          </td>

                          {/* Sample Values */}
                          <td className="py-2.5 px-3">
                            {col.sampleValues.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {col.sampleValues.slice(0, 3).map((val, vIdx) => (
                                  <span
                                    key={vIdx}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] truncate max-w-[130px]"
                                    title={val}
                                  >
                                    {val}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">— No sample data —</span>
                            )}
                          </td>

                          {/* Mapped Field Dropdown */}
                          <td className="py-2.5 px-3">
                            <select
                              value={col.matchedField}
                              onChange={(e) => handleColumnMappingChange(col.columnIndex, e.target.value as ResidentFieldKey | '')}
                              className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all focus:outline-hidden ${
                                col.matchedField
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500'
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                              }`}
                            >
                              <option value="">-- Ignore / Do Not Import --</option>
                              {Object.entries(groupedFieldDefinitions).map(([groupTitle, fields]) => (
                                <optgroup key={groupTitle} label={groupTitle}>
                                  {fields.map((f) => (
                                    <option key={f.key} value={f.key}>
                                      {f.label}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </td>

                          {/* Confidence Badge */}
                          <td className="py-2.5 px-3 text-center">
                            {col.confidence === 'high' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                High
                              </span>
                            )}
                            {col.confidence === 'medium' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Medium
                              </span>
                            )}
                            {col.confidence === 'low' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                Fuzzy
                              </span>
                            )}
                            {col.confidence === 'none' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                Ignored
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live 5-Row Data Preview (Feature 4) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    Live Data Preview (First 5 Rows As They Will Be Registered):
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Live updates when you change any column mapping above.
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-3 w-10">#</th>
                        <th className="py-2 px-3">Full Name</th>
                        <th className="py-2 px-3">Birth Date & Age</th>
                        <th className="py-2 px-3">Sex / Civil</th>
                        <th className="py-2 px-3">Purok</th>
                        <th className="py-2 px-3">Sector Flags</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {smartResult.validRecords.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                            {row.firstName} {row.middleName ? `${row.middleName} ` : ''}{row.lastName} {row.suffix || ''}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-mono text-[11px]">{row.birthDate}</span>
                            <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {row.age} yrs
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {row.sex} • {row.civilStatus}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-[11px]">
                              {row.purok}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex flex-wrap gap-1">
                              {row.isSeniorCitizen && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">Senior</span>
                              )}
                              {row.isPWD && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800">PWD</span>
                              )}
                              {row.is4PsBeneficiary && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">4Ps</span>
                              )}
                              {row.isSoloParent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800">Solo Parent</span>
                              )}
                              {row.voterStatus === 'Registered' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">Voter</span>
                              )}
                              {!row.isSeniorCitizen && !row.isPWD && !row.is4PsBeneficiary && !row.isSoloParent && row.voterStatus !== 'Registered' && (
                                <span className="text-slate-400 italic text-[11px]">None</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.residentStatus === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.residentStatus === 'Deceased'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {row.residentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {smartResult.validRecords.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                            No valid resident records could be formed. Please map at least First Name or Last Name above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* STEP 3 (RESIDENTS): Validation, Duplicates & Import   */}
          {/* ==================================================== */}
          {step === 'validation' && entityType === 'residents' && (
            <div className="space-y-6">

              {/* Validation Summary Cards (Feature 8) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Rows Found</div>
                  <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
                    {smartResult.totalRows}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Below Header Row {headerRowNumber}</div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30">
                  <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Ready to Register</div>
                  <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                    {smartResult.validRecords.length}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Valid name records</div>
                </div>

                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30">
                  <div className="text-[11px] font-medium text-rose-700 dark:text-rose-300">Skipped Rows</div>
                  <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">
                    {smartResult.skippedRecords.length}
                  </div>
                  <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">Missing both names or blank</div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30">
                  <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Missing Birth Dates</div>
                  <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">
                    {smartResult.missingBirthDateRecords.length}
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Age calculated or defaulted</div>
                </div>
              </div>

              {/* Duplicate Check & Resolution (Feature 9) */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Copy className="w-4 h-4 text-indigo-600" />
                    Duplicate Record Verification:
                    {duplicateMatches.length > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {duplicateMatches.length} Matches Found
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                        No Duplicates Detected
                      </span>
                    )}
                  </h4>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compared against existing registered residents by <strong>Last Name + First Name + Birth Date</strong>. Select how matches should be handled:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      duplicateMode === 'skip'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="duplicateMode"
                      value="skip"
                      checked={duplicateMode === 'skip'}
                      onChange={() => setDuplicateMode('skip')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Skip Duplicates (Recommended)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Imports only {smartResult.validRecords.length - duplicateMatches.length} new residents. Existing records stay untouched.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      duplicateMode === 'update'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="duplicateMode"
                      value="update"
                      checked={duplicateMode === 'update'}
                      onChange={() => setDuplicateMode('update')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Update Existing Records
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Updates {duplicateMatches.length} existing residents with new spreadsheet data, plus imports new entries.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      duplicateMode === 'import_anyway'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="duplicateMode"
                      value="import_anyway"
                      checked={duplicateMode === 'import_anyway'}
                      onChange={() => setDuplicateMode('import_anyway')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Import Anyway
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Imports all {smartResult.validRecords.length} records as fresh residents with new generated IDs.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Skipped Rows Accordion */}
              {smartResult.skippedRecords.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowSkippedDetails(!showSkippedDetails)}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      View {smartResult.skippedRecords.length} Skipped Row(s) and Specific Reasons
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        showSkippedDetails ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showSkippedDetails && (
                    <div className="max-h-48 overflow-y-auto p-3 text-xs bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-[11px]">
                      {smartResult.skippedRecords.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-rose-600">Row {item.row}:</span>
                          <span className="text-slate-600 dark:text-slate-400">{item.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Batch Import Progress Bar (Feature 10) */}
              {isImporting && (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      Saving in Batches of 500 Records to Database...
                    </span>
                    <span>
                      {batchProgress ? `${Math.round((batchProgress.completed / Math.max(1, batchProgress.total)) * 100)}%` : '0%'}
                    </span>
                  </div>

                  <div className="w-full h-3 bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300 ease-out"
                      style={{
                        width: `${batchProgress ? Math.round((batchProgress.completed / Math.max(1, batchProgress.total)) * 100) : 10}%`,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                    {batchProgress?.message || 'Allocating non-colliding resident serial IDs...'}
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ==================================================== */}
          {/* STEP 2 (LEGACY): Other Entities Preview               */}
          {/* ==================================================== */}
          {step === 'legacy_preview' && entityType !== 'residents' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[11px] font-medium text-slate-500">File Name</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {file?.name || 'Spreadsheet'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[11px] font-medium text-slate-500">Target Module</div>
                  <div className="text-sm font-bold text-emerald-600 truncate mt-0.5">
                    {entityMetadata[entityType].label}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30">
                  <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Ready to Register</div>
                  <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {legacyParsedData.valid.length} <span className="text-xs font-normal">records</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30">
                  <div className="text-[11px] font-medium text-rose-700 dark:text-rose-300">Incomplete Rows</div>
                  <div className="text-xl font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">
                    {legacyParsedData.invalid.length} <span className="text-xs font-normal">rows</span>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      {entityType === 'businesses' && (
                        <>
                          <th className="py-2.5 px-3">Business Name</th>
                          <th className="py-2.5 px-3">Proprietor</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Purok</th>
                          <th className="py-2.5 px-3">Status</th>
                        </>
                      )}
                      {entityType === 'households' && (
                        <>
                          <th className="py-2.5 px-3">HH No</th>
                          <th className="py-2.5 px-3">Household Head</th>
                          <th className="py-2.5 px-3">Purok</th>
                          <th className="py-2.5 px-3">Housing</th>
                        </>
                      )}
                      {entityType === 'blotter' && (
                        <>
                          <th className="py-2.5 px-3">Blotter No</th>
                          <th className="py-2.5 px-3">Incident Type</th>
                          <th className="py-2.5 px-3">Complainant</th>
                          <th className="py-2.5 px-3">Status</th>
                        </>
                      )}
                      {entityType === 'officials' && (
                        <>
                          <th className="py-2.5 px-3">Official Name</th>
                          <th className="py-2.5 px-3">Position</th>
                          <th className="py-2.5 px-3">Committee</th>
                          <th className="py-2.5 px-3">Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {legacyParsedData.valid.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-3 font-mono text-slate-400">{i + 1}</td>
                        {entityType === 'businesses' && (
                          <>
                            <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{row.businessName}</td>
                            <td className="py-2 px-3">{row.ownerName}</td>
                            <td className="py-2 px-3">{row.category}</td>
                            <td className="py-2 px-3">{row.purok}</td>
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
                          </>
                        )}
                        {entityType === 'blotter' && (
                          <>
                            <td className="py-2 px-3 font-mono font-bold text-rose-600">{row.blotterNo}</td>
                            <td className="py-2 px-3 font-semibold">{row.incidentType}</td>
                            <td className="py-2 px-3">{row.complainantName}</td>
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
                            <td className="py-2 px-3">{row.committee}</td>
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
          )}

          {/* ==================================================== */}
          {/* STEP 4: Success State (All Entities)                 */}
          {/* ==================================================== */}
          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg animate-in zoom-in-75 duration-300">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Data Successfully Imported & Synchronized!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Spreadsheet records have been officially parsed, validated, and registered into the Barangay civil registry database.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination Module:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{entityMetadata[entityType].label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">New Records Registered:</span>
                  <span className="font-bold text-emerald-600">+{importSummary.addedCount} new entries</span>
                </div>
                {importSummary.updatedCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Existing Records Updated:</span>
                    <span className="font-bold text-blue-600">{importSummary.updatedCount} updated</span>
                  </div>
                )}
                {importSummary.skippedDuplicates > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duplicates Skipped:</span>
                    <span className="font-bold text-amber-600">{importSummary.skippedDuplicates} skipped</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Supabase Batches:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">500 Records / Chunk</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Non-Colliding ID Sequences:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">BS-RES-2026-XXXX Active</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            {step === 'mapping' && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change File
              </button>
            )}

            {step === 'validation' && (
              <button
                type="button"
                onClick={() => setStep('mapping')}
                disabled={isImporting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Column Mapping
              </button>
            )}

            {step === 'legacy_preview' && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                  disabled={isImporting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {step === 'mapping' && (
                  <button
                    type="button"
                    onClick={() => setStep('validation')}
                    disabled={smartResult.validRecords.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <span>Proceed to Review & Duplicates</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {step === 'validation' && (
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isImporting || smartResult.validRecords.length === 0}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Uploading in 500 Batches...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Execute Smart Import ({smartResult.validRecords.length} Records)
                      </>
                    )}
                  </button>
                )}

                {step === 'legacy_preview' && (
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isImporting || legacyParsedData.valid.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Import & Register {legacyParsedData.valid.length} Records
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
                Done & View Registered Records
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
