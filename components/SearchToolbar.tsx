
import React, { useState, useEffect } from 'react';
import { Element } from '../types';

interface SearchToolbarProps {
  elements: Element[];
  onSearch: (matchedIds: Set<string>) => void;
  onFocusSingle: (elementId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
  onReset: () => void;
}

const SearchToolbar: React.FC<SearchToolbarProps> = ({
  elements,
  onSearch,
  onFocusSingle,
  isCollapsed,
  onToggle,
  isDarkMode,
  onReset
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  // Debounce and Filter Logic
  useEffect(() => {
    // Clear highlights if empty
    if (!searchTerm.trim()) {
      onSearch(new Set());
      setMatchCount(0);
      return;
    }

    const termLower = searchTerm.toLowerCase();
    const matches = elements.filter(e => e.name.toLowerCase().includes(termLower));
    const matchIds = new Set(matches.map(e => e.id));

    setMatchCount(matches.length);
    onSearch(matchIds);

    // Auto-focus if exactly one match
    if (matches.length === 1) {
      onFocusSingle(matches[0].id);
    }

  }, [searchTerm, elements]);

  // Clear search when collapsed
  useEffect(() => {
    if (isCollapsed) {
      setSearchTerm('');
      onSearch(new Set());
    }
  }, [isCollapsed]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (!searchTerm) {
        onToggle();
      } else {
        setSearchTerm('');
        onReset();
      }
    }
  };

  const dropdownBgClass = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200';
  const buttonStyle = isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-teal-400' : 'bg-white hover:bg-gray-50 border-gray-200 text-teal-600';
  const textMain = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const inputBg = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className="relative pointer-events-auto">
      <button
        onClick={onToggle}
        className={`w-20 h-20 flex flex-col items-center justify-center gap-1 rounded-lg border shadow-lg transition-colors flex-shrink-0 ${buttonStyle}`}
        title={isCollapsed ? "Open Search" : "Close Search"}
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <span className={`text-xs font-bold tracking-wider ${textMain}`}>SEARCH</span>
      </button>

      {!isCollapsed && (
        <div className={`absolute top-full left-0 mt-2 z-50 w-72 rounded-lg border shadow-xl p-3 animate-fade-in ${dropdownBgClass}`}>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${textMain}`}>
                Find Agent
              </label>
              {searchTerm && (
                <span className={`text-[10px] font-bold ${matchCount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {matchCount} match{matchCount !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter matching name..."
                className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 ${inputBg}`}
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); onReset(); }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchToolbar;
