
import React from 'react';
import { SwotToolType, CustomStrategyTool } from '../types';

interface SwotToolbarProps {
  onSelectTool: (tool: SwotToolType) => void;
  activeTool: SwotToolType;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  customStrategies?: CustomStrategyTool[];
  onOpenGuidance?: () => void;
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
  onOpenSettings,
  isDarkMode,
  customStrategies = [],
  onOpenGuidance
}) => {

  const bgClass = isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200';
  const dropdownBg = isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200';
  const headerBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const itemHover = isDarkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-100';
  const textMain = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textHeader = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const textItem = isDarkMode ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black';
  const textDesc = isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700';

  return (
    <div className="relative pointer-events-auto">
      {/* Collapse Toggle / Main Button */}
      <div className="relative">
        <button
          onClick={onToggle}
          className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-lime-500' : ''}`}
          title={isCollapsed ? "Expand Strategy Tools" : "Close Strategy Tools"}
        >
          <div className="relative w-8 h-8 flex items-center justify-center text-lime-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className={`text-xs font-bold tracking-wider ${textMain}`}>STRATEGY</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
          className={`absolute top-0 right-0 p-1 transition-colors rounded-bl ${isDarkMode ? 'text-gray-500 hover:text-white bg-gray-800/50 hover:bg-gray-600' : 'text-gray-400 hover:text-gray-900 bg-gray-100/50 hover:bg-gray-200'}`}
          title="Strategy Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className={`absolute top-full left-0 mt-2 w-72 border rounded-lg shadow-2xl z-[950] flex flex-col max-h-[60vh] overflow-y-auto animate-fade-in-down scrollbar-thin scrollbar-thumb-gray-600 ${dropdownBg}`}>
          <div className={`p-2 border-b flex justify-between items-center sticky top-0 z-10 ${headerBg}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider pl-1 ${textHeader}`}>
              Strategic Analysis Tools
            </span>
            {onOpenGuidance && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenGuidance(); }}
                className={`transition-colors p-1 rounded ${isDarkMode ? 'text-yellow-500 hover:text-white hover:bg-gray-700' : 'text-yellow-600 hover:text-gray-900 hover:bg-gray-200'}`}
                title="Guidance & Tips"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
              </button>
            )}
          </div>

          {STRATEGY_TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`flex items-start text-left p-3 border-b last:border-0 transition-colors group ${itemHover}`}
            >
              <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110" style={{ color: tool.color }}>
                {tool.icon}
              </div>
              <div>
                <div className={`font-bold text-sm mb-0.5 ${textItem}`}>{tool.name}</div>
                <p className={`text-xs leading-tight ${textDesc}`}>
                  {tool.desc}
                </p>
              </div>
            </button>
          ))}

          {/* Custom Tools Section */}
          <div className={`p-2 border-b border-t text-[10px] font-bold uppercase tracking-wider text-center ${headerBg} ${textHeader}`}>
            Custom Strategies
          </div>

          {customStrategies.map(tool => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(`custom-strategy-${tool.id}` as any)}
              className={`flex items-start text-left p-3 border-b last:border-0 transition-colors group ${itemHover}`}
            >
              <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <div className={`font-bold text-sm mb-0.5 ${textItem}`}>{tool.name}</div>
                <p className={`text-xs leading-tight ${textDesc} truncate max-w-[180px]`}>
                  {tool.description || "Custom analysis tool"}
                </p>
              </div>
            </button>
          ))}

          <button
            onClick={() => onSelectTool('custom_create')}
            className={`flex items-center justify-center p-3 border-t transition-colors group ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
          >
            <span className="text-lime-500 font-bold text-xs flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create New...
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SwotToolbar;
