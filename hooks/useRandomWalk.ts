
import React, { useState, useEffect } from 'react';
import { Element, Relationship } from '../types';

export const useRandomWalk = (
    elements: Element[],
    relationships: Relationship[],
    graphCanvasRef: React.RefObject<any>,
    setSelectedElementId: (id: string | null) => void,
    setMultiSelection: (ids: Set<string>) => void,
    setPanelStateUI: (state: any) => void,
    setFocusMode: (mode: 'narrow' | 'wide' | 'zoom') => void
) => {
    const [isRandomWalkOpen, setIsRandomWalkOpen] = useState(false);
    const [preWalkFocusMode, setPreWalkFocusMode] = useState<'narrow' | 'wide' | 'zoom'>('narrow');
    
    const [walkState, setWalkState] = useState<{
        currentNodeId: string | null;
        visitedIds: Set<string>;
        pathHistory: string[];
        historyIndex: number;
        waitTime: number;
        isPaused: boolean;
        hideDetails: boolean;
        direction: 'forward' | 'backward';
        speedMultiplier: number;
    }>({
        currentNodeId: null,
        visitedIds: new Set(),
        pathHistory: [],
        historyIndex: -1,
        waitTime: 2,
        isPaused: true,
        hideDetails: false,
        direction: 'forward',
        speedMultiplier: 1
    });

    // Effect: Walk Logic
    useEffect(() => {
        if (!isRandomWalkOpen || walkState.isPaused) return;

        const interval = (walkState.waitTime * 1000) / walkState.speedMultiplier;

        const timer = setTimeout(() => {
            const { historyIndex, pathHistory, visitedIds, direction } = walkState;

            if (direction === 'backward') {
                const prevIndex = historyIndex - 1;
                if (prevIndex >= 0) {
                    const prevNodeId = pathHistory[prevIndex];
                    setWalkState(prev => ({
                        ...prev,
                        currentNodeId: prevNodeId,
                        historyIndex: prevIndex
                    }));
                } else {
                    setWalkState(prev => ({ ...prev, isPaused: true }));
                }
            } else {
                const nextIndex = historyIndex + 1;
                if (nextIndex < pathHistory.length) {
                    const nextNodeId = pathHistory[nextIndex];
                    setWalkState(prev => ({
                        ...prev,
                        currentNodeId: nextNodeId,
                        historyIndex: nextIndex
                    }));
                } else {
                    const currentNodeId = walkState.currentNodeId;
                    if (!currentNodeId) return;

                    const outgoing = relationships.filter(r => r.source === currentNodeId);
                    const candidates = outgoing.map(r => r.target as string);
                    const unvisitedCandidates = candidates.filter(id => !visitedIds.has(id));
                    
                    let nextNodeId;
                    
                    if (unvisitedCandidates.length > 0) {
                        const randomIndex = Math.floor(Math.random() * unvisitedCandidates.length);
                        nextNodeId = unvisitedCandidates[randomIndex];
                    } else {
                        const allUnvisited = elements.filter(e => !visitedIds.has(e.id));
                        if (allUnvisited.length > 0) {
                            const randomIndex = Math.floor(Math.random() * allUnvisited.length);
                            nextNodeId = allUnvisited[randomIndex].id;
                        } else {
                            const randomIndex = Math.floor(Math.random() * elements.length);
                            if (elements[randomIndex]) {
                                nextNodeId = elements[randomIndex].id;
                                setWalkState(prev => ({ ...prev, visitedIds: new Set() }));
                            } else {
                                setWalkState(prev => ({ ...prev, isPaused: true }));
                                return;
                            }
                        }
                    }

                    if (nextNodeId) {
                        setWalkState(prev => ({
                            ...prev,
                            currentNodeId: nextNodeId,
                            visitedIds: new Set([...prev.visitedIds, nextNodeId]),
                            pathHistory: [...prev.pathHistory, nextNodeId],
                            historyIndex: nextIndex
                        }));
                    }
                }
            }
        }, interval);

        return () => clearTimeout(timer);
    }, [walkState, isRandomWalkOpen, elements, relationships]);

    // Effect: Sync Selection & Camera
    useEffect(() => {
        if (isRandomWalkOpen && walkState.currentNodeId) {
             const el = elements.find(e => e.id === walkState.currentNodeId);
             if (el) {
                 setSelectedElementId(walkState.currentNodeId);
                 setMultiSelection(new Set([walkState.currentNodeId]));
                 
                 if (graphCanvasRef.current) {
                     graphCanvasRef.current.setCamera(-(el.x || 0) + window.innerWidth/2, -(el.y || 0) + window.innerHeight/2, 1.5);
                 }
                 
                 if (!walkState.hideDetails) {
                     setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
                 }
             }
        }
    }, [walkState.currentNodeId, isRandomWalkOpen, walkState.hideDetails, elements, graphCanvasRef, setSelectedElementId, setMultiSelection, setPanelStateUI]);

    // Effect: Focus Mode Management
    useEffect(() => {
        if (isRandomWalkOpen) {
            if (!walkState.isPaused) {
                setFocusMode('zoom');
            } else {
                setFocusMode(preWalkFocusMode);
            }
        }
    }, [walkState.isPaused, isRandomWalkOpen, preWalkFocusMode, setFocusMode]);

    return {
        isRandomWalkOpen,
        setIsRandomWalkOpen,
        walkState,
        setWalkState,
        preWalkFocusMode,
        setPreWalkFocusMode
    };
};
