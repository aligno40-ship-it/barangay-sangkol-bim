import React from 'react';
import { useBarangay } from '../context/BarangayContext';
import { useCommunityServices } from '../context/CommunityServicesContext';
import { DashboardAnalytics } from '../components/DashboardAnalytics';
import { InfoButton } from '../components/InfoButton';
import {
  Users,
  Home,
  FileCheck2,
  ShieldAlert,
  Store,
  Receipt,
  HeartHandshake,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserPlus,
  PlusCircle,
  Megaphone,
  Sparkles,
  FolderArchive,
  FileText,
  ChevronRight,
  Building2,
  HeartPulse,
  Briefcase,
  HandHeart,
  Trash2,
  GraduationCap,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    settings,
    residents,
    households,
    certificates,
    blotters,
    complaints,
    businesses,
    announcements,
    announcementAttendees,
    appointments,
    transactions,
    setActiveModule,
    setSelectedCertForPrint,
    setTargetRecordId,
  } = useBarangay();

  const {
    reservations,
    consultations,
    medicineRequests,
    jobs,
    jobApplications,
    ayudaWaves,
    wasteRequests,
    programs,
    totalPendingServicesCount,
  } = useCommunityServices();

  const pendingReservationsCount = reservations.filter((r) => r.status === 'Pending Review').length;
  const pendingHealthConsultationsCount = consultations.filter((c) => c.status === 'Pending Triage').length;
  const pendingMedicineRequestsCount = medicineRequests.filter((m) => m.status === 'Pending Approval').length;
  const pendingWasteRequestsCount = wasteRequests.filter((w) => w.status === 'Pending Schedule' || w.status === 'Pickup Scheduled').length;
  const totalBeneficiariesEnrolled = ayudaWaves.reduce((acc, curr) => acc + curr.totalTargetBeneficiaries, 0);

  // Metrics
  const activeResidents = residents.filter((r) => r.residentStatus === 'Active');
  const maleCount = activeResidents.filter((r) => r.sex === 'Male').length;
  const femaleCount = activeResidents.filter((r) => r.sex === 'Female').length;
  const seniorCount = activeResidents.filter((r) => r.isSeniorCitizen).length;
  const pwdCount = activeResidents.filter((r) => r.isPWD).length;
  const fourPsCount = activeResidents.filter((r) => r.is4PsBeneficiary).length;
  const votersCount = activeResidents.filter((r) => r.voterStatus === 'Registered').length;
  const youthCount = activeResidents.filter((r) => r.isYouth).length;

  const totalMonthlyRevenue = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const activeBlotters = blotters.filter((b) => b.status === 'Pending' || b.status === 'Active Investigation');
  const activeComplaints = complaints.filter((c) => c.status === 'Ongoing Mediation' || c.status === 'Open');
  const activeBusinesses = businesses.filter((b) => b.status === 'Active');

  // Purok breakdown
  const purokCounts: { [purok: string]: number } = {};
  (settings?.puroks || []).forEach((p) => (purokCounts[p] = 0));
  activeResidents.forEach((r) => {
    if (purokCounts[r.purok] !== undefined) {
      purokCounts[r.purok]++;
    } else {
      purokCounts[r.purok] = 1;
    }
  });

  const maxPurokCount = Math.max(...Object.values(purokCounts), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Bento Grid Top Section: Featured Hero & Stat Bento Tiles */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Main Hero Bento Card (col-span-12 lg:col-span-5) */}
        <div className="col-span-12 lg:col-span-5 bg-indigo-700 rounded-2xl p-6 sm:p-7 text-white shadow-sm relative overflow-hidden flex flex-col justify-between">
          {/* Subtle decorative circles */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-600/50 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-800/60 rounded-full blur-xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/80 text-indigo-100 border border-indigo-500/50 uppercase tracking-wider">
                Barangay Administration
              </span>
              <span className="text-[11px] text-indigo-200 font-medium">BIMS Online Portal</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">Total Barangay Population</p>
                <InfoButton
                  title="Barangay Registry"
                  info={`${settings.barangayName}, ${settings.municipality}, ${settings.province}. Digital repository for population registry, blotter hearings, and certificate services.`}
                  variant="indigo"
                />
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">{activeResidents.length}</h2>
                <span className="text-sm font-semibold text-indigo-200">Registered Residents</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-4 border-t border-indigo-600/60 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setTargetRecordId('new');
                setActiveModule('residents');
              }}
              className="px-3.5 py-2 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Resident</span>
            </button>
            <button
              onClick={() => setActiveModule('certificates')}
              className="px-3.5 py-2 bg-indigo-800/80 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-500/40 transition-all cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-300" />
              <span>Issue Clearance</span>
            </button>
            <button
              onClick={() => {
                setTargetRecordId('new');
                setActiveModule('blotters');
              }}
              className="px-3.5 py-2 bg-indigo-800/80 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-500/40 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>File Blotter</span>
            </button>
          </div>
        </div>

        {/* 7 Supporting Bento Stat Tiles (col-span-12 lg:col-span-7) */}
        <div className="col-span-12 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Total Households */}
          <div
            onClick={() => setActiveModule('households')}
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Households</span>
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl group-hover:scale-110 transition-transform">
                <Home className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{households.length}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Avg. {(activeResidents.length / (households.length || 1)).toFixed(1)} pax / family
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          {/* Registered Voters */}
          <div
            onClick={() => setActiveModule('residents')}
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Voters (COMELEC)</span>
              <div className="p-2 bg-teal-50 text-teal-700 rounded-xl group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{votersCount}</div>
              <p className="text-[11px] text-teal-700 font-semibold mt-0.5">
                {((votersCount / (activeResidents.length || 1)) * 100).toFixed(1)}% of voting capacity
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.round((votersCount / (activeResidents.length || 1)) * 100))}%` }}
              ></div>
            </div>
          </div>

          {/* Business Registrations (Emerald Bento) */}
          <div
            onClick={() => setActiveModule('businesses')}
            className="bg-emerald-600 text-white rounded-2xl p-4 sm:p-5 shadow-xs hover:bg-emerald-700 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">Active Businesses</span>
              <div className="p-2 bg-emerald-700 text-white rounded-xl group-hover:scale-110 transition-transform">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-white">{activeBusinesses.length}</div>
              <p className="text-[11px] text-emerald-100 mt-0.5">Permitted commercial units</p>
            </div>
            <div className="w-full bg-emerald-800/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-white h-full rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>

          {/* Certificates Issued */}
          <div
            onClick={() => setActiveModule('certificates')}
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Certificates</span>
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl group-hover:scale-110 transition-transform">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{certificates.length}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Revenue: <strong className="text-emerald-700 font-bold">₱{totalMonthlyRevenue.toLocaleString()}</strong></p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>

          {/* Indigents & 4Ps (Indigo Soft Bento) */}
          <div
            onClick={() => setActiveModule('residents')}
            className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">4Ps & Indigents</span>
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-indigo-950">{fourPsCount}</div>
              <p className="text-[11px] text-indigo-700 font-medium mt-0.5">DSWD Program Beneficiaries</p>
            </div>
            <div className="w-full bg-indigo-200/70 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '50%' }}></div>
            </div>
          </div>

          {/* Active Blotter / Complaints */}
          <div
            onClick={() => setActiveModule('blotters')}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Blotter & Lupon</span>
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-amber-950">
                {activeBlotters.length + activeComplaints.length}
              </div>
              <p className="text-[11px] text-amber-800 font-medium mt-0.5">Pending Mediation</p>
            </div>
            <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-600 h-full rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Quick Actions & Common Administrative Tasks
            </h3>
            <InfoButton
              title="Quick Administrative Actions"
              info="One-click triggers for clearance processing, civil registration, and official archives."
              variant="light"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => setActiveModule('certificates')}
            className="p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div className="p-2 bg-emerald-600 text-white rounded-lg w-fit group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-emerald-950">Issue Clearance</h4>
              <p className="text-[10px] text-emerald-800/80 mt-0.5">Certificates & Permits</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('documents')}
            className="p-3 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div className="p-2 bg-indigo-600 text-white rounded-lg w-fit group-hover:scale-105 transition-transform">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-indigo-950">View Documents</h4>
              <p className="text-[10px] text-indigo-800/80 mt-0.5">Ordinances & Legal Archive</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('residents')}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div className="p-2 bg-slate-800 text-white rounded-lg w-fit group-hover:scale-105 transition-transform">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-slate-900">Civil Registry</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Register / Lookup Resident</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('announcements')}
            className="p-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div className="p-2 bg-amber-600 text-white rounded-lg w-fit group-hover:scale-105 transition-transform">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-amber-950">Announcements</h4>
              <p className="text-[10px] text-amber-800/80 mt-0.5">Post Public Advisory</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('appointments')}
            className="p-3 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div className="p-2 bg-purple-600 text-white rounded-lg w-fit group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-purple-950">Appointments</h4>
              <p className="text-[10px] text-purple-800/80 mt-0.5">Hearings & Calendar</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetRecordId('new');
              setActiveModule('blotters');
            }}
            className="p-3 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div className="p-2 bg-rose-600 text-white rounded-lg w-fit group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-rose-950">File Blotter</h4>
              <p className="text-[10px] text-rose-800/80 mt-0.5">Incident & Mediation</p>
            </div>
          </button>
        </div>
      </div>

      {/* Frontline & Community Services Authority Hub */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-400/30 text-indigo-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold tracking-tight">Frontline Community & Public Desks Authority</h3>
                {totalPendingServicesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold">
                    {totalPendingServicesCount} Pending Action
                  </span>
                )}
                <InfoButton
                  title="Frontline Public Desks Authority"
                  info="Centralized Barangay Hall administrative supervision: Venue reservations, Health Clinic, Trabaho postings, Ayuda disbursements & Solid Waste management."
                  variant="dark"
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveModule('community_services')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-900/30 shrink-0 cursor-pointer"
          >
            <span>Open Community Desks Manager</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5">
          <div
            onClick={() => setActiveModule('community_services')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium">Reservations</span>
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white">{reservations.length}</div>
              <p className="text-[10px] text-blue-300 font-semibold">{pendingReservationsCount} pending approval</p>
            </div>
          </div>

          <div
            onClick={() => setActiveModule('community_services')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium">Health Clinic</span>
              <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white">{consultations.length + medicineRequests.length}</div>
              <p className="text-[10px] text-emerald-300 font-semibold">{pendingHealthConsultationsCount + pendingMedicineRequestsCount} in triage</p>
            </div>
          </div>

          <div
            onClick={() => setActiveModule('community_services')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium">Trabaho Desk</span>
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white">{jobs.length} Jobs</div>
              <p className="text-[10px] text-amber-300 font-semibold">{jobApplications.length} applications</p>
            </div>
          </div>

          <div
            onClick={() => setActiveModule('community_services')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium">Ayuda Relief</span>
              <HandHeart className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white">{ayudaWaves.length} Programs</div>
              <p className="text-[10px] text-rose-300 font-semibold">{totalBeneficiariesEnrolled} target pax</p>
            </div>
          </div>

          <div
            onClick={() => setActiveModule('community_services')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium">Solid Waste</span>
              <Trash2 className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white">{wasteRequests.length}</div>
              <p className="text-[10px] text-teal-300 font-semibold">{pendingWasteRequestsCount} pending / sched</p>
            </div>
          </div>

          <div
            onClick={() => setActiveModule('community_services')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium">SK & Seniors</span>
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white">{programs.length}</div>
              <p className="text-[10px] text-purple-300 font-semibold">Active initiatives</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barangay Intelligence & Analytics Hub */}
      <DashboardAnalytics />

      {/* Bottom Bento Row: Certificates Queue & Upcoming Schedule */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Recent Issued Certificates Bento Card (col-span-12 lg:col-span-6) */}
        <div className="col-span-12 lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>Recent Certificates Issued</span>
            </h3>
            <button
              onClick={() => setActiveModule('certificates')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {certificates.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200/80 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{c.residentName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-500 font-mono border border-slate-200">
                      {c.controlNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-700 font-medium">{c.type}</p>
                  <p className="text-[10px] text-slate-500">Purpose: {c.purpose}</p>
                </div>

                <button
                  onClick={() => setSelectedCertForPrint(c)}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  Print
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Barangay Calendar (col-span-12 lg:col-span-6) */}
        <div className="col-span-12 lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Upcoming Barangay Calendar</h3>
                <InfoButton
                  title="Calendar & Hearings"
                  info="Hearings, health sessions & captain appointments."
                  variant="light"
                />
              </div>
              <button
                onClick={() => setActiveModule('appointments')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2 mt-3">
              {appointments.slice(0, 3).map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => setActiveModule('appointments')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">{apt.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                      {apt.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{apt.date} • {apt.location}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveModule('appointments')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View All Barangay Schedules</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Community Bulletin & Advisories Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Community Bulletin & Attendance Rosters
            </h3>
          </div>
          <button
            onClick={() => setActiveModule('announcements')}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>View All & Rosters</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {announcements.slice(0, 3).map((a) => {
            const attendees = announcementAttendees.filter((att) => att.announcementId === a.id);
            const presentCount = attendees.filter(
              (att) => att.attendanceStatus === 'Present / Attended' || att.attendanceStatus === 'Walk-In'
            ).length;

            return (
              <div
                key={a.id}
                onClick={() => setActiveModule('announcements')}
                className="p-4 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200/80 space-y-2 flex flex-col justify-between cursor-pointer transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 gap-1">
                    <span className="font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {a.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold shrink-0">
                      {a.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{a.content}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-[10px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Audience: <strong>{a.targetAudience}</strong></span>
                    <span>{a.publishDate}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-slate-200/60 text-slate-700 font-semibold">
                    <span className="text-indigo-600 font-bold">
                      👥 {attendees.length} Registered
                    </span>
                    <span className="text-emerald-700 font-bold">
                      ✓ {presentCount} Present
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
