
import React from 'react';
import { VisualiseToolType } from '../types';

interface VisualiseToolbarProps {
  onSelectTool: (tool: VisualiseToolType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

const VisualiseToolbar: React.FC<VisualiseToolbarProps> = ({
  onSelectTool,
  isCollapsed,
  onToggle,
  isDarkMode
}) => {

  const bgClass = isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200';
  const dropdownBg = isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200';
  const itemHover = isDarkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-100';
  const textMain = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textItem = isDarkMode ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black';
  const textDesc = isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700';

  return (
    <div className="relative pointer-events-auto">
      <button 
          onClick={onToggle}
          className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-rose-500' : ''}`}
          title={isCollapsed ? "Expand Visualization Tools" : "Collapse Visualization Tools"}
      >
          <div className="relative w-8 h-8 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
          </div>
          <span className={`text-[9px] font-bold tracking-wider ${textMain}`}>VISUALISE</span>
      </button>

      {!isCollapsed && (
          <div className={`absolute top-full left-0 mt-2 w-64 border rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in-down ${dropdownBg}`}>
               
               {/* Grid Button */}
               <button
                  onClick={() => onSelectTool('grid')}
                  className={`flex items-start text-left p-3 border-b transition-colors group ${itemHover}`}
               >
                   <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-rose-400">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4V4z M13 4h7v7h-7V4z M4 13h7v7H4v-7z M13 13h7v7h-7v-7z" />
                      </svg>
                   </div>
                   <div>
                       <div className={`font-bold text-sm mb-0.5 ${textItem}`}>Attribute Grid</div>
                       <p className={`text-xs leading-tight ${textDesc}`}>
                           Plot nodes on X/Y axes.
                       </p>
                   </div>
               </button>

               {/* Sketch Button */}
               <button
                  onClick={() => onSelectTool('sketch')}
                  className={`flex items-start text-left p-3 transition-colors group ${itemHover}`}
               >
                   <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-rose-400">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                   </div>
                   <div>
                       <div className={`font-bold text-sm mb-0.5 ${textItem}`}>Sketch View</div>
                       <p className={`text-xs leading-tight ${textDesc}`}>
                           Hand-drawn style visualization.
                       </p>
                   </div>
               </button>
          </div>
      )}
    </div>
  );
};

export default VisualiseToolbar;
