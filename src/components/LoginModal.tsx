import React from 'react';
import { LoginPage } from './LoginPage';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-[440px] animate-in zoom-in-95 duration-150 relative">
        <LoginPage isModal={true} onClose={onClose} onSuccess={onClose} />
      </div>
    </div>
  );
};
