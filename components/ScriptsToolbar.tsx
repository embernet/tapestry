
import React from 'react';
import { EXAMPLE_SCRIPTS } from '../constants';

interface ScriptsToolbarProps {
  onOpenEditor: () => void;
  onLoadExample: (code: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

const ScriptsToolbar: React.FC<ScriptsToolbarProps> = ({
  onOpenEditor,
  onLoadExample,
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

  return (
    <div className="relative pointer-events-auto">
      {/* Collapse Toggle / Main Button */}
      <div className="relative">
        <button 
            onClick={onToggle}
            className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-emerald-500' : ''}`}
            title={isCollapsed ? "Expand Scripts" : "Close Scripts"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            </div>
            <span className={`text-xs font-bold tracking-wider ${textMain}`}>SCRIPTS</span>
        </button>
      </div>

      {!isCollapsed && (
        <div className={`absolute top-full left-0 mt-2 w-72 border rounded-lg shadow-2xl z-50 flex flex-col max-h-[60vh] overflow-y-auto animate-fade-in-down scrollbar-thin scrollbar-thumb-gray-600 ${dropdownBg}`}>
             <div className={`p-2 border-b text-[10px] font-bold uppercase tracking-wider text-center ${headerBg} ${textHeader}`}>
                 Automation & Macros
             </div>
             
             {/* Open Editor Button */}
             <button
                onClick={onOpenEditor}
                className={`flex items-start text-left p-3 border-b transition-colors group ${itemHover}`}
             >
                 <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-emerald-400">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                 </div>
                 <div>
                     <div className={`font-bold text-sm mb-0.5 ${textItem}`}>Script Editor</div>
                     <p className={`text-xs leading-tight ${textDesc}`}>
                         Open the code editor to write or run scripts.
                     </p>
                 </div>
             </button>

             {EXAMPLE_SCRIPTS.map(ex => (
                 <button
                    key={ex.id}
                    onClick={() => onLoadExample(ex.code)}
                    className={`flex items-start text-left p-3 border-b last:border-0 transition-colors group ${itemHover}`}
                 >
                     <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-blue-400">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                             <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                     </div>
                     <div>
                         <div className={`font-bold text-sm mb-0.5 ${textItem}`}>{ex.name}</div>
                     </div>
                 </button>
             ))}
        </div>
      )}
    </div>
  );
};

export default ScriptsToolbar;
