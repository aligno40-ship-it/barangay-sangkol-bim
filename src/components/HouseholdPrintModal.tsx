import React, { useState } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { Household } from '../types';
import { RepublicSeal, BarangaySangkolSeal } from './OfficialSeals';
import { Printer, X, Home, Users, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

interface HouseholdPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHousehold?: Household | null;
  filteredHouseholds?: Household[];
  filterPurok?: string;
}

export const HouseholdPrintModal: React.FC<HouseholdPrintModalProps> = ({
  isOpen,
  onClose,
  initialHousehold = null,
  filteredHouseholds,
  filterPurok = 'All',
}) => {
  const { households, settings, officials } = useBarangay();
  const [printMode, setPrintMode] = useState<'masterlist' | 'individual'>(
    initialHousehold ? 'individual' : 'masterlist'
  );
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>(
    initialHousehold?.id || (households[0]?.id ?? '')
  );

  if (!isOpen) return null;

  const householdListToPrint = filteredHouseholds || households;
  const currentHousehold =
    households.find((h) => h.id === selectedHouseholdId) || initialHousehold || households[0];

  const punongBarangay =
    officials.find((o) => o.position.includes('Punong Barangay') || o.position.includes('Captain'))?.name ||
    settings.punongBarangay;
  const secretary =
    officials.find((o) => o.position.includes('Secretary'))?.name || settings.barangaySecretary;

  // Masterlist Demographics & Amenities Aggregates
  const totalHouseholds = householdListToPrint.length;
  const totalInhabitants = householdListToPrint.reduce((acc, h) => acc + (h.members?.length || 1), 0);
  const fourPsCount = householdListToPrint.filter((h) => h.is4PsBeneficiary).length;
  const sanitaryCount = householdListToPrint.filter((h) => h.sanitaryToilet).length;
  const concreteCount = householdListToPrint.filter((h) => h.housingType === 'Concrete' || h.housingType === 'Semi-Concrete').length;
  const ownedCount = householdListToPrint.filter((h) => h.houseOwnership === 'Owned').length;

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
                <span>Print Household Records</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  RBI Form 1B
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Official Barangay Living Quarter & Household Composition Sheets
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
                <span>Household Masterlist ({totalHouseholds})</span>
              </button>
              <button
                onClick={() => setPrintMode('individual')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  printMode === 'individual'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Household Sheet (RBI Form 1B)</span>
              </button>
            </div>

            {printMode === 'individual' && (
              <select
                value={selectedHouseholdId}
                onChange={(e) => setSelectedHouseholdId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {households.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.householdNo} - {h.headName} ({h.purok})
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
                  Registry of Barangay Inhabitants • Household & Housing Demographic Assessment
                </p>
              </div>

              <div className="w-20 sm:w-24 flex justify-center shrink-0">
                <BarangaySangkolSeal size={74} />
              </div>
            </div>

            {/* DOCUMENT BODY */}
            {printMode === 'masterlist' ? (
              /* MASTERLIST VIEW */
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase font-serif underline decoration-2 underline-offset-4">
                    BARANGAY HOUSEHOLD REGISTRY & LIVING SURVEY REPORT
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Consolidated Family Units and Housing Facilities as of {currentDate}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-600 font-medium">
                    <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded-md">
                      Purok Coverage: <strong>{filterPurok}</strong>
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded-md">
                      Total Households: <strong>{totalHouseholds} Families</strong>
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded-md">
                      Covered Population: <strong>{totalInhabitants} Inhabitants</strong>
                    </span>
                  </div>
                </div>

                {/* Statistical Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-300 rounded-lg text-center text-xs">
                  <div className="p-1.5 border-r border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Households</span>
                    <span className="font-bold text-slate-900 text-sm">{totalHouseholds}</span>
                  </div>
                  <div className="p-1.5 border-r border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Sanitary Toilet Rate</span>
                    <span className="font-bold text-emerald-800 text-sm">
                      {totalHouseholds > 0 ? Math.round((sanitaryCount / totalHouseholds) * 100) : 0}% ({sanitaryCount})
                    </span>
                  </div>
                  <div className="p-1.5 border-r border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Concrete Structure</span>
                    <span className="font-bold text-indigo-800 text-sm">{concreteCount}</span>
                  </div>
                  <div className="p-1.5">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">4Ps Beneficiaries</span>
                    <span className="font-bold text-emerald-800 text-sm">{fourPsCount}</span>
                  </div>
                </div>

                {/* Table of Households */}
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-2 border-r border-slate-300 w-8 text-center">#</th>
                        <th className="p-2 border-r border-slate-300">Household No.</th>
                        <th className="p-2 border-r border-slate-300">Head of Family</th>
                        <th className="p-2 border-r border-slate-300">Purok / Address</th>
                        <th className="p-2 border-r border-slate-300 text-center">Members</th>
                        <th className="p-2 border-r border-slate-300">Structure / Ownership</th>
                        <th className="p-2 border-r border-slate-300">Sanitation</th>
                        <th className="p-2">Est. Income</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {householdListToPrint.map((hh, idx) => (
                        <tr key={hh.id} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-200 text-center text-slate-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-mono font-bold text-indigo-900">
                            {hh.householdNo}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                            {hh.headName}
                            {hh.is4PsBeneficiary && (
                              <span className="text-[9px] text-emerald-700 font-bold ml-1.5">[4Ps]</span>
                            )}
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            {hh.purok}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">
                            {hh.members?.length || 1}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-[10px]">
                            {hh.housingType} ({hh.houseOwnership})
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <span className={hh.sanitaryToilet ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                              {hh.sanitaryToilet ? 'Equipped' : 'Open/None'}
                            </span>
                          </td>
                          <td className="p-2 font-mono text-[10px] text-indigo-900 font-semibold">
                            ₱{hh.monthlyHouseholdIncome.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Authentication & Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-12">
                    <p className="text-slate-600 font-medium text-[11px]">Prepared by:</p>
                    <div>
                      <p className="font-bold text-slate-900 uppercase font-serif tracking-wider border-b border-slate-900 inline-block px-8 pb-1">
                        {secretary}
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium mt-1">Barangay Secretary</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <p className="text-slate-600 font-medium text-[11px]">Approved by:</p>
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
              /* INDIVIDUAL HOUSEHOLD RECORD (RBI FORM 1B) VIEW */
              currentHousehold && (
                <div className="space-y-6">
                  <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase font-serif underline decoration-2 underline-offset-4">
                      BARANGAY HOUSEHOLD RECORD (RBI FORM 1B)
                    </h2>
                    <p className="text-xs text-slate-600 font-medium">
                      Official Household Composition & Housing Demographic Sheet
                    </p>
                  </div>

                  {/* Top Household Meta */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-300 rounded-lg text-xs">
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Household Control No:</span>
                        <span className="text-base font-black text-indigo-900 font-mono font-serif">
                          {currentHousehold.householdNo}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Head of Household:</span>
                        <span className="text-sm font-bold text-slate-900">
                          {currentHousehold.headName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Contact Mobile:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {currentHousehold.contactNumber || 'None provided'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Purok / Sitio:</span>
                        <span className="text-sm font-bold text-slate-900">{currentHousehold.purok}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Street Address:</span>
                        <span className="font-medium text-slate-800">{currentHousehold.streetAddress || 'Barangay Sangkol proper'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">4Ps Beneficiary Status:</span>
                        <span className={`font-bold ${currentHousehold.is4PsBeneficiary ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {currentHousehold.is4PsBeneficiary ? 'Enrolled 4Ps Beneficiary Family' : 'Non-4Ps Household'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Housing & Utilities Assessment */}
                  <div className="p-4 border border-slate-300 rounded-lg space-y-3 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase font-serif border-b border-slate-200 pb-1 text-[11px] text-indigo-900">
                      Housing Structure & Living Environment
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Housing Type:</span>
                        <span className="font-bold text-slate-900">{currentHousehold.housingType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Tenure / Ownership:</span>
                        <span className="font-bold text-slate-900">{currentHousehold.houseOwnership}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Water Supply Source:</span>
                        <span className="font-bold text-slate-900">{currentHousehold.waterSource}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Sanitary Toilet Facility:</span>
                        <span className={`font-bold ${currentHousehold.sanitaryToilet ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {currentHousehold.sanitaryToilet ? 'Equipped' : 'None / Open'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Electricity Source:</span>
                        <span className="font-bold text-slate-900">{currentHousehold.electricitySource}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Est. Monthly Income:</span>
                        <span className="font-bold text-indigo-900">₱{currentHousehold.monthlyHouseholdIncome.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Family Members Roster Table */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 uppercase font-serif text-[11px] text-indigo-900 flex items-center justify-between">
                      <span>Roster of Household Members ({currentHousehold.members.length} Registered)</span>
                    </h4>
                    <div className="overflow-x-auto border border-slate-300 rounded-lg">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-2 border-r border-slate-300 w-8 text-center">#</th>
                            <th className="p-2 border-r border-slate-300">Member Name</th>
                            <th className="p-2 border-r border-slate-300">Relation to Head</th>
                            <th className="p-2 border-r border-slate-300 text-center">Sex / Age</th>
                            <th className="p-2">Occupation / Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {currentHousehold.members.map((m, idx) => (
                            <tr key={m.residentId || idx} className="hover:bg-slate-50">
                              <td className="p-2 border-r border-slate-200 text-center text-slate-500 font-mono">
                                {idx + 1}
                              </td>
                              <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                                {m.name}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-indigo-900 font-semibold">
                                {m.relationshipToHead}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-center">
                                {m.sex} / {m.age} yrs
                              </td>
                              <td className="p-2 text-slate-700">
                                {m.occupation || 'Dependent'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                    <div className="space-y-12">
                      <p className="text-slate-600 font-medium text-[11px]">Conforme / Household Head Signature:</p>
                      <div>
                        <p className="font-bold text-slate-900 uppercase font-serif tracking-wider border-b border-slate-900 inline-block px-8 pb-1">
                          {currentHousehold.headName}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium mt-1">Head of Household</p>
                      </div>
                    </div>

                    <div className="space-y-12">
                      <p className="text-slate-600 font-medium text-[11px]">Attested by Punong Barangay:</p>
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

            {/* Document Footer */}
            <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 flex items-center justify-between">
              <span>Barangay Sangkol Integrated Information System (BSIIS) • Form RBI-1B</span>
              <span>Official Document • Valid without alteration</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
