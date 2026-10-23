export type UserRole =
  | 'Administrator'
  | 'Barangay Captain'
  | 'Barangay Secretary'
  | 'Barangay Treasurer'
  | 'Barangay Tanod'
  | 'Barangay Staff'
  | 'Barangay Official'
  | 'Resident';

export interface SystemUser {
  id: string;
  authId?: string;
  username: string;
  name: string;
  role: UserRole;
  position: string;
  avatar?: string;
  email: string;
  contactNumber: string;
  phone?: string;
  createdAt?: string;
  status: 'Active' | 'Inactive' | 'Pending Approval' | 'Rejected';
  approvalStatus?: 'Approved' | 'Pending' | 'Rejected';
  purok?: string;
  residentId?: string; // Nullable foreign key linked to Resident civil registry
  streetAddress?: string;
  birthDate?: string;
  sex?: Sex;
  civilStatus?: CivilStatus;
  validIdType?: string;
  validIdNumber?: string;
  validIdPhoto?: string;
  proofOfResidency?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  matchedResidentId?: string; // ID of existing resident if matched during sign-up
  registrationType?: 'existing_resident_match' | 'new_resident_request';
  matchConfidence?: 'Exact Triangulation' | 'High Confidence' | 'Possible Match' | 'No Match (New Resident)' | string;
  matchReason?: string;
  householdNo?: string;
  householdId?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  // Civil Registry Demographic Fields
  citizenship?: string;
  religion?: string;
  bloodType?: string;
  educationalAttainment?: string;
  occupation?: string;
  monthlyIncome?: number;
  voterStatus?: 'Registered' | 'Unregistered';
  precinctNo?: string;
  isSeniorCitizen?: boolean;
  isPWD?: boolean;
  pwdType?: string;
  is4PsBeneficiary?: boolean;
  isSoloParent?: boolean;
  isIndigent?: boolean;
  isHouseholdHead?: boolean;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  // Biometric Face Verification & Security Attributes
  facePhotoUrl?: string;
  faceVerified?: boolean;
  faceConfidenceScore?: number;
  faceVerificationTimestamp?: string;
  faceVerifiedAt?: string;
  faceLivenessScore?: number;
  faceBiometricQuality?: any;
  passwordStrengthScore?: number;
  passwordHash?: string;
  validIdPhotoUrl?: string;
}

export interface ResidentRegistrationInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  purok: string;
  streetAddress: string;
  birthDate: string;
  sex: Sex;
  civilStatus: CivilStatus;
  contactNumber: string;
  email: string;
  username: string;
  password: string;
  // Civil Registry Demographic Fields
  citizenship?: string;
  religion?: string;
  bloodType?: string;
  educationalAttainment?: string;
  occupation?: string;
  monthlyIncome?: number;
  voterStatus?: 'Registered' | 'Unregistered';
  precinctNo?: string;
  isSeniorCitizen?: boolean;
  isPWD?: boolean;
  pwdType?: string;
  is4PsBeneficiary?: boolean;
  isSoloParent?: boolean;
  isIndigent?: boolean;
  isHouseholdHead?: boolean;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  validIdType?: string;
  validIdNumber?: string;
  validIdPhoto?: string;
  validIdPhotoUrl?: string;
  proofOfResidency?: string;
  householdNo?: string;
  householdId?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  matchedResidentId?: string;
  registrationType?: 'existing_resident_match' | 'new_resident_request';
  matchReason?: string;
  matchConfidence?: string;
  // Biometric Face Verification
  facePhotoUrl?: string;
  faceVerified?: boolean;
  faceConfidenceScore?: number;
  faceVerificationTimestamp?: string;
  faceVerifiedAt?: string;
  faceLivenessScore?: number;
  faceBiometricQuality?: any;
  passwordStrengthScore?: number;
}

export type CivilStatus = 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Divorced' | 'Common Law';
export type Sex = 'Male' | 'Female';
export type ResidentStatus = 'Active' | 'Deceased' | 'Transferred' | 'Archived';

export interface Resident {
  id: string; // e.g. BS-RES-2026-0001
  name?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  alias?: string;
  birthDate: string; // YYYY-MM-DD
  age: number;
  sex: Sex;
  civilStatus: CivilStatus;
  purok: string; // e.g. "Purok Pinya", "Purok Lumboy", etc.
  streetAddress: string;
  contactNumber: string;
  email?: string;
  occupation: string;
  monthlyIncome: number;
  citizenship: string;
  religion: string;
  bloodType: string;
  educationalAttainment: string;
  voterStatus: 'Registered' | 'Unregistered';
  precinctNo?: string;
  householdId?: string;
  isHouseholdHead: boolean;
  // Sectoral tags
  isSeniorCitizen: boolean;
  isPWD: boolean;
  pwdType?: string;
  is4PsBeneficiary: boolean;
  isSoloParent: boolean;
  isIndigent: boolean;
  isYouth: boolean;
  isOutofSchoolYouth: boolean;
  // Metadata
  photoUrl?: string;
  avatar?: string;
  photo?: string;
  facePhotoUrl?: string;
  faceVerified?: boolean;
  faceConfidenceScore?: number;
  faceVerificationTimestamp?: string;
  faceVerifiedAt?: string;
  faceLivenessScore?: number;
  faceBiometricQuality?: any;
  nationalIdNo?: string;
  philhealthNo?: string;
  sssNo?: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  residentStatus: ResidentStatus;
  remarks?: string;
  dateRegistered: string;
  updatedAt: string;
}

export interface HouseholdMember {
  id?: string;
  residentId: string;
  name: string;
  relationshipToHead: 'Head' | 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Relative' | 'Other';
  age: number;
  sex: Sex;
  occupation?: string;
  contactNumber?: string;
  photoUrl?: string;
}

export interface Household {
  id: string; // e.g. HH-SNG-001
  householdNo: string;
  purok: string;
  streetAddress: string;
  headResidentId: string;
  headName: string;
  contactNumber: string;
  members: HouseholdMember[];
  housingType: 'Concrete' | 'Semi-Concrete' | 'Wood' | 'Light Materials' | 'Makeshift';
  houseOwnership: 'Owned' | 'Rented' | 'Informal Settler' | 'Living with Relatives';
  waterSource: 'Deep Well' | 'Piped Water / Utility' | 'Community Faucet' | 'Bottled / Refill' | 'Spring / Rain';
  sanitaryToilet: boolean;
  electricitySource: 'Direct Line / Power Co.' | 'Shared Submeter' | 'Solar' | 'None';
  monthlyHouseholdIncome: number;
  is4PsBeneficiary: boolean;
  dateCreated: string;
  remarks?: string;
}

export interface BarangayOfficial {
  id: string;
  residentId?: string;
  name: string;
  position: 
    | 'Punong Barangay (Barangay Captain)'
    | 'Barangay Kagawad'
    | 'SK Chairperson'
    | 'Barangay Secretary'
    | 'Barangay Treasurer'
    | 'Barangay Administrator'
    | 'Chief Barangay Tanod'
    | 'Lupon Member'
    | 'Barangay Health Worker (BHW)'
    | string;
  committee?: string;
  termStart: string;
  termEnd: string;
  contactNumber: string;
  email?: string;
  purok: string;
  status: 'Active' | 'On Leave' | 'Term Ended';
  photoUrl?: string;
  avatar?: string;
  signatureUrl?: string;
  order: number;
}

export type CertificateType =
  | 'Barangay Clearance'
  | 'Certificate of Residency'
  | 'Certificate of Indigency'
  | 'Certificate of Good Moral Character'
  | 'Business Clearance'
  | 'Certificate of Low Income'
  | 'First Time Jobseeker (RA 11261)'
  | 'Certificate of Cohabitation'
  | 'Barangay Peace and Order Clearance';

export interface CertificateRecord {
  id: string; // e.g. CERT-2026-0120
  controlNumber: string;
  type: CertificateType;
  residentId: string;
  residentName: string;
  residentAddress: string;
  residentPurok?: string;
  residentAge: number;
  residentBirthDate?: string;
  residentCivilStatus: string;
  purpose: string;
  orNumber: string;
  fee: number;
  cedulaNo?: string;
  cedulaIssuedAt?: string;
  cedulaIssuedDate?: string;
  signatoryOfficial: string;
  signatoryPosition: string;
  issuedBy: string;
  dateIssued: string;
  expirationDate?: string;
  status: 'Issued' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Expired';
  deliveryOption?: string;
  requestedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  pickupInstructions?: string;
  isReadyForPickup?: boolean;
  businessName?: string;
  businessAddress?: string;
  businessNature?: string;
  remarks?: string;
}

export type IncidentType =
  | 'Physical Altercation / Brawl'
  | 'Theft / Petty Crime'
  | 'Boundary / Land Dispute'
  | 'Noise / Neighborhood Disturbance'
  | 'Domestic Conflict'
  | 'Unpaid Debt / Financial Dispute'
  | 'Verbal Harassment / Threat'
  | 'Property Damage'
  | 'Curfew / Ordinance Violation'
  | 'Animals / Pet Nuisance'
  | 'Other';

export type BlotterStatus =
  | 'Pending'
  | 'Active Investigation'
  | 'Mediation'
  | 'Forwarded to Lupon'
  | 'Settled'
  | 'Amicably Settled'
  | 'Referred to PNP'
  | 'Dismissed';

export interface BlotterActivityLog {
  id: string;
  timestamp: string; // Formatted datetime string (e.g. "2026-08-25 17:00:00" or ISO)
  action: string; // e.g. "Incident Recorded", "Workflow Advanced", "Summons Served", "Mediation Hearing Held", "Kasunduan Agreement Signed", "Escalated to PNP"
  fromStatus?: BlotterStatus | string;
  toStatus?: BlotterStatus | string;
  performedBy: string; // Officer / Official Name
  role?: string; // Role of performer
  notes: string;
  hearingStage?: string;
  hearingDate?: string;
  hearingTime?: string;
  mediator?: string;
  settlementTerms?: string;
  pnpStation?: string;
  endorsementNumber?: string;
}

export interface BlotterRecord {
  id: string; // e.g. BLT-2026-0042
  blotterNo: string;
  incidentType: IncidentType;
  dateReported: string;
  timeReported: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string; // Purok / landmark
  purok: string;
  incidentPurok?: string;
  // Parties
  complainantName: string;
  complainantAddress: string;
  complainantContact: string;
  complainantResidentId?: string;
  respondentName: string;
  respondentAddress: string;
  respondentContact?: string;
  respondentResidentId?: string;
  witnesses?: string;
  // Details
  narrative: string;
  actionTaken: string;
  assignedOfficer: string;
  status: BlotterStatus | string;
  resolutionDate?: string;
  resolutionNotes?: string;
  recordedBy: string;
  // Workflow & Activity Logging
  activityLogs?: BlotterActivityLog[];
  hearingDate?: string;
  hearingTime?: string;
  hearingStage?: string;
  mediator?: string;
  settlementTerms?: string;
  pnpStation?: string;
  pnpEndorsementNo?: string;
  lastUpdated?: string;
  // Resident Portal & Extract Request Integration
  isResidentReport?: boolean;
  reporterUserId?: string;
  urgency?: 'Normal' | 'Urgent' | 'Emergency';
  isConfidential?: boolean;
  extractRequested?: boolean;
  extractRequestDate?: string;
  extractPurpose?: string;
  extractStatus?: 'Pending' | 'Approved' | 'Issued' | 'Rejected';
  extractApprovedBy?: string;
  extractApprovedDate?: string;
  extractRemarks?: string;
}

export interface ComplaintRecord {
  id: string; // e.g. KP-2026-0018
  caseNumber: string;
  caseTitle?: string;
  natureOfComplaint: string;
  dateFiled: string;
  complainantName: string;
  complainant?: string;
  complainantContact?: string;
  complainantAddress?: string;
  complainantResidentId?: string;
  respondentName: string;
  respondent?: string;
  respondentContact?: string;
  respondentAddress?: string;
  mediator?: string;
  caseType?: string;
  contactNumber?: string;
  stage?: string;
  hearingStage?: '1st Mediation' | '2nd Mediation' | '3rd Mediation' | 'Conciliation (Lupon)' | 'Arbitration' | 'CFA Issued' | 'Settled';
  hearingRound?: number;
  hearingDate?: string;
  hearingTime?: string;
  mediatorName?: string; // Punong Barangay or Lupon Chairman
  mediatorOfficial?: string;
  complaintSummary?: string;
  reliefSought?: string;
  proceedingsNotes?: string[];
  settlementTerms?: string;
  remarks?: string;
  certificateToFileActionIssued?: boolean;
  status: 'Open' | 'Ongoing Mediation' | 'Amicably Settled (Kasunduan)' | 'Certificate to File Action (CFA)' | 'Dismissed' | 'Amicably Settled' | string;
  dateSettled?: string;
  isResidentRequest?: boolean;
  reporterUserId?: string;
  linkedBlotterNo?: string;
  purok?: string;
}

export interface BusinessRecord {
  id: string;
  businessName: string;
  ownerName: string;
  ownerResidentId?: string;
  businessType: 'Sole Proprietorship' | 'Partnership' | 'Corporation' | 'Cooperative';
  category: 'Retail / Sari-Sari Store' | 'Food / Eatery' | 'Agri-Supply / Milling' | 'Pharmacy' | 'Hardware' | 'Services & Repair' | 'Internet Cafe' | 'Bakery' | 'Other';
  address: string;
  purok: string;
  contactNumber: string;
  email?: string;
  dtiOrSecNo?: string;
  tinNo?: string;
  capitalInvestment: number;
  grossSales: number;
  barangayClearanceNo: string;
  clearanceIssueDate: string;
  clearanceExpiryDate: string;
  dateRegistered?: string;
  feePaid: number;
  orNumber: string;
  status: 'Active' | 'Pending Renewal' | 'Expired' | 'Ceased Operation';
  employeesCount: number;
}

export interface AnnouncementAttendee {
  id: string; // e.g. "ATT-2026-001"
  announcementId: string;
  residentId?: string; // e.g. "BS-RES-2026-0004"
  residentName: string;
  purok: string;
  contactNumber: string;
  email?: string;
  registeredAt: string; // "2026-02-16 10:30:00"
  attendanceStatus: 'Registered' | 'Present / Attended' | 'Excused' | 'Walk-In' | 'Absent' | 'Cancelled';
  attendedAt?: string;
  verifiedBy?: string;
  remarks?: string;
  householdNo?: string;
  voterStatus?: 'Registered' | 'Unregistered';
  sector?: string; // 'Senior Citizen' | 'Youth' | '4Ps' | 'PWD' | 'Solo Parent' | 'General Resident'
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  category: 'General Notice' | 'Health Advisory' | 'Peace & Order' | 'Ayuda / Distribution' | 'Barangay Assembly' | 'SK / Youth Activity' | 'Emergency / Weather';
  content: string;
  targetAudience: 'All Residents' | 'Senior Citizens' | '4Ps Beneficiaries' | 'Youth' | 'Business Owners' | 'Purok Leaders';
  publishDate: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  isPinned: boolean;
  status: 'Active' | 'Archived';
  author: string;
  requiresRegistration?: boolean;
  maxSlots?: number;
  attendeesCount?: number;
  userRegistered?: boolean;
  targetPurok?: string;
}

export interface CommunityActivity {
  id: string;
  title: string;
  category:
    | 'Assembly & Governance'
    | 'Health & Medical Mission'
    | 'Sports & Youth'
    | 'Clean-Up & Environment'
    | 'Livelihood & Workshop'
    | 'Social & Senior Welfare'
    | 'Disaster & Safety Drill';
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "08:00 AM - 12:00 PM"
  venue: string; // e.g. "Barangay Sangkol Gymnasium"
  location?: string;
  targetPurok: string; // "All Puroks" or "Purok Pinya", etc.
  organizer: string;
  attendeesCount: number;
  maxAttendees?: number;
  maxParticipants?: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Postponed';
  isFeatured?: boolean;
  requirements?: string;
  contactPerson?: string;
  userRsvpd?: boolean;
  requiresRegistration?: boolean;
}

export interface ActivityAttendee {
  id: string;
  activityId: string;
  residentId?: string;
  residentName: string;
  purok: string;
  contactNumber: string;
  email?: string;
  registeredAt: string; // "2026-02-16 10:30:00"
  attendanceStatus: 'Registered' | 'Present / Attended' | 'Excused' | 'Walk-In' | 'Absent' | 'Cancelled';
  attendedAt?: string;
  verifiedBy?: string;
  remarks?: string;
  householdNo?: string;
  voterStatus?: 'Registered' | 'Unregistered';
  sector?: string; // 'Senior Citizen' | 'Youth' | '4Ps' | 'PWD' | 'Solo Parent' | 'General Resident'
}

export interface ConcernActionLog {
  timestamp: string;
  action: string;
  actor: string;
  notes?: string;
  statusAfter?: string;
}

export type CitizenConcernCategory =
  | 'Streetlight / Infrastructure'
  | 'Barangay Sanitation'
  | 'Peace & Order'
  | 'Noise / Disturbance'
  | 'Health & Safety'
  | 'Civil Registry Correction'
  | 'Ayuda Inquiry'
  | 'General Request'
  | 'Other Community Concern';

export type CitizenConcernStatus =
  | 'Received'
  | 'In Review'
  | 'Action Taken'
  | 'Resolved'
  | 'Endorsed to Lupon'
  | 'Dismissed';

export interface CitizenConcern {
  id: string;
  residentName: string;
  residentId?: string;
  purok: string;
  contactNumber: string;
  email?: string;
  subject: string;
  category: CitizenConcernCategory | string;
  description: string;
  details?: string; // alias for backwards compatibility
  locationDetails?: string;
  dateSubmitted: string;
  status: CitizenConcernStatus;
  priority?: 'Normal' | 'Urgent' | 'High' | 'Emergency';
  isRead?: boolean;
  readAt?: string;
  readBy?: string;
  assignedTo?: string;
  actionNotes?: string;
  actionDate?: string;
  actionTakenBy?: string;
  targetResolutionDate?: string;
  feedbackNotes?: string;
  actionHistory?: ConcernActionLog[];
}

export interface AppointmentRecord {
  id: string;
  title: string;
  purpose: 'Barangay Captain Consultation' | 'Lupon Hearing' | 'Document Signing' | 'Health Center Visit' | 'Purok Meeting' | 'Council Session' | 'Community Program';
  date: string;
  time: string;
  residentName: string;
  residentId?: string;
  contactNumber: string;
  residentContact?: string;
  email?: string;
  assignedOfficial: string;
  location: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  notes?: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  documentType?: 'Barangay Ordinance' | 'Barangay Resolution' | 'Executive Order' | 'Annual Budget (AIP)' | 'Disaster Plan' | 'Memorandum' | 'Minutes of Meeting' | string;
  category?: string;
  documentNo?: string;
  documentNumber?: string;
  seriesYear?: string;
  authorOrProponent?: string;
  authorOrSponsor?: string;
  dateAdopted?: string;
  dateUploaded?: string;
  summary?: string;
  description?: string;
  fileUrl?: string;
  tags: string[];
  status: 'Enacted / Approved' | 'Pending Review' | 'Archived' | 'Approved' | string;
}

export type FileCategory =
  | 'Legal & Ordinances'
  | 'Resident KYC & IDs'
  | 'Certificates & Issuances'
  | 'Financial & Vouchers'
  | 'Blotter & Case Evidence'
  | 'Health & Medical Records'
  | 'Forms & Official Templates'
  | 'Forms & Templates'
  | 'Infrastructure & Maps'
  | 'Public Advisories & Media'
  | 'Administrative & Minutes'
  | 'Community Services'
  | 'Other Documents';

export type FileAccessLevel =
  | 'Public (All Citizens)'
  | 'Resident (Owner & Staff)'
  | 'Verified Residents Only'
  | 'Barangay Staff Only'
  | 'Administrator Only'
  | 'Administrator & Council Only'
  | 'Confidential / Restrictive'
  | 'Confidential / Restricted';

export type FileStatus =
  | 'Active / Verified'
  | 'Under Review'
  | 'Archived'
  | 'Flagged / Restricted'
  | 'Expired';

export interface BarangayFileRecord {
  id: string; // e.g. "FILE-2026-0001"
  fileName: string;
  fileTitle: string;
  title?: string;
  fileCategory: FileCategory;
  fileType: 'PDF' | 'DOCX' | 'XLSX' | 'JPG' | 'PNG' | 'ZIP' | 'CSV' | 'TXT' | string;
  mimeType: string;
  fileSize: number; // in bytes
  fileSizeBytes?: number;
  fileSizeFormatted: string; // e.g. "2.4 MB"
  storagePath: string;
  filePath?: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: UserRole | string;
  dateUploaded: string;
  lastModified?: string;
  accessLevel: FileAccessLevel;
  status: FileStatus;
  version: string;
  fileHash: string; // SHA-256 Checksum
  linkedEntityId?: string;
  linkedEntityType?: 'Resident' | 'Certificate' | 'Blotter' | 'Complaint' | 'Ordinance' | 'Treasury' | 'Health' | 'Activity' | 'General';
  tags: string[];
  downloadUrl?: string;
  downloadCount: number;
  isConfidential: boolean;
  retentionExpiry?: string;
  retentionPeriod?: string;
  description?: string;
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  orNumber: string;
  date: string;
  payorName: string;
  serviceType: 'Barangay Clearance' | 'Business Permit' | 'Residency Certification' | 'Indigency (Waived)' | 'Facility Rental' | 'Other Certification';
  amount: number;
  paymentMethod: 'Cash' | 'Online / Bank' | 'Waived (Exempted)';
  cashierName: string;
  remarks?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  ipAddress?: string;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'ISSUE_CERTIFICATE' | 'PRINT_DOCUMENT' | 'BACKUP_DATABASE' | 'RESTORE_DATABASE' | 'SYSTEM_CONFIG' | 'SECURITY_ALERT' | 'VERIFY';
  module: string;
  details: string;
}

export type NotificationCategory =
  | 'all'
  | 'financial'
  | 'certificate'
  | 'concern'
  | 'registration'
  | 'blotter'
  | 'complaint'
  | 'appointment'
  | 'activity'
  | 'document'
  | 'security'
  | 'sms_alert'
  | 'services'
  | 'general';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type?: 'info' | 'warning' | 'success' | 'alert';
  category?: NotificationCategory;
  targetUserId?: string;
  targetResidentId?: string;
  targetRole?: UserRole | 'All';
  linkModule?: string;
  certificateId?: string;
  controlNumber?: string;
  read?: boolean;
  transactionId?: string;
  orNumber?: string;
  amount?: number;
  payorName?: string;
  serviceType?: string;
  paymentMethod?: string;
  cashierName?: string;
  targetRecordId?: string;
  actionText?: string;
  isTransactionNotification?: boolean;
  residentName?: string;
}

export type AlertChannel = 'SMS' | 'Email' | 'Both';

export type AlertCategory =
  | 'Certificate Ready'
  | 'Hearing Schedule / Summons'
  | 'Emergency / Disaster Advisory'
  | 'Appointment Reminder'
  | 'Citizen Concern Update'
  | 'Ayuda / Distribution'
  | 'KYC Account Verified'
  | 'Peace & Order'
  | 'General Broadcast';

export type AlertDeliveryStatus = 'Delivered' | 'Sent' | 'Failed' | 'Pending';

export interface SMSAlertRecord {
  id: string; // e.g. "SMS-2026-0042"
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  recipientResidentId?: string;
  purok?: string;
  category: AlertCategory;
  subject: string;
  smsMessage: string;
  emailBody?: string;
  channel: AlertChannel;
  sender: string; // e.g. "BRGY-SANGKOL" or "GovPH SMS Gateway"
  status: AlertDeliveryStatus;
  timestamp: string; // ISO datetime string
  relatedRecordId?: string; // Certificate ID, Blotter ID, Complaint ID, etc.
  relatedRecordType?: 'certificate' | 'blotter' | 'complaint' | 'announcement' | 'appointment' | 'concern' | 'user' | 'custom';
  metadata?: {
    controlNumber?: string;
    certificateType?: string;
    pickupInstructions?: string;
    hearingDate?: string;
    hearingTime?: string;
    hearingVenue?: string;
    hearingStage?: string;
    caseNumber?: string;
    mediator?: string;
    complainant?: string;
    respondent?: string;
    emergencyLevel?: string;
    actionNotes?: string;
    amount?: number;
    orNumber?: string;
  };
}

export interface SMSGatewaySettings {
  provider: 'GovPH Infobip SMS Gateway' | 'Semaphore Philippines (DILG LGU Plan)' | 'PhilSMS Gateway API' | 'Twilio Cloud Philippines' | 'Simulated Local Gateway';
  senderId: string; // e.g. 'BRGY-SANGKOL'
  apiKeyMasked: string;
  smsQuotaRemaining: number;
  emailSmtpServer: string;
  emailSenderAddress: string;
  isGmailConnected?: boolean;
  gmailConnectedEmail?: string;
  googleClientId?: string;
  autoAlertCertificateReady: boolean;
  autoAlertHearingSchedule: boolean;
  autoAlertEmergencyAnnouncements: boolean;
  autoAlertAppointments: boolean;
  autoAlertCitizenConcerns: boolean;
}

export interface NotificationLog {
  id: string; // e.g. "NOTIF-2026-0001"
  residentId?: string; // e.g. "BS-RES-2026-0001"
  residentName: string;
  certificateId?: string;
  controlNumber?: string;
  certificateType?: string;
  channel: 'sms' | 'email';
  recipientTarget: string; // Cleaned phone number (+639175550101) or email
  subject?: string;
  messageContent: string;
  provider: string; // 'twilio' | 'semaphore' | 'sendgrid' | 'resend' | 'gmail'
  providerMessageId?: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  sentBy?: string;
  timestamp: string;
}

export interface NotificationTemplateVariables {
  residentName: string;
  controlNumber: string;
  certificateType: string;
  status?: string;
  pickupInstructions?: string;
  barangayName?: string;
}

export type Complaint = ComplaintRecord;
export type ComplaintStatus = ComplaintRecord['status'];
export type BarangayDocument = DocumentRecord;
export type TransactionRecord = FinancialTransaction;

export interface BarangaySettings {
  barangayName: string; // "Barangay Sangkol"
  municipality: string; // "Dipolog City" or "Sangkol District"
  province: string; // "Zamboanga del Norte"
  region: string; // "Region IX (Zamboanga Peninsula)"
  zipCode: string;
  punongBarangay: string;
  punongBarangayName?: string;
  barangayCaptain?: string;
  captainSignatureUrl?: string; // Optional digital signature image or data URL for Punong Barangay
  skChairperson?: string; // Sangguniang Kabataan (SK) Chairperson
  kagawads?: string[]; // Barangay Kagawads (councilors, usually 7)
  termStart?: string; // Term start date e.g. "2023-11-01"
  termEnd?: string; // Term end date e.g. "2026-11-30"
  tagline?: string;
  barangaySecretary: string;
  barangayTreasurer: string;
  contactNumber: string;
  email: string;
  hallAddress: string;
  officeHours: string;
  clearanceFeeRegular: number;
  businessClearanceFee: number;
  residencyCertFee: number;
  indigencyCertFee: number;
  goodMoralFee: number;
  certificateFees?: Record<string, number>;
  puroks: string[];
  logoUrl?: string; // Custom uploaded image / Data URL or custom URL for Barangay Seal/Logo
  republicLogoUrl?: string; // Optional custom Republic Seal URL
  theme?: 'light' | 'dark' | 'system'; // System theme display mode
  isDarkMode?: boolean; // Fast toggle flag
}

export type ResidentPortalTab =
  | 'overview'
  | 'profile'
  | 'requests'
  | 'archive'
  | 'facilities'
  | 'blotter'
  | 'health'
  | 'trabaho'
  | 'ayuda'
  | 'waste'
  | 'youth_senior'
  | 'transactions'
  | 'announcements'
  | 'activities'
  | 'concerns'
  | 'directory'
  | 'settings';
