import React from 'react';
import { SystemUser, Resident } from '../types';
import { FaceVerificationCapture } from './FaceVerificationCapture';
import { BarangaySangkolSeal } from './OfficialSeals';
import { ShieldCheck, X } from 'lucide-react';
import { FaceComparisonResult } from '../utils/faceRecognition';

export interface FaceVerificationMetrics {
  confidenceScore: number;
  livenessScore: number;
  verifiedAt: string;
  comparison?: FaceComparisonResult;
  biometricQuality?: any;
  quality?: any;
  photoDataUrl?: string;
}

export interface FaceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (
    photoUrl: string,
    metrics: FaceVerificationMetrics
  ) => void;
  onVerified?: (
    data: {
      photoDataUrl: string;
      photoUrl?: string;
      confidenceScore: number;
      livenessScore: number;
      biometricQuality?: any;
      quality?: any;
      verifiedAt?: string;
      comparison?: FaceComparisonResult;
    }
  ) => void;
  targetUser?: SystemUser | null;
  targetResident?: Resident | null;
  mode?: 'login' | 'registration' | 'verification' | 'counter_check';
  title?: string;
  subtitle?: string;
}

export const FaceVerificationModal: React.FC<FaceVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onVerified,
  targetUser,
  targetResident,
  mode = 'verification',
  title = 'Barangay Biometric Face Verification',
  subtitle,
}) => {
  if (!isOpen) return null;

  const comparePhoto =
    targetUser?.facePhotoUrl ||
    targetUser?.validIdPhoto ||
    targetUser?.avatar ||
    targetResident?.photoUrl ||
    targetResident?.avatar ||
    undefined;

  const compareLabel = targetResident
    ? `Civil Census (${targetResident.id})`
    : targetUser
    ? `@${targetUser.username} Registered ID`
    : 'Registered Photo';

  const defaultSubtitle =
    mode === 'login'
      ? 'Authenticate instantly with facial recognition biometrics'
      : mode === 'counter_check'
      ? 'Perform live counter-side identity verification for resident clearance issuance'
      : 'Verify resident identity against registered Barangay Sangkol records';

  const handleCapture = (
    photoUrl: string,
    metrics: {
      confidenceScore: number;
      livenessScore: number;
      verifiedAt: string;
      comparison?: FaceComparisonResult;
      biometricQuality?: any;
    }
  ) => {
    if (onSuccess) {
      onSuccess(photoUrl, metrics);
    }
    if (onVerified) {
      onVerified({
        photoDataUrl: photoUrl,
        photoUrl,
        confidenceScore: metrics.confidenceScore,
        livenessScore: metrics.livenessScore,
        biometricQuality: metrics.biometricQuality,
        quality: metrics.biometricQuality,
        verifiedAt: metrics.verifiedAt,
        comparison: metrics.comparison,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto">
        <FaceVerificationCapture
          title={title}
          subtitle={subtitle || defaultSubtitle}
          targetComparePhoto={comparePhoto}
          targetCompareLabel={compareLabel}
          mode={mode}
          onCancel={onClose}
          onCapture={handleCapture}
        />
      </div>
    </div>
  );
};
