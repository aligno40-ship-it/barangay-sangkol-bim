import React, { useState, useMemo, useDeferredValue, useEffect } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { Household, HouseholdMember } from '../types';
import { HouseholdPrintModal } from '../components/HouseholdPrintModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { DataImportModal } from '../components/DataImportModal';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { InfoButton } from '../components/InfoButton';
import { Pagination } from '../components/Pagination';
import {
  Home,
  Users,
  Plus,
  Search,
  MapPin,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Droplets,
  Zap,
  DollarSign,
  HeartHandshake,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';

export const HouseholdsView: React.FC = () => {
  const { households, residents, addHousehold, updateHousehold, deleteHousehold, settings, currentUser, arePuroksMatching } = useBarangay();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurok, setSelectedPurok] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [householdForPrint, setHouseholdForPrint] = useState<Household | null>(null);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [deleteTargetHousehold, setDeleteTargetHousehold] = useState<Household | null>(null);

  // Form State
  const initialForm: Omit<Household, 'id' | 'dateCreated'> = {
    householdNo: `HH-2026-${String(households.length + 1).padStart(3, '0')}`,
    purok: settings.puroks[0] || 'Purok Pinya',
    streetAddress: '',
    headResidentId: '',
    headName: '',
    contactNumber: '',
    housingType: 'Concrete',
    houseOwnership: 'Owned',
    waterSource: 'Piped Water / Utility',
    sanitaryToilet: true,
    electricitySource: 'Direct Line / Power Co.',
    monthlyHouseholdIncome: 20000,
    is4PsBeneficiary: false,
    remarks: '',
    members: [],
  };

  const [formData, setFormData] = useState(initialForm);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, selectedPurok]);

  const filteredHouseholds = useMemo(() => {
    const seenHouseholdIds = new Set<string>();
    const term = deferredSearchQuery.toLowerCase().trim();

    return households.filter((h) => {
      if (!h.id || seenHouseholdIds.has(h.id)) return false;
      seenHouseholdIds.add(h.id);

      if (!arePuroksMatching(h.purok, selectedPurok)) return false;

      if (term) {
        const hhNo = (h.householdNo || '').toLowerCase();
        const head = (h.headName || '').toLowerCase();
        const address = (h.streetAddress || '').toLowerCase();
        const purok = (h.purok || '').toLowerCase();
        const matchesSearch =
          hhNo.includes(term) ||
          head.includes(term) ||
          address.includes(term) ||
          purok.includes(term) ||
          arePuroksMatching(h.purok, term);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [households, deferredSearchQuery, selectedPurok, arePuroksMatching]);

  const paginatedHouseholds = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredHouseholds.slice(startIndex, startIndex + pageSize);
  }, [filteredHouseholds, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingHousehold(null);
    setFormData({
      ...initialForm,
      householdNo: `HH-2026-${String(households.length + 1).padStart(3, '0')}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (hh: Household) => {
    setEditingHousehold(hh);
    setFormData({
      householdNo: hh.householdNo,
      purok: hh.purok,
      streetAddress: hh.streetAddress,
      headResidentId: hh.headResidentId,
      headName: hh.headName,
      contactNumber: hh.contactNumber,
      housingType: hh.housingType,
      houseOwnership: hh.houseOwnership,
      waterSource: hh.waterSource,
      sanitaryToilet: hh.sanitaryToilet,
      electricitySource: hh.electricitySource,
      monthlyHouseholdIncome: hh.monthlyHouseholdIncome,
      is4PsBeneficiary: hh.is4PsBeneficiary,
      remarks: hh.remarks || '',
      members: hh.members,
    });
    setIsModalOpen(true);
  };

  const handleHeadSelect = (resId: string) => {
    const res = residents.find((r) => r.id === resId);
    if (res) {
      setFormData((prev) => ({
        ...prev,
        headResidentId: res.id,
        headName: `${res.firstName} ${res.lastName}`,
        purok: res.purok,
        streetAddress: res.streetAddress,
        contactNumber: res.contactNumber,
        is4PsBeneficiary: res.is4PsBeneficiary,
        members: [
          {
            residentId: res.id,
            name: `${res.firstName} ${res.lastName}`,
            relationshipToHead: 'Head',
            age: res.age,
            sex: res.sex,
            occupation: res.occupation,
          },
          ...prev.members.filter((m) => m.residentId !== res.id),
        ],
      }));
    }
  };

  const handleAddMember = (resId: string, rel: HouseholdMember['relationshipToHead']) => {
    const res = residents.find((r) => r.id === resId);
    if (!res) return;
    if (formData.members.some((m) => m.residentId === resId)) {
      alert('Resident is already added to this household.');
      return;
    }
    const newMember: HouseholdMember = {
      residentId: res.id,
      name: `${res.firstName} ${res.lastName}`,
      relationshipToHead: rel,
      age: res.age,
      sex: res.sex,
      occupation: res.occupation,
    };
    setFormData((prev) => ({ ...prev, members: [...prev.members, newMember] }));
  };

  const handleRemoveMember = (resId: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.residentId !== resId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.headName) {
      alert('Please select or specify a Household Head.');
      return;
    }
    if (editingHousehold) {
      updateHousehold(editingHousehold.id, formData);
    } else {
      addHousehold(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <Home className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Household Management</span>
            <InfoButton
              title="Household Registry"
              info={`Records of ${households.length} registered families & living quarters in ${settings.barangayName}.`}
              variant="light"
            />
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setHouseholdForPrint(null);
              setIsPrintModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            title="Print Official Household Registry Masterlist"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Print Masterlist</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            title="Import households from Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Excel / CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Household</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <RecentSearchesInput
          className="flex-1"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search household no. or head name..."
          storageKey="households"
          theme="light"
        />

        <div className="w-full sm:w-64">
          <select
            value={selectedPurok}
            onChange={(e) => setSelectedPurok(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
          >
            <option value="All">All Puroks ({settings.puroks.length})</option>
            {settings.puroks.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Household Registry Directory Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Household Registry Records
            </span>
            <span className="text-xs text-slate-500 ml-2">({filteredHouseholds.length} families)</span>
          </div>

          <ViewModeToggle
            viewMode={viewMode}
            onChange={setViewMode}
            theme="light"
            accentColor="indigo"
            tableTitle="Table View (RBI Registry List)"
            gridTitle="Grid View (Household Profile Cards)"
          />
        </div>

        {filteredHouseholds.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Home className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
            <p className="text-sm font-semibold text-slate-700">No households match your filter criteria</p>
            <p className="text-xs text-slate-500">Try adjusting your search terms or selected purok.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Household No.</th>
                  <th className="px-4 py-3">Head of Family</th>
                  <th className="px-4 py-3">Purok / Location</th>
                  <th className="px-4 py-3">Members Count</th>
                  <th className="px-4 py-3">Housing & Tenure</th>
                  <th className="px-4 py-3">Est. Monthly Income</th>
                  <th className="px-4 py-3">4Ps Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedHouseholds.map((hh) => (
                  <tr key={hh.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700 text-[11px]">
                      {hh.householdNo}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 text-xs">{hh.headName}</p>
                      <p className="text-[10px] text-slate-500">{hh.contactNumber || 'No contact specified'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p className="font-medium text-xs text-indigo-600">{hh.purok}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-xs">{hh.streetAddress || 'Barangay Sangkol'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span>{hh.members.length} member{hh.members.length === 1 ? '' : 's'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      <p className="font-medium text-slate-800">{hh.housingType}</p>
                      <p className="text-[10px] text-slate-500">{hh.houseOwnership}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                      ₱{hh.monthlyHouseholdIncome.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {hh.is4PsBeneficiary ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>4Ps</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Non-4Ps</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setHouseholdForPrint(hh);
                            setIsPrintModalOpen(true);
                          }}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 cursor-pointer transition-colors"
                          title="Print Household Sheet (RBI Form 1B)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(hh)}
                          className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-600 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                          title="Edit Household"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {currentUser.role === 'Administrator' && (
                          <button
                            onClick={() => setDeleteTargetHousehold(hh)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                            title="Delete Household"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedHouseholds.map((hh) => (
              <div
                key={hh.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all space-y-4 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold">
                        {hh.householdNo}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">{hh.headName}</h3>
                      <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{hh.purok}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setHouseholdForPrint(hh);
                          setIsPrintModalOpen(true);
                        }}
                        className="p-1.5 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-200 cursor-pointer transition-colors"
                        title="Print Household Composition Sheet (RBI Form 1B)"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(hh)}
                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-600 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                        title="Edit Household"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {currentUser.role === 'Administrator' && (
                        <button
                          onClick={() => setDeleteTargetHousehold(hh)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                          title="Delete Household"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <span>Family Members ({hh.members.length})</span>
                      <span>Role</span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {hh.members.map((m, mIdx) => (
                        <div key={`${hh.id}-m-${m.residentId || mIdx}-${mIdx}`} className="flex justify-between text-xs py-0.5 border-b border-slate-200/60">
                          <span className="text-slate-800 font-medium truncate">{m.name}</span>
                          <span className="text-[10px] text-indigo-600 font-bold shrink-0 ml-2">{m.relationshipToHead}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Housing & Amenities Meta */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Housing Type:</span>
                      <span className="font-bold text-slate-900">{hh.housingType}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Ownership:</span>
                      <span className="font-bold text-slate-900">{hh.houseOwnership}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Sanitary Toilet:</span>
                      <span className={`font-bold ${hh.sanitaryToilet ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {hh.sanitaryToilet ? 'Equipped' : 'None / Open'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Est. Monthly Income:</span>
                      <span className="font-bold text-indigo-700">₱{hh.monthlyHouseholdIncome.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {hh.is4PsBeneficiary && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>4Ps Registered Household</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* High-Performance Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredHouseholds.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[15, 25, 50, 100]}
          itemName="households"
          theme="auto"
        />
      </div>

      {/* Add / Edit Household Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-600" />
                <span>{editingHousehold ? 'Edit Household' : 'Create New Household Record'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Household No. *</label>
                  <input
                    type="text"
                    required
                    value={formData.householdNo}
                    onChange={(e) => setFormData({ ...formData, householdNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Purok / Zone</label>
                  <select
                    value={formData.purok}
                    onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                  >
                    {settings.puroks.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Family Head from Resident Registry</label>
                <select
                  value={formData.headResidentId}
                  onChange={(e) => handleHeadSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="">-- Choose Head of Family --</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.lastName}, {r.firstName} ({r.purok}) - {r.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Housing & Living Standards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Housing Type</label>
                  <select
                    value={formData.housingType}
                    onChange={(e) => setFormData({ ...formData, housingType: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 cursor-pointer"
                  >
                    <option value="Concrete">Concrete</option>
                    <option value="Semi-Concrete">Semi-Concrete</option>
                    <option value="Wood">Wood</option>
                    <option value="Light Materials">Light Materials</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Ownership</label>
                  <select
                    value={formData.houseOwnership}
                    onChange={(e) => setFormData({ ...formData, houseOwnership: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 cursor-pointer"
                  >
                    <option value="Owned">Owned</option>
                    <option value="Rented">Rented</option>
                    <option value="Informal Settler">Informal Settler</option>
                    <option value="Living with Relatives">Living with Relatives</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Monthly Income (₱)</label>
                  <input
                    type="number"
                    value={formData.monthlyHouseholdIncome}
                    onChange={(e) => setFormData({ ...formData, monthlyHouseholdIncome: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Sanitary Toilet</label>
                  <select
                    value={formData.sanitaryToilet ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, sanitaryToilet: e.target.value === 'true' })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 cursor-pointer"
                  >
                    <option value="true">With Sanitary Toilet</option>
                    <option value="false">Without Toilet</option>
                  </select>
                </div>
              </div>

              {/* Members Manager */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Household Members</h4>
                  <span className="text-xs text-slate-500 font-medium">{formData.members.length} members added</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {formData.members.map((m, mIdx) => (
                      <div key={`form-m-${m.residentId || mIdx}-${mIdx}`} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs">
                        <div>
                          <span className="font-bold text-slate-900">{m.name}</span>
                          <span className="text-slate-500 ml-2">({m.age} yrs, {m.sex})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                            {m.relationshipToHead}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.residentId)}
                            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Save Household
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetHousehold}
        title="Delete Household Record"
        itemType="Household Record"
        itemName={deleteTargetHousehold ? `${deleteTargetHousehold.householdNo} - Head: ${deleteTargetHousehold.headName} (${deleteTargetHousehold.purok})` : undefined}
        description="Permanently remove this household record from the database. Family members listed will remain in the resident registry."
        confirmText="Yes, Delete Household"
        onConfirm={() => {
          if (deleteTargetHousehold) {
            deleteHousehold(deleteTargetHousehold.id);
          }
        }}
        onClose={() => setDeleteTargetHousehold(null)}
      />

      {/* Bulk Excel / CSV Data Importer */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialEntity="households"
      />

      {/* Official Household Record Print Modal */}
      <HouseholdPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setHouseholdForPrint(null);
        }}
        initialHousehold={householdForPrint}
        filteredHouseholds={filteredHouseholds}
        filterPurok={selectedPurok}
      />
    </div>
  );
};
