
import React from 'react';
import { SsmToolType } from '../types';

interface SsmToolbarProps {
  onSelectTool: (tool: SsmToolType) => void;
  activeTool: SsmToolType;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
}

const SSM_TOOLS = [
  { 
    id: 'rich_picture' as SsmToolType, 
    name: 'Rich Picture', 
    desc: 'Explore Relationships',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: '#06b6d4' // Cyan
  },
  { 
    id: 'catwoe' as SsmToolType, 
    name: 'CATWOE', 
    desc: 'Worldview Analysis',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: '#a855f7' // Purple
  },
  { 
    id: 'activity_models' as SsmToolType, 
    name: 'Activity Models', 
    desc: 'Root Definitions',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: '#f472b6' // Pink
  },
  { 
    id: 'comparison' as SsmToolType, 
    name: 'Comparison', 
    desc: 'Debate & Accommodate',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    color: '#22c55e' // Green
  }
];

const SsmToolbar: React.FC<SsmToolbarProps> = ({
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
            title={isCollapsed ? "Expand SSM Tools" : "Collapse SSM Tools"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </div>
            <span className="text-xs font-bold tracking-wider text-gray-300">SSM</span>
        </button>

        {!isCollapsed && (
            <div className="flex items-center p-3 animate-fade-in bg-gray-800 h-20 gap-1">
                 {SSM_TOOLS.map(tool => (
                     <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className={`flex flex-col h-full w-14 items-center justify-end group transition-all rounded hover:bg-gray-700 px-1 pb-1 ${activeTool === tool.id ? 'bg-gray-700 ring-1 ring-cyan-500' : ''}`}
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
                        Soft Systems
                     </span>
                     <button 
                        onClick={onOpenSettings}
                        className="absolute top-0 right-0 -mt-2 -mr-1 text-gray-600 hover:text-gray-300 transition-colors"
                        title="SSM Settings"
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

export default SsmToolbar;
