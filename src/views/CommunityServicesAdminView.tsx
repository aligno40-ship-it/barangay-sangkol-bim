import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { InfoButton } from '../components/InfoButton';
import {
  Building2,
  Stethoscope,
  Briefcase,
  Gift,
  Trash2,
  Sparkles,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  User,
  Phone,
  FileText,
  DollarSign,
  Package,
  Truck,
  Heart,
  Award,
  Trophy,
  ChevronRight,
  Printer,
  ShieldCheck,
  AlertCircle,
  Eye,
  Check,
  X,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
  BadgeCheck,
  Send,
  HelpCircle,
  Pill,
  Syringe,
  Smile,
  Megaphone,
  Paperclip,
  GraduationCap,
  HeartPulse,
  Bell,
} from 'lucide-react';
import { useCommunityServices } from '../context/CommunityServicesContext';
import { useBarangay } from '../context/BarangayContext';
import {
  FacilityReservation,
  EquipmentReservation,
  HealthAppointment,
  MedicineRefillRequest,
  CommunityJobPosting,
  JobApplicationRecord,
  LivelihoodTrainingWorkshop,
  LivelihoodEnrollmentRecord,
  AyudaClaimStub,
  FinancialAssistanceRequest,
  BulkWastePickupRequest,
  BayanihanCleanUpDrive,
  SKTournamentActivity,
  SeniorCitizenBenefitSchedule,
  AssistiveDeviceRequest,
  PharmacyInventoryItem,
  HealthOutreachMission,
  VitalSigns,
} from '../types/residentServices';
import {
  JobPostingModal,
  LivelihoodTrainingModal,
  AyudaDistributionModal,
  BayanihanCleanUpModal,
  SKTournamentModal,
  SeniorBenefitModal,
  PrintSlipModal,
} from '../components/community/CommunityModals';
import { AttachedDocumentModal, DocumentViewerData } from '../components/community/AttachedDocumentModal';
import {
  HealthPrintDocumentModal,
  HealthPrintDocType,
} from '../components/health/HealthPrintDocumentModal';
import { TriageVitalsModal } from '../components/health/TriageVitalsModal';
import { PharmacyInventoryModal } from '../components/health/PharmacyInventoryModal';
import { HealthMissionModal } from '../components/health/HealthMissionModal';
import { HealthInventoryTab } from '../components/health/HealthInventoryTab';
import { HealthPatientHistoryTab } from '../components/health/HealthPatientHistoryTab';
import { HealthDispensingTab } from '../components/health/HealthDispensingTab';
import { HealthConsultationsTab } from '../components/health/HealthConsultationsTab';
import { HealthOutreachTab } from '../components/health/HealthOutreachTab';
import { SolidWasteAdminView } from '../components/solidwaste/SolidWasteAdminView';

type ServiceDeskTab =
  | 'facilities'
  | 'health'
  | 'trabaho'
  | 'ayuda'
  | 'solidwaste'
  | 'youth_senior';

export const CommunityServicesAdminView: React.FC = () => {
  const { currentUser, residents, settings, arePuroksMatching } = useBarangay();
  const {
    facilityReservations,
    equipmentReservations,
    updateFacilityReservationStatus,
    deleteFacilityReservation,
    updateEquipmentReservationStatus,
    deleteEquipmentReservation,

    healthAppointments,
    medicineRefillRequests,
    childImmunizations,
    pharmacyInventory = [],
    healthMissions = [],
    updateHealthAppointmentStatus,
    recordTriageVitals,
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

    jobPostings,
    jobApplications,
    livelihoodTrainings,
    livelihoodEnrollments,
    addJobPosting,
    updateJobPosting,
    deleteJobPosting,
    updateJobApplicationStatus,
    addLivelihoodTraining,
    updateLivelihoodTraining,
    deleteLivelihoodTraining,
    updateLivelihoodEnrollmentStatus,

    ayudaClaims,
    financialAssistanceRequests,
    createAyudaDistribution,
    updateAyudaClaimStatus,
    updateFinancialAssistanceStatus,

    wasteSchedules,
    bulkWasteRequests,
    cleanUpDrives,
    cleanUpVolunteers,
    updateWasteSchedule,
    updateBulkWastePickupStatus,
    createCleanUpDrive,
    verifyVolunteerAttendance,

    skTournaments,
    skRegistrations,
    seniorBenefitSchedules,
    assistiveDeviceRequests,
    createSKTournament,
    updateSKTournament,
    deleteSKTournament,
    updateSKRegistrationStatus,
    deleteSKRegistration,
    createSeniorBenefitSchedule,
    updateSeniorBenefitSchedule,
    deleteSeniorBenefitSchedule,
    updateAssistiveDeviceStatus,

    pendingFacilitiesCount,
    pendingEquipmentCount,
    pendingMedicineCount,
    pendingJobApplicationsCount,
    pendingFinancialAidCount,
    pendingBulkWasteCount,
    pendingAssistiveCount,
    totalPendingServicesCount,
    activeServiceDeskTab: activeTab,
    setActiveServiceDeskTab: setActiveTab,
    targetServiceId,
    setTargetServiceId,
  } = useCommunityServices();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('All');
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState('');
  const [facilityFilter, setFacilityFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Health Desk Admin State
  const [healthSubTab, setHealthSubTab] = useState<
    'inventory' | 'patient_history' | 'dispensary' | 'consultations' | 'outreach'
  >('inventory');
  const [selectedApptForTriage, setSelectedApptForTriage] = useState<HealthAppointment | null>(null);
  const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);
  const [pharmacyItemToEdit, setPharmacyItemToEdit] = useState<PharmacyInventoryItem | null>(null);
  const [isHealthMissionModalOpen, setIsHealthMissionModalOpen] = useState(false);
  const [healthMissionToEdit, setHealthMissionToEdit] = useState<HealthOutreachMission | null>(null);
  const [healthPrintDoc, setHealthPrintDoc] = useState<HealthPrintDocType | null>(null);
  const [pharmacyAdminSearch, setPharmacyAdminSearch] = useState('');

  // Modals
  const [selectedFacilityForReview, setSelectedFacilityForReview] = useState<FacilityReservation | null>(null);
  const [selectedEquipmentForReview, setSelectedEquipmentForReview] = useState<EquipmentReservation | null>(null);
  const [selectedMedicineForReview, setSelectedMedicineForReview] = useState<MedicineRefillRequest | null>(null);
  const [selectedAICSForReview, setSelectedAICSForReview] = useState<FinancialAssistanceRequest | null>(null);
  const [selectedBulkWasteForReview, setSelectedBulkWasteForReview] = useState<BulkWastePickupRequest | null>(null);
  const [selectedAssistiveForReview, setSelectedAssistiveForReview] = useState<AssistiveDeviceRequest | null>(null);

  // Creation Modals
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isAyudaModalOpen, setIsAyudaModalOpen] = useState(false);
  const [isCleanUpModalOpen, setIsCleanUpModalOpen] = useState(false);
  const [isSKModalOpen, setIsSKModalOpen] = useState(false);
  const [isSeniorModalOpen, setIsSeniorModalOpen] = useState(false);

  // Print Slip state
  const [printData, setPrintData] = useState<{ title: string; subtitle: string; content: React.ReactNode } | null>(null);
  // Attached Document Viewer Modal State
  const [docViewerData, setDocViewerData] = useState<DocumentViewerData | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Job Form State
  const [jobForm, setJobForm] = useState({
    title: '',
    employerName: '',
    location: `${settings.barangayName}, ${settings.municipality}`,
    employmentType: 'Full-Time' as CommunityJobPosting['employmentType'],
    salaryRange: '₱14,000 - ₱18,000 / month',
    vacancies: 3,
    description: '',
    qualificationsText: 'High school or vocational graduate\nGood communication skills\nResident of Barangay',
    contactPerson: settings.punongBarangay,
    contactNumber: settings.contactNumber,
    deadlineDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
  });

  // Training Form State
  const [trainingForm, setTrainingForm] = useState({
    title: '',
    partnerAgency: 'TESDA Accredited' as LivelihoodTrainingWorkshop['partnerAgency'],
    slotsTotal: 30,
    schedule: 'Saturdays & Sundays (08:00 AM - 04:00 PM)',
    duration: '40 Hours (5 Days Course)',
    venue: `${settings.barangayName} Multi-Purpose Training Hall`,
    starterKitProvided: true,
    trainerName: 'Certified TESDA NC-II Instructor',
    description: '',
    qualifications: 'Open to all unemployed or underemployed residents aged 18+',
    startDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'Open for Registration' as LivelihoodTrainingWorkshop['status'],
  });

  // Ayuda Campaign Form State
  const [ayudaForm, setAyudaForm] = useState({
    title: '',
    category: 'Calamity Relief Goods Pack' as AyudaClaimStub['category'],
    targetPurok: 'All Puroks',
    claimLocation: `${settings.barangayName} Multi-Purpose Gymnasium`,
    distributionDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    timeSlot: '08:00 AM - 04:00 PM',
    itemsIncludedText: '5kg NFA Premium Rice\n4 Cans Corned Beef & Sardines\n1 Box Family Evaporated Milk\n1 Pack Instant Noodles & Coffee',
  });

  // CleanUp Drive Form State
  const [cleanUpForm, setCleanUpForm] = useState({
    title: 'Oplan Linis Estero & Purok Coastal Clean-Up',
    purokTarget: 'Purok Mangga',
    activityDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    assemblyTime: '06:00 AM',
    assemblyPoint: 'Purok Mangga Chapel Outpost',
    expectedVolunteers: 40,
    coordinator: 'Kagawad on Environmental Protection',
    description: 'Community-wide clearing of drainage waterways and coastal trash removal.',
    equipmentProvidedText: 'Heavy Duty Gloves, Trash Bags, Rakes, Wheelbarrows, Free Hydration & Snacks',
    status: 'Upcoming' as BayanihanCleanUpDrive['status'],
  });

  // SK Activity Form State
  const [skForm, setSkForm] = useState({
    title: 'Inter-Purok Summer Basketball Championship',
    category: 'Inter-Purok Basketball League (Junior Division)' as SKTournamentActivity['category'],
    targetAgeGroup: '15 - 30 Years Old (SK Registered Youth)' as SKTournamentActivity['targetAgeGroup'],
    scheduleDates: 'Sept 15 - Oct 15, 2026',
    venue: `${settings.barangayName} Covered Gymnasium`,
    prizes: 'Champion: ₱25,000 + Trophy | 1st Runner-Up: ₱15,000',
    registrationStatus: 'Registration Open' as SKTournamentActivity['registrationStatus'],
    skContactPerson: 'SK Chairperson',
    contactNumber: settings.contactNumber,
  });

  // Senior Benefit Form State
  const [seniorForm, setSeniorForm] = useState({
    title: 'Quarterly OSCA Social Pension & Birthday Cash Gift Payout',
    category: 'LGU Quarterly Birthday Cash Gift (P1,000)' as SeniorCitizenBenefitSchedule['category'],
    purokCoverage: 'All Puroks (Senior Registered Masterlist)',
    distributionDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    venue: `${settings.barangayName} Session Hall`,
    requirementsText: 'Valid OSCA Senior ID\nPurchase Booklet / Barangay Certificate of Indigency (if claiming rep)',
    status: 'Upcoming Release' as SeniorCitizenBenefitSchedule['status'],
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-sm font-semibold"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner with Official Authority Badge */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Administrative Desk Control
              </span>
              {totalPendingServicesCount > 0 && (
                <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {totalPendingServicesCount} Action Items Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Community Services & Frontline Desks
              </h1>
              <InfoButton
                title="Community Services Desk"
                info="Official command center for Punong Barangay and Committee Officers to publish verified public programs, manage property & venue reservations, approve health center consultations & medicine refills, coordinate PESO job postings, schedule Ayuda relief distribution, and dispatch solid waste crews."
                variant="light"
                size="md"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-right">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Logged Authority</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{currentUser.name}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{currentUser.role} Desk</p>
            </div>
          </div>
        </div>

        {/* Quick Service Desk Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          <button
            onClick={() => {
              setActiveTab('facilities');
              setStatusFilter('All');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'facilities'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Facilities & Equipment</span>
            {(pendingFacilitiesCount > 0 || pendingEquipmentCount > 0) && (
              <span className="w-5 h-5 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center">
                {pendingFacilitiesCount + pendingEquipmentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('health');
              setStatusFilter('All');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'health'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Health & Pharmacy Desk</span>
            {pendingMedicineCount > 0 && (
              <span className="w-5 h-5 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center">
                {pendingMedicineCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('trabaho');
              setStatusFilter('All');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'trabaho'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>PESO Trabaho & Livelihood</span>
            {pendingJobApplicationsCount > 0 && (
              <span className="w-5 h-5 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center">
                {pendingJobApplicationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('ayuda');
              setStatusFilter('All');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ayuda'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Ayuda, Relief & Financial Aid</span>
            {pendingFinancialAidCount > 0 && (
              <span className="w-5 h-5 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center">
                {pendingFinancialAidCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('solidwaste');
              setStatusFilter('All');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'solidwaste'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Solid Waste & Clean-Up</span>
            {pendingBulkWasteCount > 0 && (
              <span className="w-5 h-5 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center">
                {pendingBulkWasteCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('youth_senior');
              setStatusFilter('All');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'youth_senior'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>SK Youth & Senior/PWD</span>
            {pendingAssistiveCount > 0 && (
              <span className="w-5 h-5 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center">
                {pendingAssistiveCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= TAB 1: FACILITIES & EQUIPMENT CUSTODIAN DESK ================= */}
      {activeTab === 'facilities' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Facility Bookings</span>
                <Building2 className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{facilityReservations.length}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                {pendingFacilitiesCount} Pending Approval
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Equipment Loans</span>
                <Package className="w-5 h-5 text-sky-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{equipmentReservations.length}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {equipmentReservations.filter((e) => e.status === 'Released / In Use').length} In Active Use
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Approved Facilities</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {facilityReservations.filter((f) => f.status === 'Approved').length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Calendar Cleared</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Property Custodian</span>
                <ShieldCheck className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">{settings.punongBarangay}</p>
              <p className="text-xs text-slate-500">Authorized Signatory & Custodian</p>
            </div>
          </div>

          {/* Facility Bookings Queue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  Barangay Venues & Public Facility Reservation Queue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review and authorize resident booking requests for Gym, Session Hall, Park Stage, and Covered Court.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter Pills */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                  {['All', 'Pending Review', 'Approved', 'Completed', 'Rejected'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFacilityFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        facilityFilter === st
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {st === 'All' ? `All (${facilityReservations.length})` : st}
                    </button>
                  ))}
                </div>

                <RecentSearchesInput
                  className="w-48 sm:w-56"
                  placeholder="Search venue, resident, event..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  storageKey="facility_reservations"
                  theme="light"
                  inputClassName="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Control No. & Venue</th>
                    <th className="p-3.5">Reserved By / Purok</th>
                    <th className="p-3.5">Event Title & Purpose</th>
                    <th className="p-3.5">Schedule</th>
                    <th className="p-3.5">Fee</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Actions & Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {facilityReservations
                    .filter((f) => {
                      if (facilityFilter !== 'All' && f.status !== facilityFilter) return false;
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      const facName = (f.facilityName || '').toLowerCase();
                      const resName = (f.residentName || '').toLowerCase();
                      const evTitle = (f.eventTitle || '').toLowerCase();
                      const facId = (f.id || '').toLowerCase();
                      const purok = (f.purok || '').toLowerCase();
                      return (
                        facName.includes(q) ||
                        resName.includes(q) ||
                        evTitle.includes(q) ||
                        facId.includes(q) ||
                        purok.includes(q)
                      );
                    })
                    .map((fac) => (
                      <tr key={fac.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 pl-5">
                          <p className="font-mono text-[10px] text-slate-400 font-bold">{fac.id}</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{fac.facilityName}</p>
                          <p className="text-[10px] text-slate-400">Filed: {fac.createdAt}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{fac.residentName}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {fac.contactNumber} ({fac.purok})
                          </p>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <p className="font-bold text-indigo-600 dark:text-indigo-400 truncate">{fac.eventTitle}</p>
                          <p className="text-slate-500 text-[11px] truncate">{fac.purpose}</p>
                          <p className="text-[10px] text-slate-400">~{fac.expectedAttendees} expected guests</p>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">{fac.date}</p>
                          <p className="text-[11px] text-slate-400">
                            {fac.startTime} - {fac.endTime}
                          </p>
                        </td>
                        <td className="p-3.5 font-bold">
                          {fac.fee > 0 ? `₱${fac.fee.toLocaleString()}` : <span className="text-emerald-600 font-medium">Free (Gov/Purok)</span>}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              fac.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : fac.status === 'Pending Review'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                                : fac.status === 'Completed'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {fac.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {fac.status === 'Pending Review' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateFacilityReservationStatus(fac.id, 'Approved', 'Approved by Punong Barangay.');
                                    showToast(`Approved booking #${fac.id} for ${fac.residentName}.`);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateFacilityReservationStatus(fac.id, 'Rejected', 'Schedule conflict with barangay activity.');
                                    showToast(`Rejected reservation #${fac.id}.`);
                                  }}
                                  className="px-2 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200 rounded-lg font-bold text-[11px] cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {fac.status === 'Approved' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateFacilityReservationStatus(fac.id, 'Completed', 'Event concluded cleanly.');
                                  showToast(`Facility booking #${fac.id} marked as Completed.`);
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete
                              </button>
                            )}
                            {/* Universal Print Facility Permit Slip */}
                            <button
                              type="button"
                              onClick={() => {
                                setPrintData({
                                  title: 'BARANGAY PUBLIC FACILITY USAGE PERMIT & CLEARANCE',
                                  subtitle: `Control No: ${fac.id} | Office of the Punong Barangay - Barangay Sangkol`,
                                  content: (
                                    <div className="space-y-4 text-xs">
                                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                        <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200">
                                          <p><span className="font-bold">Permittee / Applicant:</span> {fac.residentName}</p>
                                          <p><span className="font-bold">Purok / Address:</span> {fac.purok}</p>
                                          <p><span className="font-bold">Contact Number:</span> {fac.contactNumber}</p>
                                          <p><span className="font-bold">Application Date:</span> {fac.createdAt}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                          <p><span className="font-bold">Approved Facility:</span> <span className="text-indigo-700 font-bold">{fac.facilityName}</span></p>
                                          <p><span className="font-bold">Event Title:</span> {fac.eventTitle}</p>
                                          <p><span className="font-bold">Approved Date:</span> {fac.date}</p>
                                          <p><span className="font-bold">Permitted Hours:</span> {fac.startTime} to {fac.endTime}</p>
                                          <p><span className="font-bold">Expected Attendees:</span> ~{fac.expectedAttendees} persons</p>
                                          <p><span className="font-bold">Rental / Maintenance Fee:</span> {fac.fee > 0 ? `₱${fac.fee.toLocaleString()}` : 'Free (Barangay / Purok Policy)'}</p>
                                          <p className="col-span-2"><span className="font-bold">Event Purpose:</span> {fac.purpose}</p>
                                          <p><span className="font-bold">Permit Status:</span> <span className="uppercase font-bold text-emerald-700">{fac.status}</span></p>
                                          <p><span className="font-bold">Approving Official:</span> {settings.punongBarangay}</p>
                                        </div>
                                      </div>
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed space-y-1">
                                        <p className="font-bold">TERMS & CONDITIONS OF VENUE USAGE:</p>
                                        <p>1. The organizer shall observe waste segregation and leave the premises clean immediately after use.</p>
                                        <p>2. Loud music and sound systems must adhere to local peace and order ordinances (curfew 10:00 PM).</p>
                                        <p>3. Any structural damage to facility fixtures, backboards, or lighting shall be indemnified by the applicant.</p>
                                      </div>
                                      <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                                        <div className="border-t border-slate-400 pt-1">
                                          <p className="font-bold text-slate-800">{fac.residentName}</p>
                                          <p className="text-[10px] text-slate-500">Applicant / Event Organizer Signature</p>
                                        </div>
                                        <div className="border-t border-slate-400 pt-1">
                                          <p className="font-bold text-slate-800">{settings.punongBarangay}</p>
                                          <p className="text-[10px] text-slate-500">Punong Barangay / Authorized Official</p>
                                        </div>
                                      </div>
                                    </div>
                                  ),
                                });
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              title="Print Facility Permit Slip"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print Permit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Equipment Inventory Stock Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                name: 'Canopy Tents (Tolda)',
                total: 6,
                loaned: equipmentReservations
                  .filter((e) => e.equipmentName === 'Heavy Duty Canopy Tent (Tolda)' && (e.status === 'Released / In Use' || e.status === 'Approved'))
                  .reduce((acc, curr) => acc + curr.quantity, 0),
                unit: 'units',
              },
              {
                name: 'Monobloc Chairs',
                total: 8,
                loaned: equipmentReservations
                  .filter((e) => e.equipmentName === 'Monobloc Chairs Set (50 pcs)' && (e.status === 'Released / In Use' || e.status === 'Approved'))
                  .reduce((acc, curr) => acc + curr.quantity, 0),
                unit: 'sets (50s)',
              },
              {
                name: 'Banquet Tables',
                total: 5,
                loaned: equipmentReservations
                  .filter((e) => e.equipmentName === 'Foldable Banquet Tables (5 pcs)' && (e.status === 'Released / In Use' || e.status === 'Approved'))
                  .reduce((acc, curr) => acc + curr.quantity, 0),
                unit: 'sets (5s)',
              },
              {
                name: 'PA Sound System',
                total: 2,
                loaned: equipmentReservations
                  .filter((e) => e.equipmentName === 'Public Address (PA) Sound System' && (e.status === 'Released / In Use' || e.status === 'Approved'))
                  .reduce((acc, curr) => acc + curr.quantity, 0),
                unit: 'systems',
              },
              {
                name: 'Electric Generator',
                total: 1,
                loaned: equipmentReservations
                  .filter((e) => e.equipmentName === 'Mobile Electric Generator (5kVA)' && (e.status === 'Released / In Use' || e.status === 'Approved'))
                  .reduce((acc, curr) => acc + curr.quantity, 0),
                unit: 'unit',
              },
              {
                name: 'Grass Cutters',
                total: 2,
                loaned: equipmentReservations
                  .filter((e) => e.equipmentName === 'Heavy Duty Grass Cutter' && (e.status === 'Released / In Use' || e.status === 'Approved'))
                  .reduce((acc, curr) => acc + curr.quantity, 0),
                unit: 'units',
              },
            ].map((item, idx) => {
              const available = Math.max(0, item.total - item.loaned);
              return (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</p>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {available} <span className="text-[10px] font-normal text-slate-400">/ {item.total}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${available > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-700'}`}>
                      {available > 0 ? 'Available' : 'All Out'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {item.loaned} {item.unit} in active loan
                  </p>
                </div>
              );
            })}
          </div>

          {/* Equipment Inventory & Borrowing Custodian Ledger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-sky-500" />
                  Barangay Property Custodian Ledger & Equipment Gate Pass Roster
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full accountability log of borrowed canopy tents (tolda), sound systems, generators, and chairs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Equipment Status Filters */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                  {['All', 'Pending Review', 'Approved', 'Released / In Use', 'Returned'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEquipmentFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        equipmentFilter === st
                          ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {st === 'All' ? `All (${equipmentReservations.length})` : st}
                    </button>
                  ))}
                </div>

                <RecentSearchesInput
                  className="w-48 sm:w-56"
                  placeholder="Search borrower, item, ID..."
                  value={equipmentSearchQuery}
                  onChange={setEquipmentSearchQuery}
                  storageKey="equipment_reservations"
                  theme="light"
                  inputClassName="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Control No. & Equipment</th>
                    <th className="p-3.5">Borrower Details</th>
                    <th className="p-3.5">Borrow / Return Schedule</th>
                    <th className="p-3.5">Purpose & Location</th>
                    <th className="p-3.5">Custodian Condition Notes</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Custodian Actions & Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {equipmentReservations
                    .filter((eq) => {
                      if (equipmentFilter !== 'All' && eq.status !== equipmentFilter) return false;
                      if (!equipmentSearchQuery) return true;
                      const q = equipmentSearchQuery.toLowerCase();
                      const eqName = (eq.equipmentName || '').toLowerCase();
                      const resName = (eq.residentName || '').toLowerCase();
                      const eqId = (eq.id || '').toLowerCase();
                      const purok = (eq.purok || '').toLowerCase();
                      const purpose = (eq.purpose || '').toLowerCase();
                      return (
                        eqName.includes(q) ||
                        resName.includes(q) ||
                        eqId.includes(q) ||
                        purok.includes(q) ||
                        purpose.includes(q)
                      );
                    })
                    .map((eq) => (
                      <tr key={eq.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 pl-5">
                          <p className="font-mono text-[10px] text-slate-400 font-bold">{eq.id}</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{eq.equipmentName}</p>
                          <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">Qty: {eq.quantity} unit(s)</p>
                          <p className="text-[10px] text-slate-400">Filed: {eq.createdAt}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{eq.residentName}</p>
                          <p className="text-[11px] text-slate-500">{eq.contactNumber}</p>
                          <span className="inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 rounded mt-0.5">
                            {eq.purok}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <p className="text-slate-700 dark:text-slate-300 font-medium">Out: {eq.borrowDate}</p>
                          <p className="text-slate-500 text-[11px]">Due: {eq.returnDate}</p>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <p className="text-slate-700 dark:text-slate-300 font-medium truncate">{eq.purpose}</p>
                          <p className="text-[10px] text-slate-400">Deposit: {eq.depositAmount > 0 ? `₱${eq.depositAmount.toLocaleString()}` : 'Waived'}</p>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          {eq.conditionOnRelease && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                              <span className="font-bold text-slate-700 dark:text-slate-300">Release:</span> {eq.conditionOnRelease}
                            </p>
                          )}
                          {eq.conditionOnReturn && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              <span className="font-bold">Return:</span> {eq.conditionOnReturn}
                            </p>
                          )}
                          {!eq.conditionOnRelease && !eq.conditionOnReturn && (
                            <span className="text-[11px] text-slate-400 italic">Pending inspection</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              eq.status === 'Released / In Use'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300'
                                : eq.status === 'Returned'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : eq.status === 'Approved'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300'
                                : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                            }`}
                          >
                            {eq.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {eq.status === 'Pending Review' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateEquipmentReservationStatus(eq.id, 'Approved', 'Approved for custodian release upon verification of borrower ID.');
                                    showToast(`Approved equipment loan #${eq.id} for ${eq.residentName}. Saved in Custodian Ledger.`);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateEquipmentReservationStatus(eq.id, 'Rejected', 'Item currently undergoing maintenance / reserved for official barangay event.');
                                    showToast(`Rejected equipment request #${eq.id}.`);
                                  }}
                                  className="px-2 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200 rounded-lg font-bold text-[11px] cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {eq.status === 'Approved' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateEquipmentReservationStatus(eq.id, 'Released / In Use', 'Inspected clean, functional, and complete with all standard accessories.');
                                  showToast(`Equipment #${eq.id} marked as Released to borrower.`);
                                }}
                                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Package className="w-3 h-3" /> Mark Released
                              </button>
                            )}
                            {eq.status === 'Released / In Use' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateEquipmentReservationStatus(eq.id, 'Returned', 'Returned in complete and good working condition. Received and verified by Property Custodian.');
                                  showToast(`Equipment #${eq.id} successfully checked in as Returned.`);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Mark Returned
                              </button>
                            )}

                            {/* Official Property Custodian Print Gate Pass & Agreement Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setPrintData({
                                  title: 'BARANGAY PROPERTY CUSTODIAN LOAN AGREEMENT & GATE PASS',
                                  subtitle: `Control No: ${eq.id} | Barangay Sangkol Property & Logistics Office`,
                                  content: (
                                    <div className="space-y-4 text-xs">
                                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                        <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200">
                                          <p><span className="font-bold">Borrower / Requisitioner:</span> {eq.residentName}</p>
                                          <p><span className="font-bold">Purok / Address:</span> {eq.purok}</p>
                                          <p><span className="font-bold">Contact Number:</span> {eq.contactNumber}</p>
                                          <p><span className="font-bold">Requisition Date:</span> {eq.createdAt}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                          <p><span className="font-bold">Equipment Loaned:</span> <span className="text-indigo-700 font-bold">{eq.equipmentName}</span></p>
                                          <p><span className="font-bold">Quantity:</span> {eq.quantity} unit(s)</p>
                                          <p><span className="font-bold">Borrow Release Date:</span> {eq.borrowDate}</p>
                                          <p><span className="font-bold">Expected Return Due Date:</span> {eq.returnDate}</p>
                                          <p className="col-span-2"><span className="font-bold">Purpose / Event:</span> {eq.purpose}</p>
                                          <p className="col-span-2"><span className="font-bold">Custodian Handover Condition:</span> {eq.conditionOnRelease || 'Inspected complete and undamaged upon physical release.'}</p>
                                          {eq.conditionOnReturn && (
                                            <p className="col-span-2"><span className="font-bold">Return Inspection Log:</span> {eq.conditionOnReturn}</p>
                                          )}
                                          <p><span className="font-bold">Accountability Status:</span> <span className="uppercase font-bold text-emerald-700">{eq.status}</span></p>
                                          <p><span className="font-bold">Security Deposit:</span> {eq.depositAmount > 0 ? `₱${eq.depositAmount.toLocaleString()}` : 'Waived (Resident Policy)'}</p>
                                        </div>
                                      </div>

                                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed space-y-1">
                                        <p className="font-bold">BORROWER UNDERTAKING & LIABILITY CLAUSE:</p>
                                        <p>
                                          The undersigned borrower acknowledges receipt of the barangay property described above in good working order and agrees to return the items on or before the agreed return date. The borrower accepts full legal and financial responsibility to safeguard the equipment and to repair or replace any lost, defective, or damaged items in accordance with Barangay Sangkol Property Logistics Regulations.
                                        </p>
                                      </div>

                                      <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs">
                                        <div className="border-t border-slate-400 pt-1">
                                          <p className="font-bold text-slate-800">{eq.residentName}</p>
                                          <p className="text-[10px] text-slate-500">Borrower Signature</p>
                                        </div>
                                        <div className="border-t border-slate-400 pt-1">
                                          <p className="font-bold text-slate-800">Property Custodian</p>
                                          <p className="text-[10px] text-slate-500">Barangay Logistics Officer</p>
                                        </div>
                                        <div className="border-t border-slate-400 pt-1">
                                          <p className="font-bold text-slate-800">{settings.punongBarangay}</p>
                                          <p className="text-[10px] text-slate-500">Punong Barangay</p>
                                        </div>
                                      </div>
                                    </div>
                                  ),
                                });
                              }}
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              title="Print Equipment Gate Pass & Loan Slip"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print Gate Pass
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: HEALTH CENTER & PHARMACY DESK ================= */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Clinical Consultations</span>
                <Stethoscope className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{healthAppointments.length}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Doctor & Midwife Active</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Botika Inventory</span>
                <Pill className="w-5 h-5 text-cyan-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{pharmacyInventory.length} SKUs</p>
              <p className="text-xs text-rose-600 font-semibold mt-1">
                {pharmacyInventory.filter((p) => p.stockQuantity <= p.minimumThreshold).length} Low Stock Alert(s)
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Medicine Refills</span>
                <Package className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{medicineRefillRequests.length}</p>
              <p className="text-xs text-amber-600 font-semibold mt-1">
                {pendingMedicineCount} Pending Dispensing
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Outreach Missions</span>
                <Heart className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{healthMissions.length}</p>
              <p className="text-xs text-purple-600 font-semibold mt-1">Community Caravans</p>
            </div>
          </div>

          {/* Health Desk Real-time Action Notifications */}
          {(healthAppointments.filter((h) => h.status === 'Pending Triage' || h.status === 'Triage Recorded').length > 0 || pendingMedicineCount > 0) && (
            <div className="p-4 bg-linear-to-r from-teal-50 via-cyan-50 to-emerald-50 dark:from-teal-950/40 dark:via-cyan-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Health Desk Live Station Notifications</span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-full">
                      {healthAppointments.filter((h) => h.status === 'Pending Triage' || h.status === 'Triage Recorded').length + pendingMedicineCount} Action Items
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    {healthAppointments.filter((h) => h.status === 'Pending Triage' || h.status === 'Triage Recorded').length > 0 &&
                      `${healthAppointments.filter((h) => h.status === 'Pending Triage' || h.status === 'Triage Recorded').length} consultation(s) queued for clinical triage. `}
                    {pendingMedicineCount > 0 &&
                      `${pendingMedicineCount} prescription(s) pending dispensary verification.`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {healthAppointments.filter((h) => h.status === 'Pending Triage' || h.status === 'Triage Recorded').length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHealthSubTab('consultations')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Triage Consultations ({healthAppointments.filter((h) => h.status === 'Pending Triage' || h.status === 'Triage Recorded').length})
                  </button>
                )}
                {pendingMedicineCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setHealthSubTab('dispensary')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Dispense Rx ({pendingMedicineCount})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Health Desk Sub-Navigation */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto gap-2">
            <div className="flex items-center gap-2 min-w-max">
              <button
                type="button"
                onClick={() => setHealthSubTab('inventory')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  healthSubTab === 'inventory'
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Botika Inventory</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                  {pharmacyInventory.length} Items
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHealthSubTab('patient_history')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  healthSubTab === 'patient_history'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
                <span>Patient Medical History</span>
              </button>

              <button
                type="button"
                onClick={() => setHealthSubTab('dispensary')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  healthSubTab === 'dispensary'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Pill className="w-4 h-4" />
                <span>Dispensing Records</span>
                {pendingMedicineCount > 0 ? (
                  <span className="min-w-[20px] h-5 px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0 animate-pulse">
                    {pendingMedicineCount} Pending
                  </span>
                ) : medicineRefillRequests.length > 0 ? (
                  <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0">
                    {medicineRefillRequests.length}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setHealthSubTab('consultations')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  healthSubTab === 'consultations'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Consultations & Triage</span>
                {healthAppointments.filter((h) => h.status === 'Pending Triage' || h.status === 'Triage Recorded').length > 0 ? (
                  <span className="min-w-[20px] h-5 px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0 animate-pulse">
                    {healthAppointments.filter((h) => h.status === 'Pending Triage' || h.status === 'Triage Recorded').length} Pending
                  </span>
                ) : healthAppointments.length > 0 ? (
                  <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0">
                    {healthAppointments.length}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setHealthSubTab('outreach')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  healthSubTab === 'outreach'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Outreach & Immunizations</span>
                <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-bold rounded-md">
                  {healthMissions.length}
                </span>
              </button>
            </div>
          </div>

          {/* 1. BOTIKA INVENTORY TAB */}
          {healthSubTab === 'inventory' && (
            <HealthInventoryTab
              inventory={pharmacyInventory}
              mode="admin"
              onAddMedicine={() => {
                setPharmacyItemToEdit(null);
                setIsPharmacyModalOpen(true);
              }}
              onEditMedicine={(item) => {
                setPharmacyItemToEdit(item);
                setIsPharmacyModalOpen(true);
              }}
              onDeleteMedicine={(id, name) => {
                if (confirm(`Remove ${name} from inventory?`)) {
                  deletePharmacyItem(id);
                  showToast(`Removed ${name} from inventory.`);
                }
              }}
              onRestockMedicine={(id, qty, name) => {
                restockPharmacyItem(id, qty);
                showToast(`Restocked +${qty} units of ${name}.`);
              }}
            />
          )}

          {/* 2. PATIENT MEDICAL HISTORY TAB */}
          {healthSubTab === 'patient_history' && (
            <HealthPatientHistoryTab
              mode="admin"
              appointments={healthAppointments}
              medicineRequests={medicineRefillRequests}
              immunizations={childImmunizations}
              inventory={pharmacyInventory}
              allResidents={residents.map((r) => ({
                id: r.id,
                name: `${r.firstName} ${r.lastName}`,
                purok: r.purok,
                age: r.age,
                contactNumber: r.contactNumber,
                philhealthNo: (r as any).philhealthNo,
                bloodType: (r as any).bloodType,
                allergies: (r as any).allergies,
              }))}
              onOpenTriageModal={(appt) => setSelectedApptForTriage(appt)}
              onPrintDocument={(doc) => setHealthPrintDoc(doc)}
            />
          )}

          {/* 3. DISPENSING RECORDS QUEUE */}
          {healthSubTab === 'dispensary' && (
            <HealthDispensingTab
              requests={medicineRefillRequests}
              inventory={pharmacyInventory}
              mode="admin"
              currentAdminName={currentUser.name}
              onUpdateStatus={(id, status, notes) => {
                updateMedicineRefillStatus(id, status, notes);
              }}
              onPrintDocument={(doc) => setHealthPrintDoc(doc)}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {/* 4. CLINICAL CONSULTATIONS & TRIAGE QUEUE */}
          {healthSubTab === 'consultations' && (
            <HealthConsultationsTab
              appointments={healthAppointments}
              mode="admin"
              onOpenTriageModal={(appt) => setSelectedApptForTriage(appt)}
              onUpdateStatus={(id, status, notes) => {
                updateHealthAppointmentStatus(id, status, notes);
              }}
              onPrintDocument={(doc) => setHealthPrintDoc(doc)}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {/* 5. OUTREACH MISSIONS & IMMUNIZATIONS */}
          {healthSubTab === 'outreach' && (
            <HealthOutreachTab
              missions={healthMissions}
              immunizations={childImmunizations}
              mode="admin"
              residentId={currentUser?.id || 'ADM-001'}
              residentName={currentUser?.name || 'Barangay Official'}
              purok={currentUser?.purok || 'Barangay Hall'}
              onOpenMissionModal={() => {
                setHealthMissionToEdit(null);
                setIsHealthMissionModalOpen(true);
              }}
              onRegisterMission={(missionId, rId, rName) => registerForHealthMission(missionId, rId, rName)}
              onCancelMissionReservation={(missionId, rId, rName) => cancelHealthMissionReservation(missionId, rId, rName)}
              onUpdateImmunizationStatus={(id, status, date, by) => {
                updateChildImmunization(
                  id,
                  status,
                  date,
                  by || `BHW ${currentUser.name}`,
                  'LOT-EPI-2026-B8',
                  'Left Anterolateral Thigh',
                  'Administered safely.'
                );
              }}
              onPrintDocument={(doc) => setHealthPrintDoc(doc)}
              onShowToast={(msg) => showToast(msg)}
            />
          )}
        </div>
      )}

      {/* ================= TAB 3: PESO TRABAHO & LIVELIHOOD DESK ================= */}
      {activeTab === 'trabaho' && (
        <div className="space-y-6">
          {/* Top Admin Action Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Official PESO Employment Desk
              </span>
              <h2 className="text-xl font-black mt-1">Barangay Trabaho & Livelihood Authority</h2>
              <p className="text-xs text-blue-200 mt-1 max-w-2xl">
                All job openings and livelihood skills workshops displayed to residents originate strictly from this administrative desk.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsJobModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Post New Job Opening
              </button>
              <button
                onClick={() => setIsTrainingModalOpen(true)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Open Livelihood Workshop
              </button>
            </div>
          </div>

          {/* Active Job Postings Management */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  Official Job Postings Directory ({jobPostings.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified local companies, cooperatives, and LGU employment opportunities.
                </p>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobPostings.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold rounded-md">
                        {job.employmentType}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${job.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                        {job.isActive ? 'Active Posting' : 'Closed'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-2">{job.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{job.employerName}</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">{job.salaryRange}</p>

                    <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                      <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {job.location}</p>
                      <p className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" /> {job.vacancies} open slot(s)</p>
                      <p className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> Deadline: {job.deadlineDate}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <button
                      onClick={() => updateJobPosting(job.id, { isActive: !job.isActive })}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      {job.isActive ? 'Close Vacancy' : 'Reopen Vacancy'}
                    </button>
                    <button
                      onClick={() => {
                        deleteJobPosting(job.id);
                        showToast(`Removed job posting "${job.title}".`);
                      }}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resident Job Applications Review Queue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Resident Job Applications Received ({jobApplications.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review applicant profiles, educational credentials, attached resumes, and cover letters.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Applicant Resident</th>
                    <th className="p-3.5">Position Applied</th>
                    <th className="p-3.5">Educational Attainment</th>
                    <th className="p-3.5">Attached Credentials</th>
                    <th className="p-3.5">Applied Date</th>
                    <th className="p-3.5">Recruitment Status</th>
                    <th className="p-3.5 pr-5 text-right">PESO Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {jobApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{app.residentName}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {app.contactNumber}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-indigo-600 dark:text-indigo-400">{app.jobTitle}</p>
                        <p className="text-[11px] text-slate-500">{app.employerName}</p>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        <p className="font-medium">{app.educationalAttainment}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{app.workExperience}</p>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {app.resumeFileName ? (
                            <button
                              type="button"
                              onClick={() =>
                                setDocViewerData({
                                  documentType: 'Resume / Bio-Data',
                                  applicantName: app.residentName,
                                  contactNumber: app.contactNumber,
                                  targetTitle: app.jobTitle,
                                  targetCategory: 'Job Application',
                                  employerOrAgency: app.employerName,
                                  appliedDate: app.appliedDate,
                                  fileName: app.resumeFileName,
                                  fileData: app.resumeFileData,
                                  educationalAttainment: app.educationalAttainment,
                                  experienceOrBackground: app.workExperience,
                                })
                              }
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800 transition-colors"
                            >
                              <Paperclip className="w-3 h-3" /> View Resume
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No File</span>
                          )}

                          {(app.applicationLetterFileName || app.applicationLetterText) && (
                            <button
                              type="button"
                              onClick={() =>
                                setDocViewerData({
                                  documentType: 'Application Letter',
                                  applicantName: app.residentName,
                                  contactNumber: app.contactNumber,
                                  targetTitle: app.jobTitle,
                                  targetCategory: 'Job Application',
                                  employerOrAgency: app.employerName,
                                  appliedDate: app.appliedDate,
                                  fileName: app.applicationLetterFileName,
                                  fileData: app.applicationLetterFileData,
                                  letterText: app.applicationLetterText,
                                  educationalAttainment: app.educationalAttainment,
                                  experienceOrBackground: app.workExperience,
                                })
                              }
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-amber-200 dark:border-amber-800 transition-colors"
                            >
                              <FileText className="w-3 h-3" /> View Letter
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-500">{app.appliedDate}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            app.status === 'Hired'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : app.status === 'Invited for Interview'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : app.status === 'Under Review'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <select
                          value={app.status}
                          onChange={(e) => {
                            updateJobApplicationStatus(app.id, e.target.value as JobApplicationRecord['status']);
                            showToast(`Updated applicant ${app.residentName} to ${e.target.value}.`);
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Invited for Interview">Invited for Interview</option>
                          <option value="Hired">Hired</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Livelihood Workshops Management */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-500" />
                  Livelihood & Skills Training Workshops ({livelihoodTrainings.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  TESDA-accredited vocational courses, DTI micro-business seminars, and DA training modules.
                </p>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {livelihoodTrainings.map((trn) => (
                <div
                  key={trn.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                        {trn.partnerAgency}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {trn.slotsAvailable} / {trn.slotsTotal} slots left
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-2">{trn.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{trn.description}</p>

                    <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                      <p className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {trn.schedule}</p>
                      <p className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> Duration: {trn.duration}</p>
                      <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> Venue: {trn.venue}</p>
                      <p className="flex items-center gap-1"><User className="w-3 h-3 text-slate-400" /> Trainer: {trn.trainerName}</p>
                    </div>

                    {trn.starterKitProvided && (
                      <div className="mt-2 p-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Includes Free Starter Toolset & Certification</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Starts: {trn.startDate}</span>
                    <button
                      onClick={() => {
                        deleteLivelihoodTraining(trn.id);
                        showToast(`Removed workshop "${trn.title}".`);
                      }}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resident Livelihood Applications & Enrollees Ledger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  Resident Livelihood Applications & Enrollee Ledger ({livelihoodEnrollments.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review enrolled beneficiaries, uploaded resumes, application letters, and certification completion.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Enrollee Resident</th>
                    <th className="p-3.5">Workshop Program</th>
                    <th className="p-3.5">Background & Goal</th>
                    <th className="p-3.5">Attached Documents</th>
                    <th className="p-3.5">Enrolled Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Livelihood Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {livelihoodEnrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{enr.residentName}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {enr.contactNumber} • {enr.purok}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">{enr.trainingTitle}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{enr.id}</p>
                      </td>
                      <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-300">
                        <p className="font-medium text-[11px]">{enr.educationalBackground || 'High School Level'}</p>
                        <p className="text-[10px] text-slate-500 truncate">{enr.intentReason || enr.currentOccupation || 'Skills upgrading candidate'}</p>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {enr.resumeFileName ? (
                            <button
                              type="button"
                              onClick={() =>
                                setDocViewerData({
                                  documentType: 'Resume / Bio-Data',
                                  applicantName: enr.residentName,
                                  contactNumber: enr.contactNumber,
                                  purok: enr.purok,
                                  targetTitle: enr.trainingTitle,
                                  targetCategory: 'Livelihood Workshop',
                                  appliedDate: enr.enrolledDate,
                                  fileName: enr.resumeFileName,
                                  fileData: enr.resumeFileData,
                                  educationalAttainment: enr.educationalBackground,
                                  experienceOrBackground: enr.intentReason,
                                })
                              }
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800 transition-colors"
                            >
                              <Paperclip className="w-3 h-3" /> View Resume
                            </button>
                          ) : null}

                          {(enr.applicationLetterFileName || enr.applicationLetterText || enr.intentReason) && (
                            <button
                              type="button"
                              onClick={() =>
                                setDocViewerData({
                                  documentType: 'Application Letter',
                                  applicantName: enr.residentName,
                                  contactNumber: enr.contactNumber,
                                  purok: enr.purok,
                                  targetTitle: enr.trainingTitle,
                                  targetCategory: 'Livelihood Workshop',
                                  appliedDate: enr.enrolledDate,
                                  fileName: enr.applicationLetterFileName,
                                  fileData: enr.applicationLetterFileData,
                                  letterText: enr.applicationLetterText || enr.intentReason,
                                  educationalAttainment: enr.educationalBackground,
                                  experienceOrBackground: enr.intentReason,
                                })
                              }
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-emerald-200 dark:border-emerald-800 transition-colors"
                            >
                              <FileText className="w-3 h-3" /> View Letter / Intent
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-500">{enr.enrolledDate}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            enr.status === 'Graduated with Certificate'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : enr.status === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {enr.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <select
                          value={enr.status}
                          onChange={(e) => {
                            updateLivelihoodEnrollmentStatus(enr.id, e.target.value as LivelihoodEnrollmentRecord['status']);
                            showToast(`Updated enrollee ${enr.residentName} to ${e.target.value}.`);
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Waitlisted">Waitlisted</option>
                          <option value="Graduated with Certificate">Graduated with Certificate</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: AYUDA, RELIEF & FINANCIAL ASSISTANCE (AICS) ================= */}
      {activeTab === 'ayuda' && (
        <div className="space-y-6">
          {/* Top Admin Action Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-950 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Social Welfare & Relief Distribution
              </span>
              <h2 className="text-xl font-black mt-1">Ayuda & Emergency Financial Aid (AICS) Desk</h2>
              <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
                Create food pack distribution waves, issue QR claim stubs for target puroks, and approve medical/burial cash assistance.
              </p>
            </div>

            <button
              onClick={() => setIsAyudaModalOpen(true)}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Launch New Ayuda Distribution Wave
            </button>
          </div>

          {/* Ayuda QR Claim Passes Ledger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-500" />
                  Ayuda Claim Passes & Beneficiary Ledger ({ayudaClaims.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify digital claim QR codes and mark relief packages as Claimed & Released.
                </p>
              </div>

              <div className="text-xs font-semibold text-slate-500">
                Claimed:{' '}
                <span className="font-bold text-emerald-600">
                  {ayudaClaims.filter((a) => a.status === 'Claimed / Released').length} / {ayudaClaims.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Claim Pass ID & Campaign</th>
                    <th className="p-3.5">Beneficiary / Purok</th>
                    <th className="p-3.5">Distribution Schedule</th>
                    <th className="p-3.5">Claim Location</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Staff Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ayudaClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-mono text-[10px] text-slate-400 font-bold">{claim.id}</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{claim.title}</p>
                        <p className="text-[11px] text-emerald-600 font-semibold">{claim.category}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{claim.residentName}</p>
                        <p className="text-[11px] text-slate-500">{claim.purok}</p>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{claim.distributionDate}</p>
                        <p className="text-[11px] text-slate-400">{claim.timeSlot}</p>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{claim.claimLocation}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            claim.status === 'Claimed / Released'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        {claim.status === 'Available to Claim' ? (
                          <button
                            onClick={() => {
                              updateAyudaClaimStatus(claim.id, 'Claimed / Released', currentUser.name);
                              showToast(`Ayuda #${claim.id} marked as Claimed by ${claim.residentName}.`);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Check className="w-3.5 h-3.5" /> Mark Claimed
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">Released ({claim.releasedBy})</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Emergency Financial Assistance (AICS) Queue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Emergency Financial Assistance (AICS) Applications
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review medical, hospitalization, burial, and calamity financial aid requests.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Control No. & Assistance Type</th>
                    <th className="p-3.5">Applicant / Beneficiary</th>
                    <th className="p-3.5">Amount Requested</th>
                    <th className="p-3.5">Justification</th>
                    <th className="p-3.5">Assessment Status</th>
                    <th className="p-3.5 pr-5 text-right">Admin Payout Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {financialAssistanceRequests.map((aics) => (
                    <tr key={aics.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-mono text-[10px] text-slate-400 font-bold">{aics.id}</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{aics.assistanceType}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{aics.residentName}</p>
                        <p className="text-[11px] text-slate-500">For: {aics.beneficiaryName} ({aics.purok})</p>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-600 text-sm">
                        ₱{aics.amountRequested.toLocaleString()}
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-slate-600 dark:text-slate-400">{aics.justification}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            aics.status === 'Disbursed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : aics.status === 'Approved for Payout'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {aics.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {aics.status === 'Application Submitted' && (
                            <button
                              onClick={() => {
                                updateFinancialAssistanceStatus(aics.id, 'Approved for Payout', aics.amountRequested);
                                showToast(`Approved AICS #${aics.id} for ₱${aics.amountRequested.toLocaleString()}`);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                            >
                              Approve Payout
                            </button>
                          )}
                          {aics.status === 'Approved for Payout' && (
                            <button
                              onClick={() => {
                                updateFinancialAssistanceStatus(aics.id, 'Disbursed', aics.disbursedAmount || aics.amountRequested);
                                showToast(`Disbursed cash assistance for AICS #${aics.id}.`);
                              }}
                              className="px-2.5 py-1 bg-sky-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <DollarSign className="w-3 h-3" /> Mark Disbursed
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: SOLID WASTE & ENVIRONMENTAL CLEAN-UP ================= */}
      {activeTab === 'solidwaste' && (
        <SolidWasteAdminView />
      )}

      {/* ================= TAB 6: SK YOUTH & SENIOR/PWD AFFAIRS ================= */}
      {activeTab === 'youth_senior' && (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-950 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold uppercase tracking-wider text-purple-200">
                SK Youth Council & OSCA Senior Affairs
              </span>
              <h2 className="text-xl font-black mt-1">SK Youth & Senior/PWD Affairs Desk</h2>
              <p className="text-xs text-purple-200 mt-1 max-w-2xl">
                Publish youth sports tournaments, track registered youth teams, schedule senior citizen pension and cash gift releases, and approve mobility device requests.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsSKModalOpen(true)}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Post SK Youth Tournament
              </button>
              <button
                onClick={() => setIsSeniorModalOpen(true)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Post Senior Benefit Schedule
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SK Youth Programs</p>
              <p className="text-2xl font-black text-purple-600 mt-1">{skTournaments.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Active tournaments & hubs</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Youth Registrations</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">{skRegistrations.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Enrolled players & teams</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Senior Benefit Waves</p>
              <p className="text-2xl font-black text-rose-600 mt-1">{seniorBenefitSchedules.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Cash gifts & pension dates</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assistive Requests</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{assistiveDeviceRequests.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Wheelchairs & mobility aids</p>
            </div>
          </div>

          {/* Section 1: SK Youth Tournaments & Program Schedules */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  SK Youth Tournaments & Activity Programs ({skTournaments.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Published tournaments and skill development activities visible to resident youth.
                </p>
              </div>
              <button
                onClick={() => setIsSKModalOpen(true)}
                className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Tournament
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Tournament Title & ID</th>
                    <th className="p-3.5">Category & Age Group</th>
                    <th className="p-3.5">Schedule & Venue</th>
                    <th className="p-3.5">Prizes / Inclusions</th>
                    <th className="p-3.5">Contact Person</th>
                    <th className="p-3.5">Registration Status</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {skTournaments.map((tour) => {
                    const regCount = skRegistrations.filter((r) => r.activityId === tour.id).length;
                    return (
                      <tr key={tour.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 pl-5">
                          <p className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold">{tour.id}</p>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{tour.title}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-md text-[10px] font-bold">
                            {regCount} Resident(s) Registered
                          </span>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{tour.category}</p>
                          <p className="text-[11px] text-slate-500">{tour.targetAgeGroup}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">{tour.scheduleDates}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500" /> {tour.venue}
                          </p>
                        </td>
                        <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-400">
                          {tour.prizes}
                        </td>
                        <td className="p-3.5">
                          <p className="font-medium text-slate-700 dark:text-slate-300">{tour.skContactPerson}</p>
                          <p className="text-[11px] text-slate-500">{tour.contactNumber}</p>
                        </td>
                        <td className="p-3.5">
                          <select
                            value={tour.registrationStatus}
                            onChange={(e) => {
                              const newStatus = e.target.value as SKTournamentActivity['registrationStatus'];
                              updateSKTournament(tour.id, { registrationStatus: newStatus });
                              showToast(`Updated status for "${tour.title}" to ${newStatus}.`);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                          >
                            <option value="Registration Open">Registration Open</option>
                            <option value="Brackets Released">Brackets Released</option>
                            <option value="Ongoing Games">Ongoing Games</option>
                            <option value="Concluded">Concluded</option>
                          </select>
                        </td>
                        <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              deleteSKTournament(tour.id);
                              showToast(`Removed tournament "${tour.title}".`);
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Tournament"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {skTournaments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No SK youth tournaments posted yet. Click "Post SK Youth Tournament" to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: SK Youth Registered Participants & Teams */}
          {skRegistrations.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    SK Youth Registered Participants & Team Rosters ({skRegistrations.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Resident youth registration records submitted through the resident portal.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5 pl-5">Registration ID</th>
                      <th className="p-3.5">Participant / Captain</th>
                      <th className="p-3.5">Tournament Program</th>
                      <th className="p-3.5">Team / Entry Category</th>
                      <th className="p-3.5">Purok & Age</th>
                      <th className="p-3.5">Registered Date</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 pr-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {skRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 pl-5 font-mono text-[10px] text-slate-500 font-bold">
                          {reg.id}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">
                          {reg.residentName}
                        </td>
                        <td className="p-3.5 font-semibold text-purple-700 dark:text-purple-300">
                          {reg.activityTitle}
                        </td>
                        <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                          {reg.teamOrCategory}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400">
                          {reg.purok} • {reg.age} y/o
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {reg.registeredDate}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              reg.status === 'Registered & Confirmed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {reg.status !== 'Registered & Confirmed' && (
                              <button
                                onClick={() => {
                                  updateSKRegistrationStatus(reg.id, 'Registered & Confirmed');
                                  showToast(`Confirmed registration for ${reg.residentName}.`);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Confirm
                              </button>
                            )}
                            <button
                              onClick={() => {
                                deleteSKRegistration(reg.id);
                                showToast(`Removed registration #${reg.id}.`);
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Registration"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 3: Senior Citizen & OSCA Benefit Distribution Schedules */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Gift className="w-4 h-4 text-rose-500" />
                  Senior Citizen & OSCA Benefit Distribution Schedules ({seniorBenefitSchedules.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Published pension payout waves and birthday cash gift schedules for elderly residents.
                </p>
              </div>
              <button
                onClick={() => setIsSeniorModalOpen(true)}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Benefit Wave
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Benefit Schedule Title</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Distribution Date & Venue</th>
                    <th className="p-3.5">Purok Coverage</th>
                    <th className="p-3.5">Requirements to Bring</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {seniorBenefitSchedules.map((ben) => (
                    <tr key={ben.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-mono text-[10px] text-rose-600 dark:text-rose-400 font-bold">{ben.id}</p>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{ben.title}</p>
                      </td>
                      <td className="p-3.5 font-semibold text-rose-700 dark:text-rose-300">
                        {ben.category}
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{ben.distributionDate}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" /> {ben.venue}
                        </p>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {ben.purokCoverage}
                      </td>
                      <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-400">
                        <ul className="list-disc list-inside space-y-0.5">
                          {ben.requirements.map((req, idx) => (
                            <li key={idx} className="truncate">{req}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3.5">
                        <select
                          value={ben.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as SeniorCitizenBenefitSchedule['status'];
                            updateSeniorBenefitSchedule(ben.id, { status: newStatus });
                            showToast(`Updated benefit schedule status to ${newStatus}.`);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <option value="Upcoming Release">Upcoming Release</option>
                          <option value="Claiming in Progress">Claiming in Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            deleteSeniorBenefitSchedule(ben.id);
                            showToast(`Deleted benefit schedule "${ben.title}".`);
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {seniorBenefitSchedules.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No senior citizen benefit schedules posted yet. Click "Post Senior Benefit Schedule" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Assistive Device Requests Queue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Senior & PWD Assistive Mobility Device Requests ({assistiveDeviceRequests.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Wheelchairs, canes, walkers, and medical monitors for bedridden/elderly residents.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Control No. & Device</th>
                    <th className="p-3.5">Beneficiary / Age</th>
                    <th className="p-3.5">Purok</th>
                    <th className="p-3.5">Medical Reason</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assistiveDeviceRequests.map((ast) => (
                    <tr key={ast.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-mono text-[10px] text-slate-400 font-bold">{ast.id}</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{ast.deviceRequested}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{ast.beneficiaryName}</p>
                        <p className="text-[11px] text-slate-500">{ast.beneficiaryAge} y/o (Req by: {ast.residentName})</p>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{ast.purok}</td>
                      <td className="p-3.5 max-w-xs truncate text-slate-600 dark:text-slate-400">{ast.medicalConditionReason}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ast.priorityLevel.includes('Urgent') ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>
                          {ast.priorityLevel}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ast.status === 'Delivered to Residence'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ast.status === 'Approved for Delivery'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {ast.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {ast.status === 'Submitted' && (
                            <button
                              onClick={() => {
                                updateAssistiveDeviceStatus(ast.id, 'Approved for Delivery');
                                showToast(`Approved device #${ast.id} for delivery.`);
                              }}
                              className="px-2.5 py-1 bg-sky-600 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                            >
                              Approve Delivery
                            </button>
                          )}
                          {ast.status === 'Approved for Delivery' && (
                            <button
                              onClick={() => {
                                updateAssistiveDeviceStatus(ast.id, 'Delivered to Residence');
                                showToast(`Assistive device #${ast.id} marked as Delivered.`);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Mark Delivered
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: POST JOB OPENING ================= */}
      <JobPostingModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        form={jobForm}
        setForm={setJobForm}
        onSubmit={(e) => {
          e.preventDefault();
          addJobPosting({
            title: jobForm.title,
            employerName: jobForm.employerName,
            location: jobForm.location,
            employmentType: jobForm.employmentType,
            salaryRange: jobForm.salaryRange,
            vacancies: Number(jobForm.vacancies),
            description: jobForm.description,
            qualifications: jobForm.qualificationsText.split('\n').filter(Boolean),
            contactPerson: jobForm.contactPerson,
            contactNumber: jobForm.contactNumber,
            deadlineDate: jobForm.deadlineDate,
            isActive: true,
          });
          setIsJobModalOpen(false);
          showToast(`Published job opening "${jobForm.title}".`);
        }}
      />

      {/* ================= MODAL: LIVELIHOOD WORKSHOP ================= */}
      <LivelihoodTrainingModal
        isOpen={isTrainingModalOpen}
        onClose={() => setIsTrainingModalOpen(false)}
        form={trainingForm}
        setForm={setTrainingForm}
        onSubmit={(e) => {
          e.preventDefault();
          addLivelihoodTraining({
            title: trainingForm.title,
            partnerAgency: trainingForm.partnerAgency,
            slotsTotal: Number(trainingForm.slotsTotal),
            slotsAvailable: Number(trainingForm.slotsTotal),
            schedule: trainingForm.schedule,
            duration: trainingForm.duration,
            venue: trainingForm.venue,
            starterKitProvided: trainingForm.starterKitProvided,
            trainerName: trainingForm.trainerName,
            description: trainingForm.description,
            qualifications: trainingForm.qualifications,
            startDate: trainingForm.startDate,
            status: trainingForm.status,
          });
          setIsTrainingModalOpen(false);
          showToast(`Published livelihood course "${trainingForm.title}".`);
        }}
      />

      {/* ================= MODAL: LAUNCH AYUDA CAMPAIGN ================= */}
      <AyudaDistributionModal
        isOpen={isAyudaModalOpen}
        onClose={() => setIsAyudaModalOpen(false)}
        form={ayudaForm}
        setForm={setAyudaForm}
        onSubmit={(e) => {
          e.preventDefault();
          const targetResList =
            ayudaForm.targetPurok === 'All Puroks'
              ? residents.map((r) => r.id)
              : residents.filter((r) => arePuroksMatching(r.purok, ayudaForm.targetPurok)).map((r) => r.id);

          createAyudaDistribution({
            title: ayudaForm.title || `${settings.barangayName} Calamity Emergency Relief Pack`,
            category: ayudaForm.category,
            targetPurok: ayudaForm.targetPurok,
            claimLocation: ayudaForm.claimLocation,
            distributionDate: ayudaForm.distributionDate,
            timeSlot: ayudaForm.timeSlot,
            itemsIncluded: ayudaForm.itemsIncludedText.split('\n').filter(Boolean),
            beneficiaryResidentIds: targetResList.slice(0, 50),
          });
          setIsAyudaModalOpen(false);
          showToast(`Launched Ayuda distribution wave with QR claim stubs!`);
        }}
      />

      {/* ================= MODAL: ORGANIZE BAYANIHAN CLEAN-UP DRIVE ================= */}
      <BayanihanCleanUpModal
        isOpen={isCleanUpModalOpen}
        onClose={() => setIsCleanUpModalOpen(false)}
        form={cleanUpForm}
        setForm={setCleanUpForm}
        onSubmit={(e) => {
          e.preventDefault();
          createCleanUpDrive({
            title: cleanUpForm.title,
            purokTarget: cleanUpForm.purokTarget,
            activityDate: cleanUpForm.activityDate,
            assemblyTime: cleanUpForm.assemblyTime,
            assemblyPoint: cleanUpForm.assemblyPoint,
            expectedVolunteers: Number(cleanUpForm.expectedVolunteers),
            coordinator: cleanUpForm.coordinator,
            description: cleanUpForm.description,
            equipmentProvided: cleanUpForm.equipmentProvidedText.split(',').map((s: string) => s.trim()).filter(Boolean),
            status: cleanUpForm.status,
          });
          setIsCleanUpModalOpen(false);
          showToast(`Organized Bayanihan Clean-Up "${cleanUpForm.title}".`);
        }}
      />

      {/* ================= MODAL: POST SK YOUTH TOURNAMENT ================= */}
      <SKTournamentModal
        isOpen={isSKModalOpen}
        onClose={() => setIsSKModalOpen(false)}
        form={skForm}
        setForm={setSkForm}
        onSubmit={(e) => {
          e.preventDefault();
          createSKTournament({
            title: skForm.title,
            category: skForm.category,
            targetAgeGroup: skForm.targetAgeGroup,
            scheduleDates: skForm.scheduleDates,
            venue: skForm.venue,
            prizes: skForm.prizes,
            registrationStatus: skForm.registrationStatus,
            skContactPerson: skForm.skContactPerson,
            contactNumber: skForm.contactNumber,
          });
          setIsSKModalOpen(false);
          showToast(`Published SK Tournament "${skForm.title}".`);
        }}
      />

      {/* ================= MODAL: POST SENIOR BENEFIT SCHEDULE ================= */}
      <SeniorBenefitModal
        isOpen={isSeniorModalOpen}
        onClose={() => setIsSeniorModalOpen(false)}
        form={seniorForm}
        setForm={setSeniorForm}
        onSubmit={(e) => {
          e.preventDefault();
          createSeniorBenefitSchedule({
            title: seniorForm.title,
            category: seniorForm.category,
            purokCoverage: seniorForm.purokCoverage,
            distributionDate: seniorForm.distributionDate,
            venue: seniorForm.venue,
            requirements: seniorForm.requirementsText.split('\n').filter(Boolean),
            status: seniorForm.status,
          });
          setIsSeniorModalOpen(false);
          showToast(`Published Senior Citizen benefit schedule.`);
        }}
      />

      {/* Printable Slip Preview Modal */}
      <PrintSlipModal
        data={printData}
        onClose={() => setPrintData(null)}
        barangayName={settings.barangayName}
        municipality={settings.municipality}
        province={settings.province}
        punongBarangay={settings.punongBarangay}
      />

      {/* Attached Document Viewer Modal */}
      <AttachedDocumentModal
        data={docViewerData}
        onClose={() => setDocViewerData(null)}
      />

      {/* Health Desk: Triage Vitals Modal */}
      <TriageVitalsModal
        appointment={selectedApptForTriage}
        onClose={() => setSelectedApptForTriage(null)}
        onSave={(apptId, vitals, diagnosis, prescriptions, queueNumber) => {
          recordTriageVitals(apptId, vitals, diagnosis, prescriptions, queueNumber);
          showToast(`Recorded clinical triage vitals for #${apptId}.`);
        }}
      />

      {/* Health Desk: Pharmacy Item Modal */}
      <PharmacyInventoryModal
        isOpen={isPharmacyModalOpen}
        onClose={() => {
          setIsPharmacyModalOpen(false);
          setPharmacyItemToEdit(null);
        }}
        itemToEdit={pharmacyItemToEdit}
        onSave={(itemData) => {
          if (pharmacyItemToEdit) {
            updatePharmacyItem(pharmacyItemToEdit.id, itemData);
            showToast(`Updated medicine item ${itemData.name}.`);
          } else {
            addPharmacyItem(itemData);
            showToast(`Added new medicine ${itemData.name} to botika.`);
          }
        }}
      />

      {/* Health Desk: Health Mission Modal */}
      <HealthMissionModal
        isOpen={isHealthMissionModalOpen}
        onClose={() => {
          setIsHealthMissionModalOpen(false);
          setHealthMissionToEdit(null);
        }}
        missionToEdit={healthMissionToEdit}
        onSave={(missionData) => {
          if (healthMissionToEdit) {
            updateHealthMission(healthMissionToEdit.id, missionData);
            showToast(`Updated health mission ${missionData.title}.`);
          } else {
            addHealthMission(missionData);
            showToast(`Scheduled new health mission ${missionData.title}.`);
          }
        }}
      />

      {/* Health Official Printable Slips Modal */}
      <HealthPrintDocumentModal
        document={healthPrintDoc}
        onClose={() => setHealthPrintDoc(null)}
      />
    </div>
  );
};
