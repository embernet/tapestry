
import React from 'react';
import { TocToolType } from '../types';

interface TocToolbarProps {
  onSelectTool: (tool: TocToolType) => void;
  activeTool: TocToolType;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
}

const TOC_TOOLS = [
  {
    id: 'crt' as TocToolType,
    name: 'Current Reality Tree',
    desc: 'Identify Core Constraints',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: '#f59e0b' // Amber
  },
  {
    id: 'ec' as TocToolType,
    name: 'Evaporating Cloud',
    desc: 'Resolve Conflicts',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    color: '#3b82f6' // Blue
  },
  {
    id: 'frt' as TocToolType,
    name: 'Future Reality Tree',
    desc: 'Visualize Solutions',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: '#10b981' // Emerald
  },
  {
    id: 'tt' as TocToolType,
    name: 'Transition Tree',
    desc: 'Implementation Plan',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: '#8b5cf6' // Violet
  }
];

const TocToolbar: React.FC<TocToolbarProps> = ({
  onSelectTool,
  activeTool,
  isCollapsed,
  onToggle,
  onOpenSettings,
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
          className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-amber-500' : ''}`}
          title={isCollapsed ? "Expand TOC Tools" : "Close TOC Tools"}
        >
          <div className="relative w-8 h-8 flex items-center justify-center text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className={`text-xs font-bold tracking-wider ${textMain}`}>TOC</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
          className={`absolute top-0 right-0 p-1 transition-colors rounded-bl ${isDarkMode ? 'text-gray-500 hover:text-white bg-gray-800/50 hover:bg-gray-600' : 'text-gray-400 hover:text-gray-900 bg-gray-100/50 hover:bg-gray-200'}`}
          title="TOC Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className={`absolute top-full left-0 mt-2 w-72 border rounded-lg shadow-2xl z-[950] flex flex-col max-h-[60vh] overflow-y-auto animate-fade-in-down scrollbar-thin scrollbar-thumb-gray-600 ${dropdownBg}`}>
          <div className={`p-2 border-b text-[10px] font-bold uppercase tracking-wider text-center ${headerBg} ${textHeader}`}>
            Theory of Constraints
          </div>

          {TOC_TOOLS.map(tool => (
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
        </div>
      )}
    </div>
  );
};

export default TocToolbar;
