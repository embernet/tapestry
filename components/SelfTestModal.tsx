
import React, { useEffect, useRef, useState } from 'react';

export interface TestLog {
    id: string; // e.g. "1.1.1"
    name: string; // Description
    status: 'pending' | 'running' | 'ok' | 'error' | 'stopped' | 'blocked';
    message?: string;
}

interface SelfTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: TestLog[];
    status: 'idle' | 'preparing' | 'ready' | 'running' | 'paused' | 'complete' | 'stopped';
    isDarkMode?: boolean;
    
    // Playback Controls
    onPlay: () => void;
    onStop: () => void;
    onRunSingle: (index: number) => void;
    onSelectStep: (index: number) => void;
    selectedIndex: number | null;
}

export const SelfTestModal: React.FC<SelfTestModalProps> = ({ 
    isOpen, onClose, logs, status, isDarkMode = true,
    onPlay, onStop, onRunSingle, onSelectStep, selectedIndex
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showRawLogs, setShowRawLogs] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    
    // Window State - Top Left positioning (Safer visibility)
    const [position, setPosition] = useState(() => ({ 
        x: 50, 
        y: 100 
    }));
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

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

    // Handle Window Drag
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only drag from header, ignore buttons
        if ((e.target as HTMLElement).closest('button, textarea')) return;
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragStartRef.current.x,
                    y: e.clientY - dragStartRef.current.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleUserScroll = () => {
        // If user interacts, stop auto-scrolling
        setAutoScroll(false);
    };

    if (!isOpen) return null;

    const totalCount = logs.length;
    const passedCount = logs.filter(l => l.status === 'ok').length;
    const errorCount = logs.filter(l => l.status === 'error').length;
    const blockedCount = logs.filter(l => l.status === 'blocked').length;
    const executedCount = passedCount + errorCount + blockedCount;
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
    const rowRunning = isDarkMode ? 'bg-blue-900/40 border-l-2 border-blue-400' : 'bg-blue-100 border-l-2 border-blue-500';
    const rowError = isDarkMode ? 'bg-red-900/20' : 'bg-red-50';
    const rowBlocked = isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50';
    const rowSelected = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
    const rowHover = isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100';

    return (
        <div 
            className="fixed z-[9999] w-[600px] shadow-2xl flex flex-col font-mono text-sm transition-opacity duration-300 pointer-events-auto"
            style={{ left: position.x, top: position.y }}
        >
            <div className={`${modalBg} rounded-lg border flex flex-col h-[40vh] max-h-[400px] relative overflow-hidden`}>
                
                {showRawLogs && (
                    <div className={`absolute inset-0 ${headerBg} z-20 flex flex-col p-4`}>
                        <div className={`flex justify-between items-center mb-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} pb-2`}>
                            <h3 className={`${textHeader} font-bold`}>Raw System Logs</h3>
                            <button onClick={() => setShowRawLogs(false)} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>Back</button>
                        </div>
                        <textarea 
                            readOnly 
                            value={rawLogs} 
                            className={`flex-grow ${termBg} p-2 font-mono text-xs rounded border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} resize-none focus:outline-none`}
                        />
                    </div>
                )}

                {/* Header */}
                <div 
                    className={`p-3 border-b flex justify-between items-center ${headerBg} flex-shrink-0 cursor-move select-none`}
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${status === 'running' || status === 'preparing' ? 'bg-yellow-400 animate-pulse' : (errorCount > 0 ? 'bg-red-500' : 'bg-green-500')}`}></div>
                        <div className="flex flex-col">
                            <h2 className={`text-base font-bold ${textHeader} tracking-wider uppercase`}>System Self-Test</h2>
                            <div className="text-[10px] text-gray-500 font-bold flex gap-2 uppercase tracking-wide">
                                <span>{status}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 items-center">
                        <button 
                            onClick={() => setShowRawLogs(true)} 
                            className={`text-[10px] underline ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
                        >
                            Raw Log
                        </button>
                        <button 
                            onClick={onClose} 
                            className={`px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs`}
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className={`p-2 border-b ${footerBg} flex items-center gap-2`}>
                    {status === 'running' ? (
                        <button 
                            onClick={onStop}
                            className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2"
                        >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
                            STOP
                        </button>
                    ) : (
                        <button 
                            onClick={onPlay}
                            disabled={status === 'preparing'}
                            className="px-4 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            {status === 'stopped' || status === 'paused' ? 'RESUME' : 'PLAY ALL'}
                        </button>
                    )}
                    
                    <div className="h-4 w-px bg-gray-600 mx-2"></div>
                    
                    <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                         {status === 'running' ? 'Running tests...' : 'Select a step or press Play'}
                    </span>
                </div>

                {/* Terminal Output / Test List */}
                <div 
                    className={`flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar ${termBg}`} 
                    ref={scrollRef}
                    onWheel={handleUserScroll}
                    onMouseDown={handleUserScroll}
                    onTouchStart={handleUserScroll}
                >
                    {logs.length === 0 && (
                        <div className="text-center text-gray-500 py-10 italic">Initializing test environment...</div>
                    )}
                    
                    {logs.map((log, idx) => {
                        const isRunning = log.status === 'running';
                        const isPending = log.status === 'pending';
                        const isBlocked = log.status === 'blocked';
                        const isSelected = selectedIndex === idx;

                        return (
                            <div 
                                id={`test-log-${idx}`}
                                key={idx}
                                onClick={() => onSelectStep(idx)}
                                className={`flex items-start gap-2 text-[11px] py-1 px-2 rounded cursor-pointer group border border-transparent ${
                                    isRunning ? rowRunning : 
                                    (log.status === 'error' ? rowError : 
                                    (isBlocked ? rowBlocked :
                                    (isSelected ? rowSelected : rowHover)))
                                }`}
                            >
                                {/* Play Single Button (Visible on Hover or Selected) */}
                                <div className="min-w-[20px] flex justify-center">
                                    {(isPending || log.status === 'error' || log.status === 'stopped' || isBlocked) && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onRunSingle(idx); }}
                                            className={`opacity-0 group-hover:opacity-100 ${isSelected ? 'opacity-100' : ''} text-green-400 hover:text-green-300 transition-opacity`}
                                            title="Run this step"
                                        >
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        </button>
                                    )}
                                    {isRunning && <span className="text-yellow-500 animate-spin">⟳</span>}
                                    {log.status === 'ok' && <span className="text-green-500">✓</span>}
                                    {isBlocked && <span className="text-orange-500">⊘</span>}
                                </div>

                                <span className={`${logTextMeta} min-w-[40px] font-bold font-mono opacity-70`}>{log.id}</span>
                                
                                <span className={`flex-grow break-words ${isPending ? 'opacity-60' : 'opacity-100'}`}>
                                    {log.name}
                                    {log.message && <div className="text-red-400 ml-2 mt-0.5 font-mono opacity-100 bg-red-900/20 p-1 rounded inline-block">> {log.message}</div>}
                                </span>
                            </div>
                        );
                    })}

                    {status === 'complete' && (
                        <div className={`mt-4 pt-2 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-700'} text-xs text-center pb-4`}>
                            <span className={logTextMeta}>DIAGNOSTIC COMPLETE</span>
                            {errorCount > 0 
                                ? <div className="text-red-400 mt-1 font-bold">⚠️ {errorCount} errors found.</div>
                                : <div className="text-green-400 mt-1 font-bold">✓ All systems operational.</div>
                            }
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-700 relative">
                    <div 
                        className={`h-full transition-all duration-300 ease-out ${status === 'complete' ? (errorCount > 0 ? 'bg-red-500' : 'bg-green-500') : (status === 'preparing' ? 'bg-yellow-500' : 'bg-blue-500')}`} 
                        style={{ width: `${percentComplete}%` }}
                    ></div>
                </div>

                {/* Status Bar Footer */}
                <div className={`p-2 border-t ${footerBg} flex justify-between items-center text-[10px]`}>
                    <div className="flex gap-4">
                        <div className="flex gap-1">
                            <span className={statLabel}>Total:</span>
                            <span className={`font-bold ${statValue}`}>{totalCount}</span>
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
                            <span className={statLabel}>Blocked:</span>
                            <span className="font-bold text-orange-500">{blockedCount}</span>
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
