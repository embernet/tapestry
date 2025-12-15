
import React, { useRef, useState, useEffect } from 'react';
import { usePanelDrag } from '../hooks/usePanelDrag';
import { useClickOutside } from '../hooks/useClickOutside';
import { TagDistributionPanel } from './ExplorerModal';
import { Element } from '../types';

interface TagAnalysisPopupProps {
    elements: Element[];
    initialPosition: { x: number; y: number };
    onClose: () => void;
    allocateZIndex: () => number;
    isDarkMode: boolean;
}

export const TagAnalysisPopup: React.FC<TagAnalysisPopupProps> = ({ elements, initialPosition, onClose, allocateZIndex, isDarkMode }) => {
    const { position, handleMouseDown } = usePanelDrag({
        initialPosition,
        onDragStart: () => setZIndex(allocateZIndex())
    });
    const [zIndex, setZIndex] = useState(500);

    const containerRef = useRef<HTMLDivElement>(null);
    useClickOutside(containerRef, (e) => {
        if ((e.target as HTMLElement).closest('.status-bar-trigger')) return;
        onClose();
    });

    useEffect(() => {
        setZIndex(allocateZIndex());
    }, []);

    const bgClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
    const labelClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';

    return (
        <div
            ref={containerRef}
            className={`fixed w-[350px] rounded-lg shadow-2xl border ${bgClass} overflow-hidden flex flex-col max-h-[calc(100vh-200px)]`}
            style={{ left: position.x, top: position.y, zIndex: zIndex }}
        >
            <div
                className={`p-4 border-b flex justify-between items-center cursor-move select-none ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
                onMouseDown={handleMouseDown}
            >
                <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${textClass}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Tag Analysis
                </h2>
                <button onClick={onClose} className={`hover:text-blue-500 ${labelClass}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <TagDistributionPanel elements={elements} isDarkMode={isDarkMode} />
        </div>
    );
};
