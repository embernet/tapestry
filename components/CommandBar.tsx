
import React, { useState, useRef } from 'react';

interface CommandBarProps {
  onExecute: (markdown: string) => void;
}

const CommandBar: React.FC<CommandBarProps> = ({ onExecute }) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onExecute(input);
        setInput('');
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
      <div className="flex items-stretch gap-0 bg-gray-800 bg-opacity-90 rounded-lg border border-gray-600 shadow-lg pointer-events-auto overflow-hidden">
        {/* Toggle Button */}
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-gray-700 hover:bg-gray-600 border-r border-gray-600 w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 gap-1"
            title={isExpanded ? "Collapse Command Bar" : "Open Command Bar"}
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isExpanded ? null : <span className="text-[10px] text-gray-400 font-bold tracking-wider">CMD</span>}
        </button>

        {isExpanded && (
            <div className="flex items-center p-3 animate-fade-in bg-gray-800 h-20">
                <div className="flex flex-col w-80 h-full justify-center">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                        Quick Add (Markdown)
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Element A -[relationship]> Element B; Element C"
                        className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none scrollbar-thin scrollbar-thumb-gray-600 flex-grow"
                        style={{ minHeight: '2.5rem' }}
                    />
                    <div className="text-[9px] text-gray-500 mt-0.5 text-right">
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
                    className="ml-3 bg-green-700 hover:bg-green-600 text-white rounded self-center h-10 w-10 flex items-center justify-center shadow-lg"
                    title="Execute"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default CommandBar;
