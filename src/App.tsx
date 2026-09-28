import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarangayProvider, useBarangay } from './context/BarangayContext';
import { CommunityServicesProvider } from './context/CommunityServicesContext';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { LogoutModal } from './components/LogoutModal';
import { CertificatePrintModal } from './components/CertificatePrintModal';
import { OfficialReceiptModal } from './components/OfficialReceiptModal';
import { RepublicSeal, BarangaySangkolSeal } from './components/OfficialSeals';
import { InitialLoadingScreen } from './components/InitialLoadingScreen';
import { TopRouteProgressBar, LoadingSpinner } from './components/LoadingAnimations';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { ResidentRegistrationModal } from './components/ResidentRegistrationModal';
import { AccessRestrictedView } from './components/AccessRestrictedView';
import { SessionTimeoutModal } from './components/SessionTimeoutModal';
import { CertificateVerificationModal } from './components/CertificateVerificationModal';
import { SMSDispatchCenterModal } from './components/SMSDispatchCenterModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { LegalPoliciesModal, LegalPolicyTab } from './components/LegalPoliciesModal';
import { TrackingAnalyticsModal } from './components/TrackingAnalyticsModal';
import { trackPageView } from './utils/analytics';
import { ErrorBoundary } from './components/ErrorBoundary';

// Views
import { DashboardView } from './views/DashboardView';
import { ResidentsView } from './views/ResidentsView';
import { HouseholdsView } from './views/HouseholdsView';
import { OfficialsView } from './views/OfficialsView';
import { CertificatesView } from './views/CertificatesView';
import { BlotterView } from './views/BlotterView';
import { ComplaintsView } from './views/ComplaintsView';
import { BusinessesView } from './views/BusinessesView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { ActivitiesView } from './views/ActivitiesView';
import { ResidentPortalView } from './views/ResidentPortalView';
import { AppointmentsView } from './views/AppointmentsView';
import { DocumentsView } from './views/DocumentsView';
import { ReportsView } from './views/ReportsView';
import { TransactionsView } from './views/TransactionsView';
import { AuditTrailView } from './views/AuditTrailView';
import { SettingsView } from './views/SettingsView';
import { ManageUsersView } from './views/ManageUsersView';
import { BarangayMapView } from './views/BarangayMapView';
import { CommunityServicesAdminView } from './views/CommunityServicesAdminView';
import { CommunityLivelihoodView } from './views/CommunityLivelihoodView';

import {
  Menu,
  X,
  Bell,
  Search,
  LogIn,
  LogOut,
  ShieldCheck,
  User,
  ExternalLink,
  ChevronRight,
  Globe,
  Sparkles,
  RefreshCw,
  Zap,
  Check,
  CheckCheck,
  RotateCcw,
  Trash2,
  Filter,
  Receipt,
  FileCheck2,
  ShieldAlert,
  Calendar,
  Layers,
  Inbox,
  Clock,
  Sun,
  Moon,
  Cookie,
  Activity,
  FileText,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    currentUser,
    settings,
    notifications,
    unreadNotifCount,
    unreadTransactionCount,
    markNotificationAsRead,
    markNotificationAsUnread,
    markAllNotificationsAsRead,
    markAllNotificationsAsUnread,
    clearNotification,
    clearAllNotifications,
    setTargetCertificateId,
    setTargetRecordId,
    setTargetUserId,
    setSelectedCertForPrint,
    setSelectedReceiptForPrint,
    certificates,
    transactions,
    announcements,
    isAuthenticated,
    logout,
    isDarkMode,
    toggleDarkMode,
  } = useBarangay();

  const [showInitialSplash, setShowInitialSplash] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isModuleTransitioning, setIsModuleTransitioning] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'financial' | 'certificate' | 'cases'>('all');
  const [notifSearch, setNotifSearch] = useState('');
  const [globalVerificationControlNo, setGlobalVerificationControlNo] = useState<string | null>(null);
  const [isGlobalVerificationOpen, setIsGlobalVerificationOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalPolicyTab>('privacy');
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'landing' | 'login'>('login');
  const [loginInitialMode, setLoginInitialMode] = useState<'resident' | 'official'>('resident');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Automatically ensure Login Portal view is active whenever activeModule is 'login'
  useEffect(() => {
    if (activeModule === 'login') {
      setAuthView('login');
    }
  }, [activeModule]);

  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const isResident = currentUser?.role === 'Resident';

  const handleOpenLegalModal = (tab: LegalPolicyTab) => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // Check URL parameters for direct QR code scanning/verification links
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const verifyParam = params.get('verify') || params.get('controlNo') || params.get('controlNumber') || params.get('c');
      if (verifyParam) {
        setGlobalVerificationControlNo(verifyParam.trim());
        setIsGlobalVerificationOpen(true);
      }
      if (params.get('login') === 'true' || params.get('auth') === 'login') {
        setAuthView('login');
        if (params.get('mode') === 'official') {
          setLoginInitialMode('official');
        }
      }
    } catch {}

    const handleCustomVerificationEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ controlNumber?: string }>;
      if (customEvent.detail?.controlNumber) {
        setGlobalVerificationControlNo(customEvent.detail.controlNumber);
      }
      setIsGlobalVerificationOpen(true);
    };

    const handleCustomLegalEvent = (e: Event) => {
      const custom = e as CustomEvent<{ tab?: LegalPolicyTab }>;
      if (custom.detail?.tab) {
        setLegalModalTab(custom.detail.tab);
      }
      setIsLegalModalOpen(true);
    };

    window.addEventListener('open-certificate-verification', handleCustomVerificationEvent);
    window.addEventListener('open-legal-policies', handleCustomLegalEvent);
    return () => {
      window.removeEventListener('open-certificate-verification', handleCustomVerificationEvent);
      window.removeEventListener('open-legal-policies', handleCustomLegalEvent);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  // Global print isolation: dynamically marks document body when a printable modal or slip is open
  useEffect(() => {
    const handleBeforePrint = () => {
      const hasPrintable = document.querySelector('.modal-backdrop, #printable-certificate, .printable-area');
      if (hasPrintable) {
        document.body.classList.add('is-printing-modal');
      }
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('is-printing-modal');
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === 'unread' && n.read) return false;
    if (notifFilter === 'financial' && n.category !== 'financial') return false;
    if (notifFilter === 'certificate' && n.category !== 'certificate') return false;
    if (notifFilter === 'cases' && n.category !== 'blotter' && n.category !== 'complaint' && n.category !== 'concern') return false;

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

  const handleNotificationClick = (notif: (typeof notifications)[0]) => {
    markNotificationAsRead(notif.id);
    setIsNotificationsOpen(false);

    if (notif.category === 'certificate' || notif.certificateId || notif.controlNumber) {
      const cert = certificates.find((c) => c.id === notif.certificateId || c.controlNumber === notif.controlNumber);
      const targetId = cert ? cert.id : (notif.certificateId || notif.controlNumber || null);
      if (targetId) {
        setTargetCertificateId(targetId);
      }
      setActiveModule(isResident ? 'resident_portal' : 'certificates');
      return;
    }

    if (notif.category === 'financial' || notif.transactionId || notif.orNumber) {
      const tx = transactions.find((t) => t.id === notif.transactionId || t.orNumber === notif.orNumber);
      if (tx) {
        setSelectedReceiptForPrint(tx);
        setTargetRecordId(tx.id);
      }
      setActiveModule(isResident ? 'resident_portal' : 'transactions');
      return;
    }

    if (notif.category === 'registration' || notif.targetUserId) {
      if (notif.targetUserId) {
        setTargetUserId(notif.targetUserId);
      }
      setActiveModule('users');
      return;
    }

    if (notif.category === 'blotter') {
      if (notif.targetRecordId) {
        setTargetRecordId(notif.targetRecordId);
      }
      setActiveModule(isResident ? 'resident_portal' : 'blotters');
      return;
    }

    if (notif.category === 'concern' || notif.category === 'complaint') {
      if (notif.targetRecordId) {
        setTargetRecordId(notif.targetRecordId);
      }
      setActiveModule(isResident ? 'resident_portal' : 'complaints');
      return;
    }

    if (notif.category === 'appointment') {
      if (notif.targetRecordId) {
        setTargetRecordId(notif.targetRecordId);
      }
      setActiveModule(isResident ? 'resident_portal' : 'appointments');
      return;
    }

    if (notif.category === 'activity') {
      if (notif.targetRecordId) {
        setTargetRecordId(notif.targetRecordId);
      }
      setActiveModule(isResident ? 'resident_portal' : 'activities');
      return;
    }

    if (notif.linkModule) {
      setActiveModule(notif.linkModule as any);
    }
  };

  // Trigger brief top progress bar animation on module change and track privacy-compliant page view
  useEffect(() => {
    setIsModuleTransitioning(true);
    if (activeModule) {
      trackPageView(activeModule);
    }
    const timer = setTimeout(() => {
      setIsModuleTransitioning(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [activeModule]);

  // Global Sync & Refresh action with animated state
  const handleSyncDatabase = () => {
    setIsSyncingData(true);
    setSyncToast('Connecting to Barangay Sangkol registry...');
    setTimeout(() => {
      setIsSyncingData(false);
      setSyncToast('Database & Purok records successfully synchronized!');
      setTimeout(() => setSyncToast(null), 3000);
    }, 850);
  };

  // If user is not authenticated, render either the Public Landing Page or Login Portal
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-700 selection:text-white">
          <LoginPage
            initialMode={loginInitialMode}
            onBackToLanding={() => setAuthView('landing')}
            onSuccess={() => {
              setActiveModule('dashboard');
            }}
          />
          {/* Global Modals for password resets / support if needed */}
          <CertificatePrintModal />
          <CookieConsentBanner onOpenLegalModal={handleOpenLegalModal} isAdmin={false} />
          <LegalPoliciesModal
            isOpen={isLegalModalOpen}
            onClose={() => setIsLegalModalOpen(false)}
            initialTab={legalModalTab}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-700 selection:text-white">
        <LandingPage
          onGoToLogin={(mode = 'resident') => {
            setLoginInitialMode(mode);
            setAuthView('login');
          }}
          onOpenRegister={() => setIsRegisterModalOpen(true)}
          onOpenVerification={(controlNo) => {
            if (controlNo) {
              setGlobalVerificationControlNo(controlNo);
            }
            setIsGlobalVerificationOpen(true);
          }}
          onOpenLegalModal={handleOpenLegalModal}
        />
        <ResidentRegistrationModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false);
            setLoginInitialMode('resident');
            setAuthView('login');
          }}
        />
        <CertificateVerificationModal
          initialControlNumber={globalVerificationControlNo}
          isOpen={isGlobalVerificationOpen}
          onClose={() => {
            setIsGlobalVerificationOpen(false);
            setGlobalVerificationControlNo(null);
          }}
        />
        <CertificatePrintModal />
        <CookieConsentBanner onOpenLegalModal={handleOpenLegalModal} isAdmin={false} />
        <LegalPoliciesModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={legalModalTab}
        />
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (activeModule) {
      case 'landing':
        return (
          <LandingPage
            onGoToLogin={(mode) => setActiveModule(mode === 'official' ? 'dashboard' : 'resident_portal')}
            onOpenRegister={() => setIsRegisterModalOpen(true)}
            onOpenVerification={(controlNo) => {
              if (controlNo) {
                setGlobalVerificationControlNo(controlNo);
              }
              setIsGlobalVerificationOpen(true);
            }}
            onOpenLegalModal={handleOpenLegalModal}
          />
        );
      case 'resident_portal':
        return <ResidentPortalView />;
      case 'dashboard':
        return isResident ? <ResidentPortalView /> : <DashboardView />;
      case 'residents':
        return isResident ? <ResidentPortalView initialTab="profile" /> : <ResidentsView />;
      case 'households':
        return isResident ? <AccessRestrictedView moduleName="Household Registry" /> : <HouseholdsView />;
      case 'officials':
        return <OfficialsView />;
      case 'certificates':
        return isResident ? <ResidentPortalView initialTab="archive" /> : <CertificatesView />;
      case 'blotters':
      case 'blotter':
        return isResident ? <ResidentPortalView initialTab="blotter" /> : <BlotterView />;
      case 'complaints':
        return isResident ? <ResidentPortalView initialTab="blotter" /> : <ComplaintsView />;
      case 'businesses':
        return isResident ? <AccessRestrictedView moduleName="Business Permits & Licenses Registry" /> : <BusinessesView />;
      case 'community_services':
        return isResident ? <ResidentPortalView initialTab="facilities" /> : <CommunityServicesAdminView />;
      case 'community_livelihood':
        return isResident ? <ResidentPortalView initialTab="trabaho" /> : <CommunityLivelihoodView />;
      case 'announcements':
        return <AnnouncementsView />;
      case 'activities':
        return <ActivitiesView />;
      case 'appointments':
        return <AppointmentsView />;
      case 'documents':
        return <DocumentsView />;
      case 'reports':
        return isResident ? <AccessRestrictedView moduleName="Administrative Analytics & Reports" /> : <ReportsView />;
      case 'transactions':
        return isResident ? <ResidentPortalView initialTab="transactions" /> : <TransactionsView />;
      case 'audit_trail':
        return isResident ? <AccessRestrictedView moduleName="System Security & Audit Trail Logs" /> : <AuditTrailView />;
      case 'users':
        return isResident ? <AccessRestrictedView moduleName="User Management & Access Control" /> : <ManageUsersView />;
      case 'settings':
        return isResident ? <ResidentPortalView initialTab="settings" /> : <SettingsView />;
      case 'barangay_map':
        return <BarangayMapView />;
      case 'login':
        return <LoginPage onSuccess={() => setActiveModule('dashboard')} />;
      default:
        return isResident ? <ResidentPortalView /> : <DashboardView />;
    }
  };

  const pinnedAnnouncement = announcements.find((a) => a.isPinned && a.status === 'Active');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative transition-colors duration-200">
      {/* Initial System Boot Animation Splash */}
      <AnimatePresence>
        {showInitialSplash && (
          <InitialLoadingScreen onComplete={() => setShowInitialSplash(false)} />
        )}
      </AnimatePresence>

      {/* Top Slim Glowing Progress Bar during view/data transitions */}
      <TopRouteProgressBar isAnimating={isModuleTransitioning || isSyncingData} />

      {/* Sync / Refresh Toast Notification */}
      <AnimatePresence>
        {syncToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold"
          >
            {isSyncingData ? (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>{syncToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topmost Official Philippine Government Banner */}
      <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Left: Seals & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 shrink-0">
                <RepublicSeal size={38} />
                <BarangaySangkolSeal size={38} />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-indigo-950 dark:text-white tracking-tight uppercase leading-tight">
                    {settings.barangayName}
                  </h1>
                  {isResident && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Resident Citizen Account
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {settings.municipality}, {settings.province} • Portal ng Pamahalaang Barangay
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick actions, sync button, theme switcher, notifications, user profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Dark Mode Quick Toggle Button */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-180 duration-200" />
              )}
            </button>

            {/* Sync Database Button with animated spinner */}
            <button
              onClick={handleSyncDatabase}
              disabled={isSyncingData}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer transition-all hover:border-slate-300 active:scale-95"
              title="Synchronize Local Database with Sangkol Registry"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isSyncingData ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">{isSyncingData ? 'Syncing...' : 'Sync Data'}</span>
            </button>

            {/* Quick Switch to Resident Portal or Dashboard */}
            {isResident ? (
              <button
                onClick={() => setActiveModule('resident_portal')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Citizen Portal</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveModule('resident_portal')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>View Resident Portal</span>
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 rounded-xl border relative cursor-pointer transition-colors ${
                  isNotificationsOpen
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                }`}
                title="Notifications & Alerts"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Center Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-[340px] sm:w-[460px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[85vh]">
                  {/* Header */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            System Notifications
                          </h3>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Clearance alerts, treasury receipts & community updates
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                          {unreadNotifCount} unread
                        </span>
                      </div>
                    </div>

                    {/* Notification Search & Quick Actions */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={notifSearch}
                          onChange={(e) => setNotifSearch(e.target.value)}
                          placeholder="Filter alerts, names, OR#..."
                          className="w-full pl-8 pr-6 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {notifSearch && (
                          <button
                            onClick={() => setNotifSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Mark All Read Button */}
                      <button
                        onClick={markAllNotificationsAsRead}
                        title="Mark all notifications as read"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Read All</span>
                      </button>

                      {/* Mark All Unread Button */}
                      <button
                        onClick={markAllNotificationsAsUnread}
                        title="Mark all notifications as unread"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden sm:inline">Unread All</span>
                      </button>

                      {/* Clear All Button */}
                      <button
                        onClick={clearAllNotifications}
                        title="Clear all notifications"
                        className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Filter Category Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
                      <button
                        onClick={() => setNotifFilter('all')}
                        className={`px-2.5 py-0.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                          notifFilter === 'all'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        onClick={() => setNotifFilter('unread')}
                        className={`px-2.5 py-0.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                          notifFilter === 'unread'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Unread ({unreadNotifCount})
                      </button>
                      <button
                        onClick={() => setNotifFilter('financial')}
                        className={`px-2.5 py-0.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                          notifFilter === 'financial'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Treasury
                      </button>
                      <button
                        onClick={() => setNotifFilter('certificate')}
                        className={`px-2.5 py-0.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                          notifFilter === 'certificate'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Certificates
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Notification List */}
                  <div className="divide-y divide-slate-100 overflow-y-auto max-h-[380px] p-1">
                    {filteredNotifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <Bell className="w-8 h-8 mx-auto text-slate-300 opacity-60" />
                        <p className="text-xs font-semibold text-slate-600">No notifications found</p>
                        <p className="text-[11px] text-slate-400">
                          {notifFilter !== 'all' || notifSearch
                            ? 'Try clearing the search query or changing active filter'
                            : 'All barangay alerts and transactions are up to date'}
                        </p>
                      </div>
                    ) : (
                      filteredNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 rounded-xl transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                            notif.read
                              ? 'hover:bg-slate-50 bg-white'
                              : 'bg-indigo-50/50 hover:bg-indigo-50/80 border-l-3 border-l-indigo-600'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {/* Icon Indicator */}
                            <div className="mt-0.5 shrink-0">
                              {notif.category === 'financial' ? (
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                  <Receipt className="w-3.5 h-3.5" />
                                </div>
                              ) : notif.category === 'certificate' ? (
                                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                </div>
                              ) : notif.category === 'blotter' || notif.category === 'complaint' ? (
                                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                  <Bell className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>

                            {/* Text and Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-xs font-bold truncate ${notif.read ? 'text-slate-800' : 'text-indigo-950'}`}>
                                  {notif.title}
                                </span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                                  {notif.timestamp}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                                {notif.message}
                              </p>

                              {/* Badges / Meta Info */}
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {notif.category && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                                    {notif.category}
                                  </span>
                                )}
                                {notif.orNumber && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
                                    OR #{notif.orNumber}
                                  </span>
                                )}
                                {notif.controlNumber && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
                                    Control #{notif.controlNumber}
                                  </span>
                                )}
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 ml-auto" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Card Controls */}
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                            {/* Read / Unread Status Toggle */}
                            {notif.read ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markNotificationAsUnread(notif.id);
                                }}
                                title="Mark as unread"
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markNotificationAsRead(notif.id);
                                }}
                                title="Mark as read"
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Dismiss button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notif.id);
                              }}
                              title="Dismiss"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-xs select-none">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-xs ${
                  isResident ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </p>
                <p
                  className={`text-[9px] font-semibold leading-tight ${
                    isResident ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {currentUser.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Pinned Broadcast Banner (if any) */}
      {pinnedAnnouncement && (
        <div className="no-print bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800/80 py-2 px-4 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 truncate">
              <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-[9px] uppercase tracking-wider border border-amber-300 dark:border-amber-700">
                BARANGAY ADVISORY
              </span>
              <strong className="text-amber-950 dark:text-amber-100 truncate">{pinnedAnnouncement.title}:</strong>
              <span className="truncate text-amber-800 dark:text-amber-300 hidden sm:inline">{pinnedAnnouncement.content}</span>
            </div>
            <button
              onClick={() => setActiveModule('announcements')}
              className="text-[11px] text-amber-900 dark:text-amber-300 hover:text-indigo-700 dark:hover:text-indigo-400 font-bold flex items-center gap-1 shrink-0 underline cursor-pointer"
            >
              <span>View Bulletin</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Layout with Responsive Sidebar */}
      <div id="app-main-content" className="app-main-content flex-1 flex max-w-7xl w-full mx-auto p-3 sm:p-6 gap-6">
        {/* Desktop Sidebar */}
        <aside className="no-print hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            <Sidebar
              onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
            />
          </div>
        </aside>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full z-50 overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <BarangaySangkolSeal size={28} />
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">Sangkol BIMS</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Sidebar
                onItemClick={() => setIsMobileMenuOpen(false)}
                onOpenLogoutModal={() => {
                  setIsMobileMenuOpen(false);
                  setIsLogoutModalOpen(true);
                }}
                onOpenLoginModal={() => {
                  setIsMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Center Main Viewport with animated view transition */}
        <main className="flex-1 min-w-0">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <ErrorBoundary key={activeModule}>
              {renderCurrentView()}
            </ErrorBoundary>
          </motion.div>
        </main>
      </div>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1.5 text-xs">
            <p className="font-semibold text-slate-700 dark:text-slate-300">© 2026 Barangay Sangkol BIMS.</p>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenLegalModal('privacy')}
              className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium cursor-pointer hover:underline"
            >
              Privacy Policy (RA 10173)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenLegalModal('terms')}
              className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium cursor-pointer hover:underline"
            >
              Terms & Conditions
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenLegalModal('cookies')}
              className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium cursor-pointer hover:underline"
            >
              Cookie Policy
            </button>
            {currentUser.role === 'Administrator' && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('open-cookie-settings'));
                    }
                  }}
                  className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-1 hover:underline"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  <span>Cookie Settings</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setIsAnalyticsModalOpen(true)}
                  className="text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-semibold cursor-pointer flex items-center gap-1 hover:underline"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Privacy & Analytics</span>
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {currentUser.role !== 'Resident' && (
              <button
                onClick={() => setShowInitialSplash(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold cursor-pointer underline flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Startup Animation</span>
              </button>
            )}
            <p className="text-slate-400 dark:text-slate-500 text-[11px]">
              Serving Purok Pinya, Lumboy, Mangga, Tambis, Kaimito, and Bayabas
            </p>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <SessionTimeoutModal timeoutSeconds={15 * 60} warningSeconds={60} />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />
      <CertificatePrintModal />
      <OfficialReceiptModal />
      <CertificateVerificationModal
        initialControlNumber={globalVerificationControlNo}
        isOpen={isGlobalVerificationOpen}
        onClose={() => {
          setIsGlobalVerificationOpen(false);
          setGlobalVerificationControlNo(null);
        }}
      />
      <ResidentRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
      <SMSDispatchCenterModal />

      {/* Cookie Consent & Legal Policies Modals */}
      <CookieConsentBanner
        onOpenLegalModal={handleOpenLegalModal}
        isAdmin={currentUser.role === 'Administrator'}
      />
      <LegalPoliciesModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
      {currentUser.role === 'Administrator' && (
        <TrackingAnalyticsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          onOpenCookieSettings={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('open-cookie-settings'));
            }
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <BarangayProvider>
      <CommunityServicesProvider>
        <MainLayout />
      </CommunityServicesProvider>
    </BarangayProvider>
  );
}

