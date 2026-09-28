import React from 'react';
import { Table as TableIcon, LayoutGrid } from 'lucide-react';

export interface ViewModeToggleProps {
  viewMode: 'table' | 'grid';
  onChange: (mode: 'table' | 'grid') => void;
  theme?: 'light' | 'dark';
  accentColor?: 'indigo' | 'emerald' | 'blue';
  tableTitle?: string;
  gridTitle?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onChange,
  theme = 'light',
  accentColor = 'indigo',
  tableTitle = 'Table View',
  gridTitle = 'Grid / Cards View',
}) => {
  const isDark = theme === 'dark';

  const getActiveClass = () => {
    switch (accentColor) {
      case 'emerald':
        return 'bg-emerald-600 text-white shadow-xs';
      case 'blue':
        return 'bg-blue-600 text-white shadow-xs';
      case 'indigo':
      default:
        return 'bg-indigo-600 text-white shadow-xs';
    }
  };

  const containerClasses = isDark
    ? 'flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 shrink-0'
    : 'flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0';

  const inactiveClasses = isDark
    ? 'text-slate-400 hover:text-white'
    : 'text-slate-500 hover:text-slate-900';

  return (
    <div className={containerClasses}>
      <button
        type="button"
        onClick={() => onChange('table')}
        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          viewMode === 'table' ? getActiveClass() : inactiveClasses
        }`}
        title={tableTitle}
        aria-label={tableTitle}
      >
        <TableIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          viewMode === 'grid' ? getActiveClass() : inactiveClasses
        }`}
        title={gridTitle}
        aria-label={gridTitle}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  );
};
