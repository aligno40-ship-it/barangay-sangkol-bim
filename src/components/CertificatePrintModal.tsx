import React, { useState, useEffect } from 'react';
import { useBarangay, areNamesMatching } from '../context/BarangayContext';
import { RepublicSeal, BarangaySangkolSeal } from './OfficialSeals';
import { CertificateVerificationModal } from './CertificateVerificationModal';
import { getCertificateVerificationUrl } from '../utils/qrUtils';
import { Printer, X, ShieldCheck, QrCode, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getAccurateCertificateCredentials, parseSafeCertificateDate, formatCleanCertificateAddress } from '../utils/ageUtils';
import { printCertificateElement } from '../utils/printUtils';

export const CertificatePrintModal: React.FC = () => {
  const { selectedCertForPrint, setSelectedCertForPrint, settings, residents, users, currentUser, officials } = useBarangay();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-mark document body when certificate print modal is active to isolate print output
  useEffect(() => {
    document.body.classList.add('modal-open-certificate');
    return () => {
      document.body.classList.remove('modal-open-certificate', 'is-printing-modal');
    };
  }, []);

  if (!selectedCertForPrint) return null;

  const cert = selectedCertForPrint;

  // Strict Resident Access Guard: Residents can only view/print their own certificates
  if (currentUser.role === 'Resident') {
    const userResidentId = currentUser.residentId;
    const userFullName = currentUser.name.trim().toLowerCase();
    const isOwner =
      (userResidentId && cert.residentId && cert.residentId === userResidentId) ||
      (cert.residentName && cert.residentName.trim().toLowerCase() === userFullName);

    if (!isOwner) {
      return null;
    }
  }

  const handlePrint = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}

    document.body.classList.add('is-printing-modal', 'modal-open-certificate');

    // Use isolated certificate printing first for clean 1-page output without background leakage
    const success = printCertificateElement('printable-certificate', `${cert.type} - ${cert.controlNumber}`);
    if (!success) {
      setTimeout(() => {
        window.print();
      }, 50);
    }
  };

  const { dayOrdinal, monthName, yearNumber, formattedDate } = parseSafeCertificateDate(cert.dateIssued);

  const creds = getAccurateCertificateCredentials(cert, residents, users, currentUser, settings.barangayName);
  const residentName = creds.name || cert.residentName;
  const residentAge = creds.age;
  const residentCivilStatus = (creds.civilStatus || cert.residentCivilStatus || 'Single').toLowerCase();
  const residentAddress = formatCleanCertificateAddress(
    creds.address || cert.residentAddress,
    creds.purok,
    settings.barangayName
  );
  const verificationUrl = getCertificateVerificationUrl(cert.controlNumber);

  // Determine official Secretary & Signatory names
  const secretaryName =
    officials?.find((o) => o.position.toLowerCase().includes('secretary'))?.name ||
    settings.barangaySecretary ||
    'Atty. Maria Elena V. Ramos';

  const isTreasurerSignatory = Boolean(
    cert.issuedBy &&
      (cert.issuedBy.toLowerCase().includes('bautista') ||
        cert.issuedBy.toLowerCase().includes('treasurer') ||
        areNamesMatching(cert.issuedBy, settings.barangayTreasurer))
  );

  const isInvalidOrPortalIssuer = Boolean(
    !cert.issuedBy ||
      cert.issuedBy.toLowerCase().includes('portal') ||
      cert.issuedBy.toLowerCase().includes('online') ||
      cert.issuedBy.toLowerCase().includes('residential') ||
      cert.issuedBy.toLowerCase().includes('system') ||
      areNamesMatching(cert.issuedBy, settings.punongBarangay) ||
      areNamesMatching(cert.issuedBy, cert.signatoryOfficial || '')
  );

  const recordedByName = isTreasurerSignatory
    ? settings.barangayTreasurer
    : isInvalidOrPortalIssuer
    ? secretaryName
    : cert.issuedBy || secretaryName;

  const recordedByRole = isTreasurerSignatory
    ? 'Barangay Treasurer / Collecting Officer'
    : 'Barangay Secretary / Records Officer';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 modal-backdrop">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Modal Top Control Bar */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{cert.type}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold">
                  {cert.controlNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Official document ready for printing on standard Letter/A4 stationery.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* QR Quick Actions */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs gap-1">
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy Direct QR Verification URL"
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedLink ? 'Link Copied' : 'Copy Verification URL'}</span>
                <span className="sm:hidden">URL</span>
              </button>

              <button
                type="button"
                onClick={() => setIsVerificationModalOpen(true)}
                title="Test Verification Portal"
                className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Verify QR</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={() => setSelectedCertForPrint(null)}
              className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Paper Canvas */}
        <div className="certificate-paper-canvas flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:overflow-visible flex justify-center">
          <div
            id="printable-certificate"
            className="printable-area bg-white text-slate-900 p-8 sm:p-12 print:p-8 max-w-[8.5in] w-full shadow-2xl rounded-sm border-8 border-double border-amber-800/40 print:border-6 print:border-amber-800/70 print:shadow-none print:max-w-none relative font-serif"
          >
            {/* Watermark Crest in Center Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
              <BarangaySangkolSeal size={420} />
            </div>

            {/* Official Header */}
            <div className="relative z-10 text-center border-b-2 border-amber-900/40 pb-4 mb-6 print:pb-2 print:mb-3">
              <div className="flex items-center justify-between px-2 sm:px-6">
                <RepublicSeal size={74} />
                <div className="flex-1 px-4">
                  <p className="text-[11px] font-semibold text-slate-700 tracking-wider uppercase">Republic of the Philippines</p>
                  <p className="text-[11px] font-semibold text-slate-700 uppercase">{settings.province}</p>
                  <p className="text-xs font-bold text-slate-800 uppercase">{settings.municipality}</p>
                  <h3 className="text-lg sm:text-xl font-extrabold text-emerald-900 tracking-wide mt-1 uppercase font-sans">
                    {settings.barangayName}
                  </h3>
                  <p className="text-[10px] text-amber-800 italic font-medium">OFFICE OF THE PUNONG BARANGAY</p>
                </div>
                <BarangaySangkolSeal size={74} />
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="relative z-10 text-center my-6 print:my-3">
              <span className="inline-block border-y-2 border-amber-800/60 py-1 px-8 text-xl sm:text-2xl font-black text-slate-900 tracking-widest uppercase font-sans">
                {cert.type}
              </span>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                Control No.: <strong className="text-slate-800">{cert.controlNumber}</strong>
              </div>
            </div>

            {/* Salutation */}
            <div className="relative z-10 my-4 print:my-2 text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
              TO WHOM IT MAY CONCERN:
            </div>

            {/* Certificate Body Paragraphs Based on Type */}
            <div className="relative z-10 space-y-4 print:space-y-2.5 text-xs sm:text-sm print:text-[11pt] leading-relaxed print:leading-normal text-justify text-slate-800">
              {cert.type === 'Barangay Clearance' && (
                <>
                  <p className="indent-8">
                    This is to certify that <strong className="text-slate-950 font-bold uppercase">{residentName}</strong>, 
                    {' '}{residentAge} years old, {residentCivilStatus}, Filipino citizen, is a bonafide resident 
                    of {residentAddress}.
                  </p>
                  <p className="indent-8">
                    Based on official records and blotter filings of this barangay, the above-named individual is known to be of 
                    <strong className="text-slate-950"> GOOD MORAL CHARACTER</strong>, a law-abiding citizen, and has <strong className="text-slate-950">NO DEROGATORY RECORD</strong> or pending criminal/civil complaint filed against him/her in this office as of this date.
                  </p>
                  <p className="indent-8">
                    This Clearance is being issued upon the request of the interested party for the purpose of: 
                    <span className="font-bold underline uppercase ml-1.5">{cert.purpose}</span>, and for whatever legal intent it may serve.
                  </p>
                </>
              )}

              {cert.type === 'Certificate of Residency' && (
                <>
                  <p className="indent-8">
                    This is to certify that <strong className="text-slate-950 font-bold uppercase">{residentName}</strong>, 
                    {' '}{residentAge} years of age, {residentCivilStatus}, is a permanent and registered resident of 
                    {' '}<strong className="text-slate-950">{residentAddress}</strong>.
                  </p>
                  <p className="indent-8">
                    Records show that the subject person has been peacefully residing in this barangay in good standing with neighbors and the community.
                  </p>
                  <p className="indent-8">
                    This Certification of Residency is issued upon his/her request for: 
                    <span className="font-bold underline uppercase ml-1.5">{cert.purpose}</span>.
                  </p>
                </>
              )}

              {cert.type === 'Certificate of Indigency' && (
                <>
                  <p className="indent-8">
                    This is to certify that <strong className="text-slate-950 font-bold uppercase">{residentName}</strong>, 
                    {' '}{residentAge} years old, residing at {residentAddress}, belongs to one of the 
                    <strong className="text-slate-950"> INDIGENT FAMILIES</strong> and low-income brackets of {settings.barangayName}.
                  </p>
                  <p className="indent-8">
                    This certification is being granted to enable the subject individual/family to avail of assistance regarding: 
                    <span className="font-bold underline uppercase ml-1.5">{cert.purpose}</span> from concerned government agencies or institutions (DSWD, PCSO, AICS, Public Hospitals, or Scholarship Grants).
                  </p>
                  <p className="indent-8 text-[11px] italic text-slate-600">
                    Note: Pursuant to barangay policy and social welfare guidelines, this certification is issued free of charge.
                  </p>
                </>
              )}

              {cert.type === 'Certificate of Good Moral Character' && (
                <>
                  <p className="indent-8">
                    This is to certify that <strong className="text-slate-950 font-bold uppercase">{residentName}</strong> is a bonafide resident 
                    of {residentAddress}, possessing reputable standing in the community.
                  </p>
                  <p className="indent-8">
                    The bearer is known to the undersigned and members of the Sangguniang Barangay to be an upright citizen with high moral standards, civic cooperation, and no derogatory incident reports recorded in the Barangay Blotter.
                  </p>
                  <p className="indent-8">
                    Issued for the purpose of: <span className="font-bold underline uppercase ml-1.5">{cert.purpose}</span>.
                  </p>
                </>
              )}

              {cert.type === 'Business Clearance' && (
                <>
                  <p className="indent-8">
                    Barangay Clearance is hereby granted to <strong className="text-slate-950 font-bold uppercase">{cert.businessName || residentName}</strong>, 
                    operated and managed by <strong className="text-slate-950 uppercase">{residentName}</strong>, located at 
                    {' '}<strong className="text-slate-950">{cert.businessAddress || residentAddress}</strong>.
                  </p>
                  <p className="indent-8">
                    Nature of Business: <span className="font-bold uppercase">{cert.businessNature || cert.purpose}</span>.
                  </p>
                  <p className="indent-8">
                    This clearance is issued after having complied with the basic requirements and verified to cause no disturbance to public safety, environmental laws, and barangay revenue ordinances.
                  </p>
                </>
              )}

              {cert.type === 'First Time Jobseeker (RA 11261)' && (
                <>
                  <p className="indent-8">
                    This is to certify that <strong className="text-slate-950 font-bold uppercase">{residentName}</strong>, 
                    {' '}{residentAge} years old, resident of {residentAddress}, is a qualified 
                    <strong className="text-slate-950"> FIRST TIME JOBSEEKER</strong> pursuant to 
                    <strong className="text-slate-950"> Republic Act No. 11261 (First Time Jobseekers Assistance Act)</strong>.
                  </p>
                  <p className="indent-8">
                    The bearer is actively seeking initial employment and has executed the required Oath of Undertaking before this office. 
                    All government agencies issuing pre-employment documents (NBI, Police, SSS, PhilHealth, BIR, Pag-IBIG) are requested to grant fee exemptions as mandated by law.
                  </p>
                </>
              )}

              {/* Catch-all */}
              {cert.type !== 'Barangay Clearance' && 
               cert.type !== 'Certificate of Residency' && 
               cert.type !== 'Certificate of Indigency' && 
               cert.type !== 'Certificate of Good Moral Character' && 
               cert.type !== 'Business Clearance' && 
               cert.type !== 'First Time Jobseeker (RA 11261)' && (
                <>
                  <p className="indent-8">
                    This is to certify that <strong className="text-slate-950 font-bold uppercase">{residentName}</strong>, 
                    residing at {residentAddress}, has satisfied all the requisite requirements for the issuance of this certification.
                  </p>
                  <p className="indent-8">
                    Purpose: <span className="font-bold underline uppercase ml-1.5">{cert.purpose}</span>.
                  </p>
                </>
              )}

              {/* Date of Issue text */}
              <p className="indent-8 pt-2">
                ISSUED this <strong className="text-slate-950">{dayOrdinal}</strong> day of <strong className="text-slate-950">{monthName}</strong>, <strong className="text-slate-950">{yearNumber}</strong>, at the Barangay Hall, {settings.barangayName}, {settings.municipality}, {settings.province}, Philippines.
              </p>
            </div>

            {/* Bottom Section: Signatories, Thumbmark & Dry Seal */}
            <div className="relative z-10 mt-12 print:mt-6 pt-6 print:pt-3 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-8 items-end">
                {/* Left Side: Applicant signature, Thumbmark, Dry Seal */}
                <div className="space-y-4 print:space-y-2">
                  <div>
                    <div className="w-48 border-b border-slate-900 pb-1 text-center">
                      <span className="text-[11px] uppercase font-bold text-slate-800">
                        {residentName}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 text-center w-48">Specimen Signature / Bearer</p>
                  </div>

                  <div className="pt-2 print:pt-1">
                    <div className="w-20 h-24 print:w-16 print:h-20 border border-dashed border-slate-400 flex flex-col items-center justify-center p-1 text-center bg-slate-50">
                      <span className="text-[8px] text-slate-400 font-sans uppercase">Right Thumbmark</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Punong Barangay & Secretary/Treasurer Signature */}
                <div className="text-right space-y-8 print:space-y-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-8 print:mb-2">Prepared & Recorded by:</p>
                    <p className="text-xs font-bold text-slate-900 uppercase underline">
                      {recordedByName}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {recordedByRole}
                    </p>
                  </div>

                  <div className="relative">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 print:mb-1">Approved and Issued by:</p>
                    {settings.captainSignatureUrl ? (
                      <div className="flex justify-end mb-1">
                        <img
                          src={settings.captainSignatureUrl}
                          alt="Official Signature"
                          className="h-14 print:h-12 max-w-[160px] object-contain -mb-3 relative z-10 pointer-events-none select-none drop-shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="h-8 print:h-4"></div>
                    )}
                    <p className="text-sm font-bold text-slate-950 uppercase font-sans tracking-wide">
                      {cert.signatoryOfficial || settings.punongBarangay}
                    </p>
                    <p className="text-xs font-semibold text-emerald-950 font-serif">
                      {cert.signatoryPosition || 'Punong Barangay'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
