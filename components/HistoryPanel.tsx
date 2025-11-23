
import React, { useState } from 'react';
import { HistoryEntry } from '../types';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onClose: () => void;
  onDetach: (id: string) => void;
  onReopen?: (entry: HistoryEntry) => void;
  onAnalyze?: (context: string) => void;
  onDelete?: (id: string) => void;
}

const HistoryItem: React.FC<{ 
    entry: HistoryEntry, 
    onDetach: (id: string) => void, 
    onReopen?: (entry: HistoryEntry) => void,
    onAnalyze?: (context: string) => void,
    onDelete?: (id: string) => void
}> = ({ entry, onDetach, onReopen, onAnalyze, onDelete }) => {
    const [expanded, setExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(entry.content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Preview: First 4 lines or 200 chars
    const lines = entry.content.split('\n');
    const preview = lines.slice(0, 4).join('\n') + (lines.length > 4 ? '...' : '');
    
    return (
        <div className={`border border-gray-700 rounded bg-gray-700/30 overflow-hidden transition-all ${expanded ? 'mb-4 shadow-lg' : 'mb-2 hover:bg-gray-700/50'}`}>
            <div 
                className="p-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center cursor-pointer select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-bold text-blue-400 uppercase truncate max-w-[100px]">{entry.tool}</span>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-1">
                    {onReopen && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onReopen(entry); }}
                            className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-green-400 transition-colors"
                            title="Reopen in Tool"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDetach(entry.id); }}
                        className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
                        title="Detach to Window"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            
            {expanded ? (
                <div className="relative">
                    {/* Toolbar for expanded view */}
                    <div className="absolute top-2 right-2 flex gap-2 z-10 bg-gray-800/80 p-1 rounded backdrop-blur">
                        <button 
                            onClick={handleCopy} 
                            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition" 
                            title="Copy"
                        >
                            {isCopied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            )}
                        </button>
                        {onAnalyze && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onAnalyze(entry.content); }}
                                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition" 
                                title="Analyze with AI"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            </button>
                        )}
                        {onDelete && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                                className="p-1 rounded hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition" 
                                title="Delete"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                    <div className="p-3 text-sm text-gray-300 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto pr-1 pt-8">
                        {entry.summary && <div className="font-sans text-white mb-2 font-semibold">{entry.summary}</div>}
                        {entry.content}
                    </div>
                </div>
            ) : (
                <div className="p-3 text-sm text-gray-300 font-mono whitespace-pre-wrap opacity-70 cursor-pointer" onClick={() => setExpanded(true)}>
                    {entry.summary && <div className="font-sans text-white mb-1 font-semibold text-xs">{entry.summary}</div>}
                    {preview}
                </div>
            )}
        </div>
    );
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClose, onDetach, onReopen, onAnalyze, onDelete }) => {
  return (
    <div className="w-full h-full flex flex-col bg-gray-800">
      <div className="p-4 flex-shrink-0 flex justify-between items-center border-b border-gray-700 bg-gray-900">
        <h2 className="text-xl font-bold text-white">AI History Log</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-900/50">
          {history.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                  <p>No AI interactions recorded yet.</p>
              </div>
          ) : (
              history.map(entry => (
                  <HistoryItem 
                    key={entry.id} 
                    entry={entry} 
                    onDetach={onDetach} 
                    onReopen={onReopen} 
                    onAnalyze={onAnalyze} 
                    onDelete={onDelete}
                  />
              ))
          )}
      </div>
    </div>
  );
};

export default HistoryPanel;
