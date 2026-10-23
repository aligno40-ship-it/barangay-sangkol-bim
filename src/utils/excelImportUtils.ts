/**
 * Excel & CSV Importer Engine
 * Supports .xlsx, .xls, .csv and .json bulk imports with intelligent column auto-detection,
 * validation, age calculation, default sanitization, and downloadable sample templates.
 */

import * as XLSX from 'xlsx';
import {
  Resident,
  BusinessRecord,
  Household,
  BlotterRecord,
  BarangayOfficial,
  ComplaintRecord,
  Sex,
  CivilStatus,
  ResidentStatus,
} from '../types';
import { calculateAge } from './ageUtils';

export type ImportEntityType =
  | 'residents'
  | 'businesses'
  | 'households'
  | 'blotter'
  | 'officials'
  | 'complaints';

export interface ImportValidationResult<T> {
  validRecords: T[];
  invalidRecords: { row: number; data: any; errors: string[] }[];
  totalRows: number;
  warnings: string[];
}

export type ResidentFieldKey =
  | 'lastName'
  | 'firstName'
  | 'middleName'
  | 'suffix'
  | 'fullName'
  | 'birthDate'
  | 'age'
  | 'sex'
  | 'civilStatus'
  | 'purok'
  | 'streetAddress'
  | 'contactNumber'
  | 'email'
  | 'occupation'
  | 'monthlyIncome'
  | 'citizenship'
  | 'religion'
  | 'bloodType'
  | 'educationalAttainment'
  | 'voterStatus'
  | 'precinctNo'
  | 'isSeniorCitizen'
  | 'isPWD'
  | 'pwdType'
  | 'is4PsBeneficiary'
  | 'isSoloParent'
  | 'isIndigent'
  | 'isYouth'
  | 'isOutofSchoolYouth'
  | 'isHouseholdHead'
  | 'householdNo'
  | 'residentStatus'
  | 'remarks'
  | 'emergencyContactName'
  | 'emergencyContactNumber';

export interface ResidentFieldDefinition {
  key: ResidentFieldKey;
  label: string;
  category: 'identity' | 'demographics' | 'address' | 'socioeconomic' | 'sectoral' | 'system';
  synonyms: string[];
}

export interface ColumnMappingInfo {
  columnIndex: number;
  columnLetter: string;
  originalHeader: string;
  matchedField: ResidentFieldKey | '';
  confidence: 'high' | 'medium' | 'low' | 'none';
  sampleValues: string[];
}

export interface ParsedSheetInfo {
  name: string;
  rowCount: number;
  nonEmptyRowCount: number;
  data: any[][];
}

export interface WorkbookParseResult {
  fileName: string;
  sheets: ParsedSheetInfo[];
  defaultSheetIndex: number;
}

export interface SmartResidentImportResult {
  validRecords: (Omit<Resident, 'id' | 'dateRegistered' | 'updatedAt'> & { originalRowIndex: number })[];
  skippedRecords: { row: number; data: any; reason: string }[];
  missingBirthDateRecords: { row: number; name: string }[];
  totalRows: number;
}

// ----------------------------------------------------
// Canonical Field Definitions & Synonym Dictionaries
// ----------------------------------------------------

export const RESIDENT_FIELD_DEFINITIONS: ResidentFieldDefinition[] = [
  {
    key: 'lastName',
    label: 'Last Name / Surname',
    category: 'identity',
    synonyms: ['lastname', 'last name', 'surname', 'family name', 'apelyido', 'last', 'lname', 'sur name', 'familyname'],
  },
  {
    key: 'firstName',
    label: 'First Name / Given Name',
    category: 'identity',
    synonyms: ['firstname', 'first name', 'given name', 'fname', 'first', 'given', 'pangalan', 'unang pangalan'],
  },
  {
    key: 'middleName',
    label: 'Middle Name / M.I.',
    category: 'identity',
    synonyms: ['middlename', 'middle name', 'mname', 'middle', 'mid name', 'gitnang pangalan', 'mi', 'm.i.', 'm.i'],
  },
  {
    key: 'suffix',
    label: 'Name Suffix (Jr, Sr, III)',
    category: 'identity',
    synonyms: ['suffix', 'ext', 'name extension', 'extension', 'pangalan extension', 'ext.', 'jr/sr', 'qualifier'],
  },
  {
    key: 'fullName',
    label: 'Full Name (Combined)',
    category: 'identity',
    synonyms: ['fullname', 'full name', 'name', 'resident name', 'pangalan ng residente', 'complete name', 'resident'],
  },
  {
    key: 'birthDate',
    label: 'Birth Date (DOB)',
    category: 'demographics',
    synonyms: [
      'birthdate',
      'birth date',
      'dob',
      'date of birth',
      'birthday',
      'bdate',
      'petsa ng kapanganakan',
      'kapanganakan',
      'birth_date',
      'date_of_birth',
      'b-day',
      'bday',
      'birth',
      'date of birth (yyyy-mm-dd)',
    ],
  },
  {
    key: 'age',
    label: 'Age',
    category: 'demographics',
    synonyms: ['age', 'edad', 'current age', 'taon', 'age (yrs)'],
  },
  {
    key: 'sex',
    label: 'Sex / Gender',
    category: 'demographics',
    synonyms: ['sex', 'gender', 'kasarian', 'm/f', 'male/female', 'sex/gender', 'gender/sex'],
  },
  {
    key: 'civilStatus',
    label: 'Civil Status / Marital Status',
    category: 'demographics',
    synonyms: ['civilstatus', 'civil status', 'marital status', 'status', 'katayuang sibil', 'civil', 'marital', 'marstatus', 'kasal'],
  },
  {
    key: 'purok',
    label: 'Purok / Zone / Sitio',
    category: 'address',
    synonyms: ['purok', 'zone', 'sitio', 'brgy zone', 'street zone', 'purok no', 'zone no', 'prk', 'sitio/purok', 'purok/sitio', 'barangay zone', 'purok/zone', 'subdivision'],
  },
  {
    key: 'streetAddress',
    label: 'Street Address',
    category: 'address',
    synonyms: ['streetaddress', 'street address', 'address', 'house address', 'tirahan', 'street', 'house no', 'lot/blk', 'blk/lot', 'residence', 'complete address', 'home address', 'house #'],
  },
  {
    key: 'contactNumber',
    label: 'Contact Number / Mobile',
    category: 'demographics',
    synonyms: ['contactnumber', 'contact number', 'mobile', 'cellphone', 'cell phone', 'cp', 'phone', 'telephone', 'mobile number', 'contact no', 'mobile no', 'cp no', 'numero ng telepono', 'tel no'],
  },
  {
    key: 'email',
    label: 'Email Address',
    category: 'demographics',
    synonyms: ['email', 'email address', 'e-mail', 'electronic mail', 'emailaddress'],
  },
  {
    key: 'occupation',
    label: 'Occupation / Job / Work',
    category: 'socioeconomic',
    synonyms: ['occupation', 'work', 'job', 'hanapbuhay', 'trabaho', 'profession', 'employment', 'source of income', 'nature of work'],
  },
  {
    key: 'monthlyIncome',
    label: 'Monthly Income / Salary',
    category: 'socioeconomic',
    synonyms: ['monthlyincome', 'monthly income', 'income', 'salary', 'sahod', 'buwanang kita', 'kita', 'monthly salary', 'wage', 'gross income'],
  },
  {
    key: 'citizenship',
    label: 'Citizenship / Nationality',
    category: 'demographics',
    synonyms: ['citizenship', 'nationality', 'nasyonalidad', 'pagkamamamayan', 'citizen'],
  },
  {
    key: 'religion',
    label: 'Religion',
    category: 'demographics',
    synonyms: ['religion', 'relihiyon', 'religious affiliation', 'faith', 'pananampalataya'],
  },
  {
    key: 'bloodType',
    label: 'Blood Type',
    category: 'demographics',
    synonyms: ['bloodtype', 'blood type', 'blood', 'uri ng dugo', 'blood grp', 'blood group'],
  },
  {
    key: 'educationalAttainment',
    label: 'Educational Attainment',
    category: 'demographics',
    synonyms: ['educationalattainment', 'educational attainment', 'education', 'highest education', 'attainment', 'natapos na pagaaral', 'antolohiya', 'educ attainment', 'highest educational attainment'],
  },
  {
    key: 'voterStatus',
    label: 'Voter Status (Registered/Unregistered)',
    category: 'sectoral',
    synonyms: ['voterstatus', 'voter status', 'voter', 'is voter', 'registered voter', 'botante', 'precinct voter', 'registered'],
  },
  {
    key: 'precinctNo',
    label: 'Precinct No',
    category: 'sectoral',
    synonyms: ['precinctno', 'precinct no', 'precinct', 'precinct number', 'presinto', 'cluster', 'clustered precinct', 'precinct #'],
  },
  {
    key: 'isSeniorCitizen',
    label: 'Senior Citizen Flag',
    category: 'sectoral',
    synonyms: ['seniorcitizen', 'senior citizen', 'senior', 'is senior', 'sc', 'senior citizen id', '60 above', 'matanda', 'senior citizen (y/n)'],
  },
  {
    key: 'isPWD',
    label: 'PWD (Person with Disability)',
    category: 'sectoral',
    synonyms: ['pwd', 'is pwd', 'person with disability', 'disabled', 'differently abled', 'may kapansanan', 'disability', 'pwd (y/n)'],
  },
  {
    key: 'pwdType',
    label: 'PWD Disability Type',
    category: 'sectoral',
    synonyms: ['pwdtype', 'pwd type', 'disability type', 'type of disability', 'kapansanan type'],
  },
  {
    key: 'is4PsBeneficiary',
    label: '4Ps Beneficiary (Pantawid)',
    category: 'sectoral',
    synonyms: ['4ps', 'is 4ps', '4ps beneficiary', 'pantawid', 'pantawid pamilya', '4p', '4ps member', 'cct', '4ps (y/n)'],
  },
  {
    key: 'isSoloParent',
    label: 'Solo Parent Flag',
    category: 'sectoral',
    synonyms: ['soloparent', 'solo parent', 'is solo parent', 'single parent', 'nag-iisang magulang', 'solo parent (y/n)'],
  },
  {
    key: 'isIndigent',
    label: 'Indigent Flag',
    category: 'sectoral',
    synonyms: ['indigent', 'is indigent', 'indigency', 'mahirap', 'poor', 'indigent citizen', 'indigent (y/n)'],
  },
  {
    key: 'isYouth',
    label: 'Youth (15-30 yrs)',
    category: 'sectoral',
    synonyms: ['youth', 'is youth', 'kabataan', 'sk', 'youth member', 'youth (y/n)'],
  },
  {
    key: 'isOutofSchoolYouth',
    label: 'Out of School Youth (OSY)',
    category: 'sectoral',
    synonyms: ['osy', 'is osy', 'out of school youth', 'outofschoolyouth', 'hindi nag-aaral', 'osy (y/n)'],
  },
  {
    key: 'isHouseholdHead',
    label: 'Household Head',
    category: 'socioeconomic',
    synonyms: ['householdhead', 'household head', 'head', 'family head', 'punong pamilya', 'head of household', 'head of family', 'hh head'],
  },
  {
    key: 'householdNo',
    label: 'Household No / Family ID',
    category: 'socioeconomic',
    synonyms: ['householdno', 'household no', 'hh no', 'hh number', 'household id', 'family no', 'household number'],
  },
  {
    key: 'residentStatus',
    label: 'Resident Status (Active/Deceased/etc.)',
    category: 'system',
    synonyms: ['residentstatus', 'resident status', 'vital status', 'living status', 'status', 'deceased', 'active', 'transferred', 'archived'],
  },
  {
    key: 'remarks',
    label: 'Remarks / Notes',
    category: 'system',
    synonyms: ['remarks', 'notes', 'comments', 'obserbasyon', 'puna', 'description'],
  },
  {
    key: 'emergencyContactName',
    label: 'Emergency Contact Person',
    category: 'demographics',
    synonyms: ['emergencycontactname', 'emergency contact name', 'emergency contact', 'contact person', 'emergency name', 'in case of emergency', 'ice name'],
  },
  {
    key: 'emergencyContactNumber',
    label: 'Emergency Contact Number',
    category: 'demographics',
    synonyms: ['emergencycontactnumber', 'emergency contact number', 'emergency phone', 'emergency no', 'ice number', 'ice contact'],
  },
];

// Helper to convert column index to Excel column letters (0 -> 'A', 27 -> 'AB')
export function getExcelColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// ----------------------------------------------------
// Normalization & Data Cleansing Helpers
// ----------------------------------------------------

export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Clean bad data, Excel error strings, and placeholders.
 * Returns empty string for invalid placeholders (#VALUE!, #N/A, N/A, -, null, undefined).
 */
export function cleanSpreadsheetValue(val: any): string {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  if (!str) return '';

  // Excel formula error codes
  if (/^#(value!|n\/a|ref!|div\/0!|name\?|num!|null!)$/i.test(str)) {
    return '';
  }

  // Placeholder texts
  if (/^(n\/a|na|none|-|--|—|null|undefined|\.|\/)$/i.test(str)) {
    return '';
  }

  return str;
}

/**
 * Sector flag parser:
 * Treat any non-empty affirmative value (1, yes, x, check mark, true, oo) as true, empty or negative as false.
 */
export function parseSectorFlag(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val > 0;
  const cleaned = cleanSpreadsheetValue(val).toLowerCase();
  if (!cleaned) return false;
  return ['1', 'yes', 'y', 'x', '✓', '✔', 'true', 'oo', 't', 'check', 'checked', 'registered'].includes(cleaned);
}

/**
 * Flexible Date Parser:
 * Discards bogus/placeholder dates (12/30/1899, 1900-01-00, 0000-00-00, year < 1905).
 * Converts Excel serial numbers and text formats without inventing dates.
 * Returns null if no valid date is provided.
 */
export function parseFlexibleDate(val: any): string | null {
  const cleaned = cleanSpreadsheetValue(val);
  if (!cleaned) return null;

  const currentYear = new Date().getFullYear();

  // Excel numeric date serial (e.g. 32874)
  const numVal = typeof val === 'number' ? val : (parseFloat(cleaned) === Number(cleaned) ? parseFloat(cleaned) : null);
  if (numVal !== null && !isNaN(numVal) && numVal > 1000 && numVal < 80000) {
    try {
      const date = new Date(Math.round((numVal - 25569) * 86400 * 1000));
      const year = date.getUTCFullYear();
      if (year >= 1905 && year <= currentYear + 1) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      // fallback
    }
    return null;
  }

  // If Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const year = val.getFullYear();
    if (year >= 1905 && year <= currentYear + 1) {
      return val.toISOString().split('T')[0];
    }
    return null;
  }

  // Strip time component if present
  const dateStr = cleaned.split('T')[0].split(' ')[0].trim();

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (y >= 1905 && y <= currentYear + 1 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
  }

  // MM/DD/YYYY or M/D/YYYY
  const usMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (usMatch) {
    const m = parseInt(usMatch[1], 10);
    const d = parseInt(usMatch[2], 10);
    const y = parseInt(usMatch[3], 10);
    if (y >= 1905 && y <= currentYear + 1 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
  }

  // General Date.parse
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const year = d.getFullYear();
    if (year >= 1905 && year <= currentYear + 1) {
      return d.toISOString().split('T')[0];
    }
  }

  return null;
}

/**
 * Status parser:
 * If a column indicates deceased/active/transferred, map it to resident status.
 * If no such value, return defaultStatus.
 */
export function parseFlexibleStatus(val: any, defaultStatus: ResidentStatus = 'Active'): ResidentStatus {
  const cleaned = cleanSpreadsheetValue(val).toLowerCase();
  if (!cleaned) return defaultStatus;

  if (cleaned.includes('dec') || cleaned.includes('namatay') || cleaned.includes('patay')) return 'Deceased';
  if (cleaned.includes('trans') || cleaned.includes('lipat') || cleaned.includes('moved')) return 'Transferred';
  if (cleaned.includes('arch') || cleaned.includes('inact')) return 'Archived';
  if (cleaned.includes('act') || cleaned.includes('buhay') || cleaned.includes('living')) return 'Active';

  return defaultStatus;
}

function parseBoolean(val: any): boolean {
  return parseSectorFlag(val);
}

function parseNumber(val: any, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const cleaned = cleanSpreadsheetValue(val);
  if (!cleaned) return fallback;
  const numOnly = cleaned.replace(/[^0-9.-]/g, '');
  const num = parseFloat(numOnly);
  return isNaN(num) ? fallback : num;
}

function formatDateValue(val: any): string {
  const parsed = parseFlexibleDate(val);
  return parsed || '2000-01-01';
}

// ----------------------------------------------------
// Smart Multi-Sheet Workbook Parser
// ----------------------------------------------------

/**
 * Parses all sheets in an Excel or CSV file.
 * Returns sheet list with row counts and defaults to the sheet with the most non-empty rows.
 */
export async function parseWorkbook(file: File): Promise<WorkbookParseResult> {
  const fileExt = file.name.split('.').pop()?.toLowerCase();

  if (fileExt === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rowsArray = Array.isArray(parsed) ? parsed : [parsed];
    const data: any[][] = [];
    if (rowsArray.length > 0) {
      const keys = Object.keys(rowsArray[0]);
      data.push(keys);
      rowsArray.forEach((r) => {
        data.push(keys.map((k) => r[k] ?? ''));
      });
    }
    return {
      fileName: file.name,
      sheets: [{ name: 'JSON_Data', rowCount: data.length, nonEmptyRowCount: data.length, data }],
      defaultSheetIndex: 0,
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const sheets: ParsedSheetInfo[] = [];
  let maxDataRows = -1;
  let defaultSheetIndex = 0;

  workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    // Read raw 2D array of rows
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

    // Calculate non-empty row count (rows that have at least one cell with content)
    let nonEmptyCount = 0;
    data.forEach((row) => {
      if (Array.isArray(row) && row.some((cell) => cleanSpreadsheetValue(cell).length > 0)) {
        nonEmptyCount++;
      }
    });

    sheets.push({
      name: sheetName,
      rowCount: data.length,
      nonEmptyRowCount: nonEmptyCount,
      data,
    });

    if (nonEmptyCount > maxDataRows) {
      maxDataRows = nonEmptyCount;
      defaultSheetIndex = index;
    }
  });

  return {
    fileName: file.name,
    sheets,
    defaultSheetIndex: sheets.length > 0 ? defaultSheetIndex : 0,
  };
}

// ----------------------------------------------------
// Smart Header Row Auto-Detection (Scan First 25 Rows)
// ----------------------------------------------------

/**
 * Scans the first 25 rows of 2D sheet data to detect the row that best matches resident headers.
 * Skips title, summary, and blank rows above it.
 * Returns 0-based headerRowIndex and score.
 */
export function autoDetectHeaderRow(sheetData: any[][]): {
  headerRowIndex: number;
  score: number;
  candidateHeaders: string[];
} {
  if (!sheetData || sheetData.length === 0) {
    return { headerRowIndex: 0, score: 0, candidateHeaders: [] };
  }

  const maxRowsToScan = Math.min(25, sheetData.length);
  let bestRowIndex = 0;
  let highestScore = -1;

  for (let r = 0; r < maxRowsToScan; r++) {
    const row = sheetData[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    let rowScore = 0;
    let hasLastName = false;
    let hasFirstName = false;
    let matchedFieldsCount = 0;

    // Check cells in this row
    row.forEach((cell) => {
      const raw = cleanSpreadsheetValue(cell);
      if (!raw) return;

      // Penalize banner strings (e.g. "Republic of the Philippines", "Registry of Barangay Inhabitants")
      if (raw.length > 55 || /republic of the philippines|registry of|barangay sangkol|inhabitants/i.test(raw)) {
        rowScore -= 5;
        return;
      }

      const normalized = normalizeHeader(raw);
      if (!normalized) return;

      // Match against resident field definitions
      for (const field of RESIDENT_FIELD_DEFINITIONS) {
        const isMatch = field.synonyms.some((syn) => {
          const normSyn = normalizeHeader(syn);
          return normalized === normSyn || normalized.includes(normSyn) || normSyn.includes(normalized);
        });

        if (isMatch) {
          matchedFieldsCount++;
          if (field.key === 'lastName') {
            hasLastName = true;
            rowScore += 4;
          } else if (field.key === 'firstName') {
            hasFirstName = true;
            rowScore += 4;
          } else if (['birthDate', 'sex', 'purok', 'civilStatus', 'fullName'].includes(field.key)) {
            rowScore += 3;
          } else {
            rowScore += 1;
          }
          break;
        }
      }
    });

    // Substantial bonus if both first name and last name exist
    if (hasLastName && hasFirstName) {
      rowScore += 10;
    }

    if (rowScore > highestScore) {
      highestScore = rowScore;
      bestRowIndex = r;
    }
  }

  // Extract candidate headers from the best row
  const candidateRow = sheetData[bestRowIndex] || [];
  const candidateHeaders = candidateRow.map((cell, idx) => {
    const val = cleanSpreadsheetValue(cell);
    return val || `Column ${getExcelColumnLetter(idx)}`;
  });

  return {
    headerRowIndex: bestRowIndex,
    score: Math.max(0, highestScore),
    candidateHeaders,
  };
}

// ----------------------------------------------------
// Smart 3-Tier Column Matching Cascade
// ----------------------------------------------------

/**
 * Matches spreadsheet headers to resident fields using:
 * Tier 1: Exact normalized match
 * Tier 2: Synonym dictionary match
 * Tier 3: Fuzzy / token overlap
 * Never maps two columns to the same field (strict 1-to-1 mapping).
 */
export function autoMatchColumns(
  headers: string[],
  sampleRows: any[][] = []
): ColumnMappingInfo[] {
  interface MatchCandidate {
    columnIndex: number;
    fieldKey: ResidentFieldKey;
    score: number;
    confidence: 'high' | 'medium' | 'low';
  }

  const allCandidates: MatchCandidate[] = [];

  headers.forEach((header, colIdx) => {
    const cleanHeader = cleanSpreadsheetValue(header);
    if (!cleanHeader) return;

    const normHeader = normalizeHeader(cleanHeader);
    if (!normHeader) return;

    RESIDENT_FIELD_DEFINITIONS.forEach((field) => {
      // 1. Tier 1: Exact match after normalizing
      if (normHeader === normalizeHeader(field.label) || normHeader === normalizeHeader(field.key)) {
        allCandidates.push({
          columnIndex: colIdx,
          fieldKey: field.key,
          score: 100,
          confidence: 'high',
        });
        return;
      }

      // Check exact synonym match
      for (const syn of field.synonyms) {
        const normSyn = normalizeHeader(syn);
        if (normHeader === normSyn) {
          allCandidates.push({
            columnIndex: colIdx,
            fieldKey: field.key,
            score: 95,
            confidence: 'high',
          });
          return;
        }
      }

      // 2. Tier 2: Synonym contains / token overlap
      for (const syn of field.synonyms) {
        const normSyn = normalizeHeader(syn);
        if (normHeader.includes(normSyn) || normSyn.includes(normHeader)) {
          allCandidates.push({
            columnIndex: colIdx,
            fieldKey: field.key,
            score: 75,
            confidence: 'medium',
          });
          return;
        }
      }

      // 3. Tier 3: Fuzzy similarity (Levenshtein / token matching)
      const fieldTokens = field.label.toLowerCase().split(/\s+/);
      const headerTokens = cleanHeader.toLowerCase().split(/[\s_-]+/);
      const hasTokenMatch = fieldTokens.some((ft) => ft.length > 2 && headerTokens.includes(ft));
      if (hasTokenMatch) {
        allCandidates.push({
          columnIndex: colIdx,
          fieldKey: field.key,
          score: 50,
          confidence: 'low',
        });
      }
    });
  });

  // Sort candidates by score descending to prioritize best matches
  allCandidates.sort((a, b) => b.score - a.score);

  const assignedFields = new Set<ResidentFieldKey>();
  const columnToFieldMap = new Map<number, { fieldKey: ResidentFieldKey; confidence: 'high' | 'medium' | 'low' }>();

  // Greedily assign 1-to-1 without collision
  allCandidates.forEach((cand) => {
    if (!columnToFieldMap.has(cand.columnIndex) && !assignedFields.has(cand.fieldKey)) {
      columnToFieldMap.set(cand.columnIndex, {
        fieldKey: cand.fieldKey,
        confidence: cand.confidence,
      });
      assignedFields.add(cand.fieldKey);
    }
  });

  // Build the complete ColumnMappingInfo array
  return headers.map((header, colIdx) => {
    const match = columnToFieldMap.get(colIdx);
    const sampleVals: string[] = [];

    // Extract first 3-4 sample values from data rows
    sampleRows.slice(0, 4).forEach((row) => {
      if (Array.isArray(row) && row[colIdx] !== undefined) {
        const valStr = cleanSpreadsheetValue(row[colIdx]);
        if (valStr) sampleVals.push(valStr);
      }
    });

    return {
      columnIndex: colIdx,
      columnLetter: getExcelColumnLetter(colIdx),
      originalHeader: cleanSpreadsheetValue(header) || `Column ${getExcelColumnLetter(colIdx)}`,
      matchedField: match ? match.fieldKey : '',
      confidence: match ? match.confidence : 'none',
      sampleValues: sampleVals,
    };
  });
}

// ----------------------------------------------------
// Process Mapped Spreadsheet Rows to Resident Records
// ----------------------------------------------------

/**
 * Processes 2D spreadsheet data using custom column mappings into validated Resident objects.
 * Cleans bad data, handles sector flags, and calculates age dynamically.
 * Skips a row ONLY if both First Name and Last Name are missing.
 */
export function processMappedRowsToResidents(
  sheetData: any[][],
  headerRowIndex: number,
  mappings: ColumnMappingInfo[],
  defaultPurok = 'Purok Pinya'
): SmartResidentImportResult {
  const validRecords: (Omit<Resident, 'id' | 'dateRegistered' | 'updatedAt'> & { originalRowIndex: number })[] = [];
  const skippedRecords: { row: number; data: any; reason: string }[] = [];
  const missingBirthDateRecords: { row: number; name: string }[] = [];

  // Create field-to-columnIndex lookup
  const fieldToCol = new Map<ResidentFieldKey, number>();
  mappings.forEach((m) => {
    if (m.matchedField) {
      fieldToCol.set(m.matchedField, m.columnIndex);
    }
  });

  const dataRows = sheetData.slice(headerRowIndex + 1);
  const totalRows = dataRows.length;

  dataRows.forEach((row, idx) => {
    const spreadsheetRowNum = headerRowIndex + 2 + idx;

    // Check if entire row is empty
    if (!Array.isArray(row) || !row.some((c) => cleanSpreadsheetValue(c).length > 0)) {
      skippedRecords.push({
        row: spreadsheetRowNum,
        data: row,
        reason: 'Completely blank row',
      });
      return;
    }

    const getVal = (key: ResidentFieldKey): any => {
      const colIdx = fieldToCol.get(key);
      if (colIdx === undefined || !Array.isArray(row)) return undefined;
      return row[colIdx];
    };

    let firstName = cleanSpreadsheetValue(getVal('firstName'));
    let lastName = cleanSpreadsheetValue(getVal('lastName'));
    const middleName = cleanSpreadsheetValue(getVal('middleName'));
    const suffix = cleanSpreadsheetValue(getVal('suffix'));
    const fullNameVal = cleanSpreadsheetValue(getVal('fullName'));

    // If separate first and last are missing, but full name is mapped
    if ((!firstName || !lastName) && fullNameVal) {
      if (fullNameVal.includes(',')) {
        const parts = fullNameVal.split(',');
        if (!lastName) lastName = cleanSpreadsheetValue(parts[0]);
        if (!firstName) firstName = cleanSpreadsheetValue(parts.slice(1).join(' '));
      } else {
        const words = fullNameVal.split(/\s+/).filter(Boolean);
        if (words.length > 1) {
          if (!lastName) lastName = words[words.length - 1];
          if (!firstName) firstName = words.slice(0, words.length - 1).join(' ');
        } else if (words.length === 1) {
          if (!firstName) firstName = words[0];
        }
      }
    }

    // REQUIREMENT 8: Skip a row ONLY if both first and last name are missing.
    if (!firstName && !lastName) {
      skippedRecords.push({
        row: spreadsheetRowNum,
        data: row,
        reason: 'Missing both First Name and Last Name',
      });
      return;
    }

    // Birth Date & Age
    const rawBirthDate = getVal('birthDate');
    const parsedBirthDate = parseFlexibleDate(rawBirthDate);
    const rawAge = parseNumber(getVal('age'), 0);

    let birthDate = parsedBirthDate || '2000-01-01';
    let age = 0;

    if (parsedBirthDate) {
      age = calculateAge(parsedBirthDate);
    } else {
      missingBirthDateRecords.push({
        row: spreadsheetRowNum,
        name: `${firstName} ${lastName}`.trim(),
      });
      if (rawAge > 0) {
        age = rawAge;
        // Derive plausible birth year if age was supplied
        const derivedYear = new Date().getFullYear() - rawAge;
        birthDate = `${derivedYear}-01-01`;
      } else {
        age = 26; // Default standard adult age if birthdate completely missing
      }
    }

    // Sex normalization
    const rawSex = cleanSpreadsheetValue(getVal('sex')).toLowerCase();
    const sex: Sex = rawSex.startsWith('f') || rawSex === 'female' || rawSex === 'babae' || rawSex === '2' ? 'Female' : 'Male';

    // Civil status
    const rawCivil = cleanSpreadsheetValue(getVal('civilStatus')).toLowerCase();
    let civilStatus: CivilStatus = 'Single';
    if (rawCivil.includes('marr') || rawCivil.includes('kasal')) civilStatus = 'Married';
    else if (rawCivil.includes('wid') || rawCivil.includes('balo')) civilStatus = 'Widowed';
    else if (rawCivil.includes('sep') || rawCivil.includes('hiwalay')) civilStatus = 'Separated';
    else if (rawCivil.includes('div')) civilStatus = 'Divorced';
    else if (rawCivil.includes('law') || rawCivil.includes('live')) civilStatus = 'Common Law';

    // Purok mapping
    let purok = cleanSpreadsheetValue(getVal('purok')) || defaultPurok;
    if (purok && !purok.toLowerCase().startsWith('purok') && !purok.toLowerCase().startsWith('sitio')) {
      purok = `Purok ${purok}`;
    }

    const streetAddress = cleanSpreadsheetValue(getVal('streetAddress')) || `${purok}, Barangay Sangkol`;
    const contactNumber = cleanSpreadsheetValue(getVal('contactNumber')) || '0917-000-0000';
    const email = cleanSpreadsheetValue(getVal('email')) || undefined;
    const occupation = cleanSpreadsheetValue(getVal('occupation')) || 'Resident Citizen';
    const monthlyIncome = parseNumber(getVal('monthlyIncome'), 15000);
    const citizenship = cleanSpreadsheetValue(getVal('citizenship')) || 'Filipino';
    const religion = cleanSpreadsheetValue(getVal('religion')) || 'Roman Catholic';
    const bloodType = cleanSpreadsheetValue(getVal('bloodType')) || 'O+';
    const educationalAttainment = cleanSpreadsheetValue(getVal('educationalAttainment')) || 'High School Graduate';

    const rawVoter = getVal('voterStatus');
    const voterStatus = parseSectorFlag(rawVoter) || cleanSpreadsheetValue(rawVoter).toLowerCase().includes('reg')
      ? 'Registered'
      : 'Unregistered';

    const precinctNo = cleanSpreadsheetValue(getVal('precinctNo'));

    // Sectoral Flags
    const isSeniorCitizen = age >= 60 || parseSectorFlag(getVal('isSeniorCitizen'));
    const isPWD = parseSectorFlag(getVal('isPWD'));
    const pwdType = isPWD ? cleanSpreadsheetValue(getVal('pwdType')) || 'Physical Disability' : undefined;
    const is4PsBeneficiary = parseSectorFlag(getVal('is4PsBeneficiary'));
    const isSoloParent = parseSectorFlag(getVal('isSoloParent'));
    const isIndigent = parseSectorFlag(getVal('isIndigent'));
    const isYouth = (age >= 15 && age <= 30) || parseSectorFlag(getVal('isYouth'));
    const isOutofSchoolYouth = parseSectorFlag(getVal('isOutofSchoolYouth'));
    const isHouseholdHead = parseSectorFlag(getVal('isHouseholdHead'));

    const emergencyContactName = cleanSpreadsheetValue(getVal('emergencyContactName')) || 'Barangay Hall Desk';
    const emergencyContactNumber = cleanSpreadsheetValue(getVal('emergencyContactNumber')) || '(062) 991-8842';

    // Resident Status: REQUIREMENT 6
    const residentStatus = parseFlexibleStatus(getVal('residentStatus'), 'Active');
    const remarks = cleanSpreadsheetValue(getVal('remarks'));

    validRecords.push({
      originalRowIndex: spreadsheetRowNum,
      firstName,
      middleName,
      lastName,
      suffix,
      birthDate,
      age,
      sex,
      civilStatus,
      purok,
      streetAddress,
      contactNumber,
      email,
      occupation,
      monthlyIncome,
      citizenship,
      religion,
      bloodType,
      educationalAttainment,
      voterStatus,
      precinctNo,
      isHouseholdHead,
      isSeniorCitizen,
      isPWD,
      pwdType,
      is4PsBeneficiary,
      isSoloParent,
      isIndigent,
      isYouth,
      isOutofSchoolYouth,
      emergencyContactName,
      emergencyContactNumber,
      residentStatus,
      remarks,
    });
  });

  return {
    validRecords,
    skippedRecords,
    missingBirthDateRecords,
    totalRows,
  };
}

// ----------------------------------------------------
// Core File Parser
// ----------------------------------------------------

export async function parseUploadedFile(file: File): Promise<{
  sheets: { name: string; rows: any[] }[];
  rawRows: any[];
}> {
  const fileExt = file.name.split('.').pop()?.toLowerCase();

  if (fileExt === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return {
      sheets: [{ name: 'JSON_Data', rows }],
      rawRows: rows,
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const sheets: { name: string; rows: any[] }[] = [];
  let allRows: any[] = [];

  workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
    sheets.push({ name: sheetName, rows });
    if (index === 0) {
      allRows = rows;
    }
  });

  return { sheets, rawRows: allRows };
}

// ----------------------------------------------------
// Entity Parsers & Mappers
// ----------------------------------------------------

/**
 * Maps raw Excel rows into validated Resident objects
 */
export function mapRowsToResidents(
  rawRows: any[],
  defaultPurok = 'Purok Pinya',
  existingCount = 0
): ImportValidationResult<Omit<Resident, 'id' | 'dateRegistered' | 'updatedAt'>> {
  const validRecords: Omit<Resident, 'id' | 'dateRegistered' | 'updatedAt'>[] = [];
  const invalidRecords: { row: number; data: any; errors: string[] }[] = [];
  const warnings: string[] = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // Accounting for header row
    const errors: string[] = [];

    // Extract by flexible keys
    const rowMap: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      rowMap[normalizeHeader(key)] = row[key];
    });

    const firstName =
      rowMap['firstname'] ||
      rowMap['fname'] ||
      rowMap['givenname'] ||
      rowMap['first'] ||
      (rowMap['name'] ? String(rowMap['name']).split(' ')[0] : '');

    const lastName =
      rowMap['lastname'] ||
      rowMap['lname'] ||
      rowMap['surname'] ||
      rowMap['familyname'] ||
      rowMap['last'] ||
      (rowMap['name'] ? String(rowMap['name']).split(' ').slice(1).join(' ') : '');

    if (!firstName || !lastName) {
      errors.push('Missing required First Name or Last Name.');
    }

    const middleName = rowMap['middlename'] || rowMap['mname'] || rowMap['middle'] || '';
    const suffix = rowMap['suffix'] || rowMap['ext'] || '';
    const birthDate = formatDateValue(
      rowMap['birthdate'] || rowMap['bdate'] || rowMap['dob'] || rowMap['dateofbirth'] || '2000-01-01'
    );
    const age = calculateAge(birthDate);

    // Sex normalization
    const rawSex = String(rowMap['sex'] || rowMap['gender'] || 'Male').toLowerCase();
    const sex: Sex = rawSex.startsWith('f') || rawSex === 'female' || rawSex === 'babae' ? 'Female' : 'Male';

    // Civil Status normalization
    const rawCivil = String(rowMap['civilstatus'] || rowMap['civil'] || rowMap['status'] || 'Single').toLowerCase();
    let civilStatus: CivilStatus = 'Single';
    if (rawCivil.includes('marr')) civilStatus = 'Married';
    else if (rawCivil.includes('wid')) civilStatus = 'Widowed';
    else if (rawCivil.includes('sep')) civilStatus = 'Separated';
    else if (rawCivil.includes('div')) civilStatus = 'Divorced';
    else if (rawCivil.includes('law') || rawCivil.includes('live')) civilStatus = 'Common Law';

    // Purok mapping
    let purok = String(rowMap['purok'] || rowMap['zone'] || rowMap['sitio'] || defaultPurok).trim();
    if (!purok.toLowerCase().startsWith('purok') && !purok.toLowerCase().startsWith('sitio')) {
      purok = `Purok ${purok}`;
    }

    const streetAddress = String(
      rowMap['streetaddress'] ||
      rowMap['street'] ||
      rowMap['address'] ||
      rowMap['houseaddress'] ||
      `${purok}, Barangay Sangkol`
    ).trim();

    const contactNumber = String(
      rowMap['contactnumber'] ||
      rowMap['contact'] ||
      rowMap['cellphone'] ||
      rowMap['mobile'] ||
      rowMap['phone'] ||
      '0917-000-0000'
    ).trim();

    const email = rowMap['email'] || rowMap['emailaddress'] || undefined;
    const occupation = String(rowMap['occupation'] || rowMap['work'] || rowMap['job'] || 'Resident Citizen').trim();
    const monthlyIncome = parseNumber(
      rowMap['monthlyincome'] || rowMap['income'] || rowMap['salary'] || 15000,
      15000
    );
    const citizenship = String(rowMap['citizenship'] || rowMap['nationality'] || 'Filipino').trim();
    const religion = String(rowMap['religion'] || 'Roman Catholic').trim();
    const bloodType = String(rowMap['bloodtype'] || rowMap['blood'] || 'O+').trim();
    const educationalAttainment = String(
      rowMap['educationalattainment'] || rowMap['education'] || rowMap['attainment'] || 'College Graduate'
    ).trim();

    const voterStatus =
      parseBoolean(rowMap['isvoter'] || rowMap['voter'] || rowMap['voterstatus'] === 'Registered') ||
      String(rowMap['voterstatus'] || '').toLowerCase().includes('reg')
        ? 'Registered'
        : 'Unregistered';

    const precinctNo = String(rowMap['precinctno'] || rowMap['precinct'] || '').trim();

    // Flags
    const isSeniorCitizen = age >= 60 || parseBoolean(rowMap['issenior'] || rowMap['seniorcitizen'] || rowMap['senior']);
    const isPWD = parseBoolean(rowMap['ispwd'] || rowMap['pwd'] || rowMap['disabled']);
    const pwdType = isPWD ? String(rowMap['pwdtype'] || rowMap['disability'] || 'Physical Disability') : undefined;
    const is4PsBeneficiary = parseBoolean(rowMap['is4ps'] || rowMap['4ps'] || rowMap['4psbeneficiary']);
    const isSoloParent = parseBoolean(rowMap['issoloparent'] || rowMap['soloparent']);
    const isIndigent = parseBoolean(rowMap['isindigent'] || rowMap['indigent']);
    const isYouth = (age >= 15 && age <= 30) || parseBoolean(rowMap['isyouth'] || rowMap['youth']);
    const isOutofSchoolYouth = parseBoolean(rowMap['isoutofschoolyouth'] || rowMap['osy']);
    const isHouseholdHead = parseBoolean(rowMap['ishouseholdhead'] || rowMap['head'] || rowMap['familyhead']);

    const emergencyContactName = String(
      rowMap['emergencycontactname'] || rowMap['emergencyname'] || rowMap['emergencycontact'] || 'Barangay Hall Desk'
    ).trim();
    const emergencyContactNumber = String(
      rowMap['emergencycontactnumber'] || rowMap['emergencynumber'] || rowMap['emergencyphone'] || '(062) 991-8842'
    ).trim();

    const rawStatus = String(rowMap['residentstatus'] || rowMap['status'] || 'Active').toLowerCase();
    let residentStatus: ResidentStatus = 'Active';
    if (rawStatus.includes('dec')) residentStatus = 'Deceased';
    else if (rawStatus.includes('trans')) residentStatus = 'Transferred';
    else if (rawStatus.includes('arch')) residentStatus = 'Archived';

    const remarks = String(rowMap['remarks'] || rowMap['notes'] || '').trim();

    if (errors.length > 0) {
      invalidRecords.push({ row: rowNum, data: row, errors });
    } else {
      validRecords.push({
        firstName,
        middleName,
        lastName,
        suffix,
        birthDate,
        age,
        sex,
        civilStatus,
        purok,
        streetAddress,
        contactNumber,
        email,
        occupation,
        monthlyIncome,
        citizenship,
        religion,
        bloodType,
        educationalAttainment,
        voterStatus,
        precinctNo,
        isHouseholdHead,
        isSeniorCitizen,
        isPWD,
        pwdType,
        is4PsBeneficiary,
        isSoloParent,
        isIndigent,
        isYouth,
        isOutofSchoolYouth,
        emergencyContactName,
        emergencyContactNumber,
        residentStatus,
        remarks,
      });
    }
  });

  return {
    validRecords,
    invalidRecords,
    totalRows: rawRows.length,
    warnings,
  };
}

/**
 * Maps raw Excel rows into Business Record objects
 */
export function mapRowsToBusinesses(
  rawRows: any[],
  defaultPurok = 'Purok Pinya'
): ImportValidationResult<Omit<BusinessRecord, 'id'>> {
  const validRecords: Omit<BusinessRecord, 'id'>[] = [];
  const invalidRecords: { row: number; data: any; errors: string[] }[] = [];
  const warnings: string[] = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const errors: string[] = [];

    const rowMap: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      rowMap[normalizeHeader(key)] = row[key];
    });

    const businessName = String(
      rowMap['businessname'] || rowMap['tradename'] || rowMap['companyname'] || rowMap['business'] || ''
    ).trim();
    const ownerName = String(
      rowMap['ownername'] || rowMap['owner'] || rowMap['proprietor'] || rowMap['manager'] || ''
    ).trim();

    if (!businessName) errors.push('Missing Business Name.');
    if (!ownerName) errors.push('Missing Owner / Proprietor Name.');

    const businessType = (rowMap['businesstype'] || 'Sole Proprietorship') as any;
    const category = (rowMap['category'] || rowMap['businessline'] || 'Retail / Sari-Sari Store') as any;
    let purok = String(rowMap['purok'] || defaultPurok).trim();
    if (!purok.toLowerCase().startsWith('purok')) purok = `Purok ${purok}`;

    const address = String(rowMap['address'] || `${purok}, Barangay Sangkol`).trim();
    const contactNumber = String(rowMap['contactnumber'] || rowMap['contact'] || '0917-000-0000').trim();
    const email = rowMap['email'] || undefined;
    const dtiOrSecNo = rowMap['dtiorsecno'] || rowMap['dtino'] || rowMap['secno'] || undefined;
    const tinNo = rowMap['tinno'] || rowMap['tin'] || undefined;
    const capitalInvestment = parseNumber(rowMap['capitalinvestment'] || rowMap['capital'] || 50000, 50000);
    const grossSales = parseNumber(rowMap['grosssales'] || rowMap['sales'] || 120000, 120000);
    const barangayClearanceNo = String(
      rowMap['barangayclearanceno'] || rowMap['clearanceno'] || `BC-2026-${Math.floor(1000 + Math.random() * 9000)}`
    );
    const clearanceIssueDate = formatDateValue(rowMap['clearanceissuedate'] || '2026-01-10');
    const clearanceExpiryDate = formatDateValue(rowMap['clearanceexpirydate'] || '2026-12-31');
    const feePaid = parseNumber(rowMap['feepaid'] || rowMap['fee'] || 500, 500);
    const orNumber = String(rowMap['ornumber'] || rowMap['or'] || `OR-${Math.floor(10000 + Math.random() * 90000)}`);
    const status = (rowMap['status'] || 'Active') as any;
    const employeesCount = parseNumber(rowMap['employeescount'] || rowMap['employees'] || 1, 1);

    if (errors.length > 0) {
      invalidRecords.push({ row: rowNum, data: row, errors });
    } else {
      validRecords.push({
        businessName,
        ownerName,
        businessType,
        category,
        address,
        purok,
        contactNumber,
        email,
        dtiOrSecNo,
        tinNo,
        capitalInvestment,
        grossSales,
        barangayClearanceNo,
        clearanceIssueDate,
        clearanceExpiryDate,
        feePaid,
        orNumber,
        status,
        employeesCount,
      });
    }
  });

  return { validRecords, invalidRecords, totalRows: rawRows.length, warnings };
}

/**
 * Maps raw Excel rows into Household objects
 */
export function mapRowsToHouseholds(
  rawRows: any[],
  defaultPurok = 'Purok Pinya'
): ImportValidationResult<Omit<Household, 'id' | 'dateCreated'>> {
  const validRecords: Omit<Household, 'id' | 'dateCreated'>[] = [];
  const invalidRecords: { row: number; data: any; errors: string[] }[] = [];
  const warnings: string[] = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const errors: string[] = [];

    const rowMap: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      rowMap[normalizeHeader(key)] = row[key];
    });

    const householdNo = String(
      rowMap['householdno'] || rowMap['hhno'] || `HH-${String(idx + 1).padStart(3, '0')}`
    ).trim();
    const headName = String(rowMap['headname'] || rowMap['familyhead'] || rowMap['head'] || '').trim();

    if (!headName) errors.push('Missing Household Head Name.');

    let purok = String(rowMap['purok'] || defaultPurok).trim();
    if (!purok.toLowerCase().startsWith('purok')) purok = `Purok ${purok}`;

    const streetAddress = String(rowMap['streetaddress'] || `${purok}, Barangay Sangkol`).trim();
    const contactNumber = String(rowMap['contactnumber'] || rowMap['contact'] || '0917-000-0000').trim();
    const headResidentId = String(rowMap['headresidentid'] || '').trim();

    const housingType = (rowMap['housingtype'] || 'Concrete') as any;
    const houseOwnership = (rowMap['houseownership'] || 'Owned') as any;
    const waterSource = (rowMap['watersource'] || 'Piped Water / Utility') as any;
    const sanitaryToilet = parseBoolean(rowMap['sanitarytoilet'] ?? true);
    const electricitySource = (rowMap['electricitysource'] || 'Direct Line / Power Co.') as any;
    const monthlyHouseholdIncome = parseNumber(rowMap['monthlyhouseholdincome'] || rowMap['income'] || 25000, 25000);
    const is4PsBeneficiary = parseBoolean(rowMap['is4psbeneficiary'] || rowMap['4ps']);
    const remarks = String(rowMap['remarks'] || '').trim();

    if (errors.length > 0) {
      invalidRecords.push({ row: rowNum, data: row, errors });
    } else {
      validRecords.push({
        householdNo,
        purok,
        streetAddress,
        headResidentId,
        headName,
        contactNumber,
        members: [
          {
            residentId: headResidentId,
            name: headName,
            relationshipToHead: 'Head',
            age: 40,
            sex: 'Male',
            occupation: 'Household Head',
          },
        ],
        housingType,
        houseOwnership,
        waterSource,
        sanitaryToilet,
        electricitySource,
        monthlyHouseholdIncome,
        is4PsBeneficiary,
        remarks,
      });
    }
  });

  return { validRecords, invalidRecords, totalRows: rawRows.length, warnings };
}

/**
 * Maps raw Excel rows into Blotter Records
 */
export function mapRowsToBlotter(
  rawRows: any[],
  defaultPurok = 'Purok Pinya'
): ImportValidationResult<Omit<BlotterRecord, 'id'>> {
  const validRecords: Omit<BlotterRecord, 'id'>[] = [];
  const invalidRecords: { row: number; data: any; errors: string[] }[] = [];
  const warnings: string[] = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const errors: string[] = [];

    const rowMap: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      rowMap[normalizeHeader(key)] = row[key];
    });

    const incidentType = (rowMap['incidenttype'] || 'Noise / Neighborhood Disturbance') as any;
    const complainantName = String(rowMap['complainantname'] || rowMap['complainant'] || '').trim();
    const respondentName = String(rowMap['respondentname'] || rowMap['respondent'] || '').trim();

    if (!complainantName) errors.push('Missing Complainant Name.');
    if (!respondentName) errors.push('Missing Respondent Name.');

    let purok = String(rowMap['purok'] || defaultPurok).trim();
    if (!purok.toLowerCase().startsWith('purok')) purok = `Purok ${purok}`;

    const blotterNo = String(rowMap['blotterno'] || `BLT-2026-${String(idx + 1).padStart(4, '0')}`).trim();
    const dateReported = formatDateValue(rowMap['datereported'] || new Date());
    const timeReported = String(rowMap['timereported'] || '10:00 AM').trim();
    const incidentDate = formatDateValue(rowMap['incidentdate'] || dateReported);
    const incidentTime = String(rowMap['incidenttime'] || '09:00 AM').trim();
    const incidentLocation = String(rowMap['incidentlocation'] || `${purok}, Barangay Sangkol`).trim();

    const complainantAddress = String(rowMap['complainantaddress'] || `${purok}, Barangay Sangkol`).trim();
    const complainantContact = String(rowMap['complainantcontact'] || '0917-000-0000').trim();
    const respondentAddress = String(rowMap['respondentaddress'] || `${purok}, Barangay Sangkol`).trim();
    const respondentContact = rowMap['respondentcontact'] || undefined;

    const narrative = String(rowMap['narrative'] || rowMap['details'] || 'Incident reported and recorded in official logbook.').trim();
    const actionTaken = String(rowMap['actiontaken'] || 'Scheduled for initial mediation and conciliation.').trim();
    const assignedOfficer = String(rowMap['assignedofficer'] || 'Chief Tanod Roberto Diaz').trim();
    const status = (rowMap['status'] || 'Pending') as any;
    const recordedBy = String(rowMap['recordedby'] || 'Barangay Secretary').trim();

    if (errors.length > 0) {
      invalidRecords.push({ row: rowNum, data: row, errors });
    } else {
      validRecords.push({
        blotterNo,
        incidentType,
        dateReported,
        timeReported,
        incidentDate,
        incidentTime,
        incidentLocation,
        purok,
        complainantName,
        complainantAddress,
        complainantContact,
        respondentName,
        respondentAddress,
        respondentContact,
        narrative,
        actionTaken,
        assignedOfficer,
        status,
        recordedBy,
      });
    }
  });

  return { validRecords, invalidRecords, totalRows: rawRows.length, warnings };
}

/**
 * Maps raw Excel rows into Barangay Officials
 */
export function mapRowsToOfficials(
  rawRows: any[],
  defaultPurok = 'Purok Pinya'
): ImportValidationResult<Omit<BarangayOfficial, 'id'>> {
  const validRecords: Omit<BarangayOfficial, 'id'>[] = [];
  const invalidRecords: { row: number; data: any; errors: string[] }[] = [];
  const warnings: string[] = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const errors: string[] = [];

    const rowMap: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      rowMap[normalizeHeader(key)] = row[key];
    });

    const name = String(rowMap['name'] || rowMap['fullname'] || rowMap['officialname'] || '').trim();
    const position = String(rowMap['position'] || rowMap['designation'] || 'Barangay Kagawad').trim();

    if (!name) errors.push('Missing Official Name.');

    let purok = String(rowMap['purok'] || defaultPurok).trim();
    if (!purok.toLowerCase().startsWith('purok')) purok = `Purok ${purok}`;

    const committee = rowMap['committee'] || 'Committee on Peace and Order';
    const termStart = formatDateValue(rowMap['termstart'] || '2023-11-30');
    const termEnd = formatDateValue(rowMap['termend'] || '2026-11-30');
    const contactNumber = String(rowMap['contactnumber'] || rowMap['contact'] || '0917-000-0000').trim();
    const email = rowMap['email'] || undefined;
    const status = (rowMap['status'] || 'Active') as any;
    const order = parseNumber(rowMap['order'] || idx + 1, idx + 1);

    if (errors.length > 0) {
      invalidRecords.push({ row: rowNum, data: row, errors });
    } else {
      validRecords.push({
        name,
        position,
        committee,
        termStart,
        termEnd,
        contactNumber,
        email,
        purok,
        status,
        order,
      });
    }
  });

  return { validRecords, invalidRecords, totalRows: rawRows.length, warnings };
}

// ----------------------------------------------------
// Downloadable Sample Template Builder
// ----------------------------------------------------

export function generateSampleData(type: ImportEntityType): any[] {
  switch (type) {
    case 'residents':
      return [
        {
          'First Name': 'Juan',
          'Middle Name': 'Dela',
          'Last Name': 'Cruz',
          'Suffix': 'Jr.',
          'Birth Date (YYYY-MM-DD)': '1995-06-15',
          'Sex (Male/Female)': 'Male',
          'Civil Status': 'Married',
          'Purok': 'Purok Mangga',
          'Street Address': '123 Mango Street',
          'Contact Number': '0917-123-4567',
          'Email': 'juan.delacruz@example.com',
          'Occupation': 'Civil Engineer',
          'Monthly Income': 35000,
          'Citizenship': 'Filipino',
          'Religion': 'Roman Catholic',
          'Blood Type': 'O+',
          'Educational Attainment': 'College Graduate',
          'Voter Status (Registered/Unregistered)': 'Registered',
          'Precinct No': '0012A',
          'Household Head (Yes/No)': 'Yes',
          'Senior Citizen (Yes/No)': 'No',
          'PWD (Yes/No)': 'No',
          'PWD Type': '',
          '4Ps Beneficiary (Yes/No)': 'No',
          'Solo Parent (Yes/No)': 'No',
          'Indigent (Yes/No)': 'No',
          'Emergency Contact Name': 'Maria Cruz',
          'Emergency Contact Number': '0918-987-6543',
          'Resident Status (Active/Deceased/Transferred)': 'Active',
          'Remarks': 'Registered voter in Sangkol',
        },
        {
          'First Name': 'Maria Teresa',
          'Middle Name': 'Santos',
          'Last Name': 'Reyes',
          'Suffix': '',
          'Birth Date (YYYY-MM-DD)': '2001-09-24',
          'Sex (Male/Female)': 'Female',
          'Civil Status': 'Single',
          'Purok': 'Purok Pinya',
          'Street Address': '45 Pineapple Lane',
          'Contact Number': '0922-333-4455',
          'Email': 'maria.reyes@example.com',
          'Occupation': 'Public School Teacher',
          'Monthly Income': 28000,
          'Citizenship': 'Filipino',
          'Religion': 'Roman Catholic',
          'Blood Type': 'A+',
          'Educational Attainment': 'College Graduate',
          'Voter Status (Registered/Unregistered)': 'Registered',
          'Precinct No': '0014B',
          'Household Head (Yes/No)': 'No',
          'Senior Citizen (Yes/No)': 'No',
          'PWD (Yes/No)': 'No',
          'PWD Type': '',
          '4Ps Beneficiary (Yes/No)': 'No',
          'Solo Parent (Yes/No)': 'No',
          'Indigent (Yes/No)': 'No',
          'Emergency Contact Name': 'Elena Reyes',
          'Emergency Contact Number': '0922-111-2233',
          'Resident Status (Active/Deceased/Transferred)': 'Active',
          'Remarks': 'Youth council coordinator',
        },
        {
          'First Name': 'Antonio',
          'Middle Name': 'Gomez',
          'Last Name': 'Lim',
          'Suffix': 'Sr.',
          'Birth Date (YYYY-MM-DD)': '1958-11-04',
          'Sex (Male/Female)': 'Male',
          'Civil Status': 'Widowed',
          'Purok': 'Purok Lumboy',
          'Street Address': '88 Blackberry Boulevard',
          'Contact Number': '0919-555-7788',
          'Email': 'antonio.lim@example.com',
          'Occupation': 'Retired Government Employee',
          'Monthly Income': 22000,
          'Citizenship': 'Filipino',
          'Religion': 'Roman Catholic',
          'Blood Type': 'B+',
          'Educational Attainment': 'College Graduate',
          'Voter Status (Registered/Unregistered)': 'Registered',
          'Precinct No': '0008A',
          'Household Head (Yes/No)': 'Yes',
          'Senior Citizen (Yes/No)': 'Yes',
          'PWD (Yes/No)': 'No',
          'PWD Type': '',
          '4Ps Beneficiary (Yes/No)': 'No',
          'Solo Parent (Yes/No)': 'No',
          'Indigent (Yes/No)': 'No',
          'Emergency Contact Name': 'Carlos Lim',
          'Emergency Contact Number': '0919-444-3322',
          'Resident Status (Active/Deceased/Transferred)': 'Active',
          'Remarks': 'Active Senior Citizens Association officer',
        },
      ];

    case 'businesses':
      return [
        {
          'Business Name': 'Sangkol Fresh Mart & Grocery',
          'Owner / Proprietor': 'Elena Garcia',
          'Business Type': 'Sole Proprietorship',
          'Category': 'Retail / Sari-Sari Store',
          'Purok': 'Purok Pinya',
          'Address': '12 Pineapple Commercial Strip',
          'Contact Number': '0917-555-1234',
          'Email': 'sangkolmart@example.com',
          'DTI or SEC No': 'DTI-REG-2026-00441',
          'TIN No': '440-129-991-000',
          'Capital Investment': 150000,
          'Gross Sales': 480000,
          'Barangay Clearance No': 'BC-2026-0128',
          'Clearance Issue Date': '2026-01-15',
          'Clearance Expiry Date': '2026-12-31',
          'Fee Paid': 1200,
          'OR Number': 'OR-2026-00441',
          'Status': 'Active',
          'Employees Count': 4,
        },
        {
          'Business Name': 'Mangga Motor & Vulcanizing Shop',
          'Owner / Proprietor': 'Danilo Morales',
          'Business Type': 'Sole Proprietorship',
          'Category': 'Services & Repair',
          'Purok': 'Purok Mangga',
          'Address': '78 Mango Highway Junction',
          'Contact Number': '0920-888-9900',
          'Email': 'danilo.vulcanizing@example.com',
          'DTI or SEC No': 'DTI-REG-2026-00892',
          'TIN No': '312-887-104-000',
          'Capital Investment': 65000,
          'Gross Sales': 210000,
          'Barangay Clearance No': 'BC-2026-0199',
          'Clearance Issue Date': '2026-02-01',
          'Clearance Expiry Date': '2026-12-31',
          'Fee Paid': 600,
          'OR Number': 'OR-2026-00892',
          'Status': 'Active',
          'Employees Count': 2,
        },
      ];

    case 'households':
      return [
        {
          'Household No': 'HH-SNG-001',
          'Household Head Name': 'Juan Dela Cruz Jr.',
          'Purok': 'Purok Mangga',
          'Street Address': '123 Mango Street',
          'Contact Number': '0917-123-4567',
          'Housing Type': 'Concrete',
          'House Ownership': 'Owned',
          'Water Source': 'Piped Water / Utility',
          'Sanitary Toilet (Yes/No)': 'Yes',
          'Electricity Source': 'Direct Line / Power Co.',
          'Monthly Household Income': 45000,
          '4Ps Beneficiary (Yes/No)': 'No',
          'Remarks': '4 Total family members residing in 2-storey house',
        },
      ];

    case 'blotter':
      return [
        {
          'Blotter No': 'BLT-2026-0091',
          'Incident Type': 'Noise / Neighborhood Disturbance',
          'Date Reported': '2026-08-20',
          'Time Reported': '11:30 PM',
          'Incident Date': '2026-08-20',
          'Incident Time': '11:00 PM',
          'Incident Location': 'Corner Mango St. & Pine St.',
          'Purok': 'Purok Mangga',
          'Complainant Name': 'Roberto Santos',
          'Complainant Address': '44 Mango Street, Purok Mangga',
          'Complainant Contact': '0917-333-2211',
          'Respondent Name': 'Nestor Aquino',
          'Respondent Address': '46 Mango Street, Purok Mangga',
          'Respondent Contact': '0918-444-5566',
          'Narrative': 'Loud karaoke music beyond allowable ordinance hours on a weekday night.',
          'Action Taken': 'Tanod dispatched to issue first warning. Music ceased peacefully.',
          'Assigned Officer': 'Chief Tanod Roberto Diaz',
          'Status': 'Amicably Settled',
          'Recorded By': 'Barangay Desk Officer',
        },
      ];

    case 'officials':
      return [
        {
          'Official Name': 'Hon. Rodrigo M. Sangkol',
          'Position': 'Punong Barangay (Barangay Captain)',
          'Committee': 'Executive / Overall Administration',
          'Purok': 'Purok Pinya',
          'Term Start': '2023-11-30',
          'Term End': '2026-11-30',
          'Contact Number': '0917-882-9901',
          'Email': 'captain.sangkol@example.com',
          'Status': 'Active',
          'Order': 1,
        },
        {
          'Official Name': 'Hon. Maria Elena V. Ramos',
          'Position': 'Barangay Kagawad',
          'Committee': 'Committee on Health and Sanitation',
          'Purok': 'Purok Mangga',
          'Term Start': '2023-11-30',
          'Term End': '2026-11-30',
          'Contact Number': '0918-771-4432',
          'Email': 'kagawad.ramos@example.com',
          'Status': 'Active',
          'Order': 2,
        },
      ];

    default:
      return [];
  }
}

/**
 * Downloads a nicely formatted Excel (.xlsx) or CSV template with headers and sample records
 */
export function downloadSampleTemplate(type: ImportEntityType, format: 'xlsx' | 'csv' = 'xlsx'): void {
  const sampleData = generateSampleData(type);
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Auto-size column widths
  const maxProps: { [key: string]: number } = {};
  sampleData.forEach((row) => {
    Object.keys(row).forEach((k) => {
      const valLen = String(row[k] || '').length;
      maxProps[k] = Math.max(maxProps[k] || k.length, valLen);
    });
  });

  worksheet['!cols'] = Object.keys(maxProps).map((k) => ({
    wch: Math.min(Math.max(maxProps[k] + 3, 14), 40),
  }));

  const workbook = XLSX.utils.book_new();
  const safeType = type || 'Template';
  const sheetTitle = safeType.charAt(0).toUpperCase() + safeType.slice(1);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);

  const filename = `Barangay_Sangkol_Import_Template_${sheetTitle}.${format}`;

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
  }
}
