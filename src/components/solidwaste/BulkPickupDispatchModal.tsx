import React, { useState, useEffect } from 'react';
import { X, Truck, Calendar, Clock, MapPin, User, Phone, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { BulkWastePickupRequest } from '../../types/residentServices';

interface BulkPickupDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: BulkWastePickupRequest;
  onDispatch: (
    id: string,
    status: BulkWastePickupRequest['status'],
    assignedCrew?: string,
    pickupTimeWindow?: string,
    adminRemarks?: string
  ) => void;
}

export const BulkPickupDispatchModal: React.FC<BulkPickupDispatchModalProps> = ({
  isOpen,
  onClose,
  request,
  onDispatch,
}) => {
  const [status, setStatus] = useState<BulkWastePickupRequest['status']>(request.status);
  const [assignedCrew, setAssignedCrew] = useState(
    request.assignedCrew || 'Eco-Truck 01 (Tanod Patrol Unit)'
  );
  const [pickupTimeWindow, setPickupTimeWindow] = useState(
    request.pickupTimeWindow || '08:00 AM - 11:30 AM'
  );
  const [adminRemarks, setAdminRemarks] = useState(
    request.adminRemarks || 'Confirmed volume. Advise resident to place items along roadside.'
  );

  useEffect(() => {
    setStatus(request.status);
    setAssignedCrew(request.assignedCrew || 'Eco-Truck 01 (Tanod Patrol Unit)');
    setPickupTimeWindow(request.pickupTimeWindow || '08:00 AM - 11:30 AM');
    setAdminRemarks(
      request.adminRemarks || 'Confirmed volume. Advise resident to place items along roadside.'
    );
  }, [request, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDispatch(request.id, status, assignedCrew, pickupTimeWindow, adminRemarks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Dispatch Crew & Schedule
              </h3>
              <p className="text-xs text-slate-500">Bulk Pickup Request #{request.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resident & Request Info Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-sm">{request.residentName}</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{request.contactNumber}</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            <strong>Address:</strong> {request.streetAddress} ({request.purok})
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            <strong>Waste Category:</strong> {request.wasteCategory}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            <strong>Description:</strong> {request.wasteDescription}
          </p>
          <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 text-slate-500">
            <span>Volume: <strong>{request.estimatedVolume || 'Medium load'}</strong></span>
            <span>Preferred: <strong>{request.preferredPickupDate}</strong></span>
          </div>
          {request.photoUrl && (
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Resident Photo Attachment:</span>
              <img
                src={request.photoUrl}
                alt="Bulk waste preview"
                className="mt-1 h-28 w-full object-cover rounded-xl border border-slate-200"
              />
            </div>
          )}
        </div>

        {/* Dispatch Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status Update *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
            >
              <option value="Pending Schedule">Pending Schedule</option>
              <option value="Pickup Scheduled">Pickup Scheduled (Crew Dispatched)</option>
              <option value="Collected">Collected & Cleared (Done)</option>
              <option value="Cancelled">Cancelled / Not Feasible</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Crew / Truck Unit</label>
              <select
                value={assignedCrew}
                onChange={(e) => setAssignedCrew(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
              >
                <option value="Eco-Truck 01 (Tanod Patrol Unit)">Eco-Truck 01 (Tanod Patrol Unit)</option>
                <option value="Barangay Heavy Dump Truck 02">Barangay Heavy Dump Truck 02</option>
                <option value="Sanitation Tricycle Utility Squad">Sanitation Tricycle Utility Squad</option>
                <option value="Bayanihan Environmental Volunteer Crew">Bayanihan Environmental Volunteer Crew</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pickup Time Window</label>
              <input
                type="text"
                value={pickupTimeWindow}
                onChange={(e) => setPickupTimeWindow(e.target.value)}
                placeholder="e.g. 08:00 AM - 11:30 AM"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Admin / Crew Remarks</label>
            <textarea
              rows={2}
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
              placeholder="Instructions for crew or notes to resident..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl cursor-pointer shadow-md"
            >
              Update Dispatch Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
