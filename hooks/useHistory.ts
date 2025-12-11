import React, { useState, useCallback } from 'react';
import { HistoryEntry, PanelLayout } from '../types';
import { generateUUID } from '../utils';

interface UseHistoryProps {
    panelZIndex: number;
    setPanelZIndex: React.Dispatch<React.SetStateAction<number>>;
    setPanelLayouts: React.Dispatch<React.SetStateAction<Record<string, PanelLayout>>>;
}

export const useHistory = ({ panelZIndex, setPanelZIndex, setPanelLayouts }: UseHistoryProps) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [detachedHistoryIds, setDetachedHistoryIds] = useState<string[]>([]);

    const handleLogHistory = useCallback((tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => {
        const now = new Date().toISOString();
        const newEntry: HistoryEntry = {
            id: generateUUID(),
            tool,
            subTool,
            toolParams,
            timestamp: now,
            content,
            summary
        };
        setHistory(prev => [newEntry, ...prev]);
    }, []);

    const handleDeleteHistory = useCallback((id: string) => {
        setHistory(prev => prev.filter(h => h.id !== id));
        setDetachedHistoryIds(prev => prev.filter(did => did !== id));
    }, []);

    const handleDetachHistory = useCallback((id: string) => {
        if (!detachedHistoryIds.includes(id)) {
            setDetachedHistoryIds(prev => [...prev, id]);
            
            const nextZ = panelZIndex + 1;
            setPanelZIndex(nextZ);
            
            setPanelLayouts(prev => ({
                ...prev,
                [`history-${id}`]: {
                    x: window.innerWidth / 2 - 250,
                    y: window.innerHeight / 2 - 200,
                    w: 500,
                    h: 400,
                    zIndex: nextZ,
                    isFloating: true
                }
            }));
        }
    }, [detachedHistoryIds, panelZIndex, setPanelZIndex, setPanelLayouts]);

    return {
        history,
        setHistory,
        detachedHistoryIds,
        setDetachedHistoryIds,
        handleLogHistory,
        handleDeleteHistory,
        handleDetachHistory
    };
};