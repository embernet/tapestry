
import React, { useEffect, useRef, useState } from 'react';

export interface TestLog {
    id: string; // e.g. "1.1.1"
    name: string; // Description
    status: 'pending' | 'running' | 'ok' | 'error';
    message?: string;
}

interface SelfTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: TestLog[];
    status: 'idle' | 'running' | 'complete';
    isDarkMode?: boolean;
}

export const SelfTestModal: React.FC<SelfTestModalProps> = ({ isOpen, onClose, logs, status, isDarkMode = true }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showRawLogs, setShowRawLogs] = useState(false);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            if (status === 'complete') {
                // When finished, scroll to top for review
                scrollRef.current.scrollTop = 0;
            } else {
                // While running, follow the tail
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [logs, status]);

    if (!isOpen) return null;

    const totalCount = logs.length;
    const pendingCount = logs.filter(l => l.status === 'pending').length;
    const runningCount = logs.filter(l => l.status === 'running').length;
    const passedCount = logs.filter(l => l.status === 'ok').length;
    const errorCount = logs.filter(l => l.status === 'error').length;
    
    const executedCount = passedCount + errorCount;
    const percentComplete = totalCount > 0 ? Math.round((executedCount / totalCount) * 100) : 0;

    const rawLogs = logs.map(l => `[${l.id}] ${l.name} ... ${l.status.toUpperCase()}${l.message ? ` (${l.message})` : ''}`).join('\n');

    const modalBg = isDarkMode ? 'bg-gray-950/95 border-gray-700' : 'bg-white/95 border-gray-300';
    const headerBg = isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200';
    const textHeader = isDarkMode ? 'text-gray-200' : 'text-gray-900';
    const termBg = isDarkMode ? 'bg-black/90 text-gray-300' : 'bg-gray-50/90 text-gray-800';
    const logTextMeta = isDarkMode ? 'text-blue-400' : 'text-blue-600';
    const footerBg = isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200';
    const statLabel = isDarkMode ? 'text-gray-500' : 'text-gray-500';
    const statValue = isDarkMode ? 'text-gray-200' : 'text-gray-800';

    return (
        <div className="fixed inset-0 z-[9999] p-4 flex items-center justify-center pointer-events-none">
            <div className={`${modalBg} rounded-lg w-full max-w-2xl shadow-2xl border flex flex-col h-[600px] font-mono text-sm relative pointer-events-auto backdrop-blur-sm transition-all duration-300`}>
                
                {showRawLogs && (
                    <div className={`absolute inset-0 ${headerBg} z-10 flex flex-col p-4 rounded-lg`}>
                        <div className={`flex justify-between items-center mb-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} pb-2`}>
                            <h3 className={`${textHeader} font-bold`}>Raw System Logs</h3>
                            <button onClick={() => setShowRawLogs(false)} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>Close</button>
                        </div>
                        <textarea 
                            readOnly 
                            value={rawLogs} 
                            className={`flex-grow ${termBg} p-2 font-mono text-xs rounded border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} resize-none focus:outline-none`}
                        />
                    </div>
                )}

                {/* Header */}
                <div className={`p-3 border-b flex justify-between items-center ${headerBg} rounded-t-lg`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status === 'running' ? 'bg-yellow-400 animate-pulse' : (errorCount > 0 ? 'bg-red-500' : 'bg-green-500')}`}></div>
                        <div className="flex flex-col">
                            <h2 className={`text-sm font-bold ${textHeader} tracking-wider uppercase`}>Self-Test Diagnostic</h2>
                            <div className="text-[10px] text-gray-500 font-bold">
                                {status === 'running' ? 'Running...' : (status === 'complete' ? 'Completed' : 'Ready')}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowRawLogs(true)} 
                            className={`text-xs underline ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
                        >
                            View Raw Log
                        </button>
                        {status === 'complete' && (
                            <button onClick={onClose} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'} transition-colors`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Terminal Output */}
                <div className={`flex-grow overflow-y-auto p-4 space-y-1 custom-scrollbar ${termBg}`} ref={scrollRef}>
                    <div className={`${logTextMeta} mb-2`}>Initializing Sequence...</div>
                    
                    {logs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs leading-tight">
                            <span className={`${logTextMeta} min-w-[45px]`}>[{log.id}]</span>
                            <span className={`flex-grow break-words ${log.status === 'pending' ? 'opacity-50' : ''}`}>
                                {log.name}
                            </span>
                            <span className="font-bold min-w-[40px] text-right">
                                {log.status === 'running' && <span className="text-yellow-500">...</span>}
                                {log.status === 'ok' && <span className="text-green-500">OK</span>}
                                {log.status === 'error' && <span className="text-red-500">FAIL</span>}
                            </span>
                        </div>
                    ))}

                    {status === 'complete' && (
                        <div className={`mt-4 pt-2 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-700'} text-xs`}>
                            <span className={logTextMeta}>Diagnostic Complete.</span>
                            {errorCount > 0 && <div className="text-red-400 mt-1">Errors detected in {errorCount} tests. Review logs above.</div>}
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-700 relative">
                    <div 
                        className={`h-full transition-all duration-300 ease-out ${status === 'complete' ? (errorCount > 0 ? 'bg-red-500' : 'bg-green-500') : 'bg-blue-500'}`} 
                        style={{ width: `${percentComplete}%` }}
                    ></div>
                </div>

                {/* Status Bar Footer */}
                <div className={`p-2 border-t ${footerBg} rounded-b-lg flex justify-between items-center text-xs`}>
                    <div className="flex gap-4">
                        <div className="flex gap-1">
                            <span className={statLabel}>Run:</span>
                            <span className={`font-bold ${statValue}`}>{executedCount}</span>
                        </div>
                        <div className="flex gap-1">
                            <span className={statLabel}>Pass:</span>
                            <span className="font-bold text-green-500">{passedCount}</span>
                        </div>
                        <div className="flex gap-1">
                            <span className={statLabel}>Fail:</span>
                            <span className="font-bold text-red-500">{errorCount}</span>
                        </div>
                        <div className="flex gap-1">
                            <span className={statLabel}>Total:</span>
                            <span className={`font-bold ${statValue}`}>{totalCount}</span>
                        </div>
                    </div>
                    <div className={`font-bold ${statValue}`}>
                        {percentComplete}%
                    </div>
                </div>
            </div>
        </div>
    );
};
