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
  provider: 'Simulated Local Gateway',
  senderId: '',
  apiKeyMasked: '',
  smsQuotaRemaining: 0,
  emailSmtpServer: '',
  emailSenderAddress: '',
  autoAlertCertificateReady: false,
  autoAlertHearingSchedule: false,
  autoAlertEmergencyAnnouncements: false,
  autoAlertAppointments: false,
  autoAlertCitizenConcerns: false,
};

export const INITIAL_SMS_ALERTS: SMSAlertRecord[] = [];

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
    mediator = 'Punong Barangay',
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
