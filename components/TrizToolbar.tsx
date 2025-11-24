
import React from 'react';
import { TrizToolType } from '../types';

interface TrizToolbarProps {
  onSelectTool: (tool: TrizToolType) => void;
  activeTool: TrizToolType;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
}

const TRIZ_TOOLS = [
  { 
    id: 'contradiction' as TrizToolType, 
    name: 'Contradiction Matrix', 
    desc: 'Solve technical conflicts using the 40 principles.',
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
    desc: 'Apply inventive principles to specific nodes.',
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
    desc: 'Step-by-step algorithm for complex problem solving.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: '#ec4899' // Pink
  },
  { 
    id: 'sufield' as TrizToolType, 
    name: 'Su-Field Analysis', 
    desc: 'Model systems as Substance-Field interactions.',
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
    desc: 'Predict future system development stages.',
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
  onOpenSettings
}) => {

  return (
    <div className="relative pointer-events-auto">
        {/* Collapse Toggle / Main Button */}
        <div className="relative">
            <button 
                onClick={onToggle}
                className={`h-20 w-20 bg-gray-800 hover:bg-gray-700 border border-gray-600 shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${!isCollapsed ? 'ring-2 ring-indigo-500 bg-gray-700' : ''}`}
                title={isCollapsed ? "Expand TRIZ Tools" : "Close TRIZ Tools"}
            >
                <div className="relative w-8 h-8 flex items-center justify-center text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>
                <span className="text-xs font-bold tracking-wider text-gray-300">TRIZ</span>
            </button>
            
            <button 
                onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
                className="absolute top-0 right-0 p-1 text-gray-500 hover:text-white bg-gray-800/50 rounded-bl hover:bg-gray-600 transition-colors"
                title="TRIZ Settings"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>

        {!isCollapsed && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl z-50 flex flex-col max-h-[60vh] overflow-y-auto animate-fade-in-down scrollbar-thin scrollbar-thumb-gray-600">
                 <div className="p-2 bg-gray-800 border-b border-gray-700 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">
                     Problem Solving Tools
                 </div>
                 
                 {TRIZ_TOOLS.map(tool => (
                     <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className={`flex items-start text-left p-3 border-b border-gray-700 last:border-0 hover:bg-gray-800 transition-colors group`}
                     >
                         <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110" style={{ color: tool.color }}>
                             {tool.icon}
                         </div>
                         <div>
                             <div className="font-bold text-gray-200 text-sm mb-0.5 group-hover:text-white">{tool.name}</div>
                             <p className="text-xs text-gray-400 leading-tight group-hover:text-gray-300">
                                 {tool.desc}
                             </p>
                         </div>
                     </button>
                 ))}
            </div>
        )}
    </div>
  );
};

export default TrizToolbar;
