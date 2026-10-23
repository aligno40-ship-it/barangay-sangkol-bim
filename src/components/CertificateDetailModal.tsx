import React, { useState } from 'react';
import { CertificateRecord, BarangaySettings } from '../types';
import { RepublicSeal, BarangaySangkolSeal, DrySealStamp } from './OfficialSeals';
import { CertificateQRCode } from './CertificateQRCode';
import { CertificateVerificationModal } from './CertificateVerificationModal';
import { useBarangay } from '../context/BarangayContext';
import { getAccurateCertificateCredentials, formatCleanCertificateAddress } from '../utils/ageUtils';
import { getCertificateVerificationUrl } from '../utils/qrUtils';
import {
  X,
  Printer,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  MapPin,
  Receipt,
  FileCheck2,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Award,
  Sparkles,
  QrCode,
} from 'lucide-react';

interface CertificateDetailModalProps {
  certificate: CertificateRecord | null;
  onClose: () => void;
  onPrint: (cert: CertificateRecord) => void;
  onRenew?: (cert: CertificateRecord) => void;
  settings: BarangaySettings;
}

export const CertificateDetailModal: React.FC<CertificateDetailModalProps> = ({
  certificate,
  onClose,
  onPrint,
  onRenew,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const { residents, users, currentUser } = useBarangay();

  if (!certificate) return null;

  const cert = certificate;

  // Strict Resident Access Guard: Residents can only inspect their own certificates
  if (currentUser.role === 'Resident') {
    const userResidentId = currentUser.residentId;
    const userFullName = currentUser.name.trim().toLowerCase();
    const isOwner =
      (userResidentId && cert.residentId && cert.residentId === userResidentId) ||
      (cert.residentName && cert.residentName.trim().toLowerCase() === userFullName);

    if (!isOwner) {
      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 modal-backdrop animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
              <p className="text-xs text-slate-600">
                You can only view and inspect certificate records issued under your own verified resident profile.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      );
    }
  }

  const creds = getAccurateCertificateCredentials(cert, residents, users, currentUser, settings.barangayName);
  const residentName = creds.name || cert.residentName;
  const residentAge = creds.age;
  const residentCivilStatus = creds.civilStatus || cert.residentCivilStatus || 'Single';
  const residentAddress = formatCleanCertificateAddress(
    creds.address || cert.residentAddress,
    creds.purok,
    settings.barangayName
  );

  // Check expiration status
  const isExpired = cert.expirationDate ? new Date(cert.expirationDate) < new Date() : false;
  const isWaived = cert.fee === 0 || cert.orNumber.includes('EXEMPT') || cert.orNumber.includes('WAIVED') || cert.orNumber.includes('FREE');

  const handleCopyControlNumber = () => {
    navigator.clipboard.writeText(cert.controlNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 modal-backdrop animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-4 translate-y-4">
            <BarangaySangkolSeal size={140} />
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Official Archive Record
                </span>
                {isExpired ? (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-500/40 text-slate-300 border border-slate-400/30">
                    Expired Historical Record
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active & Valid
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-1">
                {cert.type}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Official Verification Strip */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Official Control Number
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-indigo-900 tracking-tight">
                  {cert.controlNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyControlNumber}
                  className="p-1 text-slate-500 hover:text-indigo-600 bg-white rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer text-[10px]"
                  title="Copy Control Number"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right sm:text-right space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Validity Period
                </span>
                <p className="font-semibold text-slate-800">
                  {cert.dateIssued} {cert.expirationDate ? `to ${cert.expirationDate}` : '(Standard 6 Months)'}
                </p>
              </div>
            </div>
          </div>

          {/* Citizen Details Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900 text-xs">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Certified Resident Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Full Legal Name:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{residentName}</p>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Resident ID Reference:</span>
                <p className="font-mono font-semibold text-slate-700 mt-0.5">{cert.residentId || 'Verified Resident'}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-500 text-[11px]">Registered Address:</span>
                <p className="font-semibold text-slate-800 mt-0.5 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{residentAddress}</span>
                </p>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Age & Civil Status:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {residentAge} years old • {residentCivilStatus}
                </p>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Certified Purpose:</span>
                <p className="font-semibold text-indigo-950 mt-0.5">{cert.purpose}</p>
              </div>
            </div>
          </div>

          {/* Official Treasury & Transaction Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900 text-xs">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Official Receipt (O.R.) & Cedula Breakdown</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Official Receipt No:</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{cert.orNumber || 'WAIVED / EXEMPT'}</p>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Assessed Fee:</span>
                <p className="font-bold text-emerald-700 text-sm mt-0.5">
                  {isWaived ? '₱0.00 (Exempted / Free)' : `₱${cert.fee.toFixed(2)}`}
                </p>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Community Tax Cert (CTC):</span>
                <p className="font-mono text-slate-700 mt-0.5">{cert.cedulaNo || 'Presented at Counter'}</p>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Collecting Officer:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{settings.barangayTreasurer}</p>
              </div>
            </div>
          </div>

          {/* Attestation & Signatory Details */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 font-bold text-slate-900 text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Barangay Official Attestation & Security Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-semibold">Signatory Official:</span>
                <p className="font-bold text-slate-900">{cert.signatoryOfficial || settings.punongBarangay}</p>
                <p className="text-[11px] text-indigo-700 font-semibold">{cert.signatoryPosition || 'Punong Barangay'}</p>
                <p className="text-[10px] text-slate-500">Issued at: {settings.hallAddress}</p>
              </div>

              <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-semibold">Verification & Digital Seal:</span>
                  <button
                    type="button"
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Live Validator</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <CertificateQRCode
                    controlNumber={cert.controlNumber}
                    size={64}
                    onOpenVerification={() => setIsVerificationModalOpen(true)}
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">QR Code Verification</p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Scan with any smartphone camera or QR reader to verify official validity, signatory, and receipt ledger.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>Test Verification Portal</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {cert.remarks && (
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                <strong>Remarks / Notes:</strong> {cert.remarks}
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Permanent Citizen Record • Official Republic Seal</span>
          </div>

          <div className="flex items-center gap-2">
            {onRenew && (
              <button
                type="button"
                onClick={() => {
                  onRenew(cert);
                  onClose();
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-indigo-700 font-bold rounded-xl text-xs border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply for Renewal</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onPrint(cert);
                onClose();
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>View / Print Certificate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Verification Modal */}
      <CertificateVerificationModal
        initialControlNumber={cert.controlNumber}
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />
    </div>
  );
};
