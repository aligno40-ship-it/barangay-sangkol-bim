import React, { useState, useMemo } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { CommunityActivity } from '../types';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { ActivityAttendanceModal } from '../components/ActivityAttendanceModal';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import {
  CalendarDays,
  Plus,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Tag,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  Share2,
  Award,
  CalendarCheck,
  UserCheck,
  Printer,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

export const ActivitiesView: React.FC = () => {
  const {
    activities,
    activityAttendees,
    addActivity,
    updateActivity,
    deleteActivity,
    rsvpActivity,
    registerForActivity,
    cancelActivityRegistration,
    currentUser,
    settings,
    arePuroksMatching,
  } = useBarangay();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPurok, setSelectedPurok] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CommunityActivity | null>(null);
  const [deleteTargetActivity, setDeleteTargetActivity] = useState<CommunityActivity | null>(null);
  const [selectedAttendanceActivity, setSelectedAttendanceActivity] = useState<CommunityActivity | null>(null);

  const isResident = currentUser.role === 'Resident';
  const canManage =
    currentUser.role === 'Administrator' ||
    currentUser.role === 'Barangay Staff' ||
    currentUser.role === 'Barangay Official';

  const initialForm: Omit<CommunityActivity, 'id'> = {
    title: '',
    description: '',
    category: 'Assembly & Governance',
    date: '2026-08-25',
    time: '08:00 AM - 12:00 PM',
    venue: 'Barangay Sangkol Multi-Purpose Covered Gymnasium',
    targetPurok: 'All Puroks',
    organizer: 'Barangay Council & Sangguniang Kabataan',
    contactPerson: 'Hon. Barangay Secretary (0917-234-5678)',
    status: 'Upcoming',
    attendeesCount: 0,
    userRsvpd: false,
    maxParticipants: 150,
    requirements: 'Valid Resident ID or Proof of Barangay Residency',
  };

  const [formData, setFormData] = useState(initialForm);

  // Quick summary statistics
  const summaryStats = useMemo(() => {
    const total = activities.length;
    const upcoming = activities.filter((a) => a.status === 'Upcoming').length;
    const ongoing = activities.filter((a) => a.status === 'Ongoing').length;
    const completed = activities.filter((a) => a.status === 'Completed').length;
    const totalRegistrations = activityAttendees.length;
    const attendedCount = activityAttendees.filter(
      (att) => att.attendanceStatus === 'Present / Attended' || att.attendanceStatus === 'Walk-In'
    ).length;

    return { total, upcoming, ongoing, completed, totalRegistrations, attendedCount };
  }, [activities, activityAttendees]);

  const filteredActivities = activities.filter((act) => {
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      act.title.toLowerCase().includes(term) ||
      act.description.toLowerCase().includes(term) ||
      act.venue.toLowerCase().includes(term) ||
      (act.organizer || '').toLowerCase().includes(term);

    const matchesCategory = selectedCategory === 'All' || act.category === selectedCategory;
    const matchesPurok =
      selectedPurok === 'All' ||
      act.targetPurok === 'All Puroks' ||
      arePuroksMatching(act.targetPurok, selectedPurok);
    const matchesStatus = selectedStatus === 'All' || act.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesPurok && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingActivity(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (act: CommunityActivity) => {
    setEditingActivity(act);
    setFormData({
      title: act.title,
      description: act.description,
      category: act.category,
      date: act.date,
      time: act.time,
      venue: act.venue,
      targetPurok: act.targetPurok,
      organizer: act.organizer,
      contactPerson: act.contactPerson,
      status: act.status,
      attendeesCount: act.attendeesCount,
      userRsvpd: act.userRsvpd,
      maxParticipants: act.maxParticipants || 150,
      requirements: act.requirements || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isResident) {
      alert('Residents have read-only access to Community Activities and cannot post or modify events.');
      return;
    }
    if (!formData.title || !formData.date || !formData.venue) {
      alert('Title, Date, and Venue are required.');
      return;
    }

    if (editingActivity) {
      updateActivity(editingActivity.id, formData);
    } else {
      addActivity(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <CalendarDays className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Barangay Community Activities & Events Calendar
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Public community assemblies, health & wellness missions, youth sports fests, and purok clean-up drives with real-time attendee registration and roster tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {!isResident && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Barangay Activity</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytics KPI Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Total Activities</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summaryStats.total}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700">Upcoming Events</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{summaryStats.upcoming}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-700">Ongoing Events</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{summaryStats.ongoing}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-indigo-700">Total Registrations</div>
          <div className="text-2xl font-bold text-indigo-800 mt-1">{summaryStats.totalRegistrations}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-purple-700">Verified Present</div>
          <div className="text-2xl font-bold text-purple-800 mt-1">{summaryStats.attendedCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Completed Past</div>
          <div className="text-2xl font-bold text-slate-700 mt-1">{summaryStats.completed}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <RecentSearchesInput
          className="flex-1"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search activities, programs, venues, or organizers..."
          storageKey="activities"
          theme="light"
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-[11px]">Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Assembly & Governance">Assembly & Governance</option>
            <option value="Health & Medical Mission">Health & Medical Mission</option>
            <option value="Clean-Up & Environment">Clean-Up & Environment</option>
            <option value="Sports & Youth">Sports & Youth</option>
            <option value="Livelihood & Workshop">Livelihood & Workshop</option>
            <option value="Social & Senior Welfare">Social & Senior Welfare</option>
            <option value="Disaster & Safety Drill">Disaster & Safety Drill</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 ml-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-[11px]">Purok:</span>
          </div>
          <select
            value={selectedPurok}
            onChange={(e) => setSelectedPurok(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Puroks</option>
            <option value="Purok Pinya">Purok Pinya</option>
            <option value="Purok Lumboy">Purok Lumboy</option>
            <option value="Purok Mangga">Purok Mangga</option>
            <option value="Purok Tambis">Purok Tambis</option>
            <option value="Purok Kaimito">Purok Kaimito</option>
            <option value="Purok Bayabas">Purok Bayabas</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredActivities.map((act) => {
          const actAttendees = activityAttendees.filter((att) => att.activityId === act.id);
          const presentCount = actAttendees.filter(
            (att) => att.attendanceStatus === 'Present / Attended' || att.attendanceStatus === 'Walk-In'
          ).length;
          const userAttending = actAttendees.some(
            (att) =>
              (currentUser.residentId && att.residentId === currentUser.residentId) ||
              att.residentName.toLowerCase() === currentUser.name.toLowerCase()
          );

          return (
            <div
              key={act.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                {/* Badges & Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {act.category}
                  </span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                      act.status === 'Upcoming'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : act.status === 'Ongoing'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {act.status}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {act.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                    {act.description}
                  </p>
                </div>

                {/* Event Metadata */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-900">{act.date}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-[11px] text-slate-500">{act.time}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-tight text-slate-700">
                      {act.venue} <strong className="text-indigo-700">({act.targetPurok})</strong>
                    </span>
                  </div>

                  {act.organizer && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{act.organizer}</span>
                    </div>
                  )}

                  {act.requirements && (
                    <div className="text-[10px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                      <strong className="text-slate-700">Reminders:</strong> {act.requirements}
                    </div>
                  )}
                </div>

                {/* ATTENDEE & REGISTRATION STATUS STRIP */}
                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-indigo-950">{actAttendees.length}</span>
                    <span className="text-slate-500">Registered</span>
                    {presentCount > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700">
                        ({presentCount} Present)
                      </span>
                    )}
                  </div>

                  {act.maxParticipants && act.maxParticipants > 0 ? (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Cap: {act.maxParticipants} max
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Action Bottom */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  {/* View Roster / Attendance Button (Available to admins and residents alike) */}
                  <button
                    onClick={() => setSelectedAttendanceActivity(act)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    title="View full registration list, verified attendance roster and print sheets"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
                    <span>{canManage ? 'Attendance Roster' : 'View Registrants'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Resident RSVP / Register Button */}
                    <button
                      onClick={() => rsvpActivity(act.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        userAttending || act.userRsvpd
                          ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>{userAttending || act.userRsvpd ? 'Registered ✓' : 'Register Attend'}</span>
                    </button>

                    {/* Staff Edit/Delete */}
                    {!isResident && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(act)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 cursor-pointer"
                          title="Edit Activity"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {currentUser.role === 'Administrator' && (
                          <button
                            onClick={() => setDeleteTargetActivity(act)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200 cursor-pointer"
                            title="Delete Activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredActivities.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Barangay Activities Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or category filter to discover more upcoming community assemblies and schedules.
          </p>
        </div>
      )}

      {/* Add / Edit Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-900">
            <div className="p-4 bg-indigo-950 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-400" />
                <span>{editingActivity ? 'Edit Barangay Activity' : 'Create Community Activity'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Activity Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Free Medical & Dental Mission, Purok Sports Fest"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  >
                    <option value="Assembly & Governance">Assembly & Governance</option>
                    <option value="Health & Medical Mission">Health & Medical Mission</option>
                    <option value="Clean-Up & Environment">Clean-Up & Environment</option>
                    <option value="Sports & Youth">Sports & Youth</option>
                    <option value="Livelihood & Workshop">Livelihood & Workshop</option>
                    <option value="Social & Senior Welfare">Social & Senior Welfare</option>
                    <option value="Disaster & Safety Drill">Disaster & Safety Drill</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Purok</label>
                  <select
                    value={formData.targetPurok}
                    onChange={(e) => setFormData({ ...formData, targetPurok: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  >
                    <option value="All Puroks">All Puroks</option>
                    <option value="Purok Pinya">Purok Pinya</option>
                    <option value="Purok Lumboy">Purok Lumboy</option>
                    <option value="Purok Mangga">Purok Mangga</option>
                    <option value="Purok Tambis">Purok Tambis</option>
                    <option value="Purok Kaimito">Purok Kaimito</option>
                    <option value="Purok Bayabas">Purok Bayabas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Range</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g. 08:00 AM - 12:00 PM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Location *</label>
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g. Barangay Covered Court, Purok Pinya Health Center"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Description / Agenda *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide activity details, schedule, objectives, and reminders..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Organizer</label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    placeholder="e.g. Sangguniang Barangay"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Participant Slots</label>
                  <input
                    type="number"
                    value={formData.maxParticipants || 150}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value, 10) || 0 })}
                    placeholder="e.g. 150"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Requirements / Reminders for Residents</label>
                <input
                  type="text"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="e.g. Bring Valid ID, wear face mask, bring vaccination card"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Attendance and Roster Modal */}
      {selectedAttendanceActivity && (
        <ActivityAttendanceModal
          activity={selectedAttendanceActivity}
          onClose={() => setSelectedAttendanceActivity(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetActivity}
        title="Delete Community Activity"
        itemType="Community Activity"
        itemName={deleteTargetActivity ? `${deleteTargetActivity.title} (${deleteTargetActivity.date})` : undefined}
        description="Permanently delete this community event and all RSVP registrations from the calendar."
        confirmText="Yes, Delete Activity"
        onConfirm={() => {
          if (deleteTargetActivity) {
            deleteActivity(deleteTargetActivity.id);
          }
        }}
        onClose={() => setDeleteTargetActivity(null)}
      />
    </div>
  );
};

