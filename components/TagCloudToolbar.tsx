
import React from 'react';
import { TagCloudToolType } from '../types';

interface TagCloudToolbarProps {
  onSelectTool: (tool: TagCloudToolType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
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
}) => {

  return (
    <div className="relative pointer-events-auto">
      {/* Collapse Toggle / Main Button */}
      <div className="relative">
        <button 
            onClick={onToggle}
            className={`h-20 w-20 bg-gray-800 hover:bg-gray-700 border border-gray-600 shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${!isCollapsed ? 'ring-2 ring-pink-500 bg-gray-700' : ''}`}
            title={isCollapsed ? "Expand Word Cloud" : "Close Word Cloud"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center text-pink-400">
                {/* Zoomed out word cloud icon (various small colored lines) */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="6" width="6" height="2" rx="1" fill="currentColor" fillOpacity="0.8"/>
                    <rect x="9" y="6" width="8" height="2" rx="1" fill="currentColor" fillOpacity="0.5"/>
                    <rect x="18" y="6" width="4" height="2" rx="1" fill="currentColor" fillOpacity="0.9"/>
                    
                    <rect x="3" y="10" width="9" height="2" rx="1" fill="currentColor" fillOpacity="0.6"/>
                    <rect x="13" y="10" width="5" height="2" rx="1" fill="currentColor" fillOpacity="0.9"/>
                    <rect x="19" y="10" width="2" height="2" rx="1" fill="currentColor" fillOpacity="0.4"/>
                    
                    <rect x="2" y="14" width="4" height="2" rx="1" fill="currentColor" fillOpacity="0.9"/>
                    <rect x="7" y="14" width="7" height="2" rx="1" fill="currentColor" fillOpacity="0.5"/>
                    <rect x="15" y="14" width="7" height="2" rx="1" fill="currentColor" fillOpacity="0.7"/>
                </svg>
            </div>
            <div className="text-[9px] font-bold tracking-wider text-gray-300 leading-none text-center">
                WORD<br/>CLOUD
            </div>
        </button>
      </div>

      {!isCollapsed && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl z-50 flex flex-col max-h-[60vh] overflow-y-auto animate-fade-in-down scrollbar-thin scrollbar-thumb-gray-600">
             <div className="p-2 bg-gray-800 border-b border-gray-700 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">
                 Word Cloud Tools
             </div>
             
             {WORD_CLOUD_TOOLS.map(tool => (
                 <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    className={`flex items-start text-left p-3 border-b border-gray-700 last:border-0 hover:bg-gray-800 transition-colors group`}
                 >
                     <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110" style={{ color: tool.color }}>
                         {tool.icon}
                     </div>
                     <div>
                         <div className="font-bold text-gray-200 text-sm mb-0.5 group-hover:text-white">{tool.name}</div>
                         <p className="text-xs text-gray-400 leading-tight group-hover:text-gray-300">
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
