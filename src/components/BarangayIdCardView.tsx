import React, { useState } from 'react';
import { Resident, BarangaySettings } from '../types';
import { BarangaySangkolSeal, RepublicSeal, QRCodeBox } from './OfficialSeals';
import { getFormalResidentPhotoUrl, generateFormalIdPhotoSvg } from '../utils/imageUtils';
import { downloadDigitalIdCard } from '../utils/idCardDownload';
import { ID_THEMES, IdColorCategory, detectIdColorCategory } from '../utils/idCardThemes';
import { 
  Download, 
  Printer, 
  Shield, 
  Info, 
  Sparkles, 
  UserCheck, 
  Flame, 
  Users, 
  CheckCircle2 
} from 'lucide-react';

interface BarangayIdCardViewProps {
  resident: Partial<Resident> & { 
    id: string; 
    firstName: string; 
    lastName: string; 
    purok?: string; 
    streetAddress?: string;
  };
  settings: BarangaySettings;
  defaultCategory?: IdColorCategory;
  showSelector?: boolean;
  onPrint?: () => void;
  className?: string;
}

export const BarangayIdCardView: React.FC<BarangayIdCardViewProps> = ({
  resident,
  settings,
  defaultCategory,
  showSelector = true,
  onPrint,
  className = '',
}) => {
  const initialCategory = defaultCategory || detectIdColorCategory(resident);
  const [selectedCategory, setSelectedCategory] = useState<IdColorCategory>(initialCategory);
  const [showColorGuide, setShowColorGuide] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const theme = ID_THEMES[selectedCategory];
  const formalPhoto = getFormalResidentPhotoUrl(resident);
  const svgFallback = generateFormalIdPhotoSvg({
    gender: resident.sex || 'Male',
    name: `${resident.firstName} ${resident.lastName}`,
    idNumber: resident.id,
    backgroundTheme: 
      selectedCategory === 'red_official' 
        ? 'crimson' 
        : selectedCategory === 'green_tanod' 
        ? 'forest' 
        : selectedCategory === 'yellow_youth' 
        ? 'studio_gold' 
        : 'studio_blue',
  });

  const handleDownload = async (side: 'front' | 'back' | 'both') => {
    setIsDownloading(true);
    try {
      await downloadDigitalIdCard(resident, settings, {
        side,
        photoUrl: formalPhoto,
        colorCategory: selectedCategory,
      });
    } catch (err) {
      console.error('Failed to download ID card:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className={`space-y-6 w-full ${className}`}>
      {/* Functional Color-Coding Selector & Actions Bar */}
      <div className="no-print bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
        {/* Top bar with quick buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Shield className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Functional Color-Coded Barangay ID
              </h4>
              <p className="text-[11px] text-slate-500">
                Official standard for rapid visual classification at checkpoints and civic desks.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowColorGuide(!showColorGuide)}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>Color Doctrine</span>
            </button>

            <button
              type="button"
              disabled={isDownloading}
              onClick={() => handleDownload('front')}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
              title="Download High-Resolution Front ID (PNG)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Front PNG</span>
            </button>

            <button
              type="button"
              disabled={isDownloading}
              onClick={() => handleDownload('both')}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
              title="Download Full ID Sheet (Front & Back)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Sheet (PNG)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print ID</span>
            </button>
          </div>
        </div>

        {/* Color Doctrine Guide Explainer (Expandable) */}
        {showColorGuide && (
          <div className="bg-white p-4 rounded-xl border border-indigo-100 text-xs space-y-2.5 animate-fadeIn shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Modern Barangay Color-Coding Protocol:
              </span>
              <button
                type="button"
                onClick={() => setShowColorGuide(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <p className="font-black text-rose-900 flex items-center gap-1">
                  <span>🔴</span> Red / Crimson
                </p>
                <p className="text-[11px] text-rose-700 pt-0.5 font-semibold">Barangay Officials & Kagawads</p>
                <p className="text-[10px] text-rose-600 leading-tight pt-1">
                  Issued to Kapitan, Kagawads, Secretary, and Treasurer for executive authority.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="font-black text-emerald-900 flex items-center gap-1">
                  <span>🟢</span> Green / Khaki
                </p>
                <p className="text-[11px] text-emerald-700 pt-0.5 font-semibold">Tanods & Emergency Responders</p>
                <p className="text-[10px] text-emerald-600 leading-tight pt-1">
                  Issued to Barangay Tanods and BDRRMC teams matching field tactical uniforms.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200">
                <p className="font-black text-sky-900 flex items-center gap-1">
                  <span>🔵</span> Light Blue / Sky Blue
                </p>
                <p className="text-[11px] text-sky-700 pt-0.5 font-semibold">Regular Bona Fide Residents</p>
                <p className="text-[10px] text-sky-600 leading-tight pt-1">
                  Standard official card for registered residents, voters, seniors, and PWDs.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <p className="font-black text-amber-900 flex items-center gap-1">
                  <span>🟡</span> Yellow / Orange
                </p>
                <p className="text-[11px] text-amber-700 pt-0.5 font-semibold">SK Youth & Temporary Staff</p>
                <p className="text-[10px] text-amber-600 leading-tight pt-1">
                  Assigned to Sangguniang Kabataan members, youth interns, and volunteer staff.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Color Selector Buttons */}
        {showSelector && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                Select Cardholder Sector Category:
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Current: <strong className="text-slate-800">{theme.shortName}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* 1. Blue Resident */}
              <button
                type="button"
                onClick={() => setSelectedCategory('blue_resident')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedCategory === 'blue_resident'
                    ? 'bg-blue-700 text-white border-blue-800 shadow-md ring-2 ring-blue-400/50'
                    : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black flex items-center gap-1">
                    <span>🔵</span> Royal Blue
                  </span>
                  {selectedCategory === 'blue_resident' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-200" />
                  )}
                </div>
                <p className={`text-[10px] pt-1 font-medium ${selectedCategory === 'blue_resident' ? 'text-blue-100' : 'text-slate-500'}`}>
                  Regular Bona Fide Resident
                </p>
              </button>

              {/* 2. Red Official */}
              <button
                type="button"
                onClick={() => setSelectedCategory('red_official')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedCategory === 'red_official'
                    ? 'bg-red-800 text-white border-red-900 shadow-md ring-2 ring-red-400/50'
                    : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black flex items-center gap-1">
                    <span>🔴</span> Crimson Red
                  </span>
                  {selectedCategory === 'red_official' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                  )}
                </div>
                <p className={`text-[10px] pt-1 font-medium ${selectedCategory === 'red_official' ? 'text-rose-100' : 'text-slate-500'}`}>
                  Barangay Officials & Council
                </p>
              </button>

              {/* 3. Green Tanod */}
              <button
                type="button"
                onClick={() => setSelectedCategory('green_tanod')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedCategory === 'green_tanod'
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-400/50'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black flex items-center gap-1">
                    <span>🟢</span> Forest Green
                  </span>
                  {selectedCategory === 'green_tanod' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  )}
                </div>
                <p className={`text-[10px] pt-1 font-medium ${selectedCategory === 'green_tanod' ? 'text-emerald-100' : 'text-slate-500'}`}>
                  Tanod & Emergency Teams
                </p>
              </button>

              {/* 4. Amber Gold */}
              <button
                type="button"
                onClick={() => setSelectedCategory('yellow_youth')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedCategory === 'yellow_youth'
                    ? 'bg-amber-700 text-white border-amber-800 shadow-md ring-2 ring-amber-400/50'
                    : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black flex items-center gap-1">
                    <span>🟡</span> Amber Gold
                  </span>
                  {selectedCategory === 'yellow_youth' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
                  )}
                </div>
                <p className={`text-[10px] pt-1 font-medium ${selectedCategory === 'yellow_youth' ? 'text-amber-100' : 'text-slate-500'}`}>
                  SK Youth & Temporary Staff
                </p>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Printable ID Card Container (Front & Back) */}
      <div className="printable-area grid grid-cols-1 xl:grid-cols-2 gap-6 items-center justify-items-center max-w-4xl mx-auto py-2">
        {/* ======================= FRONT SIDE ======================= */}
        <div 
          className={`w-full max-w-[420px] aspect-[1.586/1] bg-gradient-to-br ${theme.bgGradient} text-slate-900 rounded-2xl p-4 border-2 ${theme.cardBorder} shadow-xl relative overflow-hidden font-sans flex flex-col justify-between select-none`}
        >
          {/* Top Holographic Security Strip */}
          <div className={`absolute top-0 inset-x-0 h-1.5 ${theme.securityStripBg}`} />

          {/* Watermarked Seal */}
          <div className={`absolute right-[-15px] bottom-[-15px] ${theme.watermarkOpacity} pointer-events-none`}>
            <BarangaySangkolSeal size={190} />
          </div>

          {/* Card Header (Official Government Banner) */}
          <div className={`relative z-10 flex items-center gap-2 ${theme.headerBg} text-white px-3 py-2 rounded-xl border-b-2 ${theme.headerBorder} shadow-sm`}>
            <RepublicSeal size={34} className="shrink-0 drop-shadow-md" />
            <div className="flex-1 text-center min-w-0">
              <p className="text-[6.5px] tracking-widest uppercase font-bold text-amber-200">Republic of the Philippines</p>
              <h4 className="text-[9.5px] font-black tracking-wide text-white uppercase truncate">
                {settings.barangayName || 'BARANGAY SANGKOL'}
              </h4>
              <p className="text-[6.5px] font-semibold text-sky-100 truncate">
                {settings.municipality || 'Dipolog City'}, {settings.province || 'Zamboanga del Norte'}
              </p>
            </div>
            <BarangaySangkolSeal size={34} className="shrink-0 drop-shadow-md" />
          </div>

          {/* Functional Color Classification Pill Badge */}
          <div className="relative z-10 flex justify-center -my-1">
            <div className={`px-3 py-0.5 ${theme.badgeBg} border ${theme.badgeBorder} rounded-full text-[7.5px] font-black tracking-wide ${theme.badgeText} shadow-xs flex items-center gap-1 uppercase`}>
              <span>{theme.badgeEmoji}</span>
              <span>{theme.badgeLabel}</span>
            </div>
          </div>

          {/* Middle Info + Formal 2x2 Photo */}
          <div className="relative z-10 flex items-center gap-3 my-auto py-1">
            {/* 2x2 ID Photo Box */}
            <div className={`w-18 h-22.5 bg-white border-2 ${theme.photoBorder} rounded-lg flex flex-col items-center justify-center shrink-0 overflow-hidden shadow-md relative group`}>
              <img
                src={formalPhoto}
                alt={`${resident.firstName} ${resident.lastName}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = svgFallback;
                }}
              />
              <div className={`absolute bottom-0 inset-x-0 ${theme.headerBg} text-[6px] text-center font-mono py-0.5 text-amber-200 font-bold uppercase tracking-tighter`}>
                2x2 PHOTO
              </div>
            </div>

            {/* Resident Identification Details (Crisp, High-Contrast Dark Text) */}
            <div className="flex-1 min-w-0 space-y-1">
              <div>
                <p className="text-[6.5px] font-bold uppercase tracking-wider text-slate-500">Cardholder Name / Pangalan</p>
                <p className="text-[11px] font-black uppercase text-slate-900 tracking-tight leading-tight truncate">
                  {resident.lastName}, {resident.firstName} {resident.middleName ? `${resident.middleName[0]}.` : ''} {resident.suffix || ''}
                </p>
              </div>

              <div>
                <p className="text-[6.5px] font-bold uppercase tracking-wider text-slate-500">Address / Purok</p>
                <p className={`text-[8.5px] font-extrabold ${theme.accentText} leading-tight truncate`}>
                  {resident.streetAddress || ''}, {resident.purok || 'Purok Pinya'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[7.5px] pt-0.5">
                <p><span className="text-slate-500 font-medium">DOB:</span> <strong className="font-mono text-slate-900 font-bold">{resident.birthDate || 'N/A'}</strong></p>
                <p><span className="text-slate-500 font-medium">Sex:</span> <strong className="text-slate-900 font-bold">{resident.sex || 'N/A'}</strong></p>
                <p><span className="text-slate-500 font-medium">Civil:</span> <strong className="text-slate-900 font-bold">{resident.civilStatus || 'Single'}</strong></p>
                <p><span className="text-slate-500 font-medium">Blood:</span> <strong className="text-red-700 font-black">{resident.bloodType || 'O+'}</strong></p>
              </div>
            </div>
          </div>

          {/* Bottom Card Footer */}
          <div className={`relative z-10 flex items-end justify-between px-2.5 py-1 ${theme.footerBg} rounded-xl border ${theme.footerBorder}`}>
            <div>
              <p className={`text-[7px] ${theme.accentText} font-mono font-black`}>ID NO: {resident.id}</p>
              <p className="text-[5.5px] text-slate-500">Category: {theme.shortName}</p>
            </div>
            <div className="text-right">
              <p className="text-[7px] font-black text-slate-900 uppercase leading-tight">{settings.punongBarangay || 'HON. EDUARDO S. DELA CRUZ'}</p>
              <p className={`text-[5.5px] ${theme.accentText} font-bold`}>Punong Barangay</p>
            </div>
          </div>
        </div>

        {/* ======================= BACK SIDE ======================= */}
        <div 
          className={`w-full max-w-[420px] aspect-[1.586/1] bg-white text-slate-900 rounded-2xl p-4 border-2 ${theme.cardBorder} shadow-xl relative font-sans flex flex-col justify-between select-none overflow-hidden`}
        >
          {/* Top Holographic Security Strip */}
          <div className={`absolute top-0 inset-x-0 h-1.5 ${theme.securityStripBg}`} />

          {/* Back Header Banner */}
          <div className={`text-center ${theme.backHeaderBg} text-white px-2 py-1.5 rounded-lg border-b-2 ${theme.backHeaderBorder} shadow-xs`}>
            <p className="text-[7.5px] font-black text-amber-200 uppercase tracking-wider flex items-center justify-center gap-1">
              <span>{theme.badgeEmoji}</span>
              <span>EMERGENCY CONTACT & {theme.shortName.toUpperCase()} VERIFICATION</span>
            </p>
          </div>

          <div className="space-y-1.5 text-[7px] my-auto">
            <div className={`${theme.backEmergencyBoxBg} p-2 rounded-xl border ${theme.backEmergencyBoxBorder} space-y-0.5 shadow-2xs`}>
              <p><strong className="text-slate-600">In Case of Emergency:</strong> <span className="text-slate-900 font-bold">{resident.emergencyContactName || 'Barangay Health Desk'}</span></p>
              <p><strong className="text-slate-600">Emergency Phone:</strong> <span className="font-mono text-red-700 font-black">{resident.emergencyContactNumber || '0917-888-7264'}</span></p>
              <p><strong className="text-slate-600">Barangay Hall Hotline:</strong> <span className="font-mono text-emerald-700 font-black">{settings.contactNumber || '(062) 991-8842'}</span></p>
            </div>
            <p className="text-[6px] text-slate-500 italic pt-0.5 leading-tight">
              This card certifies that the bearer is a bonafide cardholder of {settings.barangayName || 'Barangay Sangkol'}. Valid for official transactions & checkpoint verification. If found, please return to Barangay Hall.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <QRCodeBox code={`BARANGAY-ID-VERIFY:${resident.id}|${resident.lastName}|${theme.shortName}`} size={36} />
              <div className="text-[6px] text-slate-500">
                <p className="font-bold text-slate-800">SECURE DIGITAL QR</p>
                <p>Scan to verify authenticity</p>
              </div>
            </div>
            <div className="text-right">
              <div className="w-24 border-b border-slate-400 mb-0.5"></div>
              <p className="text-[6px] text-slate-500">Signature / Thumbmark</p>
              <p className={`text-[6px] font-black ${theme.accentText}`}>Valid Until: Dec 31, 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
