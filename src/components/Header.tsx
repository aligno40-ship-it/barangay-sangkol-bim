import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useBarangay, ActiveModule } from '../context/BarangayContext';
import { BarangaySangkolSeal, RepublicSeal } from './OfficialSeals';
import { UserProfilePhotoModal } from './UserProfilePhotoModal';
import { RecentSearchesInput } from './RecentSearchesInput';
import {
  Search,
  Bell,
  Download,
  Shield,
  UserCheck,
  FileCheck2,
  FileText,
  Building2,
  Clock,
  LogIn,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  UserCog,
  Camera,
  User,
  Receipt,
  Printer,
  ExternalLink,
  Check,
  CheckCheck,
  RotateCcw,
  Trash2,
  Filter,
  X,
  ShieldAlert,
  Users,
  Calendar,
  Layers,
  Sparkles,
  Radio,
  Smartphone,
  Mail,
  Send,
  MessageSquare,
  HeartPulse,
  Briefcase,
  Gift,
  Truck,
  Trophy,
  Package,
} from 'lucide-react';
import { UserRole, SystemNotification, NotificationCategory } from '../types';
import { useCommunityServices } from '../context/CommunityServicesContext';

export const Header: React.FC<{ onOpenLoginModal: () => void }> = ({ onOpenLoginModal }) => {
  const {
    settings,
    currentUser,
    switchRole,
    globalSearch,
    setGlobalSearch,
    exportDatabaseJSON,
    notifications,
    unreadNotifCount,
    unreadTransactionCount,
    markNotificationAsRead,
    markNotificationAsUnread,
    markAllNotificationsAsRead,
    markAllNotificationsAsUnread,
    clearNotification,
    clearAllNotifications,
    setActiveModule,
    setSelectedCertForPrint,
    setSelectedReceiptForPrint,
    setTargetCertificateId,
    setTargetRecordId,
    setTargetUserId,
    certificates,
    transactions,
    smsAlerts,
    smsGatewaySettings,
    setIsSMSDispatchModalOpen,
  } = useBarangay();

  const {
    communityNotifications,
    setActiveServiceDeskTab,
    setTargetServiceId,
  } = useCommunityServices();

  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [notifCategoryFilter, setNotifCategoryFilter] = useState<'all' | 'financial' | 'certificate' | 'services' | 'registration' | 'cases' | 'activity' | 'sms_alert'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notifSearch, setNotifSearch] = useState('');

  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Combined notifications from core Barangay and Community Services
  const allNotifications = useMemo(() => {
    const combined = [...(notifications || []), ...(communityNotifications || [])];
    const map = new Map<string, SystemNotification>();
    combined.forEach((n) => {
      if (!map.has(n.id)) {
        map.set(n.id, n);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [notifications, communityNotifications]);

  const totalUnreadCount = useMemo(() => {
    return allNotifications.filter((n) => !n.read).length;
  }, [allNotifications]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    if (showNotifMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifMenu]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((n) => {
      // Unread filter
      if (unreadOnly && n.read) return false;

      // Category filter
      if (notifCategoryFilter === 'financial' && n.category !== 'financial') return false;
      if (notifCategoryFilter === 'certificate' && n.category !== 'certificate') return false;
      if (notifCategoryFilter === 'services' && n.category !== 'services') return false;
      if (notifCategoryFilter === 'registration' && n.category !== 'registration') return false;
      if (notifCategoryFilter === 'cases' && n.category !== 'blotter' && n.category !== 'complaint' && n.category !== 'concern') return false;
      if (notifCategoryFilter === 'activity' && n.category !== 'activity' && n.category !== 'appointment') return false;

      // Search filter
      if (notifSearch.trim()) {
        const q = notifSearch.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchMsg = n.message.toLowerCase().includes(q);
        const matchOr = n.orNumber && n.orNumber.toLowerCase().includes(q);
        const matchCtrl = n.controlNumber && n.controlNumber.toLowerCase().includes(q);
        const matchPayor = n.payorName && n.payorName.toLowerCase().includes(q);
        const matchRes = n.residentName && n.residentName.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg && !matchOr && !matchCtrl && !matchPayor && !matchRes) {
          return false;
        }
      }

      return true;
    });
  }, [allNotifications, unreadOnly, notifCategoryFilter, notifSearch]);

  // Counts by category
  const financialCount = useMemo(() => allNotifications.filter((n) => n.category === 'financial').length, [allNotifications]);
  const certCount = useMemo(() => allNotifications.filter((n) => n.category === 'certificate').length, [allNotifications]);
  const servicesCount = useMemo(() => allNotifications.filter((n) => n.category === 'services').length, [allNotifications]);
  const kycCount = useMemo(() => allNotifications.filter((n) => n.category === 'registration').length, [allNotifications]);
  const casesCount = useMemo(() => allNotifications.filter((n) => n.category === 'blotter' || n.category === 'complaint' || n.category === 'concern').length, [allNotifications]);
  const activityCount = useMemo(() => allNotifications.filter((n) => n.category === 'activity' || n.category === 'appointment').length, [allNotifications]);

  const handleNotificationClick = (notif: SystemNotification) => {
    markNotificationAsRead(notif.id);
    setShowNotifMenu(false);

    // 1. Community Services Desk (Facilities, Health, Trabaho, Ayuda, Waste, Youth & Senior)
    if (notif.category === 'services' || notif.linkModule === 'community_services' || notif.id.startsWith('notif-cs-')) {
      if (notif.targetRecordId) {
        setTargetRecordId(notif.targetRecordId);
        setTargetServiceId(notif.targetRecordId);
      }
      
      // Select corresponding service desk tab based on notification identifier
      if (notif.id.includes('-fac-') || notif.id.includes('-eqp-')) {
        setActiveServiceDeskTab('facilities');
      } else if (notif.id.includes('-hlth-') || notif.id.includes('-med-') || notif.id.includes('-imm-') || notif.id.includes('-msn-')) {
        setActiveServiceDeskTab('health');
      } else if (notif.id.includes('-job-') || notif.id.includes('-trn-') || notif.id.includes('-liv-') || notif.id.includes('-jobopen-')) {
        setActiveServiceDeskTab('trabaho');
      } else if (notif.id.includes('-ayu-') || notif.id.includes('-aics-')) {
        setActiveServiceDeskTab('ayuda');
      } else if (notif.id.includes('-bulk-') || notif.id.includes('-vol-') || notif.id.includes('-dump-') || notif.id.includes('-drive-')) {
        setActiveServiceDeskTab('solidwaste');
      } else if (notif.id.includes('-sk-') || notif.id.includes('-ast-') || notif.id.includes('-seniorben-') || notif.id.includes('-sktourney-')) {
        setActiveServiceDeskTab('youth_senior');
      }

      if (currentUser.role === 'Resident') {
        setActiveModule('resident_portal');
      } else {
        setActiveModule('community_services');
      }
      return;
    }

    // 2. Certificate Notification (Incoming request, issued, pending review, etc.)
    if (notif.category === 'certificate' || notif.certificateId || notif.controlNumber) {
      const cert = certificates.find((c) => c.id === notif.certificateId || c.controlNumber === notif.controlNumber);
      const targetId = cert ? cert.id : (notif.certificateId || notif.controlNumber || null);
      if (targetId) {
        setTargetCertificateId(targetId);
      }
      if (currentUser.role === 'Resident') {
        setActiveModule('resident_portal');
      } else {
        setActiveModule('certificates');
      }
      return;
    }

    // 3. Financial Transaction / Official Receipt
    if (notif.category === 'financial' || notif.transactionId || notif.orNumber) {
      const tx = transactions.find((t) => t.id === notif.transactionId || t.orNumber === notif.orNumber);
      if (tx) {
        setSelectedReceiptForPrint(tx);
        setTargetRecordId(tx.id);
      }
      if (currentUser.role === 'Resident') {
        setActiveModule('resident_portal');
      } else {
        setActiveModule('transactions');
      }
      return;
    }

    // 4. KYC Resident User Registration
    if (notif.category === 'registration' || notif.targetUserId) {
      if (notif.targetUserId) {
        setTargetUserId(notif.targetUserId);
      }
      setActiveModule('users');
      return;
    }

    // 5. Blotter Case Record
    if (notif.category === 'blotter') {
      if (notif.targetRecordId) {
        setTargetRecordId(notif.targetRecordId);
      }
      if (currentUser.role === 'Resident') {
        setActiveModule('resident_portal');
      } else {
        setActiveModule('blotters');
      }
      return;
    }

    // 6. Citizen Concern or Lupon / KP Case
    if (notif.category === 'concern' || notif.category === 'complaint') {
      if (notif.targetRecordId) {
        setTargetRecordId(notif.targetRecordId);
      }
      if (currentUser.role === 'Resident') {
        setActiveModule('resident_portal');
      } else {
        setActiveModule('complaints');
      }
      return;
    }

    // 7. Citizen Appointment Schedule
    if (notif.category === 'appointment') {
      if (notif.targetRecordId) {
        setTargetRecordId(notif.targetRecordId);
      }
      if (currentUser.role === 'Resident') {
        setActiveModule('resident_portal');
      } else {
        setActiveModule('appointments');
      }
      return;
    }

    // 8. Community Activity / Attendance
    if (notif.category === 'activity') {
      if (notif.targetRecordId) {
        setTargetRecordId(notif.targetRecordId);
      }
      if (currentUser.role === 'Resident') {
        setActiveModule('resident_portal');
      } else {
        setActiveModule('activities');
      }
      return;
    }

    // Fallback: Link module navigation
    if (notif.linkModule) {
      setActiveModule(notif.linkModule as any);
    } else if (currentUser.role === 'Resident') {
      setActiveModule('resident_portal');
    }
  };

  const handlePrintReceiptDirect = (e: React.MouseEvent, notif: SystemNotification) => {
    e.stopPropagation();
    markNotificationAsRead(notif.id);
    const tx = transactions.find((t) => t.id === notif.transactionId || t.orNumber === notif.orNumber);
    if (tx) {
      setSelectedReceiptForPrint(tx);
    } else {
      setActiveModule('transactions');
    }
  };

  const handlePrintCertDirect = (e: React.MouseEvent, notif: SystemNotification) => {
    e.stopPropagation();
    markNotificationAsRead(notif.id);
    const cert = certificates.find((c) => c.id === notif.certificateId || c.controlNumber === notif.controlNumber);
    if (cert && (cert.status === 'Issued' || cert.status === 'Approved')) {
      setSelectedCertForPrint(cert);
    } else {
      setActiveModule('certificates');
    }
  };

  const roles: UserRole[] = ['Administrator', 'Barangay Staff', 'Barangay Official'];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand & Seals */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveModule(currentUser.role === 'Resident' ? 'resident_portal' : 'dashboard')}>
            <RepublicSeal size={48} className="drop-shadow-md hidden sm:block" />
            <BarangaySangkolSeal size={52} className="drop-shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  Official LGU Portal
                </span>
                <span className="text-xs text-slate-400 hidden md:inline-block">
                  {settings.municipality}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                <span className="text-emerald-400">{settings.barangayName}</span>
                <span className="font-light text-slate-300 hidden sm:inline">BIMS</span>
              </h1>
              <p className="text-xs text-slate-400 hidden lg:block">
                Barangay Information Management System
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <RecentSearchesInput
              value={globalSearch}
              onChange={setGlobalSearch}
              onSearchSubmit={(q) => {
                if (q.trim()) {
                  setActiveModule('residents');
                }
              }}
              placeholder="Search resident, household, certificate, blotter, OR#..."
              storageKey="global"
              theme="dark"
              inputClassName="w-full pl-10 pr-8 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Clock & Action Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Clock */}
            <div className="hidden xl:flex flex-col text-right pr-3 border-r border-slate-800">
              <div className="flex items-center justify-end gap-1.5 text-xs text-emerald-400 font-mono font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{time}</span>
              </div>
              <span className="text-[11px] text-slate-400">{dateStr}</span>
            </div>

            {/* Gmail & Citizen Alert Dispatch Center Launcher */}
            <button
              onClick={() => setIsSMSDispatchModalOpen(true)}
              title="Open Gmail & Citizen Alert Dispatch Center (Certificate ready notices, summons, official advisories)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-linear-to-r from-rose-700/90 to-red-600 hover:from-rose-600 hover:to-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-950/40 border border-rose-400/30 cursor-pointer active:scale-95 group shrink-0"
            >
              <Mail className="w-3.5 h-3.5 text-rose-200" />
              <span className="hidden sm:inline">Gmail Alerts</span>
              <span className="inline sm:hidden">Gmail</span>
              <span className="text-[10px] bg-rose-950/80 text-rose-200 border border-rose-400/40 px-1.5 py-0.2 rounded-full font-mono font-black">
                {smsAlerts.length}
              </span>
            </button>

            {/* Backup Quick Button */}
            {currentUser.role !== 'Resident' && (
              <button
                onClick={exportDatabaseJSON}
                title="Download instant database backup (JSON)"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Backup</span>
              </button>
            )}

            {/* Notification & Transaction Bell */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className={`relative p-2 rounded-xl transition-all cursor-pointer border ${
                  showNotifMenu
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
                    : totalUnreadCount > 0
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 ring-2 ring-emerald-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Notification & Transaction Center"
              >
                <Bell className="w-4 h-4" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 min-w-[18px] h-[18px] bg-emerald-500 text-slate-950 rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-md border-2 border-slate-900">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </button>

              {/* Enhanced Notification Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-[340px] sm:w-[460px] md:w-[500px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[85vh]">
                  {/* Header */}
                  <div className="p-3.5 bg-slate-800/90 border-b border-slate-700 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                            Notification & Transaction Center
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            Live alerts, services, receipts, clearances & requests
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-full font-semibold">
                          {totalUnreadCount} unread
                        </span>
                      </div>
                    </div>

                    {/* Notification Search & Action Controls */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={notifSearch}
                          onChange={(e) => setNotifSearch(e.target.value)}
                          placeholder="Filter by OR#, name, service, control#..."
                          className="w-full pl-8 pr-6 py-1.5 bg-slate-950/70 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        {notifSearch && (
                          <button
                            onClick={() => setNotifSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={markAllNotificationsAsRead}
                        title="Mark all notifications as read"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Read All</span>
                      </button>

                      <button
                        onClick={markAllNotificationsAsUnread}
                        title="Mark all notifications as unread"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Unread All</span>
                      </button>

                      <button
                        onClick={clearAllNotifications}
                        title="Clear all notifications"
                        className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Filter Category Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                      <button
                        onClick={() => setNotifCategoryFilter('all')}
                        className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                          notifCategoryFilter === 'all'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        All ({allNotifications.length})
                      </button>
                      <button
                        onClick={() => setNotifCategoryFilter('services')}
                        className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 border ${
                          notifCategoryFilter === 'services'
                            ? 'bg-teal-600 text-white border-teal-500'
                            : 'bg-slate-800/80 text-teal-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <Package className="w-3 h-3" />
                        <span>Services Desk ({servicesCount})</span>
                      </button>
                      <button
                        onClick={() => setNotifCategoryFilter('financial')}
                        className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 border ${
                          notifCategoryFilter === 'financial'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800/80 text-emerald-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Treasury & OR ({financialCount})</span>
                      </button>
                      <button
                        onClick={() => setNotifCategoryFilter('certificate')}
                        className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 border ${
                          notifCategoryFilter === 'certificate'
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-slate-800/80 text-amber-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <FileCheck2 className="w-3 h-3" />
                        <span>Certificates ({certCount})</span>
                      </button>
                      <button
                        onClick={() => setNotifCategoryFilter('registration')}
                        className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 border ${
                          notifCategoryFilter === 'registration'
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-800/80 text-indigo-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>KYC ({kycCount})</span>
                      </button>
                      <button
                        onClick={() => setNotifCategoryFilter('cases')}
                        className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 border ${
                          notifCategoryFilter === 'cases'
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-slate-800/80 text-rose-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>Blotter & Concerns ({casesCount})</span>
                      </button>
                      <button
                        onClick={() => setNotifCategoryFilter('activity')}
                        className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 border ${
                          notifCategoryFilter === 'activity'
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-slate-800/80 text-purple-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Activities ({activityCount})</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowNotifMenu(false);
                          setIsSMSDispatchModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 border bg-rose-950/80 text-rose-300 border-rose-700/80 hover:bg-rose-900"
                      >
                        <Mail className="w-3 h-3 text-rose-400" />
                        <span>Gmail Hub ({smsAlerts.length})</span>
                      </button>
                    </div>

                    {/* Unread Only Toggle */}
                    <div className="flex items-center justify-between pt-0.5 border-t border-slate-700/60">
                      <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={unreadOnly}
                          onChange={(e) => setUnreadOnly(e.target.checked)}
                          className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Show unread notifications only</span>
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Showing {filteredNotifications.length} items
                      </span>
                    </div>
                  </div>

                  {/* Notification List Body */}
                  <div className="p-2.5 space-y-2 overflow-y-auto max-h-[50vh] divide-y divide-slate-800/50">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 space-y-2">
                        <Bell className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                        <p className="text-xs font-semibold text-slate-300">No matching notifications found</p>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          {unreadOnly
                            ? 'All notifications have been marked as read.'
                            : 'All service requests, transaction events, clearance requests, and official records will appear here in real time.'}
                        </p>
                      </div>
                    ) : (
                      filteredNotifications.map((notif) => {
                        const isFinancial = notif.category === 'financial';
                        const isCert = notif.category === 'certificate';
                        const isServices = notif.category === 'services' || notif.id.startsWith('notif-cs-');
                        const isKYC = notif.category === 'registration';
                        const isConcern = notif.category === 'concern';
                        const isBlotter = notif.category === 'blotter' || notif.category === 'complaint';
                        const isActivity = notif.category === 'activity' || notif.category === 'appointment';

                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                              !notif.read
                                ? isFinancial
                                  ? 'bg-emerald-950/40 hover:bg-emerald-950/60 border-emerald-700/60 text-emerald-100 shadow-sm'
                                  : isCert
                                  ? 'bg-amber-950/40 hover:bg-amber-950/60 border-amber-700/60 text-amber-100 shadow-sm'
                                  : isServices
                                  ? 'bg-teal-950/40 hover:bg-teal-950/60 border-teal-700/60 text-teal-100 shadow-sm'
                                  : isKYC
                                  ? 'bg-indigo-950/40 hover:bg-indigo-950/60 border-indigo-700/60 text-indigo-100 shadow-sm'
                                  : isConcern || isBlotter
                                  ? 'bg-rose-950/40 hover:bg-rose-950/60 border-rose-700/60 text-rose-100 shadow-sm'
                                  : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-200'
                                : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800/80 text-slate-300 opacity-85 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon Badge */}
                              <div
                                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border shadow-xs ${
                                  isFinancial
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                    : isCert
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                    : isServices
                                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                                    : isKYC
                                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                                    : isConcern || isBlotter
                                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                                    : isActivity
                                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                                    : 'bg-slate-700 border-slate-600 text-slate-300'
                                }`}
                              >
                                {isFinancial ? (
                                  <Receipt className="w-4 h-4" />
                                ) : isCert ? (
                                  <FileCheck2 className="w-4 h-4" />
                                ) : isServices ? (
                                  notif.id.includes('-fac-') || notif.id.includes('-eqp-') ? (
                                    <Building2 className="w-4 h-4" />
                                  ) : notif.id.includes('-hlth-') || notif.id.includes('-med-') ? (
                                    <HeartPulse className="w-4 h-4" />
                                  ) : notif.id.includes('-job-') || notif.id.includes('-trn-') ? (
                                    <Briefcase className="w-4 h-4" />
                                  ) : notif.id.includes('-ayu-') || notif.id.includes('-aics-') ? (
                                    <Gift className="w-4 h-4" />
                                  ) : notif.id.includes('-bulk-') || notif.id.includes('-vol-') ? (
                                    <Truck className="w-4 h-4" />
                                  ) : notif.id.includes('-sk-') || notif.id.includes('-ast-') ? (
                                    <Trophy className="w-4 h-4" />
                                  ) : (
                                    <Package className="w-4 h-4" />
                                  )
                                ) : isKYC ? (
                                  <UserCheck className="w-4 h-4" />
                                ) : isConcern ? (
                                  <AlertTriangle className="w-4 h-4" />
                                ) : isBlotter ? (
                                  <ShieldAlert className="w-4 h-4" />
                                ) : isActivity ? (
                                  <Calendar className="w-4 h-4" />
                                ) : (
                                  <Bell className="w-4 h-4" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 truncate">
                                    {!notif.read && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                                    )}
                                    <p className="font-bold text-xs truncate text-white">
                                      {notif.title}
                                    </p>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                    {notif.timestamp}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                                  {notif.message}
                                </p>

                                {/* Tags & Transaction Meta */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                  {isServices && (
                                    <span className="px-1.5 py-0.5 bg-teal-950/80 border border-teal-700/60 rounded text-[10px] font-mono text-teal-300 font-bold">
                                      Community Service
                                    </span>
                                  )}
                                  {notif.actionText && (
                                    <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-medium">
                                      {notif.actionText}
                                    </span>
                                  )}
                                  {notif.orNumber && (
                                    <span className="px-1.5 py-0.5 bg-emerald-950/80 border border-emerald-700/60 rounded text-[10px] font-mono text-emerald-300 font-bold">
                                      OR #{notif.orNumber}
                                    </span>
                                  )}
                                  {notif.amount !== undefined && (
                                    <span className="px-1.5 py-0.5 bg-emerald-900/60 border border-emerald-600/50 rounded text-[10px] font-mono font-bold text-emerald-200">
                                      +₱{notif.amount.toFixed(2)}
                                    </span>
                                  )}
                                  {notif.controlNumber && (
                                    <span className="px-1.5 py-0.5 bg-slate-950/80 border border-slate-700 rounded text-[10px] font-mono text-amber-300">
                                      {notif.controlNumber}
                                    </span>
                                  )}
                                  {notif.payorName && (
                                    <span className="px-1.5 py-0.5 bg-slate-950/80 border border-slate-700 rounded text-[10px] text-slate-300">
                                      Payor: {notif.payorName}
                                    </span>
                                  )}

                                  {/* Direct Action Buttons */}
                                  <div className="ml-auto flex items-center gap-1 opacity-90 group-hover:opacity-100">
                                    {isFinancial && notif.orNumber && (
                                      <button
                                        onClick={(e) => handlePrintReceiptDirect(e, notif)}
                                        className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                                      >
                                        <Printer className="w-3 h-3" />
                                        <span>Print O.R.</span>
                                      </button>
                                    )}

                                    {isCert && notif.controlNumber && (
                                      <button
                                        onClick={(e) => handlePrintCertDirect(e, notif)}
                                        className="flex items-center gap-1 px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                                      >
                                        <FileCheck2 className="w-3 h-3" />
                                        <span>Certificate</span>
                                      </button>
                                    )}

                                    {/* Read / Unread Status Toggle */}
                                    {notif.read ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markNotificationAsUnread(notif.id);
                                        }}
                                        title="Mark as unread"
                                        className="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-700/60 cursor-pointer transition-colors"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markNotificationAsRead(notif.id);
                                        }}
                                        title="Mark as read"
                                        className="p-1 text-slate-400 hover:text-emerald-300 rounded hover:bg-slate-700/60 cursor-pointer transition-colors"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                    )}

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearNotification(notif.id);
                                      }}
                                      title="Dismiss notification"
                                      className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-700/60 cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        setIsSMSDispatchModalOpen(true);
                      }}
                      className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Gmail & Dispatch Hub</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        setActiveModule('transactions');
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Treasury</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        setActiveModule(currentUser.role === 'Resident' ? 'resident_portal' : 'audit_trail');
                      }}
                      className="text-slate-400 hover:text-slate-200 font-semibold cursor-pointer"
                    >
                      Audit Trail
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Role & User Selector */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/90 border border-slate-700 rounded-xl text-left transition-colors cursor-pointer group"
                title="Click to view user profile & role actions"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-emerald-700 border border-emerald-500/50 flex items-center justify-center text-white text-xs font-bold shadow-inner shrink-0">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{currentUser.name.charAt(0)}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight max-w-[130px] truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    <span>{currentUser.role}</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role Switcher & Profile Menu */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-4 bg-slate-800/80 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-emerald-700 border-2 border-emerald-400/60 shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {currentUser.avatar ? (
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{currentUser.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Current Session</p>
                        <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-emerald-400 truncate">{currentUser.position}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        setIsPhotoModalOpen(true);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload / Change Photo</span>
                    </button>
                  </div>

                  <div className="p-2 space-y-1">
                    <p className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase">
                      Switch Active Role
                    </p>
                    {roles.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          currentUser.role === r
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/70 font-semibold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{r}</span>
                        </div>
                        {currentUser.role === r && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-2 border-t border-slate-800 bg-slate-950/50 space-y-1.5">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        setActiveModule('users');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <UserCog className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Manage System Users</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenLoginModal();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5 text-slate-400" />
                      <span>Switch User Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Photo Upload Modal */}
      <UserProfilePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        targetUser={currentUser}
      />
    </header>
  );
};

