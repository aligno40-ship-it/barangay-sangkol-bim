import React, { useState, useMemo } from 'react';
import {
  HeartPulse,
  Baby,
  Pill,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Plus,
  X,
  AlertCircle,
  Stethoscope,
  Activity,
  FileCheck,
  Package,
  Layers,
  History,
  FileText,
  Bell,
} from 'lucide-react';
import {
  HealthAppointment,
  ChildImmunizationTracker,
  MedicineRefillRequest,
  PharmacyInventoryItem,
  HealthMission,
} from '../../types/residentServices';
import { useCommunityServices } from '../../context/CommunityServicesContext';
import { areNamesMatching } from '../../context/BarangayContext';
import { isResidentRecordOwner } from '../../utils/residentAccountFilter';
import {
  HealthPrintDocumentModal,
  HealthPrintDocType,
} from '../health/HealthPrintDocumentModal';
import { HealthInventoryTab } from '../health/HealthInventoryTab';
import { HealthPatientHistoryTab } from '../health/HealthPatientHistoryTab';
import { HealthDispensingTab } from '../health/HealthDispensingTab';
import { HealthConsultationsTab } from '../health/HealthConsultationsTab';
import { HealthOutreachTab } from '../health/HealthOutreachTab';

interface HealthCenterDeskTabProps {
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
}

export const HealthCenterDeskTab: React.FC<HealthCenterDeskTabProps> = ({
  residentId,
  residentName,
  contactNumber,
  purok,
}) => {
  const {
    consultations: appointments,
    immunizations,
    medicineRequests: medicineRefills,
    pharmacyInventory = [],
    healthMissions = [],
    addConsultation,
    addImmunization,
    addMedicineRequest,
    registerForHealthMission,
    cancelHealthMissionReservation,
  } = useCommunityServices();

  // STRICT RESIDENT ACCOUNT FILTERING: Show only the transactions/records that belong to this resident
  const residentIdentity = useMemo(
    () => ({
      residentId,
      name: residentName,
      contactNumber,
    }),
    [residentId, residentName, contactNumber]
  );

  const myAppointments = useMemo(() => {
    return (appointments || []).filter((a) =>
      isResidentRecordOwner(
        {
          residentId: a.residentId,
          residentName: a.residentName,
          patientName: a.patientName,
        },
        residentIdentity
      )
    );
  }, [appointments, residentIdentity]);

  const myMedicineRefills = useMemo(() => {
    return (medicineRefills || []).filter((r) =>
      isResidentRecordOwner(
        {
          residentId: r.residentId,
          residentName: r.residentName,
          contactNumber: r.contactNumber,
        },
        residentIdentity
      )
    );
  }, [medicineRefills, residentIdentity]);

  const myImmunizations = useMemo(() => {
    return (immunizations || []).filter((imm) =>
      isResidentRecordOwner(
        {
          parentResidentId: imm.parentResidentId,
          parentName: imm.parentName,
        },
        residentIdentity
      )
    );
  }, [immunizations, residentIdentity]);

  const [activeSubTab, setActiveSubTab] = useState<
    'inventory' | 'patient_history' | 'dispensing' | 'consultations' | 'outreach'
  >('inventory');

  const healthDeskAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      type: 'pickup' | 'confirmed' | 'pending' | 'dispensed';
      title: string;
      desc: string;
      actionText: string;
      onAction: () => void;
    }> = [];

    // Medicine ready for pickup
    myMedicineRefills
      .filter((m) => m.status === 'Ready for Pickup')
      .forEach((m) => {
        alerts.push({
          id: `alert-med-ready-${m.id}`,
          type: 'pickup',
          title: `Medicine Ready for Pickup: ${m.medicineName}`,
          desc: `Your prescription of ${m.quantityRequested} pcs is approved and packed at the Botika. Bring valid ID to claim.`,
          actionText: 'View Dispensing Slip',
          onAction: () => {
            setActiveSubTab('dispensing');
          },
        });
      });

    // Consultations confirmed
    myAppointments
      .filter((a) => a.status === 'Confirmed')
      .forEach((a) => {
        alerts.push({
          id: `alert-appt-conf-${a.id}`,
          type: 'confirmed',
          title: `Consultation Confirmed: ${a.serviceType}`,
          desc: `Scheduled on ${a.preferredDate} (${a.preferredTimeSlot}) with ${a.attendingHealthWorker || 'Duty Physician'}. Assigned Queue #${a.queueNumber}.`,
          actionText: 'View Appointment Slip',
          onAction: () => {
            setActiveSubTab('consultations');
          },
        });
      });

    // Consultations pending triage
    myAppointments
      .filter((a) => a.status === 'Pending Triage' || a.status === 'Triage Recorded')
      .forEach((a) => {
        alerts.push({
          id: `alert-appt-pend-${a.id}`,
          type: 'pending',
          title: `Consultation Queued: ${a.serviceType}`,
          desc: `Your consultation request for ${a.patientName} is received. Queue Ticket: #${a.queueNumber || a.id}.`,
          actionText: 'Check Triage Queue',
          onAction: () => {
            setActiveSubTab('consultations');
          },
        });
      });

    return alerts;
  }, [myMedicineRefills, myAppointments]);

  const readyForPickupCount = useMemo(
    () => myMedicineRefills.filter((m) => m.status === 'Ready for Pickup').length,
    [myMedicineRefills]
  );
  const confirmedConsultationsCount = useMemo(
    () => myAppointments.filter((a) => a.status === 'Confirmed').length,
    [myAppointments]
  );

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [printDoc, setPrintDoc] = useState<HealthPrintDocType | null>(null);

  // Appointment Form State
  const [patientName, setPatientName] = useState(residentName);
  const [patientAge, setPatientAge] = useState(28);
  const [serviceType, setServiceType] = useState<HealthAppointment['serviceType']>('General Medical Consultation');
  const [preferredDate, setPreferredDate] = useState('');
  const [timeSlot, setTimeSlot] = useState<HealthAppointment['preferredTimeSlot']>('08:30 AM - 10:00 AM');
  const [symptomsOrPurpose, setSymptomsOrPurpose] = useState('');

  // Medicine Refill State
  const [selectedMed, setSelectedMed] = useState<string>('Losartan Potassium 50mg (Hypertension)');
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string>('');
  const [medQty, setMedQty] = useState(30);
  const [medPurpose, setMedPurpose] = useState('');

  // Add Child Vaccine Tracker State
  const [newChildName, setNewChildName] = useState('');
  const [newChildBirthDate, setNewChildBirthDate] = useState('');
  const [newVaccineName, setNewVaccineName] = useState<ChildImmunizationTracker['vaccineName']>('Pentavalent (DTP-HepB-Hib)');
  const [newDoseNumber, setNewDoseNumber] = useState<ChildImmunizationTracker['doseNumber']>('Dose 1');
  const [newDueDate, setNewDueDate] = useState('');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newInjectionSite, setNewInjectionSite] = useState('Left Anterolateral Thigh');

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferredDate || !symptomsOrPurpose) return;

    const newAppt: HealthAppointment = {
      id: `HLTH-2026-${Date.now().toString().slice(-4)}`,
      residentId,
      residentName,
      patientName,
      patientAge,
      serviceType,
      preferredDate,
      preferredTimeSlot: timeSlot,
      attendingHealthWorker: 'Barangay Health Center Duty Physician & Nurse',
      symptomsOrPurpose,
      status: 'Pending Triage',
      queueNumber: `Q-${Math.floor(10 + Math.random() * 89)}`,
      createdAt: new Date().toISOString(),
    };

    addConsultation(newAppt);
    setSuccessMessage(`✓ Consultation request submitted for ${patientName}! Your live queue number is ${newAppt.queueNumber}.`);
    setIsBookModalOpen(false);
    setSymptomsOrPurpose('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  const handleOpenMedModalWithItem = (item?: PharmacyInventoryItem) => {
    if (item) {
      setSelectedMed(`${item.name} ${item.strength}`);
      setSelectedInventoryItemId(item.id);
      setMedPurpose(`Prescribed maintenance: ${item.indications || item.genericName}`);
    } else if (pharmacyInventory.length > 0) {
      setSelectedMed(`${pharmacyInventory[0].name} ${pharmacyInventory[0].strength}`);
      setSelectedInventoryItemId(pharmacyInventory[0].id);
    }
    setIsMedModalOpen(true);
  };

  const handleRequestMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed || !medPurpose) return;

    const newRefill: MedicineRefillRequest = {
      id: `MED-REQ-${Date.now().toString().slice(-4)}`,
      residentId,
      residentName,
      contactNumber,
      inventoryItemId: selectedInventoryItemId || undefined,
      medicineName: selectedMed,
      quantityRequested: medQty,
      purpose: medPurpose,
      status: 'Pending Approval',
      prescriptionAttached: true,
      requestedAt: new Date().toISOString().split('T')[0],
      approvedBy: 'Health Desk Triage Officer',
      pharmacistNotes: 'Under BHW triage and stock verification. Check back for pickup slip.',
    };

    addMedicineRequest(newRefill);
    setSuccessMessage(`✓ Requisition submitted for ${medQty} tabs of ${selectedMed}! Proceed to the health station once Ready for Pickup.`);
    setIsMedModalOpen(false);
    setMedPurpose('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  const handleAddChildImmunization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName || !newDueDate) return;

    const newImm: ChildImmunizationTracker = {
      id: `EPI-2026-${Date.now().toString().slice(-4)}`,
      childName: newChildName,
      birthDate: newChildBirthDate || '',
      childBirthDate: newChildBirthDate,
      parentResidentId: residentId,
      parentName: residentName,
      vaccineName: newVaccineName,
      doseNumber: newDoseNumber,
      dueDate: newDueDate,
      batchNumber: newBatchNumber || `LOT-EPI-${Date.now().toString().slice(-4)}`,
      batchOrLotNumber: newBatchNumber || `LOT-EPI-${Date.now().toString().slice(-4)}`,
      injectionSite: newInjectionSite,
      status: 'Upcoming',
    };

    addImmunization(newImm);
    setSuccessMessage(`✓ Immunization milestone recorded for ${newChildName}! Reminder notification will trigger before due date.`);
    setIsAddChildModalOpen(false);
    setNewChildName('');
    setNewDueDate('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  const currentResidentSummary = {
    id: residentId,
    name: residentName,
    purok,
    contactNumber,
    age: 28,
    philhealthNo: `PH-${residentId.slice(-4)}-2026`,
    bloodType: 'O+',
    allergies: 'No known drug allergies',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-cyan-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Primary Health Care & Wellness
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-slate-200">
              BHW • Barangay Health Station & Botika
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Barangay Health Center & Botika Desk
          </h2>
          <p className="text-xs sm:text-sm text-cyan-200/90 mt-1 max-w-2xl">
            Browse available pharmacy stocks, review your longitudinal medical history, request maintenance medicines, book clinic consultations, and join outreach missions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsBookModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Consultation</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenMedModalWithItem()}
            className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Pill className="w-4 h-4" />
            <span>Request Medicines</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="p-1 hover:bg-emerald-200/50 rounded-lg cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Health Desk Live Notifications Banner */}
      {healthDeskAlerts.length > 0 && (
        <div className="p-4 bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                <Bell className="w-4 h-4 text-emerald-600" />
                <span>Health Desk Live Station Notifications ({healthDeskAlerts.length})</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700">Synchronized with Central Health Station</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
            {healthDeskAlerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className="bg-white/90 backdrop-blur-xs border border-emerald-100 rounded-xl p-3 flex flex-col justify-between hover:border-emerald-300 transition-all shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">{alert.title}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                        alert.type === 'pickup'
                          ? 'bg-amber-100 text-amber-800'
                          : alert.type === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {alert.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{alert.desc}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={alert.onAction}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{alert.actionText}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tabbed Interface Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 overflow-x-auto gap-2">
        <div className="flex items-center gap-2 min-w-max">
          <button
            type="button"
            onClick={() => setActiveSubTab('inventory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'inventory'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Botika Inventory ({pharmacyInventory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('patient_history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'patient_history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Patient Medical History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('dispensing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'dispensing'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>My Dispensing Records ({myMedicineRefills.length})</span>
            {readyForPickupCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-extrabold rounded-full animate-pulse">
                {readyForPickupCount} Ready
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('consultations')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'consultations'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>My Consultations & Triage ({myAppointments.length})</span>
            {confirmedConsultationsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-extrabold rounded-full">
                {confirmedConsultationsCount} Confirmed
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('outreach')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'outreach'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Outreach & Bakuna ({healthMissions.length})</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENTS */}

      {/* 1. INVENTORY TAB */}
      {activeSubTab === 'inventory' && (
        <HealthInventoryTab
          inventory={pharmacyInventory}
          mode="resident"
          onRequestRefill={(item) => handleOpenMedModalWithItem(item)}
        />
      )}

      {/* 2. PATIENT HISTORY TAB */}
      {activeSubTab === 'patient_history' && (
        <HealthPatientHistoryTab
          mode="resident"
          appointments={myAppointments}
          medicineRequests={myMedicineRefills}
          immunizations={myImmunizations}
          inventory={pharmacyInventory}
          currentResident={currentResidentSummary}
          onPrintDocument={(doc) => setPrintDoc(doc)}
          onBookConsultation={() => setIsBookModalOpen(true)}
        />
      )}

      {/* 3. DISPENSING RECORDS TAB */}
      {activeSubTab === 'dispensing' && (
        <HealthDispensingTab
          requests={myMedicineRefills}
          inventory={pharmacyInventory}
          mode="resident"
          residentId={residentId}
          residentName={residentName}
          onRequestMedicine={() => handleOpenMedModalWithItem()}
          onPrintDocument={(doc) => setPrintDoc(doc)}
          onShowToast={(msg) => setSuccessMessage(msg)}
        />
      )}

      {/* 4. CLINICAL CONSULTATIONS TAB */}
      {activeSubTab === 'consultations' && (
        <HealthConsultationsTab
          appointments={myAppointments}
          mode="resident"
          residentId={residentId}
          residentName={residentName}
          onBookAppointment={() => setIsBookModalOpen(true)}
          onPrintDocument={(doc) => setPrintDoc(doc)}
          onShowToast={(msg) => setSuccessMessage(msg)}
        />
      )}

      {/* 5. OUTREACH & IMMUNIZATIONS TAB */}
      {activeSubTab === 'outreach' && (
        <HealthOutreachTab
          missions={healthMissions}
          immunizations={myImmunizations}
          mode="resident"
          residentId={residentId}
          residentName={residentName}
          purok={purok}
          onOpenImmunizationModal={() => setIsAddChildModalOpen(true)}
          onRegisterMission={(missionId, rId, rName) => registerForHealthMission(missionId, rId, rName)}
          onCancelMissionReservation={(missionId, rId, rName) => cancelHealthMissionReservation(missionId, rId, rName)}
          onPrintDocument={(doc) => setPrintDoc(doc)}
          onShowToast={(msg) => setSuccessMessage(msg)}
        />
      )}

      {/* Book Consultation Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Book Health Consultation</h3>
                  <p className="text-xs text-slate-500">Barangay Sangkol Health Station</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Patient Age</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Health Service Requested</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="General Medical Consultation">General Medical Consultation (Visiting MD)</option>
                  <option value="Barangay Midwife / Prenatal Check">Barangay Midwife / Prenatal & Maternal Check</option>
                  <option value="Child Immunization / Vaccine">Child Immunization / Vaccine Administration</option>
                  <option value="Senior Blood Pressure & Blood Sugar Check">Senior Blood Pressure & Blood Sugar Check</option>
                  <option value="Dental Outreach / Tooth Extraction">Dental Outreach / Oral Check</option>
                  <option value="Nutrition Counseling (BNS)">Nutrition Counseling (BNS)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  >
                    <option value="08:30 AM - 10:00 AM">Morning: 08:30 AM - 10:00 AM</option>
                    <option value="10:00 AM - 11:30 AM">Morning: 10:00 AM - 11:30 AM</option>
                    <option value="01:30 PM - 03:00 PM">Afternoon: 01:30 PM - 03:00 PM</option>
                    <option value="03:00 PM - 04:30 PM">Afternoon: 03:00 PM - 04:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Symptoms / Chief Purpose</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your health symptoms, fever, checkup requirement, or doctor referral..."
                  value={symptomsOrPurpose}
                  onChange={(e) => setSymptomsOrPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-md"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Medicine Refill Modal */}
      {isMedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Request Free Maintenance Medicine</h3>
                  <p className="text-xs text-slate-500">Barangay Health Station Pharmacy Inventory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMedModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestMedicine} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Medicine from Inventory</label>
                <select
                  value={selectedMed}
                  onChange={(e) => {
                    setSelectedMed(e.target.value);
                    const inv = pharmacyInventory.find((i) => `${i.name} ${i.strength}` === e.target.value || i.name === e.target.value);
                    if (inv) setSelectedInventoryItemId(inv.id);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-cyan-500 font-medium"
                >
                  {pharmacyInventory.length > 0 ? (
                    pharmacyInventory.map((item) => (
                      <option key={item.id} value={`${item.name} ${item.strength}`}>
                        {item.name} {item.strength} ({item.category}) — {item.stockQuantity} {item.unit} in stock
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Losartan Potassium 50mg (Hypertension)">Losartan Potassium 50mg (Hypertension)</option>
                      <option value="Metformin Hydrochloride 500mg (Diabetes)">Metformin Hydrochloride 500mg (Diabetes)</option>
                      <option value="Amlodipine Besylate 5mg (Hypertension)">Amlodipine Besylate 5mg (Hypertension)</option>
                      <option value="Paracetamol 500mg (Fever / Pain)">Paracetamol 500mg (Fever / Pain)</option>
                      <option value="Ascorbic Acid + Zinc 500mg (Immunity)">Ascorbic Acid + Zinc 500mg (Immunity)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity Requested (Tablets / Units)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={medQty}
                  onChange={(e) => setMedQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Standard dispensing limit is a 30-day (1 month) maintenance supply.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prescription Note / Indication</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Monthly maintenance prescribed by Dr. Reyes for blood pressure control..."
                  value={medPurpose}
                  onChange={(e) => setMedPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMedModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer shadow-md"
                >
                  Submit Medicine Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Child Immunization Tracker Modal */}
      {isAddChildModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add Child Vaccine Tracker</h3>
                  <p className="text-xs text-slate-500">Department of Health Expanded Program on Immunization</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddChildModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddChildImmunization} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Child's Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam Gabriel Santos"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Child's Date of Birth</label>
                  <input
                    type="date"
                    value={newChildBirthDate}
                    onChange={(e) => setNewChildBirthDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vaccine Antigen</label>
                  <select
                    value={newVaccineName}
                    onChange={(e) => setNewVaccineName(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  >
                    <option value="BCG Vaccine (Tuberculosis)">BCG Vaccine (Tuberculosis)</option>
                    <option value="Hepatitis B (Birth Dose)">Hepatitis B (Birth Dose)</option>
                    <option value="Pentavalent (DTP-HepB-Hib)">Pentavalent (DTP-HepB-Hib)</option>
                    <option value="Oral Polio Vaccine (OPV)">Oral Polio Vaccine (OPV)</option>
                    <option value="Inactivated Polio Vaccine (IPV)">Inactivated Polio Vaccine (IPV)</option>
                    <option value="Pneumococcal Conjugate (PCV)">Pneumococcal Conjugate (PCV)</option>
                    <option value="Measles, Mumps, Rubella (MMR)">Measles, Mumps, Rubella (MMR)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dose Sequence</label>
                  <select
                    value={newDoseNumber}
                    onChange={(e) => setNewDoseNumber(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  >
                    <option value="Birth Dose">Birth Dose</option>
                    <option value="Dose 1">Dose 1</option>
                    <option value="Dose 2">Dose 2</option>
                    <option value="Dose 3">Dose 3</option>
                    <option value="Booster 1">Booster 1</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Injection Site</label>
                  <input
                    type="text"
                    value={newInjectionSite}
                    onChange={(e) => setNewInjectionSite(e.target.value)}
                    placeholder="Left Anterolateral Thigh"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddChildModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer shadow-md"
                >
                  Save Vaccine Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Print Slip Modal */}
      <HealthPrintDocumentModal
        document={printDoc}
        onClose={() => setPrintDoc(null)}
      />
    </div>
  );
};
