
import React, { useState, useEffect } from 'react';
import { ColorScheme } from '../types';
import { usePanelDrag } from '../hooks/usePanelDrag';
import { normalizeTag, formatTag } from '../utils';

interface BulkEditPanelProps {
    isOpen: boolean;
    onClose: () => void;
    activeColorScheme: ColorScheme | undefined;
    tagsToAdd: string[];
    tagsToRemove: string[];
    onTagsToAddChange: (tags: string[]) => void;
    onTagsToRemoveChange: (tags: string[]) => void;
    isActive: boolean;
    onToggleActive: () => void;
    isDarkMode: boolean;
    allocateZIndex: () => number;
}

export const BulkEditPanel: React.FC<BulkEditPanelProps> = ({
    isOpen,
    onClose,
    activeColorScheme,
    tagsToAdd,
    tagsToRemove,
    onTagsToAddChange,
    onTagsToRemoveChange,
    isActive,
    onToggleActive,
    isDarkMode,
    allocateZIndex
}) => {
    const [manualAddInput, setManualAddInput] = useState('');
    const [manualRemoveInput, setManualRemoveInput] = useState('');
    const [lastFocusedInput, setLastFocusedInput] = useState<'add' | 'remove'>('add');
    const [zIndex, setZIndex] = useState(500);

    // Window Drag State
    const { position, handleMouseDown: handleDragMouseDown } = usePanelDrag({
        initialPosition: { x: 100, y: 200 },
        onDragStart: () => setZIndex(allocateZIndex())
    });

    useEffect(() => {
        if (isOpen) {
            setZIndex(allocateZIndex());
        }
    }, [isOpen, allocateZIndex]);

    const handleAddTag = (tag: string) => {
        if (!tag) return;
        const normalized = normalizeTag(tag);
        if (!tagsToAdd.includes(normalized)) {
            const newTags = [...tagsToAdd, normalized];
            onTagsToAddChange(newTags);
            // Remove from Remove list if present
            if (tagsToRemove.includes(normalized)) {
                onTagsToRemoveChange(tagsToRemove.filter(t => t !== normalized));
            }
        }
    };

    const handleRemoveTag = (tag: string) => {
        if (!tag) return;
        const normalized = normalizeTag(tag);
        if (!tagsToRemove.includes(normalized)) {
            const newTags = [...tagsToRemove, normalized];
            onTagsToRemoveChange(newTags);
            // Remove from Add list if present
            if (tagsToAdd.includes(normalized)) {
                onTagsToAddChange(tagsToAdd.filter(t => t !== normalized));
            }
        }
    };

    const handleUnstageAdd = (tag: string) => {
        onTagsToAddChange(tagsToAdd.filter(t => t !== tag));
    };

    const handleUnstageRemove = (tag: string) => {
        onTagsToRemoveChange(tagsToRemove.filter(t => t !== tag));
    };

    const onKeyDownAdd = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag(manualAddInput.trim());
            setManualAddInput('');
        }
    };

    const onKeyDownRemove = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleRemoveTag(manualRemoveInput.trim());
            setManualRemoveInput('');
        }
    };

    const getColorForTag = (tag: string) => {
        return activeColorScheme?.tagColors[tag] || '#6b7280';
    };

    const toggleTag = (tag: string) => {
        const normalizedTag = normalizeTag(tag);

        const inAdd = tagsToAdd.includes(normalizedTag);
        const inRemove = tagsToRemove.includes(normalizedTag);

        if (lastFocusedInput === 'add') {
            if (inAdd) {
                // If already in 'add', remove it
                handleUnstageAdd(normalizedTag);
            } else {
                // If not in 'add' (whether in 'remove' or neither), add to 'add'
                // handleAddTag handles removing from 'remove' list automatically
                handleAddTag(normalizedTag);
            }
        } else {
            // lastFocusedInput === 'remove'
            if (inRemove) {
                // If already in 'remove', remove it
                handleUnstageRemove(normalizedTag);
            } else {
                // If not in 'remove' (whether in 'add' or neither), add to 'remove'
                // handleRemoveTag handles removing from 'add' list automatically
                handleRemoveTag(normalizedTag);
            }
        }
    };

    const schemaTags = activeColorScheme ? Object.keys(activeColorScheme.tagColors) : [];

    // Theme Classes
    const bgClass = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200';
    const inputClass = isDarkMode
        ? 'bg-transparent text-white placeholder-gray-500'
        : 'bg-transparent text-gray-900 placeholder-gray-400';
    const activeBtnClass = isDarkMode
        ? 'bg-pink-600 border-white text-white animate-pulse'
        : 'bg-pink-500 border-pink-600 text-white animate-pulse shadow-md';
    const inactiveBtnClass = isDarkMode
        ? 'bg-gray-700 border-gray-500 text-gray-400 hover:bg-gray-600 hover:text-white hover:border-white'
        : 'bg-gray-50 border-gray-300 text-gray-400 hover:bg-gray-100 hover:text-gray-600 hover:border-gray-400';
    const inputContainerBg = isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-300';

    if (!isOpen) return null;

    return (
        <div
            className={`fixed rounded-lg shadow-2xl border flex flex-col overflow-hidden w-80 pointer-events-auto ${bgClass}`}
            style={{
                left: position.x,
                top: position.y,
                zIndex: zIndex
            }}
        >
            {/* Header */}
            <div
                className={`p-2 border-b flex justify-between items-center cursor-move select-none ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}
                onMouseDown={handleDragMouseDown}
            >
                <span className="text-xs font-bold uppercase tracking-wider">Bulk Operations</span>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-4">

                {/* Helper Text */}
                <div className={`text-[10px] italic text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Enter tags below. When "ACTIVE", clicking nodes will apply these changes.
                </div>

                {/* ADD TAGS SECTION */}
                <div className="space-y-1">
                    <label className="text-[10px] text-green-500 font-bold uppercase tracking-wider block">Add Tags</label>
                    <div className={`flex flex-wrap gap-1.5 p-2 rounded-md border min-h-[42px] content-start ${inputContainerBg}`}>
                        {tagsToAdd.map(tag => (
                            <span
                                key={tag}
                                onClick={() => handleUnstageAdd(tag)}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white cursor-pointer hover:opacity-80 transition-opacity shadow-sm border border-white/20"
                                style={{ backgroundColor: getColorForTag(tag), textShadow: '0px 1px 1px rgba(0,0,0,0.5)' }}
                            >
                                <span className="mr-1">+</span>
                                {formatTag(tag)}
                                <span className="ml-1 text-white/70 hover:text-white font-bold">&times;</span>
                            </span>
                        ))}
                        <input
                            type="text"
                            value={manualAddInput}
                            onChange={(e) => setManualAddInput(e.target.value)}
                            onKeyDown={onKeyDownAdd}
                            onFocus={() => setLastFocusedInput('add')}
                            placeholder={tagsToAdd.length === 0 ? "Type tag & Enter..." : ""}
                            className={`flex-grow min-w-[60px] text-xs focus:outline-none border-none p-0 ${inputClass}`}
                        />
                    </div>
                </div>

                {/* REMOVE TAGS SECTION */}
                <div className="space-y-1">
                    <label className="text-[10px] text-red-500 font-bold uppercase tracking-wider block">Remove Tags</label>
                    <div className={`flex flex-wrap gap-1.5 p-2 rounded-md border min-h-[42px] content-start ${inputContainerBg}`}>
                        {tagsToRemove.map(tag => (
                            <span
                                key={tag}
                                onClick={() => handleUnstageRemove(tag)}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white cursor-pointer hover:opacity-80 transition-opacity shadow-sm border border-white/20"
                                style={{ backgroundColor: getColorForTag(tag), textShadow: '0px 1px 1px rgba(0,0,0,0.5)' }}
                            >
                                <span className="mr-1">-</span>
                                {formatTag(tag)}
                                <span className="ml-1 text-white/70 hover:text-white font-bold">&times;</span>
                            </span>
                        ))}
                        <input
                            type="text"
                            value={manualRemoveInput}
                            onChange={(e) => setManualRemoveInput(e.target.value)}
                            onKeyDown={onKeyDownRemove}
                            onFocus={() => setLastFocusedInput('remove')}
                            placeholder={tagsToRemove.length === 0 ? "Type tag & Enter..." : ""}
                            className={`flex-grow min-w-[60px] text-xs focus:outline-none border-none p-0 ${inputClass}`}
                        />
                    </div>
                </div>

                {/* Quick Tags */}
                {schemaTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                        {schemaTags.map(tag => {
                            const inAdd = tagsToAdd.some(t => t.toLowerCase() === tag.toLowerCase());
                            const inRemove = tagsToRemove.some(t => t.toLowerCase() === tag.toLowerCase());
                            const color = activeColorScheme?.tagColors[tag] || '#6b7280'; // Default gray-500

                            return (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`text-[10px] px-2.5 py-1 rounded-full text-white hover:scale-105 transition-all shadow-sm border border-black/10 hover:shadow-md flex items-center gap-1.5`}
                                    style={{
                                        backgroundColor: color,
                                        textShadow: '0px 1px 1px rgba(0,0,0,0.3)',
                                        opacity: (inAdd || inRemove) ? 1 : 0.85,
                                    }}
                                >
                                    <span>{tag}</span>
                                    {inAdd && <span className="bg-white text-green-600 rounded-full w-3 h-3 flex items-center justify-center text-[9px] font-bold shadow-sm">+</span>}
                                    {inRemove && <span className="bg-white text-red-500 rounded-full w-3 h-3 flex items-center justify-center text-[9px] font-bold shadow-sm">-</span>}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Toggle Active Button */}
                <button
                    onClick={onToggleActive}
                    className={`w-full py-2 rounded font-bold uppercase tracking-wider text-xs transition-colors border-2 ${isActive ? activeBtnClass : inactiveBtnClass}`}
                >
                    {isActive ? 'Bulk Mode Active' : 'Activate Bulk Mode'}
                </button>

            </div>
        </div>
    );
};
