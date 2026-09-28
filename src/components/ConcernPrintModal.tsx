import React from 'react';
import { CitizenConcern } from '../types';
import { useBarangay } from '../context/BarangayContext';
import { X, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { BarangaySangkolSeal, RepublicSeal } from './OfficialSeals';

interface ConcernPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  concern: CitizenConcern | null;
}

export const ConcernPrintModal: React.FC<ConcernPrintModalProps> = ({ isOpen, onClose, concern }) => {
  const { settings, officials } = useBarangay();

  if (!isOpen || !concern) return null;

  const handlePrint = () => {
    window.print();
  };

  const punongBarangay = officials.find((o) => o.position.toLowerCase().includes('punong'))?.name || settings.punongBarangayName;
  const chiefTanod = officials.find((o) => o.position.toLowerCase().includes('tanod'))?.name || 'Arman K. Morales';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden text-slate-900 my-8 print:border-none print:shadow-none print:m-0 print:max-w-none">
        {/* Controls Header (Hidden on Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Print Barangay Citizen Concern Action Slip</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Work Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Content */}
        <div className="p-8 sm:p-10 space-y-6 bg-white text-slate-900 print:p-6" id="printable-concern-slip">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 text-center">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              <BarangaySangkolSeal className="w-16 h-16" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">
                Republic of the Philippines
              </p>
              <p className="text-xs font-bold text-slate-800">
                Province of {settings.province} • City of {settings.municipality}
              </p>
              <h2 className="text-base font-black uppercase text-slate-900 tracking-wider">
                BARANGAY {settings.barangayName}
              </h2>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                OFFICE OF THE PUNONG BARANGAY & CITIZEN HELPDESK
              </p>
            </div>
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              <RepublicSeal className="w-16 h-16" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 underline decoration-slate-900 decoration-2">
              CITIZEN CONCERN & FIELD ACTION DISPATCH SLIP
            </h1>
            <p className="text-xs font-mono font-bold text-slate-600">
              Control Ticket No: <span className="text-slate-900">{concern.id}</span>
            </p>
          </div>

          {/* Grievance Details Ledger */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-2 bg-slate-100 p-2.5 font-bold border-b border-slate-300">
              <span>INTAKE SPECIFICATIONS</span>
              <span className="text-right">DATE: {concern.dateSubmitted}</span>
            </div>
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">Complainant / Citizen:</span>
                <span className="col-span-2 font-bold text-slate-900">{concern.residentName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">Purok / Vicinity:</span>
                <span className="col-span-2 font-semibold text-slate-900">{concern.purok}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">Contact Details:</span>
                <span className="col-span-2 font-semibold text-slate-900">{concern.contactNumber || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">Category & Priority:</span>
                <span className="col-span-2 font-bold text-slate-900">
                  {concern.category} • <span className="text-indigo-700">{concern.priority || 'Normal'} Priority</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">Specific Location:</span>
                <span className="col-span-2 font-semibold text-slate-900">
                  {concern.locationDetails || `${concern.purok} vicinity`}
                </span>
              </div>
            </div>
          </div>

          {/* Grievance Description */}
          <div className="border border-slate-300 rounded-xl p-3 text-xs space-y-1">
            <p className="font-bold text-slate-800 uppercase text-[10px]">Concern Details / Subject Summary:</p>
            <p className="font-bold text-slate-900">{concern.subject}</p>
            <p className="text-slate-700 leading-relaxed pt-1 border-t border-slate-200">
              {concern.description || concern.details}
            </p>
          </div>

          {/* Dispatch & Barangay Action Order */}
          <div className="border border-slate-300 rounded-xl p-3 text-xs space-y-2 bg-slate-50">
            <p className="font-bold text-slate-900 uppercase text-[10px]">Barangay Action & Directives:</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Assigned Official / Unit:</span>
                <strong className="text-slate-900">{concern.assignedTo || 'Barangay Administrative Unit'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Current Status:</span>
                <strong className="text-indigo-800">{concern.status}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Target Inspection / Completion:</span>
                <strong className="text-slate-900">{concern.targetResolutionDate || 'Immediate'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Verified Read By:</span>
                <strong className="text-emerald-800">{concern.readBy || 'Barangay Desk Officer'}</strong>
              </div>
            </div>
            {concern.actionNotes && (
              <div className="pt-2 border-t border-slate-200 text-[11px]">
                <span className="text-slate-500 block font-semibold">Operational Directives & Field Notes:</span>
                <p className="text-slate-800 mt-0.5">{concern.actionNotes}</p>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
            <div>
              <p className="border-b border-slate-900 font-bold uppercase pb-1 text-slate-900">{chiefTanod}</p>
              <p className="text-[10px] text-slate-600 font-semibold mt-1">Chief Barangay Tanod / Executive Officer</p>
            </div>
            <div>
              <p className="border-b border-slate-900 font-bold uppercase pb-1 text-slate-900">{punongBarangay}</p>
              <p className="text-[10px] text-slate-600 font-semibold mt-1">Punong Barangay</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
