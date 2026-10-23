import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { Resident, Sex, CivilStatus, ResidentStatus } from '../types';
import { ResidentDetailModal } from '../components/ResidentDetailModal';
import { ResidentPrintModal } from '../components/ResidentPrintModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { DataImportModal } from '../components/DataImportModal';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { InfoButton } from '../components/InfoButton';
import { Pagination } from '../components/Pagination';
import { compressImageFile } from '../utils/imageUtils';
import { UserProfilePhotoModal } from '../components/UserProfilePhotoModal';
import {
  PHILIPPINE_RELIGIONS,
  CITIZENSHIP_OPTIONS,
  BLOOD_TYPES,
  EDUCATIONAL_ATTAINMENTS,
  PWD_TYPES,
  RESIDENT_STATUS_OPTIONS,
} from '../utils/civilRegistryConstants';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Archive,
  Trash2,
  FileCheck2,
  HeartHandshake,
  Shield,
  Download,
  CheckCircle2,
  X,
  CreditCard,
  FileSpreadsheet,
  Printer,
  MapPin,
  Phone,
  Camera,
  Upload,
} from 'lucide-react';

export const ResidentsView: React.FC = () => {
  const {
    residents,
    addResident,
    updateResident,
    archiveResident,
    deleteResident,
    settings,
    setActiveModule,
    setSelectedCertForPrint,
    globalSearch,
    currentUser,
    users,
    targetRecordId,
    setTargetRecordId,
    arePuroksMatching,
  } = useBarangay();

  const [searchQuery, setSearchQuery] = useState(globalSearch);
  const [selectedPurok, setSelectedPurok] = useState('All');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<ResidentStatus | 'All'>('Active');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals
  const [activeResidentForDetail, setActiveResidentForDetail] = useState<Resident | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [residentForPrint, setResidentForPrint] = useState<Resident | null>(null);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [deleteTargetResident, setDeleteTargetResident] = useState<Resident | null>(null);
  const [photoModalResident, setPhotoModalResident] = useState<Resident | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const formPhotoInputRef = React.useRef<HTMLInputElement>(null);

  // Form State
  const initialFormState: Omit<Resident, 'id' | 'dateRegistered' | 'updatedAt'> = {
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthDate: '1990-01-01',
    age: 36,
    sex: 'Male',
    civilStatus: 'Single',
    purok: settings.puroks[0] || 'Purok Pinya',
    streetAddress: '',
    householdId: '',
    nationalIdNo: '',
    photoUrl: '',
    contactNumber: '0917-000-0000',
    email: '',
    occupation: '',
    monthlyIncome: 0,
    citizenship: 'Filipino',
    religion: 'Roman Catholic',
    bloodType: 'O+',
    educationalAttainment: 'High School Graduate',
    voterStatus: 'Registered',
    precinctNo: '',
    isHouseholdHead: false,
    isSeniorCitizen: false,
    isPWD: false,
    pwdType: '',
    is4PsBeneficiary: false,
    isSoloParent: false,
    isIndigent: false,
    isYouth: false,
    isOutofSchoolYouth: false,
    emergencyContactName: '',
    emergencyContactNumber: '',
    residentStatus: 'Active',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Pagination state for ultra-fast, smooth rendering
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Use deferred value for search input to keep typing completely non-blocking and silky smooth
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Automatically reset to page 1 whenever any search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, globalSearch, selectedPurok, selectedSector, selectedStatus]);

  // Memoized filter logic - completely case-insensitive across all letters and prefix-tolerant
  const filteredResidents = useMemo(() => {
    const term = (deferredSearchQuery || globalSearch || '').toLowerCase().trim();
    const sec = selectedSector.toLowerCase();
    const statusLower = selectedStatus.toLowerCase();
    const seenResidentIds = new Set<string>();

    return residents.filter((r) => {
      if (!r.id || seenResidentIds.has(r.id)) return false;
      seenResidentIds.add(r.id);

      // Fast check 1: Status
      if (statusLower !== 'all' && String(r.residentStatus || '').toLowerCase() !== statusLower) {
        return false;
      }

      // Fast check 2: Purok
      if (!arePuroksMatching(r.purok, selectedPurok)) {
        return false;
      }

      // Fast check 3: Sector
      if (sec !== 'all') {
        if (sec === 'senior' && !Boolean(r.isSeniorCitizen) && Number(r.age) < 60) return false;
        if (sec === 'pwd' && !Boolean(r.isPWD)) return false;
        if (sec === '4ps' && !Boolean(r.is4PsBeneficiary)) return false;
        if (sec === 'soloparent' && !Boolean(r.isSoloParent)) return false;
        if (sec === 'indigent' && !Boolean(r.isIndigent)) return false;
        if (sec === 'youth' && !Boolean(r.isYouth) && (Number(r.age) < 15 || Number(r.age) > 30)) return false;
        if (sec === 'voter' && String(r.voterStatus || '').toLowerCase() !== 'registered') return false;
      }

      // Search term matching across all key identification fields
      if (term) {
        const fullName = `${r.firstName} ${r.middleName || ''} ${r.lastName} ${r.suffix || ''}`.toLowerCase();
        const matchesSearch =
          fullName.includes(term) ||
          (r.id || '').toLowerCase().includes(term) ||
          (r.contactNumber || '').toLowerCase().includes(term) ||
          (r.purok || '').toLowerCase().includes(term) ||
          (r.streetAddress || '').toLowerCase().includes(term) ||
          (r.occupation || '').toLowerCase().includes(term) ||
          (r.householdId || '').toLowerCase().includes(term) ||
          arePuroksMatching(r.purok, term);

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [residents, deferredSearchQuery, globalSearch, selectedPurok, selectedSector, selectedStatus, arePuroksMatching]);

  // Paginated window - only renders a small, controlled slice into the DOM
  const paginatedResidents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredResidents.slice(startIndex, startIndex + pageSize);
  }, [filteredResidents, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingResident(null);
    setFormData(initialFormState);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (res: Resident) => {
    setEditingResident(res);
    setFormData({
      firstName: res.firstName,
      middleName: res.middleName || '',
      lastName: res.lastName,
      suffix: res.suffix || '',
      birthDate: res.birthDate,
      age: res.age,
      sex: res.sex,
      civilStatus: res.civilStatus,
      purok: res.purok,
      streetAddress: res.streetAddress,
      householdId: res.householdId || '',
      nationalIdNo: res.nationalIdNo || '',
      photoUrl: res.photoUrl || '',
      contactNumber: res.contactNumber,
      email: res.email || '',
      occupation: res.occupation,
      monthlyIncome: res.monthlyIncome,
      citizenship: res.citizenship,
      religion: res.religion,
      bloodType: res.bloodType,
      educationalAttainment: res.educationalAttainment,
      voterStatus: res.voterStatus,
      precinctNo: res.precinctNo || '',
      isHouseholdHead: res.isHouseholdHead,
      isSeniorCitizen: res.isSeniorCitizen,
      isPWD: res.isPWD,
      pwdType: res.pwdType || '',
      is4PsBeneficiary: res.is4PsBeneficiary,
      isSoloParent: res.isSoloParent,
      isIndigent: res.isIndigent,
      isYouth: res.isYouth,
      isOutofSchoolYouth: res.isOutofSchoolYouth,
      emergencyContactName: res.emergencyContactName,
      emergencyContactNumber: res.emergencyContactNumber,
      residentStatus: res.residentStatus,
      remarks: res.remarks || '',
    });
    setIsAddEditModalOpen(true);
  };

  const handleBirthDateChange = (bdate: string) => {
    const birth = new Date(bdate);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      calculatedAge--;
    }
    const isSenior = calculatedAge >= 60;
    const isYouth = calculatedAge >= 15 && calculatedAge <= 30;

    setFormData((prev) => ({
      ...prev,
      birthDate: bdate,
      age: calculatedAge >= 0 ? calculatedAge : 0,
      isSeniorCitizen: isSenior,
      isYouth: isYouth,
    }));
  };

  const handleFormPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      const compressed = await compressImageFile(file, 400, 0.85);
      setFormData((prev) => ({ ...prev, photoUrl: compressed }));
    } catch (err: any) {
      console.error('Failed to compress resident photo:', err);
    } finally {
      setIsUploadingPhoto(false);
      if (formPhotoInputRef.current) formPhotoInputRef.current.value = '';
    }
  };

  const linkedUserForEditing = useMemo(() => {
    if (!editingResident) return null;
    return users.find(
      (u) =>
        u.residentId === editingResident.id ||
        (u.email && editingResident.email && u.email.toLowerCase() === editingResident.email.toLowerCase())
    );
  }, [editingResident, users]);

  const handleSaveResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      alert('First Name and Last Name are required.');
      return;
    }

    const payload = {
      ...formData,
      photoUrl: formData.photoUrl || undefined,
      avatar: formData.photoUrl || undefined,
    };

    if (editingResident) {
      updateResident(editingResident.id, payload);
    } else {
      addResident(payload);
    }
    setIsAddEditModalOpen(false);
  };

  const handleIssueCertFromResident = (res: Resident) => {
    setActiveResidentForDetail(null);
    setActiveModule('certificates');
  };

  useEffect(() => {
    if (targetRecordId) {
      if (targetRecordId === 'new' || targetRecordId === 'new_resident') {
        handleOpenAdd();
      } else {
        const res = residents.find((r) => r.id === targetRecordId);
        if (res) {
          setActiveResidentForDetail(res);
        }
      }
      setTargetRecordId(null);
    }
  }, [targetRecordId, residents]);

  useEffect(() => {
    if (globalSearch) {
      setSearchQuery(globalSearch);
    }
  }, [globalSearch]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Resident Management</span>
            <InfoButton
              title="Civil Registry & Demographics"
              info={`Master demographic registry of all ${residents.length} recorded citizens in ${settings.barangayName}.`}
              variant="light"
            />
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setResidentForPrint(null);
              setIsPrintModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Print Official Resident Masterlist / RBI Registry"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Print Masterlist</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Import multiple resident records from Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Excel / CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Resident</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box with Local Storage-Backed Recent Searches */}
          <RecentSearchesInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, ID or phone..."
            storageKey="residents"
            theme="light"
          />

          {/* Purok Filter */}
          <div>
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

          {/* Sectoral Filter */}
          <div>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="All">All Sectors & Demographics</option>
              <option value="Senior">Senior Citizens (60+)</option>
              <option value="PWD">Persons w/ Disability (PWD)</option>
              <option value="4Ps">4Ps Program Beneficiaries</option>
              <option value="SoloParent">Solo Parents</option>
              <option value="Indigent">Indigent Families</option>
              <option value="Youth">Youth / SK (15-30)</option>
              <option value="Voter">Registered Voters</option>
            </select>
          </div>

          {/* Resident Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="Active">Active Residents</option>
              <option value="Deceased">Deceased</option>
              <option value="Transferred">Transferred / Migrated</option>
              <option value="Archived">Archived Records</option>
              <option value="All">All Statuses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Residents Table / Grid Container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Residents Directory</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
              {filteredResidents.length} found
            </span>
          </div>

          <ViewModeToggle
            viewMode={viewMode}
            onChange={setViewMode}
            accentColor="indigo"
            tableTitle="Table View (Full Masterlist)"
            gridTitle="Grid View (Resident Cards)"
          />
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Resident ID & Name</th>
                  <th className="px-4 py-3">Age / Sex</th>
                  <th className="px-4 py-3">Purok & Address</th>
                  <th className="px-4 py-3">Sectoral Tags</th>
                  <th className="px-4 py-3">Occupation / Contact</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                      No resident records matched your search filters.
                    </td>
                  </tr>
                ) : (
                  paginatedResidents.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhotoModalResident(r);
                            }}
                            className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs group/avatar cursor-pointer transition-transform hover:scale-110"
                            title="Click to view or change profile photo"
                          >
                            {r.photoUrl || r.avatar ? (
                              <img
                                src={r.photoUrl || r.avatar}
                                alt={`${r.firstName} ${r.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                                {r.firstName[0]}{r.lastName[0]}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Camera className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {r.lastName}, {r.firstName} {r.middleName ? `${r.middleName[0]}.` : ''} {r.suffix || ''}
                            </p>
                            <span className="font-mono text-[10px] text-indigo-600 font-semibold">{r.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{r.age} yrs old</p>
                        <p className="text-[10px] text-slate-500">{r.sex} • {r.civilStatus}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-indigo-700">{r.purok}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{r.streetAddress}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {r.isSeniorCitizen && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold">
                              Senior
                            </span>
                          )}
                          {r.isPWD && (
                            <span className="px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[9px] font-bold">
                              PWD
                            </span>
                          )}
                          {r.is4PsBeneficiary && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                              4Ps
                            </span>
                          )}
                          {r.isSoloParent && (
                            <span className="px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-800 border border-pink-200 text-[9px] font-bold">
                              Solo Parent
                            </span>
                          )}
                          {r.voterStatus === 'Registered' && (
                            <span className="px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[9px] font-bold">
                              Voter
                            </span>
                          )}
                          {r.isHouseholdHead && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[9px] font-bold">
                              Head
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800 font-medium">{r.occupation || 'N/A'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{r.contactNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setResidentForPrint(r);
                              setIsPrintModalOpen(true);
                            }}
                            title="Print Resident Profile (RBI Form 1A)"
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveResidentForDetail(r)}
                            title="View Profile / Print ID"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            title="Edit Information"
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => archiveResident(r.id)}
                            title={r.residentStatus === 'Archived' ? 'Restore Resident' : 'Archive Resident'}
                            className="p-1.5 text-amber-600 hover:text-amber-800 bg-slate-50 hover:bg-amber-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          {currentUser.role === 'Administrator' && (
                            <button
                              onClick={() => setDeleteTargetResident(r)}
                              title="Delete Permanently"
                              className="p-1.5 text-rose-600 hover:text-rose-800 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-slate-50/60">
            {filteredResidents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No resident records matched your search filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedResidents.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-3">
                      {/* Header with Avatar & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhotoModalResident(r);
                            }}
                            className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs group/avatar cursor-pointer transition-transform hover:scale-105"
                            title="Click to view or change profile photo"
                          >
                            {r.photoUrl || r.avatar ? (
                              <img
                                src={r.photoUrl || r.avatar}
                                alt={`${r.firstName} ${r.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold flex items-center justify-center text-sm">
                                {r.firstName[0]}{r.lastName[0]}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Camera className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors">
                              {r.lastName}, {r.firstName}
                            </h4>
                            <p className="font-mono text-[10px] text-indigo-600 font-semibold">{r.id}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            r.residentStatus === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.residentStatus === 'Archived'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {r.residentStatus}
                        </span>
                      </div>

                      {/* Demographics & Location */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-600 text-[11px]">
                          <span>{r.age} yrs • {r.sex}</span>
                          <span className="font-medium text-slate-700">{r.civilStatus}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-indigo-700 font-medium text-xs pt-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                          <span className="truncate">{r.purok}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="font-mono">{r.contactNumber || 'No phone'}</span>
                        </div>
                      </div>

                      {/* Sector Badges */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {r.isSeniorCitizen && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold">
                            Senior
                          </span>
                        )}
                        {r.isPWD && (
                          <span className="px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[9px] font-bold">
                            PWD
                          </span>
                        )}
                        {r.is4PsBeneficiary && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                            4Ps
                          </span>
                        )}
                        {r.isSoloParent && (
                          <span className="px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-800 border border-pink-200 text-[9px] font-bold">
                            Solo Parent
                          </span>
                        )}
                        {r.voterStatus === 'Registered' && (
                          <span className="px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[9px] font-bold">
                            Voter
                          </span>
                        )}
                        {r.isHouseholdHead && (
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[9px] font-bold">
                            Head
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setResidentForPrint(r);
                            setIsPrintModalOpen(true);
                          }}
                          title="Print Resident Profile"
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveResidentForDetail(r)}
                          title="View Profile / Print ID"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(r)}
                          title="Edit Information"
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => archiveResident(r.id)}
                          title={r.residentStatus === 'Archived' ? 'Restore Resident' : 'Archive Resident'}
                          className="p-1.5 text-amber-600 hover:text-amber-800 bg-slate-50 hover:bg-amber-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {currentUser.role === 'Administrator' && (
                        <button
                          onClick={() => setDeleteTargetResident(r)}
                          title="Delete Permanently"
                          className="p-1.5 text-rose-600 hover:text-rose-800 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* High-Performance Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredResidents.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[25, 50, 100, 200]}
          itemName="residents"
          theme="auto"
        />
      </div>

      {/* Resident Bio-Data & ID Card Modal */}
      {activeResidentForDetail && (
        <ResidentDetailModal
          resident={activeResidentForDetail}
          onClose={() => setActiveResidentForDetail(null)}
          onEdit={(res) => {
            setActiveResidentForDetail(null);
            handleOpenEdit(res);
          }}
          onIssueCert={handleIssueCertFromResident}
        />
      )}

      {/* Add / Edit Resident Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>{editingResident ? 'Update Resident Record' : 'Register New Resident'}</span>
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResident} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Excel Import Fast-Track Banner */}
              {!editingResident && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        Have multiple residents to encode?
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Import an Excel (.xlsx) or CSV file to register all citizens in one batch automatically.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddEditModalOpen(false);
                      setIsImportModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow-xs cursor-pointer transition-colors"
                  >
                    Open Excel Importer
                  </button>
                </div>
              )}

              {/* Profile Photo Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Resident Profile Picture</span>
                  </label>
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photoUrl: '' })}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 dark:text-rose-400 cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview */}
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-center">
                    {formData.photoUrl ? (
                      <img
                        src={formData.photoUrl}
                        alt="Resident Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                        {formData.firstName ? formData.firstName.charAt(0) : <Users className="w-6 h-6" />}
                      </div>
                    )}
                  </div>

                  {/* Actions / Upload Controls */}
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={formPhotoInputRef}
                        onChange={handleFormPhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => formPhotoInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingPhoto ? 'Compressing...' : 'Upload Photo'}</span>
                      </button>

                      {editingResident && (
                        <button
                          type="button"
                          onClick={() => setPhotoModalResident(editingResident)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Take Photo / Camera</span>
                        </button>
                      )}
                    </div>
                    {linkedUserForEditing ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Wired to Manage User Account: @{linkedUserForEditing.username} ({linkedUserForEditing.name})</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {editingResident
                          ? 'This resident has no user account. Only explicitly uploaded profile pictures are saved.'
                          : 'Photos are stored directly into the Supabase database residents table.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Name Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">1. Full Name & Identification</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="e.g. Juan"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      placeholder="e.g. Delos Santos"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="e.g. Dela Cruz"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Suffix (Jr/Sr/III)</label>
                    <input
                      type="text"
                      value={formData.suffix}
                      onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                      placeholder="e.g. Jr."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">PhilSys Card / National ID No.</label>
                    <input
                      type="text"
                      value={formData.nationalIdNo || ''}
                      onChange={(e) => setFormData({ ...formData, nationalIdNo: e.target.value })}
                      placeholder="e.g. 1234-5678-9012-3456"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Household ID / Family Code</label>
                    <input
                      type="text"
                      value={formData.householdId || ''}
                      onChange={(e) => setFormData({ ...formData, householdId: e.target.value })}
                      placeholder="e.g. HH-2026-0089"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">2. Demographic & Civil Profile</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleBirthDateChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      readOnly
                      value={formData.age}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-indigo-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sex</label>
                    <select
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value as Sex })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Civil Status</label>
                    <select
                      value={formData.civilStatus}
                      onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value as CivilStatus })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Common Law">Common Law / Live-in</option>
                    </select>
                  </div>

                  {/* Religion */}
                  <div className="col-span-2 sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Religion <span className="text-indigo-600 font-normal">*</span>
                    </label>
                    <div className="space-y-1.5">
                      <select
                        value={
                          PHILIPPINE_RELIGIONS.includes(formData.religion as any)
                            ? formData.religion
                            : 'Other / Unspecified'
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== 'Other / Unspecified') {
                            setFormData({ ...formData, religion: val });
                          } else {
                            setFormData({ ...formData, religion: 'Other' });
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                      >
                        {PHILIPPINE_RELIGIONS.map((rel) => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                      {(!PHILIPPINE_RELIGIONS.includes(formData.religion as any) || formData.religion === 'Other / Unspecified' || formData.religion === 'Other') && (
                        <input
                          type="text"
                          placeholder="Specify religion or denomination..."
                          value={formData.religion === 'Other' || formData.religion === 'Other / Unspecified' ? '' : formData.religion}
                          onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  </div>

                  {/* Citizenship */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Citizenship</label>
                    <select
                      value={formData.citizenship}
                      onChange={(e) => setFormData({ ...formData, citizenship: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                    >
                      {CITIZENSHIP_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Blood Type */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Blood Type</label>
                    <select
                      value={formData.bloodType || 'Unknown'}
                      onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer font-bold text-rose-600"
                    >
                      {BLOOD_TYPES.map((bt) => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Educational Attainment */}
                  <div className="col-span-2 sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Educational Attainment</label>
                    <select
                      value={formData.educationalAttainment}
                      onChange={(e) => setFormData({ ...formData, educationalAttainment: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                    >
                      {EDUCATIONAL_ATTAINMENTS.map((edu) => (
                        <option key={edu} value={edu}>{edu}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Address, Livelihood & Contact */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">3. Residence, Livelihood & Contact</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Purok / Zone *</label>
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
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Street Address / House No. *</label>
                    <input
                      type="text"
                      required
                      value={formData.streetAddress}
                      onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                      placeholder="e.g. 124 Mabini St."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Phone *</label>
                    <input
                      type="text"
                      required
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      placeholder="0917-xxx-xxxx"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="resident@example.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Occupation / Profession</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      placeholder="e.g. Farmer, Teacher, Carpenter"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Monthly Income (₱)</label>
                    <input
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sectoral Tags Checkboxes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">4. Sectoral & Program Tags</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isSeniorCitizen}
                      onChange={(e) => setFormData({ ...formData, isSeniorCitizen: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Senior Citizen (60+)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPWD}
                      onChange={(e) => setFormData({ ...formData, isPWD: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>PWD</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is4PsBeneficiary}
                      onChange={(e) => setFormData({ ...formData, is4PsBeneficiary: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>4Ps Beneficiary</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isSoloParent}
                      onChange={(e) => setFormData({ ...formData, isSoloParent: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Solo Parent</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isIndigent}
                      onChange={(e) => setFormData({ ...formData, isIndigent: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Indigent</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isHouseholdHead}
                      onChange={(e) => setFormData({ ...formData, isHouseholdHead: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Household Head</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.voterStatus === 'Registered'}
                      onChange={(e) => setFormData({ ...formData, voterStatus: e.target.checked ? 'Registered' : 'Unregistered' })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Registered Voter</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isYouth}
                      onChange={(e) => setFormData({ ...formData, isYouth: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Youth Sector (15-30)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isOutofSchoolYouth}
                      onChange={(e) => setFormData({ ...formData, isOutofSchoolYouth: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Out of School Youth (OSY)</span>
                  </label>

                  {/* Conditional PWD classification */}
                  {formData.isPWD && (
                    <div className="col-span-2 sm:col-span-4 bg-indigo-50/70 p-3 rounded-xl border border-indigo-200">
                      <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                        Disability Classification (PWD Type)
                      </label>
                      <select
                        value={formData.pwdType || PWD_TYPES[0]}
                        onChange={(e) => setFormData({ ...formData, pwdType: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {PWD_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Conditional Precinct No */}
                  {formData.voterStatus === 'Registered' && (
                    <div className="col-span-2 sm:col-span-4 bg-indigo-50/70 p-3 rounded-xl border border-indigo-200">
                      <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                        Registered Voter Precinct Number / Cluster
                      </label>
                      <input
                        type="text"
                        value={formData.precinctNo || ''}
                        onChange={(e) => setFormData({ ...formData, precinctNo: e.target.value })}
                        placeholder="e.g. 0012A / 0012B"
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">5. Emergency Contact</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Emergency Contact Person</label>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      placeholder="e.g. Maria Dela Cruz"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Emergency Contact Phone</label>
                    <input
                      type="text"
                      value={formData.emergencyContactNumber}
                      onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
                      placeholder="0917-xxx-xxxx"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Civil Registry Status & Remarks */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">6. Civil Registry Status & Remarks</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Resident Record Status</label>
                    <select
                      value={formData.residentStatus}
                      onChange={(e) => setFormData({ ...formData, residentStatus: e.target.value as ResidentStatus })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer font-semibold"
                    >
                      {RESIDENT_STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Registry Remarks / Administrative Notes</label>
                    <input
                      type="text"
                      value={formData.remarks || ''}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="e.g. Transferred from neighboring barangay; Verified PhilSys"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  {editingResident ? 'Update Resident Record' : 'Save & Register Resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetResident}
        title="Delete Resident Record"
        itemType="Resident Record"
        itemName={deleteTargetResident ? `${deleteTargetResident.firstName} ${deleteTargetResident.lastName} (${deleteTargetResident.id})` : undefined}
        description="Permanently delete this resident from the registry. All linked certificates, blotter tags, and records will reflect this change."
        confirmText="Yes, Delete Resident"
        onConfirm={() => {
          if (deleteTargetResident) {
            deleteResident(deleteTargetResident.id);
          }
        }}
        onClose={() => setDeleteTargetResident(null)}
      />

      {/* Excel / CSV Bulk Data Importer Modal */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialEntity="residents"
      />

      {/* Official Resident Document Print Modal */}
      <ResidentPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setResidentForPrint(null);
        }}
        initialResident={residentForPrint}
        filteredResidents={filteredResidents}
        filterPurok={selectedPurok}
        filterSector={selectedSector}
      />

      {/* Quick Resident Photo Modal */}
      {photoModalResident && (
        <UserProfilePhotoModal
          isOpen={Boolean(photoModalResident)}
          onClose={() => setPhotoModalResident(null)}
          title={`Profile Photo: ${photoModalResident.firstName} ${photoModalResident.lastName}`}
          subtitle={`Resident ID ${photoModalResident.id} • Saved directly to Supabase DB and wired to user account`}
          onSaveAvatar={(newAvatarUrl) => {
            updateResident(photoModalResident.id, {
              photoUrl: newAvatarUrl || undefined,
              avatar: newAvatarUrl || undefined,
            });
            setPhotoModalResident(null);
          }}
        />
      )}
    </div>
  );
};
