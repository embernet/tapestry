
import React, { useEffect, useRef, useState } from 'react';

export interface TestLog {
    id: number;
    name: string;
    status: 'pending' | 'running' | 'ok' | 'error';
    message?: string;
}

interface SelfTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: TestLog[];
    status: 'idle' | 'running' | 'complete';
}

export const SelfTestModal: React.FC<SelfTestModalProps> = ({ isOpen, onClose, logs, status }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showRawLogs, setShowRawLogs] = useState(false);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (!isOpen) return null;

    const errorCount = logs.filter(l => l.status === 'error').length;
    const passedCount = logs.filter(l => l.status === 'ok').length;

    const rawLogs = logs.map(l => `[${l.status.toUpperCase()}] ${l.name}${l.message ? `: ${l.message}` : ''}`).join('\n');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-gray-950 rounded-lg w-full max-w-2xl shadow-2xl border border-gray-700 flex flex-col h-[600px] font-mono text-sm relative">
                
                {showRawLogs && (
                    <div className="absolute inset-0 bg-gray-900 z-10 flex flex-col p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                            <h3 className="text-white font-bold">System Logs</h3>
                            <button onClick={() => setShowRawLogs(false)} className="text-gray-400 hover:text-white">Close</button>
                        </div>
                        <textarea 
                            readOnly 
                            value={rawLogs} 
                            className="flex-grow bg-black text-gray-300 p-2 font-mono text-xs rounded border border-gray-700 resize-none focus:outline-none"
                        />
                    </div>
                )}

                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status === 'running' ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
                        <h2 className="text-lg font-bold text-gray-200 tracking-wider">SYSTEM DIAGNOSTIC</h2>
                    </div>
                    {status === 'complete' && (
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Terminal Output */}
                <div className="flex-grow overflow-y-auto p-6 space-y-2 custom-scrollbar bg-black" ref={scrollRef}>
                    <div className="text-gray-500 mb-4">Initializing Tapestry Self-Test Sequence...</div>
                    
                    {logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3">
                            <span className="text-gray-600 min-w-[24px]">[{log.id.toString().padStart(2, '0')}]</span>
                            <span className="flex-grow text-gray-300">Checking {log.name}...</span>
                            <span className="font-bold min-w-[60px] text-right">
                                {log.status === 'running' && <span className="text-yellow-400 animate-pulse">TESTING</span>}
                                {log.status === 'ok' && <span className="text-green-500">OK</span>}
                                {log.status === 'error' && <span className="text-red-500">ERROR</span>}
                                {log.status === 'pending' && <span className="text-gray-700">...</span>}
                            </span>
                        </div>
                    ))}

                    {status === 'running' && (
                        <div className="text-green-400 animate-pulse mt-2">_</div>
                    )}

                    {status === 'complete' && (
                        <div className={`mt-8 p-4 border-t border-gray-800 ${errorCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            <div className="font-bold text-lg mb-1">DIAGNOSTIC COMPLETE</div>
                            <div>Tests Passed: {passedCount}</div>
                            <div>Tests Failed: {errorCount}</div>
                            <div className="mt-2">
                                {errorCount === 0 ? 'All systems operational.' : 'System integrity warning. Check logs.'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 bg-gray-900 rounded-b-lg flex justify-end gap-3">
                    {status !== 'running' && (
                        <button 
                            onClick={() => setShowRawLogs(true)} 
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                        >
                            View Logs
                        </button>
                    )}
                    <button 
                        onClick={onClose} 
                        disabled={status === 'running'}
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {status === 'running' ? 'Running...' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};