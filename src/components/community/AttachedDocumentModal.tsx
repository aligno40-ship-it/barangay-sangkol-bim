import React from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  User,
  Phone,
  Briefcase,
  GraduationCap,
  Calendar,
  CheckCircle2,
  FileCheck,
  Building,
} from 'lucide-react';
import { BarangaySangkolSeal, RepublicSeal } from '../OfficialSeals';

export interface DocumentViewerData {
  documentType:
    | 'Resume / Bio-Data'
    | 'Application Letter'
    | 'Letter of Intent'
    | 'Business Proposal / Plan'
    | 'Barangay Endorsement Letter'
    | 'Assistance Requisition Slip';
  applicantName: string;
  contactNumber: string;
  purok?: string;
  targetTitle: string; // e.g. Job title or Workshop title or Grant program
  targetCategory: 'Job Application' | 'Livelihood Workshop' | 'Livelihood Micro-Grant / Assistance' | 'Community Service';
  employerOrAgency?: string;
  appliedDate: string;
  fileName?: string;
  fileData?: string; // base64 or data URL
  letterText?: string;
  educationalAttainment?: string;
  experienceOrBackground?: string;
  grantAmount?: number;
  budget?: number;
}

interface AttachedDocumentModalProps {
  data: DocumentViewerData | null;
  onClose: () => void;
}

export const AttachedDocumentModal: React.FC<AttachedDocumentModalProps> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  const handleDownloadFile = () => {
    if (data.fileData && data.fileName) {
      const a = document.createElement('a');
      a.href = data.fileData;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Generate text file
      const content = `BARANGAY SANGKOL PESO & LIVELIHOOD AUTHORITY
${data.documentType.toUpperCase()}

Applicant: ${data.applicantName}
Contact: ${data.contactNumber}
Purok: ${data.purok || 'Barangay Sangkol'}
Applied For: ${data.targetTitle} (${data.employerOrAgency || 'Barangay Livelihood Program'})
Date Submitted: ${data.appliedDate}
Education: ${data.educationalAttainment || 'N/A'}
Background / Experience: ${data.experienceOrBackground || 'N/A'}

--------------------------------------------------
DOCUMENT BODY:
${data.letterText || 'Attached physical/digital credentials on file.'}
--------------------------------------------------
`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.applicantName.replace(/\s+/g, '_')}_${data.documentType.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const isImageFile =
    data.fileData?.startsWith('data:image/') ||
    data.fileName?.match(/\.(jpg|jpeg|png|webp|gif)$/i);

  const isPdfFile =
    data.fileData?.startsWith('data:application/pdf') ||
    data.fileName?.match(/\.pdf$/i);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  {data.targetCategory}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Submitted: {data.appliedDate}
                </span>
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
                {data.documentType}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Applicant & Target Info Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                Applicant Resident
              </p>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm mt-0.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                {data.applicantName}
              </p>
              <p className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {data.contactNumber} {data.purok ? `• ${data.purok}` : ''}
              </p>
            </div>

            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                Applied Opportunity
              </p>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm mt-0.5">
                {data.targetCategory === 'Job Application' ? (
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                )}
                {data.targetTitle}
              </p>
              {data.employerOrAgency && (
                <p className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {data.employerOrAgency}
                </p>
              )}
            </div>
          </div>

          {(data.educationalAttainment || data.experienceOrBackground) && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {data.educationalAttainment && (
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Education:</span>{' '}
                  {data.educationalAttainment}
                </p>
              )}
              {data.experienceOrBackground && (
                <p className="text-slate-600 dark:text-slate-300 truncate">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Background:</span>{' '}
                  {data.experienceOrBackground}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Document Content / Preview Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* File Attachment Notification */}
          {data.fileName ? (
            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate">
                    {data.fileName}
                  </p>
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-400">
                    Uploaded document attachment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadFile}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shrink-0 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Digital Statement / Application credentials registered on BIMS portal.</span>
            </div>
          )}

          {/* If Image attached */}
          {isImageFile && data.fileData && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-center max-h-96">
              <img
                src={data.fileData}
                alt={data.fileName || 'Attached Document'}
                className="max-h-88 object-contain rounded-xl shadow-sm"
              />
            </div>
          )}

          {/* If PDF or other file */}
          {isPdfFile && data.fileData && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 p-4 text-center space-y-3">
              <FileText className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                PDF Document: {data.fileName}
              </p>
              <button
                type="button"
                onClick={handleDownloadFile}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" /> Open / Download PDF
              </button>
            </div>
          )}

          {/* Formatted Letter Text Body */}
          {data.letterText ? (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs space-y-4">
              <div className="text-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Official Statement of Application & Intent
                </p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Barangay Sangkol Public Employment & Livelihood Registry
                </p>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2 whitespace-pre-wrap leading-relaxed font-sans">
                {data.letterText}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Applicant Signature</p>
                  <p className="font-bold text-slate-800 dark:text-white mt-1 underline underline-offset-4">
                    {data.applicantName}
                  </p>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-mono">
                  Verified BIMS Electronic Submission
                </div>
              </div>
            </div>
          ) : (
            !isImageFile &&
            !isPdfFile && (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-center text-xs text-slate-500 space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {data.fileName || 'Applicant Credentials'}
                </p>
                <p>
                  Experience & background records: <br />
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    {data.experienceOrBackground || 'Resident qualified candidate on file'}
                  </span>
                </p>
              </div>
            )
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadFile}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" /> Download Copy
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
