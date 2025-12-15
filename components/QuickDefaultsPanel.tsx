
import React, { useState, useEffect } from 'react';
import { usePanelDrag } from '../hooks/usePanelDrag';

interface QuickDefaultsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTags: string[];
    onDefaultTagsChange: (tags: string[]) => void;
    defaultRelationOverride: string | null;
    onDefaultRelationOverrideChange: (label: string | null) => void;
    onClearQuickDefaults: () => void;
    activeSchemeRelationshipLabels: string[];
    isDarkMode: boolean;
    allocateZIndex: () => number;
}

export const QuickDefaultsPanel: React.FC<QuickDefaultsPanelProps> = ({
    isOpen,
    onClose,
    defaultTags,
    onDefaultTagsChange,
    defaultRelationOverride,
    onDefaultRelationOverrideChange,
    onClearQuickDefaults,
    activeSchemeRelationshipLabels,
    isDarkMode,
    allocateZIndex
}) => {
    const [tagInput, setTagInput] = useState('');
    const [zIndex, setZIndex] = useState(550);

    const { position, handleMouseDown } = usePanelDrag({
        initialPosition: { x: window.innerWidth / 2 - 175, y: 150 },
        onDragStart: () => setZIndex(allocateZIndex())
    });

    useEffect(() => {
        if (isOpen) {
            setZIndex(allocateZIndex());
        }
    }, [isOpen, allocateZIndex]);

    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = tagInput.trim();
            if (val && !defaultTags.includes(val)) {
                onDefaultTagsChange([...defaultTags, val]);
                setTagInput('');
            }
        }
    };

    const removeTag = (tag: string) => {
        onDefaultTagsChange(defaultTags.filter(t => t !== tag));
    };

    if (!isOpen) return null;

    const bgClass = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200';
    const textClass = isDarkMode ? 'text-gray-200' : 'text-gray-800';
    const labelClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const inputBgClass = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800';
    const selectBgClass = isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800';

    return (
        <div
            className={`fixed rounded-lg shadow-xl border w-[350px] flex flex-col overflow-hidden ${bgClass}`}
            style={{
                left: position.x,
                top: position.y,
                zIndex: zIndex
            }}
        >
            {/* Header */}
            <div
                className={`p-3 border-b flex justify-between items-center cursor-move select-none ${isDarkMode ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <span className="text-purple-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${textClass}`}>Quick Defaults</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-4">
                <p className={`text-xs italic leading-tight ${labelClass}`}>
                    Overrides apply to new elements/connections created in this session.
                </p>

                {/* Relation Override */}
                <div className="flex flex-col gap-1">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ${labelClass}`}>Default Relation</label>
                    <select
                        value={defaultRelationOverride || ''}
                        onChange={(e) => onDefaultRelationOverrideChange(e.target.value || null)}
                        className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 w-full ${selectBgClass}`}
                    >
                        <option value="">-- Use Schema Default --</option>
                        {activeSchemeRelationshipLabels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>

                {/* Tags Override */}
                <div className="flex flex-col gap-1">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ${labelClass}`}>Default Tags</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={handleTagInputChange}
                            onKeyDown={handleTagInputKeyDown}
                            placeholder="Add tag..."
                            className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 w-full ${inputBgClass}`}
                        />
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">
                        {defaultTags.length > 0 ? defaultTags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 bg-purple-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap shadow-sm animate-fade-in">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-purple-200 font-bold ml-1">×</button>
                            </span>
                        )) : (
                            <span className={`text-xs italic py-1 ${labelClass}`}>No tag overrides active.</span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className={`pt-3 mt-1 border-t flex justify-between items-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <button
                        onClick={onClearQuickDefaults}
                        className="text-xs px-2 py-1 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                        disabled={defaultTags.length === 0 && !defaultRelationOverride}
                    >
                        Clear All
                    </button>
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded text-xs font-bold transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
