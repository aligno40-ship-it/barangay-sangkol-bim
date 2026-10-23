export interface FacilityReservation {
  id: string; // e.g. "RES-FAC-2026-001"
  facilityName: 'Multi-Purpose Gymnasium' | 'Covered Basketball Court' | 'Day Care Center Hall' | 'Barangay Session Hall' | 'Community Park Stage';
  reservedByResidentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
  eventTitle: string;
  purpose: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "08:00 AM"
  endTime: string; // "12:00 PM"
  expectedAttendees: number;
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';
  fee: number;
  remarks?: string;
  createdAt: string;
}

export interface EquipmentReservation {
  id: string; // e.g. "RES-EQP-2026-001"
  equipmentName: 'Heavy Duty Canopy Tent (Tolda)' | 'Monobloc Chairs Set (50 pcs)' | 'Foldable Banquet Tables (5 pcs)' | 'Public Address (PA) Sound System' | 'Mobile Electric Generator (5kVA)' | 'Heavy Duty Grass Cutter';
  quantity: number;
  reservedByResidentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
  borrowDate: string;
  returnDate: string;
  purpose: string;
  status: 'Pending Review' | 'Approved' | 'Released / In Use' | 'Returned' | 'Rejected';
  depositAmount: number;
  conditionOnRelease?: string;
  conditionOnReturn?: string;
  createdAt: string;
}

export interface ResidentIncidentReport {
  id: string; // e.g. "BLOT-RES-2026-001"
  incidentType: 'Noise & Late Night Karaoke Disturbance' | 'Property & Boundary Dispute' | 'Stray Animal & Pet Nuisance' | 'Neighborhood Quarrel / Altercation' | 'Public Drinking & Curfew Violation' | 'Uncollected Garbage / Illegal Dumping' | 'Other Civil Incident';
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
  locationDetails: string;
  incidentDateTime: string;
  involvedPersons?: string;
  narrative: string;
  urgency: 'Normal' | 'Urgent' | 'Emergency';
  isConfidential: boolean;
  status: 'Filed / Under Review' | 'Assigned to Tanod Duty' | 'Elevated to Lupon Tagapamayapa' | 'Resolved / Amicably Settled' | 'Dismissed';
  actionTakenNotes?: string;
  assignedOfficer?: string;
  luponCaseId?: string;
  createdAt: string;
  rawBlotter?: any;
  extractRequested?: boolean;
  extractStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Issued';
}

export interface LuponMediationSchedule {
  id: string; // e.g. "LUPON-2026-001"
  caseNumber: string; // "KP-2026-042"
  complainantName: string;
  respondentName: string;
  disputeSubject: string;
  stage: '1st Conciliation (Punong Barangay)' | '2nd Conciliation Hearing' | 'Pangkat ng Tagapagkasundo Formation' | 'Amicable Settlement (Kasunduan)' | 'Issuance of Certificate to File Action';
  hearingDate: string;
  hearingTime: string;
  venue: string; // "Barangay Sangkol Lupon Conference Room"
  mediatorName: string;
  status: 'Scheduled' | 'In Progress' | 'Settled' | 'Certified to Court';
  notes?: string;
}

export interface VitalSigns {
  bp?: string; // e.g. "120/80"
  heartRate?: number; // bpm
  temperature?: number; // °C
  weightKg?: number; // kg
  spo2?: number; // %
  triagePriority?: 'Routine' | 'Priority (Senior/Pregnant/Infant)' | 'Urgent / Emergency';
  triageNotes?: string;
  recordedBy?: string;
  recordedAt?: string;
}

export interface HealthAppointment {
  id: string; // e.g. "HLTH-2026-001"
  residentId: string;
  residentName: string;
  patientName: string;
  patientAge: number;
  serviceType: 'General Medical Consultation' | 'Barangay Midwife / Prenatal Check' | 'Child Immunization / Vaccine' | 'Senior Blood Pressure & Blood Sugar Check' | 'Dental Outreach / Tooth Extraction' | 'Nutrition Counseling (BNS)' | 'Family Planning & Reproductive Health' | 'TB-DOTS / Respiratory Clinic';
  preferredDate: string;
  preferredTimeSlot: '08:30 AM - 10:00 AM' | '10:00 AM - 11:30 AM' | '01:30 PM - 03:00 PM' | '03:00 PM - 04:30 PM';
  attendingHealthWorker: string;
  symptomsOrPurpose: string;
  status: 'Pending Triage' | 'Triage Recorded' | 'Confirmed' | 'Completed' | 'Rescheduled' | 'Cancelled';
  vitals?: VitalSigns;
  diagnosis?: string;
  prescriptionsOrAdvice?: string;
  queueNumber?: string;
  createdAt: string;
}

export interface ChildImmunizationTracker {
  id: string;
  childName: string;
  birthDate: string;
  childBirthDate?: string;
  parentResidentId: string;
  parentName: string;
  vaccineName: 'BCG (Tuberculosis)' | 'Hepatitis B' | 'Pentavalent (DTP-HepB-Hib)' | 'Oral Polio Vaccine (OPV)' | 'Inactivated Polio Vaccine (IPV)' | 'Pneumococcal Conjugate Vaccine (PCV)' | 'Measles, Mumps, Rubella (MMR)' | 'Vitamin A Supplement' | 'Deworming (Albendazole)' | string;
  doseNumber: 'Dose 1' | 'Dose 2' | 'Dose 3' | 'Booster 1' | 'Booster 2' | 'Semi-Annual' | string;
  dueDate: string;
  administeredDate?: string;
  administeredBy?: string;
  batchOrLotNumber?: string;
  batchNumber?: string;
  injectionSite?: 'Left Deltoid (Arm)' | 'Right Deltoid (Arm)' | 'Right Anterolateral Thigh' | 'Left Anterolateral Thigh' | 'Oral Drops' | 'Subcutaneous Right Arm' | string;
  status: 'Due Soon' | 'Completed' | 'Overdue' | string;
  adverseEffectsOrRemarks?: string;
}

export interface PharmacyInventoryItem {
  id: string; // e.g. "PHARM-MED-001"
  name?: string; // e.g. "Losartan Potassium 50mg"
  genericName: string; // e.g. "Losartan Potassium"
  brandOrDosage?: string; // e.g. "50mg Film-Coated Tablet"
  dosageForm?: string; // e.g. "Tablet"
  strength?: string; // e.g. "50mg"
  category: 'Antihypertensive' | 'Antidiabetic' | 'Analgesic / Antipyretic' | 'Antibiotic' | 'Vitamins & Minerals' | 'Maternal & Child Care' | 'Gastrointestinal / ORS' | 'Respiratory / Bronchodilator' | 'First Aid / Antiseptic' | string;
  stockQuantity: number;
  unit: 'tablets' | 'capsules' | 'bottles / syrup' | 'sachets' | 'ampules / vials' | 'tubes / ointment' | 'pieces' | string;
  reorderLevel?: number;
  minimumThreshold?: number;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  requiresPrescription: boolean;
  dosingInstructions?: string;
  indications?: string;
  donorOrSupplier?: string; // e.g. "DOH Botika sa Barangay Supply", "City Health Office Allocation", "LGU Special Health Fund"
  programSource?: string;
  status?: 'In Stock' | 'Low Stock' | 'Critical Stock' | 'Out of Stock' | 'Expired / Quarantine' | string;
  updatedAt?: string;
  lastRestocked?: string;
}

export interface MedicineRefillRequest {
  id: string; // e.g. "MED-2026-001"
  residentId: string;
  residentName: string;
  contactNumber: string;
  medicineName: string;
  inventoryItemId?: string;
  quantityRequested: number;
  prescriptionAttached: boolean;
  prescriptionImageUrl?: string;
  doctorPrescriberName?: string;
  doctorLicenseNo?: string;
  purpose: string;
  status: 'Pending Approval' | 'Pending Dispensing' | 'Ready for Pickup' | 'Dispensed' | 'Out of Stock' | 'Rejected';
  pharmacistNotes?: string;
  dispensedBy?: string;
  dispensedAt?: string;
  batchDispensed?: string;
  requestedAt: string;
  approvedBy?: string;
}

export interface HealthOutreachMission {
  id: string; // e.g. "MSN-2026-001"
  title: string;
  missionType?: string;
  programType?: 'Maternal & Buntis Day' | 'Operation Timbang & Child Deworming' | 'Free Blood Pressure & Diabetes Screening' | 'Dental Outreach & Tooth Extraction' | 'Blood Donation Drive' | 'Flu & Pneumonia Vaccine Outreach' | 'TB-DOTS & Chest X-Ray Caravan' | string;
  targetBeneficiaries?: string;
  targetPurok?: string;
  date: string;
  timeSchedule: string;
  venue: string;
  leadProvider?: string;
  maxSlots: number;
  registeredCount?: number;
  registeredBeneficiaryIds?: string[];
  description: string;
  requirements?: string[];
  status?: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' | string;
  bannerColor?: string;
}

export type HealthMission = HealthOutreachMission;

export interface CommunityJobPosting {
  id: string;
  title: string;
  employerName: string;
  location: string;
  employmentType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Daily Wage / Project-based';
  salaryRange: string;
  vacancies: number;
  description: string;
  qualifications: string[];
  contactPerson: string;
  contactNumber: string;
  postedDate: string;
  deadlineDate: string;
  isActive: boolean;
}

export interface JobApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  employerName: string;
  residentId: string;
  residentName: string;
  contactNumber: string;
  educationalAttainment: string;
  workExperience: string;
  resumeFileName?: string;
  resumeFileData?: string;
  applicationLetterFileName?: string;
  applicationLetterFileData?: string;
  applicationLetterText?: string;
  appliedDate: string;
  status: 'Submitted' | 'Under Review' | 'Invited for Interview' | 'Hired';
}

export interface LivelihoodTrainingWorkshop {
  id: string;
  title: string;
  partnerAgency: 'TESDA Accredited' | 'Barangay Livelihood Council' | 'DOST / DTI Provincial Desk' | 'DA Regional Office';
  slotsAvailable: number;
  slotsTotal: number;
  schedule: string;
  duration: string;
  venue: string;
  starterKitProvided: boolean;
  trainerName: string;
  description: string;
  qualifications: string;
  startDate: string;
  status: 'Open for Registration' | 'Ongoing' | 'Completed';
}

export interface LivelihoodEnrollmentRecord {
  id: string;
  trainingId: string;
  trainingTitle: string;
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
  educationalBackground?: string;
  currentOccupation?: string;
  intentReason?: string;
  resumeFileName?: string;
  resumeFileData?: string;
  applicationLetterFileName?: string;
  applicationLetterFileData?: string;
  applicationLetterText?: string;
  enrolledDate: string;
  status: 'Confirmed' | 'Waitlisted' | 'Graduated with Certificate' | 'Under Review' | 'Cancelled';
}

export interface LivelihoodAssistanceRequest {
  id: string; // e.g. "LIV-AST-2026-001"
  programType: 'Micro-Enterprise Starter Capital' | 'Agricultural Inputs & Seeds Grant' | 'Vocational Toolset Assistance' | 'Sari-Sari Store Expansion Kit' | 'Sewing & Tailoring Machine Package' | 'Food Processing & Cooking Equipment' | 'Welding & Fabrication Starter Package';
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
  proposedBusiness: string;
  estimatedBudget: number;
  requestedGrantAmount: number;
  approvedAmount?: number;
  targetStartDate: string;
  statementOfNeed: string;
  businessPlanFileName?: string;
  businessPlanFileData?: string;
  endorsementLetterFileName?: string;
  endorsementLetterFileData?: string;
  status: 'Pending Review' | 'Field Validation' | 'Approved - For Release' | 'Disbursed / Released' | 'Rejected';
  reviewerNotes?: string;
  resolutionReferenceNo?: string;
  dateRequested: string;
  dateDisbursed?: string;
}

export interface AyudaClaimStub {
  id: string; // e.g. "AYUDA-2026-0042"
  title: string;
  category: 'Calamity Relief Goods Pack' | 'Department of Agriculture Seeds & Fertilizer' | 'Senior Citizen Nutrition Pack' | 'PWD Assistive Grocery Voucher' | '4Ps Supplemental Ration';
  residentId: string;
  residentName: string;
  purok: string;
  householdNo?: string;
  claimLocation: string; // "Barangay Sangkol Multi-Purpose Hall"
  distributionDate: string;
  timeSlot: string;
  qrPayload: string;
  itemsIncluded: string[];
  status: 'Available to Claim' | 'Claimed / Released' | 'Expired';
  claimedAt?: string;
  releasedBy?: string;
}

export interface FinancialAssistanceRequest {
  id: string; // e.g. "AICS-2026-001"
  assistanceType: 'AICS - Medical & Hospitalization Subsidy' | 'AICS - Educational Assistance & School Grant' | 'AICS - Emergency Burial & Funeral Assistance' | 'AICS - Calamity & Fire Recovery Aid' | 'Solo Parent Subsidy Support';
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
  amountRequested: number;
  beneficiaryName: string;
  justification: string;
  documentsSubmitted: string[];
  status: 'Application Submitted' | 'Social Worker Assessment' | 'Approved for Payout' | 'Disbursed' | 'Disapproved';
  disbursedAmount?: number;
  disbursedDate?: string;
  createdAt: string;
}

export interface WasteCollectionSchedule {
  id: string;
  purokName: string;
  wasteType: 'Biodegradable (Nabubulok)' | 'Non-Biodegradable (Di-Nabubulok / Recyclable)' | 'Residual & Hazardous (Special Collection)';
  collectionDays: string; // e.g. "Mon, Wed, Fri"
  pickupTime: string; // e.g. "06:00 AM - 08:30 AM"
  assignedTruckNo: string;
  ecoOfficerInCharge: string;
  status: 'On Schedule' | 'En Route to Purok' | 'Collecting Now' | 'Delayed due to Weather' | 'Completed Today';
  routeNotes?: string;
  driverName?: string;
  driverContact?: string;
}

export interface BulkWastePickupRequest {
  id: string; // e.g. "BULK-2026-001"
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
  streetAddress: string;
  wasteDescription: string;
  wasteCategory: 'Tree Branches & Yard Trimmings' | 'Broken Monobloc / Discarded Furniture' | 'Old Scrap Metals & Appliances' | 'Construction Debris & Dry Rubble' | 'Other Bulky Household Waste';
  estimatedVolume?: 'Small (1-2 bundles/bags)' | 'Medium (Tricycle load)' | 'Large (Truck load)';
  photoUrl?: string;
  preferredPickupDate: string;
  status: 'Pending Schedule' | 'Pickup Scheduled' | 'Collected' | 'Cancelled';
  assignedCrew?: string;
  pickupTimeWindow?: string;
  adminRemarks?: string;
  createdAt: string;
  collectedAt?: string;
}

export interface BayanihanCleanUpDrive {
  id: string;
  title: string;
  purokTarget: string;
  activityDate: string;
  assemblyTime: string;
  assemblyPoint: string;
  expectedVolunteers: number;
  currentVolunteers: number;
  coordinator: string;
  description: string;
  equipmentProvided: string[];
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Postponed';
  targetLinearMeters?: string;
  wasteCollectedSacks?: number;
  incentivePackage?: string;
  beforeAfterPhotoUrl?: string;
}

export interface BayanihanVolunteerRecord {
  id: string;
  driveId: string;
  driveTitle: string;
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
  registeredDate: string;
  volunteerRole?: 'Sweeper / Collector' | 'Debris Loader' | 'Canal Dredger' | 'First Aid & Marshall' | 'Segregation Aide';
  hoursRendered?: number;
  attendanceVerified: boolean;
  verifiedBy?: string;
  certificateCode?: string;
  certificateIssuedAt?: string;
}

export interface IllegalDumpingReport {
  id: string; // e.g. "HOTSPOT-2026-001"
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
  exactLocationOrLandmark: string;
  violationType:
    | 'Open Burning (Siga / RA 9003 Sec 48)'
    | 'Uncollected Piles / Garbage Overflow'
    | 'Illegal Dumping in Creek / Estero / Canal'
    | 'Littering / Trash Scattering on Roadside'
    | 'Hazardous / Construction Debris Dumping';
  description: string;
  photoUrl?: string;
  severityLevel: 'High / Blocking Waterway' | 'Medium / Public Nuisance' | 'Standard / Minor Pile';
  status: 'Report Received' | 'Tanod Dispatched' | 'Cleaned & Cleared' | 'Notice Issued / Resolved';
  assignedTanodOrCrew?: string;
  resolutionRemarks?: string;
  reportedAt: string;
  resolvedAt?: string;
}

export interface MRFRecyclablesDropRecord {
  id: string; // e.g. "MRF-2026-001"
  residentId: string;
  residentName: string;
  purok: string;
  itemCategory:
    | 'Plastic Bottles (PET / HDPE)'
    | 'Corrugated Carton & Old Newspaper'
    | 'Scrap Iron & Metals (Bakal / G.I.)'
    | 'Aluminum Cans & Beverage Tins'
    | 'Glass Bottles & Culinary Jars'
    | 'E-Waste & Discarded Small Appliances';
  weightKg: number;
  rewardType: 'Cash Payout (₱)' | 'Rice Swap (Bigas kg)' | 'Barangay Eco-Points';
  rewardValue: string; // e.g. "₱180.00" or "3.5 kg Rice"
  officerInCharge: string;
  loggedDate: string;
}

export interface SKTournamentActivity {
  id: string;
  title: string;
  category: 'Inter-Purok Basketball League (Junior Division)' | 'Inter-Purok Volleyball Tournament (Women)' | 'SK Mobile Legends E-Sports Cup' | 'Youth Leadership Summit & Camp' | 'Free Academic Tutorial & Student Printing Center';
  targetAgeGroup: '15 - 30 Years Old (SK Registered Youth)' | 'High School & College Students' | 'All Purok Youth';
  scheduleDates: string;
  venue: string;
  prizes: string;
  registrationStatus: 'Registration Open' | 'Brackets Released' | 'Ongoing Games' | 'Concluded';
  skContactPerson: string;
  contactNumber: string;
}

export interface SKRegistrationRecord {
  id: string;
  activityId: string;
  activityTitle: string;
  residentId: string;
  residentName: string;
  age: number;
  purok: string;
  teamOrCategory: string;
  registeredDate: string;
  status: 'Registered & Confirmed' | 'Waitlisted';
}

export interface SeniorCitizenBenefitSchedule {
  id: string;
  title: string;
  category: 'LGU Quarterly Birthday Cash Gift (P1,000)' | 'OSCA Senior Citizen Booklet & Purchase ID Renewal' | 'Free Pneumococcal & Flu Vaccine for Seniors' | 'Centenarian Honorarium & Milestone Award' | 'Free Eye Check-up & Reading Glasses Distribution';
  purokCoverage: string;
  distributionDate: string;
  venue: string;
  requirements: string[];
  status: 'Upcoming Release' | 'Claiming in Progress' | 'Completed';
}

export interface AssistiveDeviceRequest {
  id: string; // e.g. "AST-2026-001"
  residentId: string;
  residentName: string;
  beneficiaryName: string;
  beneficiaryAge: number;
  purok: string;
  deviceRequested: 'Standard Adult Wheelchair' | 'Quad Walking Cane' | 'Adjustable Underarm Crutches' | 'Adult Walker / Walking Frame' | 'Digital Blood Pressure Monitor Kit';
  medicalConditionReason: string;
  priorityLevel: 'High / Urgent' | 'Standard';
  status: 'Submitted' | 'BHW Home Assessment' | 'Approved for Delivery' | 'Delivered to Residence';
  createdAt: string;
}

export type ServiceDeskTab =
  | 'facilities'
  | 'health'
  | 'trabaho'
  | 'ayuda'
  | 'solidwaste'
  | 'youth_senior';

