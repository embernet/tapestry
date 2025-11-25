
import React from 'react';
import { SwotToolType } from '../types';

interface SwotToolbarProps {
  onSelectTool: (tool: SwotToolType) => void;
  activeTool: SwotToolType;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
}

const STRATEGY_TOOLS = [
  { 
    id: 'matrix' as SwotToolType, 
    name: 'SWOT Matrix', 
    desc: 'Strengths, Weaknesses, Opportunities, Threats',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
        <rect x="4" y="4" width="7" height="7" rx="1" className="fill-green-500" />
        <rect x="13" y="4" width="7" height="7" rx="1" className="fill-red-300" />
        <rect x="4" y="13" width="7" height="7" rx="1" className="fill-yellow-400" />
        <rect x="13" y="13" width="7" height="7" rx="1" className="fill-red-700" />
      </svg>
    ),
    color: '#84cc16' // Lime-500
  },
  { 
    id: 'pestel' as SwotToolType, 
    name: 'PESTEL / PESTLE', 
    desc: 'Political, Economic, Social, Tech, Env, Legal',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: '#38bdf8' // Sky-400
  },
  { 
    id: 'steer' as SwotToolType, 
    name: 'STEER', 
    desc: 'Socio-cultural, Tech, Economic, Eco, Regulatory',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: '#fbbf24' // Amber-400
  },
  { 
    id: 'destep' as SwotToolType, 
    name: 'DESTEP', 
    desc: 'Demographic, Econ, Social, Tech, Eco, Political',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: '#c084fc' // Purple-400
  },
  { 
    id: 'longpest' as SwotToolType, 
    name: 'LoNGPEST', 
    desc: 'Local, National, Global + PEST Factors',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    color: '#2dd4bf' // Teal-400
  },
  { 
    id: 'five_forces' as SwotToolType, 
    name: 'Porter’s Five Forces', 
    desc: 'Rivalry, Entrants, Suppliers, Buyers, Substitutes',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: '#f87171' // Red-400
  },
  { 
    id: 'cage' as SwotToolType, 
    name: 'CAGE Framework', 
    desc: 'Cultural, Administrative, Geographic, Economic',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    color: '#fb923c' // Orange-400
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
    <div className="relative pointer-events-auto">
        {/* Collapse Toggle / Main Button */}
        <div className="relative">
            <button 
                onClick={onToggle}
                className={`h-20 w-20 bg-gray-800 hover:bg-gray-700 border border-gray-600 shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${!isCollapsed ? 'ring-2 ring-lime-500 bg-gray-700' : ''}`}
                title={isCollapsed ? "Expand Strategy Tools" : "Close Strategy Tools"}
            >
                <div className="relative w-8 h-8 flex items-center justify-center text-lime-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <span className="text-[10px] font-bold tracking-wider text-gray-300">STRATEGY</span>
            </button>
            
            <button 
                onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
                className="absolute top-0 right-0 p-1 text-gray-500 hover:text-white bg-gray-800/50 rounded-bl hover:bg-gray-600 transition-colors"
                title="Strategy Settings"
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
                     Strategic Analysis Tools
                 </div>
                 
                 {STRATEGY_TOOLS.map(tool => (
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

export default SwotToolbar;
