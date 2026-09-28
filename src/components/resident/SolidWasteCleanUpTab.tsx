import React, { useState, useMemo } from 'react';
import {
  Trash2,
  Truck,
  Users2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Sparkles,
  TreePine,
  Layers,
  Recycle,
  ShieldCheck,
  Phone,
  Info,
  AlertTriangle,
  Flame,
  Award,
  Printer,
  Scale,
  DollarSign,
  Gift,
  Upload,
  Camera,
  Image as ImageIcon,
  Check,
  Search,
} from 'lucide-react';
import {
  WasteCollectionSchedule,
  BulkWastePickupRequest,
  BayanihanCleanUpDrive,
  BayanihanVolunteerRecord,
  IllegalDumpingReport,
  MRFRecyclablesDropRecord,
} from '../../types/residentServices';
import { useCommunityServices } from '../../context/CommunityServicesContext';
import { BayanihanCertificateModal } from '../solidwaste/BayanihanCertificateModal';
import { isResidentRecordOwner } from '../../utils/residentAccountFilter';
import { RecentSearchesInput } from '../RecentSearchesInput';

interface SolidWasteCleanUpTabProps {
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
}

// Material pricing rates for resident MRF trade-in calculator
const MRF_RATES: Record<
  MRFRecyclablesDropRecord['itemCategory'],
  { pricePerKg: number; riceKgPerKg: number; pointsPerKg: number; icon: string }
> = {
  'Plastic Bottles (PET / HDPE)': { pricePerKg: 12, riceKgPerKg: 0.25, pointsPerKg: 10, icon: '🧴' },
  'Corrugated Carton & Old Newspaper': { pricePerKg: 6, riceKgPerKg: 0.12, pointsPerKg: 5, icon: '📦' },
  'Scrap Iron & Metals (Bakal / G.I.)': { pricePerKg: 18, riceKgPerKg: 0.4, pointsPerKg: 15, icon: '🔩' },
  'Aluminum Cans & Beverage Tins': { pricePerKg: 45, riceKgPerKg: 1.0, pointsPerKg: 35, icon: '🥫' },
  'Glass Bottles & Culinary Jars': { pricePerKg: 4, riceKgPerKg: 0.08, pointsPerKg: 4, icon: '🍾' },
  'E-Waste & Discarded Small Appliances': { pricePerKg: 30, riceKgPerKg: 0.65, pointsPerKg: 25, icon: '💻' },
};

export const SolidWasteCleanUpTab: React.FC<SolidWasteCleanUpTabProps> = ({
  residentId,
  residentName,
  contactNumber,
  purok,
}) => {
  const {
    wasteSchedules: schedules,
    bulkWasteRequests: allBulkRequests,
    cleanUpDrives: bayanihanDrives,
    cleanUpVolunteers: volunteerRecords,
    illegalDumpingReports: allDumpingReports,
    mrfDropRecords: allMRFRecords,
    requestBulkWastePickup,
    deleteBulkWastePickup,
    volunteerForCleanUpDrive,
    reportIllegalDumping,
  } = useCommunityServices();

  const [activeSubTab, setActiveSubTab] = useState<
    'collection_schedule' | 'bulk_pickup' | 'bayanihan_drives' | 'sumbong_basura' | 'mrf_tradein'
  >('collection_schedule');

  const residentIdentity = useMemo(
    () => ({ residentId, name: residentName, contactNumber }),
    [residentId, residentName, contactNumber]
  );

  // Strict Row-Level Security: Filter transactions exclusively for this resident account
  const myBulkRequests = useMemo(() => {
    return allBulkRequests.filter((b) =>
      isResidentRecordOwner(
        {
          residentId: b.residentId,
          residentName: b.residentName,
          contactNumber: b.contactNumber,
        },
        residentIdentity
      )
    );
  }, [allBulkRequests, residentIdentity]);

  const myVolunteerRecords = useMemo(() => {
    return volunteerRecords.filter((v) =>
      isResidentRecordOwner(
        {
          residentId: v.residentId,
          residentName: v.residentName,
          contactNumber: v.contactNumber,
        },
        residentIdentity
      )
    );
  }, [volunteerRecords, residentIdentity]);

  const myDumpingReports = useMemo(() => {
    return allDumpingReports.filter((r) =>
      isResidentRecordOwner(
        {
          residentId: r.residentId,
          residentName: r.residentName,
          contactNumber: r.contactNumber,
        },
        residentIdentity
      )
    );
  }, [allDumpingReports, residentIdentity]);

  const myMRFRecords = useMemo(() => {
    return allMRFRecords.filter((m) =>
      isResidentRecordOwner(
        {
          residentId: m.residentId,
          residentName: m.residentName,
        },
        residentIdentity
      )
    );
  }, [allMRFRecords, residentIdentity]);

  // Modals & Feedback
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSumbongModalOpen, setIsSumbongModalOpen] = useState(false);
  const [selectedVolunteerCert, setSelectedVolunteerCert] = useState<BayanihanVolunteerRecord | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Bulk Request Form State
  const [wasteCategory, setWasteCategory] = useState<BulkWastePickupRequest['wasteCategory']>(
    'Tree Branches & Yard Trimmings'
  );
  const [streetAddress, setStreetAddress] = useState('');
  const [wasteDescription, setWasteDescription] = useState('');
  const [preferredPickupDate, setPreferredPickupDate] = useState('');
  const [estimatedVolume, setEstimatedVolume] = useState<
    'Small (1-2 bundles/bags)' | 'Medium (Tricycle load)' | 'Large (Truck load)'
  >('Medium (Tricycle load)');
  const [bulkPhotoData, setBulkPhotoData] = useState<string>('');

  // Sumbong Basura Form State
  const [violationType, setViolationType] = useState<IllegalDumpingReport['violationType']>(
    'Open Burning (Siga / RA 9003 Sec 48)'
  );
  const [sumbongPurok, setSumbongPurok] = useState(purok || 'Purok 1 - Mabini');
  const [landmarkDescription, setLandmarkDescription] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [severityLevel, setSeverityLevel] = useState<IllegalDumpingReport['severityLevel']>(
    'Medium / Public Nuisance'
  );
  const [sumbongPhotoData, setSumbongPhotoData] = useState<string>('');

  // Volunteer Role Modal
  const [selectedDriveForVolunteering, setSelectedDriveForVolunteering] = useState<BayanihanCleanUpDrive | null>(null);
  const [volunteerRole, setVolunteerRole] = useState<BayanihanVolunteerRecord['volunteerRole']>(
    'Sweeper / Collector'
  );

  // MRF Calculator State
  const [calcMaterial, setCalcMaterial] = useState<MRFRecyclablesDropRecord['itemCategory']>(
    'Plastic Bottles (PET / HDPE)'
  );
  const [calcWeight, setCalcWeight] = useState<number>(5);

  // Purok search filter
  const [purokSearch, setPurokSearch] = useState('');

  // Handle Photo upload for Bulk
  const handleBulkPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBulkPhotoData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Photo upload for Sumbong
  const handleSumbongPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSumbongPhotoData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Bulk Request
  const handleRequestBulkPickup = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq = requestBulkWastePickup({
      residentId,
      residentName,
      contactNumber,
      purok: purok || 'Purok 1 - Mabini',
      streetAddress: streetAddress || 'Purok Roadside',
      wasteCategory,
      wasteDescription,
      preferredPickupDate,
      estimatedVolume,
      photoUrl: bulkPhotoData || undefined,
    });

    setIsBulkModalOpen(false);
    setSuccessMessage(`✓ Bulk pickup request #${newReq.id} submitted! Barangay Sanitation will schedule collection.`);
    setTimeout(() => setSuccessMessage(''), 5000);

    // Reset Form
    setStreetAddress('');
    setWasteDescription('');
    setPreferredPickupDate('');
    setBulkPhotoData('');
  };

  // Submit Sumbong Basura
  const handleSumbongSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const report = reportIllegalDumping({
      residentId,
      residentName,
      contactNumber,
      purok: sumbongPurok,
      exactLocationOrLandmark: landmarkDescription,
      violationType,
      description: incidentDescription,
      severityLevel,
      photoUrl: sumbongPhotoData || undefined,
    });

    setIsSumbongModalOpen(false);
    setSuccessMessage(`✓ Sumbong Basura #${report.id} recorded. Tanod Quick Response assigned for verification.`);
    setTimeout(() => setSuccessMessage(''), 5000);

    // Reset Form
    setLandmarkDescription('');
    setIncidentDescription('');
    setSumbongPhotoData('');
  };

  // Confirm Volunteer Signup
  const handleConfirmVolunteer = () => {
    if (!selectedDriveForVolunteering) return;
    const vol = volunteerForCleanUpDrive({
      driveId: selectedDriveForVolunteering.id,
      driveTitle: selectedDriveForVolunteering.title,
      residentId,
      residentName,
      contactNumber,
      purok: purok || 'Purok 1 - Mabini',
      volunteerRole,
    });

    setSelectedDriveForVolunteering(null);
    setSuccessMessage(`✓ You are officially registered as a volunteer for "${selectedDriveForVolunteering.title}"!`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // Filtered schedules
  const filteredSchedules = schedules.filter((s) =>
    s.purokName.toLowerCase().includes(purokSearch.toLowerCase()) ||
    s.wasteType.toLowerCase().includes(purokSearch.toLowerCase()) ||
    s.collectionDays.toLowerCase().includes(purokSearch.toLowerCase())
  );

  // My Purok's specific schedule
  const myPurokSchedule = schedules.find((s) => s.purokName.toLowerCase().includes(purok.toLowerCase()));

  // Calculator computations
  const rateInfo = MRF_RATES[calcMaterial] || { pricePerKg: 10, riceKgPerKg: 0.2, pointsPerKg: 10, icon: '♻️' };
  const estCash = (calcWeight * rateInfo.pricePerKg).toLocaleString();
  const estRice = (calcWeight * rateInfo.riceKgPerKg).toFixed(2);
  const estPoints = Math.round(calcWeight * rateInfo.pointsPerKg);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Eco-Barangay Portal
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200">
                Logged in: {residentName} ({purok})
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Solid Waste Management & Bayanihan Clean-Up Desk
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl leading-relaxed">
              Check real-time garbage truck schedules, request special bulk waste pickup, file reports against open burning (Siga) & illegal dumping, join community clean-up drives, and trade recyclables for rice or cash at the Barangay MRF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Truck className="w-4 h-4" />
              <span>Book Bulk Pickup</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSumbongModalOpen(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Sumbong Basura</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="p-1 hover:bg-emerald-200/50 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Resident My-Purok Live Waste Schedule Card */}
      {myPurokSchedule && (
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Your Purok Collection Route ({purok})
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    myPurokSchedule.status === 'Collecting Now'
                      ? 'bg-emerald-500 text-white animate-pulse'
                      : myPurokSchedule.status === 'En Route to Purok'
                      ? 'bg-sky-100 text-sky-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {myPurokSchedule.status || 'On Schedule'}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                {myPurokSchedule.collectionDays} • {myPurokSchedule.pickupTime}
              </h3>
              <p className="text-xs text-slate-500">
                Assigned Unit: <strong>{myPurokSchedule.assignedTruckNo}</strong> • {myPurokSchedule.wasteType}
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 sm:text-right">
            <p className="font-bold text-slate-800 dark:text-slate-100">Segregation Reminder</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              No Segregation, No Collection Policy (RA 9003). Place bins outside 30 mins before pickup.
            </p>
          </div>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('collection_schedule')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'collection_schedule'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Garbage Truck Schedules</span>
          <span className="min-w-[20px] h-5 px-1 bg-white/20 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {schedules.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('bulk_pickup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'bulk_pickup'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>My Bulk Pickup Bookings</span>
          <span className="min-w-[20px] h-5 px-1 bg-white/20 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {myBulkRequests.length}
          </span>
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
          <span>Bayanihan Clean-Up Drives</span>
          <span className="min-w-[20px] h-5 px-1 bg-white/20 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {bayanihanDrives.length}
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
          <span>Sumbong Basura & Siga Reports</span>
          <span className="min-w-[20px] h-5 px-1 bg-white/20 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {myDumpingReports.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('mrf_tradein')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'mrf_tradein'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Recycle className="w-4 h-4" />
          <span>MRF Trash-to-Rice & Cash Station</span>
          <span className="min-w-[20px] h-5 px-1 bg-white/20 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {myMRFRecords.length}
          </span>
        </button>
      </div>

      {/* ================= SUB-TAB 1: COLLECTION SCHEDULE ================= */}
      {activeSubTab === 'collection_schedule' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <RecentSearchesInput
              className="w-full sm:w-80"
              placeholder="Search by Purok (e.g. Mabini, Rizal, Bonifacio)..."
              value={purokSearch}
              onChange={setPurokSearch}
              storageKey="resident_waste_purok"
              theme="light"
              inputClassName="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredSchedules.length} of {schedules.length} Purok routes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.map((sch) => {
              const isMyPurok = sch.purokName.toLowerCase().includes(purok.toLowerCase());
              return (
                <div
                  key={sch.id}
                  className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all space-y-3.5 ${
                    isMyPurok
                      ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-800 shadow-xs'
                  }`}
                >
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
                    {isMyPurok && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-md">
                        Your Area
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{sch.purokName}</h3>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{sch.collectionDays}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-xs border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <p className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pickup Time: <strong>{sch.pickupTime}</strong></span>
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>Class:</strong> {sch.wasteType}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>Assigned Unit:</strong> {sch.assignedTruckNo}
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
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: MY BULK PICKUP REQUESTS ================= */}
      {activeSubTab === 'bulk_pickup' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                My Bulky Garbage Pickup Bookings ({myBulkRequests.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Free pickup for pruned tree branches, discarded furniture, appliances, and construction debris.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Book New Bulk Pickup</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            {myBulkRequests.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Truck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Bulk Pickups Booked Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Have large garden trimmings, old furniture, or dry rubble? Submit a booking and the Barangay Eco-Truck will collect it from your curb.
                </p>
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Request Pickup Now</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myBulkRequests.map((b) => (
                  <div key={b.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                          {b.id}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{b.wasteCategory}</h4>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          {b.estimatedVolume || 'Medium Load'}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === 'Collected'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.status === 'Pickup Scheduled'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <strong>Description:</strong> {b.wasteDescription}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Address: {b.streetAddress} ({b.purok})</span>
                      </span>
                      <span>Preferred Date: <strong>{b.preferredPickupDate}</strong></span>
                      {b.pickupTimeWindow && <span>Time Window: <strong>{b.pickupTimeWindow}</strong></span>}
                    </div>

                    {b.assignedCrew && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-100 dark:border-slate-700 text-xs space-y-1">
                        <p className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                          <Truck className="w-4 h-4" />
                          <span>Assigned Sanitation Crew: {b.assignedCrew}</span>
                        </p>
                        {b.adminRemarks && <p className="text-slate-600 dark:text-slate-300 text-[11px]">Note: {b.adminRemarks}</p>}
                      </div>
                    )}

                    {b.status === 'Pending Schedule' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Cancel your bulk pickup request #${b.id}?`)) {
                              deleteBulkWastePickup(b.id);
                              setSuccessMessage(`Bulk request #${b.id} cancelled.`);
                            }
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: BAYANIHAN CLEAN-UP DRIVES ================= */}
      {activeSubTab === 'bayanihan_drives' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bayanihanDrives.map((drv) => {
              const isRegistered = myVolunteerRecords.some((v) => v.driveId === drv.id);
              return (
                <div
                  key={drv.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
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
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-md">
                        {drv.currentVolunteers} / {drv.expectedVolunteers} Volunteers
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{drv.title}</h3>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">{drv.purokTarget}</p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{drv.description}</p>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 text-xs border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <p className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Date & Time: <strong>{drv.activityDate}</strong> at {drv.assemblyTime}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>Assembly Point: {drv.assemblyPoint}</span>
                      </p>
                      {drv.equipmentProvided && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50">
                          Equipment: {drv.equipmentProvided.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {isRegistered ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Registered as Volunteer</span>
                      </span>
                    ) : drv.status === 'Completed' ? (
                      <span className="text-xs text-slate-400 font-bold">Activity Concluded</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedDriveForVolunteering(drv)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Users2 className="w-4 h-4" />
                        <span>Join as Bayanihan Volunteer</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* My Volunteer History & Certificate Shelf */}
          {myVolunteerRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    My Bayanihan Volunteer Badges & Certificates ({myVolunteerRecords.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official digital certificates of environmental volunteer service recognized by the Barangay Council.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myVolunteerRecords.map((vol) => (
                  <div
                    key={vol.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{vol.driveTitle}</span>
                      <p className="text-[11px] text-slate-500">
                        Role: <strong>{vol.volunteerRole}</strong> • Registered: {vol.registeredDate}
                      </p>
                      {vol.attendanceVerified ? (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Attendance Verified ({vol.hoursRendered || 4} hrs rendered)
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-600">Pending drive completion</span>
                      )}
                    </div>

                    {vol.attendanceVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVolunteerCert(vol);
                          setIsCertModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Print Certificate</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TAB 4: SUMBONG BASURA ================= */}
      {activeSubTab === 'sumbong_basura' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                My Sumbong Basura & Siga Violation Reports ({myDumpingReports.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Anonymous or citizen-assisted reports for open burning (RA 9003) and canal trash dumping.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSumbongModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Report Siga / Dumping Incident</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            {myDumpingReports.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Waste Violations Reported</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Help keep Barangay Sangkol clean and smoke-free. Report illegal trash burning or canal dumping anytime.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myDumpingReports.map((rep) => (
                  <div key={rep.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-rose-900 dark:text-rose-300 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md">
                          {rep.id}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{rep.violationType}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            rep.severityLevel === 'High / Blocking Waterway'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : rep.severityLevel === 'Medium / Public Nuisance'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {rep.severityLevel}
                        </span>
                      </div>

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
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <strong>Complaint Details:</strong> {rep.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>Location: {rep.exactLocationOrLandmark} ({rep.purok})</span>
                      </span>
                      <span>Filed: {rep.reportedAt}</span>
                    </div>

                    {rep.assignedTanodOrCrew && (
                      <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-sky-600" />
                          <span>Barangay Tanod Response Log</span>
                        </p>
                        <p className="text-[11px]">Assigned Unit: <strong>{rep.assignedTanodOrCrew}</strong></p>
                        {rep.resolutionRemarks && <p className="text-[11px]">Resolution: {rep.resolutionRemarks}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 5: MRF TRASH-TO-RICE & CASH ================= */}
      {activeSubTab === 'mrf_tradein' && (
        <div className="space-y-6">
          {/* Interactive Calculator Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 p-6 rounded-3xl text-white shadow-lg space-y-4 border border-emerald-700/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-400 text-slate-950">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black">Barangay MRF "Trash-to-Rice / Cash" Trade-In Calculator</h3>
                <p className="text-xs text-emerald-200">
                  Calculate the value of your plastic bottles, scrap metals, cartons, and e-waste before dropping off at the Barangay MRF Station.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-emerald-200 mb-1">Select Material Class</label>
                <select
                  value={calcMaterial}
                  onChange={(e) => setCalcMaterial(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/50 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400"
                >
                  {Object.keys(MRF_RATES).map((mat) => (
                    <option key={mat} value={mat}>
                      {mat} (₱{MRF_RATES[mat as MRFRecyclablesDropRecord['itemCategory']].pricePerKg}/kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-200 mb-1">Estimated Weight (in Kilograms)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/50 text-white font-black text-sm focus:ring-2 focus:ring-amber-400 pr-10"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-emerald-300">kg</span>
                </div>
              </div>
            </div>

            {/* Live Calculation Outcomes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-300">Bigas Kapalit (Rice Swap)</span>
                <p className="text-2xl font-black">{estRice} kg</p>
                <p className="text-[11px] text-emerald-200">Well-milled NFA/Barangay Rice</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-300">Cash Payout</span>
                <p className="text-2xl font-black">₱{estCash}</p>
                <p className="text-[11px] text-emerald-200">Instant Cash at MRF window</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <span className="text-[10px] font-black uppercase text-sky-300">Barangay Eco-Points</span>
                <p className="text-2xl font-black">+{estPoints} pts</p>
                <p className="text-[11px] text-emerald-200">Redeemable for groceries/seeds</p>
              </div>
            </div>
          </div>

          {/* My MRF Trade-In Receipts Ledger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Recycle className="w-4 h-4 text-emerald-600" />
                My MRF Drop Receipts & Rice Swap History ({myMRFRecords.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official transaction log of all recyclables you turned in at the Barangay Materials Recovery Facility.
              </p>
            </div>

            {myMRFRecords.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Recycle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No MRF Drop-Offs Logged Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Bring your collected plastic bottles and cartons to the Barangay Hall MRF Shed every Monday to Friday (08:00 AM - 04:00 PM).
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myMRFRecords.map((mrf) => (
                  <div key={mrf.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                          {mrf.id}
                        </span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{mrf.itemCategory}</span>
                        <span className="font-black text-xs text-emerald-700 dark:text-emerald-400">({mrf.weightKg} kg)</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Date: {mrf.loggedDate} • Officer: {mrf.officerInCharge || 'MRF Officer'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                        {mrf.rewardValue} ({mrf.rewardType})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: REQUEST BULK PICKUP ================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Request Bulk Garbage Pickup</h3>
                  <p className="text-xs text-slate-500">Barangay Sangkol Solid Waste Task Force</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestBulkPickup} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Waste Classification *</label>
                <select
                  value={wasteCategory}
                  onChange={(e) => setWasteCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="Tree Branches & Yard Trimmings">Tree Branches & Yard Trimmings (Pruned Foliage)</option>
                  <option value="Broken Monobloc / Discarded Furniture">Broken Furniture / Discarded Timber / Monobloc</option>
                  <option value="Construction Debris & Dry Rubble">Construction Debris & Dry Rubble</option>
                  <option value="Old Scrap Metals & Appliances">Old Scrap Metals & Appliances</option>
                  <option value="Other Bulky Household Waste">Other Bulky Household Waste</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pickup Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="House number, Street, Landmark"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Preferred Pickup Date *</label>
                  <input
                    type="date"
                    required
                    value={preferredPickupDate}
                    onChange={(e) => setPreferredPickupDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Estimated Load Volume</label>
                <select
                  value={estimatedVolume}
                  onChange={(e) => setEstimatedVolume(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="Small (1-2 bundles/bags)">Small (1-2 bundles / small bags)</option>
                  <option value="Medium (Tricycle load)">Medium (Tricycle load / 1 furniture piece)</option>
                  <option value="Large (Truck load)">Large (Truck load / Big tree branches / Renovation debris)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed Description of Items *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. 4 sacks of pruned mango branches and 1 damaged wooden wardrobe cabinet..."
                  value={wasteDescription}
                  onChange={(e) => setWasteDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              {/* Photo Upload Attachment */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Attach Photo of Bulky Waste (Optional)</label>
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <input type="file" accept="image/*" onChange={handleBulkPhotoUpload} className="hidden" />
                  {bulkPhotoData ? (
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Photo Attached Successfully (Click to replace)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Camera className="w-4 h-4" />
                      <span>Upload photo of items for truck crew sizing</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300 space-y-0.5">
                <p className="font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Free Barangay Sanitation Pickup</span>
                </p>
                <p>Please bundle and place waste neatly along the road frontage on the scheduled morning.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Submit Pickup Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: SUMBONG BASURA INCIDENT REPORT ================= */}
      {isSumbongModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">File Sumbong Basura Report</h3>
                  <p className="text-xs text-slate-500">Report Open Burning (Siga) & Illegal Dumpsites</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSumbongModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSumbongSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Violation Category *</label>
                <select
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="Open Burning (Siga / RA 9003 Sec 48)">Open Burning (Siga ng Basura / Dahon / Plastic - RA 9003)</option>
                  <option value="Illegal Dumping in Creek / Estero / Canal">Illegal Dumping in Drainage Canal / Estero / Riverbank</option>
                  <option value="Uncollected Piles / Garbage Overflow">Uncollected Piles / Garbage Overflow (Tambak na Basura)</option>
                  <option value="Littering / Trash Scattering on Roadside">Littering / Trash Scattering on Roadside</option>
                  <option value="Hazardous / Construction Debris Dumping">Hazardous / Chemical / Heavy Construction Debris Dumping</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Purok Location *</label>
                  <select
                    value={sumbongPurok}
                    onChange={(e) => setSumbongPurok(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    <option value="Purok 1 - Mabini">Purok 1 - Mabini</option>
                    <option value="Purok 2 - Rizal">Purok 2 - Rizal</option>
                    <option value="Purok 3 - Bonifacio">Purok 3 - Bonifacio</option>
                    <option value="Purok 4 - Aguinaldo">Purok 4 - Aguinaldo</option>
                    <option value="Purok 5 - Silang">Purok 5 - Silang</option>
                    <option value="Purok 6 - Malvar">Purok 6 - Malvar</option>
                    <option value="Purok 7 - Dagohoy">Purok 7 - Dagohoy</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Severity / Urgency *</label>
                  <select
                    value={severityLevel}
                    onChange={(e) => setSeverityLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold text-rose-800 dark:text-rose-400"
                  >
                    <option value="Standard / Minor Pile">Standard / Minor Pile</option>
                    <option value="Medium / Public Nuisance">Medium / Public Nuisance</option>
                    <option value="High / Blocking Waterway">High / Blocking Waterway or Active Toxic Siga</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Exact Landmark & Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vacant lot behind Mabini Elementary, near water pump..."
                  value={landmarkDescription}
                  onChange={(e) => setLandmarkDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed Incident Narrative *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe what you observed (e.g., neighbor burning plastic sacks causing heavy black smoke)..."
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              {/* Photographic Evidence */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Attach Photo Evidence (Optional)</label>
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <input type="file" accept="image/*" onChange={handleSumbongPhotoUpload} className="hidden" />
                  {sumbongPhotoData ? (
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Photo Attached (Click to change)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Camera className="w-4 h-4" />
                      <span>Click or drag image to attach evidence</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSumbongModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Submit Incident Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: BAYANIHAN VOLUNTEER ROLE SELECTOR ================= */}
      {selectedDriveForVolunteering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Volunteer Registration</h3>
                  <p className="text-xs text-slate-500">{selectedDriveForVolunteering.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDriveForVolunteering(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Select your preferred role for the clean-up activity. Gloves, rakes, boots, and snacks will be provided at the assembly point.
              </p>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Preferred Volunteer Role</label>
                <select
                  value={volunteerRole}
                  onChange={(e) => setVolunteerRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold text-emerald-800 dark:text-emerald-300"
                >
                  <option value="Sweeper / Collector">Sweeper & Debris Collector (Street/Roadside)</option>
                  <option value="Canal Dredger">Canal Dredger (Declogging Team)</option>
                  <option value="Segregation Aide">Segregation Aide (Sack Sorting)</option>
                  <option value="Debris Loader">Debris Loader (Loading to Compactor)</option>
                  <option value="First Aid & Marshall">First Aid & Marshall (Safety/Hydration)</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300">
                <p className="font-bold">✓ Official Bayanihan Certificate Granted</p>
                <p>Complete attendance on {selectedDriveForVolunteering.activityDate} to unlock your verified digital certificate.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDriveForVolunteering(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVolunteer}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Confirm & Join Drive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: PRINTABLE VOLUNTEER CERTIFICATE ================= */}
      {selectedVolunteerCert && (
        <BayanihanCertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          volunteer={selectedVolunteerCert}
        />
      )}
    </div>
  );
};
