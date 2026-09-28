import React, { useState, useMemo } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { AnnouncementRecord } from '../types';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { AnnouncementAttendanceModal } from '../components/AnnouncementAttendanceModal';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { InfoButton } from '../components/InfoButton';
import {
  Megaphone,
  Plus,
  Calendar,
  Pin,
  Users,
  Edit2,
  Trash2,
  X,
  Tag,
  Shield,
  Info,
  Lock,
  UserCheck,
  UserPlus,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Search,
  Filter,
  Check,
  ChevronRight,
  Printer,
  Radio,
  Smartphone,
  Send,
} from 'lucide-react';

export const AnnouncementsView: React.FC = () => {
  const {
    announcements,
    announcementAttendees,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    registerForAnnouncement,
    cancelAnnouncementRegistration,
    currentUser,
    settings,
    broadcastEmergencyAlert,
    setIsSMSDispatchModalOpen,
  } = useBarangay();

  const isResident = currentUser.role === 'Resident';
  const canManage =
    currentUser.role === 'Administrator' ||
    currentUser.role === 'Barangay Staff' ||
    currentUser.role === 'Barangay Official';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnounce, setEditingAnnounce] = useState<AnnouncementRecord | null>(null);
  const [deleteTargetAnnounce, setDeleteTargetAnnounce] = useState<AnnouncementRecord | null>(null);
  const [selectedAttendanceAnnounce, setSelectedAttendanceAnnounce] = useState<AnnouncementRecord | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [registrationOnlyFilter, setRegistrationOnlyFilter] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const initialForm: Omit<AnnouncementRecord, 'id' | 'publishDate'> = {
    title: '',
    content: '',
    category: 'Barangay Assembly',
    targetAudience: 'All Residents',
    isPinned: false,
    author: currentUser.name,
    status: 'Active',
    eventDate: '2026-03-15',
    eventTime: '8:00 AM - 12:00 PM',
    venue: 'Barangay Sangkol Covered Court',
    requiresRegistration: true,
    maxSlots: 100,
    attendeesCount: 0,
  };

  const [formData, setFormData] = useState(initialForm);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    if (isResident) return;
    setEditingAnnounce(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: AnnouncementRecord) => {
    if (isResident) return;
    setEditingAnnounce(a);
    setFormData({
      title: a.title,
      content: a.content,
      category: a.category,
      targetAudience: a.targetAudience,
      isPinned: a.isPinned,
      author: a.author,
      status: a.status,
      eventDate: a.eventDate || '',
      eventTime: a.eventTime || '',
      venue: a.venue || '',
      requiresRegistration: a.requiresRegistration ?? false,
      maxSlots: a.maxSlots || 0,
      attendeesCount: a.attendeesCount || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isResident) {
      alert('Residents have read-only access to Barangay Announcements and cannot create or edit posts.');
      return;
    }
    if (!formData.title || !formData.content) {
      alert('Title and Content are required.');
      return;
    }

    if (editingAnnounce) {
      updateAnnouncement(editingAnnounce.id, formData);
      showToast(`Updated announcement "${formData.title}".`);
    } else {
      addAnnouncement({
        ...formData,
        publishDate: new Date().toISOString().split('T')[0],
      });
      showToast(`Published new announcement "${formData.title}".`);
    }
    setIsModalOpen(false);
  };

  // Latest announcement for highlighted hero / attendance banner
  const latestAnnouncement = useMemo(() => {
    return announcements[0] || null;
  }, [announcements]);

  // Live attendees for latest announcement
  const latestAnnouncementAttendees = useMemo(() => {
    if (!latestAnnouncement) return [];
    return announcementAttendees.filter((att) => att.announcementId === latestAnnouncement.id);
  }, [announcementAttendees, latestAnnouncement]);

  const isUserRegisteredForLatest = useMemo(() => {
    if (!latestAnnouncement || !isResident) return false;
    return latestAnnouncementAttendees.some(
      (att) =>
        (currentUser.residentId && att.residentId === currentUser.residentId) ||
        att.residentName.toLowerCase() === currentUser.name.toLowerCase()
    );
  }, [latestAnnouncementAttendees, latestAnnouncement, isResident, currentUser]);

  const handleResidentRegistration = (announcementId: string, title: string) => {
    const isReg = announcementAttendees.some(
      (att) =>
        att.announcementId === announcementId &&
        ((currentUser.residentId && att.residentId === currentUser.residentId) ||
          att.residentName.toLowerCase() === currentUser.name.toLowerCase())
    );

    if (isReg) {
      const res = cancelAnnouncementRegistration(announcementId);
      if (res.success) {
        showToast(`Registration cancelled for "${title}".`, 'info');
      }
    } else {
      const res = registerForAnnouncement(announcementId);
      if (res.success) {
        showToast(`You have successfully registered for "${title}"!`);
      } else {
        showToast(res.message, 'info');
      }
    }
  };

  // Filtered announcements list
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchContent = a.content.toLowerCase().includes(q);
        const matchVenue = (a.venue || '').toLowerCase().includes(q);
        const matchAuthor = (a.author || '').toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchVenue && !matchAuthor) return false;
      }
      if (categoryFilter !== 'All' && a.category !== categoryFilter) {
        return false;
      }
      if (registrationOnlyFilter && !a.requiresRegistration) {
        return false;
      }
      return true;
    });
  }, [announcements, searchQuery, categoryFilter, registrationOnlyFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-60 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 border-emerald-500 text-emerald-100'
              : 'bg-indigo-900 border-indigo-500 text-indigo-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <Megaphone className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            <span>Community Announcements & Public Advisories</span>
            <InfoButton
              title="Announcements & Bulletins"
              info={
                isResident
                  ? 'Official broadcasts, assembly notices, health advisories, and emergency alerts published by the Sangguniang Barangay.'
                  : 'Publish official broadcasts, barangay assembly notices, vaccination drives, and monitor resident attendance rosters.'
              }
              variant="light"
            />
          </h2>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSMSDispatchModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-950/40 cursor-pointer transition-all active:scale-95 border border-sky-400/30"
              title="Broadcast Emergency SMS & Email Advisories to all Puroks"
            >
              <Radio className="w-4 h-4 text-sky-200 animate-pulse" />
              <span>SMS / Email Broadcast</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Post Announcement</span>
            </button>
          </div>
        )}
      </div>

      {/* Read-Only Notice for Residents */}
      {isResident && (
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 rounded-xl">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Official Barangay Bulletin & Citizen Attendance Portal</p>
              <p className="text-[11px] text-slate-400">
                Register directly for assemblies, medical missions, and barangay activities to confirm your reserved attendance slot subject to venue capacity.
              </p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full shrink-0">
            <Lock className="w-3 h-3" /> Citizen Registered Access
          </span>
        </div>
      )}

      {/* FEATURED: Latest Announcement & Live Attendance Tracking Spotlight */}
      {latestAnnouncement && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Latest Published Announcement</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
                {latestAnnouncement.category}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Published: {latestAnnouncement.publishDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Left: Headline & Body */}
            <div className="lg:col-span-2 space-y-2.5">
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                {latestAnnouncement.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
                {latestAnnouncement.content}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                {latestAnnouncement.eventDate && (
                  <span className="flex items-center gap-1 font-semibold text-amber-300">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Event Date: {latestAnnouncement.eventDate}</span>
                  </span>
                )}
                {latestAnnouncement.eventTime && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{latestAnnouncement.eventTime}</span>
                  </span>
                )}
                {latestAnnouncement.venue && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{latestAnnouncement.venue}</span>
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Audience: <strong>{latestAnnouncement.targetAudience}</strong></span>
                </span>
              </div>
            </div>

            {/* Right: Live Attendance Statistics & Admin Direct Actions */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-inner flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Attendance Status</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                    Live Registry
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 text-center">
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Registered</p>
                    <p className="text-xl font-black text-white mt-0.5">
                      {latestAnnouncementAttendees.length}
                    </p>
                    {latestAnnouncement.maxSlots ? (
                      <p className="text-[9px] text-slate-500">of {latestAnnouncement.maxSlots} slots</p>
                    ) : null}
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-emerald-500/20">
                    <p className="text-[10px] uppercase font-bold text-emerald-400">Present / Walk-In</p>
                    <p className="text-xl font-black text-emerald-300 mt-0.5">
                      {
                        latestAnnouncementAttendees.filter(
                          (a) => a.attendanceStatus === 'Present / Attended' || a.attendanceStatus === 'Walk-In'
                        ).length
                      }
                    </p>
                    <p className="text-[9px] text-emerald-400/80">Confirmed on-site</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {canManage ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedAttendanceAnnounce(latestAnnouncement)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                    >
                      <Users className="w-4 h-4" />
                      <span>View Registrants & Attendance ({latestAnnouncementAttendees.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    {latestAnnouncement.requiresRegistration ? (
                      <button
                        onClick={() => handleResidentRegistration(latestAnnouncement.id, latestAnnouncement.title)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                          isUserRegisteredForLatest
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        }`}
                      >
                        {isUserRegisteredForLatest ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>✓ You are Registered (Click to Cancel)</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span>Register Attendance for this Event</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="text-center text-[11px] text-slate-400 py-1">
                        Open Public Notice (No pre-registration required)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <RecentSearchesInput
          className="flex-1 w-full"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search announcement titles, topics, venue, or author..."
          storageKey="announcements"
          theme="dark"
          inputClassName="w-full pl-9 pr-8 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white font-medium cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Barangay Assembly">Barangay Assembly</option>
            <option value="Health Advisory">Health Advisory</option>
            <option value="Ayuda / Distribution">Ayuda / Distribution</option>
            <option value="SK / Youth Activity">SK / Youth Activity</option>
            <option value="Emergency / Weather">Emergency / Weather</option>
            <option value="Peace & Order">Peace & Order</option>
            <option value="General Notice">General Notice</option>
          </select>

          <button
            onClick={() => setRegistrationOnlyFilter(!registrationOnlyFilter)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              registrationOnlyFilter
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-950/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Registration Required</span>
          </button>
        </div>
      </div>

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAnnouncements.map((a) => {
          const attendees = announcementAttendees.filter((att) => att.announcementId === a.id);
          const isUserReg =
            isResident &&
            attendees.some(
              (att) =>
                (currentUser.residentId && att.residentId === currentUser.residentId) ||
                att.residentName.toLowerCase() === currentUser.name.toLowerCase()
            );

          return (
            <div
              key={a.id}
              className={`bg-slate-900 p-5 rounded-2xl border transition-all space-y-4 shadow-md flex flex-col justify-between ${
                a.isPinned ? 'border-amber-500/50 bg-gradient-to-br from-slate-900 to-amber-950/20' : 'border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {a.isPinned && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Pin className="w-3 h-3" /> PINNED NOTICE
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold">
                        {a.category}
                      </span>
                      {a.requiresRegistration && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Registration Open
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">{a.title}</h3>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(a)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer transition-colors"
                        title="Edit Announcement"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {currentUser.role === 'Administrator' && (
                        <button
                          onClick={() => setDeleteTargetAnnounce(a)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer transition-colors"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {a.content}
                </div>

                {/* Event Schedule & Location Details */}
                {(a.eventDate || a.venue) && (
                  <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                    {a.eventDate && (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{a.eventDate}</span>
                        {a.eventTime && <span className="text-slate-400">({a.eventTime})</span>}
                      </span>
                    )}
                    {a.venue && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span className="line-clamp-1">{a.venue}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer: Attendees Count, Audience, and Registration Action */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Audience: <strong>{a.targetAudience}</strong></span>
                  </span>
                  <span>Posted: {a.publishDate}</span>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {canManage ? (
                    <button
                      onClick={() => setSelectedAttendanceAnnounce(a)}
                      className="w-full py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        View Registrants & Attendance ({attendees.length}
                        {a.maxSlots ? ` / ${a.maxSlots}` : ''})
                      </span>
                    </button>
                  ) : (
                    <>
                      {a.requiresRegistration ? (
                        <button
                          onClick={() => handleResidentRegistration(a.id, a.title)}
                          className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isUserReg
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                          }`}
                        >
                          {isUserReg ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>✓ You are Registered (Cancel)</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Register for Event ({attendees.length} Attending)</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic py-1">
                          General Public Announcement
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden text-slate-100">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <span>{editingAnnounce ? 'Edit Announcement' : 'Create Public Notice & Attendance Tracker'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Title / Headline *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 1st Semester Barangay Assembly & Ayuda Distribution"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Barangay Assembly">Barangay Assembly</option>
                    <option value="Health Advisory">Health Advisory</option>
                    <option value="Ayuda / Distribution">Ayuda / Distribution</option>
                    <option value="SK / Youth Activity">SK / Youth Activity</option>
                    <option value="Emergency / Weather">Emergency / Weather</option>
                    <option value="Peace & Order">Peace & Order</option>
                    <option value="General Notice">General Notice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="All Residents">All Residents</option>
                    <option value="Senior Citizens">Senior Citizens</option>
                    <option value="4Ps Beneficiaries">4Ps Beneficiaries</option>
                    <option value="PWD">PWD</option>
                    <option value="Youth">Youth</option>
                    <option value="Business Owners">Business Owners</option>
                    <option value="Purok Leaders">Purok Leaders</option>
                  </select>
                </div>
              </div>

              {/* Event Date, Time, Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Event Time</label>
                  <input
                    type="text"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    placeholder="e.g. 8:00 AM - 12:00 PM"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Max Capacity / Slots</label>
                  <input
                    type="number"
                    value={formData.maxSlots || ''}
                    onChange={(e) => setFormData({ ...formData, maxSlots: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 100 (0 for unlimited)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Event Venue / Location</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g. Barangay Sangkol Covered Court"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Content / Body *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Details of the announcement, agenda, guidelines, and instructions..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresRegistration}
                    onChange={(e) => setFormData({ ...formData, requiresRegistration: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 cursor-pointer"
                  />
                  <span className="font-semibold text-emerald-400">
                    Enable Resident Pre-Registration & Attendance Tracking
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                  />
                  <span>Pin this notice to top of dashboard & portal banner</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  {editingAnnounce ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance & Registrants Modal */}
      {selectedAttendanceAnnounce && (
        <AnnouncementAttendanceModal
          announcement={selectedAttendanceAnnounce}
          onClose={() => setSelectedAttendanceAnnounce(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetAnnounce}
        title="Delete Public Announcement"
        itemType="Announcement"
        itemName={deleteTargetAnnounce ? deleteTargetAnnounce.title : undefined}
        description="Permanently delete this public announcement and advisory broadcast from the barangay bulletin board."
        confirmText="Yes, Delete Announcement"
        onConfirm={() => {
          if (deleteTargetAnnounce) {
            deleteAnnouncement(deleteTargetAnnounce.id);
            showToast('Announcement deleted.');
          }
        }}
        onClose={() => setDeleteTargetAnnounce(null)}
      />
    </div>
  );
};

