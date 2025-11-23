
import React, { useState } from 'react';
import { ScamperSuggestion } from '../types';

interface ScamperModalProps {
  isOpen: boolean;
  isLoading: boolean;
  operator: string;
  sourceNodeName: string;
  suggestions: ScamperSuggestion[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onRegenerate: () => void;
  onClose: () => void;
  onLogHistory: (tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => void;
}

const ScamperModal: React.FC<ScamperModalProps> = ({
  isOpen,
  isLoading,
  operator,
  sourceNodeName,
  suggestions,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  onRegenerate,
  onClose,
}) => {
  if (!isOpen) return null;

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-3xl shadow-2xl border border-gray-600 text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-lg">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <span className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">SCAMPER</span>
                    <span className="text-gray-500 text-lg">/</span>
                    <span className="text-white">{operator}</span>
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                    Generating ideas for: <span className="text-blue-400 font-semibold">{sourceNodeName}</span>
                </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 bg-gray-800">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-600 rounded-full animate-spin"></div>
                    <p className="text-gray-400 animate-pulse">Brainstorming...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {suggestions.map((s) => (
                        <div 
                            key={s.id} 
                            className={`p-4 rounded-lg border flex items-start gap-4 transition-all ${
                                s.status === 'accepted' ? 'bg-green-900/20 border-green-500/50' :
                                s.status === 'rejected' ? 'bg-red-900/10 border-red-500/20 opacity-50' :
                                'bg-gray-700 border-gray-600 hover:border-gray-500'
                            }`}
                        >
                            <div className="flex-grow">
                                <h3 className={`font-bold text-lg ${s.status === 'accepted' ? 'text-green-400' : 'text-white'}`}>
                                    {s.name}
                                </h3>
                                <p className="text-sm text-gray-300 mt-1">{s.description}</p>
                                <div className="mt-2 inline-block bg-gray-900 px-2 py-0.5 rounded text-xs text-gray-500 border border-gray-700">
                                    Link: {s.relationshipLabel}
                                </div>
                            </div>

                            {s.status === 'pending' && (
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => onAccept(s.id)}
                                        className="p-2 bg-green-600 hover:bg-green-500 text-white rounded shadow-md transition-colors"
                                        title="Add this idea"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => onReject(s.id)}
                                        className="p-2 bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white rounded shadow-md transition-colors"
                                        title="Discard"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            
                            {s.status === 'accepted' && (
                                <div className="flex items-center justify-center w-10 h-full text-green-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-900 rounded-b-lg flex justify-between items-center">
            <button 
                onClick={onRegenerate}
                disabled={isLoading}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold disabled:opacity-50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate Ideas
            </button>
            
            <div className="flex gap-3">
                {pendingCount > 0 && (
                    <>
                        <button 
                            onClick={onRejectAll}
                            disabled={isLoading}
                            className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-800 text-gray-300 transition disabled:opacity-50"
                        >
                            Reject Remaining
                        </button>
                        <button 
                            onClick={onAcceptAll}
                            disabled={isLoading}
                            className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white font-bold transition shadow-lg disabled:opacity-50"
                        >
                            Accept All ({pendingCount})
                        </button>
                    </>
                )}
                {pendingCount === 0 && (
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg"
                    >
                        Done
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScamperModal;
