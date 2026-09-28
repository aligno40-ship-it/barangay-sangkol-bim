import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  FileText,
  Cookie,
  Lock,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  Scale,
  Building2,
  Users,
  ExternalLink,
  ChevronRight,
  Server,
  Key,
} from 'lucide-react';
import { BarangaySangkolSeal, RepublicSeal } from './OfficialSeals';

export type LegalPolicyTab = 'privacy' | 'terms' | 'cookies';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalPolicyTab;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<LegalPolicyTab>(initialTab);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-policies-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-all">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="legal-policies-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Barangay Sangkol Governance & Legal Compliance
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  RA 10173 & RA 7160 Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Regulatory Disclosures, Citizen Privacy Rights, and Digital Terms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'privacy'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy (RA 10173)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'terms'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms and Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cookies')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'cookies'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>Cookie & Storage Policy</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed max-h-[calc(92vh-160px)]">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                    Barangay Sangkol Citizen Data Privacy Statement
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    Compliant with Republic Act No. 10173 (The Data Privacy Act of 2012 of the Republic of the Philippines) and National Privacy Commission (NPC) Circulars on Local Government Units.
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                    Last Revised: September 2026 • Official NPC LGU Compliance Documentation
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  1. Mandate & Controller Identity
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  The <strong>Barangay Government of Sangkol</strong>, Municipality of Dipolog, Province of Zamboanga del Norte, is a Personal Information Controller (PIC) pursuant to Section 3(h) of Republic Act No. 10173. The Barangay Information Management System (BIMS) is established under the statutory authority of Republic Act No. 7160 (The Local Government Code of 1991) to maintain civil census records, issue frontline certifications, process barangay dispute mediation, and deliver social relief services.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  2. Personal & Sensitive Personal Data Collected
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  We process only personal data that is necessary, legitimate, and proportionate to our statutory duties:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                  <li><strong>Civil Demographics:</strong> Full name, date of birth, age, sex, civil status, registered Purok address, household head status, and emergency contact numbers.</li>
                  <li><strong>Identification & KYC Verification:</strong> Government-issued ID details (PhilSys Card, Driver’s License, Senior Citizen ID, OSCA, PWD ID), and photo verification images presented during account approval.</li>
                  <li><strong>Frontline Service Data:</strong> Barangay Clearance records, Certificates of Indigency, First-Time Jobseeker affidavits under RA 11261, and official receipt transactions.</li>
                  <li><strong>Community Desk & Dispute Records:</strong> Blotter narratives and Katarungang Pambarangay mediation summonses under Book III, Title I, Chapter 7 of RA 7160.</li>
                  <li><strong>Vulnerable Sector Eligibility:</strong> Social pension status, solo parent accreditation, and livelihood micro-grant applications.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  3. Lawful Basis for Processing
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  Processing is justified under Section 12 and Section 13 of RA 10173:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                  <li><strong>Public Authority & Legal Mandate (Section 12e):</strong> To perform statutory frontline public governance mandated by Republic Act No. 7160.</li>
                  <li><strong>Direct Citizen Consent (Section 12a):</strong> When a resident registers an online account, submits a certificate application, or books community facilities.</li>
                  <li><strong>Protection of Vital Interests (Section 12d):</strong> During disaster response, public health emergencies, and relief distributions.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  4. Security Safeguards & Encryption
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  Barangay Sangkol enforces strict technical, organizational, and physical safeguards:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">TLS 1.3 Encryption</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">All data in transit is encrypted using modern cryptographic protocols.</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">Role-Based Access (RBAC)</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Barangay officials access only records relevant to their committee or designation.</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">Tamper-Proof Audit Trail</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Every view, edit, issuance, and login event is permanently logged with timestamp and actor ID.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  5. Rights of Registered Citizens (Data Subjects)
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  Under Section 16 of the Data Privacy Act, citizens of Barangay Sangkol retain the following actionable rights:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                  <li><strong>Right to be Informed:</strong> To understand how and why civil data is collected and processed.</li>
                  <li><strong>Right to Access:</strong> To view your electronically maintained demographic and certificate history at any time through the Resident Portal.</li>
                  <li><strong>Right to Rectification:</strong> To request corrections to inaccurate, out-of-date, or incomplete civil records via the in-portal Data Update workflow.</li>
                  <li><strong>Right to Erasure or Blocking:</strong> To request deactivation or suspension of an online user account upon lawful grounds. Note: Official permanent civil census ledgers mandated by RA 7160 are retained per National Archives of the Philippines guidelines.</li>
                  <li><strong>Right to File a Complaint:</strong> You have the right to lodge a formal grievance before the National Privacy Commission (NPC) if your privacy rights are violated.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  6. Data Protection Officer (DPO) Contact
                </h4>
                <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  <p><strong>Office:</strong> Data Protection Desk, Barangay Hall of Sangkol</p>
                  <p><strong>DPO Designation:</strong> Barangay Secretary & Compliance Officer</p>
                  <p><strong>Address:</strong> Purok Mangga, Barangay Sangkol, Dipolog City, Zamboanga del Norte</p>
                  <p><strong>Official Contact:</strong> dpo@barangaysangkol.gov.ph • (065) 212-SANGKOL</p>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: TERMS AND CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-blue-950 dark:text-blue-200 text-sm">
                    Barangay Sangkol Digital Portal Terms of Use
                  </h3>
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    Governed by the Laws of the Republic of the Philippines, including Republic Act 7160 (Local Government Code) and Republic Act 8792 (Electronic Commerce Act of 2000).
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 font-mono">
                    Effective Date: September 2026
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  1. Acceptance of Terms
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  By signing in, registering, or submitting applications on the Barangay Sangkol Information Management System (BIMS), you agree to be legally bound by these Terms and Conditions. If you do not agree to these terms, you may avail of frontline barangay services directly in-person at the Barangay Sangkol Hall.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  2. User Responsibilities & Truthfulness of Records
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  All residents and authorized users pledge under penalty of law:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                  <li>To provide true, current, and verifiable information regarding identity, residency, and sector eligibility.</li>
                  <li>Never to impersonate another resident, use false government credentials, or create duplicate accounts.</li>
                  <li><strong>Warning on Falsification:</strong> Falsification of public records, declarations of indigency, or incident blotters is punishable under <strong>Articles 171 and 172 of the Revised Penal Code of the Philippines</strong>, carrying penalties of imprisonment and fines.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  3. Validity of Digital Documents & QR Verification
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  Clearances, certifications, and permits generated through this system feature unique verification control numbers and cryptographic QR codes. Pursuant to Section 7 of <strong>Republic Act No. 8792 (The Electronic Commerce Act)</strong>, digital documents originating from this system bear legal effect, validity, and enforceability equal to manual paper documents.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  4. Standards for Public Officials & Staff
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  Barangay officials, lupon mediators, and administrative staff operate under the strict ethical mandates of <strong>Republic Act No. 6713</strong> (Code of Conduct and Ethical Standards for Public Officials and Employees) and <strong>Republic Act No. 11032</strong> (Ease of Doing Business and Efficient Government Service Delivery Act of 2018). Administrative users are strictly prohibited from utilizing access privileges for personal, political, or unauthorized purposes.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  5. Frontline Continuity Disclaimer
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  While the Barangay strives to maintain continuous 24/7 digital accessibility, unexpected network outages, scheduled server maintenance, or national power grid disruptions may occasionally limit portal access. Frontline walk-in desks at the Barangay Sangkol Hall remain the primary sovereign mechanism for public service delivery.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: COOKIE & STORAGE POLICY */}
          {activeTab === 'cookies' && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                <Cookie className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-amber-950 dark:text-amber-200 text-sm">
                    Cookie & Local Storage Transparency Policy
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Transparent disclosure of all state storage, cookies, and local telemetry mechanisms employed by the Barangay Sangkol portal.
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-mono">
                    Zero Third-Party Ad Trackers • No Cross-Site Commercial Profiling
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  1. What We Store & Why
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  Unlike commercial marketing websites, the Barangay Sangkol BIMS does not use third-party advertising cookies, data broker pixels, or cross-site tracking scripts. We utilize local web storage (localStorage and sessionStorage) strictly to maintain secure government session states, remember your visual preferences, and gather privacy-preserving, consent-gated operational metrics.
                </p>
              </section>

              <section className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  2. Detailed Storage Inventory
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5">Key / Item</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Purpose</th>
                        <th className="p-2.5">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                      <tr>
                        <td className="p-2.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">barangay_bims_token</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md font-bold text-[10px]">Essential</span></td>
                        <td className="p-2.5">Cryptographic session authentication state and active role verification.</td>
                        <td className="p-2.5">Session / 15-min timeout</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">barangay_cookie_consent</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md font-bold text-[10px]">Essential</span></td>
                        <td className="p-2.5">Records your explicit cookie consent and tracking preference choices.</td>
                        <td className="p-2.5">180 Days</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-[11px] text-blue-700 dark:text-blue-400">barangay_theme_mode</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-md font-bold text-[10px]">Functional</span></td>
                        <td className="p-2.5">Saves your high-contrast or dark mode visual display preference.</td>
                        <td className="p-2.5">180 Days</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-[11px] text-blue-700 dark:text-blue-400">barangay_bims_remembered_user</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-md font-bold text-[10px]">Functional</span></td>
                        <td className="p-2.5">Remembers your username if the "Remember Me" checkbox was selected during login.</td>
                        <td className="p-2.5">Until unchecked / cleared</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-[11px] text-purple-700 dark:text-purple-400">barangay_analytics_events</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-md font-bold text-[10px]">Analytics</span></td>
                        <td className="p-2.5">Anonymized client-side event counter (e.g. module visits, certificate requests) to optimize UI performance. Gated by explicit consent.</td>
                        <td className="p-2.5">Active Session Only</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  3. Managing Your Preferences
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  System administrators can review and configure system cookie preferences and privacy analytics under Administrator Controls. Disabling analytical storage will not impact access to any barangay e-services.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <BarangaySangkolSeal size={20} />
            <span>Republic of the Philippines • Barangay Sangkol, Dipolog City</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-colors cursor-pointer text-xs"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
