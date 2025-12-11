
import { useState, useMemo, useCallback, useEffect } from 'react';
import { GraphView, DateFilterState, NodeFilterState, AIConfig } from '../types';
import { generateUUID, createDefaultView, callAI } from '../utils';

interface UseViewManagementProps {
    aiConfig: AIConfig;
    isDarkMode: boolean;
}

export const useViewManagement = ({ aiConfig, isDarkMode }: UseViewManagementProps) => {
    const [views, setViews] = useState<GraphView[]>([]);
    const [activeViewId, setActiveViewId] = useState<string>('');
    const [isGeneratingTapestry, setIsGeneratingTapestry] = useState(false);
  
    // Initialize Default View if needed
    useEffect(() => {
        if (views.length === 0) {
            const defaultView = createDefaultView();
            setViews([defaultView]);
            setActiveViewId(defaultView.id);
        }
    }, [views.length]);

    const activeView = useMemo<GraphView | undefined>(() => 
        views.find(v => v.id === activeViewId) || views[0], 
    [views, activeViewId]);

    // --- Derived Filter States (Read-Only helpers) ---
    const tagFilter = useMemo<{ included: Set<string>, excluded: Set<string> }>(() => {
        if (!activeView) return { included: new Set<string>(), excluded: new Set<string>() };
        return {
            included: new Set<string>(activeView.filters.tags.included as string[]),
            excluded: new Set<string>(activeView.filters.tags.excluded as string[])
        };
    }, [activeView]);

    const dateFilter = useMemo<DateFilterState>(() => {
        return activeView?.filters.date || { createdAfter: '', createdBefore: '', updatedAfter: '', updatedBefore: '' };
    }, [activeView]);

    const nodeFilter = useMemo<NodeFilterState>(() => {
        return activeView?.filters.nodeFilter || { centerId: null, hops: 1, active: false };
    }, [activeView]);

    // --- Actions ---

    const handleCreateView = useCallback(() => {
        const defaultView = createDefaultView();
        const newView: GraphView = {
            ...defaultView,
            id: generateUUID(),
            name: "New View",
            description: "A fresh view configuration."
        };
        setViews(prev => [...prev, newView]);
        setActiveViewId(newView.id);
        return newView.id;
    }, []);

    const handleDuplicateView = useCallback(() => {
        if (!activeView) return null;
        const newView: GraphView = {
            ...activeView,
            id: generateUUID(),
            name: `${activeView.name} (Copy)`,
            // Deep clone filters to ensure independence
            filters: JSON.parse(JSON.stringify(activeView.filters)),
            explicitInclusions: [...activeView.explicitInclusions],
            explicitExclusions: [...activeView.explicitExclusions],
        };
        setViews(prev => [...prev, newView]);
        setActiveViewId(newView.id);
        return newView.id;
    }, [activeView]);

    const handleDeleteView = useCallback((id: string) => {
        if (views.length <= 1) {
            alert("Cannot delete the last view.");
            return;
        }
        
        // Calculate new views list
        const newViews = views.filter(v => v.id !== id);
        
        // Determine new active ID if we deleted the current one
        let nextActiveId = activeViewId;
        if (activeViewId === id) {
            nextActiveId = newViews[0].id;
        }
        
        setViews(newViews);
        setActiveViewId(nextActiveId);
    }, [views, activeViewId]);

    const handleRenameView = useCallback((id: string, name: string) => {
        setViews(prev => prev.map(v => v.id === id ? { ...v, name } : v));
    }, []);

    const handleUpdateActiveView = useCallback((updates: Partial<GraphView>) => {
        setViews(prev => prev.map(v => v.id === activeViewId ? { ...v, ...updates } : v));
    }, [activeViewId]);

    const handleHideFromView = useCallback((elementId: string) => {
        setViews(prev => prev.map(v => {
            if (v.id === activeViewId) {
                const currentExclusions = new Set(v.explicitExclusions);
                currentExclusions.add(elementId);
                return {
                    ...v,
                    explicitExclusions: Array.from(currentExclusions)
                };
            }
            return v;
        }));
    }, [activeViewId]);

    const handleGenerateTapestry = useCallback(async (prompt: string) => {
        if (!prompt.trim()) return;
        setIsGeneratingTapestry(true);
        try {
            const promptText = `Generate a decorative abstract SVG pattern representing the concept: "${prompt}".
            The SVG should be seamless if possible, use simple geometric shapes or lines, and be visually pleasing.
            Do NOT include any text or explanations. Just return the raw SVG code.
            Make it responsive (width="100%" height="100%").
            Use colors that would fit a ${isDarkMode ? 'dark' : 'light'} theme.`;
  
            const result = await callAI(aiConfig, promptText);
            let svg = result.text.trim();
            
            // Cleanup markdown
            svg = svg.replace(/```xml\n?|```svg\n?|```/g, '').trim();
            
            handleUpdateActiveView({ 
                tapestryPrompt: prompt, 
                tapestrySvg: svg, 
                tapestryVisible: true 
            });
        } catch (e) {
            console.error("Tapestry Generation Error", e);
            alert("Failed to generate tapestry.");
        } finally {
            setIsGeneratingTapestry(false);
        }
    }, [aiConfig, isDarkMode, handleUpdateActiveView]);

    // --- Filter Setters ---

    const setTagFilter = useCallback((newFilter: { included: Set<string>, excluded: Set<string> } | ((prev: { included: Set<string>, excluded: Set<string> }) => { included: Set<string>, excluded: Set<string> })) => {
        setViews(prev => {
            const currentView = prev.find(v => v.id === activeViewId);
            if (!currentView) return prev;

            // Resolve new filter if functional update
            let resolvedFilter: { included: Set<string>, excluded: Set<string> };
            if (typeof newFilter === 'function') {
                const currentSetFilter = {
                    included: new Set<string>(currentView.filters.tags.included),
                    excluded: new Set<string>(currentView.filters.tags.excluded)
                };
                resolvedFilter = newFilter(currentSetFilter);
            } else {
                resolvedFilter = newFilter;
            }
            
            const updatedView = {
                ...currentView,
                filters: {
                    ...currentView.filters,
                    tags: {
                        included: Array.from(resolvedFilter.included),
                        excluded: Array.from(resolvedFilter.excluded)
                    }
                }
            };
            return prev.map(v => v.id === activeViewId ? updatedView : v);
        });
    }, [activeViewId]);

    const setDateFilter = useCallback((newFilter: DateFilterState | ((prev: DateFilterState) => DateFilterState)) => {
        setViews(prev => {
            const currentView = prev.find(v => v.id === activeViewId);
            if (!currentView) return prev;
            
            let resolvedFilter: DateFilterState;
            if (typeof newFilter === 'function') {
                resolvedFilter = newFilter(currentView.filters.date);
            } else {
                resolvedFilter = newFilter;
            }

            const updatedView = {
                ...currentView,
                filters: {
                    ...currentView.filters,
                    date: resolvedFilter
                }
            };
            return prev.map(v => v.id === activeViewId ? updatedView : v);
        });
    }, [activeViewId]);

    const setNodeFilter = useCallback((newFilter: NodeFilterState | ((prev: NodeFilterState) => NodeFilterState)) => {
        setViews(prev => {
            const currentView = prev.find(v => v.id === activeViewId);
            if (!currentView) return prev;

            let resolvedFilter: NodeFilterState;
            if (typeof newFilter === 'function') {
                resolvedFilter = newFilter(currentView.filters.nodeFilter);
            } else {
                resolvedFilter = newFilter;
            }

            const updatedView = {
                ...currentView,
                filters: {
                    ...currentView.filters,
                    nodeFilter: resolvedFilter
                }
            };
            return prev.map(v => v.id === activeViewId ? updatedView : v);
        });
    }, [activeViewId]);

    return {
        views,
        setViews,
        activeViewId,
        setActiveViewId,
        activeView,
        
        tagFilter,
        dateFilter,
        nodeFilter,
        
        handleCreateView,
        handleDuplicateView,
        handleDeleteView,
        handleRenameView,
        handleUpdateActiveView,
        handleHideFromView,
        handleGenerateTapestry,
        isGeneratingTapestry,
        
        setTagFilter,
        setDateFilter,
        setNodeFilter
    };
};
