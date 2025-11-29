
import React from 'react';
import { MiningToolType } from '../types';

interface MiningToolbarProps {
  onSelectTool: (tool: MiningToolType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

const MiningToolbar: React.FC<MiningToolbarProps> = ({
  onSelectTool,
  isCollapsed,
  onToggle,
  isDarkMode
}) => {

  const bgClass = isDarkMode ? 'bg-gray-800 bg-opacity-90 border-gray-600' : 'bg-white bg-opacity-95 border-gray-200';
  const controlBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const buttonBgClass = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200';
  const actionButtonBg = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const textMain = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const textLabel = isDarkMode ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
      <div className={`flex items-stretch gap-0 rounded-lg border shadow-lg pointer-events-auto overflow-hidden ${bgClass}`}>
        {/* Collapse Toggle */}
        <button 
            onClick={onToggle}
            className={`border-r w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 gap-1 ${buttonBgClass}`}
            title={isCollapsed ? "Expand Data Mining" : "Collapse Data Mining"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <span className={`text-xs font-bold tracking-wider ${textMain}`}>MINING</span>
        </button>

        {!isCollapsed && (
            <div className={`flex items-center p-3 animate-fade-in h-20 gap-1 ${controlBgClass}`}>
                 <button
                    onClick={() => onSelectTool('dashboard')}
                    className={`flex flex-col h-full w-24 items-center justify-end group transition-all rounded px-1 pb-1 ${actionButtonBg}`}
                    title="Open Data Mining Dashboard"
                 >
                     <div className="mb-1 transition-transform group-hover:scale-110 text-yellow-400">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                     </div>
                     <div className={`text-[10px] font-bold text-center leading-tight group-hover:${isDarkMode ? 'text-white' : 'text-black'} ${textSub}`}>
                         Open Dashboard
                     </div>
                 </button>
                 <div className={`ml-2 pl-2 border-l h-12 flex flex-col justify-center ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                     <span className={`text-[9px] uppercase font-bold w-16 leading-tight ${textLabel}`}>
                        Data Analysis
                     </span>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MiningToolbar;
