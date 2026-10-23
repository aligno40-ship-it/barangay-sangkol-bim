import React, { useState, useMemo } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { CommunityActivity, ActivityAttendee } from '../types';
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

interface ActivityAttendanceModalProps {
  activity: CommunityActivity;
  onClose: () => void;
}

export const ActivityAttendanceModal: React.FC<ActivityAttendanceModalProps> = ({
  activity,
  onClose,
}) => {
  const {
    activityAttendees,
    residents,
    currentUser,
    settings,
    officials,
    updateActivityAttendeeStatus,
    addActivityWalkIn,
    deleteActivityAttendee,
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

  // All attendees for this activity
  const eventAttendees = useMemo(() => {
    return activityAttendees.filter((att) => att.activityId === activity.id);
  }, [activityAttendees, activity.id]);

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
    const capacity = activity.maxParticipants || 0;
    const remainingSlots = capacity > 0 ? Math.max(0, capacity - total) : null;

    return { total, present, registered, walkIns, absent, cancelled, rate, capacity, remainingSlots };
  }, [eventAttendees, activity.maxParticipants]);

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

  const handleMarkStatus = (attendeeId: string, status: ActivityAttendee['attendanceStatus']) => {
    updateActivityAttendeeStatus(attendeeId, status);
  };

  const handleAddWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId) {
      setWalkInMessage({ type: 'error', text: 'Please select a resident from the civil registry.' });
      return;
    }

    const res = addActivityWalkIn(activity.id, selectedResidentId, walkInRemarks);
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
      `Activity_Attendance_Roster_${activity.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const punongBarangay = officials.find((o) => o.position.toLowerCase().includes('punong') || o.position.toLowerCase().includes('captain'))?.name || 'HON. EDUARDO S. DELA CRUZ';
  const barangaySecretary = officials.find((o) => o.position.toLowerCase().includes('secretary'))?.name || 'MARIA C. SANTOS';

  return (
    <div
      id="activity-attendance-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === 'activity-attendance-modal-backdrop') {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-start justify-between border-b border-indigo-900/40">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner shrink-0 mt-0.5">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {activity.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  activity.status === 'Completed'
                    ? 'bg-slate-700 text-slate-200'
                    : activity.status === 'Ongoing'
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                    : 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                }`}>
                  {activity.status}
                </span>
                <span className="text-xs text-slate-400 font-medium">Activity ID: {activity.id}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                {activity.title}
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-300 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {activity.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {activity.time}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {activity.venue || activity.location || 'Barangay Hall'}
                </span>
                {activity.organizer && (
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Led by: {activity.organizer}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintMode(!isPrintMode)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isPrintMode
                  ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              }`}
              title="Toggle Official Print Preview / Sheet"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{isPrintMode ? 'Back to Management' : 'Printable Sheet'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL ATTENDANCE SHEET VIEW */}
        {isPrintMode ? (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100 print:bg-white print:p-0">
            <div className="flex justify-between items-center mb-4 print:hidden bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-900 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Official Barangay Attendance Roster is formatted for standard Letter/A4 printing with official headers & seals.
                </span>
              </div>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Document
              </button>
            </div>

            {/* DOCUMENT CANVAS */}
            <div className="max-w-4xl mx-auto bg-white p-8 sm:p-10 shadow-lg rounded-xl border border-slate-300 print:shadow-none print:border-none print:p-4 text-slate-900">
              {/* OFFICIAL HEADER WITH SEALS */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                <div className="w-20 h-20 flex items-center justify-center">
                  <RepublicSeal className="w-20 h-20" />
                </div>
                <div className="text-center flex-1 px-4">
                  <h4 className="text-xs font-serif uppercase tracking-widest text-slate-600">Republic of the Philippines</h4>
                  <h4 className="text-xs font-serif uppercase tracking-wider text-slate-700">Province of {settings.province || 'Misamis Occidental'}</h4>
                  <h4 className="text-xs font-serif uppercase tracking-wider text-slate-700">{settings.municipality || 'Municipality of Oroquieta City'}</h4>
                  <h3 className="text-lg font-bold uppercase font-serif tracking-wide text-slate-900 mt-1">
                    {settings.barangayName || 'BARANGAY SANGKOL'}
                  </h3>
                  <p className="text-xs italic font-serif text-slate-600">{settings.tagline || 'Office of the Sangguniang Barangay'}</p>
                </div>
                <div className="w-20 h-20 flex items-center justify-center">
                  <BarangaySangkolSeal className="w-20 h-20" />
                </div>
              </div>

              {/* SHEET TITLE */}
              <div className="text-center mb-6">
                <h2 className="text-base font-bold uppercase tracking-wider underline underline-offset-4 text-slate-900">
                  OFFICIAL ATTENDANCE AND REGISTRATION ROSTER
                </h2>
                <p className="text-xs font-semibold uppercase text-slate-600 mt-1">
                  BARANGAY ACTIVITY / COMMUNITY PROGRAM
                </p>
              </div>

              {/* ACTIVITY INFO SUMMARY */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs mb-6">
                <div>
                  <p><span className="font-bold">Activity Title:</span> {activity.title}</p>
                  <p><span className="font-bold">Category:</span> {activity.category}</p>
                  <p><span className="font-bold">Organizer / Lead:</span> {activity.organizer || 'Barangay Council'}</p>
                </div>
                <div>
                  <p><span className="font-bold">Date & Time:</span> {activity.date} at {activity.time}</p>
                  <p><span className="font-bold">Venue / Location:</span> {activity.venue || activity.location || 'Barangay Hall'}</p>
                  <p><span className="font-bold">Total Registered:</span> {eventAttendees.length} | <span className="font-bold">Present:</span> {stats.present}</p>
                </div>
              </div>

              {/* TABLE */}
              <table className="w-full border-collapse border border-slate-300 text-xs mb-8">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="border border-slate-300 p-2 text-center w-8">#</th>
                    <th className="border border-slate-300 p-2 text-left">Resident Name</th>
                    <th className="border border-slate-300 p-2 text-center w-28">Purok</th>
                    <th className="border border-slate-300 p-2 text-center w-24">Sector</th>
                    <th className="border border-slate-300 p-2 text-center w-28">Contact No.</th>
                    <th className="border border-slate-300 p-2 text-center w-28">Status</th>
                    <th className="border border-slate-300 p-2 text-center w-28">Signature / Initial</th>
                  </tr>
                </thead>
                <tbody>
                  {eventAttendees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-slate-300 p-4 text-center text-slate-500 italic">
                        No registered attendees recorded for this activity yet.
                      </td>
                    </tr>
                  ) : (
                    eventAttendees.map((att, idx) => (
                      <tr key={att.id} className="border-b border-slate-200">
                        <td className="border border-slate-300 p-2 text-center font-medium">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-bold text-slate-900">{att.residentName}</td>
                        <td className="border border-slate-300 p-2 text-center text-slate-700">{att.purok}</td>
                        <td className="border border-slate-300 p-2 text-center text-slate-700">{att.sector || 'Resident'}</td>
                        <td className="border border-slate-300 p-2 text-center text-slate-700">{att.contactNumber || '—'}</td>
                        <td className="border border-slate-300 p-2 text-center font-semibold">
                          <span className={
                            att.attendanceStatus === 'Present / Attended' || att.attendanceStatus === 'Walk-In'
                              ? 'text-emerald-700'
                              : att.attendanceStatus === 'Registered'
                              ? 'text-indigo-700'
                              : 'text-slate-600'
                          }>
                            {att.attendanceStatus}
                          </span>
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          {att.attendanceStatus === 'Present / Attended' || att.attendanceStatus === 'Walk-In' ? (
                            <span className="font-mono text-[10px] text-slate-500">✓ VERIFIED</span>
                          ) : (
                            <div className="h-4 border-b border-slate-300"></div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* SIGNATURE BLOCK */}
              <div className="grid grid-cols-2 gap-12 pt-8 mt-8 border-t border-slate-300 text-xs">
                <div className="text-center">
                  <p className="text-slate-600 mb-12">Prepared & Verified By:</p>
                  <p className="font-bold underline uppercase">{barangaySecretary}</p>
                  <p className="text-slate-600">Barangay Secretary</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-600 mb-12">Attested & Approved By:</p>
                  <p className="font-bold underline uppercase">{punongBarangay}</p>
                  <p className="text-slate-600">Punong Barangay</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD ADMINISTRATIVE MANAGEMENT VIEW */
          <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50">
            {/* STATS BANNER */}
            <div className="p-4 sm:p-6 bg-white border-b border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Total Registered</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
                    {stats.total}
                    {stats.capacity > 0 && (
                      <span className="text-xs font-normal text-slate-400">/ {stats.capacity} max</span>
                    )}
                  </div>
                </div>

                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-medium">Present / Attended</div>
                  <div className="text-2xl font-bold text-emerald-900 mt-1 flex items-baseline gap-1">
                    {stats.present}
                    <span className="text-xs font-bold text-emerald-600">({stats.rate}%)</span>
                  </div>
                </div>

                <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-200">
                  <div className="text-xs text-indigo-700 font-medium">Registered (Pending)</div>
                  <div className="text-2xl font-bold text-indigo-900 mt-1">{stats.registered}</div>
                </div>

                <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200">
                  <div className="text-xs text-purple-700 font-medium">Walk-in Registrations</div>
                  <div className="text-2xl font-bold text-purple-900 mt-1">{stats.walkIns}</div>
                </div>

                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                  <div className="text-xs text-amber-700 font-medium">Absent / No-Show</div>
                  <div className="text-2xl font-bold text-amber-900 mt-1">{stats.absent}</div>
                </div>

                <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200">
                  <div className="text-xs text-rose-700 font-medium">Cancelled</div>
                  <div className="text-2xl font-bold text-rose-900 mt-1">{stats.cancelled}</div>
                </div>
              </div>
            </div>

            {/* CONTROLS BAR: SEARCH, FILTERS, ACTIONS */}
            <div className="p-4 sm:p-6 pb-2">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                {/* Search */}
                <RecentSearchesInput
                  className="flex-1"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by resident name, purok, contact, sector..."
                  storageKey="activity_attendees"
                  theme="light"
                  inputClassName="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />

                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Registered">Registered</option>
                    <option value="Present / Attended">Present / Attended</option>
                    <option value="Walk-In">Walk-In</option>
                    <option value="Absent">Absent</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <select
                    value={purokFilter}
                    onChange={(e) => setPurokFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All 6 Puroks</option>
                    <option value="Purok Pinya">Purok Pinya</option>
                    <option value="Purok Lumboy">Purok Lumboy</option>
                    <option value="Purok Mangga">Purok Mangga</option>
                    <option value="Purok Tambis">Purok Tambis</option>
                    <option value="Purok Kaimito">Purok Kaimito</option>
                    <option value="Purok Bayabas">Purok Bayabas</option>
                  </select>

                  <button
                    onClick={() => setIsWalkInModalOpen(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register Walk-in</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors whitespace-nowrap"
                    title="Export attendee roster to CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ATTENDEES LIST / ROSTER TABLE */}
            <div className="p-4 sm:p-6 pt-2 flex-1">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-4 w-10 text-center">#</th>
                        <th className="py-3 px-4">Resident Name & Details</th>
                        <th className="py-3 px-4">Purok & Household</th>
                        <th className="py-3 px-4">Sector / Category</th>
                        <th className="py-3 px-4">Registration Info</th>
                        <th className="py-3 px-4">Attendance Status</th>
                        <th className="py-3 px-4 text-right">Actions & Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                      {filteredAttendees.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                              <Users className="w-6 h-6" />
                            </div>
                            <p className="font-semibold text-slate-700">No attendees found</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {searchQuery || statusFilter !== 'All' || purokFilter !== 'All'
                                ? 'Try clearing your filters or search keywords.'
                                : 'No residents have registered for this activity yet.'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredAttendees.map((attendee, index) => {
                          const isPresent =
                            attendee.attendanceStatus === 'Present / Attended' ||
                            attendee.attendanceStatus === 'Walk-In';

                          return (
                            <tr
                              key={attendee.id}
                              className={`hover:bg-slate-50/70 transition-colors ${
                                isPresent ? 'bg-emerald-50/20' : ''
                              }`}
                            >
                              <td className="py-3.5 px-4 text-center font-medium text-slate-400 text-xs">
                                {index + 1}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  {attendee.residentName}
                                  {attendee.attendanceStatus === 'Walk-In' && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-700 uppercase">
                                      Walk-In
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                                  {attendee.contactNumber && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {attendee.contactNumber}
                                    </span>
                                  )}
                                  {attendee.voterStatus && (
                                    <span className="text-[11px] text-slate-400">
                                      Voter: {attendee.voterStatus}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-800">{attendee.purok}</div>
                                {attendee.householdNo && (
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <Home className="w-3 h-3 text-slate-400" />
                                    HH: {attendee.householdNo}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {attendee.sector || 'General Resident'}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-xs text-slate-600">
                                <div className="text-slate-800 font-medium">{attendee.registeredAt}</div>
                                {attendee.remarks && (
                                  <div className="text-[11px] text-slate-400 truncate max-w-xs" title={attendee.remarks}>
                                    {attendee.remarks}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                    attendee.attendanceStatus === 'Present / Attended'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : attendee.attendanceStatus === 'Walk-In'
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                      : attendee.attendanceStatus === 'Registered'
                                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                      : attendee.attendanceStatus === 'Absent'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}
                                >
                                  {attendee.attendanceStatus === 'Present / Attended' && <Check className="w-3.5 h-3.5" />}
                                  {attendee.attendanceStatus === 'Walk-In' && <Sparkles className="w-3.5 h-3.5" />}
                                  {attendee.attendanceStatus}
                                </span>
                                {attendee.verifiedBy && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    by {attendee.verifiedBy}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!isPresent ? (
                                    <button
                                      onClick={() => handleMarkStatus(attendee.id, 'Present / Attended')}
                                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                                      title="Mark resident as present"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Mark Present</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleMarkStatus(attendee.id, 'Registered')}
                                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                                      title="Revert to Registered status"
                                    >
                                      Reset Status
                                    </button>
                                  )}

                                  {attendee.attendanceStatus !== 'Absent' && !isPresent && (
                                    <button
                                      onClick={() => handleMarkStatus(attendee.id, 'Absent')}
                                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
                                      title="Mark as absent"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      if (confirm(`Remove ${attendee.residentName} from this activity roster?`)) {
                                        deleteActivityAttendee(attendee.id);
                                      }
                                    }}
                                    className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                    title="Delete attendee record"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Barangay Sangkol BIMS</span>
            <span>•</span>
            <span>Live Activity Attendance & Roster System</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Close Roster
          </button>
        </div>
      </div>

      {/* WALK-IN REGISTRATION SUB-MODAL */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Register Walk-In Resident</h3>
              </div>
              <button
                onClick={() => {
                  setIsWalkInModalOpen(false);
                  setWalkInMessage(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWalkIn} className="p-5 space-y-4">
              {walkInMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    walkInMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{walkInMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Resident from Civil Registry
                </label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={walkInSearch}
                    onChange={(e) => setWalkInSearch(e.target.value)}
                    placeholder="Search resident name or purok..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={selectedResidentId}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  size={5}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {availableResidents.length === 0 ? (
                    <option disabled className="text-slate-400 p-2">
                      No matching residents found in registry
                    </option>
                  ) : (
                    availableResidents.map((res) => (
                      <option key={res.id} value={res.id} className="p-1.5 hover:bg-indigo-50">
                        {res.firstName} {res.lastName} — {res.purok} ({res.contactNumber || 'No phone'})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Showing {availableResidents.length} eligible registered residents.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Desk Remarks / Notes (Optional)
                </label>
                <textarea
                  value={walkInRemarks}
                  onChange={(e) => setWalkInRemarks(e.target.value)}
                  placeholder="e.g. Registered in-person during the activity."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsWalkInModalOpen(false);
                    setWalkInMessage(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedResidentId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Confirm Walk-In Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
