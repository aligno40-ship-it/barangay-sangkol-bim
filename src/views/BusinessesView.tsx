import React, { useState, useMemo, useDeferredValue, useEffect } from 'react';
import { useBarangay } from '../context/BarangayContext';
import { BusinessRecord } from '../types';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { DataImportModal } from '../components/DataImportModal';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { InfoButton } from '../components/InfoButton';
import { Pagination } from '../components/Pagination';
import {
  Store,
  Plus,
  Search,
  MapPin,
  Calendar,
  FileCheck2,
  Phone,
  DollarSign,
  Edit2,
  Trash2,
  X,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

export const BusinessesView: React.FC = () => {
  const {
    businesses,
    addBusiness,
    updateBusiness,
    deleteBusiness,
    settings,
    currentUser,
    issueCertificate,
    setSelectedCertForPrint,
  } = useBarangay();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessRecord | null>(null);
  const [deleteTargetBusiness, setDeleteTargetBusiness] = useState<BusinessRecord | null>(null);

  const initialForm: Omit<BusinessRecord, 'id'> = {
    businessName: '',
    ownerName: '',
    businessType: 'Sole Proprietorship',
    category: 'Retail / Sari-Sari Store',
    purok: settings.puroks[0] || 'Purok Pinya',
    address: 'Purok Pinya, Barangay Sangkol',
    contactNumber: '0917-000-0000',
    capitalInvestment: 50000,
    grossSales: 150000,
    barangayClearanceNo: `BC-2026-${String(businesses.length + 1).padStart(4, '0')}`,
    clearanceIssueDate: new Date().toISOString().split('T')[0],
    clearanceExpiryDate: '2026-12-31',
    feePaid: settings.businessClearanceFee || 300,
    orNumber: `OR-2026-${String(businesses.length + 1).padStart(4, '0')}`,
    status: 'Active',
    employeesCount: 2,
  };

  const [formData, setFormData] = useState(initialForm);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, selectedStatus]);

  const filteredBusinesses = useMemo(() => {
    const term = deferredSearchQuery.toLowerCase().trim();
    return businesses.filter((b) => {
      if (selectedStatus !== 'All' && b.status !== selectedStatus) return false;
      if (term) {
        const matchesSearch =
          b.businessName.toLowerCase().includes(term) ||
          b.ownerName.toLowerCase().includes(term) ||
          b.category.toLowerCase().includes(term) ||
          b.barangayClearanceNo.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [businesses, deferredSearchQuery, selectedStatus]);

  const paginatedBusinesses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBusinesses.slice(startIndex, startIndex + pageSize);
  }, [filteredBusinesses, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingBusiness(null);
    setFormData({
      ...initialForm,
      barangayClearanceNo: `BC-2026-${String(businesses.length + 1).padStart(4, '0')}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BusinessRecord) => {
    setEditingBusiness(b);
    setFormData({
      businessName: b.businessName,
      ownerName: b.ownerName,
      ownerResidentId: b.ownerResidentId,
      businessType: b.businessType,
      category: b.category,
      purok: b.purok,
      address: b.address,
      contactNumber: b.contactNumber,
      capitalInvestment: b.capitalInvestment,
      grossSales: b.grossSales,
      barangayClearanceNo: b.barangayClearanceNo,
      clearanceIssueDate: b.clearanceIssueDate,
      clearanceExpiryDate: b.clearanceExpiryDate,
      feePaid: b.feePaid,
      orNumber: b.orNumber,
      status: b.status,
      employeesCount: b.employeesCount,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !formData.ownerName) {
      alert('Business Name and Owner Name are required.');
      return;
    }

    if (editingBusiness) {
      updateBusiness(editingBusiness.id, formData);
    } else {
      addBusiness(formData);
    }
    setIsModalOpen(false);
  };

  const handleIssueBusinessClearance = (b: BusinessRecord) => {
    const cert = issueCertificate({
      controlNumber: `BC-${Date.now().toString().slice(-6)}`,
      type: 'Business Clearance',
      residentId: b.ownerResidentId || 'BUS-' + b.id,
      residentName: b.ownerName,
      residentAge: 35,
      residentCivilStatus: 'Married',
      residentAddress: `${b.address}, ${settings.barangayName}`,
      purpose: 'Annual Business Permit Renewal & Clearance',
      orNumber: b.orNumber,
      fee: b.feePaid,
      signatoryOfficial: settings.punongBarangay,
      signatoryPosition: 'Punong Barangay',
      issuedBy: currentUser.role === 'Barangay Secretary' ? currentUser.name : (settings.barangaySecretary || 'Atty. Maria Elena V. Ramos'),
      businessName: b.businessName,
      businessAddress: b.address,
      businessNature: b.category,
      status: 'Issued',
    });
    setSelectedCertForPrint(cert);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <Store className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <span>Business Registrations & Clearances</span>
            <InfoButton
              title="Business Registrations & Clearances"
              info="Commercial establishments, micro-enterprises, sari-sari stores, and annual barangay clearance permits."
              variant="light"
            />
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-400 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            title="Import businesses from Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Import Excel / CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Business</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <RecentSearchesInput
          className="flex-1"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search business trade name, proprietor, or category..."
          storageKey="businesses"
          theme="dark"
        />

        <div className="w-full sm:w-64">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Business Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending Renewal">Pending Renewal</option>
            <option value="Expired">Expired Clearance</option>
            <option value="Ceased Operation">Ceased Operation</option>
          </select>
        </div>
      </div>

      {/* Directory Section Header & Controls */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Business Registry Directory
            </span>
            <span className="text-xs text-slate-400 ml-2">({filteredBusinesses.length} establishments)</span>
          </div>

          <ViewModeToggle
            viewMode={viewMode}
            onChange={setViewMode}
            theme="dark"
            accentColor="emerald"
            tableTitle="Table View (Registry Ledger)"
            gridTitle="Grid View (Establishment Cards)"
          />
        </div>

        {filteredBusinesses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Store className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
            <p className="text-sm font-semibold text-slate-400">No registered businesses match your search</p>
            <p className="text-xs text-slate-500">Try adjusting your filters or search keywords.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Clearance No.</th>
                  <th className="px-4 py-3">Business Trade Name & Category</th>
                  <th className="px-4 py-3">Proprietor / Owner</th>
                  <th className="px-4 py-3">Location & Purok</th>
                  <th className="px-4 py-3">Capitalization</th>
                  <th className="px-4 py-3">Permit Expiry</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginatedBusinesses.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-teal-300 text-[11px]">
                      {b.barangayClearanceNo}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-white text-xs">{b.businessName}</p>
                      <p className="text-[10px] text-emerald-400">{b.category}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-medium">
                      <p>{b.ownerName}</p>
                      <p className="text-[10px] text-slate-400">{b.contactNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <p className="text-xs">{b.purok}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-xs">{b.address}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-bold">
                      ₱{b.capitalInvestment.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
                      {b.clearanceExpiryDate}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold inline-block ${
                        b.status === 'Active'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleIssueBusinessClearance(b)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                          title="Issue Barangay Clearance"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Clearance</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                          title="Edit Business"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {currentUser.role === 'Administrator' && (
                          <button
                            onClick={() => setDeleteTargetBusiness(b)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
                            title="Delete Business"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedBusinesses.map((b) => (
              <div
                key={b.id}
                className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                        {b.barangayClearanceNo}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">{b.businessName}</h3>
                      <p className="text-xs text-emerald-400">{b.category}</p>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                      b.status === 'Active'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800/80">
                    <p><strong className="text-slate-400">Proprietor:</strong> {b.ownerName}</p>
                    <p><strong className="text-slate-400">Location:</strong> {b.address}, {b.purok}</p>
                    <p><strong className="text-slate-400">Contact:</strong> {b.contactNumber}</p>
                    <p><strong className="text-slate-400">Capitalization:</strong> ₱{b.capitalInvestment.toLocaleString()}</p>
                    <p><strong className="text-slate-400">Clearance Expiry:</strong> {b.clearanceExpiryDate}</p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleIssueBusinessClearance(b)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Issue Clearance</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                      title="Edit Business"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {currentUser.role === 'Administrator' && (
                      <button
                        onClick={() => setDeleteTargetBusiness(b)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
                        title="Delete Business"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* High-Performance Pagination Bar for Businesses Directory */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredBusinesses.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[15, 25, 50, 100]}
          itemName="businesses"
          theme="dark"
        />
      </div>

      {/* Add / Edit Business Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-100">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-teal-400" />
                <span>{editingBusiness ? 'Edit Business Information' : 'Register New Business'}</span>
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
                <label className="block text-xs text-slate-400 mb-1">Business Trade Name *</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Sangkol General Merchandise"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Owner / Proprietor *</label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="e.g. Maria Santos"
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
                  <label className="block text-xs text-slate-400 mb-1">Category / Nature</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="Retail / Sari-Sari Store">Retail / Sari-Sari Store</option>
                    <option value="Food / Eatery">Food / Eatery</option>
                    <option value="Agri-Supply / Milling">Agri-Supply / Milling</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Services & Repair">Services & Repair</option>
                    <option value="Internet Cafe">Internet Cafe</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Capital Investment (₱)</label>
                  <input
                    type="number"
                    value={formData.capitalInvestment}
                    onChange={(e) => setFormData({ ...formData, capitalInvestment: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Purok Location</label>
                  <select
                    value={formData.purok}
                    onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    {settings.puroks.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Highway Junction"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
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
                  Save Business
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetBusiness}
        title="Delete Business Record"
        itemType="Business Record"
        itemName={deleteTargetBusiness ? `${deleteTargetBusiness.businessName} (${deleteTargetBusiness.barangayClearanceNo})` : undefined}
        description="Permanently remove this commercial establishment from the barangay business registry."
        confirmText="Yes, Delete Business"
        onConfirm={() => {
          if (deleteTargetBusiness) {
            deleteBusiness(deleteTargetBusiness.id);
          }
        }}
        onClose={() => setDeleteTargetBusiness(null)}
      />

      {/* Bulk Excel / CSV Data Importer */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialEntity="businesses"
      />
    </div>
  );
};
