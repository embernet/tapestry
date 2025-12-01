
import React, { useState } from 'react';
import { DateFilterState, Element, NodeFilterState } from '../types';

interface FilterPanelProps {
  allTags: string[];
  tagCounts: Map<string, number>;
  tagFilter: { included: Set<string>; excluded: Set<string> };
  dateFilter: DateFilterState;
  nodeFilter: NodeFilterState;
  elements: Element[];
  onTagFilterChange: (newFilter: { included: Set<string>; excluded: Set<string> }) => void;
  onDateFilterChange: (newFilter: DateFilterState) => void;
  onNodeFilterChange: (newFilter: NodeFilterState) => void;
  onClose: () => void;
  isDarkMode: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
    allTags, tagCounts, tagFilter, dateFilter, nodeFilter, elements, 
    onTagFilterChange, onDateFilterChange, onNodeFilterChange, onClose, isDarkMode 
}) => {
  const { included, excluded } = tagFilter;
  const [isDateExpanded, setIsDateExpanded] = useState(false);
  const [isNodeExpanded, setIsNodeExpanded] = useState(true);

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

  // Node Filter Handlers
  const handleNodeFilterToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      onNodeFilterChange({ ...nodeFilter, active: !nodeFilter.active });
  };

  const sortedElements = [...elements].sort((a, b) => a.name.localeCompare(b.name));

  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const hoverBgClass = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const inputBgClass = isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900';
  const inputBorderClass = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const sectionBorderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const buttonBgClass = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600';

  return (
    <div className={`absolute top-44 left-4 bottom-4 w-96 ${bgClass} border ${borderClass} rounded-lg shadow-2xl z-30 flex flex-col`}>
      <div className="p-6 flex-shrink-0 flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${textClass}`}>Filter</h2>
        <button onClick={onClose} className={`${subTextClass} hover:${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto">
        {/* Node Connectivity Filter Section */}
        <div className={`px-6 py-4 border-b ${sectionBorderClass}`}>
            <div 
                className="flex justify-between items-center cursor-pointer group" 
                onClick={() => setIsNodeExpanded(!isNodeExpanded)}
            >
                <div className="flex items-center space-x-2">
                    <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>By Neighborhood</h3>
                </div>
                <div className="flex items-center space-x-2">
                     <button
                        onClick={handleNodeFilterToggle}
                        className={`text-xs px-2 py-1 rounded font-bold transition-colors ${nodeFilter.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                     >
                        {nodeFilter.active ? 'ON' : 'OFF'}
                     </button>
                     <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 ${subTextClass} transform transition-transform ${isNodeExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            
            {isNodeExpanded && (
                <div className={`mt-4 space-y-4 transition-opacity ${nodeFilter.active ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div>
                        <label className={`block text-xs ${subTextClass} mb-1 uppercase font-bold`}>Center Node</label>
                        <select
                            value={nodeFilter.centerId || ''}
                            onChange={(e) => onNodeFilterChange({ ...nodeFilter, centerId: e.target.value })}
                            className={`w-full ${inputBgClass} border ${inputBorderClass} rounded px-2 py-2 text-sm focus:outline-none focus:border-blue-500`}
                        >
                            <option value="">-- Select Center Node --</option>
                            {sortedElements.map(el => (
                                <option key={el.id} value={el.id}>{el.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className={`block text-xs ${subTextClass} uppercase font-bold`}>Distance (Hops)</label>
                            <span className={`text-xs font-bold ${textClass}`}>{nodeFilter.hops}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onNodeFilterChange({ ...nodeFilter, hops: Math.max(0, nodeFilter.hops - 1) }); }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${buttonBgClass} text-xs font-bold transition-colors flex-shrink-0`}
                                disabled={nodeFilter.hops <= 0}
                            >
                                -
                            </button>
                            <input 
                                type="range" 
                                min="0" 
                                max="6" 
                                step="1"
                                value={nodeFilter.hops}
                                onChange={(e) => onNodeFilterChange({ ...nodeFilter, hops: parseInt(e.target.value) })}
                                className="flex-grow h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <button 
                                onClick={(e) => { e.stopPropagation(); onNodeFilterChange({ ...nodeFilter, hops: Math.min(6, nodeFilter.hops + 1) }); }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${buttonBgClass} text-xs font-bold transition-colors flex-shrink-0`}
                                disabled={nodeFilter.hops >= 6}
                            >
                                +
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                            0 hops = Center node only. 1 hop = Direct neighbors.
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* Date Filter Section */}
        <div className={`px-6 py-4 border-b ${sectionBorderClass}`}>
            <div 
                className="flex justify-between items-center cursor-pointer group" 
                onClick={() => setIsDateExpanded(!isDateExpanded)}
            >
                <div className="flex items-center space-x-2">
                    <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Date Range</h3>
                </div>
                <div className="flex items-center space-x-2">
                     <span className={`text-xs px-2 py-1 rounded ${hasDateFilter ? 'bg-blue-900 text-blue-200' : 'bg-gray-200 text-gray-700'}`}>
                        {hasDateFilter ? 'Custom' : 'All'}
                     </span>
                     {hasDateFilter && (
                         <button 
                            onClick={handleClearDateFilter}
                            className={`${subTextClass} hover:${isDarkMode ? 'text-white' : 'text-gray-900'} hover:${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full p-1`}
                            title="Clear date filters"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                         </button>
                     )}
                     <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 ${subTextClass} transform transition-transform ${isDateExpanded ? 'rotate-180' : ''}`} 
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
                        <h4 className={`text-xs font-bold ${subTextClass} uppercase tracking-wide`}>Created</h4>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className={`block text-xs ${subTextClass} mb-1`}>After</label>
                                <input 
                                    type="date" 
                                    value={dateFilter.createdAfter}
                                    onChange={(e) => handleDateChange('createdAfter', e.target.value)}
                                    className={`w-full ${inputBgClass} border ${inputBorderClass} rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500`}
                                />
                             </div>
                             <div>
                                <label className={`block text-xs ${subTextClass} mb-1`}>Before</label>
                                <input 
                                    type="date" 
                                    value={dateFilter.createdBefore}
                                    onChange={(e) => handleDateChange('createdBefore', e.target.value)}
                                    className={`w-full ${inputBgClass} border ${inputBorderClass} rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500`}
                                />
                             </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className={`text-xs font-bold ${subTextClass} uppercase tracking-wide`}>Last Updated</h4>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className={`block text-xs ${subTextClass} mb-1`}>After</label>
                                <input 
                                    type="date" 
                                    value={dateFilter.updatedAfter}
                                    onChange={(e) => handleDateChange('updatedAfter', e.target.value)}
                                    className={`w-full ${inputBgClass} border ${inputBorderClass} rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500`}
                                />
                             </div>
                             <div>
                                <label className={`block text-xs ${subTextClass} mb-1`}>Before</label>
                                <input 
                                    type="date" 
                                    value={dateFilter.updatedBefore}
                                    onChange={(e) => handleDateChange('updatedBefore', e.target.value)}
                                    className={`w-full ${inputBgClass} border ${inputBorderClass} rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500`}
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
                 <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>By Tags</h3>
            </div>
            
            <div className="flex flex-col gap-2 mb-4">
                <div className="flex justify-between items-center space-x-2">
                <button onClick={handleIncludeAll} className={`w-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} text-xs font-semibold py-2 px-4 rounded-md transition duration-150`}>
                    Include All
                </button>
                <button onClick={handleIncludeNone} className={`w-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} text-xs font-semibold py-2 px-4 rounded-md transition duration-150`}>
                    Include None
                </button>
                </div>
                <button onClick={handleClearExclusions} className={`w-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} text-xs font-semibold py-2 px-4 rounded-md transition duration-150`}>
                Clear Exclusions
                </button>
            </div>

            {/* Header */}
            <div className={`flex items-center border-b ${sectionBorderClass} pb-2 text-xs ${subTextClass} font-bold uppercase`}>
                <span className="flex-grow">Tag</span>
                <span className="w-14 text-right pr-2">Count</span>
                <span className="w-16 text-center">Include</span>
                <span className="w-16 text-center">Exclude</span>
            </div>

            <div className="pt-2">
                {allTags.length > 0 ? (
                <div className="space-y-1">
                    {allTags.map(tag => (
                    <div key={tag} className={`flex items-center p-2 rounded-md ${hoverBgClass}`}>
                        <span className={`flex-grow select-none text-sm ${textClass}`}>{tag}</span>
                        <span className={`w-14 text-right ${subTextClass} font-mono text-xs pr-2`}>
                        {tagCounts.get(tag) || 0}
                        </span>
                        <span className="w-16 flex justify-center">
                        <input
                            type="checkbox"
                            checked={included.has(tag)}
                            onChange={() => handleToggle(tag, 'include')}
                            className={`form-checkbox h-4 w-4 rounded ${isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-300'} text-blue-500 focus:ring-blue-500`}
                            aria-label={`Include ${tag}`}
                        />
                        </span>
                        <span className="w-16 flex justify-center">
                        <input
                            type="checkbox"
                            checked={excluded.has(tag)}
                            onChange={() => handleToggle(tag, 'exclude')}
                            className={`form-checkbox h-4 w-4 rounded ${isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-300'} text-red-500 focus:ring-red-500`}
                            aria-label={`Exclude ${tag}`}
                        />
                        </span>
                    </div>
                    ))}
                </div>
                ) : (
                <p className={`${subTextClass} text-center pt-4 text-sm`}>No tags found in this model.</p>
                )}
            </div>
        </div>
      </div>

      <div className={`flex-shrink-0 p-6 flex justify-end items-center border-t ${sectionBorderClass}`}>
        <button
          onClick={onClose}
          className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} font-semibold py-2 px-4 rounded-md transition duration-150`}
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
