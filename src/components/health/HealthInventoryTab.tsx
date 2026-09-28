import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Pill,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PharmacyInventoryItem } from '../../types/residentServices';
import { RecentSearchesInput } from '../RecentSearchesInput';

interface HealthInventoryTabProps {
  inventory: PharmacyInventoryItem[];
  mode: 'admin' | 'resident';
  onAddMedicine?: () => void;
  onEditMedicine?: (item: PharmacyInventoryItem) => void;
  onDeleteMedicine?: (id: string, name: string) => void;
  onRestockMedicine?: (id: string, qty: number, name: string) => void;
  onRequestRefill?: (item: PharmacyInventoryItem) => void;
}

export const HealthInventoryTab: React.FC<HealthInventoryTabProps> = ({
  inventory,
  mode,
  onAddMedicine,
  onEditMedicine,
  onDeleteMedicine,
  onRestockMedicine,
  onRequestRefill,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const categories = useMemo(() => {
    const defaultList = [
      'All',
      'Antihypertensive',
      'Antidiabetic',
      'Analgesic / Antipyretic',
      'Antibiotic',
      'Vitamins & Minerals',
      'Maternal & Prenatal Care',
      'Respiratory / Anti-Asthma',
      'Pediatric',
    ];
    const existingCats = Array.from(new Set(inventory.map((i) => i.category).filter(Boolean)));
    const combined = ['All', 'Antihypertensive', ...defaultList.filter((c) => c !== 'All' && c !== 'Antihypertensive')];
    existingCats.forEach((c) => {
      if (!combined.includes(c)) combined.push(c);
    });
    return combined;
  }, [inventory]);

  const lowStockItems = inventory.filter(
    (item) => item.stockQuantity <= (item.minimumThreshold ?? item.reorderLevel ?? 20)
  );

  const filteredInventory = inventory.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const name = (item.name || '').toLowerCase();
    const generic = (item.genericName || '').toLowerCase();
    const indications = (item.indications || item.brandOrDosage || '').toLowerCase();
    const category = (item.category || '').toLowerCase();

    const matchesSearch =
      !q ||
      name.includes(q) ||
      generic.includes(q) ||
      indications.includes(q) ||
      category.includes(q);

    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;

    const threshold = item.minimumThreshold ?? item.reorderLevel ?? 20;
    const matchesLowStock = !showLowStockOnly || item.stockQuantity <= threshold;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              Barangay Botika
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {inventory.length} Medicine Formulations
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            {mode === 'admin' ? 'Botika Stock Management & Inventory Control' : 'Available Maintenance Medicines & Supplies'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            {mode === 'admin'
              ? 'Monitor essential primary health medicines, trigger batch restocks, and track reorder thresholds.'
              : 'Browse real-time pharmacy inventory, dosage forms, indications, and request free monthly maintenance supplies.'}
          </p>
        </div>

        {mode === 'admin' && onAddMedicine && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onAddMedicine}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine Item</span>
            </button>
          </div>
        )}
      </div>

      {/* Low Stock Alert Header if any */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-xl shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-950 dark:text-amber-100">
                {lowStockItems.length} medicine item(s) below reorder threshold
              </p>
              <p className="text-amber-800 dark:text-amber-300 text-[11px] mt-0.5">
                {lowStockItems.map((i) => i.name).slice(0, 3).join(', ')}
                {lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} others` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shrink-0 cursor-pointer ${
              showLowStockOnly
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900 text-amber-950 dark:text-amber-100'
            }`}
          >
            {showLowStockOnly ? 'Show All Stock' : 'Filter Low Stock Only'}
          </button>
        </div>
      )}

      {/* Search & Category Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <RecentSearchesInput
            className="w-full sm:w-80"
            placeholder="Search medicine brand, generic name, indication..."
            value={searchQuery}
            onChange={setSearchQuery}
            storageKey="health_inventory"
            theme="light"
            inputClassName="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500"
          />

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing <strong className="text-slate-900 dark:text-white">{filteredInventory.length}</strong> items</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mode View: Admin Table View vs Resident Grid View */}
      {mode === 'admin' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-5">Brand & Generic Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Form / Strength</th>
                  <th className="p-3.5">Stock Level</th>
                  <th className="p-3.5">Lot # & Expiry</th>
                  <th className="p-3.5">Dispense Condition</th>
                  <th className="p-3.5 pr-5 text-right">Inventory Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No medicines found matching the current search query or category.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const threshold = item.minimumThreshold ?? item.reorderLevel ?? 20;
                    const isLowStock = item.stockQuantity <= threshold;
                    const itemName = item.name || `${item.genericName} ${item.brandOrDosage || ''}`.trim();

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 pl-5">
                          <p className="font-bold text-slate-900 dark:text-white">{itemName}</p>
                          <p className="text-[11px] text-slate-500 italic">{item.genericName}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{item.dosageForm || item.brandOrDosage || 'Standard'}</p>
                          <p className="text-[11px] text-slate-500">{item.strength || ''}</p>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-black text-sm ${isLowStock ? 'text-rose-600 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                              {item.stockQuantity} {item.unit}
                            </span>
                            {isLowStock && (
                              <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold rounded">
                                Low
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">Reorder at: {threshold}</span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px]">
                          <p className="text-slate-700 dark:text-slate-300 font-bold">{item.batchNumber || 'BATCH-2026'}</p>
                          <p className="text-slate-400">Exp: {item.expiryDate}</p>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.requiresPrescription
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {item.requiresPrescription ? 'Rx Required' : 'OTC Clearance'}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {onRestockMedicine && (
                              <button
                                onClick={() => onRestockMedicine(item.id, 50, itemName)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                                title="Add 50 units to current stock"
                              >
                                <Plus className="w-3 h-3" /> +50
                              </button>
                            )}
                            {onEditMedicine && (
                              <button
                                onClick={() => onEditMedicine(item)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] cursor-pointer"
                              >
                                Edit
                              </button>
                            )}
                            {onDeleteMedicine && (
                              <button
                                onClick={() => onDeleteMedicine(item.id, itemName)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                                title="Delete formulation"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item) => {
            const threshold = item.minimumThreshold ?? item.reorderLevel ?? 20;
            const isLowStock = item.stockQuantity <= threshold;
            const itemName = item.name || `${item.genericName} ${item.brandOrDosage || ''}`.trim();

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                      {item.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isLowStock
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {isLowStock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{itemName}</h4>
                    <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">{item.strength} • {item.dosageForm}</p>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">Generic: {item.genericName}</p>
                  </div>

                  {item.indications && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <strong className="text-slate-800 dark:text-slate-200">Indication: </strong>
                      {item.indications}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Available:</span>
                      <strong className="text-xs text-slate-900 dark:text-white">{item.stockQuantity} {item.unit}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Batch Expiry:</span>
                      <strong className="text-xs text-slate-900 dark:text-white">{item.expiryDate}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.requiresPrescription ? 'Rx Required' : 'OTC Clearance'}
                  </span>
                  {onRequestRefill && (
                    <button
                      type="button"
                      onClick={() => onRequestRefill(item)}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>Request Refill</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
