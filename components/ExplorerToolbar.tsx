
import React from 'react';
import { ExplorerToolType } from '../types';

interface ExplorerToolbarProps {
  onSelectTool: (tool: ExplorerToolType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const EXPLORER_TOOLS = [
  { 
    id: 'treemap' as ExplorerToolType, 
    name: 'Treemap Explorer', 
    desc: 'Hierarchical visualization of graph structure and density.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    color: '#facc15' // Yellow
  },
  { 
    id: 'sunburst' as ExplorerToolType, 
    name: 'Sunburst Explorer', 
    desc: 'Focus on a node and expand relationships outward by hops.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: '#fb923c' // Orange
  },
  { 
    id: 'tags' as ExplorerToolType, 
    name: 'Tag Distribution', 
    desc: 'Analyze the frequency and spread of tags across nodes.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    color: '#60a5fa' // Blue
  },
  { 
    id: 'relationships' as ExplorerToolType, 
    name: 'Relationship Types', 
    desc: 'Breakdown of connection types and directionality.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    color: '#4ade80' // Green
  }
];

const ExplorerToolbar: React.FC<ExplorerToolbarProps> = ({
  onSelectTool,
  isCollapsed,
  onToggle,
}) => {

  return (
    <div className="relative pointer-events-auto">
      {/* Collapse Toggle / Main Button */}
      <div className="relative">
        <button 
            onClick={onToggle}
            className={`h-20 w-20 bg-gray-800 hover:bg-gray-700 border border-gray-600 shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${!isCollapsed ? 'ring-2 ring-yellow-500 bg-gray-700' : ''}`}
            title={isCollapsed ? "Expand Explorer" : "Close Explorer"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center text-yellow-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            </div>
            <span className="text-[10px] font-bold tracking-wider text-gray-300">EXPLORER</span>
        </button>
      </div>

      {!isCollapsed && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl z-50 flex flex-col max-h-[60vh] overflow-y-auto animate-fade-in-down scrollbar-thin scrollbar-thumb-gray-600">
             <div className="p-2 bg-gray-800 border-b border-gray-700 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">
                 Visual Explorer
             </div>
             
             {EXPLORER_TOOLS.map(tool => (
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

export default ExplorerToolbar;