
import React, { useState } from 'react';

interface CommandBarProps {
  onExecute: (markdown: string) => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
  onOpenHistory?: () => void;
  isDarkMode: boolean;
}

const CommandBar: React.FC<CommandBarProps> = ({ onExecute, isCollapsed, onToggle, onOpenHistory, isDarkMode }) => {
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const [input, setInput] = useState('');

  // Use prop if provided, else fallback to internal state
  const collapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;

  const handleToggle = () => {
      if (onToggle) {
          onToggle();
      } else {
          setInternalCollapsed(!internalCollapsed);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onExecute(input);
        setInput('');
      }
    }
  };

  const bgClass = isDarkMode ? 'bg-gray-800 bg-opacity-90 border-gray-600' : 'bg-white bg-opacity-95 border-gray-200';
  const controlBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const buttonBgClass = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200';
  const inputBgClass = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';
  const textMain = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const textSub = isDarkMode ? 'text-gray-500' : 'text-gray-400';
  const iconButtonBg = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-black border border-gray-300';

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
      <div className={`flex items-stretch gap-0 rounded-lg border shadow-lg pointer-events-auto overflow-hidden ${bgClass}`}>
        {/* Toggle Button */}
        <button 
            onClick={handleToggle}
            className={`border-r w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 gap-1 ${buttonBgClass}`}
            title={collapsed ? "Open Command Bar" : "Collapse Command Bar"}
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {collapsed && <span className={`text-[10px] font-bold tracking-wider ${textMain}`}>CMD</span>}
        </button>

        {!collapsed && (
            <div className={`flex items-center p-3 animate-fade-in h-20 ${controlBgClass}`}>
                <div className="flex flex-col w-80 h-full justify-center">
                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${textMain}`}>
                        Quick Add (Markdown)
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Element A -[relationship]> Element B; Element C"
                        className={`border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none scrollbar-thin scrollbar-thumb-gray-600 flex-grow ${inputBgClass}`}
                        style={{ minHeight: '2.5rem' }}
                    />
                    <div className={`text-[9px] mt-0.5 text-right ${textSub}`}>
                        Enter to run, Shift+Enter for newline
                    </div>
                </div>
                <button 
                    onClick={() => {
                        if(input.trim()) {
                            onExecute(input);
                            setInput('');
                        }
                    }}
                    className="ml-3 bg-green-700 hover:bg-green-600 text-white rounded self-center h-10 w-10 flex items-center justify-center shadow-lg flex-shrink-0"
                    title="Execute"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                {onOpenHistory && (
                    <button
                        onClick={onOpenHistory}
                        className={`ml-2 rounded self-center h-10 w-10 flex items-center justify-center shadow-lg transition-colors flex-shrink-0 ${iconButtonBg}`}
                        title="Command History"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default CommandBar;
