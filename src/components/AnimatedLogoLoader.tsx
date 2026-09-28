import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarangaySangkolSeal, RepublicSeal } from './OfficialSeals';
import { ShieldCheck, Sparkles, Lock, CheckCircle2 } from 'lucide-react';

interface AnimatedLogoLoaderProps {
  mode?: 'header' | 'overlay' | 'inline' | 'hero';
  authMode?: 'resident' | 'official';
  size?: number;
  label?: string;
  sublabel?: string;
  isAuthenticating?: boolean;
}

export const AnimatedLogoLoader: React.FC<AnimatedLogoLoaderProps> = ({
  mode = 'header',
  authMode = 'resident',
  size = 64,
  label,
  sublabel,
  isAuthenticating = false,
}) => {
  const [authStepIndex, setAuthStepIndex] = useState(0);

  const authSteps =
    authMode === 'resident'
      ? [
          'Verifying Citizen Registry credentials...',
          'Validating Resident Security Token...',
          'Opening Barangay Sangkol Resident Portal...',
        ]
      : [
          'Authenticating Official & Staff permissions...',
          'Verifying Administrative Security Keys...',
          'Establishing Secure Barangay BIMS Session...',
        ];

  useEffect(() => {
    if (!isAuthenticating) {
      setAuthStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setAuthStepIndex((prev) => (prev + 1) % authSteps.length);
    }, 700);

    return () => clearInterval(interval);
  }, [isAuthenticating, authSteps.length]);

  const isEmerald = authMode === 'resident';
  const primaryColor = isEmerald ? '#059669' : '#2563EB'; // emerald-600 vs blue-600
  const secondaryColor = isEmerald ? '#10B981' : '#3B82F6';
  const glowColor = isEmerald ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)';

  // 1. HEADER COMPACT EMBEDDED ANIMATED LOGO
  if (mode === 'header') {
    return (
      <div className="relative flex items-center justify-center select-none group">
        {/* Outer ambient breathing glow aura */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -inset-2 rounded-3xl blur-md pointer-events-none transition-colors duration-500"
          style={{ background: glowColor }}
        />

        {/* Counter-clockwise Outer Dashed Orbital Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute w-[84px] h-[84px] rounded-full border border-dashed pointer-events-none opacity-40 transition-colors duration-500"
          style={{ borderColor: secondaryColor }}
        />

        {/* Clockwise Inner Ticked Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute w-[76px] h-[76px] rounded-full border border-dotted pointer-events-none opacity-60 transition-colors duration-500"
          style={{ borderColor: primaryColor }}
        >
          {/* Orbiting Satellite Particle Dot */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-sm"
            style={{
              backgroundColor: isEmerald ? '#34D399' : '#60A5FA',
              boxShadow: `0 0 8px ${primaryColor}`,
            }}
          />
        </motion.div>

        {/* Main Logo Container Box */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md p-1.5 flex items-center justify-center z-10 transition-shadow duration-300"
        >
          {/* Subtly animated Seal */}
          <motion.div
            animate={{
              scale: [1, 1.025, 1],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-full h-full flex items-center justify-center"
          >
            <BarangaySangkolSeal size={56} className="w-full h-full object-contain drop-shadow-xs" />
          </motion.div>

          {/* Dynamic Security Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -bottom-1.5 -right-1.5 text-white p-1 rounded-full shadow-md border-2 border-white dark:border-slate-900 transition-colors duration-300 ${
              isEmerald ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
            title="Official Barangay Seal • BIMS Verified"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // 2. FULL AUTHENTICATION OVERLAY ANIMATED LOGO LOADER
  if (mode === 'overlay') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden"
      >
        {/* Background Animated Rings */}
          <div className="relative flex items-center justify-center mb-6">
            {/* Ambient Pulse Sphere */}
            <motion.div
              animate={{
                scale: [0.9, 1.3, 0.9],
                opacity: [0.2, 0.45, 0.2],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute w-40 h-40 rounded-full blur-2xl pointer-events-none"
              style={{ background: glowColor }}
            />

            {/* Radar Sweep Arc Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute w-32 h-32 rounded-full border-2 border-transparent pointer-events-none"
              style={{
                borderTopColor: primaryColor,
                borderRightColor: secondaryColor,
              }}
            />

            {/* Counter Rotating Dotted Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute w-36 h-36 rounded-full border border-dashed border-slate-300 dark:border-slate-700 pointer-events-none"
            />

            {/* Orbiting Satellite Sparkle */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute w-28 h-28 pointer-events-none"
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: isEmerald ? '#10B981' : '#3B82F6',
                  boxShadow: `0 0 10px ${primaryColor}`,
                }}
              >
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            </motion.div>

            {/* Center Animated Logo Seal Badge */}
            <motion.div
              animate={{
                scale: [0.98, 1.04, 0.98],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white dark:bg-slate-900 border-2 shadow-xl p-2 flex items-center justify-center z-10"
              style={{ borderColor: primaryColor }}
            >
              <BarangaySangkolSeal size={70} className="w-full h-full object-contain" />
              
              {/* Bottom Centered Lock Icon */}
              <div
                className="absolute -bottom-2 -right-2 text-white p-1.5 rounded-full shadow-md border-2 border-white dark:border-slate-900"
                style={{ backgroundColor: primaryColor }}
              >
                <Lock className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          </div>

          {/* Heading & Title */}
          <div className="space-y-1 max-w-xs mb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {label || 'Authenticating Secure Session'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {sublabel || (isEmerald ? 'Barangay Resident Portal' : 'Barangay Officials & Staff Core')}
            </p>
          </div>

          {/* Dynamic Step Status Ticker */}
          <div className="h-6 flex items-center justify-center mb-4">
            <motion.div
              key={authStepIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-2xs"
              style={{
                backgroundColor: isEmerald ? '#ECFDF5' : '#EFF6FF',
                color: isEmerald ? '#065F46' : '#1E40AF',
                borderColor: isEmerald ? '#A7F3D0' : '#BFDBFE',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: primaryColor }} />
              <span>{authSteps[authStepIndex]}</span>
            </motion.div>
          </div>

          {/* Shimmering Progress Bar */}
          <div className="w-48 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden relative shadow-inner">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                ease: 'easeInOut',
              }}
              className="w-1/2 h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${primaryColor}, ${secondaryColor}, transparent)`,
              }}
            />
          </div>

          {/* Security Seal Verification Tag */}
          <div className="mt-5 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit Encrypted BIMS Core</span>
          </div>
        </motion.div>
    );
  }

  // 3. INLINE BUTTON SPINNER WITH MINI ANIMATED SEAL
  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative w-5 h-5 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-white border-r-white/40"
        />
        <BarangaySangkolSeal size={14} className="w-3.5 h-3.5 object-contain" />
      </div>
      <span>{label || 'Signing In...'}</span>
    </div>
  );
};
