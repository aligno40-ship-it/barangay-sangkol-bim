import React, { useState, useEffect } from 'react';
import {
  Pill,
  X,
  Plus,
  Package,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { PharmacyInventoryItem } from '../../types/residentServices';

interface PharmacyInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<PharmacyInventoryItem, 'id' | 'lastRestocked'>) => void;
  itemToEdit?: PharmacyInventoryItem | null;
}

// Common Antihypertensive Drug keywords for auto-detection
const ANTIHYPERTENSIVE_KEYWORDS = [
  'losartan',
  'amlodipine',
  'metoprolol',
  'telmisartan',
  'captopril',
  'enalapril',
  'valsartan',
  'carvedilol',
  'clonidine',
  'nifedipine',
  'hydrochlorothiazide',
  'hctz',
  'propranolol',
  'felodipine',
  'diltiazem',
  'verapamil',
  'irbesartan',
  'candesartan',
  'bisoprolol',
  'atenolol',
  'ramipril',
  'hypertension',
  'high blood',
  'blood pressure',
  'antihypertensive',
  'cardiovascular',
];

const ANTIDIABETIC_KEYWORDS = ['metformin', 'glimepiride', 'gliclazide', 'insulin', 'diabetes', 'sugar'];
const ANALGESIC_KEYWORDS = ['paracetamol', 'ibuprofen', 'mefenamic', 'tramadol', 'pain', 'fever', 'biogesic'];
const ANTIBIOTIC_KEYWORDS = ['amoxicillin', 'azithromycin', 'ciprofloxacin', 'cephalexin', 'co-amoxiclav', 'antibiotic', 'infection'];
const VITAMINS_KEYWORDS = ['ascorbic', 'vitamin', 'zinc', 'multivitamins', 'b-complex', 'folic'];
const RESPIRATORY_KEYWORDS = ['salbutamol', 'budesonide', 'cetirizine', 'montelukast', 'asthma', 'cough', 'inhaler', 'nebule'];

export const PharmacyInventoryModal: React.FC<PharmacyInventoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
}) => {
  const [name, setName] = useState(itemToEdit?.name || '');
  const [genericName, setGenericName] = useState(itemToEdit?.genericName || '');
  const [dosageForm, setDosageForm] = useState(itemToEdit?.dosageForm || '');
  const [strength, setStrength] = useState(itemToEdit?.strength || '');
  const [category, setCategory] = useState<PharmacyInventoryItem['category']>(
    itemToEdit?.category || ''
  );
  const [stockQuantity, setStockQuantity] = useState(itemToEdit?.stockQuantity ?? 0);
  const [unit, setUnit] = useState<string>(itemToEdit?.unit || '');
  const [minimumThreshold, setMinimumThreshold] = useState(itemToEdit?.minimumThreshold ?? 0);
  const [batchNumber, setBatchNumber] = useState(itemToEdit?.batchNumber || '');
  const [expiryDate, setExpiryDate] = useState(itemToEdit?.expiryDate || '');
  const [requiresPrescription, setRequiresPrescription] = useState(
    itemToEdit ? itemToEdit.requiresPrescription : true
  );
  const [programSource, setProgramSource] = useState(itemToEdit?.programSource || '');
  const [indications, setIndications] = useState(itemToEdit?.indications || '');

  const [autoDetectedCategory, setAutoDetectedCategory] = useState<string | null>(
    null
  );

  // Sync state when itemToEdit changes
  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setGenericName(itemToEdit.genericName || '');
      setDosageForm(itemToEdit.dosageForm || '');
      setStrength(itemToEdit.strength || '');
      setCategory(itemToEdit.category || '');
      setStockQuantity(itemToEdit.stockQuantity ?? 0);
      setUnit(itemToEdit.unit || '');
      setMinimumThreshold(itemToEdit.minimumThreshold ?? 0);
      setBatchNumber(itemToEdit.batchNumber || '');
      setExpiryDate(itemToEdit.expiryDate || '');
      setRequiresPrescription(itemToEdit.requiresPrescription ?? true);
      setProgramSource(itemToEdit.programSource || '');
      setIndications(itemToEdit.indications || '');
      setAutoDetectedCategory(itemToEdit.category || null);
    } else {
      setName('');
      setGenericName('');
      setDosageForm('');
      setStrength('');
      setCategory('');
      setStockQuantity(0);
      setUnit('');
      setMinimumThreshold(0);
      setBatchNumber('');
      setExpiryDate('');
      setRequiresPrescription(true);
      setProgramSource('');
      setIndications('');
      setAutoDetectedCategory(null);
    }
  }, [itemToEdit, isOpen]);

  // Smart Auto-Category Detection whenever Name or Generic Name changes
  useEffect(() => {
    if (itemToEdit) return; // Do not override if editing existing item unless cleared
    const query = `${name} ${genericName}`.toLowerCase();

    if (ANTIHYPERTENSIVE_KEYWORDS.some((kw) => query.includes(kw))) {
      setCategory('Antihypertensive');
      setAutoDetectedCategory('Antihypertensive');
      setRequiresPrescription(true);
    } else if (ANTIDIABETIC_KEYWORDS.some((kw) => query.includes(kw))) {
      setCategory('Antidiabetic');
      setAutoDetectedCategory('Antidiabetic');
      setRequiresPrescription(true);
    } else if (ANALGESIC_KEYWORDS.some((kw) => query.includes(kw))) {
      setCategory('Analgesic / Antipyretic');
      setAutoDetectedCategory('Analgesic / Antipyretic');
      setRequiresPrescription(false);
    } else if (ANTIBIOTIC_KEYWORDS.some((kw) => query.includes(kw))) {
      setCategory('Antibiotic');
      setAutoDetectedCategory('Antibiotic');
      setRequiresPrescription(true);
    } else if (VITAMINS_KEYWORDS.some((kw) => query.includes(kw))) {
      setCategory('Vitamins & Minerals');
      setAutoDetectedCategory('Vitamins & Minerals');
      setRequiresPrescription(false);
    } else if (RESPIRATORY_KEYWORDS.some((kw) => query.includes(kw))) {
      setCategory('Respiratory / Bronchodilator');
      setAutoDetectedCategory('Respiratory / Bronchodilator');
    }
  }, [name, genericName, itemToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !genericName) return;

    onSave({
      name,
      genericName,
      dosageForm,
      strength,
      category,
      stockQuantity: Number(stockQuantity),
      unit,
      minimumThreshold: Number(minimumThreshold),
      batchNumber,
      expiryDate,
      requiresPrescription,
      programSource,
      indications,
      status: itemToEdit?.status || (Number(stockQuantity) <= Number(minimumThreshold) ? 'Low Stock' : 'In Stock'),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  Pharmacy Registry
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                   Smart Category Engine Active
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {itemToEdit ? 'Edit Pharmacy Inventory Item' : 'Add Medicine to Barangay Botika'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Category Selector with Highlighted Antihypertensive Introduction */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-rose-500" />
                <span>Medicine Therapeutic Category</span>
                <span className="text-rose-500 font-black">*</span>
              </label>
              {autoDetectedCategory && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                   Auto-set: {autoDetectedCategory}
                </span>
              )}
            </div>

            <select
              required
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as any);
                setAutoDetectedCategory(null);
                if (e.target.value === 'Antihypertensive') {
                  setRequiresPrescription(true);
                }
              }}
              className="w-full px-3 py-2 border-2 border-rose-400 dark:border-rose-600 rounded-xl bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-xs"
            >
              <option value="" disabled>Select a category</option>
              <optgroup label="Primary Cardiovascular & NCD Allocation">
                <option value="Antihypertensive">
                  ❤️ Antihypertensive (Cardiovascular / Blood Pressure Maintenance)
                </option>
                <option value="Antidiabetic">
                  🩸 Antidiabetic (Oral Glycemic / Blood Sugar Maintenance)
                </option>
              </optgroup>
              <optgroup label="General Health Center Classifications">
                <option value="Analgesic / Antipyretic">💊 Analgesic / Antipyretic (Pain & Fever)</option>
                <option value="Antibiotic">🦠 Antibiotic (Anti-Infective)</option>
                <option value="Vitamins & Minerals">🥗 Vitamins & Minerals (Immunity & Nutrition)</option>
                <option value="Maternal & Prenatal Care">🤰 Maternal & Prenatal Care (Buntis Pack)</option>
                <option value="Respiratory / Bronchodilator">🫁 Respiratory / Anti-Asthma (Nebules & Bronchodilators)</option>
                <option value="Pediatric">👶 Pediatric Formulations (Syrup / Drops)</option>
                <option value="Gastrointestinal / ORS">💧 Gastrointestinal & Oral Rehydration Salts</option>
                <option value="Emergency & First Aid">🩹 Emergency & First Aid Supplies</option>
              </optgroup>
            </select>

            {/* Category Quick Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Antihypertensive',
                'Antidiabetic',
                'Analgesic / Antipyretic',
                'Antibiotic',
                'Vitamins & Minerals',
                'Respiratory / Bronchodilator',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat as any);
                    setAutoDetectedCategory(null);
                    if (cat === 'Antihypertensive') {
                      setRequiresPrescription(true);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat === 'Antihypertensive' ? '❤️ Antihypertensive' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Generic Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Brand / Product Formulation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter product name and strength"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Generic Name (Active Ingredient) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter the active ingredient"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Dosage Form</label>
              <input
                type="text"
                placeholder="Tablet, Capsule, Syrup, Nebule"
                value={dosageForm}
                onChange={(e) => setDosageForm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Strength / Specification</label>
              <input
                type="text"
                placeholder="50mg, 5mg, 500mg, 100ml"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Stock Qty</label>
              <input
                type="number"
                min={0}
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white font-black text-rose-600 dark:text-rose-400"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit of Measure</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="tablets, capsules, bottles"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reorder Threshold</label>
              <input
                type="number"
                min={0}
                value={minimumThreshold}
                onChange={(e) => setMinimumThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lot / Batch Number</label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Enter batch/lot number"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white font-mono font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Indications & Standard Dosing Guidelines
            </label>
            <input
              type="text"
              value={indications}
              onChange={(e) => setIndications(e.target.value)}
              placeholder="e.g. Hypertension maintenance, diabetes control"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus:bg-white font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <input
              type="checkbox"
              id="reqRx"
              checked={requiresPrescription}
              onChange={(e) => setRequiresPrescription(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <label htmlFor="reqRx" className="text-slate-700 dark:text-slate-300 font-bold cursor-pointer select-none">
              Requires Valid Doctor's Prescription (Rx) before dispensing
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{itemToEdit ? 'Save Changes' : 'Add Item to Pharmacy'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
