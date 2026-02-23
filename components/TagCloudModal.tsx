
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Element, Relationship } from '../types';
import { AIConfig, callAI, formatTag } from '../utils';
import { Type } from '@google/genai';
import { promptStore } from '../services/PromptStore';

interface TagCloudPanelProps {
  mode: 'tags' | 'nodes' | 'words' | 'full_text';
  elements: Element[];
  relationships: Relationship[];
  onNodeSelect: (elementId: string) => void;
  isDarkMode: boolean;
  aiConfig: AIConfig;
  onOpenGuidance?: () => void;
  onLogHistory?: (tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => void;
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
    originalText?: string;
    value: number;
    color: string;
    rotation: number;
}

const TRANSFORMATION_MODES = [
    { id: 'Original', label: 'Original' },
    { id: 'Antonyms', label: 'Antonyms' },
    { id: 'Synonyms', label: 'Synonyms' },
    { id: 'Exaggerated', label: 'Exaggerated' },
    { id: 'Understated', label: 'Understated' },
    { id: 'Hypernyms', label: 'Hypernyms' },
    { id: 'Hyponyms', label: 'Hyponyms' },
    { id: 'Related', label: 'Related' },
    { id: 'Metaphors', label: 'Metaphors' },
    { id: 'Simplified', label: 'Simplified' },
    { id: 'Formalised', label: 'Formalised' },
];

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

export const TagCloudPanel: React.FC<TagCloudPanelProps> = ({ mode, elements, relationships, onNodeSelect, isDarkMode, aiConfig, onOpenGuidance, onLogHistory }) => {
    const [viewStack, setViewStack] = useState<ViewState[]>([]);
    
    // UI State
    const [zoom, setZoom] = useState(1);
    const [rearrangeTrigger, setRearrangeTrigger] = useState(0);
    
    // AI Transformation State
    const [activeMode, setActiveMode] = useState<string>('Original');
    const cachedTransformations = useRef<Record<string, Record<string, string>>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Reset mode when switching top-level tool mode
        setActiveMode('Original');
        cachedTransformations.current = {};
        
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

    // --- Stats Calculations (Base Data) ---

    const tagStats = useMemo(() => {
        const counts = new Map<string, number>();
        elements.forEach(e => e.tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
        const max = Math.max(...Array.from(counts.values()), 1);
        const rawItems = Array.from(counts.entries()).map(([text, value]) => ({ text: formatTag(text), originalText: text, value }));
        return { items: rawItems, max };
    }, [elements]);

    const wordStats = useMemo(() => {
        const counts = new Map<string, number>();
        elements.forEach(e => {
            const words = e.name.toLowerCase().split(/[\s\-_,.:;()'"\[\]\/]+/);
            words.forEach(w => {
                if (w.length > 2 && !STOP_WORDS.has(w) && isNaN(Number(w))) {
                    counts.set(w, (counts.get(w) || 0) + 1);
                }
            });
        });
        const max = Math.max(...Array.from(counts.values()), 1);
        const rawItems = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 150)
            .map(([text, value]) => ({ text, value }));
        return { items: rawItems, max };
    }, [elements]);

    const fullTextStats = useMemo(() => {
        const counts = new Map<string, number>();
        elements.forEach(e => {
            const fields = [e.name, e.notes];
            fields.forEach(field => {
                if (typeof field === 'string' && isNaN(Number(field))) {
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
        return { items: rawItems, max };
    }, [elements]);

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
        if (rawItems.length > 30) {
            rawItems = rawItems.filter(i => i.value > 0);
        }
        return { items: rawItems, max };
    }, [elements, relationships]);

    // --- Active Data Selection & Transformation ---

    const baseData = useMemo(() => {
        if (currentView.type === 'all_tags') return tagStats;
        if (currentView.type === 'all_nodes') return nodeStats;
        if (currentView.type === 'all_words') return wordStats;
        if (currentView.type === 'all_full_text') return fullTextStats;
        // Drill down views are handled separately as they filter based on clicks
        return { items: [], max: 1 };
    }, [currentView, tagStats, nodeStats, wordStats, fullTextStats]);

    const displayedItems = useMemo(() => {
        // Only apply transformation to "all" views
        if (!['all_tags', 'all_nodes', 'all_words', 'all_full_text'].includes(currentView.type)) {
            // Re-calculate sub-views (drill downs) on the fly as they are specific
            if (currentView.type === 'elements_by_tag') {
                const tag = currentView.tag;
                const filtered = elements.filter(e => e.tags.includes(tag));
                const degreeMap = new Map<string, number>();
                filtered.forEach(e => {
                     const deg = relationships.filter(r => r.source === e.id || r.target === e.id).length;
                     degreeMap.set(e.id, deg);
                });
                const max = Math.max(...Array.from(degreeMap.values()), 1);
                const rawItems = filtered.map(e => ({ id: e.id, text: e.name, value: degreeMap.get(e.id) || 0 }));
                return { items: shuffleAndEnrich(rawItems, isDarkMode), max };
            }
            if (currentView.type === 'elements_by_word') {
                const word = currentView.word;
                const filtered = elements.filter(e => {
                    if (mode === 'full_text') {
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
                const rawItems = filtered.map(e => ({ id: e.id, text: e.name, value: degreeMap.get(e.id) || 0 }));
                return { items: shuffleAndEnrich(rawItems, isDarkMode), max };
            }
            return { items: [], max: 1 };
        }

        // Main views
        let items: any[] = baseData.items;
        
        // Apply Transformation Map if not Original
        if (activeMode !== 'Original') {
            const map = cachedTransformations.current[activeMode];
            if (map) {
                items = items.map(item => ({
                    ...item,
                    originalText: item.text,
                    text: map[item.text] || item.text
                }));
            }
        }

        return {
            items: shuffleAndEnrich(items, isDarkMode),
            max: baseData.max
        };
    }, [baseData, activeMode, isDarkMode, currentView, elements, relationships, mode, rearrangeTrigger]);


    const handleModeSelect = async (newMode: string) => {
        if (newMode === activeMode) return;
        
        // If switching back to original or if we have it cached, just set state
        if (newMode === 'Original' || cachedTransformations.current[newMode]) {
            setActiveMode(newMode);
            return;
        }

        setIsLoading(true);
        try {
            // Prepare list of words to transform (limit to top 100 to save tokens/time)
            const wordsToTransform = baseData.items.slice(0, 100).map(i => i.text);
            
            if (wordsToTransform.length === 0) {
                setActiveMode(newMode);
                return;
            }

            const prompt = promptStore.get('transform:linguistic', {
                mode: newMode,
                words: JSON.stringify(wordsToTransform)
            });

            // Safer schema: Array of objects avoids issues with weird characters in keys
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    mappings: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                original: { type: Type.STRING },
                                transformed: { type: Type.STRING }
                            },
                            required: ["original", "transformed"]
                        }
                    }
                }
            };

            const response = await callAI(
                aiConfig,
                prompt,
                undefined,
                undefined,
                responseSchema
            );

            let text = response.text || "{}";
            // Strip markdown code blocks if present (common cause of JSON parse errors)
            text = text.replace(/```json\n?|```/g, '').trim();

            let result;
            try {
                result = JSON.parse(text);
            } catch (parseError) {
                console.warn("JSON Parse failed, attempting flexible fix", text);
                throw parseError;
            }
            
            const mapping: Record<string, string> = {};
            if (result.mappings && Array.isArray(result.mappings)) {
                result.mappings.forEach((m: any) => {
                    if (m.original && m.transformed) {
                        mapping[m.original] = m.transformed;
                    }
                });
            } else {
                // Fallback: Model might have ignored structure instructions but returned KV pairs
                Object.keys(result).forEach(key => {
                    if (typeof result[key] === 'string') {
                        mapping[key] = result[key];
                    }
                });
            }

            cachedTransformations.current[newMode] = mapping;
            setActiveMode(newMode);

            // Log to AI History
            if (onLogHistory) {
                const sample = Object.entries(mapping).slice(0, 5).map(([orig, trans]) => `${orig} -> ${trans}`).join(', ');
                onLogHistory(
                    'Word Cloud',
                    `Transformed ${wordsToTransform.length} words to **${newMode}** mode.\n\nSample: ${sample}...`,
                    `Transformed View: ${newMode}`,
                    'tagcloud'
                );
            }

        } catch (e) {
            console.error("Transformation failed", e);
            alert("Failed to transform words. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTagClick = (tag: string) => {
        // Use original tag if available to ensure lookup works
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
        const scale = Math.log(count + 1) / Math.log(max + 1); 
        const size = minSize + scale * (maxSize - minSize);
        return `${Math.round(size * zoom)}px`;
    };

    const getHeaderTitle = () => {
        if (currentView.type === 'all_tags') return 'Tag Cloud';
        if (currentView.type === 'all_nodes') return 'Relationship Cloud';
        if (currentView.type === 'all_words') return 'Node Name Analysis';
        if (currentView.type === 'all_full_text') return 'Full Text Analysis';
        if (currentView.type === 'elements_by_tag') return `Elements: ${formatTag(currentView.tag)}`;
        if (currentView.type === 'elements_by_word') return `Elements with "${currentView.word}"`;
        return 'Word Cloud';
    };

    // Theme Classes
    const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-white';
    const headerBgClass = isDarkMode ? 'bg-gray-900/90' : 'bg-white/90';
    const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
    const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
    const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
    const iconHoverClass = isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600';
    const sidebarBg = isDarkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-gray-50 border-r border-gray-200';
    const menuActiveText = isDarkMode ? 'text-gray-500 cursor-default' : 'text-gray-400 cursor-default';
    const menuInactiveText = isDarkMode ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-200';
    const patternFill = isDarkMode ? "#fff" : "#000";

    return (
        <div className={`w-full h-full flex flex-col relative overflow-hidden ${bgClass}`}>
            
            {/* Header */}
            <div className={`p-4 border-b ${borderClass} flex justify-between items-center ${headerBgClass} backdrop-blur z-20 flex-shrink-0`}>
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
                        {activeMode !== 'Original' && (
                            <span className="text-xs text-blue-500 font-bold uppercase tracking-wider">{activeMode} Mode</span>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Zoom & Rearrange Controls */}
                    <div className={`flex items-center gap-1 border ${borderClass} rounded-lg p-1`}>
                        <button 
                            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} 
                            className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${textClass}`}
                            title="Zoom Out"
                        >
                            -
                        </button>
                        <span className={`text-xs font-mono w-10 text-center ${subTextClass}`}>{Math.round(zoom * 100)}%</span>
                        <button 
                            onClick={() => setZoom(z => Math.min(3.0, z + 0.1))} 
                            className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${textClass}`}
                            title="Zoom In"
                        >
                            +
                        </button>
                        <div className={`w-px h-4 mx-1 ${borderClass}`}></div>
                        <button 
                            onClick={() => setRearrangeTrigger(p => p + 1)}
                            className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${textClass}`}
                            title="Rearrange / Shuffle"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>

                    {onOpenGuidance && (
                        <button
                            onClick={onOpenGuidance}
                            className={`p-1.5 rounded-full ${iconHoverClass} transition`}
                            title="Guidance & Tips"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-grow overflow-hidden">
                {/* Sidebar Menu - Only show for top-level views */}
                {['all_tags', 'all_nodes', 'all_words', 'all_full_text'].includes(currentView.type) && (
                    <div className={`w-32 flex-shrink-0 flex flex-col p-2 overflow-y-auto ${sidebarBg} z-20`}>
                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 px-2 ${subTextClass}`}>View Mode</div>
                        {TRANSFORMATION_MODES.map(m => (
                            <button
                                key={m.id}
                                onClick={() => handleModeSelect(m.id)}
                                disabled={isLoading}
                                className={`text-xs text-left px-2 py-1.5 rounded transition-colors ${activeMode === m.id ? menuActiveText : menuInactiveText} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Cloud Content */}
                <div className="flex-grow p-6 overflow-y-auto flex flex-wrap content-center justify-center items-center gap-x-6 gap-y-2 z-10 relative">
                    {/* Decorative Background */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <svg width="100%" height="100%">
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1" fill={patternFill} />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>

                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-30">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                <span className="text-blue-400 font-bold text-sm">Transforming...</span>
                            </div>
                        </div>
                    )}
                    
                    {currentView.type === 'all_tags' && (
                        displayedItems.items.map((item, idx) => (
                            <button
                                key={`${item.text}-${idx}`}
                                onClick={() => handleTagClick(item.originalText || item.text)}
                                className={`hover:scale-110 transition-transform cursor-pointer ${item.color} font-bold leading-none opacity-90 hover:opacity-100`}
                                style={{ 
                                    fontSize: getFontSize(item.value, displayedItems.max),
                                    transform: `rotate(${item.rotation}deg)` 
                                }}
                                title={`${item.value} elements${item.originalText ? ` (Original: ${item.originalText})` : ''}`}
                            >
                                {item.text}
                            </button>
                        ))
                    )}

                    {(currentView.type === 'all_words' || currentView.type === 'all_full_text') && (
                        displayedItems.items.map((item, idx) => (
                            <button
                                key={`${item.text}-${idx}`}
                                onClick={() => handleWordClick(item.originalText || item.text)}
                                className={`hover:scale-110 transition-transform cursor-pointer ${item.color} font-bold leading-none capitalize opacity-90 hover:opacity-100`}
                                style={{ 
                                    fontSize: getFontSize(item.value, displayedItems.max, 14, 72),
                                    transform: `rotate(${item.rotation}deg)`
                                }}
                                title={`${item.value} occurrences${item.originalText ? ` (Original: ${item.originalText})` : ''}`}
                            >
                                {item.text}
                            </button>
                        ))
                    )}
                    
                    {currentView.type === 'all_nodes' && (
                        displayedItems.items.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => handleNodeClick(item.id!)}
                                className={`hover:underline transition-all ${item.color} ${isDarkMode ? 'hover:text-white' : 'hover:text-black'} font-medium leading-tight text-center p-1 opacity-90 hover:opacity-100`}
                                style={{ 
                                    fontSize: getFontSize(item.value, displayedItems.max, 12, 56),
                                    transform: `rotate(${item.rotation}deg)`
                                }}
                                title={`${item.value} connections${item.originalText ? ` (Original: ${item.originalText})` : ''}`}
                            >
                                {item.text}
                            </button>
                        ))
                    )}
                    
                    {(currentView.type === 'elements_by_tag' || currentView.type === 'elements_by_word') && (
                        displayedItems.items.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => handleNodeClick(item.id!)}
                                className={`${isDarkMode ? 'hover:text-white text-gray-300' : 'hover:text-black text-gray-600'} hover:underline transition-all font-medium leading-tight text-center p-1`}
                                style={{ 
                                    fontSize: getFontSize(item.value, displayedItems.max, 14, 40),
                                    transform: `rotate(${item.rotation}deg)`
                                }}
                                title={`${item.value} connections`}
                            >
                                {item.text}
                            </button>
                        ))
                    )}

                    {/* Empty States */}
                    {displayedItems.items.length === 0 && !isLoading && (
                        <div className={`${subTextClass} text-sm italic`}>No items found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
