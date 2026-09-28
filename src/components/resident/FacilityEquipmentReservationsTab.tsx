import React, { useState, useMemo } from 'react';
import {
  Building2,
  Tent,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Plus,
  Filter,
  Check,
  X,
  FileCheck,
  Sparkles,
  Info,
  Layers,
  MapPin,
  Phone,
  Printer,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { FacilityReservation, EquipmentReservation } from '../../types/residentServices';
import { initialFacilityReservations, initialEquipmentReservations } from '../../data/residentServicesData';
import { useCommunityServices } from '../../context/CommunityServicesContext';
import { isResidentRecordOwner } from '../../utils/residentAccountFilter';

interface FacilityEquipmentReservationsTabProps {
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
}

export const FacilityEquipmentReservationsTab: React.FC<FacilityEquipmentReservationsTabProps> = ({
  residentId,
  residentName,
  contactNumber,
  purok,
}) => {
  const {
    reservations: facilityList,
    equipmentReservations: equipmentList,
    addReservation,
    addEquipmentReservation,
  } = useCommunityServices();

  const residentIdentity = useMemo(
    () => ({ residentId, name: residentName, contactNumber }),
    [residentId, residentName, contactNumber]
  );

  // STRICT RESIDENT ACCOUNT FILTERING
  const myFacilityList = useMemo(() => {
    return (facilityList || []).filter((f) =>
      isResidentRecordOwner(
        {
          residentId: f.reservedByResidentId,
          reservedByResidentId: f.reservedByResidentId,
          residentName: f.residentName,
          contactNumber: f.contactNumber,
        },
        residentIdentity
      )
    );
  }, [facilityList, residentIdentity]);

  const myEquipmentList = useMemo(() => {
    return (equipmentList || []).filter((e) =>
      isResidentRecordOwner(
        {
          residentId: e.reservedByResidentId,
          reservedByResidentId: e.reservedByResidentId,
          residentName: e.residentName,
          contactNumber: e.contactNumber,
        },
        residentIdentity
      )
    );
  }, [equipmentList, residentIdentity]);

  const [subSection, setSubSection] = useState<'facilities' | 'equipment'>('facilities');
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [printSlip, setPrintSlip] = useState<{
    type: 'facility' | 'equipment';
    id: string;
    name: string;
    resident: string;
    contact: string;
    purok: string;
    dateOrPeriod: string;
    purpose: string;
    details: string;
    status: string;
    notes?: string;
  } | null>(null);

  // Facility Form State
  const [selectedFacility, setSelectedFacility] = useState<FacilityReservation['facilityName']>('Multi-Purpose Gymnasium');
  const [eventTitle, setEventTitle] = useState('');
  const [eventPurpose, setEventPurpose] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endTime, setEndTime] = useState('12:00 PM');
  const [attendees, setAttendees] = useState(30);

  // Equipment Form State
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentReservation['equipmentName']>('Heavy Duty Canopy Tent (Tolda)');
  const [equipmentQty, setEquipmentQty] = useState(1);
  const [borrowDate, setBorrowDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [equipmentPurpose, setEquipmentPurpose] = useState('');

  const handleCreateFacilityReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate) return;

    const newRes: FacilityReservation = {
      id: `RES-FAC-2026-${Date.now().toString().slice(-4)}`,
      facilityName: selectedFacility,
      reservedByResidentId: residentId,
      residentName,
      contactNumber,
      purok,
      eventTitle,
      purpose: eventPurpose || 'Community & family recreational gathering',
      date: eventDate,
      startTime,
      endTime,
      expectedAttendees: attendees,
      status: 'Pending Review',
      fee: 0,
      remarks: 'Submitted via Resident Portal. Custodian will review schedule conflicts.',
      createdAt: new Date().toISOString().split('T')[0],
    };

    addReservation(newRes);
    setSuccessMessage(`✓ Facility booking request (${newRes.id}) successfully submitted! Awaiting Barangay Hall clearance.`);
    setIsNewBookingModalOpen(false);
    setEventTitle('');
    setEventPurpose('');
    setEventDate('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  const handleCreateEquipmentReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowDate || !returnDate) return;

    const newEq: EquipmentReservation = {
      id: `RES-EQP-2026-${Date.now().toString().slice(-4)}`,
      equipmentName: selectedEquipment,
      quantity: equipmentQty,
      reservedByResidentId: residentId,
      residentName,
      contactNumber,
      purok,
      borrowDate,
      returnDate,
      purpose: equipmentPurpose || 'Barangay resident event borrowing',
      status: 'Pending Review',
      depositAmount: 0,
      conditionOnRelease: 'Pending physical issuance check at barangay warehouse',
      createdAt: new Date().toISOString().split('T')[0],
    };

    addEquipmentReservation(newEq);
    setSuccessMessage(`✓ Equipment lending slip (${newEq.id}) submitted! Please pick up items at Barangay Logistics Hub upon approval.`);
    setIsNewBookingModalOpen(false);
    setBorrowDate('');
    setReturnDate('');
    setEquipmentPurpose('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Community Logistics & Venues
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-slate-200">
              Barangay Sangkol E-Services
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Public Facility & Equipment Reservations
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-2xl">
            Book barangay-owned multi-purpose venues or request heavy-duty tents, sound systems, monobloc sets, and utility generators for community gatherings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewBookingModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="p-1 hover:bg-emerald-200/50 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sub-section Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubSection('facilities')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subSection === 'facilities'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Venues & Facilities</span>
            {myFacilityList.length > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
                {myFacilityList.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSubSection('equipment')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subSection === 'equipment'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Tent className="w-4 h-4" />
            <span>Borrowable Equipment</span>
            {myEquipmentList.length > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
                {myEquipmentList.length}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline">
          Official Barangay Logistics Bureau
        </span>
      </div>

      {/* Content Area */}
      {subSection === 'facilities' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Facility Quick Overview Cards */}
            {[
              {
                name: 'Multi-Purpose Gymnasium',
                capacity: '300 persons',
                amenities: 'Full Basketball Court, Electronic Scoreboard, Stage Lighting, Audio PA',
                status: 'Available',
                rate: 'Free for Resident Sports & Assemblies',
              },
              {
                name: 'Covered Basketball Court',
                capacity: '150 persons',
                amenities: 'Fiberglass Backboards, High-Bay LED floodlights, Bleachers',
                status: 'Available',
                rate: 'Free (Night lighting fee applies after 7 PM)',
              },
              {
                name: 'Barangay Session Hall',
                capacity: '60 persons',
                amenities: 'Air-Conditioned, Conference Table, Projector Screen, Sound System',
                status: 'Available with Prior Notice',
                rate: 'Official / Non-Profit Assembly Free',
              },
            ].map((f, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {f.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{f.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Capacity: {f.capacity}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-100 leading-relaxed">
                  <span className="font-bold text-slate-700">Features: </span>
                  {f.amenities}
                </div>
                <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-100/80">
                  {f.rate}
                </div>
              </div>
            ))}
          </div>

          {/* User's Facility Reservations List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Your Facility Bookings & Schedule Tracker</span>
              </h3>
              <span className="text-xs text-slate-500">{myFacilityList.length} total request(s)</span>
            </div>

            {myFacilityList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No facility reservations filed yet</p>
                <p className="text-xs text-slate-500">Click "Reserve Facility / Venue" to book the gymnasium, session hall, or covered court.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myFacilityList.map((res) => (
                  <div key={res.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {res.id}
                        </span>
                        <span className="font-bold text-sm text-slate-900">{res.facilityName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            res.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : res.status === 'Pending Review'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-emerald-900">{res.eventTitle}</p>
                      <p className="text-xs text-slate-500">{res.purpose}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-medium">{res.date}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-medium">{res.startTime} - {res.endTime}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-500" />
                          <span>~{res.expectedAttendees} attendees</span>
                        </span>
                      </div>

                      {res.remarks && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          Desk Notes: {res.remarks}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono">Applied: {res.createdAt}</span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {res.fee === 0 ? 'Free of Charge' : `₱${res.fee}`}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPrintSlip({
                            type: 'facility',
                            id: res.id,
                            name: res.facilityName,
                            resident: res.residentName || residentName,
                            contact: res.contactNumber || contactNumber,
                            purok: res.purok || purok,
                            dateOrPeriod: `${res.date} (${res.startTime} - ${res.endTime})`,
                            purpose: res.purpose,
                            details: `Event: ${res.eventTitle} | Attendees: ~${res.expectedAttendees}`,
                            status: res.status,
                            notes: res.remarks,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Permit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Equipment Available Catalogue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Heavy Duty Canopy Tent (Tolda)',
                stock: '6 Units Available',
                description: '10x10ft & 10x20ft Galvanized steel with waterproof canvas. Great for wakes, birthdays, or patio shade.',
              },
              {
                title: 'Monobloc Chairs (Set of 50)',
                stock: '400 Chairs in Stock',
                description: 'Heavy duty Uratex white chairs bundled in stacks with tying straps.',
              },
              {
                title: 'Public Address (PA) Sound System',
                stock: '2 Portable Trolley Units',
                description: 'Rechargeable 300W speaker with 2 wireless UHF microphones and Bluetooth connectivity.',
              },
              {
                title: 'Mobile Generator (5kVA)',
                stock: '1 Unit (Priority Emergency)',
                description: 'Gasoline powered portable generator for power outages and outdoor events.',
              },
              {
                title: 'Foldable Banquet Tables (Set of 5)',
                stock: '15 Tables Available',
                description: '6ft heavy duty folding lifetime plastic banquet tables.',
              },
              {
                title: 'Heavy Duty Grass Cutter',
                stock: '2 Units Available',
                description: '2-stroke motorized brush cutter for purok backyard or community lot maintenance.',
              },
            ].map((eq, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                    <Tent className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                    {eq.stock}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{eq.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{eq.description}</p>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-teal-900 bg-teal-50 px-2 py-1 rounded-md border border-teal-100">
                    Free Resident Borrowing (Subject to availability)
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* User's Equipment Requests List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Tent className="w-4 h-4 text-teal-600" />
                <span>Your Borrowed Equipment Slips & Return Tracker</span>
              </h3>
              <span className="text-xs text-slate-500">{myEquipmentList.length} equipment item(s)</span>
            </div>

            {myEquipmentList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Tent className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No equipment borrowed yet</p>
                <p className="text-xs text-slate-500">Click "Borrow Equipment" to request tents, sound systems, generators, or chairs.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myEquipmentList.map((eq) => (
                <div key={eq.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {eq.id}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{eq.equipmentName}</span>
                      <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        Qty: {eq.quantity}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          eq.status === 'Approved' || eq.status === 'Released / In Use'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : eq.status === 'Returned'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {eq.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">Purpose: {eq.purpose}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Borrow: {eq.borrowDate}</span>
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-rose-600" />
                        <span>Return Due: {eq.returnDate}</span>
                      </span>
                    </div>

                    {eq.conditionOnRelease && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        Logistics Release State: {eq.conditionOnRelease}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono">Date Filed: {eq.createdAt}</span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      Deposit: ₱0.00 (Waived)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPrintSlip({
                          type: 'equipment',
                          id: eq.id,
                          name: `${eq.equipmentName} (Qty: ${eq.quantity})`,
                          resident: eq.residentName || residentName,
                          contact: eq.contactNumber || contactNumber,
                          purok: eq.purok || purok,
                          dateOrPeriod: `${eq.borrowDate} to ${eq.returnDate}`,
                          purpose: eq.purpose,
                          details: `Assigned Custodian: Barangay Property Custodian`,
                          status: eq.status,
                          notes: eq.conditionOnRelease || 'Standard logistics borrowing protocol applies.',
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Gate Pass</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      )}

      {/* New Reservation Modal */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  {subSection === 'facilities' ? <Building2 className="w-5 h-5" /> : <Tent className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {subSection === 'facilities' ? 'Book a Public Facility' : 'Request Borrowable Equipment'}
                  </h3>
                  <p className="text-xs text-slate-500">Barangay Sangkol Community Logistics</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBookingModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {subSection === 'facilities' ? (
              <form onSubmit={handleCreateFacilityReservation} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Facility Venue</label>
                  <select
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Multi-Purpose Gymnasium">Multi-Purpose Gymnasium (Covered Court)</option>
                    <option value="Covered Basketball Court">Covered Basketball Court (Outdoor Bleachers)</option>
                    <option value="Day Care Center Hall">Day Care Center Hall</option>
                    <option value="Barangay Session Hall">Barangay Session Hall (Airconditioned)</option>
                    <option value="Community Park Stage">Community Park Stage & Plaza</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Activity / Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Purok Mangga Youth Friendly Basketball Invitational"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Event Date</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                    <input
                      type="text"
                      placeholder="08:00 AM"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">End Time</label>
                    <input
                      type="text"
                      placeholder="12:00 PM"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Expected Attendees</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={attendees}
                      onChange={(e) => setAttendees(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Applicant Contact</label>
                    <input
                      type="text"
                      readOnly
                      value={contactNumber}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purpose & Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about the nature of the event, equipment setup needed, etc."
                    value={eventPurpose}
                    onChange={(e) => setEventPurpose(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-amber-700" />
                    <span>Barangay Venue Guidelines</span>
                  </p>
                  <p>Organizers must maintain cleanliness, observe noise curfews, and coordinate with Barangay Tanod for security.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewBookingModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-md"
                  >
                    Submit Booking Request
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateEquipmentReservation} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Equipment Item</label>
                  <select
                    value={selectedEquipment}
                    onChange={(e) => setSelectedEquipment(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="Heavy Duty Canopy Tent (Tolda)">Heavy Duty Canopy Tent (Tolda)</option>
                    <option value="Monobloc Chairs Set (50 pcs)">Monobloc Chairs Set (50 pcs)</option>
                    <option value="Foldable Banquet Tables (5 pcs)">Foldable Banquet Tables (5 pcs)</option>
                    <option value="Public Address (PA) Sound System">Public Address (PA) Sound System</option>
                    <option value="Mobile Electric Generator (5kVA)">Mobile Electric Generator (5kVA)</option>
                    <option value="Heavy Duty Grass Cutter">Heavy Duty Grass Cutter</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={equipmentQty}
                      onChange={(e) => setEquipmentQty(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Borrow Date</label>
                    <input
                      type="date"
                      required
                      value={borrowDate}
                      onChange={(e) => setBorrowDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Return Due Date</label>
                    <input
                      type="date"
                      required
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Borrowing Purpose & Location</label>
                  <textarea
                    rows={3}
                    placeholder="Specify the event or purpose, and the exact street address where items will be set up."
                    value={equipmentPurpose}
                    onChange={(e) => setEquipmentPurpose(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-[11px] text-teal-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    <span>Lending Accountability Protocol</span>
                  </p>
                  <p>Resident must inspect items upon release and return them in good, clean working condition.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewBookingModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer shadow-md"
                  >
                    Submit Equipment Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Resident Official Printable Slip / Gate Pass Modal */}
      {printSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-black text-slate-900">
                  {printSlip.type === 'facility' ? 'Facility Usage Permit' : 'Barangay Equipment Gate Pass'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrintSlip(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 border-2 border-slate-800 rounded-xl space-y-4 bg-white text-slate-900 font-sans">
              <div className="text-center border-b border-slate-200 pb-3 space-y-0.5">
                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Republic of the Philippines</p>
                <h4 className="text-sm font-black text-slate-900">BARANGAY SANGKOL LOGISTICS OFFICE</h4>
                <p className="text-[11px] font-semibold text-emerald-800">
                  {printSlip.type === 'facility' ? 'OFFICIAL FACILITY PERMIT' : 'EQUIPMENT CUSTODIAN SLIP'}
                </p>
                <p className="font-mono text-xs font-bold text-slate-700 pt-1">Pass No: {printSlip.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Holder / Borrower:</span>
                  <span className="font-bold text-slate-800">{printSlip.resident}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Purok / Contact:</span>
                  <span className="font-medium text-slate-800">{printSlip.purok} ({printSlip.contact})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Item / Facility:</span>
                  <span className="font-bold text-emerald-900">{printSlip.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Schedule / Period:</span>
                  <span className="font-bold text-slate-800">{printSlip.dateOrPeriod}</span>
                </div>
              </div>

              <div className="text-xs pt-1 border-t border-slate-100 space-y-1">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Event / Purpose:</span>
                  <p className="font-medium text-slate-700">{printSlip.purpose}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Status & Logistics Clearance:</span>
                  <p className="font-bold text-emerald-700">{printSlip.status}</p>
                </div>
                {printSlip.notes && (
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Desk / Condition Notes:</span>
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded">{printSlip.notes}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 flex justify-between items-end text-[10px] text-slate-500">
                <div>
                  <div className="border-b border-slate-800 w-28 mb-1"></div>
                  <span>Resident Signature</span>
                </div>
                <div className="text-right">
                  <div className="border-b border-slate-800 w-28 mb-1 ml-auto"></div>
                  <span>Property Custodian / Admin</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPrintSlip(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
