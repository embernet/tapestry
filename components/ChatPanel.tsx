import React, { useState, useEffect, useRef } from 'react';
import { usePanelDrag } from '../hooks/usePanelDrag';
import { ChatPanelProps } from './ChatPanel/types';
import { useChatTools } from './ChatPanel/useChatTools';
import { useChatLogic } from './ChatPanel/useChatLogic';
import { usePlanExecution } from './ChatPanel/usePlanExecution';
import { ChatMessageItem } from './ChatPanel/ChatMessageItem';
import { ChatInput } from './ChatPanel/ChatInput';

const ChatPanel: React.FC<ChatPanelProps> = (props) => {
    // Destructure strict props
    const {
        elements, relationships, colorSchemes, activeSchemeId, onClose, currentModelId,
        modelActions, className, isOpen, onOpenPromptSettings, systemPromptConfig,
        documents, folders, openDocIds, onLogHistory, onOpenHistory, onOpenTool,
        onAnalyzeWithChat,
        kanbanBoards, setKanbanBoards, activeKanbanBoardId, setActiveKanbanBoardId,
        initialInput, activeModel, aiConfig, isDarkMode, messages, setMessages,
        allocateZIndex, onShowApiKeyModal
    } = props;

    // Shared UI State
    const [isVerboseMode, setIsVerboseMode] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [size, setSize] = useState(() => {
        const h = window.innerHeight - 160 - 20;
        return { width: 400, height: Math.max(400, h) };
    });
    const [zIndex, setZIndex] = useState(30);

    // --- Hooks ---

    const { executeFunctionCalls } = useChatTools({
        modelActions,
        elements,
        relationships,
        kanbanBoards,
        setKanbanBoards,
        activeKanbanBoardId,
        setActiveKanbanBoardId,
        onOpenTool
    });

    const {
        activePlan, setActivePlan, planStatus, setPlanStatus, executionStats, setExecutionStats, handleExecutePlan, handleDiscardPlan
    } = usePlanExecution({
        messages,
        setMessages,
        aiConfig,
        systemPromptConfig,
        elements,
        relationships,
        documents,
        executeFunctionCalls,
        isVerboseMode
    });

    const {
        input, setInput, isLoading, error, setError, isCreativeMode, setIsCreativeMode, actionDecisions, setActionDecisions, handleSelectAll, handleApplyPending, handleSendMessage
    } = useChatLogic({
        messages,
        setMessages,
        aiConfig,
        systemPromptConfig,
        documents,
        elements,
        relationships,
        executeFunctionCalls,
        isVerboseMode,
        planStatus,
        setActivePlan,
        setPlanStatus,
        onShowApiKeyModal
    });

    // --- UI Effects & Handlers ---

    // Z-Index Allocation Fix (Infinite Loop Prevention)
    const prevIsOpenRef = useRef(isOpen);
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            setZIndex(allocateZIndex());
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, allocateZIndex]);

    // Initialize Input
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (isOpen && initialInput) {
            setInput(initialInput);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                }
            }, 100);
        }
    }, [initialInput, isOpen, setInput]);

    // Scroll to bottom
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [messages.length, activePlan]); // Optimized dependency

    // Clear Chat
    const handleClearChat = () => {
        if (confirm("Are you sure you want to start a new chat? This will clear all history.")) {
            setMessages([]);
            handleDiscardPlan();
            setActionDecisions({});
            setExecutionStats({ actions: 0 });
        }
    };

    // Drag & Resize
    const { position, setPosition, handleMouseDown: handleDragMouseDown } = usePanelDrag({
        initialPosition: { x: 20, y: 160 },
        onDragStart: () => setZIndex(allocateZIndex())
    });

    const [isResizing, setIsResizing] = useState(false);
    const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        resizeStartRef.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing) {
                setSize({
                    width: Math.max(320, resizeStartRef.current.w + (e.clientX - resizeStartRef.current.x)),
                    height: Math.max(400, resizeStartRef.current.h + (e.clientY - resizeStartRef.current.y))
                });
            }
        };
        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Styles
    const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-white';
    const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
    const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
    const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        handleDragMouseDown(e);
    };

    return (
        <>
            <div
                className={`fixed ${bgClass} border ${borderClass} rounded-lg shadow-2xl flex flex-col ${className} ${isOpen ? '' : 'hidden'}`}
                style={{ left: position.x, top: position.y, width: size.width, height: size.height, zIndex: zIndex }}
            >
                {/* Header */}
                <div
                    className={`p-4 border-b ${borderClass} flex justify-between items-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-t-lg cursor-move select-none`}
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <h2 className={`text-lg font-bold ${textClass}`}>AI Assistant</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleClearChat} className={`${subTextClass} hover:text-green-500 p-1`} title="New Chat">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                        <button onClick={onOpenHistory} className={`${subTextClass} hover:text-blue-500 p-1`} title="History">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                        <div className="w-px h-4 bg-gray-600 mx-1"></div>
                        <button onClick={onOpenPromptSettings} className={`${subTextClass} hover:text-blue-500 p-1`} title="Settings">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={onClose} className={`${subTextClass} hover:text-red-500 p-1`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col">
                    {messages.map((msg, idx) => (
                        <ChatMessageItem
                            key={idx}
                            index={idx}
                            msg={msg}
                            isDarkMode={isDarkMode}
                            copyToClipboard={(text) => navigator.clipboard.writeText(text)}
                            handleDeleteMessage={(i) => setMessages(prev => prev.filter((_, idx) => idx !== i))}
                            activePlan={activePlan}
                            planStatus={planStatus}
                            isVerboseMode={isVerboseMode}
                            setIsVerboseMode={setIsVerboseMode}
                            handleDiscardPlan={handleDiscardPlan}
                            handleExecutePlan={handleExecutePlan}
                            actionDecisions={actionDecisions}
                            setActionDecisions={setActionDecisions}
                            handleSelectAll={handleSelectAll}
                            handleApplyPending={handleApplyPending}
                            isLoading={isLoading && idx === messages.length - 1}
                        />
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-gray-500 text-xs animate-pulse">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            Thinking...
                        </div>
                    )}

                    {/* Active Plan Status Removed (Merged into PlanDAG) */}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <ChatInput
                    input={input}
                    setInput={setInput}
                    handleSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    planStatus={planStatus}
                    isCreativeMode={isCreativeMode}
                    setIsCreativeMode={setIsCreativeMode}
                    copyAllLogs={() => {
                        const allLogs = messages.map(m => {
                            const role = m.role === 'user' ? '[USER]' : '[MODEL]';
                            let content = `${role}\n${m.text || ''}\n${m.isVerbose ? '(Verbose Log)' : ''}`;

                            // Include Plan Details if present
                            if (m.plan) {
                                content += '\n\n[PLAN EXECUTION LOG]';
                                m.plan.forEach(step => {
                                    content += `\nStep ${step.id} (${step.status}): ${step.description}`;
                                    if (step.result) {
                                        content += `\n  > Result/Error: ${step.result}`;
                                    }
                                });
                            }
                            return content;
                        }).join('\n\n------------------------------------------------\n\n');
                        navigator.clipboard.writeText(allLogs);
                    }}
                    error={error}
                    setShowErrorModal={setShowErrorModal}
                    isDarkMode={isDarkMode}
                    isVerboseMode={isVerboseMode}
                    setIsVerboseMode={setIsVerboseMode}
                    isOpen={!!isOpen}
                />

                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-40 flex items-end justify-end p-0.5"
                    onMouseDown={handleResizeStart}
                >
                    <svg viewBox="0 0 10 10" className="w-3 h-3 text-gray-500 opacity-50">
                        <path d="M10 10 L10 0 L0 10 Z" fill="currentColor" />
                    </svg>
                </div>
            </div>

            {/* Error Modal */}
            {showErrorModal && error && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-lg ${isDarkMode ? 'bg-gray-800 border-red-500' : 'bg-white border-red-400'} border-2 rounded-lg shadow-2xl flex flex-col max-h-[80vh] overflow-hidden`}>
                        <div className="p-3 bg-red-900/20 border-b border-red-500/30 flex justify-between items-center">
                            <h3 className="text-red-400 font-bold text-sm uppercase flex items-center gap-2">Error Details</h3>
                            <button onClick={() => setShowErrorModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto font-mono text-xs text-red-300 whitespace-pre-wrap break-words flex-grow bg-black/20">
                            {error}
                        </div>
                        <div className="p-3 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-2">
                            <button
                                onClick={() => { navigator.clipboard.writeText(error); setShowErrorModal(false); }}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded transition-colors"
                            >
                                Copy & Close
                            </button>
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatPanel;
