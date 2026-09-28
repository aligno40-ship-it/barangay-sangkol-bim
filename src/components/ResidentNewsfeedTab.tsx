import React, { useMemo } from 'react';
import { RecentSearchesInput } from './RecentSearchesInput';
import {
  CalendarDays,
  FileCheck2,
  CalendarCheck,
  MapPin,
  Clock,
  CheckCircle2,
  Pin,
  Users,
  Search,
  Printer,
  RotateCcw,
  Sparkles,
  X,
  Check,
  Smartphone,
  ChevronRight,
  Briefcase,
  HeartHandshake,
  Building2,
  GraduationCap,
  Gift,
  ArrowRight,
} from 'lucide-react';
import {
  SystemUser,
  Resident,
  CommunityActivity,
  AnnouncementRecord,
  ActivityAttendee,
  AnnouncementAttendee,
  CertificateRecord,
  SMSAlertRecord,
} from '../types';
import { useCommunityServices } from '../context/CommunityServicesContext';
import { arePuroksMatching } from '../context/BarangayContext';
import { AyudaClaimStub } from '../types/residentServices';
import { getFormalResidentPhotoUrl, generateFormalIdPhotoSvg } from '../utils/imageUtils';

interface ResidentNewsfeedTabProps {
  currentUser: SystemUser;
  residentRecord?: Resident;
  effectivePurok: string;
  activities: CommunityActivity[];
  filteredFeedActivities: CommunityActivity[];
  announcements: AnnouncementRecord[];
  filteredFeedAnnouncements: AnnouncementRecord[];
  pinnedAnnouncements: AnnouncementRecord[];
  activityAttendees: ActivityAttendee[];
  announcementAttendees: AnnouncementAttendee[];
  userRegisteredActivities: CommunityActivity[];
  userPurokActivities: CommunityActivity[];
  userCertificates: CertificateRecord[];
  archivedCertificates: CertificateRecord[];
  userSMSAlerts: SMSAlertRecord[];
  newsfeedFilter: 'all' | 'purok' | 'registered' | 'advisories' | 'trabaho' | 'ayuda';
  setNewsfeedFilter: (filter: 'all' | 'purok' | 'registered' | 'advisories' | 'trabaho' | 'ayuda') => void;
  newsfeedSearch: string;
  setNewsfeedSearch: (search: string) => void;
  rsvpActivity: (activityId: string) => void;
  setSelectedActivityForAttendance: (act: CommunityActivity) => void;
  setSelectedAnnouncementForAttendance: (ann: AnnouncementRecord) => void;
  setSelectedCertForPrint: (cert: CertificateRecord) => void;
  setSelectedAlertForDetail: (alert: SMSAlertRecord) => void;
  registerForAnnouncement: (annId: string) => void;
  cancelAnnouncementRegistration: (annId: string) => void;
  setActiveTab: (tab: any) => void;
}

export const ResidentNewsfeedTab: React.FC<ResidentNewsfeedTabProps> = ({
  currentUser,
  residentRecord,
  effectivePurok,
  activities,
  filteredFeedActivities,
  announcements,
  filteredFeedAnnouncements,
  pinnedAnnouncements,
  activityAttendees,
  announcementAttendees,
  userRegisteredActivities,
  userPurokActivities,
  userCertificates,
  archivedCertificates,
  userSMSAlerts,
  newsfeedFilter,
  setNewsfeedFilter,
  newsfeedSearch,
  setNewsfeedSearch,
  rsvpActivity,
  setSelectedActivityForAttendance,
  setSelectedAnnouncementForAttendance,
  setSelectedCertForPrint,
  setSelectedAlertForDetail,
  registerForAnnouncement,
  cancelAnnouncementRegistration,
  setActiveTab,
}) => {
  const {
    jobPostings,
    livelihoodTrainings,
    ayudaClaims,
  } = useCommunityServices();

  // Filtered Job Postings for Newsfeed
  const filteredJobPostings = useMemo(() => {
    if (newsfeedFilter === 'registered' || newsfeedFilter === 'advisories' || newsfeedFilter === 'ayuda') {
      return [];
    }
    return (jobPostings || []).filter((job) => {
      if (!job.isActive) return false;
      if (newsfeedFilter === 'purok') {
        const jobLoc = (job.location || '').toLowerCase();
        const resPurok = (effectivePurok || '').toLowerCase();
        const matchesPurok = jobLoc.includes(resPurok) || jobLoc.includes('sangkol') || jobLoc.includes('all');
        if (!matchesPurok) return false;
      }
      if (newsfeedSearch.trim()) {
        const q = newsfeedSearch.toLowerCase().trim();
        const matchTitle = (job.title || '').toLowerCase().includes(q);
        const matchEmployer = (job.employerName || '').toLowerCase().includes(q);
        const matchLoc = (job.location || '').toLowerCase().includes(q);
        const matchDesc = (job.description || '').toLowerCase().includes(q);
        const matchType = (job.employmentType || '').toLowerCase().includes(q);
        if (!matchTitle && !matchEmployer && !matchLoc && !matchDesc && !matchType) return false;
      }
      return true;
    });
  }, [jobPostings, newsfeedFilter, newsfeedSearch, effectivePurok]);

  // Filtered Livelihood Trainings
  const filteredLivelihoodTrainings = useMemo(() => {
    if (newsfeedFilter === 'registered' || newsfeedFilter === 'advisories' || newsfeedFilter === 'ayuda') {
      return [];
    }
    return (livelihoodTrainings || []).filter((trn) => {
      if (trn.status === 'Completed') return false;
      if (newsfeedSearch.trim()) {
        const q = newsfeedSearch.toLowerCase().trim();
        const matchTitle = (trn.title || '').toLowerCase().includes(q);
        const matchAgency = (trn.partnerAgency || '').toLowerCase().includes(q);
        const matchVenue = (trn.venue || '').toLowerCase().includes(q);
        const matchDesc = (trn.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAgency && !matchVenue && !matchDesc) return false;
      }
      return true;
    });
  }, [livelihoodTrainings, newsfeedFilter, newsfeedSearch]);

  // Aggregated Ayuda & Relief Distributions
  const filteredAyudaDistributions = useMemo(() => {
    if (newsfeedFilter === 'advisories' || newsfeedFilter === 'trabaho') {
      return [];
    }
    const map = new Map<string, {
      id: string;
      title: string;
      category: string;
      targetPurok: string;
      claimLocation: string;
      distributionDate: string;
      timeSlot: string;
      itemsIncluded: string[];
      residentClaimStub?: AyudaClaimStub;
    }>();

    (ayudaClaims || []).forEach((c) => {
      const key = `${c.title}_${c.distributionDate}`;
      const isUserStub =
        (currentUser.residentId && c.residentId === currentUser.residentId) ||
        c.residentName.toLowerCase() === currentUser.name.toLowerCase() ||
        (residentRecord?.id && c.residentId === residentRecord.id);

      if (!map.has(key)) {
        map.set(key, {
          id: c.id,
          title: c.title,
          category: c.category,
          targetPurok: c.purok || 'All Puroks',
          claimLocation: c.claimLocation,
          distributionDate: c.distributionDate,
          timeSlot: c.timeSlot,
          itemsIncluded: c.itemsIncluded || [],
          residentClaimStub: isUserStub ? c : undefined,
        });
      } else if (isUserStub) {
        const existing = map.get(key)!;
        existing.residentClaimStub = c;
      }
    });

    const list = Array.from(map.values());

    return list.filter((dist) => {
      if (newsfeedFilter === 'registered') {
        return Boolean(dist.residentClaimStub);
      }
      if (newsfeedFilter === 'purok') {
        const matchesPurok = arePuroksMatching(dist.targetPurok, effectivePurok);
        if (!matchesPurok) return false;
      }
      if (newsfeedSearch.trim()) {
        const q = newsfeedSearch.toLowerCase().trim();
        const matchTitle = dist.title.toLowerCase().includes(q);
        const matchCat = dist.category.toLowerCase().includes(q);
        const matchLoc = dist.claimLocation.toLowerCase().includes(q);
        const matchItems = dist.itemsIncluded.some((item) => item.toLowerCase().includes(q));
        if (!matchTitle && !matchCat && !matchLoc && !matchItems) return false;
      }
      return true;
    });
  }, [ayudaClaims, currentUser, residentRecord, effectivePurok, newsfeedFilter, newsfeedSearch]);

  // Current resident's personal ayuda vouchers
  const userAyudaClaims = useMemo(() => {
    return (ayudaClaims || []).filter(
      (c) =>
        (currentUser.residentId && c.residentId === currentUser.residentId) ||
        c.residentName.toLowerCase() === currentUser.name.toLowerCase() ||
        (residentRecord?.id && c.residentId === residentRecord.id)
    );
  }, [ayudaClaims, currentUser, residentRecord]);

  const totalFeedItemsCount =
    filteredFeedActivities.length +
    filteredFeedAnnouncements.length +
    filteredJobPostings.length +
    filteredLivelihoodTrainings.length +
    filteredAyudaDistributions.length;

  return (
    <div className="space-y-6">
      {/* Welcome & Account Identity Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 shadow-xs flex items-center justify-center">
              <img
                src={getFormalResidentPhotoUrl(residentRecord, currentUser.avatar)}
                alt={currentUser.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = generateFormalIdPhotoSvg({
                    gender: residentRecord?.sex || currentUser.sex,
                    name: currentUser.name,
                    idNumber: residentRecord?.id || currentUser.residentId,
                  });
                }}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  Maayong Adlaw, {currentUser.name}!
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Citizen</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded-md">
                  <MapPin className="w-3 h-3 text-indigo-600" />
                  <span>Assigned to <strong>{effectivePurok}</strong></span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  ID: {residentRecord?.id || currentUser.residentId || 'BS-RES-2026-0099'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Quick Metrics Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <button
              type="button"
              onClick={() => setNewsfeedFilter('registered')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                newsfeedFilter === 'registered'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Filter to your registered activities"
            >
              <CalendarCheck className="w-4 h-4 text-indigo-500" />
              <span>My Events: <strong>{userRegisteredActivities.length}</strong></span>
            </button>

            <button
              type="button"
              onClick={() => setNewsfeedFilter('purok')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                newsfeedFilter === 'purok'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={`Filter to ${effectivePurok} activities`}
            >
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>{effectivePurok}: <strong>{userPurokActivities.length}</strong></span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer flex items-center gap-2"
              title="View your certificate requests"
            >
              <FileCheck2 className="w-4 h-4 text-amber-500" />
              <span>Requests: <strong>{userCertificates.length}</strong></span>
            </button>
          </div>
        </div>
      </div>

      {/* Urgent / Ready Document Notification Banner (Account Important Detail) */}
      {archivedCertificates.length > 0 && archivedCertificates[0] && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Approved Document Ready
                </span>
                <span className="font-mono text-xs font-bold text-emerald-900">
                  #{archivedCertificates[0].controlNumber}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {archivedCertificates[0].type} ({archivedCertificates[0].purpose})
              </p>
              <p className="text-[11px] text-slate-500">
                Ready for digital printing or pickup at Barangay Sangkol Hall.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCertForPrint(archivedCertificates[0])}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <span>All Docs ({archivedCertificates.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Emergency / Pinned Official Advisory Banner (if any) */}
      {pinnedAnnouncements.length > 0 && (() => {
        const pinnedAnn = pinnedAnnouncements[0];
        const attendees = announcementAttendees.filter((att) => att.announcementId === pinnedAnn.id);
        const isUserReg =
          Boolean(pinnedAnn.userRegistered) ||
          attendees.some(
            (att) =>
              (currentUser.residentId && att.residentId === currentUser.residentId) ||
              att.residentName.toLowerCase() === currentUser.name.toLowerCase()
          ) ||
          activities.some(
            (act) =>
              (act.title.toLowerCase().includes('general assembly') &&
                pinnedAnn.title.toLowerCase().includes('general assembly')) &&
              (act.userRsvpd ||
                activityAttendees.some(
                  (att) =>
                    att.activityId === act.id &&
                    ((currentUser.residentId && att.residentId === currentUser.residentId) ||
                      att.residentName.toLowerCase() === currentUser.name.toLowerCase())
                ))
          );

        return (
          <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                  <Pin className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      Priority Official Advisory
                    </span>
                    <span className="text-xs text-amber-800 font-semibold">
                      {pinnedAnn.publishDate}
                    </span>
                    <span className="text-xs text-slate-500">
                      Target: <strong>{pinnedAnn.targetAudience}</strong>
                    </span>
                    {isUserReg && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>You are Registered</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{pinnedAnn.title}</h3>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                    {pinnedAnn.content}
                  </p>
                </div>
              </div>

              {pinnedAnn.requiresRegistration && (
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => setSelectedAnnouncementForAttendance(pinnedAnn)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white rounded-xl border border-amber-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="View registered residents roster"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">Roster ({attendees.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isUserReg) {
                        cancelAnnouncementRegistration(pinnedAnn.id);
                        const matchingAct = activities.find(
                          (act) =>
                            act.title.toLowerCase().includes('general assembly') &&
                            pinnedAnn.title.toLowerCase().includes('general assembly')
                        );
                        if (matchingAct) {
                          const isActRsvpd =
                            matchingAct.userRsvpd ||
                            activityAttendees.some(
                              (att) =>
                                att.activityId === matchingAct.id &&
                                ((currentUser.residentId && att.residentId === currentUser.residentId) ||
                                  att.residentName.toLowerCase() === currentUser.name.toLowerCase())
                            );
                          if (isActRsvpd) {
                            rsvpActivity(matchingAct.id);
                          }
                        }
                      } else {
                        registerForAnnouncement(pinnedAnn.id);
                        const matchingAct = activities.find(
                          (act) =>
                            act.title.toLowerCase().includes('general assembly') &&
                            pinnedAnn.title.toLowerCase().includes('general assembly')
                        );
                        if (matchingAct) {
                          const isActRsvpd =
                            matchingAct.userRsvpd ||
                            activityAttendees.some(
                              (att) =>
                                att.activityId === matchingAct.id &&
                                ((currentUser.residentId && att.residentId === currentUser.residentId) ||
                                  att.residentName.toLowerCase() === currentUser.name.toLowerCase())
                            );
                          if (!isActRsvpd) {
                            rsvpActivity(matchingAct.id);
                          }
                        }
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs flex items-center gap-1.5 ${
                      isUserReg
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    {isUserReg ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Registered ✓</span>
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Register</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Newsfeed Controls & Filter Strip */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setNewsfeedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              newsfeedFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>All Feed ({activities.length + announcements.length + jobPostings.length + filteredAyudaDistributions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setNewsfeedFilter('trabaho')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              newsfeedFilter === 'trabaho'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-500" />
            <span>Trabaho & Jobs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
              {jobPostings.length + livelihoodTrainings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setNewsfeedFilter('ayuda')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              newsfeedFilter === 'ayuda'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
            <span>Ayuda & Relief</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
              {filteredAyudaDistributions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setNewsfeedFilter('purok')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              newsfeedFilter === 'purok'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>My Purok ({effectivePurok})</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {userPurokActivities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setNewsfeedFilter('registered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              newsfeedFilter === 'registered'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>My Registered Events</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {userRegisteredActivities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setNewsfeedFilter('advisories')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              newsfeedFilter === 'advisories'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Pin className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Bulletins ({announcements.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <RecentSearchesInput
          className="min-w-[240px]"
          value={newsfeedSearch}
          onChange={setNewsfeedSearch}
          placeholder="Search activities, jobs, ayuda distributions, dates..."
          storageKey="resident_newsfeed"
          theme="light"
          inputClassName="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 transition-all outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Newsfeed Content: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Activities Stream (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          {totalFeedItemsCount === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">No feed items found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {newsfeedFilter === 'registered'
                    ? "You haven't registered for any community activities or relief stubs yet. Browse 'All Feed', 'Trabaho & Jobs', or 'Ayuda & Relief'!"
                    : newsfeedFilter === 'trabaho'
                    ? 'No job openings or livelihood workshops match your current search.'
                    : newsfeedFilter === 'ayuda'
                    ? 'No ayuda or relief distributions match your current search.'
                    : 'No events, jobs, ayuda distributions, or announcements match your current filter or search criteria.'}
                </p>
              </div>
              {newsfeedFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setNewsfeedFilter('all');
                    setNewsfeedSearch('');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>View All Barangay Feed</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Activity Cards */}
              {filteredFeedActivities.map((act) => {
                const actAttendees = activityAttendees.filter((att) => att.activityId === act.id);
                const isUserAttending = actAttendees.some(
                  (att) =>
                    (currentUser.residentId && att.residentId === currentUser.residentId) ||
                    att.residentName.toLowerCase() === currentUser.name.toLowerCase()
                );
                const isUserRegistered = isUserAttending || act.userRsvpd;
                const isMyPurok =
                  act.targetPurok === 'All Puroks' ||
                  arePuroksMatching(act.targetPurok, effectivePurok);

                // Parse date for clean visual stamp
                const [y, m, d] = (act.date || '2026-01-01').split('-');
                const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                const monthIdx = parseInt(m, 10) - 1;
                const monthLabel = monthNames[monthIdx] || 'EVT';

                return (
                  <div
                    key={act.id}
                    className={`bg-white border rounded-2xl p-5 shadow-xs hover:border-indigo-300 transition-all space-y-4 ${
                      isUserRegistered
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-slate-200/90'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Clean Date Badge */}
                      <div className="shrink-0 flex sm:flex-col items-center justify-center p-2.5 sm:w-16 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 gap-1 sm:gap-0.5">
                        <span className="text-[10px] font-black tracking-wider uppercase text-indigo-600">
                          {monthLabel}
                        </span>
                        <span className="text-xl font-black text-indigo-950 leading-none">
                          {d || '01'}
                        </span>
                        <span className="text-[9px] font-semibold text-indigo-500/80">
                          {y || '2026'}
                        </span>
                      </div>

                      {/* Event Body */}
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {act.category}
                          </span>

                          {isMyPurok ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{act.targetPurok.includes('All') ? 'All Puroks' : `Target: ${effectivePurok}`}</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                              {act.targetPurok}
                            </span>
                          )}

                          {isUserRegistered && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>You are Registered</span>
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 ml-auto">
                            {act.status}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {act.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {act.description}
                        </p>

                        {/* Logistics info strip */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1">
                          <div className="flex items-center gap-1 text-indigo-700 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{act.time}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>{act.venue}</span>
                          </div>
                          {act.organizer && (
                            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                              <span>Lead: <strong>{act.organizer}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Action & Roster Bar */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span><strong>{actAttendees.length}</strong> Registered Resident{actAttendees.length === 1 ? '' : 's'}</span>
                        </span>
                        {act.maxAttendees && (
                          <span className="text-[11px] text-slate-400">
                            / {act.maxAttendees} slots
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedActivityForAttendance(act)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          title="View registered residents roster"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Roster</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => rsvpActivity(act.id)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            isUserRegistered
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {isUserRegistered ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Registered ✓</span>
                            </>
                          ) : (
                            <>
                              <CalendarCheck className="w-3.5 h-3.5" />
                              <span>Register to Attend</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bulletins / Announcements Stream (if filter includes them) */}
              {(newsfeedFilter === 'all' || newsfeedFilter === 'advisories') &&
                filteredFeedAnnouncements.map((ann) => {
                  const attendees = announcementAttendees.filter((att) => att.announcementId === ann.id);
                  const isUserReg =
                    Boolean(ann.userRegistered) ||
                    attendees.some(
                      (att) =>
                        (currentUser.residentId && att.residentId === currentUser.residentId) ||
                        att.residentName.toLowerCase() === currentUser.name.toLowerCase()
                    );

                  return (
                    <div
                      key={ann.id}
                      className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-xs space-y-3 hover:border-amber-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              {ann.category}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Posted: {ann.publishDate}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          Audience: {ann.targetAudience}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {ann.content}
                      </p>

                      {ann.requiresRegistration && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-600 font-semibold">
                            {attendees.length} Residents Registered
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedAnnouncementForAttendance(ann)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              View Roster
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isUserReg) {
                                  cancelAnnouncementRegistration(ann.id);
                                } else {
                                  registerForAnnouncement(ann.id);
                                }
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isUserReg
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-600 hover:bg-amber-700 text-white'
                              }`}
                            >
                              {isUserReg ? 'Registered ✓' : 'Register Attendance'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* TRABAHO & PESO JOB VACANCIES */}
              {(newsfeedFilter === 'all' || newsfeedFilter === 'trabaho') &&
                filteredJobPostings.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-blue-200/80 hover:border-blue-300 rounded-2xl p-5 shadow-xs transition-all space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-blue-600" />
                            <span>TRABAHO • JOB OPENING</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {job.employmentType}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {job.vacancies} Vacanc{job.vacancies > 1 ? 'ies' : 'y'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {job.title}
                        </h3>
                        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>{job.employerName}</span>
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left sm:text-right shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Offer Rate</span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">{job.salaryRange}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {job.description}
                    </p>

                    {job.qualifications && job.qualifications.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Qualifications:</span>
                        {job.qualifications.map((q, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium">
                            {q}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.location}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Deadline: <strong>{job.deadlineDate}</strong></span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('trabaho')}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Apply in Trabaho Hub</span>
                      </button>
                    </div>
                  </div>
                ))}

              {/* LIVELIHOOD & SKILLS TRAINING WORKSHOPS */}
              {(newsfeedFilter === 'all' || newsfeedFilter === 'trabaho') &&
                filteredLivelihoodTrainings.map((trn) => (
                  <div
                    key={trn.id}
                    className="bg-white border border-teal-200/80 hover:border-teal-300 rounded-2xl p-5 shadow-xs transition-all space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-teal-600" />
                            <span>LIVELIHOOD TRAINING • {trn.partnerAgency}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {trn.slotsAvailable}/{trn.slotsTotal} Slots Left
                          </span>
                          {trn.starterKitProvided && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Gift className="w-2.5 h-2.5" /> Starter Kit Included
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {trn.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Resource Person / Trainer: <strong>{trn.trainerName}</strong>
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left sm:text-right shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                        <span className="text-xs sm:text-sm font-black text-slate-900">{trn.duration}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {trn.description}
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
                          <span>Starts: <strong>{trn.startDate}</strong> ({trn.schedule})</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{trn.venue}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('trabaho')}
                        className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Enroll in Training</span>
                      </button>
                    </div>
                  </div>
                ))}

              {/* AYUDA & RELIEF DISTRIBUTIONS */}
              {(newsfeedFilter === 'all' || newsfeedFilter === 'ayuda' || newsfeedFilter === 'purok' || newsfeedFilter === 'registered') &&
                filteredAyudaDistributions.map((dist) => {
                  const hasClaimStub = Boolean(dist.residentClaimStub);
                  const isClaimed = dist.residentClaimStub?.status === 'Claimed / Released';

                  return (
                    <div
                      key={dist.id}
                      className={`bg-white border rounded-2xl p-5 shadow-xs transition-all space-y-3.5 ${
                        hasClaimStub
                          ? isClaimed
                            ? 'border-slate-300 bg-slate-50/50'
                            : 'border-emerald-300 bg-emerald-50/20'
                          : 'border-rose-200/80 hover:border-rose-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                              <HeartHandshake className="w-3 h-3 text-rose-600" />
                              <span>OFFICIAL AYUDA & RELIEF DISTRIBUTION</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {dist.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>Target: {dist.targetPurok}</span>
                            </span>
                            {hasClaimStub && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                  isClaimed
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>{isClaimed ? 'Claimed ✓' : 'Your Claim Voucher is Ready'}</span>
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {dist.title}
                          </h3>
                          <p className="text-xs text-slate-600">
                            Barangay Sangkol relief assistance program for registered families and qualified beneficiaries.
                          </p>
                        </div>

                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 text-left sm:text-right shrink-0">
                          <span className="text-[10px] uppercase font-bold text-rose-700 block">Distribution Date</span>
                          <span className="text-xs sm:text-sm font-black text-slate-900">{dist.distributionDate}</span>
                        </div>
                      </div>

                      {dist.itemsIncluded && dist.itemsIncluded.length > 0 && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Package Contents / Rations:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {dist.itemsIncluded.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 rounded-md text-xs font-medium"
                              >
                                ✓ {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-[11px]">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                            <span>Time Slot: {dist.timeSlot}</span>
                          </span>
                          <span className="flex items-center gap-1 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Venue: <strong>{dist.claimLocation}</strong></span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab('ayuda')}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            hasClaimStub && !isClaimed
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                        >
                          <HeartHandshake className="w-3.5 h-3.5" />
                          <span>{hasClaimStub ? 'View Digital QR Claim Stub' : 'View Ayuda Desk'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>

        {/* Right Column: Important Account Details Only */}
        <div className="space-y-5">
          {/* Card 1: My Registered Activities */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    My Registered Events ({userRegisteredActivities.length})
                  </h3>
                  <p className="text-[10px] text-slate-400">Activities you have confirmed to attend</p>
                </div>
              </div>
              {userRegisteredActivities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setNewsfeedFilter('registered')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  Filter Feed
                </button>
              )}
            </div>

            {userRegisteredActivities.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">No registered events yet</p>
                <p className="text-[11px] text-slate-400">
                  Click 'Register to Attend' on any activity to secure your attendance slot.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {userRegisteredActivities.slice(0, 3).map((act) => (
                  <div
                    key={act.id}
                    className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1 hover:border-emerald-200 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {act.date}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700">Confirmed ✓</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{act.title}</h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{act.venue}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Trabaho & PESO Quick Hub */}
          <div className="bg-white border border-blue-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Trabaho & PESO Desk ({jobPostings.length})
                  </h3>
                  <p className="text-[10px] text-slate-400">Local vacancies & livelihood training</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('trabaho')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {jobPostings.slice(0, 2).map((job) => (
                <div
                  key={job.id}
                  onClick={() => setActiveTab('trabaho')}
                  className="p-3 bg-blue-50/30 hover:bg-blue-50/70 border border-blue-100 rounded-xl space-y-1 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                      {job.employmentType}
                    </span>
                    <span className="text-[10px] font-bold font-mono text-slate-700">{job.salaryRange}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">{job.title}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{job.employerName} • {job.location}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('trabaho')}
              className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Explore All Jobs & Skills Training</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card: Ayuda & Calamity Relief Alerts */}
          <div className="bg-white border border-rose-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Ayuda & Relief Aid
                  </h3>
                  <p className="text-[10px] text-slate-400">Ration distribution & vouchers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ayuda')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Desk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {userAyudaClaims.length > 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Voucher Ready</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                    {userAyudaClaims[0].id}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                  {userAyudaClaims[0].title}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {userAyudaClaims[0].distributionDate} • {userAyudaClaims[0].timeSlot}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('ayuda')}
                  className="w-full mt-1.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  View QR Claim Stub
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-1">
                <p className="text-xs font-semibold text-slate-700">Relief Waves Active</p>
                <p className="text-[10px] text-slate-500">
                  Check scheduled distribution dates or request emergency financial assistance.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('ayuda')}
                  className="w-full mt-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Open Ayuda & Assistance Desk
                </button>
              </div>
            )}
          </div>

          {/* Card 2: My Document Applications & Clearances Status */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    My Clearance Requests
                  </h3>
                  <p className="text-[10px] text-slate-400">Status of your document applications</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Apply</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {userCertificates.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">No active clearance requests</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Request Barangay Clearance
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {userCertificates.slice(0, 2).map((cert) => {
                  const isReady = cert.status === 'Issued' || cert.status === 'Approved';
                  return (
                    <div
                      key={cert.id}
                      className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                        isReady
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-amber-50/60 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-slate-600">
                          {cert.controlNumber}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isReady
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {isReady ? 'READY' : 'IN REVIEW'}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs">{cert.type}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px] text-slate-500">
                        <span>{cert.purpose}</span>
                        {isReady && (
                          <button
                            type="button"
                            onClick={() => setSelectedCertForPrint(cert)}
                            className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                          >
                            Print
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 3: Direct SMS & Mobile Alerts Feed */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    SMS & Email Alerts ({userSMSAlerts.length})
                  </h3>
                  <p className="text-[10px] text-slate-400">Personal notices sent to your phone</p>
                </div>
              </div>
            </div>

            {userSMSAlerts.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                <p className="font-medium text-slate-600">No recent alerts</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  System notifications will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {userSMSAlerts.slice(0, 2).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlertForDetail(alert)}
                    className="p-3 bg-slate-50 hover:bg-sky-50/60 border border-slate-200/80 hover:border-sky-300 rounded-xl transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                        {alert.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {alert.timestamp.slice(11, 16)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{alert.subject}</p>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {alert.smsMessage}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: Quick Barangay Contact & Tanod Desk */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Barangay Sangkol Desk
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                24/7 Hotline
              </span>
            </div>
            <p className="text-xs text-slate-300">
              For immediate assistance, security escort, or emergency response:
            </p>
            <div className="pt-1 flex items-center justify-between font-mono text-xs text-amber-300">
              <span>Hotline: (082) 299-4455</span>
              <button
                type="button"
                onClick={() => setActiveTab('concerns')}
                className="text-[11px] text-indigo-300 hover:text-indigo-200 underline font-sans font-bold cursor-pointer"
              >
                File Concern →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
