
import React from 'react';
import { DataToolType } from '../types';

interface DataIoToolbarProps {
  onSelectTool: (tool: DataToolType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

const DataIoToolbar: React.FC<DataIoToolbarProps> = ({
  onSelectTool,
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
            className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-violet-500' : ''}`}
            title={isCollapsed ? "Expand Data Tools" : "Close Data Tools"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center text-violet-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
                    {/* Row 1: 1011 */}
                    <path d="M3 4v4" />
                    <circle cx="9" cy="6" r="2" />
                    <path d="M15 4v4" />
                    <path d="M21 4v4" />
                    
                    {/* Row 2: 0101 */}
                    <circle cx="3" cy="12" r="2" />
                    <path d="M9 10v4" />
                    <circle cx="15" cy="12" r="2" />
                    <path d="M21 10v4" />
                    
                    {/* Row 3: 1001 */}
                    <path d="M3 16v4" />
                    <circle cx="9" cy="18" r="2" />
                    <circle cx="15" cy="18" r="2" />
                    <path d="M21 16v4" />
                </svg>
            </div>
            <span className={`text-[9px] font-bold tracking-wider ${textMain}`}>DATA I/O</span>
        </button>
      </div>

      {!isCollapsed && (
        <div className={`absolute top-full left-0 mt-2 w-64 border rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in-down ${dropdownBg}`}>
             <div className={`p-2 border-b text-[10px] font-bold uppercase tracking-wider text-center ${headerBg} ${textHeader}`}>
                 Data Management
             </div>
             
             {/* CSV Import/Export */}
             <button
                onClick={() => onSelectTool('csv')}
                className={`flex items-start text-left p-3 border-b transition-colors group ${itemHover}`}
             >
                 <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-orange-400">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                    </svg>
                 </div>
                 <div>
                     <div className={`font-bold text-sm mb-0.5 ${textItem}`}>CSV Import/Export</div>
                     <p className={`text-xs leading-tight ${textDesc}`}>
                         Import spreadsheets or export node data.
                     </p>
                 </div>
             </button>

             {/* Markdown */}
             <button
                onClick={() => onSelectTool('markdown')}
                className={`flex items-start text-left p-3 border-b transition-colors group ${itemHover}`}
             >
                 <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-blue-400">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                 </div>
                 <div>
                     <div className={`font-bold text-sm mb-0.5 ${textItem}`}>Markdown View</div>
                     <p className={`text-xs leading-tight ${textDesc}`}>
                         Edit graph structure using text syntax.
                     </p>
                 </div>
             </button>

             {/* JSON */}
             <button
                onClick={() => onSelectTool('json')}
                className={`flex items-start text-left p-3 transition-colors group ${itemHover}`}
             >
                 <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-yellow-400">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                 </div>
                 <div>
                     <div className={`font-bold text-sm mb-0.5 ${textItem}`}>JSON View</div>
                     <p className={`text-xs leading-tight ${textDesc}`}>
                         Raw data inspection and editing.
                     </p>
                 </div>
             </button>
        </div>
      )}
    </div>
  );
};

export default DataIoToolbar;
