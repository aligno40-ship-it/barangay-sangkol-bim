import React, { useState, useMemo } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { AnnouncementRecord, AnnouncementAttendee } from '../types';
import { RepublicSeal, BarangaySangkolSeal } from './OfficialSeals';
import { RecentSearchesInput } from './RecentSearchesInput';
import {
  X,
  Users,
  CheckCircle2,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Printer,
  Download,
  Calendar,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  Trash2,
  Check,
  XCircle,
  FileSpreadsheet,
  ChevronDown,
  Sparkles,
  Phone,
  Home,
  ShieldCheck,
} from 'lucide-react';

interface AnnouncementAttendanceModalProps {
  announcement: AnnouncementRecord;
  onClose: () => void;
}

export const AnnouncementAttendanceModal: React.FC<AnnouncementAttendanceModalProps> = ({
  announcement,
  onClose,
}) => {
  const {
    announcementAttendees,
    residents,
    currentUser,
    settings,
    officials,
    updateAttendeeStatus,
    addWalkInAttendee,
    deleteAttendee,
  } = useBarangay();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [purokFilter, setPurokFilter] = useState<string>('All');
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  // Walk-in form state
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [walkInRemarks, setWalkInRemarks] = useState('');
  const [walkInSearch, setWalkInSearch] = useState('');
  const [walkInMessage, setWalkInMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // All attendees for this announcement
  const eventAttendees = useMemo(() => {
    return announcementAttendees.filter((att) => att.announcementId === announcement.id);
  }, [announcementAttendees, announcement.id]);

  // Statistics
  const stats = useMemo(() => {
    const total = eventAttendees.length;
    const present = eventAttendees.filter(
      (a) => a.attendanceStatus === 'Present / Attended' || a.attendanceStatus === 'Walk-In'
    ).length;
    const registered = eventAttendees.filter((a) => a.attendanceStatus === 'Registered').length;
    const walkIns = eventAttendees.filter((a) => a.attendanceStatus === 'Walk-In').length;
    const absent = eventAttendees.filter((a) => a.attendanceStatus === 'Absent').length;
    const cancelled = eventAttendees.filter((a) => a.attendanceStatus === 'Cancelled').length;

    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    const capacity = announcement.maxSlots || 0;
    const remainingSlots = capacity > 0 ? Math.max(0, capacity - total) : null;

    return { total, present, registered, walkIns, absent, cancelled, rate, capacity, remainingSlots };
  }, [eventAttendees, announcement.maxSlots]);

  // Filtered Attendees
  const filteredAttendees = useMemo(() => {
    return eventAttendees.filter((att) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = att.residentName.toLowerCase().includes(q);
        const matchPurok = att.purok.toLowerCase().includes(q);
        const matchContact = (att.contactNumber || '').toLowerCase().includes(q);
        const matchHousehold = (att.householdNo || '').toLowerCase().includes(q);
        const matchSector = (att.sector || '').toLowerCase().includes(q);
        const matchVerifier = (att.verifiedBy || '').toLowerCase().includes(q);
        if (!matchName && !matchPurok && !matchContact && !matchHousehold && !matchSector && !matchVerifier) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'All' && att.attendanceStatus !== statusFilter) {
        return false;
      }

      // Purok
      if (purokFilter !== 'All' && att.purok !== purokFilter) {
        return false;
      }

      // Sector
      if (sectorFilter !== 'All' && att.sector !== sectorFilter) {
        return false;
      }

      return true;
    });
  }, [eventAttendees, searchQuery, statusFilter, purokFilter, sectorFilter]);

  // Available residents for walk-in (excluding those already in attendance)
  const availableResidents = useMemo(() => {
    const existingIds = new Set(eventAttendees.map((a) => a.residentId).filter(Boolean));
    return residents.filter((r) => {
      if (existingIds.has(r.id)) return false;
      if (walkInSearch) {
        const q = walkInSearch.toLowerCase();
        const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
        return fullName.includes(q) || r.purok.toLowerCase().includes(q) || (r.contactNumber || '').includes(q);
      }
      return true;
    });
  }, [residents, eventAttendees, walkInSearch]);

  const handleMarkStatus = (attendeeId: string, status: AnnouncementAttendee['attendanceStatus']) => {
    updateAttendeeStatus(attendeeId, status);
  };

  const handleAddWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId) {
      setWalkInMessage({ type: 'error', text: 'Please select a resident from the civil registry.' });
      return;
    }

    const res = addWalkInAttendee(announcement.id, selectedResidentId, walkInRemarks);
    if (res.success) {
      setWalkInMessage({ type: 'success', text: res.message });
      setSelectedResidentId('');
      setWalkInRemarks('');
      setTimeout(() => {
        setIsWalkInModalOpen(false);
        setWalkInMessage(null);
      }, 1200);
    } else {
      setWalkInMessage({ type: 'error', text: res.message });
    }
  };

  const handleExportCSV = () => {
    const headers = [
      '#',
      'Resident Name',
      'Purok',
      'Household No.',
      'Sector / Category',
      'Voter Status',
      'Contact Number',
      'Registration Date',
      'Attendance Status',
      'Attended Timestamp',
      'Verified By',
      'Remarks',
    ];

    const rows = filteredAttendees.map((att, idx) => [
      idx + 1,
      `"${att.residentName}"`,
      `"${att.purok}"`,
      `"${att.householdNo || 'N/A'}"`,
      `"${att.sector || 'General Resident'}"`,
      `"${att.voterStatus || 'Registered'}"`,
      `"${att.contactNumber || 'N/A'}"`,
      `"${att.registeredAt}"`,
      `"${att.attendanceStatus}"`,
      `"${att.attendedAt || 'N/A'}"`,
      `"${att.verifiedBy || 'N/A'}"`,
      `"${att.remarks || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Attendance_Roster_${announcement.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    if (!isPrintMode) {
      setIsPrintMode(true);
      setTimeout(() => {
        try {
          window.focus();
          window.print();
        } catch {
          window.print();
        }
      }, 150);
    } else {
      try {
        window.focus();
        window.print();
      } catch {
        window.print();
      }
    }
  };

  const captain =
    officials.find(
      (o) => o.position.toLowerCase().includes('captain') || o.position.toLowerCase().includes('punong')
    ) || officials[0];
  const secretary =
    officials.find((o) => o.position.toLowerCase().includes('secretary')) || officials[1];

  const punongBarangayName = captain?.name || settings.punongBarangayName || 'HON. EDUARDO S. DELA CRUZ';
  const barangaySecretaryName = secretary?.name || 'HON. MARIA SANTOS-CRUZ';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static print:inset-auto modal-backdrop">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-6xl w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Top Header (Screen Only) */}
        <div className="p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  {announcement.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {announcement.id}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white leading-snug line-clamp-1">
                Attendance & Registrants Roster: {announcement.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintMode(!isPrintMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                isPrintMode
                  ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                  : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
              }`}
              title="Toggle Official Print Preview / Management"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">
                {isPrintMode ? 'Back to Management' : 'Printable Sheet'}
              </span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Send to Printer or Export to PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Roster</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Export to CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer transition-colors"
              title="Close Roster"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL ATTENDANCE SHEET VIEW */}
        {isPrintMode ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 print:bg-white print:p-0">
            {/* Screen-Only Print Control Banner */}
            <div className="max-w-4xl mx-auto mb-4 print:hidden bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-amber-900 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="font-medium">
                  Official Barangay Attendance Roster is formatted for standard Letter/A4 printing with official headers & seals.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintMode(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Back to Management
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document Now</span>
                </button>
              </div>
            </div>

            {/* DOCUMENT CANVAS (PRINTABLE AREA) */}
            <div
              id="printable-announcement-roster"
              className="printable-area max-w-4xl mx-auto bg-white p-8 sm:p-10 shadow-lg rounded-xl border border-slate-300 print:shadow-none print:border-none print:p-0 text-slate-900 font-serif"
            >
              {/* OFFICIAL LETTERHEAD WITH PHILIPPINE & BARANGAY SEALS */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                <div className="w-20 h-20 flex items-center justify-center">
                  <RepublicSeal size={72} />
                </div>
                <div className="text-center flex-1 px-4">
                  <h4 className="text-[11px] font-serif uppercase tracking-widest text-slate-600 font-bold">
                    Republic of the Philippines
                  </h4>
                  <h4 className="text-[11px] font-serif uppercase tracking-wider text-slate-700 font-bold">
                    Province of {settings.province || 'Misamis Occidental'}
                  </h4>
                  <h4 className="text-xs font-serif uppercase tracking-wider text-slate-700 font-bold">
                    {settings.municipality || 'Municipality of Oroquieta City'}
                  </h4>
                  <h3 className="text-lg font-bold uppercase font-serif tracking-wide text-slate-900 mt-1 font-sans">
                    {settings.barangayName || 'BARANGAY SANGKOL'}
                  </h3>
                  <p className="text-xs italic font-serif text-slate-600 font-medium">
                    {settings.tagline || 'Office of the Sangguniang Barangay'}
                  </p>
                </div>
                <div className="w-20 h-20 flex items-center justify-center">
                  <BarangaySangkolSeal size={72} />
                </div>
              </div>

              {/* SHEET TITLE */}
              <div className="text-center mb-6 space-y-1">
                <h2 className="text-base font-bold uppercase tracking-wider underline underline-offset-4 text-slate-900 font-sans">
                  OFFICIAL ATTENDANCE AND REGISTRATION ROSTER
                </h2>
                <p className="text-xs font-semibold uppercase text-slate-600 font-sans">
                  BARANGAY PUBLIC ANNOUNCEMENT & CITIZEN ADVISORY RECORD
                </p>
              </div>

              {/* ANNOUNCEMENT INFO SUMMARY */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs mb-6 font-sans">
                <div className="space-y-1">
                  <p>
                    <span className="font-bold text-slate-900">Announcement / Advisory:</span>{' '}
                    <span className="font-semibold text-slate-800">{announcement.title}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-900">Category / Type:</span> {announcement.category}
                  </p>
                  <p>
                    <span className="font-bold text-slate-900">Target Audience:</span>{' '}
                    {announcement.targetAudience || 'General Public'}
                  </p>
                  <p>
                    <span className="font-bold text-slate-900">Organizer / Author:</span>{' '}
                    {announcement.author || 'Barangay Council'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p>
                    <span className="font-bold text-slate-900">Event Date & Time:</span>{' '}
                    {announcement.eventDate || announcement.publishDate}
                    {announcement.eventTime ? ` at ${announcement.eventTime}` : ''}
                  </p>
                  <p>
                    <span className="font-bold text-slate-900">Venue / Location:</span>{' '}
                    {announcement.venue || settings.hallAddress || 'Barangay Sangkol Multi-Purpose Hall'}
                  </p>
                  <p>
                    <span className="font-bold text-slate-900">Total Registered:</span>{' '}
                    <strong className="text-slate-900">{eventAttendees.length}</strong> |{' '}
                    <span className="font-bold text-slate-900">Present:</span>{' '}
                    <strong className="text-emerald-700">{stats.present}</strong>
                    {stats.capacity > 0 ? ` (Cap: ${stats.capacity})` : ''}
                  </p>
                </div>
              </div>

              {/* ROSTER TABLE */}
              <table className="w-full border-collapse border border-slate-300 text-xs mb-8 font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="border border-slate-300 p-2 text-center w-8">#</th>
                    <th className="border border-slate-300 p-2 text-left">Resident Name</th>
                    <th className="border border-slate-300 p-2 text-center w-28">Purok</th>
                    <th className="border border-slate-300 p-2 text-center w-24">Sector</th>
                    <th className="border border-slate-300 p-2 text-center w-28">Contact No.</th>
                    <th className="border border-slate-300 p-2 text-center w-28">Status</th>
                    <th className="border border-slate-300 p-2 text-center w-32">Signature / Initial</th>
                  </tr>
                </thead>
                <tbody>
                  {eventAttendees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-slate-300 p-6 text-center text-slate-500 italic">
                        No registered attendees recorded for this announcement / advisory yet.
                      </td>
                    </tr>
                  ) : (
                    eventAttendees.map((att, idx) => (
                      <tr key={att.id} className="border-b border-slate-200">
                        <td className="border border-slate-300 p-2 text-center font-medium">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-bold text-slate-900">
                          {att.residentName}
                          {att.householdNo && (
                            <span className="block text-[10px] font-normal text-slate-500">
                              HH: {att.householdNo}
                            </span>
                          )}
                        </td>
                        <td className="border border-slate-300 p-2 text-center text-slate-700">{att.purok}</td>
                        <td className="border border-slate-300 p-2 text-center text-slate-700">
                          {att.sector || 'Resident'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center text-slate-700">
                          {att.contactNumber || '—'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-semibold">
                          <span
                            className={
                              att.attendanceStatus === 'Present / Attended' || att.attendanceStatus === 'Walk-In'
                                ? 'text-emerald-700 font-bold'
                                : att.attendanceStatus === 'Registered'
                                ? 'text-indigo-700'
                                : 'text-slate-600'
                            }
                          >
                            {att.attendanceStatus}
                          </span>
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          {att.attendanceStatus === 'Present / Attended' || att.attendanceStatus === 'Walk-In' ? (
                            <span className="font-mono text-[10px] text-emerald-700 font-bold">✓ VERIFIED</span>
                          ) : (
                            <div className="h-5 border-b border-slate-400 w-24 mx-auto"></div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* OFFICIAL SIGNATURE BLOCK */}
              <div className="grid grid-cols-2 gap-12 pt-8 mt-8 border-t border-slate-300 text-xs font-sans">
                <div className="text-center space-y-1">
                  <p className="text-slate-600 mb-12">Prepared & Verified By:</p>
                  <p className="font-bold underline uppercase text-slate-900">{barangaySecretaryName}</p>
                  <p className="text-slate-600">Barangay Secretary</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-slate-600 mb-12">Attested & Approved By:</p>
                  <p className="font-bold underline uppercase text-slate-900">{punongBarangayName}</p>
                  <p className="text-slate-600">Punong Barangay</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD ADMINISTRATIVE MANAGEMENT VIEW */
          <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
            {/* Announcement Context Card & Live Attendance KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Announcement Details Info */}
              <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-slate-300">
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{announcement.eventDate || announcement.publishDate}</span>
                    </span>
                    {announcement.eventTime && (
                      <span className="flex items-center gap-1 text-slate-300 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{announcement.eventTime}</span>
                      </span>
                    )}
                    {announcement.venue && (
                      <span className="flex items-center gap-1 text-slate-300 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{announcement.venue}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400">
                      <Tag className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Audience: <strong>{announcement.targetAudience}</strong>
                      </span>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedResidentId('');
                      setWalkInRemarks('');
                      setWalkInMessage(null);
                      setIsWalkInModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Register Walk-In Resident</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800 line-clamp-2">
                  {announcement.content}
                </p>
              </div>

              {/* Attendance Metrics */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
                  <p className="text-2xl font-black text-white mt-0.5">{stats.total}</p>
                  {stats.capacity > 0 && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Cap: {stats.capacity} ({stats.remainingSlots} left)
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Present / Attended</p>
                  <p className="text-2xl font-black text-emerald-300 mt-0.5">{stats.present}</p>
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">{stats.rate}% Attendance Rate</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-800/80 border border-indigo-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Walk-Ins Logged</p>
                  <p className="text-2xl font-black text-indigo-300 mt-0.5">{stats.walkIns}</p>
                  <p className="text-[10px] text-indigo-400/80 mt-0.5">On-site attendance</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Pre-Registered</p>
                  <p className="text-2xl font-black text-amber-300 mt-0.5">{stats.registered}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Awaiting check-in</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <RecentSearchesInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search attendee name, purok, contact no, household ID, or verified by..."
                    storageKey="announcement_attendees"
                    theme="dark"
                    inputClassName="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-medium cursor-pointer"
                  >
                    <option value="All">All Attendance Status ({eventAttendees.length})</option>
                    <option value="Present / Attended">Present / Attended ({stats.present - stats.walkIns})</option>
                    <option value="Walk-In">Walk-In Desk ({stats.walkIns})</option>
                    <option value="Registered">Pre-Registered ({stats.registered})</option>
                    <option value="Absent">Absent ({stats.absent})</option>
                    <option value="Cancelled">Cancelled ({stats.cancelled})</option>
                  </select>

                  <select
                    value={purokFilter}
                    onChange={(e) => setPurokFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-medium cursor-pointer"
                  >
                    <option value="All">All Puroks (6)</option>
                    <option value="Purok Pinya">Purok Pinya</option>
                    <option value="Purok Lumboy">Purok Lumboy</option>
                    <option value="Purok Mangga">Purok Mangga</option>
                    <option value="Purok Tambis">Purok Tambis</option>
                    <option value="Purok Kaimito">Purok Kaimito</option>
                    <option value="Purok Bayabas">Purok Bayabas</option>
                  </select>

                  <select
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-medium cursor-pointer"
                  >
                    <option value="All">All Sectors</option>
                    <option value="Senior Citizen">Senior Citizen</option>
                    <option value="4Ps Beneficiary">4Ps Beneficiary</option>
                    <option value="PWD">PWD</option>
                    <option value="Solo Parent">Solo Parent</option>
                    <option value="Youth">Youth</option>
                    <option value="General Resident">General Resident</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>
                  Showing <strong>{filteredAttendees.length}</strong> of <strong>{eventAttendees.length}</strong> registered attendees
                </span>
                {(searchQuery || statusFilter !== 'All' || purokFilter !== 'All' || sectorFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('All');
                      setPurokFilter('All');
                      setSectorFilter('All');
                    }}
                    className="text-amber-400 hover:underline cursor-pointer font-semibold"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Attendees Table */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/90 text-slate-300 font-bold border-b border-slate-700">
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-4">Resident Attendee</th>
                      <th className="py-3 px-3">Purok / Household</th>
                      <th className="py-3 px-3">Sector / Category</th>
                      <th className="py-3 px-3">Contact & Voter</th>
                      <th className="py-3 px-3">Registration Info</th>
                      <th className="py-3 px-3 text-center">Attendance Status</th>
                      <th className="py-3 px-3 text-center">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredAttendees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="w-8 h-8 text-slate-600" />
                            <p className="font-bold text-slate-400">No matching registered attendees found.</p>
                            <p className="text-[11px] text-slate-500">
                              {eventAttendees.length === 0
                                ? 'No residents have registered for this announcement yet. Use "+ Register Walk-In Resident" to add attendees.'
                                : 'Try adjusting your search criteria or filter options.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAttendees.map((att, index) => {
                        const isPresent =
                          att.attendanceStatus === 'Present / Attended' || att.attendanceStatus === 'Walk-In';
                        const isWalkIn = att.attendanceStatus === 'Walk-In';
                        const isPreReg = att.attendanceStatus === 'Registered';
                        const isAbsent = att.attendanceStatus === 'Absent';

                        return (
                          <tr
                            key={att.id}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              isPresent ? 'bg-emerald-950/10' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold">
                              {index + 1}
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isPresent
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                                  }`}
                                >
                                  {att.residentName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-white text-xs">{att.residentName}</p>
                                  {att.email && <p className="text-[10px] text-slate-400">{att.email}</p>}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-semibold text-slate-200">{att.purok}</span>
                              {att.householdNo && (
                                <p className="text-[10px] text-slate-400">HH: {att.householdNo}</p>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {att.sector || 'General Resident'}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-slate-300">
                              <p className="text-[11px] font-mono">{att.contactNumber || 'No Contact'}</p>
                              <span className="text-[10px] text-slate-400">
                                {att.voterStatus || 'Registered'} Voter
                              </span>
                            </td>

                            <td className="py-3 px-3 text-[11px] text-slate-300">
                              <p className="text-slate-400">Reg: {att.registeredAt.split(' ')[0]}</p>
                              {att.attendedAt && (
                                <p className="text-emerald-400 font-semibold text-[10px]">
                                  In: {att.attendedAt.split(' ')[1] || att.attendedAt}
                                </p>
                              )}
                              {att.verifiedBy && (
                                <p className="text-[10px] text-slate-400">by: {att.verifiedBy}</p>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                  isPresent
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : isWalkIn
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                    : isPreReg
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : isAbsent
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {isPresent && <Check className="w-3 h-3 text-emerald-400" />}
                                {att.attendanceStatus}
                              </span>
                            </td>

                            {/* Quick Actions */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {att.attendanceStatus !== 'Present / Attended' &&
                                att.attendanceStatus !== 'Walk-In' ? (
                                  <button
                                    onClick={() => handleMarkStatus(att.id, 'Present / Attended')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Mark Attendee as Present"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Mark Present</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleMarkStatus(att.id, 'Registered')}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold border border-slate-700 cursor-pointer"
                                    title="Revert to Pre-Registered"
                                  >
                                    <span>Revert</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleMarkStatus(att.id, 'Absent')}
                                  className="p-1 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
                                  title="Mark Absent"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    if (confirm(`Remove attendee registration record for ${att.residentName}?`)) {
                                      deleteAttendee(att.id);
                                    }
                                  }}
                                  className="p-1 bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
                                  title="Delete Registration Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer (Screen Only) */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Attendance synchronization active • Recorded in Barangay Audit Log</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintMode(!isPrintMode)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold cursor-pointer transition-colors"
            >
              {isPrintMode ? 'Back to Management View' : 'Open Printable Roster Preview'}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer transition-colors"
            >
              Close Roster
            </button>
          </div>
        </div>
      </div>

      {/* Inner Walk-In Registration Modal */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-100 space-y-4">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Register Walk-In Resident to Event</span>
              </h4>
              <button
                onClick={() => setIsWalkInModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWalkIn} className="p-5 space-y-4">
              {walkInMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    walkInMessage.type === 'success'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-700'
                  }`}
                >
                  {walkInMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{walkInMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Select Resident from Civil Registry *
                </label>
                <div className="mb-2">
                  <input
                    type="text"
                    value={walkInSearch}
                    onChange={(e) => setWalkInSearch(e.target.value)}
                    placeholder="Search name, purok..."
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500"
                  />
                </div>
                <select
                  required
                  value={selectedResidentId}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  size={5}
                >
                  {availableResidents.length === 0 ? (
                    <option disabled value="">
                      No available residents found or all already registered
                    </option>
                  ) : (
                    availableResidents.map((r) => (
                      <option key={r.id} value={r.id} className="py-1">
                        {r.firstName} {r.lastName} — {r.purok} ({r.voterStatus || 'Registered'} Voter)
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Selected resident will be automatically logged as "Walk-In" and marked present for this event.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Walk-In Remarks (Optional)</label>
                <input
                  type="text"
                  value={walkInRemarks}
                  onChange={(e) => setWalkInRemarks(e.target.value)}
                  placeholder="e.g. Attended assembly in person with Purok Leader"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedResidentId}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  Confirm Walk-In Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
