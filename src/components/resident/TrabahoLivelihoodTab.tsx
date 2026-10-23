import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  GraduationCap,
  Building,
  MapPin,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  Plus,
  X,
  Send,
  Search,
  Award,
  Sparkles,
  ExternalLink,
  BookOpen,
  FileCheck2,
  Calendar,
  Upload,
  FileText,
  Paperclip,
  Trash2,
  Eye,
  Check,
} from 'lucide-react';
import {
  CommunityJobPosting,
  JobApplicationRecord,
  LivelihoodTrainingWorkshop,
  LivelihoodEnrollmentRecord,
} from '../../types/residentServices';
import { useCommunityServices } from '../../context/CommunityServicesContext';
import { AttachedDocumentModal, DocumentViewerData } from '../community/AttachedDocumentModal';
import { isResidentRecordOwner } from '../../utils/residentAccountFilter';
import { RecentSearchesInput } from '../RecentSearchesInput';

interface TrabahoLivelihoodTabProps {
  residentId: string;
  residentName: string;
  contactNumber: string;
  purok: string;
}

export const TrabahoLivelihoodTab: React.FC<TrabahoLivelihoodTabProps> = ({
  residentId,
  residentName,
  contactNumber,
  purok,
}) => {
  const {
    jobPostings,
    jobApplications: applications,
    livelihoodTrainings: trainings,
    livelihoodEnrollments: enrollments,
    submitJobApplication,
    enrollInLivelihoodTraining,
  } = useCommunityServices();

  const residentIdentity = useMemo(
    () => ({ residentId, name: residentName, contactNumber }),
    [residentId, residentName, contactNumber]
  );

  // STRICT RESIDENT ACCOUNT FILTERING
  const myApplications = useMemo(() => {
    return (applications || []).filter((a) =>
      isResidentRecordOwner(
        {
          residentId: a.residentId,
          residentName: a.residentName,
          contactNumber: a.contactNumber,
        },
        residentIdentity
      )
    );
  }, [applications, residentIdentity]);

  const myEnrollments = useMemo(() => {
    return (enrollments || []).filter((e) =>
      isResidentRecordOwner(
        {
          residentId: e.residentId,
          residentName: e.residentName,
          contactNumber: e.contactNumber,
        },
        residentIdentity
      )
    );
  }, [enrollments, residentIdentity]);

  const [activeSubTab, setActiveSubTab] = useState<'job_board' | 'livelihood_skills'>('job_board');
  const [searchQuery, setSearchQuery] = useState('');

  // Job Application Modal State
  const [selectedJobForApply, setSelectedJobForApply] = useState<CommunityJobPosting | null>(null);
  const [experienceSummary, setExperienceSummary] = useState('');
  const [educationLevel, setEducationLevel] = useState('College Graduate');
  const [jobCoverLetterText, setJobCoverLetterText] = useState('');
  const [jobResumeFileName, setJobResumeFileName] = useState('');
  const [jobResumeFileData, setJobResumeFileData] = useState('');
  const [jobLetterFileName, setJobLetterFileName] = useState('');
  const [jobLetterFileData, setJobLetterFileData] = useState('');

  // Livelihood Enrollment Modal State
  const [selectedTrainingForEnroll, setSelectedTrainingForEnroll] = useState<LivelihoodTrainingWorkshop | null>(null);
  const [livelihoodEducation, setLivelihoodEducation] = useState('High School Graduate');
  const [livelihoodOccupation, setLivelihoodOccupation] = useState('Unemployed / Seeking Work');
  const [livelihoodIntentReason, setLivelihoodIntentReason] = useState('');
  const [livelihoodLetterText, setLivelihoodLetterText] = useState('');
  const [livelihoodResumeFileName, setLivelihoodResumeFileName] = useState('');
  const [livelihoodResumeFileData, setLivelihoodResumeFileData] = useState('');
  const [livelihoodLetterFileName, setLivelihoodLetterFileName] = useState('');
  const [livelihoodLetterFileData, setLivelihoodLetterFileData] = useState('');
  const [agreedToCommitment, setAgreedToCommitment] = useState(true);

  // Document Viewer Modal State
  const [viewerData, setViewerData] = useState<DocumentViewerData | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // File Upload Handlers
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFileName: (name: string) => void,
    setFileData: (data: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForApply) return;

    submitJobApplication({
      jobId: selectedJobForApply.id,
      jobTitle: selectedJobForApply.title,
      employerName: selectedJobForApply.employerName,
      residentId,
      residentName,
      contactNumber,
      educationalAttainment: educationLevel,
      workExperience: experienceSummary || 'Resident qualified candidate',
      resumeFileName: jobResumeFileName || undefined,
      resumeFileData: jobResumeFileData || undefined,
      applicationLetterFileName: jobLetterFileName || undefined,
      applicationLetterFileData: jobLetterFileData || undefined,
      applicationLetterText: jobCoverLetterText || undefined,
    });

    setSuccessMessage(`✓ Application for "${selectedJobForApply.title}" submitted to ${selectedJobForApply.employerName} with attached documents! It is now visible to Barangay PESO.`);
    setSelectedJobForApply(null);
    setExperienceSummary('');
    setJobCoverLetterText('');
    setJobResumeFileName('');
    setJobResumeFileData('');
    setJobLetterFileName('');
    setJobLetterFileData('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  const handleOpenEnrollModal = (training: LivelihoodTrainingWorkshop) => {
    // Check if already enrolled
    if (enrollments.some((e) => e.trainingId === training.id && (e.residentId === residentId || e.residentName === residentName))) {
      setSuccessMessage(`You are already enrolled in "${training.title}".`);
      setTimeout(() => setSuccessMessage(''), 5000);
      return;
    }
    setSelectedTrainingForEnroll(training);
    setLivelihoodIntentReason(`I want to gain hands-on skills in ${training.title} to start a home livelihood micro-venture and support my family.`);
    setLivelihoodLetterText(`To the Barangay Livelihood & Skills Committee,\n\nI, ${residentName} of ${purok}, respectfully submit my application for the "${training.title}" workshop. I commit to completing the full training curriculum and applying the knowledge for community productivity.\n\nThank you.`);
  };

  const handleEnrollTrainingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainingForEnroll) return;

    enrollInLivelihoodTraining({
      trainingId: selectedTrainingForEnroll.id,
      trainingTitle: selectedTrainingForEnroll.title,
      residentId,
      residentName,
      contactNumber,
      purok,
      educationalBackground: livelihoodEducation,
      currentOccupation: livelihoodOccupation,
      intentReason: livelihoodIntentReason,
      resumeFileName: livelihoodResumeFileName || undefined,
      resumeFileData: livelihoodResumeFileData || undefined,
      applicationLetterFileName: livelihoodLetterFileName || undefined,
      applicationLetterFileData: livelihoodLetterFileData || undefined,
      applicationLetterText: livelihoodLetterText || undefined,
    });

    setSuccessMessage(`✓ Enrolled successfully in "${selectedTrainingForEnroll.title}" with submitted credentials! Orientation & starter kit claim passes are now registered at Barangay Livelihood Desk.`);
    setSelectedTrainingForEnroll(null);
    setLivelihoodResumeFileName('');
    setLivelihoodResumeFileData('');
    setLivelihoodLetterFileName('');
    setLivelihoodLetterFileData('');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  const filteredJobs = jobPostings.filter(
    (j) =>
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.employerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Employment & Skills Development
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-slate-200">
              Barangay Trabaho Desk
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Barangay Trabaho & Livelihood Matching Desk
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/90 mt-1 max-w-2xl">
            Discover verified local job vacancies across commercial establishments in Sangkol, or enroll in free TESDA & DTI livelihood certification programs with digital resume & application letter attachments.
          </p>
        </div>

        <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-center shrink-0 self-start md:self-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Active Opportunities</p>
          <p className="text-lg font-black text-white">{jobPostings.length} Jobs • {trainings.length} Trainings</p>
        </div>
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

      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('job_board')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'job_board'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Local Job Openings</span>
            {jobPostings.length > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
                {jobPostings.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('livelihood_skills')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'livelihood_skills'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>TESDA & Skills Trainings</span>
            {trainings.length > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
                {trainings.length}
              </span>
            )}
          </button>
        </div>

        <div className="hidden sm:block w-64">
          <RecentSearchesInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search jobs, skills, employer..."
            storageKey="resident_trabaho"
            theme="light"
            inputClassName="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {activeSubTab === 'job_board' ? (
        <div className="space-y-4">
          {/* Active Job Postings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => {
              const hasApplied = myApplications.some((a) => a.jobId === job.id);
              return (
                <div key={job.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                        {job.employmentType}
                      </span>
                      <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {job.salaryRange}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{job.title}</h3>
                      <p className="text-xs font-semibold text-amber-900 mt-0.5 flex items-center gap-1">
                        <Building className="w-3 h-3 text-amber-700" />
                        <span>{job.employerName}</span>
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {job.description}
                    </p>

                    <div className="space-y-1 pt-1 text-[11px] text-slate-500">
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{job.location}</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-indigo-500" />
                        <span>{job.vacancies} open slot(s)</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">Until: {job.deadlineDate}</span>
                    {hasApplied ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Applied
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedJobForApply(job)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Apply with Resume</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* User's Submitted Applications Tracker */}
          {myApplications.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs mt-6">
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-600" />
                  <span>Your Job Applications & Employer Response Tracker</span>
                </h3>
                <span className="text-xs text-slate-500">{myApplications.length} submitted</span>
              </div>

              <div className="divide-y divide-slate-100">
                {myApplications.map((app) => (
                  <div key={app.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {app.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{app.jobTitle}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">Employer: {app.employerName} • {app.educationalAttainment}</p>
                      
                      {/* Attached Documents Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {app.resumeFileName ? (
                          <button
                            type="button"
                            onClick={() =>
                              setViewerData({
                                documentType: 'Resume / Bio-Data',
                                applicantName: app.residentName,
                                contactNumber: app.contactNumber,
                                targetTitle: app.jobTitle,
                                targetCategory: 'Job Application',
                                employerOrAgency: app.employerName,
                                appliedDate: app.appliedDate,
                                fileName: app.resumeFileName,
                                fileData: app.resumeFileData,
                                educationalAttainment: app.educationalAttainment,
                                experienceOrBackground: app.workExperience,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-indigo-200 transition-colors"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>Resume: {app.resumeFileName}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No external resume attached</span>
                        )}

                        {(app.applicationLetterFileName || app.applicationLetterText) && (
                          <button
                            type="button"
                            onClick={() =>
                              setViewerData({
                                documentType: 'Application Letter',
                                applicantName: app.residentName,
                                contactNumber: app.contactNumber,
                                targetTitle: app.jobTitle,
                                targetCategory: 'Job Application',
                                employerOrAgency: app.employerName,
                                appliedDate: app.appliedDate,
                                fileName: app.applicationLetterFileName,
                                fileData: app.applicationLetterFileData,
                                letterText: app.applicationLetterText,
                                educationalAttainment: app.educationalAttainment,
                                experienceOrBackground: app.workExperience,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-amber-200 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Application Letter</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-xs text-slate-400 font-mono shrink-0">
                      Applied: {app.appliedDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainings.map((trn) => {
              const isEnrolled = myEnrollments.some((e) => e.trainingId === trn.id);
              return (
                <div key={trn.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                        {trn.partnerAgency}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {trn.slotsAvailable} / {trn.slotsTotal} slots
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{trn.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{trn.description}</p>

                    <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-xs border border-slate-100">
                      <p className="flex items-center gap-1 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-medium">{trn.schedule}</span>
                      </p>
                      <p className="flex items-center gap-1 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Duration: {trn.duration}</span>
                      </p>
                      <p className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>Venue: {trn.venue}</span>
                      </p>
                      {trn.starterKitProvided && (
                        <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 pt-0.5">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Includes Free Livelihood Starter Toolset & Certification</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Starts: {trn.startDate}</span>
                    {isEnrolled ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Enrolled
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenEnrollModal(trn)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Apply for Livelihood Course</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* User's Enrolled Trainings */}
          {myEnrollments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs mt-6">
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Your Enrolled Livelihood & Certification Programs</span>
                </h3>
                <span className="text-xs text-slate-500">{myEnrollments.length} enrolled</span>
              </div>

              <div className="divide-y divide-slate-100">
                {myEnrollments.map((enr) => (
                  <div key={enr.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {enr.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{enr.trainingTitle}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {enr.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Enrollee: {enr.residentName} • {enr.purok} {enr.currentOccupation ? `• ${enr.currentOccupation}` : ''}
                      </p>

                      {/* Attached Documents Badges for Livelihood */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {enr.resumeFileName ? (
                          <button
                            type="button"
                            onClick={() =>
                              setViewerData({
                                documentType: 'Resume / Bio-Data',
                                applicantName: enr.residentName,
                                contactNumber: enr.contactNumber,
                                purok: enr.purok,
                                targetTitle: enr.trainingTitle,
                                targetCategory: 'Livelihood Workshop',
                                appliedDate: enr.enrolledDate,
                                fileName: enr.resumeFileName,
                                fileData: enr.resumeFileData,
                                educationalAttainment: enr.educationalBackground,
                                experienceOrBackground: enr.intentReason,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-indigo-200 transition-colors"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>Resume: {enr.resumeFileName}</span>
                          </button>
                        ) : null}

                        {(enr.applicationLetterFileName || enr.applicationLetterText || enr.intentReason) && (
                          <button
                            type="button"
                            onClick={() =>
                              setViewerData({
                                documentType: 'Application Letter',
                                applicantName: enr.residentName,
                                contactNumber: enr.contactNumber,
                                purok: enr.purok,
                                targetTitle: enr.trainingTitle,
                                targetCategory: 'Livelihood Workshop',
                                appliedDate: enr.enrolledDate,
                                fileName: enr.applicationLetterFileName,
                                fileData: enr.applicationLetterFileData,
                                letterText: enr.applicationLetterText || enr.intentReason,
                                educationalAttainment: enr.educationalBackground,
                                experienceOrBackground: enr.intentReason,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-emerald-200 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Application Letter / Intent</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-xs text-slate-400 font-mono shrink-0">
                      Enrolled: {enr.enrolledDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= APPLY FOR JOB MODAL ================= */}
      {selectedJobForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Submit Job Application</h3>
                  <p className="text-xs text-slate-500">{selectedJobForApply.title} • {selectedJobForApply.employerName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForApply(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyJob} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Applicant Resident</label>
                  <input
                    type="text"
                    readOnly
                    value={residentName}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    readOnly
                    value={contactNumber}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Highest Educational Attainment *</label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    <option value="College Graduate">College Graduate</option>
                    <option value="College Undergraduate">College Undergraduate</option>
                    <option value="Vocational / TESDA NC II">Vocational / TESDA NC II Certified</option>
                    <option value="Senior High School Graduate">Senior High School Graduate</option>
                    <option value="High School Graduate">High School Graduate</option>
                    <option value="Elementary Graduate">Elementary Graduate</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Position Target</label>
                  <input
                    type="text"
                    readOnly
                    value={selectedJobForApply.title}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Experience & Relevant Skills *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe your previous jobs, customer service experience, technical skills, or certifications..."
                  value={experienceSummary}
                  onChange={(e) => setExperienceSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              {/* Upload Resume / CV Document */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    Upload Resume / CV / Bio-Data
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">PDF, DOCX, JPG, PNG (Max 10MB)</span>
                </div>

                {jobResumeFileName ? (
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileCheck2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-indigo-950 truncate text-[11px]">{jobResumeFileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setJobResumeFileName('');
                        setJobResumeFileData('');
                      }}
                      className="p-1 hover:bg-indigo-200/60 rounded-lg text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/40 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="font-bold text-slate-700 text-xs">Click to browse or drag & drop Resume</span>
                    <span className="text-[10px] text-slate-400">Attached files will be forwarded directly to employer</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setJobResumeFileName, setJobResumeFileData)}
                    />
                  </label>
                )}
              </div>

              {/* Upload Application Letter OR Write Text */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    Upload Application Letter / Cover Letter
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Optional</span>
                </div>

                {jobLetterFileName ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileCheck2 className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="font-bold text-amber-950 truncate text-[11px]">{jobLetterFileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setJobLetterFileName('');
                        setJobLetterFileData('');
                      }}
                      className="p-1 hover:bg-amber-200/60 rounded-lg text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/40 rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700 text-xs">Upload Letter File (.pdf, .docx, .png)</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setJobLetterFileName, setJobLetterFileData)}
                      />
                    </label>

                    <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1">Or type application letter message:</p>
                      <textarea
                        rows={2}
                        placeholder="Dear Hiring Manager, I am writing to express my eager interest in..."
                        value={jobCoverLetterText}
                        onChange={(e) => setJobCoverLetterText(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedJobForApply(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LIVELIHOOD WORKSHOP ENROLLMENT & APPLICATION MODAL ================= */}
      {selectedTrainingForEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Livelihood Training Application</h3>
                  <p className="text-xs text-slate-500">{selectedTrainingForEnroll.title} • {selectedTrainingForEnroll.partnerAgency}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrainingForEnroll(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEnrollTrainingSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Course Highlight Box */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-950 text-xs">{selectedTrainingForEnroll.title}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-200 text-emerald-900">
                    {selectedTrainingForEnroll.slotsAvailable} slots left
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {selectedTrainingForEnroll.description}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-700">
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedTrainingForEnroll.schedule}</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{selectedTrainingForEnroll.venue}</span>
                  </p>
                </div>
                {selectedTrainingForEnroll.starterKitProvided && (
                  <p className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 pt-0.5">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Free Official Livelihood Starter Kit & TESDA/DTI Certificate upon graduation</span>
                  </p>
                )}
              </div>

              {/* Applicant Resident Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Applicant Resident</label>
                  <input
                    type="text"
                    readOnly
                    value={residentName}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Number & Purok</label>
                  <input
                    type="text"
                    readOnly
                    value={`${contactNumber} • ${purok}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-medium"
                  />
                </div>
              </div>

              {/* Background & Occupation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Educational Background *</label>
                  <select
                    value={livelihoodEducation}
                    onChange={(e) => setLivelihoodEducation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="High School Graduate">High School Graduate</option>
                    <option value="Senior High School Graduate">Senior High School Graduate</option>
                    <option value="Vocational / Technical Graduate">Vocational / Technical Graduate</option>
                    <option value="College Undergraduate">College Undergraduate</option>
                    <option value="College Graduate">College Graduate</option>
                    <option value="Out of School Youth / Other">Out of School Youth / Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Employment Status *</label>
                  <select
                    value={livelihoodOccupation}
                    onChange={(e) => setLivelihoodOccupation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Unemployed / Seeking Work">Unemployed / Seeking Work</option>
                    <option value="Homemaker / Stay-at-Home Mother">Homemaker / Stay-at-Home Mother</option>
                    <option value="Self-Employed / Small Sari-Sari Store">Self-Employed / Small Sari-Sari Store</option>
                    <option value="Daily Wage / Seasonal Worker">Daily Wage / Seasonal Worker</option>
                    <option value="Student / Youth">Student / Youth</option>
                    <option value="Employed seeking side income">Employed seeking side income</option>
                  </select>
                </div>
              </div>

              {/* Statement of Intent / Training Objective */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Why do you want to join this livelihood program? *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="State your goal (e.g. starting a micro-business, baking for family store, learning online skills)..."
                  value={livelihoodIntentReason}
                  onChange={(e) => setLivelihoodIntentReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Upload Resume / Bio-Data for Livelihood */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    Upload Bio-Data or Resume (Optional)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">PDF, DOCX, JPG, PNG</span>
                </div>

                {livelihoodResumeFileName ? (
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileCheck2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-indigo-950 truncate text-[11px]">{livelihoodResumeFileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLivelihoodResumeFileName('');
                        setLivelihoodResumeFileData('');
                      }}
                      className="p-1 hover:bg-indigo-200/60 rounded-lg text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/40 rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-700 text-xs">Attach Resume / Bio-Data Document</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setLivelihoodResumeFileName, setLivelihoodResumeFileData)}
                    />
                  </label>
                )}
              </div>

              {/* Upload Application Letter / Endorsement or Write Letter */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    Upload Application Letter / Barangay Endorsement
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Document / Text</span>
                </div>

                {livelihoodLetterFileName ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-emerald-950 truncate text-[11px]">{livelihoodLetterFileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLivelihoodLetterFileName('');
                        setLivelihoodLetterFileData('');
                      }}
                      className="p-1 hover:bg-emerald-200/60 rounded-lg text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700 text-xs">Attach Application Letter File (.pdf, .docx, .png)</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setLivelihoodLetterFileName, setLivelihoodLetterFileData)}
                      />
                    </label>

                    <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1">Or edit official letter text for Livelihood Council:</p>
                      <textarea
                        rows={2}
                        value={livelihoodLetterText}
                        onChange={(e) => setLivelihoodLetterText(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 text-xs font-sans"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Commitment check */}
              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToCommitment}
                  onChange={(e) => setAgreedToCommitment(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] font-medium leading-tight">
                  I pledge to attend all required session hours, complete the practical workshops, and responsibly utilize any starter toolkits awarded by Barangay Sangkol.
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTrainingForEnroll(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!agreedToCommitment}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Submit Livelihood Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ATTACHED DOCUMENT VIEWER MODAL ================= */}
      <AttachedDocumentModal
        data={viewerData}
        onClose={() => setViewerData(null)}
      />
    </div>
  );
};

