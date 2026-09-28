import { Resident, BarangayOfficial, SystemUser } from '../types';

export type IdColorCategory = 'red_official' | 'green_tanod' | 'blue_resident' | 'yellow_youth';

export interface IdThemeConfig {
  id: IdColorCategory;
  name: string;
  shortName: string;
  badgeEmoji: string;
  badgeLabel: string;
  headerSubtext: string;
  description: string;
  targetRole: string;
  
  // Tailwind CSS classes for UI rendering
  cardBg: string;
  bgGradient: string;
  cardBorder: string;
  headerBg: string;
  headerBorder: string;
  accentText: string;
  subAccentText: string;
  labelBg: string;
  labelText: string;
  valueText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  photoBorder: string;
  watermarkOpacity: string;
  footerBg: string;
  footerBorder: string;
  backCardBg: string;
  backHeaderBg: string;
  backHeaderBorder: string;
  backEmergencyBoxBg: string;
  backEmergencyBoxBorder: string;
  securityStripBg: string;
  
  // Canvas RGB / Hex values for 300-DPI high-res export
  canvas: {
    cardBg: string;
    gradStart: string;
    gradMid: string;
    gradEnd: string;
    securityLine: string;
    outerBorder: string;
    innerBorder: string;
    headerBanner: string;
    headerAccentLine: string;
    headerBarangayText: string;
    headerSubtextColor: string;
    badgeBg: string;
    badgeBorder: string;
    badgeTextColor: string;
    photoBorder: string;
    photoLabelBg: string;
    photoLabelText: string;
    nameText: string;
    fieldLabelText: string;
    fieldValueText: string;
    fieldValueHighlight: string;
    idTagColor: string;
    bottomBarBg: string;
    bottomBarLine: string;
    backCardBg: string;
    backHeaderBg: string;
    backHeaderAccent: string;
    backTitleColor: string;
    backTermsText: string;
    backEmergencyBoxBg: string;
    backEmergencyBoxBorder: string;
  };
}

export const ID_THEMES: Record<IdColorCategory, IdThemeConfig> = {
  blue_resident: {
    id: 'blue_resident',
    name: 'Royal Blue (Regular Bona Fide Resident)',
    shortName: 'Resident Royal Blue',
    badgeEmoji: '🔵',
    badgeLabel: 'REGULAR RESIDENT / BONA FIDE CITIZEN',
    headerSubtext: 'OFFICIAL RESIDENT IDENTIFICATION CARD',
    description: 'The standard and most widely used official identification issued to all bona fide barangay residents, registered voters, senior citizens, and community members.',
    targetRole: 'General Community, Registered Residents, Voters, Senior Citizens, PWDs',
    
    // Tailwind UI - Light Government Standard
    cardBg: 'bg-white',
    bgGradient: 'from-white via-sky-50/50 to-slate-50',
    cardBorder: 'border-blue-600',
    headerBg: 'bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900',
    headerBorder: 'border-amber-400',
    accentText: 'text-blue-700',
    subAccentText: 'text-blue-600',
    labelBg: 'bg-blue-50',
    labelText: 'text-slate-500',
    valueText: 'text-slate-900',
    badgeBg: 'bg-blue-700',
    badgeBorder: 'border-blue-400',
    badgeText: 'text-white',
    photoBorder: 'border-blue-600',
    watermarkOpacity: 'opacity-10',
    footerBg: 'bg-gradient-to-r from-slate-50 via-sky-50/70 to-slate-50',
    footerBorder: 'border-slate-200',
    backCardBg: 'bg-white',
    backHeaderBg: 'bg-gradient-to-r from-blue-900 to-indigo-900',
    backHeaderBorder: 'border-amber-400',
    backEmergencyBoxBg: 'bg-sky-50/70',
    backEmergencyBoxBorder: 'border-sky-200',
    securityStripBg: 'bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600',

    // Canvas values for high-res print
    canvas: {
      cardBg: '#ffffff',
      gradStart: '#ffffff',
      gradMid: '#f0f9ff', // light sky
      gradEnd: '#f8fafc', // light slate
      securityLine: 'rgba(2, 132, 199, 0.12)', // subtle sky guilloche wave
      outerBorder: '#1d4ed8', // royal blue
      innerBorder: 'rgba(30, 64, 175, 0.2)',
      headerBanner: '#1e3a8a', // deep blue
      headerAccentLine: '#f59e0b', // gold accent
      headerBarangayText: '#fde047', // golden yellow
      headerSubtextColor: '#e0f2fe',
      badgeBg: '#1d4ed8', // blue-700
      badgeBorder: '#60a5fa',
      badgeTextColor: '#ffffff',
      photoBorder: '#1d4ed8',
      photoLabelBg: '#1e3a8a',
      photoLabelText: '#fef08a',
      nameText: '#0f172a', // slate-900
      fieldLabelText: '#475569', // slate-600
      fieldValueText: '#0f172a',
      fieldValueHighlight: '#1e40af', // royal blue
      idTagColor: '#1d4ed8',
      bottomBarBg: '#f1f5f9',
      bottomBarLine: '#cbd5e1',
      backCardBg: '#ffffff',
      backHeaderBg: '#1e3a8a',
      backHeaderAccent: '#f59e0b',
      backTitleColor: '#ffffff',
      backTermsText: '#334155',
      backEmergencyBoxBg: '#f0f9ff',
      backEmergencyBoxBorder: '#bae6fd',
    },
  },

  red_official: {
    id: 'red_official',
    name: 'Crimson Red (Barangay Officials & Council)',
    shortName: 'Official Crimson',
    badgeEmoji: '🔴',
    badgeLabel: 'BARANGAY OFFICIAL / SANGGUNIANG BARANGAY',
    headerSubtext: 'EXECUTIVE & LEGISLATIVE COUNCIL IDENTIFICATION',
    description: 'Issued exclusively to the Punong Barangay (Kapitan), Kagawads (Councilors), Secretary, and Treasurer for immediate checkpoint clearance and executive authorization.',
    targetRole: 'Barangay Officials, Kagawad, Kapitan, Secretary, Treasurer',
    
    // Tailwind UI - Light Government Standard
    cardBg: 'bg-white',
    bgGradient: 'from-white via-rose-50/50 to-slate-50',
    cardBorder: 'border-red-600',
    headerBg: 'bg-gradient-to-r from-rose-950 via-red-900 to-rose-900',
    headerBorder: 'border-amber-400',
    accentText: 'text-red-700',
    subAccentText: 'text-red-600',
    labelBg: 'bg-rose-50',
    labelText: 'text-slate-500',
    valueText: 'text-slate-900',
    badgeBg: 'bg-red-800',
    badgeBorder: 'border-amber-400',
    badgeText: 'text-amber-100',
    photoBorder: 'border-red-600',
    watermarkOpacity: 'opacity-10',
    footerBg: 'bg-gradient-to-r from-slate-50 via-rose-50/70 to-slate-50',
    footerBorder: 'border-slate-200',
    backCardBg: 'bg-white',
    backHeaderBg: 'bg-gradient-to-r from-rose-950 to-red-900',
    backHeaderBorder: 'border-amber-400',
    backEmergencyBoxBg: 'bg-rose-50/70',
    backEmergencyBoxBorder: 'border-rose-200',
    securityStripBg: 'bg-gradient-to-r from-red-600 via-amber-400 to-red-600',

    // Canvas values
    canvas: {
      cardBg: '#ffffff',
      gradStart: '#ffffff',
      gradMid: '#fff1f2', // light rose
      gradEnd: '#f8fafc',
      securityLine: 'rgba(225, 29, 72, 0.12)', // subtle crimson wave
      outerBorder: '#dc2626', // crimson
      innerBorder: 'rgba(185, 28, 28, 0.2)',
      headerBanner: '#881337', // rich crimson
      headerAccentLine: '#f59e0b',
      headerBarangayText: '#fde047',
      headerSubtextColor: '#ffe4e6',
      badgeBg: '#991b1b', // crimson red
      badgeBorder: '#fbbf24',
      badgeTextColor: '#fef08a',
      photoBorder: '#dc2626',
      photoLabelBg: '#881337',
      photoLabelText: '#fde68a',
      nameText: '#0f172a',
      fieldLabelText: '#475569',
      fieldValueText: '#0f172a',
      fieldValueHighlight: '#991b1b',
      idTagColor: '#dc2626',
      bottomBarBg: '#f1f5f9',
      bottomBarLine: '#cbd5e1',
      backCardBg: '#ffffff',
      backHeaderBg: '#881337',
      backHeaderAccent: '#f59e0b',
      backTitleColor: '#ffffff',
      backTermsText: '#334155',
      backEmergencyBoxBg: '#fff1f2',
      backEmergencyBoxBorder: '#fecdd3',
    },
  },

  green_tanod: {
    id: 'green_tanod',
    name: 'Forest Green (Tanod & Emergency Response)',
    shortName: 'Tanod & BDRRMC Green',
    badgeEmoji: '🟢',
    badgeLabel: 'BARANGAY TANOD / BDRRMC FIRST RESPONDER',
    headerSubtext: 'PEACE & ORDER / DISASTER RESPONSE IDENTIFICATION',
    description: 'Issued to Barangay Tanods (Village Watchmen), Peace & Order personnel, and BDRRMC Emergency Response Teams matching tactical field uniforms.',
    targetRole: 'Barangay Tanods, Watchmen, BDRRMC, Emergency First Responders',

    // Tailwind UI - Light Government Standard
    cardBg: 'bg-white',
    bgGradient: 'from-white via-emerald-50/50 to-slate-50',
    cardBorder: 'border-emerald-600',
    headerBg: 'bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900',
    headerBorder: 'border-emerald-400',
    accentText: 'text-emerald-700',
    subAccentText: 'text-emerald-600',
    labelBg: 'bg-emerald-50',
    labelText: 'text-slate-500',
    valueText: 'text-slate-900',
    badgeBg: 'bg-emerald-800',
    badgeBorder: 'border-emerald-400',
    badgeText: 'text-white',
    photoBorder: 'border-emerald-600',
    watermarkOpacity: 'opacity-10',
    footerBg: 'bg-gradient-to-r from-slate-50 via-emerald-50/70 to-slate-50',
    footerBorder: 'border-slate-200',
    backCardBg: 'bg-white',
    backHeaderBg: 'bg-gradient-to-r from-emerald-950 to-teal-900',
    backHeaderBorder: 'border-emerald-400',
    backEmergencyBoxBg: 'bg-emerald-50/70',
    backEmergencyBoxBorder: 'border-emerald-200',
    securityStripBg: 'bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-600',

    // Canvas values
    canvas: {
      cardBg: '#ffffff',
      gradStart: '#ffffff',
      gradMid: '#ecfdf5', // light emerald
      gradEnd: '#f8fafc',
      securityLine: 'rgba(5, 150, 105, 0.12)', // subtle emerald wave
      outerBorder: '#059669', // emerald
      innerBorder: 'rgba(4, 120, 87, 0.2)',
      headerBanner: '#064e3b', // deep forest green
      headerAccentLine: '#34d399',
      headerBarangayText: '#6ee7b7',
      headerSubtextColor: '#d1fae5',
      badgeBg: '#065f46', // emerald badge
      badgeBorder: '#34d399',
      badgeTextColor: '#ecfdf5',
      photoBorder: '#059669',
      photoLabelBg: '#064e3b',
      photoLabelText: '#a7f3d0',
      nameText: '#0f172a',
      fieldLabelText: '#475569',
      fieldValueText: '#0f172a',
      fieldValueHighlight: '#065f46',
      idTagColor: '#059669',
      bottomBarBg: '#f1f5f9',
      bottomBarLine: '#cbd5e1',
      backCardBg: '#ffffff',
      backHeaderBg: '#064e3b',
      backHeaderAccent: '#10b981',
      backTitleColor: '#ffffff',
      backTermsText: '#334155',
      backEmergencyBoxBg: '#ecfdf5',
      backEmergencyBoxBorder: '#a7f3d0',
    },
  },

  yellow_youth: {
    id: 'yellow_youth',
    name: 'Amber Gold (SK Youth & Temporary Personnel)',
    shortName: 'SK Youth & Volunteer Amber',
    badgeEmoji: '🟡',
    badgeLabel: 'SANGGUNIANG KABATAAN (SK) / YOUTH MEMBER',
    headerSubtext: 'SANGGUNIANG KABATAAN & YOUTH IDENTIFICATION',
    description: 'Assigned to Sangguniang Kabataan (SK) youth council members, student interns, community volunteers, and temporary project personnel.',
    targetRole: 'SK Officials, Youth Members, Interns, Temporary Personnel',

    // Tailwind UI - Light Government Standard
    cardBg: 'bg-white',
    bgGradient: 'from-white via-amber-50/50 to-slate-50',
    cardBorder: 'border-amber-500',
    headerBg: 'bg-gradient-to-r from-amber-950 via-amber-900 to-orange-900',
    headerBorder: 'border-amber-400',
    accentText: 'text-amber-700',
    subAccentText: 'text-amber-600',
    labelBg: 'bg-amber-50',
    labelText: 'text-slate-500',
    valueText: 'text-slate-900',
    badgeBg: 'bg-amber-700',
    badgeBorder: 'border-amber-400',
    badgeText: 'text-white',
    photoBorder: 'border-amber-500',
    watermarkOpacity: 'opacity-10',
    footerBg: 'bg-gradient-to-r from-slate-50 via-amber-50/70 to-slate-50',
    footerBorder: 'border-slate-200',
    backCardBg: 'bg-white',
    backHeaderBg: 'bg-gradient-to-r from-amber-950 to-orange-900',
    backHeaderBorder: 'border-amber-400',
    backEmergencyBoxBg: 'bg-amber-50/70',
    backEmergencyBoxBorder: 'border-amber-200',
    securityStripBg: 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500',

    // Canvas values
    canvas: {
      cardBg: '#ffffff',
      gradStart: '#ffffff',
      gradMid: '#fffbeb', // light amber
      gradEnd: '#f8fafc',
      securityLine: 'rgba(217, 119, 6, 0.12)', // subtle golden wave
      outerBorder: '#d97706', // amber-600
      innerBorder: 'rgba(180, 83, 9, 0.2)',
      headerBanner: '#78350f', // deep amber
      headerAccentLine: '#f59e0b',
      headerBarangayText: '#fef08a',
      headerSubtextColor: '#fef3c7',
      badgeBg: '#b45309', // amber gold
      badgeBorder: '#fde68a',
      badgeTextColor: '#fffbeb',
      photoBorder: '#d97706',
      photoLabelBg: '#78350f',
      photoLabelText: '#fde68a',
      nameText: '#0f172a',
      fieldLabelText: '#475569',
      fieldValueText: '#0f172a',
      fieldValueHighlight: '#b45309',
      idTagColor: '#d97706',
      bottomBarBg: '#f1f5f9',
      bottomBarLine: '#cbd5e1',
      backCardBg: '#ffffff',
      backHeaderBg: '#78350f',
      backHeaderAccent: '#f59e0b',
      backTitleColor: '#ffffff',
      backTermsText: '#334155',
      backEmergencyBoxBg: '#fffbeb',
      backEmergencyBoxBorder: '#fde68a',
    },
  },
};

/**
 * Automatically determine the default color category for a cardholder
 * based on official title, role, occupation, or demographic tags.
 */
export function detectIdColorCategory(
  resident?: Partial<Resident> | null,
  user?: Partial<SystemUser> | null,
  official?: Partial<BarangayOfficial> | null
): IdColorCategory {
  const role = (user?.role || '').toLowerCase();
  const position = (official?.position || user?.position || '').toLowerCase();
  const occupation = (resident?.occupation || '').toLowerCase();
  const remarks = (resident?.remarks || '').toLowerCase();

  // 1. Check for Barangay Official / Executive (🔴 Red)
  if (
    role.includes('captain') ||
    role.includes('official') ||
    role.includes('secretary') ||
    role.includes('treasurer') ||
    role.includes('administrator') ||
    position.includes('captain') ||
    position.includes('kagawad') ||
    position.includes('councilor') ||
    position.includes('secretary') ||
    position.includes('treasurer') ||
    position.includes('administrator') ||
    occupation.includes('barangay official') ||
    occupation.includes('kagawad') ||
    occupation.includes('punong barangay')
  ) {
    return 'red_official';
  }

  // 2. Check for Barangay Tanod / Peace & Order / BDRRMC (🟢 Green)
  if (
    role.includes('tanod') ||
    position.includes('tanod') ||
    position.includes('watchman') ||
    position.includes('bdrrmc') ||
    position.includes('peace') ||
    occupation.includes('tanod') ||
    occupation.includes('watchman') ||
    occupation.includes('security') ||
    occupation.includes('bdrrmc') ||
    remarks.includes('tanod') ||
    remarks.includes('bdrrmc')
  ) {
    return 'green_tanod';
  }

  // 3. Check for SK Youth / Temporary Personnel (🟡 Yellow)
  if (
    position.includes('sk') ||
    position.includes('youth') ||
    occupation.includes('sk') ||
    occupation.includes('intern') ||
    occupation.includes('volunteer') ||
    occupation.includes('temporary') ||
    resident?.isYouth ||
    resident?.isOutofSchoolYouth ||
    (resident?.age && resident.age <= 24 && resident.age >= 15)
  ) {
    return 'yellow_youth';
  }

  // 4. Default: Standard Bona Fide Resident (🔵 Royal Blue)
  return 'blue_resident';
}

