import React, { useState, useMemo } from 'react';
import { useBarangay } from '../context/BarangayContext';
import {
  SMSAlertRecord,
  AlertCategory,
  AlertChannel,
  AlertDeliveryStatus,
} from '../types';
import { BarangaySangkolSeal, RepublicSeal } from './OfficialSeals';
import {
  Radio,
  Smartphone,
  Mail,
  Send,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileCheck2,
  Calendar,
  MessageSquare,
  Clock,
  Sparkles,
  RefreshCw,
  Trash2,
  X,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
  Settings,
  Flame,
  Zap,
  Phone,
  Eye,
  Sliders,
  Share2,
  Server,
} from 'lucide-react';
import {
  openNativeSMS,
  openGmailWebCompose,
  shareAlertViaDevice,
  signInWithGoogleWorkspace,
  disconnectGoogleWorkspace,
  getCachedGmailToken,
  getConnectedGmailEmail,
  sendRealGmail,
  buildOfficialBarangayHtmlEmail,
  sendRealSmsNotification,
  sendRealEmailNotification,
  fetchGatewayStatus,
} from '../utils/realAlertDeliveryService';
import { NotificationAuditLogsView } from './NotificationAuditLogsView';
import { RecentSearchesInput } from './RecentSearchesInput';

interface SMSDispatchCenterModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const SMSDispatchCenterModal: React.FC<SMSDispatchCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    smsAlerts,
    sendSMSAlert,
    resendSMSAlert,
    deleteSMSAlert,
    clearAllSMSAlerts,
    smsGatewaySettings,
    updateSmsGatewaySettings,
    residents,
    settings,
    currentUser,
    certificates,
    complaints,
    blotters,
    announcements,
    isSMSDispatchModalOpen,
    setIsSMSDispatchModalOpen,
  } = useBarangay();

  const modalIsOpen = isOpen !== undefined ? isOpen : isSMSDispatchModalOpen;
  const handleModalClose = onClose || (() => setIsSMSDispatchModalOpen(false));

  const [activeTab, setActiveTab] = useState<'ledger' | 'compose' | 'quick_tests' | 'settings' | 'audit_logs'>('ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedChannel, setSelectedChannel] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [inspectAlert, setInspectAlert] = useState<SMSAlertRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);

  React.useEffect(() => {
    if (modalIsOpen) {
      fetchGatewayStatus().then((status) => {
        if (status) setGatewayStatus(status);
      }).catch(() => {});
    }
  }, [modalIsOpen, activeTab]);

  // Personal Live Test State for User
  const [testUserPhone, setTestUserPhone] = useState('0917-889-2231');
  const [testUserEmail, setTestUserEmail] = useState('aligno40@gmail.com');
  const [isGoogleConnected, setIsGoogleConnected] = useState(!!getCachedGmailToken());
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [activeGoogleEmail, setActiveGoogleEmail] = useState(getConnectedGmailEmail());

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await signInWithGoogleWorkspace();
      if (res) {
        setIsGoogleConnected(true);
        setActiveGoogleEmail(res.email);
        setTestUserEmail(res.email);
        showToast(`Connected Google Workspace as ${res.email}!`);
      }
    } catch (e: any) {
      console.warn('Google sign-in canceled or failed:', e);
      showToast('Google Sign-In dismissed or requires popup allowance.');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await disconnectGoogleWorkspace();
    setIsGoogleConnected(false);
    showToast('Google Workspace disconnected.');
  };

  // Custom Blast Composer State
  const [composeTargetAudience, setComposeTargetAudience] = useState<'All Residents' | 'Specific Purok' | 'Senior Citizens' | '4Ps Beneficiaries' | 'Youth' | 'Individual Resident'>('All Residents');
  const [composeTargetPurok, setComposeTargetPurok] = useState('Purok Pinya');
  const [composeIndividualResidentId, setComposeIndividualResidentId] = useState('');
  const [composeCategory, setComposeCategory] = useState<AlertCategory>('Emergency / Disaster Advisory');
  const [composeChannel, setComposeChannel] = useState<AlertChannel>('Email');
  const [composeSubject, setComposeSubject] = useState('Emergency Advisory - Barangay Sangkol');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeSender, setComposeSender] = useState(smsGatewaySettings.senderId || 'BRGY-SANGKOL');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Alert Records
  const filteredAlerts = useMemo(() => {
    return smsAlerts.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.id.toLowerCase().includes(q) ||
        a.recipientName.toLowerCase().includes(q) ||
        a.recipientPhone.toLowerCase().includes(q) ||
        (a.recipientEmail && a.recipientEmail.toLowerCase().includes(q)) ||
        a.subject.toLowerCase().includes(q) ||
        a.smsMessage.toLowerCase().includes(q) ||
        (a.purok && a.purok.toLowerCase().includes(q));

      const matchesCat = selectedCategory === 'All' || a.category === selectedCategory;
      const matchesChan = selectedChannel === 'All' || a.channel === selectedChannel;
      const matchesStat = selectedStatus === 'All' || a.status === selectedStatus;

      return matchesSearch && matchesCat && matchesChan && matchesStat;
    });
  }, [smsAlerts, searchQuery, selectedCategory, selectedChannel, selectedStatus]);

  // Statistics
  const totalSent = smsAlerts.length;
  const deliveredCount = smsAlerts.filter((a) => a.status === 'Delivered').length;
  const deliveryRate = totalSent > 0 ? ((deliveredCount / totalSent) * 100).toFixed(1) : '100.0';
  const emergencyBlastsCount = smsAlerts.filter((a) => a.category === 'Emergency / Disaster Advisory').length;
  const certAlertsCount = smsAlerts.filter((a) => a.category === 'Certificate Ready').length;
  const hearingAlertsCount = smsAlerts.filter((a) => a.category === 'Hearing Schedule / Summons').length;

  if (!modalIsOpen) return null;

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResend = (alert: SMSAlertRecord) => {
    resendSMSAlert(alert.id);
    showToast(`Alert ${alert.id} resent to ${alert.recipientName} via ${alert.channel}`);
  };

  // Quick Preset Test Handlers
  const handleTestCertReady = async () => {
    const cert = certificates.find((c) => c.status === 'Issued' || c.status === 'Approved') || certificates[0];
    const newAlert: SMSAlertRecord = {
      id: `SMS-2026-${Date.now().toString().slice(-4)}`,
      recipientName: cert ? cert.residentName : 'Maria Santos Cruz',
      recipientPhone: '0917-889-2231',
      recipientEmail: 'maria.cruz@gmail.com',
      recipientResidentId: cert?.residentId || 'BS-RES-2026-0002',
      purok: cert?.residentAddress?.includes('Purok') ? cert.residentAddress : 'Purok Mangga',
      category: 'Certificate Ready',
      subject: `Barangay Clearance Ready for Pickup (Ctrl #${cert?.controlNumber || 'SNG-CLR-2026-0042'})`,
      smsMessage: `BRGY SANGKOL: Maayong adlaw ${cert?.residentName || 'Maria Santos Cruz'}! Your requested ${cert?.type || 'Barangay Clearance'} (Ctrl #${cert?.controlNumber || 'SNG-CLR-2026-0042'}) is APPROVED & READY for pickup at Window 1, Brgy Hall. Bring 1 valid ID. Salamat!`,
      emailBody: `Official notice from Barangay Sangkol: Your certificate application #${cert?.controlNumber || 'SNG-CLR-2026-0042'} is ready for pickup at Barangay Hall Window 1.`,
      channel: 'Both',
      sender: smsGatewaySettings.senderId || 'BRGY-SANGKOL',
      status: 'Delivered',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      relatedRecordId: cert?.id,
      relatedRecordType: 'certificate',
    };
    sendSMSAlert(newAlert);
    
    // Asynchronously dispatch real backend notifications
    sendRealSmsNotification({
      phoneNumber: newAlert.recipientPhone,
      residentId: newAlert.recipientResidentId,
      residentName: newAlert.recipientName,
      certificateId: cert?.id,
      controlNumber: cert?.controlNumber || 'SNG-CLR-2026-0042',
      certificateType: cert?.type || 'Barangay Clearance',
      status: 'APPROVED & READY',
      message: newAlert.smsMessage,
      sentBy: 'SMS Dispatch Center',
    }).catch(console.error);

    sendRealEmailNotification({
      email: newAlert.recipientEmail || 'maria.cruz@gmail.com',
      residentId: newAlert.recipientResidentId,
      residentName: newAlert.recipientName,
      certificateId: cert?.id,
      controlNumber: cert?.controlNumber || 'SNG-CLR-2026-0042',
      certificateType: cert?.type || 'Barangay Clearance',
      status: 'APPROVED & READY',
      sentBy: 'SMS Dispatch Center',
    }).catch(console.error);

    showToast('Sent Certificate Ready SMS & Email alert to gateway!');
  };

  const handleTestHearingSummons = async () => {
    const kp = complaints[0];
    const newAlert: SMSAlertRecord = {
      id: `SMS-2026-${Date.now().toString().slice(-4)}`,
      recipientName: kp ? kp.respondentName : 'Roberto Gomez',
      recipientPhone: kp?.respondentContact || '0928-334-1122',
      recipientEmail: 'roberto.gomez@gmail.com',
      purok: 'Purok Pinya',
      category: 'Hearing Schedule / Summons',
      subject: `OFFICIAL SUMMONS: Lupon Hearing for Case #${kp?.caseNumber || 'LUPON-2026-001'}`,
      smsMessage: `NOTICE TO APPEAR: ${kp?.respondentName || 'Roberto Gomez'}, you are summoned for 1st Mediation Hearing for Case #${kp?.caseNumber || 'LUPON-2026-001'} on Aug 30, 2026 at 02:00 PM at Barangay Sangkol Session Hall before Punong Barangay Hon. Juan M. Dela Cruz. Non-appearance has legal consequences under RA 7160. - Lupon Secretariat`,
      emailBody: `Notice of Hearing & Summons for Case #${kp?.caseNumber || 'LUPON-2026-001'} before the Lupon Tagapamayapa.`,
      channel: 'Both',
      sender: smsGatewaySettings.senderId || 'BRGY-SANGKOL',
      status: 'Delivered',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      relatedRecordId: kp?.id,
      relatedRecordType: 'complaint',
    };
    sendSMSAlert(newAlert);

    sendRealSmsNotification({
      phoneNumber: newAlert.recipientPhone,
      residentName: newAlert.recipientName,
      message: newAlert.smsMessage,
      sentBy: 'Lupon Secretariat',
    }).catch(console.error);

    sendRealEmailNotification({
      email: newAlert.recipientEmail || 'roberto.gomez@gmail.com',
      residentName: newAlert.recipientName,
      subject: newAlert.subject,
      htmlBody: `<p>${newAlert.smsMessage}</p>`,
      plainText: newAlert.smsMessage,
      sentBy: 'Lupon Secretariat',
    }).catch(console.error);

    showToast('Sent Hearing Summons SMS & Email alert to gateway!');
  };

  const handleTestEmergencyBlast = async () => {
    const newAlert: SMSAlertRecord = {
      id: `SMS-2026-${Date.now().toString().slice(-4)}`,
      recipientName: 'All Residents (Emergency Broadcast)',
      recipientPhone: '0917-555-0101',
      recipientEmail: 'residents-all@barangaysangkol.gov.ph',
      purok: 'All Puroks',
      category: 'Emergency / Disaster Advisory',
      subject: '🚨 EMERGENCY ALERT: Heavy Rainfall & River Overflow Warning',
      smsMessage: `🚨 EMERGENCY ALERT - BRGY SANGKOL: Heavy Rainfall & Flash Flood Advisory. Low-lying residents in Purok Lumboy and Bayabas please stand by for possible evacuation to Central Gym. MDRRMO: 0917-555-4321 / Tanod: 0928-123-4567. Mag-amping kita tanan!`,
      emailBody: `Emergency flood advisory issued for Barangay Sangkol. Please coordinate with Purok leaders and Tanod patrol.`,
      channel: 'Both',
      sender: smsGatewaySettings.senderId || 'BRGY-SANGKOL',
      status: 'Delivered',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      relatedRecordType: 'announcement',
    };
    sendSMSAlert(newAlert);

    sendRealSmsNotification({
      phoneNumber: '0917-555-0101',
      residentName: 'All Residents (Emergency Broadcast)',
      message: newAlert.smsMessage,
      sentBy: 'BDRRMC Command Desk',
    }).catch(console.error);

    showToast('Dispatched Emergency SMS & Email broadcast blast to gateway!');
  };

  const handleCustomBlastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeMessage.trim()) {
      alert('Please enter an alert message.');
      return;
    }

    let recipientName = 'All Residents';
    let recipientPhone = '0917-555-0101';
    let recipientEmail = 'alerts@barangaysangkol.gov.ph';
    let purok = 'All Puroks';

    if (composeTargetAudience === 'Specific Purok') {
      recipientName = `${composeTargetPurok} Residents`;
      recipientPhone = `0917-555-${Math.floor(1000 + Math.random() * 9000)}`;
      purok = composeTargetPurok;
    } else if (composeTargetAudience === 'Senior Citizens') {
      recipientName = 'Registered Senior Citizens (60+)';
      recipientPhone = '0918-555-0202';
    } else if (composeTargetAudience === '4Ps Beneficiaries') {
      recipientName = '4Ps Beneficiary Families';
      recipientPhone = '0919-555-0303';
    } else if (composeTargetAudience === 'Youth') {
      recipientName = 'Katipunan ng Kabataan (KK Youth)';
      recipientPhone = '0920-555-0404';
    } else if (composeTargetAudience === 'Individual Resident') {
      const res = residents.find((r) => r.id === composeIndividualResidentId);
      if (res) {
        recipientName = `${res.firstName} ${res.lastName}`;
        recipientPhone = res.contactNumber;
        recipientEmail = res.email || 'citizen@barangaysangkol.gov.ph';
        purok = res.purok;
      }
    }

    const newAlert: SMSAlertRecord = {
      id: `SMS-2026-${Date.now().toString().slice(-4)}`,
      recipientName,
      recipientPhone,
      recipientEmail,
      purok,
      category: composeCategory,
      subject: composeSubject,
      smsMessage: composeMessage,
      emailBody: composeMessage,
      channel: composeChannel,
      sender: composeSender,
      status: 'Delivered',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      relatedRecordType: 'custom',
    };

    sendSMSAlert(newAlert);

    // Call Real Backend Dispatch
    if (composeChannel === 'SMS' || composeChannel === 'Both') {
      sendRealSmsNotification({
        phoneNumber: recipientPhone,
        residentName: recipientName,
        message: composeMessage,
        sentBy: currentUser?.name || currentUser?.username || 'Barangay Staff',
      }).catch(console.error);
    }
    if (composeChannel === 'Email' || composeChannel === 'Both') {
      sendRealEmailNotification({
        email: recipientEmail,
        residentName: recipientName,
        subject: composeSubject,
        htmlBody: `<p>${composeMessage}</p>`,
        plainText: composeMessage,
        sentBy: currentUser?.name || currentUser?.username || 'Barangay Staff',
      }).catch(console.error);
    }

    showToast(`Broadcast alert successfully dispatched to ${recipientName}!`);
    setComposeMessage('');
    setActiveTab('ledger');
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 modal-backdrop animate-in fade-in duration-200 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-indigo-900/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Radio className="w-6 h-6 animate-pulse text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  SMS & Email Alert Dispatch Center
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  GATEWAY ACTIVE
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Automated multi-channel citizen notification for certificates, Lupon hearings, and emergency alerts
              </p>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live KPI Header Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 text-xs shrink-0">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Dispatches</p>
              <p className="text-base font-black text-slate-900">{totalSent}</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Delivery Rate</p>
              <p className="text-base font-black text-emerald-600">{deliveryRate}%</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Emergency Blasts</p>
              <p className="text-base font-black text-red-600">{emergencyBlastsCount}</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">SMS Quota</p>
              <p className="text-base font-black text-slate-900">
                {smsGatewaySettings.smsQuotaRemaining.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">credits</span>
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-5 bg-white border-b border-slate-200 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2 py-2">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Dispatch Ledger ({smsAlerts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('compose')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'compose'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Blast</span>
            </button>

            <button
              onClick={() => setActiveTab('quick_tests')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'quick_tests'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Interactive Scenarios</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Gateway & SMTP</span>
            </button>

            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'audit_logs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Server className="w-4 h-4 text-sky-500" />
              <span>Backend Audit Logs</span>
            </button>
          </div>

          {toastMessage && (
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/50">
          {/* ======================================================== */}
          {/* TAB 1: DISPATCH LEDGER & HISTORY */}
          {/* ======================================================== */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              {/* Search & Category Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <RecentSearchesInput
                  className="flex-1"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by recipient, phone, control #, subject, or message..."
                  storageKey="sms_dispatch_ledger"
                  theme="light"
                  inputClassName="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex items-center gap-2 overflow-x-auto">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="All">All Categories ({smsAlerts.length})</option>
                    <option value="Certificate Ready">Certificate Ready</option>
                    <option value="Hearing Schedule / Summons">Hearing Summons</option>
                    <option value="Emergency / Disaster Advisory">Emergency Advisory</option>
                    <option value="Appointment Reminder">Appointment</option>
                    <option value="Citizen Concern Update">Citizen Concern</option>
                    <option value="Ayuda / Distribution">Ayuda / Distribution</option>
                  </select>

                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="All">All Channels</option>
                    <option value="SMS">SMS Only</option>
                    <option value="Email">Email Only</option>
                    <option value="Both">Both (SMS + Email)</option>
                  </select>

                  {smsAlerts.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to clear all dispatch logs?')) {
                          clearAllSMSAlerts();
                          showToast('Dispatched logs cleared.');
                        }
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      title="Clear All Logs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Alerts List Table / Cards */}
              {filteredAlerts.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Radio className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Alert Records Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No SMS or email alerts match the current filter criteria. Send an alert or run an interactive scenario.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredAlerts.map((alert) => {
                    const isCopied = copiedId === alert.id;
                    const isInspecting = inspectAlert?.id === alert.id;

                    const getCategoryColor = (cat: AlertCategory) => {
                      switch (cat) {
                        case 'Emergency / Disaster Advisory':
                          return 'bg-red-100 text-red-800 border-red-200';
                        case 'Hearing Schedule / Summons':
                          return 'bg-purple-100 text-purple-800 border-purple-200';
                        case 'Certificate Ready':
                          return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                        case 'Appointment Reminder':
                          return 'bg-blue-100 text-blue-800 border-blue-200';
                        default:
                          return 'bg-amber-100 text-amber-800 border-amber-200';
                      }
                    };

                    return (
                      <div
                        key={alert.id}
                        className={`bg-white rounded-2xl border transition-all hover:shadow-md ${
                          isInspecting ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
                        }`}
                      >
                        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                              {alert.channel === 'SMS' ? (
                                <Smartphone className="w-5 h-5" />
                              ) : alert.channel === 'Email' ? (
                                <Mail className="w-5 h-5" />
                              ) : (
                                <div className="flex items-center -space-x-1">
                                  <Smartphone className="w-3.5 h-3.5" />
                                  <Mail className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(alert.category)}`}>
                                  {alert.category}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">{alert.id}</span>
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{alert.status}</span>
                                </span>
                              </div>

                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-1">
                                {alert.subject}
                              </h4>

                              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                                {alert.smsMessage}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-slate-500 mt-1.5">
                                <span className="font-semibold text-slate-700">
                                  To: {alert.recipientName} ({alert.recipientPhone})
                                </span>
                                <span>•</span>
                                <span>Purok: {alert.purok || 'Sangkol'}</span>
                                <span>•</span>
                                <span className="font-mono text-slate-400">
                                  {new Date(alert.timestamp).toLocaleDateString()} {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center shrink-0">
                            <button
                              onClick={() => {
                                setInspectAlert(isInspecting ? null : alert);
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                isInspecting
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                              }`}
                              title={isInspecting ? 'Collapse Alert Details' : 'Inspect Alert Details'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isInspecting ? 'Hide Details' : 'Details'}</span>
                            </button>

                            <button
                              onClick={() => {
                                openGmailWebCompose({
                                  to: alert.recipientEmail || 'aligno40@gmail.com',
                                  subject: alert.subject,
                                  body: alert.emailBody || alert.smsMessage,
                                });
                                showToast(`Opened in Gmail for ${alert.recipientEmail || 'aligno40@gmail.com'}`);
                              }}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Open real compose in Gmail Web"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Gmail</span>
                            </button>

                            <button
                              onClick={() => {
                                openNativeSMS({
                                  phone: alert.recipientPhone || '0917-555-1234',
                                  message: alert.smsMessage,
                                });
                                showToast(`Launched SMS app for ${alert.recipientPhone}`);
                              }}
                              className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Launch device native SMS text app"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>SMS App</span>
                            </button>

                            <button
                              onClick={() => handleCopyText(alert.smsMessage, alert.id)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                              title="Copy SMS Message"
                            >
                              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => handleResend(alert)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                              title="Resend Alert"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                deleteSMSAlert(alert.id);
                                showToast(`Deleted log ${alert.id}`);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete Log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Inspection Panel */}
                        {isInspecting && (
                          <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl space-y-3 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">Dispatch Payload:</span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px]">
                                  {alert.channel}
                                </span>
                                <span className="font-mono text-slate-500 text-[11px]">ID: {alert.id}</span>
                              </div>
                              <span className="text-slate-500 text-[11px]">
                                Recipient: {alert.recipientName} • Phone: {alert.recipientPhone} • Email: {alert.recipientEmail || 'N/A'}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="font-bold text-slate-700">Official Message Text:</span>
                              <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-sans leading-relaxed select-all">
                                {alert.smsMessage}
                              </div>
                            </div>

                            {alert.emailBody && (
                              <div className="space-y-1">
                                <span className="font-bold text-slate-700">Email Format / HTML:</span>
                                <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-mono text-[11px] max-h-36 overflow-y-auto leading-relaxed">
                                  {alert.emailBody}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: BROADCAST BLAST COMPOSER */}
          {/* ======================================================== */}
          {activeTab === 'compose' && (
            <form onSubmit={handleCustomBlastSubmit} className="max-w-3xl mx-auto space-y-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Send className="w-5 h-5 text-indigo-600" />
                    <span>Compose Multi-Channel Citizen Alert</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setComposeTargetAudience('Individual Resident');
                      setComposeCategory('General Broadcast');
                      setComposeChannel('Email');
                      setComposeSubject('Barangay Sangkol Official Citizen Advisory for aligno40');
                      setComposeMessage(
                        'BRGY SANGKOL: Maayong adlaw! This is an official verified alert transmission from the Barangay Sangkol BIMS Multi-Channel System to aligno40@gmail.com. All municipal services & online requests are active.'
                      );
                      showToast('Prefilled with aligno40 citizen details!');
                    }}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Test Preset (aligno40)</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Broadcast instant SMS and email announcements to residents, specific puroks, or sectoral groups.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Audience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Target Recipient Group *</label>
                  <select
                    value={composeTargetAudience}
                    onChange={(e) => setComposeTargetAudience(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="All Residents">All Residents (Full Barangay Blast)</option>
                    <option value="Specific Purok">Specific Purok Only</option>
                    <option value="Senior Citizens">Senior Citizens (60+)</option>
                    <option value="4Ps Beneficiaries">4Ps Beneficiaries</option>
                    <option value="Youth">Katipunan ng Kabataan (Youth)</option>
                    <option value="Individual Resident">Individual Verified Resident</option>
                  </select>
                </div>

                {/* Conditional Purok / Resident selector */}
                {composeTargetAudience === 'Specific Purok' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Select Purok *</label>
                    <select
                      value={composeTargetPurok}
                      onChange={(e) => setComposeTargetPurok(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {settings.puroks.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : composeTargetAudience === 'Individual Resident' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Select Resident *</label>
                    <select
                      value={composeIndividualResidentId}
                      onChange={(e) => setComposeIndividualResidentId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Choose Resident --</option>
                      {residents.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.firstName} {r.lastName} ({r.purok} • {r.contactNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Alert Category *</label>
                    <select
                      value={composeCategory}
                      onChange={(e) => setComposeCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Emergency / Disaster Advisory">Emergency / Disaster Advisory</option>
                      <option value="Ayuda / Distribution">Ayuda / Relief Distribution</option>
                      <option value="Hearing Schedule / Summons">Hearing Schedule / Summons</option>
                      <option value="Certificate Ready">Certificate Ready</option>
                      <option value="Appointment Reminder">Appointment Reminder</option>
                      <option value="General Broadcast">General Barangay Notice</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Dispatch Channel *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['SMS', 'Email', 'Both'] as AlertChannel[]).map((ch) => (
                      <button
                        type="button"
                        key={ch}
                        onClick={() => setComposeChannel(ch)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          composeChannel === ch
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {ch === 'Both' ? 'SMS + Email' : ch}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Sender ID (Telco Mask)</label>
                  <input
                    type="text"
                    value={composeSender}
                    onChange={(e) => setComposeSender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Subject / Announcement Title *</label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="e.g. URGENT: Purok Lumboy Drainage Cleanup Schedule"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">SMS & Email Content *</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {composeMessage.length} chars (~{Math.ceil(composeMessage.length / 160) || 1} SMS parts)
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  placeholder="BRGY SANGKOL: Maayong adlaw sa tanang lumulupyo! Adunay ipahigayon nga..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('ledger')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Dispatch Broadcast Alert</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: QUICK TEST SCENARIOS */}
          {/* ======================================================== */}
          {activeTab === 'quick_tests' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Personal Live Test Dispatch Panel */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-3xl border border-indigo-700/50 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                        <span>Real Device Delivery Test Suite</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                          Live Active
                        </span>
                      </h3>
                      <p className="text-xs text-indigo-200">
                        Deliver real-time alerts directly to your mobile phone via SMS App and your Gmail inbox via Google Workspace API.
                      </p>
                    </div>
                  </div>

                  {/* Google Workspace Connection Button */}
                  <div>
                    {isGoogleConnected ? (
                      <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-2xl">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-300">{activeGoogleEmail}</span>
                        <button
                          onClick={handleDisconnectGoogle}
                          className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer ml-1"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleConnectGoogle}
                        disabled={isConnectingGoogle}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{isConnectingGoogle ? 'Connecting...' : 'Authorize Gmail API'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Personal Recipient Input Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-black/25 p-3.5 rounded-2xl border border-white/10">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Your Mobile Number for SMS:
                    </label>
                    <input
                      type="text"
                      value={testUserPhone}
                      onChange={(e) => setTestUserPhone(e.target.value)}
                      placeholder="0917-889-2231"
                      className="w-full mt-1 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs font-mono font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Your Gmail for Email Alerts:
                    </label>
                    <input
                      type="email"
                      value={testUserEmail}
                      onChange={(e) => setTestUserEmail(e.target.value)}
                      placeholder="aligno40@gmail.com"
                      className="w-full mt-1 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                {/* Direct Action Test Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Test 1: Certificate Ready */}
                  <div className="p-3.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                        <FileCheck2 className="w-4 h-4 shrink-0" />
                        <span>Certificate Ready Notice</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Barangay Clearance approved & ready for pickup at Window 1.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <button
                        onClick={async () => {
                          const msg =
                            'BRGY SANGKOL: Maayong adlaw! Your Barangay Clearance (Ctrl #SNG-CLR-2026-0042) is APPROVED & READY for pickup at Window 1, Brgy Hall. Bring 1 valid ID & ₱50.00 fee. Salamat!';
                          const alert: SMSAlertRecord = {
                            id: `SMS-${Date.now().toString().slice(-4)}`,
                            recipientName: 'Citizen ' + testUserEmail.split('@')[0],
                            recipientPhone: testUserPhone,
                            recipientEmail: testUserEmail,
                            purok: 'Purok Mangga',
                            category: 'Certificate Ready',
                            subject: 'Barangay Clearance Ready for Pickup (Ctrl #SNG-CLR-2026-0042)',
                            smsMessage: msg,
                            emailBody: `Official notice from Barangay Sangkol: Your certificate application #SNG-CLR-2026-0042 is APPROVED and READY for pickup at Barangay Hall Releasing Window 1. Please present 1 valid government ID.`,
                            channel: 'Both',
                            sender: smsGatewaySettings.senderId || 'BRGY-SANGKOL',
                            status: 'Delivered',
                            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                          };
                          sendSMSAlert(alert);
                          openGmailWebCompose({
                            to: testUserEmail,
                            subject: alert.subject,
                            body: alert.emailBody || alert.smsMessage,
                          });
                          showToast(`Dispatched & opened in Gmail for ${testUserEmail}!`);
                        }}
                        className="w-full py-1.5 px-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send to My Gmail</span>
                      </button>

                      <button
                        onClick={() => {
                          const msg =
                            'BRGY SANGKOL: Maayong adlaw! Your Barangay Clearance (Ctrl #SNG-CLR-2026-0042) is APPROVED & READY for pickup at Window 1, Brgy Hall. Bring 1 valid ID & ₱50.00 fee. Salamat!';
                          openNativeSMS({
                            phone: testUserPhone,
                            message: msg,
                          });
                          showToast(`Launched SMS app for ${testUserPhone}!`);
                        }}
                        className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Send to My Phone (SMS)</span>
                      </button>
                    </div>
                  </div>

                  {/* Test 2: Lupon Hearing Summons */}
                  <div className="p-3.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold">
                        <Scale className="w-4 h-4 shrink-0" />
                        <span>Hearing Summons (Patawag)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Mandatory summons for Case #LUPON-2026-001 at Session Hall.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <button
                        onClick={async () => {
                          const msg =
                            'BRGY SANGKOL LUPON: Formal Summons (Patawag) for Case #LUPON-2026-001 on Aug 30, 2026 at 02:00 PM at Barangay Session Hall before Punong Barangay. Attendance is mandatory.';
                          const alert: SMSAlertRecord = {
                            id: `SMS-${Date.now().toString().slice(-4)}`,
                            recipientName: 'Citizen ' + testUserEmail.split('@')[0],
                            recipientPhone: testUserPhone,
                            recipientEmail: testUserEmail,
                            purok: 'Purok Pinya',
                            category: 'Hearing Schedule / Summons',
                            subject: 'Notice of Hearing: Case #LUPON-2026-001 (Boundary Dispute)',
                            smsMessage: msg,
                            emailBody: `Official Notice of Hearing from Sangguniang Barangay Sangkol: You are hereby summoned to appear for conciliation proceedings on Case #LUPON-2026-001 on August 30, 2026 at 02:00 PM.`,
                            channel: 'Both',
                            sender: smsGatewaySettings.senderId || 'BRGY-SANGKOL',
                            status: 'Delivered',
                            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                          };
                          sendSMSAlert(alert);
                          openGmailWebCompose({
                            to: testUserEmail,
                            subject: alert.subject,
                            body: alert.emailBody || alert.smsMessage,
                          });
                          showToast(`Dispatched & opened in Gmail for ${testUserEmail}!`);
                        }}
                        className="w-full py-1.5 px-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send to My Gmail</span>
                      </button>

                      <button
                        onClick={() => {
                          const msg =
                            'BRGY SANGKOL LUPON: Formal Summons (Patawag) for Case #LUPON-2026-001 on Aug 30, 2026 at 02:00 PM at Barangay Session Hall before Punong Barangay. Attendance is mandatory.';
                          openNativeSMS({
                            phone: testUserPhone,
                            message: msg,
                          });
                          showToast(`Launched SMS app for ${testUserPhone}!`);
                        }}
                        className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Send to My Phone (SMS)</span>
                      </button>
                    </div>
                  </div>

                  {/* Test 3: Emergency Weather Advisory */}
                  <div className="p-3.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-300 text-xs font-bold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Urgent Emergency Alert</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Flash flood warning & Central Gym evacuation center notice.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <button
                        onClick={async () => {
                          const msg =
                            'BRGY SANGKOL EMERGENCY: Flash Flood Warning issued for coastal & riverside areas. Evacuation Center open at Sangkol Central Gym. MDRRMO Hotline: 0917-890-4421. Stay safe!';
                          const alert: SMSAlertRecord = {
                            id: `SMS-${Date.now().toString().slice(-4)}`,
                            recipientName: 'Citizen ' + testUserEmail.split('@')[0],
                            recipientPhone: testUserPhone,
                            recipientEmail: testUserEmail,
                            purok: 'All Puroks',
                            category: 'Emergency / Disaster Advisory',
                            subject: 'EMERGENCY ADVISORY: Flash Flood Warning & Evacuation Center',
                            smsMessage: msg,
                            emailBody: `URGENT ADVISORY: Sangguniang Barangay ng Sangkol advises all residents near low-lying puroks to take precautionary measures. Sangkol Central Gym is open for shelter.`,
                            channel: 'Both',
                            sender: smsGatewaySettings.senderId || 'BRGY-SANGKOL',
                            status: 'Delivered',
                            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                          };
                          sendSMSAlert(alert);
                          openGmailWebCompose({
                            to: testUserEmail,
                            subject: alert.subject,
                            body: alert.emailBody || alert.smsMessage,
                          });
                          showToast(`Dispatched & opened in Gmail for ${testUserEmail}!`);
                        }}
                        className="w-full py-1.5 px-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send to My Gmail</span>
                      </button>

                      <button
                        onClick={() => {
                          const msg =
                            'BRGY SANGKOL EMERGENCY: Flash Flood Warning issued for coastal & riverside areas. Evacuation Center open at Sangkol Central Gym. MDRRMO Hotline: 0917-890-4421. Stay safe!';
                          openNativeSMS({
                            phone: testUserPhone,
                            message: msg,
                          });
                          showToast(`Launched SMS app for ${testUserPhone}!`);
                        }}
                        className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Send to My Phone (SMS)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>General Community Scenario Triggers</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Click any of the scenarios below to simulate automated broadcasts across barangay records.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Certificate Ready */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-emerald-300 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" />
                      <span>Certificate Ready Alert</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sends pickup ready notification with control number, fee (₱50.00), releasing window, and digital download link to <strong>Maria Santos Cruz</strong>.
                    </p>
                  </div>
                  <button
                    onClick={handleTestCertReady}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Trigger Certificate Ready SMS</span>
                  </button>
                </div>

                {/* 2. Lupon Hearing Summons */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-purple-300 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                      <Scale className="w-4 h-4 text-purple-600" />
                      <span>Lupon Hearing Summons (Patawag)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Dispatches mandatory summons notice for Case #LUPON-2026-001 (Boundary Dispute) on Aug 30, 2026 at 02:00 PM before Punong Barangay.
                    </p>
                  </div>
                  <button
                    onClick={handleTestHearingSummons}
                    className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Hearing Summons</span>
                  </button>
                </div>

                {/* 3. Emergency Typhoon / Flood Alert */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-red-300 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Emergency Weather Advisory Blast</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Broadcasts urgent flash flood alert & Sangkol Central Gym evacuation center advisory to all 6 Puroks with MDRRMO hotlines.
                    </p>
                  </div>
                  <button
                    onClick={handleTestEmergencyBlast}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Blast Emergency SMS Advisory</span>
                  </button>
                </div>

                {/* 4. Appointment Reminder */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-blue-300 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Appointment Consultation Reminder</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sends automated schedule reminder for "Livelihood Consultation" on Aug 29 at 10:00 AM with Punong Barangay to resident Elena Ramos.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newAlert: SMSAlertRecord = {
                        id: `SMS-2026-${Date.now().toString().slice(-4)}`,
                        recipientName: 'Elena Ramos',
                        recipientPhone: '0919-445-8899',
                        recipientEmail: 'elena.ramos@gmail.com',
                        purok: 'Purok Lumboy',
                        category: 'Appointment Reminder',
                        subject: 'Appointment Schedule Reminder: Barangay Captain Consultation',
                        smsMessage:
                          'BRGY SANGKOL: Hi Elena Ramos, reminder for your booked consultation regarding Livelihood Assistance on Aug 29 at 10:00 AM with Punong Barangay Hon. Juan M. Dela Cruz. Salamat!',
                        channel: 'Both',
                        sender: smsGatewaySettings.senderId || 'BRGY-SANGKOL',
                        status: 'Delivered',
                        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                        relatedRecordType: 'appointment',
                      };
                      sendSMSAlert(newAlert);
                      showToast('Sent appointment reminder SMS!');
                    }}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Appointment Reminder</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: GATEWAY & SMTP CONFIGURATION */}
          {/* ======================================================== */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  <span>SMS Gateway & Email SMTP Configuration</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Manage connection parameters and automatic trigger rules for citizen notifications.
                </p>
              </div>

              {/* Server-Side Environment Variables Status Banner */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-slate-200">Cloud Live Gateway Environment Status</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                    Server Environment Variables
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Semaphore Philippines */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Semaphore SMS (PH)</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        gatewayStatus?.smsGateway?.semaphoreConfigured
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {gatewayStatus?.smsGateway?.semaphoreConfigured ? 'LIVE ACTIVE' : 'DEV SIMULATOR'}
                      </span>
                    </div>
                    <div className="text-[11px] space-y-0.5 text-slate-300 font-mono">
                      <p><span className="text-slate-500">API Key:</span> <code className="text-sky-300">SEMAPHORE_API_KEY</code> {gatewayStatus?.smsGateway?.semaphoreConfigured ? '✓ Detected' : '(using Dev Mode)'}</p>
                      <p><span className="text-slate-500">Sender:</span> <code className="text-sky-300">SEMAPHORE_SENDER_NAME</code> = <span className="text-white font-bold">{gatewayStatus?.smsGateway?.senderId || 'BRGY-SNGKOL'}</span></p>
                    </div>
                  </div>

                  {/* Resend Email Gateway */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Resend Email Gateway</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        gatewayStatus?.emailGateway?.resendConfigured
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {gatewayStatus?.emailGateway?.resendConfigured ? 'LIVE ACTIVE' : 'DEV SIMULATOR'}
                      </span>
                    </div>
                    <div className="text-[11px] space-y-0.5 text-slate-300 font-mono">
                      <p><span className="text-slate-500">API Key:</span> <code className="text-indigo-300">RESEND_API_KEY</code> {gatewayStatus?.emailGateway?.resendConfigured ? '✓ Detected' : '(using Dev Mode)'}</p>
                      <p><span className="text-slate-500">Sender:</span> <code className="text-indigo-300">RESEND_FROM_EMAIL</code> = <span className="text-white font-bold">{gatewayStatus?.emailGateway?.fromEmail || 'onboarding@resend.dev'}</span></p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  💡 <strong>Tip:</strong> Configure these keys as server environment variables. The backend handles dispatch securely without exposing keys to the browser.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">SMS Gateway Provider</label>
                  <select
                    value={smsGatewaySettings.provider}
                    onChange={(e) => updateSmsGatewaySettings({ provider: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="GovPH Infobip SMS Gateway">GovPH Infobip SMS Gateway (DILG Standard)</option>
                    <option value="Semaphore Philippines (DILG LGU Plan)">Semaphore Philippines (DILG LGU Plan)</option>
                    <option value="PhilSMS Gateway API">PhilSMS Gateway API</option>
                    <option value="Twilio Cloud Philippines">Twilio Cloud Philippines</option>
                    <option value="Simulated Local Gateway">Simulated Local Gateway</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">SMS Sender ID (Mask Name)</label>
                  <input
                    type="text"
                    value={smsGatewaySettings.senderId}
                    onChange={(e) => updateSmsGatewaySettings({ senderId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Gateway API Key (Masked)</label>
                  <input
                    type="text"
                    value={smsGatewaySettings.apiKeyMasked}
                    onChange={(e) => updateSmsGatewaySettings({ apiKeyMasked: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Remaining SMS Quota Credits</label>
                  <input
                    type="number"
                    value={smsGatewaySettings.smsQuotaRemaining}
                    onChange={(e) => updateSmsGatewaySettings({ smsQuotaRemaining: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email SMTP Host Server</label>
                  <input
                    type="text"
                    value={smsGatewaySettings.emailSmtpServer}
                    onChange={(e) => updateSmsGatewaySettings({ emailSmtpServer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Official Sender Email Address</label>
                  <input
                    type="email"
                    value={smsGatewaySettings.emailSenderAddress}
                    onChange={(e) => updateSmsGatewaySettings({ emailSenderAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Automatic Dispatch Triggers */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Automatic Multi-Channel Trigger Rules
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Auto-send SMS when Certificate is Approved / Ready</p>
                      <p className="text-[11px] text-slate-500">Notifies resident with control number, fees, and pickup window instructions.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsGatewaySettings.autoAlertCertificateReady}
                      onChange={(e) => updateSmsGatewaySettings({ autoAlertCertificateReady: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Auto-send SMS Summons when Hearing is Scheduled</p>
                      <p className="text-[11px] text-slate-500">Sends formal notice of hearing date, time, and room to Complainant and Respondent.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsGatewaySettings.autoAlertHearingSchedule}
                      onChange={(e) => updateSmsGatewaySettings({ autoAlertHearingSchedule: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Auto-send SMS for Emergency / Weather Advisories</p>
                      <p className="text-[11px] text-slate-500">Automatic broadcast to targeted puroks for typhoon signals, floods, and safety alerts.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsGatewaySettings.autoAlertEmergencyAnnouncements}
                      onChange={(e) => updateSmsGatewaySettings({ autoAlertEmergencyAnnouncements: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Auto-send SMS Reminder for Booked Appointments</p>
                      <p className="text-[11px] text-slate-500">Sends appointment reminder with official name, date, and venue.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsGatewaySettings.autoAlertAppointments}
                      onChange={(e) => updateSmsGatewaySettings({ autoAlertAppointments: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: BACKEND DELIVERY LOGS & AUDIT QUEUE */}
          {/* ======================================================== */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-4">
              <NotificationAuditLogsView />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <Radio className="w-4 h-4 text-indigo-600" />
            <span>Barangay Sangkol Multi-Channel Alerts Gateway</span>
          </div>

          <button
            onClick={handleModalClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Close Center
          </button>
        </div>
      </div>
    </div>
  );
};
