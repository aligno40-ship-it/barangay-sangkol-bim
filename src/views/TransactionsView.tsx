import React, { useState } from 'react';
import { useBarangay, areNamesMatching } from '../context/BarangayContext';
import { TransactionRecord } from '../types';
import { Receipt, Search, Printer, Plus, DollarSign, Calendar, Filter, FileText } from 'lucide-react';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { InfoButton } from '../components/InfoButton';

export const TransactionsView: React.FC = () => {
  const { transactions, setSelectedReceiptForPrint, settings, currentUser, certificates } = useBarangay();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('All');

  const isResident = currentUser.role === 'Resident';
  const userFullName = currentUser.name.trim().toLowerCase();
  const userResidentId = currentUser.residentId;

  // Strict Scope: Residents can ONLY view their own transactions and never other accounts' transactions
  const scopedTransactions = isResident
    ? transactions.filter((t) => {
        const payor = t.payorName.trim().toLowerCase();
        if (payor === userFullName) return true;
        if (areNamesMatching(t.payorName, currentUser.name)) return true;
        if (userResidentId && t.remarks?.includes(userResidentId)) return true;
        if (currentUser.id && t.remarks?.includes(currentUser.id)) return true;
        if (
          certificates.some(
            (c) =>
              (c.residentId === userResidentId ||
                areNamesMatching(c.residentName, currentUser.name) ||
                c.residentName.trim().toLowerCase() === userFullName) &&
              c.orNumber &&
              c.orNumber.trim().toLowerCase() === t.orNumber.trim().toLowerCase()
          )
        ) {
          return true;
        }
        return false;
      })
    : transactions;

  const filteredTransactions = scopedTransactions.filter((t) => {
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      t.orNumber.toLowerCase().includes(term) ||
      t.payorName.toLowerCase().includes(term) ||
      t.serviceType.toLowerCase().includes(term);
    const matchesService = selectedService === 'All' || t.serviceType === selectedService;
    return matchesSearch && matchesService;
  });

  const totalAmount = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isResident
                ? 'My Official Receipts & Financial Transactions'
                : 'Financial Collections & Official Receipts Ledger'}
            </span>
            <InfoButton
              title="Official Receipts & Collections"
              info={
                isResident
                  ? 'Personal official receipts, clearance fee history, and transaction vouchers issued under your resident profile.'
                  : 'Treasury collection log, official receipt records, fee bookkeeping, and cash reconciliation.'
              }
              variant="light"
            />
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-right shadow-xs">
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold block">
              {isResident ? 'My Total Paid Fees' : 'Total Collections'}
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₱{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <RecentSearchesInput
          className="flex-1"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by O.R. number, payor name, or service..."
          storageKey="transactions"
          theme="dark"
        />

        <div className="w-full sm:w-64">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Service Types</option>
            <option value="Barangay Clearance">Barangay Clearance</option>
            <option value="Certificate of Residency">Certificate of Residency</option>
            <option value="Business Clearance">Business Clearance</option>
            <option value="Barangay ID Card">Barangay ID Card</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Official Receipts Register</span>
          <span className="text-xs text-slate-400">{filteredTransactions.length} transaction entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700 tracking-wider">
              <tr>
                <th className="px-4 py-3">O.R. No. & Date</th>
                <th className="px-4 py-3">Payor Name</th>
                <th className="px-4 py-3">Service / Fee Description</th>
                <th className="px-4 py-3">Mode of Payment</th>
                <th className="px-4 py-3">Amount (₱)</th>
                <th className="px-4 py-3">Cashier / Collector</th>
                <th className="px-4 py-3 text-right">Receipt Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                    No financial transaction records found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono">
                      <p className="font-bold text-white text-[11px]">{tx.orNumber}</p>
                      <p className="text-[10px] text-slate-400">{tx.date}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-white">
                      {tx.payorName}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{tx.serviceType}</p>
                      <p className="text-[10px] text-slate-400">{tx.remarks}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-medium">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">
                      ₱{tx.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {tx.cashierName || settings.barangayTreasurer}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedReceiptForPrint(tx)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Print O.R.</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
