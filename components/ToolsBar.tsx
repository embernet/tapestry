
import React, { useState } from 'react';

interface ToolsBarProps {
  children: React.ReactNode;
}

const ToolsBar: React.FC<ToolsBarProps> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
      <div className="flex items-start gap-2 pointer-events-auto">
        {/* Master Toggle */}
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-600 shadow-lg rounded-lg w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 z-20 gap-1"
            title={isExpanded ? "Hide Tools" : "Show Tools"}
        >
             <div className="relative w-8 h-8">
                {/* Hammer */}
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-8 h-8 text-blue-400 transform -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.9 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
             </div>
             <span className="text-[10px] text-gray-400 font-bold tracking-wider">TOOLS</span>
        </button>

        {/* Content Area */}
        {isExpanded && (
            <div className="flex flex-wrap items-start gap-2 animate-fade-in">
                {children}
            </div>
        )}
      </div>
    </div>
  );
};

export default ToolsBar;
