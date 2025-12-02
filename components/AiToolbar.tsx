
import React from 'react';

interface AiToolbarProps {
  onSelectTool: (toolId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

const AI_TOOLS = [
    {
        id: 'chat',
        name: 'Assistant',
        desc: 'Chat with your model.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        ),
        color: 'text-blue-400'
    },
    {
        id: 'expand',
        name: 'Expand',
        desc: 'Suggest related concepts.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
        ),
        color: 'text-purple-400'
    },
    {
        id: 'connect',
        name: 'Connect',
        desc: 'Find missing links.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
        ),
        color: 'text-green-400'
    },
    {
        id: 'critique',
        name: 'Critique',
        desc: 'Review model logic.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        color: 'text-orange-400'
    }
];

const AiToolbar: React.FC<AiToolbarProps> = ({
    onSelectTool,
    isCollapsed,
    onToggle,
    isDarkMode
}) => {
    const bgClass = isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200';
    const dropdownBg = isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200';
    const itemHover = isDarkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-100';
    const textItem = isDarkMode ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black';
    const textDesc = isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700';

    return (
        <div className="relative pointer-events-auto">
            <button 
                onClick={onToggle}
                className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-purple-500' : ''}`}
                title={isCollapsed ? "Open AI Tools" : "Close AI Tools"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="none">
                    <defs>
                        <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                    </defs>
                    <path fill="url(#aiGradient)" d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" />
                    <path fill="url(#aiGradient)" opacity="0.6" d="M18 15L19 18L22 19L19 20L18 23L17 20L14 19L17 18L18 15Z" />
                    <path fill="url(#aiGradient)" opacity="0.6" d="M6 15L7 18L10 19L7 20L6 23L5 20L2 19L5 18L6 15Z" />
                </svg>
                <span className={`text-xs font-bold tracking-wider bg-gradient-to-r from-blue-400 to-pink-400 text-transparent bg-clip-text`}>AI</span>
            </button>

            {!isCollapsed && (
                <div className={`absolute top-full left-0 mt-2 w-64 border rounded-lg shadow-2xl z-50 flex flex-col max-h-[60vh] overflow-y-auto animate-fade-in-down scrollbar-thin scrollbar-thumb-gray-600 ${dropdownBg}`}>
                    <div className={`p-3 border-b border-gray-700 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>AI Tools</span>
                    </div>
                    {AI_TOOLS.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => onSelectTool(tool.id)}
                            className={`flex items-start text-left p-3 border-b last:border-0 transition-colors group ${itemHover}`}
                        >
                            <div className={`mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 ${tool.color}`}>
                                {tool.icon}
                            </div>
                            <div>
                                <div className={`font-bold text-sm mb-0.5 ${textItem}`}>{tool.name}</div>
                                <p className={`text-xs leading-tight ${textDesc}`}>{tool.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AiToolbar;
