import React, { useState } from 'react';
import { X, Recycle, DollarSign, Scale, Gift, User, CheckCircle2, Sparkles } from 'lucide-react';
import { MRFRecyclablesDropRecord } from '../../types/residentServices';
import { useBarangay } from '../../context/BarangayContext';

interface MRFDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<MRFRecyclablesDropRecord, 'id' | 'loggedDate'>) => void;
}

const MRF_RATES_CONFIG: Record<
  MRFRecyclablesDropRecord['itemCategory'],
  { pricePerKg: number; riceKgPerKg: number; pointsPerKg: number }
> = {
  'Plastic Bottles (PET / HDPE)': { pricePerKg: 12, riceKgPerKg: 0.25, pointsPerKg: 10 },
  'Corrugated Carton & Old Newspaper': { pricePerKg: 6, riceKgPerKg: 0.12, pointsPerKg: 5 },
  'Scrap Iron & Metals (Bakal / G.I.)': { pricePerKg: 18, riceKgPerKg: 0.4, pointsPerKg: 15 },
  'Aluminum Cans & Beverage Tins': { pricePerKg: 45, riceKgPerKg: 1.0, pointsPerKg: 35 },
  'Glass Bottles & Culinary Jars': { pricePerKg: 4, riceKgPerKg: 0.08, pointsPerKg: 4 },
  'E-Waste & Discarded Small Appliances': { pricePerKg: 30, riceKgPerKg: 0.65, pointsPerKg: 25 },
};

export const MRFDropModal: React.FC<MRFDropModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { residents, currentUser } = useBarangay();

  const [residentId, setResidentId] = useState(residents[0]?.id || 'RES-001');
  const [itemCategory, setItemCategory] = useState<MRFRecyclablesDropRecord['itemCategory']>(
    'Plastic Bottles (PET / HDPE)'
  );
  const [weightKg, setWeightKg] = useState<number>(5);
  const [rewardType, setRewardType] = useState<MRFRecyclablesDropRecord['rewardType']>(
    'Rice Swap (Bigas kg)'
  );
  const [officerInCharge, setOfficerInCharge] = useState(
    currentUser?.name || 'Kgd. Joel Manalo (MRF Officer)'
  );

  if (!isOpen) return null;

  const selectedResident = residents.find((r) => r.id === residentId);
  const residentName = selectedResident
    ? `${selectedResident.firstName} ${selectedResident.lastName}`
    : 'Juan Dela Cruz';
  const purok = selectedResident?.purok || 'Purok 1 - Mabini';

  const rates = MRF_RATES_CONFIG[itemCategory] || { pricePerKg: 10, riceKgPerKg: 0.2, pointsPerKg: 10 };
  const calculatedCash = Math.round(weightKg * rates.pricePerKg);
  const calculatedRice = (weightKg * rates.riceKgPerKg).toFixed(2);
  const calculatedPoints = Math.round(weightKg * rates.pointsPerKg);

  const rewardValue =
    rewardType === 'Rice Swap (Bigas kg)'
      ? `${calculatedRice} kg Rice`
      : rewardType === 'Cash Payout (₱)'
      ? `₱${calculatedCash.toLocaleString()}`
      : `${calculatedPoints} Eco-Points`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      residentId,
      residentName,
      purok,
      itemCategory,
      weightKg: Number(weightKg),
      rewardType,
      rewardValue,
      officerInCharge,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              <Recycle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Log MRF Recyclables Trade-In
              </h3>
              <p className="text-xs text-slate-500">Materials Recovery Facility Drop-off Station</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Resident *</label>
            <select
              value={residentId}
              onChange={(e) => setResidentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
            >
              {residents.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.firstName} {res.lastName} — {res.purok} ({res.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Material Category *</label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
              >
                <option value="Plastic Bottles (PET / HDPE)">Plastic Bottles (PET / HDPE)</option>
                <option value="Corrugated Carton & Old Newspaper">Corrugated Carton & Old Newspaper</option>
                <option value="Scrap Iron & Metals (Bakal / G.I.)">Scrap Iron & Metals (Bakal / G.I.)</option>
                <option value="Aluminum Cans & Beverage Tins">Aluminum Cans & Beverage Tins</option>
                <option value="Glass Bottles & Culinary Jars">Glass Bottles & Culinary Jars</option>
                <option value="E-Waste & Discarded Small Appliances">E-Waste & Discarded Small Appliances</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Scale Weight (kg) *</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-black text-sm pr-9"
                />
                <span className="absolute right-3 top-2 font-bold text-slate-400">kg</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Incentive Reward Mode *</label>
            <select
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold text-emerald-800 dark:text-emerald-300"
            >
              <option value="Rice Swap (Bigas kg)">Bigas Kapalit (Rice Swap - {calculatedRice} kg Rice)</option>
              <option value="Cash Payout (₱)">Cash Payout (₱{calculatedCash})</option>
              <option value="Barangay Eco-Points">Barangay Eco-Points (+{calculatedPoints} pts)</option>
            </select>
          </div>

          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Receipt Calculation Summary
            </span>
            <div className="flex items-center justify-between font-black text-sm text-slate-900 dark:text-white">
              <span>Selected Incentive:</span>
              <span className="text-emerald-800 dark:text-emerald-300">{rewardValue}</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Receiving Officer / Staff</label>
            <input
              type="text"
              value={officerInCharge}
              onChange={(e) => setOfficerInCharge(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl cursor-pointer shadow-md"
            >
              Issue MRF Trade-In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
