import React, { useState } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { BarangayOfficial } from '../types';
import { RepublicSeal, BarangaySangkolSeal } from './OfficialSeals';
import { Printer, X, Award, ShieldCheck, UserCheck, Phone, Mail, FileText } from 'lucide-react';

interface OfficialsPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOfficial?: BarangayOfficial | null;
}

export const OfficialsPrintModal: React.FC<OfficialsPrintModalProps> = ({
  isOpen,
  onClose,
  initialOfficial = null,
}) => {
  const { officials, settings } = useBarangay();
  const [printMode, setPrintMode] = useState<'directory' | 'individual'>(
    initialOfficial ? 'individual' : 'directory'
  );
  const [selectedOfficialId, setSelectedOfficialId] = useState<string>(
    initialOfficial?.id || (officials[0]?.id ?? '')
  );

  if (!isOpen) return null;

  const sortedOfficials = [...officials].sort((a, b) => a.order - b.order);
  const currentOfficial =
    officials.find((o) => o.id === selectedOfficialId) || initialOfficial || officials[0];

  const punongBarangay =
    sortedOfficials.find((o) => o.position.includes('Punong Barangay') || o.position.includes('Captain')) ||
    sortedOfficials[0];
  const kagawads = sortedOfficials.filter(
    (o) => o.position.includes('Kagawad') || o.position.includes('Sangguniang Barangay Member')
  );
  const appointiveStaff = sortedOfficials.filter(
    (o) => !o.position.includes('Punong Barangay') && !o.position.includes('Kagawad')
  );

  const secretary =
    sortedOfficials.find((o) => o.position.includes('Secretary'))?.name || settings.barangaySecretary;

  const currentDate = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 modal-backdrop">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        
        {/* Top Controls Bar (Hidden on Print) */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Print Officials & Staff Directory</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  Official Roster
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Official Directory of Barangay Governance & Frontline Personnel
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setPrintMode('directory')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  printMode === 'directory'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Complete Roster Directory ({officials.length})</span>
              </button>
              <button
                onClick={() => setPrintMode('individual')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  printMode === 'individual'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Official Profile Sheet</span>
              </button>
            </div>

            {printMode === 'individual' && (
              <select
                value={selectedOfficialId}
                onChange={(e) => setSelectedOfficialId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {sortedOfficials.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} - {o.position}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Directory</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 printable-area">
          <div className="bg-white p-8 sm:p-10 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto text-slate-900 space-y-6">
            
            {/* OFFICIAL HEADER WITH SEALS */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 text-center">
              <div className="w-20 sm:w-24 flex justify-center shrink-0">
                <RepublicSeal size={74} />
              </div>
              
              <div className="flex-1 px-4 space-y-0.5 text-center">
                <p className="text-[11px] uppercase tracking-widest font-serif font-bold text-slate-700">Republic of the Philippines</p>
                <p className="text-[11px] uppercase tracking-widest font-serif text-slate-700">{settings.province || 'Province of Misamis Occidental'}</p>
                <p className="text-[11px] uppercase tracking-widest font-serif text-slate-700">{settings.municipality || 'Municipality of Sinacaban'}</p>
                <h1 className="text-base sm:text-lg font-serif font-black tracking-wider text-slate-900 uppercase pt-0.5">
                  {settings.barangayName || 'BARANGAY SANGKOL'}
                </h1>
                <p className="text-[10px] font-serif italic text-slate-600">
                  Office of the Punong Barangay • Sangguniang Barangay Official Directory
                </p>
              </div>

              <div className="w-20 sm:w-24 flex justify-center shrink-0">
                <BarangaySangkolSeal size={74} />
              </div>
            </div>

            {/* DOCUMENT BODY */}
            {printMode === 'directory' ? (
              /* COMPLETE ROSTER VIEW */
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase font-serif underline decoration-2 underline-offset-4">
                    OFFICIAL ROSTER OF BARANGAY OFFICIALS & STAFF
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Term of Office: 2023 - 2026 • Verified as of {currentDate}
                  </p>
                </div>

                {/* Section I: Punong Barangay */}
                {punongBarangay && (
                  <div className="p-4 bg-slate-50 border-2 border-slate-800 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block font-serif">
                      I. Executive Branch / Local Chief Executive
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-black text-slate-900 font-serif">
                          {punongBarangay.name.startsWith('Hon.') ? punongBarangay.name : `Hon. ${punongBarangay.name}`}
                        </h3>
                        <p className="text-xs font-bold text-indigo-900">{punongBarangay.position}</p>
                      </div>
                      <div className="text-xs text-slate-700 space-y-0.5 text-right sm:text-right">
                        <p className="font-mono font-semibold">Contact: {punongBarangay.contactNumber}</p>
                        <p className="text-[11px] text-slate-500">Term: {punongBarangay.termStart} to {punongBarangay.termEnd}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section II: Sangguniang Barangay (Kagawads) */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase font-serif text-[11px] text-indigo-900">
                    II. Sangguniang Barangay Members (Barangay Kagawads)
                  </h4>
                  <div className="overflow-x-auto border border-slate-300 rounded-lg">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-2 border-r border-slate-300 w-8 text-center">#</th>
                          <th className="p-2 border-r border-slate-300">Official Name</th>
                          <th className="p-2 border-r border-slate-300">Position</th>
                          <th className="p-2 border-r border-slate-300">Committee Assignment</th>
                          <th className="p-2">Contact Number</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {kagawads.map((kag, idx) => (
                          <tr key={kag.id} className="hover:bg-slate-50">
                            <td className="p-2 border-r border-slate-200 text-center font-bold font-mono">
                              {idx + 1}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-bold text-slate-900 font-serif">
                              {kag.name.startsWith('Hon.') ? kag.name : `Hon. ${kag.name}`}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-slate-700">
                              {kag.position}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-semibold text-indigo-900">
                              {kag.committee || 'General Governance'}
                            </td>
                            <td className="p-2 font-mono text-[10px] text-slate-800">
                              {kag.contactNumber}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section III: Appointed Officers & Frontline Staff */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase font-serif text-[11px] text-indigo-900">
                    III. Appointive Barangay Officers & Support Staff
                  </h4>
                  <div className="overflow-x-auto border border-slate-300 rounded-lg">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-2 border-r border-slate-300 w-8 text-center">#</th>
                          <th className="p-2 border-r border-slate-300">Personnel Name</th>
                          <th className="p-2 border-r border-slate-300">Designation / Role</th>
                          <th className="p-2 border-r border-slate-300">Assigned Area</th>
                          <th className="p-2">Contact Mobile</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {appointiveStaff.map((staff, idx) => (
                          <tr key={staff.id} className="hover:bg-slate-50">
                            <td className="p-2 border-r border-slate-200 text-center text-slate-500 font-mono">
                              {idx + 1}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                              {staff.name}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-semibold text-indigo-900">
                              {staff.position}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-slate-700">
                              {staff.purok || 'Barangay Hall / Operations'}
                            </td>
                            <td className="p-2 font-mono text-[10px] text-slate-800">
                              {staff.contactNumber}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section IV: Emergency Directory */}
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-slate-900 uppercase font-serif text-[10px] block">
                    Barangay Emergency & Public Assistance Hotlines
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">Barangay Hall:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">{settings.contactNumber || '0917-889-2231'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">MDRRMO / Rescue:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">0917-890-4421</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Sinacaban PNP:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">0998-598-7321</span>
                    </div>
                  </div>
                </div>

                {/* Authentication & Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-12">
                    <p className="text-slate-600 font-medium text-[11px]">Attested by:</p>
                    <div>
                      <p className="font-bold text-slate-900 uppercase font-serif tracking-wider border-b border-slate-900 inline-block px-8 pb-1">
                        {secretary}
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium mt-1">Barangay Secretary</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <p className="text-slate-600 font-medium text-[11px]">Certified Correct:</p>
                    <div>
                      <p className="font-bold text-slate-900 uppercase font-serif tracking-wider border-b border-slate-900 inline-block px-8 pb-1">
                        Hon. {punongBarangay.name}
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium mt-1">Punong Barangay</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* INDIVIDUAL OFFICIAL PROFILE VIEW */
              currentOfficial && (
                <div className="space-y-6">
                  <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase font-serif underline decoration-2 underline-offset-4">
                      OFFICIAL PROFILE & CERTIFICATE OF APPOINTMENT
                    </h2>
                    <p className="text-xs text-slate-600 font-medium">
                      Barangay Governance Personnel Record (Term 2023 - 2026)
                    </p>
                  </div>

                  {/* Top Profile Card */}
                  <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg flex flex-col sm:flex-row items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Designated Official:</p>
                      <h3 className="text-lg font-black text-slate-900 font-serif">
                        {currentOfficial.name.startsWith('Hon.') ? currentOfficial.name : `Hon. ${currentOfficial.name}`}
                      </h3>
                      <p className="text-sm font-bold text-indigo-900">{currentOfficial.position}</p>
                      <p className="text-slate-600 text-xs">
                        Committee: <strong>{currentOfficial.committee || 'Executive / General Administration'}</strong>
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {currentOfficial.status} Official
                      </span>
                      <p className="text-[11px] text-slate-600 font-mono">
                        Term: {currentOfficial.termStart} to {currentOfficial.termEnd}
                      </p>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 border border-slate-300 rounded-lg space-y-2">
                      <h4 className="font-bold text-slate-900 uppercase font-serif border-b border-slate-200 pb-1 text-[11px] text-indigo-900">
                        Contact & Representation
                      </h4>
                      <div className="space-y-1.5">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Mobile Hotline:</span>
                          <span className="font-mono font-bold text-slate-900">{currentOfficial.contactNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Email Address:</span>
                          <span className="font-medium text-slate-800">{currentOfficial.email || 'None on file'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Resident Purok / Area:</span>
                          <span className="font-bold text-slate-800">{currentOfficial.purok || 'Barangay Sangkol proper'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-slate-300 rounded-lg space-y-2">
                      <h4 className="font-bold text-slate-900 uppercase font-serif border-b border-slate-200 pb-1 text-[11px] text-indigo-900">
                        Duties & Responsibilities
                      </h4>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        Duly empowered under Republic Act No. 7160 (Local Government Code of 1991) to formulate barangay policies, execute public safety measures, and promote the general welfare of the constituency of Barangay Sangkol.
                      </p>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                    <div className="space-y-12">
                      <p className="text-slate-600 font-medium text-[11px]">Official / Appointee Signature:</p>
                      <div>
                        <p className="font-bold text-slate-900 uppercase font-serif tracking-wider border-b border-slate-900 inline-block px-8 pb-1">
                          {currentOfficial.name}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium mt-1">{currentOfficial.position}</p>
                      </div>
                    </div>

                    <div className="space-y-12">
                      <p className="text-slate-600 font-medium text-[11px]">Attested by Punong Barangay:</p>
                      <div>
                        <p className="font-bold text-slate-900 uppercase font-serif tracking-wider border-b border-slate-900 inline-block px-8 pb-1">
                          Hon. {punongBarangay.name}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium mt-1">Punong Barangay</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Document Footer */}
            <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 flex items-center justify-between">
              <span>Barangay Sangkol Integrated Information System (BSIIS) • Officials Roster</span>
              <span>Official Record • Republic of the Philippines</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
