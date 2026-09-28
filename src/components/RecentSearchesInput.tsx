import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, History, X, Trash2, CornerDownLeft } from 'lucide-react';
import { loadState, saveState } from '../utils/storageUtils';

export interface RecentSearchesInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  storageKey: string; // e.g. 'residents' or 'blotter'
  theme?: 'light' | 'dark';
  className?: string;
  inputClassName?: string;
  id?: string;
  maxItems?: number;
  onSearchSubmit?: (query: string) => void;
}

function sanitizeSearches(list: any): string[] {
  if (!Array.isArray(list)) return [];
  return list.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export const RecentSearchesInput: React.FC<RecentSearchesInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  storageKey,
  theme = 'light',
  className = '',
  inputClassName = '',
  id,
  maxItems = 8,
  onSearchSubmit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const debounceTimerRef = useRef<any>(null);

  // Safe string value
  const safeValue = typeof value === 'string' ? value : (value != null ? String(value) : '');

  // Storage key for recent searches
  const stateKey = `recent_searches_${storageKey || 'default'}`;

  // Load recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return sanitizeSearches(loadState<string[]>(stateKey, []));
    } catch {
      return [];
    }
  });

  // Keep state in sync if storageKey changes
  useEffect(() => {
    try {
      setRecentSearches(sanitizeSearches(loadState<string[]>(stateKey, [])));
    } catch {
      setRecentSearches([]);
    }
  }, [stateKey]);

  // Persist updated list
  const updateSearches = (newList: string[]) => {
    const sanitized = sanitizeSearches(newList);
    setRecentSearches(sanitized);
    try {
      saveState(stateKey, sanitized);
    } catch {
      // Ignore storage errors
    }
  };

  // Add search term to history
  const addSearch = (term: string) => {
    if (typeof term !== 'string') return;
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;

    const currentList = sanitizeSearches(recentSearches);
    const filtered = currentList.filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase()
    );
    const updated = [trimmed, ...filtered].slice(0, maxItems);
    updateSearches(updated);
  };

  // Remove single search item
  const removeSearch = (termToRemove: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const currentList = sanitizeSearches(recentSearches);
    const updated = currentList.filter(
      (item) => item.toLowerCase() !== (termToRemove || '').toLowerCase()
    );
    updateSearches(updated);
    if (updated.length === 0) {
      setHighlightedIndex(-1);
    }
  };

  // Clear all recent searches
  const clearAllSearches = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    updateSearches([]);
    setHighlightedIndex(-1);
    setIsOpen(false);
  };

  // Select an item from recent searches
  const selectSearch = (term: string) => {
    if (typeof term !== 'string') return;
    onChange(term);
    addSearch(term);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (onSearchSubmit) {
      onSearchSubmit(term);
    }
    // Return focus to input
    inputRef.current?.focus();
  };

  // Debounced auto-save when user pauses typing a non-trivial query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = safeValue.trim();
    if (trimmed.length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        addSearch(trimmed);
      }, 1500);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [safeValue]);

  // Handle clicking outside container to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter recent searches based on current input
  const filteredSearches = useMemo(() => {
    const validList = sanitizeSearches(recentSearches);
    const query = safeValue.trim().toLowerCase();
    if (!query) return validList;
    return validList.filter((item) => item.toLowerCase().includes(query));
  }, [recentSearches, safeValue]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        const maxIdx = filteredSearches.length - 1;
        setHighlightedIndex((prev) => (prev < maxIdx ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        const maxIdx = filteredSearches.length - 1;
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : maxIdx));
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && filteredSearches[highlightedIndex]) {
        e.preventDefault();
        selectSearch(filteredSearches[highlightedIndex]);
      } else if (safeValue.trim()) {
        addSearch(safeValue.trim());
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (onSearchSubmit) {
          onSearchSubmit(safeValue.trim());
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Check if dropdown should be visible
  const showDropdown = isOpen && (filteredSearches.length > 0 || (sanitizeSearches(recentSearches).length > 0 && safeValue.trim().length > 0));

  const isDark = theme === 'dark';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center w-full">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${
            isDark ? 'text-slate-400' : 'text-slate-400'
          }`}
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={safeValue}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={
            inputClassName ||
            (isDark
              ? 'w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
              : 'w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all')
          }
        />

        {/* Clear Search Input Button */}
        {safeValue && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
              setIsOpen(true);
            }}
            title="Clear search"
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Recent Searches Dropdown Menu */}
      {showDropdown && (
        <div
          onMouseDown={(e) => {
            // Prevent input blur before click events register
            e.preventDefault();
          }}
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl shadow-xl overflow-hidden border transition-all animate-in fade-in slide-in-from-top-1 duration-150 ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-slate-200 shadow-slate-950/40'
              : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/70'
          }`}
        >
          {/* Dropdown Header */}
          <div
            className={`px-3 py-2 flex items-center justify-between border-b text-[11px] font-semibold select-none ${
              isDark
                ? 'border-slate-700/70 text-slate-400 bg-slate-850/50'
                : 'border-slate-100 text-slate-500 bg-slate-50/70'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Recent Searches</span>
            </div>
            {sanitizeSearches(recentSearches).length > 0 && (
              <button
                type="button"
                onClick={clearAllSearches}
                className={`text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                  isDark
                    ? 'text-slate-400 hover:text-rose-400'
                    : 'text-slate-400 hover:text-rose-600'
                }`}
                title="Clear recent search history"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* List of Recent Search Items */}
          <div className="max-h-56 overflow-y-auto divide-y divide-transparent py-1">
            {filteredSearches.length > 0 ? (
              filteredSearches.map((item, index) => {
                const isHighlighted = index === highlightedIndex;
                return (
                  <div
                    key={item + index}
                    onClick={() => selectSearch(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer group ${
                      isDark
                        ? isHighlighted
                          ? 'bg-slate-700/90 text-emerald-300 font-medium'
                          : 'hover:bg-slate-700/60 text-slate-200'
                        : isHighlighted
                        ? 'bg-indigo-50 text-indigo-950 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <History
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isDark
                            ? isHighlighted
                              ? 'text-emerald-400'
                              : 'text-slate-500 group-hover:text-slate-400'
                            : isHighlighted
                            ? 'text-indigo-600'
                            : 'text-slate-400 group-hover:text-slate-500'
                        }`}
                      />
                      <span className="truncate">{item}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => removeSearch(item, e)}
                      title={`Remove "${item}" from history`}
                      className={`p-1 rounded-md transition-all cursor-pointer opacity-40 group-hover:opacity-100 ${
                        isDark
                          ? 'text-slate-400 hover:text-rose-300 hover:bg-rose-950/40'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div
                className={`px-3 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isDark
                    ? 'text-slate-400 hover:bg-slate-700/40'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
                onClick={() => {
                  if (safeValue.trim()) {
                    addSearch(safeValue.trim());
                    setIsOpen(false);
                    if (onSearchSubmit) onSearchSubmit(safeValue.trim());
                  }
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    Search for &quot;<span className="font-semibold text-slate-900 dark:text-slate-100">{safeValue.trim()}</span>&quot;
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-[10px] text-slate-400">
                  <span>Press Enter</span>
                  <CornerDownLeft className="w-3 h-3" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
