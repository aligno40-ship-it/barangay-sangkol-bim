import {
  SMSAlertRecord,
  CertificateRecord,
  BlotterRecord,
  ComplaintRecord,
  AnnouncementRecord,
  AppointmentRecord,
  CitizenConcern,
  BarangaySettings,
  AlertChannel,
  SMSGatewaySettings,
} from '../types';

export const INITIAL_SMS_GATEWAY_SETTINGS: SMSGatewaySettings = {
  provider: 'GovPH Infobip SMS Gateway',
  senderId: 'BRGY-SANGKOL',
  apiKeyMasked: 'gov_ph_sms_sec_99482••••••••••381',
  smsQuotaRemaining: 4850,
  emailSmtpServer: 'smtp.gov.ph (SSL/TLS 465)',
  emailSenderAddress: 'alerts@barangaysangkol.gov.ph',
  autoAlertCertificateReady: true,
  autoAlertHearingSchedule: true,
  autoAlertEmergencyAnnouncements: true,
  autoAlertAppointments: true,
  autoAlertCitizenConcerns: true,
};

export const INITIAL_SMS_ALERTS: SMSAlertRecord[] = [
  {
    id: 'SMS-2026-0045',
    recipientName: 'Maria Santos Cruz',
    recipientPhone: '0917-889-2231',
    recipientEmail: 'maria.cruz@gmail.com',
    recipientResidentId: 'BS-RES-2026-0002',
    purok: 'Purok Mangga',
    category: 'Certificate Ready',
    subject: 'Barangay Clearance Ready for Pickup (Ctrl #SNG-CLR-2026-0001)',
    smsMessage:
      'BRGY SANGKOL: Maayong adlaw Maria Santos Cruz! Your requested Barangay Clearance (Ctrl #SNG-CLR-2026-0001) is APPROVED & READY for pickup at Window 1, Brgy Hall. Fee: ₱50.00. Bring 1 valid ID. You may also download digital copy in Citizen Portal. Salamat!',
    emailBody: `Dear Maria Santos Cruz,\n\nWe are pleased to inform you that your application for Barangay Clearance (Control No: SNG-CLR-2026-0001) has been approved and officially processed by the Sangguniang Barangay of Sangkol.\n\nPickup Location: Window 1 (Clearance & Releasing Desk), Barangay Hall\nOffice Hours: Mon-Fri 8:00 AM - 5:00 PM\nAmount Due: ₱50.00 (OR #OR-2026-0001)\n\nThank you for transacting with Barangay Sangkol.`,
    channel: 'Both',
    sender: 'BRGY-SANGKOL',
    status: 'Delivered',
    timestamp: '2026-08-28 14:15:00',
    relatedRecordId: 'CERT-2026-0001',
    relatedRecordType: 'certificate',
    metadata: {
      controlNumber: 'SNG-CLR-2026-0001',
      certificateType: 'Barangay Clearance',
      amount: 50,
      pickupInstructions: 'Window 1, Barangay Hall. Bring 1 valid ID.',
    },
  },
  {
    id: 'SMS-2026-0044',
    recipientName: 'Roberto Gomez',
    recipientPhone: '0928-334-1122',
    recipientEmail: 'roberto.gomez@gmail.com',
    recipientResidentId: 'BS-RES-2026-0003',
    purok: 'Purok Pinya',
    category: 'Hearing Schedule / Summons',
    subject: 'OFFICIAL NOTICE OF HEARING: Lupon Case #LUPON-2026-001 (Boundary Dispute)',
    smsMessage:
      'NOTICE TO APPEAR: Roberto Gomez, you are summoned for 1st Mediation Hearing for Case #LUPON-2026-001 on Aug 30, 2026 at 02:00 PM at Barangay Sangkol Session Hall before Punong Barangay Hon. Juan M. Dela Cruz. Non-appearance has legal consequences under RA 7160. - Lupon Secretariat',
    emailBody: `REPUBLIC OF THE PHILIPPINES\nBARANGAY SANGKOL, DIPOLOG CITY\nOFFICE OF THE LUPON TAGAPAMAYAPA\n\nNOTICE OF HEARING & SUMMONS (PATAWAG)\n\nTo: Roberto Gomez\nCase Number: LUPON-2026-001\nCase Title: Boundary / Fence Dispute\nComplainant: Juan M. Dela Cruz\n\nYou are hereby summoned to appear before the Punong Barangay / Lupon Tagapamayapa on:\nDate: August 30, 2026\nTime: 02:00 PM\nVenue: Barangay Session Hall, Sangkol Hall\n\nPlease arrive 15 minutes before the scheduled hearing. Failure to appear without valid justifiable excuse may waive your defenses or cause the issuance of Certificate to File Action (CFA).`,
    channel: 'Both',
    sender: 'BRGY-SANGKOL',
    status: 'Delivered',
    timestamp: '2026-08-28 11:30:00',
    relatedRecordId: 'KP-2026-001',
    relatedRecordType: 'complaint',
    metadata: {
      caseNumber: 'LUPON-2026-001',
      hearingDate: '2026-08-30',
      hearingTime: '02:00 PM',
      hearingVenue: 'Barangay Session Hall',
      hearingStage: '1st Mediation',
      mediator: 'Hon. Juan M. Dela Cruz (Punong Barangay)',
    },
  },
  {
    id: 'SMS-2026-0043',
    recipientName: 'All Residents (Broadcast)',
    recipientPhone: 'Blast (All 6 Puroks)',
    recipientEmail: 'residents-all@barangaysangkol.gov.ph',
    purok: 'All Puroks',
    category: 'Emergency / Disaster Advisory',
    subject: '🚨 EMERGENCY WEATHER ADVISORY: Tropical Cyclone Wind Signal #2 Alert',
    smsMessage:
      '🚨 EMERGENCY ALERT - BRGY SANGKOL: Tropical Cyclone Signal #2 declared. Moderate to heavy rainfall expected. Low-lying Purok Lumboy & Bayabas residents please prepare for possible evacuation to Sangkol Central Gym. MDRRMO Hotline: 0917-555-4321 / Tanod: 0928-123-4567. Mag-amping kita tanan!',
    emailBody: `BARANGAY SANGKOL DISASTER RISK REDUCTION & MANAGEMENT COUNCIL (BDRRMC)\n\nURGENT WEATHER & FLOOD ADVISORY\n\nPAGASA has hoisted Tropical Cyclone Wind Signal #2 over the province. Moderate to intense rains and strong gusts are anticipated.\n\nSAFETY GUIDELINES:\n1. Secure loose roofs, windows, and light fixtures.\n2. Store drinking water and non-perishable food supplies.\n3. Keep mobile phones and flashlights charged.\n4. Primary Evacuation Center: Barangay Sangkol Covered Court & Central Gym.\n\nHotlines:\n- BDRRMC Operation Center: 0917-555-4321\n- Barangay Tanod Base: 0928-123-4567\n- Dipolog City Rescue 911`,
    channel: 'Both',
    sender: 'BRGY-SANGKOL',
    status: 'Delivered',
    timestamp: '2026-08-28 09:00:00',
    relatedRecordId: 'ANN-2026-003',
    relatedRecordType: 'announcement',
    metadata: {
      emergencyLevel: 'Signal #2 Alert',
    },
  },
  {
    id: 'SMS-2026-0042',
    recipientName: 'Elena Ramos',
    recipientPhone: '0919-445-8899',
    recipientEmail: 'elena.ramos@gmail.com',
    recipientResidentId: 'BS-RES-2026-0004',
    purok: 'Purok Lumboy',
    category: 'Appointment Reminder',
    subject: 'Appointment Confirmation: Barangay Captain Consultation on Aug 29',
    smsMessage:
      'BRGY SANGKOL: Hi Elena Ramos, this is a reminder for your confirmed appointment regarding "Livelihood Assistance Consultation" on Aug 29, 2026 at 10:00 AM with Hon. Juan M. Dela Cruz at Office of the Punong Barangay. Please arrive 10 mins prior.',
    emailBody: `Dear Elena Ramos,\n\nThis is an official confirmation for your booked appointment with the Office of the Punong Barangay.\n\nDate: August 29, 2026\nTime: 10:00 AM\nPurpose: Livelihood Assistance Consultation\nOfficial: Hon. Juan M. Dela Cruz (Punong Barangay)\nVenue: Office of the Punong Barangay, Sangkol Hall\n\nThank you.`,
    channel: 'Both',
    sender: 'BRGY-SANGKOL',
    status: 'Delivered',
    timestamp: '2026-08-27 16:20:00',
    relatedRecordId: 'APT-2026-001',
    relatedRecordType: 'appointment',
  },
];

/**
 * Format and construct standard Philippine LGU SMS and Email content
 */
export const buildCertificateReadySMS = (
  cert: CertificateRecord,
  settings: BarangaySettings
): { sms: string; emailSubject: string; emailBody: string } => {
  const isDigital = cert.deliveryOption === 'Digital Copy';
  const feeStr = cert.fee > 0 ? `₱${cert.fee.toFixed(2)}` : 'FREE / WAIVED';
  const orStr = cert.orNumber ? ` (OR #${cert.orNumber})` : '';

  const sms = `BRGY SANGKOL: Maayong adlaw ${cert.residentName}! Your requested ${cert.type} (Ctrl #${cert.controlNumber}) is APPROVED & READY. ${
    isDigital
      ? 'You can now view, download & print your official e-certificate via the Citizen Portal.'
      : `Claim at Window 1, Barangay Hall. Fee: ${feeStr}${orStr}. Bring 1 valid ID. ${cert.pickupInstructions || ''}`
  } Salamat!`;

  const emailSubject = `Official Notice: ${cert.type} Approved & Ready (Control #${cert.controlNumber})`;

  const emailBody = `REPUBLIC OF THE PHILIPPINES\nBARANGAY SANGKOL, ${settings.municipality.toUpperCase()}\nOFFICE OF THE PUNONG BARANGAY\n\nCERTIFICATE APPROVAL & RELEASING ADVISORY\n\nDear ${cert.residentName},\n\nWe are pleased to inform you that your request for ${cert.type} has been approved and issued.\n\n• Document: ${cert.type}\n• Control Number: ${cert.controlNumber}\n• Purpose: ${cert.purpose}\n• Signatory: ${cert.signatoryOfficial} (${cert.signatoryPosition})\n• Date Issued: ${cert.dateIssued}\n• Total Fee: ${feeStr} ${orStr}\n• Delivery Mode: ${cert.deliveryOption || 'Barangay Hall Window Pickup'}\n\nPickup Instructions: ${cert.pickupInstructions || 'Window 1 (Clearance Desk), Barangay Hall. Bring 1 valid government ID.'}\n\nYou can also verify the authenticity of your certificate at any time using the official Barangay QR code.\n\nSangguniang Barangay of Sangkol`;

  return { sms, emailSubject, emailBody };
};

export const buildHearingSummonsSMS = (params: {
  caseNumber: string;
  caseTitle: string;
  recipientName: string;
  hearingDate: string;
  hearingTime: string;
  hearingStage?: string;
  venue?: string;
  mediator?: string;
  role: 'Complainant' | 'Respondent';
  settings: BarangaySettings;
}): { sms: string; emailSubject: string; emailBody: string } => {
  const {
    caseNumber,
    caseTitle,
    recipientName,
    hearingDate,
    hearingTime,
    hearingStage = '1st Mediation',
    venue = 'Barangay Sangkol Session Hall',
    mediator = 'Hon. Juan M. Dela Cruz (Punong Barangay)',
    role,
    settings,
  } = params;

  const sms = `NOTICE TO APPEAR: ${recipientName} (${role}), you are summoned for ${hearingStage} Hearing for Case #${caseNumber} (${caseTitle}) on ${hearingDate} at ${hearingTime} at ${venue} before ${mediator}. Your appearance is mandatory under Katarungang Pambarangay Law (RA 7160). - Lupon Secretariat`;

  const emailSubject = `OFFICIAL SUMMONS / PATAWAG: Lupon Case #${caseNumber} (${hearingStage}) - ${recipientName}`;

  const emailBody = `REPUBLIC OF THE PHILIPPINES\nBARANGAY SANGKOL, ${settings.municipality.toUpperCase()}\nOFFICE OF THE LUPON TAGAPAMAYAPA\n\nNOTICE OF HEARING & SUMMONS (PATAWAG SA PAGPAPAYAPA)\n\nTo: ${recipientName} (${role})\nCase Docket Number: ${caseNumber}\nNature / Title of Complaint: ${caseTitle}\nHearing Stage: ${hearingStage}\n\nYou are hereby cited and summoned to personally appear before the Punong Barangay / Pangkat Tagapagkasundo on:\n\n• Date: ${hearingDate}\n• Time: ${hearingTime}\n• Venue: ${venue}\n• Presiding Mediator: ${mediator}\n\nIMPORTANT REMINDERS:\n1. Please come 15 minutes before the scheduled hour.\n2. Personal appearance of parties is required. Legal counsel is not permitted during barangay conciliation proceedings pursuant to Section 415 of RA 7160.\n3. Willful failure or refusal to appear may result in appropriate legal sanctions, contempt citation, or issuance of Certificate to File Action (CFA).\n\nOffice of the Lupon Tagapamayapa\nBarangay Sangkol`;

  return { sms, emailSubject, emailBody };
};

export const buildEmergencyBlastSMS = (
  announcement: AnnouncementRecord,
  targetPurok: string = 'All Puroks'
): { sms: string; emailSubject: string; emailBody: string } => {
  const cleanContent = announcement.content.length > 140 ? announcement.content.slice(0, 137) + '...' : announcement.content;

  const sms = `🚨 EMERGENCY ADVISORY - BRGY SANGKOL (${targetPurok}): ${announcement.title.toUpperCase()}. ${cleanContent} Hotlines: MDRRMO 0917-555-4321 / Tanod 0928-123-4567. Stay alert & keep safe!`;

  const emailSubject = `🚨 [URGENT] Barangay Emergency Advisory: ${announcement.title}`;

  const emailBody = `BARANGAY SANGKOL DISASTER RISK REDUCTION & MANAGEMENT COUNCIL\nOFFICE OF THE PUNONG BARANGAY\n\nEMERGENCY PUBLIC ADVISORY\n\nTarget Recipients: ${targetPurok}\nDate Issued: ${announcement.publishDate}\nCategory: ${announcement.category}\n\n${announcement.title.toUpperCase()}\n\n${announcement.content}\n\n${
    announcement.venue ? `Designated Evacuation / Assembly Venue: ${announcement.venue}\n` : ''
  }${
    announcement.eventDate ? `Schedule / Effective Date: ${announcement.eventDate} ${announcement.eventTime || ''}\n` : ''
  }\nEMERGENCY DIRECTORY & HOTLINES:\n- Barangay Operations Center: 0917-555-4321\n- Barangay Tanod Base: 0928-123-4567\n- Health & Emergency Rescue: (065) 212-3456\n- Police Assistance: 911 / 117\n\nStay calm, monitor official advisories, and follow instructions from Barangay Officials and BPSO tanods.`;

  return { sms, emailSubject, emailBody };
};

export const buildAppointmentReminderSMS = (
  apt: AppointmentRecord
): { sms: string; emailSubject: string; emailBody: string } => {
  const sms = `BRGY SANGKOL: Reminder for ${apt.residentName}! You have a confirmed appointment for "${apt.purpose}" on ${apt.date} at ${apt.time} with ${apt.assignedOfficial} at ${apt.location}. Please arrive 10 mins early. Salamat!`;

  const emailSubject = `Appointment Reminder: ${apt.purpose} on ${apt.date} (${apt.time})`;

  const emailBody = `BARANGAY SANGKOL APPOINTMENT DESK\n\nDear ${apt.residentName},\n\nThis is a friendly reminder of your scheduled appointment with Barangay Sangkol:\n\n• Purpose: ${apt.purpose}\n• Date: ${apt.date}\n• Time: ${apt.time}\n• With Official: ${apt.assignedOfficial}\n• Venue / Room: ${apt.location}\n• Status: ${apt.status}\n${apt.notes ? `• Remarks: ${apt.notes}\n` : ''}\nIf you need to reschedule or cancel, please contact the Barangay Hall Secretariat at least 2 hours prior.\n\nThank you,\nBarangay Sangkol Administration`;

  return { sms, emailSubject, emailBody };
};

export const buildConcernUpdateSMS = (
  concern: CitizenConcern
): { sms: string; emailSubject: string; emailBody: string } => {
  const sms = `BRGY SANGKOL: Update on your concern "${concern.subject}" (${concern.category}): Status is now "${concern.status}". ${
    concern.actionNotes ? `Officer remarks: ${concern.actionNotes}. ` : ''
  }Thank you for your active community feedback!`;

  const emailSubject = `Update on Citizen Concern Ticket #${concern.id}: ${concern.status}`;

  const emailBody = `BARANGAY SANGKOL CITIZEN ACTION CENTER\n\nDear ${concern.residentName},\n\nWe have updated the status of your submitted citizen concern.\n\n• Ticket ID: ${concern.id}\n• Category: ${concern.category}\n• Subject: ${concern.subject}\n• Current Status: ${concern.status}\n• Date Filed: ${concern.dateSubmitted}\n${concern.assignedTo ? `• Assigned Officer: ${concern.assignedTo}\n` : ''}${concern.actionNotes ? `• Action Taken / Remarks: ${concern.actionNotes}\n` : ''}${concern.feedbackNotes ? `• Feedback: ${concern.feedbackNotes}\n` : ''}\nThank you for helping us keep Barangay Sangkol safe, clean, and orderly.\n\nCitizen Action Desk`;

  return { sms, emailSubject, emailBody };
};
