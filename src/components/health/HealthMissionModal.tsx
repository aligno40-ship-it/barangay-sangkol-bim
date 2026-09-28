import React, { useState, useEffect } from 'react';
import {
  Calendar,
  X,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Stethoscope,
  Heart,
} from 'lucide-react';
import { HealthOutreachMission } from '../../types/residentServices';

interface HealthMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mission: Omit<HealthOutreachMission, 'id' | 'registeredBeneficiaryIds'>) => void;
  missionToEdit?: HealthOutreachMission | null;
}

export const HealthMissionModal: React.FC<HealthMissionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  missionToEdit,
}) => {
  const [title, setTitle] = useState(missionToEdit?.title || '');
  const [missionType, setMissionType] = useState<HealthOutreachMission['missionType']>(
    missionToEdit?.missionType || 'General Medical Consultation & Free Medicines'
  );
  const [date, setDate] = useState(missionToEdit?.date || '');
  const [timeSchedule, setTimeSchedule] = useState(missionToEdit?.timeSchedule || '08:00 AM - 02:00 PM');
  const [venue, setVenue] = useState(missionToEdit?.venue || 'Barangay Sangkol Multi-Purpose Covered Court');
  const [targetPurok, setTargetPurok] = useState(missionToEdit?.targetPurok || 'All Puroks (1 to 7)');
  const [leadProvider, setLeadProvider] = useState(
    missionToEdit?.leadProvider || 'City Health Office Mobile Medical Team & Barangay BHWs'
  );
  const [maxSlots, setMaxSlots] = useState(missionToEdit?.maxSlots || 150);
  const [description, setDescription] = useState(
    missionToEdit?.description || 'Free clinical checkups, basic diagnostic tests, free maintenance medicines, and pediatric consultations.'
  );
  const [status, setStatus] = useState<HealthOutreachMission['status']>(
    missionToEdit?.status || 'Scheduled'
  );
  const [requirementsInput, setRequirementsInput] = useState(
    missionToEdit?.requirements.join(', ') || 'Valid Government/Barangay ID, Previous medical records or prescriptions'
  );

  useEffect(() => {
    if (missionToEdit) {
      setTitle(missionToEdit.title || '');
      setMissionType(missionToEdit.missionType || 'General Medical Consultation & Free Medicines');
      setDate(missionToEdit.date || '');
      setTimeSchedule(missionToEdit.timeSchedule || '08:00 AM - 02:00 PM');
      setVenue(missionToEdit.venue || 'Barangay Sangkol Multi-Purpose Covered Court');
      setTargetPurok(missionToEdit.targetPurok || 'All Puroks (1 to 7)');
      setLeadProvider(missionToEdit.leadProvider || 'City Health Office Mobile Medical Team & Barangay BHWs');
      setMaxSlots(missionToEdit.maxSlots || 150);
      setDescription(missionToEdit.description || '');
      setStatus(missionToEdit.status || 'Scheduled');
      setRequirementsInput(missionToEdit.requirements.join(', ') || 'Valid Government/Barangay ID');
    } else {
      setTitle('');
      setMissionType('General Medical Consultation & Free Medicines');
      setDate('');
      setTimeSchedule('08:00 AM - 02:00 PM');
      setVenue('Barangay Sangkol Multi-Purpose Covered Court');
      setTargetPurok('All Puroks (1 to 7)');
      setLeadProvider('City Health Office Mobile Medical Team & Barangay BHWs');
      setMaxSlots(150);
      setDescription('Free clinical checkups, basic diagnostic tests, free maintenance medicines, and pediatric consultations.');
      setStatus('Scheduled');
      setRequirementsInput('Valid Government/Barangay ID, Previous medical records or prescriptions');
    }
  }, [missionToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    const requirements = requirementsInput
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    onSave({
      title,
      missionType,
      date,
      timeSchedule,
      venue,
      targetPurok,
      leadProvider,
      maxSlots: Number(maxSlots),
      description,
      status,
      requirements: requirements.length > 0 ? requirements : ['Valid Barangay ID'],
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {missionToEdit ? 'Edit Health Outreach Mission' : 'Schedule Community Medical Mission'}
              </h3>
              <p className="text-xs text-slate-500">Barangay Primary Health Station Program</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mission Program Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Oplan Kalusugan: Free Medical & Pediatric Caravan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Program Type</label>
              <select
                value={missionType}
                onChange={(e) => setMissionType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
              >
                <option value="General Medical Consultation & Free Medicines">General Medical & Free Medicines</option>
                <option value="Buntis Day & Maternal Health Caravan">Buntis Day & Maternal Health Caravan</option>
                <option value="Operation Timbang Plus & Child Deworming">Operation Timbang Plus & Deworming</option>
                <option value="Free Blood Sugar & Hypertension Screening">Blood Sugar & BP Screening</option>
                <option value="Dental Extraction & Oral Health Mission">Dental & Oral Health Caravan</option>
                <option value="Eye Screening & Free Reading Glasses">Eye Screening & Reading Glasses</option>
                <option value="Mass Flu & Pneumonia Vaccination">Mass Vaccination Caravan</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mission Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
              >
                <option value="Scheduled">Scheduled (Accepting Slots)</option>
                <option value="Ongoing">Ongoing Activity</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Activity Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Time Schedule</label>
              <input
                type="text"
                value={timeSchedule}
                onChange={(e) => setTimeSchedule(e.target.value)}
                placeholder="08:00 AM - 02:00 PM"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Venue / Assembly Location</label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Barangay Covered Court"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Beneficiary Slots</label>
              <input
                type="number"
                min={1}
                value={maxSlots}
                onChange={(e) => setMaxSlots(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Lead Health Partners / Medical Team</label>
            <input
              type="text"
              value={leadProvider}
              onChange={(e) => setLeadProvider(e.target.value)}
              placeholder="City Health Office, Rotary Club, Philippine Red Cross"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mission Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of free services, target age group, etc."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Requirements to Bring (comma-separated)</label>
            <input
              type="text"
              value={requirementsInput}
              onChange={(e) => setRequirementsInput(e.target.value)}
              placeholder="Barangay ID, Mother & Child Booklet, PhilHealth ID"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{missionToEdit ? 'Save Mission' : 'Schedule Mission'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
