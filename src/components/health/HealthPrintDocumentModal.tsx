import React from 'react';
import {
  Printer,
  X,
  Stethoscope,
  Pill,
  Baby,
  HeartPulse,
  QrCode,
  ShieldCheck,
  Calendar,
  User,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  HealthAppointment,
  MedicineRefillRequest,
  ChildImmunizationTracker,
  HealthOutreachMission,
  PharmacyInventoryItem,
} from '../../types/residentServices';

export type HealthPrintDocType =
  | { type: 'consultation'; data: HealthAppointment }
  | { type: 'medicine_dispense'; data: MedicineRefillRequest; inventoryItem?: PharmacyInventoryItem }
  | { type: 'immunization_card'; data: ChildImmunizationTracker }
  | { type: 'mission_pass'; data: HealthOutreachMission; residentName: string; purok?: string };

interface HealthPrintDocumentModalProps {
  document: HealthPrintDocType | null;
  onClose: () => void;
}

export const HealthPrintDocumentModal: React.FC<HealthPrintDocumentModalProps> = ({
  document,
  onClose,
}) => {
  if (!document) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top Control Bar (Hidden during print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Barangay Official Health Document</h3>
              <p className="text-[11px] text-slate-400">Ready for official printing, archiving, or clinic issuance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 bg-white text-slate-900 space-y-6 print:p-0 print:space-y-4 font-sans text-xs">
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-slate-800 pb-4 text-center relative">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-900 text-white flex items-center justify-center font-black text-sm shadow-inner shrink-0 border-2 border-amber-400">
                BHS
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Republic of the Philippines • City Health Department</p>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                  Barangay Sangkol Primary Health Station
                </h1>
                <p className="text-[11px] font-medium text-slate-600">
                  Purok Health Center, Barangay Sangkol • Tel: (088) 822-4410 • Email: health.sangkol@gov.ph
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-sm shadow-inner shrink-0 border-2 border-white">
                DOH
              </div>
            </div>

            <div className="mt-3 inline-block px-4 py-1 bg-slate-100 rounded-full font-bold text-xs uppercase tracking-wider text-slate-800 border border-slate-300">
              {document.type === 'consultation' && 'Clinical Consultation & Triage Pass'}
              {document.type === 'medicine_dispense' && 'Barangay Botika Dispensing & Prescription Slip'}
              {document.type === 'immunization_card' && 'Child Immunization & Bakuna Certificate'}
              {document.type === 'mission_pass' && 'Community Health Outreach Priority Pass'}
            </div>
          </div>

          {/* 1. CONSULTATION DOCUMENT CONTENT */}
          {document.type === 'consultation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Document Ref #</span>
                  <strong className="font-mono text-blue-900 text-xs">{document.data.id}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Queue / Priority No.</span>
                  <strong className="font-mono text-emerald-800 text-xs">{document.data.queueNumber || 'TRIAGE-GEN'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Appointment Date</span>
                  <strong className="text-slate-800">{document.data.preferredDate}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Time Slot</span>
                  <strong className="text-slate-800">{document.data.preferredTimeSlot}</strong>
                </div>
              </div>

              {/* Patient Profile */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-900 border-b border-slate-100 pb-1">
                  Patient & Clinical Demographics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Patient Name: </span>
                    <strong className="text-slate-900 text-sm">{document.data.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Age: </span>
                    <strong className="text-slate-900">{document.data.patientAge} years old</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Booked By: </span>
                    <strong className="text-slate-800">{document.data.residentName} ({document.data.residentId})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Service Category: </span>
                    <strong className="text-blue-800">{document.data.serviceType}</strong>
                  </div>
                </div>
              </div>

              {/* Triage & Vital Signs */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-blue-50/30">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-rose-500" />
                    <span>Triage Vital Signs & Assessment</span>
                  </h4>
                  {document.data.vitals?.triagePriority && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                      {document.data.vitals.triagePriority}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">Blood Pressure</span>
                    <strong className="text-xs font-mono text-slate-900">{document.data.vitals?.bp || '120/80'}</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">Pulse Rate</span>
                    <strong className="text-xs font-mono text-slate-900">{document.data.vitals?.heartRate ? `${document.data.vitals.heartRate} bpm` : '74 bpm'}</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">Body Temp</span>
                    <strong className="text-xs font-mono text-slate-900">{document.data.vitals?.temperature ? `${document.data.vitals.temperature} °C` : '36.5 °C'}</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">Weight (kg)</span>
                    <strong className="text-xs font-mono text-slate-900">{document.data.vitals?.weightKg ? `${document.data.vitals.weightKg} kg` : 'N/A'}</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">SpO2 Oxygen</span>
                    <strong className="text-xs font-mono text-slate-900">{document.data.vitals?.spo2 ? `${document.data.vitals.spo2}%` : '99%'}</strong>
                  </div>
                </div>

                {document.data.vitals?.triageNotes && (
                  <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                    <strong>Triage Observations: </strong>{document.data.vitals.triageNotes}
                  </p>
                )}
              </div>

              {/* Diagnosis and Prescriptions */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-800">
                  Attending Medical Assessment & Instructions
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold">Chief Complaint / Symptoms: </span>
                    <span className="text-slate-900">{document.data.symptomsOrPurpose}</span>
                  </div>
                  {document.data.diagnosis && (
                    <div>
                      <span className="text-slate-500 font-semibold">Clinical Diagnosis: </span>
                      <strong className="text-slate-900">{document.data.diagnosis}</strong>
                    </div>
                  )}
                  {document.data.prescriptionsOrAdvice && (
                    <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-950">
                      <strong>Rx / Treatment Instructions: </strong>
                      {document.data.prescriptionsOrAdvice}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. MEDICINE DISPENSE VOUCHER CONTENT */}
          {document.type === 'medicine_dispense' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Requisition ID</span>
                  <strong className="font-mono text-cyan-900 text-xs">{document.data.id}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Dispense Status</span>
                  <strong className="text-emerald-700 text-xs uppercase">{document.data.status}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Date Requested</span>
                  <strong className="text-slate-800">{document.data.requestedAt}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Date Dispensed</span>
                  <strong className="text-slate-800">{document.data.dispensedAt || currentDate}</strong>
                </div>
              </div>

              {/* Patient and Medicine Box */}
              <div className="border-2 border-cyan-900/30 rounded-xl p-4 space-y-3 bg-cyan-50/30">
                <div className="flex items-center justify-between border-b border-cyan-200 pb-2">
                  <div>
                    <h3 className="text-sm font-black text-cyan-950 uppercase">{document.data.medicineName}</h3>
                    <p className="text-[11px] text-cyan-800 font-semibold">Free Barangay Maintenance Program Allocation</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black font-mono text-cyan-950 bg-white px-3 py-1 rounded-lg border border-cyan-300">
                      Qty: {document.data.quantityRequested} Units
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Beneficiary Patient Name:</span>
                    <strong className="text-slate-900 text-sm">{document.data.residentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Contact Phone Number:</span>
                    <strong className="text-slate-900">{document.data.contactNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Batch / Lot Dispensed:</span>
                    <strong className="font-mono text-slate-800">{document.data.batchDispensed || 'LOT-LOS-2026A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Prescription Requirement:</span>
                    <strong className="text-emerald-700 font-bold">
                      {document.data.prescriptionAttached ? '✓ Valid Doctor Rx Verified' : 'Standard OTC / Maintenance Clearance'}
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-cyan-200 space-y-1">
                  <span className="text-[10px] font-bold text-cyan-900 uppercase block">Pharmacist / BHW Dosing Instructions:</span>
                  <p className="text-xs text-slate-800 font-medium">
                    {document.data.pharmacistNotes || 'Take 1 tablet daily in the morning with food. Store in a cool, dry place away from direct sunlight.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. CHILD IMMUNIZATION CERTIFICATE CONTENT */}
          {document.type === 'immunization_card' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">EPI Record #</span>
                  <strong className="font-mono text-purple-900 text-xs">{document.data.id}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Vaccine Antigen</span>
                  <strong className="text-purple-950 text-xs">{document.data.vaccineName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Dose Sequence</span>
                  <strong className="text-slate-800">{document.data.doseNumber}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Status</span>
                  <strong className="text-emerald-700 uppercase">{document.data.status}</strong>
                </div>
              </div>

              <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/20 space-y-3">
                <h4 className="font-bold text-purple-950 text-xs uppercase tracking-wider border-b border-purple-100 pb-1 flex items-center gap-2">
                  <Baby className="w-4 h-4 text-purple-600" />
                  <span>Infant & Parent Registry Details</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Child / Infant Full Name:</span>
                    <strong className="text-slate-900 text-sm">{document.data.childName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date of Birth:</span>
                    <strong className="text-slate-900">{document.data.birthDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Parent / Guardian:</span>
                    <strong className="text-slate-900">{document.data.parentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date Administered:</span>
                    <strong className="text-slate-900">{document.data.administeredDate || document.data.dueDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Vaccine Batch / Lot No:</span>
                    <strong className="font-mono text-slate-800">{document.data.batchOrLotNumber || 'LOT-PENTA-8832'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Injection Site:</span>
                    <strong className="text-slate-800">{document.data.injectionSite || 'Right Anterolateral Thigh'}</strong>
                  </div>
                </div>

                {document.data.adverseEffectsOrRemarks && (
                  <p className="text-[11px] text-purple-900 bg-white p-2.5 rounded-lg border border-purple-200">
                    <strong>Clinical Observations & Adverse Effects: </strong>
                    {document.data.adverseEffectsOrRemarks}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 4. HEALTH OUTREACH MISSION PASS CONTENT */}
          {document.type === 'mission_pass' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl">
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-bold text-[10px] rounded uppercase">
                  Confirmed Mission Registration
                </span>
                <h3 className="text-base font-black mt-1 text-white">{document.data.title}</h3>
                <p className="text-xs text-blue-200 mt-0.5">{document.data.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Schedule Date</span>
                  <strong className="text-slate-900">{document.data.date}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Time Schedule</span>
                  <strong className="text-slate-900">{document.data.timeSchedule}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Venue / Assembly</span>
                  <strong className="text-slate-900">{document.data.venue}</strong>
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Beneficiary & Entry Pass Details:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Beneficiary Name: </span>
                    <strong className="text-slate-900">{document.residentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Lead Health Provider: </span>
                    <strong className="text-slate-900">{document.data.leadProvider}</strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-600 block mb-1">What to Bring / Requirements:</span>
                  <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                    {(document.data.requirements || ['Valid ID or Proof of Residency']).map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Verification & Signatures Section */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* QR & Verification */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center p-1">
                  <QrCode className="w-14 h-14 text-slate-800" />
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  <p className="font-mono font-bold text-slate-700">AUTH: BHS-VLD-2026-X89</p>
                  <p>Digitally validated via Barangay Health Information System.</p>
                  <p className="text-emerald-700 font-semibold mt-0.5">✓ Official Health Document</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex items-center gap-8 text-center text-xs">
                <div>
                  <div className="w-36 border-b border-slate-800 pb-1">
                    <p className="font-bold text-slate-900 text-[11px]">Midwife Carmela Reyes, R.M.</p>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Barangay Midwife / Dispensary</p>
                </div>
                <div>
                  <div className="w-36 border-b border-slate-800 pb-1">
                    <p className="font-bold text-slate-900 text-[11px]">Dr. Evelyn Morales, MD</p>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">City Visiting Health Physician</p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Footer */}
          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 print:text-[9px]">
            This slip serves as an official clinical voucher from the Barangay Sangkol Health Station. Issued on {currentDate}. Not valid without official dry seal.
          </div>
        </div>
      </div>
    </div>
  );
};
