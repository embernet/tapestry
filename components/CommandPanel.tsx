import React, { useState, useEffect } from 'react';
import { usePanelDrag } from '../hooks/usePanelDrag';

interface CommandPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onExecute: (markdown: string) => void;
    onOpenHistory?: () => void;
    isDarkMode: boolean;
    allocateZIndex: () => number;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
    isOpen,
    onClose,
    onExecute,
    onOpenHistory,
    isDarkMode,
    allocateZIndex
}) => {
    const [input, setInput] = useState('');
    const [zIndex, setZIndex] = useState(550);

    const { position, handleMouseDown: handleDragMouseDown } = usePanelDrag({
        initialPosition: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 100 },
        onDragStart: () => setZIndex(allocateZIndex())
    });

    useEffect(() => {
        if (isOpen) {
            setZIndex(allocateZIndex());
        }
    }, [isOpen, allocateZIndex]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
                onExecute(input);
                setInput('');
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Prevent drag if clicking buttons/inputs
        if ((e.target as HTMLElement).closest('button, textarea')) return;

        // Stop unnecessary propagation to canvas
        e.stopPropagation();

        handleDragMouseDown(e);
    };

    if (!isOpen) return null;

    const bgClass = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200';
    const inputBgClass = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';
    const textMain = isDarkMode ? 'text-gray-300' : 'text-gray-600';
    const textSub = isDarkMode ? 'text-gray-500' : 'text-gray-400';
    const iconButtonBg = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-black border border-gray-300';
    const headerClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200';

    return (
        <div
            className={`fixed rounded-lg shadow-2xl border flex flex-col w-[450px] overflow-hidden pointer-events-auto ${bgClass}`}
            style={{
                left: position.x,
                top: position.y,
                zIndex: zIndex
            }}
        >
            {/* Header */}
            <div
                className={`p-3 border-b flex justify-between items-center cursor-move select-none ${headerClass}`}
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-green-500">Command</span>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-col">
                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${textMain}`}>
                        Quick Add (Markdown)
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Element A -[relationship]> Element B; Element C"
                        className={`border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none scrollbar-thin scrollbar-thumb-gray-600 flex-grow ${inputBgClass}`}
                        style={{ minHeight: '5rem' }}
                        autoFocus
                    />
                    <div className={`text-[9px] mt-1 text-right ${textSub}`}>
                        Enter to run, Shift+Enter for newline
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    {onOpenHistory && (
                        <button
                            onClick={onOpenHistory}
                            className={`rounded h-8 w-8 flex items-center justify-center transition-colors ${iconButtonBg}`}
                            title="Command History"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (input.trim()) {
                                onExecute(input);
                                setInput('');
                            }
                        }}
                        className="bg-green-600 hover:bg-green-500 text-white rounded px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                    >
                        Execute
                    </button>
                </div>
            </div>
        </div>
    );
};
