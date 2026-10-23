import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarangaySangkolSeal, RepublicSeal } from './OfficialSeals';
import { ShieldCheck, CheckCircle2, Sparkles, Database, Users, FileText, ArrowRight } from 'lucide-react';

interface InitialLoadingScreenProps {
  onComplete: () => void;
  isReplay?: boolean;
}

export const InitialLoadingScreen: React.FC<InitialLoadingScreenProps> = ({ onComplete, isReplay = false }) => {
  const [progress, setProgress] = useState(10);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    {
      title: 'Connecting to Barangay Sangkol Core Registry',
      icon: Database,
      detail: 'Establishing secure link with local government data store...',
    },
    {
      title: 'Loading 6 Official Puroks & Resident Profiles',
      icon: Users,
      detail: 'Purok Pinya, Lumboy, Mangga, Tambis, Kaimito, Bayabas...',
    },
    {
      title: 'Synchronizing Certificates, Blotters & Helpdesk',
      icon: FileText,
      detail: 'Verifying active permits, clearance logs, and citizen tickets...',
    },
    {
      title: 'Barangay Sangkol BIMS System Operational',
      icon: ShieldCheck,
      detail: 'Ready. All security protocols and portal modules verified.',
    },
  ];

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(35);
      setCurrentStepIndex(1);
    }, 450);

    const timer2 = setTimeout(() => {
      setProgress(70);
      setCurrentStepIndex(2);
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(95);
      setCurrentStepIndex(3);
    }, 1400);

    const timer4 = setTimeout(() => {
      setProgress(100);
    }, 1800);

    const timer5 = setTimeout(() => {
      onCompleteRef.current();
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.4 } }}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 select-none overflow-hidden text-white font-sans"
    >
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-6">
        {/* Animated Dual Seals with Orbital Rings */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulsing ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="absolute w-36 h-36 rounded-full border border-dashed border-indigo-400/40 pointer-events-none"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            className="absolute w-44 h-44 rounded-full border border-dotted border-amber-400/30 pointer-events-none"
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative flex items-center gap-3 p-3 bg-slate-900/90 rounded-3xl border border-slate-700/80 shadow-2xl backdrop-blur-md"
          >
            <RepublicSeal size={48} className="drop-shadow-lg" />
            <div className="w-px h-10 bg-slate-700" />
            <BarangaySangkolSeal size={48} className="drop-shadow-lg animate-pulse" />
          </motion.div>
        </div>

        {/* Title & Official Tagline */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[11px] font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Republika ng Pilipinas • Region IX</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            Barangay Sangkol
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Information Management System & Citizen Services Portal
          </p>
        </div>

        {/* Stepped Checklist Progress */}
        <div className="w-full bg-slate-900/80 rounded-2xl border border-slate-800 p-4 text-left space-y-2.5 shadow-xl backdrop-blur-xs">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || progress === 100;
            const isCurrent = idx === currentStepIndex && progress < 100;
            const StepIcon = step.icon;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-2 rounded-xl transition-all duration-300 ${
                  isCurrent
                    ? 'bg-indigo-950/60 border border-indigo-800/80 shadow-xs'
                    : 'opacity-70'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-scale" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                  ) : (
                    <StepIcon className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-semibold truncate ${
                      isCurrent
                        ? 'text-indigo-200'
                        : isCompleted
                        ? 'text-slate-200'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  {isCurrent && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-[10px] text-slate-400 mt-0.5"
                    >
                      {step.detail}
                    </motion.p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Progress Bar & Percentage */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Initializing System Modules...
            </span>
            <span className="font-mono text-indigo-300 font-bold">{progress}%</span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-amber-400 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)]"
              initial={{ width: '10%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
          </div>
        </div>

        {/* Skip / Launch Immediately Button */}
        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <span>Enter System Instantly</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* Footer Subtext */}
        <p className="text-[10px] text-slate-500">
          Serving Purok Pinya • Lumboy • Mangga • Tambis • Kaimito • Bayabas
        </p>
      </div>
    </motion.div>
  );
};
