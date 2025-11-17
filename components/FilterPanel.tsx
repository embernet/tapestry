

import React from 'react';

interface FilterPanelProps {
  allTags: string[];
  tagCounts: Map<string, number>;
  tagFilter: { included: Set<string>; excluded: Set<string> };
  onTagFilterChange: (newFilter: { included: Set<string>; excluded: Set<string> }) => void;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ allTags, tagCounts, tagFilter, onTagFilterChange, onClose }) => {
  const { included, excluded } = tagFilter;

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

  return (
    <div className="bg-gray-800 border-r border-gray-700 h-full w-96 flex-shrink-0 z-20 flex flex-col">
      <div className="p-6 flex-shrink-0 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Filter by Tags</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-shrink-0 px-6 pb-4 flex flex-col gap-2">
        <div className="flex justify-between items-center space-x-2">
          <button onClick={handleIncludeAll} className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-150">
            Include All
          </button>
          <button onClick={handleIncludeNone} className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-150">
            Include None
          </button>
        </div>
         <button onClick={handleClearExclusions} className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-150">
          Clear Exclusions
        </button>
      </div>

      {/* Header */}
      <div className="px-6 pb-2 flex items-center border-b border-gray-700 text-xs text-gray-400 font-bold uppercase">
          <span className="flex-grow">Tag</span>
          <span className="w-14 text-right pr-2">Count</span>
          <span className="w-16 text-center">Include</span>
          <span className="w-16 text-center">Exclude</span>
      </div>

      <div className="flex-grow p-6 pt-2 overflow-y-auto">
        {allTags.length > 0 ? (
          <div className="space-y-1">
            {allTags.map(tag => (
              <div key={tag} className="flex items-center p-2 rounded-md hover:bg-gray-700">
                <span className="flex-grow select-none text-white">{tag}</span>
                <span className="w-14 text-right text-gray-400 font-mono text-sm pr-2">
                  {tagCounts.get(tag) || 0}
                </span>
                <span className="w-16 flex justify-center">
                  <input
                    type="checkbox"
                    checked={included.has(tag)}
                    onChange={() => handleToggle(tag, 'include')}
                    className="form-checkbox h-5 w-5 rounded bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
                    aria-label={`Include ${tag}`}
                  />
                </span>
                <span className="w-16 flex justify-center">
                  <input
                    type="checkbox"
                    checked={excluded.has(tag)}
                    onChange={() => handleToggle(tag, 'exclude')}
                    className="form-checkbox h-5 w-5 rounded bg-gray-900 border-gray-600 text-red-500 focus:ring-red-500"
                    aria-label={`Exclude ${tag}`}
                  />
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center pt-4">No tags found in this model.</p>
        )}
      </div>

      <div className="flex-shrink-0 p-6 flex justify-end items-center">
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
