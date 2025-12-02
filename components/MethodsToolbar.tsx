
import React from 'react';
import { TOOL_DOCUMENTATION } from '../documentation';

interface MethodsToolbarProps {
  onSelectMethod: (methodId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

// IDs of tools to include in this group
const METHOD_IDS = ['scamper', 'triz', 'lss', 'toc', 'ssm'];

const MethodsToolbar: React.FC<MethodsToolbarProps> = ({
  onSelectMethod,
  isCollapsed,
  onToggle,
  isDarkMode
}) => {

  const bgClass = isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200';
  const dropdownBg = isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200';
  const headerBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const itemHover = isDarkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-100';
  const textMain = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textHeader = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const textItem = isDarkMode ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black';
  const textDesc = isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700';

  const methods = TOOL_DOCUMENTATION.filter(t => METHOD_IDS.includes(t.id));

  return (
    <div className="relative pointer-events-auto">
      {/* Collapse Toggle / Main Button */}
      <div className="relative">
        <button 
            onClick={onToggle}
            className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-indigo-500' : ''}`}
            title={isCollapsed ? "Expand Methods" : "Close Methods"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <span className={`text-xs font-bold tracking-wider ${textMain}`}>METHODS</span>
        </button>
      </div>

      {!isCollapsed && (
        <div className={`absolute top-full left-0 mt-2 w-72 border rounded-lg shadow-2xl z-50 flex flex-col max-h-[60vh] overflow-y-auto animate-fade-in-down scrollbar-thin scrollbar-thumb-gray-600 ${dropdownBg}`}>
             <div className={`p-2 border-b flex justify-between items-center sticky top-0 z-10 ${headerBg}`}>
                 <span className={`text-[10px] font-bold uppercase tracking-wider pl-1 ${textHeader}`}>
                     Problem Solving Methods
                 </span>
             </div>
             
             {methods.map(tool => (
                 <button
                    key={tool.id}
                    onClick={() => onSelectMethod(tool.id)}
                    className={`flex items-start text-left p-3 border-b last:border-0 transition-colors group ${itemHover}`}
                 >
                     <div className={`mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 ${tool.color}`}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {tool.icon}
                         </svg>
                     </div>
                     <div>
                         <div className={`font-bold text-sm mb-0.5 ${textItem}`}>{tool.name}</div>
                         <p className={`text-xs leading-tight ${textDesc}`}>
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

export default MethodsToolbar;
