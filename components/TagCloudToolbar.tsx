
import React from 'react';
import { TagCloudToolType } from '../types';

interface TagCloudToolbarProps {
  onSelectTool: (tool: TagCloudToolType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
  onOpenGuidance?: () => void;
}

const WORD_CLOUD_TOOLS = [
  {
    id: 'tags' as TagCloudToolType,
    name: 'Tag Cloud',
    desc: 'Visualize frequency of tags/categories.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    color: '#ec4899' // Pink
  },
  {
    id: 'nodes' as TagCloudToolType,
    name: 'Relationship Cloud',
    desc: 'Visualize connectivity of nodes.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    color: '#f472b6' // Lighter Pink
  },
  {
    id: 'words' as TagCloudToolType,
    name: 'Node Name Analysis',
    desc: 'Visualize word frequency in node names.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: '#db2777' // Pink-600
  },
  {
    id: 'full_text' as TagCloudToolType,
    name: 'Full Text Analysis',
    desc: 'Visualize word frequency across name and notes (ignoring tags/attributes).',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    color: '#9d174d' // Pink-800
  }
];

const TagCloudToolbar: React.FC<TagCloudToolbarProps> = ({
  onSelectTool,
  isCollapsed,
  onToggle,
  isDarkMode,
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
          className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-pink-500' : ''}`}
          title={isCollapsed ? "Expand Word Cloud" : "Close Word Cloud"}
        >
          <div className="relative w-8 h-8 flex items-center justify-center text-pink-400">
            {/* Zoomed out word cloud icon (various small colored lines) */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="6" width="6" height="2" rx="1" fill="currentColor" fillOpacity="0.8" />
              <rect x="9" y="6" width="8" height="2" rx="1" fill="currentColor" fillOpacity="0.5" />
              <rect x="18" y="6" width="4" height="2" rx="1" fill="currentColor" fillOpacity="0.9" />

              <rect x="3" y="10" width="9" height="2" rx="1" fill="currentColor" fillOpacity="0.6" />
              <rect x="13" y="10" width="5" height="2" rx="1" fill="currentColor" fillOpacity="0.9" />
              <rect x="19" y="10" width="2" height="2" rx="1" fill="currentColor" fillOpacity="0.4" />

              <rect x="2" y="14" width="4" height="2" rx="1" fill="currentColor" fillOpacity="0.9" />
              <rect x="7" y="14" width="7" height="2" rx="1" fill="currentColor" fillOpacity="0.5" />
              <rect x="15" y="14" width="7" height="2" rx="1" fill="currentColor" fillOpacity="0.7" />
            </svg>
          </div>
          <div className={`text-[9px] font-bold tracking-wider leading-none text-center ${textMain}`}>
            WORD<br />CLOUD
          </div>
        </button>
      </div>

      {!isCollapsed && (
        <div className={`absolute top-full left-0 mt-2 w-72 border rounded-lg shadow-2xl z-[950] flex flex-col max-h-[60vh] overflow-y-auto animate-fade-in-down scrollbar-thin scrollbar-thumb-gray-600 ${dropdownBg}`}>
          <div className={`p-2 border-b flex justify-between items-center sticky top-0 z-10 ${headerBg}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider pl-1 ${textHeader}`}>
              Word Cloud Tools
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

          {WORD_CLOUD_TOOLS.map(tool => (
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

export default TagCloudToolbar;
