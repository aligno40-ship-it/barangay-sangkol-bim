import React, { useState, useEffect, useMemo } from 'react';
import { useBarangay, areNamesMatching } from '../context/BarangayContext';
import { BarangaySangkolSeal, RepublicSeal, QRCodeBox } from '../components/OfficialSeals';
import { UserProfilePhotoModal } from '../components/UserProfilePhotoModal';
import { CertificateDetailModal } from '../components/CertificateDetailModal';
import { ActivityAttendanceModal } from '../components/ActivityAttendanceModal';
import { AnnouncementAttendanceModal } from '../components/AnnouncementAttendanceModal';
import { calculateAge, getAccurateCertificateCredentials, formatCleanCertificateAddress } from '../utils/ageUtils';
import { BarangayIdCardView } from '../components/BarangayIdCardView';
import { ResidentNewsfeedTab } from '../components/ResidentNewsfeedTab';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { downloadDigitalIdCard } from '../utils/idCardDownload';
import { getFormalResidentPhotoUrl, generateFormalIdPhotoSvg } from '../utils/imageUtils';
import {
  Megaphone,
  CalendarDays,
  FileCheck2,
  AlertTriangle,
  PhoneCall,
  UserCheck,
  MapPin,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  Pin,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Phone,
  Mail,
  Home,
  FileText,
  BadgeAlert,
  Award,
  Camera,
  Printer,
  BellRing,
  XCircle,
  Map,
  Archive,
  FolderArchive,
  Filter,
  RotateCcw,
  Receipt,
  Eye,
  LayoutGrid,
  Table,
  Sparkles,
  Edit2,
  BadgeCheck,
  HelpCircle,
  Info,
  X,
  Check,
  Layers,
  Download,
  ArrowRight,
  ArrowLeft,
  CalendarCheck,
  CreditCard,
  Lock,
  Shield,
  ShieldAlert,
  Copy,
  FileSpreadsheet,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Heart,
  HeartHandshake,
  User,
  Baby,
  FileSignature,
  Sliders,
  Radio,
  Smartphone,
  Building2,
  Tent,
  Scale,
  HeartPulse,
  Gift,
  Trash2,
  Truck,
  Trophy,
  Accessibility,
  Package,
  Stethoscope,
  BadgeDollarSign,
  Users2,
  Newspaper,
} from 'lucide-react';
import { CertificateType, CertificateRecord, CommunityActivity, AnnouncementRecord, TransactionRecord, CitizenConcern, SMSAlertRecord } from '../types';
import { ResidentPortalSettingsTab } from '../components/ResidentPortalSettingsTab';
import { FacilityEquipmentReservationsTab } from '../components/resident/FacilityEquipmentReservationsTab';
import { BlotterLuponTrackingTab } from '../components/resident/BlotterLuponTrackingTab';
import { HealthCenterDeskTab } from '../components/resident/HealthCenterDeskTab';
import { TrabahoLivelihoodTab } from '../components/resident/TrabahoLivelihoodTab';
import { AyudaReliefClaimTab } from '../components/resident/AyudaReliefClaimTab';
import { SolidWasteCleanUpTab } from '../components/resident/SolidWasteCleanUpTab';
import { YouthSeniorHubTab } from '../components/resident/YouthSeniorHubTab';
import { useCommunityServices } from '../context/CommunityServicesContext';
import { PHILIPPINE_RELIGIONS, CITIZENSHIP_OPTIONS, BLOOD_TYPES } from '../utils/civilRegistryConstants';
import { ResidentPortalTab } from '../types';

export type { ResidentPortalTab };

interface ResidentPortalViewProps {
  initialTab?: ResidentPortalTab;
}

export const ResidentPortalView: React.FC<ResidentPortalViewProps> = ({ initialTab = 'overview' }) => {
  const {
    currentUser,
    residents,
    households,
    updateUser,
    updateResident,
    addAuditLog,
    announcements,
    announcementAttendees,
    activities,
    activityAttendees,
    concerns,
    blotters,
    officials,
    settings,
    certificates,
    transactions,
    requestCertificate,
    issueCertificate,
    addConcern,
    rsvpActivity,
    registerForActivity,
    cancelActivityRegistration,
    registerForAnnouncement,
    cancelAnnouncementRegistration,
    setActiveModule,
    setSelectedCertForPrint,
    setSelectedReceiptForPrint,
    targetCertificateId,
    setTargetCertificateId,
    targetRecordId,
    setTargetRecordId,
    smsAlerts,
    residentTab,
    setResidentTab,
    arePuroksMatching,
  } = useBarangay();

  const activeTab = residentTab || initialTab || 'overview';
  const setActiveTab = setResidentTab;
  const [newsfeedFilter, setNewsfeedFilter] = useState<'all' | 'purok' | 'registered' | 'advisories' | 'trabaho' | 'ayuda'>('all');
  const [newsfeedSearch, setNewsfeedSearch] = useState('');
  const [selectedAlertForDetail, setSelectedAlertForDetail] = useState<SMSAlertRecord | null>(null);
  const [copiedAlertId, setCopiedAlertId] = useState<string | null>(null);
  const [selectedActivityFilter, setSelectedActivityFilter] = useState('All');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedActivityForAttendance, setSelectedActivityForAttendance] = useState<CommunityActivity | null>(null);
  const [selectedAnnouncementForAttendance, setSelectedAnnouncementForAttendance] = useState<AnnouncementRecord | null>(null);

  // Resident Profile Sub-Tabs & Data Correction Modal
  const [profileSubTab, setProfileSubTab] = useState<'civil_data' | 'id_card' | 'record_summary'>('civil_data');
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionCategory, setCorrectionCategory] = useState('Contact Details & Mobile Number');
  const [correctionDetails, setCorrectionDetails] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionSupportingDocs, setCorrectionSupportingDocs] = useState('');
  const [correctionSuccessMessage, setCorrectionSuccessMessage] = useState('');
  const [copiedResidentId, setCopiedResidentId] = useState(false);

  // Edit Civil Demographics (Religion, Citizenship, Blood Type, etc.) Modal State
  const [isEditCivilModalOpen, setIsEditCivilModalOpen] = useState(false);
  const [editReligion, setEditReligion] = useState('Roman Catholic');
  const [editCustomReligion, setEditCustomReligion] = useState('');
  const [editCitizenship, setEditCitizenship] = useState('Filipino');
  const [editBloodType, setEditBloodType] = useState('O+');
  const [editCivilStatus, setEditCivilStatus] = useState<string>('Single');
  const [editContactNumber, setEditContactNumber] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStreetAddress, setEditStreetAddress] = useState('');
  const [editOccupation, setEditOccupation] = useState('');
  const [editEducationalAttainment, setEditEducationalAttainment] = useState('');
  const [editEmergencyContactName, setEditEmergencyContactName] = useState('');
  const [editEmergencyContactNumber, setEditEmergencyContactNumber] = useState('');
  const [editSuccessToast, setEditSuccessToast] = useState<string | null>(null);

  // Sync initialTab when props change
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Online Certificate Request Form
  const [certType, setCertType] = useState<CertificateType>('Barangay Clearance');
  const [certPurpose, setCertPurpose] = useState('Employment Requirement');
  const [certCustomPurpose, setCertCustomPurpose] = useState('');
  const [certDelivery, setCertDelivery] = useState('Pick up at Barangay Hall');
  const [certSuccessMessage, setCertSuccessMessage] = useState('');
  const [renewalNotice, setRenewalNotice] = useState('');

  // Certificate Archive Filters & Controls
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [archiveTypeFilter, setArchiveTypeFilter] = useState('All');
  const [archiveYearFilter, setArchiveYearFilter] = useState('All');
  const [archiveValidityFilter, setArchiveValidityFilter] = useState<'All' | 'Valid' | 'Expired'>('All');
  const [archiveSortBy, setArchiveSortBy] = useState<'newest' | 'oldest' | 'type'>('newest');
  const [archiveViewMode, setArchiveViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedArchiveCert, setSelectedArchiveCert] = useState<CertificateRecord | null>(null);

  // Transactions & Receipts Filters & Controls
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [transactionServiceFilter, setTransactionServiceFilter] = useState('All');
  const [transactionPaymentMethodFilter, setTransactionPaymentMethodFilter] = useState('All');
  const [transactionYearFilter, setTransactionYearFilter] = useState('All');
  const [transactionSortBy, setTransactionSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [transactionViewMode, setTransactionViewMode] = useState<'grid' | 'table'>('table');

  // File Concern Form
  const [concernSubject, setConcernSubject] = useState('');
  const [concernCategory, setConcernCategory] = useState<'Peace & Order' | 'Sanitation & Garbage' | 'Infrastructure & Lighting' | 'Health & Safety' | 'General Inquiry'>('Infrastructure & Lighting');
  const [concernPriority, setConcernPriority] = useState<'Normal' | 'Urgent' | 'High' | 'Emergency'>('Normal');
  const [concernDetails, setConcernDetails] = useState('');
  const [concernLocation, setConcernLocation] = useState('');
  const [concernSuccessMessage, setConcernSuccessMessage] = useState('');
  const [selectedConcernForView, setSelectedConcernForView] = useState<CitizenConcern | null>(null);

  // Handle notification tap navigation
  useEffect(() => {
    if (targetCertificateId) {
      const targetCert = certificates.find(
        (c) => c.id === targetCertificateId || c.controlNumber === targetCertificateId
      );
      if (targetCert) {
        if (targetCert.status === 'Pending') {
          setActiveTab('requests');
        } else {
          setActiveTab('archive');
          setSelectedArchiveCert(targetCert);
        }
      }
      setTargetCertificateId(null);
    }
  }, [targetCertificateId, certificates]);

  const {
    facilityReservations,
    equipmentReservations,
    healthAppointments,
    medicineRefillRequests,
    childImmunizations,
    healthMissions,
    jobApplications,
    jobPostings,
    livelihoodEnrollments,
    livelihoodAssistanceRequests,
    ayudaClaims,
    financialAssistanceRequests,
    bulkWasteRequests,
    illegalDumpingReports,
    cleanUpVolunteers,
    cleanUpDrives,
    skRegistrations,
    skTournaments,
    seniorBenefitSchedules,
    assistiveDeviceRequests,
  } = useCommunityServices();

  useEffect(() => {
    if (targetRecordId) {
      const isConcern = concerns.some((c) => c.id === targetRecordId);
      const isActivity = activities.some((a) => a.id === targetRecordId);
      const isFacility = facilityReservations.some((f) => f.id === targetRecordId) || equipmentReservations.some((e) => e.id === targetRecordId);
      const isHealth = healthAppointments.some((h) => h.id === targetRecordId) || medicineRefillRequests.some((m) => m.id === targetRecordId) || (childImmunizations && childImmunizations.some((c) => c.id === targetRecordId)) || (healthMissions && healthMissions.some((h) => h.id === targetRecordId));
      const isTrabaho = jobApplications.some((j) => j.id === targetRecordId) || livelihoodEnrollments.some((l) => l.id === targetRecordId) || (jobPostings && jobPostings.some((j) => j.id === targetRecordId)) || (livelihoodAssistanceRequests && livelihoodAssistanceRequests.some((l) => l.id === targetRecordId));
      const isAyuda = ayudaClaims.some((a) => a.id === targetRecordId) || financialAssistanceRequests.some((f) => f.id === targetRecordId);
      const isWaste = bulkWasteRequests.some((b) => b.id === targetRecordId) || cleanUpVolunteers.some((v) => v.id === targetRecordId) || (cleanUpDrives && cleanUpDrives.some((d) => d.id === targetRecordId)) || (illegalDumpingReports && illegalDumpingReports.some((r) => r.id === targetRecordId));
      const isYouthSenior = skRegistrations.some((s) => s.id === targetRecordId) || (skTournaments && skTournaments.some((t) => t.id === targetRecordId)) || (seniorBenefitSchedules && seniorBenefitSchedules.some((s) => s.id === targetRecordId)) || assistiveDeviceRequests.some((a) => a.id === targetRecordId);

      if (isConcern) {
        setActiveTab('concerns');
      } else if (isActivity) {
        setActiveTab('activities');
      } else if (isFacility) {
        setActiveTab('facilities');
      } else if (isHealth) {
        setActiveTab('health');
      } else if (isTrabaho) {
        setActiveTab('trabaho');
      } else if (isAyuda) {
        setActiveTab('ayuda');
      } else if (isWaste) {
        setActiveTab('waste');
      } else if (isYouthSenior) {
        setActiveTab('youth_senior');
      }
      setTargetRecordId(null);
    }
  }, [
    targetRecordId,
    concerns,
    activities,
    facilityReservations,
    equipmentReservations,
    healthAppointments,
    medicineRefillRequests,
    jobApplications,
    livelihoodEnrollments,
    ayudaClaims,
    financialAssistanceRequests,
    bulkWasteRequests,
    cleanUpVolunteers,
    cleanUpDrives,
    skRegistrations,
    skTournaments,
    seniorBenefitSchedules,
    assistiveDeviceRequests,
  ]);

  // Accurate Resident Profile details based on logged-in user credentials
  const currentUserName = currentUser?.name || 'Resident Citizen';
  const currentUserEmail = currentUser?.email || 'citizen@barangay.gov.ph';
  const matchedResident = residents.find(
    (r) =>
      (currentUser?.residentId && r.id === currentUser.residentId) ||
      (currentUser?.email && r.email?.toLowerCase() === currentUserEmail.toLowerCase()) ||
      `${r.firstName} ${r.lastName}`.toLowerCase() === currentUserName.toLowerCase() ||
      `${r.firstName} ${r.middleName ? r.middleName + ' ' : ''}${r.lastName}`.toLowerCase() === currentUserName.toLowerCase()
  );

  const nameTokens = currentUserName.trim().split(/\s+/);
  const residentRecord = useMemo(() => {
    if (matchedResident) {
      return {
        ...matchedResident,
        religion: matchedResident.religion || currentUser?.religion || 'Bible Baptist Church',
        citizenship: matchedResident.citizenship || currentUser?.citizenship || 'Filipino',
        bloodType: matchedResident.bloodType || currentUser?.bloodType || 'O+',
        civilStatus: matchedResident.civilStatus || currentUser?.civilStatus || 'Single',
        streetAddress: matchedResident.streetAddress || currentUser?.streetAddress || `${matchedResident.purok}, Barangay Sangkol`,
      } as any;
    }
    return {
      id: currentUser?.residentId || 'BS-RES-2026-0099',
      firstName: nameTokens[0] || 'Resident',
      lastName: nameTokens.slice(1).join(' ') || 'Citizen',
      birthDate: currentUser?.birthDate || (currentUserEmail === 'aligno40@gmail.com' ? '2000-03-19' : '2000-03-19'),
      age: calculateAge(currentUser?.birthDate || '2000-03-19'),
      sex: currentUser?.sex || 'Male',
      civilStatus: currentUser?.civilStatus || 'Single',
      purok: currentUser?.purok || 'Purok Mangga',
      streetAddress: currentUser?.streetAddress || '77 Mango Boulevard',
      contactNumber: currentUser?.contactNumber || '0917-890-4421',
      email: currentUserEmail,
      occupation: currentUser?.position || 'Resident Citizen',
      monthlyIncome: 30000,
      citizenship: currentUser?.citizenship || 'Filipino',
      religion: currentUser?.religion || 'Bible Baptist Church',
      bloodType: currentUser?.bloodType || 'O+',
      educationalAttainment: (currentUser as any)?.educationalAttainment || 'College Graduate',
      voterStatus: 'Registered',
      householdId: 'HH-SNG-001',
      isHouseholdHead: false,
      isSeniorCitizen: false,
      isPWD: false,
      is4PsBeneficiary: false,
      isSoloParent: false,
      isIndigent: false,
      isYouth: true,
      isOutofSchoolYouth: false,
      emergencyContactName: (currentUser as any)?.emergencyContactName || 'Barangay Hall Desk',
      emergencyContactNumber: (currentUser as any)?.emergencyContactNumber || '(062) 991-8842',
      residentStatus: 'Active',
      dateRegistered: '2024-01-10',
      updatedAt: '2026-08-24',
    } as any;
  }, [matchedResident, currentUser, currentUserEmail, nameTokens]);

  const handleOpenEditCivilModal = () => {
    const currentRel = residentRecord?.religion || currentUser?.religion || 'Roman Catholic';
    if (PHILIPPINE_RELIGIONS.includes(currentRel as any)) {
      setEditReligion(currentRel);
      setEditCustomReligion('');
    } else {
      setEditReligion('Other Faith / Belief System');
      setEditCustomReligion(currentRel);
    }
    setEditCitizenship(residentRecord?.citizenship || currentUser?.citizenship || 'Filipino');
    setEditBloodType(residentRecord?.bloodType || currentUser?.bloodType || 'O+');
    setEditCivilStatus(residentRecord?.civilStatus || currentUser?.civilStatus || 'Single');
    setEditContactNumber(residentRecord?.contactNumber || currentUser?.contactNumber || '');
    setEditEmail(residentRecord?.email || currentUser?.email || '');
    setEditStreetAddress(residentRecord?.streetAddress || currentUser?.streetAddress || '');
    setEditOccupation(residentRecord?.occupation || (currentUser as any)?.occupation || '');
    setEditEducationalAttainment(residentRecord?.educationalAttainment || (currentUser as any)?.educationalAttainment || 'College Graduate');
    setEditEmergencyContactName(residentRecord?.emergencyContactName || (currentUser as any)?.emergencyContactName || '');
    setEditEmergencyContactNumber(residentRecord?.emergencyContactNumber || (currentUser as any)?.emergencyContactNumber || '');
    setIsEditCivilModalOpen(true);
  };

  const handleSaveCivilProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReligion = editReligion === 'Other Faith / Belief System' && editCustomReligion.trim()
      ? editCustomReligion.trim()
      : editReligion || 'Roman Catholic';

    const updatedData: any = {
      religion: finalReligion,
      citizenship: editCitizenship || 'Filipino',
      bloodType: editBloodType || 'O+',
      civilStatus: editCivilStatus,
      contactNumber: editContactNumber,
      email: editEmail,
      streetAddress: editStreetAddress,
      occupation: editOccupation,
      educationalAttainment: editEducationalAttainment,
      emergencyContactName: editEmergencyContactName,
      emergencyContactNumber: editEmergencyContactNumber,
    };

    if (currentUser?.id) {
      updateUser(currentUser.id, updatedData);
    }
    const residentTargetId = matchedResident?.id || residentRecord?.id || currentUser?.residentId;
    if (residentTargetId) {
      updateResident(residentTargetId, updatedData);
    }
    if (addAuditLog) {
      addAuditLog(
        'UPDATE',
        'Resident Profile',
        `Citizen ${currentUser.name} updated their civil registry profile (Religion: ${finalReligion}, Blood: ${editBloodType}).`
      );
    }
    setIsEditCivilModalOpen(false);
    setEditSuccessToast('Civil demographic profile updated successfully! Your updated religion and registry records have been saved.');
    setTimeout(() => setEditSuccessToast(null), 5000);
  };

  const effectiveBirthDate = currentUser?.birthDate || residentRecord?.birthDate || (currentUserEmail === 'aligno40@gmail.com' ? '2000-03-19' : undefined);
  const effectiveAge = effectiveBirthDate ? calculateAge(effectiveBirthDate) : (residentRecord?.age || 26);
  const effectiveCivilStatus = currentUser.civilStatus || residentRecord.civilStatus || 'Single';
  const effectiveStreet = currentUser.streetAddress || residentRecord.streetAddress || '77 Mango Boulevard';
  const effectivePurok = currentUser.purok || residentRecord.purok || 'Purok Mangga';
  const effectiveAddress = formatCleanCertificateAddress(null, effectivePurok, settings.barangayName);

  const householdRecord = households.find(
    (h) => h.id === residentRecord?.householdId || h.headResidentId === residentRecord?.id
  );

  const userResidentId = currentUser.residentId || residentRecord?.id || matchedResident?.id;
  const userFullName = currentUser.name.trim().toLowerCase();
  const matchedFullName = matchedResident
    ? `${matchedResident.firstName} ${matchedResident.lastName}`.trim().toLowerCase()
    : null;

  // STRICT USER CERTIFICATES: Residents can strictly view ONLY their own certificates
  const userCertificates = useMemo(() => {
    return certificates.filter((c) => {
      if (userResidentId && c.residentId && c.residentId === userResidentId) return true;
      if (c.residentName && c.residentName.trim().toLowerCase() === userFullName) return true;
      if (matchedFullName && c.residentName && c.residentName.trim().toLowerCase() === matchedFullName) return true;
      return false;
    });
  }, [certificates, userResidentId, userFullName, matchedFullName]);

  // STRICT USER TRANSACTIONS: Residents can strictly view ONLY their own financial transactions & receipts
  const userTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const payor = t.payorName.trim().toLowerCase();
      if (payor === userFullName) return true;
      if (matchedFullName && payor === matchedFullName) return true;
      if (areNamesMatching(t.payorName, currentUser.name)) return true;
      if (matchedFullName && areNamesMatching(t.payorName, matchedFullName)) return true;
      if (userResidentId && t.remarks && t.remarks.includes(userResidentId)) return true;
      if (currentUser.id && t.remarks && t.remarks.includes(currentUser.id)) return true;
      // Also match if the transaction's OR number corresponds to any of the user's certificates
      if (userCertificates.some((c) => c.orNumber && c.orNumber.trim().toLowerCase() === t.orNumber.trim().toLowerCase())) {
        return true;
      }
      return false;
    });
  }, [transactions, userFullName, matchedFullName, userResidentId, currentUser.id, currentUser.name, userCertificates]);

  // STRICT USER CONCERNS: Residents can strictly view ONLY their own filed concerns
  const userConcerns = useMemo(() => {
    return concerns.filter((con) => {
      if (userResidentId && con.residentId && con.residentId === userResidentId) return true;
      if (con.residentName && con.residentName.trim().toLowerCase() === userFullName) return true;
      if (matchedFullName && con.residentName && con.residentName.trim().toLowerCase() === matchedFullName) return true;
      if (currentUser.contactNumber && con.contactNumber && con.contactNumber === currentUser.contactNumber) return true;
      return false;
    });
  }, [concerns, userResidentId, userFullName, matchedFullName, currentUser.contactNumber]);

  const readyCertificates = userCertificates.filter((c) => c.status === 'Issued' || c.status === 'Approved');
  const pendingCertificates = userCertificates.filter((c) => c.status === 'Pending');

  // RESIDENT SERVICES ITEM COUNTS FOR NOTIFICATION BADGES
  const userFacilitiesCount = useMemo(() => {
    const fCount = facilityReservations.filter((f) => f.reservedByResidentId === userResidentId || areNamesMatching(f.residentName, currentUser.name)).length;
    const eCount = equipmentReservations.filter((e) => e.reservedByResidentId === userResidentId || areNamesMatching(e.residentName, currentUser.name)).length;
    return fCount + eCount;
  }, [facilityReservations, equipmentReservations, userResidentId, currentUser.name]);

  const userHealthCount = useMemo(() => {
    const appts = healthAppointments.filter((h) => h.residentId === userResidentId || areNamesMatching(h.residentName, currentUser.name)).length;
    const meds = medicineRefillRequests.filter((m) => m.residentId === userResidentId || areNamesMatching(m.residentName, currentUser.name)).length;
    return appts + meds;
  }, [healthAppointments, medicineRefillRequests, userResidentId, currentUser.name]);

  const userTrabahoCount = useMemo(() => {
    const apps = jobApplications.filter((j) => j.residentId === userResidentId || areNamesMatching(j.residentName, currentUser.name)).length;
    const enrollments = livelihoodEnrollments.filter((l) => l.residentId === userResidentId || areNamesMatching(l.residentName, currentUser.name)).length;
    const assistance = (livelihoodAssistanceRequests || []).filter((a) => a.residentId === userResidentId || areNamesMatching(a.residentName, currentUser.name)).length;
    return apps + enrollments + assistance;
  }, [jobApplications, livelihoodEnrollments, livelihoodAssistanceRequests, userResidentId, currentUser.name]);

  const userAyudaCount = useMemo(() => {
    const stubs = ayudaClaims.filter((a) => a.residentId === userResidentId || areNamesMatching(a.residentName, currentUser.name)).length;
    const aics = financialAssistanceRequests.filter((f) => f.residentId === userResidentId || areNamesMatching(f.residentName, currentUser.name)).length;
    return stubs + aics;
  }, [ayudaClaims, financialAssistanceRequests, userResidentId, currentUser.name]);

  const userWasteCount = useMemo(() => {
    const bulk = bulkWasteRequests.filter((b) => b.residentId === userResidentId || areNamesMatching(b.residentName, currentUser.name)).length;
    const vols = cleanUpVolunteers.filter((v) => v.residentId === userResidentId || areNamesMatching(v.residentName, currentUser.name)).length;
    return bulk + vols;
  }, [bulkWasteRequests, cleanUpVolunteers, userResidentId, currentUser.name]);

  const userYouthSeniorCount = useMemo(() => {
    const sk = skRegistrations.filter((s) => s.residentId === userResidentId || areNamesMatching(s.residentName, currentUser.name)).length;
    const devices = assistiveDeviceRequests.filter((a) => a.residentId === userResidentId || areNamesMatching(a.residentName, currentUser.name)).length;
    return sk + devices;
  }, [skRegistrations, assistiveDeviceRequests, userResidentId, currentUser.name]);

  const userBlotterCount = useMemo(() => {
    return (blotters || []).filter((b) => {
      const matchComp = b.complainantResidentId === userResidentId || (b.complainantName && (areNamesMatching(b.complainantName, currentUser.name) || b.complainantName.toLowerCase().includes(userFullName)));
      const matchResp = b.respondentResidentId === userResidentId || (b.respondentName && (areNamesMatching(b.respondentName, currentUser.name) || b.respondentName.toLowerCase().includes(userFullName)));
      return matchComp || matchResp;
    }).length;
  }, [blotters, currentUser.name, userResidentId, userFullName]);

  const userSMSAlerts = useMemo(() => {
    const name = currentUser.name.toLowerCase();
    const phone = (currentUser.contactNumber || residentRecord?.contactNumber || '').replace(/[^0-9]/g, '');
    const email = (currentUser.email || residentRecord?.email || '').toLowerCase();
    return smsAlerts.filter((a) => {
      const matchName = a.recipientName.toLowerCase().includes(name) || name.includes(a.recipientName.toLowerCase());
      const matchPhone = phone && a.recipientPhone && a.recipientPhone.replace(/[^0-9]/g, '').includes(phone);
      const matchEmail = email && a.recipientEmail && a.recipientEmail.toLowerCase() === email;
      const isBroadcast = a.category === 'Emergency / Disaster Advisory' || a.recipientName === 'All Residents' || a.category === 'General Broadcast';
      return matchName || matchPhone || matchEmail || isBroadcast;
    });
  }, [smsAlerts, currentUser, residentRecord]);

  // User-specific registered activities
  const userRegisteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const actAttendees = activityAttendees.filter((att) => att.activityId === act.id);
      return (
        act.userRsvpd ||
        actAttendees.some(
          (att) =>
            (currentUser.residentId && att.residentId === currentUser.residentId) ||
            att.residentName.toLowerCase() === currentUser.name.toLowerCase()
        )
      );
    });
  }, [activities, activityAttendees, currentUser]);

  // Activities specifically targeted to the resident's assigned purok or all puroks
  const userPurokActivities = useMemo(() => {
    return activities.filter((act) => {
      if (!act.targetPurok) return true;
      const targetLower = act.targetPurok.toLowerCase();
      const residentLower = (effectivePurok || '').toLowerCase();
      return (
        targetLower.includes('all') ||
        (residentLower && targetLower.includes(residentLower))
      );
    });
  }, [activities, effectivePurok]);

  // Filtered activities specifically for the resident newsfeed
  const filteredFeedActivities = useMemo(() => {
    return activities.filter((act) => {
      // Tab filter
      if (newsfeedFilter === 'purok') {
        const targetLower = (act.targetPurok || '').toLowerCase();
        const residentLower = (effectivePurok || '').toLowerCase();
        const matchesPurok =
          targetLower.includes('all') ||
          (residentLower && targetLower.includes(residentLower));
        if (!matchesPurok) return false;
      } else if (newsfeedFilter === 'registered') {
        const actAttendees = activityAttendees.filter((att) => att.activityId === act.id);
        const isReg =
          act.userRsvpd ||
          actAttendees.some(
            (att) =>
              (currentUser.residentId && att.residentId === currentUser.residentId) ||
              att.residentName.toLowerCase() === currentUser.name.toLowerCase()
          );
        if (!isReg) return false;
      } else if (newsfeedFilter === 'advisories' || newsfeedFilter === 'trabaho' || newsfeedFilter === 'ayuda') {
        return false;
      }

      // Search filter
      if (newsfeedSearch.trim()) {
        const query = newsfeedSearch.toLowerCase().trim();
        const matchesTitle = act.title.toLowerCase().includes(query);
        const matchesDesc = act.description.toLowerCase().includes(query);
        const matchesVenue = act.venue.toLowerCase().includes(query);
        const matchesCategory = act.category.toLowerCase().includes(query);
        const matchesPurok = (act.targetPurok || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesVenue && !matchesCategory && !matchesPurok) {
          return false;
        }
      }

      return true;
    });
  }, [activities, activityAttendees, currentUser, effectivePurok, newsfeedFilter, newsfeedSearch]);

  // Filtered announcements/advisories for the resident newsfeed
  const filteredFeedAnnouncements = useMemo(() => {
    if (newsfeedFilter === 'registered' || newsfeedFilter === 'trabaho' || newsfeedFilter === 'ayuda') return [];
    return announcements.filter((ann) => {
      if (newsfeedFilter === 'purok') {
        const targetLower = (ann.targetAudience || '').toLowerCase();
        const residentLower = (effectivePurok || '').toLowerCase();
        const matchesPurok =
          targetLower.includes('all') ||
          targetLower.includes('resident') ||
          (residentLower && targetLower.includes(residentLower));
        if (!matchesPurok) return false;
      }

      if (newsfeedSearch.trim()) {
        const query = newsfeedSearch.toLowerCase().trim();
        const matchesTitle = ann.title.toLowerCase().includes(query);
        const matchesContent = ann.content.toLowerCase().includes(query);
        const matchesCategory = ann.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent && !matchesCategory) return false;
      }

      return true;
    });
  }, [announcements, effectivePurok, newsfeedFilter, newsfeedSearch]);

  // Completed / Issued Archived Certificates
  const archivedCertificates = userCertificates.filter(
    (c) => c.status === 'Issued' || c.status === 'Approved'
  );

  const validArchivedCount = archivedCertificates.filter((c) => {
    if (!c.expirationDate) return true;
    return new Date(c.expirationDate) >= new Date();
  }).length;

  const waivedArchivedCount = archivedCertificates.filter((c) => {
    return c.fee === 0 || c.orNumber.includes('EXEMPT') || c.orNumber.includes('WAIVED') || c.orNumber.includes('FREE');
  }).length;

  const totalFeesPaid = archivedCertificates.reduce((acc, curr) => acc + (curr.fee || 0), 0);

  // Unique years for year filter dropdown
  const availableYears: string[] = Array.from(
    new Set<string>(
      archivedCertificates.map((c) => {
        const date = c.dateIssued || c.approvedAt || '2026';
        return date.slice(0, 4);
      })
    )
  ).sort((a, b) => b.localeCompare(a));

  // Transactions Aggregate Stats & Filters
  const totalTransactionFeesPaid = userTransactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const waivedTransactionsCount = userTransactions.filter(
    (t) => t.amount === 0 || t.paymentMethod === 'Waived (Exempted)' || (t.orNumber && (t.orNumber.includes('WAIVED') || t.orNumber.includes('EXEMPT')))
  ).length;

  const availableTransactionYears: string[] = Array.from(
    new Set<string>(userTransactions.map((t) => (t.date || '2026').slice(0, 4)))
  ).sort((a, b) => b.localeCompare(a));

  // Filtered and sorted personal transactions
  const filteredUserTransactions = userTransactions
    .filter((t) => {
      if (transactionSearchQuery) {
        const q = transactionSearchQuery.toLowerCase().trim();
        const matchOR = t.orNumber.toLowerCase().includes(q);
        const matchService = t.serviceType.toLowerCase().includes(q);
        const matchPayor = t.payorName.toLowerCase().includes(q);
        const matchRemarks = (t.remarks || '').toLowerCase().includes(q);
        const matchOfficer = (t.cashierName || '').toLowerCase().includes(q);
        if (!matchOR && !matchService && !matchPayor && !matchRemarks && !matchOfficer) {
          return false;
        }
      }

      if (transactionServiceFilter !== 'All' && t.serviceType !== transactionServiceFilter) {
        return false;
      }

      if (transactionPaymentMethodFilter !== 'All') {
        if (transactionPaymentMethodFilter === 'Waived') {
          const isTxWaived = t.amount === 0 || t.paymentMethod === 'Waived (Exempted)' || t.orNumber.includes('WAIVED') || t.orNumber.includes('EXEMPT');
          if (!isTxWaived) return false;
        } else if (t.paymentMethod !== transactionPaymentMethodFilter) {
          return false;
        }
      }

      if (transactionYearFilter !== 'All') {
        const year = (t.date || '').slice(0, 4);
        if (year !== transactionYearFilter) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (transactionSortBy === 'oldest') {
        return (a.date || '').localeCompare(b.date || '');
      }
      if (transactionSortBy === 'highest') {
        return (b.amount || 0) - (a.amount || 0);
      }
      if (transactionSortBy === 'lowest') {
        return (a.amount || 0) - (b.amount || 0);
      }
      // Default newest
      return (b.date || '').localeCompare(a.date || '');
    });

  // Filtered and sorted archive records
  const filteredArchivedCertificates = archivedCertificates
    .filter((c) => {
      // Search query filter
      if (archiveSearchQuery) {
        const q = archiveSearchQuery.toLowerCase();
        const matchControl = c.controlNumber.toLowerCase().includes(q);
        const matchType = c.type.toLowerCase().includes(q);
        const matchPurpose = c.purpose.toLowerCase().includes(q);
        const matchOR = (c.orNumber || '').toLowerCase().includes(q);
        const matchSignatory = (c.signatoryOfficial || '').toLowerCase().includes(q);
        const matchRemarks = (c.remarks || '').toLowerCase().includes(q);
        if (!matchControl && !matchType && !matchPurpose && !matchOR && !matchSignatory && !matchRemarks) {
          return false;
        }
      }

      // Type filter
      if (archiveTypeFilter !== 'All' && c.type !== archiveTypeFilter) {
        return false;
      }

      // Year filter
      if (archiveYearFilter !== 'All') {
        const year = (c.dateIssued || c.approvedAt || '').slice(0, 4);
        if (year !== archiveYearFilter) return false;
      }

      // Validity filter
      if (archiveValidityFilter !== 'All') {
        const isExpired = c.expirationDate ? new Date(c.expirationDate) < new Date() : false;
        if (archiveValidityFilter === 'Valid' && isExpired) return false;
        if (archiveValidityFilter === 'Expired' && !isExpired) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (archiveSortBy === 'oldest') {
        return (a.dateIssued || '').localeCompare(b.dateIssued || '');
      }
      if (archiveSortBy === 'type') {
        return a.type.localeCompare(b.type);
      }
      // Default newest
      return (b.dateIssued || '').localeCompare(a.dateIssued || '');
    });

  const handleQuickRequestClearance = (type: CertificateType = 'Barangay Clearance', purpose = 'Employment Requirement') => {
    setCertType(type);
    setCertPurpose(purpose);
    setCertCustomPurpose('');
    setCertSuccessMessage('');
    setRenewalNotice('');
    setActiveTab('requests');
  };

  const handleQuickViewMyDocuments = () => {
    setActiveTab('archive');
  };

  const handleQuickViewOrdinances = () => {
    setActiveModule('documents');
  };

  const handleRenewCertificate = (archivedCert: CertificateRecord) => {
    setCertType(archivedCert.type);
    const standardPurposes = [
      'Employment Requirement',
      'Postal / Government ID Application',
      'Scholarship Application',
      'Hospital / Medical Assistance (DSWD/PCSO)',
      'Bank Account Opening',
      'Police Clearance Requirement',
      'First Time Jobseeker Pre-Employment',
    ];
    if (standardPurposes.includes(archivedCert.purpose)) {
      setCertPurpose(archivedCert.purpose);
      setCertCustomPurpose('');
    } else {
      setCertPurpose('Other');
      setCertCustomPurpose(archivedCert.purpose);
    }
    setActiveTab('requests');
    setRenewalNotice(
      `Renewal Application Pre-filled: Ready to re-apply for ${archivedCert.type} (Based on Ref: ${archivedCert.controlNumber}). Verify your details below and submit.`
    );
    setTimeout(() => setRenewalNotice(''), 12000);
  };

  const handleRequestCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPurpose = certPurpose === 'Other' ? certCustomPurpose : certPurpose;
    const fee =
      certType === 'Certificate of Indigency' || certType === 'First Time Jobseeker (RA 11261)'
        ? 0
        : certType === 'Business Clearance'
        ? settings.businessClearanceFee || 300
        : certType === 'Certificate of Residency'
        ? settings.residencyCertFee || 50
        : settings.clearanceFeeRegular || 50;

    const newCert = requestCertificate({
      controlNumber: `REQ-2026-${Date.now().toString().slice(-4)}`,
      residentId: residentRecord?.id || currentUser.residentId || 'BS-RES-2026-0099',
      residentName: currentUser.name,
      residentAddress: effectiveAddress,
      residentAge: effectiveAge,
      residentBirthDate: effectiveBirthDate,
      residentCivilStatus: effectiveCivilStatus,
      type: certType,
      purpose: finalPurpose,
      orNumber: fee > 0 ? `OR-PEND-${Date.now().toString().slice(-4)}` : 'WAIVED-ONLINE',
      fee,
      deliveryOption: certDelivery,
      signatoryOfficial: settings.punongBarangay,
      signatoryPosition: 'Punong Barangay',
      remarks: `Submitted online via Citizen Portal on ${new Date().toISOString().split('T')[0]}. Preferred delivery: ${certDelivery}`,
    });

    setCertSuccessMessage(
      `✓ Application submitted! Reference Control No: ${newCert.controlNumber}. The Barangay Office will review your request and notify you once approved and ready for pickup/printing.`
    );
    setTimeout(() => setCertSuccessMessage(''), 10000);
  };

  const handleFileConcern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concernSubject || !concernDetails) return;

    addConcern({
      residentId: residentRecord?.id || currentUser.residentId || 'BS-RES-2026-0099',
      residentName: currentUser.name,
      contactNumber: currentUser.contactNumber || residentRecord?.contactNumber || '0917-890-4421',
      email: currentUser.email || residentRecord?.email || 'resident@example.com',
      purok: currentUser.purok || residentRecord?.purok || 'Purok Mangga',
      category: concernCategory,
      priority: concernPriority,
      subject: concernSubject,
      details: concernDetails,
      description: concernDetails,
      locationDetails: concernLocation || `${currentUser.purok || residentRecord?.purok || 'Purok Mangga'} vicinity`,
      feedbackNotes: 'Forwarded to Barangay Desk & Committee on Duty. Review in progress.',
    });

    setConcernSuccessMessage('Your concern has been submitted directly to the Barangay Council & Tanod on duty. Reference logged.');
    setConcernSubject('');
    setConcernDetails('');
    setConcernLocation('');
    setConcernPriority('Normal');
    setTimeout(() => setConcernSuccessMessage(''), 8000);
  };

  const handleRequestCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionDetails.trim()) return;

    const trackingId = `UPD-${Date.now().toString().slice(-6)}`;
    const concernContent = `Official Resident Data Correction / Update Request:
• Category: ${correctionCategory}
• Requested Correction / New Data: ${correctionDetails}
• Reason / Justification: ${correctionReason || 'Routine civil information update'}
• Supporting Documents Attached/Presented: ${correctionSupportingDocs || 'Personal Affidavit / Government ID'}
• Resident ID: ${residentRecord?.id || currentUser.residentId || 'BS-RES-2026-0099'}
• Status: Pending Civil Registrar Review & Verification`;

    addConcern({
      residentId: residentRecord?.id || currentUser.residentId || 'BS-RES-2026-0099',
      residentName: currentUser.name,
      contactNumber: currentUser.contactNumber || residentRecord?.contactNumber || '0917-000-0000',
      purok: currentUser.purok || residentRecord?.purok || 'Purok Lumboy',
      category: 'General Request',
      subject: `[CIVIL REGISTRY CORRECTION REQUEST] - ${correctionCategory} (Ref: ${trackingId})`,
      details: concernContent,
      description: concernContent,
      locationDetails: `${currentUser.purok || residentRecord?.purok || 'Barangay Sangkol'} Civil Registry Desk`,
      feedbackNotes: 'Official update ticket submitted to Barangay Secretary & Civil Registrar for record verification.',
    });

    setCorrectionSuccessMessage(`Your Civil Data Correction Request (${trackingId}) has been successfully filed with the Barangay Civil Registrar. You will receive an official notification once verified.`);
    setCorrectionDetails('');
    setCorrectionReason('');
    setCorrectionSupportingDocs('');
    setIsCorrectionModalOpen(false);
    setTimeout(() => setCorrectionSuccessMessage(''), 10000);
  };

  const handleCopyResidentId = () => {
    const idToCopy = residentRecord?.id || currentUser.residentId || 'BS-RES-2026-0099';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy);
    }
    setCopiedResidentId(true);
    setTimeout(() => setCopiedResidentId(false), 3000);
  };

  const pinnedAnnouncements = announcements.filter((a) => a.isPinned && a.status === 'Active');
  const regularAnnouncements = announcements.filter((a) => !a.isPinned && a.status === 'Active');

  return (
    <div className="space-y-6 pb-12">
      {/* Resident Portal Header Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
          <BarangaySangkolSeal size={200} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Resident Identity Block */}
          <div className="flex items-start sm:items-center gap-4">
            <div
              className="relative shrink-0 group cursor-pointer"
              onClick={() => setIsPhotoModalOpen(true)}
              title="Click to update or take photo"
            >
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-indigo-400/50 bg-slate-800 shadow-md flex items-center justify-center">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl sm:text-2xl font-black text-white">{currentUser.name.charAt(0)}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 text-white rounded-lg shadow-sm border border-indigo-400">
                <Camera className="w-3 h-3" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Citizen Portal
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Verified Resident
                </span>
                <button
                  type="button"
                  onClick={handleCopyResidentId}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Click to copy Resident Control ID"
                >
                  {copiedResidentId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  <span>{residentRecord?.id || currentUser.residentId || 'BS-RES-2026-0099'}</span>
                </button>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                {currentUser.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{effectivePurok}, {settings.barangayName}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentUser.contactNumber || residentRecord?.contactNumber || '0917-890-4421'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Voter: {residentRecord?.voterStatus || 'Registered'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Emergency Contacts on Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('profile');
                  setProfileSubTab('id_card');
                }}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-white/15 transition-all cursor-pointer shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5 text-indigo-300" />
                <span>Barangay ID</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRequestClearance('Barangay Clearance')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Apply Clearance</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('concerns')}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-white/15 transition-all cursor-pointer shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                <span>File Concern</span>
              </button>
            </div>

            <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/10 text-right shrink-0 hidden xl:block">
              <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-200">24/7 Tanod Hotline</p>
              <p className="text-xs font-black text-amber-300 font-mono">0917-888-SANGKOL</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Service Desk Header (Clean header with direct link back to Newsfeed) */}
      {activeTab !== 'overview' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Newsfeed</span>
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {activeTab === 'profile' && 'Civil Profile & Digital ID'}
                {activeTab === 'requests' && 'Certificate Requests Desk'}
                {activeTab === 'facilities' && 'Venues & Equipment Reservations'}
                {activeTab === 'blotter' && 'Blotter & Lupon Mediation Desk'}
                {activeTab === 'health' && 'Barangay Health Center Desk'}
                {activeTab === 'trabaho' && 'Trabaho & Livelihood Hub'}
                {activeTab === 'ayuda' && 'Ayuda & Relief Distribution'}
                {activeTab === 'waste' && 'Waste & Bayanihan Clean-Up Desk'}
                {activeTab === 'youth_senior' && 'SK Youth & Senior Citizens Hub'}
                {activeTab === 'archive' && 'Certificate Archive & Verification'}
                {activeTab === 'transactions' && 'Official Receipts & Financial Ledger'}
                {activeTab === 'announcements' && 'Barangay Announcements & Advisories'}
                {activeTab === 'activities' && 'Community Activities & Calendar'}
                {activeTab === 'concerns' && 'Citizen Helpdesk & Feedback'}
                {activeTab === 'directory' && 'Barangay Officials Directory'}
                {activeTab === 'settings' && 'Resident Portal Settings'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                You can switch between citizen services anytime using the sidebar navigation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-xl">
              Citizen E-Services
            </span>
          </div>
        </div>
      )}

      {/* TAB 1: RESIDENT NEWSFEED & ACTIVITIES */}
      {activeTab === 'overview' && (
        <ResidentNewsfeedTab
          currentUser={currentUser}
          residentRecord={residentRecord}
          effectivePurok={effectivePurok}
          activities={activities}
          filteredFeedActivities={filteredFeedActivities}
          announcements={announcements}
          filteredFeedAnnouncements={filteredFeedAnnouncements}
          pinnedAnnouncements={pinnedAnnouncements}
          activityAttendees={activityAttendees}
          announcementAttendees={announcementAttendees}
          userRegisteredActivities={userRegisteredActivities}
          userPurokActivities={userPurokActivities}
          userCertificates={userCertificates}
          archivedCertificates={archivedCertificates}
          userSMSAlerts={userSMSAlerts}
          newsfeedFilter={newsfeedFilter}
          setNewsfeedFilter={setNewsfeedFilter}
          newsfeedSearch={newsfeedSearch}
          setNewsfeedSearch={setNewsfeedSearch}
          rsvpActivity={rsvpActivity}
          setSelectedActivityForAttendance={setSelectedActivityForAttendance}
          setSelectedAnnouncementForAttendance={setSelectedAnnouncementForAttendance}
          setSelectedCertForPrint={setSelectedCertForPrint}
          setSelectedAlertForDetail={setSelectedAlertForDetail}
          registerForAnnouncement={registerForAnnouncement}
          cancelAnnouncementRegistration={cancelAnnouncementRegistration}
          setActiveTab={setActiveTab}
        />
      )}

      {/* TAB: MY CIVIL DATA & RESIDENT PROFILE (STRICTLY READ-ONLY FOR CITIZENS) */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Top Civil Registry Certification Banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start sm:items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-200 bg-slate-50 shadow-xs flex items-center justify-center">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-indigo-700">{currentUser.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-full shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      ID: {residentRecord?.id || currentUser.residentId || 'BS-RES-2026-0099'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      Read-Only Official Record
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Civil Registry Series 2026
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{residentRecord.firstName} {residentRecord.middleName ? `${residentRecord.middleName} ` : ''}{residentRecord.lastName} {residentRecord.suffix || ''}</span>
                  </h2>

                  <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{effectiveStreet}, {effectivePurok}, {settings.barangayName}, {settings.municipality}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyResidentId}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy Resident Control ID"
                >
                  {copiedResidentId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedResidentId ? 'Copied ID' : 'Copy ID'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenEditCivilModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Edit Civil Demographics & Religion"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Civil Information</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(true)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileSignature className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Request Data Update</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileSubTab('record_summary')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Record Sheet</span>
                </button>
              </div>
            </div>

            {/* Success Feedback Alert */}
            {editSuccessToast && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{editSuccessToast}</span>
              </div>
            )}

            {/* Read-Only Notice Banner */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3 text-slate-700">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <span>Protected Civil Registry Record (Data Privacy & Legal Verification)</span>
                  <span className="text-[10px] px-2 py-0.2 bg-indigo-100 text-indigo-800 rounded font-semibold">R.A. 10173 & R.A. 7160</span>
                </p>
                <p className="text-slate-600 leading-relaxed">
                  This official demographic record is electronically maintained by the <strong>Office of the Barangay Secretary & Civil Registrar</strong>. In accordance with Philippine civil registration laws, direct in-app editing is restricted to preserve official record authenticity and data privacy. To request corrections or report life events (marriage, change of address, contact number update, or sector eligibility), click <strong>Request Data Update</strong>.
                </p>
              </div>
            </div>

            {/* Feedback notification if submitted */}
            {correctionSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs font-semibold">{correctionSuccessMessage}</p>
              </div>
            )}

            {/* Sub-Tabs Selector */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => setProfileSubTab('civil_data')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  profileSubTab === 'civil_data'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Civil & Demographic Data</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileSubTab('id_card')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  profileSubTab === 'id_card'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Digital Barangay ID Card</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileSubTab('record_summary')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  profileSubTab === 'record_summary'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Resident Information Sheet (RIS)</span>
              </button>
            </div>
          </div>

          {/* SUBTAB 1: COMPREHENSIVE READ-ONLY CIVIL & DEMOGRAPHIC DATA */}
          {profileSubTab === 'civil_data' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1: Personal & Civil Identification */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Personal & Civil Bio</h4>
                      <p className="text-[11px] text-slate-400">Primary legal demographics</p>
                    </div>
                  </div>
                  <span title="Read-Only Field"><Lock className="w-3.5 h-3.5 text-slate-400" /></span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">First Name:</span>
                    <span className="font-bold text-slate-900">{residentRecord.firstName || currentUser.name.split(' ')[0]}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Middle Name:</span>
                    <span className="font-semibold text-slate-900">{residentRecord.middleName || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Last Name:</span>
                    <span className="font-bold text-slate-900">{residentRecord.lastName || currentUser.name.split(' ').slice(1).join(' ')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Suffix:</span>
                    <span className="font-semibold text-slate-900">{residentRecord.suffix || 'None'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Date of Birth:</span>
                    <span className="font-mono font-bold text-slate-900">{effectiveBirthDate || '2000-03-19'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Age:</span>
                    <span className="font-bold text-indigo-700">{effectiveAge} years old</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Sex:</span>
                    <span className="font-semibold text-slate-900">{residentRecord.sex || currentUser.sex || 'Male'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Civil Status:</span>
                    <span className="font-bold text-slate-900">{effectiveCivilStatus}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Blood Type:</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px]">{residentRecord.bloodType || 'O+'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Citizenship:</span>
                    <span className="font-semibold text-slate-900">{residentRecord.citizenship || 'Filipino'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Religion / Faith:</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                      {residentRecord.religion || 'Roman Catholic'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Address & Residence Verification */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Address & Territorial Zone</h4>
                      <p className="text-[11px] text-slate-400">Jurisdiction within Sangkol</p>
                    </div>
                  </div>
                  <span title="Read-Only Field"><Lock className="w-3.5 h-3.5 text-slate-400" /></span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Assigned Purok:</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">{effectivePurok}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">House / Street:</span>
                    <span className="font-semibold text-slate-900">{effectiveStreet}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Barangay:</span>
                    <span className="font-bold text-slate-900">{settings.barangayName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">City / Province:</span>
                    <span className="font-semibold text-slate-900">{settings.municipality}, {settings.province}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Resident Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                      {residentRecord.residentStatus || 'Active'} Verified
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Contact Number:</span>
                    <span className="font-mono font-bold text-slate-900">{currentUser.contactNumber || residentRecord.contactNumber || '0917-890-4421'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="font-mono text-slate-700 truncate max-w-[180px]">{currentUser.email || residentRecord.email || 'citizen@barangay.gov.ph'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Registration Date:</span>
                    <span className="font-mono text-slate-700">{residentRecord.dateRegistered || '2024-01-10'}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Household & Family Composition */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Household & Family</h4>
                      <p className="text-[11px] text-slate-400">Barangay Census Record</p>
                    </div>
                  </div>
                  <span title="Read-Only Field"><Lock className="w-3.5 h-3.5 text-slate-400" /></span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Household No:</span>
                    <span className="font-mono font-bold text-indigo-700">{householdRecord?.householdNo || 'HH-SNG-001'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Role in Family:</span>
                    <span className="font-bold text-slate-900">
                      {residentRecord.isHouseholdHead ? 'Head of Household' : 'Household Member / Dependent'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Household Head:</span>
                    <span className="font-semibold text-slate-900">{householdRecord?.headName || currentUser.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Registered Members:</span>
                    <span className="font-bold text-slate-900">{householdRecord?.members?.length || 4} Members in House</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Housing Type:</span>
                    <span className="font-semibold text-slate-900">{householdRecord?.housingType || 'Concrete'} ({householdRecord?.houseOwnership || 'Owned'})</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Water / Sanitation:</span>
                    <span className="font-semibold text-slate-900">{householdRecord?.waterSource || 'Level III Water / Sanitary Toilet'}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Socio-Economic, Education & COMELEC */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Socio-Economic & Voter</h4>
                      <p className="text-[11px] text-slate-400">Employment & Electoral Data</p>
                    </div>
                  </div>
                  <span title="Read-Only Field"><Lock className="w-3.5 h-3.5 text-slate-400" /></span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Occupation / Career:</span>
                    <span className="font-bold text-slate-900">{residentRecord.occupation || 'Resident Citizen / Professional'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Monthly Income:</span>
                    <span className="font-mono font-bold text-slate-900">₱{(residentRecord.monthlyIncome || 30000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Educational Attainment:</span>
                    <span className="font-semibold text-slate-900">{residentRecord.educationalAttainment || 'College Graduate'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">COMELEC Voter Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                      {residentRecord.voterStatus || 'Registered Voter'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Precinct Assignment:</span>
                    <span className="font-mono font-bold text-slate-900">{residentRecord.precinctNo || 'Precinct 0042-A (Sangkol Central Elementary)'}</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Social Protection & Sector Classifications */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Sector & Social Protection</h4>
                      <p className="text-[11px] text-slate-400">DSWD & Special Sector Status</p>
                    </div>
                  </div>
                  <span title="Read-Only Field"><Lock className="w-3.5 h-3.5 text-slate-400" /></span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50 items-center">
                    <span className="text-slate-500">4Ps Beneficiary (Pantawid):</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${residentRecord.is4PsBeneficiary ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                      {residentRecord.is4PsBeneficiary ? '✓ Enrolled Beneficiary' : 'Not Enrolled'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 items-center">
                    <span className="text-slate-500">Senior Citizen (60+):</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${residentRecord.isSeniorCitizen ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                      {residentRecord.isSeniorCitizen ? '✓ Registered Senior' : 'Regular Citizen'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 items-center">
                    <span className="text-slate-500">Person with Disability (PWD):</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${residentRecord.isPWD ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'}`}>
                      {residentRecord.isPWD ? `✓ PWD (${residentRecord.pwdType || 'Verified'})` : 'Non-PWD'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 items-center">
                    <span className="text-slate-500">Solo Parent (R.A. 8972):</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${residentRecord.isSoloParent ? 'bg-pink-100 text-pink-800' : 'bg-slate-100 text-slate-500'}`}>
                      {residentRecord.isSoloParent ? '✓ Registered Solo Parent' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 items-center">
                    <span className="text-slate-500">Indigent Citizen:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${residentRecord.isIndigent ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {residentRecord.isIndigent ? '✓ Fee-Exempt Indigent' : 'Standard'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 items-center">
                    <span className="text-slate-500">Katipunan ng Kabataan (Youth):</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${residentRecord.isYouth || effectiveAge <= 30 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                      {residentRecord.isYouth || effectiveAge <= 30 ? '✓ Active KK Member' : 'Adult Sector'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 6: Emergency Contact & Public Safety */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Emergency & Safety</h4>
                      <p className="text-[11px] text-slate-400">Disaster & Medical Contacts</p>
                    </div>
                  </div>
                  <span title="Read-Only Field"><Lock className="w-3.5 h-3.5 text-slate-400" /></span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Emergency Contact:</span>
                    <span className="font-bold text-slate-900">{residentRecord.emergencyContactName || 'Barangay Health Station'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Relationship:</span>
                    <span className="font-semibold text-slate-900">Designated Next of Kin / Guardian</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Emergency Phone:</span>
                    <span className="font-mono font-bold text-rose-700">{residentRecord.emergencyContactNumber || '(062) 991-8842 / 0917-888-7264'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Evacuation Center:</span>
                    <span className="font-semibold text-slate-900">Barangay Sangkol Multi-Purpose Gymnasium</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">24/7 Tanod Desk:</span>
                    <span className="font-mono font-bold text-slate-900">0917-888-SANGKOL</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: DIGITAL BARANGAY ID CARD PREVIEW (READ-ONLY) */}
          {profileSubTab === 'id_card' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <BarangayIdCardView
                resident={residentRecord}
                settings={settings}
                onPrint={() => window.print()}
              />
            </div>
          )}

          {/* SUBTAB 3: OFFICIAL RESIDENT INFORMATION SHEET (PRINTABLE) */}
          {profileSubTab === 'record_summary' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Barangay Resident Information Sheet (BRIS)</h3>
                  <p className="text-xs text-slate-500">Official certified copy of your demographic registry entry for personal, banking, or employment filing.</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Official Form</span>
                </button>
              </div>

              {/* Document Preview */}
              <div className="border border-slate-300 rounded-2xl p-6 sm:p-8 bg-slate-50/50 space-y-6 max-w-3xl mx-auto text-slate-900 shadow-xs">
                {/* Official Letterhead */}
                <div className="flex items-center justify-between border-b-2 border-indigo-900 pb-4">
                  <RepublicSeal size={60} />
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-widest font-serif font-bold text-slate-700">Republic of the Philippines</p>
                    <p className="text-[11px] uppercase tracking-wider font-serif font-bold text-slate-800">Province of Zamboanga del Norte • City of Dipolog</p>
                    <h3 className="text-lg font-serif font-black uppercase tracking-wide text-indigo-950">BARANGAY SANGKOL</h3>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-indigo-800 font-bold mt-0.5">OFFICE OF THE BARANGAY CIVIL REGISTRAR</p>
                  </div>
                  <BarangaySangkolSeal size={60} />
                </div>

                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold uppercase tracking-wider bg-slate-200 py-1 rounded text-slate-900">
                    CERTIFIED RESIDENT INFORMATION RECORD
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">Registry Control No: {residentRecord.id || currentUser.residentId || 'BS-RES-2026-0099'} • Date Certified: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Full Registered Name</p>
                    <p className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
                      {residentRecord.firstName} {residentRecord.middleName || ''} {residentRecord.lastName} {residentRecord.suffix || ''}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Civil Status & Sex</p>
                    <p className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      {effectiveCivilStatus} • {residentRecord.sex || 'Male'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Date of Birth & Age</p>
                    <p className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      {effectiveBirthDate || 'March 19, 2000'} ({effectiveAge} years old)
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Assigned Purok & Barangay</p>
                    <p className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      {effectivePurok}, {settings.barangayName}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Household Number & Role</p>
                    <p className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      {householdRecord?.householdNo || 'HH-SNG-001'} ({residentRecord.isHouseholdHead ? 'Head' : 'Member'})
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">COMELEC Precinct & Voter Status</p>
                    <p className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      {residentRecord.voterStatus || 'Registered Voter'} • {residentRecord.precinctNo || 'Precinct 0042-A'}
                    </p>
                  </div>
                </div>

                {/* Certification Statement */}
                <div className="border-t border-slate-200 pt-4 text-xs text-slate-600 leading-relaxed text-justify">
                  <p>
                    This is to certify that according to the records on file in this office, the aforementioned individual is a registered resident of <strong>{settings.barangayName}, {settings.municipality}</strong>, with active status in the Barangay Population and Civil Information System.
                  </p>
                </div>

                {/* Signatures */}
                <div className="flex items-end justify-between pt-6">
                  <div className="text-center">
                    <div className="w-36 border-b border-slate-400 mb-1"></div>
                    <p className="text-[10px] font-bold text-slate-800 uppercase">Resident Signature</p>
                    <p className="text-[9px] text-slate-500 font-mono">Date: {new Date().toISOString().split('T')[0]}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-44 border-b border-slate-400 mb-1"></div>
                    <p className="text-[10px] font-bold text-indigo-950 uppercase">HON. RODRIGO M. SANGKOL</p>
                    <p className="text-[9px] text-slate-600 uppercase font-semibold">Punong Barangay</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
            <RecentSearchesInput
              className="flex-1"
              value={announcementSearch}
              onChange={setAnnouncementSearch}
              placeholder="Search announcements, assemblies, medical drives, schedules..."
              storageKey="resident_portal_announcements"
              theme="light"
              inputClassName="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements
              .filter(
                (a) =>
                  !announcementSearch ||
                  a.title.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                  a.content.toLowerCase().includes(announcementSearch.toLowerCase())
              )
              .map((a) => {
                const attendees = announcementAttendees.filter((att) => att.announcementId === a.id);
                const isUserReg = attendees.some(
                  (att) =>
                    (currentUser.residentId && att.residentId === currentUser.residentId) ||
                    att.residentName.toLowerCase() === currentUser.name.toLowerCase()
                );

                return (
                  <div
                    key={a.id}
                    className={`bg-white p-5 rounded-2xl border transition-all space-y-4 shadow-xs flex flex-col justify-between hover:border-indigo-200 ${
                      a.isPinned ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {a.isPinned && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                                <Pin className="w-3 h-3" /> PINNED NOTICE
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-semibold">
                              {a.category}
                            </span>
                            {a.requiresRegistration && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                Registration Open
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">{a.title}</h3>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {a.content}
                      </div>

                      {(a.eventDate || a.venue) && (
                        <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                          {a.eventDate && (
                            <span className="flex items-center gap-1 text-indigo-700 font-semibold">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{a.eventDate}</span>
                              {a.eventTime && <span className="text-slate-500 font-normal">({a.eventTime})</span>}
                            </span>
                          )}
                          {a.venue && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              <span>{a.venue}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Audience: <strong>{a.targetAudience}</strong></span>
                        </span>
                        <span>Posted: {a.publishDate}</span>
                      </div>

                      {a.requiresRegistration && (
                        <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-600">
                            <strong className="text-indigo-600">{attendees.length}</strong> Residents Registered
                            {a.maxSlots ? ` / ${a.maxSlots}` : ''}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedAnnouncementForAttendance(a)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                              title="View & Print Official Attendance Roster"
                            >
                              <Users className="w-3.5 h-3.5 text-indigo-600" />
                              <span>View / Print Roster</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isUserReg) {
                                  cancelAnnouncementRegistration(a.id);
                                } else {
                                  registerForAnnouncement(a.id);
                                }
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                                isUserReg
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                            >
                              {isUserReg ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Registered ✓</span>
                                </>
                              ) : (
                                <span>Register Attendance</span>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVITIES */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Barangay Activities & Calendar of Events</h3>
              <p className="text-xs text-slate-500">Activities in Purok Pinya, Lumboy, Mangga, Tambis, Kaimito, and Bayabas with real-time registered attendees roster.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Filter by Purok:</span>
              <select
                value={selectedActivityFilter}
                onChange={(e) => setSelectedActivityFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white"
              >
                <option value="All">All Puroks</option>
                {settings.puroks.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities
              .filter(
                (act) =>
                  selectedActivityFilter === 'All' ||
                  act.targetPurok === 'All Puroks' ||
                  arePuroksMatching(act.targetPurok, selectedActivityFilter)
              )
              .map((act) => {
                const actAttendees = activityAttendees.filter((att) => att.activityId === act.id);
                const isUserAttending = actAttendees.some(
                  (att) =>
                    (currentUser.residentId && att.residentId === currentUser.residentId) ||
                    att.residentName.toLowerCase() === currentUser.name.toLowerCase()
                );
                const isUserRegistered = isUserAttending || act.userRsvpd;

                return (
                  <div
                    key={act.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {act.category}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {act.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{act.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-3">{act.description}</p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-900">{act.date}</span>
                          <span className="text-slate-400">•</span>
                          <span>{act.time}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-tight text-slate-700">
                            {act.venue} <strong className="text-indigo-700">({act.targetPurok})</strong>
                          </span>
                        </div>
                      </div>

                      {/* Attendee capacity count preview */}
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-slate-600 font-semibold">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{actAttendees.length} Residents Registered</span>
                        </span>
                        {act.maxParticipants && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            Max: {act.maxParticipants}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedActivityForAttendance(act)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="View list of registered residents for this activity"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Registrants</span>
                      </button>

                      <button
                        onClick={() => rsvpActivity(act.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isUserRegistered
                            ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                        }`}
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>{isUserRegistered ? 'Registered ✓' : 'Register to Attend'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 4: ONLINE CERTIFICATE REQUESTS & APPLICATION TRACKER */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Application Form */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Request Official Barangay Certificate</h3>
                <p className="text-xs text-slate-500">Apply for clearances online. Verified by Barangay Secretary & Captain.</p>
              </div>
            </div>

            {renewalNotice && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in shadow-2xs">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-indigo-900">Fast Renewal Form Pre-filled</p>
                  <p className="text-indigo-800 text-[11px] mt-0.5">{renewalNotice}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRenewalNotice('')}
                  className="text-indigo-500 hover:text-indigo-800 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {certSuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="font-semibold">{certSuccessMessage}</p>
              </div>
            )}

            <form onSubmit={handleRequestCertificate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Certificate Type *
                </label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="Barangay Clearance">Barangay Clearance (₱{settings.clearanceFeeRegular || 50})</option>
                  <option value="Certificate of Residency">Certificate of Residency (₱{settings.residencyCertFee || 50})</option>
                  <option value="Certificate of Indigency">Certificate of Indigency (₱0.00 - Free / Waived)</option>
                  <option value="First Time Jobseeker (RA 11261)">First Time Jobseeker (RA 11261 - Free)</option>
                  <option value="Certificate of Good Moral Character">Certificate of Good Moral Character (₱50.00)</option>
                  <option value="Business Clearance">Business Clearance (₱{settings.businessClearanceFee || 300})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Purpose / Intended Use *
                </label>
                <select
                  value={certPurpose}
                  onChange={(e) => setCertPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="Employment Requirement">Local Employment / DepEd / Private Company Requirement</option>
                  <option value="Postal / Government ID Application">Postal ID / PhilSys / Passport / Driver's License Application</option>
                  <option value="Scholarship Application">Scholarship / Educational Grant Application</option>
                  <option value="Hospital / Medical Assistance (DSWD/PCSO)">Hospital / Medical Financial Assistance (DSWD/PCSO/Malasakit)</option>
                  <option value="Bank Account Opening">Bank Account Opening / Loan Application</option>
                  <option value="Police Clearance Requirement">Police Clearance / NBI Clearance Application</option>
                  <option value="First Time Jobseeker Pre-Employment">First Time Jobseeker Pre-Employment & SSS/PhilHealth</option>
                  <option value="Other">Other Specific Purpose</option>
                </select>
              </div>

              {certPurpose === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Specify Purpose *
                  </label>
                  <input
                    type="text"
                    required
                    value={certCustomPurpose}
                    onChange={(e) => setCertCustomPurpose(e.target.value)}
                    placeholder="Enter your specific purpose..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Claiming / Delivery Option
                </label>
                <select
                  value={certDelivery}
                  onChange={(e) => setCertDelivery(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="Pick up at Barangay Hall">Pick up at Barangay Hall (Window 1)</option>
                  <option value="Digital Copy">Digital Certificate (View, Download & Print Online)</option>
                  <option value="Purok Leader Delivery">Receive through Purok Leader Dispatch</option>
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <p className="font-bold text-slate-900">Applicant Details & Registry Verification:</p>
                <p>
                  Name: <strong>{currentUser.name}</strong>
                </p>
                <p>
                  Age & Civil Status: <strong>{effectiveAge} years old</strong> • <strong>{effectiveCivilStatus}</strong>
                  {effectiveBirthDate && (
                    <span className="text-slate-500 text-[11px] ml-1.5">(Born {effectiveBirthDate})</span>
                  )}
                </p>
                <p>
                  Address: <strong>{effectiveAddress}</strong>
                </p>
                <p>
                  Assessed Fee:{' '}
                  <strong className="text-emerald-700 font-bold">
                    {certType === 'Certificate of Indigency' || certType === 'First Time Jobseeker (RA 11261)'
                      ? 'FREE (Waived under RA 11261 / Indigent Aid)'
                      : certType === 'Business Clearance'
                      ? `₱${settings.businessClearanceFee || 300}.00`
                      : `₱${settings.clearanceFeeRegular || 50}.00`}
                  </strong>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Certificate Application</span>
              </button>
            </form>
          </div>

          {/* Column 2: Resident Request History & Ready Documents */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">My Certificate Applications & History</h3>
                </div>
                <div className="flex items-center gap-2">
                  {archivedCertificates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('archive')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive ({archivedCertificates.length})</span>
                    </button>
                  )}
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                    {userCertificates.length} Total
                  </span>
                </div>
              </div>

              {userCertificates.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <FileCheck2 className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No certificate requests submitted yet</p>
                  <p className="text-xs text-slate-400">
                    Use the form on the left to submit an online clearance or certificate request.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userCertificates.map((cert) => {
                    const isApproved = cert.status === 'Issued' || cert.status === 'Approved';
                    const isPending = cert.status === 'Pending';
                    const isRejected = cert.status === 'Rejected';

                    return (
                      <div
                        key={cert.id}
                        className={`p-4 rounded-2xl border transition-all shadow-xs space-y-3 ${
                          isApproved
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : isPending
                            ? 'bg-amber-50/70 border-amber-300'
                            : 'bg-rose-50/70 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  isApproved
                                    ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                    : isPending
                                    ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                    : 'bg-rose-200 text-rose-900 border border-rose-300'
                                }`}
                              >
                                {isApproved ? '✓ APPROVED & READY' : isPending ? '⏳ PENDING APPROVAL' : 'RETURNED'}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-700">
                                {cert.controlNumber}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{cert.type}</h4>
                            <p className="text-xs text-slate-600">Purpose: {cert.purpose}</p>
                          </div>

                          {isApproved && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => setSelectedArchiveCert(cert)}
                                className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedCertForPrint(cert)}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Status Message & Instructions */}
                        <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80 text-xs space-y-1">
                          <p className="font-semibold text-slate-800">
                            {isApproved ? (
                              <span className="text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Approved! Your certificate is officially issued.</span>
                              </span>
                            ) : isPending ? (
                              <span className="text-amber-800 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Awaiting review and signature by Barangay Officials.</span>
                              </span>
                            ) : (
                              <span className="text-rose-800 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Application was not approved.</span>
                              </span>
                            )}
                          </p>

                          <p className="text-[11px] text-slate-600">
                            {isApproved
                              ? cert.pickupInstructions ||
                                'Ready for pickup at Barangay Hall Window 1. Please present 1 valid ID.'
                              : isPending
                              ? 'You will receive a notification alert in your portal once approved.'
                              : cert.rejectionReason || 'Please visit the Barangay Hall for additional verification.'}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                          <span>
                            Delivery: <strong>{cert.deliveryOption || 'Pick up at Barangay Hall'}</strong>
                          </span>
                          <span>{cert.approvedAt || cert.requestedAt || cert.dateIssued}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CERTIFICATE ARCHIVE & COMPLETED DOCUMENTS */}
      {activeTab === 'archive' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Banner Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <BarangaySangkolSeal size={220} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Official Civil Registry Records
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Lifetime Citizen Access
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                  <Archive className="w-6 h-6 text-indigo-400 shrink-0" />
                  <span>My Certificate & Clearance Archive</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Digital vault of all your completed, signed, and officially issued Barangay Sangkol certifications. View, download, re-print authenticated copies with official seals, or quickly renew past clearances.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-lg shadow-indigo-900/40 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Request New Certificate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bento Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Archived Records</span>
                <FolderArchive className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{archivedCertificates.length}</p>
              <p className="text-[11px] text-slate-500">Official certificates in your citizen file</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Active & Valid</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700">{validArchivedCount}</p>
              <p className="text-[11px] text-slate-500">Currently valid for IDs, jobs, and banks</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Free / Waived Grants</span>
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-700">{waivedArchivedCount}</p>
              <p className="text-[11px] text-slate-500">Indigent assistance & RA 11261 grants</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Treasury Fees Paid</span>
                <Receipt className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-indigo-900">₱{totalFeesPaid.toFixed(2)}</p>
              <p className="text-[11px] text-slate-500">Official receipts logged in Sangkol treasury</p>
            </div>
          </div>

          {/* Search, Filter & View Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Box */}
              <RecentSearchesInput
                className="flex-1"
                value={archiveSearchQuery}
                onChange={setArchiveSearchQuery}
                placeholder="Search by Control Number (e.g. BS-CLR), type, purpose, OR number, or remarks..."
                storageKey="resident_archive_certs"
                theme="light"
                inputClassName="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-colors"
              />

              {/* Filters Group */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Type Filter */}
                <select
                  value={archiveTypeFilter}
                  onChange={(e) => setArchiveTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white cursor-pointer"
                >
                  <option value="All">All Certificate Types</option>
                  <option value="Barangay Clearance">Barangay Clearance</option>
                  <option value="Certificate of Residency">Certificate of Residency</option>
                  <option value="Certificate of Indigency">Certificate of Indigency</option>
                  <option value="Certificate of Good Moral Character">Good Moral Character</option>
                  <option value="Business Clearance">Business Clearance</option>
                  <option value="First Time Jobseeker (RA 11261)">First Time Jobseeker (RA 11261)</option>
                </select>

                {/* Year Filter */}
                {availableYears.length > 0 && (
                  <select
                    value={archiveYearFilter}
                    onChange={(e) => setArchiveYearFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white cursor-pointer"
                  >
                    <option value="All">All Years</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        Year {yr}
                      </option>
                    ))}
                  </select>
                )}

                {/* Validity Filter */}
                <select
                  value={archiveValidityFilter}
                  onChange={(e) => setArchiveValidityFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Valid">Active & Valid</option>
                  <option value="Expired">Historical / Expired</option>
                </select>

                {/* Sort Filter */}
                <select
                  value={archiveSortBy}
                  onChange={(e) => setArchiveSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white cursor-pointer"
                >
                  <option value="newest">Newest Issued First</option>
                  <option value="oldest">Oldest Issued First</option>
                  <option value="type">Certificate Type (A-Z)</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setArchiveViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      archiveViewMode === 'grid'
                        ? 'bg-white text-indigo-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Grid Card View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchiveViewMode('table')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      archiveViewMode === 'table'
                        ? 'bg-white text-indigo-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Table Ledger View"
                  >
                    <Table className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filter Indicators */}
            {(archiveSearchQuery || archiveTypeFilter !== 'All' || archiveYearFilter !== 'All' || archiveValidityFilter !== 'All') && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Filters:</span>
                {archiveSearchQuery && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium flex items-center gap-1">
                    Search: "{archiveSearchQuery}"
                    <button type="button" onClick={() => setArchiveSearchQuery('')} className="hover:text-indigo-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {archiveTypeFilter !== 'All' && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium flex items-center gap-1">
                    Type: {archiveTypeFilter}
                    <button type="button" onClick={() => setArchiveTypeFilter('All')} className="hover:text-indigo-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {archiveYearFilter !== 'All' && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium flex items-center gap-1">
                    Year: {archiveYearFilter}
                    <button type="button" onClick={() => setArchiveYearFilter('All')} className="hover:text-indigo-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {archiveValidityFilter !== 'All' && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium flex items-center gap-1">
                    Status: {archiveValidityFilter}
                    <button type="button" onClick={() => setArchiveValidityFilter('All')} className="hover:text-indigo-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setArchiveSearchQuery('');
                    setArchiveTypeFilter('All');
                    setArchiveYearFilter('All');
                    setArchiveValidityFilter('All');
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer ml-1"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

          {/* Archived Records Content */}
          {filteredArchivedCertificates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                <FolderArchive className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900">
                  {archivedCertificates.length === 0
                    ? 'No completed certificates archived yet'
                    : 'No archived certificates match your search filters'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {archivedCertificates.length === 0
                    ? 'Once your clearance and certificate requests are reviewed and approved by Barangay Officials, permanent authenticated records will be archived here for lifetime access and 24/7 reprinting.'
                    : 'Try clearing your search keyword, adjusting the year or type dropdowns, or resetting your filter criteria.'}
                </p>
              </div>

              {archivedCertificates.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Apply for an Online Certificate Now</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setArchiveSearchQuery('');
                    setArchiveTypeFilter('All');
                    setArchiveYearFilter('All');
                    setArchiveValidityFilter('All');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Search Filters</span>
                </button>
              )}
            </div>
          ) : archiveViewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredArchivedCertificates.map((cert) => {
                const isExpired = cert.expirationDate ? new Date(cert.expirationDate) < new Date() : false;
                const isWaived =
                  cert.fee === 0 ||
                  cert.orNumber.includes('EXEMPT') ||
                  cert.orNumber.includes('WAIVED') ||
                  cert.orNumber.includes('FREE');

                // Color accent by certificate type
                const badgeStyle =
                  cert.type === 'Barangay Clearance'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : cert.type === 'Certificate of Residency'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : cert.type === 'Certificate of Indigency'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : cert.type === 'First Time Jobseeker (RA 11261)'
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : cert.type === 'Business Clearance'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-200';

                return (
                  <div
                    key={cert.id}
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:shadow-md relative overflow-hidden"
                  >
                    {/* Top Row: Type and Validity Badge */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${badgeStyle}`}>
                          {cert.type}
                        </span>

                        {isExpired ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Historical</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active & Valid</span>
                          </span>
                        )}
                      </div>

                      {/* Control Number & Purpose */}
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-500">
                          <span>Ref:</span>
                          <span className="text-slate-900 font-black">{cert.controlNumber}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">{cert.purpose}</h4>
                      </div>

                      {/* Details Box */}
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Date Issued:</span>
                          <span className="font-bold text-slate-900">{cert.dateIssued}</span>
                        </div>

                        {cert.expirationDate && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Validity Expiration:</span>
                            <span className={`font-semibold ${isExpired ? 'text-slate-500' : 'text-emerald-700'}`}>
                              {cert.expirationDate}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60">
                          <span className="text-slate-500">Official Receipt (O.R.):</span>
                          <span className="font-mono font-bold text-slate-800">{cert.orNumber || 'WAIVED'}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Assessed Fee:</span>
                          <span className="font-bold text-emerald-700">
                            {isWaived ? '₱0.00 (Waived/Free)' : `₱${cert.fee.toFixed(2)}`}
                          </span>
                        </div>
                      </div>

                      {/* Signatory Attestation */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">
                          Signed by <strong>{cert.signatoryOfficial || settings.punongBarangay}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedArchiveCert(cert)}
                          className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer"
                          title="View Details & QR Code"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRenewCertificate(cert)}
                          className="px-2.5 py-1.5 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-[11px] font-bold border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Pre-fill form to request a renewal"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>Renew</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedCertForPrint(cert)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table / Ledger View */
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Control Ref & Type</th>
                      <th className="py-3.5 px-4">Purpose</th>
                      <th className="py-3.5 px-4">Date Issued / Expiry</th>
                      <th className="py-3.5 px-4">Receipt (O.R.) & Fee</th>
                      <th className="py-3.5 px-4">Validity</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredArchivedCertificates.map((cert) => {
                      const isExpired = cert.expirationDate ? new Date(cert.expirationDate) < new Date() : false;
                      const isWaived =
                        cert.fee === 0 ||
                        cert.orNumber.includes('EXEMPT') ||
                        cert.orNumber.includes('WAIVED') ||
                        cert.orNumber.includes('FREE');

                      return (
                        <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-slate-900 block">{cert.controlNumber}</span>
                            <span className="text-[11px] text-indigo-600 font-semibold">{cert.type}</span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="font-medium text-slate-800 line-clamp-2">{cert.purpose}</p>
                            <span className="text-[10px] text-slate-400">Signatory: {cert.signatoryOfficial}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-semibold text-slate-900">{cert.dateIssued}</p>
                            <span className="text-[11px] text-slate-500">Exp: {cert.expirationDate || 'Standard 6 Mos'}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-mono font-bold text-slate-800">{cert.orNumber || 'WAIVED'}</p>
                            <span className="font-bold text-emerald-700 text-[11px]">
                              {isWaived ? 'FREE' : `₱${cert.fee.toFixed(2)}`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isExpired ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Expired / Past
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active & Valid
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedArchiveCert(cert)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                                title="Inspect Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRenewCertificate(cert)}
                                className="px-2 py-1 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-[11px] font-bold border border-indigo-200 cursor-pointer transition-colors"
                                title="Renew Certificate"
                              >
                                Renew
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedCertForPrint(cert)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Print</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: MY OFFICIAL RECEIPTS & TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 z-10 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3 h-3 text-emerald-400" />
                  <span>Personal Treasury Ledger</span>
                </span>
                <span className="px-3 py-1 bg-white/10 text-slate-300 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Verified Resident Account
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                My Official Receipts & Payment History
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Review your official Republic of the Philippines barangay receipts (O.R.), document fees paid, indigent clearance waivers, and collecting officer timestamps.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
              <button
                type="button"
                onClick={() => handleQuickRequestClearance('Barangay Clearance')}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Request Clearance</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">My Total Receipts</p>
              <p className="text-2xl font-black text-slate-900 font-mono">{userTransactions.length}</p>
              <p className="text-[11px] text-slate-500">Official O.R. documents recorded</p>
            </div>

            <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Fees Paid</p>
              <p className="text-2xl font-black text-emerald-700 font-mono">₱{totalTransactionFeesPaid.toFixed(2)}</p>
              <p className="text-[11px] text-emerald-700 font-medium">To Barangay Sangkol Treasury</p>
            </div>

            <div className="bg-white border border-indigo-200/80 rounded-2xl p-4 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Waived / Free Services</p>
              <p className="text-2xl font-black text-indigo-700 font-mono">{waivedTransactionsCount}</p>
              <p className="text-[11px] text-indigo-600 font-medium">Indigency & RA 11261 waivers</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payer Account</p>
              <p className="text-sm font-black text-slate-900 truncate mt-1">{currentUser.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">{currentUser.residentId || residentRecord?.id || 'Resident'}</p>
            </div>
          </div>

          {/* Search, Filter & Layout Controls */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Bar */}
              <RecentSearchesInput
                className="sm:col-span-2 lg:col-span-1"
                value={transactionSearchQuery}
                onChange={setTransactionSearchQuery}
                placeholder="Search O.R. #, purpose, officer..."
                storageKey="resident_transactions"
                theme="light"
                inputClassName="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 transition-colors"
              />

              {/* Service Type Filter */}
              <div>
                <select
                  value={transactionServiceFilter}
                  onChange={(e) => setTransactionServiceFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="All">All Service Types</option>
                  <option value="Barangay Clearance">Barangay Clearance</option>
                  <option value="Certificate of Residency">Certificate of Residency</option>
                  <option value="Certificate of Indigency">Certificate of Indigency</option>
                  <option value="First Time Jobseeker (RA 11261)">Jobseeker (RA 11261)</option>
                  <option value="Business Permit">Business Permit</option>
                  <option value="Facility Rental">Facility Rental</option>
                  <option value="Other Certification">Other Certification</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <select
                  value={transactionPaymentMethodFilter}
                  onChange={(e) => setTransactionPaymentMethodFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="All">All Payment Modes</option>
                  <option value="Cash">Cash Payments</option>
                  <option value="Online / Bank">Online / Bank Transfer</option>
                  <option value="Waived">Waived / Free (₱0.00)</option>
                </select>
              </div>

              {/* Year Filter & View Mode */}
              <div className="flex items-center gap-2">
                <select
                  value={transactionYearFilter}
                  onChange={(e) => setTransactionYearFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="All">All Years</option>
                  {availableTransactionYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTransactionViewMode('table')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      transactionViewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Table Ledger View"
                  >
                    <Table className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      transactionViewMode === 'grid' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Card / Receipt Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Count and Active Filter Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-slate-900">{filteredUserTransactions.length}</strong> of{' '}
                  <strong className="text-slate-900">{userTransactions.length}</strong> personal receipt(s)
                </span>
                {(transactionSearchQuery || transactionServiceFilter !== 'All' || transactionPaymentMethodFilter !== 'All' || transactionYearFilter !== 'All') && (
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionSearchQuery('');
                      setTransactionServiceFilter('All');
                      setTransactionPaymentMethodFilter('All');
                      setTransactionYearFilter('All');
                      setTransactionSortBy('newest');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer ml-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px]">Sort:</span>
                <select
                  value={transactionSortBy}
                  onChange={(e) => setTransactionSortBy(e.target.value as any)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Amount</option>
                  <option value="lowest">Lowest Amount</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions Content */}
          {filteredUserTransactions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                <Receipt className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="text-base font-bold text-slate-900">
                  {userTransactions.length === 0
                    ? 'No Official Receipts on Record Yet'
                    : 'No Receipts Match Your Filter Criteria'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {userTransactions.length === 0
                    ? 'When you apply for barangay clearances, residency certifications, or indigent waivers, your validated Official Receipts (O.R.) will be automatically linked and available for viewing and printing here.'
                    : 'Try broadening your search query, selecting "All Service Types", or resetting active filters.'}
                </p>
              </div>
              {userTransactions.length === 0 ? (
                <button
                  type="button"
                  onClick={() => handleQuickRequestClearance('Barangay Clearance')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Apply for a Certificate</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTransactionSearchQuery('');
                    setTransactionServiceFilter('All');
                    setTransactionPaymentMethodFilter('All');
                    setTransactionYearFilter('All');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : transactionViewMode === 'grid' ? (
            /* Card / Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUserTransactions.map((tx) => {
                const isWaived =
                  tx.amount === 0 ||
                  tx.paymentMethod === 'Waived (Exempted)' ||
                  (tx.orNumber && (tx.orNumber.includes('WAIVED') || tx.orNumber.includes('EXEMPT')));

                return (
                  <div
                    key={tx.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      {/* Top Bar: OR Number & Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Receipt</span>
                            <span className="font-mono font-black text-xs text-slate-900">{tx.orNumber}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isWaived
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {isWaived ? 'Waived / Free' : `₱${tx.amount.toFixed(2)}`}
                        </span>
                      </div>

                      {/* Service & Purpose */}
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <h4 className="text-sm font-bold text-slate-900">{tx.serviceType}</h4>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {tx.remarks || `Official fee collection for ${tx.serviceType}`}
                        </p>
                      </div>

                      {/* Key Metadata Details */}
                      <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Date Issued:</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-indigo-600" />
                            {tx.date}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Payment Mode:</span>
                          <span className="font-semibold text-slate-800">{tx.paymentMethod}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Treasury Officer:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[140px]">
                            {tx.cashierName || settings.barangayTreasurer || 'Barangay Treasurer'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        ID: {tx.id.slice(0, 12)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedReceiptForPrint(tx)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Official Receipt</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table / Ledger View */
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">O.R. Number & ID</th>
                      <th className="py-3.5 px-4">Service / Purpose</th>
                      <th className="py-3.5 px-4">Date Issued</th>
                      <th className="py-3.5 px-4">Payment Method</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Collecting Officer</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUserTransactions.map((tx) => {
                      const isWaived =
                        tx.amount === 0 ||
                        tx.paymentMethod === 'Waived (Exempted)' ||
                        (tx.orNumber && (tx.orNumber.includes('WAIVED') || tx.orNumber.includes('EXEMPT')));

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono font-black text-slate-900 block">{tx.orNumber}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{tx.id.slice(0, 10)}</span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="font-bold text-slate-900">{tx.serviceType}</p>
                            <p className="text-[11px] text-slate-500 truncate">{tx.remarks || 'Standard document transaction'}</p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-800">{tx.date}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {tx.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`font-mono font-bold text-xs ${
                                isWaived ? 'text-indigo-700' : 'text-emerald-700'
                              }`}
                            >
                              {isWaived ? 'WAIVED / FREE' : `₱${tx.amount.toFixed(2)}`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-slate-700 font-medium">
                              {tx.cashierName || settings.barangayTreasurer || 'Barangay Treasurer'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptForPrint(tx)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print O.R.</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CITIZEN CONCERNS */}
      {activeTab === 'concerns' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BadgeAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">File a Community Concern</h3>
                <p className="text-xs text-slate-500">Direct report to Barangay Sangkol Council & Tanods</p>
              </div>
            </div>

            {concernSuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="font-semibold">{concernSuccessMessage}</p>
              </div>
            )}

            <form onSubmit={handleFileConcern} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={concernCategory}
                  onChange={(e) => setConcernCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="Infrastructure & Lighting">Streetlight / Road / Infrastructure</option>
                  <option value="Sanitation & Garbage">Garbage Collection / Drainage / Sanitation</option>
                  <option value="Peace & Order">Peace & Order / Noise Disturbance</option>
                  <option value="Health & Safety">Health / Stray Animals / Safety</option>
                  <option value="General Inquiry">General Inquiry / Assistance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Urgency / Priority Level
                </label>
                <select
                  value={concernPriority}
                  onChange={(e) => setConcernPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="Normal">Normal Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Attention</option>
                  <option value="Emergency">Emergency Response</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Location in Purok *
                </label>
                <input
                  type="text"
                  required
                  value={concernLocation}
                  onChange={(e) => setConcernLocation(e.target.value)}
                  placeholder="e.g. Corner mango tree, near sari-sari store"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={concernSubject}
                  onChange={(e) => setConcernSubject(e.target.value)}
                  placeholder="e.g. Solar streetlight not turning on at night"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={concernDetails}
                  onChange={(e) => setConcernDetails(e.target.value)}
                  placeholder="Provide complete details so the field team or Kagawad on duty can investigate and take swift action..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-0.5">
                <p>
                  Filing As: <strong>{currentUser.name}</strong>
                </p>
                <p>
                  Purok: <strong>{effectivePurok}</strong> • Contact:{' '}
                  <strong>{currentUser.contactNumber || residentRecord?.contactNumber || '0917-890-4421'}</strong>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Concern to Barangay</span>
              </button>
            </form>
          </div>

          {/* My Filed Concerns List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  My Filed Reports & Barangay Action Status ({userConcerns.length})
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                Live Status Tracker
              </span>
            </div>

            {userConcerns.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                  <BadgeAlert className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">No Concerns Submitted Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Have an issue in your purok? Fill out the form on the left to submit a report directly to the Barangay Council and Tanods.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {userConcerns.map((con) => {
                  const isRead = con.isRead;
                  const isResolved = con.status === 'Resolved';
                  const isActionTaken = con.status === 'Action Taken';
                  const isInReview = con.status === 'In Review';

                  return (
                    <div
                      key={con.id}
                      className="bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-5 shadow-xs space-y-3.5 transition-all"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                              {con.id}
                            </span>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                                isResolved
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : isActionTaken
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : isInReview
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              {con.status}
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                              {con.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">{con.subject}</h4>
                        </div>

                        {/* Read Receipt Status */}
                        <div>
                          {isRead ? (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Read & Logged by {con.readBy || 'Barangay Desk'}</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Sent — In Desk Queue</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs text-slate-700 space-y-1">
                        <p className="whitespace-pre-wrap">{con.details || con.description}</p>
                        {con.locationDetails && (
                          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                            📍 <strong>Location:</strong> {con.locationDetails}
                          </p>
                        )}
                      </div>

                      {/* Barangay Action & Feedback to Citizen */}
                      {(con.assignedTo || con.feedbackNotes || con.actionNotes) && (
                        <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs space-y-2">
                          <div className="flex items-center justify-between text-indigo-950 font-bold text-[11px]">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Official Barangay Response & Directives</span>
                            </span>
                            {con.targetResolutionDate && (
                              <span className="text-indigo-700 font-semibold">
                                Target Date: {con.targetResolutionDate}
                              </span>
                            )}
                          </div>

                          {con.assignedTo && (
                            <p className="text-[11px] text-slate-600">
                              Responding Unit: <strong className="text-slate-900">{con.assignedTo}</strong>
                            </p>
                          )}

                          {con.feedbackNotes && (
                            <p className="text-[11px] text-indigo-900 bg-white/80 p-2.5 rounded-xl border border-indigo-100 italic">
                              "{con.feedbackNotes}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Footer & Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Submitted on {con.dateSubmitted}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedConcernForView(con)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Full Action Sheet</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: OFFICIALS DIRECTORY & EMERGENCY HOTLINES */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Emergency Hotlines Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs space-y-2">
              <p className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Barangay Tanod Patrol</p>
              <p className="text-lg font-black text-rose-950 font-mono">0917-888-7264</p>
              <p className="text-xs text-rose-800">24/7 Peace & Emergency Response Team</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs space-y-2">
              <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Barangay Health Center</p>
              <p className="text-lg font-black text-emerald-950 font-mono">0917-234-HEALTH</p>
              <p className="text-xs text-emerald-800">First Aid, Ambulance & Maternity</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-xs space-y-2">
              <p className="text-[10px] font-black uppercase text-blue-800 tracking-wider">PNP Police Sub-Station</p>
              <p className="text-lg font-black text-blue-950 font-mono">117 / 0917-911-0000</p>
              <p className="text-xs text-blue-800">Municipal Police Desk</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs space-y-2">
              <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Bureau of Fire Protection</p>
              <p className="text-lg font-black text-amber-950 font-mono">0917-FIRE-HELP</p>
              <p className="text-xs text-amber-800">Municipal Fire Station</p>
            </div>
          </div>

          {/* Sangguniang Barangay Officials Roster */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sangguniang Barangay Officials Directory</h3>
              <p className="text-xs text-slate-500">Elected Officials & Appointed Staff serving Barangay Sangkol.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {officials.map((off) => (
                <div
                  key={off.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                      {off.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{off.name}</h4>
                      <p className="text-[11px] font-semibold text-indigo-600">{off.position}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                    {off.committee && (
                      <p className="text-[11px]">Committee: <strong className="text-slate-800">{off.committee}</strong></p>
                    )}
                    <p className="text-[11px]">Assigned: <strong className="text-slate-800">{off.purok}</strong></p>
                    <p className="text-[11px]">Contact: <strong className="text-slate-800">{off.contactNumber}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NEW RESIDENT SERVICE TABS */}
      {activeTab === 'facilities' && (
        <FacilityEquipmentReservationsTab
          residentId={userResidentId || residentRecord?.id || ''}
          residentName={currentUser?.name || `${residentRecord?.firstName || 'Resident'} ${residentRecord?.lastName || 'Citizen'}`}
          contactNumber={currentUser?.contactNumber || residentRecord?.contactNumber || '0917-890-4421'}
          purok={effectivePurok}
        />
      )}

      {activeTab === 'blotter' && (
        <BlotterLuponTrackingTab
          residentId={userResidentId || residentRecord?.id || ''}
          residentName={currentUser?.name || `${residentRecord?.firstName || 'Resident'} ${residentRecord?.lastName || 'Citizen'}`}
          contactNumber={currentUser?.contactNumber || residentRecord?.contactNumber || '0917-890-4421'}
          purok={effectivePurok}
        />
      )}

      {activeTab === 'health' && (
        <HealthCenterDeskTab
          residentId={userResidentId || residentRecord?.id || ''}
          residentName={currentUser?.name || `${residentRecord?.firstName || 'Resident'} ${residentRecord?.lastName || 'Citizen'}`}
          contactNumber={currentUser?.contactNumber || residentRecord?.contactNumber || '0917-890-4421'}
          purok={effectivePurok}
        />
      )}

      {activeTab === 'trabaho' && (
        <TrabahoLivelihoodTab
          residentId={userResidentId || residentRecord?.id || ''}
          residentName={currentUser?.name || `${residentRecord?.firstName || 'Resident'} ${residentRecord?.lastName || 'Citizen'}`}
          contactNumber={currentUser?.contactNumber || residentRecord?.contactNumber || '0917-890-4421'}
          purok={effectivePurok}
        />
      )}

      {activeTab === 'ayuda' && (
        <AyudaReliefClaimTab
          residentId={userResidentId || residentRecord?.id || ''}
          residentName={currentUser?.name || `${residentRecord?.firstName || 'Resident'} ${residentRecord?.lastName || 'Citizen'}`}
          contactNumber={currentUser?.contactNumber || residentRecord?.contactNumber || '0917-890-4421'}
          purok={effectivePurok}
        />
      )}

      {activeTab === 'waste' && (
        <SolidWasteCleanUpTab
          residentId={userResidentId || residentRecord?.id || ''}
          residentName={currentUser?.name || `${residentRecord?.firstName || 'Resident'} ${residentRecord?.lastName || 'Citizen'}`}
          contactNumber={currentUser?.contactNumber || residentRecord?.contactNumber || '0917-890-4421'}
          purok={effectivePurok}
        />
      )}

      {activeTab === 'youth_senior' && (
        <YouthSeniorHubTab
          residentId={userResidentId || residentRecord?.id || ''}
          residentName={currentUser?.name || `${residentRecord?.firstName || 'Resident'} ${residentRecord?.lastName || 'Citizen'}`}
          contactNumber={currentUser?.contactNumber || residentRecord?.contactNumber || '0917-890-4421'}
          purok={effectivePurok}
        />
      )}

      {/* TAB 10: RESIDENT PORTAL & ACCOUNT SETTINGS */}
      {activeTab === 'settings' && (
        <ResidentPortalSettingsTab
          onNavigateToProfile={() => setActiveTab('profile')}
        />
      )}

      {/* Profile Photo Studio Modal */}
      <UserProfilePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        targetUser={currentUser}
      />

      {/* Certificate Archive Details & Verification Modal */}
      {selectedArchiveCert && (
        <CertificateDetailModal
          certificate={selectedArchiveCert}
          settings={settings}
          onClose={() => setSelectedArchiveCert(null)}
          onPrint={(cert) => setSelectedCertForPrint(cert)}
          onRenew={(cert) => handleRenewCertificate(cert)}
        />
      )}

      {/* Activity Attendance & Registration Roster Modal */}
      {selectedActivityForAttendance && (
        <ActivityAttendanceModal
          activity={selectedActivityForAttendance}
          onClose={() => setSelectedActivityForAttendance(null)}
        />
      )}

      {/* Announcement Attendance & Registration Roster Modal */}
      {selectedAnnouncementForAttendance && (
        <AnnouncementAttendanceModal
          announcement={selectedAnnouncementForAttendance}
          onClose={() => setSelectedAnnouncementForAttendance(null)}
        />
      )}

      {/* Official Civil Data Correction / Update Request Modal */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Request Civil Data Correction</h3>
                  <p className="text-xs text-slate-500">Official filing to the Barangay Civil Registrar & Secretary.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCorrectionModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Barangay Civil Records Integrity Notice</p>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Per the Local Government Code and Data Privacy Act, civil record amendments require validation by the Barangay Secretary. Submitting this request generates a tracked ticket and queues your demographic update for official review.
                </p>
              </div>
            </div>

            <form onSubmit={handleRequestCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correction Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={correctionCategory}
                  onChange={(e) => setCorrectionCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Personal Demographics (Name, Birthdate, Civil Status)">Personal Demographics (Name, Birthdate, Civil Status)</option>
                  <option value="Religion, Faith, Citizenship & Blood Type">Religion, Faith, Citizenship & Blood Type</option>
                  <option value="Residential Address / Purok Relocation">Residential Address / Purok Relocation</option>
                  <option value="Contact Number / Email Update">Contact Number / Email Update</option>
                  <option value="Household Composition / Head of Family">Household Composition / Head of Family</option>
                  <option value="COMELEC Voter Registration / Precinct">COMELEC Voter Registration / Precinct</option>
                  <option value="Special Sector Status (Senior, PWD, 4Ps, Solo Parent, Indigent)">Special Sector Status (Senior, PWD, 4Ps, Solo Parent, Indigent)</option>
                  <option value="Occupation / Educational Attainment">Occupation / Educational Attainment</option>
                  <option value="Emergency Contact Person">Emergency Contact Person</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Requested Correction & Accurate Data <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionDetails}
                  onChange={(e) => setCorrectionDetails(e.target.value)}
                  placeholder="Specify the exact field to update and provide the accurate corrected information (e.g., Update Civil Status to Married; Update contact number to 0917-xxx-xxxx; Update Purok to Purok Mangga)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Update / Justification
                </label>
                <input
                  type="text"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g., Recent marriage certificate issued; Moved house location; Typographical error correction..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supporting Document Attached / Presented
                </label>
                <input
                  type="text"
                  value={correctionSupportingDocs}
                  onChange={(e) => setCorrectionSupportingDocs(e.target.value)}
                  placeholder="e.g., PSA Birth Certificate, Valid PhilSys National ID, Marriage Contract, PWD ID Card..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Correction Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Civil Demographics & Religion Editor Modal */}
      {isEditCivilModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Edit Civil Information</h3>
                  <p className="text-xs text-slate-500">Update your official religion, citizenship, contact, and civil records.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCivilModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCivilProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Religion Field */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Religion / Religious Affiliation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editReligion}
                    onChange={(e) => setEditReligion(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {PHILIPPINE_RELIGIONS.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                  {editReligion === 'Other Faith / Belief System' && (
                    <input
                      type="text"
                      required
                      value={editCustomReligion}
                      onChange={(e) => setEditCustomReligion(e.target.value)}
                      placeholder="Specify your religion or belief system..."
                      className="mt-2 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  )}
                </div>

                {/* Citizenship */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Citizenship <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editCitizenship}
                    onChange={(e) => setEditCitizenship(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {CITIZENSHIP_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Blood Type */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Blood Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editBloodType}
                    onChange={(e) => setEditBloodType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {BLOOD_TYPES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Civil Status */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Civil Status</label>
                  <select
                    value={editCivilStatus}
                    onChange={(e) => setEditCivilStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                    <option value="Common Law">Common Law / Cohabiting</option>
                  </select>
                </div>

                {/* Contact Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Contact Number</label>
                  <input
                    type="text"
                    value={editContactNumber}
                    onChange={(e) => setEditContactNumber(e.target.value)}
                    placeholder="0917-xxx-xxxx"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="resident@example.com"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Occupation */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Occupation / Employment</label>
                  <input
                    type="text"
                    value={editOccupation}
                    onChange={(e) => setEditOccupation(e.target.value)}
                    placeholder="e.g. Teacher, Driver, Self-Employed"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Street Address */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Street / House Address</label>
                  <input
                    type="text"
                    value={editStreetAddress}
                    onChange={(e) => setEditStreetAddress(e.target.value)}
                    placeholder="House No., Street Name, Sitio"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Emergency Contact Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Emergency Contact Person</label>
                  <input
                    type="text"
                    value={editEmergencyContactName}
                    onChange={(e) => setEditEmergencyContactName(e.target.value)}
                    placeholder="Full name of contact"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Emergency Contact Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Emergency Contact Number</label>
                  <input
                    type="text"
                    value={editEmergencyContactNumber}
                    onChange={(e) => setEditEmergencyContactNumber(e.target.value)}
                    placeholder="0917-xxx-xxxx"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditCivilModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Demographics</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CITIZEN CONCERN ACTION SHEET MODAL */}
      {selectedConcernForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                    <ShieldCheck className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-300">
                        {selectedConcernForView.id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white">
                        {selectedConcernForView.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">Barangay Action & Tracking Sheet</h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedConcernForView(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject / Category</p>
                <h4 className="text-sm font-bold text-slate-900">{selectedConcernForView.subject}</h4>
                <p className="text-xs text-indigo-600 font-semibold">{selectedConcernForView.category} • Purok {selectedConcernForView.purok}</p>
              </div>

              {/* Read Receipt Banner */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                <span className="text-slate-500">Read & Desk Intake:</span>
                {selectedConcernForView.isRead ? (
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Read by {selectedConcernForView.readBy || 'Barangay Staff'} ({selectedConcernForView.readAt || 'Logged'})
                  </span>
                ) : (
                  <span className="font-bold text-amber-700 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    In Barangay Intake Queue
                  </span>
                )}
              </div>

              {/* Citizen Submitted Statement */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Citizen Filed Statement</p>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedConcernForView.details || selectedConcernForView.description}
                </p>
                {selectedConcernForView.locationDetails && (
                  <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                    📍 <strong>Reported Location:</strong> {selectedConcernForView.locationDetails}
                  </p>
                )}
              </div>

              {/* Official Action and Directives */}
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between text-indigo-950 font-bold text-xs">
                  <span>Barangay Official Directives & Notes</span>
                  {selectedConcernForView.targetResolutionDate && (
                    <span className="text-[11px] text-indigo-700">Target Date: {selectedConcernForView.targetResolutionDate}</span>
                  )}
                </div>

                <div className="text-xs space-y-1 text-slate-700">
                  <p>Responding Unit / Official: <strong>{selectedConcernForView.assignedTo || 'Barangay Tanod Patrol & Desk Officer'}</strong></p>
                  <p>Current Status: <strong>{selectedConcernForView.status}</strong></p>
                  {selectedConcernForView.feedbackNotes && (
                    <div className="mt-2 p-3 bg-white rounded-xl border border-indigo-200 text-indigo-950 italic text-xs">
                      "{selectedConcernForView.feedbackNotes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action History Log if any */}
              {selectedConcernForView.actionHistory && selectedConcernForView.actionHistory.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Activity & Action History</p>
                  <div className="space-y-2">
                    {selectedConcernForView.actionHistory.map((act, actIdx) => (
                      <div key={actIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-0.5">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{act.action}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{act.timestamp}</span>
                        </div>
                        {act.notes && <p className="text-[11px] text-slate-600">{act.notes}</p>}
                        <p className="text-[10px] text-slate-400">By: {act.actor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedConcernForView(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Tracking Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official SMS / Email Alert Detail Modal for Resident */}
      {selectedAlertForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Barangay Official Advisory</h3>
                  <p className="text-[11px] text-slate-500">Official citizen notification broadcast</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlertForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-[11px]">
                  {selectedAlertForDetail.category}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {new Date(selectedAlertForDetail.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  •{' '}
                  {new Date(selectedAlertForDetail.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">{selectedAlertForDetail.subject}</h4>
                <p className="text-[11px] text-slate-500">
                  Issued by: <span className="font-semibold text-slate-700">{selectedAlertForDetail.sender || 'Barangay Sangkol Administration'}</span>
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                {selectedAlertForDetail.smsMessage}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span>Dispatched to: {selectedAlertForDetail.recipientName} ({selectedAlertForDetail.recipientPhone})</span>
                <span className="font-semibold text-slate-600">Channel: {selectedAlertForDetail.channel}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedAlertForDetail.smsMessage);
                  setCopiedAlertId(selectedAlertForDetail.id);
                  setTimeout(() => setCopiedAlertId(null), 2000);
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {copiedAlertId === selectedAlertForDetail.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedAlertForDetail(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
