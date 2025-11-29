
import React, { useState, useMemo, useEffect } from 'react';
import { Element, Relationship } from '../types';

interface TagCloudPanelProps {
  mode: 'tags' | 'nodes' | 'words' | 'full_text';
  elements: Element[];
  relationships: Relationship[];
  onNodeSelect: (elementId: string) => void;
  isDarkMode: boolean;
}

type ViewState = 
    | { type: 'all_tags' } 
    | { type: 'all_nodes' }
    | { type: 'all_words' }
    | { type: 'all_full_text' }
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
    'will', 'just', 'don', 'should', 'now', 'have', 'has', 'had', 'do',
    'does', 'did', 'how', 'why', 'what', 'where', 'who', 'which', 'so',
    'some', 'any', 'no', 'yes'
]);

const COLORS = ['text-blue-400', 'text-green-400', 'text-yellow-400', 'text-pink-400', 'text-purple-400', 'text-cyan-400', 'text-orange-400', 'text-red-400', 'text-teal-400'];
const DARK_COLORS = ['text-blue-600', 'text-green-600', 'text-yellow-600', 'text-pink-600', 'text-purple-600', 'text-cyan-600', 'text-orange-600', 'text-red-600', 'text-teal-600'];

const shuffleAndEnrich = (items: Omit<CloudItem, 'color' | 'rotation'>[], isDarkMode: boolean): CloudItem[] => {
    const newArr = [...items];
    const palette = isDarkMode ? COLORS : DARK_COLORS;
    
    // Fisher-Yates Shuffle
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    // Add display properties
    return newArr.map(item => ({
        ...item,
        color: palette[Math.floor(Math.random() * palette.length)],
        rotation: Math.floor(Math.random() * 16) - 8 // -8 to +8 degrees
    }));
};

export const TagCloudPanel: React.FC<TagCloudPanelProps> = ({ mode, elements, relationships, onNodeSelect, isDarkMode }) => {
    const [viewStack, setViewStack] = useState<ViewState[]>([]);
    
    useEffect(() => {
        if (mode === 'nodes') {
            setViewStack([{ type: 'all_nodes' }]);
        } else if (mode === 'words') {
            setViewStack([{ type: 'all_words' }]);
        } else if (mode === 'full_text') {
            setViewStack([{ type: 'all_full_text' }]);
        } else {
            setViewStack([{ type: 'all_tags' }]);
        }
    }, [mode]);

    const currentView = viewStack[viewStack.length - 1] || { type: 'all_tags' };

    // Stats for Tags
    const tagStats = useMemo(() => {
        const counts = new Map<string, number>();
        elements.forEach(e => e.tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
        const max = Math.max(...Array.from(counts.values()), 1);
        
        const rawItems = Array.from(counts.entries()).map(([text, value]) => ({ text, value }));
        const items = shuffleAndEnrich(rawItems, isDarkMode);
        
        return { items, max };
    }, [elements, isDarkMode]);

    // Stats for Words in Node Names
    const wordStats = useMemo(() => {
        const counts = new Map<string, number>();
        elements.forEach(e => {
            // Split by non-alphanumeric chars
            const words = e.name.toLowerCase().split(/[\s\-_,.:;()'"\[\]\/]+/);
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

        const items = shuffleAndEnrich(rawItems, isDarkMode);

        return { items, max };
    }, [elements, isDarkMode]);

    // Stats for Full Text
    const fullTextStats = useMemo(() => {
        const counts = new Map<string, number>();
        elements.forEach(e => {
            // Only include name and notes, explicitly excluding tags and attributes
            const fields = [e.name, e.notes];
            
            fields.forEach(field => {
                if (typeof field === 'string' && isNaN(Number(field))) {
                    // Split by non-alphanumeric
                    const words = field.toLowerCase().split(/[\s\-_,.:;()'"\[\]\/]+/);
                    words.forEach(w => {
                        if (w.length > 2 && !STOP_WORDS.has(w) && isNaN(Number(w))) {
                            counts.set(w, (counts.get(w) || 0) + 1);
                        }
                    });
                }
            });
        });
        const max = Math.max(...Array.from(counts.values()), 1);
        
        const rawItems = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 150)
            .map(([text, value]) => ({ text, value }));

        const items = shuffleAndEnrich(rawItems, isDarkMode);

        return { items, max };
    }, [elements, isDarkMode]);

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

        const items = shuffleAndEnrich(rawItems, isDarkMode);

        return { items, max };
    }, [elements, relationships, isDarkMode]);

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

        return { items: shuffleAndEnrich(rawItems, isDarkMode), max };
    }, [elements, relationships, currentView, isDarkMode]);

    // Sub-view: Elements by Word
    const elementsByWord = useMemo(() => {
        if (currentView.type !== 'elements_by_word') return { items: [], max: 1 };
        
        const word = currentView.word;
        const filtered = elements.filter(e => {
            if (mode === 'full_text') {
                 // Keep search inclusive for full text mode even if we generated stats from name/notes only
                 const fields = [e.name, e.notes]; 
                 return fields.some(f => typeof f === 'string' && f.toLowerCase().includes(word));
            } else {
                 return e.name.toLowerCase().includes(word);
            }
        });

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

        return { items: shuffleAndEnrich(rawItems, isDarkMode), max };
    }, [elements, relationships, currentView, mode, isDarkMode]);


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
    };

    const getFontSize = (count: number, max: number, minSize: number = 16, maxSize: number = 64) => {
        // Logarithmic scale usually looks better for word clouds to prevent huge outliers dominance
        const scale = Math.log(count + 1) / Math.log(max + 1); 
        const size = minSize + scale * (maxSize - minSize);
        return `${Math.round(size)}px`;
    };

    const getHeaderTitle = () => {
        if (currentView.type === 'all_tags') return 'Tag Cloud';
        if (currentView.type === 'all_nodes') return 'Relationship Cloud';
        if (currentView.type === 'all_words') return 'Node Name Analysis';
        if (currentView.type === 'all_full_text') return 'Full Text Analysis';
        if (currentView.type === 'elements_by_tag') return `Elements: ${currentView.tag}`;
        if (currentView.type === 'elements_by_word') return `Elements with "${currentView.word}"`;
        return 'Word Cloud';
    };

    const getHeaderDesc = () => {
        if (currentView.type === 'all_tags') return 'Explore by concept frequency';
        if (currentView.type === 'all_nodes') return 'Sized by connectivity';
        if (currentView.type === 'all_words') return 'Frequent words in names';
        if (currentView.type === 'all_full_text') return 'Frequent words in name & notes';
        if (currentView.type === 'elements_by_tag') return 'Drill down';
        if (currentView.type === 'elements_by_word') return 'Elements containing word';
        return '';
    };

    // Theme Classes
    const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-white';
    const headerBgClass = isDarkMode ? 'bg-gray-900/90' : 'bg-white/90';
    const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
    const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
    const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
    const iconHoverClass = isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600';
    const patternFill = isDarkMode ? "#fff" : "#000";

    return (
        <div className={`w-full h-full flex flex-col relative overflow-hidden ${bgClass}`}>
            
            {/* Decorative Background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <svg width="100%" height="100%">
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill={patternFill} />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Header */}
            <div className={`p-4 border-b ${borderClass} flex justify-between items-center ${headerBgClass} backdrop-blur z-10`}>
                <div className="flex items-center gap-3">
                    {viewStack.length > 1 && (
                        <button 
                            onClick={handleBack}
                            className={`p-1.5 rounded-full ${iconHoverClass} transition`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                    )}
                    <div>
                        <h2 className={`text-xl font-bold ${textClass} tracking-tight`}>
                            {getHeaderTitle()}
                        </h2>
                        <p className={`${subTextClass} text-xs`}>
                            {getHeaderDesc()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow p-6 overflow-y-auto flex flex-wrap content-center justify-center items-center gap-x-6 gap-y-2 z-10">
                
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

                {(currentView.type === 'all_words' || currentView.type === 'all_full_text') && (
                    (currentView.type === 'all_words' ? wordStats : fullTextStats).items.map((item, idx) => (
                        <button
                            key={`${item.text}-${idx}`}
                            onClick={() => handleWordClick(item.text)}
                            className={`hover:scale-110 transition-transform cursor-pointer ${item.color} font-bold leading-none capitalize opacity-90 hover:opacity-100`}
                            style={{ 
                                fontSize: getFontSize(item.value, (currentView.type === 'all_words' ? wordStats : fullTextStats).max, 14, 72),
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
                            className={`hover:underline transition-all ${item.color} ${isDarkMode ? 'hover:text-white' : 'hover:text-black'} font-medium leading-tight text-center p-1 opacity-90 hover:opacity-100`}
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
                            className={`${isDarkMode ? 'hover:text-white text-gray-300' : 'hover:text-black text-gray-600'} hover:underline transition-all font-medium leading-tight text-center p-1`}
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
                    <div className={`${subTextClass} text-sm italic`}>No tags found in this model.</div>
                )}
                
                {currentView.type === 'all_nodes' && nodeStats.items.length === 0 && (
                    <div className={`${subTextClass} text-sm italic`}>No elements found in this model.</div>
                )}

                {(currentView.type === 'all_words' && wordStats.items.length === 0) && (
                    <div className={`${subTextClass} text-sm italic`}>No significant text found in node names.</div>
                )}

                {(currentView.type === 'all_full_text' && fullTextStats.items.length === 0) && (
                    <div className={`${subTextClass} text-sm italic`}>No significant text found in fields.</div>
                )}
            </div>
        </div>
    );
};
