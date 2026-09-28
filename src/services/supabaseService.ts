import { supabase, isSupabaseConfigured } from '../utils/supabase';
export { supabase, isSupabaseConfigured };
import {
  Resident,
  SystemUser,
  Household,
  HouseholdMember,
  BarangayOfficial,
  CertificateRecord,
  BlotterRecord,
  ComplaintRecord,
  BusinessRecord,
  AnnouncementRecord,
  AnnouncementAttendee,
  CommunityActivity,
  ActivityAttendee,
  CitizenConcern,
  AppointmentRecord,
  DocumentRecord,
  FinancialTransaction,
  AuditLog,
  BarangaySettings,
  SystemNotification,
  BarangayFileRecord,
  SMSAlertRecord,
  BlotterActivityLog,
  ConcernActionLog,
} from '../types';

// ==========================================
// STRING & VALUE SANITIZATION HELPERS
// ==========================================

export function toNullableString(val?: any): string | null {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  return str === '' || str === 'null' || str === 'undefined' ? null : str;
}

export function toValidDateOnly(val?: string | null, fallback?: string | null): string | null {
  if (!val || typeof val !== 'string') {
    return fallback !== undefined ? fallback : null;
  }
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    if (d.getFullYear() >= 1900 && d.getFullYear() <= 2100) {
      return d.toISOString().split('T')[0];
    }
  }
  return fallback !== undefined ? fallback : (trimmed ? new Date().toISOString().split('T')[0] : null);
}

export function sanitizeHousingType(val?: string | null): string {
  const allowed = ['Concrete', 'Semi-Concrete', 'Wood', 'Light Materials', 'Makeshift'];
  if (val && allowed.includes(val)) return val;
  if (val?.toLowerCase().includes('semi')) return 'Semi-Concrete';
  if (val?.toLowerCase().includes('wood')) return 'Wood';
  if (val?.toLowerCase().includes('light')) return 'Light Materials';
  if (val?.toLowerCase().includes('make')) return 'Makeshift';
  return 'Concrete';
}

export function sanitizeHouseOwnership(val?: string | null): string {
  const allowed = ['Owned', 'Rented', 'Informal Settler', 'Living with Relatives'];
  if (val && allowed.includes(val)) return val;
  if (val?.toLowerCase().includes('rent')) return 'Rented';
  if (val?.toLowerCase().includes('informal')) return 'Informal Settler';
  if (val?.toLowerCase().includes('relative')) return 'Living with Relatives';
  return 'Owned';
}

export function sanitizeWaterSource(val?: string | null): string {
  const allowed = ['Deep Well', 'Piped Water / Utility', 'Community Faucet', 'Bottled / Refill', 'Spring / Rain'];
  if (val && allowed.includes(val)) return val;
  if (val?.toLowerCase().includes('well')) return 'Deep Well';
  if (val?.toLowerCase().includes('piped') || val?.toLowerCase().includes('utility') || val?.toLowerCase().includes('level')) return 'Piped Water / Utility';
  if (val?.toLowerCase().includes('faucet') || val?.toLowerCase().includes('community')) return 'Community Faucet';
  if (val?.toLowerCase().includes('bottle') || val?.toLowerCase().includes('refill')) return 'Bottled / Refill';
  if (val?.toLowerCase().includes('spring') || val?.toLowerCase().includes('rain')) return 'Spring / Rain';
  return 'Piped Water / Utility';
}

export function sanitizeElectricitySource(val?: string | null): string {
  if (!val) return 'Direct Line / Power Co.';
  if (val.includes('Solar')) return 'Solar';
  if (val.includes('Submeter')) return 'Shared Submeter';
  if (val.includes('None') || val.toLowerCase().includes('no')) return 'None';
  return 'Direct Line / Power Co.';
}

export function sanitizeBlotterStatus(val?: string | null): string {
  const map: Record<string, string> = {
    'Pending': 'Pending',
    'Pending Review': 'Pending',
    'New': 'Pending',
    'Active Investigation': 'Active Investigation',
    'Active / Under Investigation': 'Active Investigation',
    'Under Investigation': 'Active Investigation',
    'Investigation': 'Active Investigation',
    'Mediation': 'Mediation',
    'Forwarded to Lupon': 'Forwarded to Lupon',
    'Settled': 'Settled',
    'Resolved': 'Settled',
    'Amicably Settled': 'Amicably Settled',
    'Referred to PNP': 'Referred to PNP',
    'Forwarded to PNP': 'Referred to PNP',
    'Dismissed': 'Dismissed',
  };
  return (val && map[val]) ? map[val] : 'Pending';
}

export function sanitizeConcernStatus(val?: string | null): string {
  const map: Record<string, string> = {
    'Received': 'Received',
    'Pending': 'Received',
    'Pending Review': 'Received',
    'New': 'Received',
    'In Review': 'In Review',
    'Action Taken': 'Action Taken',
    'In Progress': 'Action Taken',
    'Resolved': 'Resolved',
    'Closed': 'Resolved',
    'Endorsed to Lupon': 'Endorsed to Lupon',
    'Dismissed': 'Dismissed',
  };
  return (val && map[val]) ? map[val] : 'Received';
}

export function sanitizeConcernPriority(val?: string | null): string {
  const map: Record<string, string> = {
    'Normal': 'Normal',
    'Low': 'Normal',
    'Medium': 'Normal',
    'High': 'High',
    'Urgent': 'Urgent',
    'Emergency': 'Emergency',
  };
  return (val && map[val]) ? map[val] : 'Normal';
}

export function sanitizeApptStatus(val?: string | null): string {
  const map: Record<string, string> = {
    'Scheduled': 'Scheduled',
    'Confirmed': 'Scheduled',
    'Pending': 'Scheduled',
    'Completed': 'Completed',
    'Cancelled': 'Cancelled',
    'Rescheduled': 'Rescheduled',
  };
  return (val && map[val]) ? map[val] : 'Scheduled';
}

export function sanitizeAnnStatus(val?: string | null): string {
  return val === 'Archived' ? 'Archived' : 'Active';
}

export function sanitizeActivityStatus(val?: string | null): string {
  const allowed = ['Upcoming', 'Ongoing', 'Completed', 'Postponed'];
  return (val && allowed.includes(val)) ? val : 'Upcoming';
}

export function sanitizeBusinessStatus(val?: string | null): string {
  const allowed = ['Active', 'Pending Renewal', 'Expired', 'Ceased Operation'];
  if (val === 'Ceased') return 'Ceased Operation';
  return (val && allowed.includes(val)) ? val : 'Active';
}

export function sanitizeCertStatus(val?: string | null): string {
  const allowed = ['Issued', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Expired'];
  return (val && allowed.includes(val)) ? val : 'Issued';
}

export function sanitizePaymentMethod(val?: string | null): string {
  if (!val) return 'Cash';
  if (val.includes('Online') || val.includes('Bank') || val.includes('GCash')) return 'Online / Bank';
  if (val.includes('Waived') || val.includes('Exempted')) return 'Waived (Exempted)';
  return 'Cash';
}

export function sanitizeUserRole(val?: string | null): string {
  const allowed = [
    'Administrator',
    'Barangay Captain',
    'Barangay Secretary',
    'Barangay Treasurer',
    'Barangay Tanod',
    'Barangay Staff',
    'Barangay Official',
    'Resident',
  ];
  return (val && allowed.includes(val)) ? val : 'Resident';
}

export function sanitizeCivilStatus(val?: string | null): string {
  const allowed = ['Single', 'Married', 'Widowed', 'Separated', 'Divorced', 'Common Law'];
  return (val && allowed.includes(val)) ? val : 'Single';
}

/**
 * Concurrently processes an array of asynchronous tasks with a maximum concurrency limit.
 * Prevents saturating database connection pools and avoids query timeouts.
 */
export async function runWithConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit = 4
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (currentIndex < tasks.length) {
      const idx = currentIndex++;
      try {
        results[idx] = await tasks[idx]();
      } catch (err) {
        console.error(`[Concurrency Worker] Task at index ${idx} failed:`, err);
        throw err;
      }
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Automatically paginates through PostgREST's default 1000-row limit to retrieve all records.
 * Includes intelligent retry with backoff and client-side sorting fallback for statement timeout (57014).
 */
export async function fetchAllRowsFromTable<T = any>(
  tableName: string,
  options?: {
    select?: string;
    orderColumn?: string;
    ascending?: boolean;
    batchSize?: number;
    limit?: number;
    maxRetries?: number;
  }
): Promise<T[]> {
  if (!isSupabaseConfigured) return [];
  const selectClause = options?.select || '*';
  const defaultBatch = (tableName === 'barangay_settings' ? 1 : (tableName === 'barangay_officials' || tableName === 'system_users' ? 100 : 1000));
  let batchSize = options?.batchSize || defaultBatch;
  const orderCol = options?.orderColumn;
  const ascending = options?.ascending ?? false;
  const maxLimit = options?.limit;
  const maxRetries = options?.maxRetries ?? 3;

  let allRows: T[] = [];
  let from = 0;
  let hasMore = true;
  let skippedDbSort = false;

  while (hasMore) {
    const currentBatch = maxLimit ? Math.min(batchSize, Math.max(1, maxLimit - allRows.length)) : batchSize;
    const to = from + currentBatch - 1;

    let attempt = 0;
    let data: any = null;
    let error: any = null;

    while (attempt <= maxRetries) {
      let query = (supabase as any)
        .from(tableName)
        .select(selectClause)
        .range(from, to);

      // On retries after a statement timeout (57014), if ordering caused query planner to choke on large base64 rows,
      // skip database ordering on the query so Postgres does not run a costly sort on large base64 rows,
      // and sort in memory instead.
      const shouldApplyDbOrder = orderCol && !skippedDbSort;
      if (shouldApplyDbOrder) {
        query = query.order(orderCol, { ascending });
      }

      const res = await query;
      data = res.data;
      error = res.error;

      if (!error) {
        break;
      }

      const isTimeoutOrTransient =
        error.code === '57014' ||
        error.message?.toLowerCase().includes('timeout') ||
        error.message?.toLowerCase().includes('canceling statement') ||
        error.status === 504 ||
        error.status === 502 ||
        error.status === 503;

      attempt++;
      if (attempt <= maxRetries && isTimeoutOrTransient) {
        // If error code is 57014, skip DB ordering on next attempt to reduce Postgres work_mem strain
        if (error.code === '57014' && orderCol) {
          skippedDbSort = true;
        }
        if (batchSize > 50 && (error.code === '57014' || error.message?.toLowerCase().includes('timeout'))) {
          batchSize = Math.max(20, Math.floor(batchSize / 2));
        }
        const delayMs = attempt * 350 + Math.floor(Math.random() * 200);
        console.warn(
          `[Supabase fetchAllRowsFromTable] Recovering from error on "${tableName}" at range [${from}, ${to}] (attempt ${attempt}/${maxRetries}): ${error.message || error.code}. Retrying in ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        break;
      }
    }

    if (error) {
      console.error(`Error fetching rows from table "${tableName}" at range [${from}, ${to}]:`, error);
      break;
    }

    if (data && data.length > 0) {
      allRows = allRows.concat(data as T[]);
      if (maxLimit && allRows.length >= maxLimit) {
        allRows = allRows.slice(0, maxLimit);
        hasMore = false;
        break;
      }
      if (data.length < currentBatch) {
        hasMore = false;
      } else {
        from += currentBatch;
      }
    } else {
      hasMore = false;
    }
  }

  // Ensure rows are correctly sorted if database ordering had to be skipped during recovery
  if (orderCol && allRows.length > 1 && (skippedDbSort || options?.orderColumn)) {
    allRows.sort((a: any, b: any) => {
      const valA = a[orderCol];
      const valB = b[orderCol];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      return ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }

  return allRows;
}

// Cache of verified Resident IDs to prevent Foreign Key constraint violations
const verifiedResidentIds = new Set<string>();
let initialResidentsLoaded = false;

/**
 * Ensures that if a residentId is passed to an entity table (blotters, certificates,
 * household_members, announcement_attendees, activity_attendees, appointments, citizen_concerns),
 * it actually exists in the Supabase `residents` table. If not, returns null so the insert succeeds.
 */
export async function resolveValidResidentId(residentId?: string | null): Promise<string | null> {
  const cleaned = toNullableString(residentId);
  if (!cleaned) return null;

  // Check in-memory cache
  if (verifiedResidentIds.has(cleaned)) {
    return cleaned;
  }

  // If first time, load all existing resident IDs (paginating past PostgREST 1000 limit)
  if (!initialResidentsLoaded && isSupabaseConfigured) {
    try {
      const data = await fetchAllRowsFromTable<{ id: string }>('residents', { select: 'id' });
      if (data) {
        for (const r of data) {
          if (r.id) verifiedResidentIds.add(r.id);
        }
      }
      initialResidentsLoaded = true;
      if (verifiedResidentIds.has(cleaned)) {
        return cleaned;
      }
    } catch (e) {
      console.warn('Failed to pre-fetch resident IDs:', e);
    }
  }

  // Check specific resident directly
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.from('residents').select('id').eq('id', cleaned).maybeSingle();
      if (data && data.id) {
        verifiedResidentIds.add(data.id);
        return data.id;
      }
    } catch (e) {
      console.warn(`Error verifying resident ID ${cleaned}:`, e);
    }
  }

  // Not a verified resident in database -> use null to prevent FK constraint failure
  console.warn(`Resident ID "${cleaned}" not found in Supabase residents table; assigning null to preserve record creation.`);
  return null;
}

export function registerVerifiedResidentId(id: string) {
  if (id) verifiedResidentIds.add(id);
}

// ==========================================
// MAPPERS: SUPABASE (snake_case) <-> APP (camelCase)
// ==========================================

export function residentFromRow(row: any): Resident {
  return {
    id: row.id,
    name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    firstName: row.first_name || '',
    middleName: row.middle_name || undefined,
    lastName: row.last_name || '',
    suffix: row.suffix || undefined,
    alias: row.alias || undefined,
    birthDate: row.birth_date || '',
    age: Number(row.age) || 0,
    sex: row.sex || 'Male',
    civilStatus: row.civil_status || 'Single',
    purok: row.purok || '',
    streetAddress: row.street_address || '',
    contactNumber: row.contact_number || '',
    email: row.email || undefined,
    occupation: row.occupation || '',
    monthlyIncome: Number(row.monthly_income) || 0,
    citizenship: row.citizenship || 'Filipino',
    religion: row.religion || 'Roman Catholic',
    bloodType: row.blood_type || 'O+',
    educationalAttainment: row.educational_attainment || 'High School Graduate',
    voterStatus: row.voter_status || 'Registered',
    precinctNo: row.precinct_no || undefined,
    householdId: row.household_id || undefined,
    isHouseholdHead: Boolean(row.is_household_head),
    isSeniorCitizen: Boolean(row.is_senior_citizen),
    isPWD: Boolean(row.is_pwd),
    pwdType: row.pwd_type || undefined,
    is4PsBeneficiary: Boolean(row.is_4ps_beneficiary),
    isSoloParent: Boolean(row.is_solo_parent),
    isIndigent: Boolean(row.is_indigent),
    isYouth: Boolean(row.is_youth),
    isOutofSchoolYouth: Boolean(row.is_outof_school_youth),
    photoUrl: row.photo_url || row.avatar || undefined,
    avatar: row.avatar || row.photo_url || undefined,
    facePhotoUrl: row.face_photo_url || undefined,
    faceVerified: Boolean(row.face_verified),
    faceConfidenceScore: row.face_confidence_score ? Number(row.face_confidence_score) : undefined,
    faceVerificationTimestamp: row.face_verification_timestamp || undefined,
    faceVerifiedAt: row.face_verified_at || undefined,
    faceLivenessScore: row.face_liveness_score ? Number(row.face_liveness_score) : undefined,
    faceBiometricQuality: row.face_biometric_quality || undefined,
    nationalIdNo: row.national_id_no || undefined,
    philhealthNo: row.philhealth_no || undefined,
    sssNo: row.sss_no || undefined,
    emergencyContactName: row.emergency_contact_name || '',
    emergencyContactNumber: row.emergency_contact_number || '',
    residentStatus: row.resident_status || 'Active',
    remarks: row.remarks || undefined,
    dateRegistered: row.date_registered || new Date().toISOString().split('T')[0],
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function residentToRow(r: Resident): any {
  return {
    id: r.id,
    first_name: r.firstName || 'Resident',
    middle_name: toNullableString(r.middleName),
    last_name: r.lastName || 'Sangkol',
    suffix: toNullableString(r.suffix),
    alias: toNullableString(r.alias),
    birth_date: r.birthDate || '2000-01-01',
    age: Number(r.age) || 0,
    sex: r.sex === 'Female' ? 'Female' : 'Male',
    civil_status: sanitizeCivilStatus(r.civilStatus),
    purok: r.purok || 'Purok Pinya',
    street_address: r.streetAddress || 'Barangay Sangkol',
    contact_number: toNullableString(r.contactNumber),
    email: toNullableString(r.email),
    occupation: r.occupation || 'Resident',
    monthly_income: Number(r.monthlyIncome) || 0,
    citizenship: r.citizenship || 'Filipino',
    religion: r.religion || 'Roman Catholic',
    blood_type: r.bloodType || 'O+',
    educational_attainment: r.educationalAttainment || 'High School Graduate',
    voter_status: r.voterStatus === 'Registered' ? 'Registered' : 'Unregistered',
    precinct_no: toNullableString(r.precinctNo),
    household_id: toNullableString(r.householdId),
    is_household_head: Boolean(r.isHouseholdHead),
    is_senior_citizen: Boolean(r.isSeniorCitizen),
    is_pwd: Boolean(r.isPWD),
    pwd_type: toNullableString(r.pwdType),
    is_4ps_beneficiary: Boolean(r.is4PsBeneficiary),
    is_solo_parent: Boolean(r.isSoloParent),
    is_indigent: Boolean(r.isIndigent),
    is_youth: Boolean(r.isYouth),
    is_outof_school_youth: Boolean(r.isOutofSchoolYouth),
    photo_url: toNullableString(r.photoUrl || r.avatar),
    avatar: toNullableString(r.avatar || r.photoUrl),
    face_photo_url: toNullableString(r.facePhotoUrl),
    face_verified: Boolean(r.faceVerified),
    face_confidence_score: r.faceConfidenceScore ? Number(r.faceConfidenceScore) : null,
    face_verification_timestamp: toNullableString(r.faceVerificationTimestamp),
    face_verified_at: toNullableString(r.faceVerifiedAt),
    face_liveness_score: r.faceLivenessScore ? Number(r.faceLivenessScore) : null,
    face_biometric_quality: r.faceBiometricQuality || {},
    national_id_no: toNullableString(r.nationalIdNo),
    philhealth_no: toNullableString(r.philhealthNo),
    sss_no: toNullableString(r.sssNo),
    emergency_contact_name: toNullableString(r.emergencyContactName),
    emergency_contact_number: toNullableString(r.emergencyContactNumber),
    resident_status: ['Active', 'Deceased', 'Transferred', 'Archived'].includes(r.residentStatus) ? r.residentStatus : 'Active',
    remarks: toNullableString(r.remarks),
    date_registered: r.dateRegistered || new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString(),
  };
}

export function userFromRow(row: any): SystemUser {
  return {
    id: row.id,
    authId: row.auth_id || undefined,
    username: row.username,
    name: row.name,
    role: row.role,
    position: row.position,
    avatar: row.avatar || undefined,
    email: row.email,
    contactNumber: row.contact_number || row.phone || '',
    phone: row.phone || row.contact_number || undefined,
    status: row.status || 'Active',
    approvalStatus: row.approval_status || 'Approved',
    purok: row.purok || undefined,
    residentId: row.resident_id || undefined,
    streetAddress: row.street_address || undefined,
    birthDate: row.birth_date || undefined,
    sex: row.sex || undefined,
    civilStatus: row.civil_status || undefined,
    citizenship: row.citizenship || 'Filipino',
    religion: row.religion || 'Roman Catholic',
    bloodType: row.blood_type || 'O+',
    educationalAttainment: row.educational_attainment || undefined,
    occupation: row.occupation || undefined,
    monthlyIncome: row.monthly_income ? Number(row.monthly_income) : 0,
    voterStatus: row.voter_status || 'Registered',
    precinctNo: row.precinct_no || undefined,
    isSeniorCitizen: Boolean(row.is_senior_citizen),
    isPWD: Boolean(row.is_pwd),
    pwdType: row.pwd_type || undefined,
    is4PsBeneficiary: Boolean(row.is_4ps_beneficiary),
    isSoloParent: Boolean(row.is_solo_parent),
    isIndigent: Boolean(row.is_indigent),
    isHouseholdHead: Boolean(row.is_household_head),
    emergencyContactName: row.emergency_contact_name || undefined,
    emergencyContactNumber: row.emergency_contact_number || undefined,
    validIdType: row.valid_id_type || undefined,
    validIdNumber: row.valid_id_number || undefined,
    validIdPhoto: row.valid_id_photo || undefined,
    validIdPhotoUrl: row.valid_id_photo_url || row.valid_id_photo || undefined,
    proofOfResidency: row.proof_of_residency || undefined,
    submittedAt: row.submitted_at || undefined,
    reviewedAt: row.reviewed_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
    rejectionReason: row.rejection_reason || undefined,
    matchedResidentId: row.matched_resident_id || undefined,
    registrationType: row.registration_type || undefined,
    matchConfidence: row.match_confidence || undefined,
    matchReason: row.match_reason || undefined,
    householdNo: row.household_no || undefined,
    householdId: row.household_id || undefined,
    securityQuestion: row.security_question || undefined,
    securityAnswer: row.security_answer || undefined,
    facePhotoUrl: row.face_photo_url || undefined,
    faceVerified: Boolean(row.face_verified),
    faceConfidenceScore: row.face_confidence_score ? Number(row.face_confidence_score) : undefined,
    faceVerificationTimestamp: row.face_verification_timestamp || undefined,
    faceVerifiedAt: row.face_verified_at || undefined,
    faceLivenessScore: row.face_liveness_score ? Number(row.face_liveness_score) : undefined,
    faceBiometricQuality: row.face_biometric_quality || undefined,
    passwordStrengthScore: row.password_strength_score ? Number(row.password_strength_score) : undefined,
    passwordHash: row.password_hash || undefined,
    createdAt: row.created_at || undefined,
  };
}

export function userToRow(u: SystemUser): any {
  return {
    id: u.id,
    auth_id: toNullableString(u.authId),
    username: u.username,
    password_hash: u.passwordHash || '[SUPABASE_AUTH_MANAGED]',
    name: u.name || u.username,
    role: sanitizeUserRole(u.role),
    position: u.position || u.role || 'Staff',
    avatar: toNullableString(u.avatar),
    email: u.email || `${u.username}@barangaysangkol.gov.ph`,
    contact_number: u.contactNumber || u.phone || 'N/A',
    phone: toNullableString(u.phone || u.contactNumber),
    purok: toNullableString(u.purok),
    resident_id: toNullableString(u.residentId),
    status: ['Active', 'Inactive', 'Pending Approval', 'Rejected'].includes(u.status) ? u.status : 'Active',
    approval_status: ['Approved', 'Pending', 'Rejected'].includes(u.approvalStatus) ? u.approvalStatus : 'Approved',
    submitted_at: toNullableString(u.submittedAt),
    reviewed_at: toNullableString(u.reviewedAt),
    reviewed_by: toNullableString(u.reviewedBy),
    rejection_reason: toNullableString(u.rejectionReason),
    valid_id_type: toNullableString(u.validIdType),
    valid_id_number: toNullableString(u.validIdNumber),
    valid_id_photo: toNullableString(u.validIdPhoto),
    valid_id_photo_url: toNullableString(u.validIdPhotoUrl || u.validIdPhoto),
    proof_of_residency: toNullableString(u.proofOfResidency),
    street_address: toNullableString(u.streetAddress),
    birth_date: toNullableString(u.birthDate),
    sex: u.sex && ['Male', 'Female'].includes(u.sex) ? u.sex : null,
    civil_status: u.civilStatus ? sanitizeCivilStatus(u.civilStatus) : null,
    citizenship: u.citizenship || 'Filipino',
    religion: u.religion || 'Roman Catholic',
    blood_type: u.bloodType || 'O+',
    educational_attainment: toNullableString(u.educationalAttainment),
    occupation: toNullableString(u.occupation),
    monthly_income: Number(u.monthlyIncome) || 0,
    voter_status: u.voterStatus === 'Registered' ? 'Registered' : 'Unregistered',
    precinct_no: toNullableString(u.precinctNo),
    is_senior_citizen: Boolean(u.isSeniorCitizen),
    is_pwd: Boolean(u.isPWD),
    pwd_type: toNullableString(u.pwdType),
    is_4ps_beneficiary: Boolean(u.is4PsBeneficiary),
    is_solo_parent: Boolean(u.isSoloParent),
    is_indigent: Boolean(u.isIndigent),
    is_household_head: Boolean(u.isHouseholdHead),
    emergency_contact_name: toNullableString(u.emergencyContactName),
    emergency_contact_number: toNullableString(u.emergencyContactNumber),
    matched_resident_id: toNullableString(u.matchedResidentId),
    registration_type: toNullableString(u.registrationType),
    match_confidence: toNullableString(u.matchConfidence),
    match_reason: toNullableString(u.matchReason),
    household_no: toNullableString(u.householdNo),
    household_id: toNullableString(u.householdId),
    security_question: toNullableString(u.securityQuestion),
    security_answer: toNullableString(u.securityAnswer),
    face_photo_url: toNullableString(u.facePhotoUrl),
    face_verified: Boolean(u.faceVerified),
    face_confidence_score: u.faceConfidenceScore ? Number(u.faceConfidenceScore) : null,
    face_verification_timestamp: toNullableString(u.faceVerificationTimestamp),
    face_verified_at: toNullableString(u.faceVerifiedAt),
    face_liveness_score: u.faceLivenessScore ? Number(u.faceLivenessScore) : null,
    face_biometric_quality: u.faceBiometricQuality || {},
    password_strength_score: u.passwordStrengthScore ? Number(u.passwordStrengthScore) : 80,
    updated_at: new Date().toISOString(),
  };
}

export function householdFromRow(row: any, members: any[] = []): Household {
  return {
    id: row.id,
    householdNo: row.household_no,
    purok: row.purok,
    streetAddress: row.street_address,
    headResidentId: row.head_resident_id,
    headName: row.head_name,
    contactNumber: row.contact_number,
    members: members.map((m) => ({
      residentId: m.resident_id,
      name: m.name,
      relationshipToHead: m.relationship_to_head,
      age: Number(m.age) || 0,
      sex: m.sex,
      occupation: m.occupation || undefined,
      contactNumber: m.contact_number || undefined,
      photoUrl: m.photo_url || undefined,
    })),
    housingType: row.housing_type,
    houseOwnership: row.house_ownership,
    waterSource: row.water_source,
    sanitaryToilet: Boolean(row.sanitary_toilet),
    electricitySource: row.electricity_source,
    monthlyHouseholdIncome: Number(row.monthly_household_income) || 0,
    is4PsBeneficiary: Boolean(row.is_4ps_beneficiary),
    dateCreated: row.date_created || new Date().toISOString().split('T')[0],
  };
}

export function householdToRow(h: Household): any {
  return {
    id: h.id,
    household_no: h.householdNo || h.id,
    purok: h.purok || 'Purok Pinya',
    street_address: h.streetAddress || 'Barangay Sangkol',
    head_resident_id: toNullableString(h.headResidentId),
    head_name: h.headName || 'Household Head',
    contact_number: toNullableString(h.contactNumber),
    housing_type: sanitizeHousingType(h.housingType),
    house_ownership: sanitizeHouseOwnership(h.houseOwnership),
    water_source: sanitizeWaterSource(h.waterSource),
    sanitary_toilet: Boolean(h.sanitaryToilet),
    electricity_source: sanitizeElectricitySource(h.electricitySource),
    monthly_household_income: Number(h.monthlyHouseholdIncome) || 0,
    is_4ps_beneficiary: Boolean(h.is4PsBeneficiary),
    remarks: toNullableString(h.remarks),
    date_created: h.dateCreated || new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString(),
  };
}

export function officialFromRow(row: any): BarangayOfficial {
  return {
    id: row.id,
    residentId: row.resident_id || undefined,
    name: row.name,
    position: row.position,
    committee: row.committee || undefined,
    termStart: row.term_start || '2023-11-01',
    termEnd: row.term_end || '2026-11-30',
    contactNumber: row.contact_number || '',
    email: row.email || undefined,
    purok: row.purok || '',
    status: row.status || 'Active',
    photoUrl: row.photo_url || row.avatar || undefined,
    avatar: row.avatar || row.photo_url || undefined,
    signatureUrl: row.signature_url || undefined,
    order: Number(row.display_order) || 99,
  };
}

export function officialToRow(o: BarangayOfficial): any {
  return {
    id: o.id,
    resident_id: toNullableString(o.residentId),
    name: o.name,
    position: o.position,
    committee: toNullableString(o.committee),
    term_start: o.termStart || '2023-11-01',
    term_end: o.termEnd || '2026-11-30',
    contact_number: o.contactNumber || 'N/A',
    email: toNullableString(o.email),
    purok: o.purok || 'Barangay Sangkol',
    status: ['Active', 'On Leave', 'Term Ended'].includes(o.status) ? o.status : 'Active',
    photo_url: toNullableString(o.photoUrl || o.avatar),
    avatar: toNullableString(o.avatar || o.photoUrl),
    signature_url: toNullableString(o.signatureUrl),
    display_order: Number(o.order) || 99,
    updated_at: new Date().toISOString(),
  };
}

export function certificateFromRow(row: any): CertificateRecord {
  return {
    id: row.id,
    controlNumber: row.control_number,
    type: row.type,
    residentId: row.resident_id,
    residentName: row.resident_name,
    residentAddress: row.resident_address,
    residentPurok: row.resident_purok || undefined,
    residentAge: Number(row.resident_age) || 0,
    residentCivilStatus: row.resident_civil_status || 'Single',
    purpose: row.purpose,
    orNumber: row.or_number,
    fee: Number(row.fee) || 0,
    cedulaNo: row.cedula_no || undefined,
    cedulaIssuedAt: row.cedula_issued_at || undefined,
    cedulaIssuedDate: row.cedula_issued_date || undefined,
    signatoryOfficial: row.signatory_official,
    signatoryPosition: row.signatory_position,
    issuedBy: row.issued_by,
    dateIssued: row.date_issued,
    expirationDate: row.expiration_date || undefined,
    status: row.status,
    deliveryOption: row.delivery_option || 'Walk-in Claim',
    requestedAt: row.requested_at || undefined,
    approvedAt: row.approved_at || undefined,
    approvedBy: row.approved_by || undefined,
    rejectionReason: row.rejection_reason || undefined,
    pickupInstructions: row.pickup_instructions || undefined,
    isReadyForPickup: Boolean(row.is_ready_for_pickup),
    businessName: row.business_name || undefined,
    businessAddress: row.business_address || undefined,
    businessNature: row.business_nature || undefined,
    remarks: row.remarks || undefined,
  };
}

export function certificateToRow(c: CertificateRecord): any {
  return {
    id: c.id,
    control_number: c.controlNumber || c.id,
    type: c.type || 'Barangay Clearance',
    resident_id: toNullableString(c.residentId),
    resident_name: c.residentName || 'Resident',
    resident_address: c.residentAddress || 'Barangay Sangkol',
    resident_purok: toNullableString(c.residentPurok),
    resident_age: c.residentAge ? Number(c.residentAge) : null,
    resident_birth_date: toNullableString(c.residentBirthDate),
    resident_civil_status: toNullableString(c.residentCivilStatus),
    purpose: c.purpose || 'Barangay Requirement',
    or_number: c.orNumber || 'OR-PENDING',
    fee: Number(c.fee) || 0,
    cedula_no: toNullableString(c.cedulaNo),
    cedula_issued_at: toNullableString(c.cedulaIssuedAt),
    cedula_issued_date: toNullableString(c.cedulaIssuedDate),
    signatory_official: c.signatoryOfficial || 'Hon. Rodrigo M. Sangkol',
    signatory_position: c.signatoryPosition || 'Punong Barangay',
    issued_by: c.issuedBy || 'Barangay Staff',
    date_issued: c.dateIssued || new Date().toISOString().split('T')[0],
    expiration_date: toNullableString(c.expirationDate),
    status: sanitizeCertStatus(c.status),
    delivery_option: c.deliveryOption || 'Walk-in Claim',
    requested_at: toNullableString(c.requestedAt),
    approved_at: toNullableString(c.approvedAt),
    approved_by: toNullableString(c.approvedBy),
    rejection_reason: toNullableString(c.rejectionReason),
    pickup_instructions: toNullableString(c.pickupInstructions),
    is_ready_for_pickup: Boolean(c.isReadyForPickup),
    business_name: toNullableString(c.businessName),
    business_address: toNullableString(c.businessAddress),
    business_nature: toNullableString(c.businessNature),
    remarks: toNullableString(c.remarks),
    updated_at: new Date().toISOString(),
  };
}

export function blotterFromRow(row: any): BlotterRecord {
  return {
    id: row.id,
    blotterNo: row.blotter_no,
    incidentType: row.incident_type,
    dateReported: row.date_reported,
    timeReported: row.time_reported,
    incidentDate: row.incident_date,
    incidentTime: row.incident_time,
    incidentLocation: row.incident_location,
    purok: row.purok,
    incidentPurok: row.purok,
    complainantName: row.complainant_name,
    complainantAddress: row.complainant_address,
    complainantContact: row.complainant_contact,
    respondentName: row.respondent_name,
    respondentAddress: row.respondent_address,
    respondentContact: row.respondent_contact || undefined,
    witnesses: row.witnesses || undefined,
    narrative: row.narrative,
    actionTaken: row.action_taken,
    assignedOfficer: row.assigned_officer,
    status: row.status,
    resolutionDate: row.resolution_date || undefined,
    resolutionNotes: row.resolution_notes || undefined,
    recordedBy: row.recorded_by,
    hearingDate: row.hearing_date || undefined,
    hearingTime: row.hearing_time || undefined,
    hearingStage: row.hearing_stage || undefined,
    mediator: row.mediator || undefined,
    settlementTerms: row.settlement_terms || undefined,
    pnpStation: row.pnp_station || undefined,
    pnpEndorsementNo: row.pnp_endorsement_no || undefined,
  };
}

export function blotterToRow(b: BlotterRecord): any {
  return {
    id: b.id,
    blotter_no: b.blotterNo || b.id,
    incident_type: b.incidentType || 'Incident',
    date_reported: b.dateReported || new Date().toISOString().split('T')[0],
    time_reported: b.timeReported || '08:00',
    incident_date: b.incidentDate || b.dateReported || new Date().toISOString().split('T')[0],
    incident_time: b.incidentTime || '08:00',
    incident_location: b.incidentLocation || b.purok || 'Barangay Sangkol',
    purok: b.purok || 'Purok Pinya',
    complainant_name: b.complainantName || 'Complainant',
    complainant_address: b.complainantAddress || 'Barangay Sangkol',
    complainant_contact: toNullableString(b.complainantContact),
    respondent_name: b.respondentName || 'Respondent',
    respondent_address: b.respondentAddress || 'Barangay Sangkol',
    respondent_contact: toNullableString(b.respondentContact),
    witnesses: toNullableString(b.witnesses),
    narrative: b.narrative || 'Incident report narrative.',
    action_taken: toNullableString(b.actionTaken),
    assigned_officer: b.assignedOfficer || 'Desk Officer',
    status: sanitizeBlotterStatus(b.status),
    resolution_date: toNullableString(b.resolutionDate),
    resolution_notes: toNullableString(b.resolutionNotes),
    recorded_by: b.recordedBy || 'Desk Officer',
    hearing_date: toNullableString(b.hearingDate),
    hearing_time: toNullableString(b.hearingTime),
    hearing_stage: toNullableString(b.hearingStage),
    mediator: toNullableString(b.mediator),
    settlement_terms: toNullableString(b.settlementTerms),
    pnp_station: toNullableString(b.pnpStation),
    pnp_endorsement_no: toNullableString(b.pnpEndorsementNo),
    last_updated: b.lastUpdated || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function complaintFromRow(row: any): ComplaintRecord {
  return {
    id: row.id,
    caseNumber: row.case_number || row.id,
    caseTitle: row.case_title || undefined,
    natureOfComplaint: row.nature_of_complaint || '',
    dateFiled: row.date_filed || new Date().toISOString().split('T')[0],
    complainantName: row.complainant_name || '',
    complainant: row.complainant_name || '',
    complainantContact: row.complainant_contact || undefined,
    complainantAddress: row.complainant_address || undefined,
    respondentName: row.respondent_name || '',
    respondent: row.respondent_name || '',
    respondentContact: row.respondent_contact || undefined,
    respondentAddress: row.respondent_address || undefined,
    stage: row.hearing_stage || undefined,
    hearingStage: row.hearing_stage || undefined,
    hearingRound: row.hearing_round ? Number(row.hearing_round) : 1,
    hearingDate: row.hearing_date || undefined,
    hearingTime: row.hearing_time || undefined,
    mediatorName: row.mediator_name || undefined,
    mediatorOfficial: row.mediator_official || undefined,
    complaintSummary: row.complaint_summary || undefined,
    proceedingsNotes: Array.isArray(row.proceedings_notes)
      ? row.proceedings_notes
      : typeof row.proceedings_notes === 'string'
      ? JSON.parse(row.proceedings_notes || '[]')
      : [],
    settlementTerms: row.settlement_terms || undefined,
    remarks: row.remarks || undefined,
    certificateToFileActionIssued: Boolean(row.certificate_to_file_action_issued),
    status: row.status || 'Ongoing Mediation',
    dateSettled: row.date_settled || undefined,
  };
}

export function complaintToRow(c: ComplaintRecord): any {
  return {
    id: c.id,
    case_number: c.caseNumber || c.id,
    case_title: c.caseTitle || `${c.natureOfComplaint || 'Complaint'} - ${c.complainantName || 'Complainant'} vs ${c.respondentName || 'Respondent'}`,
    nature_of_complaint: c.natureOfComplaint || 'General Dispute',
    date_filed: c.dateFiled || new Date().toISOString().split('T')[0],
    complainant_name: c.complainantName || c.complainant || 'Complainant',
    complainant_contact: toNullableString(c.complainantContact || c.contactNumber),
    complainant_address: toNullableString(c.complainantAddress),
    respondent_name: c.respondentName || c.respondent || 'Respondent',
    respondent_contact: toNullableString(c.respondentContact),
    respondent_address: toNullableString(c.respondentAddress),
    hearing_stage: c.hearingStage || c.stage || '1st Mediation',
    hearing_round: Number(c.hearingRound) || 1,
    hearing_date: toNullableString(c.hearingDate),
    hearing_time: toNullableString(c.hearingTime),
    mediator_name: toNullableString(c.mediatorName || c.mediator),
    mediator_official: toNullableString(c.mediatorOfficial),
    complaint_summary: toNullableString(c.complaintSummary),
    proceedings_notes: Array.isArray(c.proceedingsNotes) ? c.proceedingsNotes : [],
    settlement_terms: toNullableString(c.settlementTerms),
    remarks: toNullableString(c.remarks),
    certificate_to_file_action_issued: Boolean(c.certificateToFileActionIssued),
    status: c.status || 'Ongoing Mediation',
    date_settled: toNullableString(c.dateSettled),
    updated_at: new Date().toISOString(),
  };
}

export function businessFromRow(row: any): BusinessRecord {
  return {
    id: row.id,
    businessName: row.business_name,
    ownerName: row.owner_name,
    ownerResidentId: row.owner_resident_id || undefined,
    businessType: row.business_type,
    category: row.category,
    address: row.address,
    purok: row.purok,
    contactNumber: row.contact_number,
    email: row.email || undefined,
    dtiOrSecNo: row.dti_or_sec_no || undefined,
    tinNo: row.tin_no || undefined,
    capitalInvestment: Number(row.capital_investment) || 0,
    grossSales: Number(row.gross_sales) || 0,
    barangayClearanceNo: row.barangay_clearance_no,
    clearanceIssueDate: row.clearance_issue_date,
    clearanceExpiryDate: row.clearance_expiry_date,
    feePaid: Number(row.fee_paid) || 0,
    orNumber: row.or_number,
    status: row.status,
    employeesCount: Number(row.employees_count) || 1,
  };
}

export function businessToRow(b: BusinessRecord): any {
  return {
    id: b.id,
    business_name: b.businessName,
    owner_name: b.ownerName,
    owner_resident_id: toNullableString(b.ownerResidentId),
    business_type: b.businessType || 'Sole Proprietorship',
    category: b.category || 'Retail / Sari-Sari Store',
    address: b.address || 'Barangay Sangkol',
    purok: b.purok || 'Purok Pinya',
    contact_number: toNullableString(b.contactNumber),
    email: toNullableString(b.email),
    dti_or_sec_no: toNullableString(b.dtiOrSecNo),
    tin_no: toNullableString(b.tinNo),
    capital_investment: Number(b.capitalInvestment) || 0,
    gross_sales: Number(b.grossSales) || 0,
    barangay_clearance_no: toNullableString(b.barangayClearanceNo),
    clearance_issue_date: toNullableString(b.clearanceIssueDate),
    clearance_expiry_date: toNullableString(b.clearanceExpiryDate),
    fee_paid: Number(b.feePaid) || 0,
    or_number: toNullableString(b.orNumber),
    status: sanitizeBusinessStatus(b.status),
    employees_count: Number(b.employeesCount) || 1,
    updated_at: new Date().toISOString(),
  };
}

export function announcementFromRow(row: any): AnnouncementRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    targetAudience: row.target_audience,
    publishDate: row.publish_date,
    eventDate: row.event_date || undefined,
    eventTime: row.event_time || undefined,
    venue: row.venue || undefined,
    isPinned: Boolean(row.is_pinned),
    status: row.status,
    author: row.author,
    requiresRegistration: Boolean(row.requires_registration),
    maxSlots: row.max_slots ? Number(row.max_slots) : undefined,
    attendeesCount: row.attendees_count ? Number(row.attendees_count) : 0,
  };
}

export function announcementToRow(a: AnnouncementRecord): any {
  return {
    id: a.id,
    title: a.title,
    category: a.category,
    content: a.content,
    target_audience: a.targetAudience || 'All Residents',
    publish_date: a.publishDate || new Date().toISOString().split('T')[0],
    event_date: toNullableString(a.eventDate),
    event_time: toNullableString(a.eventTime),
    venue: toNullableString(a.venue),
    is_pinned: Boolean(a.isPinned),
    status: sanitizeAnnStatus(a.status),
    author: a.author || 'Barangay Council',
    requires_registration: Boolean(a.requiresRegistration),
    max_slots: a.maxSlots ? Number(a.maxSlots) : null,
    attendees_count: Number(a.attendeesCount) || 0,
    updated_at: new Date().toISOString(),
  };
}

export function activityFromRow(row: any): CommunityActivity {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    date: row.date,
    time: row.time,
    venue: row.venue,
    location: row.venue || undefined,
    targetPurok: row.target_purok || 'All Puroks',
    organizer: row.organizer,
    attendeesCount: Number(row.attendees_count) || 0,
    maxAttendees: row.max_attendees ? Number(row.max_attendees) : undefined,
    maxParticipants: row.max_participants ? Number(row.max_participants) : (row.max_attendees ? Number(row.max_attendees) : undefined),
    status: row.status,
    isFeatured: Boolean(row.is_featured),
    requirements: row.requirements || undefined,
    contactPerson: row.contact_person || undefined,
    requiresRegistration: Boolean(row.requires_registration),
  };
}

export function activityToRow(a: CommunityActivity): any {
  return {
    id: a.id,
    title: a.title,
    category: a.category,
    description: a.description,
    date: a.date || new Date().toISOString().split('T')[0],
    time: toNullableString(a.time),
    venue: a.venue || 'Barangay Gymnasium',
    target_purok: a.targetPurok || 'All Puroks',
    organizer: a.organizer || 'SK Council',
    attendees_count: Number(a.attendeesCount) || 0,
    max_attendees: a.maxAttendees ? Number(a.maxAttendees) : null,
    max_participants: a.maxParticipants || a.maxAttendees ? Number(a.maxParticipants || a.maxAttendees) : null,
    status: sanitizeActivityStatus(a.status),
    is_featured: Boolean(a.isFeatured),
    requirements: toNullableString(a.requirements),
    contact_person: toNullableString(a.contactPerson),
    requires_registration: Boolean(a.requiresRegistration),
    updated_at: new Date().toISOString(),
  };
}

export function announcementAttendeeFromRow(row: any): AnnouncementAttendee {
  return {
    id: row.id,
    announcementId: row.announcement_id,
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Resident',
    purok: row.purok || 'Purok Mangga',
    contactNumber: row.contact_number || '0917-000-0000',
    email: row.email || undefined,
    registeredAt: row.registered_at || new Date().toISOString(),
    attendanceStatus: row.attendance_status || 'Registered',
    attendedAt: row.attended_at || undefined,
    verifiedBy: row.verified_by || undefined,
    remarks: row.remarks || undefined,
    householdNo: row.household_no || undefined,
    voterStatus: row.voter_status || undefined,
    sector: row.sector || undefined,
  };
}

export function announcementAttendeeToRow(att: AnnouncementAttendee): any {
  return {
    id: att.id,
    announcement_id: att.announcementId,
    resident_id: toNullableString(att.residentId),
    resident_name: att.residentName || 'Resident',
    purok: att.purok || 'Purok Mangga',
    contact_number: toNullableString(att.contactNumber),
    email: toNullableString(att.email),
    registered_at: att.registeredAt || new Date().toISOString(),
    attendance_status: att.attendanceStatus || 'Registered',
    attended_at: toNullableString(att.attendedAt),
    verified_by: toNullableString(att.verifiedBy),
    remarks: toNullableString(att.remarks),
    household_no: toNullableString(att.householdNo),
    voter_status: toNullableString(att.voterStatus),
    sector: toNullableString(att.sector),
  };
}

export function activityAttendeeFromRow(row: any): ActivityAttendee {
  return {
    id: row.id,
    activityId: row.activity_id,
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Resident',
    purok: row.purok || 'Purok Mangga',
    contactNumber: row.contact_number || '0917-000-0000',
    email: row.email || undefined,
    registeredAt: row.registered_at || new Date().toISOString(),
    attendanceStatus: row.attendance_status || 'Registered',
    attendedAt: row.attended_at || undefined,
    verifiedBy: row.verified_by || undefined,
    remarks: row.remarks || undefined,
    householdNo: row.household_no || undefined,
    voterStatus: row.voter_status || undefined,
    sector: row.sector || undefined,
  };
}

export function activityAttendeeToRow(att: ActivityAttendee): any {
  return {
    id: att.id,
    activity_id: att.activityId,
    resident_id: toNullableString(att.residentId),
    resident_name: att.residentName || 'Resident',
    purok: att.purok || 'Purok Mangga',
    contact_number: toNullableString(att.contactNumber),
    email: toNullableString(att.email),
    registered_at: att.registeredAt || new Date().toISOString(),
    attendance_status: att.attendanceStatus || 'Registered',
    attended_at: toNullableString(att.attendedAt),
    verified_by: toNullableString(att.verifiedBy),
    remarks: toNullableString(att.remarks),
    household_no: toNullableString(att.householdNo),
    voter_status: toNullableString(att.voterStatus),
    sector: toNullableString(att.sector),
  };
}

export function concernFromRow(row: any): CitizenConcern {
  return {
    id: row.id,
    residentName: row.resident_name,
    residentId: row.resident_id || undefined,
    purok: row.purok,
    contactNumber: row.contact_number,
    email: row.email || undefined,
    subject: row.subject,
    category: row.category,
    description: row.description,
    locationDetails: row.location_details || undefined,
    dateSubmitted: row.date_submitted,
    status: row.status,
    priority: row.priority,
    isRead: Boolean(row.is_read),
    assignedTo: row.assigned_to || undefined,
  };
}

export function concernToRow(c: CitizenConcern): any {
  return {
    id: c.id,
    resident_name: c.residentName || 'Resident',
    resident_id: toNullableString(c.residentId),
    purok: c.purok || 'Purok Pinya',
    contact_number: toNullableString(c.contactNumber),
    email: toNullableString(c.email),
    subject: c.subject || 'Citizen Concern',
    category: c.category || 'General Concern',
    description: c.description || 'Concern report details.',
    location_details: toNullableString(c.locationDetails),
    date_submitted: c.dateSubmitted || new Date().toISOString(),
    status: sanitizeConcernStatus(c.status),
    priority: sanitizeConcernPriority(c.priority),
    is_read: Boolean(c.isRead),
    assigned_to: toNullableString(c.assignedTo),
    updated_at: new Date().toISOString(),
  };
}

export function appointmentFromRow(row: any): AppointmentRecord {
  return {
    id: row.id,
    title: row.title,
    purpose: row.purpose,
    date: row.date,
    time: row.time,
    residentName: row.resident_name,
    residentId: row.resident_id || undefined,
    contactNumber: row.contact_number,
    email: row.email || undefined,
    assignedOfficial: row.assigned_official,
    location: row.location,
    status: row.status,
    notes: row.notes || undefined,
  };
}

export function appointmentToRow(a: AppointmentRecord): any {
  return {
    id: a.id,
    title: a.title || 'Barangay Appointment',
    purpose: a.purpose || 'Barangay Consultation',
    date: a.date || new Date().toISOString().split('T')[0],
    time: a.time || '09:00 AM',
    resident_name: a.residentName || 'Resident',
    resident_id: toNullableString(a.residentId),
    contact_number: toNullableString(a.contactNumber),
    email: toNullableString(a.email),
    assigned_official: a.assignedOfficial || 'Barangay Secretary',
    location: a.location || 'Barangay Hall',
    status: sanitizeApptStatus(a.status),
    notes: toNullableString(a.notes),
    updated_at: new Date().toISOString(),
  };
}

export function documentFromRow(row: any): DocumentRecord {
  return {
    id: row.id,
    title: row.title,
    documentType: row.document_type,
    category: row.category,
    documentNo: row.document_no,
    seriesYear: row.series_year,
    authorOrSponsor: row.author_or_sponsor,
    dateAdopted: row.date_adopted,
    summary: row.summary,
    description: row.description,
    fileUrl: row.file_url,
    tags: Array.isArray(row.tags) ? row.tags : [],
    status: row.status,
  };
}

export function documentToRow(d: DocumentRecord): any {
  return {
    id: d.id,
    title: d.title,
    document_type: d.documentType || 'Resolution',
    category: toNullableString(d.category),
    document_no: toNullableString(d.documentNo),
    series_year: toNullableString(d.seriesYear),
    author_or_sponsor: toNullableString(d.authorOrSponsor),
    date_adopted: toNullableString(d.dateAdopted),
    date_uploaded: new Date().toISOString().split('T')[0],
    summary: d.summary || '',
    description: toNullableString(d.description),
    file_url: toNullableString(d.fileUrl),
    tags: Array.isArray(d.tags) ? d.tags : [],
    status: d.status || 'Approved',
    updated_at: new Date().toISOString(),
  };
}

export function transactionFromRow(row: any): FinancialTransaction {
  return {
    id: row.id,
    orNumber: row.or_number,
    date: row.date,
    payorName: row.payor_name,
    serviceType: row.service_type,
    amount: Number(row.amount) || 0,
    paymentMethod: row.payment_method || 'Cash',
    cashierName: row.cashier_name,
    remarks: row.remarks || undefined,
  };
}

export function transactionToRow(t: FinancialTransaction): any {
  return {
    id: t.id,
    or_number: t.orNumber || t.id,
    date: t.date || new Date().toISOString().split('T')[0],
    payor_name: t.payorName || 'Payor',
    service_type: t.serviceType || 'Barangay Clearance Fee',
    amount: Number(t.amount) || 0,
    payment_method: sanitizePaymentMethod(t.paymentMethod),
    cashier_name: t.cashierName || 'Barangay Treasurer',
    remarks: toNullableString(t.remarks),
  };
}

export function auditLogFromRow(row: any): AuditLog {
  return {
    id: row.id,
    timestamp: row.timestamp,
    userId: row.user_id,
    userName: row.user_name,
    userRole: row.user_role,
    ipAddress: row.ip_address,
    action: row.action,
    module: row.module,
    details: row.details,
  };
}

export function auditLogToRow(l: AuditLog): any {
  return {
    id: l.id,
    timestamp: l.timestamp || new Date().toISOString(),
    user_id: toNullableString(l.userId),
    user_name: l.userName || 'System',
    user_role: l.userRole || 'Admin',
    user_avatar: null,
    ip_address: l.ipAddress || '127.0.0.1',
    action: l.action || 'LOG',
    module: l.module || 'System',
    details: l.details || '',
  };
}

export function settingsFromRow(row: any): BarangaySettings {
  const clearanceFee = Number(row.clearance_fee_regular) || 50.0;
  const businessFee = Number(row.business_clearance_fee) || 300.0;
  const residencyFee = Number(row.residency_cert_fee) || 50.0;
  const indigencyFee = Number(row.indigency_cert_fee) || 0.0;
  const goodMoralFee = Number(row.good_moral_fee) || 50.0;

  return {
    barangayName: row.barangay_name || 'Barangay Sangkol',
    municipality: row.municipality || 'City of Dipolog',
    province: row.province || 'Province of Zamboanga del Norte',
    region: row.region || 'Region IX - Zamboanga Peninsula',
    zipCode: row.zip_code || '7100',
    punongBarangay: row.punong_barangay || row.barangay_captain || 'Hon. Rogelio D. Regañon',
    punongBarangayName: row.punong_barangay || row.barangay_captain || undefined,
    barangayCaptain: row.barangay_captain || row.punong_barangay || undefined,
    barangaySecretary: row.barangay_secretary || 'Atty. Maria Elena V. Ramos',
    barangayTreasurer: row.barangay_treasurer || 'Mrs. Cynthia T. Bautista',
    skChairperson: row.sk_chairperson || undefined,
    kagawads: Array.isArray(row.kagawads) ? row.kagawads : [],
    contactNumber: row.contact_number || '(062) 991-8842 / 0917-890-4421',
    email: row.email || 'barangay.sangkol.office@gov.ph',
    hallAddress: row.hall_address || 'Barangay Hall Complex, Purok Mangga, Barangay Sangkol',
    officeHours: row.office_hours || 'Monday - Friday: 8:00 AM - 5:00 PM',
    clearanceFeeRegular: clearanceFee,
    businessClearanceFee: businessFee,
    residencyCertFee: residencyFee,
    indigencyCertFee: indigencyFee,
    goodMoralFee: goodMoralFee,
    certificateFees: {
      'Barangay Clearance': clearanceFee,
      'Business Clearance': businessFee,
      'Residency Certification': residencyFee,
      'Indigency Certificate': indigencyFee,
      'Good Moral Character': goodMoralFee,
    },
    puroks: Array.isArray(row.puroks) && row.puroks.length > 0
      ? row.puroks
      : ['Purok Pinya', 'Purok Mangga', 'Purok Tambis', 'Purok Bayabas', 'Purok Caimito', 'Purok Lomboy'],
    termStart: row.term_start || undefined,
    termEnd: row.term_end || undefined,
    tagline: row.tagline || undefined,
    captainSignatureUrl: row.captain_signature_url || undefined,
    logoUrl: row.logo_url || undefined,
    republicLogoUrl: row.republic_logo_url || undefined,
    theme: row.theme || 'light',
    isDarkMode: Boolean(row.is_dark_mode),
  };
}

export function settingsToRow(s: BarangaySettings): any {
  const clearanceFee = Number(s.certificateFees?.['Barangay Clearance'] ?? s.clearanceFeeRegular) || 50;
  const businessFee = Number(s.certificateFees?.['Business Clearance'] ?? s.businessClearanceFee) || 300;
  const residencyFee = Number(s.certificateFees?.['Residency Certification'] ?? s.residencyCertFee) || 50;
  const indigencyFee = Number(s.certificateFees?.['Indigency Certificate'] ?? s.indigencyCertFee) || 0;
  const goodMoralFee = Number(s.certificateFees?.['Good Moral Character'] ?? s.goodMoralFee) || 50;

  return {
    id: 1,
    barangay_name: s.barangayName || 'Barangay Sangkol',
    municipality: s.municipality || 'City of Dipolog',
    province: s.province || 'Province of Zamboanga del Norte',
    region: s.region || 'Region IX - Zamboanga Peninsula',
    zip_code: s.zipCode || '7100',
    punong_barangay: s.punongBarangay || s.barangayCaptain || 'Hon. Rogelio D. Regañon',
    barangay_captain: s.barangayCaptain || s.punongBarangay || 'Hon. Rogelio D. Regañon',
    barangay_secretary: s.barangaySecretary || '',
    barangay_treasurer: s.barangayTreasurer || '',
    sk_chairperson: toNullableString(s.skChairperson),
    kagawads: Array.isArray(s.kagawads) ? s.kagawads : [],
    contact_number: s.contactNumber || '',
    email: s.email || '',
    hall_address: s.hallAddress || '',
    office_hours: s.officeHours || 'Monday - Friday: 8:00 AM - 5:00 PM',
    clearance_fee_regular: clearanceFee,
    business_clearance_fee: businessFee,
    residency_cert_fee: residencyFee,
    indigency_cert_fee: indigencyFee,
    good_moral_fee: goodMoralFee,
    puroks: Array.isArray(s.puroks) ? s.puroks : [],
    term_start: toNullableString(s.termStart),
    term_end: toNullableString(s.termEnd),
    tagline: toNullableString(s.tagline),
    captain_signature_url: toNullableString(s.captainSignatureUrl),
    logo_url: toNullableString(s.logoUrl),
    republic_logo_url: toNullableString(s.republicLogoUrl),
    theme: s.theme || 'light',
    is_dark_mode: Boolean(s.isDarkMode),
    updated_at: new Date().toISOString(),
  };
}

export function systemNotificationFromRow(row: any): SystemNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    timestamp: row.timestamp || row.created_at || new Date().toISOString(),
    type: row.type || 'info',
    category: row.category || 'general',
    targetUserId: row.target_user_id || undefined,
    targetResidentId: row.target_resident_id || undefined,
    targetRole: row.target_role || 'All',
    linkModule: row.link_module || undefined,
    certificateId: row.certificate_id || undefined,
    controlNumber: row.control_number || undefined,
    read: Boolean(row.is_read),
    transactionId: row.transaction_id || undefined,
    orNumber: row.or_number || undefined,
    amount: row.amount ? Number(row.amount) : undefined,
    payorName: row.payor_name || undefined,
    serviceType: row.service_type || undefined,
    paymentMethod: row.payment_method || undefined,
    cashierName: row.cashier_name || undefined,
    targetRecordId: row.target_record_id || undefined,
    actionText: row.action_text || undefined,
    isTransactionNotification: Boolean(row.is_transaction_notification),
    residentName: row.resident_name || undefined,
  };
}

export function systemNotificationToRow(n: SystemNotification): any {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    timestamp: n.timestamp || new Date().toISOString(),
    type: n.type || 'info',
    category: n.category || 'general',
    target_user_id: toNullableString(n.targetUserId),
    target_resident_id: toNullableString(n.targetResidentId),
    target_role: toNullableString(n.targetRole),
    link_module: toNullableString(n.linkModule),
    certificate_id: toNullableString(n.certificateId),
    control_number: toNullableString(n.controlNumber),
    transaction_id: toNullableString(n.transactionId),
    or_number: toNullableString(n.orNumber),
    amount: n.amount !== undefined ? Number(n.amount) : 0,
    payor_name: toNullableString(n.payorName),
    service_type: toNullableString(n.serviceType),
    payment_method: toNullableString(n.paymentMethod),
    cashier_name: toNullableString(n.cashierName),
    target_record_id: toNullableString(n.targetRecordId),
    action_text: toNullableString(n.actionText),
    is_transaction_notification: Boolean(n.isTransactionNotification),
    resident_name: toNullableString(n.residentName),
    is_read: Boolean(n.read),
  };
}

export function barangayFileFromRow(row: any): BarangayFileRecord {
  return {
    id: row.id,
    fileName: row.file_name,
    fileTitle: row.file_title,
    title: row.file_title,
    fileCategory: row.file_category,
    fileType: row.file_type || 'PDF',
    mimeType: row.mime_type || 'application/pdf',
    fileSize: Number(row.file_size) || 0,
    fileSizeBytes: Number(row.file_size) || 0,
    fileSizeFormatted: row.file_size_formatted || '1.0 MB',
    storagePath: row.storage_path || '',
    filePath: row.storage_path || '',
    uploaderId: row.uploader_id || 'USR-2026-0001',
    uploaderName: row.uploader_name || 'Administrator',
    uploaderRole: row.uploader_role || 'Punong Barangay',
    dateUploaded: row.date_uploaded || new Date().toISOString(),
    lastModified: row.last_modified || undefined,
    accessLevel: row.access_level || 'Public (All Citizens)',
    status: row.status || 'Active / Verified',
    version: row.version || 'v1.0',
    fileHash: row.file_hash || '',
    linkedEntityId: row.linked_entity_id || undefined,
    linkedEntityType: row.linked_entity_type || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    downloadCount: Number(row.download_count) || 0,
    isConfidential: Boolean(row.is_confidential),
    retentionExpiry: row.retention_expiry || undefined,
    description: row.description || undefined,
    notes: row.notes || undefined,
  };
}

export function barangayFileToRow(f: BarangayFileRecord): any {
  return {
    id: f.id,
    file_name: f.fileName,
    file_title: f.fileTitle || f.title || f.fileName,
    file_category: f.fileCategory,
    file_type: f.fileType || 'PDF',
    mime_type: f.mimeType || 'application/pdf',
    file_size: Number(f.fileSize || f.fileSizeBytes || 0),
    file_size_formatted: f.fileSizeFormatted || '1.0 MB',
    storage_path: f.storagePath || f.filePath || `/files/${f.fileName}`,
    uploader_id: f.uploaderId || 'USR-2026-0001',
    uploader_name: f.uploaderName || 'Administrator',
    uploader_role: f.uploaderRole || 'Punong Barangay',
    date_uploaded: f.dateUploaded || new Date().toISOString(),
    last_modified: toNullableString(f.lastModified),
    access_level: f.accessLevel || 'Public (All Citizens)',
    status: f.status || 'Active / Verified',
    version: f.version || 'v1.0',
    file_hash: f.fileHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    linked_entity_id: toNullableString(f.linkedEntityId),
    linked_entity_type: toNullableString(f.linkedEntityType),
    tags: Array.isArray(f.tags) ? f.tags : [],
    download_count: Number(f.downloadCount) || 0,
    is_confidential: Boolean(f.isConfidential),
    retention_expiry: toNullableString(f.retentionExpiry),
    description: toNullableString(f.description),
    notes: toNullableString(f.notes),
    updated_at: new Date().toISOString(),
  };
}

export function smsAlertFromRow(row: any): SMSAlertRecord {
  return {
    id: row.id,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    recipientEmail: row.recipient_email || undefined,
    recipientResidentId: row.recipient_resident_id || undefined,
    purok: row.purok || undefined,
    category: row.category,
    subject: row.subject || '',
    smsMessage: row.sms_message,
    emailBody: row.email_body || undefined,
    channel: row.channel || 'SMS',
    sender: row.sender || 'BRGY-SANGKOL',
    status: row.status || 'Sent',
    timestamp: row.timestamp || new Date().toISOString(),
    relatedRecordId: row.related_record_id || undefined,
    relatedRecordType: row.related_record_type || undefined,
    metadata: row.metadata || undefined,
  };
}

export function smsAlertToRow(a: SMSAlertRecord): any {
  return {
    id: a.id,
    recipient_name: a.recipientName,
    recipient_phone: a.recipientPhone,
    recipient_email: toNullableString(a.recipientEmail),
    recipient_resident_id: toNullableString(a.recipientResidentId),
    purok: toNullableString(a.purok),
    category: a.category,
    subject: toNullableString(a.subject),
    sms_message: a.smsMessage,
    email_body: toNullableString(a.emailBody),
    channel: a.channel || 'SMS',
    sender: a.sender || 'BRGY-SANGKOL',
    status: a.status || 'Sent',
    timestamp: a.timestamp || new Date().toISOString(),
    related_record_id: toNullableString(a.relatedRecordId),
    related_record_type: toNullableString(a.relatedRecordType),
    metadata: a.metadata || {},
  };
}

export function blotterActivityLogFromRow(row: any): BlotterActivityLog & { blotterId: string } {
  return {
    id: row.id,
    blotterId: row.blotter_id,
    timestamp: row.timestamp || new Date().toISOString(),
    action: row.action,
    fromStatus: row.from_status || undefined,
    toStatus: row.to_status || undefined,
    performedBy: row.performed_by,
    role: row.role || undefined,
    notes: row.notes || '',
    hearingStage: row.hearing_stage || undefined,
    hearingDate: row.hearing_date || undefined,
    hearingTime: row.hearing_time || undefined,
    mediator: row.mediator || undefined,
    settlementTerms: row.settlement_terms || undefined,
    pnpStation: row.pnp_station || undefined,
    endorsementNumber: row.endorsement_number || undefined,
  };
}

export function blotterActivityLogToRow(log: BlotterActivityLog, blotterId: string): any {
  return {
    id: log.id || `BLT-LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    blotter_id: blotterId,
    timestamp: log.timestamp || new Date().toISOString(),
    action: log.action || 'Workflow Updated',
    from_status: toNullableString(log.fromStatus),
    to_status: toNullableString(log.toStatus),
    performed_by: log.performedBy || 'Barangay Officer',
    role: toNullableString(log.role),
    notes: toNullableString(log.notes),
    hearing_stage: toNullableString(log.hearingStage),
    hearing_date: toNullableString(log.hearingDate),
    hearing_time: toNullableString(log.hearingTime),
    mediator: toNullableString(log.mediator),
    settlement_terms: toNullableString(log.settlementTerms),
    pnp_station: toNullableString(log.pnpStation),
    endorsement_number: toNullableString(log.endorsementNumber),
  };
}

export function concernActionLogFromRow(row: any): ConcernActionLog & { id: number; concernId: string } {
  return {
    id: row.id,
    concernId: row.concern_id,
    timestamp: row.timestamp || new Date().toISOString(),
    action: row.action,
    actor: row.actor,
    notes: row.notes || undefined,
    statusAfter: row.status_after || undefined,
  };
}

export function concernActionLogToRow(log: ConcernActionLog, concernId: string): any {
  return {
    concern_id: concernId,
    timestamp: log.timestamp || new Date().toISOString(),
    action: log.action || 'Status Updated',
    actor: log.actor || 'Barangay Staff',
    notes: toNullableString(log.notes),
    status_after: toNullableString(log.statusAfter),
  };
}

export async function resolveValidBlotterId(blotterId?: string | null): Promise<string | null> {
  if (!blotterId) return null;
  const { data } = await supabase.from('blotters').select('id').eq('id', blotterId).maybeSingle();
  if (data && data.id) return data.id;
  const { data: first } = await supabase.from('blotters').select('id').limit(1).maybeSingle();
  return first ? first.id : null;
}

export async function resolveValidConcernId(concernId?: string | null): Promise<string | null> {
  if (!concernId) return null;
  const { data } = await supabase.from('citizen_concerns').select('id').eq('id', concernId).maybeSingle();
  if (data && data.id) return data.id;
  const { data: first } = await supabase.from('citizen_concerns').select('id').limit(1).maybeSingle();
  return first ? first.id : null;
}

// ==========================================
// SUPABASE DATA SERVICE CLIENT
// ==========================================

export interface SupabaseFullDatabase {
  settings?: BarangaySettings;
  residents: Resident[];
  users: SystemUser[];
  households: Household[];
  officials: BarangayOfficial[];
  certificates: CertificateRecord[];
  blotters: BlotterRecord[];
  complaints: ComplaintRecord[];
  businesses: BusinessRecord[];
  transactions: FinancialTransaction[];
  announcements: AnnouncementRecord[];
  announcementAttendees: AnnouncementAttendee[];
  activities: CommunityActivity[];
  activityAttendees: ActivityAttendee[];
  concerns: CitizenConcern[];
  appointments: AppointmentRecord[];
  documents: DocumentRecord[];
  auditLogs: AuditLog[];
  notifications: SystemNotification[];
  files: BarangayFileRecord[];
  smsAlerts: SMSAlertRecord[];
  blotterActivityLogs: (BlotterActivityLog & { blotterId: string })[];
  concernActionLogs: (ConcernActionLog & { id: number; concernId: string })[];
}

/**
 * Fetch all records across all tables directly from Supabase
 */
export async function fetchFullDatabase(): Promise<SupabaseFullDatabase> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured in .env');
  }

  const fetchTasks = [
    () => fetchAllRowsFromTable('barangay_settings', { limit: 1, batchSize: 1 }),
    () => fetchAllRowsFromTable('residents', { orderColumn: 'created_at', ascending: false }),
    () => fetchAllRowsFromTable('system_users', { orderColumn: 'created_at', ascending: true, batchSize: 100 }),
    () => fetchAllRowsFromTable('households', { orderColumn: 'created_at', ascending: true }),
    () => fetchAllRowsFromTable('household_members'),
    () => fetchAllRowsFromTable('barangay_officials', { orderColumn: 'display_order', ascending: true, batchSize: 50 }),
    () => fetchAllRowsFromTable('certificates', { orderColumn: 'created_at', ascending: false }),
    () => fetchAllRowsFromTable('blotters', { orderColumn: 'created_at', ascending: false }),
    () => fetchAllRowsFromTable('complaints', { orderColumn: 'date_filed', ascending: false }),
    () => fetchAllRowsFromTable('businesses', { orderColumn: 'created_at', ascending: false }),
    () => fetchAllRowsFromTable('financial_transactions', { orderColumn: 'created_at', ascending: false }),
    () => fetchAllRowsFromTable('announcements', { orderColumn: 'publish_date', ascending: false }),
    () => fetchAllRowsFromTable('announcement_attendees'),
    () => fetchAllRowsFromTable('community_activities', { orderColumn: 'date', ascending: true }),
    () => fetchAllRowsFromTable('activity_attendees'),
    () => fetchAllRowsFromTable('citizen_concerns', { orderColumn: 'date_submitted', ascending: false }),
    () => fetchAllRowsFromTable('appointments', { orderColumn: 'date', ascending: true }),
    () => fetchAllRowsFromTable('documents', { orderColumn: 'created_at', ascending: false }),
    () => fetchAllRowsFromTable('audit_logs', { orderColumn: 'timestamp', ascending: false, limit: 500 }),
    () => fetchAllRowsFromTable('system_notifications', { orderColumn: 'timestamp', ascending: false, limit: 500 }),
    () => fetchAllRowsFromTable('barangay_files', { orderColumn: 'date_uploaded', ascending: false }),
    () => fetchAllRowsFromTable('sms_alerts', { orderColumn: 'timestamp', ascending: false, limit: 500 }),
    () => fetchAllRowsFromTable('blotter_activity_logs', { orderColumn: 'timestamp', ascending: false }),
    () => fetchAllRowsFromTable('concern_action_logs', { orderColumn: 'timestamp', ascending: false }),
  ];

  const [
    settingsRows,
    residentsRows,
    usersRows,
    householdsRows,
    membersRows,
    officialsRows,
    certsRows,
    blottersRows,
    complaintsRows,
    bizRows,
    txRows,
    annRows,
    annAttendeesRows,
    actRows,
    actAttendeesRows,
    concernsRows,
    aptRows,
    docRows,
    logsRows,
    notifsRows,
    filesRows,
    smsRows,
    bltLogsRows,
    conLogsRows,
  ] = await runWithConcurrencyLimit(fetchTasks, 4);

  const allMembers = membersRows || [];
  const households = (householdsRows || []).map((h) => {
    const rawMembers = allMembers.filter((m) => m.household_id === h.id);
    const seenResidentIds = new Set<string>();
    const members = rawMembers.filter((m) => {
      const key = m.resident_id || `${m.name}-${m.relationship_to_head}`;
      if (seenResidentIds.has(key)) return false;
      seenResidentIds.add(key);
      return true;
    });
    return householdFromRow(h, members);
  });

  const dedupeById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  if (residentsRows) {
    for (const r of residentsRows) {
      if (r.id) registerVerifiedResidentId(r.id);
    }
  }

  return {
    settings: settingsRows && settingsRows[0] ? settingsFromRow(settingsRows[0]) : undefined,
    residents: dedupeById((residentsRows || []).map(residentFromRow)),
    users: dedupeById((usersRows || []).map(userFromRow)),
    households: dedupeById(households),
    officials: dedupeById((officialsRows || []).map(officialFromRow)),
    certificates: dedupeById((certsRows || []).map(certificateFromRow)),
    blotters: dedupeById((blottersRows || []).map(blotterFromRow)),
    complaints: dedupeById((complaintsRows || []).map(complaintFromRow)),
    businesses: dedupeById((bizRows || []).map(businessFromRow)),
    transactions: dedupeById((txRows || []).map(transactionFromRow)),
    announcements: dedupeById((annRows || []).map(announcementFromRow)),
    announcementAttendees: dedupeById((annAttendeesRows || []).map(announcementAttendeeFromRow)),
    activities: dedupeById((actRows || []).map(activityFromRow)),
    activityAttendees: dedupeById((actAttendeesRows || []).map(activityAttendeeFromRow)),
    concerns: dedupeById((concernsRows || []).map(concernFromRow)),
    appointments: dedupeById((aptRows || []).map(appointmentFromRow)),
    documents: dedupeById((docRows || []).map(documentFromRow)),
    auditLogs: dedupeById((logsRows || []).map(auditLogFromRow)),
    notifications: dedupeById((notifsRows || []).map(systemNotificationFromRow)),
    files: dedupeById((filesRows || []).map(barangayFileFromRow)),
    smsAlerts: dedupeById((smsRows || []).map(smsAlertFromRow)),
    blotterActivityLogs: (bltLogsRows || []).map(blotterActivityLogFromRow),
    concernActionLogs: (conLogsRows || []).map(concernActionLogFromRow),
  };
}

// ------------------------------------------
// INDIVIDUAL ENTITY UPSERT & DELETE HELPERS
// ------------------------------------------

export async function upsertResident(resident: Resident) {
  registerVerifiedResidentId(resident.id);
  const row = residentToRow(resident);
  const { data, error } = await supabase.from('residents').upsert(row);
  if (error) {
    console.error('Supabase upsert residents error:', error.message, error.details);
    throw new Error(`Failed to save resident to database: ${error.message}`);
  }
  return { data, error: null };
}

/**
 * Bulk upserts residents in chunks (e.g. 100 rows per request) to prevent network flooding,
 * timeouts, and PostgREST payload limits when importing thousands of residents.
 */
export async function bulkUpsertResidents(residents: Resident[], batchSize = 100): Promise<{ successCount: number; errorCount: number }> {
  if (!isSupabaseConfigured || !residents || residents.length === 0) {
    return { successCount: 0, errorCount: 0 };
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < residents.length; i += batchSize) {
    const chunk = residents.slice(i, i + batchSize);
    const rows = chunk.map((r) => {
      registerVerifiedResidentId(r.id);
      return residentToRow(r);
    });

    try {
      const { error } = await supabase.from('residents').upsert(rows);
      if (error) {
        console.warn(`Batch upsert error on slice [${i}-${i + chunk.length}], falling back to itemized upsert:`, error.message);
        // Fall back to individual items so valid records are not lost
        for (const res of chunk) {
          try {
            await upsertResident(res);
            successCount++;
          } catch (singleErr) {
            console.error(`Failed to upsert resident ${res.id}:`, singleErr);
            errorCount++;
          }
        }
      } else {
        successCount += chunk.length;
      }
    } catch (batchErr) {
      console.error(`Unexpected exception in batch upsert [${i}-${i + chunk.length}]:`, batchErr);
      for (const res of chunk) {
        try {
          await upsertResident(res);
          successCount++;
        } catch {
          errorCount++;
        }
      }
    }
  }

  return { successCount, errorCount };
}

export async function bulkUpsertBusinesses(businesses: BusinessRecord[], batchSize = 100) {
  if (!isSupabaseConfigured || !businesses || businesses.length === 0) return;
  for (let i = 0; i < businesses.length; i += batchSize) {
    const chunk = businesses.slice(i, i + batchSize);
    const rows = chunk.map(businessToRow);
    const { error } = await supabase.from('businesses').upsert(rows);
    if (error) console.error('Bulk upsert businesses error:', error.message);
  }
}

export async function bulkUpsertHouseholds(households: Household[], batchSize = 50) {
  if (!isSupabaseConfigured || !households || households.length === 0) return;
  for (const h of households) {
    try {
      await upsertHousehold(h);
    } catch (e) {
      console.error('Bulk upsert household error:', e);
    }
  }
}

export async function bulkUpsertBlotters(blotters: BlotterRecord[], batchSize = 100) {
  if (!isSupabaseConfigured || !blotters || blotters.length === 0) return;
  for (let i = 0; i < blotters.length; i += batchSize) {
    const chunk = blotters.slice(i, i + batchSize);
    for (const b of chunk) {
      try {
        await upsertBlotter(b);
      } catch (e) {
        console.error('Bulk upsert blotter error:', e);
      }
    }
  }
}

export async function deleteResident(id: string) {
  const { data, error } = await supabase.from('residents').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete residents error:', error.message);
    throw new Error(`Failed to delete resident from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertUser(user: SystemUser) {
  let row = userToRow(user);
  let { data, error } = await supabase.from('system_users').upsert(row);

  // Schema resilience: if auth_id or any optional column is missing in schema cache, retry without it
  if (error && (error.message?.includes("'auth_id'") || error.message?.includes("auth_id"))) {
    console.warn('Retrying upsert without auth_id due to schema cache mismatch:', error.message);
    const { auth_id, ...rowWithoutAuthId } = row;
    const retryResult = await supabase.from('system_users').upsert(rowWithoutAuthId);
    data = retryResult.data;
    error = retryResult.error;
  }

  if (error) {
    console.warn('Supabase upsert system_users notice:', error.message);
    // Non-fatal: do not throw hard runtime crash if local state persists
    return { data: null, error };
  }
  return { data, error: null };
}

export async function deleteUser(id: string) {
  const { data, error } = await supabase.from('system_users').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete system_users error:', error.message);
    throw new Error(`Failed to delete user from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertHousehold(household: Household) {
  const validHeadId = await resolveValidResidentId(household.headResidentId);
  const row = householdToRow({
    ...household,
    headResidentId: validHeadId || undefined,
  });
  const { data, error } = await supabase.from('households').upsert(row);
  if (error) {
    console.error('Supabase upsert households error:', error.message, error.details);
    throw new Error(`Failed to save household to database: ${error.message}`);
  }

  // Sync members
  if (household.members && household.members.length > 0) {
    const memberRows = await Promise.all(household.members.map(async (m, idx) => ({
      id: m.id || `${household.id}-mem-${idx + 1}-${Date.now()}`,
      household_id: household.id,
      resident_id: await resolveValidResidentId(m.residentId),
      name: m.name || 'Family Member',
      relationship_to_head: ['Head', 'Spouse', 'Child', 'Parent', 'Sibling', 'Relative', 'Other'].includes(m.relationshipToHead) ? m.relationshipToHead : 'Relative',
      age: Number(m.age) || 0,
      sex: m.sex === 'Female' ? 'Female' : 'Male',
      occupation: toNullableString(m.occupation),
      contact_number: toNullableString(m.contactNumber),
      photo_url: toNullableString(m.photoUrl),
    })));
    await supabase.from('household_members').delete().eq('household_id', household.id);
    const { error: memErr } = await supabase.from('household_members').insert(memberRows);
    if (memErr) {
      console.warn('Warning syncing household members:', memErr.message);
    }
  }
  return { data, error: null };
}

export async function deleteHousehold(id: string) {
  await supabase.from('household_members').delete().eq('household_id', id);
  const { data, error } = await supabase.from('households').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete households error:', error.message);
    throw new Error(`Failed to delete household from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertOfficial(official: BarangayOfficial) {
  const validResidentId = await resolveValidResidentId(official.residentId);
  const row = officialToRow({
    ...official,
    residentId: validResidentId || undefined,
  });
  const { data, error } = await supabase.from('barangay_officials').upsert(row);
  if (error) {
    console.error('Supabase upsert barangay_officials error:', error.message, error.details);
    throw new Error(`Failed to save official to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteOfficial(id: string) {
  const { data, error } = await supabase.from('barangay_officials').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete barangay_officials error:', error.message);
    throw new Error(`Failed to delete official from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertCertificate(cert: CertificateRecord) {
  const validResidentId = await resolveValidResidentId(cert.residentId);
  const row = certificateToRow({
    ...cert,
    residentId: validResidentId || undefined,
  });
  const { data, error } = await supabase.from('certificates').upsert(row);
  if (error) {
    console.error('Supabase upsert certificates error:', error.message, error.details);
    throw new Error(`Failed to save certificate to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteCertificate(id: string) {
  const { data, error } = await supabase.from('certificates').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete certificates error:', error.message);
    throw new Error(`Failed to delete certificate from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertBlotter(blotter: BlotterRecord) {
  const validComplainantResidentId = await resolveValidResidentId(blotter.complainantResidentId);
  const validRespondentResidentId = await resolveValidResidentId(blotter.respondentResidentId);
  const row = blotterToRow({
    ...blotter,
    complainantResidentId: validComplainantResidentId || undefined,
    respondentResidentId: validRespondentResidentId || undefined,
  });
  const { data, error } = await supabase.from('blotters').upsert(row);
  if (error) {
    console.error('Supabase upsert blotters error:', error.message, error.details);
    throw new Error(`Failed to save blotter to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteBlotter(id: string) {
  const { data, error } = await supabase.from('blotters').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete blotters error:', error.message);
    throw new Error(`Failed to delete blotter from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertComplaint(complaint: ComplaintRecord) {
  const row = complaintToRow(complaint);
  const { data, error } = await supabase.from('complaints').upsert(row);
  if (error) {
    console.error('Supabase upsert complaints error:', error.message, error.details);
    throw new Error(`Failed to save complaint to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteComplaint(id: string) {
  const { data, error } = await supabase.from('complaints').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete complaints error:', error.message);
    throw new Error(`Failed to delete complaint from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertBusiness(biz: BusinessRecord) {
  const validOwnerResidentId = await resolveValidResidentId(biz.ownerResidentId);
  const row = businessToRow({
    ...biz,
    ownerResidentId: validOwnerResidentId || undefined,
  });
  const { data, error } = await supabase.from('businesses').upsert(row);
  if (error) {
    console.error('Supabase upsert businesses error:', error.message, error.details);
    throw new Error(`Failed to save business to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteBusiness(id: string) {
  const { data, error } = await supabase.from('businesses').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete businesses error:', error.message);
    throw new Error(`Failed to delete business from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertAnnouncement(ann: AnnouncementRecord) {
  const row = announcementToRow(ann);
  const { data, error } = await supabase.from('announcements').upsert(row);
  if (error) {
    console.error('Supabase upsert announcements error:', error.message, error.details);
    throw new Error(`Failed to save announcement to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteAnnouncement(id: string) {
  const { data, error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete announcements error:', error.message);
    throw new Error(`Failed to delete announcement from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertActivity(act: CommunityActivity) {
  const row = activityToRow(act);
  const { data, error } = await supabase.from('community_activities').upsert(row);
  if (error) {
    console.error('Supabase upsert community_activities error:', error.message, error.details);
    throw new Error(`Failed to save community activity to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteActivity(id: string) {
  const { data, error } = await supabase.from('community_activities').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete community_activities error:', error.message);
    throw new Error(`Failed to delete community activity from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertConcern(concern: CitizenConcern) {
  const validResidentId = await resolveValidResidentId(concern.residentId);
  const row = concernToRow({
    ...concern,
    residentId: validResidentId || undefined,
  });
  const { data, error } = await supabase.from('citizen_concerns').upsert(row);
  if (error) {
    console.error('Supabase upsert citizen_concerns error:', error.message, error.details);
    throw new Error(`Failed to save concern to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteConcern(id: string) {
  const { data, error } = await supabase.from('citizen_concerns').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete citizen_concerns error:', error.message);
    throw new Error(`Failed to delete concern from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertAppointment(apt: AppointmentRecord) {
  const validResidentId = await resolveValidResidentId(apt.residentId);
  const row = appointmentToRow({
    ...apt,
    residentId: validResidentId || undefined,
  });
  const { data, error } = await supabase.from('appointments').upsert(row);
  if (error) {
    console.error('Supabase upsert appointments error:', error.message, error.details);
    throw new Error(`Failed to save appointment to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteAppointment(id: string) {
  const { data, error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete appointments error:', error.message);
    throw new Error(`Failed to delete appointment from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertDocument(doc: DocumentRecord) {
  const row = documentToRow(doc);
  const { data, error } = await supabase.from('documents').upsert(row);
  if (error) {
    console.error('Supabase upsert documents error:', error.message, error.details);
    throw new Error(`Failed to save document to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteDocument(id: string) {
  const { data, error } = await supabase.from('documents').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete documents error:', error.message);
    throw new Error(`Failed to delete document from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertTransaction(tx: FinancialTransaction) {
  const row = transactionToRow(tx);
  const { data, error } = await supabase.from('financial_transactions').upsert(row);
  if (error) {
    console.error('Supabase upsert financial_transactions error:', error.message, error.details);
    throw new Error(`Failed to save transaction to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteTransaction(id: string) {
  const { data, error } = await supabase.from('financial_transactions').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete financial_transactions error:', error.message);
    throw new Error(`Failed to delete transaction from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertAuditLog(log: AuditLog) {
  const row = auditLogToRow(log);
  const { data, error } = await supabase.from('audit_logs').upsert(row);
  if (error) {
    console.warn('Supabase upsert audit_logs error:', error.message);
  }
  return { data, error: null };
}

export async function upsertSettings(settings: BarangaySettings) {
  let row: Record<string, any> = { ...settingsToRow(settings) };

  // Attempt upsert with explicit onConflict on id
  let res = await supabase.from('barangay_settings').upsert(row, { onConflict: 'id' }).select();

  // If there's an error, check if it's due to missing columns in user's Supabase schema and auto-heal
  let attempts = 0;
  while (res.error && attempts < 6) {
    attempts++;
    const errMsg = res.error.message || '';
    console.warn(`Supabase upsert barangay_settings attempt ${attempts} warning:`, errMsg);

    // Check for column missing in Postgres or PostgREST schema cache
    const colMatch = errMsg.match(/column "?([a-z0-9_]+)"? does not exist|'([a-z0-9_]+)' column/i);
    const missingCol = colMatch ? (colMatch[1] || colMatch[2]) : null;

    if (missingCol && missingCol in row) {
      console.info(`Auto-pruning non-existent column "${missingCol}" from barangay_settings payload and retrying...`);
      delete row[missingCol];
      res = await supabase.from('barangay_settings').upsert(row, { onConflict: 'id' }).select();
      continue;
    }

    // Try direct update on id 1
    const { data: updateData, error: updateError } = await supabase
      .from('barangay_settings')
      .update(row)
      .eq('id', 1)
      .select();

    if (!updateError && updateData && updateData.length > 0) {
      return { data: updateData, error: null };
    }

    if (updateError) {
      const updColMatch = (updateError.message || '').match(/column "?([a-z0-9_]+)"? does not exist|'([a-z0-9_]+)' column/i);
      const updMissingCol = updColMatch ? (updColMatch[1] || updColMatch[2]) : null;
      if (updMissingCol && updMissingCol in row) {
        console.info(`Auto-pruning non-existent column "${updMissingCol}" from update payload and retrying...`);
        delete row[updMissingCol];
        res = await supabase.from('barangay_settings').upsert(row, { onConflict: 'id' }).select();
        continue;
      }
    }

    // Try insert if record 1 does not exist yet
    const { data: insertData, error: insertError } = await supabase
      .from('barangay_settings')
      .insert([row])
      .select();

    if (!insertError && insertData && insertData.length > 0) {
      return { data: insertData, error: null };
    }

    break;
  }

  if (res.error) {
    console.error('Final Supabase direct save barangay_settings error:', res.error.message);
    // Return gracefully with error info without breaking client flow
    return { data: null, error: res.error };
  }
  return { data: res.data, error: null };
}

export async function resolveValidAnnouncementId(annId?: string | null): Promise<string> {
  if (!annId) return 'ANN-2026-001';
  const { data } = await supabase.from('announcements').select('id').eq('id', annId).maybeSingle();
  if (data && data.id) return data.id;
  const altId = annId === 'ANN-2026-0001' ? 'ANN-2026-001' : 'ANN-2026-0001';
  const { data: altData } = await supabase.from('announcements').select('id').eq('id', altId).maybeSingle();
  if (altData && altData.id) return altData.id;
  const { data: first } = await supabase.from('announcements').select('id').limit(1).maybeSingle();
  return first ? first.id : annId;
}

export async function resolveValidActivityId(actId?: string | null): Promise<string> {
  if (!actId) return 'ACT-2026-001';
  const { data } = await supabase.from('community_activities').select('id').eq('id', actId).maybeSingle();
  if (data && data.id) return data.id;
  const { data: first } = await supabase.from('community_activities').select('id').limit(1).maybeSingle();
  return first ? first.id : actId;
}

export async function upsertAnnouncementAttendee(att: AnnouncementAttendee) {
  const validResidentId = await resolveValidResidentId(att.residentId);
  const validAnnouncementId = await resolveValidAnnouncementId(att.announcementId);
  const row = announcementAttendeeToRow({
    ...att,
    announcementId: validAnnouncementId,
    residentId: validResidentId || undefined,
  });
  const { data, error } = await supabase.from('announcement_attendees').upsert(row);
  if (error) {
    console.error('Supabase upsert announcement_attendees error:', error.message, error.details);
    throw new Error(`Failed to save announcement attendee to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteAnnouncementAttendee(id: string) {
  const { data, error } = await supabase.from('announcement_attendees').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete announcement_attendees error:', error.message);
    throw new Error(`Failed to delete announcement attendee from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertActivityAttendee(att: ActivityAttendee) {
  const validResidentId = await resolveValidResidentId(att.residentId);
  const validActivityId = await resolveValidActivityId(att.activityId);
  const row = activityAttendeeToRow({
    ...att,
    activityId: validActivityId,
    residentId: validResidentId || undefined,
  });
  const { data, error } = await supabase.from('activity_attendees').upsert(row);
  if (error) {
    console.error('Supabase upsert activity_attendees error:', error.message, error.details);
    throw new Error(`Failed to save activity attendee to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteActivityAttendee(id: string) {
  const { data, error } = await supabase.from('activity_attendees').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete activity_attendees error:', error.message);
    throw new Error(`Failed to delete activity attendee from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertSystemNotification(n: SystemNotification) {
  const validResidentId = await resolveValidResidentId(n.targetResidentId);
  const row = systemNotificationToRow({
    ...n,
    targetResidentId: validResidentId || undefined,
  });
  const { data, error } = await supabase.from('system_notifications').upsert(row);
  if (error) {
    console.warn('Supabase upsert system_notifications error:', error.message);
  }
  return { data, error: null };
}

export async function deleteSystemNotification(id: string) {
  const { data, error } = await supabase.from('system_notifications').delete().eq('id', id);
  if (error) {
    console.warn('Supabase delete system_notifications error:', error.message);
  }
  return { data, error: null };
}

export async function upsertBarangayFile(f: BarangayFileRecord) {
  const row = barangayFileToRow(f);
  const { data, error } = await supabase.from('barangay_files').upsert(row);
  if (error) {
    console.error('Supabase upsert barangay_files error:', error.message);
    throw new Error(`Failed to save file to database: ${error.message}`);
  }
  return { data, error: null };
}

export async function deleteBarangayFile(id: string) {
  const { data, error } = await supabase.from('barangay_files').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete barangay_files error:', error.message);
    throw new Error(`Failed to delete file from database: ${error.message}`);
  }
  return { data, error: null };
}

export async function upsertSMSAlert(a: SMSAlertRecord) {
  const validResidentId = await resolveValidResidentId(a.recipientResidentId);
  const row = smsAlertToRow({
    ...a,
    recipientResidentId: validResidentId || undefined,
  });
  const { data, error } = await supabase.from('sms_alerts').upsert(row);
  if (error) {
    console.warn('Supabase upsert sms_alerts error:', error.message);
  }
  return { data, error: null };
}

export async function upsertBlotterActivityLog(log: BlotterActivityLog, blotterId: string) {
  const validBlotterId = await resolveValidBlotterId(blotterId);
  if (!validBlotterId) return { data: null, error: null };
  const row = blotterActivityLogToRow(log, validBlotterId);
  const { data, error } = await supabase.from('blotter_activity_logs').upsert(row);
  if (error) {
    console.warn('Supabase upsert blotter_activity_logs error:', error.message);
  }
  return { data, error: null };
}

export async function upsertConcernActionLog(log: ConcernActionLog, concernId: string) {
  const validConcernId = await resolveValidConcernId(concernId);
  if (!validConcernId) return { data: null, error: null };
  const row = concernActionLogToRow(log, validConcernId);
  const { data, error } = await supabase.from('concern_action_logs').insert(row);
  if (error) {
    console.warn('Supabase insert concern_action_logs error:', error.message);
  }
  return { data, error: null };
}

// -------------------------------------------------------------
// DATABASE INTEGRITY & COUNT MISMATCH RECONCILIATION SERVICE
// -------------------------------------------------------------

export interface TableMismatchInfo {
  tableName: string;
  localCount: number;
  dbCount: number;
  difference: number; // dbCount - localCount
  isMismatched: boolean;
  reconciled: boolean;
  reconciledCount?: number;
  error?: string;
}

export interface ReconciliationReport {
  timestamp: string;
  hasMismatches: boolean;
  totalMissingRecords: number;
  tablesChecked: number;
  mismatchedTablesCount: number;
  reconciledTablesCount: number;
  details: Record<string, TableMismatchInfo>;
  reconciledData: Partial<SupabaseFullDatabase>;
}

/**
 * Gets exact row count for a table directly from Supabase via lightweight HEAD query.
 * This transmits zero row payload over the network.
 */
export async function getTableExactCount(tableName: string): Promise<number> {
  if (!isSupabaseConfigured) return -1;
  try {
    const { count, error } = await (supabase as any)
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.warn(`[SupabaseService] Count check failed for table "${tableName}":`, error.message);
      return -1;
    }
    return count ?? 0;
  } catch (err: any) {
    console.warn(`[SupabaseService] Exception getting count for "${tableName}":`, err.message);
    return -1;
  }
}

/**
 * Fetches exact counts for all tracked tables concurrently.
 */
export async function getAllTableCounts(): Promise<Record<string, number>> {
  const trackedTables = [
    'residents',
    'households',
    'certificates',
    'blotters',
    'complaints',
    'businesses',
    'financial_transactions',
    'barangay_officials',
    'system_users',
    'announcements',
    'community_activities',
    'citizen_concerns',
    'appointments',
    'documents',
    'barangay_files',
  ];

  const results: Record<string, number> = {};
  if (!isSupabaseConfigured) return results;

  const countTasks = trackedTables.map((table) => async () => {
    const count = await getTableExactCount(table);
    return { table, count };
  });

  const resolved = await runWithConcurrencyLimit(countTasks, 4);
  for (const item of resolved) {
    results[item.table] = item.count;
  }

  return results;
}

/**
 * Detects count mismatches between local state and the Supabase database.
 * If any table in local state has fewer (or different) records than Supabase,
 * it returns a structured diagnostic report identifying exactly which tables are out of sync.
 */
export async function detectCountMismatches(
  localCounts: Record<string, number>
): Promise<{ hasMismatches: boolean; totalMissingRecords: number; details: Record<string, TableMismatchInfo> }> {
  const dbCounts = await getAllTableCounts();
  const details: Record<string, TableMismatchInfo> = {};
  let hasMismatches = false;
  let totalMissingRecords = 0;

  for (const [table, dbCount] of Object.entries(dbCounts)) {
    if (dbCount < 0) continue; // Skip tables that returned query errors
    const localCount = localCounts[table] ?? 0;
    const diff = dbCount - localCount;
    const isMismatched = diff !== 0;

    if (isMismatched) {
      hasMismatches = true;
      if (diff > 0) totalMissingRecords += diff;
      console.warn(
        `[DB Integrity Error Handler] Count mismatch detected in "${table}": Local State = ${localCount}, Supabase DB = ${dbCount} (Diff: ${diff > 0 ? `+${diff} missing` : diff})`
      );
    }

    details[table] = {
      tableName: table,
      localCount,
      dbCount,
      difference: diff,
      isMismatched,
      reconciled: false,
    };
  }

  return { hasMismatches, totalMissingRecords, details };
}

/**
 * Reconciles a single table by fetching all rows using pagination past PostgREST's 1000 limit.
 */
export async function reconcileSingleTable(tableName: string): Promise<any> {
  switch (tableName) {
    case 'residents': {
      const rows = await fetchAllRowsFromTable('residents', { orderColumn: 'created_at', ascending: false });
      for (const r of rows) {
        if (r.id) registerVerifiedResidentId(r.id);
      }
      return rows.map(residentFromRow);
    }
    case 'households': {
      const [householdRows, memberRows] = await Promise.all([
        fetchAllRowsFromTable('households', { orderColumn: 'created_at', ascending: true }),
        fetchAllRowsFromTable('household_members'),
      ]);
      const allMembers = memberRows || [];
      return (householdRows || []).map((h) => {
        const rawMembers = allMembers.filter((m) => m.household_id === h.id);
        const seenResidentIds = new Set<string>();
        const members = rawMembers.filter((m) => {
          const key = m.resident_id || `${m.name}-${m.relationship_to_head}`;
          if (seenResidentIds.has(key)) return false;
          seenResidentIds.add(key);
          return true;
        });
        return householdFromRow(h, members);
      });
    }
    case 'certificates': {
      const rows = await fetchAllRowsFromTable('certificates', { orderColumn: 'created_at', ascending: false });
      return rows.map(certificateFromRow);
    }
    case 'blotters': {
      const rows = await fetchAllRowsFromTable('blotters', { orderColumn: 'created_at', ascending: false });
      return rows.map(blotterFromRow);
    }
    case 'complaints': {
      const rows = await fetchAllRowsFromTable('complaints', { orderColumn: 'date_filed', ascending: false });
      return rows.map(complaintFromRow);
    }
    case 'businesses': {
      const rows = await fetchAllRowsFromTable('businesses', { orderColumn: 'created_at', ascending: false });
      return rows.map(businessFromRow);
    }
    case 'financial_transactions': {
      const rows = await fetchAllRowsFromTable('financial_transactions', { orderColumn: 'created_at', ascending: false });
      return rows.map(transactionFromRow);
    }
    case 'barangay_officials': {
      const rows = await fetchAllRowsFromTable('barangay_officials', { orderColumn: 'display_order', ascending: true, batchSize: 50, limit: 100 });
      return rows.map(officialFromRow);
    }
    case 'system_users': {
      const rows = await fetchAllRowsFromTable('system_users', { orderColumn: 'created_at', ascending: true, batchSize: 100, limit: 200 });
      return rows.map(userFromRow);
    }
    case 'announcements': {
      const rows = await fetchAllRowsFromTable('announcements', { orderColumn: 'publish_date', ascending: false });
      return rows.map(announcementFromRow);
    }
    case 'community_activities': {
      const rows = await fetchAllRowsFromTable('community_activities', { orderColumn: 'date', ascending: true });
      return rows.map(activityFromRow);
    }
    case 'citizen_concerns': {
      const rows = await fetchAllRowsFromTable('citizen_concerns', { orderColumn: 'date_submitted', ascending: false });
      return rows.map(concernFromRow);
    }
    case 'appointments': {
      const rows = await fetchAllRowsFromTable('appointments', { orderColumn: 'date', ascending: true });
      return rows.map(appointmentFromRow);
    }
    case 'documents': {
      const rows = await fetchAllRowsFromTable('documents', { orderColumn: 'created_at', ascending: false });
      return rows.map(documentFromRow);
    }
    case 'barangay_files': {
      const rows = await fetchAllRowsFromTable('barangay_files', { orderColumn: 'date_uploaded', ascending: false });
      return rows.map(barangayFileFromRow);
    }
    default:
      return null;
  }
}

/**
 * Robust Error Handler & Automated Reconciliation Sync:
 * 1. Queries Supabase for exact row counts across tables.
 * 2. Compares against current local state counts.
 * 3. If any count mismatch is detected, triggers an automated reconciliation sync
 *    that paginates past the PostgREST 1000 limit to retrieve 100% of missing records.
 * 4. Returns a comprehensive ReconciliationReport with the fresh datasets.
 */
export async function detectAndReconcileMismatches(
  localCounts: Record<string, number>,
  options?: {
    forcedTables?: string[];
    onMismatchDetected?: (mismatches: TableMismatchInfo[]) => void;
  }
): Promise<ReconciliationReport> {
  const timestamp = new Date().toISOString();
  const detection = await detectCountMismatches(localCounts);

  const report: ReconciliationReport = {
    timestamp,
    hasMismatches: detection.hasMismatches,
    totalMissingRecords: detection.totalMissingRecords,
    tablesChecked: Object.keys(detection.details).length,
    mismatchedTablesCount: 0,
    reconciledTablesCount: 0,
    details: detection.details,
    reconciledData: {},
  };

  const tablesToSync: string[] = [];

  for (const [table, info] of Object.entries(detection.details)) {
    if (info.isMismatched || (options?.forcedTables && options.forcedTables.includes(table))) {
      report.mismatchedTablesCount++;
      tablesToSync.push(table);
    }
  }

  if (tablesToSync.length > 0 && options?.onMismatchDetected) {
    options.onMismatchDetected(tablesToSync.map((t) => detection.details[t]));
  }

  // Trigger automated reconciliation sync for mismatched tables
  if (tablesToSync.length > 0) {
    console.info(
      `[DB Integrity Error Handler] Triggering automated reconciliation sync for ${tablesToSync.length} table(s): ${tablesToSync.join(', ')}`
    );

    const syncPromises = tablesToSync.map(async (table) => {
      try {
        const reconciledRecords = await reconcileSingleTable(table);
        if (reconciledRecords) {
          report.details[table].reconciled = true;
          report.details[table].reconciledCount = reconciledRecords.length;
          report.reconciledTablesCount++;
          return { table, data: reconciledRecords };
        }
      } catch (err: any) {
        console.error(`[DB Integrity Error Handler] Reconciliation failed for table "${table}":`, err);
        report.details[table].error = err.message || 'Unknown error during reconciliation';
      }
      return null;
    });

    const syncResults = await Promise.all(syncPromises);

    for (const result of syncResults) {
      if (result) {
        (report.reconciledData as any)[result.table] = result.data;
      }
    }
  }

  return report;
}

