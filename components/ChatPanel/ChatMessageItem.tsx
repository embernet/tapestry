
import React from 'react';
import { ChatMessage, PlanStep } from '../../types';
import { PlanDAG } from './PlanDAG';
import { FunctionCall } from '@google/genai';
import { parseParameters } from './utils';

interface ChatMessageItemProps {
    msg: ChatMessage;
    index: number;
    isDarkMode: boolean;
    copyToClipboard: (text: string) => void;
    handleDeleteMessage: (index: number) => void;
    // Plan Props
    activePlan: PlanStep[] | null;
    planStatus: 'proposed' | 'executing' | 'completed' | 'paused';
    isVerboseMode: boolean;
    setIsVerboseMode: (v: boolean) => void;
    handleDiscardPlan: () => void;
    handleExecutePlan: () => void;
    // Action Props
    actionDecisions: Record<number, 'pending' | 'accepted' | 'rejected'>;
    setActionDecisions: React.Dispatch<React.SetStateAction<Record<number, 'pending' | 'accepted' | 'rejected'>>>;
    handleSelectAll: (index: number, select: boolean) => void;
    handleApplyPending: (index: number) => void;
    isLoading: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
    msg,
    index,
    isDarkMode,
    copyToClipboard,
    handleDeleteMessage,
    activePlan,
    planStatus,
    isVerboseMode,
    setIsVerboseMode,
    handleDiscardPlan,
    handleExecutePlan,
    actionDecisions,
    setActionDecisions,
    handleSelectAll,
    handleApplyPending,
    isLoading
}) => {
    const messageUserBg = 'bg-blue-600 text-white';
    const messageModelBg = isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800';
    const actionBg = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300';
    const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';

    const getActionTitle = (fc: FunctionCall) => {
        const args = parseParameters(fc.args);
        switch (fc.name) {
            case 'addElement': return `Add Element: "${args.name}"`;
            case 'addRelationship': return `Add Connection`;
            case 'deleteElement': return `Delete Element: "${args.name}"`;
            case 'updateElement': return `Update Element: "${args.name}"`;
            case 'deleteRelationship': return `Disconnect: "${args.sourceName}" & "${args.targetName}"`;
            case 'readDocument': return `Read Document: "${args.title}"`;
            case 'createDocument': return `Create Document: "${args.title}"`;
            case 'updateDocument': return `Update Document: "${args.title}" (${args.mode || 'replace'})`;
            case 'openTool': return `Open Tool: ${args.tool}`;
            default: return fc.name;
        }
    };

    const renderActionContent = (fc: FunctionCall, isDark: boolean) => {
        const args = parseParameters(fc.args);
        const labelClass = isDark ? 'text-gray-400' : 'text-gray-500';
        const textClass = isDark ? 'text-gray-300' : 'text-gray-700';

        if (fc.name === 'addRelationship') {
            return (
                <div className="mt-1 space-y-1 text-xs">
                    <div className="flex gap-2">
                        <span className={`${labelClass} font-semibold w-10`}>From:</span>
                        <span className={`${textClass} font-mono`}>{args.sourceName}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className={`${labelClass} font-semibold w-10`}>To:</span>
                        <span className={`${textClass} font-mono`}>{args.targetName}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className={`${labelClass} font-semibold w-10`}>Label:</span>
                        <span className={`${textClass} italic`}>{args.label || '(none)'}</span>
                    </div>
                    {args.rationale && (
                        <div className="flex gap-2 mt-1 border-t border-gray-700/50 pt-1">
                            <span className={`${labelClass} font-semibold w-10`}>Why:</span>
                            <span className={`${textClass} opacity-80`}>{args.rationale}</span>
                        </div>
                    )}
                </div>
            );
        }

        if (fc.name === 'createDocument' || fc.name === 'updateDocument') {
            const contentPreview = args.content;
            return (
                <div className="mt-1 space-y-1 text-xs">
                    <div className="flex gap-1">
                        <span className={`${labelClass} font-semibold`}>Title:</span>
                        <span className={textClass}>{args.title}</span>
                    </div>
                    {args.mode && (
                        <div className="flex gap-1">
                            <span className={`${labelClass} font-semibold`}>Mode:</span>
                            <span className={textClass}>{args.mode}</span>
                        </div>
                    )}
                    {contentPreview && (
                        <div className="mt-1 p-2 bg-black/10 rounded border border-white/5 font-mono max-h-20 overflow-y-auto">
                            {contentPreview.length > 100 ? contentPreview.substring(0, 100) + '...' : contentPreview}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="mt-1 space-y-1 text-xs">
                {Object.entries(args).map(([k, v]) => {
                    if (k === 'name' || k === 'sourceName' || k === 'targetName') return null; // Already in title
                    return (
                        <div key={k} className="flex gap-1">
                            <span className={`${labelClass} font-semibold`}>{k}:</span>
                            <span className={textClass}>{JSON.stringify(v)}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (msg.isVerbose) {
        return (
            <div className="w-full px-4 mb-2 group relative">
                <div className={`text-[10px] font-mono whitespace-pre-wrap p-2 rounded border-l-2 ${isDarkMode ? 'bg-black/20 text-green-400 border-green-600' : 'bg-gray-100 text-green-700 border-green-500'}`}>
                    {msg.text}
                </div>
                <button
                    onClick={() => copyToClipboard(msg.text || '')}
                    className="absolute top-1 right-5 opacity-0 group-hover:opacity-100 bg-gray-700 text-white text-[10px] px-1 rounded hover:bg-gray-600 transition-opacity"
                    title="Copy debug log"
                >
                    Copy
                </button>
            </div>
        );
    }

    return (
        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.text && (
                <div className={`p-3 rounded-lg max-w-[90%] text-sm whitespace-pre-wrap relative group/bubble ${msg.role === 'user' ? messageUserBg : messageModelBg}`}>
                    {msg.text}

                    <div className={`absolute top-1 right-1 opacity-0 group-hover/bubble:opacity-100 flex gap-1 ${isDarkMode ? 'bg-black/40' : 'bg-white/40'} p-1 rounded backdrop-blur-sm transition-opacity`}>
                        <button
                            onClick={() => copyToClipboard(msg.text || '')}
                            className="p-1 hover:text-blue-300 text-xs rounded hover:bg-white/10"
                            title="Copy"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleDeleteMessage(index)}
                            className="p-1 hover:text-red-300 text-xs rounded hover:bg-white/10"
                            title="Delete Message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Plan Render */}
            {msg.plan && msg.plan.length > 0 && (
                <PlanDAG
                    plan={msg.plan}
                    activePlan={activePlan}
                    planStatus={planStatus}
                    onDiscard={handleDiscardPlan}
                    onExecute={handleExecutePlan}
                    isDarkMode={isDarkMode}
                />
            )}

            {/* Function Calls UI */}
            {msg.functionCalls && (
                <div className={`mt-2 ${actionBg} border rounded-lg p-2 w-full max-w-[95%] shadow-lg`}>
                    <div className="flex justify-between items-center mb-2 px-1">
                        <div className={`text-xs font-bold ${subTextClass} uppercase tracking-wider`}>Proposed Actions</div>
                        {msg.isPending && (
                            <div className="flex gap-2">
                                <button onClick={() => handleSelectAll(index, true)} className="text-[10px] text-blue-500 hover:underline font-semibold">Select All</button>
                                <button onClick={() => handleSelectAll(index, false)} className="text-[10px] text-blue-500 hover:underline font-semibold">Select None</button>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        {msg.functionCalls.map((fc, i) => (
                            <div key={i} className={`flex items-start gap-2 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'} p-2 rounded text-xs`}>
                                {msg.isPending && (
                                    <input
                                        type="checkbox"
                                        checked={actionDecisions[i] === 'accepted'}
                                        onChange={() => setActionDecisions(prev => ({ ...prev, [i]: prev[i] === 'accepted' ? 'rejected' : 'accepted' }))}
                                        className="cursor-pointer mt-0.5"
                                    />
                                )}
                                <div className={`flex-grow ${actionDecisions[i] === 'rejected' ? 'opacity-50 line-through' : ''}`}>
                                    <span className="font-bold text-blue-500">{getActionTitle(fc)}</span>
                                    {renderActionContent(fc, isDarkMode)}
                                </div>
                            </div>
                        ))}
                    </div>
                    {msg.isPending ? (
                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={() => handleApplyPending(index)}
                                disabled={isLoading}
                                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold"
                            >
                                Apply Selected
                            </button>
                        </div>
                    ) : (
                        <div className="mt-2 text-xs">
                            <div className="text-[10px] uppercase tracking-wider text-green-600 font-bold mb-2 border-b border-green-500/30 pb-1">Processed Actions</div>
                            <div className="space-y-1">
                                {msg.functionCalls.map((fc, i) => (
                                    <div key={i} className={`flex items-start gap-2 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'} p-2 rounded text-xs opacity-75`}>
                                        {actionDecisions[i] !== 'rejected' ? (
                                            <span className="text-green-500 font-bold">✓</span>
                                        ) : (
                                            <span className="text-gray-400 font-bold">×</span>
                                        )}
                                        <div className={`flex-grow ${actionDecisions[i] === 'rejected' ? 'text-gray-500 line-through' : 'text-gray-500'}`}>
                                            <span className="font-bold">{getActionTitle(fc)}</span>
                                            <span className="ml-2 text-[10px] italic">(Completed)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
