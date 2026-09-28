import React, { useState, useMemo } from 'react';
import {
  Gift,
  QrCode,
  HandCoins,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Printer,
  ShieldCheck,
  Sparkles,
  Package,
  Layers,
  FileText,
  BadgeDollarSign,
  Download,
  Share2,
} from 'lucide-react';
import {
  AyudaClaimStub,
  FinancialAssistanceRequest,
} from '../../types/residentServices';
import { useCommunityServices } from '../../context/CommunityServicesContext';
import { isResidentRecordOwner } from '../../utils/residentAccountFilter';

interface AyudaReliefClaimTabProps {
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
}

export const AyudaReliefClaimTab: React.FC<AyudaReliefClaimTabProps> = ({
  residentId,
  residentName,
  contactNumber,
  purok,
}) => {
  const {
    ayudaClaims: ayudaStubs,
    financialAssistanceRequests: aicsRequests,
    requestFinancialAssistance,
    updateAyudaClaimStatus,
  } = useCommunityServices();

  const residentIdentity = useMemo(
    () => ({ residentId, name: residentName, contactNumber }),
    [residentId, residentName, contactNumber]
  );

  // STRICT RESIDENT ACCOUNT FILTERING
  const myAyudaStubs = useMemo(() => {
    return (ayudaStubs || []).filter((stub) =>
      isResidentRecordOwner(
        {
          residentId: stub.residentId,
          residentName: stub.residentName,
        },
        residentIdentity
      )
    );
  }, [ayudaStubs, residentIdentity]);

  const myAicsRequests = useMemo(() => {
    return (aicsRequests || []).filter((req) =>
      isResidentRecordOwner(
        {
          residentId: req.residentId,
          residentName: req.residentName,
          beneficiaryName: req.beneficiaryName,
          contactNumber: req.contactNumber,
        },
        residentIdentity
      )
    );
  }, [aicsRequests, residentIdentity]);

  const [activeSubTab, setActiveSubTab] = useState<'claim_stubs' | 'financial_aics'>('claim_stubs');
  const [selectedStubForQR, setSelectedStubForQR] = useState<AyudaClaimStub | null>(null);
  const [isAicsModalOpen, setIsAicsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // AICS Form State
  const [assistanceType, setAssistanceType] = useState<FinancialAssistanceRequest['assistanceType']>('AICS - Medical & Hospitalization Subsidy');
  const [amountRequested, setAmountRequested] = useState(3000);
  const [beneficiaryName, setBeneficiaryName] = useState(residentName);
  const [justification, setJustification] = useState('');

  const handleApplyAICS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification) return;

    const newReq = requestFinancialAssistance({
      assistanceType,
      residentId,
      residentName,
      contactNumber,
      purok,
      amountRequested,
      beneficiaryName,
      justification,
      documentsSubmitted: ['Barangay Indigency Certificate', 'Valid Resident ID', 'Official Medical / Expense Receipt'],
    });

    setSuccessMessage(`✓ Financial assistance request (${newReq.id}) submitted! Assigned social worker and Admin have been alerted.`);
    setIsAicsModalOpen(false);
    setJustification('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  const handleMarkClaimedInStub = (stubId: string) => {
    updateAyudaClaimStatus(stubId, 'Claimed / Released');
    if (selectedStubForQR && selectedStubForQR.id === stubId) {
      setSelectedStubForQR({ ...selectedStubForQR, status: 'Claimed / Released' });
    }
    setSuccessMessage('✓ Distribution pass marked as claimed and recorded at Barangay Ayuda Desk.');
    setTimeout(() => setSuccessMessage(''), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Social Welfare • Disaster Relief
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-slate-200">
              Barangay Ayuda Hub
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Ayuda, Relief Distribution & Financial Aid
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-2xl">
            Access your allocated emergency relief packs, agricultural inputs, and apply for DSWD / Barangay AICS medical and burial financial assistance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAicsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
        >
          <HandCoins className="w-4 h-4" />
          <span>Apply Financial Aid</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="p-1 hover:bg-emerald-200/50 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('claim_stubs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'claim_stubs'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Your Ayuda Claim Stubs</span>
            {myAyudaStubs.length > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
                {myAyudaStubs.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('financial_aics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'financial_aics'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BadgeDollarSign className="w-4 h-4" />
            <span>AICS & Financial Grants</span>
            {myAicsRequests.length > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
                {myAicsRequests.length}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline font-medium">
          DSWD & Barangay Sangkol Social Services
        </span>
      </div>

      {activeSubTab === 'claim_stubs' ? (
        <div className="space-y-4">
          {myAyudaStubs.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2 shadow-xs">
              <Package className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No Ayuda stubs currently allocated to your account</p>
              <p className="text-xs text-slate-500">When relief distributions for your household or purok are published, your claim voucher will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myAyudaStubs.map((stub) => (
                <div key={stub.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-black bg-emerald-50 text-emerald-900 border border-emerald-200">
                        {stub.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          stub.status === 'Available to Claim'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {stub.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 leading-snug">{stub.title}</h3>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">{stub.category}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100 text-xs text-slate-700">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Distribution: <strong>{stub.distributionDate}</strong> ({stub.timeSlot})</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>Venue: {stub.claimLocation}</span>
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700">Relief Package Contents:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {stub.itemsIncluded.map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 font-medium">
                            • {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">Beneficiary: {stub.residentName} ({stub.householdNo})</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStubForQR(stub)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>View QR Pass</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
                <span>Financial Assistance for Individuals in Crisis (AICS) Docket</span>
              </h3>
              <span className="text-xs text-slate-500">{myAicsRequests.length} record(s)</span>
            </div>

            {myAicsRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <HandCoins className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No financial assistance requests filed yet</p>
                <p className="text-xs text-slate-500">Click "Apply for AICS Grant" to submit your application and hospital/burial/educational documents.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myAicsRequests.map((req) => (
                  <div key={req.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          {req.id}
                        </span>
                        <span className="font-bold text-sm text-slate-900">{req.assistanceType}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {req.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-semibold">
                        Beneficiary: {req.beneficiaryName} ({req.purok}) • Amount Requested: <span className="text-emerald-700 font-black">₱{req.amountRequested.toLocaleString()}</span>
                      </p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        Justification: {req.justification}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {req.documentsSubmitted.map((doc, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                      Filed: {req.createdAt}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Claim Pass Modal */}
      {selectedStubForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-mono font-bold text-slate-400">{selectedStubForQR.id}</span>
              <button
                type="button"
                onClick={() => setSelectedStubForQR(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">{selectedStubForQR.title}</h3>
              <p className="text-xs text-slate-500 font-medium">Official Barangay Ayuda Redemption Pass</p>
            </div>

            {/* Generated QR Mock Box */}
            <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
                <QrCode className="w-36 h-36 text-slate-900" />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 break-all px-4">
                {selectedStubForQR.qrPayload}
              </span>
            </div>

            <div className="text-left bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 text-xs space-y-1.5 text-emerald-950">
              <p><strong>Beneficiary:</strong> {selectedStubForQR.residentName}</p>
              <p><strong>Venue:</strong> {selectedStubForQR.claimLocation}</p>
              <p><strong>Claim Window:</strong> {selectedStubForQR.distributionDate} ({selectedStubForQR.timeSlot})</p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Stub</span>
              </button>

              {selectedStubForQR.status === 'Available to Claim' && (
                <button
                  type="button"
                  onClick={() => handleMarkClaimedInStub(selectedStubForQR.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Claimed</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply AICS Financial Assistance Modal */}
      {isAicsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Apply for Emergency Financial Assistance</h3>
                  <p className="text-xs text-slate-500">Barangay & DSWD AICS Program</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAicsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyAICS} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assistance Program</label>
                <select
                  value={assistanceType}
                  onChange={(e) => setAssistanceType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="AICS - Medical & Hospitalization Subsidy">AICS - Medical & Hospitalization Subsidy</option>
                  <option value="AICS - Burial / Funeral Expense Assistance">AICS - Burial / Funeral Expense Assistance</option>
                  <option value="AICS - Educational Crisis Support">AICS - Educational Crisis Support for Students</option>
                  <option value="Emergency Food / Cash Subsidy">Emergency Food / Cash Subsidy</option>
                  <option value="Disaster / Fire Victim Rehabilitation Grant">Disaster / Fire Victim Rehabilitation Grant</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Beneficiary Name</label>
                  <input
                    type="text"
                    required
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Requested Amount (₱)</label>
                  <input
                    type="number"
                    min={500}
                    max={20000}
                    value={amountRequested}
                    onChange={(e) => setAmountRequested(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Justification & Crisis Statement</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain the urgent circumstances, diagnosis, or emergency financial need..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Mandatory Supporting Documents</span>
                </p>
                <p>Please bring physical hospital billing, pharmacy receipts, or funeral contract to the Barangay Social Worker Desk.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAicsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold cursor-pointer shadow-md"
                >
                  Submit Financial Assistance Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
