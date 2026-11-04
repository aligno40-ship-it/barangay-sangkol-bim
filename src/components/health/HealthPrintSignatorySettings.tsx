import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, RotateCcw, Save, Settings2, Trash2, Upload } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { compressSealImage } from '../../utils/imageUtils';

export const HealthPrintSignatorySettings: React.FC = () => {
  const { settings, updateSettings, residents } = useBarangay();
  const [isOpen, setIsOpen] = useState(false);
  const [midwifeName, setMidwifeName] = useState(settings.healthMidwifeName || '');
  const [physicianName, setPhysicianName] = useState(settings.healthPhysicianName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState<'healthCenterLogoUrl' | 'dohLogoUrl' | null>(null);
  const residentNameOptions = useMemo(
    () => Array.from(new Set(
      residents
        .map((resident) =>
          [resident.firstName, resident.middleName, resident.lastName, resident.suffix]
            .filter(Boolean)
            .join(' ')
            .trim()
        )
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b)),
    [residents]
  );

  useEffect(() => {
    setMidwifeName(settings.healthMidwifeName || '');
    setPhysicianName(settings.healthPhysicianName || '');
  }, [settings.healthMidwifeName, settings.healthPhysicianName]);

  const handleSave = async () => {
    const savedMidwifeName = midwifeName.trim();
    const savedPhysicianName = physicianName.trim();
    if (!savedMidwifeName || !savedPhysicianName) {
      setSaveError('Enter both designated names before saving.');
      setSaveSuccess(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateSettings({
        healthMidwifeName: savedMidwifeName,
        healthPhysicianName: savedPhysicianName,
      });
      setSaveSuccess(true);
    } catch (error) {
      console.error('Failed to save health print signatories:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save designated names.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    settingKey: 'healthCenterLogoUrl' | 'dohLogoUrl'
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Logo file must be 5 MB or smaller.');
      return;
    }

    setUploadingLogo(settingKey);
    setLogoError(null);
    setLogoSaveSuccess(false);
    try {
      const logoUrl = await compressSealImage(file, 600);
      await updateSettings({ [settingKey]: logoUrl });
      setLogoSaveSuccess(true);
    } catch (error) {
      console.error(`Failed to upload ${settingKey}:`, error);
      setLogoError(error instanceof Error ? error.message : 'Failed to save the uploaded logo.');
    } finally {
      setUploadingLogo(null);
    }
  };

  const handleRemoveLogo = async (settingKey: 'healthCenterLogoUrl' | 'dohLogoUrl') => {
    setUploadingLogo(settingKey);
    setLogoError(null);
    setLogoSaveSuccess(false);
    try {
      await updateSettings({ [settingKey]: '' });
      setLogoSaveSuccess(true);
    } catch (error) {
      console.error(`Failed to remove ${settingKey}:`, error);
      setLogoError(error instanceof Error ? error.message : 'Failed to remove the logo.');
    } finally {
      setUploadingLogo(null);
    }
  };

  const logoControls = [
    { key: 'healthCenterLogoUrl' as const, label: 'Health Center Logo', url: settings.healthCenterLogoUrl },
    { key: 'dohLogoUrl' as const, label: 'Department of Health (DOH) Logo', url: settings.dohLogoUrl },
  ];

  return (
    <section className="rounded-xl border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/60 dark:bg-cyan-950/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Print Signatories</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Set the designated names shown on Health Desk slips and pharmacy reports.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsOpen((open) => !open);
            setSaveError(null);
            setSaveSuccess(false);
          }}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 bg-white dark:bg-slate-900 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 text-xs font-bold cursor-pointer"
          aria-expanded={isOpen}
        >
          <Settings2 className="w-4 h-4" />
          {isOpen ? 'Close Settings' : 'Set Designated Names'}
        </button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-4">
          <div className="md:col-span-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Health Desk Jurisdiction</h4>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Uses the same values as Settings &gt; General &amp; Jurisdiction.
            </p>
            <div className="mt-2 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs">
              {[
                ['Barangay', settings.barangayName],
                ['Municipality / City', settings.municipality],
                ['Province', settings.province],
                ['Region', settings.region],
                ['ZIP Code', settings.zipCode],
                ['Address', settings.hallAddress],
                ['Phone', settings.contactNumber],
                ['Email', settings.email],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="block text-[10px] font-semibold uppercase text-slate-500">{label}</span>
                  <span className="text-slate-800 dark:text-slate-200">{value || 'Not set in General & Jurisdiction'}</span>
                </div>
              ))}
            </div>
          </div>

          {logoControls.map(({ key, label, url }) => (
            <div key={key} className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-3">
              <div className="w-14 h-14 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white flex items-center justify-center overflow-hidden">
                {url ? (
                  <img src={url} alt={label} className="w-full h-full object-contain p-1" />
                ) : (
                  <ImagePlus className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</p>
                <p className="text-[10px] text-slate-500">PNG, JPG, WebP or SVG; max 5 MB.</p>
                <div className="mt-2 flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-cyan-700 hover:bg-cyan-600 text-white text-[11px] font-bold cursor-pointer">
                    {uploadingLogo === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploadingLogo !== null}
                      onChange={(event) => void handleLogoUpload(event, key)}
                    />
                  </label>
                  {url && (
                    <button
                      type="button"
                      onClick={() => void handleRemoveLogo(key)}
                      disabled={uploadingLogo !== null}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {logoError && (
            <p role="alert" className="md:col-span-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {logoError}
            </p>
          )}
          {logoSaveSuccess && !logoError && (
            <p role="status" className="md:col-span-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Health Desk logos saved to settings.
            </p>
          )}

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Barangay Midwife / Pharmacy Verifier
            <input
              type="text"
              maxLength={150}
              list="health-print-resident-names"
              value={midwifeName}
              onChange={(event) => setMidwifeName(event.target.value)}
              placeholder="Search residents or enter a name"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Visiting Health Physician
            <input
              type="text"
              maxLength={150}
              list="health-print-resident-names"
              value={physicianName}
              onChange={(event) => setPhysicianName(event.target.value)}
              placeholder="Search residents or enter a name"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </label>
          <datalist id="health-print-resident-names">
            {residentNameOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
            {saveError ? (
              <p role="alert" className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4" />
                {saveError}
              </p>
            ) : saveSuccess ? (
              <p role="status" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                Designated names saved.
              </p>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                These names are shared by Health Desk slips and pharmacy reports.
              </span>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setMidwifeName(settings.healthMidwifeName || '');
                  setPhysicianName(settings.healthPhysicianName || '');
                  setSaveError(null);
                  setSaveSuccess(false);
                }}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Saved
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Names
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
