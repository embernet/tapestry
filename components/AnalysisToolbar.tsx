
import React from 'react';

interface AnalysisToolbarProps {
    onSelectTool: (tool: string) => void;
    isCollapsed: boolean;
    onToggle: () => void;
    isDarkMode: boolean;
}

const ANALYSIS_TOOLS = [
    {
        id: 'network',
        name: 'Network Analysis',
        desc: 'Stats, Simulation, & Structure.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="6" cy="18" r="2" />
                <circle cx="12" cy="6" r="2" />
                <circle cx="18" cy="18" r="2" />
                <path d="M6 18 L12 6 L18 18 Z" />
            </svg>
        ),
        color: 'text-purple-400'
    },
    {
        id: 'tags',
        name: 'Tag Analysis',
        desc: 'Frequency of tags.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
        ),
        color: 'text-blue-400'
    },
    {
        id: 'relationships',
        name: 'Relationship Analysis',
        desc: 'Frequency of connections.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
        ),
        color: 'text-green-400'
    }
];

const AnalysisToolbar: React.FC<AnalysisToolbarProps> = ({
    onSelectTool, isCollapsed, onToggle, isDarkMode
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
                    className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-purple-500' : ''}`}
                    title={isCollapsed ? "Expand Analysis Tools" : "Close Analysis Tools"}
                >
                    <div className="relative w-8 h-8 flex items-center justify-center text-purple-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider ${textMain}`}>ANALYSIS</span>
                </button>
            </div>

            {!isCollapsed && (
                <div className={`absolute top-full left-0 mt-2 w-72 border rounded-lg shadow-2xl z-[950] flex flex-col max-h-[60vh] overflow-y-auto animate-fade-in-down scrollbar-thin scrollbar-thumb-gray-600 ${dropdownBg}`}>
                    <div className={`p-2 border-b text-[10px] font-bold uppercase tracking-wider text-center ${headerBg} ${textHeader}`}>
                        Graph Analytics
                    </div>

                    {ANALYSIS_TOOLS.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => onSelectTool(tool.id)}
                            className={`flex items-start text-left p-3 border-b last:border-0 transition-colors group ${itemHover}`}
                        >
                            <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-purple-400">
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

export default AnalysisToolbar;
