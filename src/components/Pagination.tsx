import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  itemName = 'records',
  theme = 'auto',
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(validCurrentPage * pageSize, totalItems);

  // Generate intelligent page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisibleButtons = 5;

    if (totalPages <= maxVisibleButtons + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include page 1
      pages.push(1);

      const start = Math.max(2, validCurrentPage - 1);
      const end = Math.min(totalPages - 1, validCurrentPage + 1);

      if (start > 2) {
        pages.push('ellipsis-start');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('ellipsis-end');
      }

      // Always include last page
      pages.push(totalPages);
    }

    return pages;
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t transition-colors ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-300'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
      } ${className}`}
    >
      {/* Left: Summary & Page Size */}
      <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto justify-between sm:justify-start">
        <p className="font-medium text-slate-500 dark:text-slate-400">
          Showing{' '}
          <span className="font-bold text-slate-900 dark:text-white">
            {startItem.toLocaleString()}
          </span>{' '}
          to{' '}
          <span className="font-bold text-slate-900 dark:text-white">
            {endItem.toLocaleString()}
          </span>{' '}
          of{' '}
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {totalItems.toLocaleString()}
          </span>{' '}
          {itemName}
        </p>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
            <span className="text-[11px] text-slate-400">Show:</span>
            <select
              value={pageSize}
              aria-label="Select number of items per page"
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white'
              }`}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation Buttons */}
      <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={validCurrentPage === 1}
          title="First Page"
          className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs'
          }`}
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage === 1}
          title="Previous Page"
          className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs'
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-xs text-slate-400 select-none"
                >
                  •••
                </span>
              );
            }

            const isActive = p === validCurrentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs scale-105'
                    : isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage === totalPages}
          title="Next Page"
          className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs'
          }`}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={validCurrentPage === totalPages}
          title="Last Page"
          className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs'
          }`}
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
