import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  FacilityReservation,
  EquipmentReservation,
  HealthAppointment,
  ChildImmunizationTracker,
  MedicineRefillRequest,
  PharmacyInventoryItem,
  HealthOutreachMission,
  VitalSigns,
  CommunityJobPosting,
  JobApplicationRecord,
  LivelihoodTrainingWorkshop,
  LivelihoodEnrollmentRecord,
  LivelihoodAssistanceRequest,
  AyudaClaimStub,
  FinancialAssistanceRequest,
  WasteCollectionSchedule,
  BulkWastePickupRequest,
  BayanihanCleanUpDrive,
  BayanihanVolunteerRecord,
  SKTournamentActivity,
  SKRegistrationRecord,
  SeniorCitizenBenefitSchedule,
  AssistiveDeviceRequest,
  IllegalDumpingReport,
  MRFRecyclablesDropRecord,
  ServiceDeskTab,
} from '../types/residentServices';
import { SystemNotification } from '../types';
import {
  initialFacilityReservations,
  initialEquipmentReservations,
  initialHealthAppointments,
  initialChildImmunizations,
  initialMedicineRefills,
  initialPharmacyInventory,
  initialHealthOutreachMissions,
  initialJobPostings,
  initialJobApplications,
  initialLivelihoodTrainings,
  initialLivelihoodEnrollments,
  initialLivelihoodAssistanceRequests,
  initialAyudaStubs,
  initialFinancialAssistanceRequests,
  initialWasteSchedules,
  initialBulkWasteRequests,
  initialBayanihanDrives,
  initialBayanihanVolunteers,
  initialIllegalDumpingReports,
  initialMRFDropRecords,
  initialSKActivities,
  initialSKRegistrations,
  initialSeniorBenefits,
  initialAssistiveRequests,
} from '../data/residentServicesData';
import { purgeLegacyAppStorageData } from '../utils/storageUtils';
import { useBarangay, areNamesMatching } from './BarangayContext';
import {
  fetchFullCommunityDatabase,
  seedCommunityServicesIfEmpty,
  upsertFacilityReservation,
  deleteFacilityReservationFromSupabase,
  upsertEquipmentReservation,
  deleteEquipmentReservationFromSupabase,
  upsertHealthAppointment,
  deleteHealthAppointmentFromSupabase,
  upsertChildImmunization,
  deleteChildImmunizationFromSupabase,
  upsertPharmacyItem,
  deletePharmacyItemFromSupabase,
  upsertMedicineRefill,
  deleteMedicineRefillFromSupabase,
  upsertHealthMission,
  deleteHealthMissionFromSupabase,
  upsertJobPosting,
  deleteJobPostingFromSupabase,
  upsertJobApplication,
  deleteJobApplicationFromSupabase,
  upsertLivelihoodTraining,
  deleteLivelihoodTrainingFromSupabase,
  upsertLivelihoodEnrollment,
  deleteLivelihoodEnrollmentFromSupabase,
  upsertLivelihoodAssistance,
  deleteLivelihoodAssistanceFromSupabase,
  upsertAyudaClaim,
  deleteAyudaClaimFromSupabase,
  upsertFinancialAssistance,
  deleteFinancialAssistanceFromSupabase,
  upsertWasteSchedule,
  deleteWasteScheduleFromSupabase,
  upsertBulkWastePickup,
  deleteBulkWastePickupFromSupabase,
  upsertCleanUpDrive,
  deleteCleanUpDriveFromSupabase,
  upsertCleanUpVolunteer,
  deleteCleanUpVolunteerFromSupabase,
  upsertIllegalDumpingReport,
  deleteIllegalDumpingReportFromSupabase,
  upsertMRFDropRecord,
  deleteMRFDropRecordFromSupabase,
  upsertSKTournament,
  deleteSKTournamentFromSupabase,
  upsertSKRegistration,
  deleteSKRegistrationFromSupabase,
  upsertSeniorBenefitSchedule,
  deleteSeniorBenefitScheduleFromSupabase,
  upsertAssistiveDeviceRequest,
  deleteAssistiveDeviceRequestFromSupabase,
} from '../services/communitySupabaseService';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

export interface CommunityServicesContextType {
  // Navigation & Deep Linking State
  activeServiceDeskTab: ServiceDeskTab;
  setActiveServiceDeskTab: (tab: ServiceDeskTab) => void;
  targetServiceId: string | null;
  setTargetServiceId: (id: string | null) => void;

  // Real-time Service Notifications
  communityNotifications: SystemNotification[];
  unreadCommunityNotifCount: number;

  // 1. Facilities & Equipment
  facilityReservations: FacilityReservation[];
  reservations: FacilityReservation[]; // alias
  equipmentReservations: EquipmentReservation[];
  requestFacilityReservation: (data: Omit<FacilityReservation, 'id' | 'createdAt' | 'status'>) => FacilityReservation;
  addReservation: (item: FacilityReservation) => void;
  updateFacilityReservationStatus: (id: string, status: FacilityReservation['status'], remarks?: string, fee?: number) => void;
  deleteFacilityReservation: (id: string) => void;
  requestEquipmentReservation: (data: Omit<EquipmentReservation, 'id' | 'createdAt' | 'status'>) => EquipmentReservation;
  addEquipmentReservation: (item: EquipmentReservation) => void;
  updateEquipmentReservationStatus: (id: string, status: EquipmentReservation['status'], condition?: string, deposit?: number) => void;
  deleteEquipmentReservation: (id: string) => void;

  // 2. Health Center & Pharmacy
  healthAppointments: HealthAppointment[];
  consultations: HealthAppointment[]; // alias
  childImmunizations: ChildImmunizationTracker[];
  immunizations: ChildImmunizationTracker[]; // alias
  medicineRefillRequests: MedicineRefillRequest[];
  medicineRequests: MedicineRefillRequest[]; // alias
  pharmacyInventory: PharmacyInventoryItem[];
  healthMissions: HealthOutreachMission[];
  bookHealthAppointment: (data: Omit<HealthAppointment, 'id' | 'createdAt' | 'status'>) => HealthAppointment;
  addConsultation: (item: HealthAppointment) => void;
  updateHealthAppointmentStatus: (id: string, status: HealthAppointment['status'], notes?: string, attendingWorker?: string) => void;
  recordTriageVitals: (apptId: string, vitals: VitalSigns, diagnosis?: string, prescriptions?: string, queueNumber?: string) => void;
  cancelHealthAppointment: (id: string) => void;
  requestMedicineRefill: (data: Omit<MedicineRefillRequest, 'id' | 'requestedAt' | 'status'>) => MedicineRefillRequest;
  addMedicineRequest: (item: MedicineRefillRequest) => void;
  updateMedicineRefillStatus: (id: string, status: MedicineRefillRequest['status'], pharmacistNotes?: string, dispensedBy?: string, batchDispensed?: string) => void;
  addPharmacyItem: (data: Omit<PharmacyInventoryItem, 'id' | 'updatedAt'>) => PharmacyInventoryItem;
  updatePharmacyItem: (id: string, updates: Partial<PharmacyInventoryItem>) => void;
  restockPharmacyItem: (id: string, additionalQuantity: number, batchNumber?: string, expiryDate?: string) => void;
  deletePharmacyItem: (id: string) => void;
  addHealthMission: (data: Omit<HealthOutreachMission, 'id'>) => HealthOutreachMission;
  updateHealthMission: (id: string, updates: Partial<HealthOutreachMission>) => void;
  deleteHealthMission: (id: string) => void;
  registerForHealthMission: (missionId: string, residentId: string, residentName: string) => void;
  cancelHealthMissionReservation: (missionId: string, residentId: string, residentName: string) => void;
  updateChildImmunization: (id: string, status: ChildImmunizationTracker['status'], dateAdministered?: string, administeredBy?: string, batchOrLotNumber?: string, injectionSite?: ChildImmunizationTracker['injectionSite'], adverseEffectsOrRemarks?: string) => void;
  addChildImmunization: (data: Omit<ChildImmunizationTracker, 'id'>) => void;
  addImmunization: (item: ChildImmunizationTracker) => void;

  // 3. Trabaho & PESO Livelihood
  jobPostings: CommunityJobPosting[];
  jobs: CommunityJobPosting[]; // alias
  jobApplications: JobApplicationRecord[];
  livelihoodTrainings: LivelihoodTrainingWorkshop[];
  livelihoodEnrollments: LivelihoodEnrollmentRecord[];
  livelihoodAssistanceRequests: LivelihoodAssistanceRequest[];
  addJobPosting: (data: Omit<CommunityJobPosting, 'id' | 'postedDate'>) => CommunityJobPosting;
  updateJobPosting: (id: string, updates: Partial<CommunityJobPosting>) => void;
  deleteJobPosting: (id: string) => void;
  submitJobApplication: (data: Omit<JobApplicationRecord, 'id' | 'appliedDate' | 'status'>) => JobApplicationRecord;
  updateJobApplicationStatus: (id: string, status: JobApplicationRecord['status']) => void;
  addLivelihoodTraining: (data: Omit<LivelihoodTrainingWorkshop, 'id'>) => LivelihoodTrainingWorkshop;
  updateLivelihoodTraining: (id: string, updates: Partial<LivelihoodTrainingWorkshop>) => void;
  deleteLivelihoodTraining: (id: string) => void;
  enrollInLivelihoodTraining: (data: Omit<LivelihoodEnrollmentRecord, 'id' | 'enrolledDate' | 'status'>) => LivelihoodEnrollmentRecord;
  updateLivelihoodEnrollmentStatus: (id: string, status: LivelihoodEnrollmentRecord['status']) => void;
  requestLivelihoodAssistance: (data: Omit<LivelihoodAssistanceRequest, 'id' | 'dateRequested' | 'status'>) => LivelihoodAssistanceRequest;
  updateLivelihoodAssistanceStatus: (id: string, status: LivelihoodAssistanceRequest['status'], reviewerNotes?: string, approvedAmount?: number, resolutionReferenceNo?: string) => void;
  deleteLivelihoodAssistance: (id: string) => void;
  pendingLivelihoodAssistanceCount: number;

  // 4. Ayuda, Relief & Financial Aid (AICS)
  ayudaClaims: AyudaClaimStub[];
  ayudaWaves: Array<{ id: string; title: string; category: string; totalTargetBeneficiaries: number; status: string }>; // alias for overview metrics
  financialAssistanceRequests: FinancialAssistanceRequest[];
  createAyudaDistribution: (data: {
    title: string;
    category: AyudaClaimStub['category'];
    targetPurok: string;
    claimLocation: string;
    distributionDate: string;
    timeSlot: string;
    itemsIncluded: string[];
    beneficiaryResidentIds: string[];
  }) => void;
  updateAyudaClaimStatus: (id: string, status: AyudaClaimStub['status'], releasedBy?: string) => void;
  requestFinancialAssistance: (data: Omit<FinancialAssistanceRequest, 'id' | 'createdAt' | 'status'>) => FinancialAssistanceRequest;
  updateFinancialAssistanceStatus: (id: string, status: FinancialAssistanceRequest['status'], disbursedAmount?: number) => void;

  // 5. Solid Waste & Clean-Up
  wasteSchedules: WasteCollectionSchedule[];
  bulkWasteRequests: BulkWastePickupRequest[];
  wasteRequests: BulkWastePickupRequest[]; // alias
  cleanUpDrives: BayanihanCleanUpDrive[];
  cleanUpVolunteers: BayanihanVolunteerRecord[];
  illegalDumpingReports: IllegalDumpingReport[];
  mrfDropRecords: MRFRecyclablesDropRecord[];
  addWasteSchedule: (data: Omit<WasteCollectionSchedule, 'id'>) => WasteCollectionSchedule;
  updateWasteSchedule: (id: string, updates: Partial<WasteCollectionSchedule>) => void;
  deleteWasteSchedule: (id: string) => void;
  requestBulkWastePickup: (data: Omit<BulkWastePickupRequest, 'id' | 'createdAt' | 'status'>) => BulkWastePickupRequest;
  updateBulkWastePickupStatus: (id: string, status: BulkWastePickupRequest['status'], assignedCrew?: string, pickupTimeWindow?: string, adminRemarks?: string) => void;
  deleteBulkWastePickup: (id: string) => void;
  createCleanUpDrive: (data: Omit<BayanihanCleanUpDrive, 'id' | 'currentVolunteers'>) => BayanihanCleanUpDrive;
  updateCleanUpDrive: (id: string, updates: Partial<BayanihanCleanUpDrive>) => void;
  deleteCleanUpDrive: (id: string) => void;
  volunteerForCleanUpDrive: (data: Omit<BayanihanVolunteerRecord, 'id' | 'registeredDate' | 'attendanceVerified'>) => BayanihanVolunteerRecord;
  verifyVolunteerAttendance: (id: string, hoursRendered?: number, verifiedBy?: string) => void;
  cancelVolunteerRegistration: (id: string) => void;
  reportIllegalDumping: (data: Omit<IllegalDumpingReport, 'id' | 'reportedAt' | 'status'>) => IllegalDumpingReport;
  updateIllegalDumpingStatus: (id: string, status: IllegalDumpingReport['status'], assignedTanodOrCrew?: string, resolutionRemarks?: string) => void;
  deleteIllegalDumpingReport: (id: string) => void;
  recordMRFDrop: (data: Omit<MRFRecyclablesDropRecord, 'id' | 'loggedDate'>) => MRFRecyclablesDropRecord;
  deleteMRFDropRecord: (id: string) => void;

  // 6. SK Youth & Senior/PWD Affairs
  skTournaments: SKTournamentActivity[];
  programs: SKTournamentActivity[]; // alias
  skRegistrations: SKRegistrationRecord[];
  seniorBenefitSchedules: SeniorCitizenBenefitSchedule[];
  assistiveDeviceRequests: AssistiveDeviceRequest[];
  createSKTournament: (data: Omit<SKTournamentActivity, 'id'>) => SKTournamentActivity;
  updateSKTournament: (id: string, updates: Partial<SKTournamentActivity>) => void;
  deleteSKTournament: (id: string) => void;
  registerForSKTournament: (data: Omit<SKRegistrationRecord, 'id' | 'registeredDate' | 'status'>) => SKRegistrationRecord;
  updateSKRegistrationStatus: (id: string, status: SKRegistrationRecord['status']) => void;
  deleteSKRegistration: (id: string) => void;
  createSeniorBenefitSchedule: (data: Omit<SeniorCitizenBenefitSchedule, 'id'>) => SeniorCitizenBenefitSchedule;
  updateSeniorBenefitSchedule: (id: string, updates: Partial<SeniorCitizenBenefitSchedule>) => void;
  deleteSeniorBenefitSchedule: (id: string) => void;
  requestAssistiveDevice: (data: Omit<AssistiveDeviceRequest, 'id' | 'createdAt' | 'status'>) => AssistiveDeviceRequest;
  updateAssistiveDeviceStatus: (id: string, status: AssistiveDeviceRequest['status']) => void;
  deleteAssistiveDevice?: (id: string) => void;

  // Counts / Badges
  pendingFacilitiesCount: number;
  pendingEquipmentCount: number;
  pendingHealthAppointmentsCount: number;
  pendingMedicineCount: number;
  pendingJobApplicationsCount: number;
  pendingFinancialAidCount: number;
  pendingBulkWasteCount: number;
  pendingIllegalDumpingCount: number;
  pendingAssistiveCount: number;
  totalPendingServicesCount: number;

  // Supabase Sync Status
  isCommunitySupabaseLive?: boolean;
  isCommunitySyncing?: boolean;
  refreshCommunityFromSupabase?: () => Promise<void>;
}

const CommunityServicesContext = createContext<CommunityServicesContextType | undefined>(undefined);

export const CommunityServicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, addAuditLog, residents, readNotifIds = [], dismissedNotifIds = [] } = useBarangay();

  // 1. Facilities & Equipment
  const [facilityReservations, setFacilityReservations] = useState<FacilityReservation[]>([]);
  const [equipmentReservations, setEquipmentReservations] = useState<EquipmentReservation[]>([]);

  // 2. Health & Pharmacy
  const [healthAppointments, setHealthAppointments] = useState<HealthAppointment[]>([]);
  const [childImmunizations, setChildImmunizations] = useState<ChildImmunizationTracker[]>([]);
  const [medicineRefillRequests, setMedicineRefillRequests] = useState<MedicineRefillRequest[]>([]);
  const [pharmacyInventory, setPharmacyInventory] = useState<PharmacyInventoryItem[]>([]);
  const [healthMissions, setHealthMissions] = useState<HealthOutreachMission[]>([]);

  // 3. Trabaho & PESO
  const [jobPostings, setJobPostings] = useState<CommunityJobPosting[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplicationRecord[]>([]);
  const [livelihoodTrainings, setLivelihoodTrainings] = useState<LivelihoodTrainingWorkshop[]>([]);
  const [livelihoodEnrollments, setLivelihoodEnrollments] = useState<LivelihoodEnrollmentRecord[]>([]);
  const [livelihoodAssistanceRequests, setLivelihoodAssistanceRequests] = useState<LivelihoodAssistanceRequest[]>([]);

  // 4. Ayuda & Relief
  const [ayudaClaims, setAyudaClaims] = useState<AyudaClaimStub[]>([]);
  const [financialAssistanceRequests, setFinancialAssistanceRequests] = useState<FinancialAssistanceRequest[]>([]);

  // 5. Solid Waste & Clean-Up
  const [wasteSchedules, setWasteSchedules] = useState<WasteCollectionSchedule[]>([]);
  const [bulkWasteRequests, setBulkWasteRequests] = useState<BulkWastePickupRequest[]>([]);
  const [cleanUpDrives, setCleanUpDrives] = useState<BayanihanCleanUpDrive[]>([]);
  const [cleanUpVolunteers, setCleanUpVolunteers] = useState<BayanihanVolunteerRecord[]>([]);
  const [illegalDumpingReports, setIllegalDumpingReports] = useState<IllegalDumpingReport[]>([]);
  const [mrfDropRecords, setMrfDropRecords] = useState<MRFRecyclablesDropRecord[]>([]);

  // 6. SK Youth & Senior/PWD
  const [skTournaments, setSkTournaments] = useState<SKTournamentActivity[]>([]);
  const [skRegistrations, setSkRegistrations] = useState<SKRegistrationRecord[]>([]);
  const [seniorBenefitSchedules, setSeniorBenefitSchedules] = useState<SeniorCitizenBenefitSchedule[]>([]);
  const [assistiveDeviceRequests, setAssistiveDeviceRequests] = useState<AssistiveDeviceRequest[]>([]);

  // Supabase Database Sync & Realtime Channel
  const [isCommunitySupabaseLive, setIsCommunitySupabaseLive] = useState<boolean>(isSupabaseConfigured);
  const [isCommunitySyncing, setIsCommunitySyncing] = useState<boolean>(false);
  const isCommunityLoaded = useRef(false);

  const refreshCommunityFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsCommunitySyncing(true);
    try {
      const db = await fetchFullCommunityDatabase();
      if (Array.isArray(db.facilityReservations)) setFacilityReservations(db.facilityReservations);
      if (Array.isArray(db.equipmentReservations)) setEquipmentReservations(db.equipmentReservations);
      if (Array.isArray(db.healthAppointments)) setHealthAppointments(db.healthAppointments);
      if (Array.isArray(db.childImmunizations)) setChildImmunizations(db.childImmunizations);
      if (Array.isArray(db.medicineRefills)) setMedicineRefillRequests(db.medicineRefills);
      if (Array.isArray(db.pharmacyInventory)) setPharmacyInventory(db.pharmacyInventory);
      if (Array.isArray(db.healthMissions)) setHealthMissions(db.healthMissions);
      if (Array.isArray(db.jobPostings)) setJobPostings(db.jobPostings);
      if (Array.isArray(db.jobApplications)) setJobApplications(db.jobApplications);
      if (Array.isArray(db.livelihoodTrainings)) setLivelihoodTrainings(db.livelihoodTrainings);
      if (Array.isArray(db.livelihoodEnrollments)) setLivelihoodEnrollments(db.livelihoodEnrollments);
      if (Array.isArray(db.livelihoodAssistance)) setLivelihoodAssistanceRequests(db.livelihoodAssistance);
      if (Array.isArray(db.ayudaClaims)) setAyudaClaims(db.ayudaClaims);
      if (Array.isArray(db.financialAssistance)) setFinancialAssistanceRequests(db.financialAssistance);
      if (Array.isArray(db.wasteSchedules)) setWasteSchedules(db.wasteSchedules);
      if (Array.isArray(db.bulkWastePickups)) setBulkWasteRequests(db.bulkWastePickups);
      if (Array.isArray(db.cleanUpDrives)) setCleanUpDrives(db.cleanUpDrives);
      if (Array.isArray(db.cleanUpVolunteers)) setCleanUpVolunteers(db.cleanUpVolunteers);
      if (Array.isArray(db.illegalDumpingReports)) setIllegalDumpingReports(db.illegalDumpingReports);
      if (Array.isArray(db.mrfDropRecords)) setMrfDropRecords(db.mrfDropRecords);
      if (Array.isArray(db.skTournaments)) setSkTournaments(db.skTournaments);
      if (Array.isArray(db.skRegistrations)) setSkRegistrations(db.skRegistrations);
      if (Array.isArray(db.seniorBenefitSchedules)) setSeniorBenefitSchedules(db.seniorBenefitSchedules);
      if (Array.isArray(db.assistiveDeviceRequests)) setAssistiveDeviceRequests(db.assistiveDeviceRequests);

      setIsCommunitySupabaseLive(true);
      purgeLegacyAppStorageData();
    } catch (err) {
      console.error('Failed to sync community services from Supabase:', err);
    } finally {
      setIsCommunitySyncing(false);
    }
  }, []);

  // Initial load from Supabase
  useEffect(() => {
    if (!isCommunityLoaded.current) {
      isCommunityLoaded.current = true;
      refreshCommunityFromSupabase();
    }
  }, [refreshCommunityFromSupabase]);

  // Realtime Supabase Channel
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel('bims-community-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        refreshCommunityFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshCommunityFromSupabase]);

  // ================= ACTIONS =================

  // 1. Facilities & Equipment Actions
  const requestFacilityReservation = (data: Omit<FacilityReservation, 'id' | 'createdAt' | 'status'>): FacilityReservation => {
    const id = `RES-FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newReservation: FacilityReservation = {
      ...data,
      id,
      status: 'Pending Review',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setFacilityReservations((prev) => [newReservation, ...prev]);
    upsertFacilityReservation(newReservation).catch((err) => console.error('Supabase requestFacilityReservation error:', err));
    addAuditLog('CREATE', 'Property & Custodian', `New facility reservation booked: ${data.facilityName} for "${data.eventTitle}" by ${data.residentName}`);
    return newReservation;
  };

  const updateFacilityReservationStatus = (id: string, status: FacilityReservation['status'], remarks?: string, fee?: number) => {
    setFacilityReservations((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, status, remarks: remarks !== undefined ? remarks : r.remarks, fee: fee !== undefined ? fee : r.fee };
          upsertFacilityReservation(updated).catch((err) => console.error('Supabase updateFacilityReservationStatus error:', err));
          return updated;
        }
        return r;
      })
    );
    addAuditLog('UPDATE', 'Property & Custodian', `Facility reservation #${id} status changed to ${status}`);
  };

  const deleteFacilityReservation = (id: string) => {
    setFacilityReservations((prev) => prev.filter((r) => r.id !== id));
    deleteFacilityReservationFromSupabase(id).catch((err) => console.error('Supabase deleteFacilityReservation error:', err));
    addAuditLog('DELETE', 'Property & Custodian', `Deleted facility reservation record #${id}`);
  };

  const requestEquipmentReservation = (data: Omit<EquipmentReservation, 'id' | 'createdAt' | 'status'>): EquipmentReservation => {
    const id = `RES-EQP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newReservation: EquipmentReservation = {
      ...data,
      id,
      status: 'Pending Review',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setEquipmentReservations((prev) => [newReservation, ...prev]);
    upsertEquipmentReservation(newReservation).catch((err) => console.error('Supabase requestEquipmentReservation error:', err));
    addAuditLog('CREATE', 'Property & Custodian', `New equipment borrowed: ${data.quantity}x ${data.equipmentName} by ${data.residentName}`);
    return newReservation;
  };

  const updateEquipmentReservationStatus = (id: string, status: EquipmentReservation['status'], condition?: string, deposit?: number) => {
    setEquipmentReservations((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const updated = {
          ...e,
          status,
          conditionOnRelease:
            status === 'Approved'
              ? (condition || e.conditionOnRelease || 'Approved for release by Property Custodian')
              : status === 'Released / In Use'
              ? (condition || e.conditionOnRelease || 'Inspected and released in complete working order')
              : e.conditionOnRelease,
          conditionOnReturn:
            status === 'Returned'
              ? (condition || e.conditionOnReturn || 'Returned in good and clean working condition')
              : e.conditionOnReturn,
          depositAmount: deposit !== undefined ? deposit : e.depositAmount,
        };
        upsertEquipmentReservation(updated).catch((err) => console.error('Supabase updateEquipmentReservationStatus error:', err));
        return updated;
      })
    );
    addAuditLog('UPDATE', 'Property & Custodian', `Equipment reservation #${id} status updated to ${status}`);
  };

  const deleteEquipmentReservation = (id: string) => {
    setEquipmentReservations((prev) => prev.filter((e) => e.id !== id));
    deleteEquipmentReservationFromSupabase(id).catch((err) => console.error('Supabase deleteEquipmentReservation error:', err));
    addAuditLog('DELETE', 'Property & Custodian', `Deleted equipment reservation #${id}`);
  };

  // 2. Health & Pharmacy Actions
  const bookHealthAppointment = (data: Omit<HealthAppointment, 'id' | 'createdAt' | 'status'>): HealthAppointment => {
    const id = `HLTH-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const queueNumber = `TRIAGE-${data.serviceType.charAt(0)}${Math.floor(10 + Math.random() * 90)}`;
    const newAppt: HealthAppointment = {
      ...data,
      id,
      queueNumber,
      status: 'Confirmed',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setHealthAppointments((prev) => [newAppt, ...prev]);
    upsertHealthAppointment(newAppt).catch((err) => console.error('Supabase bookHealthAppointment error:', err));
    addAuditLog('CREATE', 'Health Center', `Booked ${data.serviceType} for patient ${data.patientName} on ${data.preferredDate} (Queue: ${queueNumber})`);
    return newAppt;
  };

  const updateHealthAppointmentStatus = (id: string, status: HealthAppointment['status'], notes?: string, attendingWorker?: string) => {
    setHealthAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = {
            ...a,
            status,
            prescriptionsOrAdvice: notes !== undefined ? notes : a.prescriptionsOrAdvice,
            attendingHealthWorker: attendingWorker || a.attendingHealthWorker,
          };
          upsertHealthAppointment(updated).catch((err) => console.error('Supabase updateHealthAppointmentStatus error:', err));
          return updated;
        }
        return a;
      })
    );
    addAuditLog('UPDATE', 'Health Center', `Health appointment #${id} marked as ${status}`);
  };

  const recordTriageVitals = (
    apptId: string,
    vitals: VitalSigns,
    diagnosis?: string,
    prescriptions?: string,
    queueNumber?: string
  ) => {
    setHealthAppointments((prev) =>
      prev.map((a) => {
        if (a.id === apptId) {
          const updated = {
            ...a,
            status: 'Triage Recorded' as const,
            vitals: {
              ...vitals,
              recordedBy: vitals.recordedBy || currentUser.name,
              recordedAt: vitals.recordedAt || new Date().toLocaleString(),
            },
            diagnosis: diagnosis !== undefined ? diagnosis : a.diagnosis,
            prescriptionsOrAdvice: prescriptions !== undefined ? prescriptions : a.prescriptionsOrAdvice,
            queueNumber: queueNumber || a.queueNumber,
          };
          upsertHealthAppointment(updated).catch((err) => console.error('Supabase recordTriageVitals error:', err));
          return updated;
        }
        return a;
      })
    );
    addAuditLog('UPDATE', 'Health Center Triage', `Vitals recorded for appointment #${apptId} (BP: ${vitals.bp || 'N/A'}, Temp: ${vitals.temperature || 'N/A'}°C)`);
  };

  const cancelHealthAppointment = (id: string) => {
    updateHealthAppointmentStatus(id, 'Cancelled');
  };

  const requestMedicineRefill = (data: Omit<MedicineRefillRequest, 'id' | 'requestedAt' | 'status'>): MedicineRefillRequest => {
    const id = `MED-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newReq: MedicineRefillRequest = {
      ...data,
      id,
      status: 'Pending Dispensing',
      requestedAt: new Date().toISOString().split('T')[0],
    };
    setMedicineRefillRequests((prev) => [newReq, ...prev]);
    upsertMedicineRefill(newReq).catch((err) => console.error('Supabase requestMedicineRefill error:', err));
    addAuditLog('CREATE', 'Health Center Pharmacy', `Medicine refill requested: ${data.quantityRequested}x ${data.medicineName} by ${data.residentName}`);
    return newReq;
  };

  const updateMedicineRefillStatus = (
    id: string,
    status: MedicineRefillRequest['status'],
    pharmacistNotes?: string,
    dispensedBy?: string,
    batchDispensed?: string
  ) => {
    const targetReq = medicineRefillRequests.find((m) => m.id === id);

    // If transitioning to Dispensed and matching inventory exists, auto-deduct stock
    if (status === 'Dispensed' && targetReq && targetReq.status !== 'Dispensed') {
      const matchInv = pharmacyInventory.find(
        (inv) =>
          inv.id === targetReq.inventoryItemId ||
          inv.genericName.toLowerCase().includes(targetReq.medicineName.toLowerCase()) ||
          targetReq.medicineName.toLowerCase().includes(inv.genericName.toLowerCase())
      );
      if (matchInv) {
        setPharmacyInventory((prev) =>
          prev.map((inv) => {
            if (inv.id === matchInv.id) {
              const newQty = Math.max(0, inv.stockQuantity - targetReq.quantityRequested);
              const invStatus =
                newQty === 0
                  ? 'Out of Stock'
                  : newQty <= inv.reorderLevel / 2
                  ? 'Critical Stock'
                  : newQty <= inv.reorderLevel
                  ? 'Low Stock'
                  : 'In Stock';
              const updatedInv = {
                ...inv,
                stockQuantity: newQty,
                status: invStatus,
                updatedAt: new Date().toISOString().split('T')[0],
              };
              upsertPharmacyItem(updatedInv).catch((err) => console.error('Supabase auto-deduct inventory error:', err));
              return updatedInv;
            }
            return inv;
          })
        );
      }
    }

    setMedicineRefillRequests((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const updated = {
            ...m,
            status,
            pharmacistNotes: pharmacistNotes !== undefined ? pharmacistNotes : m.pharmacistNotes,
            dispensedBy: status === 'Dispensed' ? (dispensedBy || currentUser.name) : m.dispensedBy,
            dispensedAt: status === 'Dispensed' ? new Date().toLocaleString() : m.dispensedAt,
            batchDispensed: batchDispensed || m.batchDispensed,
          };
          upsertMedicineRefill(updated).catch((err) => console.error('Supabase updateMedicineRefillStatus error:', err));
          return updated;
        }
        return m;
      })
    );
    addAuditLog('UPDATE', 'Health Center Pharmacy', `Medicine request #${id} updated to ${status}`);
  };

  const addPharmacyItem = (data: Omit<PharmacyInventoryItem, 'id' | 'updatedAt'>): PharmacyInventoryItem => {
    const id = `PHARM-MED-${Date.now().toString().slice(-4)}`;
    const newItem: PharmacyInventoryItem = {
      ...data,
      id,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setPharmacyInventory((prev) => [newItem, ...prev]);
    upsertPharmacyItem(newItem).catch((err) => console.error('Supabase addPharmacyItem error:', err));
    addAuditLog('CREATE', 'Health Center Pharmacy', `Added medicine ${newItem.genericName} (${newItem.brandOrDosage}) with stock ${newItem.stockQuantity}`);
    return newItem;
  };

  const updatePharmacyItem = (id: string, updates: Partial<PharmacyInventoryItem>) => {
    setPharmacyInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = {
            ...item,
            ...updates,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          upsertPharmacyItem(updated).catch((err) => console.error('Supabase updatePharmacyItem error:', err));
          return updated;
        }
        return item;
      })
    );
    addAuditLog('UPDATE', 'Health Center Pharmacy', `Updated pharmacy inventory item #${id}`);
  };

  const restockPharmacyItem = (id: string, additionalQuantity: number, batchNumber?: string, expiryDate?: string) => {
    setPharmacyInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.stockQuantity + additionalQuantity;
          const status =
            newQty === 0
              ? 'Out of Stock'
              : newQty <= item.reorderLevel / 2
              ? 'Critical Stock'
              : newQty <= item.reorderLevel
              ? 'Low Stock'
              : 'In Stock';
          const updated = {
            ...item,
            stockQuantity: newQty,
            batchNumber: batchNumber || item.batchNumber,
            expiryDate: expiryDate || item.expiryDate,
            status,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          upsertPharmacyItem(updated).catch((err) => console.error('Supabase restockPharmacyItem error:', err));
          return updated;
        }
        return item;
      })
    );
    addAuditLog('UPDATE', 'Health Center Pharmacy', `Restocked +${additionalQuantity} units for pharmacy item #${id}`);
  };

  const deletePharmacyItem = (id: string) => {
    setPharmacyInventory((prev) => prev.filter((item) => item.id !== id));
    deletePharmacyItemFromSupabase(id).catch((err) => console.error('Supabase deletePharmacyItem error:', err));
    addAuditLog('DELETE', 'Health Center Pharmacy', `Removed item #${id} from pharmacy inventory`);
  };

  const addHealthMission = (data: Omit<HealthOutreachMission, 'id'>): HealthOutreachMission => {
    const id = `MSN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newMission: HealthOutreachMission = {
      ...data,
      id,
    };
    setHealthMissions((prev) => [newMission, ...prev]);
    upsertHealthMission(newMission).catch((err) => console.error('Supabase addHealthMission error:', err));
    addAuditLog('CREATE', 'Health Center Outreach', `Scheduled health outreach mission "${data.title}" on ${data.date}`);
    return newMission;
  };

  const updateHealthMission = (id: string, updates: Partial<HealthOutreachMission>) => {
    setHealthMissions((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const updated = { ...m, ...updates };
          upsertHealthMission(updated).catch((err) => console.error('Supabase updateHealthMission error:', err));
          return updated;
        }
        return m;
      })
    );
    addAuditLog('UPDATE', 'Health Center Outreach', `Updated health mission #${id}`);
  };

  const deleteHealthMission = (id: string) => {
    setHealthMissions((prev) => prev.filter((m) => m.id !== id));
    deleteHealthMissionFromSupabase(id).catch((err) => console.error('Supabase deleteHealthMission error:', err));
    addAuditLog('DELETE', 'Health Center Outreach', `Deleted health mission #${id}`);
  };

  const registerForHealthMission = (missionId: string, residentId: string, residentName: string) => {
    setHealthMissions((prev) =>
      prev.map((m) => {
        if (m.id === missionId) {
          const currentList = Array.isArray(m.registeredBeneficiaryIds) ? m.registeredBeneficiaryIds : [];
          if (currentList.includes(residentId)) {
            return m;
          }
          const updatedList = [...currentList, residentId];
          const newCount = Math.max(updatedList.length, (m.registeredCount || 0) + 1);
          const updated = {
            ...m,
            registeredBeneficiaryIds: updatedList,
            registeredCount: newCount,
          };
          upsertHealthMission(updated).catch((err) => console.error('Supabase registerForHealthMission error:', err));
          return updated;
        }
        return m;
      })
    );
    addAuditLog('CREATE', 'Health Center Outreach', `Resident ${residentName} registered for Health Mission #${missionId}`);
  };

  const cancelHealthMissionReservation = (missionId: string, residentId: string, residentName: string) => {
    setHealthMissions((prev) =>
      prev.map((m) => {
        if (m.id === missionId) {
          const currentList = Array.isArray(m.registeredBeneficiaryIds) ? m.registeredBeneficiaryIds : [];
          const updatedList = currentList.filter((id) => id !== residentId);
          const newCount = Math.max(0, (m.registeredCount || 1) - 1);
          const updated = {
            ...m,
            registeredBeneficiaryIds: updatedList,
            registeredCount: newCount,
          };
          upsertHealthMission(updated).catch((err) => console.error('Supabase cancelHealthMissionReservation error:', err));
          return updated;
        }
        return m;
      })
    );
    addAuditLog('UPDATE', 'Health Center Outreach', `Resident ${residentName} cancelled reservation for Health Mission #${missionId}`);
  };

  const updateChildImmunization = (
    id: string,
    status: ChildImmunizationTracker['status'],
    dateAdministered?: string,
    administeredBy?: string,
    batchOrLotNumber?: string,
    injectionSite?: ChildImmunizationTracker['injectionSite'],
    adverseEffectsOrRemarks?: string
  ) => {
    setChildImmunizations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = {
            ...c,
            status,
            administeredDate: dateAdministered || c.administeredDate || new Date().toISOString().split('T')[0],
            administeredBy: administeredBy || c.administeredBy || currentUser.name,
            batchOrLotNumber: batchOrLotNumber !== undefined ? batchOrLotNumber : c.batchOrLotNumber,
            injectionSite: injectionSite !== undefined ? injectionSite : c.injectionSite,
            adverseEffectsOrRemarks: adverseEffectsOrRemarks !== undefined ? adverseEffectsOrRemarks : c.adverseEffectsOrRemarks,
          };
          upsertChildImmunization(updated).catch((err) => console.error('Supabase updateChildImmunization error:', err));
          return updated;
        }
        return c;
      })
    );
    addAuditLog('UPDATE', 'Health Center', `Immunization record #${id} updated to ${status}`);
  };

  const addChildImmunization = (data: Omit<ChildImmunizationTracker, 'id'>) => {
    const id = `IMM-${Date.now().toString().slice(-6)}`;
    const newRec: ChildImmunizationTracker = { ...data, id };
    setChildImmunizations((prev) => [newRec, ...prev]);
    upsertChildImmunization(newRec).catch((err) => console.error('Supabase addChildImmunization error:', err));
    addAuditLog('CREATE', 'Health Center', `Added immunization record for child ${data.childName} (${data.vaccineName})`);
  };

  // 3. Trabaho & PESO Actions (ADMIN POSTS, RESIDENT APPLIES)
  const addJobPosting = (data: Omit<CommunityJobPosting, 'id' | 'postedDate'>): CommunityJobPosting => {
    const id = `JOB-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newJob: CommunityJobPosting = {
      ...data,
      id,
      postedDate: new Date().toISOString().split('T')[0],
      isActive: true,
    };
    setJobPostings((prev) => [newJob, ...prev]);
    upsertJobPosting(newJob).catch((err) => console.error('Supabase addJobPosting error:', err));
    addAuditLog('CREATE', 'PESO Trabaho Desk', `Admin published verified job opening: "${data.title}" at ${data.employerName}`);
    return newJob;
  };

  const updateJobPosting = (id: string, updates: Partial<CommunityJobPosting>) => {
    setJobPostings((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          const updated = { ...j, ...updates };
          upsertJobPosting(updated).catch((err) => console.error('Supabase updateJobPosting error:', err));
          return updated;
        }
        return j;
      })
    );
    addAuditLog('UPDATE', 'PESO Trabaho Desk', `Updated job posting #${id}`);
  };

  const deleteJobPosting = (id: string) => {
    setJobPostings((prev) => prev.filter((j) => j.id !== id));
    deleteJobPostingFromSupabase(id).catch((err) => console.error('Supabase deleteJobPosting error:', err));
    addAuditLog('DELETE', 'PESO Trabaho Desk', `Removed job posting #${id}`);
  };

  const submitJobApplication = (data: Omit<JobApplicationRecord, 'id' | 'appliedDate' | 'status'>): JobApplicationRecord => {
    const id = `APP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newApp: JobApplicationRecord = {
      ...data,
      id,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Submitted',
    };
    setJobApplications((prev) => [newApp, ...prev]);
    upsertJobApplication(newApp).catch((err) => console.error('Supabase submitJobApplication error:', err));
    addAuditLog('CREATE', 'PESO Trabaho Desk', `Resident ${data.residentName} applied for job "${data.jobTitle}"`);
    return newApp;
  };

  const updateJobApplicationStatus = (id: string, status: JobApplicationRecord['status']) => {
    setJobApplications((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, status };
          upsertJobApplication(updated).catch((err) => console.error('Supabase updateJobApplicationStatus error:', err));
          return updated;
        }
        return a;
      })
    );
    addAuditLog('UPDATE', 'PESO Trabaho Desk', `Job application #${id} status updated to ${status}`);
  };

  const addLivelihoodTraining = (data: Omit<LivelihoodTrainingWorkshop, 'id'>): LivelihoodTrainingWorkshop => {
    const id = `TRN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newTraining: LivelihoodTrainingWorkshop = { ...data, id };
    setLivelihoodTrainings((prev) => [newTraining, ...prev]);
    upsertLivelihoodTraining(newTraining).catch((err) => console.error('Supabase addLivelihoodTraining error:', err));
    addAuditLog('CREATE', 'Livelihood & Skills Desk', `Admin opened new livelihood training: "${data.title}"`);
    return newTraining;
  };

  const updateLivelihoodTraining = (id: string, updates: Partial<LivelihoodTrainingWorkshop>) => {
    setLivelihoodTrainings((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          upsertLivelihoodTraining(updated).catch((err) => console.error('Supabase updateLivelihoodTraining error:', err));
          return updated;
        }
        return t;
      })
    );
    addAuditLog('UPDATE', 'Livelihood & Skills Desk', `Updated training workshop #${id}`);
  };

  const deleteLivelihoodTraining = (id: string) => {
    setLivelihoodTrainings((prev) => prev.filter((t) => t.id !== id));
    deleteLivelihoodTrainingFromSupabase(id).catch((err) => console.error('Supabase deleteLivelihoodTraining error:', err));
    addAuditLog('DELETE', 'Livelihood & Skills Desk', `Deleted training workshop #${id}`);
  };

  const enrollInLivelihoodTraining = (data: Omit<LivelihoodEnrollmentRecord, 'id' | 'enrolledDate' | 'status'>): LivelihoodEnrollmentRecord => {
    const id = `ENR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newEnrollment: LivelihoodEnrollmentRecord = {
      ...data,
      id,
      enrolledDate: new Date().toISOString().split('T')[0],
      status: 'Confirmed',
    };
    setLivelihoodEnrollments((prev) => [newEnrollment, ...prev]);
    upsertLivelihoodEnrollment(newEnrollment).catch((err) => console.error('Supabase enrollInLivelihoodTraining error:', err));
    setLivelihoodTrainings((prev) =>
      prev.map((t) => {
        if (t.id === data.trainingId) {
          const updatedTraining = { ...t, slotsAvailable: Math.max(0, t.slotsAvailable - 1) };
          upsertLivelihoodTraining(updatedTraining).catch((err) => console.error('Supabase updateTrainingSlots error:', err));
          return updatedTraining;
        }
        return t;
      })
    );
    addAuditLog('CREATE', 'Livelihood & Skills Desk', `Resident ${data.residentName} enrolled in "${data.trainingTitle}"`);
    return newEnrollment;
  };

  const updateLivelihoodEnrollmentStatus = (id: string, status: LivelihoodEnrollmentRecord['status']) => {
    setLivelihoodEnrollments((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, status };
          upsertLivelihoodEnrollment(updated).catch((err) => console.error('Supabase updateLivelihoodEnrollmentStatus error:', err));
          return updated;
        }
        return e;
      })
    );
    addAuditLog('UPDATE', 'Livelihood & Skills Desk', `Training enrollment #${id} status changed to ${status}`);
  };

  const requestLivelihoodAssistance = (data: Omit<LivelihoodAssistanceRequest, 'id' | 'dateRequested' | 'status'>): LivelihoodAssistanceRequest => {
    const id = `LIV-AST-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newReq: LivelihoodAssistanceRequest = {
      ...data,
      id,
      dateRequested: new Date().toISOString().split('T')[0],
      status: 'Pending Review',
    };
    setLivelihoodAssistanceRequests((prev) => [newReq, ...prev]);
    upsertLivelihoodAssistance(newReq).catch((err) => console.error('Supabase requestLivelihoodAssistance error:', err));
    addAuditLog('CREATE', 'Livelihood & Skills Desk', `Resident ${data.residentName} filed livelihood assistance request for "${data.proposedBusiness}"`);
    return newReq;
  };

  const updateLivelihoodAssistanceStatus = (
    id: string,
    status: LivelihoodAssistanceRequest['status'],
    reviewerNotes?: string,
    approvedAmount?: number,
    resolutionReferenceNo?: string
  ) => {
    setLivelihoodAssistanceRequests((prev) =>
      prev.map((req) => {
        if (req.id === id) {
          const updated = {
            ...req,
            status,
            reviewerNotes: reviewerNotes !== undefined ? reviewerNotes : req.reviewerNotes,
            approvedAmount: approvedAmount !== undefined ? approvedAmount : req.approvedAmount,
            resolutionReferenceNo: resolutionReferenceNo !== undefined ? resolutionReferenceNo : req.resolutionReferenceNo,
            dateDisbursed: status === 'Disbursed / Released' ? new Date().toISOString().split('T')[0] : req.dateDisbursed,
          };
          upsertLivelihoodAssistance(updated).catch((err) => console.error('Supabase updateLivelihoodAssistanceStatus error:', err));
          return updated;
        }
        return req;
      })
    );
    addAuditLog('UPDATE', 'Livelihood & Skills Desk', `Livelihood assistance request #${id} status changed to ${status}`);
  };

  const deleteLivelihoodAssistance = (id: string) => {
    setLivelihoodAssistanceRequests((prev) => prev.filter((r) => r.id !== id));
    deleteLivelihoodAssistanceFromSupabase(id).catch((err) => console.error('Supabase deleteLivelihoodAssistance error:', err));
    addAuditLog('DELETE', 'Livelihood & Skills Desk', `Deleted livelihood assistance request #${id}`);
  };

  // 4. Ayuda, Relief & Financial Aid (AICS) Actions
  const createAyudaDistribution = (data: {
    title: string;
    category: AyudaClaimStub['category'];
    targetPurok: string;
    claimLocation: string;
    distributionDate: string;
    timeSlot: string;
    itemsIncluded: string[];
    beneficiaryResidentIds: string[];
  }) => {
    const newStubs: AyudaClaimStub[] = data.beneficiaryResidentIds.map((resId, idx) => {
      const res = residents.find((r) => r.id === resId);
      const resName = res ? `${res.firstName} ${res.lastName}` : `Resident ${resId}`;
      const purok = res?.purok || data.targetPurok;
      const id = `AYUDA-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${idx}`;
      return {
        id,
        title: data.title,
        category: data.category,
        residentId: resId,
        residentName: resName,
        purok,
        householdNo: res?.householdId || (res as any)?.householdNo || '',
        claimLocation: data.claimLocation,
        distributionDate: data.distributionDate,
        timeSlot: data.timeSlot,
        qrPayload: `AYUDA-PASS|${id}|${resId}|${resName}|${purok}|${data.distributionDate}`,
        itemsIncluded: data.itemsIncluded,
        status: 'Available to Claim',
      };
    });

    setAyudaClaims((prev) => [...newStubs, ...prev]);
    newStubs.forEach((stub) => {
      upsertAyudaClaim(stub).catch((err) => console.error('Supabase createAyudaDistribution stub error:', err));
    });
    addAuditLog(
      'CREATE',
      'Social Welfare & Ayuda',
      `Admin initiated Ayuda Relief Distribution "${data.title}" generating ${newStubs.length} digital claim stubs.`
    );
  };

  const updateAyudaClaimStatus = (id: string, status: AyudaClaimStub['status'], releasedBy?: string) => {
    setAyudaClaims((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = {
            ...a,
            status,
            claimedAt: status === 'Claimed / Released' ? new Date().toISOString() : a.claimedAt,
            releasedBy: status === 'Claimed / Released' ? (releasedBy || currentUser.name) : a.releasedBy,
          };
          upsertAyudaClaim(updated).catch((err) => console.error('Supabase updateAyudaClaimStatus error:', err));
          return updated;
        }
        return a;
      })
    );
    addAuditLog('UPDATE', 'Social Welfare & Ayuda', `Ayuda claim stub #${id} marked as ${status}`);
  };

  const requestFinancialAssistance = (data: Omit<FinancialAssistanceRequest, 'id' | 'createdAt' | 'status'>): FinancialAssistanceRequest => {
    const id = `AICS-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newReq: FinancialAssistanceRequest = {
      ...data,
      id,
      status: 'Application Submitted',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setFinancialAssistanceRequests((prev) => [newReq, ...prev]);
    upsertFinancialAssistance(newReq).catch((err) => console.error('Supabase requestFinancialAssistance error:', err));
    addAuditLog('CREATE', 'AICS Financial Aid', `Resident ${data.residentName} applied for ${data.assistanceType} (₱${data.amountRequested.toLocaleString()})`);
    return newReq;
  };

  const updateFinancialAssistanceStatus = (id: string, status: FinancialAssistanceRequest['status'], disbursedAmount?: number) => {
    setFinancialAssistanceRequests((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const updated = {
            ...f,
            status,
            disbursedAmount: disbursedAmount !== undefined ? disbursedAmount : f.disbursedAmount,
            disbursedDate: status === 'Disbursed' ? new Date().toISOString().split('T')[0] : f.disbursedDate,
          };
          upsertFinancialAssistance(updated).catch((err) => console.error('Supabase updateFinancialAssistanceStatus error:', err));
          return updated;
        }
        return f;
      })
    );
    addAuditLog('UPDATE', 'AICS Financial Aid', `AICS Assistance request #${id} updated to ${status}`);
  };

  // 5. Solid Waste & Bayanihan Actions
  const addWasteSchedule = (data: Omit<WasteCollectionSchedule, 'id'>): WasteCollectionSchedule => {
    const id = `WST-${Date.now().toString().slice(-4)}`;
    const newSch: WasteCollectionSchedule = { ...data, id };
    setWasteSchedules((prev) => [newSch, ...prev]);
    upsertWasteSchedule(newSch).catch((err) => console.error('Supabase addWasteSchedule error:', err));
    addAuditLog('CREATE', 'Solid Waste Desk', `Added waste collection route for ${data.purokName} (${data.wasteType})`);
    return newSch;
  };

  const updateWasteSchedule = (id: string, updates: Partial<WasteCollectionSchedule>) => {
    setWasteSchedules((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const updated = { ...w, ...updates };
          upsertWasteSchedule(updated).catch((err) => console.error('Supabase updateWasteSchedule error:', err));
          return updated;
        }
        return w;
      })
    );
    addAuditLog('UPDATE', 'Solid Waste Desk', `Updated waste collection schedule for #${id}`);
  };

  const deleteWasteSchedule = (id: string) => {
    setWasteSchedules((prev) => prev.filter((w) => w.id !== id));
    deleteWasteScheduleFromSupabase(id).catch((err) => console.error('Supabase deleteWasteSchedule error:', err));
    addAuditLog('DELETE', 'Solid Waste Desk', `Deleted waste schedule #${id}`);
  };

  const requestBulkWastePickup = (data: Omit<BulkWastePickupRequest, 'id' | 'createdAt' | 'status'>): BulkWastePickupRequest => {
    const id = `BULK-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newReq: BulkWastePickupRequest = {
      ...data,
      id,
      status: 'Pending Schedule',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBulkWasteRequests((prev) => [newReq, ...prev]);
    upsertBulkWastePickup(newReq).catch((err) => console.error('Supabase requestBulkWastePickup error:', err));
    addAuditLog('CREATE', 'Solid Waste Desk', `Special bulk waste pickup requested by ${data.residentName} (${data.wasteCategory})`);
    return newReq;
  };

  const updateBulkWastePickupStatus = (
    id: string,
    status: BulkWastePickupRequest['status'],
    assignedCrew?: string,
    pickupTimeWindow?: string,
    adminRemarks?: string
  ) => {
    setBulkWasteRequests((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updated = {
            ...b,
            status,
            assignedCrew: assignedCrew !== undefined ? assignedCrew : b.assignedCrew,
            pickupTimeWindow: pickupTimeWindow !== undefined ? pickupTimeWindow : b.pickupTimeWindow,
            adminRemarks: adminRemarks !== undefined ? adminRemarks : b.adminRemarks,
            collectedAt: status === 'Collected' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : b.collectedAt,
          };
          upsertBulkWastePickup(updated).catch((err) => console.error('Supabase updateBulkWastePickupStatus error:', err));
          return updated;
        }
        return b;
      })
    );
    addAuditLog('UPDATE', 'Solid Waste Desk', `Bulk waste pickup #${id} marked as ${status}`);
  };

  const deleteBulkWastePickup = (id: string) => {
    setBulkWasteRequests((prev) => prev.filter((b) => b.id !== id));
    deleteBulkWastePickupFromSupabase(id).catch((err) => console.error('Supabase deleteBulkWastePickup error:', err));
    addAuditLog('DELETE', 'Solid Waste Desk', `Deleted bulk pickup request #${id}`);
  };

  const createCleanUpDrive = (data: Omit<BayanihanCleanUpDrive, 'id' | 'currentVolunteers'>): BayanihanCleanUpDrive => {
    const id = `BAYAN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newDrive: BayanihanCleanUpDrive = {
      ...data,
      id,
      currentVolunteers: 0,
    };
    setCleanUpDrives((prev) => [newDrive, ...prev]);
    upsertCleanUpDrive(newDrive).catch((err) => console.error('Supabase createCleanUpDrive error:', err));
    addAuditLog('CREATE', 'Environmental Desk', `Admin organized Bayanihan Clean-Up Drive: "${data.title}" for ${data.purokTarget}`);
    return newDrive;
  };

  const updateCleanUpDrive = (id: string, updates: Partial<BayanihanCleanUpDrive>) => {
    setCleanUpDrives((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const updated = { ...d, ...updates };
          upsertCleanUpDrive(updated).catch((err) => console.error('Supabase updateCleanUpDrive error:', err));
          return updated;
        }
        return d;
      })
    );
    addAuditLog('UPDATE', 'Environmental Desk', `Updated Clean-Up Drive #${id}`);
  };

  const deleteCleanUpDrive = (id: string) => {
    setCleanUpDrives((prev) => prev.filter((d) => d.id !== id));
    deleteCleanUpDriveFromSupabase(id).catch((err) => console.error('Supabase deleteCleanUpDrive error:', err));
    addAuditLog('DELETE', 'Environmental Desk', `Deleted Clean-Up Drive #${id}`);
  };

  const volunteerForCleanUpDrive = (data: Omit<BayanihanVolunteerRecord, 'id' | 'registeredDate' | 'attendanceVerified'>): BayanihanVolunteerRecord => {
    const id = `VOL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newVol: BayanihanVolunteerRecord = {
      ...data,
      id,
      registeredDate: new Date().toISOString().split('T')[0],
      attendanceVerified: false,
    };
    setCleanUpVolunteers((prev) => [newVol, ...prev]);
    upsertCleanUpVolunteer(newVol).catch((err) => console.error('Supabase volunteerForCleanUpDrive error:', err));
    setCleanUpDrives((prev) =>
      prev.map((d) => {
        if (d.id === data.driveId) {
          const updatedDrive = { ...d, currentVolunteers: d.currentVolunteers + 1 };
          upsertCleanUpDrive(updatedDrive).catch((err) => console.error('Supabase updateDriveVolunteers error:', err));
          return updatedDrive;
        }
        return d;
      })
    );
    addAuditLog('CREATE', 'Environmental Desk', `Resident ${data.residentName} signed up as volunteer for Clean-Up Drive "${data.driveTitle}"`);
    return newVol;
  };

  const verifyVolunteerAttendance = (id: string, hoursRendered: number = 4, verifiedBy?: string) => {
    const certCode = `CERT-BAYAN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const issuedDate = new Date().toISOString().split('T')[0];
    setCleanUpVolunteers((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const updated = {
            ...v,
            attendanceVerified: true,
            hoursRendered,
            verifiedBy: verifiedBy || currentUser.name,
            certificateCode: v.certificateCode || certCode,
            certificateIssuedAt: v.certificateIssuedAt || issuedDate,
          };
          upsertCleanUpVolunteer(updated).catch((err) => console.error('Supabase verifyVolunteerAttendance error:', err));
          return updated;
        }
        return v;
      })
    );
    addAuditLog('UPDATE', 'Environmental Desk', `Verified volunteer attendance for record #${id} (${hoursRendered} hours)`);
  };

  const cancelVolunteerRegistration = (id: string) => {
    const vol = cleanUpVolunteers.find((v) => v.id === id);
    if (vol) {
      setCleanUpDrives((prev) =>
        prev.map((d) => {
          if (d.id === vol.driveId) {
            const updatedDrive = { ...d, currentVolunteers: Math.max(0, d.currentVolunteers - 1) };
            upsertCleanUpDrive(updatedDrive).catch((err) => console.error('Supabase cancelVolunteersCount error:', err));
            return updatedDrive;
          }
          return d;
        })
      );
    }
    setCleanUpVolunteers((prev) => prev.filter((v) => v.id !== id));
    deleteCleanUpVolunteerFromSupabase(id).catch((err) => console.error('Supabase cancelVolunteerRegistration error:', err));
    addAuditLog('DELETE', 'Environmental Desk', `Cancelled volunteer registration #${id}`);
  };

  const reportIllegalDumping = (data: Omit<IllegalDumpingReport, 'id' | 'reportedAt' | 'status'>): IllegalDumpingReport => {
    const id = `HOTSPOT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newReport: IllegalDumpingReport = {
      ...data,
      id,
      status: 'Report Received',
      reportedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setIllegalDumpingReports((prev) => [newReport, ...prev]);
    upsertIllegalDumpingReport(newReport).catch((err) => console.error('Supabase reportIllegalDumping error:', err));
    addAuditLog('CREATE', 'Sumbong Basura', `Resident ${data.residentName} filed report #${id}: ${data.violationType} at ${data.exactLocationOrLandmark}`);
    return newReport;
  };

  const updateIllegalDumpingStatus = (
    id: string,
    status: IllegalDumpingReport['status'],
    assignedTanodOrCrew?: string,
    resolutionRemarks?: string
  ) => {
    setIllegalDumpingReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = {
            ...r,
            status,
            assignedTanodOrCrew: assignedTanodOrCrew !== undefined ? assignedTanodOrCrew : r.assignedTanodOrCrew,
            resolutionRemarks: resolutionRemarks !== undefined ? resolutionRemarks : r.resolutionRemarks,
            resolvedAt: status === 'Cleaned & Cleared' || status === 'Notice Issued / Resolved' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : r.resolvedAt,
          };
          upsertIllegalDumpingReport(updated).catch((err) => console.error('Supabase updateIllegalDumpingStatus error:', err));
          return updated;
        }
        return r;
      })
    );
    addAuditLog('UPDATE', 'Sumbong Basura', `Illegal dumping report #${id} updated to ${status}`);
  };

  const deleteIllegalDumpingReport = (id: string) => {
    setIllegalDumpingReports((prev) => prev.filter((r) => r.id !== id));
    deleteIllegalDumpingReportFromSupabase(id).catch((err) => console.error('Supabase deleteIllegalDumpingReport error:', err));
    addAuditLog('DELETE', 'Sumbong Basura', `Deleted report #${id}`);
  };

  const recordMRFDrop = (data: Omit<MRFRecyclablesDropRecord, 'id' | 'loggedDate'>): MRFRecyclablesDropRecord => {
    const id = `MRF-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newRecord: MRFRecyclablesDropRecord = {
      ...data,
      id,
      loggedDate: new Date().toISOString().split('T')[0],
    };
    setMrfDropRecords((prev) => [newRecord, ...prev]);
    upsertMRFDropRecord(newRecord).catch((err) => console.error('Supabase recordMRFDrop error:', err));
    addAuditLog('CREATE', 'MRF Eco-Station', `Logged ${data.weightKg}kg ${data.itemCategory} for ${data.residentName} (Reward: ${data.rewardValue})`);
    return newRecord;
  };

  const deleteMRFDropRecord = (id: string) => {
    setMrfDropRecords((prev) => prev.filter((m) => m.id !== id));
    deleteMRFDropRecordFromSupabase(id).catch((err) => console.error('Supabase deleteMRFDropRecord error:', err));
    addAuditLog('DELETE', 'MRF Eco-Station', `Deleted MRF record #${id}`);
  };

  // 6. SK Youth & Senior/PWD Actions
  const createSKTournament = (data: Omit<SKTournamentActivity, 'id'>): SKTournamentActivity => {
    const id = `SK-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newTourney: SKTournamentActivity = { ...data, id };
    setSkTournaments((prev) => [newTourney, ...prev]);
    upsertSKTournament(newTourney).catch((err) => console.error('Supabase createSKTournament error:', err));
    addAuditLog('CREATE', 'SK Youth Desk', `SK Admin published youth program: "${data.title}"`);
    return newTourney;
  };

  const updateSKTournament = (id: string, updates: Partial<SKTournamentActivity>) => {
    setSkTournaments((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          upsertSKTournament(updated).catch((err) => console.error('Supabase updateSKTournament error:', err));
          return updated;
        }
        return s;
      })
    );
    addAuditLog('UPDATE', 'SK Youth Desk', `Updated SK activity #${id}`);
  };

  const registerForSKTournament = (data: Omit<SKRegistrationRecord, 'id' | 'registeredDate' | 'status'>): SKRegistrationRecord => {
    const id = `SK-REG-${Date.now().toString().slice(-6)}`;
    const newReg: SKRegistrationRecord = {
      ...data,
      id,
      registeredDate: new Date().toISOString().split('T')[0],
      status: 'Registered & Confirmed',
    };
    setSkRegistrations((prev) => [newReg, ...prev]);
    upsertSKRegistration(newReg).catch((err) => console.error('Supabase registerForSKTournament error:', err));
    addAuditLog('CREATE', 'SK Youth Desk', `Youth resident ${data.residentName} registered for "${data.activityTitle}"`);
    return newReg;
  };

  const updateSKRegistrationStatus = (id: string, status: SKRegistrationRecord['status']) => {
    setSkRegistrations((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, status };
          upsertSKRegistration(updated).catch((err) => console.error('Supabase updateSKRegistrationStatus error:', err));
          return updated;
        }
        return s;
      })
    );
    addAuditLog('UPDATE', 'SK Youth Desk', `Updated SK participant registration #${id} to ${status}`);
  };

  const deleteSKTournament = (id: string) => {
    setSkTournaments((prev) => prev.filter((s) => s.id !== id));
    deleteSKTournamentFromSupabase(id).catch((err) => console.error('Supabase deleteSKTournament error:', err));
    addAuditLog('DELETE', 'SK Youth Desk', `Deleted SK activity #${id}`);
  };

  const deleteSKRegistration = (id: string) => {
    setSkRegistrations((prev) => prev.filter((s) => s.id !== id));
    deleteSKRegistrationFromSupabase(id).catch((err) => console.error('Supabase deleteSKRegistration error:', err));
    addAuditLog('DELETE', 'SK Youth Desk', `Deleted SK registration #${id}`);
  };

  const createSeniorBenefitSchedule = (data: Omit<SeniorCitizenBenefitSchedule, 'id'>): SeniorCitizenBenefitSchedule => {
    const id = `SNR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newSched: SeniorCitizenBenefitSchedule = { ...data, id };
    setSeniorBenefitSchedules((prev) => [newSched, ...prev]);
    upsertSeniorBenefitSchedule(newSched).catch((err) => console.error('Supabase createSeniorBenefitSchedule error:', err));
    addAuditLog('CREATE', 'Senior & PWD Affairs', `Admin posted Senior Benefit distribution: "${data.title}"`);
    return newSched;
  };

  const updateSeniorBenefitSchedule = (id: string, updates: Partial<SeniorCitizenBenefitSchedule>) => {
    setSeniorBenefitSchedules((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          upsertSeniorBenefitSchedule(updated).catch((err) => console.error('Supabase updateSeniorBenefitSchedule error:', err));
          return updated;
        }
        return s;
      })
    );
    addAuditLog('UPDATE', 'Senior & PWD Affairs', `Updated senior schedule #${id}`);
  };

  const deleteSeniorBenefitSchedule = (id: string) => {
    setSeniorBenefitSchedules((prev) => prev.filter((s) => s.id !== id));
    deleteSeniorBenefitScheduleFromSupabase(id).catch((err) => console.error('Supabase deleteSeniorBenefitSchedule error:', err));
    addAuditLog('DELETE', 'Senior & PWD Affairs', `Deleted Senior schedule #${id}`);
  };

  const requestAssistiveDevice = (data: Omit<AssistiveDeviceRequest, 'id' | 'createdAt' | 'status'>): AssistiveDeviceRequest => {
    const id = `AST-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newReq: AssistiveDeviceRequest = {
      ...data,
      id,
      status: 'Submitted',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAssistiveDeviceRequests((prev) => [newReq, ...prev]);
    upsertAssistiveDeviceRequest(newReq).catch((err) => console.error('Supabase requestAssistiveDevice error:', err));
    addAuditLog('CREATE', 'Senior & PWD Affairs', `Assistive device requested: ${data.deviceRequested} for ${data.beneficiaryName}`);
    return newReq;
  };

  const updateAssistiveDeviceStatus = (id: string, status: AssistiveDeviceRequest['status']) => {
    setAssistiveDeviceRequests((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, status };
          upsertAssistiveDeviceRequest(updated).catch((err) => console.error('Supabase updateAssistiveDeviceStatus error:', err));
          return updated;
        }
        return a;
      })
    );
    addAuditLog('UPDATE', 'Senior & PWD Affairs', `Assistive device request #${id} updated to ${status}`);
  };

  const deleteAssistiveDevice = (id: string) => {
    setAssistiveDeviceRequests((prev) => prev.filter((a) => a.id !== id));
    deleteAssistiveDeviceRequestFromSupabase(id).catch((err) => console.error('Supabase deleteAssistiveDevice error:', err));
    addAuditLog('DELETE', 'Senior & PWD Affairs', `Deleted assistive device request #${id}`);
  };

  const [activeServiceDeskTab, setActiveServiceDeskTab] = useState<ServiceDeskTab>('facilities');
  const [targetServiceId, setTargetServiceId] = useState<string | null>(null);

  // Compute Pending Badges
  const pendingFacilitiesCount = facilityReservations.filter((f) => f.status === 'Pending Review').length;
  const pendingEquipmentCount = equipmentReservations.filter((e) => e.status === 'Pending Review').length;
  const pendingHealthAppointmentsCount = healthAppointments.filter((h) => h.status === 'Pending Triage' || h.status === 'Triage Recorded' || h.status === 'Confirmed').length;
  const pendingMedicineCount = medicineRefillRequests.filter((m) => m.status === 'Pending Dispensing' || m.status === 'Pending Approval').length;
  const pendingJobApplicationsCount = jobApplications.filter((j) => j.status === 'Submitted' || j.status === 'Under Review').length;
  const pendingFinancialAidCount = financialAssistanceRequests.filter((f) => f.status === 'Application Submitted' || f.status === 'Social Worker Assessment').length;
  const pendingBulkWasteCount = bulkWasteRequests.filter((b) => b.status === 'Pending Schedule').length;
  const pendingIllegalDumpingCount = illegalDumpingReports.filter((r) => r.status === 'Report Received' || r.status === 'Tanod Dispatched').length;
  const pendingAssistiveCount = assistiveDeviceRequests.filter((a) => a.status === 'Submitted' || a.status === 'BHW Home Assessment').length;
  const pendingLivelihoodAssistanceCount = livelihoodAssistanceRequests.filter((l) => l.status === 'Pending Review' || l.status === 'Field Validation').length;

  const totalPendingServicesCount =
    pendingFacilitiesCount +
    pendingEquipmentCount +
    pendingHealthAppointmentsCount +
    pendingMedicineCount +
    pendingJobApplicationsCount +
    pendingLivelihoodAssistanceCount +
    pendingFinancialAidCount +
    pendingBulkWasteCount +
    pendingIllegalDumpingCount +
    pendingAssistiveCount;

  // Real-time bidirectional notifications between Admin and Residents
  const communityNotifications: SystemNotification[] = useMemo(() => {
    const list: SystemNotification[] = [];
    const now = new Date();
    const timeString = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    // Helper to accurately match a record to the logged-in resident
    const isUserMatch = (
      recResidentId?: string,
      recName?: string,
      recPhone?: string,
      recEmail?: string
    ): boolean => {
      if (!currentUser) return false;
      if (
        recResidentId &&
        (recResidentId === currentUser.residentId ||
          recResidentId === currentUser.id ||
          recResidentId === currentUser.matchedResidentId ||
          (currentUser.role === 'Resident' &&
            residents.some(
              (r) =>
                r.id === recResidentId &&
                (areNamesMatching(`${r.firstName} ${r.lastName}`, currentUser.name) ||
                  (r.email && currentUser.email && r.email.toLowerCase() === currentUser.email.toLowerCase()))
            )))
      ) {
        return true;
      }
      if (recName) {
        if (areNamesMatching(recName, currentUser.name)) return true;
        if (recName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) return true;
        if (currentUser.username && recName.trim().toLowerCase().includes(currentUser.username.trim().toLowerCase())) return true;
      }
      const userPhone = (currentUser.contactNumber || (currentUser as any).phone || '').replace(/\D/g, '');
      const recCleanPhone = (recPhone || '').replace(/\D/g, '');
      if (userPhone && recCleanPhone) {
        if (userPhone === recCleanPhone) return true;
        if (userPhone.length >= 7 && recCleanPhone.length >= 7 && (userPhone.endsWith(recCleanPhone) || recCleanPhone.endsWith(userPhone))) return true;
      }
      if (recEmail && currentUser.email && recEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) {
        return true;
      }
      return false;
    };

    if (currentUser.role === 'Resident') {
      // 1. Facilities for this resident
      facilityReservations
        .filter((f) => isUserMatch(f.reservedByResidentId, f.residentName, f.contactNumber))
        .forEach((f) => {
          const isApproved = f.status === 'Approved';
          const isPending = f.status === 'Pending Review';
          const isRejected = f.status === 'Rejected';
          const statusSlug = (f.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-');
          list.push({
            id: `notif-cs-fac-res-${f.id}-${statusSlug}`,
            title: isApproved
              ? `✅ Venue Booking APPROVED: ${f.facilityName}`
              : isRejected
              ? `❌ Venue Booking Returned: ${f.facilityName}`
              : `🏛️ Venue Reservation: ${f.facilityName} (${f.status})`,
            message: isApproved
              ? `Great news! Your booking for "${f.eventTitle}" on ${f.date} (${f.startTime} - ${f.endTime}) has been APPROVED by the Barangay Admin. Fee: ₱${(f.fee || 0).toLocaleString()}. ${f.remarks ? `Remarks: ${f.remarks}` : ''}`
              : isPending
              ? `Your booking request for "${f.eventTitle}" on ${f.date} has been submitted and is currently under administrative review.`
              : isRejected
              ? `Your booking request for "${f.eventTitle}" was not approved. ${f.remarks ? `Reason: ${f.remarks}` : ''}`
              : `Facility reservation #${f.id} status is now ${f.status}.`,
            timestamp: f.createdAt ? `${f.createdAt} 08:30:00` : timeString,
            type: isApproved ? 'success' : isRejected ? 'alert' : 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: f.id,
            actionText: 'View Venue Booking',
          });
        });

      // 2. Equipment for this resident
      equipmentReservations
        .filter((e) => isUserMatch(e.reservedByResidentId, e.residentName, e.contactNumber))
        .forEach((e) => {
          const isApproved = e.status === 'Approved' || e.status === 'Released / In Use';
          const isPending = e.status === 'Pending Review';
          const isReturned = e.status === 'Returned';
          const statusSlug = (e.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-');
          list.push({
            id: `notif-cs-eqp-res-${e.id}-${statusSlug}`,
            title: isApproved
              ? `✅ Equipment Requisition APPROVED: ${e.quantity}x ${e.equipmentName}`
              : isReturned
              ? `🔄 Equipment Returned: ${e.quantity}x ${e.equipmentName}`
              : `📦 Equipment Requisition: ${e.equipmentName} (${e.status})`,
            message: isApproved
              ? `${e.quantity}x ${e.equipmentName} is APPROVED and ready for release! Claim at Barangay Custodian Office with valid ID. Deposit: ₱${e.depositAmount || 0}. Return date: ${e.returnDate}.`
              : isReturned
              ? `${e.quantity}x ${e.equipmentName} has been returned and inspected in good condition. Thank you!`
              : isPending
              ? `Your borrow request for ${e.quantity}x ${e.equipmentName} (${e.borrowDate} to ${e.returnDate}) is under review by the custodian.`
              : `Your request for ${e.quantity}x ${e.equipmentName} is ${e.status}.`,
            timestamp: e.createdAt ? `${e.createdAt} 09:00:00` : timeString,
            type: isApproved || isReturned ? 'success' : 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: e.id,
            actionText: 'View Equipment Pass',
          });
        });

      // 3. Health Consultations for this resident
      healthAppointments
        .filter((h) => isUserMatch(h.residentId, h.residentName) || areNamesMatching(h.patientName, currentUser.name))
        .forEach((h) => {
          const isConfirmed = h.status === 'Confirmed' || h.status === 'Completed' || h.status === 'Triage Recorded';
          const statusSlug = (h.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-');
          list.push({
            id: `notif-cs-hlth-res-${h.id}-${statusSlug}`,
            title: `🩺 Health Consultation: ${h.serviceType} (${h.status})`,
            message: `Queue #${h.queueNumber || h.id} • Patient: ${h.patientName} on ${h.preferredDate} (${h.preferredTimeSlot}). Attending: ${h.attendingHealthWorker || 'Barangay Doctor'}. ${h.prescriptionsOrAdvice ? `Rx/Advice: ${h.prescriptionsOrAdvice}` : ''}`,
            timestamp: h.createdAt ? `${h.createdAt} 08:45:00` : timeString,
            type: isConfirmed ? 'success' : 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: h.id,
            actionText: 'View Health Slip',
          });
        });

      // 4. Medicine Refill Requests
      medicineRefillRequests
        .filter((m) => isUserMatch(m.residentId, m.residentName, m.contactNumber))
        .forEach((m) => {
          const isReady = m.status === 'Ready for Pickup' || m.status === 'Dispensed';
          const statusSlug = (m.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-');
          list.push({
            id: `notif-cs-med-res-${m.id}-${statusSlug}`,
            title: `💊 Medicine Refill: ${m.medicineName} (${m.status})`,
            message: isReady
              ? `Your refill of ${m.quantityRequested}x ${m.medicineName} is READY FOR PICKUP at Barangay Health Station Pharmacy. ${m.pharmacistNotes || ''}`
              : `Your request for ${m.quantityRequested}x ${m.medicineName} has been submitted and is currently ${m.status}.`,
            timestamp: m.requestedAt ? `${m.requestedAt} 10:00:00` : timeString,
            type: isReady ? 'success' : 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: m.id,
            actionText: 'View Rx Slip',
          });
        });

      // 5. Job Applications
      jobApplications
        .filter((j) => isUserMatch(j.residentId, j.residentName, j.contactNumber))
        .forEach((j) => {
          const isHired = j.status === 'Hired' || j.status === 'Invited for Interview';
          const statusSlug = (j.status || 'submitted').toLowerCase().replace(/[^a-z0-9]/g, '-');
          list.push({
            id: `notif-cs-job-res-${j.id}-${statusSlug}`,
            title: `💼 Job Application: ${j.jobTitle} (${j.status})`,
            message: isHired
              ? `Congratulations! Your application for "${j.jobTitle}" with ${j.employerName} has been ${j.status}. PESO officer will contact you.`
              : `Your application for "${j.jobTitle}" with ${j.employerName} has been received and is currently ${j.status}.`,
            timestamp: j.appliedDate ? `${j.appliedDate} 11:00:00` : timeString,
            type: isHired ? 'success' : 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: j.id,
            actionText: 'View Application',
          });
        });

      // 6. Livelihood Enrollments
      livelihoodEnrollments
        .filter((l) => isUserMatch(l.residentId, l.residentName, l.contactNumber))
        .forEach((l) => {
          const statusSlug = (l.status || 'confirmed').toLowerCase().replace(/[^a-z0-9]/g, '-');
          list.push({
            id: `notif-cs-trn-res-${l.id}-${statusSlug}`,
            title: `🛠️ Skills Workshop Confirmed: ${l.trainingTitle}`,
            message: `You are officially confirmed for "${l.trainingTitle}". Training materials and venue instructions have been dispatched.`,
            timestamp: l.enrolledDate ? `${l.enrolledDate} 09:30:00` : timeString,
            type: 'success',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: l.id,
            actionText: 'View Workshop Details',
          });
        });

      // 6a. Livelihood Grants & Assistance for this resident
      livelihoodAssistanceRequests
        .filter((l) => isUserMatch(l.residentId, l.residentName, l.contactNumber))
        .forEach((l) => {
          const isApproved = l.status === 'Approved - For Release' || l.status === 'Disbursed / Released';
          const statusSlug = (l.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-');
          list.push({
            id: `notif-cs-liv-res-${l.id}-${statusSlug}`,
            title: `💰 Livelihood Grant ${l.status}: ₱${(l.approvedAmount || l.requestedGrantAmount).toLocaleString()}`,
            message: isApproved
              ? `Congratulations! Your livelihood assistance application for ${l.programType} (₱${(l.approvedAmount || l.requestedGrantAmount).toLocaleString()}) has been APPROVED for release! Please coordinate with the Barangay Livelihood Focal.`
              : `Your application for ${l.programType} (Proposed Business: "${l.proposedBusiness}") is currently ${l.status}.`,
            timestamp: l.dateRequested ? `${l.dateRequested} 10:00:00` : timeString,
            type: isApproved ? 'success' : 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: l.id,
            actionText: 'View Livelihood Grant',
          });
        });

      // 6b. Community Job Openings (All Residents)
      jobPostings
        .filter((j) => j.isActive)
        .slice(0, 4)
        .forEach((j) => {
          list.push({
            id: `notif-cs-jobopen-res-${j.id}`,
            title: `💼 Job Opportunity: ${j.title} (${j.employerName})`,
            message: `Hiring at ${j.employerName} (${j.location}) • Salary: ${j.salaryRange} • Vacancies: ${j.vacancies} • Deadline: ${j.deadlineDate}.`,
            timestamp: j.postedDate ? `${j.postedDate} 08:00:00` : timeString,
            type: 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: j.id,
            actionText: 'Apply in Trabaho Desk',
          });
        });

      // 6c. Child Immunizations (For Parent / Guardian)
      childImmunizations
        .filter((c) => isUserMatch(c.parentResidentId, c.parentName) || areNamesMatching(c.childName, currentUser.name))
        .forEach((c) => {
          list.push({
            id: `notif-cs-imm-res-${c.id}`,
            title: `💉 Child Vaccine Schedule: ${c.childName}`,
            message: `Vaccine: ${c.vaccineName} (${c.doseNumber}) scheduled on ${c.dueDate} at Barangay Health Station. Status: ${c.status}.`,
            timestamp: c.dueDate ? `${c.dueDate} 09:00:00` : timeString,
            type: c.status === 'Overdue' ? 'warning' : 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: c.id,
            actionText: 'View Immunization Card',
          });
        });

      // 6d. Health Outreach Caravans (All Residents)
      healthMissions
        .filter((hm) => hm.status === 'Upcoming' || hm.status === 'Ongoing')
        .forEach((hm) => {
          list.push({
            id: `notif-cs-msn-res-${hm.id}`,
            title: `🚑 Free Health Mission: ${hm.title}`,
            message: `Free medical caravan on ${hm.date} (${hm.timeSchedule}) at ${hm.venue}. Program: ${hm.programType || hm.title}. Slots: ${hm.registeredBeneficiaryIds?.length || 0}/${hm.maxSlots}.`,
            timestamp: hm.date ? `${hm.date} 07:00:00` : timeString,
            type: 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: hm.id,
            actionText: 'Register for Mission',
          });
        });

      // 7. Ayuda & Financial Assistance
      ayudaClaims
        .filter((a) => isUserMatch(a.residentId, a.residentName))
        .forEach((a) => {
          const statusSlug = (a.status || 'available').toLowerCase().replace(/[^a-z0-9]/g, '-');
          const isClaimed = a.status === 'Claimed / Released';
          list.push({
            id: `notif-cs-ayu-res-${a.id}-${statusSlug}`,
            title: isClaimed ? `✅ Ayuda Package Claimed: ${a.title}` : `🎁 Ayuda Claim Pass Ready: ${a.title}`,
            message: `Distribution Date: ${a.distributionDate} (${a.timeSlot}) at ${a.claimLocation}. Status: ${a.status}. Items: ${a.itemsIncluded.join(', ')}.`,
            timestamp: `${a.distributionDate} 08:00:00`,
            type: a.status === 'Available to Claim' ? 'success' : 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: a.id,
            actionText: 'View Digital Claim QR',
          });
        });

      financialAssistanceRequests
        .filter((f) => isUserMatch(f.residentId, f.residentName, f.contactNumber))
        .forEach((f) => {
          const isDisbursed = f.status === 'Disbursed';
          const isApproved = f.status === 'Approved for Payout';
          const statusSlug = (f.status || 'submitted').toLowerCase().replace(/[^a-z0-9]/g, '-');
          list.push({
            id: `notif-cs-aics-res-${f.id}-${statusSlug}`,
            title: `💵 Financial Aid (AICS) ${f.status}: ₱${(f.disbursedAmount || f.amountRequested).toLocaleString()}`,
            message: isDisbursed
              ? `₱${(f.disbursedAmount || f.amountRequested).toLocaleString()} for ${f.assistanceType} has been DISBURSED. Please verify with Treasury/Social Worker.`
              : isApproved
              ? `Your application for ${f.assistanceType} is APPROVED for payout! Proceed to Barangay Hall Treasury on scheduled date.`
              : `Your AICS application for ${f.assistanceType} has been received and is under assessment by the Barangay Social Worker.`,
            timestamp: f.createdAt ? `${f.createdAt} 13:00:00` : timeString,
            type: isDisbursed || isApproved ? 'success' : 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: f.id,
            actionText: 'View AICS Voucher',
          });
        });

      // 8. Bulk Waste Pickup
      bulkWasteRequests
        .filter((b) => isUserMatch(b.residentId, b.residentName, b.contactNumber))
        .forEach((b) => {
          const statusSlug = (b.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-');
          list.push({
            id: `notif-cs-bulk-res-${b.id}-${statusSlug}`,
            title: `🚚 Bulk Waste Pickup: ${b.wasteCategory} (${b.status})`,
            message: `Scheduled Date: ${b.preferredPickupDate} • Assigned Crew: ${b.assignedCrew || 'Sanitation Team'}. Address: ${b.streetAddress} (${b.purok}).`,
            timestamp: b.createdAt ? `${b.createdAt} 07:30:00` : timeString,
            type: b.status === 'Collected' ? 'success' : 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: b.id,
            actionText: 'View Pickup Schedule',
          });
        });

      // 9. Assistive Device Requests
      assistiveDeviceRequests
        .filter((a) => isUserMatch(a.residentId, a.residentName) || areNamesMatching(a.beneficiaryName, currentUser.name))
        .forEach((a) => {
          const isApproved = a.status === 'Approved for Delivery' || a.status === 'Delivered to Residence';
          const statusSlug = (a.status || 'submitted').toLowerCase().replace(/[^a-z0-9]/g, '-');
          list.push({
            id: `notif-cs-ast-res-${a.id}-${statusSlug}`,
            title: `♿ Assistive Device: ${a.deviceRequested} (${a.status})`,
            message: `Beneficiary: ${a.beneficiaryName} (${a.purok}). Status: ${a.status}. Priority: ${a.priorityLevel}.`,
            timestamp: a.createdAt ? `${a.createdAt} 14:00:00` : timeString,
            type: isApproved ? 'success' : 'info',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: a.id,
            actionText: 'View Device Requisition',
          });
        });

      // 10. Bayanihan Clean-Up Volunteer Signups
      cleanUpVolunteers
        .filter((v) => isUserMatch(v.residentId, v.residentName, v.contactNumber))
        .forEach((v) => {
          const drive = cleanUpDrives.find((d) => d.id === v.driveId);
          list.push({
            id: `notif-cs-vol-res-${v.id}`,
            title: `Volunteer Confirmed: ${v.driveTitle || drive?.title || 'Clean-Up Drive'}`,
            message: `You are registered as a Bayanihan Volunteer. Venue: ${drive?.assemblyPoint || drive?.purokTarget || 'Barangay Center'}. Status: ${v.attendanceVerified ? 'Attendance Verified (Hours Recorded)' : 'Registered'}.`,
            timestamp: v.registeredDate ? `${v.registeredDate} 08:00:00` : timeString,
            type: 'success',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: v.id,
            actionText: 'View Clean-Up Drive',
          });
        });

      // 11. Bayanihan Clean-Up Drives (Community announcements for all residents)
      cleanUpDrives.forEach((d) => {
        list.push({
          id: `notif-cs-drive-res-${d.id}`,
          title: `🧹 Clean-Up Drive: ${d.title}`,
          message: `Join our Barangay Bayanihan Clean-up at ${d.purokTarget} on ${d.activityDate} (${d.assemblyTime}). Assembly point: ${d.assemblyPoint}. Volunteers: ${d.currentVolunteers}/${d.expectedVolunteers}.`,
          timestamp: d.activityDate ? `${d.activityDate} 06:00:00` : timeString,
          type: 'info',
          category: 'services',
          linkModule: 'resident_portal',
          targetRecordId: d.id,
          actionText: 'Volunteer for Drive',
        });
      });

      // 12. Sangguniang Kabataan (SK) Youth Tournaments & Programs (For Residents)
      skTournaments.forEach((t) => {
        list.push({
          id: `notif-cs-sktourney-res-${t.id}`,
          title: `🏆 SK Youth Program: ${t.title}`,
          message: `Youth activity "${t.title}" (${t.category}) • Venue: ${t.venue} • Schedule: ${t.scheduleDates} • Status: ${t.registrationStatus} • Prizes: ${t.prizes}.`,
          timestamp: timeString,
          type: t.registrationStatus === 'Registration Open' ? 'info' : 'success',
          category: 'services',
          linkModule: 'resident_portal',
          targetRecordId: t.id,
          actionText: 'Register in Youth Hub',
        });
      });

      // 13. Sangguniang Kabataan (SK) Youth Registrations (Resident's personal signups)
      skRegistrations
        .filter((s) => isUserMatch(s.residentId, s.residentName))
        .forEach((s) => {
          const tournament = skTournaments.find((t) => t.id === s.activityId);
          list.push({
            id: `notif-cs-sk-res-${s.id}`,
            title: `SK Registration: ${s.activityTitle || tournament?.title || 'Youth Activity'}`,
            message: `Registration confirmed for ${s.residentName} (${s.teamOrCategory || 'Youth Sector'}). Purok: ${s.purok}. Status: ${s.status}.`,
            timestamp: s.registeredDate ? `${s.registeredDate} 09:00:00` : timeString,
            type: 'success',
            category: 'services',
            linkModule: 'resident_portal',
            targetRecordId: s.id,
            actionText: 'View SK Activity',
          });
        });

      // 14. Senior Citizen Benefit & Payout Schedules (For Residents)
      seniorBenefitSchedules.forEach((b) => {
        list.push({
          id: `notif-cs-seniorben-res-${b.id}`,
          title: `🎁 Senior Benefit Schedule: ${b.title}`,
          message: `${b.category} scheduled on ${b.distributionDate} at ${b.venue}. Coverage: ${b.purokCoverage}. Status: ${b.status}. Requirements: ${b.requirements.join(', ')}.`,
          timestamp: timeString,
          type: b.status === 'Claiming in Progress' ? 'warning' : 'info',
          category: 'services',
          linkModule: 'resident_portal',
          targetRecordId: b.id,
          actionText: 'View Senior Benefits',
        });
      });
    } else {
      // ==========================================
      // ADMIN NOTIFICATIONS FOR ALL RESIDENT REQUESTS & ACTIVE PROGRAMS
      // ==========================================

      // 1. Facility Reservations Pending Review / New Bookings
      facilityReservations.forEach((f) => {
        const isPending = f.status === 'Pending Review';
        const statusSlug = (f.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-');
        list.push({
          id: `notif-cs-fac-adm-${f.id}-${statusSlug}`,
          title: isPending ? `🏛️ New Venue Booking: ${f.facilityName}` : `Facility Booking: ${f.facilityName} (${f.status})`,
          message: `Resident ${f.residentName} (${f.purok}) requested ${f.facilityName} for "${f.eventTitle}" on ${f.date} (${f.startTime} - ${f.endTime}) with ~${f.expectedAttendees} guests.`,
          timestamp: f.createdAt ? `${f.createdAt} 08:30:00` : timeString,
          type: isPending ? 'warning' : f.status === 'Approved' ? 'success' : 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: f.id,
          actionText: 'Review in Service Desk',
        });
      });

      // 2. Equipment Reservations Pending Review / Borrow Requests
      equipmentReservations.forEach((e) => {
        const isPending = e.status === 'Pending Review';
        const statusSlug = (e.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-');
        list.push({
          id: `notif-cs-eqp-adm-${e.id}-${statusSlug}`,
          title: isPending ? `📦 New Equipment Request: ${e.quantity}x ${e.equipmentName}` : `Equipment Requisition: ${e.quantity}x ${e.equipmentName} (${e.status})`,
          message: `Resident ${e.residentName} (${e.purok} • ${e.contactNumber}) requested ${e.quantity}x ${e.equipmentName} from ${e.borrowDate} to ${e.returnDate}. Purpose: ${e.purpose}.`,
          timestamp: e.createdAt ? `${e.createdAt} 09:00:00` : timeString,
          type: isPending ? 'warning' : e.status === 'Approved' ? 'success' : 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: e.id,
          actionText: 'Review in Service Desk',
        });
      });

      // 3. Health Appointments Pending Triage / Consultations
      healthAppointments.forEach((h) => {
        const isPending = h.status === 'Pending Triage' || h.status === 'Triage Recorded';
        const statusSlug = (h.status || 'pending-triage').toLowerCase().replace(/[^a-z0-9]/g, '-');
        list.push({
          id: `notif-cs-hlth-adm-${h.id}-${statusSlug}`,
          title: isPending ? `🩺 New Consultation Booking: ${h.serviceType}` : `🩺 Health Consultation: ${h.serviceType} (${h.status})`,
          message: `Patient: ${h.patientName} (${h.patientAge} y/o • Resident: ${h.residentName}) booked for ${h.preferredDate} (${h.preferredTimeSlot}). Symptoms: ${h.symptomsOrPurpose}. Queue: ${h.queueNumber || h.id}. Status: ${h.status}.`,
          timestamp: h.createdAt ? `${h.createdAt} 08:45:00` : timeString,
          type: isPending ? 'warning' : h.status === 'Confirmed' || h.status === 'Completed' ? 'success' : 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: h.id,
          actionText: 'Open Health Station',
        });
      });

      // 4. Medicine Refill Requests
      medicineRefillRequests.forEach((m) => {
        const isPending = m.status === 'Pending Dispensing' || m.status === 'Pending Approval';
        const statusSlug = (m.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-');
        list.push({
          id: `notif-cs-med-adm-${m.id}-${statusSlug}`,
          title: isPending ? `💊 New Medicine Dispensing Request: ${m.medicineName}` : `💊 Medicine Dispensing: ${m.medicineName} (${m.status})`,
          message: `Resident: ${m.residentName} (${m.contactNumber}) requested ${m.quantityRequested}x ${m.medicineName} for ${m.purpose}. Status: ${m.status}.`,
          timestamp: m.requestedAt ? `${m.requestedAt} 10:00:00` : timeString,
          type: isPending ? 'warning' : m.status === 'Ready for Pickup' || m.status === 'Dispensed' ? 'success' : 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: m.id,
          actionText: 'Dispense in Pharmacy Desk',
        });
      });

      // 5. Job Applications Received
      jobApplications.forEach((j) => {
        const statusSlug = (j.status || 'submitted').toLowerCase().replace(/[^a-z0-9]/g, '-');
        const isPending = j.status === 'Submitted' || j.status === 'Under Review';
        list.push({
          id: `notif-cs-job-adm-${j.id}-${statusSlug}`,
          title: isPending ? `💼 New Job Application: ${j.jobTitle} - ${j.residentName}` : `💼 Job Application: ${j.jobTitle} (${j.status})`,
          message: `Candidate: ${j.residentName} (${j.educationalAttainment} • ${j.contactNumber}) applied for vacancy at ${j.employerName}. Experience: ${j.workExperience}. Status: ${j.status}.`,
          timestamp: j.appliedDate ? `${j.appliedDate} 11:00:00` : timeString,
          type: isPending ? 'warning' : j.status === 'Hired' ? 'success' : 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: j.id,
          actionText: 'Review in PESO Desk',
        });
      });

      // 6. Livelihood Training Enrollments
      livelihoodEnrollments.forEach((l) => {
        const statusSlug = (l.status || 'enrolled').toLowerCase().replace(/[^a-z0-9]/g, '-');
        list.push({
          id: `notif-cs-trn-adm-${l.id}-${statusSlug}`,
          title: `🛠️ Training Enrollment: ${l.trainingTitle}`,
          message: `Resident ${l.residentName} (${l.purok} • ${l.contactNumber}) registered for skills workshop "${l.trainingTitle}".`,
          timestamp: l.enrolledDate ? `${l.enrolledDate} 09:30:00` : timeString,
          type: 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: l.id,
          actionText: 'View Roster in Livelihood Desk',
        });
      });

      // 6a. Livelihood Grants & Seed Capital Applications (Admin View)
      livelihoodAssistanceRequests.forEach((l) => {
        const isPending = l.status === 'Pending Review' || l.status === 'Field Validation';
        const statusSlug = (l.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-');
        list.push({
          id: `notif-cs-liv-adm-${l.id}-${statusSlug}`,
          title: isPending ? `💰 New Livelihood Grant Application: ₱${l.requestedGrantAmount.toLocaleString()}` : `💰 Livelihood Grant: ₱${l.requestedGrantAmount.toLocaleString()} (${l.status})`,
          message: `Applicant ${l.residentName} (${l.purok} • ${l.contactNumber}) applied for ${l.programType}. Proposed Enterprise: "${l.proposedBusiness}". Status: ${l.status}.`,
          timestamp: l.dateRequested ? `${l.dateRequested} 10:00:00` : timeString,
          type: isPending ? 'warning' : l.status === 'Approved - For Release' || l.status === 'Disbursed / Released' ? 'success' : 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: l.id,
          actionText: 'Review in Livelihood Desk',
        });
      });

      // 7. Financial Assistance (AICS) Applications
      financialAssistanceRequests.forEach((f) => {
        const isPending = f.status === 'Application Submitted' || f.status === 'Social Worker Assessment';
        const statusSlug = (f.status || 'submitted').toLowerCase().replace(/[^a-z0-9]/g, '-');
        list.push({
          id: `notif-cs-aics-adm-${f.id}-${statusSlug}`,
          title: isPending ? `💵 New AICS Financial Aid Application: ₱${f.amountRequested.toLocaleString()}` : `💵 Financial Aid (AICS): ₱${f.amountRequested.toLocaleString()} (${f.status})`,
          message: `Applicant: ${f.residentName} (${f.purok}) requested ₱${f.amountRequested.toLocaleString()} for ${f.assistanceType} (${f.beneficiaryName}). Justification: ${f.justification}. Status: ${f.status}.`,
          timestamp: f.createdAt ? `${f.createdAt} 13:00:00` : timeString,
          type: isPending ? 'warning' : f.status === 'Approved for Payout' || f.status === 'Disbursed' ? 'success' : 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: f.id,
          actionText: 'Assess in Ayuda / AICS Desk',
        });
      });

      // 7a. Ayuda & Calamity Relief Distributions (Admin View)
      ayudaClaims.forEach((a) => {
        const statusSlug = (a.status || 'available').toLowerCase().replace(/[^a-z0-9]/g, '-');
        const isClaimed = a.status === 'Claimed / Released';
        list.push({
          id: `notif-cs-ayu-adm-${a.id}-${statusSlug}`,
          title: isClaimed ? `📦 Ayuda Released: ${a.title} - ${a.residentName}` : `🎁 Ayuda Claim Voucher: ${a.title} - ${a.residentName}`,
          message: `Beneficiary: ${a.residentName} (${a.purok}) • Status: ${a.status} • Pickup: ${a.distributionDate} (${a.timeSlot}) at ${a.claimLocation}.`,
          timestamp: `${a.distributionDate} 08:00:00`,
          type: isClaimed ? 'success' : 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: a.id,
          actionText: 'Manage Ayuda Distribution',
        });
      });

      // 8. Special Bulk Waste Pickup Requests
      bulkWasteRequests.forEach((b) => {
        const isPending = b.status === 'Pending Schedule';
        const statusSlug = (b.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-');
        list.push({
          id: `notif-cs-bulk-adm-${b.id}-${statusSlug}`,
          title: isPending ? `🚚 New Bulk Waste Pickup Request: ${b.wasteCategory}` : `🚚 Bulk Waste Pickup: ${b.wasteCategory} (${b.status})`,
          message: `Resident: ${b.residentName} (${b.purok} • ${b.streetAddress}) requested collection on ${b.preferredPickupDate}. Details: ${b.wasteDescription}. Status: ${b.status}.`,
          timestamp: b.createdAt ? `${b.createdAt} 07:30:00` : timeString,
          type: isPending ? 'warning' : b.status === 'Collected' ? 'success' : 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: b.id,
          actionText: 'Assign Crew in Sanitation Desk',
        });
      });

      // 9. Clean-Up Drive Volunteer Signups & Published Drives
      cleanUpVolunteers.forEach((v) => {
        list.push({
          id: `notif-cs-vol-adm-${v.id}`,
          title: `Bayanihan Volunteer: ${v.residentName}`,
          message: `Resident ${v.residentName} (${v.purok}) signed up for Clean-Up Drive "${v.driveTitle}". Status: ${v.attendanceVerified ? 'Verified' : 'Registered'}.`,
          timestamp: v.registeredDate ? `${v.registeredDate} 08:00:00` : timeString,
          type: 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: v.id,
          actionText: 'View Volunteers in Eco Desk',
        });
      });

      cleanUpDrives.forEach((d) => {
        list.push({
          id: `notif-cs-drive-adm-${d.id}`,
          title: `Bayanihan Clean-Up Drive: ${d.title}`,
          message: `Scheduled on ${d.activityDate} (${d.assemblyTime}) at ${d.assemblyPoint}. Area: ${d.purokTarget}. Volunteers registered: ${d.currentVolunteers}/${d.expectedVolunteers}. Status: ${d.status}.`,
          timestamp: d.activityDate ? `${d.activityDate} 06:00:00` : timeString,
          type: 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: d.id,
          actionText: 'Manage in Clean-Up Desk',
        });
      });

      // 10. SK Youth Tournaments & Registrations (Admin View)
      skTournaments.forEach((t) => {
        list.push({
          id: `notif-cs-sktourney-adm-${t.id}`,
          title: `SK Youth Program: ${t.title}`,
          message: `Activity "${t.title}" (${t.category}) • Venue: ${t.venue} • Dates: ${t.scheduleDates} • Status: ${t.registrationStatus}. Contact: ${t.skContactPerson} (${t.contactNumber}).`,
          timestamp: timeString,
          type: 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: t.id,
          actionText: 'Manage in SK Youth Desk',
        });
      });

      skRegistrations.forEach((s) => {
        list.push({
          id: `notif-cs-sk-adm-${s.id}`,
          title: `SK Youth Registration: ${s.activityTitle}`,
          message: `Participant: ${s.residentName} (${s.age} y/o • ${s.purok}) registered for "${s.activityTitle}" (${s.teamOrCategory}). Status: ${s.status}.`,
          timestamp: s.registeredDate ? `${s.registeredDate} 10:30:00` : timeString,
          type: 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: s.id,
          actionText: 'View in SK Youth Hub',
        });
      });

      // 11. Senior Citizen Benefit Schedules (Admin View)
      seniorBenefitSchedules.forEach((b) => {
        list.push({
          id: `notif-cs-seniorben-adm-${b.id}`,
          title: `Senior Citizen Benefit: ${b.title}`,
          message: `Distribution for "${b.title}" (${b.category}) on ${b.distributionDate} at ${b.venue}. Coverage: ${b.purokCoverage}. Status: ${b.status}.`,
          timestamp: timeString,
          type: b.status === 'Claiming in Progress' ? 'warning' : 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: b.id,
          actionText: 'Manage in Senior Desk',
        });
      });

      // 12. Assistive Device Requisitions
      assistiveDeviceRequests.forEach((a) => {
        const isPending = a.status === 'Submitted' || a.status === 'BHW Home Assessment';
        const statusSlug = (a.status || 'submitted').toLowerCase().replace(/[^a-z0-9]/g, '-');
        list.push({
          id: `notif-cs-ast-adm-${a.id}-${statusSlug}`,
          title: isPending ? `♿ New Assistive Device Request: ${a.deviceRequested}` : `♿ Assistive Device: ${a.deviceRequested} (${a.status})`,
          message: `For ${a.beneficiaryName} (${a.beneficiaryAge} y/o • ${a.purok}) filed by ${a.residentName}. Priority: ${a.priorityLevel}. Reason: ${a.medicalConditionReason}. Status: ${a.status}.`,
          timestamp: a.createdAt ? `${a.createdAt} 14:00:00` : timeString,
          type: isPending ? 'warning' : a.status === 'Approved for Delivery' || a.status === 'Delivered to Residence' ? 'success' : 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: a.id,
          actionText: 'Review in Senior & PWD Hub',
        });
      });

      // 13. Illegal Dumping & Environmental Incident Reports (Admin View)
      illegalDumpingReports.forEach((r) => {
        const isPending = r.status === 'Report Received' || r.status === 'Tanod Dispatched';
        const statusSlug = (r.status || 'reported').toLowerCase().replace(/[^a-z0-9]/g, '-');
        list.push({
          id: `notif-cs-dump-adm-${r.id}-${statusSlug}`,
          title: `⚠️ Sanitation Alert: ${r.purok} (${r.status})`,
          message: `Report by ${r.residentName} (${r.contactNumber || 'Resident'}): ${r.violationType} at ${r.exactLocationOrLandmark}. Severity: ${r.severityLevel}. Action: ${r.assignedTanodOrCrew || r.resolutionRemarks || 'Pending Tanod / Eco Crew'}.`,
          timestamp: r.reportedAt ? `${r.reportedAt} 08:00:00` : timeString,
          type: isPending ? 'warning' : 'info',
          category: 'services',
          linkModule: 'community_services',
          targetRecordId: r.id,
          actionText: 'Investigate in Eco Desk',
        });
      });
    }

    return list
      .filter((n) => !dismissedNotifIds?.includes(n.id))
      .map((n) => ({
        ...n,
        read: readNotifIds ? readNotifIds.includes(n.id) : false,
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [
    currentUser,
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
    readNotifIds,
    dismissedNotifIds,
  ]);

  const unreadCommunityNotifCount = useMemo(() => {
    return communityNotifications.filter((n) => !n.read).length;
  }, [communityNotifications]);

  const addReservation = (item: FacilityReservation) => {
    setFacilityReservations((prev) => [item, ...prev]);
  };

  const addEquipmentReservation = (item: EquipmentReservation) => {
    setEquipmentReservations((prev) => [item, ...prev]);
  };

  const addConsultation = (item: HealthAppointment) => {
    setHealthAppointments((prev) => [item, ...prev]);
  };

  const addImmunization = (item: ChildImmunizationTracker) => {
    setChildImmunizations((prev) => [item, ...prev]);
  };

  const addMedicineRequest = (item: MedicineRefillRequest) => {
    setMedicineRefillRequests((prev) => [item, ...prev]);
  };

  return (
    <CommunityServicesContext.Provider
      value={{
        activeServiceDeskTab,
        setActiveServiceDeskTab,
        targetServiceId,
        setTargetServiceId,
        communityNotifications,
        unreadCommunityNotifCount,

        facilityReservations,
        reservations: facilityReservations,
        equipmentReservations,
        requestFacilityReservation,
        addReservation,
        updateFacilityReservationStatus,
        deleteFacilityReservation,
        requestEquipmentReservation,
        addEquipmentReservation,
        updateEquipmentReservationStatus,
        deleteEquipmentReservation,

        healthAppointments,
        consultations: healthAppointments,
        childImmunizations,
        immunizations: childImmunizations,
        medicineRefillRequests,
        medicineRequests: medicineRefillRequests,
        pharmacyInventory,
        healthMissions,
        bookHealthAppointment,
        addConsultation,
        updateHealthAppointmentStatus,
        recordTriageVitals,
        cancelHealthAppointment,
        requestMedicineRefill,
        addMedicineRequest,
        updateMedicineRefillStatus,
        addPharmacyItem,
        updatePharmacyItem,
        restockPharmacyItem,
        deletePharmacyItem,
        addHealthMission,
        updateHealthMission,
        deleteHealthMission,
        registerForHealthMission,
        cancelHealthMissionReservation,
        updateChildImmunization,
        addChildImmunization,
        addImmunization,

        jobPostings,
        jobs: jobPostings,
        jobApplications,
        livelihoodTrainings,
        livelihoodEnrollments,
        addJobPosting,
        updateJobPosting,
        deleteJobPosting,
        submitJobApplication,
        updateJobApplicationStatus,
        addLivelihoodTraining,
        updateLivelihoodTraining,
        deleteLivelihoodTraining,
        enrollInLivelihoodTraining,
        updateLivelihoodEnrollmentStatus,
        livelihoodAssistanceRequests,
        requestLivelihoodAssistance,
        updateLivelihoodAssistanceStatus,
        deleteLivelihoodAssistance,
        pendingLivelihoodAssistanceCount,

        ayudaClaims,
        ayudaWaves: [
          {
            id: 'AW-01',
            title: 'Barangay Relief & Ayuda Social Distribution',
            category: 'Calamity & Social Welfare',
            totalTargetBeneficiaries: ayudaClaims.length,
            status: 'Active Distribution',
          },
        ],
        financialAssistanceRequests,
        createAyudaDistribution,
        updateAyudaClaimStatus,
        requestFinancialAssistance,
        updateFinancialAssistanceStatus,

        wasteSchedules,
        bulkWasteRequests,
        wasteRequests: bulkWasteRequests,
        cleanUpDrives,
        cleanUpVolunteers,
        illegalDumpingReports,
        mrfDropRecords,
        addWasteSchedule,
        updateWasteSchedule,
        deleteWasteSchedule,
        requestBulkWastePickup,
        updateBulkWastePickupStatus,
        deleteBulkWastePickup,
        createCleanUpDrive,
        updateCleanUpDrive,
        deleteCleanUpDrive,
        volunteerForCleanUpDrive,
        verifyVolunteerAttendance,
        cancelVolunteerRegistration,
        reportIllegalDumping,
        updateIllegalDumpingStatus,
        deleteIllegalDumpingReport,
        recordMRFDrop,
        deleteMRFDropRecord,

        skTournaments,
        programs: skTournaments,
        skRegistrations,
        seniorBenefitSchedules,
        assistiveDeviceRequests,
        createSKTournament,
        updateSKTournament,
        deleteSKTournament,
        registerForSKTournament,
        updateSKRegistrationStatus,
        deleteSKRegistration,
        createSeniorBenefitSchedule,
        updateSeniorBenefitSchedule,
        deleteSeniorBenefitSchedule,
        requestAssistiveDevice,
        updateAssistiveDeviceStatus,
        deleteAssistiveDevice,

        pendingFacilitiesCount,
        pendingEquipmentCount,
        pendingHealthAppointmentsCount,
        pendingMedicineCount,
        pendingJobApplicationsCount,
        pendingFinancialAidCount,
        pendingBulkWasteCount,
        pendingIllegalDumpingCount,
        pendingAssistiveCount,
        totalPendingServicesCount,

        isCommunitySupabaseLive,
        isCommunitySyncing,
        refreshCommunityFromSupabase,
      }}
    >
      {children}
    </CommunityServicesContext.Provider>
  );
};

export const useCommunityServices = (): CommunityServicesContextType => {
  const context = useContext(CommunityServicesContext);
  if (!context) {
    throw new Error('useCommunityServices must be used within a CommunityServicesProvider');
  }
  return context;
};
