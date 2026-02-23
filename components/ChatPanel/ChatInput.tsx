
import React, { useRef, useEffect } from 'react';

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    handleSendMessage: (customPrompt?: string) => void;
    isLoading: boolean;
    planStatus: 'proposed' | 'executing' | 'completed' | 'paused';
    isCreativeMode: boolean;
    setIsCreativeMode: (v: boolean) => void;
    copyAllLogs: () => void;
    error: string | null;
    setShowErrorModal: (v: boolean) => void;
    isDarkMode: boolean;
    isVerboseMode: boolean;
    setIsVerboseMode: (v: boolean) => void;
    isOpen: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    input,
    setInput,
    handleSendMessage,
    isLoading,
    planStatus,
    isCreativeMode,
    setIsCreativeMode,
    copyAllLogs,
    error,
    setShowErrorModal,
    isDarkMode,
    isVerboseMode,
    setIsVerboseMode,
    isOpen
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const inputBg = isDarkMode ? 'bg-gray-900 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';
    const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';

    useEffect(() => {
        if (isOpen) {
            // Small timeout to allow for visibility transitions/mount
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    return (
        <div className={`p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-t ${borderClass}`}>
            <div className="flex gap-2 relative">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder="Ask me a question about the model or instruct me to change it"
                    className={`w-full ${inputBg} text-sm rounded p-2 border focus:border-blue-500 outline-none resize-none max-h-32 scrollbar-thin ${planStatus === 'proposed' ? 'border-purple-500 ring-1 ring-purple-500' : ''}`}
                    rows={2}
                />
                <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed self-end h-9 w-9 flex items-center justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
            </div>
            <div className="flex justify-between items-center mt-2 px-1">
                <div className="flex gap-2">
                    <button onClick={() => setIsCreativeMode(!isCreativeMode)} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${isCreativeMode ? 'border-purple-500 text-purple-500' : `${isDarkMode ? 'border-gray-600 text-gray-500' : 'border-gray-300 text-gray-400'}`}`}>
                        {isCreativeMode ? 'Creative Mode' : 'Strict Mode'}
                    </button>
                    <button onClick={() => setIsVerboseMode(!isVerboseMode)} className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border hover:bg-gray-700 ${isVerboseMode ? 'bg-blue-900/30 border-blue-500 text-blue-400' : (isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-400')}`} title="Toggle detailed logging">
                        Verbose: {isVerboseMode ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={copyAllLogs} className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border hover:bg-gray-700 ${isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-400'}`} title="Copy all debug logs to clipboard">
                        Copy Logs
                    </button>
                </div>
                {error ? (
                    <button
                        onClick={() => setShowErrorModal(true)}
                        className="bg-red-900/50 hover:bg-red-900 border border-red-500 text-red-400 text-xs px-2 py-0.5 rounded flex items-center gap-1 transition-colors max-w-[200px]"
                    >
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="truncate">Error (Click to view)</span>
                    </button>
                ) : <span></span>}
            </div>
        </div>
    );
};
