import React from 'react';
import { useBarangay, areNamesMatching } from '../context/BarangayContext';
import { RepublicSeal, BarangaySangkolSeal, QRCodeBox } from './OfficialSeals';
import { Printer, X, Receipt, CheckCircle } from 'lucide-react';

export const OfficialReceiptModal: React.FC = () => {
  const { currentUser, selectedReceiptForPrint, setSelectedReceiptForPrint, settings, certificates } = useBarangay();

  if (!selectedReceiptForPrint) return null;

  const tx = selectedReceiptForPrint;

  // Strict Resident Access Guard: Residents can only view/print their own receipts
  if (currentUser.role === 'Resident') {
    const userFullName = (currentUser.name || '').trim().toLowerCase();
    const payor = (tx.payorName || '').trim().toLowerCase();
    const matchesName = payor === userFullName || areNamesMatching(tx.payorName, currentUser.name);
    const matchesResidentId = Boolean(currentUser.residentId && tx.remarks?.includes(currentUser.residentId));
    const matchesUserId = Boolean(currentUser.id && tx.remarks?.includes(currentUser.id));
    const matchesCert = certificates.some(
      (c) =>
        (c.residentId === currentUser.residentId || areNamesMatching(c.residentName, currentUser.name)) &&
        c.orNumber &&
        c.orNumber.trim().toLowerCase() === tx.orNumber.trim().toLowerCase()
    );

    const isOwner = matchesName || matchesResidentId || matchesUserId || matchesCert;

    if (!isOwner) {
      return null;
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 modal-backdrop">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-sm text-slate-900">Official Receipt #{tx.orNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={() => setSelectedReceiptForPrint(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div className="printable-area bg-white text-slate-900 p-6 max-w-sm w-full shadow-lg rounded-xl border border-slate-300 font-mono text-xs space-y-4">
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3">
              <div className="flex justify-between items-center px-4 mb-2">
                <RepublicSeal size={38} />
                <BarangaySangkolSeal size={38} />
              </div>
              <p className="text-[9px] uppercase text-slate-600 font-bold">Republic of the Philippines</p>
              <h4 className="text-sm font-bold uppercase text-indigo-900 font-sans">{settings.barangayName}</h4>
              <p className="text-[9px] text-slate-600 uppercase">{settings.municipality}, {settings.province}</p>
              <p className="text-[10px] font-bold text-amber-900 mt-1 uppercase">OFFICIAL RECEIPT</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">NO. {tx.orNumber}</p>
            </div>

            {/* Transaction Meta */}
            <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-400 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold text-slate-900">{tx.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payor:</span>
                <span className="font-bold text-slate-900 uppercase">{tx.payorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-900">{tx.serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remarks:</span>
                <span className="text-slate-700">{tx.remarks || 'Standard Fee'}</span>
              </div>
            </div>

            {/* Total Block */}
            <div className="border-b border-dashed border-slate-400 pb-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span>TOTAL AMOUNT:</span>
                <span className="text-base text-indigo-700 font-extrabold">₱{tx.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase text-slate-800">{tx.paymentMethod}</span>
              </div>
            </div>

            {/* Signatures & QR */}
            <div className="pt-2 flex items-center justify-between text-[9px]">
              <div>
                <p className="text-slate-500">Collecting Officer:</p>
                <p className="font-bold uppercase text-slate-900 mt-3">{tx.cashierName || settings.barangayTreasurer}</p>
                <p className="text-slate-500">Barangay Treasurer / Staff</p>
              </div>
              <QRCodeBox code={tx.orNumber} size={48} />
            </div>

            <div className="text-center pt-2 text-[8px] text-slate-400 border-t border-slate-200">
              Thank you for supporting Barangay Sangkol public services.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
