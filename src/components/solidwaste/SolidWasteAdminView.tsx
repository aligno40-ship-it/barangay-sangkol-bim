import React, { useState } from 'react';
import {
  Trash2,
  Truck,
  Users2,
  AlertTriangle,
  Recycle,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash,
  Award,
  ShieldCheck,
  Phone,
  Scale,
  Sparkles,
  DollarSign,
  Gift,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Check,
  X,
} from 'lucide-react';
import { useCommunityServices } from '../../context/CommunityServicesContext';
import {
  WasteCollectionSchedule,
  BulkWastePickupRequest,
  BayanihanCleanUpDrive,
  BayanihanVolunteerRecord,
  IllegalDumpingReport,
  MRFRecyclablesDropRecord,
} from '../../types/residentServices';
import { AddWasteRouteModal } from './AddWasteRouteModal';
import { BayanihanCertificateModal } from './BayanihanCertificateModal';
import { MRFDropModal } from './MRFDropModal';
import { IllegalDumpingDetailModal } from './IllegalDumpingDetailModal';
import { BulkPickupDispatchModal } from './BulkPickupDispatchModal';
import { BayanihanCleanUpModal } from '../community/CommunityModals';

export const SolidWasteAdminView: React.FC = () => {
  const {
    wasteSchedules,
    bulkWasteRequests,
    cleanUpDrives,
    cleanUpVolunteers,
    illegalDumpingReports,
    mrfDropRecords,
    addWasteSchedule,
    updateWasteSchedule,
    deleteWasteSchedule,
    updateBulkWastePickupStatus,
    deleteBulkWastePickup,
    createCleanUpDrive,
    updateCleanUpDrive,
    deleteCleanUpDrive,
    verifyVolunteerAttendance,
    cancelVolunteerRegistration,
    updateIllegalDumpingStatus,
    deleteIllegalDumpingReport,
    recordMRFDrop,
    deleteMRFDropRecord,
  } = useCommunityServices();

  // Admin Sub Tabs
  const [activeSubTab, setActiveSubTab] = useState<
    'fleet_routes' | 'bulk_pickups' | 'bayanihan_drives' | 'sumbong_basura' | 'mrf_station'
  >('fleet_routes');

  // Modals state
  const [isAddRouteModalOpen, setIsAddRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<WasteCollectionSchedule | null>(null);

  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [cleanUpForm, setCleanUpForm] = useState({
    title: '',
    description: '',
    activityDate: '',
    assemblyTime: '06:00 AM',
    assemblyPoint: 'Barangay Sangkol Hall Grounds',
    purokTarget: 'Purok 1 - Mabini Coastal & Estero Line',
    expectedVolunteers: 25,
    equipmentProvidedText: 'Garbage Sacks, Heavy Duty Gloves, Rakes & Shovels, Free Snacks & Mineral Water',
    coordinator: 'Kgd. Joel Manalo (Committee on Environment)',
  });

  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<BayanihanVolunteerRecord | null>(null);

  const [isMRFModalOpen, setIsMRFModalOpen] = useState(false);

  const [selectedDumpingReport, setSelectedDumpingReport] = useState<IllegalDumpingReport | null>(null);
  const [isDumpingModalOpen, setIsDumpingModalOpen] = useState(false);

  const [selectedBulkRequest, setSelectedBulkRequest] = useState<BulkWastePickupRequest | null>(null);
  const [isBulkDispatchModalOpen, setIsBulkDispatchModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // MRF summary calculations
  const totalKgDiverted = mrfDropRecords.reduce((sum, r) => sum + r.weightKg, 0);

  // Handle Clean Up Drive creation
  const handleCreateCleanUpDrive = (e: React.FormEvent) => {
    e.preventDefault();
    createCleanUpDrive({
      title: cleanUpForm.title,
      description: cleanUpForm.description,
      activityDate: cleanUpForm.activityDate,
      assemblyTime: cleanUpForm.assemblyTime,
      assemblyPoint: cleanUpForm.assemblyPoint,
      purokTarget: cleanUpForm.purokTarget,
      expectedVolunteers: Number(cleanUpForm.expectedVolunteers),
      equipmentProvided: cleanUpForm.equipmentProvidedText.split(',').map((s) => s.trim()).filter(Boolean),
      coordinator: cleanUpForm.coordinator,
      status: 'Upcoming',
    });
    setIsDriveModalOpen(false);
    showToast(`✓ Published Bayanihan Clean-Up Drive: ${cleanUpForm.title}`);
    setCleanUpForm({
      title: '',
      description: '',
      activityDate: '',
      assemblyTime: '06:00 AM',
      assemblyPoint: 'Barangay Sangkol Hall Grounds',
      purokTarget: 'Purok 1 - Mabini Coastal & Estero Line',
      expectedVolunteers: 25,
      equipmentProvidedText: 'Garbage Sacks, Heavy Duty Gloves, Rakes & Shovels, Free Snacks & Mineral Water',
      coordinator: 'Kgd. Joel Manalo (Committee on Environment)',
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-5 border border-emerald-800/40">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Barangay Ecological Task Force
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200">
              RA 9003 Solid Waste Management
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Solid Waste Fleet, Bayanihan & MRF Operations Desk
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl leading-relaxed">
            Monitor live garbage truck collection routes, dispatch special bulk pickups, coordinate citizen illegal dumping (Sumbong Basura) reports, organize clean-up drives, and issue volunteer certificates.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditingRoute(null);
              setIsAddRouteModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Collection Route</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDriveModalOpen(true)}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all border border-teal-500/30"
          >
            <Users2 className="w-4 h-4" />
            <span>Organize Clean-Up Drive</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMRFModalOpen(true)}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            <Recycle className="w-4 h-4" />
            <span>Log MRF Drop</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="p-1 hover:bg-emerald-200/50 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Fleet Routes</p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{wasteSchedules.length}</p>
          <p className="text-[11px] text-slate-400">Purok collection lines</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bulk Pickup Queue</p>
          <p className="text-2xl font-black text-teal-700 dark:text-teal-400">
            {bulkWasteRequests.filter((b) => b.status === 'Pending Schedule').length}{' '}
            <span className="text-xs text-slate-400 font-normal">/ {bulkWasteRequests.length} total</span>
          </p>
          <p className="text-[11px] text-slate-400">Pending dispatch crew</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sumbong Basura</p>
          <p className="text-2xl font-black text-rose-600">
            {illegalDumpingReports.filter((r) => r.status === 'Report Received' || r.status === 'Tanod Dispatched').length}
          </p>
          <p className="text-[11px] text-slate-400">Active citizen reports</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MRF Recycled Waste</p>
          <p className="text-2xl font-black text-indigo-600">{totalKgDiverted.toLocaleString()} kg</p>
          <p className="text-[11px] text-slate-400">{mrfDropRecords.length} resident drop-offs</p>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('fleet_routes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'fleet_routes'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Route & Fleet Dispatch</span>
          <span className="min-w-[20px] h-5 px-1 bg-white/20 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {wasteSchedules.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('bulk_pickups')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'bulk_pickups'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Special Bulk Pickups</span>
          {bulkWasteRequests.filter((b) => b.status === 'Pending Schedule').length > 0 && (
            <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center">
              {bulkWasteRequests.filter((b) => b.status === 'Pending Schedule').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('bayanihan_drives')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'bayanihan_drives'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>Bayanihan Drives & Volunteers</span>
          <span className="min-w-[20px] h-5 px-1 bg-white/20 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {cleanUpVolunteers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sumbong_basura')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'sumbong_basura'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Sumbong Basura (Hotspots)</span>
          {illegalDumpingReports.filter((r) => r.status === 'Report Received').length > 0 && (
            <span className="min-w-[20px] h-5 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
              {illegalDumpingReports.filter((r) => r.status === 'Report Received').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('mrf_station')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'mrf_station'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Recycle className="w-4 h-4" />
          <span>MRF Eco-Station & Diverted Waste</span>
          <span className="min-w-[20px] h-5 px-1 bg-white/20 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {mrfDropRecords.length}
          </span>
        </button>
      </div>

      {/* ================= SUB-TAB 1: FLEET & ROUTE DISPATCH ================= */}
      {activeSubTab === 'fleet_routes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wasteSchedules.map((sch) => (
              <div
                key={sch.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        sch.status === 'Collecting Now'
                          ? 'bg-emerald-500 text-white animate-pulse'
                          : sch.status === 'En Route to Purok'
                          ? 'bg-sky-100 text-sky-900 border border-sky-300'
                          : sch.status === 'Delayed due to Weather'
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : sch.status === 'Completed Today'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      {sch.status || 'On Schedule'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">{sch.assignedTruckNo}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{sch.purokName}</h3>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{sch.collectionDays}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 text-xs border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <p className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Time: <strong>{sch.pickupTime}</strong></span>
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>Class:</strong> {sch.wasteType}
                    </p>
                    {sch.driverName && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Driver: {sch.driverName} ({sch.driverContact || 'N/A'})</span>
                      </p>
                    )}
                    {sch.routeNotes && (
                      <p className="text-[10px] italic text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50">
                        {sch.routeNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <select
                    value={sch.status || 'On Schedule'}
                    onChange={(e) => {
                      updateWasteSchedule(sch.id, { status: e.target.value as any });
                      showToast(`Updated route ${sch.purokName} status to "${e.target.value}".`);
                    }}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <option value="On Schedule">On Schedule</option>
                    <option value="Collecting Now">Collecting Now</option>
                    <option value="En Route to Purok">En Route</option>
                    <option value="Delayed due to Weather">Delayed</option>
                    <option value="Completed Today">Completed</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRoute(sch);
                        setIsAddRouteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Route"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete collection route for ${sch.purokName}?`)) {
                          deleteWasteSchedule(sch.id);
                          showToast(`Deleted route ${sch.purokName}.`);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete Route"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: BULK PICKUP QUEUE ================= */}
      {activeSubTab === 'bulk_pickups' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  Special Bulky Garbage Pickup Dispatch Queue ({bulkWasteRequests.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tree trimmings, broken furniture, dry construction debris, discarded home appliances.
                </p>
              </div>

              <div className="text-xs font-semibold text-slate-500">
                Pending:{' '}
                <span className="font-bold text-amber-600">
                  {bulkWasteRequests.filter((b) => b.status === 'Pending Schedule').length}
                </span>
                {' • '}
                Collected:{' '}
                <span className="font-bold text-emerald-600">
                  {bulkWasteRequests.filter((b) => b.status === 'Collected').length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Control No. & Category</th>
                    <th className="p-3.5">Resident / Address</th>
                    <th className="p-3.5">Volume & Description</th>
                    <th className="p-3.5">Target Date & Window</th>
                    <th className="p-3.5">Assigned Crew</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Dispatch Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bulkWasteRequests.map((bulk) => (
                    <tr key={bulk.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-mono text-[10px] text-slate-400 font-bold">{bulk.id}</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{bulk.wasteCategory}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{bulk.residentName}</p>
                        <p className="text-[11px] text-slate-500">
                          {bulk.streetAddress} ({bulk.purok}) • {bulk.contactNumber}
                        </p>
                      </td>
                      <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-400">
                        <p className="truncate font-medium">{bulk.wasteDescription}</p>
                        {bulk.estimatedVolume && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                            Volume: {bulk.estimatedVolume}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{bulk.preferredPickupDate}</p>
                        <p className="text-[10px] text-slate-500">{bulk.pickupTimeWindow || 'Pending window'}</p>
                      </td>
                      <td className="p-3.5 font-semibold text-indigo-600 dark:text-indigo-400">
                        {bulk.assignedCrew || 'Unassigned'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            bulk.status === 'Collected'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : bulk.status === 'Pickup Scheduled'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {bulk.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBulkRequest(bulk);
                              setIsBulkDispatchModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Dispatch / Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete bulk request #${bulk.id}?`)) {
                                deleteBulkWastePickup(bulk.id);
                                showToast(`Deleted bulk request #${bulk.id}.`);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: BAYANIHAN DRIVES & VOLUNTEERS ================= */}
      {activeSubTab === 'bayanihan_drives' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cleanUpDrives.map((drv) => (
              <div
                key={drv.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      drv.status === 'Completed'
                        ? 'bg-slate-200 text-slate-800'
                        : drv.status === 'In Progress'
                        ? 'bg-amber-100 text-amber-900 animate-pulse'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    {drv.status}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                    {drv.currentVolunteers} / {drv.expectedVolunteers} Volunteers
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{drv.title}</h3>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{drv.purokTarget}</p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">{drv.description}</p>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-xs border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Date: <strong>{drv.activityDate}</strong> ({drv.assemblyTime})</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Assembly: {drv.assemblyPoint}</span>
                  </p>
                  {drv.wasteCollectedSacks ? (
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 pt-1 border-t border-slate-200/50">
                      ✓ Sacks Collected: {drv.wasteCollectedSacks} sacks • {drv.targetLinearMeters || '500m'} cleared
                    </p>
                  ) : null}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <select
                    value={drv.status}
                    onChange={(e) => {
                      updateCleanUpDrive(drv.id, { status: e.target.value as any });
                      showToast(`Updated drive status to ${e.target.value}.`);
                    }}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Postponed">Postponed</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete clean-up drive "${drv.title}"?`)) {
                        deleteCleanUpDrive(drv.id);
                        showToast(`Deleted clean-up drive.`);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Volunteer Roster & Certificate Issuance Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Bayanihan Volunteer Roster & Commendation Certificates ({cleanUpVolunteers.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify volunteer attendance on-site and generate official printable Bayanihan Certificates.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Volunteer Name & Purok</th>
                    <th className="p-3.5">Clean-Up Drive</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Registered Date</th>
                    <th className="p-3.5">Attendance</th>
                    <th className="p-3.5 pr-5 text-right">Certificate & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cleanUpVolunteers.map((vol) => (
                    <tr key={vol.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-bold text-slate-900 dark:text-white">{vol.residentName}</p>
                        <p className="text-[11px] text-slate-500">
                          {vol.purok} • {vol.contactNumber}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">{vol.driveTitle}</p>
                        <p className="font-mono text-[10px] text-slate-400">{vol.id}</p>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {vol.volunteerRole || 'Sweeper / Collector'}
                      </td>
                      <td className="p-3.5 text-slate-500">{vol.registeredDate}</td>
                      <td className="p-3.5">
                        {vol.attendanceVerified ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified ({vol.hoursRendered || 4} hrs)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              verifyVolunteerAttendance(vol.id, 4);
                              showToast(`Verified attendance for ${vol.residentName} & generated digital certificate!`);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Verify Attendance</span>
                          </button>
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {vol.attendanceVerified && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVolunteer(vol);
                                setIsCertModalOpen(true);
                              }}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer border border-emerald-200 dark:border-emerald-800 transition-colors"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span>View Certificate</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove volunteer registration for ${vol.residentName}?`)) {
                                cancelVolunteerRegistration(vol.id);
                                showToast(`Removed volunteer.`);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 4: SUMBONG BASURA ================= */}
      {activeSubTab === 'sumbong_basura' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Sumbong Basura Hotspot Incident Ledger ({illegalDumpingReports.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Citizen reports for open burning (siga), canal dumping, and roadside garbage hotspots.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Case ID & Violation</th>
                    <th className="p-3.5">Purok & Landmark</th>
                    <th className="p-3.5">Severity</th>
                    <th className="p-3.5">Complainant</th>
                    <th className="p-3.5">Assigned Tanod / Squad</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Investigation & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {illegalDumpingReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-mono text-[10px] text-slate-400 font-bold">{rep.id}</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{rep.violationType}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{rep.purok}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">{rep.exactLocationOrLandmark}</p>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            rep.severityLevel === 'High / Blocking Waterway'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : rep.severityLevel === 'Medium / Public Nuisance'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {rep.severityLevel}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-medium text-slate-700 dark:text-slate-300">{rep.residentName}</p>
                        <p className="text-[10px] text-slate-400">{rep.reportedAt}</p>
                      </td>
                      <td className="p-3.5 font-medium text-indigo-600 dark:text-indigo-400">
                        {rep.assignedTanodOrCrew || 'Unassigned'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            rep.status === 'Cleaned & Cleared' || rep.status === 'Notice Issued / Resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rep.status === 'Tanod Dispatched'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200 animate-pulse'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDumpingReport(rep);
                              setIsDumpingModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Inspect & Action</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete incident report #${rep.id}?`)) {
                                deleteIllegalDumpingReport(rep.id);
                                showToast(`Deleted report #${rep.id}.`);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 5: MRF ECO-STATION ================= */}
      {activeSubTab === 'mrf_station' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-5 rounded-2xl text-white space-y-1 shadow-xs">
              <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider">Total Recyclables Diverted</p>
              <h3 className="text-3xl font-black">{totalKgDiverted.toLocaleString()} kg</h3>
              <p className="text-[11px] text-emerald-200/80">Prevented from open burning and landfill</p>
            </div>
            <div className="bg-gradient-to-br from-amber-700 to-orange-900 p-5 rounded-2xl text-white space-y-1 shadow-xs">
              <p className="text-xs text-amber-200 font-bold uppercase tracking-wider">Total MRF Logged Entries</p>
              <h3 className="text-3xl font-black">{mrfDropRecords.length} Drops</h3>
              <p className="text-[11px] text-amber-200/80">Bigas & cash rewards granted to residents</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-800 to-slate-900 p-5 rounded-2xl text-white space-y-1 shadow-xs">
              <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Material Streams Handled</p>
              <h3 className="text-3xl font-black">6 Categories</h3>
              <p className="text-[11px] text-indigo-200/80">PET plastic, cardboards, metals, e-waste</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Recycle className="w-4 h-4 text-emerald-600" />
                  MRF Drop & Trade-In Transaction Log ({mrfDropRecords.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record of plastic bottles, scrap metals, cartons, and e-waste drops by residents.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMRFModalOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Drop</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Receipt ID & Date</th>
                    <th className="p-3.5">Resident / Purok</th>
                    <th className="p-3.5">Material Category</th>
                    <th className="p-3.5">Weight (kg)</th>
                    <th className="p-3.5">Incentive Mode</th>
                    <th className="p-3.5">Value Released</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mrfDropRecords.map((mrf) => (
                    <tr key={mrf.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-mono text-[10px] text-slate-400 font-bold">{mrf.id}</p>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">{mrf.loggedDate}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 dark:text-white">{mrf.residentName}</p>
                        <p className="text-[11px] text-slate-500">{mrf.purok}</p>
                      </td>
                      <td className="p-3.5 font-medium text-emerald-800 dark:text-emerald-300">
                        {mrf.itemCategory}
                      </td>
                      <td className="p-3.5 font-black text-slate-900 dark:text-white">
                        {mrf.weightKg} kg
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          {mrf.rewardType}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {mrf.rewardValue}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete MRF transaction record #${mrf.id}?`)) {
                              deleteMRFDropRecord(mrf.id);
                              showToast(`Deleted MRF drop #${mrf.id}.`);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddWasteRouteModal
        isOpen={isAddRouteModalOpen}
        onClose={() => setIsAddRouteModalOpen(false)}
        initialData={editingRoute}
        onSave={(data) => {
          if (editingRoute) {
            updateWasteSchedule(editingRoute.id, data);
            showToast(`Updated route for ${editingRoute.purokName}.`);
          } else {
            addWasteSchedule(data as any);
            showToast(`Added new waste collection route.`);
          }
        }}
      />

      <BayanihanCleanUpModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        form={cleanUpForm}
        setForm={setCleanUpForm}
        onSubmit={handleCreateCleanUpDrive}
      />

      {selectedVolunteer && (
        <BayanihanCertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          volunteer={selectedVolunteer}
        />
      )}

      <MRFDropModal
        isOpen={isMRFModalOpen}
        onClose={() => setIsMRFModalOpen(false)}
        onSave={(record) => {
          const saved = recordMRFDrop(record);
          showToast(`✓ Logged MRF Trade-In (${saved.id}) for ${saved.residentName}.`);
        }}
      />

      {selectedDumpingReport && (
        <IllegalDumpingDetailModal
          isOpen={isDumpingModalOpen}
          onClose={() => setIsDumpingModalOpen(false)}
          report={selectedDumpingReport}
          onUpdateStatus={(id, status, tanod, notes) => {
            updateIllegalDumpingStatus(id, status, tanod, notes);
            showToast(`Updated incident #${id} to ${status}.`);
          }}
        />
      )}

      {selectedBulkRequest && (
        <BulkPickupDispatchModal
          isOpen={isBulkDispatchModalOpen}
          onClose={() => setIsBulkDispatchModalOpen(false)}
          request={selectedBulkRequest}
          onDispatch={(id, status, crew, window, remarks) => {
            updateBulkWastePickupStatus(id, status, crew, window, remarks);
            showToast(`Updated bulk pickup #${id} dispatch.`);
          }}
        />
      )}
    </div>
  );
};
