import { supabase, resolveValidResidentId, toNullableString, toValidDateOnly } from './supabaseService';
import {
  FacilityReservation,
  EquipmentReservation,
  HealthAppointment,
  ChildImmunizationTracker,
  PharmacyInventoryItem,
  MedicineRefillRequest,
  HealthOutreachMission,
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
  IllegalDumpingReport,
  MRFRecyclablesDropRecord,
  SKTournamentActivity,
  SKRegistrationRecord,
  SeniorCitizenBenefitSchedule,
  AssistiveDeviceRequest,
} from '../types/residentServices';

import {
  initialFacilityReservations,
  initialEquipmentReservations,
  initialHealthAppointments,
  initialChildImmunizations,
  initialPharmacyInventory,
  initialMedicineRefills,
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

// ============================================================================
// STATUS SANITIZERS TO SATISFY POSTGRES CHECK CONSTRAINTS
// ============================================================================

export function sanitizeFacilityStatus(status?: string | null): string {
  const allowed = ['Pending Review', 'Approved', 'Rejected', 'Completed', 'Cancelled'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Pending') return 'Pending Review';
  return 'Pending Review';
}

export function sanitizeEquipmentStatus(status?: string | null): string {
  const allowed = ['Pending Review', 'Approved', 'Released / In Use', 'Returned', 'Rejected'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Pending') return 'Pending Review';
  if (status === 'Released' || status === 'In Use') return 'Released / In Use';
  return 'Pending Review';
}

export function sanitizeHealthApptStatus(status?: string | null): string {
  const allowed = ['Pending Triage', 'Triage Recorded', 'Confirmed', 'Completed', 'Rescheduled', 'Cancelled'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Pending') return 'Pending Triage';
  if (status === 'Scheduled') return 'Confirmed';
  return 'Confirmed';
}

export function sanitizeChildImmStatus(status?: string | null): string {
  const allowed = ['Due Soon', 'Completed', 'Overdue'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Administered' || status === 'Done') return 'Completed';
  if (status === 'Pending' || status === 'Upcoming') return 'Due Soon';
  if (status === 'Missed' || status === 'Delayed') return 'Overdue';
  return 'Due Soon';
}

export function sanitizePharmacyStatus(status?: string | null): string {
  const allowed = ['In Stock', 'Low Stock', 'Critical Stock', 'Out of Stock', 'Expired / Quarantine'];
  if (status && allowed.includes(status)) return status;
  return 'In Stock';
}

export function sanitizeMedicineRefillStatus(status?: string | null): string {
  const allowed = ['Pending Approval', 'Pending Dispensing', 'Ready for Pickup', 'Dispensed', 'Out of Stock', 'Rejected'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Pending' || status === 'Pending Verification') return 'Pending Approval';
  if (status === 'Approved') return 'Pending Dispensing';
  return 'Pending Approval';
}

export function sanitizeHealthMissionStatus(status?: string | null): string {
  const allowed = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Scheduled') return 'Upcoming';
  return 'Upcoming';
}

export function sanitizeJobAppStatus(status?: string | null): string {
  const allowed = ['Submitted', 'Under Review', 'Invited for Interview', 'Hired'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Pending') return 'Submitted';
  return 'Submitted';
}

export function sanitizeLivelihoodTrainingStatus(status?: string | null): string {
  const allowed = ['Open for Registration', 'Ongoing', 'Completed'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Registration Open') return 'Open for Registration';
  return 'Open for Registration';
}

export function sanitizeLivelihoodEnrollmentStatus(status?: string | null): string {
  const allowed = ['Confirmed', 'Waitlisted', 'Graduated with Certificate', 'Under Review', 'Cancelled'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Enrolled' || status === 'Approved') return 'Confirmed';
  if (status === 'Pending') return 'Under Review';
  return 'Confirmed';
}

export function sanitizeLivelihoodAssistanceStatus(status?: string | null): string {
  const allowed = ['Pending Review', 'Field Validation', 'Approved - For Release', 'Disbursed / Released', 'Rejected'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Submitted' || status === 'Pending') return 'Pending Review';
  if (status === 'Approved') return 'Approved - For Release';
  if (status === 'Disbursed') return 'Disbursed / Released';
  return 'Pending Review';
}

export function sanitizeAyudaClaimStatus(status?: string | null): string {
  const allowed = ['Available to Claim', 'Claimed / Released', 'Expired'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Claimed') return 'Claimed / Released';
  if (status === 'Unclaimed' || status === 'Pending') return 'Available to Claim';
  return 'Available to Claim';
}

export function sanitizeFinancialAssistanceStatus(status?: string | null): string {
  const allowed = ['Application Submitted', 'Social Worker Assessment', 'Approved for Payout', 'Disbursed', 'Disapproved'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Submitted' || status === 'Pending Review' || status === 'Pending') return 'Application Submitted';
  if (status === 'Approved') return 'Approved for Payout';
  if (status === 'Rejected') return 'Disapproved';
  return 'Application Submitted';
}

export function sanitizeWasteScheduleStatus(status?: string | null): string {
  const allowed = ['On Schedule', 'En Route to Purok', 'Collecting Now', 'Delayed due to Weather', 'Completed Today'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Active Route' || status === 'Active') return 'On Schedule';
  return 'On Schedule';
}

export function sanitizeBulkWasteStatus(status?: string | null): string {
  const allowed = ['Pending Schedule', 'Pickup Scheduled', 'Collected', 'Cancelled'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Submitted' || status === 'Pending') return 'Pending Schedule';
  if (status === 'Scheduled' || status === 'In Progress') return 'Pickup Scheduled';
  if (status === 'Completed') return 'Collected';
  return 'Pending Schedule';
}

export function sanitizeCleanUpDriveStatus(status?: string | null): string {
  const allowed = ['Upcoming', 'In Progress', 'Completed', 'Postponed'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Ongoing') return 'In Progress';
  return 'Upcoming';
}

export function sanitizeIllegalDumpingStatus(status?: string | null): string {
  const allowed = ['Report Received', 'Tanod Dispatched', 'Cleaned & Cleared', 'Notice Issued / Resolved'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Reported' || status === 'Pending') return 'Report Received';
  if (status === 'Investigating') return 'Tanod Dispatched';
  if (status === 'Resolved') return 'Cleaned & Cleared';
  return 'Report Received';
}

export function sanitizeSKTournamentStatus(status?: string | null): string {
  const allowed = ['Registration Open', 'Brackets Released', 'Ongoing Games', 'Concluded'];
  if (status && allowed.includes(status)) return status;
  return 'Registration Open';
}

export function sanitizeSKRegistrationStatus(status?: string | null): string {
  const allowed = ['Registered & Confirmed', 'Waitlisted'];
  if (status && allowed.includes(status)) return status;
  return 'Registered & Confirmed';
}

export function sanitizeSeniorBenefitStatus(status?: string | null): string {
  const allowed = ['Upcoming Release', 'Claiming in Progress', 'Completed'];
  if (status && allowed.includes(status)) return status;
  return 'Upcoming Release';
}

export function sanitizeAssistivePriority(priority?: string | null): string {
  const allowed = ['High / Urgent', 'Standard'];
  if (priority && allowed.includes(priority)) return priority;
  if (priority?.toLowerCase().includes('high') || priority?.toLowerCase().includes('urgent')) return 'High / Urgent';
  return 'Standard';
}

export function sanitizeAssistiveDeviceStatus(status?: string | null): string {
  const allowed = ['Submitted', 'BHW Home Assessment', 'Approved for Delivery', 'Delivered to Residence'];
  if (status && allowed.includes(status)) return status;
  if (status === 'Pending' || status === 'Assessment Scheduled') return 'BHW Home Assessment';
  if (status === 'Approved by MSWDO') return 'Approved for Delivery';
  return 'Submitted';
}

// Foreign Key Resolvers
export async function resolveJobId(jobId?: string | null): Promise<string | null> {
  if (!jobId) return null;
  const { data } = await supabase.from('job_postings').select('id').eq('id', jobId).maybeSingle();
  if (data && data.id) return data.id;
  // Ensure default job exists
  const fallbackId = initialJobPostings[0]?.id || 'JOB-2026-001';
  if (jobId === fallbackId) {
    await upsertJobPosting(initialJobPostings[0]).catch(() => {});
    return fallbackId;
  }
  const { data: first } = await supabase.from('job_postings').select('id').limit(1).maybeSingle();
  return first ? first.id : null;
}

export async function resolveTrainingId(trainingId?: string | null): Promise<string | null> {
  if (!trainingId) return null;
  const { data } = await supabase.from('livelihood_training_workshops').select('id').eq('id', trainingId).maybeSingle();
  if (data && data.id) return data.id;
  const fallbackId = initialLivelihoodTrainings[0]?.id || 'TRN-2026-001';
  if (trainingId === fallbackId) {
    await upsertLivelihoodTraining(initialLivelihoodTrainings[0]).catch(() => {});
    return fallbackId;
  }
  const { data: first } = await supabase.from('livelihood_training_workshops').select('id').limit(1).maybeSingle();
  return first ? first.id : null;
}

export async function resolveSKTournamentId(actId?: string | null): Promise<string | null> {
  if (!actId) return null;
  const { data } = await supabase.from('sk_tournament_activities').select('id').eq('id', actId).maybeSingle();
  if (data && data.id) return data.id;
  const fallbackId = initialSKActivities[0]?.id || 'SK-2026-001';
  if (actId === fallbackId) {
    await upsertSKTournament(initialSKActivities[0]).catch(() => {});
    return fallbackId;
  }
  const { data: first } = await supabase.from('sk_tournament_activities').select('id').limit(1).maybeSingle();
  return first ? first.id : null;
}

export async function resolveCleanUpDriveId(driveId?: string | null): Promise<string | null> {
  if (!driveId) return null;
  const { data } = await supabase.from('bayanihan_clean_up_drives').select('id').eq('id', driveId).maybeSingle();
  if (data && data.id) return data.id;
  const fallbackId = initialBayanihanDrives[0]?.id || 'DRV-2026-001';
  if (driveId === fallbackId) {
    await upsertCleanUpDrive(initialBayanihanDrives[0]).catch(() => {});
    return fallbackId;
  }
  const { data: first } = await supabase.from('bayanihan_clean_up_drives').select('id').limit(1).maybeSingle();
  return first ? first.id : null;
}

// ============================================================================
// 1. FACILITIES & EQUIPMENT RESERVATIONS
// ============================================================================

export function facilityReservationFromRow(row: any): FacilityReservation {
  return {
    id: row.id,
    facilityName: row.facility_name,
    reservedByResidentId: row.reserved_by_resident_id || undefined,
    residentName: row.resident_name || 'Resident',
    contactNumber: row.contact_number || '',
    purok: row.purok || '',
    eventTitle: row.event_title || '',
    purpose: row.purpose || '',
    date: row.reservation_date || '',
    startTime: row.start_time || '',
    endTime: row.end_time || '',
    expectedAttendees: Number(row.expected_attendees) || 0,
    status: row.status || 'Pending Review',
    fee: Number(row.fee) || 0,
    remarks: row.remarks || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function facilityReservationToRow(item: FacilityReservation): any {
  return {
    id: item.id,
    facility_name: item.facilityName,
    reserved_by_resident_id: toNullableString(item.reservedByResidentId),
    resident_name: item.residentName || 'Resident',
    contact_number: toNullableString(item.contactNumber),
    purok: toNullableString(item.purok),
    event_title: item.eventTitle || item.purpose || 'Community Activity',
    purpose: item.purpose || 'Community Activity',
    reservation_date: toValidDateOnly(item.date, new Date().toISOString().split('T')[0]),
    start_time: item.startTime || '08:00 AM',
    end_time: item.endTime || '12:00 PM',
    expected_attendees: Number(item.expectedAttendees) || 0,
    status: sanitizeFacilityStatus(item.status),
    fee: Number(item.fee) || 0,
    remarks: toNullableString(item.remarks),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertFacilityReservation(item: FacilityReservation) {
  const validResidentId = await resolveValidResidentId(item.reservedByResidentId);
  const row = facilityReservationToRow({ ...item, reservedByResidentId: validResidentId || undefined });
  const { data, error } = await supabase.from('facility_reservations').upsert(row);
  if (error) {
    console.error('Supabase upsert facility_reservations error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteFacilityReservation(id: string) {
  return await supabase.from('facility_reservations').delete().eq('id', id);
}

export function equipmentReservationFromRow(row: any): EquipmentReservation {
  return {
    id: row.id,
    equipmentName: row.equipment_name,
    quantity: Number(row.quantity) || 1,
    reservedByResidentId: row.reserved_by_resident_id || undefined,
    residentName: row.resident_name || 'Resident',
    contactNumber: row.contact_number || '',
    purok: row.purok || '',
    borrowDate: row.borrow_date || '',
    returnDate: row.return_date || '',
    purpose: row.purpose || '',
    status: row.status || 'Pending Review',
    depositAmount: Number(row.deposit_amount) || 0,
    conditionOnRelease: row.condition_on_release || undefined,
    conditionOnReturn: row.condition_on_return || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function equipmentReservationToRow(item: EquipmentReservation): any {
  return {
    id: item.id,
    equipment_name: item.equipmentName,
    quantity: Number(item.quantity) || 1,
    reserved_by_resident_id: toNullableString(item.reservedByResidentId),
    resident_name: item.residentName || 'Resident',
    contact_number: toNullableString(item.contactNumber),
    purok: toNullableString(item.purok),
    borrow_date: toValidDateOnly(item.borrowDate, new Date().toISOString().split('T')[0]),
    return_date: toValidDateOnly(item.returnDate, new Date().toISOString().split('T')[0]),
    purpose: item.purpose || 'Official / Resident Use',
    status: sanitizeEquipmentStatus(item.status),
    deposit_amount: Number(item.depositAmount) || 0,
    condition_on_release: toNullableString(item.conditionOnRelease),
    condition_on_return: toNullableString(item.conditionOnReturn),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertEquipmentReservation(item: EquipmentReservation) {
  const validResidentId = await resolveValidResidentId(item.reservedByResidentId);
  const row = equipmentReservationToRow({ ...item, reservedByResidentId: validResidentId || undefined });
  const { data, error } = await supabase.from('equipment_reservations').upsert(row);
  if (error) {
    console.error('Supabase upsert equipment_reservations error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteEquipmentReservation(id: string) {
  return await supabase.from('equipment_reservations').delete().eq('id', id);
}

// ============================================================================
// 2. HEALTH & PHARMACY SERVICES
// ============================================================================

export function healthAppointmentFromRow(row: any): HealthAppointment {
  return {
    id: row.id,
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Resident',
    patientName: row.patient_name || row.resident_name || 'Patient',
    patientAge: Number(row.patient_age) || 30,
    serviceType: row.service_type || 'General Medical Consultation',
    preferredDate: row.preferred_date || '',
    preferredTimeSlot: row.preferred_time_slot || 'Morning (08:00 AM - 11:30 AM)',
    attendingHealthWorker: row.attending_health_worker || undefined,
    symptomsOrPurpose: row.symptoms_or_purpose || '',
    status: row.status || 'Confirmed',
    vitals: row.vitals || undefined,
    diagnosis: row.diagnosis || undefined,
    prescriptionsOrAdvice: row.prescriptions_or_advice || undefined,
    queueNumber: row.queue_number || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function healthAppointmentToRow(item: HealthAppointment): any {
  return {
    id: item.id,
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Resident',
    patient_name: item.patientName || item.residentName || 'Patient',
    patient_age: Number(item.patientAge) || 30,
    service_type: item.serviceType || 'General Medical Consultation',
    preferred_date: toValidDateOnly(item.preferredDate, new Date().toISOString().split('T')[0]),
    preferred_time_slot: item.preferredTimeSlot || 'Morning (08:00 AM - 11:30 AM)',
    attending_health_worker: toNullableString(item.attendingHealthWorker),
    symptoms_or_purpose: item.symptomsOrPurpose || 'Health Assessment',
    status: sanitizeHealthApptStatus(item.status),
    vitals: item.vitals || null,
    diagnosis: toNullableString(item.diagnosis),
    prescriptions_or_advice: toNullableString(item.prescriptionsOrAdvice),
    queue_number: toNullableString(item.queueNumber),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertHealthAppointment(item: HealthAppointment) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const row = healthAppointmentToRow({ ...item, residentId: validResidentId || undefined });
  const { data, error } = await supabase.from('health_appointments').upsert(row);
  if (error) {
    console.error('Supabase upsert health_appointments error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteHealthAppointment(id: string) {
  return await supabase.from('health_appointments').delete().eq('id', id);
}

export function childImmunizationFromRow(row: any): ChildImmunizationTracker {
  return {
    id: row.id,
    childName: row.child_name,
    birthDate: row.birth_date,
    parentResidentId: row.parent_resident_id || undefined,
    parentName: row.parent_name || 'Parent',
    vaccineName: row.vaccine_name,
    doseNumber: typeof row.dose_number === 'number' ? `Dose ${row.dose_number}` : (row.dose_number || 'Dose 1'),
    dueDate: row.due_date,
    administeredDate: row.administered_date || undefined,
    administeredBy: row.administered_by || undefined,
    batchOrLotNumber: row.batch_or_lot_number || undefined,
    injectionSite: row.injection_site || undefined,
    status: row.status || 'Due Soon',
    adverseEffectsOrRemarks: row.adverse_effects_or_remarks || undefined,
  };
}

export function childImmunizationToRow(item: ChildImmunizationTracker): any {
  return {
    id: item.id,
    child_name: item.childName,
    birth_date: toValidDateOnly(item.birthDate, '2025-01-01'),
    parent_resident_id: toNullableString(item.parentResidentId),
    parent_name: item.parentName || 'Parent',
    vaccine_name: item.vaccineName,
    dose_number: Number(String(item.doseNumber).replace(/\D/g, '')) || 1,
    due_date: toValidDateOnly(item.dueDate, new Date().toISOString().split('T')[0]),
    administered_date: toValidDateOnly(item.administeredDate, null),
    administered_by: toNullableString(item.administeredBy),
    batch_or_lot_number: toNullableString(item.batchOrLotNumber),
    injection_site: toNullableString(item.injectionSite),
    status: sanitizeChildImmStatus(item.status),
    adverse_effects_or_remarks: toNullableString(item.adverseEffectsOrRemarks),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertChildImmunization(item: ChildImmunizationTracker) {
  const validParentId = await resolveValidResidentId(item.parentResidentId);
  const row = childImmunizationToRow({ ...item, parentResidentId: validParentId || undefined });
  const { data, error } = await supabase.from('child_immunizations').upsert(row);
  if (error) {
    console.error('Supabase upsert child_immunizations error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteChildImmunization(id: string) {
  return await supabase.from('child_immunizations').delete().eq('id', id);
}

export function pharmacyItemFromRow(row: any): PharmacyInventoryItem {
  return {
    id: row.id,
    name: row.generic_name + (row.brand_or_dosage ? ` (${row.brand_or_dosage})` : ''),
    genericName: row.generic_name,
    brandOrDosage: row.brand_or_dosage || undefined,
    dosageForm: row.dosage_form || 'Tablet',
    strength: row.strength || '',
    category: row.category || 'Essential Medicines',
    stockQuantity: Number(row.stock_quantity) || 0,
    unit: row.unit || 'capsules',
    reorderLevel: Number(row.reorder_level) || 50,
    minimumThreshold: Number(row.minimum_threshold) || 30,
    batchNumber: row.batch_number || '',
    expiryDate: row.expiry_date || '',
    requiresPrescription: Boolean(row.requires_prescription),
    dosingInstructions: row.dosing_instructions || '',
    indications: row.indications || '',
    donorOrSupplier: row.donor_or_supplier || 'City Health Office (CHO)',
    programSource: row.program_source || 'Barangay Health Allocation',
    status: row.status || 'In Stock',
    updatedAt: row.updated_at || new Date().toISOString(),
    lastRestocked: row.last_restocked || undefined,
  };
}

export function pharmacyItemToRow(item: PharmacyInventoryItem): any {
  return {
    id: item.id,
    generic_name: item.genericName || item.name || 'Medicine',
    brand_or_dosage: toNullableString(item.brandOrDosage),
    dosage_form: item.dosageForm || 'Tablet',
    strength: toNullableString(item.strength),
    category: item.category || 'Essential Medicines',
    stock_quantity: Number(item.stockQuantity) || 0,
    unit: item.unit || 'capsules',
    reorder_level: Number(item.reorderLevel) || 50,
    minimum_threshold: Number(item.minimumThreshold) || 30,
    batch_number: toNullableString(item.batchNumber),
    expiry_date: toValidDateOnly(item.expiryDate, null),
    requires_prescription: Boolean(item.requiresPrescription),
    dosing_instructions: toNullableString(item.dosingInstructions),
    indications: toNullableString(item.indications),
    donor_or_supplier: toNullableString(item.donorOrSupplier),
    program_source: toNullableString(item.programSource),
    status: sanitizePharmacyStatus(item.status),
    updated_at: new Date().toISOString(),
    last_restocked: toNullableString(item.lastRestocked),
  };
}

export async function upsertPharmacyItem(item: PharmacyInventoryItem) {
  const row = pharmacyItemToRow(item);
  const { data, error } = await supabase.from('pharmacy_inventory').upsert(row);
  if (error) {
    console.error('Supabase upsert pharmacy_inventory error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deletePharmacyItem(id: string) {
  return await supabase.from('pharmacy_inventory').delete().eq('id', id);
}

export function medicineRefillFromRow(row: any): MedicineRefillRequest {
  return {
    id: row.id,
    residentId: row.resident_id || '',
    residentName: row.resident_name || 'Resident',
    contactNumber: row.contact_number || '',
    medicineName: row.medicine_name,
    inventoryItemId: row.inventory_item_id || undefined,
    quantityRequested: Number(row.quantity_requested) || 1,
    prescriptionAttached: Boolean(row.prescription_attached),
    prescriptionImageUrl: row.prescription_image_url || undefined,
    doctorPrescriberName: row.doctor_prescriber_name || undefined,
    doctorLicenseNo: row.doctor_license_no || undefined,
    purpose: row.purpose || '',
    status: row.status || 'Pending Approval',
    pharmacistNotes: row.pharmacist_notes || undefined,
    dispensedBy: row.dispensed_by || undefined,
    dispensedAt: row.dispensed_at || undefined,
    batchDispensed: row.batch_dispensed || undefined,
    requestedAt: row.requested_at || new Date().toISOString(),
    approvedBy: row.approved_by || undefined,
  };
}

export function medicineRefillToRow(item: MedicineRefillRequest): any {
  return {
    id: item.id,
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Resident',
    contact_number: toNullableString(item.contactNumber),
    medicine_name: item.medicineName,
    inventory_item_id: toNullableString(item.inventoryItemId),
    quantity_requested: Number(item.quantityRequested) || 1,
    prescription_attached: Boolean(item.prescriptionAttached),
    prescription_image_url: toNullableString(item.prescriptionImageUrl),
    doctor_prescriber_name: toNullableString(item.doctorPrescriberName),
    doctor_license_no: toNullableString(item.doctorLicenseNo),
    purpose: item.purpose || 'Maintenance medication refill',
    status: sanitizeMedicineRefillStatus(item.status),
    pharmacist_notes: toNullableString(item.pharmacistNotes),
    dispensed_by: toNullableString(item.dispensedBy),
    dispensed_at: toNullableString(item.dispensedAt),
    batch_dispensed: toNullableString(item.batchDispensed),
    requested_at: item.requestedAt || new Date().toISOString(),
    approved_by: toNullableString(item.approvedBy),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertMedicineRefill(item: MedicineRefillRequest) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const row = medicineRefillToRow({ ...item, residentId: validResidentId || '' });
  const { data, error } = await supabase.from('medicine_refill_requests').upsert(row);
  if (error) {
    console.error('Supabase upsert medicine_refill_requests error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteMedicineRefill(id: string) {
  return await supabase.from('medicine_refill_requests').delete().eq('id', id);
}

export function healthMissionFromRow(row: any): HealthOutreachMission {
  return {
    id: row.id,
    title: row.title,
    missionType: row.mission_type || 'General Medical & Dental Mission',
    programType: row.program_type || 'General Medical & Dental',
    targetBeneficiaries: row.target_beneficiaries || 'All Residents',
    targetPurok: row.target_purok || 'All Puroks',
    date: row.mission_date || '',
    timeSchedule: row.time_schedule || '',
    venue: row.venue || '',
    leadProvider: row.lead_provider || '',
    maxSlots: Number(row.max_slots) || 100,
    registeredCount: Number(row.registered_count) || 0,
    registeredBeneficiaryIds: Array.isArray(row.registered_beneficiary_ids) ? row.registered_beneficiary_ids : [],
    description: row.description || '',
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    status: row.status || 'Upcoming',
    bannerColor: row.banner_color || undefined,
  };
}

export function healthMissionToRow(item: HealthOutreachMission): any {
  return {
    id: item.id,
    title: item.title,
    mission_type: item.missionType || 'General Medical & Dental Mission',
    program_type: item.programType || 'General Medical & Dental',
    target_beneficiaries: item.targetBeneficiaries || 'All Residents',
    target_purok: item.targetPurok || 'All Puroks',
    mission_date: toValidDateOnly(item.date, new Date().toISOString().split('T')[0]),
    time_schedule: item.timeSchedule || '08:00 AM - 04:00 PM',
    venue: item.venue || 'Barangay Gymnasium',
    lead_provider: item.leadProvider || 'City Health Office (CHO)',
    max_slots: Number(item.maxSlots) || 100,
    registered_count: Number(item.registeredCount) || 0,
    registered_beneficiary_ids: Array.isArray(item.registeredBeneficiaryIds) ? item.registeredBeneficiaryIds : [],
    description: item.description || '',
    requirements: Array.isArray(item.requirements) ? item.requirements : [],
    status: sanitizeHealthMissionStatus(item.status),
    banner_color: toNullableString(item.bannerColor),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertHealthMission(item: HealthOutreachMission) {
  const row = healthMissionToRow(item);
  const { data, error } = await supabase.from('health_outreach_missions').upsert(row);
  if (error) {
    console.error('Supabase upsert health_outreach_missions error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteHealthMission(id: string) {
  return await supabase.from('health_outreach_missions').delete().eq('id', id);
}

// ============================================================================
// 3. LIVELIHOOD & PESO JOBS
// ============================================================================

export function jobPostingFromRow(row: any): CommunityJobPosting {
  return {
    id: row.id,
    title: row.title,
    employerName: row.employer_name,
    location: row.location || 'Within Barangay / City Proper',
    employmentType: row.employment_type || 'Full-Time',
    salaryRange: row.salary_range || 'Competitive / Minimum Wage',
    vacancies: Number(row.vacancies) || 1,
    description: row.description || '',
    qualifications: Array.isArray(row.qualifications) ? row.qualifications : [],
    contactPerson: row.contact_person || '',
    contactNumber: row.contact_number || '',
    postedDate: row.posted_date || new Date().toISOString().split('T')[0],
    deadlineDate: row.deadline_date || undefined,
    isActive: Boolean(row.is_active),
  };
}

export function jobPostingToRow(item: CommunityJobPosting): any {
  return {
    id: item.id,
    title: item.title,
    employer_name: item.employerName,
    location: item.location || 'Within Barangay / City Proper',
    employment_type: item.employmentType || 'Full-Time',
    salary_range: item.salaryRange || 'Competitive / Minimum Wage',
    vacancies: Number(item.vacancies) || 1,
    description: item.description || '',
    qualifications: Array.isArray(item.qualifications) ? item.qualifications : [],
    contact_person: item.contactPerson || 'HR / Manager',
    contact_number: item.contactNumber || '0917-000-0000',
    posted_date: toValidDateOnly(item.postedDate, new Date().toISOString().split('T')[0]),
    deadline_date: toValidDateOnly(item.deadlineDate, null),
    is_active: Boolean(item.isActive),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertJobPosting(item: CommunityJobPosting) {
  const row = jobPostingToRow(item);
  const { data, error } = await supabase.from('job_postings').upsert(row);
  if (error) {
    console.error('Supabase upsert job_postings error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteJobPosting(id: string) {
  return await supabase.from('job_postings').delete().eq('id', id);
}

export function jobApplicationFromRow(row: any): JobApplicationRecord {
  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.job_title,
    employerName: row.employer_name,
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Applicant',
    contactNumber: row.contact_number || '',
    educationalAttainment: row.educational_attainment || 'High School Graduate',
    workExperience: row.work_experience || '',
    resumeFileName: row.resume_file_name || undefined,
    resumeFileData: row.resume_file_data || undefined,
    applicationLetterFileName: row.application_letter_file_name || undefined,
    applicationLetterFileData: row.application_letter_file_data || undefined,
    applicationLetterText: row.application_letter_text || undefined,
    appliedDate: row.applied_date || new Date().toISOString().split('T')[0],
    status: row.status || 'Submitted',
  };
}

export function jobApplicationToRow(item: JobApplicationRecord): any {
  return {
    id: item.id,
    job_id: item.jobId,
    job_title: item.jobTitle,
    employer_name: item.employerName,
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Applicant',
    contact_number: toNullableString(item.contactNumber),
    educational_attainment: item.educationalAttainment || 'High School Graduate',
    work_experience: item.workExperience || '',
    resume_file_name: toNullableString(item.resumeFileName),
    resume_file_data: toNullableString(item.resumeFileData),
    application_letter_file_name: toNullableString(item.applicationLetterFileName),
    application_letter_file_data: toNullableString(item.applicationLetterFileData),
    application_letter_text: toNullableString(item.applicationLetterText),
    applied_date: toValidDateOnly(item.appliedDate, new Date().toISOString().split('T')[0]),
    status: sanitizeJobAppStatus(item.status),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertJobApplication(item: JobApplicationRecord) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const validJobId = await resolveJobId(item.jobId);
  const row = jobApplicationToRow({
    ...item,
    jobId: validJobId || item.jobId,
    residentId: validResidentId || undefined,
  });
  const { data, error } = await supabase.from('job_applications').upsert(row);
  if (error) {
    console.error('Supabase upsert job_applications error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteJobApplication(id: string) {
  return await supabase.from('job_applications').delete().eq('id', id);
}

export function livelihoodTrainingFromRow(row: any): LivelihoodTrainingWorkshop {
  return {
    id: row.id,
    title: row.title,
    partnerAgency: row.partner_agency || 'TESDA / DTI Negosyo Center',
    slotsAvailable: Number(row.slots_available) || 0,
    slotsTotal: Number(row.slots_total) || 30,
    schedule: row.schedule || '',
    duration: row.duration || '5 Days (40 Hours)',
    venue: row.venue || 'Barangay Livelihood Skills Training Hub',
    starterKitProvided: Boolean(row.starter_kit_provided),
    trainerName: row.trainer_name || '',
    description: row.description || '',
    qualifications: Array.isArray(row.qualifications) ? row.qualifications : [],
    startDate: row.start_date || new Date().toISOString().split('T')[0],
    status: row.status || 'Open for Registration',
  };
}

export function livelihoodTrainingToRow(item: LivelihoodTrainingWorkshop): any {
  return {
    id: item.id,
    title: item.title,
    partner_agency: item.partnerAgency || 'TESDA / DTI Negosyo Center',
    slots_available: Number(item.slotsAvailable) || 0,
    slots_total: Number(item.slotsTotal) || 30,
    schedule: item.schedule || 'Monday to Friday 08:00 AM - 05:00 PM',
    duration: item.duration || '5 Days (40 Hours)',
    venue: item.venue || 'Barangay Livelihood Skills Training Hub',
    starter_kit_provided: Boolean(item.starterKitProvided),
    trainer_name: item.trainerName || 'Certified Trainer',
    description: item.description || '',
    qualifications: Array.isArray(item.qualifications) ? item.qualifications : [],
    start_date: toValidDateOnly(item.startDate, new Date().toISOString().split('T')[0]),
    status: sanitizeLivelihoodTrainingStatus(item.status),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertLivelihoodTraining(item: LivelihoodTrainingWorkshop) {
  const row = livelihoodTrainingToRow(item);
  const { data, error } = await supabase.from('livelihood_training_workshops').upsert(row);
  if (error) {
    console.error('Supabase upsert livelihood_training_workshops error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteLivelihoodTraining(id: string) {
  return await supabase.from('livelihood_training_workshops').delete().eq('id', id);
}

export function livelihoodEnrollmentFromRow(row: any): LivelihoodEnrollmentRecord {
  return {
    id: row.id,
    trainingId: row.training_id,
    trainingTitle: row.training_title,
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Enrollee',
    contactNumber: row.contact_number || '',
    purok: row.purok || '',
    educationalBackground: row.educational_background || 'High School Graduate',
    currentOccupation: row.current_occupation || 'None / Seeking Opportunity',
    intentReason: row.intent_reason || '',
    resumeFileName: row.resume_file_name || undefined,
    resumeFileData: row.resume_file_data || undefined,
    applicationLetterFileName: row.application_letter_file_name || undefined,
    applicationLetterFileData: row.application_letter_file_data || undefined,
    applicationLetterText: row.application_letter_text || undefined,
    enrolledDate: row.enrolled_date || new Date().toISOString().split('T')[0],
    status: row.status || 'Confirmed',
  };
}

export function livelihoodEnrollmentToRow(item: LivelihoodEnrollmentRecord): any {
  return {
    id: item.id,
    training_id: item.trainingId,
    training_title: item.trainingTitle,
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Enrollee',
    contact_number: toNullableString(item.contactNumber),
    purok: toNullableString(item.purok),
    educational_background: item.educationalBackground || 'High School Graduate',
    current_occupation: item.currentOccupation || 'None / Seeking Opportunity',
    intent_reason: item.intentReason || 'To acquire vocational skills and start home business',
    resume_file_name: toNullableString(item.resumeFileName),
    resume_file_data: toNullableString(item.resumeFileData),
    application_letter_file_name: toNullableString(item.applicationLetterFileName),
    application_letter_file_data: toNullableString(item.applicationLetterFileData),
    application_letter_text: toNullableString(item.applicationLetterText),
    enrolled_date: toValidDateOnly(item.enrolledDate, new Date().toISOString().split('T')[0]),
    status: sanitizeLivelihoodEnrollmentStatus(item.status),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertLivelihoodEnrollment(item: LivelihoodEnrollmentRecord) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const validTrainingId = await resolveTrainingId(item.trainingId);
  const row = livelihoodEnrollmentToRow({
    ...item,
    trainingId: validTrainingId || item.trainingId,
    residentId: validResidentId || undefined,
  });
  const { data, error } = await supabase.from('livelihood_enrollment_records').upsert(row);
  if (error) {
    console.error('Supabase upsert livelihood_enrollment_records error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteLivelihoodEnrollment(id: string) {
  return await supabase.from('livelihood_enrollment_records').delete().eq('id', id);
}

export function livelihoodAssistanceFromRow(row: any): LivelihoodAssistanceRequest {
  return {
    id: row.id,
    programType: row.program_type || 'Micro-Enterprise Seed Capital Grant',
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Resident',
    contactNumber: row.contact_number || '',
    purok: row.purok || '',
    proposedBusiness: row.proposed_business || '',
    estimatedBudget: Number(row.estimated_budget) || 0,
    requestedGrantAmount: Number(row.requested_grant_amount) || 0,
    approvedAmount: row.approved_amount ? Number(row.approved_amount) : undefined,
    targetStartDate: row.target_start_date || '',
    statementOfNeed: row.statement_of_need || '',
    businessPlanFileName: row.business_plan_file_name || undefined,
    businessPlanFileData: row.business_plan_file_data || undefined,
    endorsementLetterFileName: row.endorsement_letter_file_name || undefined,
    endorsementLetterFileData: row.endorsement_letter_file_data || undefined,
    status: row.status || 'Pending Review',
    reviewerNotes: row.reviewer_notes || undefined,
    resolutionReferenceNo: row.resolution_reference_no || undefined,
    dateRequested: row.date_requested || new Date().toISOString().split('T')[0],
    dateDisbursed: row.date_disbursed || undefined,
  };
}

export function livelihoodAssistanceToRow(item: LivelihoodAssistanceRequest): any {
  return {
    id: item.id,
    program_type: item.programType || 'Micro-Enterprise Seed Capital Grant',
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Resident',
    contact_number: toNullableString(item.contactNumber),
    purok: toNullableString(item.purok),
    proposed_business: item.proposedBusiness || 'Sari-Sari Store / Home Enterprise',
    estimated_budget: Number(item.estimatedBudget) || 15000,
    requested_grant_amount: Number(item.requestedGrantAmount) || 10000,
    approved_amount: item.approvedAmount ? Number(item.approvedAmount) : null,
    target_start_date: toValidDateOnly(item.targetStartDate, null),
    statement_of_need: item.statementOfNeed || 'Requesting seed capital grant for business equipment and supplies',
    business_plan_file_name: toNullableString(item.businessPlanFileName),
    business_plan_file_data: toNullableString(item.businessPlanFileData),
    endorsement_letter_file_name: toNullableString(item.endorsementLetterFileName),
    endorsement_letter_file_data: toNullableString(item.endorsementLetterFileData),
    status: sanitizeLivelihoodAssistanceStatus(item.status),
    reviewer_notes: toNullableString(item.reviewerNotes),
    resolution_reference_no: toNullableString(item.resolutionReferenceNo),
    date_requested: toValidDateOnly(item.dateRequested, new Date().toISOString().split('T')[0]),
    date_disbursed: toValidDateOnly(item.dateDisbursed, null),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertLivelihoodAssistance(item: LivelihoodAssistanceRequest) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const row = livelihoodAssistanceToRow({ ...item, residentId: validResidentId || undefined });
  const { data, error } = await supabase.from('livelihood_assistance_requests').upsert(row);
  if (error) {
    console.error('Supabase upsert livelihood_assistance_requests error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteLivelihoodAssistance(id: string) {
  return await supabase.from('livelihood_assistance_requests').delete().eq('id', id);
}

// ============================================================================
// 4. AYUDA & FINANCIAL AID (AICS)
// ============================================================================

export function ayudaClaimFromRow(row: any): AyudaClaimStub {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Beneficiary',
    purok: row.purok || '',
    householdNo: row.household_no || undefined,
    claimLocation: row.claim_location || 'Barangay Gymnasium Distribution Bay',
    distributionDate: row.distribution_date || new Date().toISOString().split('T')[0],
    timeSlot: row.time_slot || '08:00 AM - 12:00 PM',
    qrPayload: row.qr_payload || row.id,
    itemsIncluded: Array.isArray(row.items_included) ? row.items_included : [],
    status: row.status || 'Available to Claim',
    claimedAt: row.claimed_at || undefined,
    releasedBy: row.released_by || undefined,
  };
}

export function ayudaClaimToRow(item: AyudaClaimStub): any {
  return {
    id: item.id,
    title: item.title,
    category: item.category || 'Emergency Calamity Relief',
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Beneficiary',
    purok: toNullableString(item.purok),
    household_no: toNullableString(item.householdNo),
    claim_location: item.claimLocation || 'Barangay Gymnasium Distribution Bay',
    distribution_date: toValidDateOnly(item.distributionDate, new Date().toISOString().split('T')[0]),
    time_slot: item.timeSlot || '08:00 AM - 12:00 PM',
    qr_payload: item.qrPayload || item.id,
    items_included: Array.isArray(item.itemsIncluded) ? item.itemsIncluded : [],
    status: sanitizeAyudaClaimStatus(item.status),
    claimed_at: toNullableString(item.claimedAt),
    released_by: toNullableString(item.releasedBy),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertAyudaClaim(item: AyudaClaimStub) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const row = ayudaClaimToRow({ ...item, residentId: validResidentId || undefined });
  const { data, error } = await supabase.from('ayuda_claim_stubs').upsert(row);
  if (error) {
    console.error('Supabase upsert ayuda_claim_stubs error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteAyudaClaim(id: string) {
  return await supabase.from('ayuda_claim_stubs').delete().eq('id', id);
}

export function financialAssistanceFromRow(row: any): FinancialAssistanceRequest {
  return {
    id: row.id,
    assistanceType: row.assistance_type || 'Medical / Hospitalization Assistance',
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Beneficiary',
    contactNumber: row.contact_number || '',
    purok: row.purok || '',
    amountRequested: Number(row.amount_requested) || 0,
    beneficiaryName: row.beneficiary_name || row.resident_name || 'Beneficiary',
    justification: row.justification || '',
    documentsSubmitted: Array.isArray(row.documents_submitted) ? row.documents_submitted : [],
    status: row.status || 'Application Submitted',
    disbursedAmount: row.disbursed_amount ? Number(row.disbursed_amount) : undefined,
    disbursedDate: row.disbursed_date || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function financialAssistanceToRow(item: FinancialAssistanceRequest): any {
  return {
    id: item.id,
    assistance_type: item.assistanceType || 'Medical / Hospitalization Assistance',
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Beneficiary',
    contact_number: toNullableString(item.contactNumber),
    purok: toNullableString(item.purok),
    amount_requested: Number(item.amountRequested) || 0,
    beneficiary_name: item.beneficiaryName || item.residentName || 'Beneficiary',
    justification: item.justification || 'Financial assistance for medical / burial support',
    documents_submitted: Array.isArray(item.documentsSubmitted) ? item.documentsSubmitted : [],
    status: sanitizeFinancialAssistanceStatus(item.status),
    disbursed_amount: item.disbursedAmount ? Number(item.disbursedAmount) : null,
    disbursed_date: toValidDateOnly(item.disbursedDate, null),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertFinancialAssistance(item: FinancialAssistanceRequest) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const row = financialAssistanceToRow({ ...item, residentId: validResidentId || undefined });
  const { data, error } = await supabase.from('financial_assistance_requests').upsert(row);
  if (error) {
    console.error('Supabase upsert financial_assistance_requests error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteFinancialAssistance(id: string) {
  return await supabase.from('financial_assistance_requests').delete().eq('id', id);
}

// ============================================================================
// 5. SOLID WASTE & ENVIRONMENTAL MANAGEMENT
// ============================================================================

export function wasteScheduleFromRow(row: any): WasteCollectionSchedule {
  return {
    id: row.id,
    purokName: row.purok_name,
    wasteType: row.waste_type || 'Biodegradable (Nabubulok)',
    collectionDays: Array.isArray(row.collection_days) ? row.collection_days : (typeof row.collection_days === 'string' ? row.collection_days.split(',') : ['Monday', 'Wednesday']),
    pickupTime: row.pickup_time || '06:00 AM - 09:00 AM',
    assignedTruckNo: row.assigned_truck_no || 'Dump Truck #1',
    ecoOfficerInCharge: row.eco_officer_in_charge || 'Eco Tanod Officer',
    status: row.status || 'On Schedule',
    routeNotes: row.route_notes || undefined,
    driverName: row.driver_name || undefined,
    driverContact: row.driver_contact || undefined,
  };
}

export function wasteScheduleToRow(item: WasteCollectionSchedule): any {
  return {
    id: item.id,
    purok_name: item.purokName,
    waste_type: item.wasteType || 'Biodegradable (Nabubulok)',
    collection_days: Array.isArray(item.collectionDays) ? item.collectionDays : ['Monday', 'Wednesday'],
    pickup_time: item.pickupTime || '06:00 AM - 09:00 AM',
    assigned_truck_no: item.assignedTruckNo || 'Dump Truck #1',
    eco_officer_in_charge: item.ecoOfficerInCharge || 'Eco Tanod Officer',
    status: sanitizeWasteScheduleStatus(item.status),
    route_notes: toNullableString(item.routeNotes),
    driver_name: toNullableString(item.driverName),
    driver_contact: toNullableString(item.driverContact),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertWasteSchedule(item: WasteCollectionSchedule) {
  const row = wasteScheduleToRow(item);
  const { data, error } = await supabase.from('waste_collection_schedules').upsert(row);
  if (error) {
    console.error('Supabase upsert waste_collection_schedules error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteWasteSchedule(id: string) {
  return await supabase.from('waste_collection_schedules').delete().eq('id', id);
}

export function bulkWastePickupFromRow(row: any): BulkWastePickupRequest {
  return {
    id: row.id,
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Resident',
    contactNumber: row.contact_number || '',
    purok: row.purok || '',
    streetAddress: row.street_address || '',
    wasteDescription: row.waste_description || '',
    wasteCategory: row.waste_category || 'Pruned Branches / Green Waste',
    estimatedVolume: row.estimated_volume || '1 Small Dump Truck load',
    photoUrl: row.photo_url || undefined,
    preferredPickupDate: row.preferred_pickup_date || '',
    status: row.status || 'Pending Schedule',
    assignedCrew: row.assigned_crew || undefined,
    pickupTimeWindow: row.pickup_time_window || undefined,
    adminRemarks: row.admin_remarks || undefined,
    collectedAt: row.collected_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function bulkWastePickupToRow(item: BulkWastePickupRequest): any {
  return {
    id: item.id,
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Resident',
    contact_number: toNullableString(item.contactNumber),
    purok: toNullableString(item.purok),
    street_address: toNullableString(item.streetAddress),
    waste_description: item.wasteDescription || 'Bulk household debris',
    waste_category: item.wasteCategory || 'Pruned Branches / Green Waste',
    estimated_volume: item.estimatedVolume || '1 Small Dump Truck load',
    photo_url: toNullableString(item.photoUrl),
    preferred_pickup_date: toValidDateOnly(item.preferredPickupDate, new Date().toISOString().split('T')[0]),
    status: sanitizeBulkWasteStatus(item.status),
    assigned_crew: toNullableString(item.assignedCrew),
    pickup_time_window: toNullableString(item.pickupTimeWindow),
    admin_remarks: toNullableString(item.adminRemarks),
    collected_at: toNullableString(item.collectedAt),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertBulkWastePickup(item: BulkWastePickupRequest) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const row = bulkWastePickupToRow({ ...item, residentId: validResidentId || undefined });
  const { data, error } = await supabase.from('bulk_waste_pickup_requests').upsert(row);
  if (error) {
    console.error('Supabase upsert bulk_waste_pickup_requests error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteBulkWastePickup(id: string) {
  return await supabase.from('bulk_waste_pickup_requests').delete().eq('id', id);
}

export function cleanUpDriveFromRow(row: any): BayanihanCleanUpDrive {
  return {
    id: row.id,
    title: row.title,
    purokTarget: row.purok_target || '',
    activityDate: row.activity_date || '',
    assemblyTime: row.assembly_time || '06:00 AM',
    assemblyPoint: row.assembly_point || 'Purok Chapel',
    expectedVolunteers: Number(row.expected_volunteers) || 20,
    currentVolunteers: Number(row.current_volunteers) || 0,
    coordinator: row.coordinator || 'Hon. Environmental Kagawad',
    description: row.description || '',
    equipmentProvided: Array.isArray(row.equipment_provided) ? row.equipment_provided : [],
    status: row.status || 'Upcoming',
    targetLinearMeters: row.target_linear_meters ? String(row.target_linear_meters) : undefined,
    wasteCollectedSacks: row.waste_collected_sacks ? Number(row.waste_collected_sacks) : undefined,
    incentivePackage: row.incentive_package || undefined,
    beforeAfterPhotoUrl: row.before_after_photo_url || undefined,
  };
}

export function cleanUpDriveToRow(item: BayanihanCleanUpDrive): any {
  return {
    id: item.id,
    title: item.title,
    purok_target: item.purokTarget || 'All Puroks',
    activity_date: toValidDateOnly(item.activityDate, new Date().toISOString().split('T')[0]),
    assembly_time: item.assemblyTime || '06:00 AM',
    assembly_point: item.assemblyPoint || 'Purok Chapel / Covered Court',
    expected_volunteers: Number(item.expectedVolunteers) || 20,
    current_volunteers: Number(item.currentVolunteers) || 0,
    coordinator: item.coordinator || 'Hon. Environmental Kagawad',
    description: item.description || 'Community clean-up and declogging drive',
    equipment_provided: Array.isArray(item.equipmentProvided) ? item.equipmentProvided : ['Shovels', 'Gloves', 'Trash Bags'],
    status: sanitizeCleanUpDriveStatus(item.status),
    target_linear_meters: item.targetLinearMeters ? Number(item.targetLinearMeters) : null,
    waste_collected_sacks: item.wasteCollectedSacks ? Number(item.wasteCollectedSacks) : null,
    incentive_package: toNullableString(item.incentivePackage),
    before_after_photo_url: toNullableString(item.beforeAfterPhotoUrl),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertCleanUpDrive(item: BayanihanCleanUpDrive) {
  const row = cleanUpDriveToRow(item);
  const { data, error } = await supabase.from('bayanihan_clean_up_drives').upsert(row);
  if (error) {
    console.error('Supabase upsert bayanihan_clean_up_drives error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteCleanUpDrive(id: string) {
  return await supabase.from('bayanihan_clean_up_drives').delete().eq('id', id);
}

export function cleanUpVolunteerFromRow(row: any): BayanihanVolunteerRecord {
  return {
    id: row.id,
    driveId: row.drive_id,
    driveTitle: row.drive_title || 'Bayanihan Clean-Up Drive',
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Volunteer',
    contactNumber: row.contact_number || '',
    purok: row.purok || '',
    registeredDate: row.registered_date || new Date().toISOString().split('T')[0],
    volunteerRole: row.volunteer_role || 'Canal Dredging',
    hoursRendered: Number(row.hours_rendered) || 0,
    attendanceVerified: Boolean(row.attendance_verified),
    verifiedBy: row.verified_by || undefined,
    certificateCode: row.certificate_code || undefined,
    certificateIssuedAt: row.certificate_issued_at || undefined,
  };
}

export function cleanUpVolunteerToRow(item: BayanihanVolunteerRecord): any {
  return {
    id: item.id,
    drive_id: item.driveId,
    drive_title: item.driveTitle || 'Bayanihan Clean-Up Drive',
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Volunteer',
    contact_number: toNullableString(item.contactNumber),
    purok: toNullableString(item.purok),
    registered_date: toValidDateOnly(item.registeredDate, new Date().toISOString().split('T')[0]),
    volunteer_role: item.volunteerRole || 'General Cleaning',
    hours_rendered: Number(item.hoursRendered) || 0,
    attendance_verified: Boolean(item.attendanceVerified),
    verified_by: toNullableString(item.verifiedBy),
    certificate_code: toNullableString(item.certificateCode),
    certificate_issued_at: toValidDateOnly(item.certificateIssuedAt, null),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertCleanUpVolunteer(item: BayanihanVolunteerRecord) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const validDriveId = await resolveCleanUpDriveId(item.driveId);
  const row = cleanUpVolunteerToRow({
    ...item,
    driveId: validDriveId || item.driveId,
    residentId: validResidentId || undefined,
  });
  const { data, error } = await supabase.from('bayanihan_volunteer_records').upsert(row);
  if (error) {
    console.error('Supabase upsert bayanihan_volunteer_records error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteCleanUpVolunteer(id: string) {
  return await supabase.from('bayanihan_volunteer_records').delete().eq('id', id);
}

export function illegalDumpingReportFromRow(row: any): IllegalDumpingReport {
  return {
    id: row.id,
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Concerned Citizen',
    contactNumber: row.contact_number || '',
    purok: row.purok || '',
    exactLocationOrLandmark: row.exact_location_or_landmark || '',
    violationType: row.violation_type || 'Unsegregated Waste Pile',
    description: row.description || '',
    photoUrl: row.photo_url || undefined,
    severityLevel: row.severity_level || 'Medium',
    status: row.status || 'Report Received',
    assignedTanodOrCrew: row.assigned_tanod_or_crew || undefined,
    resolutionRemarks: row.resolution_remarks || undefined,
    reportedAt: row.reported_at || new Date().toISOString(),
    resolvedAt: row.resolved_at || undefined,
  };
}

export function illegalDumpingReportToRow(item: IllegalDumpingReport): any {
  return {
    id: item.id,
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Concerned Citizen',
    contact_number: toNullableString(item.contactNumber),
    purok: toNullableString(item.purok),
    exact_location_or_landmark: item.exactLocationOrLandmark || 'Near Roadside',
    violation_type: item.violationType || 'Unsegregated Waste Pile',
    description: item.description || 'Illegal dumping observed',
    photo_url: toNullableString(item.photoUrl),
    severity_level: item.severityLevel || 'Medium',
    status: sanitizeIllegalDumpingStatus(item.status),
    assigned_tanod_or_crew: toNullableString(item.assignedTanodOrCrew),
    resolution_remarks: toNullableString(item.resolutionRemarks),
    reported_at: item.reportedAt || new Date().toISOString(),
    resolved_at: toNullableString(item.resolvedAt),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertIllegalDumpingReport(item: IllegalDumpingReport) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const row = illegalDumpingReportToRow({ ...item, residentId: validResidentId || undefined });
  const { data, error } = await supabase.from('illegal_dumping_reports').upsert(row);
  if (error) {
    console.error('Supabase upsert illegal_dumping_reports error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteIllegalDumpingReport(id: string) {
  return await supabase.from('illegal_dumping_reports').delete().eq('id', id);
}

export function mrfDropRecordFromRow(row: any): MRFRecyclablesDropRecord {
  return {
    id: row.id,
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Resident',
    purok: row.purok || '',
    itemCategory: row.item_category || 'Plastic Bottles (PET / HDPE)',
    weightKg: Number(row.weight_kg) || 0,
    rewardType: row.reward_type || 'Rice Redemption Incentive',
    rewardValue: row.reward_value || '',
    officerInCharge: row.officer_in_charge || 'MRF Eco Staff',
    loggedDate: row.logged_date || new Date().toISOString().split('T')[0],
  };
}

export function mrfDropRecordToRow(item: MRFRecyclablesDropRecord): any {
  return {
    id: item.id,
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Resident',
    purok: toNullableString(item.purok),
    item_category: item.itemCategory || 'Plastic Bottles (PET / HDPE)',
    weight_kg: Number(item.weightKg) || 0,
    reward_type: item.rewardType || 'Rice Redemption Incentive',
    reward_value: toNullableString(item.rewardValue),
    officer_in_charge: item.officerInCharge || 'MRF Eco Staff',
    logged_date: toValidDateOnly(item.loggedDate, new Date().toISOString().split('T')[0]),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertMRFDropRecord(item: MRFRecyclablesDropRecord) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const row = mrfDropRecordToRow({ ...item, residentId: validResidentId || undefined });
  const { data, error } = await supabase.from('mrf_recyclables_drop_records').upsert(row);
  if (error) {
    console.error('Supabase upsert mrf_recyclables_drop_records error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteMRFDropRecord(id: string) {
  return await supabase.from('mrf_recyclables_drop_records').delete().eq('id', id);
}

// ============================================================================
// 6. SK YOUTH TOURNAMENTS & SENIOR / PWD AFFAIRS
// ============================================================================

export function skTournamentFromRow(row: any): SKTournamentActivity {
  return {
    id: row.id,
    title: row.title,
    category: row.category || 'Basketball Tournament',
    targetAgeGroup: row.target_age_group || '15 - 30 Years Old (SK Registered)',
    scheduleDates: row.schedule_dates || '',
    venue: row.venue || 'Barangay Sangkol Multi-Purpose Covered Gymnasium',
    prizes: row.prizes || '',
    registrationStatus: row.registration_status || 'Registration Open',
    skContactPerson: row.sk_contact_person || 'Hon. SK Chairperson',
    contactNumber: row.contact_number || '0917-000-0000',
  };
}

export function skTournamentToRow(item: SKTournamentActivity): any {
  return {
    id: item.id,
    title: item.title,
    category: item.category || 'Basketball Tournament',
    target_age_group: item.targetAgeGroup || '15 - 30 Years Old (SK Registered)',
    schedule_dates: item.scheduleDates || '',
    venue: item.venue || 'Barangay Sangkol Multi-Purpose Covered Gymnasium',
    prizes: item.prizes || '',
    registration_status: sanitizeSKTournamentStatus(item.registrationStatus),
    sk_contact_person: item.skContactPerson || 'Hon. SK Chairperson',
    contact_number: toNullableString(item.contactNumber),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertSKTournament(item: SKTournamentActivity) {
  const row = skTournamentToRow(item);
  const { data, error } = await supabase.from('sk_tournament_activities').upsert(row);
  if (error) {
    console.error('Supabase upsert sk_tournament_activities error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteSKTournament(id: string) {
  return await supabase.from('sk_tournament_activities').delete().eq('id', id);
}

export function skRegistrationFromRow(row: any): SKRegistrationRecord {
  return {
    id: row.id,
    activityId: row.activity_id,
    activityTitle: row.activity_title || '',
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Youth Participant',
    age: Number(row.age) || 18,
    purok: row.purok || '',
    teamOrCategory: row.team_or_category || '',
    registeredDate: row.registered_date || new Date().toISOString().split('T')[0],
    status: row.status || 'Registered & Confirmed',
  };
}

export function skRegistrationToRow(item: SKRegistrationRecord): any {
  return {
    id: item.id,
    activity_id: item.activityId,
    activity_title: item.activityTitle || '',
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Youth Participant',
    age: Number(item.age) || 18,
    purok: toNullableString(item.purok),
    team_or_category: item.teamOrCategory || '',
    registered_date: toValidDateOnly(item.registeredDate, new Date().toISOString().split('T')[0]),
    status: sanitizeSKRegistrationStatus(item.status),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertSKRegistration(item: SKRegistrationRecord) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const validActId = await resolveSKTournamentId(item.activityId);
  const row = skRegistrationToRow({
    ...item,
    activityId: validActId || item.activityId,
    residentId: validResidentId || undefined,
  });
  const { data, error } = await supabase.from('sk_registration_records').upsert(row);
  if (error) {
    console.error('Supabase upsert sk_registration_records error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteSKRegistration(id: string) {
  return await supabase.from('sk_registration_records').delete().eq('id', id);
}

export function seniorBenefitScheduleFromRow(row: any): SeniorCitizenBenefitSchedule {
  return {
    id: row.id,
    title: row.title,
    category: row.category || 'Quarterly Social Pension Distribution (DSWD / OSCA)',
    purokCoverage: row.purok_coverage || 'All Puroks',
    distributionDate: row.distribution_date || new Date().toISOString().split('T')[0],
    venue: row.venue || 'Barangay Gymnasium',
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    status: row.status || 'Upcoming Release',
  };
}

export function seniorBenefitScheduleToRow(item: SeniorCitizenBenefitSchedule): any {
  return {
    id: item.id,
    title: item.title,
    category: item.category || 'Quarterly Social Pension Distribution (DSWD / OSCA)',
    purok_coverage: item.purokCoverage || 'All Puroks',
    distribution_date: toValidDateOnly(item.distributionDate, new Date().toISOString().split('T')[0]),
    venue: item.venue || 'Barangay Gymnasium',
    requirements: Array.isArray(item.requirements) ? item.requirements : [],
    status: sanitizeSeniorBenefitStatus(item.status),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertSeniorBenefitSchedule(item: SeniorCitizenBenefitSchedule) {
  const row = seniorBenefitScheduleToRow(item);
  const { data, error } = await supabase.from('senior_citizen_benefit_schedules').upsert(row);
  if (error) {
    console.error('Supabase upsert senior_citizen_benefit_schedules error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteSeniorBenefitSchedule(id: string) {
  return await supabase.from('senior_citizen_benefit_schedules').delete().eq('id', id);
}

export function assistiveDeviceRequestFromRow(row: any): AssistiveDeviceRequest {
  return {
    id: row.id,
    residentId: row.resident_id || undefined,
    residentName: row.resident_name || 'Resident',
    beneficiaryName: row.beneficiary_name || row.resident_name || 'Beneficiary',
    beneficiaryAge: Number(row.beneficiary_age) || 60,
    purok: row.purok || '',
    deviceRequested: row.device_requested || 'Wheelchair',
    medicalConditionReason: row.medical_condition_reason || '',
    priorityLevel: row.priority_level || 'Standard',
    status: row.status || 'Submitted',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function assistiveDeviceRequestToRow(item: AssistiveDeviceRequest): any {
  return {
    id: item.id,
    resident_id: toNullableString(item.residentId),
    resident_name: item.residentName || 'Resident',
    beneficiary_name: item.beneficiaryName || item.residentName || 'Beneficiary',
    beneficiary_age: Number(item.beneficiaryAge) || 60,
    purok: toNullableString(item.purok),
    device_requested: item.deviceRequested || 'Wheelchair',
    medical_condition_reason: item.medicalConditionReason || 'Mobility Assistance Needed',
    priority_level: sanitizeAssistivePriority(item.priorityLevel),
    status: sanitizeAssistiveDeviceStatus(item.status),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertAssistiveDeviceRequest(item: AssistiveDeviceRequest) {
  const validResidentId = await resolveValidResidentId(item.residentId);
  const row = assistiveDeviceRequestToRow({ ...item, residentId: validResidentId || undefined });
  const { data, error } = await supabase.from('assistive_device_requests').upsert(row);
  if (error) {
    console.error('Supabase upsert assistive_device_requests error:', error.message);
    throw new Error(error.message);
  }
  return { data, error: null };
}

export async function deleteAssistiveDeviceRequest(id: string) {
  return await supabase.from('assistive_device_requests').delete().eq('id', id);
}

// ============================================================================
// FULL COMMUNITY DATABASE FETCH & PARALLEL SYNC
// ============================================================================

export interface CommunityServicesFullDatabase {
  facilityReservations: FacilityReservation[];
  equipmentReservations: EquipmentReservation[];
  healthAppointments: HealthAppointment[];
  childImmunizations: ChildImmunizationTracker[];
  pharmacyInventory: PharmacyInventoryItem[];
  medicineRefills: MedicineRefillRequest[];
  healthMissions: HealthOutreachMission[];
  jobPostings: CommunityJobPosting[];
  jobApplications: JobApplicationRecord[];
  livelihoodTrainings: LivelihoodTrainingWorkshop[];
  livelihoodEnrollments: LivelihoodEnrollmentRecord[];
  livelihoodAssistance: LivelihoodAssistanceRequest[];
  ayudaClaims: AyudaClaimStub[];
  financialAssistance: FinancialAssistanceRequest[];
  wasteSchedules: WasteCollectionSchedule[];
  bulkWasteRequests: BulkWastePickupRequest[];
  bulkWastePickups?: BulkWastePickupRequest[];
  cleanUpDrives: BayanihanCleanUpDrive[];
  cleanUpVolunteers: BayanihanVolunteerRecord[];
  illegalDumpingReports: IllegalDumpingReport[];
  mrfDropRecords: MRFRecyclablesDropRecord[];
  skTournaments: SKTournamentActivity[];
  skRegistrations: SKRegistrationRecord[];
  seniorBenefits: SeniorCitizenBenefitSchedule[];
  seniorBenefitSchedules?: SeniorCitizenBenefitSchedule[];
  assistiveDeviceRequests: AssistiveDeviceRequest[];
}

export async function fetchFullCommunityDatabase(): Promise<CommunityServicesFullDatabase> {
  const [
    facRes,
    eqRes,
    hlthRes,
    immRes,
    pharmRes,
    medRes,
    missRes,
    jobRes,
    appRes,
    trnRes,
    enrRes,
    livAssRes,
    ayuRes,
    finRes,
    wstRes,
    bulkRes,
    drvRes,
    volRes,
    dmpRes,
    mrfRes,
    skTRes,
    skRRes,
    senRes,
    devRes,
  ] = await Promise.all([
    supabase.from('facility_reservations').select('*').order('reservation_date', { ascending: true }),
    supabase.from('equipment_reservations').select('*').order('borrow_date', { ascending: true }),
    supabase.from('health_appointments').select('*').order('preferred_date', { ascending: true }),
    supabase.from('child_immunizations').select('*').order('due_date', { ascending: true }),
    supabase.from('pharmacy_inventory').select('*').order('generic_name', { ascending: true }),
    supabase.from('medicine_refill_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('health_outreach_missions').select('*').order('mission_date', { ascending: true }),
    supabase.from('job_postings').select('*').order('posted_date', { ascending: false }),
    supabase.from('job_applications').select('*').order('applied_date', { ascending: false }),
    supabase.from('livelihood_training_workshops').select('*').order('start_date', { ascending: true }),
    supabase.from('livelihood_enrollment_records').select('*').order('enrolled_date', { ascending: false }),
    supabase.from('livelihood_assistance_requests').select('*').order('date_requested', { ascending: false }),
    supabase.from('ayuda_claim_stubs').select('*').order('distribution_date', { ascending: false }),
    supabase.from('financial_assistance_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('waste_collection_schedules').select('*').order('purok_name', { ascending: true }),
    supabase.from('bulk_waste_pickup_requests').select('*').order('preferred_pickup_date', { ascending: false }),
    supabase.from('bayanihan_clean_up_drives').select('*').order('activity_date', { ascending: false }),
    supabase.from('bayanihan_volunteer_records').select('*').order('registered_date', { ascending: false }),
    supabase.from('illegal_dumping_reports').select('*').order('reported_at', { ascending: false }),
    supabase.from('mrf_recyclables_drop_records').select('*').order('logged_date', { ascending: false }),
    supabase.from('sk_tournament_activities').select('*').order('title', { ascending: true }),
    supabase.from('sk_registration_records').select('*').order('registered_date', { ascending: false }),
    supabase.from('senior_citizen_benefit_schedules').select('*').order('distribution_date', { ascending: false }),
    supabase.from('assistive_device_requests').select('*').order('created_at', { ascending: false }),
  ]);

  const bulkList = (bulkRes.data || []).map(bulkWastePickupFromRow);
  const seniorList = (senRes.data || []).map(seniorBenefitScheduleFromRow);

  return {
    facilityReservations: (facRes.data || []).map(facilityReservationFromRow),
    equipmentReservations: (eqRes.data || []).map(equipmentReservationFromRow),
    healthAppointments: (hlthRes.data || []).map(healthAppointmentFromRow),
    childImmunizations: (immRes.data || []).map(childImmunizationFromRow),
    pharmacyInventory: (pharmRes.data || []).map(pharmacyItemFromRow),
    medicineRefills: (medRes.data || []).map(medicineRefillFromRow),
    healthMissions: (missRes.data || []).map(healthMissionFromRow),
    jobPostings: (jobRes.data || []).map(jobPostingFromRow),
    jobApplications: (appRes.data || []).map(jobApplicationFromRow),
    livelihoodTrainings: (trnRes.data || []).map(livelihoodTrainingFromRow),
    livelihoodEnrollments: (enrRes.data || []).map(livelihoodEnrollmentFromRow),
    livelihoodAssistance: (livAssRes.data || []).map(livelihoodAssistanceFromRow),
    ayudaClaims: (ayuRes.data || []).map(ayudaClaimFromRow),
    financialAssistance: (finRes.data || []).map(financialAssistanceFromRow),
    wasteSchedules: (wstRes.data || []).map(wasteScheduleFromRow),
    bulkWasteRequests: bulkList,
    bulkWastePickups: bulkList,
    cleanUpDrives: (drvRes.data || []).map(cleanUpDriveFromRow),
    cleanUpVolunteers: (volRes.data || []).map(cleanUpVolunteerFromRow),
    illegalDumpingReports: (dmpRes.data || []).map(illegalDumpingReportFromRow),
    mrfDropRecords: (mrfRes.data || []).map(mrfDropRecordFromRow),
    skTournaments: (skTRes.data || []).map(skTournamentFromRow),
    skRegistrations: (skRRes.data || []).map(skRegistrationFromRow),
    seniorBenefits: seniorList,
    seniorBenefitSchedules: seniorList,
    assistiveDeviceRequests: (devRes.data || []).map(assistiveDeviceRequestFromRow),
  };
}

// ============================================================================
// AUTO-SEEDER: DISABLED TO PREVENT MOCK DATA INSERTION
// All records are strictly sourced from and managed in Supabase
// ============================================================================

export async function seedCommunityServicesIfEmpty(_overrides?: any): Promise<void> {
  // Disabled: System strictly uses live Supabase data; no mock records are auto-seeded.
  return;
}

// ============================================================================
// EXPORT ALIASES FOR DELETE OPERATIONS MATCHING *FromSupabase
// ============================================================================

export const deleteFacilityReservationFromSupabase = deleteFacilityReservation;
export const deleteEquipmentReservationFromSupabase = deleteEquipmentReservation;
export const deleteHealthAppointmentFromSupabase = deleteHealthAppointment;
export const deleteChildImmunizationFromSupabase = deleteChildImmunization;
export const deletePharmacyItemFromSupabase = deletePharmacyItem;
export const deleteMedicineRefillFromSupabase = deleteMedicineRefill;
export const deleteHealthMissionFromSupabase = deleteHealthMission;
export const deleteJobPostingFromSupabase = deleteJobPosting;
export const deleteJobApplicationFromSupabase = deleteJobApplication;
export const deleteLivelihoodTrainingFromSupabase = deleteLivelihoodTraining;
export const deleteLivelihoodEnrollmentFromSupabase = deleteLivelihoodEnrollment;
export const deleteLivelihoodAssistanceFromSupabase = deleteLivelihoodAssistance;
export const deleteAyudaClaimFromSupabase = deleteAyudaClaim;
export const deleteFinancialAssistanceFromSupabase = deleteFinancialAssistance;
export const deleteWasteScheduleFromSupabase = deleteWasteSchedule;
export const deleteBulkWastePickupFromSupabase = deleteBulkWastePickup;
export const deleteCleanUpDriveFromSupabase = deleteCleanUpDrive;
export const deleteCleanUpVolunteerFromSupabase = deleteCleanUpVolunteer;
export const deleteIllegalDumpingReportFromSupabase = deleteIllegalDumpingReport;
export const deleteMRFDropRecordFromSupabase = deleteMRFDropRecord;
export const deleteSKTournamentFromSupabase = deleteSKTournament;
export const deleteSKRegistrationFromSupabase = deleteSKRegistration;
export const deleteSeniorBenefitScheduleFromSupabase = deleteSeniorBenefitSchedule;
export const deleteAssistiveDeviceRequestFromSupabase = deleteAssistiveDeviceRequest;

