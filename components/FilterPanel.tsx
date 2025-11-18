import React, { useState } from 'react';
import { DateFilterState } from '../types';

interface FilterPanelProps {
  allTags: string[];
  tagCounts: Map<string, number>;
  tagFilter: { included: Set<string>; excluded: Set<string> };
  dateFilter: DateFilterState;
  onTagFilterChange: (newFilter: { included: Set<string>; excluded: Set<string> }) => void;
  onDateFilterChange: (newFilter: DateFilterState) => void;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ allTags, tagCounts, tagFilter, dateFilter, onTagFilterChange, onDateFilterChange, onClose }) => {
  const { included, excluded } = tagFilter;
  const [isDateExpanded, setIsDateExpanded] = useState(false);

  const handleToggle = (tag: string, type: 'include' | 'exclude') => {
    const newIncluded = new Set(included);
    const newExcluded = new Set(excluded);

    if (type === 'include') {
      if (newIncluded.has(tag)) {
        newIncluded.delete(tag);
      } else {
        newIncluded.add(tag);
        newExcluded.delete(tag); // Cannot be excluded if included
      }
    } else { // type === 'exclude'
      if (newExcluded.has(tag)) {
        newExcluded.delete(tag);
      } else {
        newExcluded.add(tag);
        newIncluded.delete(tag); // Cannot be included if excluded
      }
    }
    onTagFilterChange({ included: newIncluded, excluded: newExcluded });
  };

  const handleIncludeAll = () => {
    onTagFilterChange({ included: new Set(allTags), excluded: new Set() });
  };

  const handleIncludeNone = () => {
    // Keep existing exclusions, but clear all inclusions
    onTagFilterChange({ included: new Set(), excluded: new Set(excluded) });
  };
  
  const handleClearExclusions = () => {
    const newIncluded = new Set(included);
    // Move all previously excluded tags back to the included set.
    excluded.forEach(tag => newIncluded.add(tag));
    onTagFilterChange({ included: newIncluded, excluded: new Set() });
  };

  const hasDateFilter = dateFilter.createdAfter || dateFilter.createdBefore || dateFilter.updatedAfter || dateFilter.updatedBefore;

  const handleClearDateFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateFilterChange({ createdAfter: '', createdBefore: '', updatedAfter: '', updatedBefore: '' });
  };

  const handleDateChange = (field: keyof DateFilterState, value: string) => {
    onDateFilterChange({ ...dateFilter, [field]: value });
  };

  return (
    <div className="bg-gray-800 border-r border-gray-700 h-full w-96 flex-shrink-0 z-20 flex flex-col">
      <div className="p-6 flex-shrink-0 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Filter</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto">
        {/* Date Filter Section */}
        <div className="px-6 py-4 border-b border-gray-700">
            <div 
                className="flex justify-between items-center cursor-pointer group" 
                onClick={() => setIsDateExpanded(!isDateExpanded)}
            >
                <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-200">Date Range</h3>
                </div>
                <div className="flex items-center space-x-2">
                     <span className={`text-xs px-2 py-1 rounded ${hasDateFilter ? 'bg-blue-900 text-blue-200' : 'text-gray-500'}`}>
                        {hasDateFilter ? 'Custom' : 'All'}
                     </span>
                     {hasDateFilter && (
                         <button 
                            onClick={handleClearDateFilter}
                            className="text-gray-400 hover:text-white hover:bg-gray-600 rounded-full p-1"
                            title="Clear date filters"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                         </button>
                     )}
                     <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 text-gray-500 transform transition-transform ${isDateExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            
            {isDateExpanded && (
                <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Created</h4>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="block text-xs text-gray-500 mb-1">After</label>
                                <input 
                                    type="date" 
                                    value={dateFilter.createdAfter}
                                    onChange={(e) => handleDateChange('createdAfter', e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                             </div>
                             <div>
                                <label className="block text-xs text-gray-500 mb-1">Before</label>
                                <input 
                                    type="date" 
                                    value={dateFilter.createdBefore}
                                    onChange={(e) => handleDateChange('createdBefore', e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                             </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Last Updated</h4>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="block text-xs text-gray-500 mb-1">After</label>
                                <input 
                                    type="date" 
                                    value={dateFilter.updatedAfter}
                                    onChange={(e) => handleDateChange('updatedAfter', e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                             </div>
                             <div>
                                <label className="block text-xs text-gray-500 mb-1">Before</label>
                                <input 
                                    type="date" 
                                    value={dateFilter.updatedBefore}
                                    onChange={(e) => handleDateChange('updatedBefore', e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Tag Filter Section */}
        <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-semibold text-gray-200">By Tags</h3>
            </div>
            
            <div className="flex flex-col gap-2 mb-4">
                <div className="flex justify-between items-center space-x-2">
                <button onClick={handleIncludeAll} className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-2 px-4 rounded-md transition duration-150">
                    Include All
                </button>
                <button onClick={handleIncludeNone} className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-2 px-4 rounded-md transition duration-150">
                    Include None
                </button>
                </div>
                <button onClick={handleClearExclusions} className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-2 px-4 rounded-md transition duration-150">
                Clear Exclusions
                </button>
            </div>

            {/* Header */}
            <div className="flex items-center border-b border-gray-700 pb-2 text-xs text-gray-400 font-bold uppercase">
                <span className="flex-grow">Tag</span>
                <span className="w-14 text-right pr-2">Count</span>
                <span className="w-16 text-center">Include</span>
                <span className="w-16 text-center">Exclude</span>
            </div>

            <div className="pt-2">
                {allTags.length > 0 ? (
                <div className="space-y-1">
                    {allTags.map(tag => (
                    <div key={tag} className="flex items-center p-2 rounded-md hover:bg-gray-700">
                        <span className="flex-grow select-none text-white text-sm">{tag}</span>
                        <span className="w-14 text-right text-gray-400 font-mono text-xs pr-2">
                        {tagCounts.get(tag) || 0}
                        </span>
                        <span className="w-16 flex justify-center">
                        <input
                            type="checkbox"
                            checked={included.has(tag)}
                            onChange={() => handleToggle(tag, 'include')}
                            className="form-checkbox h-4 w-4 rounded bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
                            aria-label={`Include ${tag}`}
                        />
                        </span>
                        <span className="w-16 flex justify-center">
                        <input
                            type="checkbox"
                            checked={excluded.has(tag)}
                            onChange={() => handleToggle(tag, 'exclude')}
                            className="form-checkbox h-4 w-4 rounded bg-gray-900 border-gray-600 text-red-500 focus:ring-red-500"
                            aria-label={`Exclude ${tag}`}
                        />
                        </span>
                    </div>
                    ))}
                </div>
                ) : (
                <p className="text-gray-500 text-center pt-4 text-sm">No tags found in this model.</p>
                )}
            </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-6 flex justify-end items-center border-t border-gray-700">
        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
