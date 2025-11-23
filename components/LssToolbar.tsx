
import React from 'react';
import { LssToolType } from '../types';

interface LssToolbarProps {
  onSelectTool: (tool: LssToolType) => void;
  activeTool: LssToolType;
  isCollapsed: boolean;
  onToggle: () => void;
}

const LSS_TOOLS = [
  { 
    id: 'dmaic' as LssToolType, 
    name: 'DMAIC', 
    desc: 'Improvement Cycle',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    color: '#3b82f6' // Blue
  },
  { 
    id: '5whys' as LssToolType, 
    name: '5 Whys', 
    desc: 'Root Cause Analysis',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: '#f97316' // Orange
  },
  { 
    id: 'fishbone' as LssToolType, 
    name: 'Fishbone', 
    desc: 'Ishikawa Diagram',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12l6-6M4 12l6 6M20 12l-6-6M20 12l-6 6" />
      </svg>
    ),
    color: '#10b981' // Emerald
  },
  { 
    id: 'fmea' as LssToolType, 
    name: 'FMEA', 
    desc: 'Failure Modes & Effects',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: '#ef4444' // Red
  },
  { 
    id: 'vsm' as LssToolType, 
    name: 'VSM', 
    desc: 'Value Stream Mapping',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    ),
    color: '#8b5cf6' // Violet
  }
];

const LssToolbar: React.FC<LssToolbarProps> = ({
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
            title={isCollapsed ? "Expand Lean Six Sigma Tools" : "Collapse Lean Six Sigma Tools"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
            <span className="text-xs font-bold tracking-wider text-gray-300">LEAN</span>
        </button>

        {!isCollapsed && (
            <div className="flex items-center p-3 animate-fade-in bg-gray-800 h-20 gap-1">
                 {LSS_TOOLS.map(tool => (
                     <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className={`flex flex-col h-full w-14 items-center justify-end group transition-all rounded hover:bg-gray-700 px-1 pb-1 ${activeTool === tool.id ? 'bg-gray-700 ring-1 ring-blue-500' : ''}`}
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
                        Lean Six Sigma
                     </span>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default LssToolbar;
