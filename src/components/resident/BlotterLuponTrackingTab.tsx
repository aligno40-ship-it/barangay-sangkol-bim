import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Scale,
  Calendar,
  Clock,
  AlertTriangle,
  Lock,
  Plus,
  CheckCircle2,
  X,
  MapPin,
  Phone,
  FileText,
  UserCheck,
  Building2,
  ChevronRight,
  Info,
  BadgeAlert,
  HelpCircle,
  Eye,
  ShieldCheck,
  Printer,
  MessageSquare,
  Send,
  History,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { ResidentIncidentReport, LuponMediationSchedule } from '../../types/residentServices';
import { initialIncidentReports, initialLuponSchedules } from '../../data/residentServicesData';
import { isResidentRecordOwner } from '../../utils/residentAccountFilter';
import { useBarangay } from '../../context/BarangayContext';

interface BlotterLuponTrackingTabProps {
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
}

export const BlotterLuponTrackingTab: React.FC<BlotterLuponTrackingTabProps> = ({
  residentId,
  residentName,
  contactNumber,
  purok,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'blotter_reports' | 'lupon_hearings'>('blotter_reports');
  const [incidentReports, setIncidentReports] = useState<ResidentIncidentReport[]>([]);
  const [luponSchedules] = useState<LuponMediationSchedule[]>([]);

  const {
    blotters,
    addBlotter,
    complaints,
    requestBlotterExtract,
    addBlotterResidentFollowUp,
    requestLuponMediation,
    settings,
  } = useBarangay();

  const residentIdentity = useMemo(
    () => ({ residentId, name: residentName, contactNumber }),
    [residentId, residentName, contactNumber]
  );

  // STRICT RESIDENT FILTERING & BIDIRECTIONAL SYNC WITH ADMIN BLOTTERS
  const myIncidentReports = useMemo(() => {
    // 1. Get resident's local reports
    const localMatches = incidentReports.filter((r) =>
      isResidentRecordOwner(
        {
          residentId: r.residentId,
          residentName: r.residentName,
          contactNumber: r.contactNumber,
        },
        residentIdentity
      )
    ).map((loc) => {
      const match = blotters.find((b) => b.blotterNo === loc.id || b.id === loc.id);
      return {
        ...loc,
        rawBlotter: match || loc.rawBlotter,
        extractRequested: match?.extractRequested || loc.extractRequested,
        extractStatus: match?.extractStatus || loc.extractStatus,
      };
    });

    // 2. Convert admin blotters where this resident is complainant or respondent
    const adminMatches: ResidentIncidentReport[] = blotters
      .filter(
        (b) =>
          isResidentRecordOwner(
            {
              residentId: b.complainantResidentId,
              residentName: b.complainantName,
              contactNumber: b.complainantContact,
            },
            residentIdentity
          ) ||
          isResidentRecordOwner(
            {
              respondentName: b.respondentName,
            },
            residentIdentity
          )
      )
      .map((b) => {
        let mappedStatus: ResidentIncidentReport['status'] = 'Filed / Under Review';
        if (b.status === 'Under Investigation' || b.status === 'Summon Issued') {
          mappedStatus = 'Assigned to Tanod Duty';
        } else if (b.status === 'Referred to Lupon' || b.status === 'Mediation in Progress') {
          mappedStatus = 'Elevated to Lupon Tagapamayapa';
        } else if (
          b.status === 'Settled' ||
          b.status === 'Settled / Amicably Resolved' ||
          b.status === 'Resolved'
        ) {
          mappedStatus = 'Resolved / Amicably Settled';
        } else if (b.status === 'Dismissed' || b.status === 'Closed') {
          mappedStatus = 'Dismissed';
        }

        const notes = [
          b.actionTaken || '',
          b.assignedOfficer ? `Assigned Officer: ${b.assignedOfficer}` : '',
          b.hearingStage ? `Hearing Stage: ${b.hearingStage}` : '',
          b.hearingDate ? `Scheduled Hearing: ${b.hearingDate} ${b.hearingTime || ''}` : '',
          b.resolutionNotes ? `Resolution: ${b.resolutionNotes}` : '',
        ]
          .filter(Boolean)
          .join(' • ');

        return {
          id: b.blotterNo || b.id,
          incidentType: (b.incidentType || 'Other Civil Incident') as ResidentIncidentReport['incidentType'],
          residentId: b.complainantResidentId || residentId,
          residentName: b.complainantName,
          contactNumber: b.complainantContact || contactNumber,
          purok: b.purok || purok,
          locationDetails: b.incidentLocation || b.purok || 'Barangay San Antonio',
          incidentDateTime: `${b.incidentDate} ${b.incidentTime || '08:00'}`,
          involvedPersons: b.respondentName,
          narrative: b.narrative,
          urgency: 'Normal',
          isConfidential: true,
          status: mappedStatus,
          actionTakenNotes: notes || 'Under review by Barangay Peace & Order Committee and Tanod Desk.',
          assignedOfficer: b.assignedOfficer || b.recordedBy || 'Barangay Tanod Desk',
          createdAt: b.dateReported,
          rawBlotter: b,
          extractRequested: b.extractRequested,
          extractStatus: b.extractStatus,
        };
      });

    // Merge and deduplicate by id
    const combined = [...adminMatches];
    localMatches.forEach((loc) => {
      const exists = combined.some((c) => c.id === loc.id || (loc.narrative && c.narrative === loc.narrative));
      if (!exists) {
        combined.push(loc);
      }
    });

    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [blotters, incidentReports, residentIdentity, residentId, contactNumber, purok]);

  // LIVE BIDIRECTIONAL SYNC WITH LUPON COMPLAINTS & HEARINGS
  const myLuponSchedules = useMemo(() => {
    const localMatches = luponSchedules.filter((caseItem) =>
      isResidentRecordOwner(
        {
          complainantName: caseItem.complainantName,
          respondentName: caseItem.respondentName,
        },
        residentIdentity
      )
    );

    const adminMatches: LuponMediationSchedule[] = complaints
      .filter((c) =>
        isResidentRecordOwner(
          {
            complainantName: c.complainant,
            respondentName: c.respondent,
          },
          residentIdentity
        )
      )
      .map((c) => {
        let mappedStatus: LuponMediationSchedule['status'] = 'Scheduled';
        if (c.status === 'Resolved' || c.status === 'Settled') {
          mappedStatus = 'Settled';
        } else if (c.status === 'In Progress' || c.status === 'Mediation') {
          mappedStatus = 'In Progress';
        } else if (c.status === 'Certified to Court' || c.status === 'Endorsed to PNP') {
          mappedStatus = 'Certified to Court';
        }

        return {
          id: c.caseNumber || c.id,
          caseNumber: c.caseNumber,
          complainantName: c.complainant,
          respondentName: c.respondent,
          disputeSubject: c.caseTitle,
          stage: (c.stage || '1st Conciliation (Punong Barangay)') as any,
          hearingDate: c.hearingDate || 'To be scheduled',
          hearingTime: c.hearingTime || '09:00 AM',
          venue: 'Barangay Peace & Order Lupon Conference Room',
          mediatorName: c.mediator || 'Punong Barangay & Lupon Tagapamayapa',
          status: mappedStatus,
          notes: `Filed: ${c.dateFiled}. Case: ${c.caseTitle}. Nature: ${c.caseType || 'Dispute'}. Status: ${c.status}.`,
        };
      });

    const combined = [...adminMatches];
    localMatches.forEach((loc) => {
      const exists = combined.some((c) => c.caseNumber === loc.caseNumber || c.id === loc.id);
      if (!exists) combined.push(loc);
    });

    return combined;
  }, [complaints, luponSchedules, residentIdentity]);

  const [isFileReportModalOpen, setIsFileReportModalOpen] = useState(false);
  const [selectedReportView, setSelectedReportView] = useState<ResidentIncidentReport | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Extract Request State
  const [requestExtractTarget, setRequestExtractTarget] = useState<ResidentIncidentReport | null>(null);
  const [extractPurpose, setExtractPurpose] = useState('Police Blotter Endorsement / PNP Action');
  const [extractNotes, setExtractNotes] = useState('');

  // View / Print Extract State
  const [viewExtractTarget, setViewExtractTarget] = useState<ResidentIncidentReport | null>(null);

  // Follow-up Note State
  const [followUpTarget, setFollowUpTarget] = useState<ResidentIncidentReport | null>(null);
  const [followUpNote, setFollowUpNote] = useState('');

  // Lupon Mediation Escalation State
  const [luponMediationTarget, setLuponMediationTarget] = useState<ResidentIncidentReport | null>(null);
  const [mediationCaseTitle, setMediationCaseTitle] = useState('');
  const [mediationReliefSought, setMediationReliefSought] = useState('');

  // Log Accordion State
  const [expandedLogReportId, setExpandedLogReportId] = useState<string | null>(null);

  // Form State for filing an incident report
  const [incidentType, setIncidentType] = useState<ResidentIncidentReport['incidentType']>('Noise & Late Night Karaoke Disturbance');
  const [locationDetails, setLocationDetails] = useState('');
  const [incidentDateTime, setIncidentDateTime] = useState('');
  const [involvedPersons, setInvolvedPersons] = useState('');
  const [narrative, setNarrative] = useState('');
  const [urgency, setUrgency] = useState<ResidentIncidentReport['urgency']>('Normal');
  const [isConfidential, setIsConfidential] = useState(true);

  const handleRequestExtractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestExtractTarget) return;
    requestBlotterExtract(requestExtractTarget.id, extractPurpose, extractNotes);
    setSuccessMessage(`✓ Certified True Blotter Extract requested for ${requestExtractTarget.id}. Notification sent to Barangay Secretary.`);
    setRequestExtractTarget(null);
    setExtractNotes('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpTarget || !followUpNote.trim()) return;
    addBlotterResidentFollowUp(followUpTarget.id, followUpNote.trim());
    setSuccessMessage(`✓ Follow-up note recorded for ${followUpTarget.id} and dispatched to Barangay Tanod Desk.`);
    setFollowUpTarget(null);
    setFollowUpNote('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  const handleLuponMediationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!luponMediationTarget) return;
    requestLuponMediation({
      caseTitle: mediationCaseTitle || `Conciliation: ${luponMediationTarget.incidentType}`,
      caseType: luponMediationTarget.incidentType.includes('Dispute') ? 'Civil / Property' : 'Neighborhood Dispute',
      complainantName: residentName,
      complainantAddress: `${purok}, Barangay San Antonio`,
      respondentName: luponMediationTarget.involvedPersons || 'Respondent',
      respondentAddress: `${purok}, Barangay San Antonio`,
      natureOfComplaint: luponMediationTarget.narrative,
      reliefSought: mediationReliefSought || 'Amicable settlement, peaceful neighborhood co-existence, and compliance with barangay ordinances.',
      blotterNo: luponMediationTarget.id,
      purok,
    });
    setSuccessMessage(`✓ Elevated ${luponMediationTarget.id} to Katarungang Pambarangay! Hearing docket initiated.`);
    setLuponMediationTarget(null);
    setMediationCaseTitle('');
    setMediationReliefSought('');
    setActiveSubTab('lupon_hearings');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  const handleFileReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative || !locationDetails) return;

    const newBlotterNo = `BLT-2026-${String(blotters.length + 1).padStart(4, '0')}`;
    const dateStr = incidentDateTime ? incidentDateTime.split('T')[0].split(' ')[0] : new Date().toISOString().split('T')[0];
    const timeStr = incidentDateTime && incidentDateTime.includes('T') ? incidentDateTime.split('T')[1].slice(0, 5) : (incidentDateTime && incidentDateTime.includes(' ') ? incidentDateTime.split(' ')[1].slice(0, 5) : '12:00');

    // 1. Submit directly to central BarangayContext blotters (triggers Admin notification bell & updates Blotters view)
    addBlotter({
      blotterNo: newBlotterNo,
      incidentType: incidentType as any,
      dateReported: new Date().toISOString().split('T')[0],
      timeReported: new Date().toTimeString().split(' ')[0].slice(0, 5),
      incidentDate: dateStr,
      incidentTime: timeStr,
      incidentLocation: locationDetails,
      purok,
      incidentPurok: purok,
      complainantName: residentName,
      complainantAddress: `${purok}, Barangay San Antonio`,
      complainantContact: contactNumber,
      complainantResidentId: residentId,
      respondentName: involvedPersons || 'Unidentified / Under Investigation',
      respondentAddress: `${purok}, Barangay San Antonio`,
      witnesses: '',
      narrative,
      actionTaken: 'Incident report submitted via Resident Portal. Transmitted to Barangay Tanod & Desk Officer on duty.',
      assignedOfficer: 'Barangay Tanod Duty Officer',
      status: 'Pending',
      recordedBy: `Resident Portal (${residentName})`,
      isResidentReport: true,
      urgency,
      isConfidential,
      reporterUserId: residentId,
    });

    // 2. Persist locally in resident's offline log
    const newReport: ResidentIncidentReport = {
      id: newBlotterNo,
      incidentType,
      residentId,
      residentName,
      contactNumber,
      purok,
      locationDetails,
      incidentDateTime: incidentDateTime || new Date().toISOString().replace('T', ' ').slice(0, 16),
      involvedPersons,
      narrative,
      urgency,
      isConfidential,
      status: 'Filed / Under Review',
      actionTakenNotes: 'Transmitted securely to Barangay Peace & Order Committee and Tanod Duty Officer.',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newReport, ...incidentReports];
    setIncidentReports(updated);

    setSuccessMessage(`✓ Incident report (${newReport.id}) securely logged and transmitted to Admin! Barangay Tanod Desk will review your report.`);
    setIsFileReportModalOpen(false);
    setLocationDetails('');
    setInvolvedPersons('');
    setNarrative('');
    setIncidentDateTime('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Peace & Order • Barangay Justice
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-slate-200">
              Katarungang Pambarangay
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Community Watch, Blotter & Lupon Tracking
          </h2>
          <p className="text-xs sm:text-sm text-rose-200/90 mt-1 max-w-2xl">
            File confidential neighborhood incident reports, track Tanod action responses, and monitor Katarungang Pambarangay mediation hearings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFileReportModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>File Incident Blotter</span>
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

      {/* Sub Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('blotter_reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'blotter_reports'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Your Filed Reports</span>
            {myIncidentReports.length > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
                {myIncidentReports.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('lupon_hearings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'lupon_hearings'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Lupon Mediation Cases</span>
            {myLuponSchedules.length > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
                {myLuponSchedules.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Strict Resident Account Privacy</span>
        </div>
      </div>

      {activeSubTab === 'blotter_reports' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Confidential Incident Log & Tanod Action History</span>
              </h3>
              <span className="text-xs text-slate-500">{myIncidentReports.length} report(s) filed</span>
            </div>

            {myIncidentReports.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold">No incident reports filed under your account</p>
                <p className="text-xs">Your peaceful community standing is clear.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myIncidentReports.map((r) => (
                  <div key={r.id} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 max-w-3xl flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-rose-900 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            {r.id}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{r.incidentType}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'Assigned to Tanod Duty'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : r.status === 'Resolved / Amicably Settled'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {r.status}
                          </span>
                          {r.extractRequested && (
                            r.extractStatus === 'Approved' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Extract Approved
                              </span>
                            ) : r.extractStatus === 'Rejected' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                                <X className="w-3 h-3 text-rose-600" />
                                Extract Declined
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                                Extract Request Pending
                              </span>
                            )
                          )}
                          {r.isConfidential && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-white flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Confidential
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                          "{r.narrative}"
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>{r.locationDetails}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Incident Time: {r.incidentDateTime}</span>
                          </span>
                          {r.involvedPersons && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <span className="font-semibold">Against:</span> {r.involvedPersons}
                            </span>
                          )}
                        </div>

                        {r.actionTakenNotes && (
                          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs space-y-1">
                            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Action Taken by Barangay Desk:</span>
                            </span>
                            <p className="text-emerald-800 text-[11px] leading-relaxed">{r.actionTakenNotes}</p>
                            {r.assignedOfficer && (
                              <p className="text-[10px] text-emerald-700 font-medium">Assigned: {r.assignedOfficer}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right text-[11px] text-slate-400 shrink-0 font-mono">
                        Filed: {r.createdAt}
                      </div>
                    </div>

                    {/* Resident Quick Action Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      {r.extractStatus === 'Approved' ? (
                        <button
                          type="button"
                          onClick={() => setViewExtractTarget(r)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View & Print Certified Extract</span>
                        </button>
                      ) : r.extractStatus === 'Pending' ? (
                        <div className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Extract Request In Review</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setRequestExtractTarget(r);
                            setExtractPurpose('Police Blotter Endorsement / PNP Action');
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Request Certified Extract</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setFollowUpTarget(r);
                          setFollowUpNote('');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>Send Follow-Up Note</span>
                      </button>

                      {r.status !== 'Resolved / Amicably Settled' && r.status !== 'Elevated to Lupon Tagapamayapa' && (
                        <button
                          type="button"
                          onClick={() => {
                            setLuponMediationTarget(r);
                            setMediationCaseTitle(`Conciliation: ${r.incidentType}`);
                            setMediationReliefSought('');
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Scale className="w-3.5 h-3.5 text-rose-600" />
                          <span>Request Lupon Hearing</span>
                        </button>
                      )}

                      {Boolean(r.rawBlotter?.activityLogs?.length) && (
                        <button
                          type="button"
                          onClick={() => setExpandedLogReportId(expandedLogReportId === r.id ? null : r.id)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
                        >
                          <History className="w-3.5 h-3.5 text-slate-400" />
                          <span>Activity Trail ({r.rawBlotter.activityLogs.length})</span>
                          {expandedLogReportId === r.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {/* Chronological Activity Trail Dropdown */}
                    {expandedLogReportId === r.id && r.rawBlotter?.activityLogs && (
                      <div className="mt-2 p-3.5 bg-slate-900 text-slate-100 rounded-xl space-y-2.5 border border-slate-800">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1.5">
                          <span className="flex items-center gap-1 text-indigo-300">
                            <History className="w-3.5 h-3.5 text-indigo-400" />
                            Official Timestamped Desk Logbook
                          </span>
                          <span>{r.rawBlotter.activityLogs.length} updates</span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {r.rawBlotter.activityLogs.map((log: any, idx: number) => (
                            <div key={log.id || idx} className="text-xs bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span className="font-bold text-emerald-400">{log.action}</span>
                                <span className="font-mono">{log.timestamp}</span>
                              </div>
                              <p className="text-slate-200 mt-1 text-[11px] leading-relaxed">{log.notes}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">Recorded By: {log.performedBy}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>Katarungang Pambarangay Mediation Docket & Hearing Notices</span>
              </h3>
              <span className="text-xs text-slate-500">{myLuponSchedules.length} case(s) involved</span>
            </div>

            {myLuponSchedules.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Scale className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold">No active Lupon mediation hearings</p>
                <p className="text-xs">You have no pending summons or hearings scheduled before the Lupon Tagapamayapa.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myLuponSchedules.map((caseItem) => (
                  <div key={caseItem.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-black bg-indigo-50 text-indigo-900 border border-indigo-200">
                          {caseItem.caseNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{caseItem.disputeSubject}</h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 self-start sm:self-auto">
                        {caseItem.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Complainant</span>
                        <p className="font-bold text-slate-800 mt-0.5">{caseItem.complainantName}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Respondent / Counterpart</span>
                        <p className="font-bold text-slate-800 mt-0.5">{caseItem.respondentName}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-900 font-bold border border-indigo-100">
                          Stage: {caseItem.stage}
                        </span>
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{caseItem.hearingDate}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{caseItem.hearingTime}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{caseItem.venue}</span>
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 italic">
                        Mediator: {caseItem.mediatorName}
                      </span>
                    </div>

                    {caseItem.notes && (
                      <p className="text-[11px] text-slate-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                        <span className="font-bold text-amber-900">Lupon Summons Note: </span>
                        {caseItem.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Blotter Report Modal */}
      {isFileReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">File Confidential Incident Blotter</h3>
                  <p className="text-xs text-slate-500">Barangay Sangkol Peace & Order Desk</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFileReportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFileReport} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Incident Category</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  <option value="Noise & Late Night Karaoke Disturbance">Noise & Late Night Karaoke Disturbance</option>
                  <option value="Property & Boundary Dispute">Property & Boundary Dispute</option>
                  <option value="Stray Animal & Pet Nuisance">Stray Animal & Pet Nuisance</option>
                  <option value="Neighborhood Quarrel / Altercation">Neighborhood Quarrel / Altercation</option>
                  <option value="Public Drinking & Curfew Violation">Public Drinking & Curfew Violation</option>
                  <option value="Uncollected Garbage / Illegal Dumping">Uncollected Garbage / Illegal Dumping</option>
                  <option value="Other Civil Incident">Other Civil Incident</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Incident Location & Landmark</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Near Purok Mangga Basketball Corner"
                    value={locationDetails}
                    onChange={(e) => setLocationDetails(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date & Time of Incident</label>
                  <input
                    type="datetime-local"
                    value={incidentDateTime}
                    onChange={(e) => setIncidentDateTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Persons Involved / Counterpart (If known)</label>
                <input
                  type="text"
                  placeholder="Names, aliases, or street addresses of involved parties"
                  value={involvedPersons}
                  onChange={(e) => setInvolvedPersons(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Narrative Statement & Facts</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe clearly what happened in chronological order..."
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="confidentialCheck"
                    checked={isConfidential}
                    onChange={(e) => setIsConfidential(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded-md focus:ring-rose-500"
                  />
                  <label htmlFor="confidentialCheck" className="font-bold text-slate-800 cursor-pointer">
                    Keep Reporter Identity Strictly Confidential
                  </label>
                </div>
                <Lock className="w-4 h-4 text-slate-400" />
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                  <span>24/7 Barangay Emergency Note</span>
                </p>
                <p>For immediate violent crime or life-threatening emergencies, call the 24/7 Tanod Hotline directly: <strong>0917-888-SANGKOL</strong>.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFileReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer shadow-md"
                >
                  Submit Incident Blotter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- REQUEST CERTIFIED EXTRACT MODAL -------------------- */}
      {requestExtractTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Request Certified Blotter Extract</h3>
                  <p className="text-xs text-slate-500">Official True Copy from Barangay Desk Records</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequestExtractTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestExtractSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Blotter Reference:</span>
                  <span className="font-mono font-bold text-indigo-700">{requestExtractTarget.id}</span>
                </div>
                <p className="text-slate-800 font-semibold">{requestExtractTarget.incidentType}</p>
                <p className="text-[11px] text-slate-500">Filed on {requestExtractTarget.createdAt} • {requestExtractTarget.locationDetails}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Purpose of Certified Extract *</label>
                <select
                  value={extractPurpose}
                  onChange={(e) => setExtractPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Police Blotter Endorsement / PNP Action">Police Blotter Endorsement / PNP Investigation</option>
                  <option value="Court / Legal Subpoena Requirement">Court / Legal Subpoena Requirement</option>
                  <option value="Insurance Claim Assessment">Insurance Claim Assessment</option>
                  <option value="Bank / Financial Institution Verification">Bank / Financial Institution Verification</option>
                  <option value="Workplace / School Clearance Requirement">Workplace / School Clearance Requirement</option>
                  <option value="Personal Record / Legal Protection">Personal Record / Official Legal Copy</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Notes / Endorsement Request</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Required by PNP Station 4 for filing complaint, or insurance adjuster contact details..."
                  value={extractNotes}
                  onChange={(e) => setExtractNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200/80 text-[11px] text-indigo-950 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Administrative Processing Note</span>
                </p>
                <p>The Barangay Secretary will review and authenticate your extract against the official physical blotter logbook. Once approved, the certified extract will be available to print directly from your portal.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRequestExtractTarget(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Extract Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- VIEW & PRINT CERTIFIED EXTRACT MODAL -------------------- */}
      {viewExtractTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-300 max-h-[95vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Official Certified Blotter Extract</h3>
                  <p className="text-xs text-slate-500">Barangay Sangkol Peace & Order Records Section</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Extract</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewExtractTarget(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="bg-white p-6 rounded-xl border border-slate-300 font-serif text-slate-900 space-y-5 shadow-inner print:border-0 print:p-0">
              {/* Header */}
              <div className="text-center space-y-0.5 border-b-2 border-slate-800 pb-4">
                <p className="text-[11px] uppercase tracking-widest text-slate-600 font-sans">Republic of the Philippines</p>
                <p className="text-[11px] uppercase tracking-widest text-slate-600 font-sans">Province of South Cotabato • Municipality of Polomolok</p>
                <h2 className="text-base font-black text-slate-900 tracking-wide font-sans">BARANGAY SANGKOL</h2>
                <p className="text-xs font-bold text-slate-700 font-sans">OFFICE OF THE PUNONG BARANGAY & PEACE AND ORDER COMMITTEE</p>
                <p className="text-[10px] text-slate-500 italic">Official Hotline: 0917-888-SANGKOL • Email: peace.order@sangkol.gov.ph</p>
              </div>

              {/* Title & Dry Seal */}
              <div className="text-center relative py-2">
                <h3 className="text-sm font-black uppercase tracking-wider font-sans text-slate-900 underline decoration-slate-400 underline-offset-4">
                  CERTIFIED TRUE EXTRACT FROM BARANGAY INCIDENT BLOTTER
                </h3>
                <p className="text-[11px] text-slate-600 font-sans mt-1">
                  Blotter Entry No: <strong className="font-mono text-slate-900">{viewExtractTarget.id}</strong>
                </p>
              </div>

              <div className="text-xs leading-relaxed space-y-3 font-sans">
                <p>
                  <strong>TO WHOM IT MAY CONCERN:</strong>
                </p>
                <p className="indent-6 leading-relaxed">
                  THIS IS TO CERTIFY that according to the official records preserved in the Incident Blotter Book of Barangay Sangkol, the following incident report was officially received, entered, and investigated by the Barangay Tanod Desk:
                </p>

                {/* Details Table */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Complainant:</span>
                      <strong className="text-slate-900">{viewExtractTarget.residentName}</strong>
                      <p className="text-[11px] text-slate-600">{viewExtractTarget.purok}, Barangay Sangkol</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Respondent / Persons Involved:</span>
                      <strong className="text-slate-900">{viewExtractTarget.involvedPersons || 'Unidentified / Under Investigation'}</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Incident Classification:</span>
                      <strong className="text-slate-900">{viewExtractTarget.incidentType}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Date & Time of Occurrence:</span>
                      <strong className="text-slate-900">{viewExtractTarget.incidentDateTime}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Summary of Narrative & Facts:</span>
                  <p className="italic text-slate-800 leading-relaxed">"{viewExtractTarget.narrative}"</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Initial Action / Settlement Status:</span>
                  <p className="text-slate-800">{viewExtractTarget.actionTakenNotes || 'Transmitted to Duty Tanod Officer.'}</p>
                  <p className="text-[11px] text-slate-600 font-bold mt-1">Current Standing: {viewExtractTarget.status}</p>
                </div>

                <p className="indent-6 leading-relaxed pt-2">
                  This certified extract is issued upon the official request of the complainant, <strong>{viewExtractTarget.residentName}</strong>, for police endorsement, insurance, judicial requirement, or lawful purpose it may serve.
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-8 text-center font-sans text-xs">
                <div>
                  <p className="border-b border-slate-400 pb-1 font-bold text-slate-900">{viewExtractTarget.assignedOfficer || 'Tanod Duty Officer'}</p>
                  <p className="text-[9px] text-slate-500 uppercase mt-0.5">Assigned Investigator / Tanod</p>
                </div>
                <div>
                  <p className="border-b border-slate-400 pb-1 font-bold text-slate-900">{settings.barangaySecretary}</p>
                  <p className="text-[9px] text-slate-500 uppercase mt-0.5">Barangay Secretary</p>
                </div>
                <div>
                  <p className="border-b border-slate-400 pb-1 font-bold text-slate-900">{settings.punongBarangay}</p>
                  <p className="text-[9px] text-slate-500 uppercase mt-0.5">Punong Barangay</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- RESIDENT FOLLOW-UP NOTE MODAL -------------------- */}
      {followUpTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Send Follow-Up Note to Tanod Desk</h3>
                  <p className="text-xs text-slate-500">Blotter No: {followUpTarget.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFollowUpTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFollowUpSubmit} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Provide recent developments, additional witness names, or updates regarding this case. Your message is recorded directly in the official activity trail reviewed by the Barangay Tanod.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Follow-Up Statement / Development *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Incident recurred last night at 11:30 PM, or respondent came to negotiate peacefully..."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFollowUpTarget(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Follow-Up</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- ELEVATE TO LUPON CONCILIATION MODAL -------------------- */}
      {luponMediationTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Request Lupon Conciliation Hearing</h3>
                  <p className="text-xs text-slate-500">Katarungang Pambarangay (R.A. 7160)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLuponMediationTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLuponMediationSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Originating Blotter:</span>
                  <span className="font-mono font-bold text-rose-700">{luponMediationTarget.id}</span>
                </div>
                <p className="text-slate-800 font-semibold">{luponMediationTarget.incidentType}</p>
                <p className="text-[11px] text-slate-600">Respondent: <strong>{luponMediationTarget.involvedPersons || 'To be identified'}</strong></p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mediation Case Title *</label>
                <input
                  type="text"
                  required
                  value={mediationCaseTitle}
                  onChange={(e) => setMediationCaseTitle(e.target.value)}
                  placeholder="e.g. Boundary Wall Dispute between Dela Cruz and Santos"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Relief Sought / Desired Settlement *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Requesting removal of obstruction, reimbursement of damages, and formal Kasunduan agreement before the Punong Barangay..."
                  value={mediationReliefSought}
                  onChange={(e) => setMediationReliefSought(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200/80 text-[11px] text-rose-950 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-rose-700" />
                  <span>Katarungang Pambarangay Process</span>
                </p>
                <p>By filing for Lupon Conciliation, a formal KP docket number is issued. The Punong Barangay will summon both parties for 1st mediation within 15 days in accordance with the Local Government Code.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLuponMediationTarget(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>File Mediation Docket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
