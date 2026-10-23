import React, { useState, useEffect } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { AppointmentRecord } from '../types';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { InfoButton } from '../components/InfoButton';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  X,
  User,
} from 'lucide-react';

export const AppointmentsView: React.FC = () => {
  const { appointments, addAppointment, updateAppointment, deleteAppointment, settings, currentUser, targetRecordId, setTargetRecordId } = useBarangay();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState<AppointmentRecord | null>(null);
  const [deleteTargetApt, setDeleteTargetApt] = useState<AppointmentRecord | null>(null);

  const initialForm: Omit<AppointmentRecord, 'id'> = {
    title: '',
    residentName: '',
    contactNumber: '',
    purpose: 'Barangay Captain Consultation',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM',
    assignedOfficial: settings.punongBarangay,
    status: 'Scheduled',
    location: 'Office of the Punong Barangay',
    notes: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenAdd = () => {
    setEditingApt(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (apt: AppointmentRecord) => {
    setEditingApt(apt);
    setFormData({
      title: apt.title,
      residentName: apt.residentName,
      contactNumber: apt.contactNumber,
      purpose: apt.purpose,
      date: apt.date,
      time: apt.time,
      assignedOfficial: apt.assignedOfficial,
      status: apt.status,
      location: apt.location,
      notes: apt.notes || '',
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (targetRecordId) {
      const apt = appointments.find((a) => a.id === targetRecordId);
      if (apt) {
        handleOpenEdit(apt);
      }
      setTargetRecordId(null);
    }
  }, [targetRecordId, appointments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.residentName) {
      alert('Title and Resident Name are required.');
      return;
    }

    if (editingApt) {
      updateAppointment(editingApt.id, formData);
    } else {
      addAppointment(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <CalendarDays className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Barangay Appointments & Hearing Schedule</span>
            <InfoButton
              title="Appointments & Hearings"
              info="Citizen appointments, Punong Barangay desk hours, Lupon hearings, and council sessions."
              variant="light"
            />
          </h2>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Appointment</span>
        </button>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all space-y-3 flex flex-col justify-between shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                    {apt.time}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1.5">{apt.title}</h3>
                </div>

                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                  apt.status === 'Scheduled'
                    ? 'bg-blue-950 text-blue-300 border-blue-800'
                    : apt.status === 'Completed'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}>
                  {apt.status}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <p><strong className="text-slate-400">Citizen:</strong> {apt.residentName} ({apt.contactNumber})</p>
                <p><strong className="text-slate-400">Purpose:</strong> {apt.purpose}</p>
                <p className="flex items-center gap-1 text-emerald-400">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{apt.location}</span>
                </p>
                <p className="text-[11px] text-slate-400">Date: {apt.date}</p>
              </div>

              {apt.notes && (
                <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded-lg border border-slate-800">
                  "{apt.notes}"
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Officer: <strong className="text-slate-300">{apt.assignedOfficial}</strong>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(apt)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                  title="Edit Appointment"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {currentUser.role === 'Administrator' && (
                  <button
                    onClick={() => setDeleteTargetApt(apt)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
                    title="Delete Appointment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-100">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-400" />
                <span>{editingApt ? 'Edit Appointment' : 'Schedule Appointment'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Appointment Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Captain's Hearing on Boundary Settlement"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Citizen / Resident Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.residentName}
                    onChange={(e) => setFormData({ ...formData, residentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Time</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g. 09:30 AM"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Location / Venue</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Barangay Session Hall"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Assigned Official</label>
                  <input
                    type="text"
                    value={formData.assignedOfficial}
                    onChange={(e) => setFormData({ ...formData, assignedOfficial: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-semibold"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rescheduled">Rescheduled</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetApt}
        title="Delete Appointment Schedule"
        itemType="Appointment"
        itemName={deleteTargetApt ? `${deleteTargetApt.title} (${deleteTargetApt.date} @ ${deleteTargetApt.time}) - ${deleteTargetApt.residentName}` : undefined}
        description="Permanently remove this appointment from the barangay officer's schedule."
        confirmText="Yes, Delete Appointment"
        onConfirm={() => {
          if (deleteTargetApt) {
            deleteAppointment(deleteTargetApt.id);
          }
        }}
        onClose={() => setDeleteTargetApt(null)}
      />
    </div>
  );
};
