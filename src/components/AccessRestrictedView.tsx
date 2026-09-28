import React from 'react';
import { useBarangay } from '../context/BarangayContext';
import { BarangaySangkolSeal, RepublicSeal } from './OfficialSeals';
import { ShieldAlert, ArrowLeft, Lock, Users, Building2 } from 'lucide-react';

interface AccessRestrictedViewProps {
  moduleName?: string;
  requiredRole?: string;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  moduleName = 'Administrative Area',
  requiredRole = 'Barangay Official or Administrator',
}) => {
  const { currentUser, setActiveModule, settings } = useBarangay();

  const isResident = currentUser?.role === 'Resident';

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-rose-200 shadow-xl overflow-hidden">
        {/* Top Warning Banner */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest uppercase bg-rose-900/60 px-2.5 py-0.5 rounded-full border border-rose-400/40">
                  Security Clearance Alert
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight mt-1">
                Access Restricted: {moduleName}
              </h2>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 opacity-90">
            <RepublicSeal size={42} />
            <BarangaySangkolSeal size={42} />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-950">
            <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-1" />
            <div className="space-y-1 text-xs leading-relaxed">
              <p className="font-bold text-sm text-rose-950">
                You do not have permission to access this administrative module.
              </p>
              <p className="text-rose-800">
                {isResident
                  ? `Your account (${currentUser.name} - @${currentUser.username}) is registered as a Resident Citizen. The "${moduleName}" contains official civil records, blotters, administrative financials, or system configurations that are strictly restricted to Barangay Officials and Staff.`
                  : `Your account (${currentUser.name} - @${currentUser.username}) has the role of ${currentUser.role}. Access to this specific module requires ${requiredRole} clearance.`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Resident Citizen Services</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                As a resident, you can request clearances, track certificate applications, view announcements, and participate in community activities.
              </p>
              <button
                type="button"
                onClick={() => setActiveModule('resident_portal')}
                className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go to My Resident Portal</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Officials & Staff Portal</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                If you are a Barangay Official, Secretary, Treasurer, or Tanod, please sign in with your designated official account.
              </p>
              <button
                type="button"
                onClick={() => setActiveModule('announcements')}
                className="w-full mt-2 py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View Public Announcements</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-2 text-[11px] text-slate-400">
            {settings.barangayName}, {settings.municipality} • Information Security Protocol
          </div>
        </div>
      </div>
    </div>
  );
};
