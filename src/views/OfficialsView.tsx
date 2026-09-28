import React, { useState, useMemo, useRef } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { BarangayOfficial } from '../types';
import { OfficialsPrintModal } from '../components/OfficialsPrintModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { DataImportModal } from '../components/DataImportModal';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { BarangaySangkolSeal } from '../components/OfficialSeals';
import { InfoButton } from '../components/InfoButton';
import {
  Award,
  Plus,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  UserCheck,
  FileSpreadsheet,
  Printer,
  Search,
  MapPin,
  Database,
  Upload,
  Image as ImageIcon,
  FileSignature,
  Users,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';

interface OfficialFormData {
  residentId: string;
  name: string;
  position: string;
  committee: string;
  termStart: string;
  termEnd: string;
  contactNumber: string;
  email: string;
  purok: string;
  status: 'Active' | 'On Leave' | 'Term Ended';
  photoUrl: string;
  signatureUrl: string;
  order: number;
}

const STANDARD_POSITIONS = [
  'Punong Barangay (Barangay Captain)',
  'Barangay Kagawad',
  'SK Chairperson',
  'Barangay Secretary',
  'Barangay Treasurer',
  'Barangay Administrator',
];

const STANDARD_COMMITTEES = [
  'Committee on Peace & Order and Public Safety',
  'Committee on Appropriations, Budget & Finance',
  'Committee on Health, Sanitation & Nutrition',
  'Committee on Education & Culture',
  'Committee on Public Works, Infrastructure & Housing',
  'Committee on Agriculture, Livelihood & Environment',
  'Committee on Women, Family, Youth & Sports',
  'Committee on Rules, Laws, Privileges & Ethics',
  'Barangay Administration / Executive Office',
  'Frontline Public Assistance & Social Services',
];

export const OfficialsView: React.FC = () => {
  const { officials, residents, addOfficial, updateOfficial, deleteOfficial, settings, currentUser } =
    useBarangay();

  // Permission check: Any non-resident user (Admin, Captain, Secretary, Staff, Official) can edit & delete
  const canManage = !currentUser || currentUser.role !== 'Resident';

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [officialForPrint, setOfficialForPrint] = useState<BarangayOfficial | null>(null);
  const [editingOfficial, setEditingOfficial] = useState<BarangayOfficial | null>(null);
  const [deleteTargetOfficial, setDeleteTargetOfficial] = useState<BarangayOfficial | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // View & Filter state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'council' | 'appointive' | 'peace' | 'health'
  >('all');
  const [selectedPurok, setSelectedPurok] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // File upload refs
  const photoFileInputRef = useRef<HTMLInputElement | null>(null);
  const signatureFileInputRef = useRef<HTMLInputElement | null>(null);

  const availablePuroks = useMemo(() => {
    const list = settings?.puroks?.length
      ? settings.puroks
      : ['Purok Pinya', 'Purok Lumboy', 'Purok Mangga', 'Purok Tambis', 'Purok Kaimito', 'Purok Bayabas'];
    return list;
  }, [settings?.puroks]);

  const initialForm: OfficialFormData = {
    residentId: '',
    name: '',
    position: 'Barangay Kagawad',
    committee: 'Committee on Peace & Order and Public Safety',
    contactNumber: '0917-000-0000',
    email: '',
    purok: availablePuroks[0] || 'Purok Pinya',
    termStart: '2023-11-01',
    termEnd: '2026-11-30',
    status: 'Active',
    photoUrl: '',
    signatureUrl: '',
    order: officials.length + 1,
  };

  const [formData, setFormData] = useState<OfficialFormData>(initialForm);

  // Search & custom state for Add/Edit Official modal
  const [residentSearch, setResidentSearch] = useState('');
  const [isResidentPickerOpen, setIsResidentPickerOpen] = useState(false);
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [customPositionText, setCustomPositionText] = useState('');

  // Selected resident details
  const selectedResident = useMemo(() => {
    if (!formData.residentId) return null;
    return residents.find((r) => r.id === formData.residentId) || null;
  }, [residents, formData.residentId]);

  // Filtered residents for instant search
  const searchedResidents = useMemo(() => {
    if (!residentSearch.trim()) {
      return residents.slice(0, 30);
    }
    const q = residentSearch.toLowerCase().trim();
    return residents
      .filter((r) => {
        const fullName = `${r.firstName} ${r.middleName || ''} ${r.lastName}`.toLowerCase();
        const reverseName = `${r.lastName}, ${r.firstName} ${r.middleName || ''}`.toLowerCase();
        const id = (r.id || '').toLowerCase();
        const purok = (r.purok || '').toLowerCase();
        const contact = (r.contactNumber || '').toLowerCase();
        return (
          fullName.includes(q) ||
          reverseName.includes(q) ||
          id.includes(q) ||
          purok.includes(q) ||
          contact.includes(q)
        );
      })
      .slice(0, 40);
  }, [residents, residentSearch]);

  const handleOpenAdd = () => {
    setEditingOfficial(null);
    setFormError(null);
    setResidentSearch('');
    setIsResidentPickerOpen(false);
    setIsCustomPosition(false);
    setCustomPositionText('');
    setFormData({
      ...initialForm,
      order: officials.length + 1,
      purok: availablePuroks[0] || 'Purok Pinya',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (off: BarangayOfficial) => {
    setEditingOfficial(off);
    setFormError(null);
    setResidentSearch('');
    setIsResidentPickerOpen(false);

    const isStandardPos = STANDARD_POSITIONS.includes(off.position);
    setIsCustomPosition(!isStandardPos);
    setCustomPositionText(!isStandardPos ? off.position : '');

    setFormData({
      residentId: off.residentId || '',
      name: off.name,
      position: off.position,
      committee: off.committee || '',
      contactNumber: off.contactNumber || '',
      email: off.email || '',
      purok: off.purok || availablePuroks[0] || 'Purok Pinya',
      termStart: off.termStart || '2023-11-01',
      termEnd: off.termEnd || '2026-11-30',
      status: off.status || 'Active',
      photoUrl: off.photoUrl || off.avatar || '',
      signatureUrl: off.signatureUrl || '',
      order: off.order || 99,
    });
    setIsModalOpen(true);
  };

  // Auto-fill from selected resident item in the searchable list
  const handleSelectResidentItem = (res: (typeof residents)[0]) => {
    const fullName = `${res.firstName} ${res.middleName ? res.middleName + ' ' : ''}${res.lastName}`.trim();
    setFormData((prev) => ({
      ...prev,
      residentId: res.id,
      name: fullName,
      purok: res.purok || prev.purok,
      contactNumber: res.contactNumber || prev.contactNumber,
      email: res.email || prev.email,
      photoUrl: res.photoUrl || res.avatar || (res as any).photo || prev.photoUrl,
    }));
    setResidentSearch('');
    setIsResidentPickerOpen(false);
  };

  const handleClearResident = () => {
    setFormData((prev) => ({ ...prev, residentId: '' }));
    setResidentSearch('');
    setIsResidentPickerOpen(false);
  };

  // Position selector handler (smooth switching between Punong Barangay, Kagawad, etc.)
  const handleSelectPosition = (pos: string) => {
    if (pos === 'Custom') {
      setIsCustomPosition(true);
      setFormData((prev) => ({ ...prev, position: customPositionText || '' }));
      return;
    }

    setIsCustomPosition(false);
    setCustomPositionText('');
    setFormData((prev) => {
      let newOrder = prev.order;
      let newCommittee = prev.committee;

      if (pos.toLowerCase().includes('punong barangay') || pos.toLowerCase().includes('captain')) {
        newOrder = 1;
        if (!newCommittee || newCommittee === 'Committee on Peace & Order and Public Safety') {
          newCommittee = 'Barangay Administration / Executive Office';
        }
      } else if (pos.toLowerCase().includes('kagawad')) {
        if (newOrder === 1) {
          newOrder = 2;
        }
        if (!newCommittee || newCommittee === 'Barangay Administration / Executive Office') {
          newCommittee = 'Committee on Peace & Order and Public Safety';
        }
      } else if (pos.toLowerCase().includes('sk chair')) {
        if (newOrder < 9) newOrder = 9;
        if (!newCommittee) newCommittee = 'Committee on Women, Family, Youth & Sports';
      } else if (pos.toLowerCase().includes('secretary')) {
        if (newOrder < 10) newOrder = 10;
        if (!newCommittee) newCommittee = 'Barangay Administration / Executive Office';
      } else if (pos.toLowerCase().includes('treasurer')) {
        if (newOrder < 11) newOrder = 11;
        if (!newCommittee) newCommittee = 'Committee on Appropriations, Budget & Finance';
      } else if (pos.toLowerCase().includes('tanod') || pos.toLowerCase().includes('bpso')) {
        if (!newCommittee) newCommittee = 'Committee on Peace & Order and Public Safety';
      } else if (pos.toLowerCase().includes('health') || pos.toLowerCase().includes('bhw') || pos.toLowerCase().includes('bns')) {
        if (!newCommittee) newCommittee = 'Committee on Health, Sanitation & Nutrition';
      }

      return {
        ...prev,
        position: pos,
        order: newOrder,
        committee: newCommittee,
      };
    });
  };

  // Photo file upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFormError('Photo image size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Signature file upload handler
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFormError('Signature image size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, signatureUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Official name is required.');
      return;
    }

    if (!formData.position.trim()) {
      setFormError('Official position is required.');
      return;
    }

    if (!formData.purok.trim()) {
      setFormError('Purok assignment is required.');
      return;
    }

    const isCaptainPos =
      formData.position.toLowerCase().includes('punong barangay') ||
      formData.position.toLowerCase().includes('captain');

    if (isCaptainPos) {
      const existingPb = officials.find(
        (o) =>
          (o.order === 1 ||
            o.position.toLowerCase().includes('punong barangay') ||
            o.position.toLowerCase().includes('captain')) &&
          (!editingOfficial || o.id !== editingOfficial.id)
      );
      if (existingPb) {
        setFormError(
          `The system refused duplicate credentials: Punong Barangay is already registered as "${existingPb.name}". Only one Punong Barangay can exist in the barangay council.`
        );
        return;
      }
    }

    try {
      const payload: Omit<BarangayOfficial, 'id'> = {
        name: formData.name.trim(),
        position: formData.position.trim(),
        committee: formData.committee.trim() || undefined,
        contactNumber: formData.contactNumber.trim() || 'N/A',
        email: formData.email.trim() || undefined,
        purok: formData.purok.trim(),
        termStart: formData.termStart || '2023-11-01',
        termEnd: formData.termEnd || '2026-11-30',
        status: formData.status,
        order: Number(formData.order) || 99,
        residentId: formData.residentId.trim() || undefined,
        photoUrl: formData.photoUrl.trim() || undefined,
        avatar: formData.photoUrl.trim() || undefined,
        signatureUrl: formData.signatureUrl.trim() || undefined,
      };

      if (editingOfficial) {
        updateOfficial(editingOfficial.id, payload);
      } else {
        addOfficial(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save official record.');
    }
  };

  // Filter and sort officials
  const sortedOfficials = useMemo(() => {
    return [...officials].sort((a, b) => a.order - b.order);
  }, [officials]);

  const filteredOfficials = useMemo(() => {
    return sortedOfficials.filter((o) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          o.name.toLowerCase().includes(q) ||
          o.position.toLowerCase().includes(q) ||
          (o.committee && o.committee.toLowerCase().includes(q)) ||
          o.purok.toLowerCase().includes(q) ||
          o.contactNumber.toLowerCase().includes(q) ||
          (o.email && o.email.toLowerCase().includes(q)) ||
          o.id.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Category filter
      if (selectedCategory === 'council') {
        const isElective =
          /punong|captain|kagawad|sangguniang|sk chair/i.test(o.position) || o.order <= 8;
        if (!isElective) return false;
      } else if (selectedCategory === 'appointive') {
        const isAppointive =
          /secretary|treasurer|administrator|admin|clerk/i.test(o.position) &&
          !/kagawad|captain/i.test(o.position);
        if (!isAppointive) return false;
      } else if (selectedCategory === 'peace') {
        const isPeace = /tanod|bpso|security|peace|chief/i.test(o.position);
        if (!isPeace) return false;
      } else if (selectedCategory === 'health') {
        const isHealth = /health|bhw|nutrition|bns|day care|worker/i.test(o.position);
        if (!isHealth) return false;
      }

      // Purok filter
      if (selectedPurok !== 'all' && o.purok !== selectedPurok) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && o.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [sortedOfficials, searchQuery, selectedCategory, selectedPurok, selectedStatus]);

  // Specific groups for layout
  const punongBarangay = sortedOfficials.find(
    (o) => o.position.includes('Punong Barangay') || o.position.includes('Captain') || o.order === 1
  );
  const kagawads = sortedOfficials.filter(
    (o) =>
      (o.position.includes('Kagawad') ||
        o.position.includes('Sangguniang Barangay Member') ||
        o.position.includes('SK Chairperson')) &&
      !/secretary|treasurer/i.test(o.position) &&
      o.id !== punongBarangay?.id
  );
  const appointedStaff = sortedOfficials.filter(
    (o) => o.id !== punongBarangay?.id && !kagawads.some((k) => k.id === o.id)
  );

  return (
    <div className="space-y-6 pb-12 text-slate-900 dark:text-slate-100">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>Barangay Officials & Staff Directory</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {officials.length} Personnel
                </span>
                <InfoButton
                  title="Officials & Staff Directory"
                  info={`Manage elective leaders, appointed officers, tanod peacekeeping forces, and support staff of ${settings.barangayName}.`}
                  variant="light"
                />
              </h2>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <ViewModeToggle
            viewMode={viewMode}
            onChange={(m) => setViewMode(m)}
            tableTitle="Table Roster View"
            gridTitle="Card / Profile View"
          />

          {/* Print Directory Button */}
          <button
            onClick={() => {
              setOfficialForPrint(null);
              setIsPrintModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            title="Print Official Directory & Roster of Barangay Officials"
          >
            <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Print Directory</span>
          </button>

          {/* Import CSV / Excel Button */}
          {canManage && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              title="Import officials roster from Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Import Excel / CSV</span>
            </button>
          )}

          {/* Add Official / Staff Button */}
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Official / Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Supabase Attributes Banner / Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Personnel</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{officials.length}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Council (Elective)</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {(punongBarangay ? 1 : 0) + kagawads.length}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Appointed & Staff</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{appointedStaff.length}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Duty</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {officials.filter((o) => o.status === 'Active').length}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, position, committee, purok, or contact number..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Purok Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPurok}
              onChange={(e) => setSelectedPurok(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Puroks</option>
              {availablePuroks.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Term Ended">Term Ended</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Category:</span>
          {[
            { id: 'all', label: `All Personnel (${officials.length})` },
            {
              id: 'council',
              label: `Elective Council (${(punongBarangay ? 1 : 0) + kagawads.length})`,
            },
            {
              id: 'appointive',
              label: `Appointed Officers (${
                officials.filter(
                  (o) =>
                    /secretary|treasurer|administrator|admin|clerk/i.test(o.position) &&
                    !/kagawad|captain/i.test(o.position)
                ).length
              })`,
            },
            {
              id: 'peace',
              label: `Tanod & Security (${
                officials.filter((o) => /tanod|bpso|security|peace|chief/i.test(o.position)).length
              })`,
            },
            {
              id: 'health',
              label: `Health & Social (${
                officials.filter((o) => /health|bhw|nutrition|bns|day care|worker/i.test(o.position))
                  .length
              })`,
            },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW MODE: TABLE ROSTER VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Order / ID</th>
                  <th className="px-4 py-3">Official / Staff Name</th>
                  <th className="px-4 py-3">Position / Designation</th>
                  <th className="px-4 py-3">Committee Assignment</th>
                  <th className="px-4 py-3">Purok</th>
                  <th className="px-4 py-3">Term Duration</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOfficials.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      No officials or staff found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOfficials.map((off) => {
                    const isPb =
                      off.position.toLowerCase().includes('punong barangay') ||
                      off.position.toLowerCase().includes('captain') ||
                      off.order === 1;

                    return (
                      <tr
                        key={off.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          isPb ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px]">
                            #{off.order} • {off.id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-600 font-bold">
                              {off.photoUrl || off.avatar ? (
                                <img
                                  src={off.photoUrl || off.avatar}
                                  alt={off.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : isPb ? (
                                <BarangaySangkolSeal size={32} />
                              ) : (
                                <span>{off.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>
                                  {isPb || off.position.includes('Kagawad')
                                    ? off.name.startsWith('Hon.')
                                      ? off.name
                                      : `Hon. ${off.name}`
                                    : off.name}
                                </span>
                                {isPb && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                                    Head
                                  </span>
                                )}
                              </div>
                              {off.residentId && (
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                                  Res: {off.residentId}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {off.position}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {off.committee || 'General Administration'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {off.purok}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {off.termStart} – {off.termEnd}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          <div>{off.contactNumber}</div>
                          {off.email && <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{off.email}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              off.status === 'Active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : off.status === 'On Leave'
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {off.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setOfficialForPrint(off);
                                setIsPrintModalOpen(true);
                              }}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg cursor-pointer transition-colors"
                              title="Print Profile Sheet"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {canManage && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(off)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg cursor-pointer transition-colors"
                                  title="Edit Official Record"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTargetOfficial(off)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer transition-colors"
                                  title="Delete Official Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
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
        /* VIEW MODE: CARDS / GRID VIEW */
        <div className="space-y-6">
          {/* 1. Punong Barangay Showcase Card */}
          {punongBarangay && (selectedCategory === 'all' || selectedCategory === 'council') && (
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-700/50 shadow-lg text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-xs p-1 shadow-md shrink-0 flex items-center justify-center border border-white/20 overflow-hidden">
                  {punongBarangay.photoUrl || punongBarangay.avatar ? (
                    <img
                      src={punongBarangay.photoUrl || punongBarangay.avatar}
                      alt={punongBarangay.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <BarangaySangkolSeal size={80} />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider">
                      Head of Local Government
                    </span>
                    <span className="text-xs text-indigo-200 font-mono">
                      Term: {punongBarangay.termStart} – {punongBarangay.termEnd}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {punongBarangay.status}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {punongBarangay.name.startsWith('Hon.') ? punongBarangay.name : `Hon. ${punongBarangay.name}`}
                  </h3>
                  <p className="text-sm font-semibold text-indigo-300">{punongBarangay.position}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200 mt-2">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-indigo-300" />
                      {punongBarangay.contactNumber}
                    </span>
                    {punongBarangay.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-indigo-300" />
                        {punongBarangay.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-300" />
                      {punongBarangay.purok}
                    </span>
                  </div>

                  {punongBarangay.signatureUrl && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-indigo-300">
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>Official E-Signature on file</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Punong Barangay */}
              <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                <button
                  onClick={() => {
                    setOfficialForPrint(punongBarangay);
                    setIsPrintModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-white rounded-xl text-xs font-semibold border border-indigo-400/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Print Punong Barangay Official Profile"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Print Profile</span>
                </button>

                {canManage && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(punongBarangay)}
                      className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Edit Punong Barangay Record"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>

                    <button
                      onClick={() => setDeleteTargetOfficial(punongBarangay)}
                      className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 hover:text-rose-100 rounded-xl text-xs font-semibold border border-rose-400/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Remove Punong Barangay"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2. Sangguniang Barangay Members (Kagawads & SK) */}
          {(selectedCategory === 'all' || selectedCategory === 'council') && kagawads.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Sangguniang Barangay Members (Council & SK)</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {kagawads.length} Elected Members
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kagawads.map((kag, idx) => (
                  <div
                    key={kag.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                            {kag.photoUrl || kag.avatar ? (
                              <img
                                src={kag.photoUrl || kag.avatar}
                                alt={kag.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>#{kag.order}</span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {kag.name.startsWith('Hon.') ? kag.name : `Hon. ${kag.name}`}
                            </h4>
                            <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                              {kag.position}
                            </p>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {kag.purok}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setOfficialForPrint(kag);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-200 dark:border-indigo-800 cursor-pointer transition-colors"
                            title="Print Official Profile Sheet"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(kag)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                                title="Edit Kagawad"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTargetOfficial(kag)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                                title="Delete Kagawad"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                          Committee Assignment:
                        </span>
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">
                          {kag.committee || 'General Legislative'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-slate-900 dark:text-slate-200">{kag.contactNumber}</span>
                        </p>
                        {kag.email && (
                          <p className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-700 dark:text-slate-300 truncate">{kag.email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Term: {kag.termStart} – {kag.termEnd}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold border ${
                          kag.status === 'Active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {kag.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Appointive Officers, Tanod, and Support Staff */}
          {(selectedCategory === 'all' ||
            selectedCategory === 'appointive' ||
            selectedCategory === 'peace' ||
            selectedCategory === 'health') &&
            appointedStaff.length > 0 && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Appointed Officers, Peacekeeping & Support Staff</span>
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {appointedStaff.length} Frontline Staff
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {appointedStaff.map((st) => (
                    <div
                      key={st.id}
                      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                              {st.photoUrl || st.avatar ? (
                                <img
                                  src={st.photoUrl || st.avatar}
                                  alt={st.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{st.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                {st.name}
                              </h4>
                              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 line-clamp-1">
                                {st.position}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setOfficialForPrint(st);
                                setIsPrintModalOpen(true);
                              }}
                              className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg cursor-pointer transition-colors"
                              title="Print Staff Profile Sheet"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {canManage && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(st)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg cursor-pointer"
                                  title="Edit Staff Record"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTargetOfficial(st)}
                                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                                  title="Delete Staff Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                          <p className="flex items-center gap-1 font-mono text-[10px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {st.contactNumber}
                          </p>
                          <p className="flex items-center gap-1 text-[10px]">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {st.purok}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="truncate max-w-[120px]">
                          {st.committee || 'Administrative Staff'}
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded-full font-bold ${
                            st.status === 'Active'
                              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40'
                              : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                          }`}
                        >
                          {st.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT OFFICIAL MODAL - FULLY BASED ON SUPABASE barangay_officials DB */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 my-8">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{editingOfficial ? 'Edit Official / Staff Record' : 'Add Barangay Official / Staff'}</span>
                    {editingOfficial && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {editingOfficial.id}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Award className="w-3 h-3 text-indigo-500" />
                    <span>Official council credentials & frontline appointment</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <strong className="font-bold">Notice: </strong> {formError}
                  </div>
                </div>
              )}

              {/* Punong Barangay Warning Banner */}
              {(formData.position.toLowerCase().includes('punong barangay') ||
                formData.position.toLowerCase().includes('captain')) && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <Shield className="w-4 h-4" />
                    <span>Synchronized With Barangay Captain Credentials</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                    Saving this Punong Barangay record will update official council leadership, letterhead signatures, and captain administrative access.
                  </p>
                </div>
              )}

              {/* 1. Searchable Resident Picker (Civil Registry) */}
              <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Select Elected / Appointed Resident</span>
                    <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                      (Optional - Civil Registry)
                    </span>
                  </label>
                  {formData.residentId && (
                    <button
                      type="button"
                      onClick={handleClearResident}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-semibold"
                    >
                      Unlink Resident
                    </button>
                  )}
                </div>

                {/* If a resident is currently selected, display their summary card */}
                {selectedResident && !isResidentPickerOpen ? (
                  <div className="p-3 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/80 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-700/60 overflow-hidden flex items-center justify-center shrink-0 font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                        {selectedResident.photoUrl || selectedResident.avatar ? (
                          <img
                            src={selectedResident.photoUrl || selectedResident.avatar}
                            alt={selectedResident.lastName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>
                            {selectedResident.firstName[0]}
                            {selectedResident.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {selectedResident.lastName}, {selectedResident.firstName} {selectedResident.middleName || ''}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 shrink-0">
                            {selectedResident.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {selectedResident.purok}
                          </span>
                          {selectedResident.contactNumber && (
                            <span>• {selectedResident.contactNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsResidentPickerOpen(true)}
                        className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Change / Search
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Search Input & Dropdown results */
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={residentSearch}
                        onChange={(e) => {
                          setResidentSearch(e.target.value);
                          setIsResidentPickerOpen(true);
                        }}
                        onFocus={() => setIsResidentPickerOpen(true)}
                        placeholder="Search resident by name, resident ID, or purok..."
                        className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                      />
                      {residentSearch && (
                        <button
                          type="button"
                          onClick={() => setResidentSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Search Results Dropdown List */}
                    {isResidentPickerOpen && (
                      <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 z-30">
                        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/90 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                          <span>
                            {searchedResidents.length > 0
                              ? `Found ${searchedResidents.length} resident${searchedResidents.length > 1 ? 's' : ''}`
                              : 'No matching residents'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsResidentPickerOpen(false)}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-bold"
                          >
                            Close Search
                          </button>
                        </div>

                        {searchedResidents.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                            No residents match "{residentSearch}". You can also enter the name manually below.
                          </div>
                        ) : (
                          searchedResidents.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => handleSelectResidentItem(r)}
                              className="w-full px-3 py-2 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between gap-2 cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden flex items-center justify-center shrink-0 font-bold text-slate-600 dark:text-slate-300 text-xs">
                                  {r.photoUrl || r.avatar ? (
                                    <img
                                      src={r.photoUrl || r.avatar}
                                      alt={r.lastName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span>
                                      {r.firstName[0]}
                                      {r.lastName[0]}
                                    </span>
                                  )}
                                </div>
                                <div className="truncate">
                                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                    {r.lastName}, {r.firstName} {r.middleName || ''}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{r.id}</span>
                                    <span>•</span>
                                    <span>{r.purok}</span>
                                    {r.contactNumber && <span>• {r.contactNumber}</span>}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                Select & Auto-fill →
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Selecting an existing resident auto-populates their full name, purok, contact number, and photo.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Core Identity & Position Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Hon. Roberto Tan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Position Combobox / Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Position / Designation *
                  </label>
                  <select
                    value={
                      isCustomPosition
                        ? 'Custom'
                        : STANDARD_POSITIONS.includes(formData.position)
                        ? formData.position
                        : 'Custom'
                    }
                    onChange={(e) => handleSelectPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                  >
                    <option value="Punong Barangay (Barangay Captain)">Punong Barangay (Barangay Captain)</option>
                    <option value="Barangay Kagawad">Barangay Kagawad</option>
                    <option value="SK Chairperson">SK Chairperson</option>
                    <option value="Barangay Secretary">Barangay Secretary</option>
                    <option value="Barangay Treasurer">Barangay Treasurer</option>
                    <option value="Barangay Administrator">Barangay Administrator</option>
                    <option value="Custom">Other / Custom Position...</option>
                  </select>

                  {/* Custom Position text input */}
                  {isCustomPosition && (
                    <div className="mt-1.5">
                      <input
                        type="text"
                        required
                        value={customPositionText}
                        onChange={(e) => {
                          setCustomPositionText(e.target.value);
                          setFormData((prev) => ({ ...prev, position: e.target.value }));
                        }}
                        placeholder="Type custom position or designation..."
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Committee Assignment & Purok */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Committee / Department
                  </label>
                  <input
                    type="text"
                    list="official-committees"
                    value={formData.committee}
                    onChange={(e) => setFormData({ ...formData, committee: e.target.value })}
                    placeholder="e.g. Committee on Peace and Order"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  <datalist id="official-committees">
                    {STANDARD_COMMITTEES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Purok / Jurisdiction *
                  </label>
                  <select
                    required
                    value={formData.purok}
                    onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {availablePuroks.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                    <option value="Barangay Hall Compound">Barangay Hall Compound</option>
                  </select>
                </div>
              </div>

              {/* Term Duration & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Term Start *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.termStart}
                    onChange={(e) => setFormData({ ...formData, termStart: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Term End *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.termEnd}
                    onChange={(e) => setFormData({ ...formData, termEnd: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Term Ended">Term Ended</option>
                  </select>
                </div>
              </div>

              {/* Contact Information & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="0917-000-0000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="official@sangkol.gov.ph"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hierarchy Order / Rank
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 99 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Photo & Avatar */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Official Photo / Avatar</span>
                  </span>
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '' }))}
                      className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </label>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      placeholder="Paste Image URL or choose file from device..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={photoFileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => photoFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3 h-3 text-indigo-500" />
                        <span>Upload From Device</span>
                      </button>
                      <span className="text-[10px] text-slate-400">Supports JPG, PNG (max 2MB)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Signature */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileSignature className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Official E-Signature</span>
                  </span>
                  {formData.signatureUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, signatureUrl: '' }))}
                      className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove Signature
                    </button>
                  )}
                </label>

                <div className="flex items-center gap-3">
                  <div className="w-24 h-12 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 p-1">
                    {formData.signatureUrl ? (
                      <img
                        src={formData.signatureUrl}
                        alt="Signature Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[9px] text-slate-400 text-center font-mono">No Signature</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={formData.signatureUrl}
                      onChange={(e) => setFormData({ ...formData, signatureUrl: e.target.value })}
                      placeholder="Paste Signature URL or upload transparent PNG..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={signatureFileInputRef}
                        onChange={handleSignatureUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => signatureFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3 h-3 text-indigo-500" />
                        <span>Upload E-Signature</span>
                      </button>
                      <span className="text-[10px] text-slate-400">Used on clearances & certifications</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Official government registry</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Award className="w-4 h-4" />
                    <span>{editingOfficial ? 'Save Changes' : 'Create Official Record'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL - DELETES FROM OFFICIALS ROSTER */}
      {/* ========================================================================= */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetOfficial}
        title={
          deleteTargetOfficial &&
          (deleteTargetOfficial.position.includes('Punong Barangay') ||
            deleteTargetOfficial.position.includes('Captain'))
            ? 'Remove Punong Barangay (Barangay Captain)?'
            : 'Remove Official / Staff Record'
        }
        itemType="Barangay Official / Staff"
        itemName={
          deleteTargetOfficial
            ? `${deleteTargetOfficial.name} (${deleteTargetOfficial.position}) [${deleteTargetOfficial.id}]`
            : undefined
        }
        description={
          deleteTargetOfficial &&
          (deleteTargetOfficial.position.includes('Punong Barangay') ||
            deleteTargetOfficial.position.includes('Captain'))
            ? 'Warning: You are removing the Punong Barangay (Head of Council). This will remove their record from official council rosters. You can appoint a new Punong Barangay at any time.'
            : 'Permanently remove this official or staff profile from the Sangguniang Barangay roster.'
        }
        confirmText="Yes, Permanently Delete"
        onConfirm={() => {
          if (deleteTargetOfficial) {
            deleteOfficial(deleteTargetOfficial.id);
            setDeleteTargetOfficial(null);
          }
        }}
        onClose={() => setDeleteTargetOfficial(null)}
      />

      {/* Excel / CSV Data Importer */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialEntity="officials"
      />

      {/* Official Directory & Profile Print Modal */}
      <OfficialsPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setOfficialForPrint(null);
        }}
        initialOfficial={officialForPrint}
      />
    </div>
  );
};
