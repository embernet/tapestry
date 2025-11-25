
import React, { useState, useMemo, useEffect } from 'react';
import { Element, Relationship } from '../types';

interface TagCloudModalProps {
  isOpen: boolean;
  initialMode?: 'tags' | 'nodes' | 'words';
  elements: Element[];
  relationships: Relationship[];
  onClose: () => void;
  onNodeSelect: (elementId: string) => void;
}

type ViewState = 
    | { type: 'all_tags' } 
    | { type: 'all_nodes' }
    | { type: 'all_words' }
    | { type: 'elements_by_tag', tag: string }
    | { type: 'elements_by_word', word: string };

interface CloudItem {
    id?: string;
    text: string;
    value: number;
    color: string;
    rotation: number;
}

const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 
    'down', 'it', 'that', 'this', 'my', 'your', 'his', 'her', 'its', 
    'our', 'their', 'be', 'as', 'not', 'if', 'when', 'than', 'can',
    'will', 'just', 'don', 'should', 'now'
]);

const COLORS = ['text-blue-400', 'text-green-400', 'text-yellow-400', 'text-pink-400', 'text-purple-400', 'text-cyan-400', 'text-orange-400', 'text-red-400', 'text-teal-400'];

const shuffleAndEnrich = (items: Omit<CloudItem, 'color' | 'rotation'>[]): CloudItem[] => {
    const newArr = [...items];
    // Fisher-Yates Shuffle
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    // Add display properties
    return newArr.map(item => ({
        ...item,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.floor(Math.random() * 16) - 8 // -8 to +8 degrees
    }));
};

const TagCloudModal: React.FC<TagCloudModalProps> = ({ isOpen, initialMode = 'tags', elements, relationships, onClose, onNodeSelect }) => {
    const [viewStack, setViewStack] = useState<ViewState[]>([]);
    
    useEffect(() => {
        if (isOpen) {
            if (initialMode === 'nodes') {
                setViewStack([{ type: 'all_nodes' }]);
            } else if (initialMode === 'words') {
                setViewStack([{ type: 'all_words' }]);
            } else {
                setViewStack([{ type: 'all_tags' }]);
            }
        }
    }, [isOpen, initialMode]);

    const currentView = viewStack[viewStack.length - 1] || { type: 'all_tags' };

    // Stats for Tags
    const tagStats = useMemo(() => {
        const counts = new Map<string, number>();
        elements.forEach(e => e.tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
        const max = Math.max(...Array.from(counts.values()), 1);
        
        const rawItems = Array.from(counts.entries()).map(([text, value]) => ({ text, value }));
        const items = shuffleAndEnrich(rawItems);
        
        return { items, max };
    }, [elements]);

    // Stats for Words in Node Names
    const wordStats = useMemo(() => {
        const counts = new Map<string, number>();
        elements.forEach(e => {
            // Split by non-alphanumeric chars
            const words = e.name.toLowerCase().split(/[\s\-_,.:;()'"\[\]]+/);
            words.forEach(w => {
                if (w.length > 2 && !STOP_WORDS.has(w) && isNaN(Number(w))) {
                    counts.set(w, (counts.get(w) || 0) + 1);
                }
            });
        });
        const max = Math.max(...Array.from(counts.values()), 1);
        
        // Filter top 150 to avoid clutter, then shuffle
        const rawItems = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 150)
            .map(([text, value]) => ({ text, value }));

        const items = shuffleAndEnrich(rawItems);

        return { items, max };
    }, [elements]);

    // Stats for Elements (Nodes by Degree)
    const nodeStats = useMemo(() => {
        const degree = new Map<string, number>();
        elements.forEach(e => degree.set(e.id, 0));
        relationships.forEach(r => {
            degree.set(r.source as string, (degree.get(r.source as string) || 0) + 1);
            degree.set(r.target as string, (degree.get(r.target as string) || 0) + 1);
        });
        const max = Math.max(...Array.from(degree.values()), 1);
        
        let rawItems = elements.map(e => ({
            id: e.id,
            text: e.name,
            value: degree.get(e.id) || 0
        }));

        // Filter isolated if too many nodes
        if (rawItems.length > 30) {
            rawItems = rawItems.filter(i => i.value > 0);
        }

        const items = shuffleAndEnrich(rawItems);

        return { items, max };
    }, [elements, relationships]);

    // Sub-view: Elements by Tag
    const elementsByTag = useMemo(() => {
        if (currentView.type !== 'elements_by_tag') return { items: [], max: 1 };
        
        const filtered = elements.filter(e => e.tags.includes(currentView.tag));
        // Calculate degree for sizing in this view too
        const degreeMap = new Map<string, number>();
        filtered.forEach(e => {
             const deg = relationships.filter(r => r.source === e.id || r.target === e.id).length;
             degreeMap.set(e.id, deg);
        });
        const max = Math.max(...Array.from(degreeMap.values()), 1);

        const rawItems = filtered.map(e => ({
            id: e.id,
            text: e.name,
            value: degreeMap.get(e.id) || 0
        }));

        return { items: shuffleAndEnrich(rawItems), max };
    }, [elements, relationships, currentView]);

    // Sub-view: Elements by Word
    const elementsByWord = useMemo(() => {
        if (currentView.type !== 'elements_by_word') return { items: [], max: 1 };
        
        const filtered = elements.filter(e => e.name.toLowerCase().includes(currentView.word));
        const degreeMap = new Map<string, number>();
        filtered.forEach(e => {
             const deg = relationships.filter(r => r.source === e.id || r.target === e.id).length;
             degreeMap.set(e.id, deg);
        });
        const max = Math.max(...Array.from(degreeMap.values()), 1);

        const rawItems = filtered.map(e => ({
            id: e.id,
            text: e.name,
            value: degreeMap.get(e.id) || 0
        }));

        return { items: shuffleAndEnrich(rawItems), max };
    }, [elements, relationships, currentView]);


    const handleTagClick = (tag: string) => {
        setViewStack([...viewStack, { type: 'elements_by_tag', tag }]);
    };

    const handleWordClick = (word: string) => {
        setViewStack([...viewStack, { type: 'elements_by_word', word }]);
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

    const getFontSize = (count: number, max: number, minSize: number = 16, maxSize: number = 64) => {
        // Logarithmic scale usually looks better for word clouds to prevent huge outliers dominance
        const scale = Math.log(count + 1) / Math.log(max + 1); 
        const size = minSize + scale * (maxSize - minSize);
        return `${Math.round(size)}px`;
    };

    if (!isOpen) return null;

    const getHeaderTitle = () => {
        if (currentView.type === 'all_tags') return 'Concept Cloud';
        if (currentView.type === 'all_nodes') return 'Influence Cloud';
        if (currentView.type === 'all_words') return 'Text Analysis';
        if (currentView.type === 'elements_by_tag') return `Elements: ${currentView.tag}`;
        if (currentView.type === 'elements_by_word') return `Elements with "${currentView.word}"`;
        return 'Word Cloud';
    };

    const getHeaderDesc = () => {
        if (currentView.type === 'all_tags') return 'Explore your knowledge graph by concept frequency.';
        if (currentView.type === 'all_nodes') return 'Nodes sized by their connectivity (degree).';
        if (currentView.type === 'all_words') return 'Frequent words appearing in element names.';
        if (currentView.type === 'elements_by_tag') return 'Drill down into specific elements.';
        if (currentView.type === 'elements_by_word') return 'Elements containing this word.';
        return '';
    };

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
                                {getHeaderTitle()}
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                {getHeaderDesc()}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow p-8 overflow-y-auto flex flex-wrap content-center justify-center items-center gap-x-6 gap-y-2 z-10">
                    
                    {currentView.type === 'all_tags' && (
                        tagStats.items.map((item, idx) => (
                            <button
                                key={`${item.text}-${idx}`}
                                onClick={() => handleTagClick(item.text)}
                                className={`hover:scale-110 transition-transform cursor-pointer ${item.color} font-bold leading-none opacity-90 hover:opacity-100`}
                                style={{ 
                                    fontSize: getFontSize(item.value, tagStats.max),
                                    transform: `rotate(${item.rotation}deg)` 
                                }}
                                title={`${item.value} elements`}
                            >
                                {item.text}
                            </button>
                        ))
                    )}

                    {currentView.type === 'all_words' && (
                        wordStats.items.map((item, idx) => (
                            <button
                                key={`${item.text}-${idx}`}
                                onClick={() => handleWordClick(item.text)}
                                className={`hover:scale-110 transition-transform cursor-pointer ${item.color} font-bold leading-none capitalize opacity-90 hover:opacity-100`}
                                style={{ 
                                    fontSize: getFontSize(item.value, wordStats.max, 14, 72),
                                    transform: `rotate(${item.rotation}deg)`
                                }}
                                title={`${item.value} occurrences`}
                            >
                                {item.text}
                            </button>
                        ))
                    )}
                    
                    {currentView.type === 'all_nodes' && (
                        nodeStats.items.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => handleNodeClick(item.id!)}
                                className={`hover:text-white hover:underline transition-all ${item.color} font-medium leading-tight text-center p-1 opacity-90 hover:opacity-100`}
                                style={{ 
                                    fontSize: getFontSize(item.value, nodeStats.max, 12, 56),
                                    transform: `rotate(${item.rotation}deg)`
                                }}
                                title={`${item.value} connections`}
                            >
                                {item.text}
                            </button>
                        ))
                    )}
                    
                    {(currentView.type === 'elements_by_tag' || currentView.type === 'elements_by_word') && (
                        (currentView.type === 'elements_by_tag' ? elementsByTag : elementsByWord).items.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => handleNodeClick(item.id!)}
                                className={`hover:text-white hover:underline transition-all text-gray-300 font-medium leading-tight text-center p-1`}
                                style={{ 
                                    fontSize: getFontSize(item.value, (currentView.type === 'elements_by_tag' ? elementsByTag : elementsByWord).max, 14, 40),
                                    transform: `rotate(${item.rotation}deg)`
                                }}
                                title={`${item.value} connections`}
                            >
                                {item.text}
                            </button>
                        ))
                    )}

                    {/* Empty States */}
                    {currentView.type === 'all_tags' && tagStats.items.length === 0 && (
                        <div className="text-gray-500 text-xl italic">No tags found in this model.</div>
                    )}
                    
                    {currentView.type === 'all_nodes' && nodeStats.items.length === 0 && (
                        <div className="text-gray-500 text-xl italic">No elements found in this model.</div>
                    )}

                    {currentView.type === 'all_words' && wordStats.items.length === 0 && (
                        <div className="text-gray-500 text-xl italic">No significant text found in node names.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TagCloudModal;
