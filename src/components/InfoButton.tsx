import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

export interface InfoButtonProps {
  /** The information content to display when tapped/clicked */
  info: string;
  /** Optional title heading in the popover */
  title?: string;
  /** Visual style variant of the icon button */
  variant?: 'light' | 'dark' | 'indigo' | 'subtle';
  /** Size of the icon button */
  size?: 'xs' | 'sm' | 'md';
  /** Optional additional CSS class for the button container */
  className?: string;
  /** Placement direction preference */
  placement?: 'bottom' | 'top' | 'right' | 'left' | 'auto';
  /** Accessibility label */
  ariaLabel?: string;
}

export const InfoButton: React.FC<InfoButtonProps> = ({
  info,
  title,
  variant = 'light',
  size = 'sm',
  className = '',
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  // Calculate coordinates to keep popover within viewport and prevent clipping by parent overflow:hidden
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Popover width: up to 320px, but capped by screen padding
    const popoverWidth = Math.min(320, viewportWidth - 32);

    // Center popover relative to button, but clamp inside viewport padding
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left < 16) {
      left = 16;
    } else if (left + popoverWidth > viewportWidth - 16) {
      left = viewportWidth - popoverWidth - 16;
    }

    // Default: show below button
    let top = rect.bottom + 8;
    // If overflowing bottom of screen, show above button
    if (top + 160 > viewportHeight && rect.top > 160) {
      top = Math.max(16, rect.top - 8);
    }

    setCoords({ top, left, width: popoverWidth });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  // Size configurations
  const sizeClasses = {
    xs: 'w-4 h-4 p-0.5',
    sm: 'w-5 h-5 p-0.5',
    md: 'w-6 h-6 p-1',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  // Variant color styles for the button
  const variantClasses = {
    light:
      'text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-300/80 dark:text-slate-300 dark:hover:text-indigo-300 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:border-slate-700 shadow-2xs',
    dark:
      'text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/20 shadow-2xs',
    indigo:
      'text-indigo-200 hover:text-white bg-indigo-900/40 hover:bg-indigo-600/50 active:bg-indigo-600/70 border border-indigo-400/30',
    subtle:
      'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10',
  }[variant];

  return (
    <span className={`inline-flex items-center align-middle ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label={ariaLabel || title || 'Information'}
        title={title || 'Information (tap to view)'}
        aria-expanded={isOpen}
        className={`inline-flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${sizeClasses} ${variantClasses} ${
          isOpen ? 'ring-2 ring-indigo-500/70 scale-105' : ''
        }`}
      >
        <Info className={`${iconSizes} stroke-[2.2]`} />
      </button>

      {/* Render Popover via Portal to avoid parent overflow:hidden clipping */}
      {isOpen &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="rounded-2xl p-4 shadow-2xl border backdrop-blur-xl transition-all duration-150 animate-in fade-in zoom-in-95 bg-slate-900/95 text-slate-100 border-slate-700/80 shadow-black/60"
            role="dialog"
            aria-modal="false"
          >
            {/* Header with Title and Close button */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{title || 'Information'}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close information"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Description Content */}
            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              {info}
            </p>
          </div>,
          document.body
        )}
    </span>
  );
};
