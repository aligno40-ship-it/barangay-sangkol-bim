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

// ----------------------------------------------------
// Normalization Helpers
// ----------------------------------------------------

export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function parseBoolean(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val > 0;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return ['true', 'yes', '1', 'y', 'oo', 'checked'].includes(s);
  }
  return false;
}

function parseNumber(val: any, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : num;
}

function formatDateValue(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  // If Excel numeric serial date (e.g. 36526)
  if (typeof val === 'number' && val > 20000 && val < 60000) {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  // If format is MM/DD/YYYY or DD/MM/YYYY or YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return '2000-01-01';
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
  const sheetTitle = type.charAt(0).toUpperCase() + type.slice(1);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);

  const filename = `Barangay_Sangkol_Import_Template_${sheetTitle}.${format}`;

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
  }
}
