import React from 'react';
import {
  Award,
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  TreePine,
  Download,
} from 'lucide-react';
import { BayanihanVolunteerRecord, BayanihanCleanUpDrive } from '../../types/residentServices';
import { useBarangay } from '../../context/BarangayContext';

interface BayanihanCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteer: BayanihanVolunteerRecord;
  drive?: BayanihanCleanUpDrive;
}

export const BayanihanCertificateModal: React.FC<BayanihanCertificateModalProps> = ({
  isOpen,
  onClose,
  volunteer,
  drive,
}) => {
  const { settings } = useBarangay();
  if (!isOpen) return null;

  const certCode = volunteer.certificateCode || `CERT-BAYAN-2026-${volunteer.id.replace(/\D/g, '').slice(-4) || '001'}`;
  const issueDate = volunteer.certificateIssuedAt || volunteer.registeredDate || new Date().toISOString().split('T')[0];
  const hours = volunteer.hoursRendered || 4;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Official Certificate of Bayanihan Commendation
              </h3>
              <p className="text-xs text-slate-500 font-mono">{certCode}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Canvas */}
        <div
          id="printable-bayanihan-certificate"
          className="relative bg-gradient-to-b from-amber-50/40 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-850 dark:to-emerald-950/20 p-6 sm:p-10 rounded-2xl border-4 border-double border-emerald-700/60 shadow-inner text-center space-y-5"
        >
          {/* Watermark / Seal Icon */}
          <div className="flex justify-center items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-amber-400">
              <TreePine className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-800 dark:text-emerald-400">
                Republic of the Philippines • Region IX
              </p>
              <p className="text-xs font-black text-slate-900 dark:text-white tracking-wide">
                BARANGAY SANGKOL ECOLOGICAL TASK FORCE
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Committee on Environment & Natural Resources</p>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="space-y-1 pt-2">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300">
              Community Service Commendation
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 dark:text-emerald-300 tracking-tight font-serif pt-1">
              Certificate of Bayanihan Volunteerism
            </h1>
            <p className="text-xs italic text-slate-600 dark:text-slate-400">
              This official commendation is proudly presented to:
            </p>
          </div>

          {/* Recipient Name */}
          <div className="py-2 border-b-2 border-emerald-700/40 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {volunteer.residentName}
            </h2>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 mt-0.5">
              Resident of {volunteer.purok} • Barangay Sangkol
            </p>
          </div>

          {/* Citation Body */}
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
            In grateful recognition of exemplary civic dedication and selfless participation in the{' '}
            <strong className="text-emerald-900 dark:text-emerald-200">"{volunteer.driveTitle}"</strong>.
            Having rendered <strong className="text-emerald-800 dark:text-emerald-300">{hours} voluntary community service hours</strong> in coastal declogging, drainage clearing, and environmental stewardship under Republic Act 9003.
          </p>

          {/* Role and Venue details */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-left text-xs max-w-lg mx-auto">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Volunteer Role</p>
              <p className="font-bold text-slate-800 dark:text-slate-100">{volunteer.volunteerRole || 'Environmental Collector'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Date Completed</p>
              <p className="font-bold text-slate-800 dark:text-slate-100">{issueDate}</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-6 max-w-md mx-auto text-center border-t border-slate-200 dark:border-slate-800">
            <div>
              <div className="h-9 flex items-end justify-center">
                <span className="font-serif italic text-sm text-slate-700 dark:text-slate-300 font-bold">
                  {volunteer.verifiedBy || 'Kgd. Joel Manalo'}
                </span>
              </div>
              <div className="border-t border-slate-400 dark:border-slate-600 pt-1">
                <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase">Hon. Joel Manalo</p>
                <p className="text-[9px] text-slate-500">Kagawad on Environment</p>
              </div>
            </div>

            <div>
              <div className="h-9 flex items-end justify-center">
                <span className="font-serif italic text-sm text-slate-700 dark:text-slate-300 font-bold">
                  {settings.punongBarangay}
                </span>
              </div>
              <div className="border-t border-slate-400 dark:border-slate-600 pt-1">
                <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase">
                  {settings.punongBarangay}
                </p>
                <p className="text-[9px] text-slate-500">Punong Barangay</p>
              </div>
            </div>
          </div>

          {/* Verification Footer */}
          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Digital Record: {certCode}
            </span>
            <span>Issued: {issueDate}</span>
          </div>
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center gap-2 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>This certificate is verified by the Barangay Office and valid for school NSTP/CWTS credits, job community references, and SK youth honors.</span>
        </div>
      </div>
    </div>
  );
};
