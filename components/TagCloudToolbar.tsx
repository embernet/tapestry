
import React from 'react';
import { TagCloudToolType } from '../types';

interface TagCloudToolbarProps {
  onSelectTool: (tool: TagCloudToolType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const TagCloudToolbar: React.FC<TagCloudToolbarProps> = ({
  onSelectTool,
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
            title={isCollapsed ? "Expand Tag Cloud" : "Collapse Tag Cloud"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
            </div>
            <span className="text-xs font-bold tracking-wider text-gray-300">CLOUD</span>
        </button>

        {!isCollapsed && (
            <div className="flex items-center p-3 animate-fade-in bg-gray-800 h-20 gap-1">
                 <button
                    onClick={() => onSelectTool('cloud')}
                    className="flex flex-col h-full w-24 items-center justify-end group transition-all rounded hover:bg-gray-700 px-1 pb-1"
                    title="Open Tag Cloud Explorer"
                 >
                     <div className="mb-1 transition-transform group-hover:scale-110 text-pink-400">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                     </div>
                     <div className="text-[10px] font-bold text-gray-400 text-center leading-tight group-hover:text-white">
                         Open Explorer
                     </div>
                 </button>
                 <div className="ml-2 pl-2 border-l border-gray-600 h-12 flex flex-col justify-center">
                     <span className="text-[9px] text-gray-500 uppercase font-bold w-16 leading-tight">
                        Tag Explorer
                     </span>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TagCloudToolbar;
