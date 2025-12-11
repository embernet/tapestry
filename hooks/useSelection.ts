import React, { useState, useCallback, useMemo } from 'react';
import { Element, Relationship, PanelState, RelationshipDirection, GraphView, ColorScheme } from '../types';
import { generateUUID } from '../utils';

interface UseSelectionProps {
    elements: Element[];
    setElements: React.Dispatch<React.SetStateAction<Element[]>>;
    relationships: Relationship[];
    setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
    activeView: GraphView | undefined;
    colorSchemes: ColorScheme[];
    activeSchemeId: string | null;
    defaultTags: string[];
    
    // Interaction Flags/Handlers from other hooks
    isBulkEditActive: boolean;
    bulkTagsToAdd: string[];
    bulkTagsToRemove: string[];
    isSimulationMode: boolean;
    runImpactSimulation: (id: string) => void;
    isRandomWalkOpen: boolean;
    setWalkState: React.Dispatch<React.SetStateAction<any>>;
    graphCanvasRef: React.RefObject<any>;
    
    // Sunburst specific
    isSunburstPanelOpen: boolean;
    sunburstState: any;
    setSunburstState: React.Dispatch<React.SetStateAction<any>>;
    setOriginalElements: React.Dispatch<React.SetStateAction<Element[] | null>>;
    originalElements: Element[] | null;
    setIsPhysicsModeActive: React.Dispatch<React.SetStateAction<boolean>>;
    
    // Highlight Tool
    isHighlightToolActive: boolean;
    handleToggleNodeHighlight: (id: string) => void;
}

export const useSelection = ({
    elements, setElements,
    relationships, setRelationships,
    activeView,
    colorSchemes, activeSchemeId, defaultTags,
    isBulkEditActive, bulkTagsToAdd, bulkTagsToRemove,
    isSimulationMode, runImpactSimulation,
    isRandomWalkOpen, setWalkState,
    graphCanvasRef,
    isSunburstPanelOpen, sunburstState, setSunburstState, setOriginalElements, originalElements, setIsPhysicsModeActive,
    isHighlightToolActive, handleToggleNodeHighlight
}: UseSelectionProps) => {

    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [multiSelection, setMultiSelection] = useState<Set<string>>(new Set());
    const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
    const [panelStateUI, setPanelStateUI] = useState<PanelState>({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
    const [focusMode, setFocusMode] = useState<'narrow' | 'wide' | 'zoom'>('narrow');

    // --- Derived ---
    const selectedElement = useMemo(() => elements.find(f => f.id === selectedElementId), [elements, selectedElementId]);
    const selectedRelationship = useMemo(() => relationships.find(r => r.id === selectedRelationshipId), [relationships, selectedRelationshipId]);
    const addRelationshipSourceElement = useMemo(() => elements.find(f => f.id === panelStateUI.sourceElementId), [elements, panelStateUI.sourceElementId]);

    // --- Actions ---

    const handleNodeClick = useCallback((elementId: string, event: MouseEvent) => { 
        if (isHighlightToolActive) {
            handleToggleNodeHighlight(elementId);
            return;
        }

        if (isRandomWalkOpen) {
            setWalkState((prev: any) => ({
                ...prev,
                currentNodeId: elementId,
                pathHistory: [...prev.pathHistory, elementId],
                historyIndex: prev.historyIndex + 1,
                visitedIds: new Set([...prev.visitedIds, elementId]),
                isPaused: false, 
                direction: 'forward',
                speedMultiplier: 1
            }));
            
            const el = elements.find(e => e.id === elementId);
            if (el && graphCanvasRef.current) {
                graphCanvasRef.current.setCamera(-(el.x || 0) + window.innerWidth/2, -(el.y || 0) + window.innerHeight/2, 1.5);
            }
        }

        if (isSimulationMode) { 
            runImpactSimulation(elementId); 
            return; 
        }
        
        if (isSunburstPanelOpen && sunburstState.active) {
            if (!originalElements && !sunburstState.centerId) { setOriginalElements(elements); }
            const cx = window.innerWidth / 2; 
            const cy = window.innerHeight / 2;
            setElements(prev => prev.map(e => { 
                if (e.id === elementId) { return { ...e, x: cx, y: cy, fx: cx, fy: cy, vx: 0, vy: 0 }; } 
                return { ...e, fx: null, fy: null }; 
            }));
            setSunburstState((prev: any) => ({ ...prev, centerId: elementId }));
            setIsPhysicsModeActive(true);
            setSelectedElementId(elementId);
            setMultiSelection(new Set([elementId]));
            setTimeout(() => { if (graphCanvasRef.current) { graphCanvasRef.current.setCamera(0, 0, 1); } }, 50);
            return;
        }
        
        if (isBulkEditActive) { 
            if (bulkTagsToAdd.length === 0 && bulkTagsToRemove.length === 0) return; 
            setElements(prev => prev.map(el => { 
                if (el.id === elementId) { 
                    const currentTags = el.tags; 
                    let newTags = [...currentTags]; 
                    let changed = false; 
                    const lowerToRemove = bulkTagsToRemove.map(t => t.toLowerCase()); 
                    const filteredTags = newTags.filter(t => !lowerToRemove.includes(t.toLowerCase())); 
                    if (filteredTags.length !== newTags.length) { newTags = filteredTags; changed = true; } 
                    const lowerCurrent = newTags.map(t => t.toLowerCase()); 
                    const toAdd = bulkTagsToAdd.filter(t => !lowerCurrent.includes(t.toLowerCase())); 
                    if (toAdd.length > 0) { newTags = [...newTags, ...toAdd]; changed = true; } 
                    if (changed) { return { ...el, tags: newTags, updatedAt: new Date().toISOString() }; } 
                } 
                return el; 
            })); 
            return; 
        } 

        if (event.ctrlKey || event.metaKey) { 
            const newMulti = new Set(multiSelection); 
            if (newMulti.has(elementId)) { newMulti.delete(elementId); } 
            else { newMulti.add(elementId); } 
            setMultiSelection(newMulti); 
            if (newMulti.has(elementId)) { setSelectedElementId(elementId); } 
            else if (selectedElementId === elementId) { setSelectedElementId(newMulti.size > 0 ? Array.from(newMulti).pop() || null : null); } 
        } else { 
            setMultiSelection(new Set([elementId])); 
            setSelectedElementId(elementId); 
        }
        setSelectedRelationshipId(null); 
        setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); 
    }, [
        isHighlightToolActive, handleToggleNodeHighlight, isRandomWalkOpen, setWalkState, elements, graphCanvasRef, 
        isSimulationMode, runImpactSimulation, isSunburstPanelOpen, sunburstState, originalElements, setOriginalElements, 
        setElements, setSunburstState, setIsPhysicsModeActive, isBulkEditActive, bulkTagsToAdd, bulkTagsToRemove, 
        multiSelection, selectedElementId
    ]);

    const handleLinkClick = useCallback((relationshipId: string) => { 
        setSelectedRelationshipId(relationshipId); 
        setSelectedElementId(null); 
        setMultiSelection(new Set()); 
        setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); 
    }, []);

    const handleCanvasClick = useCallback(() => { 
        setSelectedElementId(null); 
        setMultiSelection(new Set()); 
        setSelectedRelationshipId(null); 
        setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); 
    }, []);

    const handleNodeConnect = useCallback((sourceId: string, targetId: string) => { 
        const currentScheme = colorSchemes.find(s => s.id === activeSchemeId); 
        let defaultLabel = ''; 
        if (currentScheme && currentScheme.defaultRelationshipLabel) { defaultLabel = currentScheme.defaultRelationshipLabel; } 
        const newRelId = generateUUID(); 
        const newRel: Relationship = { id: newRelId, source: sourceId, target: targetId, label: defaultLabel, direction: RelationshipDirection.To, tags: [] }; 
        setRelationships(prev => [...prev, newRel]); 
        setSelectedRelationshipId(newRelId); 
        setSelectedElementId(null); 
        setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); 
    }, [activeSchemeId, colorSchemes, setRelationships]);
  
    const handleNodeConnectToNew = useCallback((sourceId: string, coords: { x: number; y: number }) => { 
        const now = new Date().toISOString(); 
        
        // Determine initial tags based on Active View
        let initialTags = [...defaultTags];
        if (activeView) {
            const { included, excluded } = activeView.filters.tags;
            const tagsToAdd = included.filter(t => !initialTags.includes(t));
            initialTags = [...initialTags, ...tagsToAdd];
            if (excluded.length > 0) {
                const excludedSet = new Set(excluded);
                initialTags = initialTags.filter(t => !excludedSet.has(t));
            }
        }

        const newElement: Element = { 
            id: generateUUID(), 
            name: 'New Element', 
            notes: '', 
            tags: initialTags, 
            createdAt: now, 
            updatedAt: now, 
            x: coords.x, 
            y: coords.y, 
            fx: coords.x, 
            fy: coords.y, 
        }; 
        setElements(prev => [...prev, newElement]); 
        
        const currentScheme = colorSchemes.find(s => s.id === activeSchemeId); 
        const defaultLabel = currentScheme?.defaultRelationshipLabel || ''; 
        
        const newRel: Relationship = {
            id: generateUUID(),
            source: sourceId,
            target: newElement.id,
            label: defaultLabel,
            direction: RelationshipDirection.To,
            tags: []
        };
        setRelationships(prev => [...prev, newRel]);
        
        setPanelStateUI({ view: 'addRelationship', sourceElementId: sourceId, targetElementId: newElement.id, isNewTarget: true }); 
        setSelectedElementId(null); 
        setSelectedRelationshipId(null); 
    }, [defaultTags, activeView, colorSchemes, activeSchemeId, setElements, setRelationships]);

    const handleCompleteAddRelationship = useCallback(() => {
        if (panelStateUI.targetElementId) {
            setSelectedElementId(panelStateUI.targetElementId);
        } else {
            setSelectedElementId(panelStateUI.sourceElementId || null);
        }
        setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
    }, [panelStateUI]);

    const handleCancelAddRelationship = useCallback(() => { 
        // If we created a temporary target node and cancel, we should delete it
        if (panelStateUI.isNewTarget && panelStateUI.targetElementId) { 
             setElements(prev => prev.filter(e => e.id !== panelStateUI.targetElementId));
             setRelationships(prev => prev.filter(r => r.target !== panelStateUI.targetElementId));
        } 
        setSelectedElementId(panelStateUI.sourceElementId || null); 
        setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); 
    }, [panelStateUI, setElements, setRelationships]);

    const handleToggleFocusMode = useCallback(() => { 
        setFocusMode(prev => { 
            if (prev === 'narrow') return 'wide'; 
            if (prev === 'wide') return 'zoom'; 
            return 'narrow'; 
        }); 
    }, []);

    const handleFocusSingle = useCallback((elementId: string) => {
        // Trigger select logic without the event
        const mockEvent = new MouseEvent('click');
        handleNodeClick(elementId, mockEvent);
        
        const element = elements.find(e => e.id === elementId);
        if (element && element.x !== undefined && element.y !== undefined && graphCanvasRef.current) {
            graphCanvasRef.current.setCamera(-element.x + window.innerWidth/2, -element.y + window.innerHeight/2, 1.5);
        }
    }, [elements, handleNodeClick, graphCanvasRef]);

    return {
        selectedElementId, setSelectedElementId,
        multiSelection, setMultiSelection,
        selectedRelationshipId, setSelectedRelationshipId,
        panelStateUI, setPanelStateUI,
        focusMode, setFocusMode,
        
        selectedElement,
        selectedRelationship,
        addRelationshipSourceElement,
        
        handleNodeClick,
        handleLinkClick,
        handleCanvasClick,
        handleNodeConnect,
        handleNodeConnectToNew,
        handleCompleteAddRelationship,
        handleCancelAddRelationship,
        handleToggleFocusMode,
        handleFocusSingle
    };
};