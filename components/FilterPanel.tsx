
import React, { useState, useRef, useEffect } from 'react';
import { usePanelDrag } from '../hooks/usePanelDrag';
import { DateFilterState, Element, NodeFilterState } from '../types';
import { FilterContent } from './FilterContent';

interface FilterPanelProps {
  allTags: string[];
  tagCounts: Map<string, number>;
  filteredTagCounts?: Map<string, number>; // Added prop
  tagFilter: { included: Set<string>; excluded: Set<string> };
  dateFilter: DateFilterState;
  nodeFilter: NodeFilterState;
  elements: Element[];
  onTagFilterChange: (newFilter: { included: Set<string>; excluded: Set<string> }) => void;
  onDateFilterChange: (newFilter: DateFilterState) => void;
  onNodeFilterChange: (newFilter: NodeFilterState) => void;
  onClose: () => void;
  isDarkMode: boolean;
  allocateZIndex: () => number;
}

const FilterPanel: React.FC<FilterPanelProps> = (props) => {
  const { onClose, isDarkMode, allocateZIndex } = props;

  // Window Drag State
  const { position, handleMouseDown: handleDragMouseDown } = usePanelDrag({
    initialPosition: { x: 20, y: 140 },
    onDragStart: () => setZIndex(allocateZIndex())
  });

  const [zIndex, setZIndex] = useState(500);

  useEffect(() => {
    setZIndex(allocateZIndex());
  }, []);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging if clicking buttons inside header
    if ((e.target as HTMLElement).closest('button')) return;

    handleDragMouseDown(e);
  };



  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const sectionBorderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div
      className={`fixed w-[500px] rounded-lg shadow-2xl border ${bgClass} ${borderClass} flex flex-col max-h-[calc(100vh-160px)] transition-opacity duration-200`}
      style={{ left: position.x, top: position.y, zIndex: zIndex }}
    >
      <div
        className={`p-4 flex-shrink-0 flex justify-between items-center border-b ${sectionBorderClass} cursor-move select-none`}
        onMouseDown={handleMouseDown}
      >
        <h2 className={`text-xl font-bold ${textClass}`}>Filter</h2>
        <button onClick={onClose} className={`${subTextClass} hover:${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar">
        <FilterContent {...props} />
      </div>

      <div className={`flex-shrink-0 p-4 flex justify-end items-center border-t ${sectionBorderClass}`}>
        <button
          onClick={onClose}
          className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} text-sm font-semibold py-1.5 px-4 rounded-md transition duration-150`}
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;