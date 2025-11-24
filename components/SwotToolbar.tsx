
import React from 'react';
import { SwotToolType } from '../types';

interface SwotToolbarProps {
  onSelectTool: (tool: SwotToolType) => void;
  activeTool: SwotToolType;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
}

const SWOT_TOOLS = [
  { 
    id: 'matrix' as SwotToolType, 
    name: 'SWOT Matrix', 
    desc: 'Strategic Planning',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2h-2a2 2 0 01-2-2v-2z" />
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
  onOpenSettings
}) => {

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
      <div className="flex items-stretch gap-0 bg-gray-800 bg-opacity-90 rounded-lg border border-gray-600 shadow-lg pointer-events-auto overflow-hidden relative">
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
                 <div className="ml-2 pl-2 border-l border-gray-600 h-12 flex flex-col justify-center relative">
                     <span className="text-[9px] text-gray-500 uppercase font-bold w-16 leading-tight">
                        Strategic Analysis
                     </span>
                     <button 
                        onClick={onOpenSettings}
                        className="absolute top-0 right-0 -mt-2 -mr-1 text-gray-600 hover:text-gray-300 transition-colors"
                        title="SWOT Settings"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                     </button>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SwotToolbar;
