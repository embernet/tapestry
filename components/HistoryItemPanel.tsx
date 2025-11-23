
import React, { useState } from 'react';
import { HistoryEntry } from '../types';

interface HistoryItemPanelProps {
  entry: HistoryEntry;
  onClose: () => void;
  onReopen?: (entry: HistoryEntry) => void;
  onAnalyze?: (context: string) => void;
  onDelete?: (id: string) => void;
}

const HistoryItemPanel: React.FC<HistoryItemPanelProps> = ({ entry, onClose, onReopen, onAnalyze, onDelete }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
      navigator.clipboard.writeText(entry.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-800">
      <div className="p-2 flex-shrink-0 flex justify-between items-center border-b border-gray-700 bg-gray-900">
        <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{entry.tool}</span>
            <span className="text-[10px] text-gray-500">{new Date(entry.timestamp).toLocaleString()}</span>
        </div>
        <div className="flex gap-2 items-center">
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
                    onClick={() => onAnalyze(entry.content)}
                    className="text-gray-400 hover:text-blue-400 p-1 rounded hover:bg-gray-700 transition"
                    title="Analyze with AI"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </button>
            )}

            {onReopen && (
                <button 
                    onClick={() => onReopen(entry)}
                    className="text-gray-400 hover:text-green-400 p-1 rounded hover:bg-gray-700 transition"
                    title="Reopen in Tool"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            )}
            
            {onDelete && (
                <button 
                    onClick={() => onDelete(entry.id)}
                    className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-gray-700 transition"
                    title="Delete from History"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}

            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 bg-gray-900 text-sm text-gray-300 font-mono whitespace-pre-wrap selection:bg-blue-500 selection:text-white">
          {entry.summary && (
              <div className="mb-4 pb-4 border-b border-gray-700 font-sans">
                  <h3 className="font-bold text-white mb-1">Summary</h3>
                  <p className="text-gray-300">{entry.summary}</p>
              </div>
          )}
          {entry.content}
      </div>
    </div>
  );
};

export default HistoryItemPanel;
