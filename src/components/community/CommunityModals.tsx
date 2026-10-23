import React from 'react';
import {
  X,
  Briefcase,
  Gift,
  Trash2,
  Trophy,
  Heart,
  Building2,
  Package,
  Syringe,
  Printer,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  DollarSign,
  Award,
} from 'lucide-react';
import {
  CommunityJobPosting,
  LivelihoodTrainingWorkshop,
  AyudaClaimStub,
  BayanihanCleanUpDrive,
  SKTournamentActivity,
  SeniorCitizenBenefitSchedule,
  ChildImmunizationTracker,
} from '../../types/residentServices';
import { RepublicSeal, BarangaySangkolSeal } from '../OfficialSeals';

// ================= MODAL: POST JOB OPENING =================
interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: any;
  setForm: (f: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const JobPostingModal: React.FC<JobModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
              Post Official Verified Job Opening
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Job Position Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Administrative Assistant, Store Sales Associate"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employer / Company *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sangkol Agro-Industrial Corp"
                value={form.employerName}
                onChange={(e) => setForm({ ...form, employerName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employment Type
              </label>
              <select
                value={form.employmentType}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Daily Wage / Project-based">Daily Wage / Project-based</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Salary / Compensation
              </label>
              <input
                type="text"
                value={form.salaryRange}
                onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vacancies (Slots)
              </label>
              <input
                type="number"
                min={1}
                value={form.vacancies}
                onChange={(e) => setForm({ ...form, vacancies: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Work Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Application Deadline
              </label>
              <input
                type="date"
                value={form.deadlineDate}
                onChange={(e) => setForm({ ...form, deadlineDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Job Description
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe core duties and working hours..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Qualifications (One per line)
            </label>
            <textarea
              rows={2}
              value={form.qualificationsText}
              onChange={(e) => setForm({ ...form, qualificationsText: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Publish Job Posting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= MODAL: OPEN LIVELIHOOD WORKSHOP =================
interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: any;
  setForm: (f: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LivelihoodTrainingModal: React.FC<TrainingModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
              Open Livelihood & TESDA Workshop
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Course / Workshop Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Shielded Metal Arc Welding NC-II, Meat Processing & Packaging"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Partner Agency
              </label>
              <select
                value={form.partnerAgency}
                onChange={(e) => setForm({ ...form, partnerAgency: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="TESDA Accredited">TESDA Accredited</option>
                <option value="DTI Negosyo Center">DTI Negosyo Center</option>
                <option value="Barangay Livelihood Committee">Barangay Livelihood Committee</option>
                <option value="DOST Technopreneurship">DOST Technopreneurship</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Trainee Slots
              </label>
              <input
                type="number"
                min={5}
                value={form.slotsTotal}
                onChange={(e) => setForm({ ...form, slotsTotal: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Training Schedule
              </label>
              <input
                type="text"
                placeholder="e.g. Saturdays & Sundays (08:00 AM - 04:00 PM)"
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Course Duration
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Venue
              </label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Trainer / Instructor
            </label>
            <input
              type="text"
              value={form.trainerName}
              onChange={(e) => setForm({ ...form, trainerName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description & Toolkits
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Explain free starter kits, certificates, and job referrals provided..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Publish Livelihood Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= MODAL: LAUNCH AYUDA CAMPAIGN =================
interface AyudaModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: any;
  setForm: (f: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AyudaDistributionModal: React.FC<AyudaModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-600" />
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
              Launch Ayuda Relief Distribution
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ayuda Program Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Typhoon Emergency Relief Goods Pack Distribution Wave 2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Relief Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Calamity Relief Goods Pack">Calamity Relief Goods Pack</option>
                <option value="Department of Agriculture Seeds & Fertilizer">DA Seeds & Fertilizer Pack</option>
                <option value="Senior Citizen Nutrition Pack">Senior Citizen Nutrition Pack</option>
                <option value="PWD Assistive Grocery Voucher">PWD Assistive Grocery Voucher</option>
                <option value="4Ps Supplemental Ration">4Ps Supplemental Ration</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Coverage
              </label>
              <select
                value={form.targetPurok}
                onChange={(e) => setForm({ ...form, targetPurok: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="All Puroks">All Puroks (Barangay-wide)</option>
                <option value="Purok Pinya">Purok Pinya</option>
                <option value="Purok Lumboy">Purok Lumboy</option>
                <option value="Purok Mangga">Purok Mangga</option>
                <option value="Purok Tambis">Purok Tambis</option>
                <option value="Purok Kaimito">Purok Kaimito</option>
                <option value="Purok Bayabas">Purok Bayabas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Distribution Date
              </label>
              <input
                type="date"
                value={form.distributionDate}
                onChange={(e) => setForm({ ...form, distributionDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Claim Venue
              </label>
              <input
                type="text"
                value={form.claimLocation}
                onChange={(e) => setForm({ ...form, claimLocation: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Items Included in Pack (One per line)
            </label>
            <textarea
              rows={3}
              value={form.itemsIncludedText}
              onChange={(e) => setForm({ ...form, itemsIncludedText: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Generate Digital Claim Passes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= MODAL: ORGANIZE BAYANIHAN CLEAN-UP DRIVE =================
interface CleanUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: any;
  setForm: (f: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const BayanihanCleanUpModal: React.FC<CleanUpModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-teal-600" />
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
              Organize Bayanihan Clean-Up Drive
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Drive Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Purok / Area
              </label>
              <select
                value={form.purokTarget}
                onChange={(e) => setForm({ ...form, purokTarget: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="All Puroks">All Puroks (Barangay-wide)</option>
                <option value="Purok Pinya">Purok Pinya</option>
                <option value="Purok Lumboy">Purok Lumboy</option>
                <option value="Purok Mangga">Purok Mangga</option>
                <option value="Purok Tambis">Purok Tambis</option>
                <option value="Purok Kaimito">Purok Kaimito</option>
                <option value="Purok Bayabas">Purok Bayabas</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Activity Date
              </label>
              <input
                type="date"
                value={form.activityDate}
                onChange={(e) => setForm({ ...form, activityDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assembly Time
              </label>
              <input
                type="text"
                value={form.assemblyTime}
                onChange={(e) => setForm({ ...form, assemblyTime: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assembly Point
              </label>
              <input
                type="text"
                value={form.assemblyPoint}
                onChange={(e) => setForm({ ...form, assemblyPoint: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Volunteers
              </label>
              <input
                type="number"
                min={10}
                value={form.expectedVolunteers}
                onChange={(e) => setForm({ ...form, expectedVolunteers: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Officer In Charge
              </label>
              <input
                type="text"
                value={form.coordinator}
                onChange={(e) => setForm({ ...form, coordinator: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description & Objectives
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tools & Supplies Provided
            </label>
            <input
              type="text"
              value={form.equipmentProvidedText}
              onChange={(e) => setForm({ ...form, equipmentProvidedText: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Organize Clean-Up Drive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= MODAL: POST SK YOUTH TOURNAMENT =================
interface SKModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: any;
  setForm: (f: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SKTournamentModal: React.FC<SKModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
              Post SK Youth Tournament / Program
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tournament / Program Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sport / Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Inter-Purok Basketball League (Junior Division)">Inter-Purok Basketball (Junior)</option>
                <option value="Inter-Purok Basketball League (Open Division)">Inter-Purok Basketball (Open)</option>
                <option value="Inter-Purok Volleyball Cup">Inter-Purok Volleyball Cup</option>
                <option value="Mobile Legends E-Sports Championship">Mobile Legends E-Sports</option>
                <option value="Linggo ng Kabataan Leadership Summit">Linggo ng Kabataan Summit</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Age Bracket
              </label>
              <select
                value={form.targetAgeGroup}
                onChange={(e) => setForm({ ...form, targetAgeGroup: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="15 - 30 Years Old (SK Registered Youth)">15 - 30 Years Old (SK Registered)</option>
                <option value="12 - 17 Years Old (Junior Division)">12 - 17 Years Old (Junior Division)</option>
                <option value="18 - 30 Years Old (Senior Youth Division)">18 - 30 Years Old (Senior Youth)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tournament Dates
              </label>
              <input
                type="text"
                placeholder="e.g. Oct 10 - Nov 15, 2026"
                value={form.scheduleDates}
                onChange={(e) => setForm({ ...form, scheduleDates: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Venue
              </label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Prizes & Awards
            </label>
            <input
              type="text"
              value={form.prizes}
              onChange={(e) => setForm({ ...form, prizes: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl cursor-pointer"
            >
              Publish SK Tournament
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= MODAL: POST SENIOR CITIZEN BENEFIT =================
interface SeniorModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: any;
  setForm: (f: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SeniorBenefitModal: React.FC<SeniorModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-purple-600" />
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
              Post Senior Citizen Benefit Release
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Program Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Benefit Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="LGU Quarterly Birthday Cash Gift (P1,000)">LGU Birthday Cash Gift (₱1,000)</option>
                <option value="DSWD Social Pension Payout (P3,000 / Quarter)">DSWD Social Pension (₱3,000)</option>
                <option value="Senior Citizen Free Flu & Pneumococcal Vaccine">Senior Free Flu & Pneumococcal Vaccine</option>
                <option value="OSCA Senior Grocery Voucher">OSCA Senior Grocery Voucher</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Distribution Date
              </label>
              <input
                type="date"
                value={form.distributionDate}
                onChange={(e) => setForm({ ...form, distributionDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payout Venue
            </label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Requirements (One per line)
            </label>
            <textarea
              rows={3}
              value={form.requirementsText}
              onChange={(e) => setForm({ ...form, requirementsText: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Post Senior Benefit Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= MODAL: PRINT OFFICIAL SLIP =================
interface PrintSlipModalProps {
  data: { title: string; subtitle: string; content: React.ReactNode } | null;
  onClose: () => void;
  barangayName?: string;
  municipality?: string;
  province?: string;
  punongBarangay?: string;
}

export const PrintSlipModal: React.FC<PrintSlipModalProps> = ({
  data,
  onClose,
  barangayName = 'BARANGAY SANGKOL',
  municipality = 'Libagon',
  province = 'Southern Leyte',
  punongBarangay = 'Hon. Punong Barangay',
}) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-slate-900 max-h-[90vh] overflow-y-auto">
        {/* Header with Seals */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-slate-900">
          <RepublicSeal size={56} />
          <div className="text-center flex-1">
            <p className="text-[11px] font-serif uppercase tracking-widest text-slate-600">
              Republic of the Philippines
            </p>
            <p className="text-[11px] font-serif uppercase tracking-wider text-slate-600">
              Province of {province} • Municipality of {municipality}
            </p>
            <h2 className="text-lg font-black font-serif uppercase tracking-wide text-slate-950 mt-0.5">
              OFFICE OF {barangayName.toUpperCase()}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mt-0.5">
              Frontline Community Services & Public Administration
            </p>
          </div>
          <BarangaySangkolSeal size={56} />
        </div>

        <div className="text-center py-1">
          <h3 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900 underline decoration-indigo-600 underline-offset-4">
            {data.title}
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">{data.subtitle}</p>
        </div>

        <div className="py-2">{data.content}</div>

        {/* Signature Line */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-center text-xs">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold">Processed & Verified by</p>
            <div className="h-10"></div>
            <p className="font-black text-slate-900 border-t border-slate-400 pt-1">Duty Officer / Committee Desk</p>
            <p className="text-[10px] text-slate-500">Barangay Frontline Staff</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold">Approved & Issued by</p>
            <div className="h-10"></div>
            <p className="font-black text-slate-900 border-t border-slate-400 pt-1">{punongBarangay}</p>
            <p className="text-[10px] text-slate-500">Punong Barangay / Authorized Signatory</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" /> Print Official Document
          </button>
        </div>
      </div>
    </div>
  );
};
