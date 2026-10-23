import React from 'react';
import { motion } from 'motion/react';
import { BarangaySangkolSeal, RepublicSeal } from './OfficialSeals';
import { Loader2, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

/**
 * Base Shimmer Skeleton Element
 */
export const Skeleton: React.FC<{
  className?: string;
  rounded?: string;
  animate?: boolean;
}> = ({ className = 'w-full h-4', rounded = 'rounded-lg', animate = true }) => {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200/80 ${rounded} ${className}`}
    >
      {animate && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      )}
    </div>
  );
};

/**
 * Modern High-Precision Loading Spinner
 */
export const LoadingSpinner: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'white';
  label?: string;
  className?: string;
}> = ({ size = 'md', color = 'indigo', label, className = '' }) => {
  const sizeMap = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2.5',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const colorMap = {
    indigo: 'border-indigo-200 border-t-indigo-600',
    emerald: 'border-emerald-200 border-t-emerald-600',
    amber: 'border-amber-200 border-t-amber-600',
    blue: 'border-blue-200 border-t-blue-600',
    white: 'border-white/30 border-t-white',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`rounded-full animate-spin ${sizeMap[size]} ${colorMap[color]}`}
        role="status"
        aria-label="loading"
      />
      {label && (
        <span className="text-xs font-semibold text-slate-600 tracking-tight animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Shimmering Skeleton for Stats / KPI Cards
 */
export const SkeletonStatsGrid: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="w-20 h-3.5" rounded="rounded-md" />
            <Skeleton className="w-8 h-8" rounded="rounded-xl" />
          </div>
          <Skeleton className="w-16 h-7" rounded="rounded-md" />
          <Skeleton className="w-28 h-2.5" rounded="rounded-md" />
        </div>
      ))}
    </div>
  );
};

/**
 * Shimmering Skeleton for Tables (Residents, Blotters, Certificates)
 */
export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Table Header Skeleton */}
      <div className="bg-slate-50/80 p-4 border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-8" rounded="rounded-xl" />
          <Skeleton className="w-28 h-8" rounded="rounded-xl" />
        </div>
      </div>

      {/* Table Rows Skeleton */}
      <div className="divide-y divide-slate-100 p-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-9 h-9 shrink-0" rounded="rounded-full" />
              <div className="space-y-1.5 flex-1 max-w-xs">
                <Skeleton className="w-3/4 h-3.5" />
                <Skeleton className="w-1/2 h-2.5" />
              </div>
            </div>
            <Skeleton className="w-24 h-5 hidden sm:block" rounded="rounded-full" />
            <Skeleton className="w-20 h-4 hidden md:block" />
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-20 h-7" rounded="rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Shimmering Skeleton for Feed / Activity Cards
 */
export const SkeletonCardList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-10 h-10 shrink-0" rounded="rounded-xl" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="w-2/3 h-4" />
                <Skeleton className="w-1/3 h-2.5" />
              </div>
            </div>
            <Skeleton className="w-20 h-5" rounded="rounded-full" />
          </div>
          <Skeleton className="w-full h-10" rounded="rounded-xl" />
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Skeleton className="w-32 h-3" />
            <Skeleton className="w-24 h-7" rounded="rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Top Slim Glowing Progress Bar (Triggers on route / module switch or data fetch)
 */
export const TopRouteProgressBar: React.FC<{ isAnimating: boolean }> = ({ isAnimating }) => {
  if (!isAnimating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent overflow-hidden pointer-events-none">
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          repeat: Infinity,
          duration: 0.9,
          ease: 'easeInOut',
        }}
        className="w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-600 to-amber-400 shadow-[0_0_8px_rgba(79,70,229,0.8)]"
      />
    </div>
  );
};

/**
 * Full Action Overlay with animated badge & status text
 */
export const ActionLoadingOverlay: React.FC<{
  isOpen: boolean;
  title?: string;
  subtitle?: string;
}> = ({ isOpen, title = 'Processing Request...', subtitle = 'Barangay Sangkol BIMS Secure Core' }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center flex flex-col items-center space-y-4"
      >
        <div className="relative">
          {/* Pulsing ring */}
          <div className="absolute -inset-2 bg-indigo-500/20 rounded-full animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-inner">
            <BarangaySangkolSeal size={40} className="animate-pulse" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        {/* Dynamic progress bar animation */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-1/3 h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 rounded-full"
          />
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Sangguniang Barangay Verified System</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export { AnimatedLogoLoader } from './AnimatedLogoLoader';
