/**
 * Resident Account Scoping & Security Filter
 * Ensures data isolation in the Resident Portal so that residents only ever
 * see records and transactions belonging to their own verified person/account.
 */

export interface ResidentUserIdentity {
  residentId?: string;
  name?: string;
  email?: string;
  contactNumber?: string;
  username?: string;
}

export interface ResidentCheckableRecord {
  residentId?: string;
  parentResidentId?: string;
  reservedByResidentId?: string;
  userId?: string;
  residentName?: string;
  parentName?: string;
  patientName?: string;
  childName?: string;
  beneficiaryName?: string;
  complainantName?: string;
  respondentName?: string;
  contactNumber?: string;
  email?: string;
  purok?: string;
  [key: string]: unknown;
}

const GENERIC_NAME_TOKENS = new Set([
  'resident',
  'citizen',
  'user',
  'patient',
  'beneficiary',
  'client',
  'applicant',
  'mr',
  'ms',
  'mrs',
  'hon',
  'dr',
  'baby',
  'tatay',
  'lola',
  'aling',
  'mang',
  'kuya',
  'ate',
]);

/**
 * Normalizes a personal name into lowercase alphanumeric tokens, stripping common honorifics
 */
export function extractMeaningfulNameTokens(nameStr: string): string[] {
  if (!nameStr) return [];
  return nameStr
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !GENERIC_NAME_TOKENS.has(t));
}

/**
 * Checks whether two names belong to the same person with high confidence.
 */
export function isStrictNameMatch(nameA?: string, nameB?: string): boolean {
  if (!nameA || !nameB) return false;
  const cleanA = nameA.trim().toLowerCase();
  const cleanB = nameB.trim().toLowerCase();
  if (cleanA === cleanB) return true;

  const tokensA = extractMeaningfulNameTokens(nameA);
  const tokensB = extractMeaningfulNameTokens(nameB);

  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Check if all tokens of one name are contained in the other
  const allAInB = tokensA.every((tok) => tokensB.includes(tok));
  const allBInA = tokensB.every((tok) => tokensA.includes(tok));
  if (allAInB || allBInA) return true;

  // If both have at least 2 tokens (first & last name), require at least 2 shared tokens
  const shared = tokensA.filter((tok) => tokensB.includes(tok));
  if (tokensA.length >= 2 && tokensB.length >= 2 && shared.length >= 2) {
    return true;
  }

  return false;
}

/**
 * Normalizes phone numbers to standard 10 or 11 digits
 */
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('09')) return digits;
  if (digits.length === 12 && digits.startsWith('639')) return '0' + digits.slice(2);
  return digits;
}

/**
 * Decides whether a given record strictly belongs to the logged-in resident user.
 */
export function isResidentRecordOwner(
  record: ResidentCheckableRecord,
  user: ResidentUserIdentity
): boolean {
  if (!user) return false;

  const userResidentId = (user.residentId || '').trim();
  const userName = (user.name || '').trim();
  const userEmail = (user.email || user.username || '').trim().toLowerCase();
  const userPhone = normalizePhone(user.contactNumber);

  // 1. Identify record resident ID
  const recordResidentId = (
    record.residentId ||
    record.parentResidentId ||
    record.reservedByResidentId ||
    record.userId ||
    ''
  ).trim();

  // 2. Identify record resident names
  const recordPrimaryName = (
    record.residentName ||
    record.patientName ||
    record.parentName ||
    record.beneficiaryName ||
    ''
  ).trim();

  // Special case: Lupon / Blotter legal cases where user may be complainant or respondent
  const complainantName = (record.complainantName || '').trim();
  const respondentName = (record.respondentName || '').trim();
  if (complainantName || respondentName) {
    if (userName && (isStrictNameMatch(complainantName, userName) || isStrictNameMatch(respondentName, userName))) {
      return true;
    }
  }

  // Check email match if present on record
  if (userEmail && record.email && typeof record.email === 'string') {
    const recEmail = record.email.trim().toLowerCase();
    if (recEmail && recEmail === userEmail) {
      return true;
    }
  }

  // Check contact number match if present on record (must be at least 10 digits)
  const recordPhone = normalizePhone(record.contactNumber);
  const phonesMatch = Boolean(userPhone && recordPhone && userPhone === recordPhone && userPhone.length >= 10);

  // If BOTH record and user have a resident ID:
  if (recordResidentId && userResidentId) {
    if (recordResidentId !== userResidentId) {
      // Different ID! It belongs to another resident account.
      return false;
    }

    // IDs match! Verify that the record does NOT have an incompatible other person's name.
    if (recordPrimaryName && userName) {
      const tokensRec = extractMeaningfulNameTokens(recordPrimaryName);
      const tokensUser = extractMeaningfulNameTokens(userName);

      // If both names have substantial tokens and share 0 tokens, this was a corrupted or mis-tagged seed record!
      if (tokensRec.length >= 2 && tokensUser.length >= 2) {
        const shared = tokensRec.filter((t) => tokensUser.includes(t));
        if (shared.length === 0) {
          return false;
        }
      }
    }

    return true;
  }

  // If record has an ID, but user has no ID, or user has ID and record has no ID:
  // Fall back to strict name matching or verified phone matching.
  if (recordPrimaryName && userName) {
    if (isStrictNameMatch(recordPrimaryName, userName)) {
      // If record had a different resident ID specified, reject it
      if (recordResidentId && userResidentId && recordResidentId !== userResidentId) {
        return false;
      }
      return true;
    }
  }

  if (phonesMatch) {
    // If phone matches, also ensure ID doesn't contradict
    if (!recordResidentId || !userResidentId || recordResidentId === userResidentId) {
      return true;
    }
  }

  return false;
}
