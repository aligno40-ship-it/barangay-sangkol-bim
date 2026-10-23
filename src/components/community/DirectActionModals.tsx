import React, { useState } from 'react';
import {
  X,
  Building2,
  Package,
  Syringe,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Phone,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Pill,
  Heart,
  Truck,
  Printer,
  QrCode,
  Search,
  AlertCircle,
} from 'lucide-react';
import {
  FacilityReservation,
  EquipmentReservation,
  MedicineRefillRequest,
  FinancialAssistanceRequest,
  BulkWastePickupRequest,
  AssistiveDeviceRequest,
  ChildImmunizationTracker,
  AyudaClaimStub,
} from '../../types/residentServices';

// ================= MODAL: DIRECT ADMIN FACILITY BOOKING =================
interface DirectFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  residents: any[];
}

export const DirectFacilityModal: React.FC<DirectFacilityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  residents,
}) => {
  const [form, setForm] = useState({
    facilityName: 'Barangay Multi-Purpose Gymnasium',
    residentName: '',
    contactNumber: '0917-123-4567',
    purok: 'Purok Pinya',
    eventTitle: '',
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00 AM',
    endTime: '12:00 PM',
    attendeesEstimate: 50,
    fee: 0,
    remarks: 'Direct official walk-in / assembly booking approved by admin.',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
              Book Venue / Facility (Walk-In or Official)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Venue / Facility *
            </label>
            <select
              value={form.facilityName}
              onChange={(e) => setForm({ ...form, facilityName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="Barangay Multi-Purpose Gymnasium">Barangay Multi-Purpose Gymnasium</option>
              <option value="Barangay Session Hall & Conference Room">Barangay Session Hall & Conference Room</option>
              <option value="Barangay Covered Basketball Court">Barangay Covered Basketball Court</option>
              <option value="Barangay Plaza & Stage Grounds">Barangay Plaza & Stage Grounds</option>
              <option value="Senior Citizens & Daycare Multi-Hall">Senior Citizens & Daycare Multi-Hall</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Applicant / Organization Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Juan Dela Cruz / SK Council"
                value={form.residentName}
                onChange={(e) => setForm({ ...form, residentName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contact Number
              </label>
              <input
                type="text"
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Purok
              </label>
              <select
                value={form.purok}
                onChange={(e) => setForm({ ...form, purok: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Purok Pinya">Purok Pinya</option>
                <option value="Purok Lumboy">Purok Lumboy</option>
                <option value="Purok Mangga">Purok Mangga</option>
                <option value="Purok Tambis">Purok Tambis</option>
                <option value="Purok Kaimito">Purok Kaimito</option>
                <option value="Purok Bayabas">Purok Bayabas</option>
                <option value="External / Non-Resident">External / Non-Resident</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Attendees
              </label>
              <input
                type="number"
                min={1}
                value={form.attendeesEstimate}
                onChange={(e) => setForm({ ...form, attendeesEstimate: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Purok General Assembly & Feasibility Meeting"
              value={form.eventTitle}
              onChange={(e) => setForm({ ...form, eventTitle: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="text"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Time
              </label>
              <input
                type="text"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Facility Fee (₱)
              </label>
              <input
                type="number"
                min={0}
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Purpose / Activity
              </label>
              <input
                type="text"
                placeholder="e.g. Official Meeting, Sports Tournament, Birthday"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Confirm Booking & Issue Permit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= MODAL: DIRECT ADMIN EQUIPMENT LOAN =================
interface DirectEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const DirectEquipmentModal: React.FC<DirectEquipmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    equipmentName: 'Heavy-Duty Heavy Rain Tolda / Canopy Tent (10x15 ft)',
    quantity: 1,
    residentName: '',
    contactNumber: '0918-987-6543',
    purok: 'Purok Lumboy',
    purpose: 'Community Event / Wake / Family Gathering',
    borrowDate: new Date().toISOString().split('T')[0],
    returnDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    conditionOnRelease: 'Brand new / Clean with heavy metal posts and ground pegs',
    depositAmount: 0,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-600" />
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
              Direct Equipment Loan Requisition
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Equipment Item *
            </label>
            <select
              value={form.equipmentName}
              onChange={(e) => setForm({ ...form, equipmentName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="Heavy-Duty Heavy Rain Tolda / Canopy Tent (10x15 ft)">Heavy-Duty Canopy Tent (Tolda)</option>
              <option value="Monobloc Chairs (Set of 25 pcs)">Monobloc Chairs (Set of 25 pcs)</option>
              <option value="Foldable Long Banquet Table (6 ft)">Foldable Long Banquet Table (6 ft)</option>
              <option value="Portable PA Sound System & Dual Wireless Mics">Portable Sound System & Wireless Mics</option>
              <option value="Standby Diesel Generator Set (5.5 kVA)">Diesel Generator Set (5.5 kVA)</option>
              <option value="Grass Cutter / Brush Cutter Heavy-Duty">Grass Cutter / Brush Cutter</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Borrower Resident Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maria Santos"
                value={form.residentName}
                onChange={(e) => setForm({ ...form, residentName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contact Number
              </label>
              <input
                type="text"
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Purok
              </label>
              <select
                value={form.purok}
                onChange={(e) => setForm({ ...form, purok: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Purok Pinya">Purok Pinya</option>
                <option value="Purok Lumboy">Purok Lumboy</option>
                <option value="Purok Mangga">Purok Mangga</option>
                <option value="Purok Tambis">Purok Tambis</option>
                <option value="Purok Kaimito">Purok Kaimito</option>
                <option value="Purok Bayabas">Purok Bayabas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Release Date
              </label>
              <input
                type="date"
                value={form.borrowDate}
                onChange={(e) => setForm({ ...form, borrowDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expected Return Date
              </label>
              <input
                type="date"
                value={form.returnDate}
                onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Approve & Release Equipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= MODAL: RECORD CHILD IMMUNIZATION DOSE =================
interface ChildImmModalProps {
  item: ChildImmunizationTracker | null;
  onClose: () => void;
  onSave: (id: string, doseNumber: string, dateAdministered: string, administeredBy: string) => void;
  currentUserName: string;
}

export const ChildImmunizationDoseModal: React.FC<ChildImmModalProps> = ({
  item,
  onClose,
  onSave,
  currentUserName,
}) => {
  const [doseNum, setDoseNum] = useState<ChildImmunizationTracker['doseNumber']>(item ? item.doseNumber : 'Dose 1');
  const [adminDate, setAdminDate] = useState(new Date().toISOString().split('T')[0]);
  const [adminBy, setAdminBy] = useState(`BHW ${currentUserName}`);

  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Syringe className="w-5 h-5 text-purple-600" />
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              Record Vaccine Dose Administered
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl text-xs space-y-1">
          <p><span className="font-bold">Child Patient:</span> {item.childName}</p>
          <p><span className="font-bold">Parent / Guardian:</span> {item.parentName}</p>
          <p><span className="font-bold">Vaccine Program:</span> {item.vaccineName}</p>
          <p><span className="font-bold">Schedule / Due:</span> {item.dueDate}</p>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Dose Administered
            </label>
            <select
              value={doseNum}
              onChange={(e) => setDoseNum(e.target.value as ChildImmunizationTracker['doseNumber'])}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="Dose 1">Dose 1</option>
              <option value="Dose 2">Dose 2</option>
              <option value="Dose 3">Dose 3</option>
              <option value="Booster">Booster</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Date Administered
            </label>
            <input
              type="date"
              value={adminDate}
              onChange={(e) => setAdminDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Administering Midwife / BHW
            </label>
            <input
              type="text"
              value={adminBy}
              onChange={(e) => setAdminBy(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(item.id, doseNum, adminDate, adminBy);
              onClose();
            }}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Save Immunization Entry
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= MODAL: AYUDA QR CODE SCANNER & VERIFIER =================
interface QRVerifierProps {
  isOpen: boolean;
  onClose: () => void;
  claims: AyudaClaimStub[];
  onClaim: (stubId: string) => void;
}

export const AyudaQRVerificationModal: React.FC<QRVerifierProps> = ({
  isOpen,
  onClose,
  claims,
  onClaim,
}) => {
  const [scanInput, setScanInput] = useState('');
  const [foundClaim, setFoundClaim] = useState<AyudaClaimStub | null>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTriggered(true);
    const clean = scanInput.trim().toUpperCase();
    const match = claims.find(
      (c) =>
        c.id.toUpperCase() === clean ||
        (c.qrPayload && c.qrPayload.toUpperCase().includes(clean)) ||
        (c.residentName && c.residentName.toUpperCase().includes(clean))
    );
    setFoundClaim(match || null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              Verify & Release Ayuda QR Claim Pass
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-3">
          <p className="text-xs text-slate-500">
            Scan resident's QR code with barcode scanner or enter Claim Pass ID / Resident Name:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. AYUDA-2026-001 or Juan Dela Cruz"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-4 h-4" /> Verify
            </button>
          </div>
        </form>

        {searchTriggered && (
          <div>
            {foundClaim ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    {foundClaim.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      foundClaim.status === 'Claimed / Released'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {foundClaim.status}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {foundClaim.residentName}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 font-semibold">
                    {foundClaim.purok} {foundClaim.householdNo ? `• Household #${foundClaim.householdNo}` : ''}
                  </p>
                </div>

                <div className="border-t border-emerald-200 dark:border-emerald-800/60 pt-2 space-y-1">
                  <p><span className="font-bold">Ayuda Campaign:</span> {foundClaim.title}</p>
                  <p><span className="font-bold">Items:</span> {foundClaim.itemsIncluded.join(', ')}</p>
                  <p><span className="font-bold">Schedule:</span> {foundClaim.distributionDate} @ {foundClaim.claimLocation}</p>
                  {foundClaim.claimedAt && (
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                      Already claimed on {foundClaim.claimedAt}
                    </p>
                  )}
                </div>

                {foundClaim.status !== 'Claimed / Released' ? (
                  <button
                    onClick={() => {
                      onClaim(foundClaim.id);
                      setFoundClaim({ ...foundClaim, status: 'Claimed / Released', claimedAt: new Date().toISOString() });
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Check className="w-4 h-4" /> Confirm & Handover Relief Goods
                  </button>
                ) : (
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-center">
                    ✓ Goods already released for this pass
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-bold text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" /> No matching Ayuda claim pass found for "{scanInput}".
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
