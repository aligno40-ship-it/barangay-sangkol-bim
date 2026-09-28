import React, { useState, useEffect } from 'react';
import { X, Truck, Calendar, Clock, MapPin, User, Phone, CheckCircle2 } from 'lucide-react';
import { WasteCollectionSchedule } from '../../types/residentServices';

interface AddWasteRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Omit<WasteCollectionSchedule, 'id'>) => void;
  initialData?: WasteCollectionSchedule | null;
}

export const AddWasteRouteModal: React.FC<AddWasteRouteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [purokName, setPurokName] = useState('Purok 1 - Mabini');
  const [wasteType, setWasteType] = useState<WasteCollectionSchedule['wasteType']>(
    'Biodegradable (Nabubulok)'
  );
  const [collectionDays, setCollectionDays] = useState('Mon, Wed, Fri');
  const [pickupTime, setPickupTime] = useState('06:00 AM - 08:30 AM');
  const [assignedTruckNo, setAssignedTruckNo] = useState('Compactor Truck 01 (RA-9003)');
  const [ecoOfficerInCharge, setEcoOfficerInCharge] = useState('Kgd. Joel Manalo (Environment Chair)');
  const [driverName, setDriverName] = useState('Mario Fernandez');
  const [driverContact, setDriverContact] = useState('0917-889-1234');
  const [routeNotes, setRouteNotes] = useState('Main highway to interior alleys, sounding siren 3x.');
  const [status, setStatus] = useState<WasteCollectionSchedule['status']>('On Schedule');

  useEffect(() => {
    if (initialData) {
      setPurokName(initialData.purokName);
      setWasteType(initialData.wasteType);
      setCollectionDays(initialData.collectionDays);
      setPickupTime(initialData.pickupTime);
      setAssignedTruckNo(initialData.assignedTruckNo);
      setEcoOfficerInCharge(initialData.ecoOfficerInCharge);
      setDriverName(initialData.driverName || '');
      setDriverContact(initialData.driverContact || '');
      setRouteNotes(initialData.routeNotes || '');
      setStatus(initialData.status || 'On Schedule');
    } else {
      setPurokName('Purok 1 - Mabini');
      setWasteType('Biodegradable (Nabubulok)');
      setCollectionDays('Mon, Wed, Fri');
      setPickupTime('06:00 AM - 08:30 AM');
      setAssignedTruckNo('Compactor Truck 01 (RA-9003)');
      setEcoOfficerInCharge('Kgd. Joel Manalo (Environment Chair)');
      setDriverName('Mario Fernandez');
      setDriverContact('0917-889-1234');
      setRouteNotes('Main highway to interior alleys, sounding siren 3x.');
      setStatus('On Schedule');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      purokName,
      wasteType,
      collectionDays,
      pickupTime,
      assignedTruckNo,
      ecoOfficerInCharge,
      driverName: driverName || undefined,
      driverContact: driverContact || undefined,
      routeNotes: routeNotes || undefined,
      status,
    });
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
                {initialData ? 'Edit Collection Route' : 'Add Waste Collection Route'}
              </h3>
              <p className="text-xs text-slate-500">Barangay Solid Waste Fleet Dispatch</p>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Purok Route Area *</label>
              <select
                value={purokName}
                onChange={(e) => setPurokName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
              >
                <option value="Purok 1 - Mabini">Purok 1 - Mabini</option>
                <option value="Purok 2 - Rizal">Purok 2 - Rizal</option>
                <option value="Purok 3 - Bonifacio">Purok 3 - Bonifacio</option>
                <option value="Purok 4 - Aguinaldo">Purok 4 - Aguinaldo</option>
                <option value="Purok 5 - Silang">Purok 5 - Silang</option>
                <option value="Purok 6 - Malvar">Purok 6 - Malvar</option>
                <option value="Purok 7 - Dagohoy">Purok 7 - Dagohoy</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Waste Stream Classification *</label>
              <select
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold text-emerald-800 dark:text-emerald-300"
              >
                <option value="Biodegradable (Nabubulok)">Biodegradable (Nabubulok)</option>
                <option value="Non-Biodegradable (Di-Nabubulok / Recyclable)">Non-Biodegradable (Di-Nabubulok / Recyclable)</option>
                <option value="Residual & Hazardous (Special Collection)">Residual & Hazardous (Special Collection)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Collection Days *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mon, Wed, Fri"
                value={collectionDays}
                onChange={(e) => setCollectionDays(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pickup Time Window *</label>
              <input
                type="text"
                required
                placeholder="e.g. 06:00 AM - 08:30 AM"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Truck Unit *</label>
              <input
                type="text"
                required
                placeholder="e.g. Compactor Truck 01 (RA-9003)"
                value={assignedTruckNo}
                onChange={(e) => setAssignedTruckNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Live Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
              >
                <option value="On Schedule">On Schedule</option>
                <option value="Collecting Now">Collecting Now (Live Alert)</option>
                <option value="En Route to Purok">En Route to Purok</option>
                <option value="Delayed due to Weather">Delayed due to Weather</option>
                <option value="Completed Today">Completed Today</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Driver Name</label>
              <input
                type="text"
                placeholder="Driver Name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Driver Hotline</label>
              <input
                type="text"
                placeholder="0917-xxx-xxxx"
                value={driverContact}
                onChange={(e) => setDriverContact(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Route & Siren Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Siren sounds 3x before entering interior alleys. Starts from Purok Chapel."
              value={routeNotes}
              onChange={(e) => setRouteNotes(e.target.value)}
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
              Save Collection Route
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
