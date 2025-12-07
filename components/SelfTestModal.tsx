
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
    const [autoScroll, setAutoScroll] = useState(true);

    // Reset auto-scroll when modal opens
    useEffect(() => {
        if (isOpen) {
            setAutoScroll(true);
            if (scrollRef.current) {
                scrollRef.current.scrollTop = 0;
            }
        }
    }, [isOpen]);

    // Smart Auto-scroll to the running item
    useEffect(() => {
        if (autoScroll && scrollRef.current && status === 'running') {
            const runningIndex = logs.findIndex(l => l.status === 'running');
            if (runningIndex !== -1) {
                const element = document.getElementById(`test-log-${runningIndex}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        } else if (autoScroll && scrollRef.current && status === 'complete') {
             // Scroll to bottom on completion
             scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, autoScroll, status]);

    const handleUserScroll = () => {
        // If user interacts, stop auto-scrolling
        setAutoScroll(false);
    };

    if (!isOpen) return null;

    const totalCount = logs.length;
    const pendingCount = logs.filter(l => l.status === 'pending').length;
    const passedCount = logs.filter(l => l.status === 'ok').length;
    const errorCount = logs.filter(l => l.status === 'error').length;
    
    const executedCount = passedCount + errorCount;
    const percentComplete = totalCount > 0 ? Math.round((executedCount / totalCount) * 100) : 0;

    const rawLogs = logs.map(l => `[${l.id}] ${l.name} ... ${l.status.toUpperCase()}${l.message ? ` (${l.message})` : ''}`).join('\n');

    const modalBg = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300';
    const headerBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200';
    const textHeader = isDarkMode ? 'text-gray-200' : 'text-gray-900';
    const termBg = isDarkMode ? 'bg-black/80 text-gray-300' : 'bg-gray-50 text-gray-800';
    const logTextMeta = isDarkMode ? 'text-blue-400' : 'text-blue-600';
    const footerBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200';
    const statLabel = isDarkMode ? 'text-gray-500' : 'text-gray-500';
    const statValue = isDarkMode ? 'text-gray-200' : 'text-gray-800';
    const rowRunning = isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50';
    const rowError = isDarkMode ? 'bg-red-900/20' : 'bg-red-50';

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`${modalBg} rounded-lg w-full max-w-3xl shadow-2xl border flex flex-col h-[70vh] font-mono text-sm relative transition-all duration-300`}>
                
                {showRawLogs && (
                    <div className={`absolute inset-0 ${headerBg} z-20 flex flex-col p-4 rounded-lg`}>
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
                <div className={`p-4 border-b flex justify-between items-center ${headerBg} rounded-t-lg flex-shrink-0`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${status === 'running' ? 'bg-yellow-400 animate-pulse' : (errorCount > 0 ? 'bg-red-500' : 'bg-green-500')}`}></div>
                        <div className="flex flex-col">
                            <h2 className={`text-lg font-bold ${textHeader} tracking-wider uppercase`}>System Diagnostic</h2>
                            <div className="text-xs text-gray-500 font-bold flex gap-2">
                                <span>{status === 'running' ? 'Running Tests...' : (status === 'complete' ? 'Diagnostic Complete' : 'Ready')}</span>
                                {!autoScroll && status === 'running' && <span className="text-yellow-500">(Auto-scroll paused)</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 items-center">
                        <button 
                            onClick={() => setShowRawLogs(true)} 
                            className={`text-xs underline ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
                        >
                            View Raw Log
                        </button>
                        {status === 'complete' && (
                            <button 
                                onClick={onClose} 
                                className={`px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs`}
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>

                {/* Terminal Output */}
                <div 
                    className={`flex-grow overflow-y-auto p-4 space-y-1 custom-scrollbar ${termBg}`} 
                    ref={scrollRef}
                    onWheel={handleUserScroll}
                    onMouseDown={handleUserScroll}
                    onTouchStart={handleUserScroll}
                >
                    <div className={`${logTextMeta} mb-4 text-xs`}>
                        TARGET: Application Core Interface & Tooling<br/>
                        TIMESTAMP: {new Date().toISOString()}<br/>
                        ----------------------------------------
                    </div>
                    
                    {logs.map((log, idx) => (
                        <div 
                            id={`test-log-${idx}`}
                            key={idx} 
                            className={`flex items-start gap-3 text-xs py-1 px-2 rounded ${log.status === 'running' ? rowRunning : (log.status === 'error' ? rowError : '')}`}
                        >
                            <span className={`${logTextMeta} min-w-[50px] font-bold`}>[{log.id}]</span>
                            <span className={`flex-grow break-words ${log.status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
                                {log.name}
                                {log.message && <div className="text-red-400 ml-2 mt-0.5 font-mono opacity-100">> {log.message}</div>}
                            </span>
                            <span className="font-bold min-w-[50px] text-right">
                                {log.status === 'pending' && <span className="text-gray-600">WAIT</span>}
                                {log.status === 'running' && <span className="text-yellow-500 animate-pulse">RUN</span>}
                                {log.status === 'ok' && <span className="text-green-500">PASS</span>}
                                {log.status === 'error' && <span className="text-red-500">FAIL</span>}
                            </span>
                        </div>
                    ))}

                    {status === 'complete' && (
                        <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-700'} text-xs`}>
                            <span className={logTextMeta}>END OF LINE.</span>
                            {errorCount > 0 
                                ? <div className="text-red-400 mt-2 font-bold text-lg">⚠️ FAILURE: {errorCount} errors detected.</div>
                                : <div className="text-green-400 mt-2 font-bold text-lg">✓ SUCCESS: All systems nominal.</div>
                            }
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-700 relative">
                    <div 
                        className={`h-full transition-all duration-300 ease-out ${status === 'complete' ? (errorCount > 0 ? 'bg-red-500' : 'bg-green-500') : 'bg-blue-500'}`} 
                        style={{ width: `${percentComplete}%` }}
                    ></div>
                </div>

                {/* Status Bar Footer */}
                <div className={`p-3 border-t ${footerBg} rounded-b-lg flex justify-between items-center text-xs`}>
                    <div className="flex gap-6">
                        <div className="flex gap-2">
                            <span className={statLabel}>Total:</span>
                            <span className={`font-bold ${statValue}`}>{totalCount}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className={statLabel}>Passed:</span>
                            <span className="font-bold text-green-500">{passedCount}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className={statLabel}>Failed:</span>
                            <span className="font-bold text-red-500">{errorCount}</span>
                        </div>
                    </div>
                    <div className={`font-bold ${statValue} font-mono`}>
                        {percentComplete}%
                    </div>
                </div>
            </div>
        </div>
    );
};
