
import React from 'react';
import { LssToolType } from '../types';

interface LssToolbarProps {
  onSelectTool: (tool: LssToolType) => void;
  activeTool: LssToolType;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
}

const DEFINE_TOOLS = [
  {
    id: 'charter' as LssToolType,
    name: 'Project Charter',
    desc: 'Problem, Scope, Goals',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: '#6366f1' // Indigo
  },
  {
    id: 'sipoc' as LssToolType,
    name: 'SIPOC Diagram',
    desc: 'Suppliers, Inputs, Process...',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    color: '#14b8a6' // Teal
  },
  {
    id: 'voc' as LssToolType,
    name: 'Voice of Customer',
    desc: 'Customer Needs',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3" />
      </svg>
    ),
    color: '#ec4899' // Pink
  },
  {
    id: 'ctq' as LssToolType,
    name: 'CTQ Tree',
    desc: 'Critical-to-Quality',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    color: '#10b981' // Emerald
  },
  {
    id: 'stakeholder' as LssToolType,
    name: 'Stakeholder Analysis',
    desc: 'Influence & Interest',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: '#f59e0b' // Amber
  }
];

const IMPROVEMENT_TOOLS = [
  {
    id: 'dmaic' as LssToolType,
    name: 'DMAIC',
    desc: 'Improvement Cycle',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    color: '#3b82f6' // Blue
  },
  {
    id: '5whys' as LssToolType,
    name: '5 Whys',
    desc: 'Root Cause Analysis',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: '#f97316' // Orange
  },
  {
    id: 'fishbone' as LssToolType,
    name: 'Fishbone',
    desc: 'Ishikawa Diagram',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12l6-6M4 12l6 6M20 12l-6-6M20 12l-6 6" />
      </svg>
    ),
    color: '#10b981' // Emerald
  },
  {
    id: 'fmea' as LssToolType,
    name: 'FMEA',
    desc: 'Failure Modes & Effects',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: '#ef4444' // Red
  },
  {
    id: 'vsm' as LssToolType,
    name: 'VSM',
    desc: 'Value Stream Mapping',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    ),
    color: '#8b5cf6' // Violet
  }
];

const LssToolbar: React.FC<LssToolbarProps> = ({
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
          className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-blue-500' : ''}`}
          title={isCollapsed ? "Expand Lean Six Sigma Tools" : "Close Lean Six Sigma Tools"}
        >
          <div className="relative w-8 h-8 flex items-center justify-center text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className={`text-xs font-bold tracking-wider ${textMain}`}>LSS</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
          className={`absolute top-0 right-0 p-1 transition-colors rounded-bl ${isDarkMode ? 'text-gray-500 hover:text-white bg-gray-800/50 hover:bg-gray-600' : 'text-gray-400 hover:text-gray-900 bg-gray-100/50 hover:bg-gray-200'}`}
          title="LSS Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className={`absolute top-full left-0 mt-2 w-72 border rounded-lg shadow-2xl z-[950] flex flex-col max-h-[60vh] overflow-y-auto animate-fade-in-down scrollbar-thin scrollbar-thumb-gray-600 ${dropdownBg}`}>

          {/* Define Phase Header */}
          <div className={`p-2 border-b text-[10px] font-bold uppercase tracking-wider text-center ${headerBg} ${textHeader}`}>
            Define & Measure
          </div>
          {DEFINE_TOOLS.map(tool => (
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

          {/* Improve Phase Header */}
          <div className={`p-2 border-b border-t text-[10px] font-bold uppercase tracking-wider text-center ${headerBg} ${textHeader}`}>
            Analyze, Improve, Control
          </div>
          {IMPROVEMENT_TOOLS.map(tool => (
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

export default LssToolbar;
