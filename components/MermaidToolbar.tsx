
import React from 'react';
import { MermaidToolType } from '../types';

interface MermaidToolbarProps {
  onSelectTool: (tool: MermaidToolType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

const MermaidToolbar: React.FC<MermaidToolbarProps> = ({
  onSelectTool,
  isCollapsed,
  onToggle,
  isDarkMode
}) => {

  const bgClass = isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200';
  const controlBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const buttonBg = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const textMain = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const textLabel = isDarkMode ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
      <div className={`flex items-stretch gap-0 rounded-lg border shadow-lg pointer-events-auto overflow-hidden ${isDarkMode ? 'bg-gray-800 bg-opacity-90 border-gray-600' : 'bg-white bg-opacity-95 border-gray-200'}`}>
        {/* Collapse Toggle */}
        <button 
            onClick={onToggle}
            className={`border-r w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 gap-1 ${bgClass}`}
            title={isCollapsed ? "Expand Diagrams" : "Collapse Diagrams"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
            </div>
            <span className={`text-[9px] font-bold tracking-wider ${textMain}`}>DIAGRAM</span>
        </button>

        {!isCollapsed && (
            <div className={`flex items-center p-3 animate-fade-in h-20 gap-1 ${controlBgClass}`}>
                 <button
                    onClick={() => onSelectTool('editor')}
                    className={`flex flex-col h-full w-24 items-center justify-end group transition-all rounded px-1 pb-1 ${buttonBg}`}
                    title="Open Diagram Editor"
                 >
                     <div className="mb-1 transition-transform group-hover:scale-110 text-cyan-400">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                     </div>
                     <div className={`text-[10px] font-bold text-center leading-tight group-hover:${isDarkMode ? 'text-white' : 'text-black'} ${textSub}`}>
                         Diagram Editor
                     </div>
                 </button>
                 <div className={`ml-2 pl-2 border-l h-12 flex flex-col justify-center ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                     <span className={`text-[9px] uppercase font-bold w-16 leading-tight ${textLabel}`}>
                        Mermaid.js
                     </span>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MermaidToolbar;
