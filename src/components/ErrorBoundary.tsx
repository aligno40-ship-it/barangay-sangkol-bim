import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { safeRemoveItem } from '../utils/storageUtils';

export interface ErrorBoundaryProps {
  key?: React.Key;
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('BIMS Uncaught Runtime Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = (): void => {
    try {
      this.setState({ hasError: false, error: null, errorInfo: null });
      if (this.props.onReset) {
        this.props.onReset();
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  private handleClearStorageAndReload = (): void => {
    try {
      const keysToClear = [
        'bims_active_tab',
        'bims_current_user',
        'bims_resident_facilities',
        'bims_resident_equipment',
        'bims_resident_incidents',
        'bims_resident_lupon',
        'bims_resident_health_appts',
        'bims_resident_child_vax',
        'bims_resident_rx_refills',
        'bims_resident_job_apps',
        'bims_resident_livelihoods',
        'bims_resident_ayuda_stubs',
        'bims_resident_fin_assistance',
        'bims_resident_bulk_waste',
        'bims_resident_volunteers',
        'bims_resident_sk_registrations',
        'bims_resident_assistive_requests',
      ];
      keysToClear.forEach((k) => safeRemoveItem(k));

      // Also remove any corrupted search caches if present in localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (key.startsWith('recent_searches_') || key.includes('recent_searches'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => {
          try {
            window.localStorage.removeItem(k);
          } catch {
            // ignore
          }
        });
      }

      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30">
                System Recovery Active
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {this.props.fallbackTitle || 'Barangay Portal State Restored'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {this.props.fallbackMessage ||
                  'The application encountered a transient runtime hiccup. Your barangay records and databases remain safe.'}
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-rose-400 overflow-x-auto max-h-32">
                <p className="font-bold text-slate-400 mb-1">Diagnostic Log:</p>
                <p>{this.state.error.toString()}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearStorageAndReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition-all border border-slate-600 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Reset Cache & Recover</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500">
              Barangay Sangkol Information Management System (BIMS) • Resilience & Fault Isolation Subsystem
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
