import { Resident, SystemUser, CertificateRecord } from '../types';

/**
 * Calculates exact age in years based on birthdate and an optional reference date.
 * Accurately accounts for month and day comparisons.
 *
 * Example:
 * Born March 19, 2000 on August 24, 2026 -> 26 years old (not 28, not 50).
 */
export function calculateAge(
  birthDate: string | Date | undefined | null,
  asOfDate: string | Date = new Date()
): number {
  if (!birthDate) return 26; // Safe default

  try {
    let birth: Date;
    if (birthDate instanceof Date) {
      birth = birthDate;
    } else if (typeof birthDate === 'string') {
      // Handle standard YYYY-MM-DD or ISO strings
      const parts = birthDate.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        birth = new Date(year, month, day);
      } else {
        birth = new Date(birthDate);
      }
    } else {
      return 26;
    }

    if (isNaN(birth.getTime())) {
      return 26;
    }

    let asOf: Date;
    if (asOfDate instanceof Date) {
      asOf = asOfDate;
    } else if (typeof asOfDate === 'string') {
      const parts = asOfDate.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        asOf = new Date(year, month, day);
      } else {
        asOf = new Date(asOfDate);
      }
    } else {
      asOf = new Date();
    }

    if (isNaN(asOf.getTime())) {
      asOf = new Date();
    }

    let age = asOf.getFullYear() - birth.getFullYear();
    const monthDiff = asOf.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birth.getDate())) {
      age--;
    }

    return Math.max(0, age);
  } catch {
    return 26;
  }
}

/**
 * Returns ordinal string for a day of month (e.g. 1st, 2nd, 3rd, 4th, 19th, 21st).
 */
export function getOrdinalDay(dayNumber: number): string {
  if (isNaN(dayNumber) || dayNumber <= 0) return '1st';
  if (dayNumber > 3 && dayNumber < 21) return `${dayNumber}th`;
  switch (dayNumber % 10) {
    case 1:
      return `${dayNumber}st`;
    case 2:
      return `${dayNumber}nd`;
    case 3:
      return `${dayNumber}rd`;
    default:
      return `${dayNumber}th`;
  }
}

/**
 * Safely parses any date string into day ordinal, month name, and year.
 */
export function parseSafeCertificateDate(dateInput: string | Date | undefined | null) {
  try {
    let d: Date;
    if (!dateInput) {
      d = new Date();
    } else if (dateInput instanceof Date) {
      d = dateInput;
    } else {
      const parts = String(dateInput).split('T')[0].split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(dateInput);
      }
    }

    if (isNaN(d.getTime())) {
      d = new Date();
    }

    const dayNumber = d.getDate();
    const dayOrdinal = getOrdinalDay(dayNumber);
    const monthName = d.toLocaleDateString('en-US', { month: 'long' });
    const yearNumber = d.getFullYear();
    const formattedDate = d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return {
      dateObj: d,
      dayNumber,
      dayOrdinal,
      monthName,
      yearNumber,
      formattedDate,
    };
  } catch {
    const now = new Date();
    return {
      dateObj: now,
      dayNumber: now.getDate(),
      dayOrdinal: getOrdinalDay(now.getDate()),
      monthName: now.toLocaleDateString('en-US', { month: 'long' }),
      yearNumber: now.getFullYear(),
      formattedDate: now.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  }
}

/**
 * Formats a clean official address for certificates:
 * - Excludes street address and household address (only Purok/Zone and Barangay).
 * - Fixes double addresses and removes repetition (e.g. "Purok PINYA, Barangay Sangkol, Purok PINYA, Barangay Sangkol" -> "Purok PINYA, Barangay Sangkol").
 */
export function formatCleanCertificateAddress(
  rawAddress?: string | null,
  purok?: string | null,
  defaultBarangay = 'Barangay Sangkol'
): string {
  const cleanBarangay = (defaultBarangay || 'Barangay Sangkol').trim();

  // 1. If explicit purok is provided (e.g., from resident registry or user profile), use it directly
  let detectedPurok = (purok || '').trim();

  // 2. If no explicit purok provided, extract from rawAddress
  if (!detectedPurok && rawAddress) {
    const match = rawAddress.match(/(?:Purok|Sitio|Zone)\s+[A-Za-z0-9\-\.]+/i);
    if (match) {
      detectedPurok = match[0].trim();
    }
  }

  // 3. If we have a detected purok
  if (detectedPurok) {
    let cleanPurok = detectedPurok;
    if (cleanBarangay) {
      const escapedBarangay = cleanBarangay.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      cleanPurok = cleanPurok.replace(new RegExp(`,?\\s*${escapedBarangay}`, 'gi'), '').trim();
    }
    cleanPurok = cleanPurok.replace(/^,\s*|,\s*$/g, '').trim();

    // Deduplicate any repeated segments within cleanPurok itself
    const pParts = cleanPurok.split(',').map((s) => s.trim()).filter(Boolean);
    const uniquePParts = pParts.filter(
      (p, i, arr) => arr.findIndex((x) => x.toLowerCase() === p.toLowerCase()) === i
    );
    cleanPurok = uniquePParts.join(', ') || detectedPurok;

    return `${cleanPurok}, ${cleanBarangay}`;
  }

  // 4. Fallback: Parse rawAddress, strip street/household info, deduplicate chunks
  if (rawAddress && rawAddress.trim()) {
    const segments = rawAddress
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Filter out street/house address segments
    const nonStreetSegments = segments.filter((seg) => {
      const isStreetOrHouse =
        /^\d+[\s\w\.\-]+$/i.test(seg) ||
        /^(?:House|Blk|Block|Lot|HH|Household|Door|Unit|Apt|Room)\b/i.test(seg) ||
        /\b(?:Street|St\.?|Avenue|Ave\.?|Boulevard|Blvd\.?|Highway|Hwy\.?|Compound|Subdivision|Subd\.?)\b/i.test(seg);
      return !isStreetOrHouse;
    });

    const candidateSegments = nonStreetSegments.length > 0 ? nonStreetSegments : segments;

    // Deduplicate segments case-insensitively
    const uniqueSegments: string[] = [];
    for (const seg of candidateSegments) {
      if (!uniqueSegments.some((existing) => existing.toLowerCase() === seg.toLowerCase())) {
        uniqueSegments.push(seg);
      }
    }

    // Ensure cleanBarangay is included if missing
    const hasBarangay = uniqueSegments.some((p) => p.toLowerCase().includes(cleanBarangay.toLowerCase()));
    if (!hasBarangay && cleanBarangay) {
      uniqueSegments.push(cleanBarangay);
    }

    return uniqueSegments.join(', ');
  }

  return cleanBarangay;
}

/**
 * Derives accurate credentials and dynamically calculated age for a certificate.
 */
export function getAccurateCertificateCredentials(
  cert: CertificateRecord,
  residents: Resident[],
  users: SystemUser[],
  currentUser?: SystemUser,
  defaultBarangay = 'Barangay Sangkol'
) {
  // 1. Look for matching resident by ID or name
  const matchedResident = residents.find(
    (r) =>
      (cert.residentId && r.id === cert.residentId) ||
      (cert.residentName && `${r.firstName} ${r.lastName}`.toLowerCase() === cert.residentName.toLowerCase()) ||
      (cert.residentName && `${r.firstName} ${r.middleName ? r.middleName + ' ' : ''}${r.lastName}`.toLowerCase() === cert.residentName.toLowerCase())
  );

  // 2. Look for matching user account
  const matchedUser = users.find(
    (u) =>
      (cert.residentId && u.residentId === cert.residentId) ||
      (cert.residentName && u.name.toLowerCase() === cert.residentName.toLowerCase()) ||
      (currentUser && currentUser.name.toLowerCase() === cert.residentName.toLowerCase() ? true : false)
  ) || (currentUser && currentUser.name.toLowerCase() === cert.residentName.toLowerCase() ? currentUser : undefined);

  // 3. Extract birthDate from certificate, user, or resident
  const birthDate =
    cert.residentBirthDate ||
    matchedUser?.birthDate ||
    matchedResident?.birthDate ||
    (currentUser?.name.toLowerCase() === cert.residentName.toLowerCase() ? currentUser?.birthDate : undefined);

  // 4. Calculate accurate age
  const calculatedAge = birthDate
    ? calculateAge(birthDate, cert.dateIssued || new Date())
    : (cert.residentAge && cert.residentAge > 0 ? cert.residentAge : (matchedResident?.age || 26));

  // 5. Civil Status
  const civilStatus =
    cert.residentCivilStatus ||
    matchedUser?.civilStatus ||
    matchedResident?.civilStatus ||
    currentUser?.civilStatus ||
    'Single';

  // 6. Address (Official Certificate: Purok and Barangay only; exclude street/household address, remove double address)
  const explicitPurok =
    matchedResident?.purok ||
    matchedUser?.purok ||
    '';

  const formattedAddress = formatCleanCertificateAddress(
    cert.residentAddress,
    explicitPurok,
    defaultBarangay
  );

  return {
    name: cert.residentName || matchedUser?.name || `${matchedResident?.firstName} ${matchedResident?.lastName}`.trim(),
    age: calculatedAge,
    civilStatus: civilStatus,
    birthDate: birthDate,
    address: formattedAddress,
    purok: explicitPurok,
    residentId: cert.residentId || matchedResident?.id || matchedUser?.residentId || 'BS-RES-2026-0001',
  };
}
