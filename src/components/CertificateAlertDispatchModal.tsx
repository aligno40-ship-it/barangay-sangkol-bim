import React, { useState, useEffect } from 'react';
import { CertificateRecord, Resident } from '../types';
import { useBarangay } from '../context/BarangayContext';
import {
  validateResidentEmail,
  formatCertificateReadySms,
  sendRealEmailNotification,
  openGmailWebCompose,
  sendRealGmail,
  buildOfficialBarangayHtmlEmail,
  getCachedGmailToken,
  getConnectedGmailEmail,
} from '../utils/realAlertDeliveryService';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Radio,
} from 'lucide-react';

interface CertificateAlertDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateRecord | null;
  onAlertSent?: (type: string, message: string) => void;
}

export const CertificateAlertDispatchModal: React.FC<CertificateAlertDispatchModalProps> = ({
  isOpen,
  onClose,
  certificate,
  onAlertSent,
}) => {
  const { residents, updateResident, settings, addAuditLog } = useBarangay();

  const [matchedResident, setMatchedResident] = useState<Resident | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedPhone, setEditedPhone] = useState('');
  const [editedEmail, setEditedEmail] = useState('');

  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);
  const [emailMsgId, setEmailMsgId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Sync resident details when certificate changes
  useEffect(() => {
    if (certificate) {
      const res = residents.find((r) => r.id === certificate.residentId) ||
        residents.find((r) => `${r.firstName} ${r.lastName}`.toLowerCase() === certificate.residentName.toLowerCase());

      setMatchedResident(res || null);
      const phone = res?.contactNumber || '0917-555-0101';
      const email = res?.email || 'citizen@barangaysangkol.gov.ph';
      setPhoneNumber(phone);
      setEmailAddress(email);
      setEditedPhone(phone);
      setEditedEmail(email);

      setEmailStatus('idle');
      setEmailFeedback(null);
      setEmailMsgId(null);
      setIsEditingContact(false);
    }
  }, [certificate, residents]);

  if (!isOpen || !certificate) return null;

  const emailValidation = validateResidentEmail(emailAddress);

  const officialEmailSubject = `Barangay Sangkol: Official Notice - ${certificate.type} is Approved & Ready (Ctrl #${certificate.controlNumber})`;

  const officialEmailBodyText = `Good day ${certificate.residentName}!

Your requested ${certificate.type} (Control Number: ${certificate.controlNumber}) has been officially verified, approved, and signed by the Office of the Punong Barangay.

Document Details:
• Resident Name: ${certificate.residentName}
• Document Type: ${certificate.type}
• Control Number: ${certificate.controlNumber}
• Fee: ${certificate.fee > 0 ? `₱${certificate.fee.toFixed(2)}` : 'FREE / WAIVED'}
• Official Receipt: ${certificate.orNumber || 'N/A'}
• Pickup Station: Barangay Hall Window 1 (Purok Mangga)
• Status: APPROVED & READY FOR PICKUP

Please bring 1 valid government ID upon claiming your document. You may also present this official digital email notice.`;

  const officialHtmlBody = buildOfficialBarangayHtmlEmail({
    title: `Official Document Ready Notice: ${certificate.type}`,
    category: 'Certificate Ready',
    recipientName: certificate.residentName,
    messageContent: `Good day ${certificate.residentName}!\n\nYour requested ${certificate.type} (Control Number: ${certificate.controlNumber}) has been officially verified, approved, and issued by the Office of the Punong Barangay.\n\nYou may present your Control Number at Barangay Hall Window 1 with 1 valid ID, or verify your document directly via the Citizen QR Portal.`,
    details: {
      'Resident Name': certificate.residentName,
      'Document Type': certificate.type,
      'Control Number': certificate.controlNumber,
      'Document Fee': certificate.fee > 0 ? `₱${certificate.fee.toFixed(2)}` : 'FREE / WAIVED',
      'Official Receipt': certificate.orNumber || 'N/A',
      'Issuing Authority': 'Office of the Punong Barangay - Barangay Sangkol',
      'Pickup Location': 'Barangay Hall Window 1 (Purok Mangga)',
      'Status': 'APPROVED & READY FOR PICKUP',
    },
    callToActionLabel: 'Verify Document Online',
    callToActionUrl: window.location.origin,
  });

  const handleSaveContactUpdates = () => {
    setPhoneNumber(editedPhone);
    setEmailAddress(editedEmail);
    setIsEditingContact(false);

    if (matchedResident) {
      updateResident(matchedResident.id, {
        contactNumber: editedPhone,
        email: editedEmail,
      });
      addAuditLog(
        'UPDATE',
        'Resident Registry',
        `Updated contact info for ${matchedResident.firstName} ${matchedResident.lastName}: Phone: ${editedPhone}, Email: ${editedEmail}.`
      );
    }
  };

  const handleSetUserEmail = (email: string) => {
    setEmailAddress(email);
    setEditedEmail(email);
  };

  const handleDispatchViaGmail = async () => {
    if (!emailValidation.isValid) {
      setEmailStatus('error');
      setEmailFeedback('Please enter a valid email address.');
      return;
    }

    setEmailStatus('sending');
    setEmailFeedback('Connecting to Google Workspace / Gmail...');

    try {
      const result = await sendRealGmail({
        to: emailAddress,
        subject: officialEmailSubject,
        htmlBody: officialHtmlBody,
        senderName: 'Barangay Sangkol BIMS Office',
      });

      if (result.success) {
        setEmailStatus('success');
        setEmailFeedback(`✓ Email delivered to ${emailAddress} via Gmail API`);
        setEmailMsgId(result.messageId || 'GMAIL_SENT');
        if (onAlertSent) {
          onAlertSent('email', `Email sent to ${emailAddress} via Gmail API`);
        }
      } else {
        // Fallback to direct Gmail Web Compose so the user can send immediately in 1 click
        openGmailWebCompose({
          to: emailAddress,
          subject: officialEmailSubject,
          body: officialEmailBodyText,
        });
        setEmailStatus('success');
        setEmailFeedback(`✓ Opened Gmail Web Compose with pre-filled document notice for ${emailAddress}`);
      }
    } catch (err: any) {
      openGmailWebCompose({
        to: emailAddress,
        subject: officialEmailSubject,
        body: officialEmailBodyText,
      });
      setEmailStatus('success');
      setEmailFeedback(`✓ Opened Gmail Web Compose for ${emailAddress}`);
    }
  };

  const handleDispatchRealEmail = async () => {
    if (!emailValidation.isValid) {
      setEmailStatus('error');
      setEmailFeedback(emailValidation.error || 'Please enter a valid email address.');
      return;
    }

    setEmailStatus('sending');
    setEmailFeedback(null);

    const res = await sendRealEmailNotification({
      email: emailAddress,
      residentId: certificate.residentId || matchedResident?.id,
      residentName: certificate.residentName,
      certificateId: certificate.id,
      controlNumber: certificate.controlNumber,
      certificateType: certificate.type,
      status: certificate.status || 'Approved & Ready',
      subject: officialEmailSubject,
      htmlBody: officialHtmlBody,
      plainText: officialEmailBodyText,
      sentBy: 'Barangay Staff Officer',
    });

    if (res.success) {
      setEmailStatus('success');
      const isSim = (res.provider || '').includes('Simulated');
      setEmailFeedback(
        isSim
          ? `✓ Logged to Server Mail Queue. Use 'Send with Gmail' to deliver straight to inbox.`
          : `✓ Dispatched via ${res.provider || 'Email Gateway'}`
      );
      setEmailMsgId(res.providerMessageId || null);
      if (onAlertSent) {
        onAlertSent('email', `Email dispatched to ${emailAddress}`);
      }
    } else {
      setEmailStatus('error');
      setEmailFeedback(res.error || res.message || 'Email dispatch failed');
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(officialEmailBodyText);
    setCopiedText('email');
    setTimeout(() => setCopiedText(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Dispatch Citizen Gmail Alert</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                  GMAIL / GOOGLE WORKSPACE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Notify <strong>{certificate.residentName}</strong> that document is ready
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Certificate Snapshot Card */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300">{certificate.type}</span>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                {certificate.controlNumber}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Resident Name</p>
                <p className="font-semibold text-slate-200">{certificate.residentName}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Document Fee</p>
                <p className="font-bold text-emerald-400">
                  {certificate.fee > 0 ? `₱${certificate.fee.toFixed(2)}` : 'FREE / WAIVED'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Details & Inline Editor */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recipient Email / Gmail Address
              </span>
              <button
                type="button"
                onClick={() => setIsEditingContact(!isEditingContact)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingContact ? 'Cancel Edit' : 'Edit Email Address'}</span>
              </button>
            </div>

            {isEditingContact ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Resident Gmail / Email Address
                  </label>
                  <input
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    placeholder="resident@gmail.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditedEmail('aligno40@gmail.com')}
                    className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg border border-slate-600 font-mono cursor-pointer"
                  >
                    Use aligno40@gmail.com
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveContactUpdates}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ml-auto"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Mail className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-mono text-slate-100">{emailAddress || 'No email on file'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSetUserEmail('aligno40@gmail.com')}
                    className="text-[10px] px-2 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded border border-rose-700/70 font-mono font-bold cursor-pointer transition-colors shrink-0"
                    title="Set recipient to aligno40@gmail.com"
                  >
                    Use aligno40@gmail.com
                  </button>
                </div>
                <div>
                  {emailValidation.isValid ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Valid Gmail / Email Address
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      <AlertTriangle className="w-3 h-3" /> Invalid Email Format
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Official Gmail Notice Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-rose-400" />
                <span>Official Gmail Notification Preview</span>
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedText === 'email' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="pb-2 border-b border-slate-800/80 text-[11px] space-y-0.5 font-mono text-slate-400">
                <p><span className="text-slate-500">Subject:</span> <strong className="text-slate-200">{officialEmailSubject}</strong></p>
                <p><span className="text-slate-500">To:</span> <strong className="text-rose-300">{emailAddress}</strong></p>
              </div>
              <div className="font-sans text-xs leading-relaxed whitespace-pre-line text-slate-300">
                {officialEmailBodyText}
              </div>
            </div>
          </div>

          {/* Live Dispatch Feedback Badges */}
          {emailStatus !== 'idle' && (
            <div className="space-y-2 pt-1">
              {emailFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    emailStatus === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : emailStatus === 'error'
                      ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                      : 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {emailStatus === 'sending' && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {emailStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {emailStatus === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    <span>Gmail Notice: {emailFeedback}</span>
                  </div>
                  {emailMsgId && <span className="font-mono text-[10px] opacity-75">{emailMsgId}</span>}
                </div>
              )}
            </div>
          )}

          {/* Client Fallback: Open in Gmail Web */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Direct Web Client:</span>
            <button
              type="button"
              onClick={() =>
                openGmailWebCompose({
                  to: emailAddress,
                  subject: officialEmailSubject,
                  body: officialEmailBodyText,
                })
              }
              className="hover:text-rose-300 underline flex items-center gap-1 cursor-pointer font-medium"
              title="Open pre-filled in Gmail Web composer"
            >
              <span>Launch Gmail Web Composer</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              disabled={emailStatus === 'sending'}
              onClick={handleDispatchRealEmail}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
              title="Deliver through backend mail server queue"
            >
              {emailStatus === 'sending' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
              ) : (
                <Radio className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Server Mail</span>
            </button>

            <button
              type="button"
              disabled={emailStatus === 'sending'}
              onClick={() =>
                openGmailWebCompose({
                  to: emailAddress,
                  subject: officialEmailSubject,
                  body: officialEmailBodyText,
                })
              }
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
              title="Compose directly in Gmail Web"
            >
              <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
              <span>Gmail Web</span>
            </button>

            <button
              type="button"
              disabled={emailStatus === 'sending'}
              onClick={handleDispatchViaGmail}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-rose-900/30 disabled:opacity-50"
              title="Deliver email directly via Google Workspace Gmail API"
            >
              {emailStatus === 'sending' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Mail className="w-3.5 h-3.5 text-white" />
              )}
              <span>Send with Gmail</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
