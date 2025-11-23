
import React from 'react';
import { TrizToolType } from '../types';

interface TrizToolbarProps {
  onSelectTool: (tool: TrizToolType) => void;
  activeTool: TrizToolType;
  isCollapsed: boolean;
  onToggle: () => void;
}

const TRIZ_TOOLS = [
  { 
    id: 'contradiction' as TrizToolType, 
    name: 'Contradiction Matrix', 
    desc: 'Solve technical conflicts',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 8h4M8 10v4M10 16h4M16 10v4" opacity="0.5" />
      </svg>
    ),
    color: '#6366f1' // Indigo
  },
  { 
    id: 'principles' as TrizToolType, 
    name: '40 Principles', 
    desc: 'Inventive Principles',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    color: '#8b5cf6' // Violet
  },
  { 
    id: 'ariz' as TrizToolType, 
    name: 'ARIZ', 
    desc: 'Algorithm for Inventive Problem Solving',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: '#ec4899' // Pink
  },
  { 
    id: 'sufield' as TrizToolType, 
    name: 'Su-Field', 
    desc: 'Substance-Field Analysis',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    color: '#f43f5e' // Rose
  },
  { 
    id: 'trends' as TrizToolType, 
    name: 'Evolution Trends', 
    desc: 'Engineering Evolution',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: '#14b8a6' // Teal
  }
];

const TrizToolbar: React.FC<TrizToolbarProps> = ({
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
            title={isCollapsed ? "Expand TRIZ Tools" : "Collapse TRIZ Tools"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            </div>
            <span className="text-xs font-bold tracking-wider text-gray-300">TRIZ</span>
        </button>

        {!isCollapsed && (
            <div className="flex items-center p-3 animate-fade-in bg-gray-800 h-20 gap-1">
                 {TRIZ_TOOLS.map(tool => (
                     <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className={`flex flex-col h-full w-14 items-center justify-end group transition-all rounded hover:bg-gray-700 px-1 pb-1 ${activeTool === tool.id ? 'bg-gray-700 ring-1 ring-indigo-500' : ''}`}
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
                        Problem Solving
                     </span>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TrizToolbar;
