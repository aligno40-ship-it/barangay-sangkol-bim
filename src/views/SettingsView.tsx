import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { DataImportModal } from '../components/DataImportModal';
import { BarangaySangkolSeal, RepublicSeal } from '../components/OfficialSeals';
import { InfoButton } from '../components/InfoButton';
import {
  Settings,
  Save,
  Download,
  Upload,
  RefreshCw,
  Database,
  Building,
  DollarSign,
  Users,
  CheckCircle2,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Shield,
  FileCheck,
  UserCog,
  Sun,
  Moon,
  Laptop,
  Check,
  MapPin,
  FileText,
  BadgeCheck,
  Sliders,
  LayoutGrid,
  ListFilter,
  AlertCircle,
  HelpCircle,
  Clock,
  Phone,
  Mail,
  Home,
  Award,
  FileSpreadsheet,
  Cookie,
  Scale,
  ShieldCheck,
  Activity,
  Calendar,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { BarangaySettings } from '../types';
import { compressSealImage } from '../utils/imageUtils';

type SettingsTab =
  | 'appearance'
  | 'general'
  | 'branding'
  | 'signatories'
  | 'fees'
  | 'puroks'
  | 'users'
  | 'database'
  | 'compliance';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDatabaseBackup,
    restoreDatabaseBackup,
    resetToInitialData,
    setActiveModule,
    users,
    theme,
    isDarkMode,
    setTheme,
    toggleDarkMode,
    currentUser,
    reconciliationReport,
    isReconciling,
    lastReconciliationCheck,
    reconcileDatabase,
    residents,
    households,
    certificates,
    blotters,
    complaints,
    businesses,
    allTransactions,
    officials,
  } = useBarangay();

  // Local form state
  const [formData, setFormData] = useState<BarangaySettings>({
    ...settings,
    tagline: settings.tagline || '',
    logoUrl: settings.logoUrl || '',
    republicLogoUrl: settings.republicLogoUrl || '',
    captainSignatureUrl: settings.captainSignatureUrl || '',
    skChairperson: settings.skChairperson || '',
    kagawads: settings.kagawads || [],
    termStart: settings.termStart || '',
    termEnd: settings.termEnd || '',
    puroks: settings.puroks || [],
    certificateFees: settings.certificateFees || {
      'Barangay Clearance': settings.clearanceFeeRegular || 50,
      'Business Clearance': settings.businessClearanceFee || 300,
      'Residency Certification': settings.residencyCertFee || 50,
      'Indigency Certificate': settings.indigencyCertFee || 0,
      'Good Moral Character': settings.goodMoralFee || 50,
    },
    theme: theme,
    isDarkMode: isDarkMode,
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [viewMode, setViewMode] = useState<'tabbed' | 'all'>('tabbed');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);
  const [newPurokName, setNewPurokName] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [logoInputMethod, setLogoInputMethod] = useState<'upload' | 'url'>('upload');
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [republicInputMethod, setRepublicInputMethod] = useState<'upload' | 'url'>('upload');
  const [republicLogoUploadError, setRepublicLogoUploadError] = useState<string | null>(null);
  const [isUploadingRepublicLogo, setIsUploadingRepublicLogo] = useState(false);
  const [republicLogoSaveSuccess, setRepublicLogoSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const republicFileInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);

  const handleCaptainSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Signature image size should be under 5MB.");
      return;
    }
    setIsUploadingSignature(true);
    try {
      const dataUrl = await compressSealImage(file, 500);
      const updated = { ...formData, captainSignatureUrl: dataUrl };
      setFormData(updated);
      await updateSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Failed to process/save signature:', err);
      alert(err?.message || "Failed to process signature image.");
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleRemoveCaptainSignature = async () => {
    const updated = { ...formData, captainSignatureUrl: "" };
    setFormData(updated);
    if (signatureInputRef.current) {
      signatureInputRef.current.value = "";
    }
    try {
      await updateSettings(updated);
    } catch (err: any) {
      console.error('Failed to remove signature in DB:', err);
    }
  };

  const handleKagawadChange = (index: number, val: string) => {
    const list = [...(formData.kagawads || [])];
    list[index] = val;
    setFormData((prev) => ({ ...prev, kagawads: list }));
  };

  const handleAddKagawad = () => {
    const list = [...(formData.kagawads || [])];
    list.push("Hon. Councilor " + (list.length + 1));
    setFormData((prev) => ({ ...prev, kagawads: list }));
  };

  const handleRemoveKagawad = (index: number) => {
    const list = [...(formData.kagawads || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, kagawads: list }));
  };

  // Sync external settings changes if modified elsewhere
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...settings,
      tagline: settings.tagline || prev.tagline || '',
      logoUrl: settings.logoUrl || prev.logoUrl || '',
      republicLogoUrl: settings.republicLogoUrl || prev.republicLogoUrl || '',
      captainSignatureUrl: settings.captainSignatureUrl || prev.captainSignatureUrl || '',
      theme: theme,
      isDarkMode: isDarkMode,
    }));
  }, [settings, theme, isDarkMode]);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(settings);
  }, [formData, settings]);

  const handleSaveAllSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateSettings(formData);
      setSaveSuccess(true);
      setLogoSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setLogoSaveSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error('Save settings error:', err);
      setSaveError(err?.message || 'Failed to save settings to Supabase database. Please check connection and retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setFormData({
      ...settings,
      tagline: settings.tagline || '',
      logoUrl: settings.logoUrl || '',
      republicLogoUrl: settings.republicLogoUrl || '',
      captainSignatureUrl: settings.captainSignatureUrl || '',
      skChairperson: settings.skChairperson || '',
      kagawads: settings.kagawads || [],
      termStart: settings.termStart || '',
      termEnd: settings.termEnd || '',
      puroks: settings.puroks || [],
      certificateFees: settings.certificateFees || {
        'Barangay Clearance': settings.clearanceFeeRegular || 50,
        'Business Clearance': settings.businessClearanceFee || 300,
        'Residency Certification': settings.residencyCertFee || 50,
        'Indigency Certificate': settings.indigencyCertFee || 0,
        'Good Moral Character': settings.goodMoralFee || 50,
      },
      theme: settings.theme || 'light',
      isDarkMode: settings.isDarkMode || false,
    });
    setLogoUploadError(null);
    setRepublicLogoUploadError(null);
    setSaveError(null);
  };

  const handleThemeSelect = (selectedTheme: 'light' | 'dark' | 'system') => {
    const isDark = selectedTheme === 'dark';
    const updated = {
      ...formData,
      theme: selectedTheme,
      isDarkMode: isDark,
    };
    setFormData(updated);
    setTheme(selectedTheme);
  };

  // Handle Logo Image Upload with automatic transparency & compression
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoUploadError(null);
    setSaveError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError('Image file is too large (max 5MB). Please choose a smaller logo.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const optimizedSeal = await compressSealImage(file, 600);
      const updated = { ...formData, logoUrl: optimizedSeal };
      setFormData(updated);
      await updateSettings(updated);
      setLogoSaveSuccess(true);
      setTimeout(() => setLogoSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Failed to upload/save logo:', err);
      setLogoUploadError(err?.message || 'Failed to save logo to database. Please try another file.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleResetLogoToDefault = async () => {
    const updated = { ...formData, logoUrl: '' };
    setFormData(updated);
    setLogoUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    try {
      await updateSettings(updated);
      setLogoSaveSuccess(true);
      setTimeout(() => setLogoSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Failed to reset logo in DB:', err);
      setLogoUploadError('Failed to reset logo in database.');
    }
  };

  // Handle Republic of the Philippines Logo Upload with automatic transparency & compression
  const handleRepublicLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setRepublicLogoUploadError(null);
    setSaveError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setRepublicLogoUploadError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setRepublicLogoUploadError('Image file is too large (max 5MB). Please choose a smaller file.');
      return;
    }

    setIsUploadingRepublicLogo(true);
    try {
      const optimizedSeal = await compressSealImage(file, 600);
      const updated = { ...formData, republicLogoUrl: optimizedSeal };
      setFormData(updated);
      await updateSettings(updated);
      setRepublicLogoSaveSuccess(true);
      setTimeout(() => setRepublicLogoSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Failed to upload/save Republic seal:', err);
      setRepublicLogoUploadError(err?.message || 'Failed to save Republic Seal to database. Please try another file.');
    } finally {
      setIsUploadingRepublicLogo(false);
    }
  };

  const handleResetRepublicLogoToDefault = async () => {
    const updated = { ...formData, republicLogoUrl: '' };
    setFormData(updated);
    setRepublicLogoUploadError(null);
    if (republicFileInputRef.current) {
      republicFileInputRef.current.value = '';
    }
    try {
      await updateSettings(updated);
      setRepublicLogoSaveSuccess(true);
      setTimeout(() => setRepublicLogoSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Failed to reset Republic Seal in DB:', err);
      setRepublicLogoUploadError('Failed to reset Republic Seal in database.');
    }
  };

  const handleAddPurok = () => {
    if (!newPurokName.trim()) return;
    const currentPuroks = formData.puroks || [];
    if (currentPuroks.some((p) => p.toLowerCase() === newPurokName.trim().toLowerCase())) {
      alert('This Purok zone is already registered in the list.');
      return;
    }
    const updated = [...currentPuroks, newPurokName.trim()];
    setFormData({ ...formData, puroks: updated });
    setNewPurokName('');
  };

  const handleRemovePurok = (purokToRemove: string) => {
    const currentPuroks = formData.puroks || [];
    const updated = currentPuroks.filter((p) => p !== purokToRemove);
    setFormData({ ...formData, puroks: updated });
  };

  const handleFeeChange = (certType: string, newFee: number) => {
    const safeFee = Math.max(0, isNaN(newFee) ? 0 : newFee);
    const currentFees = formData.certificateFees || {};
    setFormData({
      ...formData,
      certificateFees: {
        ...currentFees,
        [certType]: safeFee,
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = restoreDatabaseBackup(content);
        if (res.success) {
          alert(res.message);
        } else {
          alert(`Restore failed: ${res.message}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const puroksList = formData.puroks || [];
  const feesMap = formData.certificateFees || {
    'Barangay Clearance': 50,
    'Business Clearance': 300,
    'Residency Certification': 50,
    'Indigency Certificate': 0,
    'Good Moral Character': 50,
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'appearance', label: 'Dark Mode & Theme', icon: Moon },
    { id: 'general', label: 'General & Jurisdiction', icon: Building },
    { id: 'branding', label: 'Official Seal & Branding', icon: ImageIcon },
    { id: 'signatories', label: 'Signatories & Officials', icon: Award },
    { id: 'fees', label: 'Fee Schedule (₱)', icon: DollarSign },
    { id: 'puroks', label: 'Purok & Sitio Zones', icon: MapPin, badge: String(puroksList.length) },
    { id: 'users', label: 'Users & Access', icon: Users, badge: String(users.length) },
    { id: 'database', label: 'Backup & Recovery', icon: Database },
    { id: 'compliance', label: 'Privacy & Legal', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 pb-20 text-slate-900 dark:text-slate-100">
      {/* Top Header & Sticky Control Bar */}
      <div className="sticky top-16 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 border-b border-slate-200 dark:border-slate-800 -mx-3 sm:-mx-6 px-3 sm:px-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
                  <span>Barangay Settings & System Administration</span>
                  <InfoButton
                    title="Settings & Administration"
                    info="Institutional LGU profile, visual appearance, fee schedules & database maintenance."
                    variant="light"
                  />
                </h2>
              </div>
            </div>
          </div>

          {/* Professional Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Unsaved Changes Status Badge */}
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-bold animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Unsaved Changes</span>
              </span>
            ) : (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Up to Date</span>
              </span>
            )}

            {/* Quick Dark / Light Switcher */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* View Mode Toggle: Tabbed vs Full */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'tabbed' ? 'all' : 'tabbed')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Toggle between categorized tabs and full single-page layout"
            >
              {viewMode === 'tabbed' ? (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Show All Sections</span>
                </>
              ) : (
                <>
                  <ListFilter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Tabbed View</span>
                </>
              )}
            </button>

            {/* Discard Button (if modified) */}
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard</span>
              </button>
            )}

            {/* Primary Save Button */}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveAllSettings()}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                isSaving
                  ? 'bg-indigo-400 text-white cursor-not-allowed'
                  : hasUnsavedChanges
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 ring-2 ring-indigo-400/40 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccess && (
          <div className="mt-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between gap-2 text-emerald-900 dark:text-emerald-200 text-xs font-semibold animate-in fade-in duration-200 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Barangay settings, jurisdiction details, logo seal, and leadership roster have been saved successfully to Supabase!</span>
            </div>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
              Saved
            </span>
          </div>
        )}

        {/* Error Alert Banner */}
        {saveError && (
          <div className="mt-2.5 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-xl flex items-center justify-between gap-2 text-rose-900 dark:text-rose-200 text-xs font-semibold animate-in fade-in duration-200 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{saveError}</span>
            </div>
            <button
              type="button"
              onClick={() => handleSaveAllSettings()}
              className="text-[11px] bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded-md cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation Bar (in Tabbed Mode) */}
      {viewMode === 'tabbed' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Form Content */}
      <form onSubmit={handleSaveAllSettings} className="space-y-6">
        {/* ========================================================================= */}
        {/* SECTION 1: APPEARANCE & DARK MODE                                         */}
        {/* ========================================================================= */}
        {(viewMode === 'all' || activeTab === 'appearance') && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Moon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Display Appearance & Dark Mode
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose your visual theme preference for the Barangay Information Management System.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Active Mode:
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {isDarkMode ? '🌙 Dark Mode Active' : '☀️ Light Mode Active'}
                </span>
              </div>
            </div>

            {/* Theme Selectable Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Light Theme Card */}
              <div
                onClick={() => handleThemeSelect('light')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-4 ${
                  formData.theme === 'light'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Light Theme</span>
                    </div>
                    {formData.theme === 'light' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Visual Mockup Preview */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <div className="w-16 h-2 bg-indigo-600 rounded-full"></div>
                      <div className="w-4 h-4 rounded-full bg-slate-200"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2.5 bg-slate-100 rounded-sm"></div>
                      <div className="w-3/4 h-2 bg-slate-100 rounded-sm"></div>
                    </div>
                    <div className="flex gap-1 pt-1">
                      <div className="w-8 h-4 bg-indigo-50 border border-indigo-200 rounded-xs"></div>
                      <div className="w-8 h-4 bg-slate-100 rounded-xs"></div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Standard high-contrast daylight palette with clean white canvases and official stationery styling.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Recommended for daytime & printing
                  </span>
                </div>
              </div>

              {/* Dark Theme Card */}
              <div
                onClick={() => handleThemeSelect('dark')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-4 ${
                  formData.theme === 'dark'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <span>Dark Theme (Midnight)</span>
                    </div>
                    {formData.theme === 'dark' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Visual Mockup Preview */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                      <div className="w-16 h-2 bg-indigo-400 rounded-full"></div>
                      <div className="w-4 h-4 rounded-full bg-slate-700"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2.5 bg-slate-800 rounded-sm"></div>
                      <div className="w-3/4 h-2 bg-slate-800 rounded-sm"></div>
                    </div>
                    <div className="flex gap-1 pt-1">
                      <div className="w-8 h-4 bg-indigo-950/80 border border-indigo-800 rounded-xs"></div>
                      <div className="w-8 h-4 bg-slate-800 rounded-xs"></div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Sleek deep charcoal & midnight tones with glowing accents, engineered for reduced glare and night shifts.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Low Eye-Strain & 24/7 Desk
                  </span>
                </div>
              </div>

              {/* System Preference Card */}
              <div
                onClick={() => handleThemeSelect('system')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-4 ${
                  formData.theme === 'system'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
                      <Laptop className="w-4 h-4 text-cyan-600" />
                      <span>System Synchronized</span>
                    </div>
                    {formData.theme === 'system' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Visual Mockup Preview */}
                  <div className="p-3 bg-gradient-to-r from-white to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/40">
                      <div className="w-16 h-2 bg-cyan-500 rounded-full"></div>
                      <div className="w-4 h-4 rounded-full bg-slate-400"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2.5 bg-slate-200/60 dark:bg-slate-800 rounded-sm"></div>
                      <div className="w-3/4 h-2 bg-slate-200/60 dark:bg-slate-800 rounded-sm"></div>
                    </div>
                    <div className="flex gap-1 pt-1">
                      <div className="w-8 h-4 bg-cyan-100 dark:bg-cyan-950 rounded-xs"></div>
                      <div className="w-8 h-4 bg-slate-300 dark:bg-slate-700 rounded-xs"></div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Automatically mirrors your operating system (Windows, macOS, Android, iOS) dark/light schedule.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                    Automatic OS Adaptation
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Live Preview Notice */}
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  Theme preference is stored locally and synchronizes instantly across all barangay modules, tables, modals, and charts.
                </span>
              </div>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="px-3 py-1 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-lg font-bold text-[11px] cursor-pointer hover:bg-indigo-50 shrink-0"
              >
                Quick Toggle
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: GENERAL & JURISDICTION                                         */}
        {/* ========================================================================= */}
        {(viewMode === 'all' || activeTab === 'general') && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Building className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  LGU Jurisdiction & Official Headings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Government institutional identifiers displayed on all legal certificates, header banners, and receipts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Barangay Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.barangayName}
                  onChange={(e) => setFormData({ ...formData, barangayName: e.target.value })}
                  placeholder="e.g. Barangay Sangkol"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Municipality / City *</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.municipality}
                  onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                  placeholder="e.g. City of Dipolog"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Province *</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="e.g. Province of Zamboanga del Norte"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Region
                </label>
                <input
                  type="text"
                  value={formData.region || 'Region IX - Zamboanga Peninsula'}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="e.g. Region IX - Zamboanga Peninsula"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Postal ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.zipCode || '7100'}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="e.g. 7100"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Official Office Hours</span>
                </label>
                <input
                  type="text"
                  value={formData.officeHours || 'Monday - Friday: 8:00 AM - 5:00 PM'}
                  onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                  placeholder="e.g. Monday - Friday: 8:00 AM - 5:00 PM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Barangay Contact Number</span>
                </label>
                <input
                  type="text"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="e.g. (062) 991-8842 / 0917-890-4421"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Official Email Address</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. barangay.sangkol.office@gov.ph"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>Barangay Hall Complex Address</span>
                </label>
                <input
                  type="text"
                  value={formData.hallAddress}
                  onChange={(e) => setFormData({ ...formData, hallAddress: e.target.value })}
                  placeholder="e.g. Barangay Hall Complex, Purok Mangga"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: SEAL & BRANDING                                                */}
        {/* ========================================================================= */}
        {(viewMode === 'all' || activeTab === 'branding') && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ImageIcon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Barangay Official Logo & Seal Customization
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload or replace your official seal. Changes immediately propagate across all headers, certificates, and ID cards.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={handleResetLogoToDefault}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer"
                    title="Revert back to default vectorized seal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Default Seal</span>
                  </button>
                )}
              </div>
            </div>

            {logoSaveSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-2 text-emerald-800 dark:text-emerald-200 text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold">Barangay Logo updated successfully!</span>
                  <span className="hidden sm:inline text-emerald-700 dark:text-emerald-300">
                    Active across headers, certificates, official receipts, and citizen ID cards.
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-md">
                  Live
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left/Main: Upload / URL Controls */}
              <div className="lg:col-span-7 space-y-4">
                {/* Method Switcher Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 max-w-xs">
                  <button
                    type="button"
                    onClick={() => setLogoInputMethod('upload')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      logoInputMethod === 'upload'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputMethod('url')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      logoInputMethod === 'url'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Image URL</span>
                    </span>
                  </button>
                </div>

                {/* Upload Input Mode */}
                {logoInputMethod === 'upload' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Select Local Logo File (PNG, SVG, JPG, WebP)
                    </label>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all rounded-2xl p-5 text-center cursor-pointer relative group">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoFileUpload}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                          {isUploadingLogo ? (
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                          ) : (
                            <Upload className="w-6 h-6" />
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {isUploadingLogo
                            ? 'Optimizing & saving Barangay Seal...'
                            : 'Click or drag & drop new Barangay Seal here'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Recommended: High resolution transparent PNG or SVG (Max 5MB)
                        </p>
                      </div>
                    </div>
                    {logoUploadError && (
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">
                        {logoUploadError}
                      </p>
                    )}
                  </div>
                ) : (
                  /* URL Input Mode */
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Direct Image Web Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.logoUrl}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value.trim() })}
                        placeholder="https://example.com/barangay-sangkol-seal.png"
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={handleResetLogoToDefault}
                          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Paste any public image URL for the official Barangay emblem.
                    </p>
                  </div>
                )}

                {/* System Propagation Notice */}
                <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Automatic System-Wide Seal Propagation</span>
                  </p>
                  <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed">
                    Saving updates the emblem in the <strong>Top Header Banner</strong>, <strong>Sidebar Menu</strong>, <strong>Official Barangay Clearances</strong>, <strong>Official Receipts</strong>, and <strong>Citizen Resident ID Badges</strong>.
                  </p>
                </div>
              </div>

              {/* Right: Live Preview Box */}
              <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Live Seal Preview</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      formData.logoUrl
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {formData.logoUrl ? 'Custom Seal Active' : 'Default Official Seal'}
                  </span>
                </div>

                {/* Main Preview Box */}
                <div className="flex items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <BarangaySangkolSeal customUrl={formData.logoUrl} size={96} />
                </div>

                {/* Mini Context Previews */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <BarangaySangkolSeal customUrl={formData.logoUrl} size={32} />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">Header & Nav</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">32px Navigation</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <BarangaySangkolSeal customUrl={formData.logoUrl} size={38} />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">Certificates</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Official Letterhead</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Republic of the Philippines Seal Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Shield className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Republic of the Philippines Official Seal (Coat of Arms)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Upload or replace the official national coat of arms. Propagates automatically across all official certificate letterheads, clearances, and permits.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {formData.republicLogoUrl && (
                    <button
                      type="button"
                      onClick={handleResetRepublicLogoToDefault}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer"
                      title="Revert back to standard vectorized national coat of arms"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Default National Seal</span>
                    </button>
                  )}
                </div>
              </div>

              {republicLogoSaveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-2 text-emerald-800 dark:text-emerald-200 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold">Republic of the Philippines Seal updated successfully!</span>
                    <span className="hidden sm:inline text-emerald-700 dark:text-emerald-300">
                      Active on official certificate headers, resolutions, and formal government issuances.
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-md">
                    Live
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Upload / URL Controls */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Method Switcher Tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 max-w-xs">
                    <button
                      type="button"
                      onClick={() => setRepublicInputMethod('upload')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        republicInputMethod === 'upload'
                          ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepublicInputMethod('url')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        republicInputMethod === 'url'
                          ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Image URL</span>
                      </span>
                    </button>
                  </div>

                  {/* Upload Input Mode */}
                  {republicInputMethod === 'upload' ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Select Republic Seal Image (PNG, SVG, JPG, WebP)
                      </label>
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all rounded-2xl p-5 text-center cursor-pointer relative group">
                        <input
                          ref={republicFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          onChange={handleRepublicLogoFileUpload}
                          disabled={isUploadingRepublicLogo}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                            {isUploadingRepublicLogo ? (
                              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                            ) : (
                              <Upload className="w-6 h-6" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {isUploadingRepublicLogo
                              ? 'Optimizing and saving Republic Seal...'
                              : 'Click or drag & drop Republic of the Philippines Seal here'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Recommended: High-resolution transparent PNG or SVG (Max 5MB)
                          </p>
                        </div>
                      </div>
                      {republicLogoUploadError && (
                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">
                          {republicLogoUploadError}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* URL Input Mode */
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Direct Image Web Link for Republic Seal
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.republicLogoUrl || ''}
                          onChange={(e) => setFormData({ ...formData, republicLogoUrl: e.target.value.trim() })}
                          placeholder="https://example.com/republic-of-the-philippines-seal.png"
                          className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                        {formData.republicLogoUrl && (
                          <button
                            type="button"
                            onClick={handleResetRepublicLogoToDefault}
                            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Paste any public image link or CDN URL for the National Coat of Arms.
                      </p>
                    </div>
                  )}

                  {/* Document Alignment Notice */}
                  <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Official Dual Header Standard</span>
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      By Philippine Local Government Code standards, official documents feature the <strong>Republic Coat of Arms</strong> on the left and the <strong>Barangay Official Seal</strong> on the right of the header letterhead.
                    </p>
                  </div>
                </div>

                {/* Right: Live Preview Box */}
                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Live Republic Seal Preview</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        formData.republicLogoUrl
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {formData.republicLogoUrl ? 'Custom Seal Active' : 'Standard Coat of Arms'}
                    </span>
                  </div>

                  {/* Main Preview Box */}
                  <div className="flex items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <RepublicSeal customUrl={formData.republicLogoUrl} size={96} />
                  </div>

                  {/* Header Letterhead Simulation */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                      Official Letterhead Header Preview
                    </p>
                    <div className="flex items-center justify-between gap-3 px-2 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                      <RepublicSeal customUrl={formData.republicLogoUrl} size={42} />
                      <div className="text-center flex-1 min-w-0">
                        <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">
                          Republic of the Philippines
                        </p>
                        <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                          {formData.municipality || 'City of Dipolog'}
                        </p>
                        <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide leading-tight truncate">
                          {formData.barangayName || 'Barangay Sangkol'}
                        </p>
                      </div>
                      <BarangaySangkolSeal customUrl={formData.logoUrl} size={42} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Tagline / Motto Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="max-w-2xl">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Barangay Official Motto / Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Serbisyo Diretso sa Tao / Nagkahiusang Barangay Sangkol"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Printed in letterheads, official resolutions, community broadcasts, and public portal banners.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: SIGNATORIES & LEADERSHIP                                       */}
        {/* ========================================================================= */}
        {(viewMode === 'all' || activeTab === 'signatories') && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Award className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Official Document Signatories & Leadership Roster
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Designated officials whose names and signatures appear on certificates, clearances, and official council records.
                </p>
              </div>
            </div>

            {/* Subsection 4A: Core Executive Signatories */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Executive Signatories</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Punong Barangay (Barangay Captain) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.punongBarangay}
                    onChange={(e) => setFormData({ ...formData, punongBarangay: e.target.value })}
                    placeholder="e.g. Hon. Rodrigo M. Sangkol"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Executive signatory for all issued certifications and clearances.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Barangay Secretary *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.barangaySecretary}
                    onChange={(e) => setFormData({ ...formData, barangaySecretary: e.target.value })}
                    placeholder="e.g. Atty. Maria Elena V. Ramos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Attesting officer on official barangay documents.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Barangay Treasurer *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.barangayTreasurer}
                    onChange={(e) => setFormData({ ...formData, barangayTreasurer: e.target.value })}
                    placeholder="e.g. Mrs. Cynthia T. Bautista"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Collecting & disbursing officer for official receipts.
                  </p>
                </div>
              </div>
            </div>

            {/* Subsection 4B: Punong Barangay Signature Image (Optional) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Punong Barangay Signature Image (Optional)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Upload an authentic transparent PNG or image signature to display automatically above the Captain's name on issued certificates and clearances.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={signatureInputRef}
                    onChange={handleCaptainSignatureUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => signatureInputRef.current?.click()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.captainSignatureUrl ? 'Replace Signature' : 'Upload Signature'}</span>
                  </button>
                  {formData.captainSignatureUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveCaptainSignature}
                      className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Remove signature image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {formData.captainSignatureUrl && (
                <div className="flex items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="h-14 p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <img
                      src={formData.captainSignatureUrl}
                      alt="Captain Signature Preview"
                      className="h-full object-contain max-w-[140px]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <p className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Signature configured
                    </p>
                    <p>Will be embedded on printable certificate templates.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Subsection 4C: SK Chairperson & Term Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>SK Chairperson</span>
                </label>
                <input
                  type="text"
                  value={formData.skChairperson || ''}
                  onChange={(e) => setFormData({ ...formData, skChairperson: e.target.value })}
                  placeholder="e.g. Hon. John Paul V. Alcantara"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Youth council head and ex-officio barangay council member.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Term Start Date</span>
                </label>
                <input
                  type="date"
                  value={formData.termStart || ''}
                  onChange={(e) => setFormData({ ...formData, termStart: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Beginning of official mandate (historical tracking).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Term End Date</span>
                </label>
                <input
                  type="date"
                  value={formData.termEnd || ''}
                  onChange={(e) => setFormData({ ...formData, termEnd: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Scheduled expiry of term of office.
                </p>
              </div>
            </div>

            {/* Subsection 4D: Barangay Kagawads (Councilors) */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Barangay Kagawads (Councilors - usually 7)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Elected councilors representing committees and authorizing council resolutions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddKagawad}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Kagawad</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(formData.kagawads || []).map((kagawad, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                  >
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={kagawad}
                      onChange={(e) => handleKagawadChange(idx, e.target.value)}
                      placeholder={'Hon. Kagawad ' + (idx + 1)}
                      className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveKagawad(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                      title="Remove councilor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: FEE SCHEDULE                                                   */}
        {/* ========================================================================= */}
        {(viewMode === 'all' || activeTab === 'fees') && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Standard Certificate & Clearance Fee Schedule (₱)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Specify statutory rates collected for clearances and certifications under local barangay revenue tax ordinances.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {Object.entries(feesMap).map(([type, fee]) => {
                const isFree = fee === 0;
                return (
                  <div
                    key={type}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <label className="block text-xs text-slate-800 dark:text-slate-200 font-bold mb-1 truncate">
                        {type}
                      </label>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                        {isFree ? 'Free (Indigent Service)' : 'Standard Document Tariff'}
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        ₱
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={fee}
                        onChange={(e) => handleFeeChange(type, Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-indigo-700 dark:text-indigo-400 font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Setting fee to <strong>₱0</strong> marks the service as strictly <strong>FREE OF CHARGE</strong> (e.g. for Certificate of Indigency under RA 11261).
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 6: PUROKS & ZONES                                                 */}
        {/* ========================================================================= */}
        {(viewMode === 'all' || activeTab === 'puroks') && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Purok & Sitio Zones ({puroksList.length} Active Zones)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Community territorial subdivisions used for census demographic grouping, blotter tagging, and household mapping.
                  </p>
                </div>
              </div>
            </div>

            {/* Purok Badges */}
            <div className="flex flex-wrap gap-2">
              {puroksList.map((p) => (
                <div
                  key={p}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2.5 shadow-2xs group"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{p}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePurok(p)}
                    className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                    title={`Remove ${p}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            {/* Add Purok Input Toolbar */}
            <div className="flex gap-2 max-w-md pt-2">
              <input
                type="text"
                value={newPurokName}
                onChange={(e) => setNewPurokName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPurok();
                  }
                }}
                placeholder="e.g. Purok Santol or Sitio Riverside"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
              <button
                type="button"
                onClick={handleAddPurok}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>Add Zone</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 7: USERS & ACCESS CONTROL                                         */}
        {/* ========================================================================= */}
        {(viewMode === 'all' || activeTab === 'users') && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <UserCog className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    User Accounts & Role-Based Access Control
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage system administrator credentials, barangay personnel roles, and citizen resident portal logins.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule('users')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <UserCog className="w-4 h-4" />
                <span>Open User Management ({users.length})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                    System Administrators
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {users.filter((u) => u.role === 'Administrator').length}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Full Master Privileges</p>
                </div>
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>

              <div className="p-4 bg-cyan-50/60 dark:bg-cyan-950/30 rounded-xl border border-cyan-100 dark:border-cyan-900/50 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 uppercase">
                    Staff & Barangay Officials
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {users.filter((u) => u.role !== 'Administrator' && u.role !== 'Resident').length}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Secretaries, Treasurers & Officers</p>
                </div>
                <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>

              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                    Citizen Resident Portals
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {users.filter((u) => u.role === 'Resident').length}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Registered Online Residents</p>
                </div>
                <Building className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 8: DATABASE BACKUP & RESTORE                                      */}
        {/* ========================================================================= */}
        {(viewMode === 'all' || activeTab === 'database') && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Database className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Database Backup, Export & System Restore
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generate complete offline JSON snapshots of all residents, households, certificates, blotters, and financial ledgers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Bulk Excel / CSV Import */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Bulk Excel / CSV Importer</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Fast-batch import hundreds of residents, businesses, households, officials, or blotters directly from Excel spreadsheets (.xlsx, .xls, .csv).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Launch Excel Importer</span>
                </button>
              </div>

              {/* 2. Export JSON */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Export System Database</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Downloads an encrypted, timestamped JSON snapshot containing all barangay collections.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportDatabaseBackup}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download BIMS Backup</span>
                </button>
              </div>

              {/* 3. Restore JSON */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Restore from JSON File</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Upload a previously exported `.json` database file to restore all tables and records.
                  </p>
                </div>
                <label className="w-full py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Select JSON File to Restore</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 4. Re-sync from Supabase */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Synchronize Supabase Data</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Fetches latest live records from the Supabase cloud database into the active dashboard.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Re-Sync from Supabase</span>
                </button>
              </div>
            </div>

            {/* Real-Time Database Integrity & Automated Reconciliation */}
            <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/50 dark:from-slate-900/90 dark:via-indigo-950/20 dark:to-slate-900 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 dark:border-indigo-900/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                      <span>Database Integrity & Reconciliation Engine</span>
                      {reconciliationReport?.hasMismatches ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Discrepancy Detected ({reconciliationReport.totalMissingRecords} missing)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>100% In-Sync With Supabase</span>
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Monitors row count parity between local client memory and Supabase PostgreSQL. Automatically triggers paginated sync to fetch missing records.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => reconcileDatabase()}
                    disabled={isReconciling}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
                    <span>{isReconciling ? 'Reconciling Database...' : 'Run Integrity Sync'}</span>
                  </button>
                </div>
              </div>

              {/* Status and Last Checked Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400 px-1">
                <span>
                  Last integrity verification: <strong className="text-slate-700 dark:text-slate-300">{lastReconciliationCheck || 'Active on load'}</strong>
                </span>
                <span>
                  PostgREST 1000-Row Pagination: <strong className="text-emerald-600 dark:text-emerald-400">Active (Auto-Chuncker Enabled)</strong>
                </span>
              </div>

              {/* Table Count Parity Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                {[
                  { label: 'Residents', table: 'residents', local: residents.length },
                  { label: 'Households', table: 'households', local: households.length },
                  { label: 'Businesses', table: 'businesses', local: businesses.length },
                  { label: 'Certificates', table: 'certificates', local: certificates.length },
                  { label: 'Blotters', table: 'blotters', local: blotters.length },
                  { label: 'Complaints', table: 'complaints', local: complaints.length },
                  { label: 'Transactions', table: 'financial_transactions', local: (allTransactions || []).length },
                  { label: 'Officials', table: 'barangay_officials', local: officials.length },
                ].map((item) => {
                  const info = reconciliationReport?.details[item.table];
                  const dbCount = info?.dbCount ?? item.local;
                  const isMismatched = info?.isMismatched && !info?.reconciled;
                  const isReconciled = info?.reconciled;

                  return (
                    <div
                      key={item.table}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isMismatched
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                          : isReconciled
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                          : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {item.label}
                      </div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {item.local}
                      </div>
                      <div className="text-[9px] mt-0.5 flex items-center justify-center gap-1">
                        {isMismatched ? (
                          <span className="text-amber-700 dark:text-amber-400 font-bold">DB: {dbCount}</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            <span>Matched</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 9: PRIVACY, LEGAL & COOKIE COMPLIANCE                             */}
        {/* ========================================================================= */}
        {(viewMode === 'all' || activeTab === 'compliance') && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Data Privacy & Legal Compliance Framework
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Republic Act No. 10173 compliance status, citizen rights, cookie consent, and third-party security.
                  </p>
                </div>
              </div>

              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>NPC / RA 10173 Ready</span>
              </span>
            </div>

            {/* Legal Documents & Policies Quick Trigger Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                  <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Privacy Policy (RA 10173)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Full disclosures on lawful processing of resident civil registry data, retention schedules, and Data Subject rights.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('open-legal-policies', { detail: { tab: 'privacy' } }));
                    }
                  }}
                  className="w-full py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  View Privacy Policy
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Terms & Conditions</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Official terms of use governing digital certificates, Lupon mediation submissions, and citizen self-service accounts.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('open-legal-policies', { detail: { tab: 'terms' } }));
                    }
                  }}
                  className="w-full py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  View Terms of Use
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                  <Cookie className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Cookie Policy & Consent</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Details on strictly necessary session tokens, functional theme state, and optional local telemetry storage.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open-legal-policies', { detail: { tab: 'cookies' } }));
                      }
                    }}
                    className={`${currentUser.role === 'Administrator' ? 'flex-1' : 'w-full'} py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors`}
                  >
                    Policy
                  </button>
                  {currentUser.role === 'Administrator' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('open-cookie-settings'));
                        }
                      }}
                      className="flex-1 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Third-Party Embeds & Privacy Sandboxing Status */}
            <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Third-Party Embeds & Sandboxing Security</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono">
                  All External Calls Secured
                </span>
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Strict Referrer Policy enforced (<code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded font-mono text-[10px]">strict-origin-when-cross-origin</code>) prevents URL leaking.</li>
                <li>Google Identity Services client is loaded with <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded font-mono text-[10px]">crossorigin="anonymous"</code>.</li>
                <li>External image elements apply <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded font-mono text-[10px]">referrerPolicy="no-referrer"</code>.</li>
                <li>All mapping tiles operate over TLS HTTPS with <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded font-mono text-[10px]">rel="noopener noreferrer"</code> on navigation shortcuts.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Global Save Button at bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All updates take effect immediately across all sessions and components.</span>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Discard Changes
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all ${
                isSaving
                  ? 'bg-indigo-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white cursor-pointer hover:shadow-md'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Barangay Configuration...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Barangay Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Database Sync Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isResetModalOpen}
        title="Synchronize Supabase Database"
        itemType="Database Sync"
        itemName="Live Supabase Cloud Records"
        description="This will query Supabase and refresh all live residents, households, certificates, blotter entries, and settings directly from your cloud database."
        confirmText="Yes, Sync from Supabase Now"
        onConfirm={() => {
          resetToInitialData();
          setIsResetModalOpen(false);
        }}
        onClose={() => setIsResetModalOpen(false)}
      />

      {/* Bulk Excel / CSV Data Importer */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialEntity="residents"
      />
    </div>
  );
};
