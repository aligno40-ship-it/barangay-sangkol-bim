import React, { useState } from 'react';
import { useBarangay, ActiveModule } from '../context/BarangayContext';
import { useCommunityServices } from '../context/CommunityServicesContext';
import { ResidentPortalTab } from '../types';
import { UserProfilePhotoModal } from './UserProfilePhotoModal';
import {
  LayoutDashboard,
  Users,
  Home,
  Award,
  FileCheck2,
  ShieldAlert,
  Scale,
  Store,
  Building2,
  Megaphone,
  CalendarDays,
  FileText,
  BarChart3,
  Receipt,
  History,
  Settings,
  ChevronRight,
  UserCheck,
  Globe,
  Landmark,
  PhoneCall,
  LogOut,
  ShieldCheck,
  UserCog,
  Camera,
  Map,
  MapPin,
  GraduationCap,
  Newspaper,
  Archive,
  HeartPulse,
  Briefcase,
  Gift,
  Trash2,
  Trophy,
  AlertTriangle,
} from 'lucide-react';

interface NavItem {
  id: ActiveModule;
  residentTab?: ResidentPortalTab;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const Sidebar: React.FC<{
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onItemClick?: () => void;
  onOpenLogoutModal?: () => void;
  onOpenLoginModal?: () => void;
}> = ({
  isMobileOpen = false,
  onCloseMobile,
  onItemClick,
  onOpenLogoutModal,
  onOpenLoginModal,
}) => {
  const {
    activeModule,
    setActiveModule,
    residentTab,
    setResidentTab,
    residents,
    households,
    certificates,
    blotters,
    complaints,
    businesses,
    announcements,
    activities,
    appointments,
    concerns,
    currentUser,
    users,
    transactions,
  } = useBarangay();

  const {
    facilityReservations,
    equipmentReservations,
    healthAppointments,
    medicineRefillRequests,
    jobApplications,
    livelihoodEnrollments,
    livelihoodAssistanceRequests,
    ayudaClaims,
    financialAssistanceRequests,
    bulkWasteRequests,
    cleanUpVolunteers,
    skRegistrations,
    assistiveDeviceRequests,
    totalPendingServicesCount,
    pendingLivelihoodAssistanceCount,
  } = useCommunityServices();

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const isResident = currentUser.role === 'Resident';

  const pendingBlottersCount = blotters.filter((b) => b.status === 'Pending' || b.status === 'Active Investigation').length;
  const ongoingComplaintsCount = complaints.filter((c) => c.status === 'Ongoing Mediation' || c.status === 'Open').length;
  const activeBusinessesCount = businesses.filter((b) => b.status === 'Active').length;
  const scheduledAppointmentsCount = appointments.filter((a) => a.status === 'Scheduled').length;
  const upcomingActivitiesCount = activities.filter((a) => a.status === 'Upcoming').length;

  // Resident-specific counts
  const userCertificatesCount = certificates.filter(
    (c) =>
      (c.residentId === currentUser.residentId ||
        c.residentName?.toLowerCase() === currentUser.name?.toLowerCase()) &&
      (c.status === 'Issued' || c.status === 'Approved' || c.status === 'Pending')
  ).length;

  const userConcernsCount = (concerns || []).filter(
    (c) =>
      c.residentId === currentUser.residentId ||
      c.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
  ).length;

  const userFacilitiesCount =
    (facilityReservations || []).filter(
      (f) =>
        f.reservedByResidentId === currentUser.residentId ||
        f.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
    ).length +
    (equipmentReservations || []).filter(
      (e) =>
        e.reservedByResidentId === currentUser.residentId ||
        e.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
    ).length;

  const userHealthCount =
    (healthAppointments || []).filter(
      (h) =>
        h.residentId === currentUser.residentId ||
        h.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
    ).length +
    (medicineRefillRequests || []).filter(
      (m) =>
        m.residentId === currentUser.residentId ||
        m.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
    ).length;

  const userTrabahoCount =
    (jobApplications || []).filter(
      (j) =>
        j.residentId === currentUser.residentId ||
        j.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
    ).length +
    (livelihoodEnrollments || []).filter(
      (l) =>
        l.residentId === currentUser.residentId ||
        l.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
    ).length;

  const userAyudaCount =
    (ayudaClaims || []).filter(
      (a) =>
        a.residentId === currentUser.residentId ||
        a.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
    ).length +
    (financialAssistanceRequests || []).filter(
      (f) =>
        f.residentId === currentUser.residentId ||
        f.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
    ).length;

  const userWasteCount =
    (bulkWasteRequests || []).filter(
      (b) =>
        b.residentId === currentUser.residentId ||
        b.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
    ).length +
    (cleanUpVolunteers || []).filter(
      (v) =>
        v.residentId === currentUser.residentId ||
        v.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
    ).length;

  const userYouthSeniorCount =
    (skRegistrations || []).filter(
      (s) =>
        s.residentId === currentUser.residentId ||
        s.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
    ).length +
    (assistiveDeviceRequests || []).filter(
      (a) =>
        a.residentId === currentUser.residentId ||
        a.residentName?.toLowerCase() === currentUser.name?.toLowerCase()
    ).length;

  const userBlottersCount = (blotters || []).filter(
    (b) =>
      b.complainantResidentId === currentUser.residentId ||
      b.respondentResidentId === currentUser.residentId ||
      b.complainantName?.toLowerCase() === currentUser.name?.toLowerCase() ||
      b.respondentName?.toLowerCase() === currentUser.name?.toLowerCase()
  ).length;

  const userReceiptsCount = (transactions || []).filter(
    (t) =>
      t.payorName?.toLowerCase() === currentUser.name?.toLowerCase() ||
      (currentUser.residentId && t.remarks?.includes(currentUser.residentId))
  ).length;

  const residentNavGroups: NavGroup[] = [
    {
      groupName: 'CITIZEN PORTAL',
      items: [
        {
          id: 'resident_portal',
          residentTab: 'overview',
          label: 'Newsfeed & Activities',
          icon: Newspaper,
        },
        {
          id: 'resident_portal',
          residentTab: 'profile',
          label: 'Civil Profile & ID',
          icon: UserCheck,
        },
      ],
    },
    {
      groupName: 'CITIZEN E-SERVICES',
      items: [
        {
          id: 'resident_portal',
          residentTab: 'requests',
          label: 'Certificate Requests',
          icon: FileCheck2,
          badge: userCertificatesCount > 0 ? userCertificatesCount : undefined,
          badgeColor: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
        },
        {
          id: 'resident_portal',
          residentTab: 'concerns',
          label: 'Citizen Helpdesk',
          icon: AlertTriangle,
          badge: userConcernsCount > 0 ? userConcernsCount : undefined,
          badgeColor: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700',
        },
        {
          id: 'resident_portal',
          residentTab: 'archive',
          label: 'Certificate Archive',
          icon: Archive,
        },
        {
          id: 'resident_portal',
          residentTab: 'transactions',
          label: 'Official Receipts',
          icon: Receipt,
          badge: userReceiptsCount > 0 ? userReceiptsCount : undefined,
          badgeColor: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
        },
      ],
    },
    {
      groupName: 'COMMUNITY SERVICES',
      items: [
        {
          id: 'resident_portal',
          residentTab: 'facilities',
          label: 'Venues & Equipment',
          icon: Building2,
          badge: userFacilitiesCount > 0 ? userFacilitiesCount : undefined,
          badgeColor: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
        },
        {
          id: 'resident_portal',
          residentTab: 'health',
          label: 'Health Desk',
          icon: HeartPulse,
          badge: userHealthCount > 0 ? userHealthCount : undefined,
          badgeColor: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-700',
        },
        {
          id: 'resident_portal',
          residentTab: 'trabaho',
          label: 'Trabaho & Livelihood',
          icon: Briefcase,
          badge: userTrabahoCount > 0 ? userTrabahoCount : undefined,
          badgeColor: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-700',
        },
        {
          id: 'resident_portal',
          residentTab: 'ayuda',
          label: 'Ayuda & Relief',
          icon: Gift,
          badge: userAyudaCount > 0 ? userAyudaCount : undefined,
          badgeColor: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700',
        },
        {
          id: 'resident_portal',
          residentTab: 'youth_senior',
          label: 'SK & Senior Hub',
          icon: Trophy,
          badge: userYouthSeniorCount > 0 ? userYouthSeniorCount : undefined,
          badgeColor: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700',
        },
        {
          id: 'resident_portal',
          residentTab: 'waste',
          label: 'Waste & Bayanihan',
          icon: Trash2,
          badge: userWasteCount > 0 ? userWasteCount : undefined,
          badgeColor: 'bg-lime-100 dark:bg-lime-900/60 text-lime-800 dark:text-lime-300 border-lime-200 dark:border-lime-700',
        },
        {
          id: 'resident_portal',
          residentTab: 'blotter',
          label: 'Blotter & Lupon',
          icon: ShieldAlert,
          badge: userBlottersCount > 0 ? userBlottersCount : undefined,
          badgeColor: 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
        },
      ],
    },
    {
      groupName: 'PUBLIC INFORMATION',
      items: [
        {
          id: 'announcements',
          label: 'Announcements & Advisories',
          icon: Megaphone,
          badge: announcements.filter((a) => a.status === 'Active').length,
          badgeColor: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700',
        },
        {
          id: 'activities',
          label: 'Activities & Events',
          icon: CalendarDays,
          badge: upcomingActivitiesCount > 0 ? upcomingActivitiesCount : undefined,
          badgeColor: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
        },
        {
          id: 'officials',
          label: 'Officials Directory',
          icon: Award,
        },
        {
          id: 'documents',
          label: 'Public Ordinances & Records',
          icon: FileText,
        },
        {
          id: 'barangay_map',
          label: 'Interactive Barangay Map',
          icon: Map,
        },
      ],
    },
    {
      groupName: 'ACCOUNT & SYSTEM',
      items: [
        {
          id: 'resident_portal',
          residentTab: 'settings',
          label: 'Settings',
          icon: Settings,
        },
        {
          id: 'landing',
          label: 'Public Landing Page',
          icon: Landmark,
        },
      ],
    },
  ];

  const adminNavGroups: NavGroup[] = [
    {
      groupName: 'OVERVIEW & PORTALS',
      items: [
        {
          id: 'dashboard',
          label: 'BIMS Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'landing',
          label: 'Public Landing Page',
          icon: Landmark,
        },
        {
          id: 'resident_portal',
          label: 'Resident Portal View',
          icon: Globe,
        },
      ],
    },
    {
      groupName: 'COMMUNITY & REGISTRY',
      items: [
        {
          id: 'residents',
          label: 'Resident Management',
          icon: Users,
          badge: residents.filter((r) => r.residentStatus === 'Active').length,
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        },
        {
          id: 'households',
          label: 'Household Records',
          icon: Home,
          badge: households.length,
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        },
        {
          id: 'officials',
          label: 'Officials & Staff',
          icon: Award,
        },
        {
          id: 'barangay_map',
          label: 'Barangay Map & Puroks',
          icon: Map,
        },
      ],
    },
    {
      groupName: 'FRONTLINE SERVICES',
      items: [
        {
          id: 'certificates',
          label: 'Certificates & Clearances',
          icon: FileCheck2,
          badge: certificates.length,
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        },
        {
          id: 'blotters',
          label: 'Blotter & Incidents',
          icon: ShieldAlert,
          badge: pendingBlottersCount > 0 ? `${pendingBlottersCount} Active` : undefined,
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        },
        {
          id: 'complaints',
          label: 'Lupon & Complaints',
          icon: Scale,
          badge: ongoingComplaintsCount > 0 ? `${ongoingComplaintsCount} Open` : undefined,
          badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
        },
        {
          id: 'businesses',
          label: 'Business Registrations',
          icon: Store,
          badge: activeBusinessesCount,
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        },
        {
          id: 'community_services',
          label: 'Community & Frontline Desks',
          icon: Building2,
          badge: totalPendingServicesCount > 0 ? `${totalPendingServicesCount} Pending` : undefined,
          badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
        },
        {
          id: 'community_livelihood',
          label: 'Livelihood & Skills Hub',
          icon: GraduationCap,
          badge: pendingLivelihoodAssistanceCount > 0 ? `${pendingLivelihoodAssistanceCount} New` : undefined,
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        },
      ],
    },
    {
      groupName: 'GOVERNANCE & PUBLIC AFFAIRS',
      items: [
        {
          id: 'announcements',
          label: 'Announcements & Advisories',
          icon: Megaphone,
          badge: announcements.filter((a) => a.status === 'Active').length,
        },
        {
          id: 'activities',
          label: 'Barangay Activities & Events',
          icon: CalendarDays,
          badge: upcomingActivitiesCount > 0 ? upcomingActivitiesCount : undefined,
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        },
        {
          id: 'appointments',
          label: 'Appointments & Hearings',
          icon: CalendarDays,
          badge: scheduledAppointmentsCount > 0 ? scheduledAppointmentsCount : undefined,
          badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
        },
        {
          id: 'documents',
          label: 'Ordinances & Documents',
          icon: FileText,
        },
      ],
    },
    {
      groupName: 'ANALYTICS & FINANCES',
      items: [
        {
          id: 'reports',
          label: 'Reports & Statistics',
          icon: BarChart3,
        },
        {
          id: 'transactions',
          label: 'Financial & OR Records',
          icon: Receipt,
        },
      ],
    },
    {
      groupName: 'SYSTEM & SECURITY',
      items: [
        {
          id: 'users',
          label: 'Manage Users & Access',
          icon: UserCog,
          badge: users.length,
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        },
        {
          id: 'audit_trail',
          label: 'Audit Trail & Logs',
          icon: History,
        },
        {
          id: 'settings',
          label: 'Backup & Settings',
          icon: Settings,
        },
      ],
    },
  ];

  const activeGroups = isResident ? residentNavGroups : adminNavGroups;

  const handleSelectModule = (id: ActiveModule, resTab?: ResidentPortalTab) => {
    setActiveModule(id);
    if (resTab) {
      setResidentTab(resTab);
    } else if (id === 'resident_portal' && !resTab) {
      setResidentTab('overview');
    }
    if (onCloseMobile) onCloseMobile();
    if (onItemClick) onItemClick();
  };

  return (
    <aside
      className={`sidebar-nav bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-full flex flex-col justify-between transition-all duration-300 ${
        isMobileOpen ? 'fixed inset-y-0 left-0 z-50 shadow-2xl p-4' : 'flex'
      }`}
    >
      {/* Resident Mode Indicator Chip if applicable */}
      {isResident && (
        <div className="mb-3 p-3 bg-gradient-to-r from-emerald-50 to-indigo-50 dark:from-emerald-950/40 dark:to-indigo-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-tight">Resident Citizen View</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-tight">
            Logged in as <strong className="text-slate-900 dark:text-slate-200">{currentUser.name}</strong> ({currentUser.purok || 'Purok Lumboy'})
          </p>
        </div>
      )}

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto py-1 px-1 space-y-5 custom-scrollbar">
        {activeGroups.map((group) => (
          <div key={group.groupName} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.groupName}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  isResident && item.residentTab
                    ? activeModule === item.id && residentTab === item.residentTab
                    : isResident && item.id === 'resident_portal' && !item.residentTab
                    ? activeModule === 'resident_portal' && (residentTab === 'overview' || !residentTab)
                    : activeModule === item.id;
                return (
                  <button
                    key={`${item.id}-${item.residentTab || ''}`}
                    onClick={() => handleSelectModule(item.id, item.residentTab)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full border font-bold ${
                            isActive
                              ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700'
                              : item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {!isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Session & Logout Controls */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div
          onClick={() => setIsPhotoModalOpen(true)}
          className="p-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/90 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl cursor-pointer transition-colors group"
          title="Click to view or change your profile picture"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-xs">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center text-white font-bold text-xs ${
                    isResident ? 'bg-emerald-600' : 'bg-indigo-600'
                  }`}
                >
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {currentUser.name}
              </p>
              <p
                className={`text-[10px] font-semibold truncate leading-tight flex items-center gap-1 ${
                  isResident ? 'text-emerald-700 dark:text-emerald-400' : 'text-indigo-700 dark:text-indigo-400'
                }`}
              >
                <span>{currentUser.role}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">• Edit photo</span>
              </p>
            </div>
          </div>
        </div>

        <div>
          <button
            type="button"
            id="sidebar-logout-btn"
            onClick={() => {
              if (onItemClick) onItemClick();
              if (onOpenLogoutModal) {
                onOpenLogoutModal();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Log Out of System"
          >
            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Log Out</span>
          </button>
        </div>

        {/* Footer / System Status */}
        <div className="flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">BIMS</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">6 Puroks Active</span>
          </div>
        </div>
      </div>

      {/* Profile Photo Modal */}
      <UserProfilePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        targetUser={currentUser}
      />
    </aside>
  );
};
