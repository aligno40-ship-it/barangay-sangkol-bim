/**
 * Standard Philippine Civil Registry Reference Constants
 * Used across Resident Management, Civil Census, and Citizen Account Registration
 */

export const PHILIPPINE_RELIGIONS = [
  'Roman Catholic',
  'Islam',
  'Iglesia ni Cristo',
  'Evangelical Christian',
  'Seventh-day Adventist',
  'Bible Baptist Church',
  'Bible Baptist',
  'United Methodist Church',
  "Jehovah's Witnesses",
  'Born Again Christian',
  'Philippine Independent Church (Aglipayan)',
  'The Church of Jesus Christ of Latter-day Saints',
  'Buddhist',
  'Protestant',
  'Eastern Orthodox',
  'Indigenous / Tribal Beliefs',
  'None / Non-religious',
  'Other / Unspecified',
] as const;

export const CITIZENSHIP_OPTIONS = [
  'Filipino',
  'Dual Citizen (Filipino-Foreign)',
  'Naturalized Filipino',
  'Foreign National / Resident Alien',
] as const;

export const BLOOD_TYPES = [
  'O+',
  'O-',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'Unknown',
] as const;

export const EDUCATIONAL_ATTAINMENTS = [
  'Elementary Undergraduate',
  'Elementary Graduate',
  'High School Undergraduate',
  'High School Graduate',
  'Senior High School Graduate',
  'Vocational / Technical Course',
  'College Undergraduate',
  'College Graduate',
  'Post Graduate / Master’s Degree',
  'Doctorate / Post-Doctorate',
  'No Formal Education',
] as const;

export const PWD_TYPES = [
  'Physical / Orthopedic Disability',
  'Visual Impairment / Blindness',
  'Hearing Impairment / Deaf',
  'Speech and Language Impairment',
  'Intellectual / Developmental Disability',
  'Psychosocial / Mental Health Disability',
  'Chronic Illness / Medical Disability',
  'Multiple Disabilities',
] as const;

export const CIVIL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Widowed',
  'Separated',
  'Common Law',
] as const;

export const RESIDENT_STATUS_OPTIONS = [
  'Active',
  'Deceased',
  'Transferred',
  'Archived',
] as const;

/**
 * Normalizes religion string representations so Bible Baptist / Bible Baptist Church
 * and others remain uniform across Manage Users, Resident Portal, and Resident Management.
 */
export function normalizeReligion(rel?: string | null): string {
  if (!rel) return 'Roman Catholic';
  const trimmed = String(rel).trim();
  if (/^bible\s*baptist/i.test(trimmed)) {
    return 'Bible Baptist Church';
  }
  return trimmed;
}
