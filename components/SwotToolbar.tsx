
import React from 'react';
import { SwotToolType } from '../types';

interface SwotToolbarProps {
  onSelectTool: (tool: SwotToolType) => void;
  activeTool: SwotToolType;
  isCollapsed: boolean;
  onToggle: () => void;
}

const SWOT_TOOLS = [
  { 
    id: 'matrix' as SwotToolType, 
    name: 'SWOT Matrix', 
    desc: 'Strategic Planning',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    color: '#84cc16' // Lime-500
  }
];

const SwotToolbar: React.FC<SwotToolbarProps> = ({
  onSelectTool,
  activeTool,
  isCollapsed,
  onToggle,
}) => {

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
      <div className="flex items-stretch gap-0 bg-gray-800 bg-opacity-90 rounded-lg border border-gray-600 shadow-lg pointer-events-auto overflow-hidden">
        {/* Collapse Toggle */}
        <button 
            onClick={onToggle}
            className="bg-gray-700 hover:bg-gray-600 border-r border-gray-600 w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 gap-1"
            title={isCollapsed ? "Expand SWOT Analysis" : "Collapse SWOT Analysis"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-lime-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <span className="text-xs font-bold tracking-wider text-gray-300">SWOT</span>
        </button>

        {!isCollapsed && (
            <div className="flex items-center p-3 animate-fade-in bg-gray-800 h-20 gap-1">
                 {SWOT_TOOLS.map(tool => (
                     <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className={`flex flex-col h-full w-14 items-center justify-end group transition-all rounded hover:bg-gray-700 px-1 pb-1 ${activeTool === tool.id ? 'bg-gray-700 ring-1 ring-lime-500' : ''}`}
                        title={tool.name + ": " + tool.desc}
                     >
                         <div className="mb-1 transition-transform group-hover:scale-110" style={{ color: tool.color }}>
                             {tool.icon}
                         </div>
                         <div className="text-[9px] font-bold text-gray-400 text-center leading-tight group-hover:text-white">
                             {tool.name}
                         </div>
                     </button>
                 ))}
                 <div className="ml-2 pl-2 border-l border-gray-600 h-12 flex flex-col justify-center">
                     <span className="text-[9px] text-gray-500 uppercase font-bold w-16 leading-tight">
                        Strategic Analysis
                     </span>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SwotToolbar;
