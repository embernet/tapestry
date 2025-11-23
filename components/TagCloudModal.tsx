
import React, { useState, useMemo } from 'react';
import { Element, Relationship } from '../types';

interface TagCloudModalProps {
  isOpen: boolean;
  elements: Element[];
  relationships: Relationship[];
  onClose: () => void;
  onNodeSelect: (elementId: string) => void;
}

type ViewState = 
    | { type: 'all_tags' } 
    | { type: 'elements_by_tag', tag: string };

const TagCloudModal: React.FC<TagCloudModalProps> = ({ isOpen, elements, relationships, onClose, onNodeSelect }) => {
    const [viewStack, setViewStack] = useState<ViewState[]>([{ type: 'all_tags' }]);
    
    const currentView = viewStack[viewStack.length - 1];

    // Stats for Tags
    const tagStats = useMemo(() => {
        const counts = new Map<string, number>();
        elements.forEach(e => e.tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
        const max = Math.max(...Array.from(counts.values()), 1);
        return { counts, max };
    }, [elements]);

    // Stats for Elements (Degree)
    const elementStats = useMemo(() => {
        const degree = new Map<string, number>();
        elements.forEach(e => degree.set(e.id, 0));
        relationships.forEach(r => {
            degree.set(r.source as string, (degree.get(r.source as string) || 0) + 1);
            degree.set(r.target as string, (degree.get(r.target as string) || 0) + 1);
        });
        const max = Math.max(...Array.from(degree.values()), 1);
        return { degree, max };
    }, [elements, relationships]);

    const handleTagClick = (tag: string) => {
        setViewStack([...viewStack, { type: 'elements_by_tag', tag }]);
    };

    const handleBack = () => {
        if (viewStack.length > 1) {
            setViewStack(viewStack.slice(0, -1));
        }
    };

    const handleNodeClick = (id: string) => {
        onNodeSelect(id);
        onClose();
    };

    const getRandomColor = () => {
        const colors = ['text-blue-400', 'text-green-400', 'text-yellow-400', 'text-pink-400', 'text-purple-400', 'text-cyan-400', 'text-orange-400'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const getFontSize = (count: number, max: number, minSize: number = 12, maxSize: number = 48) => {
        const size = minSize + (count / max) * (maxSize - minSize);
        return `${Math.round(size)}px`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-8">
            <div className="bg-gray-900 rounded-lg w-full h-full max-w-5xl shadow-2xl border border-gray-600 flex flex-col relative overflow-hidden">
                
                {/* Decorative Background */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <svg width="100%" height="100%">
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1" fill="#fff" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/90 backdrop-blur z-10">
                    <div className="flex items-center gap-4">
                        {viewStack.length > 1 && (
                            <button 
                                onClick={handleBack}
                                className="p-2 rounded-full hover:bg-gray-700 text-gray-300 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                        )}
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">
                                {currentView.type === 'all_tags' ? 'Tag Cloud' : `Elements: ${currentView.tag}`}
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                {currentView.type === 'all_tags' ? 'Explore your knowledge graph by concept frequency.' : 'Drill down into specific elements.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow p-8 overflow-y-auto flex flex-wrap content-center justify-center gap-6 z-10">
                    {currentView.type === 'all_tags' && (
                        Array.from(tagStats.counts.entries()).map(([tag, count]) => (
                            <button
                                key={tag}
                                onClick={() => handleTagClick(tag)}
                                className={`hover:scale-110 transition-transform cursor-pointer ${getRandomColor()} font-bold leading-none`}
                                style={{ fontSize: getFontSize(count, tagStats.max) }}
                                title={`${count} elements`}
                            >
                                {tag}
                            </button>
                        ))
                    )}
                    
                    {currentView.type === 'elements_by_tag' && (
                        elements
                            .filter(e => e.tags.includes(currentView.tag))
                            .map(e => {
                                const degree = elementStats.degree.get(e.id) || 0;
                                return (
                                    <button
                                        key={e.id}
                                        onClick={() => handleNodeClick(e.id)}
                                        className="hover:text-white hover:underline transition-all text-gray-300 font-medium leading-tight text-center p-2"
                                        style={{ fontSize: getFontSize(degree, elementStats.max, 14, 40) }}
                                        title={`${degree} connections`}
                                    >
                                        {e.name}
                                    </button>
                                );
                            })
                    )}

                    {currentView.type === 'all_tags' && tagStats.counts.size === 0 && (
                        <div className="text-gray-500 text-xl italic">No tags found in this model.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TagCloudModal;
