import React, { useState } from 'react';
import {
  HeartPulse,
  X,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
} from 'lucide-react';
import { HealthAppointment, VitalSigns } from '../../types/residentServices';

interface TriageVitalsModalProps {
  appointment: HealthAppointment | null;
  onClose: () => void;
  onSave: (
    appointmentId: string,
    vitals: VitalSigns,
    diagnosis?: string,
    prescriptions?: string,
    queueNumber?: string
  ) => void;
}

export const TriageVitalsModal: React.FC<TriageVitalsModalProps> = ({
  appointment,
  onClose,
  onSave,
}) => {
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [heartRate, setHeartRate] = useState('75');
  const [temperature, setTemperature] = useState('36.6');
  const [weightKg, setWeightKg] = useState('65');
  const [spo2, setSpo2] = useState('99');
  const [triagePriority, setTriagePriority] = useState<VitalSigns['triagePriority']>(
    appointment && appointment.patientAge >= 60 ? 'Priority (Senior/Pregnant/Infant)' : 'Routine'
  );
  const [triageNotes, setTriageNotes] = useState(
    appointment?.vitals?.triageNotes || 'Normotensive, afebrile, alert and conscious. Oriented to time, person, and place.'
  );
  const [diagnosis, setDiagnosis] = useState(appointment?.diagnosis || '');
  const [prescriptions, setPrescriptions] = useState(appointment?.prescriptionsOrAdvice || '');
  const [queueNumber, setQueueNumber] = useState(
    appointment?.queueNumber || (appointment ? `TRIAGE-${appointment.serviceType.charAt(0)}${Math.floor(10 + Math.random() * 90)}` : '')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    const vitalsData: VitalSigns = {
      bp: `${systolic}/${diastolic}`,
      heartRate: Number(heartRate) || 72,
      temperature: Number(temperature) || 36.5,
      weightKg: Number(weightKg) || undefined,
      spo2: Number(spo2) || 98,
      triagePriority,
      triageNotes,
      recordedAt: new Date().toLocaleString(),
    };

    onSave(appointment.id, vitalsData, diagnosis, prescriptions, queueNumber);
    onClose();
  };

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Clinical Triage & Vitals Recording</h3>
              <p className="text-xs text-slate-500">
                Patient: <strong className="text-slate-800">{appointment.patientName}</strong> ({appointment.patientAge} y/o)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Appointment Context Summary */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
          <div className="flex items-center justify-between text-blue-950 font-bold">
            <span>{appointment.serviceType}</span>
            <span className="font-mono text-blue-800">{appointment.id}</span>
          </div>
          <p className="text-blue-900">
            <strong>Chief Reason / Symptoms: </strong> {appointment.symptomsOrPurpose}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Priority & Queue Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Triage Priority Level</label>
              <select
                value={triagePriority}
                onChange={(e) => setTriagePriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Routine">Routine Consultation</option>
                <option value="Priority (Senior/Pregnant/Infant)">Priority (Senior / Pregnant / Infant)</option>
                <option value="Urgent / Emergency">Urgent / Emergency Triage</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Queue Ticket No.</label>
              <input
                type="text"
                value={queueNumber}
                onChange={(e) => setQueueNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-mono font-bold"
              />
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-600" />
              <span>Vital Signs Assessment</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* BP */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Blood Pressure (mmHg)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-center"
                  />
                  <span className="font-bold text-slate-400">/</span>
                  <input
                    type="number"
                    placeholder="80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-center"
                  />
                </div>
              </div>

              {/* Heart Rate */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Heart Rate (bpm)</label>
                <input
                  type="number"
                  placeholder="75"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-center"
                />
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Body Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-center"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="65"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-center"
                />
              </div>

              {/* SpO2 */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">SpO2 Oxygen (%)</label>
                <input
                  type="number"
                  placeholder="99"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">BHW Triage Observations / History</label>
              <input
                type="text"
                value={triageNotes}
                onChange={(e) => setTriageNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                placeholder="Patient general state, ambulatory, with mild coughing, etc."
              />
            </div>
          </div>

          {/* Clinical Findings & Treatment */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Attending Physician Diagnosis / Findings</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Essential Hypertension Stage 1 / Upper Respiratory Tract Infection (URTI)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Prescription & Medical Advice (Rx)</label>
              <textarea
                rows={2}
                value={prescriptions}
                onChange={(e) => setPrescriptions(e.target.value)}
                placeholder="e.g. Paracetamol 500mg tab q4h PRN for fever. Increase oral fluid intake. Return for follow up in 5 days."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Vitals & Diagnosis</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
