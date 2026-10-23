import React, { useState } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { Resident } from '../types';
import { RepublicSeal, BarangaySangkolSeal, DrySealStamp } from './OfficialSeals';
import { Printer, X, FileText, UserCheck, ShieldCheck, Filter, Download } from 'lucide-react';

interface ResidentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialResident?: Resident | null;
  filteredResidents?: Resident[];
  filterPurok?: string;
  filterSector?: string;
}

export const ResidentPrintModal: React.FC<ResidentPrintModalProps> = ({
  isOpen,
  onClose,
  initialResident = null,
  filteredResidents,
  filterPurok = 'All',
  filterSector = 'All',
}) => {
  const { residents, settings, officials } = useBarangay();
  const [printMode, setPrintMode] = useState<'masterlist' | 'individual'>(
    initialResident ? 'individual' : 'masterlist'
  );
  const [selectedResidentId, setSelectedResidentId] = useState<string>(
    initialResident?.id || (residents[0]?.id ?? '')
  );

  if (!isOpen) return null;

  const residentListToPrint = filteredResidents || residents;
  const currentResident = residents.find((r) => r.id === selectedResidentId) || initialResident || residents[0];

  const punongBarangay = officials.find((o) => o.position.includes('Punong Barangay') || o.position.includes('Captain'))?.name || settings.punongBarangay;
  const secretary = officials.find((o) => o.position.includes('Secretary'))?.name || settings.barangaySecretary;

  // Masterlist Demographic Summary Counts
  const totalCount = residentListToPrint.length;
  const maleCount = residentListToPrint.filter((r) => r.sex === 'Male').length;
  const femaleCount = residentListToPrint.filter((r) => r.sex === 'Female').length;
  const seniorCount = residentListToPrint.filter((r) => r.isSeniorCitizen).length;
  const pwdCount = residentListToPrint.filter((r) => r.isPWD).length;
  const fourPsCount = residentListToPrint.filter((r) => r.is4PsBeneficiary).length;
  const voterCount = residentListToPrint.filter((r) => r.voterStatus === 'Registered').length;
  const youthCount = residentListToPrint.filter((r) => r.isYouth).length;

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
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Print Resident Documents</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  Official RBI Forms
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Official Republic of the Philippines Demographic Records & Profiles
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setPrintMode('masterlist')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  printMode === 'masterlist'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Masterlist Registry ({totalCount})</span>
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
                <span>Individual Profile (RBI Form 1A)</span>
              </button>
            </div>

            {printMode === 'individual' && (
              <select
                value={selectedResidentId}
                onChange={(e) => setSelectedResidentId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.lastName}, {r.firstName} ({r.purok})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
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
                  Office of the Sangguniang Barangay • Registry of Barangay Inhabitants
                </p>
              </div>

              <div className="w-20 sm:w-24 flex justify-center shrink-0">
                <BarangaySangkolSeal size={74} />
              </div>
            </div>

            {/* DOCUMENT BODY */}
            {printMode === 'masterlist' ? (
              /* MASTERLIST REGISTRY VIEW */
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase font-serif underline decoration-2 underline-offset-4">
                    OFFICIAL REGISTRY OF BARANGAY INHABITANTS (RBI)
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Master Resident Demographic Directory as of {currentDate}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-600 font-medium">
                    <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded-md">
                      Purok Scope: <strong>{filterPurok}</strong>
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded-md">
                      Sector Filter: <strong>{filterSector}</strong>
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded-md">
                      Total Records: <strong>{totalCount} Residents</strong>
                    </span>
                  </div>
                </div>

                {/* Summary Statistics Breakdown */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 bg-slate-50 border border-slate-300 rounded-lg text-center text-xs">
                  <div className="p-1.5 border-r border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Males</span>
                    <span className="font-bold text-slate-900 text-sm">{maleCount}</span>
                  </div>
                  <div className="p-1.5 border-r border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Females</span>
                    <span className="font-bold text-slate-900 text-sm">{femaleCount}</span>
                  </div>
                  <div className="p-1.5 border-r border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Senior (60+)</span>
                    <span className="font-bold text-amber-800 text-sm">{seniorCount}</span>
                  </div>
                  <div className="p-1.5 border-r border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">PWDs</span>
                    <span className="font-bold text-purple-800 text-sm">{pwdCount}</span>
                  </div>
                  <div className="p-1.5 border-r border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">4Ps Beneficiaries</span>
                    <span className="font-bold text-emerald-800 text-sm">{fourPsCount}</span>
                  </div>
                  <div className="p-1.5">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Reg. Voters</span>
                    <span className="font-bold text-indigo-800 text-sm">{voterCount}</span>
                  </div>
                </div>

                {/* Masterlist Data Table */}
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-2 border-r border-slate-300 w-8 text-center">#</th>
                        <th className="p-2 border-r border-slate-300">Resident ID</th>
                        <th className="p-2 border-r border-slate-300">Full Name</th>
                        <th className="p-2 border-r border-slate-300 text-center">Sex / Age</th>
                        <th className="p-2 border-r border-slate-300">Purok / Address</th>
                        <th className="p-2 border-r border-slate-300">Contact Number</th>
                        <th className="p-2 border-r border-slate-300">Voter / Precinct</th>
                        <th className="p-2">Sectoral Tag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {residentListToPrint.map((res, index) => (
                        <tr key={res.id} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-200 text-center text-slate-500 font-mono">
                            {index + 1}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-mono font-bold text-indigo-900">
                            {res.id}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                            {res.lastName}, {res.firstName} {res.middleName ? `${res.middleName[0]}.` : ''} {res.suffix || ''}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center">
                            {res.sex[0]} / {res.age}
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            {res.purok}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-mono text-[10px]">
                            {res.contactNumber}
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <span className={res.voterStatus === 'Registered' ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                              {res.voterStatus} {res.precinctNo ? `(${res.precinctNo})` : ''}
                            </span>
                          </td>
                          <td className="p-2 text-[10px]">
                            {res.isSeniorCitizen && <span className="font-semibold text-amber-700 mr-1">[Senior]</span>}
                            {res.is4PsBeneficiary && <span className="font-semibold text-emerald-700 mr-1">[4Ps]</span>}
                            {res.isPWD && <span className="font-semibold text-purple-700 mr-1">[PWD]</span>}
                            {res.isHouseholdHead && <span className="font-semibold text-blue-700 mr-1">[Head]</span>}
                            {!res.isSeniorCitizen && !res.is4PsBeneficiary && !res.isPWD && !res.isHouseholdHead && '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Authentication & Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-12">
                    <p className="text-slate-600 font-medium text-[11px]">Prepared and Verified by:</p>
                    <div>
                      <p className="font-bold text-slate-900 uppercase font-serif tracking-wider border-b border-slate-900 inline-block px-8 pb-1">
                        {secretary}
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium mt-1">Barangay Secretary</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <p className="text-slate-600 font-medium text-[11px]">Attested and Approved by:</p>
                    <div>
                      <p className="font-bold text-slate-900 uppercase font-serif tracking-wider border-b border-slate-900 inline-block px-8 pb-1">
                        Hon. {punongBarangay}
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium mt-1">Punong Barangay</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* INDIVIDUAL RESIDENT PROFILE (RBI FORM 1A) VIEW */
              currentResident && (
                <div className="space-y-6">
                  <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase font-serif underline decoration-2 underline-offset-4">
                      RESIDENT INFORMATION SHEET (RBI FORM 1A)
                    </h2>
                    <p className="text-xs text-slate-600 font-medium">
                      Barangay Inhabitant Civil Registry & Household Profile
                    </p>
                  </div>

                  {/* Top Details & Sector Tags */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 bg-slate-50 border border-slate-300 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Resident Name:</p>
                      <h3 className="text-lg font-black text-slate-900 font-serif">
                        {currentResident.lastName}, {currentResident.firstName} {currentResident.middleName || ''} {currentResident.suffix || ''}
                      </h3>
                      <p className="text-xs text-indigo-900 font-mono font-bold">
                        ID: {currentResident.id} • Registered: {currentResident.dateRegistered || currentDate}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-w-sm justify-end">
                      {currentResident.isHouseholdHead && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          Head of Household
                        </span>
                      )}
                      {currentResident.isSeniorCitizen && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Senior Citizen
                        </span>
                      )}
                      {currentResident.is4PsBeneficiary && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          4Ps Beneficiary
                        </span>
                      )}
                      {currentResident.isPWD && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                          PWD ({currentResident.pwdType || 'General'})
                        </span>
                      )}
                      {currentResident.isSoloParent && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800 border border-pink-300">
                          Solo Parent
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                        Voter: {currentResident.voterStatus} {currentResident.precinctNo ? `(${currentResident.precinctNo})` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Section I: Personal & Civil Registry */}
                    <div className="p-4 border border-slate-300 rounded-lg space-y-2">
                      <h4 className="font-bold text-slate-900 uppercase font-serif border-b border-slate-200 pb-1 text-[11px] text-indigo-900">
                        I. Personal & Civil Data
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Date of Birth:</span>
                          <span className="font-bold text-slate-800">{currentResident.birthDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Age:</span>
                          <span className="font-bold text-slate-800">{currentResident.age} years old</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Sex:</span>
                          <span className="font-bold text-slate-800">{currentResident.sex}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Civil Status:</span>
                          <span className="font-bold text-slate-800">{currentResident.civilStatus}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Citizenship:</span>
                          <span className="font-bold text-slate-800">{currentResident.citizenship}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Blood Type:</span>
                          <span className="font-bold text-rose-700">{currentResident.bloodType || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Religion:</span>
                          <span className="font-bold text-slate-800">{currentResident.religion}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Resident Status:</span>
                          <span className="font-bold text-emerald-800">{currentResident.residentStatus}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section II: Residence & Location */}
                    <div className="p-4 border border-slate-300 rounded-lg space-y-2">
                      <h4 className="font-bold text-slate-900 uppercase font-serif border-b border-slate-200 pb-1 text-[11px] text-indigo-900">
                        II. Residence & Household
                      </h4>
                      <div className="space-y-1.5">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Purok / Sitio:</span>
                          <span className="font-bold text-slate-900">{currentResident.purok}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Street Address:</span>
                          <span className="font-bold text-slate-900">{currentResident.streetAddress || 'Barangay Sangkol proper'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Household Control No:</span>
                          <span className="font-mono font-bold text-indigo-900">{currentResident.householdId || 'Unassigned / Independent'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section III: Socio-Economic Profile */}
                    <div className="p-4 border border-slate-300 rounded-lg space-y-2">
                      <h4 className="font-bold text-slate-900 uppercase font-serif border-b border-slate-200 pb-1 text-[11px] text-indigo-900">
                        III. Socio-Economic Profile
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Occupation:</span>
                          <span className="font-bold text-slate-800">{currentResident.occupation || 'None / Student'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Monthly Income:</span>
                          <span className="font-bold text-slate-800">
                            {currentResident.monthlyIncome > 0 ? `₱${currentResident.monthlyIncome.toLocaleString()}` : 'None / Dependent'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[10px]">Educational Attainment:</span>
                          <span className="font-bold text-slate-800">{currentResident.educationalAttainment}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section IV: Emergency & Contact Data */}
                    <div className="p-4 border border-slate-300 rounded-lg space-y-2">
                      <h4 className="font-bold text-slate-900 uppercase font-serif border-b border-slate-200 pb-1 text-[11px] text-indigo-900">
                        IV. Emergency & Contact Data
                      </h4>
                      <div className="space-y-1.5">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Contact Mobile:</span>
                          <span className="font-mono font-bold text-slate-900">{currentResident.contactNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Email Address:</span>
                          <span className="font-medium text-slate-800">{currentResident.email || 'None on file'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">In Case of Emergency (ICE):</span>
                          <span className="font-bold text-slate-900">
                            {currentResident.emergencyContactName} ({currentResident.emergencyContactNumber})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                    <div className="space-y-12">
                      <p className="text-slate-600 font-medium text-[11px]">Resident / Inhabitant Signature:</p>
                      <div>
                        <p className="font-bold text-slate-900 uppercase font-serif tracking-wider border-b border-slate-900 inline-block px-8 pb-1">
                          {currentResident.firstName} {currentResident.lastName}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium mt-1">Affiant / Registered Inhabitant</p>
                      </div>
                    </div>

                    <div className="space-y-12">
                      <p className="text-slate-600 font-medium text-[11px]">Attested by Barangay Administration:</p>
                      <div>
                        <p className="font-bold text-slate-900 uppercase font-serif tracking-wider border-b border-slate-900 inline-block px-8 pb-1">
                          Hon. {punongBarangay}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium mt-1">Punong Barangay</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Document Security Footer */}
            <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 flex items-center justify-between">
              <span>Barangay Sangkol Integrated Information System (BSIIS) • Control #RBI-{Date.now().toString().slice(-6)}</span>
              <span>Official Document • Valid without alteration</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
