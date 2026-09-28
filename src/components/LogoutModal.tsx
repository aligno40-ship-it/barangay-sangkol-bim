import React from 'react';
import { useBarangay } from '../context/BarangayContext';
import { BarangaySangkolSeal } from './OfficialSeals';
import {
  LogOut,
  ShieldCheck,
  X,
  User,
} from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLoginModal?: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onOpenLoginModal,
}) => {
  const { currentUser, logout } = useBarangay();

  if (!isOpen) return null;

  const handleConfirmLogout = () => {
    logout();
    onClose();
  };

  const isResident = currentUser.role === 'Resident';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200 flex flex-col relative">
        {/* Modal Top Header */}
        <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 text-center relative text-white">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl border border-slate-700 cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex justify-center items-center gap-2 mb-2">
            <BarangaySangkolSeal size={44} />
          </div>
          <h3 className="text-base font-black text-white tracking-tight uppercase">
            Barangay Sangkol BIMS
          </h3>
          <p className="text-xs text-indigo-300 font-medium">Session Authentication</p>
        </div>

        {/* Confirmation Content */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3.5 bg-rose-50/80 border border-rose-200/80 p-4 rounded-2xl">
            <div className="w-11 h-11 bg-rose-100 border border-rose-300 text-rose-600 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <LogOut className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Sign Out of Session?</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Are you sure you want to end your current session on this device?
              </p>
            </div>
          </div>

          {/* Active User Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs ${
                  isResident ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                <p
                  className={`text-[11px] font-semibold truncate ${
                    isResident ? 'text-emerald-700' : 'text-indigo-700'
                  }`}
                >
                  {currentUser.position || currentUser.role}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Account Username:</span>
              <span className="font-mono font-bold text-slate-700">@{currentUser.username}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Security Level:</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit TLS Active
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-center"
            >
              <LogOut className="w-4 h-4" />
              <span>Yes, Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
